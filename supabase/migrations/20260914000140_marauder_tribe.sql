-- Store tribe on the warband so succession cannot silently change its rules.
alter table public.warbands add column marauder_tribe text;
alter table public.warbands add constraint marauder_tribe_valid check (
  marauder_tribe is null or (type_rules_id = 'marauders_of_chaos' and marauder_tribe in ('norse', 'kurgan', 'hung'))
);

do $migration$
declare definition text; revised text;
begin
  select pg_get_functiondef('public.create_warband(jsonb)'::regprocedure) into definition;
  revised := replace(definition,
    'insert into public.warbands (name, type_rules_id, gold, notes)',
    'insert into public.warbands (name, type_rules_id, gold, notes, marauder_tribe)');
  revised := replace(revised,
    'coalesce(payload ->> ''notes'', '''')' || chr(10) || '  )',
    'coalesce(payload ->> ''notes'', ''''),' || chr(10) || '    payload ->> ''marauder_tribe''' || chr(10) || '  )');
  if revised = definition or position('payload ->> ''marauder_tribe''' in revised) = 0 then
    raise exception 'create_warband tribe patch did not match';
  end if;
  execute revised;
  select pg_get_functiondef('public.update_roster(uuid,text,jsonb)'::regprocedure) into definition;
  revised := replace(definition,
    'notes = coalesce(v_data ->> ''notes'', notes),',
    'marauder_tribe = coalesce(v_data ->> ''marauder_tribe'', marauder_tribe),' || chr(10) || '        notes = coalesce(v_data ->> ''notes'', notes),');
  if revised = definition then raise exception 'update_roster tribe patch did not match'; end if;
  execute revised;
end
$migration$;
notify pgrst, 'reload schema';
