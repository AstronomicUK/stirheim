-- #229 / #95 Engine of Chaos, Hashut's Reward (equipment source lines 2293–2297). The Chaos Dwarfs may
-- send captives back to the Dark Lands after a battle: the chosen captives are sacrificed and leave
-- their warbands' rosters permanently, the Engine and one Hero escort miss the next battle, and only
-- after the Hero rejoins is the reward rolled (1–3 captives: +1 XP to the leader; 4–5: D3 XP among
-- the Heroes; 6: 2D3 XP among the Heroes plus D6×5 gc).
--
-- A journey is created by the holder for one physical Engine, one escort and chosen held prisoners.
-- Anonymous prisoners (the holder's own) are reserved and travel at departure; each named prisoner
-- needs his player's consent through the ordinary captive proposal (kind 'dispatch', answered with
-- respond_captive_proposal, which now accepts that one kind on a 'held' case and refreshes the
-- server-authored proposal against the roster as it stands, so two captives from one roster can be
-- agreed one after the other). The journey departs when every consent is decided and at least one
-- captive travels: the Engine turns 'away' (101 lock), the escort is re-checked and gets the
-- roster's existing sits-out flag (flags.missNextGames, never lowered below what he already had),
-- and the reward plan is fixed from the ACTUAL captive count. Return needs a battle this warband
-- fought that STARTED after departure and is completed with the warband's report applied (never
-- calendar time, never a battle already under way). The reward is applied once: player dice and app
-- dice recorded separately, allocations validated against the plan (the +1 for 1–3 captives goes to
-- the current leader by native template or succession flag), pending advances queued at real
-- threshold boxes. Cancelling is only possible before any consent was given; otherwise the holder
-- finishes the journey with the agreed captives. A departed journey is reversed by the GM alone;
-- a returned journey (reward paid) is final and corrected by hand.

create table public.engine_journeys (
  id uuid primary key default gen_random_uuid(),
  engine_id uuid not null references public.engine_of_chaos_units (id) on delete cascade,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  escort_hero_id uuid references public.heroes (id) on delete set null,
  escort_name text not null,
  state text not null default 'pending' check (state in ('pending', 'away', 'returned', 'cancelled')),
  prisoner_ids uuid[] not null,
  -- The battle this dispatch followed (the holder's latest applied report); it can never be the missed battle.
  after_match_id uuid references public.matches (id) on delete set null,
  captive_count integer not null default 0 check (captive_count between 0 and 6),
  plan jsonb not null default '{}'::jsonb,
  dispatched_by uuid references auth.users (id),
  dispatched_at timestamptz not null default now(),
  departed_at timestamptz,
  missed_match_id uuid references public.matches (id) on delete set null,
  returned_at timestamptz,
  returned_by uuid references auth.users (id),
  reward jsonb not null default '{}'::jsonb,
  advance_ids uuid[] not null default '{}',
  history jsonb not null default '[]'::jsonb
);
comment on table public.engine_journeys is 'Hashut''s Reward journeys: one Engine of Chaos, one escort Hero and the captives sent to the Dark Lands. Written by RPCs and triggers only.';
create index engine_journeys_engine_idx on public.engine_journeys (engine_id, state);
create index engine_journeys_warband_idx on public.engine_journeys (warband_id, state);
alter table public.engine_prisoners add column journey_id uuid references public.engine_journeys (id) on delete set null;
create index engine_prisoners_journey_idx on public.engine_prisoners (journey_id) where journey_id is not null;

alter table public.engine_journeys enable row level security;
create policy engine_journeys_select on public.engine_journeys for select to authenticated using (
  public.can_read_warband(warband_id)
  or exists (select 1 from public.engine_prisoners p where p.journey_id = engine_journeys.id and p.victim_warband_id is not null and public.can_edit_warband(p.victim_warband_id))
);
grant select on public.engine_journeys to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Helpers.
-- ---------------------------------------------------------------------------------------------
-- SQL twin of hashutRewardPlan (src/rules/resolve/engineOfChaos.ts): actual captives, never places.
create function public.engine_hashut_plan(p_captives integer) returns jsonb language sql immutable as $$
  select case
    when p_captives is null or p_captives < 1 then null
    when p_captives <= 3 then jsonb_build_object('recipient', 'leader', 'fixedXp', 1, 'd3Count', 0, 'd6GoldCount', 0, 'label', '+1 Experience for the leader')
    when p_captives <= 5 then jsonb_build_object('recipient', 'heroes', 'fixedXp', 0, 'd3Count', 1, 'd6GoldCount', 0, 'label', 'D3 Experience shared among the Heroes')
    else jsonb_build_object('recipient', 'heroes', 'fixedXp', 0, 'd3Count', 2, 'd6GoldCount', 1, 'label', '2D3 Experience shared among the Heroes plus D6×5 gold crowns')
  end;
$$;
grant execute on function public.engine_hashut_plan(integer) to authenticated;

-- The campaign GM of a warband (through its campaign membership).
create function public.is_campaign_gm_of_warband(p_warband_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.campaign_members cm join public.campaigns c on c.id = cm.campaign_id where cm.warband_id = p_warband_id and c.gm_id = auth.uid());
$$;
revoke all on function public.is_campaign_gm_of_warband(uuid) from public;

-- The current leader, as the client's currentLeader(): the native leader unit (roster limit min 1),
-- else a permanent successor carrying that leaderRoleId, else a temporary leader. Only the warband
-- types that can hold an Engine are catalogued here; extend the case list as more types need it.
create function public.warband_leader_unit(p_type_rules_id text) returns text language sql immutable as $$
  select case p_type_rules_id when 'black_dwarfs' then 'black_dwarfs_sorcerer' else null end;
$$;
create function public.warband_leader(p_warband_id uuid) returns uuid language plpgsql stable security definer set search_path = '' as $$
declare unit text; v_id uuid;
begin
  select public.warband_leader_unit(type_rules_id) into unit from public.warbands where id = p_warband_id;
  if unit is null then raise exception 'The leader of this warband type is not catalogued yet.' using errcode = 'P0001'; end if;
  select id into v_id from public.heroes where warband_id = p_warband_id and status = 'active' and not is_hired_sword and unit_type_rules_id = unit order by created_at limit 1;
  if v_id is null then select id into v_id from public.heroes where warband_id = p_warband_id and status = 'active' and not is_hired_sword and flags->>'leaderRoleId' = unit order by created_at limit 1; end if;
  if v_id is null then select id into v_id from public.heroes where warband_id = p_warband_id and status = 'active' and not is_hired_sword and coalesce((flags->>'temporaryLeader')::boolean, false) order by created_at limit 1; end if;
  return v_id;
end $$;
revoke all on function public.warband_leader(uuid) from public;

-- {warbands, heroes, henchman_groups, items} as {id, updated_at} lists, the shape p_expected takes.
create function public.captive_roster_expected(p_a uuid, p_b uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'warbands', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'updated_at', updated_at)) from public.warbands where id in (p_a, p_b)), '[]'::jsonb),
    'heroes', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'updated_at', updated_at)) from public.heroes where warband_id in (p_a, p_b)), '[]'::jsonb),
    'henchman_groups', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'updated_at', updated_at)) from public.henchman_groups where warband_id in (p_a, p_b)), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'updated_at', updated_at)) from public.items where warband_id in (p_a, p_b)), '[]'::jsonb));
$$;
revoke all on function public.captive_roster_expected(uuid, uuid) from public;

-- The victim-side change a sacrifice makes: a Hero is recorded dead (his kit is already confiscated);
-- a Man-catcher henchman already left his roster, so nothing changes.
create function public.engine_dispatch_owner_changes(p_case public.captive_cases, p_journey_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare h public.heroes%rowtype;
begin
  if p_case.subject_kind <> 'hero' then return '[]'::jsonb; end if;
  select * into h from public.heroes where id = p_case.hero_id and warband_id = p_case.victim_warband_id and status = 'captured';
  if not found then raise exception '% is no longer recorded as captured.', p_case.hero_name using errcode = 'P0001'; end if;
  return jsonb_build_array(jsonb_build_object('table', 'heroes', 'op', 'update', 'id', h.id,
           'data', jsonb_build_object('status', 'dead', 'flags', h.flags || jsonb_build_object('sacrificedToHashut', true, 'journeyId', p_journey_id))));
end $$;
revoke all on function public.engine_dispatch_owner_changes(public.captive_cases, uuid) from public;

-- The completed battle this warband fought after departure: started (or created) after the Engine
-- left, not the battle the dispatch followed, and evidenced by the warband's applied report.
create function public.engine_journey_missed_match(p_journey public.engine_journeys) returns uuid language sql stable security definer set search_path = '' as $$
  select m.id from public.match_reports r join public.matches m on m.id = r.match_id
   where p_journey.departed_at is not null and r.warband_id = p_journey.warband_id and r.undo is not null and m.state = 'completed'
     and m.id is distinct from p_journey.after_match_id
     and coalesce(m.started_at, m.created_at) > p_journey.departed_at
   order by coalesce(m.completed_at, r.submitted_at), m.id limit 1;
$$;
revoke all on function public.engine_journey_missed_match(public.engine_journeys) from public;

create function public.engine_journeys_for_warband(p_warband_id uuid)
returns table (journey public.engine_journeys, missed_match_id uuid, missed_match_label text, ready_to_return boolean, leader_id uuid)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_read_warband(p_warband_id) then return; end if;
  return query
    select j, mm.id,
           case when mm.id is null then null else coalesce(nullif(mm.scenario_rules_id, ''), 'Battle') || ' (' || to_char(coalesce(mm.completed_at, mm.started_at, mm.created_at), 'DD Mon YYYY') || ')' end,
           j.state = 'away' and mm.id is not null,
           case when j.warband_id = p_warband_id and j.state = 'away' then public.warband_leader(j.warband_id) else null end
      from public.engine_journeys j
      left join lateral (select m.* from public.matches m where m.id = public.engine_journey_missed_match(j)) mm on true
     where j.warband_id = p_warband_id
        or exists (select 1 from public.engine_prisoners p where p.journey_id = j.id and p.victim_warband_id = p_warband_id)
     order by j.dispatched_at desc;
end $$;
revoke all on function public.engine_journeys_for_warband(uuid) from public;
grant execute on function public.engine_journeys_for_warband(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Departure and settlement. A journey departs once no named captive is still undecided and at
-- least one captive travels; otherwise it is cancelled with everyone still held.
-- ---------------------------------------------------------------------------------------------
create function public.engine_journey_settle(p_journey_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare j public.engine_journeys%rowtype; e public.engine_of_chaos_units%rowtype; h public.heroes%rowtype; undecided int; travelling int; v_names text; had_flag int;
begin
  select * into j from public.engine_journeys where id = p_journey_id for update;
  if not found or j.state <> 'pending' then return; end if;
  select count(*) filter (where state = 'held' and case_id is not null), count(*) filter (where state = 'dispatched' or (state = 'held' and case_id is null))
    into undecided, travelling from public.engine_prisoners where journey_id = j.id;
  if undecided > 0 then return; end if;
  if travelling = 0 then
    update public.engine_prisoners set journey_id = null where journey_id = j.id;
    update public.engine_journeys set state = 'cancelled', history = history || jsonb_build_object('event', 'cancelled', 'at', now(), 'reason', 'Every captive''s player refused the sacrifice.') where id = j.id;
    return;
  end if;
  select * into e from public.engine_of_chaos_units where id = j.engine_id;
  perform id from public.items where id = e.inventory_item_id for update;
  perform id from public.engine_of_chaos_units where inventory_item_id = e.inventory_item_id order by id for update;
  select * into e from public.engine_of_chaos_units where id = j.engine_id;
  if e.state <> 'present' then raise exception '% is not with the warband, so the journey cannot depart.', e.name using errcode = 'P0001'; end if;
  -- The escort is checked again at the moment of departure.
  select * into h from public.heroes where id = j.escort_hero_id and warband_id = j.warband_id and status = 'active' and not is_hired_sword for update;
  if not found then raise exception 'The escort % is no longer an active Hero of the warband; cancel the journey and choose another escort.', j.escort_name using errcode = 'P0001'; end if;
  had_flag := coalesce((h.flags->>'missNextGames')::int, 0);
  update public.engine_prisoners set state = 'dispatched', history = history || jsonb_build_object('event', 'dispatched', 'at', now(), 'by', auth.uid(), 'journey_id', j.id)
    where journey_id = j.id and state = 'held' and case_id is null;
  select string_agg(name, ', ' order by name) into v_names from public.engine_prisoners where journey_id = j.id and state = 'dispatched';
  perform set_config('stirheim.audit_reason', 'Hashut''s Reward: ' || h.name || ' escorts ' || e.name || ' to the Dark Lands with ' || v_names || ' and misses the next battle.', true);
  perform set_config('stirheim.engine_escort', '1', true);
  update public.heroes set flags = flags || jsonb_build_object('missNextGames', greatest(had_flag, 1)) where id = h.id;
  perform set_config('stirheim.engine_escort', '', true);
  update public.engine_of_chaos_units set state = 'away', history = history || jsonb_build_object('event', 'departed', 'at', now(), 'by', auth.uid(), 'journey_id', j.id, 'escort', h.name, 'captives', travelling) where id = e.id;
  update public.engine_prisoners set history = history || jsonb_build_object('event', 'departed', 'at', now(), 'journey_id', j.id) where journey_id = j.id and state = 'dispatched';
  update public.engine_journeys set state = 'away', departed_at = now(), captive_count = travelling, plan = public.engine_hashut_plan(travelling),
         prisoner_ids = (select coalesce(array_agg(id order by id), '{}') from public.engine_prisoners where journey_id = j.id and state = 'dispatched'),
         history = history || jsonb_build_object('event', 'departed', 'at', now(), 'captives', travelling, 'escort', h.name, 'escort_flag_set', had_flag = 0)
    where id = j.id;
end $$;
revoke all on function public.engine_journey_settle(uuid) from public;

-- Consent answers on 'dispatch' proposals move the prisoner and settle the journey.
create function public.engine_dispatch_on_proposal() returns trigger language plpgsql security definer set search_path = '' as $$
declare pz public.engine_prisoners%rowtype;
begin
  if new.choice->>'kind' <> 'dispatch' or old.state = new.state or new.state = 'proposed' then return new; end if;
  select * into pz from public.engine_prisoners where id = (new.choice->>'prisonerId')::uuid for update;
  if not found or pz.journey_id is distinct from (new.choice->>'journeyId')::uuid then return new; end if;
  if new.state = 'accepted' then
    update public.engine_prisoners set state = 'dispatched', history = history || jsonb_build_object('event', 'dispatched', 'at', now(), 'by', auth.uid(), 'journey_id', pz.journey_id, 'proposal_id', new.id) where id = pz.id and state = 'held';
  elsif new.state in ('rejected', 'withdrawn', 'stale') and pz.state = 'held' then
    update public.engine_prisoners set journey_id = null, history = history || jsonb_build_object('event', 'dispatch_refused', 'at', now(), 'by', auth.uid(), 'journey_id', pz.journey_id, 'proposal_state', new.state, 'reason', new.reason) where id = pz.id;
  else
    return new;
  end if;
  perform public.engine_journey_settle(pz.journey_id);
  return new;
end $$;
revoke all on function public.engine_dispatch_on_proposal() from public;
create trigger engine_dispatch_on_proposal after update of state on public.captive_proposals for each row execute function public.engine_dispatch_on_proposal();

-- While the Engine is away its escort cannot be edited back into play: the sits-out flag falls only
-- through an applied report (or a GM journey reversal), and his status stays as it is.
create function public.guard_engine_escort() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if current_setting('stirheim.engine_escort', true) = '1' or current_setting('stirheim.engine_reverse', true) = '1'
     or current_setting('stirheim.audit_reason', true) in ('post_battle', 'amend_report') or current_setting('stirheim.captive_apply', true) = '1' then return new; end if;
  if exists (select 1 from public.engine_journeys j where j.escort_hero_id = new.id and j.state = 'away') then
    if coalesce((new.flags->>'missNextGames')::int, 0) < coalesce((old.flags->>'missNextGames')::int, 0) then
      raise exception '% is escorting the Engine of Chaos to the Dark Lands; he misses the next battle and rejoins when its report is applied.', old.name using errcode = 'P0001';
    end if;
    if new.status is distinct from old.status then
      raise exception '% is escorting the Engine of Chaos to the Dark Lands; his status changes when the Engine returns (the campaign GM can reverse the journey).', old.name using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_engine_escort() from public;
create trigger guard_engine_escort before update of flags, status on public.heroes for each row execute function public.guard_engine_escort();

-- ---------------------------------------------------------------------------------------------
-- Dispatch.
-- ---------------------------------------------------------------------------------------------
create function public.dispatch_engine(p_engine_id uuid, p_escort_hero_id uuid, p_prisoner_ids uuid[], p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.engine_of_chaos_units%rowtype; w public.warbands%rowtype; h public.heroes%rowtype; j public.engine_journeys%rowtype; pz public.engine_prisoners%rowtype; c public.captive_cases%rowtype; v public.warbands%rowtype;
  ids uuid[]; v_after uuid; v_msg text; v_pid uuid; v_proposals uuid[] := '{}'; v_other_owner uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select coalesce(array_agg(distinct x), '{}') into ids from unnest(p_prisoner_ids) x;
  if cardinality(ids) = 0 then raise exception 'Choose at least one captive to send to the Dark Lands.' using errcode = '22023'; end if;
  select * into e from public.engine_of_chaos_units where id = p_engine_id and state <> 'retired';
  if not found then raise exception 'That Engine is not in the inventory.' using errcode = 'P0002'; end if;
  if not public.can_edit_warband(e.warband_id) then raise exception 'Only this warband''s player or the campaign GM sends its Engine to the Dark Lands.' using errcode = '42501'; end if;
  select * into w from public.warbands where id = e.warband_id;
  if w.type_rules_id <> 'black_dwarfs' then raise exception 'Only a Chaos Dwarf warband keeps an Engine of Chaos.' using errcode = '22023'; end if;
  perform id from public.items where id = e.inventory_item_id for update;
  perform id from public.engine_of_chaos_units where inventory_item_id = e.inventory_item_id order by id for update;
  select * into e from public.engine_of_chaos_units where id = p_engine_id;
  if e.state <> 'present' then raise exception '% is already away.', e.name using errcode = 'P0001'; end if;
  if e.updated_at is distinct from p_expected_updated_at then raise exception 'The Engine changed. Refresh its record before dispatching it.' using errcode = '40001'; end if;
  if exists (select 1 from public.engine_journeys where engine_id = e.id and state in ('pending', 'away')) then raise exception '% already has a journey under way.', e.name using errcode = 'P0001'; end if;
  select * into h from public.heroes where id = p_escort_hero_id and warband_id = w.id for update;
  if not found or h.is_hired_sword or h.status <> 'active' then raise exception 'The escort must be one of this warband''s own active Heroes (not a hired sword).' using errcode = '22023'; end if;
  if coalesce((h.flags->>'missNextGames')::int, 0) > 0 then raise exception '% is already missing the next battle and cannot count as the escort.', h.name using errcode = '22023'; end if;
  if exists (select 1 from public.engine_journeys where escort_hero_id = h.id and state in ('pending', 'away')) then raise exception '% is already escorting an Engine.', h.name using errcode = '22023'; end if;
  perform id from public.engine_prisoners where id = any(ids) order by id for update;
  if (select count(*) from public.engine_prisoners where id = any(ids) and engine_id = e.id and journey_id is null and state = 'held') <> cardinality(ids) then
    raise exception 'Every captive chosen must be held in % and not already chosen for a journey.', e.name using errcode = '22023';
  end if;
  select r.match_id into v_after from public.match_reports r where r.warband_id = w.id and r.undo is not null order by r.submitted_at desc limit 1;
  insert into public.engine_journeys (engine_id, warband_id, escort_hero_id, escort_name, prisoner_ids, after_match_id, dispatched_by, history)
    values (e.id, w.id, h.id, h.name, ids, v_after, auth.uid(), jsonb_build_array(jsonb_build_object('event', 'dispatched', 'at', now(), 'by', auth.uid(), 'escort', h.name, 'prisoners', to_jsonb(ids))))
    returning * into j;
  for pz in select * from public.engine_prisoners where id = any(ids) order by id loop
    update public.engine_prisoners set journey_id = j.id,
           history = history || jsonb_build_object('event', case when pz.case_id is null then 'dispatch_reserved' else 'dispatch_proposed' end, 'at', now(), 'by', auth.uid(), 'journey_id', j.id) where id = pz.id;
    if pz.case_id is null then continue; end if;  -- the holder's own captive travels at departure
    select * into c from public.captive_cases where id = pz.case_id for update;
    if c.state <> 'held' or c.captor_warband_id <> w.id then raise exception '% is not held by this warband any more.', pz.name using errcode = 'P0001'; end if;
    select * into v from public.warbands where id = c.victim_warband_id;
    v_msg := 'Sent to the Dark Lands. ' || pz.name || ' (' || v.name || ') is sacrificed to Hashut and removed from ' || v.name || ' permanently; '
      || case when c.subject_kind = 'hero' then 'he is recorded as dead' else 'his model already left ' || coalesce(c.model_snapshot->'group'->>'name', 'his group') end
      || ' and his confiscated equipment stays with ' || w.name || '. ' || e.name || ' and its escort ' || h.name || ' miss the next battle.';
    insert into public.captive_proposals (case_id, proposed_by_warband_id, proposed_by, choice, message, proposer_note, owner_changes, captor_changes, advances, expected)
      values (c.id, w.id, auth.uid(), jsonb_build_object('kind', 'dispatch', 'journeyId', j.id, 'prisonerId', pz.id), v_msg, '',
              public.engine_dispatch_owner_changes(c, j.id), '[]'::jsonb, '[]'::jsonb, public.captive_roster_expected(v.id, w.id))
      returning id into v_pid;
    v_proposals := v_proposals || v_pid;
    select owner_id into v_other_owner from public.warbands where id = v.id;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_other_owner, 'captive', left(pz.name || ': sacrifice to Hashut proposed by ' || w.name, 140), left(v_msg || ' Accept or reject it from your warband page.', 2000), '/warbands/' || v.id, 'captive:' || v_pid || ':proposed') on conflict do nothing;
  end loop;
  perform public.engine_journey_settle(j.id);
  select * into j from public.engine_journeys where id = j.id;
  return jsonb_build_object('journeyId', j.id, 'proposalIds', to_jsonb(v_proposals), 'departed', j.state = 'away');
end $$;
revoke all on function public.dispatch_engine(uuid, uuid, uuid[], timestamptz) from public;
grant execute on function public.dispatch_engine(uuid, uuid, uuid[], timestamptz) to authenticated;

-- The consent check for a 'dispatch' proposal (run when it is answered and again on apply).
create function public.validate_dispatch_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare j public.engine_journeys%rowtype; pz public.engine_prisoners%rowtype;
begin
  if p_case.state <> 'held' then raise exception 'Only a captive locked in an Engine of Chaos can be sent to the Dark Lands.' using errcode = 'P0001'; end if;
  select * into j from public.engine_journeys where id = (p_choice->>'journeyId')::uuid;
  if not found or j.warband_id <> p_case.captor_warband_id or j.state <> 'pending' then raise exception 'This journey is no longer waiting for consent.' using errcode = 'P0001'; end if;
  select * into pz from public.engine_prisoners where id = (p_choice->>'prisonerId')::uuid;
  if not found or pz.case_id <> p_case.id or pz.journey_id <> j.id or pz.state <> 'held' then raise exception 'This captive is not reserved for that journey.' using errcode = 'P0001'; end if;
  if jsonb_typeof(coalesce(p_captor_changes, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_captor_changes, '[]'::jsonb)) > 0 then raise exception 'The Chaos Dwarfs gain nothing until the escort returns.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_advances, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_advances, '[]'::jsonb)) > 0 then raise exception 'The sacrifice itself awards no experience.' using errcode = '22023'; end if;
  if coalesce(p_owner_changes, '[]'::jsonb) <> public.engine_dispatch_owner_changes(p_case, j.id) then
    raise exception 'The sacrifice removes the captive from his roster (a Hero is recorded as dead) and changes nothing else.' using errcode = '22023';
  end if;
  return coalesce((select message from public.captive_proposals where case_id = p_case.id and choice->>'kind' = 'dispatch' and choice->>'journeyId' = j.id::text order by created_at desc limit 1), 'Sent to the Dark Lands.');
end $$;
revoke all on function public.validate_dispatch_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;

create or replace function public.validate_captive_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb default '[]'::jsonb)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_choice) <> 'object' then raise exception 'Choose an outcome.' using errcode = '22023'; end if;
  if p_choice->>'kind' = 'kidnapped' then
    return public.validate_kidnapped_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_choice->>'kind' = 'engine_placement' then
    return public.validate_engine_placement_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_choice->>'kind' = 'dispatch' then
    return public.validate_dispatch_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_choice->>'kind' = 'exchange' and p_choice ? 'otherCaseId' then
    return public.validate_exchange_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind = 'companion' then
    return public.validate_companion_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind = 'henchman' and p_case.source = 'forced_capture' then
    return public.validate_forced_henchman_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind <> 'hero' then raise exception 'A lost henchman can only be resolved through Kidnapped!.' using errcode = '22023'; end if;
  return public.validate_core_captive_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
end $$;
revoke all on function public.validate_captive_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;

-- respond_captive_proposal (090): a 'held' case answers exactly one kind of proposal, the sacrifice,
-- and that server-authored proposal is refreshed against the rosters as they stand before it applies.
create or replace function public.respond_captive_proposal(p_proposal_id uuid, p_action text, p_reason text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare pr public.captive_proposals%rowtype; c public.captive_cases%rowtype; v_other uuid; v_gm boolean; v_proposer_owner uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_action not in ('accept', 'reject', 'withdraw') then raise exception 'Choose accept, reject or withdraw.' using errcode = '22023'; end if;
  select * into pr from public.captive_proposals where id = p_proposal_id;
  if not found then raise exception 'Proposal not found.' using errcode = 'P0002'; end if;
  select * into c from public.captive_cases where id = pr.case_id;
  perform public.lock_captive_context(c.match_id, c.victim_warband_id, c.captor_warband_id);
  select * into c from public.captive_cases where id = pr.case_id for update;
  select * into pr from public.captive_proposals where id = p_proposal_id for update;
  if pr.state <> 'proposed' then raise exception 'This proposal has already been answered.' using errcode = 'P0001'; end if;
  if not (c.state = 'open' or (c.state = 'held' and pr.choice->>'kind' = 'dispatch')) or c.captor_warband_id is null then raise exception 'This captive case is no longer open.' using errcode = 'P0001'; end if;
  v_gm := public.is_campaign_gm(public.match_campaign(c.match_id));
  v_other := case when pr.proposed_by_warband_id = c.captor_warband_id then c.victim_warband_id else c.captor_warband_id end;
  if p_action = 'withdraw' then
    if not (public.can_edit_warband(pr.proposed_by_warband_id) or v_gm) then raise exception 'Only the proposer can withdraw a proposal.' using errcode = '42501'; end if;
    update public.captive_proposals set state = 'withdrawn', responded_by = auth.uid(), resolved_at = now(), reason = btrim(p_reason) where id = pr.id;
    return;
  end if;
  if not (public.can_edit_warband(v_other) or v_gm) then
    raise exception 'Only the other warband''s player or the campaign GM can answer this proposal.' using errcode = '42501';
  end if;
  if p_action = 'reject' then
    if char_length(btrim(p_reason)) < 1 then raise exception 'Say why you are rejecting it, so the other player can propose again.' using errcode = 'P0001'; end if;
    update public.captive_proposals set state = 'rejected', responded_by = auth.uid(), resolved_at = now(), reason = btrim(p_reason) where id = pr.id;
    select owner_id into v_proposer_owner from public.warbands where id = pr.proposed_by_warband_id;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_proposer_owner, 'captive', left(c.hero_name || ': proposal rejected', 140), left(btrim(p_reason), 2000), '/warbands/' || pr.proposed_by_warband_id, 'captive:' || pr.id || ':rejected') on conflict do nothing;
    return;
  end if;
  -- Accept: the proposer's consent must still stand, and the report the case came from must be the
  -- one still applied.
  if not public.user_can_edit_warband(pr.proposed_by, pr.proposed_by_warband_id) then
    raise exception 'The player who proposed this outcome no longer controls that warband. Ask for a fresh proposal.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.match_reports where id = c.report_id and revision = c.report_revision and undo is not null) then
    raise exception 'The report that recorded this capture has changed. Review the latest report first.' using errcode = 'P0001';
  end if;
  if pr.choice->>'kind' = 'dispatch' then
    update public.captive_proposals set owner_changes = public.engine_dispatch_owner_changes(c, (pr.choice->>'journeyId')::uuid), expected = public.captive_roster_expected(c.victim_warband_id, c.captor_warband_id)
      where id = pr.id returning * into pr;
  end if;
  perform public.apply_captive_proposal(c, pr);
  update public.captive_proposals set state = 'accepted', responded_by = auth.uid(), resolved_at = now(), reason = btrim(p_reason) where id = pr.id;
  update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The case was resolved by another proposal.' where case_id = c.id and state = 'proposed';
  update public.captive_cases set state = 'resolved', resolved_at = now(), resolution_kind = pr.choice->>'kind', resolution_message = pr.message,
         history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'resolved', 'proposal_id', pr.id) where id = c.id;
  perform public.notify_captive_resolved(c, pr.message);
end $$;

-- A sacrifice is final while its journey stands (pending, away or returned): the ordinary reversal
-- defers to the journey writers. Checked up front in reverse_captive_resolution (before the roster
-- snapshot comparison) and again on the case row itself.
create function public.dispatch_journey_stands(p_case_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.engine_prisoners p join public.engine_journeys j on j.id = p.journey_id where p.case_id = p_case_id and p.state = 'dispatched' and j.state <> 'cancelled');
$$;
revoke all on function public.dispatch_journey_stands(uuid) from public;
create function public.guard_dispatch_reversal() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.state = 'resolved' and old.resolution_kind = 'dispatch' and new.state <> old.state and current_setting('stirheim.engine_reverse', true) is distinct from '1' and public.dispatch_journey_stands(old.id) then
    raise exception '% was sacrificed to Hashut on a journey that still stands. The campaign GM can reverse the journey from the Engine, which reopens this case.', old.hero_name using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.guard_dispatch_reversal() from public;
create trigger guard_dispatch_reversal before update of state on public.captive_cases for each row execute function public.guard_dispatch_reversal();
do $$
declare original text; updated text;
begin
  select pg_get_functiondef('public.reverse_captive_resolution(uuid,text,boolean)'::regprocedure) into original;
  updated := replace(original,
    $old$if c.state not in ('resolved', 'held') then raise exception 'This captive case has no recorded outcome to reverse.' using errcode = 'P0001'; end if;$old$,
    $new$if c.state not in ('resolved', 'held') then raise exception 'This captive case has no recorded outcome to reverse.' using errcode = 'P0001'; end if;
  if c.resolution_kind = 'dispatch' and current_setting('stirheim.engine_reverse', true) is distinct from '1' and public.dispatch_journey_stands(c.id) then
    raise exception '% was sacrificed to Hashut on a journey that still stands. The campaign GM can reverse the journey from the Engine, which reopens this case.', c.hero_name using errcode = 'P0001';
  end if;$new$);
  if updated = original then raise exception 'reverse_captive_resolution (102) did not have the expected state check to extend.'; end if;
  execute updated;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Cancel (before any consent), finish (depart with the agreed captives), reverse (GM, while away).
-- ---------------------------------------------------------------------------------------------
create function public.cancel_engine_journey(p_journey_id uuid, p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare j public.engine_journeys%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Explain why the journey is being cancelled.' using errcode = 'P0001'; end if;
  select * into j from public.engine_journeys where id = p_journey_id for update;
  if not found then raise exception 'Journey not found.' using errcode = 'P0002'; end if;
  if not public.can_edit_warband(j.warband_id) then raise exception 'Only this warband''s player or the campaign GM cancels its journey.' using errcode = '42501'; end if;
  if j.state <> 'pending' then raise exception 'Only a journey still waiting for consent can be cancelled (this one is %).', j.state using errcode = 'P0001'; end if;
  if exists (select 1 from public.engine_prisoners where journey_id = j.id and state = 'dispatched') then
    raise exception 'A captive''s player has already agreed to the sacrifice, which cannot be undone here. Finish the journey with the captives already agreed instead.' using errcode = 'P0001';
  end if;
  -- Cancelled first, so the withdrawn proposals' settlement trigger finds nothing pending to depart.
  update public.engine_journeys set state = 'cancelled', history = history || jsonb_build_object('event', 'cancelled', 'at', now(), 'by', auth.uid(), 'reason', btrim(p_reason)) where id = j.id;
  update public.captive_proposals set state = 'withdrawn', responded_by = auth.uid(), resolved_at = now(), reason = 'Journey cancelled: ' || btrim(p_reason)
    where state = 'proposed' and choice->>'kind' = 'dispatch' and choice->>'journeyId' = j.id::text;
  update public.engine_prisoners set journey_id = null, history = history || jsonb_build_object('event', 'journey_cancelled', 'at', now(), 'by', auth.uid(), 'journey_id', j.id, 'reason', btrim(p_reason))
    where journey_id = j.id;
end $$;
revoke all on function public.cancel_engine_journey(uuid, text) from public;
grant execute on function public.cancel_engine_journey(uuid, text) to authenticated;

create function public.finish_engine_journey(p_journey_id uuid, p_reason text default 'Departing with the captives already agreed.') returns jsonb language plpgsql security definer set search_path = '' as $$
declare j public.engine_journeys%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into j from public.engine_journeys where id = p_journey_id for update;
  if not found then raise exception 'Journey not found.' using errcode = 'P0002'; end if;
  if not public.can_edit_warband(j.warband_id) then raise exception 'Only this warband''s player or the campaign GM sends its Engine on its way.' using errcode = '42501'; end if;
  if j.state <> 'pending' then raise exception 'This journey is not waiting for consent (it is %).', j.state using errcode = 'P0001'; end if;
  if not exists (select 1 from public.engine_prisoners where journey_id = j.id and (state = 'dispatched' or (state = 'held' and case_id is null))) then
    raise exception 'No captive is agreed for this journey yet; wait for an answer or cancel it.' using errcode = 'P0001';
  end if;
  -- Withdrawing the undecided proposals un-reserves those captives (trigger) and the journey departs.
  update public.captive_proposals set state = 'withdrawn', responded_by = auth.uid(), resolved_at = now(), reason = btrim(coalesce(p_reason, ''))
    where state = 'proposed' and choice->>'kind' = 'dispatch' and choice->>'journeyId' = j.id::text;
  perform public.engine_journey_settle(j.id);
  select * into j from public.engine_journeys where id = j.id;
  return jsonb_build_object('journeyId', j.id, 'departed', j.state = 'away', 'captiveCount', j.captive_count);
end $$;
revoke all on function public.finish_engine_journey(uuid, text) from public;
grant execute on function public.finish_engine_journey(uuid, text) to authenticated;

create function public.reverse_engine_journey(p_journey_id uuid, p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare j public.engine_journeys%rowtype; e public.engine_of_chaos_units%rowtype; pz public.engine_prisoners%rowtype; flag_set boolean;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Explain why the journey is being reversed.' using errcode = 'P0001'; end if;
  select * into j from public.engine_journeys where id = p_journey_id for update;
  if not found then raise exception 'Journey not found.' using errcode = 'P0002'; end if;
  if not public.is_campaign_gm_of_warband(j.warband_id) then raise exception 'Only the campaign GM can reverse a journey that has departed.' using errcode = '42501'; end if;
  if j.state <> 'away' then raise exception 'Only a journey that is away (not yet returned) can be reversed (this one is %).', j.state using errcode = 'P0001'; end if;
  perform set_config('stirheim.engine_reverse', '1', true);
  -- Departure's own roster change (the escort's sits-out flag) is undone first, so each sacrifice's
  -- snapshot comparison sees the rosters exactly as that consent left them.
  select * into e from public.engine_of_chaos_units where id = j.engine_id;
  perform id from public.items where id = e.inventory_item_id for update;
  perform id from public.engine_of_chaos_units where inventory_item_id = e.inventory_item_id order by id for update;
  update public.engine_of_chaos_units set state = 'present', history = history || jsonb_build_object('event', 'journey_reversed', 'at', now(), 'by', auth.uid(), 'journey_id', j.id, 'reason', btrim(p_reason)) where id = e.id and state = 'away';
  perform set_config('stirheim.audit_reason', 'Journey to the Dark Lands reversed by the GM: ' || btrim(p_reason), true);
  select bool_or((x->>'escort_flag_set')::boolean) into flag_set from jsonb_array_elements(j.history) x where x->>'event' = 'departed';
  if coalesce(flag_set, false) then
    update public.heroes set flags = case when coalesce((flags->>'missNextGames')::int, 0) <= 1 then flags - 'missNextGames' else flags || jsonb_build_object('missNextGames', (flags->>'missNextGames')::int - 1) end
      where id = j.escort_hero_id and coalesce((flags->>'missNextGames')::int, 0) > 0;
  end if;
  -- Sacrifices are unwound newest first, each through its own accepted proposal's snapshot.
  for pz in select p.* from public.engine_prisoners p
             left join lateral (select resolved_at from public.captive_proposals q where q.case_id = p.case_id and q.state = 'accepted' and q.choice->>'kind' = 'dispatch' order by q.resolved_at desc limit 1) pr on true
            where p.journey_id = j.id and p.state = 'dispatched' order by pr.resolved_at desc nulls last, p.id loop
    if pz.case_id is not null and exists (select 1 from public.captive_proposals where case_id = pz.case_id and state = 'accepted' and choice->>'kind' = 'dispatch') then
      perform public.reverse_captive_resolution(pz.case_id, 'Journey reversed: ' || btrim(p_reason));
      update public.captive_cases set state = 'held', resolution_kind = 'engine_placement', resolved_at = now(),
             resolution_message = coalesce((select message from public.captive_proposals where case_id = pz.case_id and state = 'accepted' and choice->>'kind' = 'engine_placement' order by resolved_at desc limit 1), ''),
             history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'held_again', 'journey_id', j.id) where id = pz.case_id;
    end if;
    update public.engine_prisoners set state = 'held', journey_id = null, history = history || jsonb_build_object('event', 'journey_reversed', 'at', now(), 'by', auth.uid(), 'journey_id', j.id, 'reason', btrim(p_reason)) where id = pz.id;
  end loop;
  update public.engine_journeys set state = 'cancelled', history = history || jsonb_build_object('event', 'reversed', 'at', now(), 'by', auth.uid(), 'reason', btrim(p_reason)) where id = j.id;
end $$;
revoke all on function public.reverse_engine_journey(uuid, text) from public;
grant execute on function public.reverse_engine_journey(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Return and Hashut's Reward (applied once).
-- ---------------------------------------------------------------------------------------------
create function public.return_engine(p_journey_id uuid, p_reward jsonb, p_advances jsonb default '[]'::jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare
  j public.engine_journeys%rowtype; e public.engine_of_chaos_units%rowtype; w public.warbands%rowtype; v_missed uuid; plan jsonb; d3 int[]; app_d3 int[]; d6 int; app_d6 int; xp_total int; v_gold int := 0;
  alloc jsonb; a jsonb; a_hero uuid; a_xp int; seen uuid[] := '{}'; alloc_sum int := 0; leader uuid; v_leader uuid; v_ids uuid[] := '{}'; v_id uuid; a_subject uuid; a_threshold int; a_old int; a_new int; a_tags text[] := '{}'; tag text; v_names text;
  thresholds int[] := array[2, 4, 6, 8, 11, 14, 17, 20, 24, 28, 32, 36, 41, 46, 51, 57, 63, 69, 76, 83, 90, 12, 16, 22, 34, 40, 48, 56, 64, 72, 82, 92, 102, 114, 126, 138, 152, 166, 180];
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if jsonb_typeof(p_reward) <> 'object' then raise exception 'Record the reward dice and how the experience is shared.' using errcode = '22023'; end if;
  select * into j from public.engine_journeys where id = p_journey_id for update;
  if not found then raise exception 'Journey not found.' using errcode = 'P0002'; end if;
  if not public.can_edit_warband(j.warband_id) then raise exception 'Only this warband''s player or the campaign GM records the escort''s return.' using errcode = '42501'; end if;
  if j.state <> 'away' then raise exception 'This journey is not away (it is %).', j.state using errcode = 'P0001'; end if;
  v_missed := public.engine_journey_missed_match(j);
  if v_missed is null then raise exception 'The Engine and its escort return only after the warband has fought (and filed) a battle that began after they left.' using errcode = 'P0001'; end if;
  select * into w from public.warbands where id = j.warband_id for update;
  plan := j.plan;
  -- Dice: the player's results, with whatever the app rolled kept alongside.
  select coalesce(array_agg((x)::int order by o), '{}') into d3 from jsonb_array_elements_text(case when jsonb_typeof(p_reward->'d3') = 'array' then p_reward->'d3' else '[]'::jsonb end) with ordinality t(x, o);
  if cardinality(d3) <> (plan->>'d3Count')::int or exists (select 1 from unnest(d3) x where x not between 1 and 3) then
    raise exception 'Record % D3 result% (1 to 3) for the experience reward.', plan->>'d3Count', case when (plan->>'d3Count')::int = 1 then '' else 's' end using errcode = '22023';
  end if;
  if jsonb_typeof(p_reward->'appD3') = 'array' then
    select coalesce(array_agg((x)::int order by o), '{}') into app_d3 from jsonb_array_elements_text(p_reward->'appD3') with ordinality t(x, o);
    if cardinality(app_d3) <> cardinality(d3) or exists (select 1 from unnest(app_d3) x where x not between 1 and 3) then raise exception 'The app''s D3 results must match the count and range of the reward dice.' using errcode = '22023'; end if;
  end if;
  d6 := nullif(p_reward->>'d6', '')::int; app_d6 := nullif(p_reward->>'appD6', '')::int;
  if (plan->>'d6GoldCount')::int = 1 then
    if d6 is null or d6 not between 1 and 6 then raise exception 'Record a D6 for the gold reward.' using errcode = '22023'; end if;
    v_gold := 5 * d6;
  elsif d6 is not null then
    raise exception 'This number of captives does not award gold.' using errcode = '22023';
  end if;
  if app_d6 is not null and (app_d6 not between 1 and 6 or (plan->>'d6GoldCount')::int = 0) then raise exception 'The app''s D6 must be 1 to 6, and only when gold is awarded.' using errcode = '22023'; end if;
  xp_total := (plan->>'fixedXp')::int + coalesce((select sum(x) from unnest(d3) x), 0);
  -- Allocation: the current leader alone for 1–3 captives; any split among active Heroes otherwise.
  alloc := coalesce(p_reward->'allocations', '[]'::jsonb);
  if jsonb_typeof(alloc) <> 'array' or jsonb_array_length(alloc) = 0 then raise exception 'Say which Heroes receive the experience.' using errcode = '22023'; end if;
  leader := nullif(p_reward->>'leaderId', '')::uuid;
  perform id from public.heroes where warband_id = w.id order by id for update;
  for a in select x from jsonb_array_elements(alloc) x loop
    a_hero := (a->>'heroId')::uuid; a_xp := (a->>'xp')::int;
    if a_hero is null or a_xp is null or a_xp < 1 then raise exception 'Each allocation names a Hero and a positive amount of experience.' using errcode = '22023'; end if;
    if a_hero = any(seen) then raise exception 'A Hero is listed twice in the allocation.' using errcode = '22023'; end if;
    seen := seen || a_hero;
    if not exists (select 1 from public.heroes hh where hh.id = a_hero and hh.warband_id = w.id and hh.status = 'active' and not hh.is_hired_sword) then raise exception 'Experience goes to this warband''s own active Heroes.' using errcode = '22023'; end if;
    alloc_sum := alloc_sum + a_xp;
  end loop;
  if alloc_sum <> xp_total then raise exception 'The allocation must share exactly % experience (it shares %).', xp_total, alloc_sum using errcode = '22023'; end if;
  if plan->>'recipient' = 'leader' then
    v_leader := public.warband_leader(w.id);
    if v_leader is null then raise exception 'This warband has no active leader to receive Hashut''s Reward; appoint a successor first.' using errcode = 'P0001'; end if;
    if leader is distinct from v_leader or cardinality(seen) <> 1 or seen[1] <> v_leader then raise exception 'With three captives or fewer the +1 Experience goes to the warband''s current leader alone.' using errcode = '22023'; end if;
  end if;
  -- Advances: only for experience this reward awards, at real threshold boxes (as 090).
  for a in select x from jsonb_array_elements(coalesce(p_advances, '[]'::jsonb)) x loop
    a_subject := (a->>'subject_id')::uuid; a_threshold := (a->>'threshold_xp')::int;
    select hh.xp into a_old from public.heroes hh where hh.id = a_subject and hh.warband_id = w.id;
    select (x->>'xp')::int into a_new from jsonb_array_elements(alloc) x where (x->>'heroId')::uuid = a_subject;
    if a_old is null or a_new is null then raise exception 'An advance is claimed for a warrior whose experience this reward does not change.' using errcode = '22023'; end if;
    a_new := a_old + a_new;
    if coalesce(a->>'subject_type', 'hero') <> 'hero' or ((a->>'warband_id') is not null and (a->>'warband_id')::uuid <> w.id) then raise exception 'An advance names the wrong warband.' using errcode = '22023'; end if;
    if a_threshold is null or not (a_threshold = any(thresholds)) or a_threshold <= a_old or a_threshold > a_new then raise exception 'An advance is claimed at a threshold this reward does not cross.' using errcode = '22023'; end if;
    tag := a_subject::text || ':' || a_threshold;
    if tag = any(a_tags) then raise exception 'An advance is claimed twice.' using errcode = '22023'; end if;
    a_tags := a_tags || tag;
  end loop;
  -- Apply once.
  select * into e from public.engine_of_chaos_units where id = j.engine_id;
  perform id from public.items where id = e.inventory_item_id for update;
  perform id from public.engine_of_chaos_units where inventory_item_id = e.inventory_item_id order by id for update;
  select string_agg(name, ', ' order by name) into v_names from public.engine_prisoners where journey_id = j.id and state = 'dispatched';
  perform set_config('stirheim.audit_reason', 'Hashut''s Reward: ' || j.escort_name || ' returns with ' || e.name || ' after ' || j.captive_count || ' captive' || case when j.captive_count = 1 then '' else 's' end || ' (' || coalesce(v_names, '') || ') were sacrificed: +' || xp_total || ' XP' || case when v_gold > 0 then ', +' || v_gold || ' gc' else '' end || '.', true);
  for a in select x from jsonb_array_elements(alloc) x loop
    update public.heroes set xp = xp + (a->>'xp')::int where id = (a->>'heroId')::uuid;
  end loop;
  if v_gold > 0 then update public.warbands set gold = gold + v_gold where id = w.id; end if;
  for a in select x from jsonb_array_elements(coalesce(p_advances, '[]'::jsonb)) x loop
    v_id := null;
    insert into public.pending_advances (warband_id, subject_type, subject_id, threshold_xp)
    select w.id, 'hero', (a->>'subject_id')::uuid, (a->>'threshold_xp')::int
    where not exists (select 1 from public.pending_advances p where p.subject_id = (a->>'subject_id')::uuid and p.threshold_xp = (a->>'threshold_xp')::int)
    returning id into v_id;
    if v_id is not null then v_ids := v_ids || v_id; end if;
  end loop;
  update public.engine_of_chaos_units set state = 'present', history = history || jsonb_build_object('event', 'returned', 'at', now(), 'by', auth.uid(), 'journey_id', j.id, 'escort', j.escort_name, 'xp', xp_total, 'gold', v_gold) where id = e.id;
  update public.engine_journeys set state = 'returned', returned_at = now(), returned_by = auth.uid(), missed_match_id = v_missed, advance_ids = v_ids,
         reward = jsonb_build_object('d3', to_jsonb(d3), 'appD3', to_jsonb(app_d3), 'd6', d6, 'appD6', app_d6, 'xpTotal', xp_total, 'gold', v_gold, 'allocations', alloc, 'leaderId', leader),
         history = history || jsonb_build_object('event', 'returned', 'at', now(), 'by', auth.uid(), 'missed_match_id', v_missed, 'xp', xp_total, 'gold', v_gold)
    where id = j.id;
end $$;
revoke all on function public.return_engine(uuid, jsonb, jsonb) from public;
grant execute on function public.return_engine(uuid, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Source reports stay pinned after a sacrifice too: a dispatched anonymous prisoner (pending, away
-- or returned journey) keeps his exploration report from being withdrawn or corrected, so the
-- reward can never be earned twice from one Straggler or Prisoners result. (Named prisoners' cases
-- are resolved 'dispatch' and already pin their reports.) Body otherwise as 102.
-- ---------------------------------------------------------------------------------------------
create or replace function public.guard_captive_report() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' or (old.undo is not null and new.undo is null) then
    if exists (select 1 from public.captive_cases where report_id = old.id and state in ('resolved', 'held') and resolution_kind is distinct from 'external')
       or exists (select 1 from public.captive_proposals where state = 'accepted' and old.id = any(linked_report_ids)) then
      raise exception 'A captive outcome recorded between two warbands depends on this report (it was filed before the ransom, exchange, sale, sacrifice or imprisonment was agreed). Reverse that outcome from the warband page first (or ask the campaign GM to release it), then withdraw or correct the report.';
    end if;
    if exists (select 1 from public.engine_prisoners where exploration_report_id = old.id and state = 'held') then
      raise exception 'Prisoners found in this exploration are still locked in an Engine of Chaos. Reverse their placement from the warband page before withdrawing or correcting the report.';
    end if;
    if exists (select 1 from public.engine_prisoners where exploration_report_id = old.id and state = 'dispatched') then
      raise exception 'Prisoners found in this exploration were sent to the Dark Lands; the report stays as filed so Hashut''s Reward cannot be earned twice from it.';
    end if;
    update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The source report was withdrawn or corrected.'
      where state = 'proposed' and case_id in (select id from public.captive_cases where report_id = old.id);
    update public.captive_cases set state = 'withdrawn', resolved_at = now(), resolution_message = 'The source report was withdrawn or corrected.'
      where report_id = old.id and (state in ('unassigned', 'open') or (state = 'resolved' and resolution_kind = 'external'));
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
