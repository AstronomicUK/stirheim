-- Pirates pay one warband-wide +20 upkeep for retaining both Dwarfs and Elves.
alter table public.trade_phase_state add column pirate_surcharge_paid boolean not null default false;
create function public.pirate_mixed_hires(p_warband_id uuid)
returns table(id uuid, race text) language sql stable security definer set search_path='' as $$
  select h.id,case when h.hired_sword_rules_id in ('dwarf_troll_slayer','dwarf_pathfinder','dwarf_treasure_hunter','dwarf_slayer_pirate') then 'dwarf' else 'elf' end
  from public.heroes h join public.warbands w on w.id=h.warband_id
  where h.warband_id=p_warband_id and w.type_rules_id='pirates' and h.is_hired_sword and h.status='active'
  and h.hired_sword_rules_id in ('dwarf_troll_slayer','dwarf_pathfinder','dwarf_treasure_hunter','dwarf_slayer_pirate','elf_ranger','elf_mage','dark_elf_assassin','shadow_warrior','wood_elf_hunter','aenur_the_sword_of_twilight');
$$;
revoke all on function public.pirate_mixed_hires(uuid) from public,authenticated;
create function public.pirate_surcharge_due(p_warband_id uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare r public.match_reports%rowtype;
begin
  if (select count(distinct race) from public.pirate_mixed_hires(p_warband_id))<>2 then return null; end if;
  select mr.* into r from public.match_reports mr join public.matches m on m.id=mr.match_id where mr.warband_id=p_warband_id and mr.status='applied' order by coalesce(m.started_at,mr.submitted_at) desc,mr.id desc limit 1;
  if coalesce((r.applied->>'pirate_mixed_upkeep_due')::boolean,false) and not exists(select 1 from public.trade_phase_state t where t.warband_id=p_warband_id and t.match_id=r.match_id and t.pirate_surcharge_paid) then return r.match_id; end if;
  return null;
end; $$;
revoke all on function public.pirate_surcharge_due(uuid) from public,authenticated;
create function public.pirate_upkeep_status(p_warband_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare m uuid;
begin
  if not public.can_edit_warband(p_warband_id) then raise exception 'only the owner or GM may check this upkeep' using errcode='42501'; end if;
  m:=public.pirate_surcharge_due(p_warband_id);
  return jsonb_build_object('due',m is not null,'match_id',m,'amount',20);
end; $$;
revoke all on function public.pirate_upkeep_status(uuid) from public;
grant execute on function public.pirate_upkeep_status(uuid) to authenticated;
create function public.pay_pirate_upkeep(p_warband_id uuid,p_amount integer default 20,p_reason text default null)
returns void language plpgsql volatile security definer set search_path='' as $$
declare m uuid; funds integer; explanation text;
begin
  if not public.can_edit_warband(p_warband_id) then raise exception 'only the owner or GM may pay this upkeep' using errcode='42501'; end if;
  if p_amount is null or p_amount<0 or (p_amount<>20 and nullif(btrim(p_reason),'') is null) then raise exception 'an altered upkeep payment needs a non-negative amount and an agreed reason'; end if;
  select gold into funds from public.warbands where id=p_warband_id for update;
  m:=public.pirate_surcharge_due(p_warband_id);
  if m is null then raise exception 'no mixed-crew surcharge is currently due'; end if;
  if funds<p_amount then raise exception 'not enough gold for the mixed-crew surcharge'; end if;
  explanation:='Pirate mixed Elf/Dwarf crew upkeep: paid '||p_amount||' gc once for the warband.'||case when p_amount<>20 then ' Agreed override: '||btrim(p_reason) else '' end;
  perform set_config('stirheim.audit_reason',explanation,true);
  update public.warbands set gold=gold-p_amount where id=p_warband_id;
  insert into public.trade_phase_state(warband_id,match_id,pirate_surcharge_paid) values(p_warband_id,m,true) on conflict(warband_id,match_id) do update set pirate_surcharge_paid=true;
  update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),explanation) where warband_id=p_warband_id and match_id=m;
end; $$;
revoke all on function public.pay_pirate_upkeep(uuid,integer,text) from public;
grant execute on function public.pay_pirate_upkeep(uuid,integer,text) to authenticated;

-- Respect the player’s saved Scout choice when unpaid Maglah leaves.
-- #219: read-only preview, followed by acknowledged atomic dismissal at battle start.
create or replace function public.unpaid_match_hires(p_match_id uuid)
returns table(id uuid, name text, warband_id uuid, warband_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not (public.is_match_participant(p_match_id) or public.is_campaign_gm(public.match_campaign(p_match_id))) then
    raise exception 'only a participant or the GM can check battle upkeep' using errcode = '42501';
  end if;
  return query
  with unpaid as (
    select h.* from public.heroes h
    join public.match_participants mp on mp.warband_id = h.warband_id and mp.match_id = p_match_id
    where h.is_hired_sword and h.status = 'active' and (nullif(h.flags ->> 'upkeepOwedAfter', '') is not null or (public.pirate_surcharge_due(h.warband_id) is not null and h.id in(select x.id from public.pirate_mixed_hires(h.warband_id) x)))
  ), departing as (
    select h.id from public.heroes h
    where h.status = 'active' and h.is_hired_sword and exists (
      select 1 from unpaid u where u.warband_id = h.warband_id and (
        h.id = u.id
        or (nullif(u.flags ->> 'hireGroupId','') is not null
          and coalesce((u.flags ->> 'hireCompanion')::boolean, false) = false
          and h.flags ->> 'hireGroupId' = u.flags ->> 'hireGroupId')
        or (u.hired_sword_rules_id = 'maglah_khan_s_horde' and h.hired_sword_rules_id = 'hobgoblin_scout'
          and h.id <> (select s.id from public.heroes s where s.warband_id = h.warband_id
            and s.hired_sword_rules_id = 'hobgoblin_scout' and s.status = 'active' order by (s.id::text = u.flags->>'retainedScoutId') desc nulls last, s.created_at, s.id limit 1))
      )
    )
  )
  select h.id, h.name, h.warband_id, w.name from departing d
  join public.heroes h on h.id = d.id join public.warbands w on w.id = h.warband_id
  order by h.warband_id, h.id;
end;
$$;
revoke all on function public.unpaid_match_hires(uuid) from public;
grant execute on function public.unpaid_match_hires(uuid) to authenticated;


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
