-- Validate complete encampment stash claims, including empty stashes.
-- Scenario equipment transfers use existing source stacks and checked snapshots.
-- Direct scenario rewards: warrior skills, equipment grants and ownership-safe undo.
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
  v_awarded_items jsonb := '[]'::jsonb;
  v_moved_items jsonb := '[]'::jsonb;
  v_removed jsonb := '[]'::jsonb;
  v_stash_ids jsonb := '[]'::jsonb;
  v_advance_ids jsonb := '[]'::jsonb;
  v_new_id uuid;
  v_pool_before int;
  v_theft jsonb;
  v_stolen int := 0;
  v_target_name text;
  v_transfers jsonb := '[]'::jsonb;
  v_transfer jsonb;
  v_source public.items%rowtype;
  v_source_after jsonb;
  v_transfer_notes text := '';
  v_quantity int;
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
  if v_applied->'encampment_capture' is not null then
    perform 1 from public.warbands w where w.id in (v_report.warband_id,(v_applied->'encampment_capture'->>'defender_id')::uuid) order by w.id for update;
    perform 1 from public.matches where id=v_report.match_id for update;
    if v_report.result <> 'won' or not exists(select 1 from public.matches m where m.id=v_report.match_id and m.scenario_rules_id='encampment_raid')
       or (v_applied->'encampment_capture'->>'defender_id')::uuid=v_report.warband_id
       or not exists(select 1 from public.match_participants mp where mp.match_id=v_report.match_id and mp.warband_id=(v_applied->'encampment_capture'->>'defender_id')::uuid)
       or coalesce(btrim(v_applied->'encampment_capture'->>'camp'),'')=''
       or coalesce(v_applied->'encampment_capture'->>'treatment','') not in ('destroy','occupy')
       or (v_applied->'encampment_capture'->>'treatment'='occupy' and not coalesce((v_applied->'encampment_capture'->>'eligible')::boolean,false))
    then raise exception 'Invalid encampment capture or settlement eligibility'; end if;
    if exists(select 1 from public.match_reports r where r.match_id=v_report.match_id and r.id<>v_report.id and r.undo is not null and r.applied->'encampment_capture' is not null)
    then raise exception 'The encampment has already been claimed by another report'; end if;
    perform 1 from public.items i where i.warband_id=(v_applied->'encampment_capture'->>'defender_id')::uuid and i.holder_type='stash' order by i.id for update;
    if exists(select 1 from public.items i where i.warband_id=(v_applied->'encampment_capture'->>'defender_id')::uuid and i.holder_type='stash' and i.quantity>0
      and not exists(select 1 from jsonb_array_elements(coalesce(v_applied->'scenario_item_transfers','[]'::jsonb)) t where (t->>'item_id')::uuid=i.id and (t->>'quantity')::int=i.quantity))
      or exists(select 1 from jsonb_array_elements(coalesce(v_applied->'scenario_item_transfers','[]'::jsonb)) t
        where (t->>'from_warband_id')::uuid<>(v_applied->'encampment_capture'->>'defender_id')::uuid
          or not exists(select 1 from public.items i where i.id=(t->>'item_id')::uuid and i.warband_id=(v_applied->'encampment_capture'->>'defender_id')::uuid and i.holder_type='stash' and i.quantity=(t->>'quantity')::int))
    then raise exception 'The complete defender stash changed; review it again before filing'; end if;
  end if;
  if jsonb_array_length(coalesce(v_applied->'scenario_item_transfers','[]'::jsonb))>0 then
    if not exists(select 1 from public.matches m where m.id=v_report.match_id and m.scenario_rules_id in ('stop_thief','encampment_raid','the_forbidden_square')) then
      raise exception 'This scenario does not permit equipment transfers';
    end if;
    if exists(select 1 from jsonb_array_elements(v_applied->'scenario_item_transfers') t group by t->>'item_id' having count(*)>1) then raise exception 'Select each transferred equipment stack only once'; end if;
    perform 1 from public.warbands w where w.id=v_report.warband_id or w.id in (select (t->>'from_warband_id')::uuid from jsonb_array_elements(v_applied->'scenario_item_transfers') t) order by w.id for update;
    for v_transfer in select * from jsonb_array_elements(v_applied->'scenario_item_transfers') loop
      v_quantity:=(v_transfer->>'quantity')::int;
      if v_quantity is null or v_quantity<1 or coalesce(btrim(v_transfer->>'reason'),'')='' or (v_transfer->>'from_warband_id')::uuid=v_report.warband_id
        or not exists(select 1 from public.match_participants mp where mp.match_id=v_report.match_id and mp.warband_id=(v_transfer->>'from_warband_id')::uuid)
      then raise exception 'Invalid scenario equipment transfer'; end if;
      select * into v_source from public.items where id=(v_transfer->>'item_id')::uuid and warband_id=(v_transfer->>'from_warband_id')::uuid for update;
      if v_source.id is null or v_source.quantity<v_quantity or (to_jsonb(v_source)-'updated_at'-'created_at') is distinct from ((v_transfer->'expected')-'updated_at'-'created_at') then
        raise exception 'The source equipment changed; review the transfer before filing';
      end if;
      if exists(select 1 from public.matches m where m.id=v_report.match_id and m.scenario_rules_id='encampment_raid') and (v_report.result<>'won' or v_source.holder_type<>'stash') then raise exception 'Encampment rewards require victory and equipment from the defender stash'; end if;
      if v_source.quantity=v_quantity then delete from public.items where id=v_source.id; v_source_after:=null;
      else update public.items set quantity=quantity-v_quantity where id=v_source.id; select to_jsonb(i)-'updated_at'-'created_at' into v_source_after from public.items i where id=v_source.id; end if;
      insert into public.items(warband_id,holder_type,holder_id,item_rules_id,custom_name,quantity,notes)
      values(v_report.warband_id,'stash',null,v_source.item_rules_id,v_source.custom_name,v_quantity,v_source.notes) returning id into v_new_id;
      select to_jsonb(i)-'updated_at'-'created_at' into v_before from public.items i where id=v_new_id;
      v_awarded_items:=v_awarded_items||jsonb_build_array(v_before);
      v_transfers:=v_transfers||jsonb_build_array(jsonb_build_object('before',to_jsonb(v_source)-'updated_at'-'created_at','after',v_source_after));
      select name into v_target_name from public.warbands where id=v_source.warband_id;
      v_transfer_notes:=v_transfer_notes||format(E'\nScenario equipment: %s × %s moved from %s to this warband’s stash. %s',v_quantity,coalesce(v_source.custom_name,replace(v_source.item_rules_id,'_',' ')),v_target_name,v_transfer->>'reason');
    end loop;
  end if;
  if v_applied->'scenario_counter_score' is not null then
    perform 1 from public.matches where id=v_report.match_id for update;
    if not exists(select 1 from public.matches m where m.id=v_report.match_id and m.scenario_rules_id='the_forbidden_square') then raise exception 'Counter score belongs only to the Archive Forbidden Square'; end if;
    if coalesce((v_applied->'scenario_counter_score'->>'placed')::int,-1)<0 or coalesce((v_applied->'scenario_counter_score'->>'scored')::int,-1)<0
       or (v_applied->'scenario_counter_score'->>'scored')::int>(v_applied->'scenario_counter_score'->>'placed')::int then raise exception 'Invalid Forbidden Square counter score'; end if;
    if exists(select 1 from public.match_reports r where r.match_id=v_report.match_id and r.id<>v_report.id and r.status='applied' and r.applied->'scenario_counter_score' is not null and (r.applied->'scenario_counter_score'->>'placed')::int<>(v_applied->'scenario_counter_score'->>'placed')::int) then raise exception 'The reports disagree on how many counters were placed at setup'; end if;
    if (v_applied->'scenario_counter_score'->>'scored')::int+coalesce((select sum((r.applied->'scenario_counter_score'->>'scored')::int) from public.match_reports r where r.match_id=v_report.match_id and r.id<>v_report.id and r.status='applied'),0)>(v_applied->'scenario_counter_score'->>'placed')::int then raise exception 'Combined counter scores exceed the number placed at setup'; end if;
  end if;
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
    select jsonb_build_object('id', h.id, 'before', jsonb_build_object('stats', h.stats, 'skills', h.skills, 'spells', h.spells, 'notes', h.notes, 'xp', h.xp, 'level_ups', h.level_ups, 'injuries', h.injuries, 'flags', h.flags, 'status', h.status))
      into v_before from public.heroes h where h.id = (v_row ->> 'id')::uuid and h.warband_id = v_report.warband_id;
    if v_before is null then
      raise exception 'hero % is not in this warband', v_row ->> 'id' using errcode = 'P0002';
    end if;
    v_undo_heroes := v_undo_heroes || v_before;
    update public.heroes set
      stats = coalesce(v_patch -> 'stats', stats),
      skills = case when v_patch ? 'skills' then array(select jsonb_array_elements_text(v_patch->'skills')) else skills end,
      spells = case when v_patch ? 'spells' then array(select jsonb_array_elements_text(v_patch->'spells')) else spells end,
      notes = coalesce(v_patch->>'notes',notes),
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
    select jsonb_build_object('id', g.id, 'before', jsonb_build_object('stats', g.stats, 'size', g.size, 'xp', g.xp, 'level_ups', g.level_ups, 'campaign_state', g.campaign_state))
      into v_before from public.henchman_groups g where g.id = (v_row ->> 'id')::uuid and g.warband_id = v_report.warband_id;
    if v_before is null then
      raise exception 'henchman group % is not in this warband', v_row ->> 'id' using errcode = 'P0002';
    end if;
    v_undo_groups := v_undo_groups || v_before;
    update public.henchman_groups set
      campaign_state = coalesce(v_patch->'campaign_state',campaign_state),
      stats = coalesce(v_patch->'stats',stats),
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
    select jsonb_build_object('id', i.id, 'before', jsonb_build_object('quantity', i.quantity, 'notes', i.notes, 'holder_type', i.holder_type, 'holder_id', i.holder_id), 'row', to_jsonb(i))
      into v_before from public.items i where i.id = (v_row ->> 'id')::uuid and i.warband_id = v_report.warband_id;
    if v_before is null then
      continue; -- the item is gone already (sold or moved since the report was drafted): nothing to use up
    end if;
    if coalesce(v_row->>'holder_type','stash')='hero' and not exists (select 1 from public.heroes h where h.id=nullif(v_row->>'holder_id','')::uuid and h.warband_id=v_report.warband_id and h.status='active') then
      raise exception 'reward recipient is not an active warrior in this warband' using errcode='22023';
    elsif coalesce(v_row->>'holder_type','stash')='group' and not exists (select 1 from public.henchman_groups g where g.id=nullif(v_row->>'holder_id','')::uuid and g.warband_id=v_report.warband_id and g.size>0) then
      raise exception 'reward recipient is not an active group in this warband' using errcode='22023';
    elsif v_row->>'holder_type'='stash' and nullif(v_row->>'holder_id','') is not null then
      raise exception 'stash rewards cannot have a warrior recipient' using errcode='22023';
    end if;
    v_undo_items := v_undo_items || v_before;
    if v_row ? 'quantity' and coalesce((v_row ->> 'quantity')::int, 1) <= 0 then
      delete from public.items where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
    else
      update public.items set
        quantity = coalesce((v_row ->> 'quantity')::int, quantity),
        notes = coalesce(v_row ->> 'notes', notes),
        holder_type = coalesce((v_row->>'holder_type')::public.item_holder,holder_type),
        holder_id = case when v_row ? 'holder_type' then nullif(v_row->>'holder_id','')::uuid else holder_id end
      where id = (v_row ->> 'id')::uuid and warband_id = v_report.warband_id;
      if v_row ? 'holder_type' then
        select to_jsonb(i)-'updated_at'-'created_at' into v_before from public.items i where i.id=(v_row->>'id')::uuid;
        v_moved_items := v_moved_items || jsonb_build_array(v_before);
      end if;
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

  -- Direct awards retain their intended recipient and complete snapshot for safe withdrawal.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied->'awarded_items','[]'::jsonb)) loop
    if coalesce(v_row->>'holder_type','stash')='hero' and not exists (select 1 from public.heroes h where h.id=nullif(v_row->>'holder_id','')::uuid and h.warband_id=v_report.warband_id and h.status='active') then
      raise exception 'reward recipient is not an active warrior in this warband' using errcode='22023';
    elsif coalesce(v_row->>'holder_type','stash')='group' and not exists (select 1 from public.henchman_groups g where g.id=nullif(v_row->>'holder_id','')::uuid and g.warband_id=v_report.warband_id and g.size>0) then
      raise exception 'reward recipient is not an active group in this warband' using errcode='22023';
    elsif v_row->>'holder_type'='stash' and nullif(v_row->>'holder_id','') is not null then
      raise exception 'stash rewards cannot have a warrior recipient' using errcode='22023';
    end if;
    insert into public.items (warband_id,holder_type,holder_id,item_rules_id,custom_name,quantity,notes)
    values (v_report.warband_id,(v_row->>'holder_type')::public.item_holder,nullif(v_row->>'holder_id','')::uuid,v_row->>'item_rules_id',v_row->>'custom_name',(v_row->>'quantity')::int,coalesce(v_row->>'notes','')) returning id into v_new_id;
    select to_jsonb(i)-'updated_at'-'created_at' into v_before from public.items i where i.id=v_new_id;
    v_awarded_items := v_awarded_items || jsonb_build_array(v_before);
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
    notes = coalesce(notes,'') || v_transfer_notes || case when v_theft is null then '' else format(E'\nPetty Thief: transferred %s shard(s) from %s; both reserves updated.',v_stolen,v_target_name) end,
    undo = jsonb_build_object(
      'heroes', v_undo_heroes,
      'groups', v_undo_groups,
      'created_groups', v_created_groups,
      'petty_thief',v_theft,
      'scenario_item_transfers',v_transfers,
      'items', v_undo_items,
      'warband', jsonb_build_object('wyrdstone_delta', coalesce((v_wb ->> 'wyrdstone_delta')::int, 0), 'gold_delta', coalesce((v_wb ->> 'gold_delta')::int, 0), 'veteran_pool_before', v_pool_before),
      'stash_item_ids', v_stash_ids,
      'awarded_items', v_awarded_items,
      'moved_items', v_moved_items,
      'removed_items', v_removed,
      'pending_advance_ids', v_advance_ids
    )
  where id = p_report_id;
end;
$$;

revoke all on function public.apply_battle_report(uuid) from public, authenticated;


-- Keep casualty/recruit equipment undo atomic, and allow unchanged report-awarded kit on a new group.
