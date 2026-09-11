-- Persist initial Dreamer certification in the same transaction as creation.
create or replace function public.create_warband(payload jsonb)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_warband_id uuid;
  v_hero jsonb;
  v_group jsonb;
  v_item jsonb;
  v_holder_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be an object' using errcode = '22023';
  end if;

  perform set_config('stirheim.audit_reason', 'create_warband', true);

  insert into public.warbands (name, type_rules_id, gold, notes)
  values (
    payload ->> 'name',
    payload ->> 'type_rules_id',
    coalesce((payload ->> 'gold')::int, 0),
    coalesce(payload ->> 'notes', '')
  )
  returning id into v_warband_id;

  for v_hero in select * from jsonb_array_elements(coalesce(payload -> 'heroes', '[]'::jsonb)) loop
    insert into public.heroes (warband_id, name, unit_type_rules_id, stats, xp, level_ups, skill_tables, is_large, sort_order, flags)
    values (
      v_warband_id,
      v_hero ->> 'name',
      v_hero ->> 'unit_type_rules_id',
      v_hero -> 'stats',
      coalesce((v_hero ->> 'xp')::int, 0),
      coalesce((v_hero ->> 'level_ups')::int, 0),
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_hero -> 'skill_tables', '[]'::jsonb)) as x), '{}'),
      coalesce((v_hero ->> 'is_large')::boolean, false),
      coalesce((v_hero ->> 'sort_order')::int, 0),
      coalesce(v_hero -> 'flags', '{}'::jsonb)
    )
    returning id into v_holder_id;

    for v_item in select * from jsonb_array_elements(coalesce(v_hero -> 'equipment', '[]'::jsonb)) loop
      insert into public.items (warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity)
      values (v_warband_id, 'hero', v_holder_id, v_item ->> 'item_rules_id', v_item ->> 'custom_name',
              coalesce((v_item ->> 'quantity')::int, 1));
    end loop;
  end loop;

  for v_group in select * from jsonb_array_elements(coalesce(payload -> 'henchman_groups', '[]'::jsonb)) loop
    insert into public.henchman_groups (warband_id, name, unit_type_rules_id, size, stats, xp, level_ups, is_large, sort_order)
    values (
      v_warband_id,
      v_group ->> 'name',
      v_group ->> 'unit_type_rules_id',
      coalesce((v_group ->> 'size')::int, 1),
      v_group -> 'stats',
      coalesce((v_group ->> 'xp')::int, 0),
      coalesce((v_group ->> 'level_ups')::int, 0),
      coalesce((v_group ->> 'is_large')::boolean, false),
      coalesce((v_group ->> 'sort_order')::int, 0)
    )
    returning id into v_holder_id;

    for v_item in select * from jsonb_array_elements(coalesce(v_group -> 'equipment', '[]'::jsonb)) loop
      insert into public.items (warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity)
      values (v_warband_id, 'group', v_holder_id, v_item ->> 'item_rules_id', v_item ->> 'custom_name',
              coalesce((v_item ->> 'quantity')::int, 1));
    end loop;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(payload -> 'stash', '[]'::jsonb)) loop
    insert into public.items (warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity)
    values (v_warband_id, 'stash', null, v_item ->> 'item_rules_id', v_item ->> 'custom_name',
            coalesce((v_item ->> 'quantity')::int, 1));
  end loop;

  return v_warband_id;
end;
$$;
