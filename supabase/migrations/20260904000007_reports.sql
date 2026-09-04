-- Stirheim - Campaign Ledger. Phase 7: post-battle reports.
--
-- submit_battle_report stores the report and applies the roster patches the client resolved
-- (see src/domain/report.ts for the shape) in one transaction, creates pending advances, and
-- completes the match when every participant has reported. SECURITY INVOKER: RLS still decides
-- who may file for which warband (the owner, or the GM on their behalf).

alter table public.match_reports
  add column applied jsonb not null default '{}'::jsonb check (jsonb_typeof(applied) = 'object'),
  add column result text not null default 'lost' check (result in ('won', 'lost', 'draw')),
  add column routed boolean not null default false;

comment on column public.match_reports.applied is 'ReportApplied: the roster patches applied when this report was filed.';

create or replace function public.submit_battle_report(p_match_id uuid, p_warband_id uuid, p_report jsonb)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_state public.match_state;
  v_applied jsonb;
  v_row jsonb;
  v_patch jsonb;
  v_rows int;
  v_wb jsonb;
  v_pending int;
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
  if v_state not in ('in_progress', 'awaiting_reports') then
    raise exception 'reports can only be filed for a battle that has been fought (match is %)', v_state using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.match_participants mp where mp.match_id = p_match_id and mp.warband_id = p_warband_id) then
    raise exception 'that warband did not take part in this match' using errcode = 'P0002';
  end if;
  if not public.can_edit_warband(p_warband_id) then
    raise exception 'only the warband owner or the GM can file its report' using errcode = '42501';
  end if;
  if exists (select 1 from public.match_reports r where r.match_id = p_match_id and r.warband_id = p_warband_id) then
    raise exception 'a report has already been filed for this warband; ask the GM to remove it first' using errcode = '23505';
  end if;

  perform set_config('stirheim.audit_reason', 'post_battle', true);

  -- A battle that ended without end_match() being tapped still moves on.
  if v_state = 'in_progress' then
    update public.matches set state = 'awaiting_reports' where id = p_match_id;
  end if;

  insert into public.match_reports (match_id, warband_id, submitted_by, won, result, routed, xp_log, ooa, injuries, loot, exploration, veteran_pool_roll, notes, applied)
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
    coalesce(p_report -> 'applied', '{}'::jsonb)
  );

  v_applied := coalesce(p_report -> 'applied', '{}'::jsonb);

  -- Heroes and hired swords.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'heroes', '[]'::jsonb)) loop
    v_patch := coalesce(v_row -> 'patch', '{}'::jsonb);
    update public.heroes set
      stats = coalesce(v_patch -> 'stats', stats),
      xp = coalesce((v_patch ->> 'xp')::int, xp),
      level_ups = coalesce((v_patch ->> 'level_ups')::int, level_ups),
      injuries = coalesce(v_patch -> 'injuries', injuries),
      flags = coalesce(v_patch -> 'flags', flags),
      status = coalesce((v_patch ->> 'status')::public.warrior_status, status)
    where id = (v_row ->> 'id')::uuid and warband_id = p_warband_id;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'hero % is not in this warband', v_row ->> 'id' using errcode = 'P0002';
    end if;
  end loop;

  -- Henchman groups.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'groups', '[]'::jsonb)) loop
    v_patch := coalesce(v_row -> 'patch', '{}'::jsonb);
    update public.henchman_groups set
      size = coalesce((v_patch ->> 'size')::int, size),
      xp = coalesce((v_patch ->> 'xp')::int, xp),
      level_ups = coalesce((v_patch ->> 'level_ups')::int, level_ups)
    where id = (v_row ->> 'id')::uuid and warband_id = p_warband_id;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'henchman group % is not in this warband', v_row ->> 'id' using errcode = 'P0002';
    end if;
  end loop;

  -- Treasury.
  v_wb := coalesce(v_applied -> 'warband', '{}'::jsonb);
  update public.warbands set
    wyrdstone = greatest(0, wyrdstone + coalesce((v_wb ->> 'wyrdstone_delta')::int, 0)),
    gold = greatest(0, gold + coalesce((v_wb ->> 'gold_delta')::int, 0)),
    veteran_pool = case when v_wb ? 'veteran_pool' then nullif(v_wb ->> 'veteran_pool', '')::int else veteran_pool end
  where id = p_warband_id;

  -- Items lost to injuries; items found by exploration.
  delete from public.items
   where warband_id = p_warband_id
     and id in (select (x)::uuid from jsonb_array_elements_text(coalesce(v_applied -> 'remove_item_ids', '[]'::jsonb)) x);
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'stash_items', '[]'::jsonb)) loop
    insert into public.items (warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity)
    values (p_warband_id, 'stash', null, v_row ->> 'item_rules_id', v_row ->> 'custom_name', coalesce((v_row ->> 'quantity')::int, 1));
  end loop;

  -- Advances owed.
  for v_row in select * from jsonb_array_elements(coalesce(v_applied -> 'pending_advances', '[]'::jsonb)) loop
    insert into public.pending_advances (warband_id, subject_type, subject_id, threshold_xp)
    values (p_warband_id, (v_row ->> 'subject_type')::public.advance_subject, (v_row ->> 'subject_id')::uuid, (v_row ->> 'threshold_xp')::int);
  end loop;

  -- Complete the match once everyone has reported.
  select count(*) into v_pending
    from public.match_participants mp
   where mp.match_id = p_match_id
     and not exists (select 1 from public.match_reports r where r.match_id = mp.match_id and r.warband_id = mp.warband_id);
  if v_pending = 0 then
    update public.matches set state = 'completed', completed_at = now() where id = p_match_id;
    return 'completed';
  end if;
  return 'awaiting_reports';
end;
$$;

-- The GM removes a report so the player can file again. The roster changes it made are NOT
-- undone automatically (they are in audit_log and the report's `applied`); the GM corrects the
-- roster by hand if needed. Reopens the match.
create or replace function public.withdraw_battle_report(p_match_id uuid, p_warband_id uuid)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_campaign uuid;
begin
  v_campaign := public.match_campaign(p_match_id);
  if not public.is_campaign_gm(v_campaign) then
    raise exception 'only the GM can withdraw a report' using errcode = '42501';
  end if;
  perform set_config('stirheim.audit_reason', 'withdraw_report', true);
  delete from public.match_reports where match_id = p_match_id and warband_id = p_warband_id;
  if not found then
    raise exception 'no report to withdraw' using errcode = 'P0002';
  end if;
  update public.matches set state = 'awaiting_reports', completed_at = null where id = p_match_id and state = 'completed';
  return 'awaiting_reports';
end;
$$;

revoke all on function public.submit_battle_report(uuid, uuid, jsonb) from public;
revoke all on function public.withdraw_battle_report(uuid, uuid) from public;
grant execute on function public.submit_battle_report(uuid, uuid, jsonb) to authenticated;
grant execute on function public.withdraw_battle_report(uuid, uuid) to authenticated;

alter table public.match_reports
  add constraint match_reports_submitted_by_profile_fkey
  foreign key (submitted_by) references public.profiles (user_id) on delete restrict;
