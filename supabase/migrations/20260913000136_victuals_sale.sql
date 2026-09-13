-- Keep the existing treasury, sequence and saved Chef checks in the same transaction.
alter function public.record_wyrdstone_sale(uuid,uuid,jsonb,text,integer,integer,integer) rename to record_wyrdstone_sale_before_victuals;
revoke all on function public.record_wyrdstone_sale_before_victuals(uuid,uuid,jsonb,text,integer,integer,integer) from public,anon,authenticated;
create function public.record_wyrdstone_sale(p_warband_id uuid,p_match_id uuid,p_changes jsonb,p_reason text,p_expected_gold integer,p_expected_shards integer,p_chef_revision integer default null,p_victuals integer default 0,p_expected_victuals jsonb default null)
returns integer language plpgsql security definer set search_path='' as $$
declare snapshot jsonb; expected jsonb; before_count integer; available integer; after_count integer; result integer;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'You cannot trade for this warband' using errcode='42501'; end if;
 perform 1 from public.warbands where id=p_warband_id for update;
 if p_victuals is null or p_victuals<0 then raise exception 'Choose a valid number of Victuals'; end if;
 if p_victuals>0 and p_match_id is null then raise exception 'Victuals can only be used after a battle'; end if;
 perform 1 from public.items where warband_id=p_warband_id and item_rules_id='victuals' order by id for update;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'quantity',quantity,'holder_type',holder_type,'holder_id',holder_id) order by id),'[]'::jsonb),coalesce(sum(quantity),0)
 into snapshot,before_count from public.items where warband_id=p_warband_id and item_rules_id='victuals';
 if p_expected_victuals is not null then
  select coalesce(jsonb_agg(value order by value->>'id'),'[]'::jsonb) into expected from jsonb_array_elements(p_expected_victuals);
  if snapshot is distinct from expected then raise exception 'Victuals inventory changed; reload before selling'; end if;
 elsif p_victuals>0 then raise exception 'Reload the Victuals inventory before selling'; end if;
 select coalesce(sum(i.quantity),0) into available from public.items i where i.warband_id=p_warband_id and i.item_rules_id='victuals' and
 (i.holder_type='stash' or (i.holder_type='hero' and exists(select 1 from public.heroes h where h.id=i.holder_id and h.status='active' and not h.is_hired_sword))
 or (i.holder_type='group' and exists(select 1 from public.henchman_groups g where g.id=i.holder_id and g.size>0)));
 if p_victuals>available then raise exception 'Not enough available Victuals'; end if;
 result:=public.record_wyrdstone_sale_before_victuals(p_warband_id,p_match_id,p_changes,p_reason,p_expected_gold,p_expected_shards,p_chef_revision);
 select coalesce(sum(quantity),0) into after_count from public.items where warband_id=p_warband_id and item_rules_id='victuals';
 if before_count-after_count<>p_victuals then raise exception 'The sale must consume exactly the selected Victuals'; end if;
 return result;
end $$;
revoke all on function public.record_wyrdstone_sale(uuid,uuid,jsonb,text,integer,integer,integer,integer,jsonb) from public,anon;
grant execute on function public.record_wyrdstone_sale(uuid,uuid,jsonb,text,integer,integer,integer,integer,jsonb) to authenticated;
