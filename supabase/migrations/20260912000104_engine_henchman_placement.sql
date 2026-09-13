-- #229 / #95 Engine of Chaos custody, step two: a henchman taken by a Chaos Dwarf Man-catcher (a
-- forced-capture case of migration 092, bridged by 103) can be locked in the Engine as well. The
-- model already left his group and his kit already left the roster when the report was applied, so
-- the victim's side changes nothing; the Chaos Dwarf stash gains exactly the captured model's kit
-- (the case's model_snapshot) and the case becomes 'held' as for a Hero. Places follow the group's
-- own is_large or its native profile (a Man-catcher cannot take Large models, but the ledger never
-- undercharges). Reversal runs through the 090 snapshot as before and frees the place.

create or replace function public.validate_engine_placement_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v public.warbands%rowtype; k public.warbands%rowtype; h public.heroes%rowtype; e public.engine_of_chaos_units%rowtype; item_row public.items%rowtype;
  c jsonb; keys text[]; t text; op text; v_id uuid; d jsonb; key text; qty int; tag text; seen text[] := '{}'; snap jsonb := p_case.model_snapshot; sgroup jsonb;
  surrendered jsonb := '{}'::jsonb; gained jsonb := '{}'::jsonb; moved int := 0; hero_items int; places int; used int; kit_text text; msg text; who text; pronoun text := 'His';
begin
  if p_case.subject_kind not in ('hero', 'henchman') then raise exception 'Only a captured Hero, hired sword or henchman can be locked in an Engine of Chaos.' using errcode = '22023'; end if;
  if p_case.subject_kind = 'henchman' and (snap is null or p_case.source <> 'forced_capture') then raise exception 'A lost henchman can only be resolved through Kidnapped!.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_advances, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_advances, '[]'::jsonb)) > 0 then raise exception 'Imprisonment awards no experience.' using errcode = '22023'; end if;
  select * into v from public.warbands where id = p_case.victim_warband_id;
  select * into k from public.warbands where id = p_case.captor_warband_id;
  if k.id is null or k.type_rules_id <> 'black_dwarfs' then raise exception 'Only a Chaos Dwarf warband keeps an Engine of Chaos.' using errcode = '22023'; end if;
  if (p_choice->>'engineId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Choose the Engine that holds the prisoner.' using errcode = '22023'; end if;
  select * into e from public.engine_of_chaos_units where id = (p_choice->>'engineId')::uuid and warband_id = k.id and state <> 'retired';
  if not found then raise exception 'That Engine is not in the captor''s inventory.' using errcode = '22023'; end if;
  if e.state <> 'present' then raise exception '% is away; prisoners can only be locked in an Engine that is with the warband.', e.name using errcode = 'P0001'; end if;

  if p_case.subject_kind = 'hero' then
    select * into h from public.heroes where id = p_case.hero_id and warband_id = v.id and status = 'captured';
    if not found then raise exception 'This warrior is no longer recorded as captured.' using errcode = 'P0001'; end if;
    who := h.name;
    places := case when public.capture_unit_large(public.capture_unit_key(h.unit_type_rules_id, h.is_hired_sword, h.hired_sword_rules_id), h.is_large) then 2 else 1 end;
    select count(*) into hero_items from public.items where warband_id = v.id and holder_type = 'hero' and holder_id = h.id;
    for c in select x from jsonb_array_elements(p_owner_changes) x loop
      t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid;
      tag := t || ':' || op || ':' || coalesce(v_id::text, v.id::text);
      if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      seen := seen || tag;
      if t = 'items' and op = 'delete' then
        select * into item_row from public.items i where i.id = v_id and i.warband_id = v.id and i.holder_type = 'hero' and i.holder_id = h.id;
        if not found then raise exception 'The proposal changes something imprisonment cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023'; end if;
        key := public.captive_item_key(item_row.item_rules_id, item_row.custom_name, item_row.notes);
        surrendered := jsonb_set(surrendered, array[key], to_jsonb(coalesce((surrendered->>key)::int, 0) + item_row.quantity));
        moved := moved + 1;
      else
        raise exception 'Imprisonment only confiscates the prisoner''s equipment; the proposal changes % % on %.', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
      end if;
    end loop;
    if moved <> hero_items then raise exception 'All of the prisoner''s equipment is lost to the Chaos Dwarfs: the proposal must hand over every item he carries.' using errcode = '22023'; end if;
  else
    -- Henchman: already off the roster with his kit (report), so the victim's side stays untouched.
    if exists (select 1 from public.battle_events where id = (snap->>'event_id')::uuid and reverted_at is not null) then
      raise exception 'The capture event behind this case was reverted in the battle log. Correct the report instead of resolving the captive.' using errcode = 'P0001';
    end if;
    sgroup := snap->'group';
    who := p_case.hero_name;
    places := case when public.capture_unit_large(sgroup->>'unit_type_rules_id', coalesce((sgroup->>'is_large')::boolean, false)) then 2 else 1 end;
    if jsonb_typeof(coalesce(p_owner_changes, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_owner_changes, '[]'::jsonb)) > 0 then
      raise exception 'An imprisoned henchman is already off his warband''s roster; nothing changes on the victim''s side.' using errcode = '22023';
    end if;
    surrendered := (select coalesce(jsonb_object_agg(x.key, x.total), '{}'::jsonb) from (
                      select public.captive_item_key(i->>'item_rules_id', i->>'custom_name', i->>'notes') as key, sum((i->>'quantity')::int) as total
                        from jsonb_array_elements(coalesce(snap->'items', '[]'::jsonb)) i group by 1) x);
    hero_items := (select count(*) from jsonb_each(surrendered));
  end if;
  used := public.engine_places_used(e.id);
  if used + places > 6 then raise exception '% is full: % of six places are taken and % needs %.', e.name, used, who, places using errcode = 'P0001'; end if;

  for c in select x from jsonb_array_elements(p_captor_changes) x loop
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    if t = 'items' and op = 'insert' then
      if coalesce(d->>'holder_type', 'stash') <> 'stash' or nullif(d->>'holder_id', '') is not null then raise exception 'Confiscated equipment goes to the Chaos Dwarf stash.' using errcode = '22023'; end if;
      key := public.captive_item_key(d->>'item_rules_id', d->>'custom_name', d->>'notes'); qty := coalesce((d->>'quantity')::int, 1);
      if qty < 1 or not (surrendered ? key) then raise exception 'The Chaos Dwarfs may only gain what the prisoner carried.' using errcode = '22023'; end if;
      gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + qty));
    elsif t = 'items' and op = 'update' then
      tag := t || ':' || op || ':' || coalesce(v_id::text, '-');
      if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      seen := seen || tag;
      select * into item_row from public.items where id = v_id and warband_id = k.id and holder_type = 'stash';
      if not found or not (keys <@ array['quantity']) or coalesce((d->>'quantity')::int, 0) <= item_row.quantity then raise exception 'The proposal changes something imprisonment cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023'; end if;
      key := public.captive_item_key(item_row.item_rules_id, item_row.custom_name, item_row.notes);
      if not (surrendered ? key) then raise exception 'The Chaos Dwarfs may only gain what the prisoner carried.' using errcode = '22023'; end if;
      gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + (d->>'quantity')::int - item_row.quantity));
    else
      raise exception 'Imprisonment only confiscates the prisoner''s equipment; the proposal changes % % on %.', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
    end if;
  end loop;
  select string_agg(public.captive_kit_label(x.key) || case when (x.value)::int > 1 then ' ×' || x.value else '' end, ', ' order by x.key) into kit_text from jsonb_each_text(surrendered) x;
  if gained <> surrendered then raise exception 'The Chaos Dwarf stash must gain exactly the prisoner''s equipment (%).', coalesce(kit_text, 'nothing') using errcode = '22023'; end if;

  msg := 'Locked in ' || e.name || '. ' || who || ' (' || v.name || ') stays captured and is imprisoned in the Engine of Chaos of ' || k.name
    || ', taking ' || case when places = 1 then 'one place' else 'two places (Large)' end || ' (' || used + places || ' of 6 used). '
    || case when hero_items > 0 then pronoun || ' equipment is lost to ' || k.name || ': ' || kit_text || '.' else 'He carried no equipment.' end
    || case when p_case.subject_kind = 'henchman' then ' He left ' || coalesce(sgroup->>'name', 'his group') || ' when the report was applied.' else '' end
    || ' Ransom, exchange or sale need the placement reversed first.';
  if length(msg) > 30000 then raise exception 'The consent text is too long to record; shorten the equipment annotations and try again.' using errcode = '22023'; end if;
  return msg;
end $$;

create or replace function public.engine_prisoner_on_proposal() returns trigger language plpgsql security definer set search_path = '' as $$
declare c public.captive_cases%rowtype; e public.engine_of_chaos_units%rowtype; h public.heroes%rowtype; places int; used int; kit jsonb; original jsonb; subject jsonb; sgroup jsonb;
begin
  if new.choice->>'kind' <> 'engine_placement' or old.state = new.state then return new; end if;
  if new.state = 'accepted' then
    select * into c from public.captive_cases where id = new.case_id;
    select * into e from public.engine_of_chaos_units where id = (new.choice->>'engineId')::uuid;
    if e.id is null then raise exception 'That Engine is not in the captor''s inventory.' using errcode = 'P0001'; end if;
    if new.before_snapshot is null then raise exception 'The placement was accepted without its roster snapshot.' using errcode = 'P0001'; end if;
    -- Lock order from 101: the stock item row, then this stock's Engine rows by id.
    perform id from public.items where id = e.inventory_item_id for update;
    perform id from public.engine_of_chaos_units where inventory_item_id = e.inventory_item_id order by id for update;
    select * into e from public.engine_of_chaos_units where id = e.id;
    if e.state <> 'present' then raise exception '% is away; prisoners can only be locked in an Engine that is with the warband.', e.name using errcode = 'P0001'; end if;
    if c.subject_kind = 'hero' then
      select * into h from public.heroes where id = c.hero_id;
      places := case when public.capture_unit_large(public.capture_unit_key(h.unit_type_rules_id, h.is_hired_sword, h.hired_sword_rules_id), h.is_large) then 2 else 1 end;
      select x into subject from jsonb_array_elements(new.before_snapshot->'heroes') x where (x->>'id')::uuid = c.hero_id;
      subject := jsonb_build_object('hero', coalesce(subject, to_jsonb(h) - 'updated_at'));
      select coalesce(jsonb_agg(x order by x->>'id'), '[]'::jsonb) into original from jsonb_array_elements(new.before_snapshot->'items') x
        where (x->>'warband_id')::uuid = c.victim_warband_id and x->>'holder_type' = 'hero' and (x->>'holder_id')::uuid = c.hero_id;
    else
      sgroup := c.model_snapshot->'group';
      places := case when public.capture_unit_large(sgroup->>'unit_type_rules_id', coalesce((sgroup->>'is_large')::boolean, false)) then 2 else 1 end;
      subject := jsonb_build_object('henchman', c.model_snapshot, 'model_index', c.model_index);
      original := coalesce(c.model_snapshot->'items', '[]'::jsonb);
    end if;
    used := public.engine_places_used(e.id);
    if used + places > 6 then raise exception '% is full: % of six places are taken and % needs %.', e.name, used, c.hero_name, places using errcode = 'P0001'; end if;
    select coalesce(jsonb_agg(x), '[]'::jsonb) into kit from jsonb_array_elements(new.captor_changes) x where x->>'table' = 'items';
    insert into public.engine_prisoners (engine_id, holder_warband_id, case_id, victim_warband_id, name, large, places, snapshot, confiscated, proposal_id, placed_by, history)
      values (e.id, c.captor_warband_id, c.id, c.victim_warband_id, c.hero_name, places = 2, places,
              subject || jsonb_build_object('items', original, 'report_id', c.report_id, 'report_revision', c.report_revision, 'source', c.source, 'subject_kind', c.subject_kind),
              kit, new.id, auth.uid(),
              jsonb_build_array(jsonb_build_object('event', 'placed', 'at', now(), 'by', auth.uid(), 'proposal_id', new.id)));
    update public.engine_of_chaos_units set history = history || jsonb_build_object('event', 'prisoner_placed', 'at', now(), 'by', auth.uid(), 'name', c.hero_name, 'places', places) where id = e.id;
  elsif new.state = 'reversed' then
    -- reverse_captive_resolution has normally done this already; a GM release-only path lands here.
    with done as (
      update public.engine_prisoners set state = 'reversed', released_at = now(), release_reason = new.reason,
             history = history || jsonb_build_object('event', 'placement_reversed', 'at', now(), 'by', auth.uid(), 'reason', new.reason)
        where proposal_id = new.id and state = 'held' returning engine_id, name)
    update public.engine_of_chaos_units u set history = u.history || jsonb_build_object('event', 'prisoner_released', 'at', now(), 'by', auth.uid(), 'name', done.name, 'reason', new.reason)
      from done where u.id = done.engine_id;
  end if;
  return new;
end $$;
