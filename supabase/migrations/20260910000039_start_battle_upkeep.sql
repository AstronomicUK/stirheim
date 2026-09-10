-- #219: read-only preview, followed by acknowledged atomic dismissal at battle start.
create or replace function public.unpaid_match_hires(p_match_id uuid)
returns table(id uuid, name text, warband_id uuid, warband_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not (public.is_match_participant(p_match_id) or public.is_campaign_gm(public.match_campaign(p_match_id))) then
    raise exception 'only a participant or the GM can check battle upkeep' using errcode = '42501';
  end if;
  return query
  with unpaid as (
    select h.* from public.heroes h
    join public.match_participants mp on mp.warband_id = h.warband_id and mp.match_id = p_match_id
    where h.is_hired_sword and h.status = 'active' and nullif(h.flags ->> 'upkeepOwedAfter', '') is not null
  ), departing as (
    select h.id from public.heroes h
    where h.status = 'active' and h.is_hired_sword and exists (
      select 1 from unpaid u where u.warband_id = h.warband_id and (
        h.id = u.id
        or (nullif(u.flags ->> 'hireGroupId','') is not null
          and coalesce((u.flags ->> 'hireCompanion')::boolean, false) = false
          and h.flags ->> 'hireGroupId' = u.flags ->> 'hireGroupId')
        or (u.hired_sword_rules_id = 'maglah_khan_s_horde' and h.hired_sword_rules_id = 'hobgoblin_scout'
          and h.id <> (select s.id from public.heroes s where s.warband_id = h.warband_id
            and s.hired_sword_rules_id = 'hobgoblin_scout' and s.status = 'active' order by s.created_at, s.id limit 1))
      )
    )
  )
  select h.id, h.name, h.warband_id, w.name from departing d
  join public.heroes h on h.id = d.id join public.warbands w on w.id = h.warband_id
  order by h.warband_id, h.id;
end;
$$;
revoke all on function public.unpaid_match_hires(uuid) from public;
grant execute on function public.unpaid_match_hires(uuid) to authenticated;

-- Replace the old signature: clients must acknowledge precisely the currently unpaid set.
drop function public.start_match(uuid, public.combat_mode);

create function public.start_match(p_match_id uuid, p_combat_mode public.combat_mode default null, p_unpaid_ids uuid[] default null)
returns public.match_state
language plpgsql
volatile
security definer
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
  v_unpaid uuid[];
  v_ack uuid[];
begin
  select state into v_state from public.matches where id = p_match_id for update;
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

  -- Share roster locks with payment/trading, in deterministic order.
  perform w.id from public.warbands w join public.match_participants mp on mp.warband_id = w.id
    where mp.match_id = p_match_id order by w.id for update of w;
  perform h.id from public.heroes h join public.match_participants mp on mp.warband_id = h.warband_id
    where mp.match_id = p_match_id order by h.id for update of h;
  select coalesce(array_agg(u.id order by u.id), '{}'::uuid[]) into v_unpaid from public.unpaid_match_hires(p_match_id) u;
  select coalesce(array_agg(distinct x order by x), '{}'::uuid[]) into v_ack from unnest(p_unpaid_ids) x;
  if cardinality(v_unpaid) > 0 and v_unpaid <> v_ack then
    raise exception 'Upkeep has changed. Review unpaid hired characters before starting this battle.' using errcode = 'P0001';
  end if;
  perform set_config('stirheim.audit_reason', 'Unpaid upkeep: dismissed before starting battle ' || p_match_id::text, true);
  update public.heroes set status = 'left', flags = flags - 'upkeepOwedAfter' - 'contractCheckOwed'
    where id = any(v_unpaid);
  perform set_config('stirheim.audit_reason', 'start_match', true);
  update public.matches set state = 'in_progress', started_at = now(), combat_mode = v_mode where id = p_match_id;
  return 'in_progress';
end;
$$;

revoke all on function public.start_match(uuid, public.combat_mode, uuid[]) from public;
grant execute on function public.start_match(uuid, public.combat_mode, uuid[]) to authenticated;
