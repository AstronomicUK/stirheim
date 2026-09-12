-- #229 core Captured (serious injury 61): a cross-player workflow on top of the existing captive
-- resolver. A filed report whose applied injuries left a Hero (or hired sword) with status "captured"
-- opens a durable case. The captor is pre-filled when the battle had exactly one enemy warband, or when
-- the sheet's "taken out by" record names exactly one participating enemy; otherwise the victim's
-- player names the agreed captor. Either side proposes an exact outcome (the resolver's own preview
-- and both rosters' changes); the other side accepts or rejects; a proposer who can edit both warbands
-- (same owner, or the campaign GM) applies at once, preserving today's direct flow. Applying is atomic
-- across both rosters with the same stale-snapshot discipline as resolve_captive_rosters, and every
-- write is scoped to the two case warbands by update_roster itself. A resolved case pins the victim's
-- report until the outcome is reversed: reversal restores both rosters from the recorded snapshots
-- when nothing has changed since, and the GM can otherwise release the dependency and reconcile by
-- hand. Lock order matches 089: this match's report rows, then both warbands, then case, then proposal.

create table public.captive_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.match_reports (id) on delete cascade,
  report_revision integer not null,
  match_id uuid not null references public.matches (id) on delete cascade,
  victim_warband_id uuid not null references public.warbands (id) on delete cascade,
  captor_warband_id uuid references public.warbands (id) on delete set null,
  hero_id uuid not null,
  hero_name text not null,
  state text not null default 'unassigned' check (state in ('unassigned', 'open', 'resolved', 'withdrawn')),
  assigned_by uuid references auth.users (id),
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_kind text,
  resolution_message text not null default '',
  -- Set when another case's accepted proposal resolved this one too (an exchange returns the
  -- captor's own captive); reversing that proposal reopens this case.
  resolved_by_proposal uuid,
  history jsonb not null default '[]'::jsonb,
  unique (report_id, report_revision, hero_id),
  check (captor_warband_id is null or captor_warband_id <> victim_warband_id)
);
comment on table public.captive_cases is 'One per warrior captured in a filed report: who holds him, and how it was resolved. Written by triggers and RPCs only.';
create index captive_cases_victim_idx on public.captive_cases (victim_warband_id, state);
create index captive_cases_captor_idx on public.captive_cases (captor_warband_id, state);
alter table public.captive_cases enable row level security;
create policy captive_cases_select on public.captive_cases for select to authenticated using (
  public.can_edit_warband(victim_warband_id) or (captor_warband_id is not null and public.can_edit_warband(captor_warband_id))
  or public.is_campaign_gm(public.match_campaign(match_id))
);
grant select on public.captive_cases to authenticated;

create table public.captive_proposals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.captive_cases (id) on delete cascade,
  proposed_by_warband_id uuid not null references public.warbands (id) on delete cascade,
  proposed_by uuid not null references auth.users (id),
  choice jsonb not null,
  -- The consent text: written by the server from the validated changes, never by the client.
  message text not null check (char_length(message) between 1 and 1000),
  -- The proposer's own words, shown alongside but never relied on.
  proposer_note text not null default '',
  -- Applied reports whose undo would disturb either roster while this proposal stands accepted:
  -- both warbands' reports for the match, plus an exchanged partner's source report.
  linked_report_ids uuid[] not null default '{}',
  owner_changes jsonb not null,
  captor_changes jsonb not null,
  advances jsonb not null default '[]'::jsonb,
  expected jsonb not null,
  state text not null default 'proposed' check (state in ('proposed', 'accepted', 'rejected', 'withdrawn', 'stale', 'reversed')),
  responded_by uuid references auth.users (id),
  reason text not null default '',
  before_snapshot jsonb,
  after_snapshot jsonb,
  advance_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
comment on table public.captive_proposals is 'An exact captive outcome (the resolver''s preview and both rosters'' changes) offered by one side for the other to accept. Written by RPCs only.';
create index captive_proposals_case_idx on public.captive_proposals (case_id, state);
alter table public.captive_proposals enable row level security;
create policy captive_proposals_select on public.captive_proposals for select to authenticated using (
  exists (select 1 from public.captive_cases c where c.id = case_id and (
    public.can_edit_warband(c.victim_warband_id) or (c.captor_warband_id is not null and public.can_edit_warband(c.captor_warband_id))
    or public.is_campaign_gm(public.match_campaign(c.match_id))))
);
grant select (id, case_id, proposed_by_warband_id, proposed_by, choice, message, proposer_note, linked_report_ids, owner_changes, captor_changes, advances, expected, state, responded_by, reason, advance_ids, created_at, resolved_at) on public.captive_proposals to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Shared helpers (private).
-- ---------------------------------------------------------------------------------------------
create function public.lock_captive_context(p_match_id uuid, p_a uuid, p_b uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform id from public.match_reports where match_id = p_match_id order by id for update;
  perform id from public.warbands where id in (p_a, p_b) order by id for update;
end $$;
revoke all on function public.lock_captive_context(uuid, uuid, uuid) from public;

create function public.captive_roster_snapshot(p_a uuid, p_b uuid) returns jsonb language sql security definer set search_path = '' stable as $$
  select jsonb_build_object(
    'warbands', coalesce((select jsonb_agg(to_jsonb(w) - 'updated_at' order by w.id) from public.warbands w where w.id in (p_a, p_b)), '[]'::jsonb),
    'heroes', coalesce((select jsonb_agg(to_jsonb(h) - 'updated_at' order by h.id) from public.heroes h where h.warband_id in (p_a, p_b)), '[]'::jsonb),
    'henchman_groups', coalesce((select jsonb_agg(to_jsonb(g) - 'updated_at' order by g.id) from public.henchman_groups g where g.warband_id in (p_a, p_b)), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(to_jsonb(i) - 'updated_at' order by i.id) from public.items i where i.warband_id in (p_a, p_b)), '[]'::jsonb));
$$;
revoke all on function public.captive_roster_snapshot(uuid, uuid) from public;

-- Whether a given user (not necessarily the caller) may currently edit a warband: its owner, or the
-- GM of a campaign it is enrolled in. Used to re-check the proposer's consent at acceptance.
create function public.user_can_edit_warband(p_user_id uuid, p_warband_id uuid) returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.warbands w where w.id = p_warband_id and w.owner_id = p_user_id)
      or exists (select 1 from public.campaign_members m join public.campaigns c on c.id = m.campaign_id
                  where m.warband_id = p_warband_id and m.left_at is null and c.gm_id = p_user_id);
$$;
revoke all on function public.user_can_edit_warband(uuid, uuid) from public;

-- ---------------------------------------------------------------------------------------------
-- validate_captive_proposal: the consent check. The client sends the resolver's roster changes; the
-- server only accepts changes a given outcome can produce (whitelisted tables, ops, rows and fields;
-- exact gold and wyrdstone deltas; only the captive, an exchanged partner or the sacrificing leader;
-- one new group of the right type; the captive's own equipment passing to the captor's stash) and
-- returns its own plain-English summary of what will actually happen, which becomes the text the
-- other player accepts.
-- ---------------------------------------------------------------------------------------------
create function public.captive_return_fields_ok(p_hero public.heroes, p_data jsonb) returns boolean language plpgsql immutable set search_path = '' as $$
declare inj jsonb := coalesce(p_data->'injuries', p_hero.injuries); i int; n int; last_captured int := 0;
begin
  -- Flags: exactly the current flags with the captured marker cleared.
  if coalesce(p_data->'flags', p_hero.flags) is distinct from (p_hero.flags - 'captured') then return false; end if;
  -- Injuries: unchanged, except the effect text of the Captured entry that this outcome closes.
  if jsonb_typeof(inj) <> 'array' or jsonb_typeof(p_hero.injuries) <> 'array' then return inj = p_hero.injuries; end if;
  n := jsonb_array_length(p_hero.injuries);
  if jsonb_array_length(inj) <> n then return false; end if;
  for i in 0..n-1 loop
    if p_hero.injuries->i->>'injuryCode' = 'captured' then last_captured := i + 1; end if;
  end loop;
  for i in 0..n-1 loop
    if inj->i = p_hero.injuries->i then continue; end if;
    if i + 1 = last_captured and (inj->i) - 'effect' = (p_hero.injuries->i) - 'effect' then continue; end if;
    return false;
  end loop;
  return true;
end $$;
revoke all on function public.captive_return_fields_ok(public.heroes, jsonb) from public;

create function public.validate_captive_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb default '[]'::jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v public.warbands%rowtype; k public.warbands%rowtype; h public.heroes%rowtype; other public.heroes%rowtype; leader public.heroes%rowtype; item_row public.items%rowtype;
  kind text := p_choice->>'kind'; c jsonb; keys text[]; t text; op text; v_id uuid; d jsonb; key text; qty int; tag text; seen text[] := '{}';
  og int := 0; ow int := 0; kg int := 0; kw int := 0; hero_status text; hero_xp_delta int := 0; other_status text; leader_xp_delta int := 0;
  hero_items int; moved int := 0; surrendered jsonb := '{}'::jsonb; gained jsonb := '{}'::jsonb; gained_total int := 0; skins int := 0;
  group_seen boolean := false; group_unit text; group_name text; group_dagger int := 0;
  d6 int; gold int; xp int; expect_status text; expect_group text; expect_stats jsonb; expect_kg int := 0; expect_kw int := 0; expect_og int := 0; expect_move boolean := false; skins_allowed boolean := false;
  a jsonb; a_subject uuid; a_threshold int; a_old int; a_new int; a_tags text[] := '{}';
  thresholds int[] := array[2, 4, 6, 8, 11, 14, 17, 20, 24, 28, 32, 36, 41, 46, 51, 57, 63, 69, 76, 83, 90];
  parts text[]; label text;
begin
  if jsonb_typeof(p_choice) <> 'object' or kind not in ('ransom', 'exchange', 'sell', 'zombie', 'sacrifice', 'wretch', 'throne', 'slaveWork') then
    raise exception 'Choose a supported captive outcome.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_owner_changes) <> 'array' or jsonb_typeof(p_captor_changes) <> 'array' or jsonb_typeof(coalesce(p_advances, '[]'::jsonb)) <> 'array' then
    raise exception 'changes must be arrays' using errcode = '22023';
  end if;
  select * into v from public.warbands where id = p_case.victim_warband_id;
  select * into k from public.warbands where id = p_case.captor_warband_id;
  if v.id is null or k.id is null then raise exception 'Name the captor before proposing an outcome.' using errcode = 'P0001'; end if;
  select * into h from public.heroes where id = p_case.hero_id and warband_id = v.id and status = 'captured';
  if not found then raise exception 'This warrior is no longer recorded as captured.' using errcode = 'P0001'; end if;
  select count(*) into hero_items from public.items where warband_id = v.id and holder_type = 'hero' and holder_id = h.id;

  -- Owner (victim) side ------------------------------------------------------------------------
  for c in select x from jsonb_array_elements(p_owner_changes) x loop
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    tag := t || ':' || op || ':' || coalesce(v_id::text, v.id::text);
    if op <> 'insert' then
      if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      seen := seen || tag;
    end if;
    if t = 'warbands' and op = 'update' and (v_id is null or v_id = v.id) then
      if not (keys <@ array['gold', 'wyrdstone']) then raise exception 'A captive outcome may only change the warband''s gold and wyrdstone.' using errcode = '22023'; end if;
      if d ? 'gold' then og := (d->>'gold')::int - v.gold; end if;
      if d ? 'wyrdstone' then ow := (d->>'wyrdstone')::int - v.wyrdstone; end if;
    elsif t = 'heroes' and op = 'update' and v_id = h.id then
      if not (keys <@ array['status', 'flags', 'injuries', 'xp']) then raise exception 'A captive outcome may only change the captive''s status, flags, injuries and experience.' using errcode = '22023'; end if;
      if not public.captive_return_fields_ok(h, d) then raise exception 'The captive''s flags and injuries may only lose the Captured marker and close its entry; nothing else may change.' using errcode = '22023'; end if;
      hero_status := d->>'status';
      if d ? 'xp' then hero_xp_delta := (d->>'xp')::int - h.xp; end if;
    elsif t = 'items' and op = 'delete' then
      select * into item_row from public.items i where i.id = v_id and i.warband_id = v.id and i.holder_type = 'hero' and i.holder_id = h.id;
      if not found then raise exception 'The proposal changes something a captive outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023'; end if;
      key := coalesce(item_row.item_rules_id, 'custom:' || coalesce(item_row.custom_name, ''));
      surrendered := jsonb_set(surrendered, array[key], to_jsonb(coalesce((surrendered->>key)::int, 0) + item_row.quantity));
      moved := moved + 1;
    else
      raise exception 'The proposal changes something a captive outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
    end if;
  end loop;

  -- Captor side --------------------------------------------------------------------------------
  for c in select x from jsonb_array_elements(p_captor_changes) x loop
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    tag := t || ':' || op || ':' || coalesce(v_id::text, coalesce(c->>'id', k.id::text));
    if op <> 'insert' or t = 'henchman_groups' then
      if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      seen := seen || tag;
    end if;
    if t = 'warbands' and op = 'update' and (v_id is null or v_id = k.id) then
      if not (keys <@ array['gold', 'wyrdstone']) then raise exception 'A captive outcome may only change the warband''s gold and wyrdstone.' using errcode = '22023'; end if;
      if d ? 'gold' then kg := (d->>'gold')::int - k.gold; end if;
      if d ? 'wyrdstone' then kw := (d->>'wyrdstone')::int - k.wyrdstone; end if;
    elsif t = 'heroes' and op = 'update' and kind = 'exchange' and v_id::text = p_choice->>'otherHeroId' then
      select * into other from public.heroes where id = v_id and warband_id = k.id and status = 'captured';
      if not found then raise exception 'The captive offered in exchange is not held by the captor.' using errcode = 'P0001'; end if;
      if not (keys <@ array['status', 'flags', 'injuries']) then raise exception 'An exchange may only free the other captive.' using errcode = '22023'; end if;
      if not public.captive_return_fields_ok(other, d) then raise exception 'The exchanged captive''s flags and injuries may only lose the Captured marker and close its entry.' using errcode = '22023'; end if;
      other_status := d->>'status';
    elsif t = 'heroes' and op = 'update' and kind in ('sacrifice', 'throne') and v_id::text = p_choice->>'leaderId' then
      select * into leader from public.heroes where id = v_id and warband_id = k.id and status = 'active';
      if not found then raise exception 'The sacrificing warrior is not an active member of the captor warband.' using errcode = 'P0001'; end if;
      if not (keys <@ array['xp']) then raise exception 'A sacrifice may only award experience.' using errcode = '22023'; end if;
      leader_xp_delta := (d->>'xp')::int - leader.xp;
    elsif t = 'henchman_groups' and op = 'insert' then
      if group_seen then raise exception 'A captive outcome creates at most one group.' using errcode = '22023'; end if;
      if (c->>'id') is null or (c->>'id') is distinct from (p_choice->>'groupId') then raise exception 'The new group must be the one named in the outcome.' using errcode = '22023'; end if;
      if exists (select 1 from public.henchman_groups where id = (c->>'id')::uuid) then raise exception 'That group already exists.' using errcode = '22023'; end if;
      if not (keys <@ array['name', 'unit_type_rules_id', 'size', 'stats', 'xp', 'level_ups', 'stat_increases', 'is_large', 'notes', 'sort_order', 'model_names', 'campaign_state']) then
        raise exception 'The new group carries a field this outcome cannot set.' using errcode = '22023';
      end if;
      if coalesce((d->>'size')::int, 1) <> 1 or coalesce((d->>'xp')::int, 0) <> 0 or coalesce((d->>'level_ups')::int, 0) <> 0
         or coalesce(d->'stat_increases', '{}'::jsonb) <> '{}'::jsonb or coalesce((d->>'is_large')::boolean, false)
         or coalesce(d->'campaign_state', '{}'::jsonb) <> '{}'::jsonb or coalesce(jsonb_array_length(d->'model_names'), 0) > 1
         or char_length(coalesce(d->>'name', '')) > 80 or char_length(coalesce(d->>'notes', '')) > 0 then
        raise exception 'The captive becomes a single new model with the printed profile, no experience, no increases and no notes.' using errcode = '22023';
      end if;
      group_seen := true; group_unit := d->>'unit_type_rules_id'; group_name := d->>'name';
      if d->'stats' is null then raise exception 'The new group must carry the printed profile.' using errcode = '22023'; end if;
    elsif t = 'items' and op = 'insert' and coalesce(d->>'holder_type', 'stash') = 'group' then
      -- The list's free dagger for a newly formed group, nothing else.
      if group_dagger > 0 or d->>'holder_id' is distinct from p_choice->>'groupId' or d->>'item_rules_id' <> 'dagger' or coalesce((d->>'quantity')::int, 1) <> 1 then
        raise exception 'A new group may only be issued its list''s free dagger.' using errcode = '22023';
      end if;
      group_dagger := group_dagger + 1;
    elsif t = 'items' and op = 'insert' then
      if coalesce(d->>'holder_type', 'stash') <> 'stash' or nullif(d->>'holder_id', '') is not null then raise exception 'A captive''s equipment passes to the captor''s stash.' using errcode = '22023'; end if;
      if not (keys <@ array['holder_type', 'holder_id', 'item_rules_id', 'custom_name', 'quantity', 'notes']) then raise exception 'The proposal sets an item field this outcome cannot.' using errcode = '22023'; end if;
      key := coalesce(d->>'item_rules_id', 'custom:' || coalesce(d->>'custom_name', ''));
      qty := coalesce((d->>'quantity')::int, 1);
      if qty < 1 then raise exception 'Item quantities must be positive.' using errcode = '22023'; end if;
      if key = 'enchanted_skins' then skins := skins + qty; else gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + qty)); gained_total := gained_total + qty; end if;
    elsif t = 'items' and op = 'update' then
      select * into item_row from public.items where id = v_id and warband_id = k.id and holder_type = 'stash';
      if not found or not (keys <@ array['quantity']) or coalesce((d->>'quantity')::int, item_row.quantity) <= item_row.quantity then
        raise exception 'The proposal changes something a captive outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
      end if;
      key := coalesce(item_row.item_rules_id, 'custom:' || coalesce(item_row.custom_name, ''));
      qty := (d->>'quantity')::int - item_row.quantity;
      if key = 'enchanted_skins' then skins := skins + qty; else gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + qty)); gained_total := gained_total + qty; end if;
    else
      raise exception 'The proposal changes something a captive outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
    end if;
  end loop;

  -- What this outcome must look like -------------------------------------------------------------
  case kind
    when 'ransom' then
      gold := (p_choice->>'gold')::int;
      if gold is null or gold < 0 or gold > v.gold then raise exception 'Enter an affordable, non-negative ransom.' using errcode = '22023'; end if;
      expect_og := -gold; expect_kg := gold; expect_status := 'active'; label := 'Ransom';
    when 'exchange' then
      if other.id is null or other_status is distinct from 'active' then raise exception 'An exchange must return the captor''s captive as well.' using errcode = '22023'; end if;
      expect_status := 'active'; label := 'Exchange of captives';
    when 'sell' then
      d6 := (p_choice->>'d6')::int;
      if d6 is null or d6 not between 1 and 6 then raise exception 'Enter a D6 result from 1 to 6.' using errcode = '22023'; end if;
      if k.type_rules_id = 'pit_fighters' then raise exception 'Pit Fighters cannot sell captives.' using errcode = '22023'; end if;
      expect_kg := 5 * d6; expect_status := 'retired'; expect_move := true; label := 'Sold to slavers';
    when 'zombie' then
      if k.type_rules_id <> 'the_undead' then raise exception 'Only an Undead warband raises a captive as a Zombie.' using errcode = '22023'; end if;
      expect_group := 'undead_zombies'; expect_stats := '{"M":4,"WS":2,"BS":0,"S":3,"T":3,"W":1,"I":1,"A":1,"Ld":5}'::jsonb; expect_status := 'dead'; expect_move := true; label := 'Killed and raised as a Zombie';
    when 'sacrifice' then
      if k.type_rules_id not in ('cult_of_the_possessed', 'amazons_lustria', 'amazons_mordheim', 'the_sons_of_hashut') then raise exception 'This warband cannot sacrifice captives.' using errcode = '22023'; end if;
      if leader.id is null or leader_xp_delta <> 1 then raise exception 'A sacrifice awards exactly +1 experience to the leader.' using errcode = '22023'; end if;
      skins_allowed := k.type_rules_id = 'amazons_lustria' and v.type_rules_id = 'lizardmen';
      expect_status := 'dead'; expect_move := true; label := 'Sacrificed';
    when 'wretch' then
      if k.type_rules_id <> 'court_of_the_profane_pleasures' then raise exception 'Only the Court turns captives into Wretches.' using errcode = '22023'; end if;
      expect_group := 'court_of_pleasures_wretches'; expect_stats := '{"M":4,"WS":2,"BS":2,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":5}'::jsonb; expect_status := 'dead'; expect_move := true; label := 'Cruel Fate: turned into a Wretch';
    when 'throne' then
      if k.type_rules_id <> 'the_cursed_cavalcade' then raise exception 'Only the Cursed Cavalcade has the Throne of Worms.' using errcode = '22023'; end if;
      d6 := (p_choice->>'d6')::int;
      if d6 is null or d6 not between 1 and 6 then raise exception 'Enter a D6 result from 1 to 6.' using errcode = '22023'; end if;
      if d6 between 3 and 5 then expect_group := 'cursed_cavalcade_captured_thrall'; expect_stats := '{"M":4,"WS":3,"BS":3,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":5}'::jsonb;
      elsif d6 = 6 and (leader.id is null or leader_xp_delta <> 1) then raise exception 'On a 6 one surviving hero gains exactly +1 experience.' using errcode = '22023'; end if;
      expect_status := 'dead'; expect_move := true; label := 'Throne of Worms (D6 ' || d6 || ')';
    when 'slaveWork' then
      if k.type_rules_id <> 'the_sons_of_hashut' then raise exception 'Only the Sons of Hashut put slaves to work.' using errcode = '22023'; end if;
      d6 := (p_choice->>'d6')::int;
      if d6 is null or d6 not between 1 and 6 then raise exception 'Enter a D6 result from 1 to 6.' using errcode = '22023'; end if;
      expect_kw := 1; label := 'Slave work (D6 ' || d6 || ')';
      if d6 = 1 then
        xp := (p_choice->>'xp')::int;
        if xp is null or xp not between 1 and 3 or hero_xp_delta <> xp then raise exception 'The escaping slave gains exactly the D3 experience rolled.' using errcode = '22023'; end if;
        expect_status := 'active';
      else
        expect_status := 'dead'; expect_move := true;
      end if;
  end case;
  if not (kind = 'slaveWork' and d6 = 1) and hero_xp_delta <> 0 then raise exception 'This outcome does not change the captive''s experience.' using errcode = '22023'; end if;
  if kind not in ('sacrifice', 'throne') and leader_xp_delta <> 0 then raise exception 'This outcome awards no experience.' using errcode = '22023'; end if;
  if kind = 'throne' and d6 <> 6 and leader_xp_delta <> 0 then raise exception 'This outcome awards no experience.' using errcode = '22023'; end if;
  if og <> expect_og or kg <> expect_kg or ow <> 0 or kw <> expect_kw then raise exception 'The gold and wyrdstone changes do not match the outcome.' using errcode = '22023'; end if;
  if hero_status is distinct from expect_status then raise exception 'The captive''s status must become "%" for this outcome.', expect_status using errcode = '22023'; end if;
  if expect_group is not null then
    if not group_seen or group_unit is distinct from expect_group then raise exception 'This outcome must create one new % model.', expect_group using errcode = '22023'; end if;
    if not exists (select 1 from jsonb_array_elements(p_captor_changes) d2 where d2->>'table' = 'henchman_groups' and d2->'data'->'stats' = expect_stats) then
      raise exception 'The new % must carry the printed profile %.', expect_group, expect_stats::text using errcode = '22023';
    end if;
    if group_dagger > 0 and expect_group <> 'cursed_cavalcade_captured_thrall' then raise exception 'This unit is not issued a free dagger.' using errcode = '22023'; end if;
  else
    if group_seen or group_dagger > 0 then raise exception 'This outcome does not create a new group.' using errcode = '22023'; end if;
  end if;
  if skins > 0 and (not skins_allowed or skins <> 1) then raise exception 'Enchanted Skins are only gained once, by Lustrian Amazons sacrificing a Lizardman.' using errcode = '22023'; end if;
  if expect_move then
    if moved <> hero_items then raise exception 'All of the captive''s equipment must pass to the captor.' using errcode = '22023'; end if;
    if gained <> surrendered then raise exception 'The captor must gain exactly the equipment the captive surrendered (same items, same quantities).' using errcode = '22023'; end if;
  elsif moved <> 0 or gained_total <> 0 then
    raise exception 'The captive keeps his equipment in this outcome.' using errcode = '22023';
  end if;

  -- Advances: only for experience this outcome actually awards, at real threshold boxes.
  for a in select x from jsonb_array_elements(coalesce(p_advances, '[]'::jsonb)) x loop
    a_subject := (a->>'subject_id')::uuid; a_threshold := (a->>'threshold_xp')::int;
    if a_subject = h.id and hero_xp_delta > 0 then a_old := h.xp; a_new := h.xp + hero_xp_delta;
    elsif leader.id is not null and a_subject = leader.id and leader_xp_delta > 0 then a_old := leader.xp; a_new := leader.xp + leader_xp_delta;
    else raise exception 'An advance is claimed for a warrior whose experience this outcome does not change.' using errcode = '22023'; end if;
    if (a->>'warband_id')::uuid is distinct from (case when a_subject = h.id then v.id else k.id end) or coalesce(a->>'subject_type', 'hero') <> 'hero' then raise exception 'An advance names the wrong warband.' using errcode = '22023'; end if;
    if a_threshold is null or not (a_threshold = any(thresholds)) or a_threshold <= a_old or a_threshold > a_new then raise exception 'An advance is claimed at a threshold this outcome does not cross.' using errcode = '22023'; end if;
    tag := a_subject::text || ':' || a_threshold;
    if tag = any(a_tags) then raise exception 'An advance is claimed twice.' using errcode = '22023'; end if;
    a_tags := a_tags || tag;
  end loop;

  -- The consent text --------------------------------------------------------------------------------
  parts := array[label || ': ' || h.name || ' (' || v.name || ') becomes ' || expect_status];
  if og <> 0 then parts := parts || format('%s gold %s → %s', v.name, v.gold, v.gold + og); end if;
  if kg <> 0 then parts := parts || format('%s gold %s → %s', k.name, k.gold, k.gold + kg); end if;
  if kw <> 0 then parts := parts || format('%s wyrdstone %s → %s', k.name, k.wyrdstone, k.wyrdstone + kw); end if;
  if hero_xp_delta <> 0 then parts := parts || format('%s experience %s → %s', h.name, h.xp, h.xp + hero_xp_delta); end if;
  if moved > 0 then parts := parts || format('%s surrenders %s to %s', h.name, (select string_agg(e.key || case when (e.value)::int > 1 then ' ×' || e.value else '' end, ', ' order by e.key) from jsonb_each_text(surrendered) e), k.name);
  elsif hero_items > 0 then parts := parts || format('%s keeps all %s equipment item(s)', h.name, hero_items); end if;
  if skins > 0 then parts := parts || format('%s gains Enchanted Skins', k.name); end if;
  if group_seen then parts := parts || format('%s gains a new %s model "%s"', k.name, group_unit, coalesce(group_name, h.name)); end if;
  if other.id is not null then parts := parts || format('%s (%s) returns from captivity with all equipment', other.name, k.name); end if;
  if leader_xp_delta = 1 then parts := parts || format('%s gains +1 experience', leader.name); end if;
  if jsonb_array_length(coalesce(p_advances, '[]'::jsonb)) > 0 then parts := parts || format('%s advance roll(s) become due', jsonb_array_length(p_advances)); end if;
  return left(array_to_string(parts, '. ') || '.', 1000);
end $$;
revoke all on function public.validate_captive_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;

-- ---------------------------------------------------------------------------------------------
-- Case creation: when a report is applied, every warrior it left captured opens a case. Eligibility
-- comes from the applied roster state (status = captured), never from the line's subjectType alone.
-- ---------------------------------------------------------------------------------------------
create function public.create_captive_cases() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  line jsonb; h public.heroes%rowtype; v_captor uuid; v_case uuid; v_owner uuid; v_captor_owner uuid; v_by text; v_candidates uuid[]; v_enemies uuid[];
begin
  if new.undo is null or old.undo is not null then return new; end if;
  select array_agg(distinct p.warband_id) into v_enemies from public.match_participants p where p.match_id = new.match_id and p.warband_id <> new.warband_id;
  for line in select x from jsonb_array_elements(coalesce(new.injuries, '[]'::jsonb)) x where x->>'outcome' = 'captured' loop
    if (line->>'subjectId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then continue; end if;
    select * into h from public.heroes where id = (line->>'subjectId')::uuid and warband_id = new.warband_id and status = 'captured';
    if not found then continue; end if;
    v_captor := null;
    if v_enemies is not null and cardinality(v_enemies) = 1 then
      v_captor := v_enemies[1];
    else
      -- The sheet records who took each model out as "<model> (<warband name>)"; use it only when it
      -- names exactly one participating enemy warband.
      for v_by in select jsonb_array_elements_text(coalesce((select o->'by' from jsonb_array_elements(coalesce(new.ooa, '[]'::jsonb)) o where o->>'subjectId' = h.id::text limit 1), '[]'::jsonb)) loop
        select array_agg(distinct w.id) into v_candidates from public.warbands w where w.id = any(v_enemies) and v_by like '%(' || w.name || ')%';
        if v_candidates is not null and cardinality(v_candidates) = 1 then v_captor := v_candidates[1]; exit; end if;
      end loop;
    end if;
    insert into public.captive_cases (report_id, report_revision, match_id, victim_warband_id, captor_warband_id, hero_id, hero_name, state, assigned_at)
      values (new.id, new.revision, new.match_id, new.warband_id, v_captor, h.id, h.name, case when v_captor is null then 'unassigned' else 'open' end, case when v_captor is null then null else now() end)
      on conflict do nothing returning id into v_case;
    if v_case is null then continue; end if;
    select owner_id into v_owner from public.warbands where id = new.warband_id;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_owner, 'captive', left(h.name || ' has been captured', 140),
              case when v_captor is null then 'Name the warband holding ' || h.name || ' on your warband page, then agree the outcome with their player.' else 'Agree the outcome with the warband holding ' || h.name || ' from your warband page.' end,
              '/warbands/' || new.warband_id, 'captive:' || v_case || ':victim') on conflict do nothing;
    if v_captor is not null then
      select owner_id into v_captor_owner from public.warbands where id = v_captor;
      insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
        values (v_captor_owner, 'captive', left('Your warband holds ' || h.name || ' captive', 140), 'Propose a ransom, exchange, sale or your warband''s own outcome from your warband page. The other player must accept it.', '/warbands/' || v_captor, 'captive:' || v_case || ':captor') on conflict do nothing;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.create_captive_cases() from public;
create trigger create_captive_cases after update of undo on public.match_reports for each row execute function public.create_captive_cases();

-- ---------------------------------------------------------------------------------------------
-- Report guard: a case resolved through the proposal flow pins the victim's report until reversed;
-- open cases, and cases closed because the warrior's status changed some other way (including the
-- withdrawal itself restoring him), die with the report.
-- ---------------------------------------------------------------------------------------------
create function public.guard_captive_report() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' or (old.undo is not null and new.undo is null) then
    if exists (select 1 from public.captive_cases where report_id = old.id and state = 'resolved' and resolution_kind is distinct from 'external')
       or exists (select 1 from public.captive_proposals where state = 'accepted' and old.id = any(linked_report_ids)) then
      raise exception 'A captive outcome recorded between two warbands depends on this report (it was filed before the ransom, exchange, sale or sacrifice was agreed). Reverse that outcome from the warband page first (or ask the campaign GM to release it), then withdraw or correct the report.';
    end if;
    update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The source report was withdrawn or corrected.'
      where state = 'proposed' and case_id in (select id from public.captive_cases where report_id = old.id);
    update public.captive_cases set state = 'withdrawn', resolved_at = now(), resolution_message = 'The source report was withdrawn or corrected.'
      where report_id = old.id and (state in ('unassigned', 'open') or (state = 'resolved' and resolution_kind = 'external'));
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.guard_captive_report() from public;
create trigger guard_captive_report before update of undo or delete on public.match_reports for each row execute function public.guard_captive_report();

-- A warrior freed or removed by any other path (the direct resolve_captive_rosters flow, a GM edit)
-- closes his open case so nobody proposes an outcome for a warrior who is no longer held. When the
-- proposal flow itself is applying or reversing, it sets stirheim.captive_apply and handles its cases itself.
create function public.close_captive_case_on_status() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if current_setting('stirheim.captive_apply', true) = '1' then return new; end if;
  if old.status = 'captured' and new.status <> 'captured' then
    update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The warrior is no longer recorded as captured.'
      where state = 'proposed' and case_id in (select id from public.captive_cases where hero_id = new.id and state in ('unassigned', 'open'));
    update public.captive_cases set state = 'resolved', resolved_at = now(), resolution_kind = 'external',
           resolution_message = 'Resolved outside the proposal flow (status changed to ' || new.status || ').'
      where hero_id = new.id and state in ('unassigned', 'open');
  end if;
  return new;
end $$;
revoke all on function public.close_captive_case_on_status() from public;
create trigger close_captive_case_on_status after update of status on public.heroes for each row execute function public.close_captive_case_on_status();

-- ---------------------------------------------------------------------------------------------
-- assign_captive_captor: the victim's player (or the GM) names the participating enemy warband
-- holding the captive when the report did not settle it. The GM may correct an open assignment.
-- ---------------------------------------------------------------------------------------------
create function public.assign_captive_captor(p_case_id uuid, p_captor_warband_id uuid, p_reason text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare c public.captive_cases%rowtype; v_gm boolean; v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into c from public.captive_cases where id = p_case_id;
  if not found then raise exception 'Captive case not found.' using errcode = 'P0002'; end if;
  perform public.lock_captive_context(c.match_id, c.victim_warband_id, coalesce(c.captor_warband_id, p_captor_warband_id));
  select * into c from public.captive_cases where id = p_case_id for update;
  v_gm := public.is_campaign_gm(public.match_campaign(c.match_id));
  if not (v_gm or public.can_edit_warband(c.victim_warband_id)) then
    raise exception 'Only the captured warrior''s player or the campaign GM can name the captor.' using errcode = '42501';
  end if;
  if c.state not in ('unassigned', 'open') then raise exception 'This captive case is already closed.' using errcode = 'P0001'; end if;
  if c.state = 'open' and not v_gm then raise exception 'The captor is already recorded. Ask the campaign GM to change it.' using errcode = 'P0001'; end if;
  if c.state = 'open' and char_length(btrim(p_reason)) < 5 then raise exception 'Explain why the captor is being changed.' using errcode = 'P0001'; end if;
  if p_captor_warband_id = c.victim_warband_id or not exists (select 1 from public.match_participants where match_id = c.match_id and warband_id = p_captor_warband_id) then
    raise exception 'The captor must be another warband that fought in this battle.' using errcode = 'P0001';
  end if;
  update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The captor was changed: ' || btrim(p_reason) where case_id = c.id and state = 'proposed';
  update public.captive_cases set captor_warband_id = p_captor_warband_id, state = 'open', assigned_by = auth.uid(), assigned_at = now(),
         history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', case when c.state = 'open' then 'captor_changed' else 'captor_assigned' end, 'captor_warband_id', p_captor_warband_id, 'reason', btrim(p_reason))
   where id = c.id;
  select owner_id into v_owner from public.warbands where id = p_captor_warband_id;
  insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
    values (v_owner, 'captive', left('Your warband holds ' || c.hero_name || ' captive', 140), 'Propose a ransom, exchange, sale or your warband''s own outcome from your warband page. The other player must accept it.', '/warbands/' || p_captor_warband_id, 'captive:' || c.id || ':captor:' || p_captor_warband_id) on conflict do nothing;
end $$;
revoke all on function public.assign_captive_captor(uuid, uuid, text) from public;
grant execute on function public.assign_captive_captor(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Applying an accepted outcome: the two-roster write, with resolve_captive_rosters' snapshot checks.
-- Private: callers have already established both consents (proposer's side at proposal time, the
-- other side's at acceptance, or one caller who edits both). Runs as definer so update_roster can
-- write the roster the caller does not own; auth.uid() stays the real caller for the audit log, and
-- update_roster itself scopes every insert/update/delete to the warband it is given.
-- ---------------------------------------------------------------------------------------------
create function public.apply_captive_proposal(p_case public.captive_cases, p_proposal public.captive_proposals)
returns void language plpgsql security definer set search_path = '' as $$
declare w record; t text; a jsonb; expected_count int; actual_count int; v_reason text; v_before jsonb; v_ids uuid[] := '{}'; v_id uuid; v_links uuid[]; v_partner_report uuid;
begin
  if p_case.captor_warband_id is null then raise exception 'Name the captor before recording an outcome.' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_proposal.expected -> 'warbands') is distinct from 'array' or jsonb_array_length(p_proposal.expected -> 'warbands') <> 2 then
    raise exception 'The proposal is missing its warband snapshot.' using errcode = '22023';
  end if;
  for w in select id, updated_at from public.warbands where id in (p_case.victim_warband_id, p_case.captor_warband_id) loop
    if not exists (select 1 from jsonb_array_elements(p_proposal.expected -> 'warbands') e where (e->>'id')::uuid = w.id and (e->>'updated_at')::timestamptz = w.updated_at) then
      raise exception 'A warband changed after this outcome was proposed. Propose it again from the current rosters.' using errcode = '40001';
    end if;
  end loop;
  foreach t in array array['heroes', 'henchman_groups', 'items'] loop
    if jsonb_typeof(p_proposal.expected -> t) is distinct from 'array' then raise exception 'The proposal is missing its roster snapshot.' using errcode = '22023'; end if;
    expected_count := jsonb_array_length(p_proposal.expected -> t);
    actual_count := 0;
    for w in execute format('select id, updated_at from public.%I where warband_id in ($1,$2) order by id for update', t) using p_case.victim_warband_id, p_case.captor_warband_id loop
      actual_count := actual_count + 1;
      if not exists (select 1 from jsonb_array_elements(p_proposal.expected -> t) e where (e->>'id')::uuid = w.id and (e->>'updated_at')::timestamptz = w.updated_at) then
        raise exception 'A warband changed after this outcome was proposed. Propose it again from the current rosters.' using errcode = '40001';
      end if;
    end loop;
    if actual_count <> expected_count then raise exception 'A warband changed after this outcome was proposed. Propose it again from the current rosters.' using errcode = '40001'; end if;
  end loop;
  if not exists (select 1 from public.heroes where id = p_case.hero_id and warband_id = p_case.victim_warband_id and status = 'captured') then
    raise exception 'This warrior is no longer recorded as captured.' using errcode = 'P0001';
  end if;
  -- The consent check again, against the rosters as they stand now (unchanged, per the checks above).
  perform public.validate_captive_proposal(p_case, p_proposal.choice, p_proposal.owner_changes, p_proposal.captor_changes, p_proposal.advances);
  v_before := public.captive_roster_snapshot(p_case.victim_warband_id, p_case.captor_warband_id);
  v_reason := 'Captive outcome: ' || p_proposal.message;
  perform set_config('stirheim.captive_apply', '1', true);
  perform public.update_roster(p_case.victim_warband_id, v_reason, p_proposal.owner_changes);
  perform public.update_roster(p_case.captor_warband_id, v_reason, p_proposal.captor_changes);
  -- Every applied report of either warband for this battle is now load-bearing: undoing one would
  -- restore gold or experience the outcome has since moved.
  select coalesce(array_agg(id), '{}') into v_links from public.match_reports
    where match_id = p_case.match_id and warband_id in (p_case.victim_warband_id, p_case.captor_warband_id) and undo is not null;
  if p_proposal.choice->>'kind' = 'exchange' then
    -- The captor's returned captive has his own case (possibly from another battle): it is resolved
    -- by this proposal, and its report is protected too.
    update public.captive_cases set state = 'resolved', resolved_at = now(), resolution_kind = 'exchange', resolved_by_proposal = p_proposal.id,
           resolution_message = 'Returned in exchange: ' || p_proposal.message,
           history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'resolved_by_exchange', 'proposal_id', p_proposal.id)
      where hero_id = (p_proposal.choice->>'otherHeroId')::uuid and victim_warband_id = p_case.captor_warband_id and state in ('unassigned', 'open')
      returning report_id into v_partner_report;
    if v_partner_report is not null and not (v_partner_report = any(v_links)) then v_links := v_links || v_partner_report; end if;
    update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The captive was returned in an exchange.'
      where state = 'proposed' and case_id in (select id from public.captive_cases where resolved_by_proposal = p_proposal.id);
  end if;
  for a in select * from jsonb_array_elements(coalesce(p_proposal.advances, '[]'::jsonb)) loop
    if (a->>'warband_id')::uuid not in (p_case.victim_warband_id, p_case.captor_warband_id) then raise exception 'Advance belongs to another warband.' using errcode = '22023'; end if;
    v_id := null;
    insert into public.pending_advances (warband_id, subject_type, subject_id, threshold_xp)
    select (a->>'warband_id')::uuid, 'hero', (a->>'subject_id')::uuid, (a->>'threshold_xp')::int
    where exists (select 1 from public.heroes h where h.id = (a->>'subject_id')::uuid and h.warband_id = (a->>'warband_id')::uuid and h.xp >= (a->>'threshold_xp')::int)
      and not exists (select 1 from public.pending_advances p where p.subject_id = (a->>'subject_id')::uuid and p.threshold_xp = (a->>'threshold_xp')::int)
    returning id into v_id;
    if v_id is not null then v_ids := v_ids || v_id; end if;
  end loop;
  update public.captive_proposals set before_snapshot = v_before, after_snapshot = public.captive_roster_snapshot(p_case.victim_warband_id, p_case.captor_warband_id), advance_ids = v_ids, linked_report_ids = v_links where id = p_proposal.id;
end $$;
revoke all on function public.apply_captive_proposal(public.captive_cases, public.captive_proposals) from public;

create function public.notify_captive_resolved(p_case public.captive_cases, p_message text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
    select w.owner_id, 'captive', left(p_case.hero_name || ': captive outcome recorded', 140), left(p_message, 2000), '/warbands/' || w.id, 'captive:' || p_case.id || ':resolved:' || w.id || ':' || extract(epoch from now())::bigint
      from public.warbands w where w.id in (p_case.victim_warband_id, p_case.captor_warband_id)
    on conflict do nothing;
  update public.match_reports set notes = concat_ws(E'\n', nullif(notes, ''), p_case.hero_name || ': ' || p_message) where id = p_case.report_id;
end $$;
revoke all on function public.notify_captive_resolved(public.captive_cases, text) from public;

-- ---------------------------------------------------------------------------------------------
-- propose_captive_outcome: one side offers the exact outcome. A caller who edits both warbands
-- (same owner, or the GM) applies it at once; otherwise the other side is asked to accept.
-- ---------------------------------------------------------------------------------------------
create function public.propose_captive_outcome(p_case_id uuid, p_choice jsonb, p_message text, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb, p_expected jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare c public.captive_cases%rowtype; pr public.captive_proposals%rowtype; v_side uuid; v_both boolean; v_other uuid; v_other_owner uuid; v_name text; v_summary text;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into c from public.captive_cases where id = p_case_id;
  if not found then raise exception 'Captive case not found.' using errcode = 'P0002'; end if;
  if c.captor_warband_id is null then raise exception 'Name the captor before proposing an outcome.' using errcode = 'P0001'; end if;
  perform public.lock_captive_context(c.match_id, c.victim_warband_id, c.captor_warband_id);
  select * into c from public.captive_cases where id = p_case_id for update;
  if c.state <> 'open' or c.captor_warband_id is null then raise exception 'This captive case is not open for proposals.' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_owner_changes) <> 'array' or jsonb_typeof(p_captor_changes) <> 'array' then raise exception 'changes must be arrays' using errcode = '22023'; end if;
  if jsonb_typeof(p_choice) <> 'object' or coalesce(p_choice->>'kind', '') = '' then raise exception 'Choose an outcome.' using errcode = '22023'; end if;
  v_both := public.is_campaign_gm(public.match_campaign(c.match_id)) or (public.can_edit_warband(c.victim_warband_id) and public.can_edit_warband(c.captor_warband_id));
  if public.can_edit_warband(c.captor_warband_id) then v_side := c.captor_warband_id;
  elsif public.can_edit_warband(c.victim_warband_id) then v_side := c.victim_warband_id;
  elsif v_both then v_side := c.captor_warband_id;
  else raise exception 'Only a player of one of the two warbands or the campaign GM can propose a captive outcome.' using errcode = '42501'; end if;
  if not exists (select 1 from public.heroes where id = c.hero_id and warband_id = c.victim_warband_id and status = 'captured') then
    raise exception 'This warrior is no longer recorded as captured.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.match_reports where id = c.report_id and revision = c.report_revision and undo is not null) then
    raise exception 'The report that recorded this capture has changed. Review the latest report first.' using errcode = 'P0001';
  end if;
  -- The consent text is the server's own account of the validated changes, not the client's words.
  v_summary := public.validate_captive_proposal(c, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  -- The proposer's earlier open offer is replaced by this one.
  update public.captive_proposals set state = 'withdrawn', resolved_at = now(), reason = 'Replaced by a newer proposal.'
    where case_id = c.id and state = 'proposed' and proposed_by_warband_id = v_side;
  insert into public.captive_proposals (case_id, proposed_by_warband_id, proposed_by, choice, message, proposer_note, owner_changes, captor_changes, advances, expected)
    values (c.id, v_side, auth.uid(), p_choice, v_summary, left(btrim(coalesce(p_message, '')), 1000), p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb), p_expected)
    returning * into pr;
  if v_both then
    perform public.apply_captive_proposal(c, pr);
    update public.captive_proposals set state = 'accepted', responded_by = auth.uid(), resolved_at = now(), reason = 'Recorded directly by a player of both warbands or the GM.' where id = pr.id;
    update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The case was resolved.' where case_id = c.id and state = 'proposed';
    update public.captive_cases set state = 'resolved', resolved_at = now(), resolution_kind = p_choice->>'kind', resolution_message = pr.message,
           history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'resolved', 'proposal_id', pr.id) where id = c.id;
    perform public.notify_captive_resolved(c, pr.message);
    return pr.id;
  end if;
  v_other := case when v_side = c.captor_warband_id then c.victim_warband_id else c.captor_warband_id end;
  select owner_id into v_other_owner from public.warbands where id = v_other;
  select name into v_name from public.warbands where id = v_side;
  insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
    values (v_other_owner, 'captive', left(c.hero_name || ': outcome proposed by ' || v_name, 140), left(pr.message || ' Accept or reject it from your warband page.', 2000), '/warbands/' || v_other, 'captive:' || pr.id || ':proposed') on conflict do nothing;
  return pr.id;
end $$;
revoke all on function public.propose_captive_outcome(uuid, jsonb, text, jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.propose_captive_outcome(uuid, jsonb, text, jsonb, jsonb, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- respond_captive_proposal: the other side accepts (applies) or rejects; the proposer withdraws.
-- ---------------------------------------------------------------------------------------------
create function public.respond_captive_proposal(p_proposal_id uuid, p_action text, p_reason text default '')
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
  if c.state <> 'open' or c.captor_warband_id is null then raise exception 'This captive case is no longer open.' using errcode = 'P0001'; end if;
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
  perform public.apply_captive_proposal(c, pr);
  update public.captive_proposals set state = 'accepted', responded_by = auth.uid(), resolved_at = now(), reason = btrim(p_reason) where id = pr.id;
  update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The case was resolved by another proposal.' where case_id = c.id and state = 'proposed';
  update public.captive_cases set state = 'resolved', resolved_at = now(), resolution_kind = pr.choice->>'kind', resolution_message = pr.message,
         history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'resolved', 'proposal_id', pr.id) where id = c.id;
  perform public.notify_captive_resolved(c, pr.message);
end $$;
revoke all on function public.respond_captive_proposal(uuid, text, text) from public;
grant execute on function public.respond_captive_proposal(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- reverse_captive_resolution: the correction path. When both rosters still match the state recorded
-- right after the outcome was applied, restore both from the state recorded just before it and reopen
-- the case (the warrior is captured again). Allowed to the GM or a player who edits both warbands.
-- If either roster has moved on, automatic restoration refuses; the GM may instead release the report
-- dependency (p_release_only) and reconcile the rosters by hand.
-- ---------------------------------------------------------------------------------------------
create function public.reverse_captive_resolution(p_case_id uuid, p_reason text, p_release_only boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.captive_cases%rowtype; pr public.captive_proposals%rowtype; v_gm boolean; v_current jsonb; v_msg text; v_found boolean;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Explain why the outcome is being reversed.' using errcode = 'P0001'; end if;
  select * into c from public.captive_cases where id = p_case_id;
  if not found then raise exception 'Captive case not found.' using errcode = 'P0002'; end if;
  perform public.lock_captive_context(c.match_id, c.victim_warband_id, c.captor_warband_id);
  select * into c from public.captive_cases where id = p_case_id for update;
  if c.state <> 'resolved' then raise exception 'This captive case has no recorded outcome to reverse.' using errcode = 'P0001'; end if;
  v_gm := public.is_campaign_gm(public.match_campaign(c.match_id));
  if p_release_only and not v_gm then raise exception 'Only the campaign GM can release a captive outcome without restoring the rosters.' using errcode = '42501'; end if;
  if not (v_gm or (public.can_edit_warband(c.victim_warband_id) and public.can_edit_warband(c.captor_warband_id))) then
    raise exception 'Only the campaign GM, or a player of both warbands, can reverse a recorded captive outcome.' using errcode = '42501';
  end if;
  select * into pr from public.captive_proposals where case_id = c.id and state = 'accepted' order by resolved_at desc limit 1 for update;
  v_found := found;
  if p_release_only or not v_found or pr.before_snapshot is null then
    if not p_release_only then
      raise exception 'This outcome was recorded outside the proposal flow, so it cannot be restored automatically. The campaign GM can release it and correct both rosters by hand.' using errcode = 'P0001';
    end if;
    v_msg := 'Released by the GM without restoring rosters: ' || btrim(p_reason);
    if v_found then update public.captive_proposals set state = 'reversed', responded_by = auth.uid(), resolved_at = now(), reason = v_msg where id = pr.id; end if;
    update public.captive_cases set state = 'withdrawn', resolved_at = now(), resolution_message = v_msg,
           history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'released', 'reason', btrim(p_reason)) where id = c.id;
  else
    perform id from public.heroes where warband_id in (c.victim_warband_id, c.captor_warband_id) order by id for update;
    perform id from public.henchman_groups where warband_id in (c.victim_warband_id, c.captor_warband_id) order by id for update;
    perform id from public.items where warband_id in (c.victim_warband_id, c.captor_warband_id) order by id for update;
    v_current := public.captive_roster_snapshot(c.victim_warband_id, c.captor_warband_id);
    if v_current is distinct from pr.after_snapshot then
      raise exception 'One of the warbands has changed since this outcome was recorded, so it cannot be restored automatically. The campaign GM can release the report dependency and correct both rosters by hand.' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.pending_advances where id = any(pr.advance_ids) and resolved_at is not null) then
      raise exception 'An advance rolled from this outcome has already been resolved. The campaign GM must release and reconcile by hand.' using errcode = 'P0001';
    end if;
    v_msg := 'Captive outcome reversed: ' || btrim(p_reason);
    perform set_config('stirheim.audit_reason', v_msg, true);
    perform set_config('stirheim.captive_apply', '1', true);
    delete from public.pending_advances where id = any(pr.advance_ids);
    delete from public.items where warband_id in (c.victim_warband_id, c.captor_warband_id);
    delete from public.heroes where warband_id in (c.victim_warband_id, c.captor_warband_id)
      and id not in (select (x->>'id')::uuid from jsonb_array_elements(pr.before_snapshot->'heroes') x);
    delete from public.henchman_groups where warband_id in (c.victim_warband_id, c.captor_warband_id)
      and id not in (select (x->>'id')::uuid from jsonb_array_elements(pr.before_snapshot->'henchman_groups') x);
    update public.warbands w set gold = r.gold, wyrdstone = r.wyrdstone, veteran_pool = r.veteran_pool, notes = r.notes
      from (select (jsonb_populate_record(null::public.warbands, x)).* from jsonb_array_elements(pr.before_snapshot->'warbands') x) r where r.id = w.id;
    update public.heroes h set warband_id = r.warband_id, name = r.name, is_hired_sword = r.is_hired_sword, unit_type_rules_id = r.unit_type_rules_id, hired_sword_rules_id = r.hired_sword_rules_id,
           stats = r.stats, xp = r.xp, level_ups = r.level_ups, skill_tables = r.skill_tables, skills = r.skills, spells = r.spells, injuries = r.injuries, flags = r.flags,
           equipment_locked = r.equipment_locked, is_large = r.is_large, status = r.status, notes = r.notes, sort_order = r.sort_order
      from (select (jsonb_populate_record(null::public.heroes, x)).* from jsonb_array_elements(pr.before_snapshot->'heroes') x) r where r.id = h.id;
    insert into public.heroes select (jsonb_populate_record(null::public.heroes, x)).* from jsonb_array_elements(pr.before_snapshot->'heroes') x
      where not exists (select 1 from public.heroes h where h.id = (x->>'id')::uuid);
    update public.henchman_groups g set warband_id = r.warband_id, name = r.name, unit_type_rules_id = r.unit_type_rules_id, size = r.size, stats = r.stats, xp = r.xp, level_ups = r.level_ups,
           stat_increases = r.stat_increases, is_large = r.is_large, notes = r.notes, sort_order = r.sort_order, model_names = r.model_names, campaign_state = r.campaign_state
      from (select (jsonb_populate_record(null::public.henchman_groups, x)).* from jsonb_array_elements(pr.before_snapshot->'henchman_groups') x) r where r.id = g.id;
    insert into public.henchman_groups select (jsonb_populate_record(null::public.henchman_groups, x)).* from jsonb_array_elements(pr.before_snapshot->'henchman_groups') x
      where not exists (select 1 from public.henchman_groups g where g.id = (x->>'id')::uuid);
    insert into public.items select (jsonb_populate_record(null::public.items, x)).* from jsonb_array_elements(pr.before_snapshot->'items') x;
    update public.captive_proposals set state = 'reversed', responded_by = auth.uid(), resolved_at = now(), reason = btrim(p_reason) where id = pr.id;
    update public.captive_cases set state = 'open', resolved_at = null, resolution_kind = null, resolution_message = '',
           history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'reversed', 'proposal_id', pr.id, 'reason', btrim(p_reason)) where id = c.id;
    -- An exchanged partner is captured again too.
    update public.captive_cases set state = 'open', resolved_at = null, resolution_kind = null, resolution_message = '', resolved_by_proposal = null,
           history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'reversed_by_exchange', 'proposal_id', pr.id) where resolved_by_proposal = pr.id;
  end if;
  update public.match_reports set notes = concat_ws(E'\n', nullif(notes, ''), c.hero_name || ': ' || v_msg) where id = c.report_id;
  insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
    select w.owner_id, 'captive', left(c.hero_name || ': captive outcome reversed', 140), left(v_msg, 2000), '/warbands/' || w.id, 'captive:' || c.id || ':reversed:' || w.id || ':' || extract(epoch from now())::bigint
      from public.warbands w where w.id in (c.victim_warband_id, c.captor_warband_id) on conflict do nothing;
end $$;
revoke all on function public.reverse_captive_resolution(uuid, text, boolean) from public;
grant execute on function public.reverse_captive_resolution(uuid, text, boolean) to authenticated;
