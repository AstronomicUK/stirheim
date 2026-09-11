-- One exploration book teaches one Hero instead of being sold; serialize competing readers.
create function public.study_exploration_book(p_warband_id uuid, p_hero_id uuid, p_book_id text)
returns void language plpgsql security definer set search_path='' as $$
declare
 h public.heroes%rowtype; book public.items%rowtype; flag_name text; table_name text; book_name text; benefit text; reason text;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'You cannot edit this warband' using errcode='42501'; end if;
 perform 1 from public.warbands where id=p_warband_id for update;
 if p_book_id='alchemists_notebook' then
  flag_name:='studiedAlchemistNotebook'; table_name:='academic'; book_name:='Alchemist’s Notebook'; benefit:='May choose Academic skills on future skill advances.';
 elsif p_book_id='training_manual' then
  flag_name:='studiedTrainingManual'; table_name:='combat'; book_name:='Training Manual'; benefit:='May choose Combat skills on future skill advances; maximum Weapon Skill increases by 1.';
 else raise exception 'Choose an exploration notebook or training manual'; end if;
 select * into h from public.heroes where id=p_hero_id and warband_id=p_warband_id and not is_hired_sword and status='active' for update;
 if h.id is null then raise exception 'Choose a living Hero to study the book'; end if;
 -- A retry cannot consume another copy or grant another bonus.
 if coalesce((h.flags->>flag_name)::boolean,false) then return; end if;
 select i.* into book from public.items i where i.warband_id=p_warband_id and i.item_rules_id=p_book_id and i.quantity>0
  and (i.holder_type='stash' or (i.holder_type='hero' and exists(select 1 from public.heroes holder where holder.id=i.holder_id and holder.warband_id=p_warband_id and holder.status='active' and not holder.is_hired_sword)))
  order by i.created_at,i.id limit 1 for update of i;
 if book.id is null then raise exception 'There is no unused copy available to study'; end if;
 reason:=h.name||' studied '||book_name||' instead of selling it. '||benefit;
 perform set_config('stirheim.audit_reason',reason,true);
 if book.quantity=1 then delete from public.items where id=book.id;
 else update public.items set quantity=quantity-1 where id=book.id; end if;
 update public.heroes set flags=coalesce(flags,'{}'::jsonb)||jsonb_build_object(flag_name,true),
  skill_tables=case when table_name=any(skill_tables) then skill_tables else array_append(skill_tables,table_name) end,
  notes=concat_ws(E'\n',nullif(notes,''),'Studied '||book_name||'. '||benefit)
 where id=h.id;
end $$;
revoke all on function public.study_exploration_book(uuid,uuid,text) from public;
grant execute on function public.study_exploration_book(uuid,uuid,text) to authenticated;
