-- #229 forced henchman captures: Clan Moulder's Subjugator of Mankind (a Hero with the skill and a
-- Thingcatcher takes an enemy out of action → Captured, no injury roll). Heroes already flow through
-- the 090 hero cases via the report's Captured outcome. This migration covers henchmen: the report's
-- group injury line names each captured model (1-based ordinal of the unreverted out-of-action events
-- against that group, ordered by time then id), the capture event, the captor and the exact share of
-- the group's kit that left with him. The server verifies every entry against the saved battle
-- events and the report's own item losses before opening a durable case (subject_kind henchman,
-- source forced_capture) with a per-model snapshot; an entry that cannot be verified rejects the
-- report rather than silently removing a model. Outcomes: release (returns free), ransom (returns for
-- gold) and sale (captor gains 5 × D6 and the kit). Return goes back into the original group when its
-- profile is still what the snapshot recorded, otherwise into a new group carrying the snapshot, and
-- always restores exactly the captured model's own kit. Exchange for henchmen stays outstanding.

-- One identity for a piece of kit: catalogue item or custom name, plus any annotation, so two
-- rows of the same catalogue item with different notes stay distinct and quantities are summed.
create function public.captive_item_key(p_item_rules_id text, p_custom_name text, p_notes text) returns text language sql immutable as $$
  select coalesce(p_item_rules_id, 'custom:' || coalesce(p_custom_name, '')) || case when coalesce(p_notes, '') <> '' then ' [' || p_notes || ']' else '' end;
$$;
revoke all on function public.captive_item_key(text, text, text) from public;

-- ---------------------------------------------------------------------------------------------
-- Case creation from the applied report.
-- ---------------------------------------------------------------------------------------------
create function public.open_forced_capture_cases() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  line jsonb; cap jsonb; k jsonb; ev public.battle_events%rowtype; g jsonb; grow public.henchman_groups%rowtype; ordinal int; v_case uuid; v_owner uuid; v_captor_owner uuid; v_captor_name text;
  patched int; expected_size int; captured_count int; seen uuid[] := '{}'; used jsonb; before_row jsonb; lost int; kit jsonb; sid uuid; q int; key_row text; key_cap text;
begin
  if new.undo is null or old.undo is not null then return new; end if;
  for line in select x from jsonb_array_elements(coalesce(new.injuries, '[]'::jsonb)) x
              where x->>'subjectType' = 'group' and jsonb_typeof(x->'captured') = 'array' and jsonb_array_length(x->'captured') > 0 loop
    if (line->>'subjectId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Captured henchmen: the group id is not valid.' using errcode = '22023'; end if;
    select * into grow from public.henchman_groups where id = (line->>'subjectId')::uuid and warband_id = new.warband_id;
    if not found then raise exception 'Captured henchmen: group % is not in this warband.', line->>'subjectName' using errcode = '22023'; end if;
    select e->'before' into g from jsonb_array_elements(coalesce(new.undo->'groups', '[]'::jsonb)) e where e->>'id' = line->>'subjectId' limit 1;
    if g is null then raise exception 'Captured henchmen: % was not patched by this report, so its models cannot have been removed.', grow.name using errcode = '22023'; end if;
    captured_count := jsonb_array_length(line->'captured');
    select (p->'patch'->>'size')::int into patched from jsonb_array_elements(coalesce(new.applied->'groups', '[]'::jsonb)) p where p->>'id' = line->>'subjectId' limit 1;
    expected_size := (g->>'size')::int - coalesce((line->>'dead')::int, 0) - captured_count;
    if patched is null or patched <> expected_size then
      raise exception 'Captured henchmen: % should be patched to % models (% before, % dead, % captured) but the report patches it to %.', grow.name, expected_size, g->>'size', coalesce((line->>'dead')::int, 0), captured_count, coalesce(patched::text, 'nothing') using errcode = '22023';
    end if;
    used := '{}'::jsonb;
    for cap in select x from jsonb_array_elements(line->'captured') x loop
      if (cap->>'reason') is distinct from 'subjugator' then raise exception 'Captured henchmen: unsupported capture reason %.', cap->>'reason' using errcode = '22023'; end if;
      if (cap->>'eventId') !~* '^[0-9a-f]{8}-' or (cap->>'captorWarbandId') !~* '^[0-9a-f]{8}-' then raise exception 'Captured henchmen: event and captor ids are required.' using errcode = '22023'; end if;
      select * into ev from public.battle_events
        where id = (cap->>'eventId')::uuid and match_id = new.match_id and kind = 'attack' and reverted_at is null
          and coalesce((payload->>'out_of_action')::boolean, false) and payload->>'capture_reason' = 'subjugator'
          and payload->>'target_kind' = 'group' and payload->>'target_id' = line->>'subjectId' and payload->>'target_warband_id' = new.warband_id::text
          and payload->>'attacker_warband_id' = cap->>'captorWarbandId';
      if not found then raise exception 'Captured henchmen: model % of % has no unreverted Subjugator capture event by that warband.', cap->>'modelIndex', grow.name using errcode = '22023'; end if;
      if ev.id = any(seen) then raise exception 'Captured henchmen: the same capture event is used twice.' using errcode = '22023'; end if;
      seen := seen || ev.id;
      select rn into ordinal from (
        select id, row_number() over (order by at, id) as rn from public.battle_events
         where match_id = new.match_id and kind = 'attack' and reverted_at is null and coalesce((payload->>'out_of_action')::boolean, false)
           and payload->>'target_kind' = 'group' and payload->>'target_id' = line->>'subjectId' and payload->>'target_warband_id' = new.warband_id::text) r where r.id = ev.id;
      if ordinal is distinct from (cap->>'modelIndex')::int then raise exception 'Captured henchmen: the capture event for % is casualty % of the group, not %.', grow.name, ordinal, cap->>'modelIndex' using errcode = '22023'; end if;
      if (cap->>'captorWarbandId')::uuid = new.warband_id or not exists (select 1 from public.match_participants where match_id = new.match_id and warband_id = (cap->>'captorWarbandId')::uuid) then
        raise exception 'Captured henchmen: the captor must be another warband in this battle.' using errcode = '22023';
      end if;
      -- Kit: each entry names a pre-report item row of this group; the quantities claimed across all
      -- captured models of the group never exceed what the report actually removed from that row.
      kit := '[]'::jsonb;
      for k in select x from jsonb_array_elements(coalesce(cap->'kit', '[]'::jsonb)) x loop
        sid := (k->>'sourceItemId')::uuid; q := (k->>'quantity')::int;
        if sid is null or q is null or q < 1 then raise exception 'Captured henchmen: each kit entry needs its source item and a positive quantity.' using errcode = '22023'; end if;
        select u->'row' || jsonb_build_object('before_quantity', (u->'before'->>'quantity')::int) into before_row from jsonb_array_elements(coalesce(new.undo->'items', '[]'::jsonb)) u
          where (u->>'id')::uuid = sid and u->'row'->>'holder_type' = 'group' and u->'row'->>'holder_id' = line->>'subjectId' limit 1;
        if before_row is null then raise exception 'Captured henchmen: kit item % was not carried by % before this report, or the report did not remove any of it.', sid, grow.name using errcode = '22023'; end if;
        lost := (before_row->>'before_quantity')::int - coalesce((select (pt->>'quantity')::int from jsonb_array_elements(coalesce(new.applied->'item_patches', '[]'::jsonb)) pt where (pt->>'id')::uuid = sid limit 1), (before_row->>'before_quantity')::int);
        if coalesce((used->>sid::text)::int, 0) + q > lost then raise exception 'Captured henchmen: the report removed only % of % from %, but the captured models claim more.', lost, coalesce(before_row->>'item_rules_id', before_row->>'custom_name'), grow.name using errcode = '22023'; end if;
        used := jsonb_set(used, array[sid::text], to_jsonb(coalesce((used->>sid::text)::int, 0) + q));
        key_row := coalesce(before_row->>'item_rules_id', 'custom:' || coalesce(before_row->>'custom_name', ''));
        key_cap := coalesce(k->>'itemId', 'custom:' || coalesce(k->>'customName', ''));
        if key_cap <> key_row then raise exception 'Captured henchmen: kit entry names % but the source row is %.', key_cap, key_row using errcode = '22023'; end if;
        if k ? 'notes' and coalesce(k->>'notes', '') <> coalesce(before_row->>'notes', '') then raise exception 'Captured henchmen: kit entry notes "%" do not match the source row ("%"); equipment properties are taken from the roster, never invented.', k->>'notes', coalesce(before_row->>'notes', '') using errcode = '22023'; end if;
        kit := kit || jsonb_build_object('source_item_id', sid, 'item_rules_id', before_row->'item_rules_id', 'custom_name', before_row->'custom_name', 'quantity', q, 'notes', coalesce(before_row->>'notes', ''));
      end loop;
      insert into public.captive_cases (report_id, report_revision, match_id, victim_warband_id, captor_warband_id, hero_id, hero_name, state, assigned_at, subject_kind, model_index, source, model_snapshot)
        values (new.id, new.revision, new.match_id, new.warband_id, (cap->>'captorWarbandId')::uuid, grow.id, grow.name || ' (model ' || (cap->>'modelIndex') || ')', 'open', now(), 'henchman', (cap->>'modelIndex')::int, 'forced_capture',
                jsonb_build_object('group', g || jsonb_build_object('id', grow.id, 'name', grow.name, 'unit_type_rules_id', grow.unit_type_rules_id, 'stat_increases', grow.stat_increases, 'is_large', grow.is_large),
                                   'items', kit, 'event_id', ev.id, 'reason', 'subjugator', 'captor_name', ev.payload->>'attacker_name'))
        on conflict do nothing returning id into v_case;
      if v_case is null then continue; end if;
      select owner_id into v_owner from public.warbands where id = new.warband_id;
      select owner_id, name into v_captor_owner, v_captor_name from public.warbands where id = (cap->>'captorWarbandId')::uuid;
      insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
        values (v_owner, 'captive', left(grow.name || ': a henchman was captured by ' || v_captor_name, 140), 'Taken with the Subjugator of Mankind. Agree his release, ransom or sale with their player from your warband page.', '/warbands/' || new.warband_id, 'captive:' || v_case || ':victim') on conflict do nothing;
      insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
        values (v_captor_owner, 'captive', left('Your warband holds a captured ' || grow.name || ' henchman', 140), 'Propose his release, a ransom or a sale from your warband page. The other player must accept it.', '/warbands/' || (cap->>'captorWarbandId'), 'captive:' || v_case || ':captor') on conflict do nothing;
    end loop;
    -- When no model died, every item the report removed from the group must be accounted for by the
    -- captured models: nothing may vanish uncredited (item use spent in battle is patched separately
    -- by the wizard and must not be netted against a capture).
    if coalesce((line->>'dead')::int, 0) = 0 then
      for before_row in select u->'row' || jsonb_build_object('before_quantity', (u->'before'->>'quantity')::int) from jsonb_array_elements(coalesce(new.undo->'items', '[]'::jsonb)) u
                         where u->'row'->>'holder_type' = 'group' and u->'row'->>'holder_id' = line->>'subjectId' loop
        sid := (before_row->>'id')::uuid;
        lost := (before_row->>'before_quantity')::int - coalesce((select (pt->>'quantity')::int from jsonb_array_elements(coalesce(new.applied->'item_patches', '[]'::jsonb)) pt where (pt->>'id')::uuid = sid limit 1), (before_row->>'before_quantity')::int);
        if lost > 0 and coalesce((used->>sid::text)::int, 0) <> lost then
          raise exception 'Captured henchmen: the report removed % of % from % but the captured models account for %; with no model dead the allocation must match exactly.', lost, coalesce(before_row->>'item_rules_id', before_row->>'custom_name'), grow.name, coalesce((used->>sid::text)::int, 0) using errcode = '22023';
        end if;
      end loop;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.open_forced_capture_cases() from public;
create trigger open_forced_capture_cases after update of undo on public.match_reports for each row execute function public.open_forced_capture_cases();

-- ---------------------------------------------------------------------------------------------
-- Outcomes for a forced-captured henchman.
-- ---------------------------------------------------------------------------------------------
create function public.validate_forced_henchman_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v public.warbands%rowtype; k public.warbands%rowtype; grow public.henchman_groups%rowtype; item_row public.items%rowtype; snap jsonb := p_case.model_snapshot; sgroup jsonb;
  kind text := p_choice->>'kind'; c jsonb; keys text[]; t text; op text; v_id uuid; d jsonb; key text; qty int; tag text; seen text[] := '{}';
  og int := 0; ow int := 0; kg int := 0; kw int := 0; expect_og int := 0; expect_kg int := 0; gold int; d6 int; label text;
  snap_kit jsonb := '{}'::jsonb; restored jsonb := '{}'::jsonb; gained jsonb := '{}'::jsonb; compatible boolean; group_updated boolean := false; group_seen boolean := false; new_group uuid; parts text[];
begin
  select * into v from public.warbands where id = p_case.victim_warband_id;
  select * into k from public.warbands where id = p_case.captor_warband_id;
  if snap is null or p_case.source <> 'forced_capture' then raise exception 'This case is not a forced capture.' using errcode = '22023'; end if;
  if kind not in ('release', 'ransom', 'sell') then raise exception 'A captured henchman can be released, ransomed or sold (exchange is not yet supported).' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_advances, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_advances, '[]'::jsonb)) > 0 then raise exception 'This outcome awards no experience.' using errcode = '22023'; end if;
  if exists (select 1 from public.battle_events where id = (snap->>'event_id')::uuid and reverted_at is not null) then
    raise exception 'The capture event behind this case was reverted in the battle log. Correct the report instead of resolving the captive.' using errcode = 'P0001';
  end if;
  sgroup := snap->'group';
  snap_kit := (select coalesce(jsonb_object_agg(x.key, x.total), '{}'::jsonb) from (
                 select public.captive_item_key(i->>'item_rules_id', i->>'custom_name', i->>'notes') as key, sum((i->>'quantity')::int) as total
                   from jsonb_array_elements(coalesce(snap->'items', '[]'::jsonb)) i group by 1) x);
  select * into grow from public.henchman_groups where id = p_case.hero_id and warband_id = v.id;
  -- The original group takes him back only if it is still what he left: same profile, experience,
  -- state, and the same kit per model (an emptied group has no kit to match).
  compatible := found and grow.unit_type_rules_id = sgroup->>'unit_type_rules_id' and grow.stats = sgroup->'stats' and grow.xp = (sgroup->>'xp')::int
                and grow.level_ups = coalesce((sgroup->>'level_ups')::int, grow.level_ups) and grow.campaign_state = coalesce(sgroup->'campaign_state', '{}'::jsonb) and grow.stat_increases = coalesce(sgroup->'stat_increases', '{}'::jsonb)
                and (grow.size = 0 or snap_kit = (select coalesce(jsonb_object_agg(x.key, x.per_model), '{}'::jsonb) from (
                       select public.captive_item_key(i.item_rules_id, i.custom_name, i.notes) as key, sum(i.quantity) / grow.size as per_model
                         from public.items i where i.warband_id = v.id and i.holder_type = 'group' and i.holder_id = grow.id group by 1 having sum(i.quantity) % grow.size = 0) x));
  new_group := (p_choice->>'groupId')::uuid;

  for c in select x from jsonb_array_elements(p_owner_changes) x loop
    if kind = 'sell' then raise exception 'A sold henchman does not return; nothing changes on the victim''s roster.' using errcode = '22023'; end if;
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    tag := t || ':' || op || ':' || coalesce(v_id::text, coalesce(c->>'id', v.id::text));
    if op <> 'insert' or t = 'henchman_groups' then
      if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      seen := seen || tag;
    end if;
    if t = 'warbands' and op = 'update' and (v_id is null or v_id = v.id) then
      if not (keys <@ array['gold']) then raise exception 'This outcome may only change the warband''s gold.' using errcode = '22023'; end if;
      og := (d->>'gold')::int - v.gold;
    elsif t = 'henchman_groups' and op = 'update' and v_id = p_case.hero_id then
      if not compatible then raise exception '% has changed since the capture (profile, experience or state); the returning model forms a new group carrying his snapshot instead.', grow.name using errcode = '22023'; end if;
      if group_seen then raise exception 'The returning model joins or forms exactly one group.' using errcode = '22023'; end if;
      if not (keys <@ array['size', 'model_names']) or coalesce((d->>'size')::int, 0) <> grow.size + 1 or coalesce(jsonb_array_length(d->'model_names'), 0) > grow.size + 1 then raise exception 'Returning adds exactly one model to %.', grow.name using errcode = '22023'; end if;
      group_updated := true;
    elsif t = 'henchman_groups' and op = 'insert' then
      if compatible then raise exception '% is unchanged since the capture, so the model returns to it rather than forming a new group.', grow.name using errcode = '22023'; end if;
      if group_seen or group_updated then raise exception 'The returning model joins or forms exactly one group.' using errcode = '22023'; end if;
      if new_group is null or (c->>'id')::uuid is distinct from new_group then raise exception 'The new group must be the one named in the outcome.' using errcode = '22023'; end if;
      if exists (select 1 from public.henchman_groups where id = new_group) then raise exception 'That group already exists.' using errcode = '22023'; end if;
      if not (keys <@ array['name', 'unit_type_rules_id', 'size', 'stats', 'xp', 'level_ups', 'stat_increases', 'is_large', 'notes', 'sort_order', 'model_names', 'campaign_state']) then raise exception 'The new group carries a field this outcome cannot set.' using errcode = '22023'; end if;
      if d->>'unit_type_rules_id' is distinct from sgroup->>'unit_type_rules_id' or d->'stats' is distinct from sgroup->'stats' or coalesce((d->>'size')::int, 1) <> 1
         or coalesce((d->>'xp')::int, 0) <> (sgroup->>'xp')::int or coalesce((d->>'level_ups')::int, 0) <> coalesce((sgroup->>'level_ups')::int, 0)
         or coalesce(d->'stat_increases', '{}'::jsonb) <> coalesce(sgroup->'stat_increases', '{}'::jsonb) or coalesce(d->'campaign_state', '{}'::jsonb) <> coalesce(sgroup->'campaign_state', '{}'::jsonb)
         or coalesce((d->>'is_large')::boolean, false) <> coalesce((sgroup->>'is_large')::boolean, false) or coalesce(jsonb_array_length(d->'model_names'), 0) > 1 or char_length(coalesce(d->>'name', '')) > 80 then
        raise exception 'The new group must carry exactly the captured model''s snapshot (unit, profile, experience, increases and state), size 1.' using errcode = '22023';
      end if;
      group_seen := true;
    elsif t = 'items' and op = 'insert' and d->>'holder_type' = 'group' then
      if (d->>'holder_id')::uuid is distinct from (case when group_updated or compatible then p_case.hero_id else new_group end) then raise exception 'Restored kit goes to the group the model returns to.' using errcode = '22023'; end if;
      key := public.captive_item_key(d->>'item_rules_id', d->>'custom_name', d->>'notes'); qty := coalesce((d->>'quantity')::int, 1);
      if not (snap_kit ? key) then raise exception 'Restored kit may only be what the captured model carried (%).', (select string_agg(e.key || ' ×' || e.value, ', ' order by e.key) from jsonb_each_text(snap_kit) e) using errcode = '22023'; end if;
      restored := jsonb_set(restored, array[key], to_jsonb(coalesce((restored->>key)::int, 0) + qty));
    elsif t = 'items' and op = 'update' then
      select * into item_row from public.items where id = v_id and warband_id = v.id and holder_type = 'group' and holder_id = p_case.hero_id;
      if not found or not compatible or not (keys <@ array['quantity']) or coalesce((d->>'quantity')::int, 0) <= item_row.quantity then raise exception 'The proposal changes something this outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023'; end if;
      key := public.captive_item_key(item_row.item_rules_id, item_row.custom_name, item_row.notes);
      if not (snap_kit ? key) then raise exception 'Restored kit may only be what the captured model carried.' using errcode = '22023'; end if;
      restored := jsonb_set(restored, array[key], to_jsonb(coalesce((restored->>key)::int, 0) + (d->>'quantity')::int - item_row.quantity));
    else
      raise exception 'The proposal changes something this outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
    end if;
  end loop;

  for c in select x from jsonb_array_elements(p_captor_changes) x loop
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    tag := t || ':' || op || ':' || coalesce(v_id::text, k.id::text);
    if op <> 'insert' then
      if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      seen := seen || tag;
    end if;
    if t = 'warbands' and op = 'update' and (v_id is null or v_id = k.id) then
      if not (keys <@ array['gold']) then raise exception 'This outcome may only change the warband''s gold.' using errcode = '22023'; end if;
      kg := (d->>'gold')::int - k.gold;
    elsif kind = 'sell' and t = 'items' and op = 'insert' and coalesce(d->>'holder_type', 'stash') = 'stash' and nullif(d->>'holder_id', '') is null then
      key := public.captive_item_key(d->>'item_rules_id', d->>'custom_name', d->>'notes'); qty := coalesce((d->>'quantity')::int, 1);
      if not (snap_kit ? key) or qty < 1 then raise exception 'The captor may only keep what the captured model carried.' using errcode = '22023'; end if;
      gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + qty));
    elsif kind = 'sell' and t = 'items' and op = 'update' then
      select * into item_row from public.items where id = v_id and warband_id = k.id and holder_type = 'stash';
      if not found or not (keys <@ array['quantity']) or coalesce((d->>'quantity')::int, 0) <= item_row.quantity then raise exception 'The proposal changes something this outcome cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023'; end if;
      key := public.captive_item_key(item_row.item_rules_id, item_row.custom_name, item_row.notes);
      if not (snap_kit ? key) then raise exception 'The captor may only keep what the captured model carried.' using errcode = '22023'; end if;
      gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + (d->>'quantity')::int - item_row.quantity));
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
      if k.type_rules_id = 'pit_fighters' then raise exception 'Pit Fighters cannot sell captives.' using errcode = '22023'; end if;
      expect_kg := 5 * d6; label := 'Sold to slavers for ' || 5 * d6 || ' gc (D6 ' || d6 || ')';
  end case;
  if og <> expect_og or kg <> expect_kg or ow <> 0 or kw <> 0 then raise exception 'The gold changes do not match the outcome.' using errcode = '22023'; end if;
  if kind = 'sell' then
    if gained <> snap_kit then raise exception 'The captor must gain exactly the captured model''s kit (%).', (select string_agg(e.key || ' ×' || e.value, ', ' order by e.key) from jsonb_each_text(snap_kit) e) using errcode = '22023'; end if;
  else
    if not (group_updated or group_seen) then raise exception 'The returning model must rejoin % or form a new group carrying his snapshot.', coalesce(grow.name, sgroup->>'name') using errcode = '22023'; end if;
    if restored <> snap_kit then raise exception 'The returning model brings back exactly his own kit (%).', (select string_agg(e.key || ' ×' || e.value, ', ' order by e.key) from jsonb_each_text(snap_kit) e) using errcode = '22023'; end if;
  end if;

  parts := array[label || ': ' || p_case.hero_name || ' (' || v.name || ')' || case when kind = 'sell' then ' is sold by ' || k.name else case when group_updated then ' returns to ' || grow.name else ' returns as a new group carrying his own profile' end end];
  if og <> 0 then parts := parts || format('%s gold %s → %s', v.name, v.gold, v.gold + og); end if;
  if kg <> 0 then parts := parts || format('%s gold %s → %s', k.name, k.gold, k.gold + kg); end if;
  if snap_kit <> '{}'::jsonb then parts := parts || format('%s: %s', case when kind = 'sell' then k.name || ' keeps his kit' else 'kit restored' end, (select string_agg(e.key || case when (e.value)::int > 1 then ' ×' || e.value else '' end, ', ' order by e.key) from jsonb_each_text(snap_kit) e)); end if;
  return left(array_to_string(parts, '. ') || '.', 1000);
end $$;
revoke all on function public.validate_forced_henchman_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;

-- Dispatch: kidnapped stays with Pirates; henchman forced captures take the branch above.
create or replace function public.validate_captive_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb default '[]'::jsonb)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_choice) = 'object' and p_choice->>'kind' = 'kidnapped' then
    return public.validate_kidnapped_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind = 'henchman' and p_case.source = 'forced_capture' then
    return public.validate_forced_henchman_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind <> 'hero' then raise exception 'A lost henchman can only be resolved through Kidnapped!.' using errcode = '22023'; end if;
  return public.validate_core_captive_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
end $$;
revoke all on function public.validate_captive_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;
