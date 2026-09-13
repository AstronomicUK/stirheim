-- Require an actual reviewed revision, including for direct RPC callers.
do $patch$ declare signature text; original text; updated text; begin
 foreach signature in array array['public.record_engine_rescue_action(uuid,integer,jsonb,text)','public.correct_last_engine_rescue_action(uuid,integer,text)'] loop
  original:=pg_get_functiondef(signature::regprocedure);
  updated:=replace(original,'if r.revision<>p_revision then','if r.revision is distinct from p_revision then');
  if updated=original then raise exception 'Rescue revision boundary changed: %',signature; end if;
  execute updated;
 end loop;
 original:=pg_get_functiondef('public.record_engine_rescue_action(uuid,integer,jsonb,text)'::regprocedure);
 updated:=replace(original,$old$  if gaoler.id is null then raise exception 'Choose a Gaoler from this Engine''s warband.'; end if;$old$,$new$  if gaoler.id is null then raise exception 'Choose a Gaoler from this Engine''s warband.'; end if;
  if p_action->'by'->>'id'=gaoler.id::text then raise exception 'The Gaoler taken out of action cannot take their own keys. Record the actual keeper, or leave them unknown.'; end if;$new$);
 if updated=original then raise exception 'Gaoler key validation boundary changed.'; end if;
 execute updated;
end $patch$;
