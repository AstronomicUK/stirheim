-- Stirheim - Campaign Ledger. Phase 3 migration 1 of 3: schema.
--
-- Conventions
--   * Ids are UUIDs. Columns ending in _rules_id are stable string keys into the rules data
--     shipped with the client (src/rules/data): warband templates, unit templates, items,
--     skills, spells, hired swords, scenarios. The database never stores rules text.
--   * jsonb columns hold the same shapes as src/rules/types/roster.ts (camelCase keys), so a
--     row maps onto the resolver model with no translation: stats {M,WS,BS,S,T,W,I,A,Ld},
--     injuries AppliedInjury[], flags WarriorFlags, stat_increases Partial<Record<StatKey,n>>.
--   * Every table has created_at/updated_at maintained by trigger.
--   * Row Level Security is enabled in migration 2; the audit log in migration 3.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------------------------

create type public.warrior_status as enum ('active', 'dead', 'retired', 'captured', 'left');
create type public.item_holder as enum ('stash', 'hero', 'group');
create type public.match_state as enum (
  'scheduled', 'in_progress', 'awaiting_reports', 'completed', 'cancelled'
);
create type public.match_origin as enum ('gm', 'challenge');
create type public.advance_subject as enum ('hero', 'group');

-- ---------------------------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- A characteristics profile: nine integer stats keyed as in src/rules/types/index.ts Stats.
create or replace function public.is_stats_profile(v jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(v) = 'object'
     and v ?& array['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld']
     and (select bool_and(jsonb_typeof(v -> k) = 'number')
            from unnest(array['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld']) as k);
$$;

-- Invite codes are short, unambiguous and case-insensitive: 8 characters from an alphabet that
-- drops 0/O and 1/I/L. About 2^37 combinations; collisions are retried by the caller loop.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  code text := '';
  i int;
begin
  for i in 1..8 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return substr(code, 1, 4) || '-' || substr(code, 5, 4);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Profiles: one per auth user, created by trigger on sign-up.
-- ---------------------------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing user profile; display_name is what other campaign members see.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    left(coalesce(requested, split_part(coalesce(new.email, 'warrior'), '@', 1), 'Warrior'), 40)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------------------------
-- Warbands and their warriors
-- ---------------------------------------------------------------------------------------------

create table public.warbands (
  id uuid primary key default gen_random_uuid(),
  -- Defaults to the signed-in user so the client never sends it; RLS rejects any other value.
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  type_rules_id text not null,
  gold integer not null default 0 check (gold >= 0),
  wyrdstone integer not null default 0 check (wyrdstone >= 0),
  veteran_pool integer check (veteran_pool between 2 and 12),
  notes text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.warbands.type_rules_id is 'WARBAND_TEMPLATES[].id, e.g. mercenaries_reikland';
comment on column public.warbands.veteran_pool is '2D6 rolled at the last post-battle submission; caps experience of new henchmen.';

create index warbands_owner_idx on public.warbands (owner_id);

create trigger warbands_set_updated_at
  before update on public.warbands
  for each row execute function public.set_updated_at();

create table public.heroes (
  id uuid primary key default gen_random_uuid(),
  warband_id uuid not null references public.warbands (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  is_hired_sword boolean not null default false,
  unit_type_rules_id text,
  hired_sword_rules_id text,
  stats jsonb not null check (public.is_stats_profile(stats)),
  xp integer not null default 0 check (xp >= 0),
  level_ups integer not null default 0 check (level_ups >= 0),
  skill_tables text[] not null default '{}',
  skills text[] not null default '{}',
  spells text[] not null default '{}',
  injuries jsonb not null default '[]'::jsonb check (jsonb_typeof(injuries) = 'array'),
  flags jsonb not null default '{}'::jsonb check (jsonb_typeof(flags) = 'object'),
  equipment_locked boolean not null default false,
  is_large boolean not null default false,
  status public.warrior_status not null default 'active',
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint heroes_rules_id_matches_kind check (
    (is_hired_sword and hired_sword_rules_id is not null)
    or (not is_hired_sword and unit_type_rules_id is not null)
  )
);

comment on table public.heroes is 'Heroes and hired swords (is_hired_sword). Maps to RosterHero / RosterHiredSword.';
comment on column public.heroes.equipment_locked is 'Hired swords: equipment fixed by their entry, cannot be bought or sold.';

create index heroes_warband_idx on public.heroes (warband_id, sort_order);

create trigger heroes_set_updated_at
  before update on public.heroes
  for each row execute function public.set_updated_at();

create table public.henchman_groups (
  id uuid primary key default gen_random_uuid(),
  warband_id uuid not null references public.warbands (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  unit_type_rules_id text not null,
  size integer not null default 1 check (size >= 0),
  stats jsonb not null check (public.is_stats_profile(stats)),
  xp integer not null default 0 check (xp >= 0),
  level_ups integer not null default 0 check (level_ups >= 0),
  stat_increases jsonb not null default '{}'::jsonb check (jsonb_typeof(stat_increases) = 'object'),
  is_large boolean not null default false,
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.henchman_groups is 'Maps to RosterHenchmanGroup; size 0 keeps a wiped-out group for history.';

create index henchman_groups_warband_idx on public.henchman_groups (warband_id, sort_order);

create trigger henchman_groups_set_updated_at
  before update on public.henchman_groups
  for each row execute function public.set_updated_at();

create table public.items (
  id uuid primary key default gen_random_uuid(),
  warband_id uuid not null references public.warbands (id) on delete cascade,
  holder_type public.item_holder not null default 'stash',
  holder_id uuid,
  item_rules_id text,
  custom_name text check (custom_name is null or char_length(custom_name) between 1 and 80),
  quantity integer not null default 1 check (quantity > 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_holder_id_matches_type check ((holder_type = 'stash') = (holder_id is null)),
  constraint items_named check (item_rules_id is not null or custom_name is not null)
);

comment on table public.items is 'One row per stack. Maps to RosterItem; holder is the stash, a hero or a henchman group of the same warband.';

create index items_warband_idx on public.items (warband_id);
create index items_holder_idx on public.items (holder_id) where holder_id is not null;

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- holder_id is polymorphic (hero or group) so it cannot be a foreign key; check it by trigger.
create or replace function public.items_check_holder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.holder_type = 'hero' and not exists (
    select 1 from public.heroes h where h.id = new.holder_id and h.warband_id = new.warband_id
  ) then
    raise exception 'item holder % is not a hero of warband %', new.holder_id, new.warband_id
      using errcode = 'foreign_key_violation';
  end if;
  if new.holder_type = 'group' and not exists (
    select 1 from public.henchman_groups g where g.id = new.holder_id and g.warband_id = new.warband_id
  ) then
    raise exception 'item holder % is not a henchman group of warband %', new.holder_id, new.warband_id
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger items_check_holder
  before insert or update of holder_type, holder_id, warband_id on public.items
  for each row execute function public.items_check_holder();

-- Deleting a warrior returns its equipment to the stash rather than losing it.
create or replace function public.items_release_holder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.items
     set holder_type = 'stash', holder_id = null
   where holder_id = old.id;
  return old;
end;
$$;

create trigger heroes_release_items
  before delete on public.heroes
  for each row execute function public.items_release_holder();

create trigger henchman_groups_release_items
  before delete on public.henchman_groups
  for each row execute function public.items_release_holder();

-- ---------------------------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------------------------

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  gm_id uuid not null default auth.uid() references auth.users (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  invite_code text not null unique default public.generate_invite_code(),
  settings jsonb not null default jsonb_build_object(
    'startingGold', 500,
    'maxRosters', null,
    'houseRules', jsonb_build_object(
      'strengthArmourPiercing', false,
      'optionalCriticalTables', true,
      'halfPriceArmour', true
    ),
    'dicePolicy', 'players_roll'
  ) check (jsonb_typeof(settings) = 'object'),
  rules_markdown text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.campaigns.settings is 'CampaignSettings (src/domain): startingGold, maxRosters, houseRules (CampaignHouseRules), dicePolicy.';

create index campaigns_gm_idx on public.campaigns (gm_id);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (campaign_id, warband_id)
);

comment on table public.campaign_members is 'A warband enrolled in a campaign. user_id is always the warband owner (set by trigger).';

-- A warband plays in at most one campaign at a time.
create unique index campaign_members_one_active_campaign
  on public.campaign_members (warband_id) where left_at is null;
create index campaign_members_user_idx on public.campaign_members (user_id);

create or replace function public.campaign_members_set_user()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select owner_id into new.user_id from public.warbands where id = new.warband_id;
  if new.user_id is null then
    raise exception 'warband % not found', new.warband_id using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger campaign_members_set_user
  before insert or update of warband_id on public.campaign_members
  for each row execute function public.campaign_members_set_user();

-- ---------------------------------------------------------------------------------------------
-- Scenarios (custom). Built-in scenarios ship with the client and are referenced by rules id.
-- ---------------------------------------------------------------------------------------------

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  setting text not null default 'Custom',
  summary text not null default '',
  rules_markdown text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scenarios_owner_idx on public.scenarios (owner_id);

create trigger scenarios_set_updated_at
  before update on public.scenarios
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Matches
-- ---------------------------------------------------------------------------------------------

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  scenario_rules_id text,
  custom_scenario_id uuid references public.scenarios (id) on delete set null,
  state public.match_state not null default 'scheduled',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_via public.match_origin not null default 'gm',
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_one_scenario check (
    num_nonnulls(scenario_rules_id, custom_scenario_id) <= 1
  )
);

create index matches_campaign_idx on public.matches (campaign_id, state);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create table public.match_participants (
  match_id uuid not null references public.matches (id) on delete cascade,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (match_id, warband_id)
);

comment on column public.match_participants.accepted_at is 'Challenges: null until the challenged player accepts. GM-scheduled matches are pre-accepted.';

create index match_participants_warband_idx on public.match_participants (warband_id);

create table public.battle_sessions (
  match_id uuid not null references public.matches (id) on delete cascade,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  live_state jsonb not null default '{}'::jsonb check (jsonb_typeof(live_state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (match_id, warband_id)
);

comment on table public.battle_sessions is 'The in-progress battle sheet for one warband: XP log, out-of-action list, loot, notes. Overwritten as the player taps.';

create trigger battle_sessions_set_updated_at
  before update on public.battle_sessions
  for each row execute function public.set_updated_at();

create table public.match_reports (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  submitted_by uuid not null references auth.users (id) on delete restrict,
  won boolean not null default false,
  xp_log jsonb not null default '[]'::jsonb check (jsonb_typeof(xp_log) = 'array'),
  ooa jsonb not null default '[]'::jsonb check (jsonb_typeof(ooa) = 'array'),
  injuries jsonb not null default '[]'::jsonb check (jsonb_typeof(injuries) = 'array'),
  loot jsonb not null default '{}'::jsonb check (jsonb_typeof(loot) = 'object'),
  exploration jsonb not null default '{}'::jsonb check (jsonb_typeof(exploration) = 'object'),
  veteran_pool_roll integer check (veteran_pool_roll between 2 and 12),
  notes text not null default '',
  submitted_at timestamptz not null default now(),
  unique (match_id, warband_id)
);

comment on table public.match_reports is 'Immutable once submitted (no update policy). The GM may delete one so the player can resubmit.';

create table public.pending_advances (
  id uuid primary key default gen_random_uuid(),
  warband_id uuid not null references public.warbands (id) on delete cascade,
  subject_type public.advance_subject not null,
  subject_id uuid not null,
  threshold_xp integer not null check (threshold_xp > 0),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution jsonb check (resolution is null or jsonb_typeof(resolution) = 'object'),
  constraint pending_advances_resolution_pairs check ((resolved_at is null) = (resolution is null))
);

create index pending_advances_open_idx on public.pending_advances (warband_id) where resolved_at is null;

create table public.trade_phase_state (
  warband_id uuid not null references public.warbands (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  wyrdstone_sold boolean not null default false,
  heroes_searched uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (warband_id, match_id)
);

comment on table public.trade_phase_state is 'Once-per-post-battle limits: one wyrdstone sale, one rare-item search per hero.';

create trigger trade_phase_state_set_updated_at
  before update on public.trade_phase_state
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Realtime: phones at the table watch these change.
-- ---------------------------------------------------------------------------------------------

alter publication supabase_realtime add table
  public.matches, public.match_participants, public.battle_sessions, public.match_reports;
