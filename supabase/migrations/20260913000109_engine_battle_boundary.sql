-- Engine journeys happen between battles (equipment, Hashut's Reward). Keep a pending
-- agreement from removing a currently fighting escort/Engine, including simultaneous start.
-- The same warband rows used by start_match serialize both directions without changing
-- the campaign's existing concurrent-match preference.
create function public.guard_engine_journey_battle_boundary() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.state = old.state then return new; end if;
  -- Cancelling a pending proposal is harmless; reversing an away journey restores a roster.
  if new.state = 'cancelled' and (tg_op = 'INSERT' or old.state <> 'away') then return new; end if;
  perform id from public.warbands where id = new.warband_id for update;
  if exists (select 1 from public.match_participants mp join public.matches m on m.id = mp.match_id
    where mp.warband_id = new.warband_id and m.state = 'in_progress') then
    raise exception 'This warband is fighting a battle. Arrange or complete its Engine journey between battles.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.guard_engine_journey_battle_boundary() from public;
create trigger guard_engine_journey_battle_boundary before insert or update of state on public.engine_journeys
for each row execute function public.guard_engine_journey_battle_boundary();

create function public.guard_match_pending_engine_journey() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if new.state <> 'in_progress' then return new; end if;
  if tg_op = 'UPDATE' and old.state = 'in_progress' then return new; end if;
  perform w.id from public.warbands w join public.match_participants mp on mp.warband_id = w.id
    where mp.match_id = new.id order by w.id for update of w;
  select w.name into v_name from public.engine_journeys j join public.warbands w on w.id = j.warband_id
    join public.match_participants mp on mp.warband_id = j.warband_id
    where mp.match_id = new.id and j.state = 'pending' order by w.id limit 1;
  if found then
    raise exception '% has an Engine journey awaiting agreements. Finish or cancel that journey on the warband page before starting this battle.', v_name using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.guard_match_pending_engine_journey() from public;
create trigger guard_match_pending_engine_journey before insert or update of state on public.matches
for each row execute function public.guard_match_pending_engine_journey();

-- Settlement can also be entered by finishing an agreed subset. Lock the warband before
-- touching its escort or stock, just as dispatch/return/start_match do. A late trigger lock
-- alone would invert that order and could deadlock with match start.
do $$
declare original text; updated text;
begin
  select pg_get_functiondef('public.engine_journey_settle(uuid)'::regprocedure) into original;
  updated := replace(original,
    $old$if not found or j.state <> 'pending' then return; end if;$old$,
    $new$if not found or j.state <> 'pending' then return; end if;
  perform id from public.warbands where id = j.warband_id for update;$new$);
  if original = updated then raise exception 'Engine settlement lock anchor was not found.'; end if;
  execute updated;
end $$;
