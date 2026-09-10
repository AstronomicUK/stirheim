-- Petty Thief transfers an existing opponent shard, with atomic compensation on withdrawal.
create or replace function public.apply_battle_report(p_report_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_report public.match_reports%rowtype;
  v_applied jsonb;
  v_row jsonb;
  v_patch jsonb;
  v_wb jsonb;
  v_before jsonb;
  v_undo_heroes jsonb := '[]'::jsonb;
  v_undo_groups jsonb := '[]'::jsonb;
  v_created_groups jsonb := '[]'::jsonb;
  v_undo_items jsonb := '[]'::jsonb;
  v_removed jsonb := '[]'::jsonb;
  v_stash_ids jsonb := '[]'::jsonb;
  v_advance_ids jsonb := '[]'::jsonb;
  v_new_id uuid;
  v_pool_before int;
  v_theft jsonb;
  v_stolen int := 0;
  v_target_name text;
begin
  select * into v_report from public.match_reports where id = p_report_id;
  if v_report.id is null then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
  if v_report.undo is not null then
    raise exception 'this report has already been applied' using errcode = 'P0001';
  end if;
  if not public.can_edit_warband(v_report.warband_id) then
    raise exception 'only the warband owner or the GM can apply a report' using errcode = '42501';
  end if;
  v_applied := coalesce(v_report.applied, '{}'::jsonb);
  v_theft := v_applied -> 'petty_thief';
  if v_theft is not null then
    if (v_theft ->> 'roll')::int not between 5 and 6
      or not exists (select 1 from public.heroes h where h.id=(v_theft ->> 'squire_id')::uuid
        and h.warband_id=v_report.warband_id and h.unit_type_rules_id='mazzalupo_squire' and h.status='active')
      or exists (select 1 from jsonb_array_elements(coalesce(v_report.ooa,'[]'::jsonb)) o where o->>'subjectId'=v_theft->>'squire_id')
      or (v_theft ->> 'target_id')::uuid=v_report.warband_id
      or not exists (select 1 from public.match_participants mp where mp.match_id=v_report.match_id and mp.warband_id=(v_theft ->> 'target_id')::uuid)
    then raise exception 'invalid Petty Thief reward' using errcode='22023'; end if;
    perform 1 from public.warbands w where w.id in (v_report.warband_id,(v_theft->>'target_id')::uuid) order by w.id for update;
    select least(1,wyrdstone),name into v_stolen,v_target_name from public.warbands where id=(v_theft->>'target_id')::uuid;
    update public.warbands set wyrdstone=wyrdstone-v_stolen where id=(v_theft->>'target_id')::uuid;
    v_applied := jsonb_set(v_applied,'{warband,wyrdstone_delta}',to_jsonb(coalesce((v_applied->'warband'->>'wyrdstone_delta')::int,0)+v_stolen));
    v_theft := v_theft || jsonb_build_object('transferred',v_stolen);
    v_applied := jsonb_set(v_applied,'{petty_thief}',v_theft);
  end if;

  -- Heroes and hired swords.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'heroes', '[]'::jsonb)) loop
    v_patch := coalesce(v_row -> 'patch', '{}'::jsonb);
    select jsonb_build_object('id', h.id, 'before', jsonb_build_object('stats', h.stats, 'xp', h.xp, 'level_ups', h.level_ups, 'injuries', h.injuries, 'flags', h.flags, 'status', h.status))
      into v_before from public.heroes h where h.id = (v_row ->> 'id')::uuid and h.warband_id = v_report.warband_id;
    if v_before is null then
      raise exception 'hero % is not in this warband', v_row ->> 'id' using errcode = 'P0002';
    end if;
    v_undo_heroes := v_undo_heroes || v_before;
    update public.heroes set
      stats = coalesce(v_patch -> 'stats', stats),
      xp = coalesce((v_patch ->> 'xp')::int, xp),
      level_ups = coalesce((v_patch ->> 'level_ups')::int, level_ups),
      injuries = coalesce(v_patch -> 'injuries', injuries),
      flags = coalesce(v_patch -> 'flags', flags),
      status = coalesce((v_patch ->> 'status')::public.warrior_status, status)
    where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
  end loop;

  -- Henchman groups.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'groups', '[]'::jsonb)) loop
    v_patch := coalesce(v_row -> 'patch', '{}'::jsonb);
    select jsonb_build_object('id', g.id, 'before', jsonb_build_object('size', g.size, 'xp', g.xp, 'level_ups', g.level_ups))
      into v_before from public.henchman_groups g where g.id = (v_row ->> 'id')::uuid and g.warband_id = v_report.warband_id;
    if v_before is null then
      raise exception 'henchman group % is not in this warband', v_row ->> 'id' using errcode = 'P0002';
    end if;
    v_undo_groups := v_undo_groups || v_before;
    update public.henchman_groups set
      size = coalesce((v_patch ->> 'size')::int, size),
      xp = coalesce((v_patch ->> 'xp')::int, xp),
      level_ups = coalesce((v_patch ->> 'level_ups')::int, level_ups)
    where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
  end loop;

  -- Free location recruits; stable IDs make accidental duplicate application fail atomically.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'new_groups', '[]'::jsonb)) loop
    insert into public.henchman_groups (id, warband_id, name, unit_type_rules_id, size, stats, xp, level_ups)
    values ((v_row ->> 'id')::uuid, v_report.warband_id, v_row ->> 'name', v_row ->> 'unit_type_rules_id',
      (v_row ->> 'size')::int, v_row -> 'stats', (v_row ->> 'xp')::int, (v_row ->> 'level_ups')::int);
    select to_jsonb(g) - 'updated_at' - 'created_at' into v_before
      from public.henchman_groups g where id = (v_row ->> 'id')::uuid;
    v_created_groups := v_created_groups || jsonb_build_array(v_before);
  end loop;

  -- Treasury.
  v_wb := coalesce(v_applied -> 'warband', '{}'::jsonb);
  select veteran_pool into v_pool_before from public.warbands where id = v_report.warband_id;
  update public.warbands set
    wyrdstone = greatest(0, wyrdstone + coalesce((v_wb ->> 'wyrdstone_delta')::int, 0)),
    gold = greatest(0, gold + coalesce((v_wb ->> 'gold_delta')::int, 0)),
    veteran_pool = case when v_wb ? 'veteran_pool' then nullif(v_wb ->> 'veteran_pool', '')::int else veteran_pool end
  where id = v_report.warband_id;

  -- Kit used up or spent in the battle (before-values kept for undo). A quantity of 0 removes the row.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'item_patches', '[]'::jsonb)) loop
    select jsonb_build_object('id', i.id, 'before', jsonb_build_object('quantity', i.quantity, 'notes', i.notes), 'row', to_jsonb(i))
      into v_before from public.items i where i.id = (v_row ->> 'id')::uuid and i.warband_id = v_report.warband_id;
    if v_before is null then
      continue; -- the item is gone already (sold or moved since the report was drafted): nothing to use up
    end if;
    v_undo_items := v_undo_items || v_before;
    if v_row ? 'quantity' and coalesce((v_row ->> 'quantity')::int, 1) <= 0 then
      delete from public.items where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
    else
      update public.items set
        quantity = coalesce((v_row ->> 'quantity')::int, quantity),
        notes = coalesce(v_row ->> 'notes', notes)
      where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
    end if;
  end loop;

  -- Items lost to injuries (kept whole for undo); items found by exploration.
  select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) into v_removed
    from public.items i
   where i.warband_id = v_report.warband_id
     and i.id in (select (x)::uuid from jsonb_array_elements_text(coalesce(v_applied -> 'remove_item_ids', '[]'::jsonb)) x);
  delete from public.items
   where warband_id = v_report.warband_id
     and id in (select (x)::uuid from jsonb_array_elements_text(coalesce(v_applied -> 'remove_item_ids', '[]'::jsonb)) x);
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'stash_items', '[]'::jsonb)) loop
    insert into public.items (warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity)
    values (v_report.warband_id, 'stash', null, v_row ->> 'item_rules_id', v_row ->> 'custom_name', coalesce((v_row ->> 'quantity')::int, 1))
    returning id into v_new_id;
    v_stash_ids := v_stash_ids || to_jsonb(v_new_id);
  end loop;

  -- Advances owed.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'pending_advances', '[]'::jsonb)) loop
    insert into public.pending_advances (warband_id, subject_type, subject_id, threshold_xp)
    values (v_report.warband_id, (v_row ->> 'subject_type')::public.advance_subject, (v_row ->> 'subject_id')::uuid, (v_row ->> 'threshold_xp')::int)
    returning id into v_new_id;
    v_advance_ids := v_advance_ids || to_jsonb(v_new_id);
  end loop;

  update public.match_reports set
    status = 'applied',
    applied = v_applied,
    notes = coalesce(notes,'') || case when v_theft is null then '' else format(E'\nPetty Thief: transferred %s shard(s) from %s; both reserves updated.',v_stolen,v_target_name) end,
    undo = jsonb_build_object(
      'heroes', v_undo_heroes,
      'groups', v_undo_groups,
      'created_groups', v_created_groups,
      'petty_thief',v_theft,
      'items', v_undo_items,
      'warband', jsonb_build_object('wyrdstone_delta', coalesce((v_wb ->> 'wyrdstone_delta')::int, 0), 'gold_delta', coalesce((v_wb ->> 'gold_delta')::int, 0), 'veteran_pool_before', v_pool_before),
      'stash_item_ids', v_stash_ids,
      'removed_items', v_removed,
      'pending_advance_ids', v_advance_ids
    )
  where id = p_report_id;
end;
$$;

revoke all on function public.apply_battle_report(uuid) from public, authenticated;

-- ---------------------------------------------------------------------------------------------
-- revert_battle_report: put patched items back (re-inserting a row the patch deleted)
-- ---------------------------------------------------------------------------------------------
create or replace function public.revert_battle_report(p_report_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_report public.match_reports%rowtype;
  v_undo jsonb;
  v_row jsonb;
  v_wb jsonb;
  v_item jsonb;
begin
  select * into v_report from public.match_reports where id = p_report_id;
  if v_report.id is null then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
  v_undo := v_report.undo;
  if v_undo is null then
    return;
  end if;
  if exists (
    select 1 from public.pending_advances a
     where a.id in (select (x)::uuid from jsonb_array_elements_text(coalesce(v_undo -> 'pending_advance_ids', '[]'::jsonb)) x)
       and (a.resolved_at is not null or a.rolled is not null)
  ) then
    raise exception 'an advance earned in this report has already been rolled; it cannot be undone automatically' using errcode = 'P0001';
  end if;

  if coalesce((v_undo->'petty_thief'->>'transferred')::int,0)>0 then
    perform 1 from public.warbands w where w.id in (v_report.warband_id,(v_undo->'petty_thief'->>'target_id')::uuid) order by w.id for update;
    if not exists (select 1 from public.warbands where id=(v_undo->'petty_thief'->>'target_id')::uuid) then
      raise exception 'the opposing warband no longer exists; the theft cannot be undone automatically' using errcode='P0001';
    end if;
    if (select wyrdstone from public.warbands where id=v_report.warband_id)<coalesce((v_undo->'warband'->>'wyrdstone_delta')::int,0) then
      raise exception 'restore the report’s wyrdstone before undoing its theft' using errcode='P0001';
    end if;
    update public.warbands set wyrdstone=wyrdstone+(v_undo->'petty_thief'->>'transferred')::int where id=(v_undo->'petty_thief'->>'target_id')::uuid;
  end if;

  -- Do not remove a recruit which has since been equipped, edited or advanced.
  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'created_groups', '[]'::jsonb)) loop
    perform 1 from public.henchman_groups g where g.id = (v_row ->> 'id')::uuid for update;
    if not exists (select 1 from public.henchman_groups g
      where g.id = (v_row ->> 'id')::uuid and g.warband_id = v_report.warband_id
        and (to_jsonb(g) - 'updated_at' - 'created_at') = v_row)
      or exists (select 1 from public.items i where i.holder_id = (v_row ->> 'id')::uuid)
      or exists (select 1 from public.pending_advances a where a.subject_id = (v_row ->> 'id')::uuid)
    then
      raise exception 'an exploration recruit has changed since this report; restore it before withdrawing the report' using errcode = 'P0001';
    end if;
    delete from public.henchman_groups where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
  end loop;

  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'heroes', '[]'::jsonb)) loop
    update public.heroes set
      stats = v_row -> 'before' -> 'stats',
      xp = (v_row -> 'before' ->> 'xp')::int,
      level_ups = (v_row -> 'before' ->> 'level_ups')::int,
      injuries = v_row -> 'before' -> 'injuries',
      flags = v_row -> 'before' -> 'flags',
      status = (v_row -> 'before' ->> 'status')::public.warrior_status
    where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
  end loop;
  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'groups', '[]'::jsonb)) loop
    update public.henchman_groups set
      size = (v_row -> 'before' ->> 'size')::int,
      xp = (v_row -> 'before' ->> 'xp')::int,
      level_ups = (v_row -> 'before' ->> 'level_ups')::int
    where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
  end loop;
  v_wb := coalesce(v_undo -> 'warband', '{}'::jsonb);
  update public.warbands set
    wyrdstone = greatest(0, wyrdstone - coalesce((v_wb ->> 'wyrdstone_delta')::int, 0)),
    gold = greatest(0, gold - coalesce((v_wb ->> 'gold_delta')::int, 0)),
    veteran_pool = nullif(v_wb ->> 'veteran_pool_before', '')::int
  where id = v_report.warband_id;
  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'items', '[]'::jsonb)) loop
    v_item := v_row -> 'row';
    insert into public.items (id, warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity, notes)
    values ((v_item ->> 'id')::uuid, v_report.warband_id, (v_item ->> 'holder_type')::public.item_holder, nullif(v_item ->> 'holder_id', '')::uuid, v_item ->> 'item_rules_id', v_item ->> 'custom_name', coalesce((v_item ->> 'quantity')::int, 1), coalesce(v_item ->> 'notes', ''))
    on conflict (id) do update set
      quantity = (v_row -> 'before' ->> 'quantity')::int,
      notes = coalesce(v_row -> 'before' ->> 'notes', public.items.notes);
  end loop;
  delete from public.items
   where warband_id = v_report.warband_id
     and id in (select (x)::uuid from jsonb_array_elements_text(coalesce(v_undo -> 'stash_item_ids', '[]'::jsonb)) x);
  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'removed_items', '[]'::jsonb)) loop
    insert into public.items (id, warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity, notes)
    values ((v_row ->> 'id')::uuid, v_report.warband_id, (v_row ->> 'holder_type')::public.item_holder, nullif(v_row ->> 'holder_id', '')::uuid, v_row ->> 'item_rules_id', v_row ->> 'custom_name', coalesce((v_row ->> 'quantity')::int, 1), coalesce(v_row ->> 'notes', ''))
    on conflict (id) do nothing;
  end loop;
  delete from public.pending_advances
   where id in (select (x)::uuid from jsonb_array_elements_text(coalesce(v_undo -> 'pending_advance_ids', '[]'::jsonb)) x);

  update public.match_reports set undo = null where id = p_report_id;
end;
$$;

revoke all on function public.revert_battle_report(uuid) from public, authenticated;
