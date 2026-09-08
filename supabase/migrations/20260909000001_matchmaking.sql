-- Matchmaking byes belong to real scheduled rounds, not a second match ledger.
-- A round's bye is counted once while at least one of its games remains non-cancelled.
alter table public.matches
  add column matchmaking_round_id uuid,
  add column matchmaking_bye_warband_id uuid references public.warbands(id) on delete set null,
  add constraint matchmaking_bye_needs_round check (matchmaking_bye_warband_id is null or matchmaking_round_id is not null);
create index matches_matchmaking_round_idx on public.matches(matchmaking_round_id) where matchmaking_round_id is not null;

drop function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text, text, boolean);
create function public.schedule_match(
  p_campaign_id uuid,
  p_warband_ids uuid[],
  p_scenario_rules_id text default null,
  p_custom_scenario_id uuid default null,
  p_scheduled_for timestamptz default null,
  p_notes text default '',
  p_district_id text default null,
  p_scenario_randomly_chosen boolean default false,
  p_matchmaking_round_id uuid default null,
  p_matchmaking_bye_warband_id uuid default null
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
    select count(*) into v_owned
      from public.warbands w
     where w.id = any (p_warband_ids) and w.owner_id = v_uid;
    if v_owned <> 1 then
      raise exception 'a challenge must include exactly one of your own warbands' using errcode = '42501';
    end if;
  end if;

  if p_matchmaking_bye_warband_id is not null and p_matchmaking_round_id is null then
    raise exception 'a bye needs a matchmaking round' using errcode = '22023';
  end if;
  if p_matchmaking_round_id is not null then
    if not v_is_gm then
      raise exception 'only the GM can schedule generated matchups' using errcode = '42501';
    end if;
    if array_length(p_warband_ids, 1) <> 2 or
       (select count(distinct owner_id) from public.warbands where id = any(p_warband_ids) and not archived) <> 2 then
      raise exception 'a generated matchup needs two active warbands with different owners' using errcode = '22023';
    end if;
    if p_matchmaking_bye_warband_id = any(p_warband_ids) or
       (p_matchmaking_bye_warband_id is not null and not exists (
         select 1 from public.campaign_members m join public.warbands w on w.id = m.warband_id
         where m.campaign_id = p_campaign_id and m.warband_id = p_matchmaking_bye_warband_id
           and m.left_at is null and not w.archived
       )) then
      raise exception 'the bye must be another active enrolled warband' using errcode = '22023';
    end if;
    -- Serialize a round: retries cannot create duplicate scheduled games, and every saved
    -- game from the round must agree on the bye. Cancelling permits scheduling it again.
    perform pg_advisory_xact_lock(hashtextextended(p_matchmaking_round_id::text, 0));
    if exists (select 1 from public.matches where matchmaking_round_id = p_matchmaking_round_id
      and (campaign_id <> p_campaign_id or matchmaking_bye_warband_id is distinct from p_matchmaking_bye_warband_id)) then
      raise exception 'the matchmaking round has different campaign or bye details' using errcode = '22023';
    end if;
    if exists (select 1 from public.matches m join public.match_participants p on p.match_id = m.id
      where m.matchmaking_round_id = p_matchmaking_round_id and m.state <> 'cancelled'
        and p.warband_id = any(p_warband_ids)) then
      raise exception 'a warband in this pairing is already scheduled in this round' using errcode = '22023';
    end if;
  end if;

  perform set_config('stirheim.audit_reason', case when v_is_gm then 'schedule' else 'challenge' end, true);

  insert into public.matches (campaign_id, scenario_rules_id, custom_scenario_id, created_by, created_via, scheduled_for, notes, district_id, scenario_randomly_chosen, matchmaking_round_id, matchmaking_bye_warband_id)
  values (p_campaign_id, p_scenario_rules_id, p_custom_scenario_id, v_uid,
          case when v_is_gm then 'gm'::public.match_origin else 'challenge'::public.match_origin end,
          p_scheduled_for, coalesce(p_notes, ''), nullif(trim(p_district_id), ''), coalesce(p_scenario_randomly_chosen, false), p_matchmaking_round_id, p_matchmaking_bye_warband_id)
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

revoke all on function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text, text, boolean, uuid, uuid) from public;
grant execute on function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text, text, boolean, uuid, uuid) to authenticated;
