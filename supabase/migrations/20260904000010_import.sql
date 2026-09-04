-- Stirheim - Campaign Ledger. Phase 9 (2 of 2): importing battle records from another tracker.
--
-- import_battle_records writes historical matches, participants and reports for a campaign in
-- one transaction. It is SECURITY INVOKER: RLS from migration 2 still applies, so the matches
-- insert policy is widened here to accept created_via = 'import' from the GM. Rosters are NOT
-- touched: imported reports carry summary experience and casualty totals only (the players
-- re-enter their warbands by hand), and no pending advances or treasury changes follow.

-- ---------------------------------------------------------------------------------------------
-- matches_insert: the GM may also insert 'import' rows (see 20260904000002_rls.sql).
-- ---------------------------------------------------------------------------------------------

drop policy if exists matches_insert on public.matches;
create policy matches_insert on public.matches
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (created_via in ('gm', 'import') and public.is_campaign_gm(campaign_id))
      or (created_via = 'challenge' and public.is_campaign_member(campaign_id))
    )
  );

-- ---------------------------------------------------------------------------------------------
-- import_battle_records(campaign_id, matches) -> number of matches created.
--
-- p_matches is a JSON array of
--   { scenario_rules_id?: string|null, scenario_name?: string, played_at: timestamptz,
--     notes?: string,
--     participants: [{ warband_id: uuid, won?: bool, result: 'won'|'lost'|'draw',
--                      xp_gained?: int, casualties?: int, notes?: string }] }
--
-- Each element becomes one completed match (scheduled_for = started_at = completed_at =
-- played_at, created_via 'import'), one accepted participant per warband and one report per
-- participant filed by the importing GM at played_at. When no scenario_rules_id is given the
-- scenario name is kept at the top of the match notes. Experience and casualties are stored as
-- one summary line each in xp_log / ooa, shaped like the wizard's lines (src/domain/report.ts)
-- so the records page and standings add them up.
--
-- Every participant must be an active member of the campaign; otherwise the whole import is
-- rolled back with an error naming the warband.
-- ---------------------------------------------------------------------------------------------
create or replace function public.import_battle_records(p_campaign_id uuid, p_matches jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_match jsonb;
  v_part jsonb;
  v_match_id uuid;
  v_played timestamptz;
  v_scenario text;
  v_scenario_name text;
  v_notes text;
  v_wb uuid;
  v_result text;
  v_won boolean;
  v_xp int;
  v_dead int;
  v_seen uuid[];
  v_count int := 0;
  v_index int := 0;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if not public.is_campaign_gm(p_campaign_id) then
    raise exception 'only the GM can import battle records' using errcode = '42501';
  end if;
  if p_matches is null or jsonb_typeof(p_matches) <> 'array' then
    raise exception 'matches must be an array' using errcode = '22023';
  end if;

  perform set_config('stirheim.audit_reason', 'import', true);

  for v_match in select * from jsonb_array_elements(p_matches) loop
    v_index := v_index + 1;
    if jsonb_typeof(v_match) <> 'object' then
      raise exception 'match % must be an object', v_index using errcode = '22023';
    end if;
    if jsonb_typeof(v_match -> 'participants') <> 'array' or jsonb_array_length(v_match -> 'participants') = 0 then
      raise exception 'match % needs at least one participant', v_index using errcode = '22023';
    end if;

    begin
      v_played := (v_match ->> 'played_at')::timestamptz;
    exception when others then
      raise exception 'match % has an unreadable date (%)', v_index, v_match ->> 'played_at' using errcode = '22023';
    end;
    if v_played is null then
      raise exception 'match % has no date', v_index using errcode = '22023';
    end if;

    v_scenario := nullif(trim(coalesce(v_match ->> 'scenario_rules_id', '')), '');
    v_scenario_name := nullif(trim(coalesce(v_match ->> 'scenario_name', '')), '');
    v_notes := coalesce(v_match ->> 'notes', '');
    if v_scenario is null and v_scenario_name is not null then
      v_notes := 'Scenario: ' || v_scenario_name || case when v_notes <> '' then E'\n' || v_notes else '' end;
    end if;

    -- Check every participant before writing anything for this match.
    v_seen := '{}';
    for v_part in select * from jsonb_array_elements(v_match -> 'participants') loop
      begin
        v_wb := (v_part ->> 'warband_id')::uuid;
      exception when others then
        raise exception 'match %: participant warband id is not a uuid', v_index using errcode = '22023';
      end;
      if v_wb is null then
        raise exception 'match %: participant without a warband', v_index using errcode = '22023';
      end if;
      if v_wb = any (v_seen) then
        raise exception 'match %: the same warband is listed twice', v_index using errcode = '22023';
      end if;
      v_seen := v_seen || v_wb;
      if not exists (
        select 1 from public.campaign_members m
         where m.campaign_id = p_campaign_id and m.warband_id = v_wb and m.left_at is null
      ) then
        raise exception 'warband % is not an active member of this campaign', v_wb using errcode = '22023';
      end if;
      v_result := coalesce(nullif(v_part ->> 'result', ''), case when (v_part ->> 'won')::boolean then 'won' else 'lost' end);
      if v_result not in ('won', 'lost', 'draw') then
        raise exception 'match %: result must be won, lost or draw (got %)', v_index, v_result using errcode = '22023';
      end if;
    end loop;

    -- The reports insert policy needs a match that is being fought, so complete it afterwards.
    insert into public.matches (campaign_id, scenario_rules_id, state, created_by, created_via, scheduled_for, started_at, completed_at, notes)
    values (p_campaign_id, v_scenario, 'awaiting_reports', v_uid, 'import', v_played, v_played, v_played, v_notes)
    returning id into v_match_id;

    for v_part in select * from jsonb_array_elements(v_match -> 'participants') loop
      v_wb := (v_part ->> 'warband_id')::uuid;
      v_result := coalesce(nullif(v_part ->> 'result', ''), case when (v_part ->> 'won')::boolean then 'won' else 'lost' end);
      v_won := coalesce((v_part ->> 'won')::boolean, v_result = 'won');
      v_xp := nullif(trim(coalesce(v_part ->> 'xp_gained', '')), '')::int;
      v_dead := nullif(trim(coalesce(v_part ->> 'casualties', '')), '')::int;

      insert into public.match_participants (match_id, warband_id, invited_at, accepted_at)
      values (v_match_id, v_wb, v_played, v_played);

      insert into public.match_reports (match_id, warband_id, submitted_by, won, result, xp_log, ooa, notes, submitted_at)
      values (
        v_match_id, v_wb, v_uid, v_won, v_result,
        case when v_xp is not null then jsonb_build_array(jsonb_build_object(
          'subjectType', 'group', 'subjectId', 'import', 'subjectName', 'Warband total (imported)',
          'amount', v_xp, 'reasons', jsonb_build_array('Imported battle record'),
          'xpBefore', 0, 'xpAfter', greatest(v_xp, 0), 'advancesEarned', 0
        )) else '[]'::jsonb end,
        case when coalesce(v_dead, 0) > 0 then jsonb_build_array(jsonb_build_object(
          'subjectType', 'group', 'subjectId', 'import', 'subjectName', 'Casualties (imported)', 'count', v_dead
        )) else '[]'::jsonb end,
        coalesce(v_part ->> 'notes', ''),
        v_played
      );
    end loop;

    update public.matches set state = 'completed', completed_at = v_played where id = v_match_id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function public.import_battle_records(uuid, jsonb) is
  'GM only. Insert historical matches (created_via import, state completed), their participants and one summary report per participant from a JSON array; rosters are not changed. Returns the number of matches created.';

revoke all on function public.import_battle_records(uuid, jsonb) from public;
grant execute on function public.import_battle_records(uuid, jsonb) to authenticated;
