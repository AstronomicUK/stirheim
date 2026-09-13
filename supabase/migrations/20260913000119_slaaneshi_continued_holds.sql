-- Further unsaved wounds against the same held model continue one hold.
-- Keep every supporting attack so correcting one does not erase the others.
do $patch$ declare original text; updated text; begin
 original:=pg_get_functiondef('public.record_slaaneshi_hold()'::regprocedure);
 updated:=replace(original,$old$  insert into public.slaaneshi_holds(match_id,source_event_id$old$,$new$  select * into held from public.slaaneshi_holds where match_id=new.match_id and wielder_id=h.id and target_id=new.payload->>'target_id' and target_model_index=ordinal::integer and released_at is null for update;
  if held.id is not null then
   update public.slaaneshi_holds set source_event_id=new.id,confirmed_end_at=null,
    history=history||jsonb_build_array(jsonb_build_object('event','continuedHold','sourceEventId',new.id,'previousSourceEventId',held.source_event_id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
   return new;
  end if;
  insert into public.slaaneshi_holds(match_id,source_event_id$new$);
 if updated=original then raise exception 'Expected hold insertion boundary is missing.'; end if;
 execute updated;
end $patch$;

create or replace function public.correct_slaaneshi_hold_event() returns trigger
language plpgsql security definer set search_path='' as $$
declare held public.slaaneshi_holds%rowtype; supported uuid; source_change boolean;
begin
 if new.reverted_at is not distinct from old.reverted_at then return new; end if;
 perform id from public.matches where id=new.match_id for update;
 for held in select * from public.slaaneshi_holds h where h.source_event_id=new.id or h.released_by_event_id=new.id or exists(select 1 from jsonb_array_elements(h.history) x where x->>'sourceEventId'=new.id::text or x->>'previousSourceEventId'=new.id::text) for update loop
  if exists(select 1 from public.match_reports where match_id=held.match_id and warband_id=held.target_warband_id and undo is not null) then raise exception 'Reverse the dependent report before correcting this Man-Catcher event.'; end if;
  source_change:=new.payload ? 'slaaneshi_lock';
  if not source_change and held.released_by_event_id is distinct from new.id then continue; end if;
  select e.id into supported from public.battle_events e where e.reverted_at is null and e.id in (
   select held.source_event_id union select (x->>'sourceEventId')::uuid from jsonb_array_elements(held.history) x where x->>'event'='continuedHold'
   union select (x->>'previousSourceEventId')::uuid from jsonb_array_elements(held.history) x where x->>'event'='continuedHold'
  ) order by e.at desc,e.id desc limit 1;
  if source_change then
   if supported is not null then
    update public.slaaneshi_holds set source_event_id=supported,confirmed_end_at=null,
     released_at=case when release_reason='sourceReverted' then null else released_at end,
     release_reason=case when release_reason='sourceReverted' then null else release_reason end,
     history=history||jsonb_build_array(jsonb_build_object('event','supportingAttackCorrected','sourceEventId',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
   elsif held.released_at is null then
    update public.slaaneshi_holds set released_at=clock_timestamp(),release_reason='sourceReverted',confirmed_end_at=null,
     history=history||jsonb_build_array(jsonb_build_object('event','sourceReverted','sourceEventId',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
   end if;
  elsif new.reverted_at is not null and supported is not null then
   update public.slaaneshi_holds set source_event_id=supported,released_at=null,release_reason=null,confirmed_end_at=null,
    history=history||jsonb_build_array(jsonb_build_object('event','releaseEventReverted','sourceEventId',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
  elsif new.reverted_at is null and held.released_at is null then
   update public.slaaneshi_holds set released_at=clock_timestamp(),release_reason=case when held.wielder_id::text=new.payload->>'target_id' then 'wielderOutOfAction' else 'targetOutOfAction' end,confirmed_end_at=null,
    history=history||jsonb_build_array(jsonb_build_object('event','releaseEventRestored','sourceEventId',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
  end if;
 end loop;
 return new;
end $$;
