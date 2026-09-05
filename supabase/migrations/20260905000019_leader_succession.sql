-- Phase 15: a hero's unit type may be changed through update_roster, so leader succession can
-- re-template a Champion as the Captain (and the manual editor can correct a wrong type).

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
        insert into public.heroes (id, warband_id, name, is_hired_sword, unit_type_rules_id, hired_sword_rules_id, stats, xp,
                                   level_ups, skill_tables, skills, spells, injuries, flags, equipment_locked, is_large,
                                   status, notes, sort_order)
        values (coalesce(v_id, gen_random_uuid()), p_warband_id, v_data ->> 'name', coalesce((v_data ->> 'is_hired_sword')::boolean, false),
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
          -- Leader succession re-templates a hero as the leader type (Phase 15).
          unit_type_rules_id = coalesce(v_data ->> 'unit_type_rules_id', unit_type_rules_id),
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
        insert into public.henchman_groups (id, warband_id, name, unit_type_rules_id, size, stats, xp, level_ups, stat_increases,
                                            is_large, notes, sort_order, model_names)
        values (coalesce(v_id, gen_random_uuid()), p_warband_id, v_data ->> 'name', v_data ->> 'unit_type_rules_id', coalesce((v_data ->> 'size')::int, 1),
                v_data -> 'stats', coalesce((v_data ->> 'xp')::int, 0), coalesce((v_data ->> 'level_ups')::int, 0),
                coalesce(v_data -> 'stat_increases', '{}'::jsonb), coalesce((v_data ->> 'is_large')::boolean, false),
                coalesce(v_data ->> 'notes', ''), coalesce((v_data ->> 'sort_order')::int, 0),
                coalesce(public.jsonb_text_array(v_data -> 'model_names'), '{}'::text[]));
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
          sort_order = coalesce((v_data ->> 'sort_order')::int, sort_order),
          model_names = coalesce(public.jsonb_text_array(v_data -> 'model_names'), model_names)
        where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      elsif v_op = 'delete' then
        delete from public.henchman_groups where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      end if;

    elsif v_table = 'items' then
      if v_op = 'insert' then
        insert into public.items (id, warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity, notes)
        values (coalesce(v_id, gen_random_uuid()), p_warband_id, coalesce((v_data ->> 'holder_type')::public.item_holder, 'stash'), (v_data ->> 'holder_id')::uuid,
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
