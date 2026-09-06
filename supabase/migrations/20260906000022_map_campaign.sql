-- Phase 19: map campaigns on the Mordheim Campaign Map.
--
-- 1. matches.district_id: where the battle is fought (an id from the map data; free text so the
--    rules data can grow without a migration). Set when scheduling; changeable while the match is
--    open by the GM or a participant (set_match_district).
-- 2. map_adjustments: the GM's manual corrections to the map state, with a reason. Explored marks
--    and footholds are otherwise derived from completed battles (both sides explore the district,
--    the winner gains a foothold, the loser loses theirs), so this table only holds exceptions:
--    granting a foothold for a game played off the app, taking one away, marking a district
--    explored. Rows are never deleted; a later row for the same warband and district supersedes.
-- 3. settings.mapCampaign: the campaign is played on the map (default false).

alter table public.matches add column district_id text;
comment on column public.matches.district_id is 'Map campaigns: the district this battle is fought in (rules data id). Null for campaigns without the map.';

-- schedule_match gains the district.
drop function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text);
create function public.schedule_match(
  p_campaign_id uuid,
  p_warband_ids uuid[],
  p_scenario_rules_id text default null,
  p_custom_scenario_id uuid default null,
  p_scheduled_for timestamptz default null,
  p_notes text default '',
  p_district_id text default null
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

  perform set_config('stirheim.audit_reason', case when v_is_gm then 'schedule' else 'challenge' end, true);

  insert into public.matches (campaign_id, scenario_rules_id, custom_scenario_id, created_by, created_via, scheduled_for, notes, district_id)
  values (p_campaign_id, p_scenario_rules_id, p_custom_scenario_id, v_uid,
          case when v_is_gm then 'gm'::public.match_origin else 'challenge'::public.match_origin end,
          p_scheduled_for, coalesce(p_notes, ''), nullif(trim(p_district_id), ''))
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

revoke all on function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text, text) from public;
grant execute on function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text, text) to authenticated;

-- Change the district of an open match (GM or a participant), with the change on the audit log.
create or replace function public.set_match_district(p_match_id uuid, p_district_id text)
returns void
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
  if v_state in ('completed', 'cancelled') then
    raise exception 'this match is %, so its district cannot change', v_state using errcode = 'P0001';
  end if;
  if not public.is_match_participant(p_match_id) and not public.is_campaign_gm(public.match_campaign(p_match_id)) then
    raise exception 'only a participant or the GM can move the battle' using errcode = '42501';
  end if;
  perform set_config('stirheim.audit_reason', 'set_district', true);
  update public.matches set district_id = nullif(trim(p_district_id), '') where id = p_match_id;
end;
$$;

revoke all on function public.set_match_district(uuid, text) from public;
grant execute on function public.set_match_district(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- map_adjustments
-- ---------------------------------------------------------------------------------------------
create table public.map_adjustments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  district_id text not null,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  -- what is being set: an explored mark or a foothold
  kind text not null check (kind in ('explored', 'foothold')),
  -- true grants it, false takes it away
  value boolean not null,
  reason text not null default '',
  actor_id uuid not null references auth.users (id) on delete restrict,
  at timestamptz not null default now()
);
create index map_adjustments_campaign_idx on public.map_adjustments (campaign_id, at);
comment on table public.map_adjustments is 'Map campaigns: GM corrections to explored marks and footholds, with a reason. Applied in time order on top of what battles derive.';

alter table public.map_adjustments
  add constraint map_adjustments_actor_profile_fkey foreign key (actor_id) references public.profiles (user_id) on delete restrict;

alter table public.map_adjustments enable row level security;

create policy map_adjustments_select on public.map_adjustments
  for select to authenticated using (public.can_read_campaign(campaign_id));

create policy map_adjustments_insert_gm on public.map_adjustments
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and public.is_campaign_gm(campaign_id)
    and exists (select 1 from public.campaign_members m where m.campaign_id = map_adjustments.campaign_id and m.warband_id = map_adjustments.warband_id)
  );

-- ---------------------------------------------------------------------------------------------
-- Settings default
-- ---------------------------------------------------------------------------------------------
alter table public.campaigns alter column settings set default jsonb_build_object(
  'startingGold', 500,
  'maxRosters', null,
  'houseRules', jsonb_build_object(
    'strengthArmourPiercing', false,
    'optionalCriticalTables', true,
    'halfPriceArmour', true,
    'rabbitsFootBattleOnly', true,
    'bans', jsonb_build_object('items', '[]'::jsonb, 'spells', '[]'::jsonb, 'hiredSwords', '[]'::jsonb, 'characters', '[]'::jsonb, 'skills', '[]'::jsonb)
  ),
  'dicePolicy', 'players_roll',
  'combatMode', 'app',
  'lockCombatMode', false,
  'reportApproval', false,
  'mapCampaign', false
);
