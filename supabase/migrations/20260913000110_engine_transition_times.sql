-- now() is the transaction START time. A start_match request may wait on a match lock
-- while an Engine departs, then correctly start after departure. Its old timestamp could
-- nevertheless precede departure, so that actually missed battle never enabled the return.
-- Stamp these two transitions at the point of change, after their roster locks are held.
do $$
declare original text; updated text;
begin
  select pg_get_functiondef('public.start_match(uuid,public.combat_mode,uuid[],uuid[])'::regprocedure) into original;
  updated := replace(original, 'started_at = now()', 'started_at = clock_timestamp()');
  if original = updated then raise exception 'Battle start timestamp anchor was not found.'; end if;
  execute updated;
  select pg_get_functiondef('public.engine_journey_settle(uuid)'::regprocedure) into original;
  updated := replace(original, 'departed_at = now()', 'departed_at = clock_timestamp()');
  if original = updated then raise exception 'Engine departure timestamp anchor was not found.'; end if;
  execute updated;
end $$;
