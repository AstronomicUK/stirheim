-- Stirheim - Campaign Ledger. Phase 6: match lifecycle.
--
--   scheduled -> in_progress -> awaiting_reports -> completed
--        \-> cancelled                 (completed happens in Phase 7 when every report is in)
--
-- All functions are SECURITY INVOKER: RLS from migration 2 decides who may touch a match. They
-- exist so that a transition and its side effects (participants, timestamps) happen atomically
-- and are checked against the current state.

-- Embed creator and owner names.
alter table public.matches
  add constraint matches_created_by_profile_fkey
  foreign key (created_by) references public.profiles (user_id) on delete restrict;
alter table public.warbands
  add constraint warbands_owner_profile_fkey
  foreign key (owner_id) references public.profiles (user_id) on delete cascade;

-- ---------------------------------------------------------------------------------------------
-- schedule_match: the GM books a game (all participants pre-accepted) or a member issues a
-- challenge (their own warband accepted, the others invited). Returns the match id.
-- ---------------------------------------------------------------------------------------------
create or replace function public.schedule_match(
  p_campaign_id uuid,
  p_warband_ids uuid[],
  p_scenario_rules_id text default null,
  p_custom_scenario_id uuid default null,
  p_scheduled_for timestamptz default null,
  p_notes text default ''
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_gm boolean;
  v_match_id uuid;
  v_wb uuid;
  v_owned int;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if coalesce(array_length(p_warband_ids, 1), 0) < 2 then
    raise exception 'a match needs at least two warbands' using errcode = '22023';
  end if;
  if (select count(distinct w) from unnest(p_warband_ids) w) <> array_length(p_warband_ids, 1) then
    raise exception 'the same warband is listed twice' using errcode = '22023';
  end if;
  if num_nonnulls(p_scenario_rules_id, p_custom_scenario_id) > 1 then
    raise exception 'pick either a built-in or a custom scenario, not both' using errcode = '22023';
  end if;

  -- Every warband must be an active member of this campaign.
  if exists (
    select 1 from unnest(p_warband_ids) w
     where not exists (
       select 1 from public.campaign_members m
        where m.campaign_id = p_campaign_id and m.warband_id = w and m.left_at is null
     )
  ) then
    raise exception 'every warband must be enrolled in this campaign' using errcode = '22023';
  end if;

  v_is_gm := public.is_campaign_gm(p_campaign_id);
  if not v_is_gm then
    -- A challenge must include exactly one of the challenger's own warbands.
    select count(*) into v_owned
      from public.warbands w
     where w.id = any (p_warband_ids) and w.owner_id = v_uid;
    if v_owned <> 1 then
      raise exception 'a challenge must include exactly one of your own warbands' using errcode = '42501';
    end if;
  end if;

  perform set_config('stirheim.audit_reason', case when v_is_gm then 'schedule' else 'challenge' end, true);

  insert into public.matches (campaign_id, scenario_rules_id, custom_scenario_id, created_by, created_via, scheduled_for, notes)
  values (p_campaign_id, p_scenario_rules_id, p_custom_scenario_id, v_uid,
          case when v_is_gm then 'gm'::public.match_origin else 'challenge'::public.match_origin end,
          p_scheduled_for, coalesce(p_notes, ''))
  returning id into v_match_id;

  foreach v_wb in array p_warband_ids loop
    insert into public.match_participants (match_id, warband_id, accepted_at)
    values (
      v_match_id,
      v_wb,
      case
        when v_is_gm then now()
        when exists (select 1 from public.warbands w where w.id = v_wb and w.owner_id = v_uid) then now()
        else null
      end
    );
  end loop;

  return v_match_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- respond_to_challenge: accept, or decline (which drops the warband; a match left with fewer
-- than two participants is cancelled).
-- ---------------------------------------------------------------------------------------------
create or replace function public.respond_to_challenge(p_match_id uuid, p_warband_id uuid, p_accept boolean)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_remaining int;
begin
  select state into v_state from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state <> 'scheduled' then
    raise exception 'this match is %, so there is nothing to respond to', v_state using errcode = 'P0001';
  end if;
  if not public.owns_warband(p_warband_id) and not public.is_campaign_gm(public.match_campaign(p_match_id)) then
    raise exception 'only the warband owner (or the GM) can respond' using errcode = '42501';
  end if;

  perform set_config('stirheim.audit_reason', case when p_accept then 'accept_challenge' else 'decline_challenge' end, true);

  if p_accept then
    update public.match_participants set accepted_at = coalesce(accepted_at, now())
     where match_id = p_match_id and warband_id = p_warband_id;
    if not found then
      raise exception 'that warband is not part of this match' using errcode = 'P0002';
    end if;
    return 'scheduled';
  end if;

  delete from public.match_participants where match_id = p_match_id and warband_id = p_warband_id;
  if not found then
    raise exception 'that warband is not part of this match' using errcode = 'P0002';
  end if;
  select count(*) into v_remaining from public.match_participants where match_id = p_match_id;
  if v_remaining < 2 then
    update public.matches set state = 'cancelled', completed_at = now() where id = p_match_id;
    return 'cancelled';
  end if;
  return 'scheduled';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- start_match: any participant or the GM, once everyone has accepted. scheduled -> in_progress.
-- ---------------------------------------------------------------------------------------------
create or replace function public.start_match(p_match_id uuid)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_pending int;
begin
  select state into v_state from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state <> 'scheduled' then
    raise exception 'this match is already %', v_state using errcode = 'P0001';
  end if;
  if not public.is_match_participant(p_match_id) and not public.is_campaign_gm(public.match_campaign(p_match_id)) then
    raise exception 'only a participant or the GM can start the battle' using errcode = '42501';
  end if;
  select count(*) into v_pending from public.match_participants where match_id = p_match_id and accepted_at is null;
  if v_pending > 0 then
    raise exception '% warband(s) have not accepted yet', v_pending using errcode = 'P0001';
  end if;
  if (select count(*) from public.match_participants where match_id = p_match_id) < 2 then
    raise exception 'a battle needs at least two warbands' using errcode = 'P0001';
  end if;

  perform set_config('stirheim.audit_reason', 'start_match', true);
  update public.matches set state = 'in_progress', started_at = now() where id = p_match_id;
  return 'in_progress';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- end_match: the table agrees the battle is over. in_progress -> awaiting_reports.
-- ---------------------------------------------------------------------------------------------
create or replace function public.end_match(p_match_id uuid)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_state public.match_state;
begin
  select state into v_state from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state <> 'in_progress' then
    raise exception 'this match is %, not in progress', v_state using errcode = 'P0001';
  end if;
  if not public.is_match_participant(p_match_id) and not public.is_campaign_gm(public.match_campaign(p_match_id)) then
    raise exception 'only a participant or the GM can end the battle' using errcode = '42501';
  end if;
  perform set_config('stirheim.audit_reason', 'end_match', true);
  update public.matches set state = 'awaiting_reports' where id = p_match_id;
  return 'awaiting_reports';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- cancel_match: the GM at any time before completion; the creator while still scheduled.
-- ---------------------------------------------------------------------------------------------
create or replace function public.cancel_match(p_match_id uuid)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_creator uuid;
  v_campaign uuid;
begin
  select state, created_by, campaign_id into v_state, v_creator, v_campaign from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state in ('completed', 'cancelled') then
    raise exception 'this match is already %', v_state using errcode = 'P0001';
  end if;
  if not public.is_campaign_gm(v_campaign) and not (v_creator = (select auth.uid()) and v_state = 'scheduled') then
    raise exception 'only the GM (or the creator, before it starts) can cancel' using errcode = '42501';
  end if;
  perform set_config('stirheim.audit_reason', 'cancel_match', true);
  update public.matches set state = 'cancelled', completed_at = now() where id = p_match_id;
  return 'cancelled';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- save_battle_session: upsert your live sheet for an in-progress match. Direct table writes
-- would also pass RLS; the function adds the state check so a finished match cannot change.
-- ---------------------------------------------------------------------------------------------
create or replace function public.save_battle_session(p_match_id uuid, p_warband_id uuid, p_live_state jsonb)
returns timestamptz
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_updated timestamptz;
begin
  select state into v_state from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state not in ('in_progress', 'awaiting_reports') then
    raise exception 'the battle sheet is only editable while the match is in progress' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_live_state) <> 'object' then
    raise exception 'live_state must be an object' using errcode = '22023';
  end if;
  insert into public.battle_sessions (match_id, warband_id, live_state)
  values (p_match_id, p_warband_id, p_live_state)
  on conflict (match_id, warband_id) do update set live_state = excluded.live_state
  returning updated_at into v_updated;
  return v_updated;
end;
$$;

revoke all on function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text) from public;
revoke all on function public.respond_to_challenge(uuid, uuid, boolean) from public;
revoke all on function public.start_match(uuid) from public;
revoke all on function public.end_match(uuid) from public;
revoke all on function public.cancel_match(uuid) from public;
revoke all on function public.save_battle_session(uuid, uuid, jsonb) from public;
grant execute on function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text) to authenticated;
grant execute on function public.respond_to_challenge(uuid, uuid, boolean) to authenticated;
grant execute on function public.start_match(uuid) to authenticated;
grant execute on function public.end_match(uuid) to authenticated;
grant execute on function public.cancel_match(uuid) to authenticated;
grant execute on function public.save_battle_session(uuid, uuid, jsonb) to authenticated;
