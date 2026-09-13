-- #229 / #95 Engine of Chaos journeys, review corrections to 105 (Codex review 1eecd868):
--   1. Lock order. dispatch_engine and the departure settlement took the Engine's stock row before
--      the escort Hero, while every captive answer locks reports → warbands → heroes → groups →
--      items (090). A dispatch racing an ordinary captive answer for the same captor could deadlock.
--      All journey writers now lock in the roster order; reverse_engine_journey locks everything it
--      touches up front.
--   2. Complete advance queuing. return_engine derives the full set of boxes the award crosses, per
--      Hero at his own advance rate (half-rate Ogre profiles catalogued in hero_advance_rates), and
--      refuses omissions as well as extras.
--   3. The escort rejoins on return: the sits-out flag departure set (still at 1 because the missed
--      battle's report never decremented it for a Hero who sat out) is lifted; any other absence stays.
-- Bodies otherwise as 105.

-- Advance boxes per Hero at his own rate (xpThresholds in src/rules/data/campaign/experience.ts).
-- Only half-rate Hero profiles are catalogued (generated from unitRules().advanceRate); every other
-- unit uses the normal boxes.
create table public.hero_advance_rates (
  unit_key text primary key,
  rate text not null check (rate in ('half'))
);
comment on table public.hero_advance_rates is 'Generated: Hero profiles whose advances need twice the experience (unitRules advanceRate = half). Regenerate and replace, never edit by hand.';
alter table public.hero_advance_rates enable row level security;
insert into public.hero_advance_rates (unit_key, rate) values
  ('maneaters_captain', 'half'), ('maneaters_mountain_guide', 'half'), ('maneaters_youngbloods', 'half'), ('ogre_hunting_party_ogre_hunter', 'half');
create function public.hero_xp_thresholds(p_unit_key text) returns integer[] language sql stable security definer set search_path = '' as $$
  select case when exists (select 1 from public.hero_advance_rates r where r.unit_key = p_unit_key and r.rate = 'half')
    then array[4, 8, 12, 16, 22, 28, 34, 40, 48, 56, 64, 72, 82, 92, 102, 114, 126, 138, 152, 166, 180]
    else array[2, 4, 6, 8, 11, 14, 17, 20, 24, 28, 32, 36, 41, 46, 51, 57, 63, 69, 76, 83, 90] end;
$$;
revoke all on function public.hero_xp_thresholds(text) from public;

create or replace function public.dispatch_engine(p_engine_id uuid, p_escort_hero_id uuid, p_prisoner_ids uuid[], p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  e public.engine_of_chaos_units%rowtype; w public.warbands%rowtype; h public.heroes%rowtype; j public.engine_journeys%rowtype; pz public.engine_prisoners%rowtype; c public.captive_cases%rowtype; v public.warbands%rowtype;
  ids uuid[]; v_after uuid; v_msg text; v_pid uuid; v_proposals uuid[] := '{}'; v_other_owner uuid; v_matches uuid[]; v_victims uuid[];
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select coalesce(array_agg(distinct x), '{}') into ids from unnest(p_prisoner_ids) x;
  if cardinality(ids) = 0 then raise exception 'Choose at least one captive to send to the Dark Lands.' using errcode = '22023'; end if;
  select * into e from public.engine_of_chaos_units where id = p_engine_id and state <> 'retired';
  if not found then raise exception 'That Engine is not in the inventory.' using errcode = 'P0002'; end if;
  if not public.can_edit_warband(e.warband_id) then raise exception 'Only this warband''s player or the campaign GM sends its Engine to the Dark Lands.' using errcode = '42501'; end if;
  select * into w from public.warbands where id = e.warband_id;
  if w.type_rules_id <> 'black_dwarfs' then raise exception 'Only a Chaos Dwarf warband keeps an Engine of Chaos.' using errcode = '22023'; end if;
  -- Locks in the roster order every captive writer uses (089/090): reports → warbands → heroes →
  -- items (the Engine's stock row) → Engine rows → custody rows → cases.
  select coalesce(array_agg(distinct cc.match_id), '{}'), coalesce(array_agg(distinct cc.victim_warband_id), '{}') into v_matches, v_victims
    from public.engine_prisoners p join public.captive_cases cc on cc.id = p.case_id where p.id = any(ids);
  perform id from public.match_reports where match_id = any(v_matches) order by id for update;
  perform id from public.warbands where id = any(v_victims || w.id) order by id for update;
  select * into h from public.heroes where id = p_escort_hero_id and warband_id = w.id for update;
  if not found or h.is_hired_sword or h.status <> 'active' then raise exception 'The escort must be one of this warband''s own active Heroes (not a hired sword).' using errcode = '22023'; end if;
  perform id from public.items where id = e.inventory_item_id for update;
  perform id from public.engine_of_chaos_units where inventory_item_id = e.inventory_item_id order by id for update;
  select * into e from public.engine_of_chaos_units where id = p_engine_id;
  if e.state <> 'present' then raise exception '% is already away.', e.name using errcode = 'P0001'; end if;
  if e.updated_at is distinct from p_expected_updated_at then raise exception 'The Engine changed. Refresh its record before dispatching it.' using errcode = '40001'; end if;
  if exists (select 1 from public.engine_journeys where engine_id = e.id and state in ('pending', 'away')) then raise exception '% already has a journey under way.', e.name using errcode = 'P0001'; end if;
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

create or replace function public.engine_journey_settle(p_journey_id uuid) returns void language plpgsql security definer set search_path = '' as $$
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
  -- Roster lock order (heroes before items): the escort row, then the Engine's stock row, then the Engine rows.
  select * into h from public.heroes where id = j.escort_hero_id and warband_id = j.warband_id for update;
  -- The escort is checked again at the moment of departure.
  if not found or h.status <> 'active' or h.is_hired_sword then raise exception 'The escort % is no longer an active Hero of the warband; cancel the journey and choose another escort.', j.escort_name using errcode = 'P0001'; end if;
  select * into e from public.engine_of_chaos_units where id = j.engine_id;
  perform id from public.items where id = e.inventory_item_id for update;
  perform id from public.engine_of_chaos_units where inventory_item_id = e.inventory_item_id order by id for update;
  select * into e from public.engine_of_chaos_units where id = j.engine_id;
  if e.state <> 'present' then raise exception '% is not with the warband, so the journey cannot depart.', e.name using errcode = 'P0001'; end if;
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

create or replace function public.reverse_engine_journey(p_journey_id uuid, p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare j public.engine_journeys%rowtype; e public.engine_of_chaos_units%rowtype; pz public.engine_prisoners%rowtype; flag_set boolean; v_matches uuid[]; v_victims uuid[];
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Explain why the journey is being reversed.' using errcode = 'P0001'; end if;
  select * into j from public.engine_journeys where id = p_journey_id for update;
  if not found then raise exception 'Journey not found.' using errcode = 'P0002'; end if;
  if not public.is_campaign_gm_of_warband(j.warband_id) then raise exception 'Only the campaign GM can reverse a journey that has departed.' using errcode = '42501'; end if;
  if j.state <> 'away' then raise exception 'Only a journey that is away (not yet returned) can be reversed (this one is %).', j.state using errcode = 'P0001'; end if;
  perform set_config('stirheim.engine_reverse', '1', true);
  -- Everything this reversal touches is locked up front in the roster order (reports → warbands →
  -- heroes → groups → items → Engine rows); the per-case reversals below then re-enter held locks.
  select coalesce(array_agg(distinct cc.match_id), '{}'), coalesce(array_agg(distinct cc.victim_warband_id), '{}') into v_matches, v_victims
    from public.engine_prisoners p join public.captive_cases cc on cc.id = p.case_id where p.journey_id = j.id;
  perform id from public.match_reports where match_id = any(v_matches) order by id for update;
  perform id from public.warbands where id = any(v_victims || j.warband_id) order by id for update;
  perform id from public.heroes where warband_id = any(v_victims || j.warband_id) order by id for update;
  perform id from public.henchman_groups where warband_id = any(v_victims || j.warband_id) order by id for update;
  perform id from public.items where warband_id = any(v_victims || j.warband_id) order by id for update;
  -- Departure's own roster change (the escort's sits-out flag) is undone first, so each sacrifice's
  -- snapshot comparison sees the rosters exactly as that consent left them.
  select * into e from public.engine_of_chaos_units where id = j.engine_id;
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

create or replace function public.return_engine(p_journey_id uuid, p_reward jsonb, p_advances jsonb default '[]'::jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare
  j public.engine_journeys%rowtype; e public.engine_of_chaos_units%rowtype; w public.warbands%rowtype; v_missed uuid; plan jsonb; d3 int[]; app_d3 int[]; d6 int; app_d6 int; xp_total int; v_gold int := 0;
  alloc jsonb; a jsonb; a_hero uuid; a_xp int; seen uuid[] := '{}'; alloc_sum int := 0; leader uuid; v_leader uuid; v_ids uuid[] := '{}'; v_id uuid; a_subject uuid; a_threshold int; a_old int; a_new int; a_tags text[] := '{}'; seen_tags text[] := '{}'; tag text; v_names text;
  thresholds int[]; flag_set boolean;
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
  -- Advances: exactly the boxes this award crosses, per Hero at his own advance rate (half-rate
  -- units such as Ogres need twice the experience). Omissions and extras are both refused.
  for a in select x from jsonb_array_elements(alloc) x loop
    select hh.xp, public.hero_xp_thresholds(hh.unit_type_rules_id) into a_old, thresholds from public.heroes hh where hh.id = (a->>'heroId')::uuid;
    a_new := a_old + (a->>'xp')::int;
    a_tags := a_tags || (select coalesce(array_agg((a->>'heroId') || ':' || t order by t), '{}') from unnest(thresholds) t where t > a_old and t <= a_new);
  end loop;
  for a in select x from jsonb_array_elements(coalesce(p_advances, '[]'::jsonb)) x loop
    a_subject := (a->>'subject_id')::uuid; a_threshold := (a->>'threshold_xp')::int;
    if coalesce(a->>'subject_type', 'hero') <> 'hero' or ((a->>'warband_id') is not null and (a->>'warband_id')::uuid <> w.id) then raise exception 'An advance names the wrong warband.' using errcode = '22023'; end if;
    tag := a_subject::text || ':' || a_threshold;
    if not (tag = any(a_tags)) then raise exception 'An advance is claimed at a threshold this reward does not cross.' using errcode = '22023'; end if;
    if tag = any(seen_tags) then raise exception 'An advance is claimed twice.' using errcode = '22023'; end if;
    seen_tags := seen_tags || tag;
  end loop;
  if cardinality(seen_tags) <> cardinality(a_tags) then
    raise exception 'This reward crosses % advance box%; every one must be claimed (% listed).', cardinality(a_tags), case when cardinality(a_tags) = 1 then '' else 'es' end, cardinality(seen_tags) using errcode = '22023';
  end if;
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
  -- The escort rejoins: the sits-out flag departure set (and only that one, still standing at 1
  -- because the missed battle's report did not clear it) is lifted now that the battle is over.
  select bool_or((x->>'escort_flag_set')::boolean) into flag_set from jsonb_array_elements(j.history) x where x->>'event' = 'departed';
  if coalesce(flag_set, false) then
    perform set_config('stirheim.engine_escort', '1', true);
    update public.heroes set flags = flags - 'missNextGames' where id = j.escort_hero_id and coalesce((flags->>'missNextGames')::int, 0) = 1;
    perform set_config('stirheim.engine_escort', '', true);
  end if;
  update public.engine_journeys set state = 'returned', returned_at = now(), returned_by = auth.uid(), missed_match_id = v_missed, advance_ids = v_ids,
         reward = jsonb_build_object('d3', to_jsonb(d3), 'appD3', to_jsonb(app_d3), 'd6', d6, 'appD6', app_d6, 'xpTotal', xp_total, 'gold', v_gold, 'allocations', alloc, 'leaderId', leader),
         history = history || jsonb_build_object('event', 'returned', 'at', now(), 'by', auth.uid(), 'missed_match_id', v_missed, 'xp', xp_total, 'gold', v_gold)
    where id = j.id;
end $$;

