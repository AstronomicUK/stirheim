-- Phase 11: how a game is scored. "app" = the battle sheet offers the attack calculator and, later,
-- the shared combat log; "players" = tally sheets only, the the existing tracker way. Chosen when the match
-- starts; the campaign settings carry the default and an optional lock (players may not change it).

create type public.combat_mode as enum ('app', 'players');

alter table public.matches add column combat_mode public.combat_mode not null default 'app';
comment on column public.matches.combat_mode is 'app: the sheet calculates combat; players: tally sheets only. Set by start_match from the campaign default unless overridden.';

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
  'lockCombatMode', false
);
update public.campaigns set settings = settings || '{"combatMode": "app", "lockCombatMode": false}'::jsonb where not settings ? 'combatMode';
comment on column public.campaigns.settings is 'CampaignSettings (src/domain): startingGold, maxRosters, houseRules (CampaignHouseRules), dicePolicy, combatMode, lockCombatMode.';

drop function public.start_match(uuid);

-- start_match: any participant or the GM, once everyone has accepted. scheduled -> in_progress.
-- p_combat_mode null = the campaign default; a different mode is refused when the campaign locks
-- it, unless the caller is the GM.
create function public.start_match(p_match_id uuid, p_combat_mode public.combat_mode default null)
returns public.match_state
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_pending int;
  v_settings jsonb;
  v_default public.combat_mode;
  v_locked boolean;
  v_mode public.combat_mode;
  v_gm boolean;
begin
  select state into v_state from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state <> 'scheduled' then
    raise exception 'this match is already %', v_state using errcode = 'P0001';
  end if;
  v_gm := public.is_campaign_gm(public.match_campaign(p_match_id));
  if not public.is_match_participant(p_match_id) and not v_gm then
    raise exception 'only a participant or the GM can start the battle' using errcode = '42501';
  end if;
  select count(*) into v_pending from public.match_participants where match_id = p_match_id and accepted_at is null;
  if v_pending > 0 then
    raise exception '% warband(s) have not accepted yet', v_pending using errcode = 'P0001';
  end if;
  if (select count(*) from public.match_participants where match_id = p_match_id) < 2 then
    raise exception 'a battle needs at least two warbands' using errcode = 'P0001';
  end if;

  select settings into v_settings from public.campaigns where id = public.match_campaign(p_match_id);
  v_default := coalesce(v_settings ->> 'combatMode', 'app')::public.combat_mode;
  v_locked := coalesce((v_settings ->> 'lockCombatMode')::boolean, false);
  v_mode := coalesce(p_combat_mode, v_default);
  if v_mode <> v_default and v_locked and not v_gm then
    raise exception 'the GM has fixed how combat is scored in this campaign' using errcode = '42501';
  end if;

  perform set_config('stirheim.audit_reason', 'start_match', true);
  update public.matches set state = 'in_progress', started_at = now(), combat_mode = v_mode where id = p_match_id;
  return 'in_progress';
end;
$$;

revoke all on function public.start_match(uuid, public.combat_mode) from public;
grant execute on function public.start_match(uuid, public.combat_mode) to authenticated;
