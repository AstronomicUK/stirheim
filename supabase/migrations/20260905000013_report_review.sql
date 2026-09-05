-- Phase 11: reports can wait for the GM, be returned, and be amended with a change log.
--
--   status   'applied'  the roster carries this report (the default; every existing row)
--            'pending'  filed by a player in a campaign whose settings.reportApproval is on; nothing
--                       applied until approve_battle_report (or return_battle_report sends it back)
--            'returned' the GM sent it back with review_note; the player files again, which replaces it
--   undo     what apply_battle_report changed, so revert_battle_report can put the roster back:
--            heroes/groups before-values, treasury deltas, stash rows inserted, item rows removed,
--            pending advances created. Amending or withdrawing an applied report reverts first.
--   revision / amended_* / report_revisions: every superseded version of a report, verbatim, with
--            the GM's note. The record shows "Amended by GM" and the log of what changed.
--   adjustments: places where the player overrode what the wizard suggested (dice counts), with a
--            reason, kept on the row and shown in the record.

alter table public.match_reports
  add column status text not null default 'applied' check (status in ('pending', 'applied', 'returned')),
  add column review_note text,
  add column revision integer not null default 1 check (revision >= 1),
  add column amended_at timestamptz,
  add column amended_by uuid references auth.users (id) on delete set null,
  add column amendment_note text,
  add column undo jsonb check (undo is null or jsonb_typeof(undo) = 'object'),
  add column adjustments jsonb not null default '[]'::jsonb check (jsonb_typeof(adjustments) = 'array');

comment on table public.match_reports is 'One post-battle report per warband per match. status: pending (awaiting GM approval), applied, returned. Amended in place by the GM; superseded versions live in report_revisions.';

create table public.report_revisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.match_reports (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  -- the revision number this row preserves (1 = the original filing)
  revision integer not null,
  replaced_at timestamptz not null default now(),
  replaced_by uuid references auth.users (id) on delete set null,
  note text not null default '',
  -- the superseded report row as jsonb (undo omitted)
  report jsonb not null check (jsonb_typeof(report) = 'object')
);
create index report_revisions_report_idx on public.report_revisions (report_id, revision);
alter table public.report_revisions
  add constraint report_revisions_replaced_by_profile_fkey
  foreign key (replaced_by) references public.profiles (user_id) on delete set null;
alter table public.report_revisions enable row level security;
create policy report_revisions_select on public.report_revisions
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));
-- Inserts happen only inside the GM's amendment (security invoker), so the GM needs insert rights.
create policy report_revisions_insert_gm on public.report_revisions
  for insert to authenticated with check (public.is_campaign_gm(public.match_campaign(match_id)));

-- Reports are no longer immutable: the GM updates status / content (amend, approve, return).
create policy match_reports_update_gm on public.match_reports
  for update to authenticated
  using (public.is_campaign_gm(public.match_campaign(match_id)))
  with check (public.is_campaign_gm(public.match_campaign(match_id)));

alter table public.campaigns alter column settings set default jsonb_build_object(
  'startingGold', 500,
  'maxRosters', null,
  'houseRules', jsonb_build_object(
    'strengthArmourPiercing', false,
    'optionalCriticalTables', true,
    'halfPriceArmour', true
  ),
  'dicePolicy', 'players_roll',
  'combatMode', 'app',
  'lockCombatMode', false,
  'reportApproval', false
);
update public.campaigns set settings = settings || '{"reportApproval": false}'::jsonb where not settings ? 'reportApproval';

-- ---------------------------------------------------------------------------------------------
-- apply_battle_report(report_id): put the report's `applied` patches on the roster, recording undo.
-- Internal: called by submit / approve / amend within the same transaction. Refuses a report that
-- already carries an undo (already applied).
-- ---------------------------------------------------------------------------------------------
create or replace function public.apply_battle_report(p_report_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_report public.match_reports%rowtype;
  v_applied jsonb;
  v_row jsonb;
  v_patch jsonb;
  v_rows int;
  v_wb jsonb;
  v_before jsonb;
  v_undo_heroes jsonb := '[]'::jsonb;
  v_undo_groups jsonb := '[]'::jsonb;
  v_removed jsonb := '[]'::jsonb;
  v_stash_ids jsonb := '[]'::jsonb;
  v_advance_ids jsonb := '[]'::jsonb;
  v_new_id uuid;
  v_pool_before int;
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

  -- Treasury.
  v_wb := coalesce(v_applied -> 'warband', '{}'::jsonb);
  select veteran_pool into v_pool_before from public.warbands where id = v_report.warband_id;
  update public.warbands set
    wyrdstone = greatest(0, wyrdstone + coalesce((v_wb ->> 'wyrdstone_delta')::int, 0)),
    gold = greatest(0, gold + coalesce((v_wb ->> 'gold_delta')::int, 0)),
    veteran_pool = case when v_wb ? 'veteran_pool' then nullif(v_wb ->> 'veteran_pool', '')::int else veteran_pool end
  where id = v_report.warband_id;

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
    undo = jsonb_build_object(
      'heroes', v_undo_heroes,
      'groups', v_undo_groups,
      'warband', jsonb_build_object('wyrdstone_delta', coalesce((v_wb ->> 'wyrdstone_delta')::int, 0), 'gold_delta', coalesce((v_wb ->> 'gold_delta')::int, 0), 'veteran_pool_before', v_pool_before),
      'stash_item_ids', v_stash_ids,
      'removed_items', v_removed,
      'pending_advance_ids', v_advance_ids
    )
  where id = p_report_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- revert_battle_report(report_id): undo what apply did. Refused while an advance this report
-- created has been rolled or resolved (the GM undoes those first, by hand).
-- ---------------------------------------------------------------------------------------------
create or replace function public.revert_battle_report(p_report_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_report public.match_reports%rowtype;
  v_undo jsonb;
  v_row jsonb;
  v_wb jsonb;
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

-- ---------------------------------------------------------------------------------------------
-- complete_match_if_reported(match_id): completed once every participant's report is applied.
-- ---------------------------------------------------------------------------------------------
create or replace function public.complete_match_if_reported(p_match_id uuid)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_pending int;
begin
  select count(*) into v_pending
    from public.match_participants mp
   where mp.match_id = p_match_id
     and not exists (select 1 from public.match_reports r where r.match_id = mp.match_id and r.warband_id = mp.warband_id and r.status = 'applied');
  if v_pending = 0 then
    update public.matches set state = 'completed', completed_at = now() where id = p_match_id and state <> 'completed';
    return 'completed';
  end if;
  update public.matches set state = 'awaiting_reports', completed_at = null where id = p_match_id and state = 'completed';
  return 'awaiting_reports';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- submit_battle_report(match, warband, report, amend_note): file, refile a returned report, or
-- (GM, with a note) amend a filed one.
-- ---------------------------------------------------------------------------------------------
drop function public.submit_battle_report(uuid, uuid, jsonb);
create function public.submit_battle_report(p_match_id uuid, p_warband_id uuid, p_report jsonb, p_amend_note text default null)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_state public.match_state;
  v_existing public.match_reports%rowtype;
  v_report_id uuid;
  v_gm boolean;
  v_settings jsonb;
  v_needs_approval boolean;
  v_status text;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if jsonb_typeof(p_report) <> 'object' then
    raise exception 'report must be an object' using errcode = '22023';
  end if;

  select state into v_state from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.match_participants mp where mp.match_id = p_match_id and mp.warband_id = p_warband_id) then
    raise exception 'that warband did not take part in this match' using errcode = 'P0002';
  end if;
  if not public.can_edit_warband(p_warband_id) then
    raise exception 'only the warband owner or the GM can file its report' using errcode = '42501';
  end if;
  v_gm := public.is_campaign_gm(public.match_campaign(p_match_id));
  select settings into v_settings from public.campaigns where id = public.match_campaign(p_match_id);
  v_needs_approval := coalesce((v_settings ->> 'reportApproval')::boolean, false) and not v_gm;
  v_status := case when v_needs_approval then 'pending' else 'applied' end;

  select * into v_existing from public.match_reports r where r.match_id = p_match_id and r.warband_id = p_warband_id;

  if v_existing.id is not null and v_existing.status <> 'returned' and p_amend_note is null then
    raise exception 'a report has already been filed for this warband; the GM can amend or withdraw it' using errcode = '23505';
  end if;
  if v_existing.id is not null and v_existing.status <> 'returned' and not v_gm then
    raise exception 'only the GM can amend a filed report' using errcode = '42501';
  end if;
  if v_existing.id is null and v_state not in ('in_progress', 'awaiting_reports') then
    raise exception 'reports can only be filed for a battle that has been fought (match is %)', v_state using errcode = 'P0001';
  end if;

  perform set_config('stirheim.audit_reason', case when v_existing.id is not null and v_existing.status <> 'returned' then 'amend_report' else 'post_battle' end, true);

  if v_state = 'in_progress' then
    update public.matches set state = 'awaiting_reports' where id = p_match_id;
  end if;

  if v_existing.id is not null and v_existing.status = 'returned' then
    -- A returned report is replaced outright; the returned version is kept in the log.
    insert into public.report_revisions (report_id, match_id, warband_id, revision, replaced_by, note, report)
    values (v_existing.id, p_match_id, p_warband_id, v_existing.revision, v_uid, coalesce(v_existing.review_note, ''), to_jsonb(v_existing) - 'undo');
  elsif v_existing.id is not null then
    -- Amendment: keep the old version, undo its roster effects, then overwrite below.
    insert into public.report_revisions (report_id, match_id, warband_id, revision, replaced_by, note, report)
    values (v_existing.id, p_match_id, p_warband_id, v_existing.revision, v_uid, coalesce(p_amend_note, ''), to_jsonb(v_existing) - 'undo');
    perform public.revert_battle_report(v_existing.id);
  end if;

  if v_existing.id is null then
    insert into public.match_reports (match_id, warband_id, submitted_by, won, result, routed, xp_log, ooa, injuries, loot, exploration, veteran_pool_roll, notes, adjustments, applied, status)
    values (
      p_match_id, p_warband_id, v_uid,
      coalesce((p_report ->> 'won')::boolean, false),
      coalesce(p_report ->> 'result', 'lost'),
      coalesce((p_report ->> 'routed')::boolean, false),
      coalesce(p_report -> 'xp_log', '[]'::jsonb),
      coalesce(p_report -> 'ooa', '[]'::jsonb),
      coalesce(p_report -> 'injuries', '[]'::jsonb),
      coalesce(p_report -> 'loot', '{}'::jsonb),
      case when jsonb_typeof(p_report -> 'exploration') = 'object' then p_report -> 'exploration' else '{}'::jsonb end,
      nullif(p_report ->> 'veteran_pool_roll', '')::int,
      coalesce(p_report ->> 'notes', ''),
      coalesce(p_report -> 'adjustments', '[]'::jsonb),
      coalesce(p_report -> 'applied', '{}'::jsonb),
      'pending'
    )
    returning id into v_report_id;
  else
    v_report_id := v_existing.id;
    update public.match_reports set
      won = coalesce((p_report ->> 'won')::boolean, false),
      result = coalesce(p_report ->> 'result', 'lost'),
      routed = coalesce((p_report ->> 'routed')::boolean, false),
      xp_log = coalesce(p_report -> 'xp_log', '[]'::jsonb),
      ooa = coalesce(p_report -> 'ooa', '[]'::jsonb),
      injuries = coalesce(p_report -> 'injuries', '[]'::jsonb),
      loot = coalesce(p_report -> 'loot', '{}'::jsonb),
      exploration = case when jsonb_typeof(p_report -> 'exploration') = 'object' then p_report -> 'exploration' else '{}'::jsonb end,
      veteran_pool_roll = nullif(p_report ->> 'veteran_pool_roll', '')::int,
      notes = coalesce(p_report ->> 'notes', ''),
      adjustments = coalesce(p_report -> 'adjustments', '[]'::jsonb),
      applied = coalesce(p_report -> 'applied', '{}'::jsonb),
      status = 'pending',
      review_note = null,
      revision = case when v_existing.status = 'returned' then revision + 1 else revision + 1 end,
      amended_at = case when v_existing.status = 'returned' then amended_at else now() end,
      amended_by = case when v_existing.status = 'returned' then amended_by else v_uid end,
      amendment_note = case when v_existing.status = 'returned' then amendment_note else p_amend_note end,
      submitted_by = case when v_existing.status = 'returned' then v_uid else submitted_by end,
      submitted_at = case when v_existing.status = 'returned' then now() else submitted_at end
    where id = v_existing.id;
  end if;

  if v_status = 'applied' then
    perform public.apply_battle_report(v_report_id);
  end if;

  return public.complete_match_if_reported(p_match_id);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- approve_battle_report / return_battle_report: the GM reviews a pending report.
-- ---------------------------------------------------------------------------------------------
create or replace function public.approve_battle_report(p_report_id uuid)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_report public.match_reports%rowtype;
begin
  select * into v_report from public.match_reports where id = p_report_id;
  if v_report.id is null then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
  if not public.is_campaign_gm(public.match_campaign(v_report.match_id)) then
    raise exception 'only the GM can approve a report' using errcode = '42501';
  end if;
  if v_report.status <> 'pending' then
    raise exception 'this report is not awaiting approval' using errcode = 'P0001';
  end if;
  perform set_config('stirheim.audit_reason', 'approve_report', true);
  perform public.apply_battle_report(p_report_id);
  update public.match_reports set review_note = null where id = p_report_id;
  return public.complete_match_if_reported(v_report.match_id);
end;
$$;

create or replace function public.return_battle_report(p_report_id uuid, p_note text)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_report public.match_reports%rowtype;
begin
  select * into v_report from public.match_reports where id = p_report_id;
  if v_report.id is null then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
  if not public.is_campaign_gm(public.match_campaign(v_report.match_id)) then
    raise exception 'only the GM can return a report' using errcode = '42501';
  end if;
  if v_report.status <> 'pending' then
    raise exception 'only a report awaiting approval can be returned' using errcode = 'P0001';
  end if;
  perform set_config('stirheim.audit_reason', 'return_report', true);
  update public.match_reports set status = 'returned', review_note = nullif(trim(coalesce(p_note, '')), '') where id = p_report_id;
  return public.complete_match_if_reported(v_report.match_id);
end;
$$;

-- withdraw now undoes the roster effects first, then deletes the report and its revisions.
create or replace function public.withdraw_battle_report(p_match_id uuid, p_warband_id uuid)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_campaign uuid;
  v_id uuid;
begin
  v_campaign := public.match_campaign(p_match_id);
  if not public.is_campaign_gm(v_campaign) then
    raise exception 'only the GM can withdraw a report' using errcode = '42501';
  end if;
  select id into v_id from public.match_reports where match_id = p_match_id and warband_id = p_warband_id;
  if v_id is null then
    raise exception 'no report to withdraw' using errcode = 'P0002';
  end if;
  perform set_config('stirheim.audit_reason', 'withdraw_report', true);
  perform public.revert_battle_report(v_id);
  delete from public.match_reports where id = v_id;
  update public.matches set state = 'awaiting_reports', completed_at = null where id = p_match_id and state = 'completed';
  return 'awaiting_reports';
end;
$$;

revoke all on function public.apply_battle_report(uuid) from public;
revoke all on function public.revert_battle_report(uuid) from public;
revoke all on function public.complete_match_if_reported(uuid) from public;
revoke all on function public.submit_battle_report(uuid, uuid, jsonb, text) from public;
revoke all on function public.approve_battle_report(uuid) from public;
revoke all on function public.return_battle_report(uuid, text) from public;
grant execute on function public.apply_battle_report(uuid) to authenticated;
grant execute on function public.revert_battle_report(uuid) to authenticated;
grant execute on function public.complete_match_if_reported(uuid) to authenticated;
grant execute on function public.submit_battle_report(uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.approve_battle_report(uuid) to authenticated;
grant execute on function public.return_battle_report(uuid, text) to authenticated;
