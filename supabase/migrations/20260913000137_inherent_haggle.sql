-- A Master of Finances starts with Haggle, including older roster rows which
-- predate starting-skill grants. Preserve all purchase/retry/phase safeguards.
do $$
declare
 definition text;
 original text := 'if not (''haggle''=any(h.skills)) and not exists';
 replacement text := 'if not (''haggle''=any(h.skills)) and h.unit_type_rules_id is distinct from ''mazzalupo_master_of_finances'' and not exists';
begin
 select pg_get_functiondef('public.record_haggled_trade(uuid,uuid,jsonb,uuid[],text,uuid,integer[],uuid,text,integer)'::regprocedure) into definition;
 if strpos(definition, original) = 0 then
  raise exception 'Haggle eligibility guard changed; review before applying inherent Haggle';
 end if;
 execute replace(definition, original, replacement);
end $$;
