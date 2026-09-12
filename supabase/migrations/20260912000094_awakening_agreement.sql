-- Tom: when several warbands can use Awakening, record the recipient agreed by the players.
alter table public.awakening_offers
 add column allocation_required boolean not null default false,
 add column agreed_recipient_warband_id uuid references public.warbands(id),
 add column allocation_by uuid references auth.users(id),
 add column allocation_at timestamptz,
 add column allocation_reason text not null default '';

create function public.mark_awakening_allocation_required() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (select count(*) from public.awakening_offers where report_id=new.report_id and report_revision=new.report_revision and hero_id=new.hero_id)>1 then
  update public.awakening_offers set allocation_required=true where report_id=new.report_id and report_revision=new.report_revision and hero_id=new.hero_id;
 end if;
 return new;
end $$;
revoke all on function public.mark_awakening_allocation_required() from public;
create trigger mark_awakening_allocation_required after insert on public.awakening_offers for each row execute function public.mark_awakening_allocation_required();
update public.awakening_offers o set allocation_required=true where (select count(*) from public.awakening_offers x where x.report_id=o.report_id and x.report_revision=o.report_revision and x.hero_id=o.hero_id)>1;

create function public.agree_awakening_recipient(p_offer_id uuid,p_reason text default '') returns void language plpgsql security definer set search_path='' as $$
declare o public.awakening_offers%rowtype; w record; recipient_name text; note text;
begin
 if auth.uid() is null then raise exception 'Sign in first.' using errcode='42501'; end if;
 select * into o from public.awakening_offers where id=p_offer_id;
 if not found then raise exception 'Awakening opportunity not found.'; end if;
 perform id from public.match_reports where match_id=o.match_id order by id for update;
 perform id from public.awakening_offers where report_id=o.report_id and report_revision=o.report_revision and hero_id=o.hero_id order by id for update;
 select * into o from public.awakening_offers where id=p_offer_id;
 if not public.can_edit_warband(o.from_warband_id) then raise exception 'The fallen Hero’s player or campaign GM must record the agreed recipient.' using errcode='42501'; end if;
 if o.state<>'offered' then raise exception 'Choose an open Awakening opportunity.'; end if;
 if not exists(select 1 from public.match_reports where id=o.report_id and revision=o.report_revision and undo is not null) then raise exception 'The source report has changed. Review it first.'; end if;
 if exists(select 1 from public.awakening_offers where report_id=o.report_id and report_revision=o.report_revision and hero_id=o.hero_id and state='accepted') then raise exception 'Reverse the accepted Awakening before changing the agreed recipient.'; end if;
 if not exists(select 1 from public.heroes where warband_id=o.to_warband_id and status='active' and 'spell_of_awakening'=any(spells)) then raise exception 'This warband no longer has a surviving spellcaster with Spell of Awakening.'; end if;
 if o.agreed_recipient_warband_id=o.to_warband_id then return; end if;
 select name into recipient_name from public.warbands where id=o.to_warband_id;
 note:=o.hero_name||': the players agreed that '||recipient_name||' may use Spell of Awakening.'||case when btrim(p_reason)<>'' then ' '||btrim(p_reason) else '' end;
 update public.awakening_offers set agreed_recipient_warband_id=o.to_warband_id,allocation_by=auth.uid(),allocation_at=now(),allocation_reason=note
  where report_id=o.report_id and report_revision=o.report_revision and hero_id=o.hero_id;
 update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),note) where id=o.report_id;
 for w in select distinct wb.id,wb.owner_id from public.warbands wb where wb.id=o.from_warband_id or wb.id in(select x.to_warband_id from public.awakening_offers x where x.report_id=o.report_id and x.report_revision=o.report_revision and x.hero_id=o.hero_id) loop
  insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) values(w.owner_id,'awakening','Awakening recipient agreed',note,'/warbands/'||w.id,'awakening-agreement:'||o.id||':'||w.id||':'||gen_random_uuid());
 end loop;
end $$;
revoke all on function public.agree_awakening_recipient(uuid,text) from public;
grant execute on function public.agree_awakening_recipient(uuid,text) to authenticated;

create or replace function public.resolve_awakening(p_offer_id uuid,p_action text,p_reason text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare o public.awakening_offers%rowtype; t public.awakening_templates%rowtype; g uuid; item jsonb; item_ids uuid[]:='{}'; inserted uuid; r uuid; model_count integer; current_group jsonb; current_items jsonb; source_name text; target_name text; retained jsonb:='[]'; source_row jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in first.' using errcode='42501'; end if;
 -- Serialize accept/reverse with report application/withdrawal by locking both report rows first.
 select * into o from public.awakening_offers where id=p_offer_id;
 if not found then raise exception 'Awakening opportunity not found.'; end if;
 perform id from public.match_reports where match_id=o.match_id order by id for update;
 perform id from public.warbands where id in(o.from_warband_id,o.to_warband_id) order by id for update;
 select * into o from public.awakening_offers where id=p_offer_id for update;
 if not public.can_edit_warband(o.to_warband_id) then raise exception 'Only the receiving player or campaign GM can resolve this opportunity.' using errcode='42501'; end if;
 if p_action not in ('accept','decline','reverse') then raise exception 'Choose an Awakening action.'; end if;
 if p_action='reverse' then
  if o.state<>'accepted' then raise exception 'This Awakening has not been accepted.'; end if;
  if char_length(btrim(p_reason))<5 then raise exception 'Explain why the Awakening is being reversed.'; end if;
  select to_jsonb(h)-'updated_at' into current_group from public.henchman_groups h where id=o.raised_group_id for update;
  select coalesce(jsonb_agg(to_jsonb(i)-'updated_at' order by i.id),'[]') into current_items from public.items i where holder_type='group' and holder_id=o.raised_group_id;
  if current_group is not null and (current_group is distinct from o.raised_snapshot->'group' or current_items is distinct from o.raised_snapshot->'items') then raise exception 'The raised warrior or its equipment has changed. The campaign GM must remove the raised warrior and its equipment before releasing this report dependency.'; end if;
  if current_group is null and jsonb_array_length(current_items)>0 then raise exception 'Remove the raised warrior’s remaining equipment before reversing.'; end if;
  perform set_config('stirheim.audit_reason','Awakening reversed: '||btrim(p_reason),true);
  delete from public.items where holder_type='group' and holder_id=o.raised_group_id;
  delete from public.henchman_groups where id=o.raised_group_id;
  for item in select x from jsonb_array_elements(coalesce(o.raised_snapshot->'retained_source_items','[]')) x loop
   if exists(select 1 from public.items where id=(item->>'id')::uuid) then raise exception 'Original equipment has been restored separately. Ask the GM to reconcile it before reversing.'; end if;
   insert into public.items select (jsonb_populate_record(null::public.items,item)).*;
  end loop;
  update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),o.hero_name||': Awakening reversed — '||btrim(p_reason)) where id in(o.report_id,o.recipient_report_id);
  update public.awakening_offers set state='reversed',resolved_at=now(),resolved_by=auth.uid(),reason=btrim(p_reason) where id=o.id;
  insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) select owner_id,'awakening',left(o.hero_name||': Awakening reversed',140),left(btrim(p_reason),2000),'/warbands/'||o.from_warband_id,'awakening:'||o.id||':reversed' from public.warbands where id=o.from_warband_id on conflict do nothing;
  return null;
 end if;
 if o.state<>'offered' then raise exception 'This opportunity has already been resolved or withdrawn.'; end if;
 if p_action='decline' then
  update public.awakening_offers set state='declined',resolved_at=now(),resolved_by=auth.uid(),reason=btrim(p_reason) where id=o.id;
  update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),o.hero_name||': the opposing warband declined Spell of Awakening. '||btrim(p_reason)) where id=o.report_id;
  insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) select owner_id,'awakening',left(o.hero_name||': Awakening declined',140),'The opposing player declined to raise this Hero.','/warbands/'||o.from_warband_id,'awakening:'||o.id||':declined' from public.warbands where id=o.from_warband_id on conflict do nothing;
  return null;
 end if;
 if not exists(select 1 from public.match_reports where id=o.report_id and revision=o.report_revision and undo is not null) then raise exception 'The source report has changed. Review the latest report.'; end if;
 select id into r from public.match_reports where match_id=o.match_id and warband_id=o.to_warband_id and undo is not null;
 if r is null then raise exception 'File your own post-battle report first, so the surviving spellcaster is confirmed.'; end if;
 if not exists(select 1 from public.heroes where warband_id=o.to_warband_id and status='active' and 'spell_of_awakening'=any(spells)) then raise exception 'There is no surviving spellcaster with Spell of Awakening in this warband.'; end if;
 if not exists(select 1 from public.heroes where id=o.hero_id and warband_id=o.from_warband_id and status='dead') then raise exception 'The enemy Hero is no longer recorded as dead.'; end if;
 if exists(select 1 from public.awakening_offers where report_id=o.report_id and hero_id=o.hero_id and state='accepted') then raise exception 'This Hero has already been raised.'; end if;
 if o.allocation_required and o.agreed_recipient_warband_id is distinct from o.to_warband_id then raise exception 'The fallen Hero’s player or GM must record this warband as the agreed Awakening recipient first.'; end if;
 select template.* into t from public.awakening_templates template join public.warbands w on w.type_rules_id=template.warband_rules_id where w.id=o.to_warband_id;
 if not found then raise exception 'This warband has no supported Zombie entry.'; end if;
 select (select count(*) from public.heroes where warband_id=o.to_warband_id and status in('active','captured') and not is_hired_sword)+coalesce((select sum(size) from public.henchman_groups where warband_id=o.to_warband_id),0) into model_count;
 if model_count>=t.base_limit and char_length(btrim(p_reason))<5 then raise exception 'The warband is at its printed model limit. Dismiss a warrior first, or record the rule/house-rule reason allowing a larger warband.'; end if;
 if exists(select 1 from jsonb_array_elements(o.snapshot->'items') x where x->>'item_rules_id' is null) and char_length(btrim(p_reason))<5 then raise exception 'This Hero had custom equipment. Record how it was treated at the table before raising the Hero; only recognised weapons and armour transfer automatically.'; end if;
 perform set_config('stirheim.audit_reason','Spell of Awakening: '||o.hero_name||' raised as a Zombie.',true);
 insert into public.henchman_groups(warband_id,unit_type_rules_id,name,size,stats,xp,level_ups,notes)
 values(o.to_warband_id,t.zombie_rules_id,o.hero_name||' (Zombie)',1,o.snapshot->'stats',0,0,'Raised by Spell of Awakening. Retains characteristics, weapons and armour; no skills, miscellaneous equipment use, running or experience. '||btrim(p_reason)) returning id into g;
 for item in select x from jsonb_array_elements(o.snapshot->'items') x join public.awakening_catalogue c on c.item_rules_id=x->>'item_rules_id' loop
  -- Usually removed by the death report; also remove any surviving source row so no item duplicates.
  select to_jsonb(i) into source_row from public.items i where id=(item->>'id')::uuid for update;
  if source_row is not null then
   if source_row-'updated_at' is distinct from item-'updated_at' then raise exception 'The original equipment has changed since the death report. Correct that report before raising the Hero.'; end if;
   retained:=retained||jsonb_build_array(source_row);
   delete from public.items where id=(item->>'id')::uuid and warband_id=o.from_warband_id and holder_id=o.hero_id;
  end if;
  insert into public.items(warband_id,holder_type,holder_id,item_rules_id,custom_name,quantity,notes)
    values(o.to_warband_id,'group',g,item->>'item_rules_id',item->>'custom_name',(item->>'quantity')::integer,coalesce(item->>'notes','')) returning id into inserted;
  item_ids:=array_append(item_ids,inserted);
 end loop;
 select to_jsonb(h)-'updated_at' into current_group from public.henchman_groups h where id=g;
 select coalesce(jsonb_agg(to_jsonb(i)-'updated_at' order by i.id),'[]') into current_items from public.items i where id=any(item_ids);
 update public.awakening_offers set state='accepted',resolved_at=now(),resolved_by=auth.uid(),reason=btrim(p_reason),raised_group_id=g,raised_snapshot=jsonb_build_object('group',current_group,'items',current_items,'retained_source_items',retained),recipient_report_id=r where id=o.id;
 select name into source_name from public.warbands where id=o.from_warband_id; select name into target_name from public.warbands where id=o.to_warband_id;
 update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),o.hero_name||' of '||source_name||' was raised as a Zombie by '||target_name||'. '||btrim(p_reason)) where id in(o.report_id,r);
 insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) select owner_id,'awakening',left(o.hero_name||' was raised as a Zombie',140),target_name||' has resolved Spell of Awakening. The result is recorded in both battle reports.','/warbands/'||o.from_warband_id,'awakening:'||o.id||':accepted' from public.warbands where id=o.from_warband_id on conflict do nothing;
 return g;
end $$;
revoke all on function public.resolve_awakening(uuid,text,text) from public;
grant execute on function public.resolve_awakening(uuid,text,text) to authenticated;

