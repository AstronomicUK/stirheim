-- Stable casualty identity for battle events. A casualty recorded at the table (players-calculated
-- combat, a spell, a fall) and one calculated by the app must never both stand for the same model
-- going down, because 092/093 count unreverted out-of-action events to number a group's casualties.
-- Manual markers carry payload.casualty_token = casualty:<match>:<victim warband>:<target id>:manual:<raw
-- index> (the sheet's raw tally slot, 0-based) and metadata_only:true, so tally, condition and XP
-- consumers skip them while the capture triggers read them; the database keeps at most one
-- unreverted event per token. mark_casualty_event returns the standing marker for identical content,
-- replaces it atomically when the attribution changed, and unmark_casualty_event reverts it through
-- the existing revert path, so the log keeps its history. App-calculated attack events never carry
-- tokens; their casualties are numbered by time among ordinary (non-marker) events, and a marker's
-- casualty number is that count plus its raw index.

create unique index battle_events_casualty_token_key on public.battle_events ((payload->>'casualty_token')) where reverted_at is null and payload ? 'casualty_token';

create function public.casualty_token(p_match_id uuid, p_target_warband_id uuid, p_target_id text, p_index integer) returns text language sql immutable as $$
  select 'casualty:' || p_match_id || ':' || p_target_warband_id || ':' || p_target_id || ':manual:' || p_index;
$$;
grant execute on function public.casualty_token(uuid, uuid, text, integer) to authenticated;

create function public.mark_casualty_event(p_match_id uuid, p_actor_warband_id uuid, p_payload jsonb, p_summary text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_token text := p_payload->>'casualty_token'; v_id uuid; parts text[]; v_target text; n int; existing public.battle_events%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if jsonb_typeof(p_payload) <> 'object' or coalesce(v_token, '') = '' then raise exception 'A casualty marker needs its casualty_token.' using errcode = '22023'; end if;
  -- casualty:<match>:<victim warband>:<target id>:manual:<raw index>; the target id may contain colons (animal ids).
  parts := string_to_array(v_token, ':');
  if cardinality(parts) < 6 or parts[1] <> 'casualty' or parts[2] <> p_match_id::text or parts[3] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or parts[cardinality(parts) - 1] <> 'manual' or parts[cardinality(parts)] !~ '^[0-9]+$' then
    raise exception 'The casualty token does not belong to this match or is not a manual casualty token.' using errcode = '22023';
  end if;
  n := parts[cardinality(parts)]::int;
  v_target := array_to_string(parts[4:cardinality(parts) - 2], ':');
  if p_payload->>'target_warband_id' is distinct from parts[3] or p_payload->>'target_id' is distinct from v_target then
    raise exception 'The casualty token names a different target (% of %) from the payload.', v_target, parts[3] using errcode = '22023';
  end if;
  -- A marker is metadata for the report: it never feeds tallies, conditions or experience.
  if not coalesce((p_payload->>'metadata_only')::boolean, false) or (p_payload->>'manual_casualty_index') !~ '^[0-9]+$' or (p_payload->>'manual_casualty_index')::int <> n
     or coalesce(p_payload->>'capture_source', '') <> 'table' or coalesce(p_payload->>'capture_reason', '') = '' or coalesce((p_payload->>'kill')::boolean, false)
     or coalesce((p_payload->>'wounds_lost')::int, 0) <> 0 or not coalesce((p_payload->>'out_of_action')::boolean, false) or coalesce(p_payload->>'kind', 'attack') <> 'attack' then
    raise exception 'A casualty marker must carry metadata_only, manual_casualty_index equal to the token index, capture_source table, a capture_reason, out_of_action, no kill and no wounds.' using errcode = '22023';
  end if;
  -- Recorded by the victim's player (their own warband) or the GM, for two warbands at this table.
  if p_actor_warband_id is distinct from parts[3]::uuid then raise exception 'A casualty is recorded by the warband that suffered it.' using errcode = '22023'; end if;
  if not exists (select 1 from public.match_participants where match_id = p_match_id and warband_id = p_actor_warband_id)
     or not exists (select 1 from public.match_participants where match_id = p_match_id and warband_id = nullif(p_payload->>'attacker_warband_id', '')::uuid) then
    raise exception 'Both the victim and the attacking warband must be in this battle.' using errcode = '22023';
  end if;
  if not (public.can_edit_warband(p_actor_warband_id) or public.is_campaign_gm(public.match_campaign(p_match_id))) then raise exception 'Record casualties for your own warband (or as the campaign GM).' using errcode = '42501'; end if;
  if not exists (select 1 from public.matches m where m.id = p_match_id and m.state = 'in_progress') then raise exception 'The battle is not in progress.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext(v_token));
  select * into existing from public.battle_events where match_id = p_match_id and reverted_at is null and payload->>'casualty_token' = v_token;
  if existing.id is not null then
    if existing.payload = p_payload then return existing.id; end if;
    -- Changed attribution: the old marker is reverted and replaced in one transaction.
    perform public.revert_battle_event(existing.id, 'Attribution changed: replaced by a new marker.');
  end if;
  insert into public.battle_events (match_id, actor_id, actor_warband_id, kind, payload, summary)
    values (p_match_id, auth.uid(), p_actor_warband_id, 'attack', p_payload, coalesce(nullif(p_summary, ''), 'Casualty recorded at the table.'))
    returning id into v_id;
  return v_id;
end $$;
revoke all on function public.mark_casualty_event(uuid, uuid, jsonb, text) from public;
grant execute on function public.mark_casualty_event(uuid, uuid, jsonb, text) to authenticated;

create function public.unmark_casualty_event(p_match_id uuid, p_token text, p_note text default 'Casualty unmarked at the table.')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext(p_token));
  select id into v_id from public.battle_events where match_id = p_match_id and reverted_at is null and payload->>'casualty_token' = p_token;
  if v_id is null then return null; end if;
  perform public.revert_battle_event(v_id, p_note);
  return v_id;
end $$;
revoke all on function public.unmark_casualty_event(uuid, text, text) from public;
grant execute on function public.unmark_casualty_event(uuid, text, text) to authenticated;
