-- #229 forced captures of equipment companions: Wardogs and Gnoblar Fighters are items on a Hero's
-- card that fight as models (animal:<heroId>:<itemId>:<n>). When Clan Moulder's Subjugator of
-- Mankind takes one out of action it is Captured (no injury die) and the report removes exactly one
-- of the item. Each such capture becomes a durable case (subject_kind companion, source
-- forced_capture_companion) verified against the saved battle event and the report's own removal.
-- Outcomes follow the Captured table: release and ransom return the animal to its original active
-- holder, or to another active Hero or the stash when he is gone; sale pays the captor 5 × D6 and the
-- animal is gone.

alter table public.captive_cases drop constraint captive_cases_subject_kind_check;
alter table public.captive_cases add constraint captive_cases_subject_kind_check check (subject_kind in ('hero', 'henchman', 'companion'));

create function public.open_companion_capture_cases() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cap jsonb; ev public.battle_events%rowtype; parts text[]; hero public.heroes%rowtype; before_row jsonb; lost int; used jsonb := '{}'::jsonb; seen uuid[] := '{}';
  sid uuid; n int; n_from int; n_to int; v_case uuid; v_owner uuid; v_captor_owner uuid; v_captor_name text; kind_name text;
begin
  if new.undo is null or old.undo is not null then return new; end if;
  for cap in select x from jsonb_array_elements(coalesce(new.applied->'captured_companions', '[]'::jsonb)) x loop
    if (cap->>'reason') is distinct from 'subjugator' then raise exception 'Captured companions: unsupported capture reason %.', cap->>'reason' using errcode = '22023'; end if;
    if (cap->>'sourceItemId') !~* '^[0-9a-f]{8}-' or (cap->>'holderId') !~* '^[0-9a-f]{8}-' or (cap->>'eventId') !~* '^[0-9a-f]{8}-' or (cap->>'captorWarbandId') !~* '^[0-9a-f]{8}-' then
      raise exception 'Captured companions: item, holder, event and captor ids are required.' using errcode = '22023';
    end if;
    parts := string_to_array(cap->>'animalId', ':');
    if cardinality(parts) <> 4 or parts[1] <> 'animal' or parts[2] <> cap->>'holderId' or parts[3] <> cap->>'itemId' or parts[4] !~ '^[0-9]+$' then
      raise exception 'Captured companions: the animal id % does not name this holder and item.', cap->>'animalId' using errcode = '22023';
    end if;
    n := parts[4]::int;
    if n < 1 then raise exception 'Captured companions: animal numbers start at 1.' using errcode = '22023'; end if;
    if cap->>'itemId' not in ('wardogs', 'gnoblar_fighter') then raise exception 'Captured companions: % is not an equipment companion.', cap->>'itemId' using errcode = '22023'; end if;
    kind_name := case when cap->>'itemId' = 'wardogs' then 'Wardog' else 'Gnoblar Fighter' end;
    select * into hero from public.heroes where id = (cap->>'holderId')::uuid and warband_id = new.warband_id;
    if not found then raise exception 'Captured companions: holder % is not a warrior of this warband.', cap->>'holderId' using errcode = '22023'; end if;
    select * into ev from public.battle_events
      where id = (cap->>'eventId')::uuid and match_id = new.match_id and kind = 'attack' and reverted_at is null
        and coalesce((payload->>'out_of_action')::boolean, false) and payload->>'capture_reason' = 'subjugator'
        and payload->>'target_id' = cap->>'animalId' and payload->>'target_warband_id' = new.warband_id::text
        and payload->>'attacker_warband_id' = cap->>'captorWarbandId';
    if not found then raise exception 'Captured companions: % has no unreverted Subjugator capture event by that warband.', cap->>'animalId' using errcode = '22023'; end if;
    if ev.id = any(seen) then raise exception 'Captured companions: the same capture event is used twice.' using errcode = '22023'; end if;
    seen := seen || ev.id;
    if (cap->>'captorWarbandId')::uuid = new.warband_id or not exists (select 1 from public.match_participants where match_id = new.match_id and warband_id = (cap->>'captorWarbandId')::uuid) then
      raise exception 'Captured companions: the captor must be another warband in this battle.' using errcode = '22023';
    end if;
    -- The item row before the report, and how many of it the report removed: one per capture.
    sid := (cap->>'sourceItemId')::uuid;
    select u->'row' || jsonb_build_object('before_quantity', (u->'before'->>'quantity')::int) into before_row from jsonb_array_elements(coalesce(new.undo->'items', '[]'::jsonb)) u
      where (u->>'id')::uuid = sid and u->'row'->>'holder_type' = 'hero' and u->'row'->>'holder_id' = cap->>'holderId' and u->'row'->>'item_rules_id' = cap->>'itemId' limit 1;
    if before_row is null then raise exception 'Captured companions: item % was not a % carried by % before this report, or the report did not remove it.', sid, kind_name, hero.name using errcode = '22023'; end if;
    lost := (before_row->>'before_quantity')::int - coalesce((select (pt->>'quantity')::int from jsonb_array_elements(coalesce(new.applied->'item_patches', '[]'::jsonb)) pt where (pt->>'id')::uuid = sid limit 1), (before_row->>'before_quantity')::int);
    if coalesce((used->>sid::text)::int, 0) + 1 > lost then raise exception 'Captured companions: the report removed only % % from %, but more are recorded as captured.', lost, kind_name, hero.name using errcode = '22023'; end if;
    -- The animal's number n runs continuously over the holder's rows of that item in roster order
    -- (created_at), so n must fall inside the source row's own range of numbers.
    select offset_before, offset_before + qty into n_from, n_to from (
      select r.id, r.qty, coalesce(sum(r.qty) over (order by r.created_at, r.id rows between unbounded preceding and 1 preceding), 0) as offset_before
        from (
          select (u->>'id')::uuid as id, (u->'row'->>'created_at')::timestamptz as created_at, (u->'before'->>'quantity')::int as qty
            from jsonb_array_elements(coalesce(new.undo->'items', '[]'::jsonb)) u
           where u->'row'->>'holder_type' = 'hero' and u->'row'->>'holder_id' = cap->>'holderId' and u->'row'->>'item_rules_id' = cap->>'itemId'
          union all
          select i.id, i.created_at, i.quantity from public.items i
           where i.warband_id = new.warband_id and i.holder_type = 'hero' and i.holder_id = hero.id and i.item_rules_id = cap->>'itemId'
             and not exists (select 1 from jsonb_array_elements(coalesce(new.undo->'items', '[]'::jsonb)) u2 where (u2->>'id')::uuid = i.id)
        ) r) ranges where ranges.id = sid;
    if n_from is null or n <= n_from or n > n_to then raise exception 'Captured companions: % is not one of the animals on item row % (that row holds numbers % to %).', cap->>'animalId', sid, coalesce(n_from, 0) + 1, coalesce(n_to, 0) using errcode = '22023'; end if;
    used := jsonb_set(used, array[sid::text], to_jsonb(coalesce((used->>sid::text)::int, 0) + 1));
    insert into public.captive_cases (report_id, report_revision, match_id, victim_warband_id, captor_warband_id, hero_id, hero_name, state, assigned_at, subject_kind, model_index, source, model_snapshot)
      values (new.id, new.revision, new.match_id, new.warband_id, (cap->>'captorWarbandId')::uuid, sid, kind_name || ' of ' || hero.name, 'open', now(), 'companion', n, 'forced_capture_companion',
              jsonb_build_object('item', jsonb_build_object('id', sid, 'item_rules_id', cap->>'itemId', 'custom_name', before_row->'custom_name', 'notes', coalesce(before_row->>'notes', '')),
                                 'holder', jsonb_build_object('id', hero.id, 'name', hero.name, 'unit_type_rules_id', hero.unit_type_rules_id),
                                 'animal_id', cap->>'animalId', 'event_id', ev.id, 'reason', 'subjugator', 'captor_name', ev.payload->>'attacker_name', 'kind_name', kind_name))
      on conflict do nothing returning id into v_case;
    if v_case is null then continue; end if;
    select owner_id into v_owner from public.warbands where id = new.warband_id;
    select owner_id, name into v_captor_owner, v_captor_name from public.warbands where id = (cap->>'captorWarbandId')::uuid;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_owner, 'captive', left(hero.name || '''s ' || kind_name || ' was captured by ' || v_captor_name, 140), 'Taken with the Subjugator of Mankind. Agree its release, ransom or sale with their player from your warband page.', '/warbands/' || new.warband_id, 'captive:' || v_case || ':victim') on conflict do nothing;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_captor_owner, 'captive', left('Your warband holds a captured ' || kind_name, 140), 'Propose its release, a ransom or a sale from your warband page. The other player must accept it.', '/warbands/' || (cap->>'captorWarbandId'), 'captive:' || v_case || ':captor') on conflict do nothing;
  end loop;
  return new;
end $$;
revoke all on function public.open_companion_capture_cases() from public;
create trigger open_companion_capture_cases after update of undo on public.match_reports for each row execute function public.open_companion_capture_cases();

-- ---------------------------------------------------------------------------------------------
-- Outcomes for a captured companion.
-- ---------------------------------------------------------------------------------------------
create function public.validate_companion_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v public.warbands%rowtype; k public.warbands%rowtype; item_row public.items%rowtype; snap jsonb := p_case.model_snapshot; kind text := p_choice->>'kind';
  c jsonb; keys text[]; t text; op text; v_id uuid; d jsonb; tag text; seen text[] := '{}'; og int := 0; kg int := 0; expect_og int := 0; expect_kg int := 0; gold int; d6 int; label text;
  item_id text := snap->'item'->>'item_rules_id'; item_notes text := coalesce(snap->'item'->>'notes', ''); holder uuid; holder_kind text; holder_name text; returned int := 0; parts text[];
begin
  select * into v from public.warbands where id = p_case.victim_warband_id;
  select * into k from public.warbands where id = p_case.captor_warband_id;
  if snap is null or p_case.subject_kind <> 'companion' then raise exception 'This case is not a captured companion.' using errcode = '22023'; end if;
  if kind not in ('release', 'ransom', 'sell') then raise exception 'A captured companion can be released, ransomed or sold.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_advances, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_advances, '[]'::jsonb)) > 0 then raise exception 'This outcome awards no experience.' using errcode = '22023'; end if;
  if exists (select 1 from public.battle_events where id = (snap->>'event_id')::uuid and reverted_at is not null) then
    raise exception 'The capture event behind this case was reverted in the battle log. Correct the report instead of resolving the captive.' using errcode = 'P0001';
  end if;
  -- Where a returning animal goes: its original holder while he is still an active Hero here,
  -- otherwise the active Hero the proposal names, otherwise the stash.
  if kind <> 'sell' then
    if exists (select 1 from public.heroes where id = (snap->'holder'->>'id')::uuid and warband_id = v.id and status = 'active') then
      holder := (snap->'holder'->>'id')::uuid; holder_kind := 'hero';
    elsif nullif(p_choice->>'holderId', '') is not null then
      holder := (p_choice->>'holderId')::uuid;
      if not exists (select 1 from public.heroes where id = holder and warband_id = v.id and status = 'active') then raise exception 'The chosen holder is not an active Hero of the warband.' using errcode = '22023'; end if;
      holder_kind := 'hero';
    else
      holder := null; holder_kind := 'stash';
    end if;
    select name into holder_name from public.heroes where id = holder;
  end if;

  for c in select x from jsonb_array_elements(p_owner_changes) x loop
    if kind = 'sell' then raise exception 'A sold companion does not return; nothing changes on the victim''s roster.' using errcode = '22023'; end if;
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    tag := t || ':' || op || ':' || coalesce(v_id::text, v.id::text);
    if op <> 'insert' then
      if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      seen := seen || tag;
    end if;
    if t = 'warbands' and op = 'update' and (v_id is null or v_id = v.id) then
      if not (keys <@ array['gold']) then raise exception 'This outcome may only change the warband''s gold.' using errcode = '22023'; end if;
      og := (d->>'gold')::int - v.gold;
    elsif t = 'items' and op = 'insert' then
      if returned > 0 then raise exception 'One companion returns: exactly one item change.' using errcode = '22023'; end if;
      if not (keys <@ array['holder_type', 'holder_id', 'item_rules_id', 'custom_name', 'quantity', 'notes']) or d->>'item_rules_id' is distinct from item_id or coalesce((d->>'quantity')::int, 1) <> 1 or coalesce(d->>'notes', '') <> item_notes
         or coalesce(d->>'holder_type', 'stash') <> holder_kind or nullif(d->>'holder_id', '')::uuid is distinct from holder then
        raise exception 'The returning % goes to % as exactly one %, with its original notes.', snap->>'kind_name', coalesce(holder_name, 'the stash'), item_id using errcode = '22023';
      end if;
      returned := 1;
    elsif t = 'items' and op = 'update' then
      if returned > 0 then raise exception 'One companion returns: exactly one item change.' using errcode = '22023'; end if;
      select * into item_row from public.items where id = v_id and warband_id = v.id and item_rules_id = item_id and coalesce(notes, '') = item_notes and holder_type::text = holder_kind and holder_id is not distinct from holder;
      if not found or not (keys <@ array['quantity']) or coalesce((d->>'quantity')::int, 0) <> item_row.quantity + 1 then
        raise exception 'The returning % goes to % as exactly one %, with its original notes.', snap->>'kind_name', coalesce(holder_name, 'the stash'), item_id using errcode = '22023';
      end if;
      returned := 1;
    else
      raise exception 'The proposal changes something this outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
    end if;
  end loop;
  for c in select x from jsonb_array_elements(p_captor_changes) x loop
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    if t = 'warbands' and op = 'update' and (v_id is null or v_id = k.id) then
      if not (keys <@ array['gold']) then raise exception 'This outcome may only change the warband''s gold.' using errcode = '22023'; end if;
      if kg <> 0 then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      kg := (d->>'gold')::int - k.gold;
    else
      raise exception 'The proposal changes something this outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
    end if;
  end loop;

  case kind
    when 'release' then label := 'Released';
    when 'ransom' then
      gold := (p_choice->>'gold')::int;
      if gold is null or gold < 0 or gold > v.gold then raise exception 'Enter an affordable, non-negative ransom.' using errcode = '22023'; end if;
      expect_og := -gold; expect_kg := gold; label := 'Ransomed for ' || gold || ' gc';
    when 'sell' then
      d6 := (p_choice->>'d6')::int;
      if d6 is null or d6 not between 1 and 6 then raise exception 'Enter a D6 result from 1 to 6.' using errcode = '22023'; end if;
      if p_choice ? 'originalD6' and jsonb_typeof(p_choice->'originalD6') = 'number' and (p_choice->>'originalD6')::int not between 1 and 6 then raise exception 'The app''s original D6 must be 1 to 6.' using errcode = '22023'; end if;
      if k.type_rules_id = 'pit_fighters' then raise exception 'Pit Fighters cannot sell captives.' using errcode = '22023'; end if;
      expect_kg := 5 * d6; label := 'Sold to slavers for ' || 5 * d6 || ' gc (D6 ' || d6 || case when jsonb_typeof(p_choice->'originalD6') = 'number' and (p_choice->>'originalD6')::int <> d6 then '; app rolled ' || (p_choice->>'originalD6') || ', changed by the player' when jsonb_typeof(p_choice->'originalD6') = 'number' then ', rolled by the app' else ', tabletop die' end || ')';
  end case;
  if og <> expect_og or kg <> expect_kg then raise exception 'The gold changes do not match the outcome.' using errcode = '22023'; end if;
  if kind <> 'sell' and returned <> 1 then raise exception 'The returning % must be added back to % as one %.', snap->>'kind_name', coalesce(holder_name, 'the stash'), item_id using errcode = '22023'; end if;

  parts := array[label || ': ' || p_case.hero_name || ' (' || v.name || ')' || case when kind = 'sell' then ' is sold by ' || k.name || ' and is gone' else ' returns to ' || coalesce(holder_name || case when holder = (snap->'holder'->>'id')::uuid then '' else ' (its original handler is gone)' end, 'the stash') end];
  if og <> 0 then parts := parts || format('%s gold %s → %s', v.name, v.gold, v.gold + og); end if;
  if kg <> 0 then parts := parts || format('%s gold %s → %s', k.name, k.gold, k.gold + kg); end if;
  return left(array_to_string(parts, '. ') || '.', 1000);
end $$;
revoke all on function public.validate_companion_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;

create or replace function public.validate_captive_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb default '[]'::jsonb)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_choice) = 'object' and p_choice->>'kind' = 'kidnapped' then
    return public.validate_kidnapped_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind = 'companion' then
    return public.validate_companion_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind = 'henchman' and p_case.source = 'forced_capture' then
    return public.validate_forced_henchman_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind <> 'hero' then raise exception 'A lost henchman can only be resolved through Kidnapped!.' using errcode = '22023'; end if;
  return public.validate_core_captive_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
end $$;
revoke all on function public.validate_captive_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;
