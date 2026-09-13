-- A concurrent key handover and combat correction must see one another's result.
create or replace function public.guard_engine_rescue_combat_source() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.reverted_at is not null and old.reverted_at is null then
  perform id from public.matches where id=new.match_id for update;
  if exists(select 1 from public.engine_rescue_battles r cross join lateral jsonb_array_elements(r.history) h where r.match_id=new.match_id and h->'action'->>'sourceEventId'=new.id::text and not h ? 'revertedAt') then
   raise exception 'Correct the linked prison-key event before reversing this casualty.';
  end if;
 end if;
 return new;
end $$;

-- Acquire the shared match lock before the event update/other report guards,
-- then refresh the event so two concurrent reversals do not both succeed.
do $patch$ declare original text; updated text; begin
 original:=pg_get_functiondef('public.revert_battle_event(uuid,text)'::regprocedure);
 updated:=replace(original,$old$  if v_event.reverted_at is not null then$old$,$new$  perform id from public.matches where id=v_event.match_id for update;
  select * into v_event from public.battle_events where id=p_event_id;
  if v_event.id is null then raise exception 'event not found' using errcode='P0002'; end if;
  if v_event.reverted_at is not null then$new$);
 if updated=original then raise exception 'Combat correction lock boundary changed.'; end if;
 execute updated;
end $patch$;
