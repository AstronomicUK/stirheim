-- One Snake Hunter attempt per actual post-battle phase, serialized with roster changes.
create or replace function public.hunt_snake(
  p_warband_id uuid, p_hero_id uuid, p_match_id uuid, p_die integer,
  p_danger_die integer default null, p_hit_outcome text default null, p_hit_rolls text default null
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_hero public.heroes%rowtype;
  v_report public.match_reports%rowtype;
  v_flags jsonb;
  v_count integer;
  v_caught boolean;
  v_lost boolean := false;
  v_group text;
  v_id uuid;
  v_changes jsonb := '[]'::jsonb;
  v_note text;
  v_result jsonb;
  v_other record;
begin
  if (select auth.uid()) is null or not public.can_edit_warband(p_warband_id) then raise exception 'Only the warband owner or GM may resolve Snake Hunter' using errcode = '42501'; end if;
  perform 1 from public.warbands where id = p_warband_id for update;
  select * into v_hero from public.heroes where id = p_hero_id and warband_id = p_warband_id for update;
  if not found or v_hero.status <> 'active' or v_hero.hired_sword_rules_id <> 'snake_charmer' or coalesce((v_hero.flags->>'hireCompanion')::boolean,false) then raise exception 'Choose a living Snake Charmer'; end if;
  select * into v_report from public.match_reports where warband_id = p_warband_id and status = 'applied' order by submitted_at desc, id desc limit 1;
  if not found or p_match_id is null or v_report.match_id <> p_match_id then raise exception 'Snake Hunter requires the latest applied battle report'; end if;
  if v_hero.created_at > v_report.submitted_at then raise exception 'This Charmer joined after the battle and cannot hunt for that game'; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(v_report.ooa,'[]'::jsonb)) x where x->>'subjectId' = p_hero_id::text and coalesce((x->>'count')::integer,1)>0) then raise exception 'The Charmer was out of action and cannot hunt after this game'; end if;
  if v_hero.flags->>'snakeHuntAfter' = p_match_id::text then raise exception 'Snake Hunter has already been attempted after this battle'; end if;
  if p_die is null or p_die not between 1 and 6 then raise exception 'Enter the Snake Hunter D6'; end if;
  v_group := coalesce(nullif(v_hero.flags->>'hireGroupId',''),p_hero_id::text);
  select count(*) into v_count from public.heroes where warband_id=p_warband_id and status='active' and hired_sword_rules_id='snake_charmer' and flags->>'hireGroupId'=v_group and coalesce((flags->>'hireCompanion')::boolean,false);
  if v_count >= 5 then raise exception 'The Charmer already controls five snakes'; end if;
  v_caught := p_die < (v_hero.stats->>'I')::integer;
  v_note := format('Snake Hunter: D6 %s against Initiative %s (must roll under); %s.', p_die,v_hero.stats->>'I',case when v_caught then 'caught one snake' else 'failed to catch a snake' end);
  if not v_caught then
    if p_danger_die is null or p_danger_die not between 1 and 6 then raise exception 'Roll the danger D6 after failing to catch a snake'; end if;
    v_note := v_note || format(' Danger D6 %s.',p_danger_die);
    if p_danger_die=1 then
      if p_hit_outcome is null or p_hit_outcome not in ('recovered','lost') or nullif(btrim(p_hit_rolls),'') is null then raise exception 'Resolve the S3 hit and record its dice and lasting outcome'; end if;
      v_lost := p_hit_outcome='lost';
      v_note := v_note || ' S3 hit: ' || btrim(p_hit_rolls) || case when v_lost then ' Charmer lost; remaining snakes leave.' else ' No lasting harm.' end;
    end if;
  end if;
  v_flags := coalesce(v_hero.flags,'{}'::jsonb) || jsonb_build_object('hireGroupId',v_group,'snakeHuntAfter',p_match_id::text,'snakeHuntLog',v_note);
  v_changes := jsonb_build_array(jsonb_build_object('table','heroes','op','update','id',p_hero_id,'data',jsonb_build_object('flags',v_flags,'status',case when v_lost then 'dead' else 'active' end)));
  if v_caught then
    v_id := gen_random_uuid();
    v_changes := v_changes || jsonb_build_array(jsonb_build_object('table','heroes','op','insert','id',v_id,'data',jsonb_build_object('name','Snake ' || (v_count+1),'is_hired_sword',true,'hired_sword_rules_id','snake_charmer','stats',jsonb_build_object('M',4,'WS',3,'BS',0,'S',1,'T',2,'W',1,'I',5,'A',1,'Ld',5),'xp',0,'level_ups',0,'skills','[]'::jsonb,'spells','[]'::jsonb,'injuries','[]'::jsonb,'flags',jsonb_build_object('hireGroupId',v_group,'hireCompanion',true),'status','active')));
  elsif v_lost then
    for v_other in select id from public.heroes where warband_id=p_warband_id and status='active' and flags->>'hireGroupId'=v_group and coalesce((flags->>'hireCompanion')::boolean,false) loop
      v_changes := v_changes || jsonb_build_array(jsonb_build_object('table','heroes','op','update','id',v_other.id,'data',jsonb_build_object('status','left')));
    end loop;
  end if;
  perform public.update_roster(p_warband_id,v_note,v_changes);
  update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),v_hero.name || ': ' || v_note) where id=v_report.id;
  v_result := jsonb_build_object('caught',v_caught,'lost',v_lost,'snakeId',v_id,'note',v_note);
  return v_result;
end; $$;
revoke all on function public.hunt_snake(uuid,uuid,uuid,integer,integer,text,text) from public;
grant execute on function public.hunt_snake(uuid,uuid,uuid,integer,integer,text,text) to authenticated;

-- Preserve a later once-per-game hunt when a GM attempts to withdraw its report.
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
  if exists (select 1 from public.heroes h where h.warband_id=v_report.warband_id and h.flags->>'snakeHuntAfter'=v_report.match_id::text) then
    raise exception 'Snake Hunter was resolved after this report; reverse that later action before withdrawing the report' using errcode='P0001';
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

revoke all on function public.revert_battle_report(uuid) from public, authenticated;
