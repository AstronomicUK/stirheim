-- Keep casualty/recruit equipment undo atomic, and allow unchanged report-awarded kit on a new group.
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
  v_patch jsonb;
begin
  select * into v_report from public.match_reports where id = p_report_id;
  if v_report.id is null then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.heroes h where h.warband_id=v_report.warband_id and h.flags->>'snakeHuntAfter'=v_report.match_id::text) then
    raise exception 'Snake Hunter was resolved after this report; reverse that later action before withdrawing the report' using errcode='P0001';
  end if;
  if exists(select 1 from public.trade_phase_state t where t.warband_id=v_report.warband_id and t.match_id=v_report.match_id and t.pirate_surcharge_paid) then raise exception 'Pirate upkeep was paid after this report; reverse that later payment before withdrawing the report'; end if;
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

  -- A report may shrink/replenish existing stacks and groups. Never overwrite later changes.
  for v_row in select * from jsonb_array_elements(coalesce(v_undo->'items','[]'::jsonb)) loop
    select x into v_patch from jsonb_array_elements(coalesce(v_report.applied->'item_patches','[]'::jsonb)) x where x->>'id'=v_row->>'id' limit 1;
    if v_patch is null or v_row->'row' is null then continue; end if;
    perform 1 from public.items i where i.id=(v_row->>'id')::uuid for update;
    if v_patch ? 'quantity' and (v_patch->>'quantity')::int=0 then
      if exists(select 1 from public.items i where i.id=(v_row->>'id')::uuid) then raise exception 'report equipment has changed; restore it before withdrawing the report'; end if;
    elsif not exists(select 1 from public.items i where i.id=(v_row->>'id')::uuid and i.warband_id=v_report.warband_id
      and (to_jsonb(i)-'created_at'-'updated_at')=(((v_row->'row')-'created_at'-'updated_at')||v_patch)) then
      raise exception 'report equipment has changed; restore it before withdrawing the report';
    end if;
  end loop;
  for v_row in select * from jsonb_array_elements(coalesce(v_report.applied->'groups','[]'::jsonb)) loop
    perform 1 from public.henchman_groups g where g.id=(v_row->>'id')::uuid for update;
    if not exists(select 1 from public.henchman_groups g where g.id=(v_row->>'id')::uuid and g.warband_id=v_report.warband_id and to_jsonb(g) @> ((v_row->'patch')-'campaign_state')) then
      raise exception 'a report henchman group has changed; restore it before withdrawing the report';
    end if;
  end loop;

  -- Never erase a reward which was subsequently moved, consumed, sold or edited.
  for v_row in select * from jsonb_array_elements(coalesce(v_undo->'awarded_items','[]'::jsonb)||coalesce(v_undo->'moved_items','[]'::jsonb)) loop
    perform 1 from public.items i where i.id=(v_row->>'id')::uuid for update;
    if not exists (select 1 from public.items i where i.id=(v_row->>'id')::uuid and i.warband_id=v_report.warband_id and (to_jsonb(i)-'updated_at'-'created_at')=v_row) then
      raise exception 'scenario equipment has changed since this report; restore it before withdrawing the report' using errcode='P0001';
    end if;
  end loop;

  for v_row in select * from jsonb_array_elements(coalesce(v_report.applied->'heroes','[]'::jsonb)) loop
    if exists (select 1 from public.heroes h where h.id=(v_row->>'id')::uuid and h.warband_id=v_report.warband_id and (
      (v_row->'patch' ? 'skills' and to_jsonb(h.skills) is distinct from v_row->'patch'->'skills') or
      (v_row->'patch' ? 'spells' and to_jsonb(h.spells) is distinct from v_row->'patch'->'spells') or
      (v_row->'patch' ? 'notes' and h.notes is distinct from v_row->'patch'->>'notes')
    )) then raise exception 'scenario warrior rewards have changed since this report; restore them before withdrawal' using errcode='P0001'; end if;
  end loop;

  -- A later upkeep payment is a separate roster transaction; do not erase its state on withdrawal.
  for v_row in select * from jsonb_array_elements(coalesce(v_report.applied->'groups','[]'::jsonb)) loop
    if v_row->'patch' ? 'campaign_state' and exists (
      select 1 from public.henchman_groups g where g.id=(v_row->>'id')::uuid and g.warband_id=v_report.warband_id
        and g.campaign_state is distinct from v_row->'patch'->'campaign_state'
    ) then raise exception 'henchman upkeep has changed since this report; reverse that payment before withdrawing the report' using errcode='P0001'; end if;
  end loop;

  -- Do not remove a recruit which has since been equipped, edited or advanced.
  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'created_groups', '[]'::jsonb)) loop
    perform 1 from public.henchman_groups g where g.id = (v_row ->> 'id')::uuid for update;
    if not exists (select 1 from public.henchman_groups g
      where g.id = (v_row ->> 'id')::uuid and g.warband_id = v_report.warband_id
        and (to_jsonb(g) - 'updated_at' - 'created_at') = v_row)
      or exists (select 1 from public.items i where i.holder_id = (v_row ->> 'id')::uuid and not exists (select 1 from jsonb_array_elements(coalesce(v_undo->'awarded_items','[]'::jsonb)) a where a->>'id'=i.id::text))
      or exists (select 1 from public.pending_advances a where a.subject_id = (v_row ->> 'id')::uuid)
    then
      raise exception 'an exploration recruit has changed since this report; restore it before withdrawing the report' using errcode = 'P0001';
    end if;
    delete from public.henchman_groups where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
  end loop;

  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'heroes', '[]'::jsonb)) loop
    update public.heroes set
      stats = v_row -> 'before' -> 'stats',
      skills = case when v_row->'before' ? 'skills' then array(select jsonb_array_elements_text(v_row->'before'->'skills')) else skills end,
      spells = case when v_row->'before' ? 'spells' then array(select jsonb_array_elements_text(v_row->'before'->'spells')) else spells end,
      notes = coalesce(v_row->'before'->>'notes',notes),
      xp = (v_row -> 'before' ->> 'xp')::int,
      level_ups = (v_row -> 'before' ->> 'level_ups')::int,
      injuries = v_row -> 'before' -> 'injuries',
      flags = v_row -> 'before' -> 'flags',
      status = (v_row -> 'before' ->> 'status')::public.warrior_status
    where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
  end loop;
  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'groups', '[]'::jsonb)) loop
    update public.henchman_groups set
      campaign_state = coalesce(v_row->'before'->'campaign_state',campaign_state),
      stats = coalesce(v_row->'before'->'stats',stats),
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
      notes = coalesce(v_row -> 'before' ->> 'notes', public.items.notes),
      holder_type = coalesce((v_row->'before'->>'holder_type')::public.item_holder,public.items.holder_type),
      holder_id = case when v_row->'before' ? 'holder_type' then nullif(v_row->'before'->>'holder_id','')::uuid else public.items.holder_id end;
  end loop;
  delete from public.items
   where warband_id = v_report.warband_id
     and id in (select (x)::uuid from jsonb_array_elements_text(coalesce(v_undo -> 'stash_item_ids', '[]'::jsonb)) x);
  for v_row in select * from jsonb_array_elements(coalesce(v_undo -> 'removed_items', '[]'::jsonb)) loop
    insert into public.items (id, warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity, notes)
    values ((v_row ->> 'id')::uuid, v_report.warband_id, (v_row ->> 'holder_type')::public.item_holder, nullif(v_row ->> 'holder_id', '')::uuid, v_row ->> 'item_rules_id', v_row ->> 'custom_name', coalesce((v_row ->> 'quantity')::int, 1), coalesce(v_row ->> 'notes', ''))
    on conflict (id) do nothing;
  end loop;
  delete from public.items where warband_id=v_report.warband_id and id in (select (x->>'id')::uuid from jsonb_array_elements(coalesce(v_undo->'awarded_items','[]'::jsonb)) x);
  delete from public.pending_advances
   where id in (select (x)::uuid from jsonb_array_elements_text(coalesce(v_undo -> 'pending_advance_ids', '[]'::jsonb)) x);

  update public.match_reports set undo = null where id = p_report_id;
end;
$$;
