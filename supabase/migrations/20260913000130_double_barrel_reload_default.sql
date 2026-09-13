-- Preserve every existing campaign default while adding the opt-in reload policy.
-- Existing campaign rows stay unchanged and read as 'none' through the client schema.
do $$
declare expression text; settings_default jsonb;
begin
  select pg_get_expr(d.adbin, d.adrelid) into expression
  from pg_attrdef d join pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum
  where d.adrelid='public.campaigns'::regclass and a.attname='settings';
  if expression is null then raise exception 'Campaign settings default is missing'; end if;
  execute 'select ' || expression into settings_default;
  settings_default := jsonb_set(settings_default, '{houseRules}',
    coalesce(settings_default->'houseRules','{}'::jsonb) || '{"doubleBarrelSkillReload":"none"}'::jsonb);
  execute format('alter table public.campaigns alter column settings set default %L::jsonb',settings_default);
end $$;
