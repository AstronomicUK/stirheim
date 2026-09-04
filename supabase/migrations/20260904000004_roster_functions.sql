-- Stirheim - Campaign Ledger. Phase 4: roster write functions.
--
-- Both functions run as SECURITY INVOKER, so every row they touch is still governed by the RLS
-- policies in migration 2 (the caller must own the warband, or be the GM of its campaign). They
-- exist so that multi-row writes happen in one transaction and can be labelled for the audit
-- log, which a client speaking PostgREST cannot do row by row.

-- ---------------------------------------------------------------------------------------------
-- create_warband(payload): warband + heroes + henchman groups + items in one transaction.
--
-- payload = {
--   name, type_rules_id, gold, notes,
--   heroes:          [{ name, unit_type_rules_id, stats, xp, level_ups, skill_tables, is_large, sort_order,
--                       equipment: [{ item_rules_id, custom_name, quantity }] }],
--   henchman_groups: [{ name, unit_type_rules_id, size, stats, xp, level_ups, is_large, sort_order,
--                       equipment: [...] }],
--   stash:           [{ item_rules_id, custom_name, quantity }]
-- }
-- Returns the new warband id.
-- ---------------------------------------------------------------------------------------------

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
    insert into public.heroes (warband_id, name, unit_type_rules_id, stats, xp, level_ups, skill_tables, is_large, sort_order)
    values (
      v_warband_id,
      v_hero ->> 'name',
      v_hero ->> 'unit_type_rules_id',
      v_hero -> 'stats',
      coalesce((v_hero ->> 'xp')::int, 0),
      coalesce((v_hero ->> 'level_ups')::int, 0),
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_hero -> 'skill_tables', '[]'::jsonb)) as x), '{}'),
      coalesce((v_hero ->> 'is_large')::boolean, false),
      coalesce((v_hero ->> 'sort_order')::int, 0)
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

-- ---------------------------------------------------------------------------------------------
-- update_roster(warband_id, reason, changes): apply a batch of row changes atomically.
--
-- changes = [{ table: 'warbands' | 'heroes' | 'henchman_groups' | 'items',
--              op: 'insert' | 'update' | 'delete', id?, data? }]
-- Only whitelisted columns are writable; ids/owner/warband_id/timestamps never are. Every
-- row is checked to belong to warband_id, and RLS still decides whether the caller may edit
-- that warband. `reason` is written to audit_log.reason (e.g. 'manual_edit', 'trading',
-- 'post_battle'). Returns the number of changes applied.
-- ---------------------------------------------------------------------------------------------

create or replace function public.update_roster(p_warband_id uuid, p_reason text, p_changes jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  c jsonb;
  v_table text;
  v_op text;
  v_id uuid;
  v_data jsonb;
  v_count int := 0;
  v_rows int;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if jsonb_typeof(p_changes) <> 'array' then
    raise exception 'changes must be an array' using errcode = '22023';
  end if;
  -- Under RLS an unreadable warband simply does not exist for this caller.
  if not exists (select 1 from public.warbands w where w.id = p_warband_id) then
    raise exception 'warband % not found', p_warband_id using errcode = 'P0002';
  end if;

  perform set_config('stirheim.audit_reason', coalesce(nullif(trim(p_reason), ''), 'update_roster'), true);

  for c in select * from jsonb_array_elements(p_changes) loop
    v_table := c ->> 'table';
    v_op := c ->> 'op';
    v_id := (c ->> 'id')::uuid;
    v_data := coalesce(c -> 'data', '{}'::jsonb);
    v_rows := 0;

    if v_table = 'warbands' then
      if v_op <> 'update' then
        raise exception 'warbands: only update is allowed here' using errcode = '22023';
      end if;
      update public.warbands set
        name = coalesce(v_data ->> 'name', name),
        gold = coalesce((v_data ->> 'gold')::int, gold),
        wyrdstone = coalesce((v_data ->> 'wyrdstone')::int, wyrdstone),
        veteran_pool = case when v_data ? 'veteran_pool' then (v_data ->> 'veteran_pool')::int else veteran_pool end,
        notes = coalesce(v_data ->> 'notes', notes),
        archived = coalesce((v_data ->> 'archived')::boolean, archived)
      where id = p_warband_id;
      get diagnostics v_rows = row_count;

    elsif v_table = 'heroes' then
      if v_op = 'insert' then
        insert into public.heroes (warband_id, name, is_hired_sword, unit_type_rules_id, hired_sword_rules_id, stats, xp,
                                   level_ups, skill_tables, skills, spells, injuries, flags, equipment_locked, is_large,
                                   status, notes, sort_order)
        values (p_warband_id, v_data ->> 'name', coalesce((v_data ->> 'is_hired_sword')::boolean, false),
                v_data ->> 'unit_type_rules_id', v_data ->> 'hired_sword_rules_id', v_data -> 'stats',
                coalesce((v_data ->> 'xp')::int, 0), coalesce((v_data ->> 'level_ups')::int, 0),
                coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_data -> 'skill_tables', '[]'::jsonb)) x), '{}'),
                coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_data -> 'skills', '[]'::jsonb)) x), '{}'),
                coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_data -> 'spells', '[]'::jsonb)) x), '{}'),
                coalesce(v_data -> 'injuries', '[]'::jsonb), coalesce(v_data -> 'flags', '{}'::jsonb),
                coalesce((v_data ->> 'equipment_locked')::boolean, false), coalesce((v_data ->> 'is_large')::boolean, false),
                coalesce((v_data ->> 'status')::public.warrior_status, 'active'), coalesce(v_data ->> 'notes', ''),
                coalesce((v_data ->> 'sort_order')::int, 0));
        get diagnostics v_rows = row_count;
      elsif v_op = 'update' then
        update public.heroes set
          name = coalesce(v_data ->> 'name', name),
          stats = coalesce(v_data -> 'stats', stats),
          xp = coalesce((v_data ->> 'xp')::int, xp),
          level_ups = coalesce((v_data ->> 'level_ups')::int, level_ups),
          skill_tables = case when v_data ? 'skill_tables' then coalesce((select array_agg(x) from jsonb_array_elements_text(v_data -> 'skill_tables') x), '{}') else skill_tables end,
          skills = case when v_data ? 'skills' then coalesce((select array_agg(x) from jsonb_array_elements_text(v_data -> 'skills') x), '{}') else skills end,
          spells = case when v_data ? 'spells' then coalesce((select array_agg(x) from jsonb_array_elements_text(v_data -> 'spells') x), '{}') else spells end,
          injuries = coalesce(v_data -> 'injuries', injuries),
          flags = coalesce(v_data -> 'flags', flags),
          is_large = coalesce((v_data ->> 'is_large')::boolean, is_large),
          status = coalesce((v_data ->> 'status')::public.warrior_status, status),
          notes = coalesce(v_data ->> 'notes', notes),
          sort_order = coalesce((v_data ->> 'sort_order')::int, sort_order)
        where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      elsif v_op = 'delete' then
        delete from public.heroes where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      end if;

    elsif v_table = 'henchman_groups' then
      if v_op = 'insert' then
        insert into public.henchman_groups (warband_id, name, unit_type_rules_id, size, stats, xp, level_ups, stat_increases,
                                            is_large, notes, sort_order)
        values (p_warband_id, v_data ->> 'name', v_data ->> 'unit_type_rules_id', coalesce((v_data ->> 'size')::int, 1),
                v_data -> 'stats', coalesce((v_data ->> 'xp')::int, 0), coalesce((v_data ->> 'level_ups')::int, 0),
                coalesce(v_data -> 'stat_increases', '{}'::jsonb), coalesce((v_data ->> 'is_large')::boolean, false),
                coalesce(v_data ->> 'notes', ''), coalesce((v_data ->> 'sort_order')::int, 0));
        get diagnostics v_rows = row_count;
      elsif v_op = 'update' then
        update public.henchman_groups set
          name = coalesce(v_data ->> 'name', name),
          size = coalesce((v_data ->> 'size')::int, size),
          stats = coalesce(v_data -> 'stats', stats),
          xp = coalesce((v_data ->> 'xp')::int, xp),
          level_ups = coalesce((v_data ->> 'level_ups')::int, level_ups),
          stat_increases = coalesce(v_data -> 'stat_increases', stat_increases),
          is_large = coalesce((v_data ->> 'is_large')::boolean, is_large),
          notes = coalesce(v_data ->> 'notes', notes),
          sort_order = coalesce((v_data ->> 'sort_order')::int, sort_order)
        where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      elsif v_op = 'delete' then
        delete from public.henchman_groups where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      end if;

    elsif v_table = 'items' then
      if v_op = 'insert' then
        insert into public.items (warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity, notes)
        values (p_warband_id, coalesce((v_data ->> 'holder_type')::public.item_holder, 'stash'), (v_data ->> 'holder_id')::uuid,
                v_data ->> 'item_rules_id', v_data ->> 'custom_name', coalesce((v_data ->> 'quantity')::int, 1),
                coalesce(v_data ->> 'notes', ''));
        get diagnostics v_rows = row_count;
      elsif v_op = 'update' then
        update public.items set
          holder_type = coalesce((v_data ->> 'holder_type')::public.item_holder, holder_type),
          holder_id = case when v_data ? 'holder_type' then (v_data ->> 'holder_id')::uuid else holder_id end,
          item_rules_id = case when v_data ? 'item_rules_id' then v_data ->> 'item_rules_id' else item_rules_id end,
          custom_name = case when v_data ? 'custom_name' then v_data ->> 'custom_name' else custom_name end,
          quantity = coalesce((v_data ->> 'quantity')::int, quantity),
          notes = coalesce(v_data ->> 'notes', notes)
        where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      elsif v_op = 'delete' then
        delete from public.items where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      end if;

    else
      raise exception 'unknown table %', v_table using errcode = '22023';
    end if;

    if v_rows = 0 then
      raise exception '% % on % matched no row of this warband', v_op, v_table, coalesce(v_id::text, '(new)') using errcode = 'P0002';
    end if;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.create_warband(jsonb) from public;
revoke all on function public.update_roster(uuid, text, jsonb) from public;
grant execute on function public.create_warband(jsonb) to authenticated;
grant execute on function public.update_roster(uuid, text, jsonb) to authenticated;
