-- Respect the player’s saved Scout choice when unpaid Maglah leaves.
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
            and s.hired_sword_rules_id = 'hobgoblin_scout' and s.status = 'active' order by (s.id::text = u.flags->>'retainedScoutId') desc nulls last, s.created_at, s.id limit 1))
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
