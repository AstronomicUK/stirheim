-- A scenario picked by "Roll for a scenario" says so wherever it is shown afterwards, the same way
-- a report already says which dice were entered by hand versus rolled in the app.

alter table public.matches add column scenario_randomly_chosen boolean not null default false;
comment on column public.matches.scenario_randomly_chosen is 'The scenario came from "Roll for a scenario" rather than being picked by hand.';

drop function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text, text);
create function public.schedule_match(
  p_campaign_id uuid,
  p_warband_ids uuid[],
  p_scenario_rules_id text default null,
  p_custom_scenario_id uuid default null,
  p_scheduled_for timestamptz default null,
  p_notes text default '',
  p_district_id text default null,
  p_scenario_randomly_chosen boolean default false
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

  insert into public.matches (campaign_id, scenario_rules_id, custom_scenario_id, created_by, created_via, scheduled_for, notes, district_id, scenario_randomly_chosen)
  values (p_campaign_id, p_scenario_rules_id, p_custom_scenario_id, v_uid,
          case when v_is_gm then 'gm'::public.match_origin else 'challenge'::public.match_origin end,
          p_scheduled_for, coalesce(p_notes, ''), nullif(trim(p_district_id), ''), coalesce(p_scenario_randomly_chosen, false))
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

revoke all on function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text, text, boolean) from public;
grant execute on function public.schedule_match(uuid, uuid[], text, uuid, timestamptz, text, text, boolean) to authenticated;
