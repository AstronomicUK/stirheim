-- Stable casualty identity for battle events. A casualty recorded at the table (players-calculated
-- combat, a spell, a fall) and one calculated by the app must never both stand for the same model
-- going down, because 092/093 count unreverted out-of-action events to number a group's casualties.
-- payload.casualty_token names the casualty itself — casualty:<match>:<target warband>:<target id>:<n>
-- where n is the sheet's ordinal for that target (0 for a Hero or an animal, the tally index for a
-- group model) — and the database keeps at most one unreverted event per token. mark_casualty_event
-- is idempotent (a second mark returns the standing event) and unmark_casualty_event reverts it
-- through the existing revert path, so the log keeps its history.

create unique index battle_events_casualty_token_key on public.battle_events ((payload->>'casualty_token')) where reverted_at is null and payload ? 'casualty_token';

create function public.casualty_token(p_match_id uuid, p_target_warband_id uuid, p_target_id text, p_index integer) returns text language sql immutable as $$
  select 'casualty:' || p_match_id || ':' || p_target_warband_id || ':' || p_target_id || ':' || p_index;
$$;
grant execute on function public.casualty_token(uuid, uuid, text, integer) to authenticated;

create function public.mark_casualty_event(p_match_id uuid, p_actor_warband_id uuid, p_payload jsonb, p_summary text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_token text := p_payload->>'casualty_token'; v_id uuid; parts text[]; v_target text;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if jsonb_typeof(p_payload) <> 'object' or coalesce(v_token, '') = '' then raise exception 'A casualty event needs its casualty_token.' using errcode = '22023'; end if;
  -- casualty:<match>:<target warband>:<target id>:<n>; the target id may itself contain colons (animal ids).
  parts := string_to_array(v_token, ':');
  if cardinality(parts) < 5 or parts[1] <> 'casualty' or parts[2] <> p_match_id::text or parts[3] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or parts[cardinality(parts)] !~ '^[0-9]+$' then
    raise exception 'The casualty token does not belong to this match.' using errcode = '22023';
  end if;
  v_target := array_to_string(parts[4:cardinality(parts) - 1], ':');
  if p_payload->>'target_warband_id' is distinct from parts[3] or p_payload->>'target_id' is distinct from v_target then
    raise exception 'The casualty token names a different target (% of %) from the payload.', v_target, parts[3] using errcode = '22023';
  end if;
  if not coalesce((p_payload->>'out_of_action')::boolean, false) then raise exception 'A casualty event records a model out of action.' using errcode = '22023'; end if;
  if not (public.is_match_participant(p_match_id) or public.is_campaign_gm(public.match_campaign(p_match_id))) then raise exception 'Only a player at this table or the campaign GM records casualties.' using errcode = '42501'; end if;
  if not exists (select 1 from public.match_participants where match_id = p_match_id and warband_id = p_actor_warband_id) then raise exception 'The recording warband is not in this battle.' using errcode = '22023'; end if;
  if not (public.can_edit_warband(p_actor_warband_id) or public.is_campaign_gm(public.match_campaign(p_match_id))) then raise exception 'Record casualties for your own warband (or as the campaign GM).' using errcode = '42501'; end if;
  if not exists (select 1 from public.matches m where m.id = p_match_id and m.state = 'in_progress') then raise exception 'The battle is not in progress.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext(v_token));
  select id into v_id from public.battle_events where match_id = p_match_id and reverted_at is null and payload->>'casualty_token' = v_token;
  if v_id is not null then return v_id; end if;
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
