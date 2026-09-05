-- Phase 12: a trading-post visit can carry its own audit reason, so a price the player overrode
-- ("trading · Price overridden: 10 gc → 5 gc (GM ruling)") shows up in the activity feed.

drop function public.record_trade(uuid, uuid, jsonb, boolean, uuid[]);

create function public.record_trade(
  p_warband_id uuid,
  p_match_id uuid default null,
  p_changes jsonb default '[]'::jsonb,
  p_wyrdstone_sold boolean default false,
  p_heroes_searched uuid[] default '{}'::uuid[],
  p_reason text default null
)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_state public.trade_phase_state%rowtype;
  v_sold boolean := coalesce(p_wyrdstone_sold, false);
  v_searched uuid[] := coalesce(p_heroes_searched, '{}'::uuid[]);
  v_count int;
  v_rows int;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  v_count := public.update_roster(p_warband_id, coalesce(nullif(trim(p_reason), ''), 'trading'), coalesce(p_changes, '[]'::jsonb));

  if p_match_id is null then
    return v_count;
  end if;

  select * into v_state
    from public.trade_phase_state s
   where s.warband_id = p_warband_id and s.match_id = p_match_id
   for update;

  if found then
    if v_state.wyrdstone_sold and v_sold then
      raise exception 'wyrdstone already sold this post-battle phase' using errcode = 'P0001';
    end if;
    if v_state.heroes_searched && v_searched then
      raise exception 'hero has already searched this phase' using errcode = 'P0001';
    end if;
    update public.trade_phase_state
       set wyrdstone_sold = wyrdstone_sold or v_sold,
           heroes_searched = heroes_searched || v_searched
     where warband_id = p_warband_id and match_id = p_match_id;
    get diagnostics v_rows = row_count;
  else
    insert into public.trade_phase_state (warband_id, match_id, wyrdstone_sold, heroes_searched)
    values (p_warband_id, p_match_id, v_sold, v_searched);
    get diagnostics v_rows = row_count;
  end if;

  if v_rows = 0 then
    raise exception 'only the warband owner or the GM can trade for it' using errcode = '42501';
  end if;

  return v_count;
end;
$$;

comment on function public.record_trade(uuid, uuid, jsonb, boolean, uuid[], text) is
  'Apply a trading-post batch (reason trading, or p_reason when given) and, when a match is given, enforce and record the once-per-phase limits in trade_phase_state.';

revoke all on function public.record_trade(uuid, uuid, jsonb, boolean, uuid[], text) from public;
grant execute on function public.record_trade(uuid, uuid, jsonb, boolean, uuid[], text) to authenticated;
