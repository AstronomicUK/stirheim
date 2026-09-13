-- Confirmed end-of-battle holds use the existing exact-kit captive machinery,
-- without inventing an OOA event or kill experience.
CREATE OR REPLACE FUNCTION public.open_forced_capture_cases()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  line jsonb; cap jsonb; k jsonb; ev public.battle_events%rowtype; g jsonb; grow public.henchman_groups%rowtype; ordinal int; v_case uuid; v_owner uuid; v_captor_owner uuid; v_captor_name text;
  captured_count int; seen uuid[] := '{}'; used jsonb; before_row jsonb; lost int; kit jsonb; sid uuid; q int; key_row text; key_cap text;
begin
  if new.undo is null or old.undo is not null then return new; end if;
  for line in select x from jsonb_array_elements(coalesce(new.injuries, '[]'::jsonb)) x
              where x->>'subjectType' = 'group' and jsonb_typeof(x->'captured') = 'array' and jsonb_array_length(x->'captured') > 0 loop
    if (line->>'subjectId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Captured henchmen: the group id is not valid.' using errcode = '22023'; end if;
    select * into grow from public.henchman_groups where id = (line->>'subjectId')::uuid and warband_id = new.warband_id;
    if not found then raise exception 'Captured henchmen: group % is not in this warband.', line->>'subjectName' using errcode = '22023'; end if;
    -- The pre-report group: the undo before-row when the report patched it, otherwise the row as it
    -- stands (a report may recruit replacements in the same filing, so the final size proves nothing).
    select e->'before' into g from jsonb_array_elements(coalesce(new.undo->'groups', '[]'::jsonb)) e where e->>'id' = line->>'subjectId' limit 1;
    if g is null then g := jsonb_build_object('stats', grow.stats, 'size', grow.size, 'xp', grow.xp, 'level_ups', grow.level_ups, 'campaign_state', grow.campaign_state); end if;
    captured_count := jsonb_array_length(line->'captured');
    if coalesce((line->>'dead')::int, 0) + captured_count > (g->>'size')::int then
      raise exception 'Captured henchmen: % had % models before the battle but the report loses % dead and % captured.', grow.name, g->>'size', coalesce((line->>'dead')::int, 0), captured_count using errcode = '22023';
    end if;
    used := '{}'::jsonb;
    for cap in select x from jsonb_array_elements(line->'captured') x loop
      if coalesce(cap->>'reason','') not in ('subjugator','man_catcher','cavalcade','slaaneshi_lock') then raise exception 'Captured henchmen: unsupported capture reason %.', cap->>'reason' using errcode = '22023'; end if;
      if (cap->>'eventId') !~* '^[0-9a-f]{8}-' or (cap->>'captorWarbandId') !~* '^[0-9a-f]{8}-' then raise exception 'Captured henchmen: event and captor ids are required.' using errcode = '22023'; end if;
      if (cap->>'modelIndex') !~ '^[0-9]+$' or (cap->>'modelIndex')::int < 1 or (cap->>'modelIndex')::int > (g->>'size')::int then
        raise exception 'Captured henchmen: casualty % does not exist; % had % models before the battle.', cap->>'modelIndex', grow.name, g->>'size' using errcode = '22023';
      end if;
      select * into ev from public.battle_events
        where id = (cap->>'eventId')::uuid and match_id = new.match_id and kind = 'attack' and reverted_at is null
          and ((coalesce((payload->>'out_of_action')::boolean, false) and payload->>'capture_reason' = cap->>'reason')
           or (cap->>'reason'='slaaneshi_lock' and exists(select 1 from public.slaaneshi_holds held where held.source_event_id=battle_events.id and held.match_id=new.match_id and held.target_id::text=line->>'subjectId' and held.target_warband_id=new.warband_id and held.wielder_warband_id::text=cap->>'captorWarbandId' and held.released_at is null and held.confirmed_end_at is not null and held.target_model_index+1=(cap->>'heldModelIndex')::integer)))
          and payload->>'target_kind' = 'group' and payload->>'target_id' = line->>'subjectId' and payload->>'target_warband_id' = new.warband_id::text
          and payload->>'attacker_warband_id' = cap->>'captorWarbandId';
      if not found then raise exception 'Captured henchmen: model % of % has no unreverted capture event by that warband.', cap->>'modelIndex', grow.name using errcode = '22023'; end if;
      if ev.id = any(seen) then raise exception 'Captured henchmen: the same capture event is used twice.' using errcode = '22023'; end if;
      seen := seen || ev.id;
      -- Casualty numbers: ordinary (app-calculated) out-of-action events are numbered by time; a manual
      -- marker (metadata_only, migration 096) is numbered after all of them by its raw tally slot.
      if cap->>'reason'='slaaneshi_lock' then
        select coalesce((select (o->>'count')::integer from jsonb_array_elements(coalesce(new.ooa,'[]'::jsonb)) o where o->>'subjectId'=line->>'subjectId' limit 1),0)+rn into ordinal from (
         select source_event_id,row_number() over(order by created_at,id) rn from public.slaaneshi_holds where match_id=new.match_id and target_id=grow.id and target_warband_id=new.warband_id and released_at is null and confirmed_end_at is not null
        ) held where held.source_event_id=ev.id;
      elsif coalesce((ev.payload->>'metadata_only')::boolean, false) then
        if (ev.payload->>'manual_casualty_index') !~ '^[0-9]+$' then raise exception 'Captured henchmen: the manual casualty marker for % has no raw index.', grow.name using errcode = '22023'; end if;
        select count(*) + (ev.payload->>'manual_casualty_index')::int + 1 into ordinal from public.battle_events
         where match_id = new.match_id and kind = 'attack' and reverted_at is null and coalesce((payload->>'out_of_action')::boolean, false) and not coalesce((payload->>'metadata_only')::boolean, false)
           and payload->>'target_kind' = 'group' and payload->>'target_id' = line->>'subjectId' and payload->>'target_warband_id' = new.warband_id::text;
      else
        select rn into ordinal from (
          select id, row_number() over (order by at, id) as rn from public.battle_events
           where match_id = new.match_id and kind = 'attack' and reverted_at is null and coalesce((payload->>'out_of_action')::boolean, false) and not coalesce((payload->>'metadata_only')::boolean, false)
             and payload->>'target_kind' = 'group' and payload->>'target_id' = line->>'subjectId' and payload->>'target_warband_id' = new.warband_id::text) r where r.id = ev.id;
      end if;
      if ordinal is distinct from (cap->>'modelIndex')::int then raise exception 'Captured henchmen: the capture event for % is casualty % of the group, not %.', grow.name, ordinal, cap->>'modelIndex' using errcode = '22023'; end if;
      if (cap->>'captorWarbandId')::uuid = new.warband_id or not exists (select 1 from public.match_participants where match_id = new.match_id and warband_id = (cap->>'captorWarbandId')::uuid) then
        raise exception 'Captured henchmen: the captor must be another warband in this battle.' using errcode = '22023';
      end if;
      -- Kit: each entry names a pre-report item row of this group. The pool the captured models may
      -- claim from a row is the injury-stage casualty accounting (line.equipmentLost, what left with
      -- the casualties, net of supplies spent), itself capped by the pre-report inventory; final
      -- quantities prove nothing because the same report may recruit replacements and re-arm them.
      -- A report without that accounting falls back to before − final, conservatively.
      kit := '[]'::jsonb;
      for k in select x from jsonb_array_elements(coalesce(cap->'kit', '[]'::jsonb)) x loop
        sid := (k->>'sourceItemId')::uuid; q := (k->>'quantity')::int;
        if sid is null or q is null or q < 1 then raise exception 'Captured henchmen: each kit entry needs its source item and a positive quantity.' using errcode = '22023'; end if;
        select u->'row' || jsonb_build_object('before_quantity', (u->'before'->>'quantity')::int) into before_row from jsonb_array_elements(coalesce(new.undo->'items', '[]'::jsonb)) u
          where (u->>'id')::uuid = sid and u->'row'->>'holder_type' = 'group' and u->'row'->>'holder_id' = line->>'subjectId' limit 1;
        if before_row is null then
          select to_jsonb(i) || jsonb_build_object('before_quantity', i.quantity) into before_row from public.items i where i.id = sid and i.warband_id = new.warband_id and i.holder_type = 'group' and i.holder_id = grow.id;
        end if;
        if before_row is null then raise exception 'Captured henchmen: kit item % was not carried by % before this report.', sid, grow.name using errcode = '22023'; end if;
        if jsonb_typeof(line->'equipmentLost') = 'array' then
          lost := coalesce((select (e->>'quantity')::int from jsonb_array_elements(line->'equipmentLost') e where (e->>'sourceItemId')::uuid = sid limit 1), 0);
          if lost > (before_row->>'before_quantity')::int then raise exception 'Captured henchmen: the report records % of % lost from % but the group only carried %.', lost, coalesce(before_row->>'item_rules_id', before_row->>'custom_name'), grow.name, before_row->>'before_quantity' using errcode = '22023'; end if;
        else
          lost := (before_row->>'before_quantity')::int - coalesce((select (pt->>'quantity')::int from jsonb_array_elements(coalesce(new.applied->'item_patches', '[]'::jsonb)) pt where (pt->>'id')::uuid = sid limit 1), (before_row->>'before_quantity')::int);
        end if;
        if coalesce((used->>sid::text)::int, 0) + q > lost then raise exception 'Captured henchmen: the casualties took only % of % from %, but the captured models claim more.', lost, coalesce(before_row->>'item_rules_id', before_row->>'custom_name'), grow.name using errcode = '22023'; end if;
        used := jsonb_set(used, array[sid::text], to_jsonb(coalesce((used->>sid::text)::int, 0) + q));
        key_row := coalesce(before_row->>'item_rules_id', 'custom:' || coalesce(before_row->>'custom_name', ''));
        key_cap := coalesce(k->>'itemId', 'custom:' || coalesce(k->>'customName', ''));
        if key_cap <> key_row then raise exception 'Captured henchmen: kit entry names % but the source row is %.', key_cap, key_row using errcode = '22023'; end if;
        if k ? 'notes' and coalesce(k->>'notes', '') <> coalesce(before_row->>'notes', '') then raise exception 'Captured henchmen: kit entry notes "%" do not match the source row ("%"); equipment properties are taken from the roster, never invented.', k->>'notes', coalesce(before_row->>'notes', '') using errcode = '22023'; end if;
        kit := kit || jsonb_build_object('source_item_id', sid, 'item_rules_id', before_row->'item_rules_id', 'custom_name', before_row->'custom_name', 'quantity', q, 'notes', coalesce(before_row->>'notes', ''));
      end loop;
      insert into public.captive_cases (report_id, report_revision, match_id, victim_warband_id, captor_warband_id, hero_id, hero_name, state, assigned_at, subject_kind, model_index, source, model_snapshot)
        values (new.id, new.revision, new.match_id, new.warband_id, (cap->>'captorWarbandId')::uuid, grow.id, grow.name || ' (model ' || coalesce(cap->>'heldModelIndex',cap->>'modelIndex') || ')', 'open', now(), 'henchman', (cap->>'modelIndex')::int, 'forced_capture',
                jsonb_build_object('group', g || jsonb_build_object('id', grow.id, 'name', grow.name, 'unit_type_rules_id', grow.unit_type_rules_id, 'stat_increases', grow.stat_increases, 'is_large', grow.is_large),
                                   'items', kit, 'event_id', ev.id, 'held_model_index',cap->'heldModelIndex', 'reason', cap->>'reason', 'captor_name', ev.payload->>'attacker_name'))
        on conflict do nothing returning id into v_case;
      if v_case is null then continue; end if;
      select owner_id into v_owner from public.warbands where id = new.warband_id;
      select owner_id, name into v_captor_owner, v_captor_name from public.warbands where id = (cap->>'captorWarbandId')::uuid;
      insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
        values (v_owner, 'captive', left(grow.name || ': a henchman was captured by ' || v_captor_name, 140), case when cap->>'reason'='slaaneshi_lock' then 'Still held by the Slaaneshi Man-Catcher at the end of the battle. Agree the captive outcome with the other player from your warband page.' when cap->>'reason'='cavalcade' then 'Captured by the Misericordia. Agree the Throne of Worms outcome with the Cavalcade player from your warband page.' when cap->>'reason'='man_catcher' then 'Taken out of action with a Man-catcher. Review imprisonment and the confiscated equipment with the Chaos Dwarf player from your warband page.' else 'Taken with the Subjugator of Mankind. Agree his release, ransom or sale with their player from your warband page.' end, '/warbands/' || new.warband_id, 'captive:' || v_case || ':victim') on conflict do nothing;
      insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
        values (v_captor_owner, 'captive', left('Your warband holds a captured ' || grow.name || ' henchman', 140), case when cap->>'reason'='slaaneshi_lock' then 'Still held by the Slaaneshi Man-Catcher at the end of the battle. Agree the captive outcome with the other player from your warband page.' when cap->>'reason'='cavalcade' then 'Captured by the Misericordia. Agree the Throne of Worms outcome with the Cavalcade player from your warband page.' when cap->>'reason'='man_catcher' then 'Your Man-catcher took this model captive. Record which Engine holds the prisoner and agree the equipment transfer with the other player.' else 'Propose his release, a ransom or a sale from your warband page. The other player must accept it.' end, '/warbands/' || (cap->>'captorWarbandId'), 'captive:' || v_case || ':captor') on conflict do nothing;
    end loop;
  end loop;
  return new;
end $function$;


-- A held Hero's actual captor is known even in a multiplayer battle with no OOA.
do $$
declare original text; updated text;
begin
 select pg_get_functiondef('public.create_captive_cases()'::regprocedure) into original;
 updated:=replace(original,$old$    insert into public.captive_cases (report_id, report_revision, match_id, victim_warband_id, captor_warband_id, hero_id, hero_name, state, assigned_at)$old$,$new$    if exists(select 1 from public.slaaneshi_holds where match_id=new.match_id and target_id=h.id and target_warband_id=new.warband_id and released_at is null and confirmed_end_at is not null) then
      select held.wielder_warband_id into v_captor from public.slaaneshi_holds held join public.battle_events e on e.id=held.source_event_id and e.reverted_at is null where held.match_id=new.match_id and held.target_id=h.id and held.target_warband_id=new.warband_id and held.released_at is null and held.confirmed_end_at is not null limit 1;
    end if;
    insert into public.captive_cases (report_id, report_revision, match_id, victim_warband_id, captor_warband_id, hero_id, hero_name, state, assigned_at)$new$);
 if updated=original then raise exception 'Could not locate Hero captive assignment.'; end if;
 execute updated;
end $$;
