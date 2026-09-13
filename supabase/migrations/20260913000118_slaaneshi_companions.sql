-- Equipment companions use stable animal IDs, not hero UUIDs.
alter table public.slaaneshi_holds alter column target_id type text using target_id::text;
create or replace function public.record_slaaneshi_hold() returns trigger
language plpgsql security definer set search_path='' as $$
declare h public.heroes%rowtype; target_hero public.heroes%rowtype; target_group public.henchman_groups%rowtype; target_unit text; target_large boolean; ordinal numeric; weapon text; held public.slaaneshi_holds%rowtype; animal_parts text[]; animal_count integer;
begin
 if new.payload ? 'slaaneshi_lock' or exists(select 1 from public.slaaneshi_holds where match_id=new.match_id and released_at is null) then perform id from public.matches where id=new.match_id for update; end if;
 if new.payload ? 'slaaneshi_lock' then
  perform id from public.warbands where id::text in (new.payload->>'attacker_warband_id',new.payload->>'target_warband_id') order by id for update;
  if not exists(select 1 from public.matches where id=new.match_id and state='in_progress') then raise exception 'A new hold requires a battle in progress.'; end if;
  if lower(coalesce(new.payload->>'outcome',''))<>'knocked down' then raise exception 'A Man-Catcher hold knocks its target down.'; end if;
  if coalesce((new.payload->>'out_of_action')::boolean,false) or coalesce((new.payload->>'kill')::boolean,false) or coalesce((new.payload->>'wounds_lost')::integer,0)<1 then raise exception 'A Man-Catcher hold requires an unsaved wound, not an out-of-action kill.'; end if;
  select * into h from public.heroes where id::text=new.payload->>'attacker_id' and warband_id::text=new.payload->>'attacker_warband_id' for update;
  if h.id is null or h.status<>'active' or h.unit_type_rules_id<>'court_of_pleasures_whipmaster' or h.is_hired_sword then raise exception 'Only the Whipmaster can use the Slaaneshi Man-Catcher.'; end if;
  if not public.can_edit_warband(h.warband_id) and not public.is_campaign_gm(public.match_campaign(new.match_id)) then raise exception 'You cannot record this wielder''s hold.' using errcode='42501'; end if;
  weapon:=new.payload->'slaaneshi_lock'->>'weaponId';
  if weapon not in ('slaaneshi_man_catcher','gromril_slaaneshi_man_catcher','ithilmar_slaaneshi_man_catcher') or weapon is null or not exists(select 1 from public.items where warband_id=h.warband_id and holder_type='hero' and holder_id=h.id and item_rules_id=weapon and quantity>0) then raise exception 'The Whipmaster must carry the recorded Man-Catcher.'; end if;
  if jsonb_typeof(new.payload->'slaaneshi_lock'->'modelIndex') is distinct from 'number' then raise exception 'Choose the particular model held.'; end if;
  ordinal:=(new.payload->'slaaneshi_lock'->>'modelIndex')::numeric;
  if ordinal<>trunc(ordinal) or ordinal<0 then raise exception 'Choose a valid model number.'; end if;
  if (new.payload->>'target_id') like 'animal:%' then
   animal_parts:=string_to_array(new.payload->>'target_id',':');
   if cardinality(animal_parts)<>4 or animal_parts[3] not in ('wardogs','gnoblar_fighter') or animal_parts[4]!~'^[0-9]+$' or ordinal<>0 then raise exception 'Choose a valid equipment companion.'; end if;
   select * into target_hero from public.heroes where id::text=animal_parts[2] and warband_id::text=new.payload->>'target_warband_id' and status='active' for update;
   if target_hero.id is null then raise exception 'Choose a companion of an active enemy warrior.'; end if;
   select coalesce(sum(quantity),0) into animal_count from public.items where warband_id=target_hero.warband_id and holder_type='hero' and holder_id=target_hero.id and item_rules_id=animal_parts[3];
   if animal_parts[4]::integer<1 or animal_parts[4]::integer>animal_count then raise exception 'That equipment companion is not in this roster.'; end if;
   target_unit:=animal_parts[3];target_large:=false;
  elsif new.payload->>'target_kind'='hero' then
   select * into target_hero from public.heroes where id::text=new.payload->>'target_id' and warband_id::text=new.payload->>'target_warband_id' and status='active' for update;
   if target_hero.id is null or ordinal<>0 then raise exception 'Choose an active enemy warrior.'; end if;
   target_unit:=public.capture_unit_key(target_hero.unit_type_rules_id,target_hero.is_hired_sword,target_hero.hired_sword_rules_id);target_large:=target_hero.is_large;
  elsif new.payload->>'target_kind'='group' then
   select * into target_group from public.henchman_groups where id::text=new.payload->>'target_id' and warband_id::text=new.payload->>'target_warband_id' for update;
   if target_group.id is null or ordinal>=target_group.size then raise exception 'Choose a model still in this group.'; end if;
   target_unit:=target_group.unit_type_rules_id;target_large:=target_group.is_large;
  else raise exception 'Choose an enemy warrior or individual henchman.';
  end if;
  if h.warband_id::text=new.payload->>'target_warband_id' or not exists(select 1 from public.match_participants where match_id=new.match_id and warband_id=h.warband_id) or not exists(select 1 from public.match_participants where match_id=new.match_id and warband_id::text=new.payload->>'target_warband_id') then raise exception 'Both warriors must be opposing participants in this battle.'; end if;
  if public.capture_unit_large(target_unit,target_large) or target_unit='companion_filly' then raise exception 'The Slaaneshi Man-Catcher cannot hold Large creatures or steeds.'; end if;
  insert into public.slaaneshi_holds(match_id,source_event_id,wielder_warband_id,wielder_id,target_warband_id,target_id,target_kind,target_model_index,target_name,history)
  values(new.match_id,new.id,h.warband_id,h.id,(new.payload->>'target_warband_id')::uuid,new.payload->>'target_id',new.payload->>'target_kind',ordinal::integer,new.payload->>'target_name',jsonb_build_array(jsonb_build_object('event','held','at',clock_timestamp(),'by',auth.uid())));
 end if;
 -- A Hero's OOA result identifies the exact model; a group needs an explicit model index.
 if coalesce((new.payload->>'out_of_action')::boolean,false) then
  for held in select * from public.slaaneshi_holds where match_id=new.match_id and released_at is null and
   (wielder_id::text=new.payload->>'target_id' or (target_id::text=new.payload->>'target_id' and (target_kind='hero' or target_model_index::text=new.payload->>'target_model_index'))) for update loop
   update public.slaaneshi_holds set released_at=clock_timestamp(),released_by_event_id=new.id,confirmed_end_at=null,release_reason=case when held.wielder_id::text=new.payload->>'target_id' then 'wielderOutOfAction' else 'targetOutOfAction' end,
   history=history||jsonb_build_array(jsonb_build_object('event','released','sourceEventId',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
  end loop;
 end if;
 return new;
end $$;

-- Adapt already-installed report functions to the wider target key.
do $patch$ declare n text; original text; updated text; begin
 foreach n in array array['open_forced_capture_cases','create_captive_cases'] loop
  original:=pg_get_functiondef(to_regprocedure('public.'||n||'()'));
  updated:=replace(replace(original,'target_id=grow.id','target_id=grow.id::text'),'target_id=h.id','target_id=h.id::text');
  if updated=original then raise exception 'Expected Slaaneshi target boundary missing in %',n; end if;
  execute updated;
 end loop;
end $patch$;
create or replace function public.open_companion_capture_cases() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cap jsonb; ev public.battle_events%rowtype; parts text[]; hero public.heroes%rowtype; before_row jsonb; lost int; used jsonb := '{}'::jsonb; seen uuid[] := '{}';
  sid uuid; n int; n_from int; n_to int; v_case uuid; v_owner uuid; v_captor_owner uuid; v_captor_name text; kind_name text;
begin
  if new.undo is null or old.undo is not null then return new; end if;
  for cap in select x from jsonb_array_elements(coalesce(new.applied->'captured_companions', '[]'::jsonb)) x loop
    if coalesce(cap->>'reason','') not in ('subjugator','slaaneshi_lock') then raise exception 'Captured companions: unsupported capture reason %.', cap->>'reason' using errcode = '22023'; end if;
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
        and ((cap->>'reason'='subjugator' and coalesce((payload->>'out_of_action')::boolean,false) and payload->>'capture_reason'='subjugator')
         or (cap->>'reason'='slaaneshi_lock' and exists(select 1 from public.slaaneshi_holds held where held.source_event_id=battle_events.id and held.match_id=new.match_id and held.target_id=cap->>'animalId' and held.target_warband_id=new.warband_id and held.wielder_warband_id::text=cap->>'captorWarbandId' and held.released_at is null and held.confirmed_end_at is not null)))
        and payload->>'target_id' = cap->>'animalId' and payload->>'target_warband_id' = new.warband_id::text
        and payload->>'attacker_warband_id' = cap->>'captorWarbandId';
    if not found then raise exception 'Captured companions: % has no matching unreverted capture event by that warband.', cap->>'animalId' using errcode = '22023'; end if;
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
                                 'animal_id', cap->>'animalId', 'event_id', ev.id, 'reason', cap->>'reason', 'captor_name', ev.payload->>'attacker_name', 'kind_name', kind_name))
      on conflict do nothing returning id into v_case;
    if v_case is null then continue; end if;
    select owner_id into v_owner from public.warbands where id = new.warband_id;
    select owner_id, name into v_captor_owner, v_captor_name from public.warbands where id = (cap->>'captorWarbandId')::uuid;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_owner, 'captive', left(hero.name || '''s ' || kind_name || ' was captured by ' || v_captor_name, 140), case when cap->>'reason'='slaaneshi_lock' then 'Still held by the Slaaneshi Man-Catcher at battle end. Agree its release, ransom or sale from your warband page.' else 'Taken with the Subjugator of Mankind. Agree its release, ransom or sale with their player from your warband page.' end, '/warbands/' || new.warband_id, 'captive:' || v_case || ':victim') on conflict do nothing;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_captor_owner, 'captive', left('Your warband holds a captured ' || kind_name, 140), 'Propose its release, a ransom or a sale from your warband page. The other player must accept it.', '/warbands/' || (cap->>'captorWarbandId'), 'captive:' || v_case || ':captor') on conflict do nothing;
  end loop;
  return new;
end $$;
