-- Phase 13: per-model names on henchman groups, per-campaign player aliases, warband templates,
-- and shards / gold / veteran pool on imported battle records.

-- ---------------------------------------------------------------------------------------------
-- Henchman group model names
-- ---------------------------------------------------------------------------------------------

alter table public.henchman_groups
  add column model_names text[] not null default '{}'::text[]
  check (coalesce(array_length(model_names, 1), 0) <= 40);

comment on column public.henchman_groups.model_names is 'Optional short names or notes for the individual models in the group, in no particular order.';

-- jsonb array of strings -> text[]; null when the value is absent or not an array.
create or replace function public.jsonb_text_array(p jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case
    when p is null or jsonb_typeof(p) <> 'array' then null
    else coalesce((select array_agg(left(trim(x), 60)) from jsonb_array_elements_text(p) as t(x) where trim(x) <> ''), '{}'::text[])
  end;
$$;

create or replace function public.update_roster(p_warband_id uuid, p_reason text, p_changes jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  c jsonb;
  v_table text;
  v_op text;
  v_id uuid;
  v_data jsonb;
  v_count int := 0;
  v_rows int;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if jsonb_typeof(p_changes) <> 'array' then
    raise exception 'changes must be an array' using errcode = '22023';
  end if;
  -- Under RLS an unreadable warband simply does not exist for this caller.
  if not exists (select 1 from public.warbands w where w.id = p_warband_id) then
    raise exception 'warband % not found', p_warband_id using errcode = 'P0002';
  end if;

  perform set_config('stirheim.audit_reason', coalesce(nullif(trim(p_reason), ''), 'update_roster'), true);

  for c in select * from jsonb_array_elements(p_changes) loop
    v_table := c ->> 'table';
    v_op := c ->> 'op';
    v_id := (c ->> 'id')::uuid;
    v_data := coalesce(c -> 'data', '{}'::jsonb);
    v_rows := 0;

    if v_table = 'warbands' then
      if v_op <> 'update' then
        raise exception 'warbands: only update is allowed here' using errcode = '22023';
      end if;
      update public.warbands set
        name = coalesce(v_data ->> 'name', name),
        gold = coalesce((v_data ->> 'gold')::int, gold),
        wyrdstone = coalesce((v_data ->> 'wyrdstone')::int, wyrdstone),
        veteran_pool = case when v_data ? 'veteran_pool' then (v_data ->> 'veteran_pool')::int else veteran_pool end,
        notes = coalesce(v_data ->> 'notes', notes),
        archived = coalesce((v_data ->> 'archived')::boolean, archived)
      where id = p_warband_id;
      get diagnostics v_rows = row_count;

    elsif v_table = 'heroes' then
      if v_op = 'insert' then
        insert into public.heroes (id, warband_id, name, is_hired_sword, unit_type_rules_id, hired_sword_rules_id, stats, xp,
                                   level_ups, skill_tables, skills, spells, injuries, flags, equipment_locked, is_large,
                                   status, notes, sort_order)
        values (coalesce(v_id, gen_random_uuid()), p_warband_id, v_data ->> 'name', coalesce((v_data ->> 'is_hired_sword')::boolean, false),
                v_data ->> 'unit_type_rules_id', v_data ->> 'hired_sword_rules_id', v_data -> 'stats',
                coalesce((v_data ->> 'xp')::int, 0), coalesce((v_data ->> 'level_ups')::int, 0),
                coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_data -> 'skill_tables', '[]'::jsonb)) x), '{}'),
                coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_data -> 'skills', '[]'::jsonb)) x), '{}'),
                coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_data -> 'spells', '[]'::jsonb)) x), '{}'),
                coalesce(v_data -> 'injuries', '[]'::jsonb), coalesce(v_data -> 'flags', '{}'::jsonb),
                coalesce((v_data ->> 'equipment_locked')::boolean, false), coalesce((v_data ->> 'is_large')::boolean, false),
                coalesce((v_data ->> 'status')::public.warrior_status, 'active'), coalesce(v_data ->> 'notes', ''),
                coalesce((v_data ->> 'sort_order')::int, 0));
        get diagnostics v_rows = row_count;
      elsif v_op = 'update' then
        update public.heroes set
          name = coalesce(v_data ->> 'name', name),
          stats = coalesce(v_data -> 'stats', stats),
          xp = coalesce((v_data ->> 'xp')::int, xp),
          level_ups = coalesce((v_data ->> 'level_ups')::int, level_ups),
          skill_tables = case when v_data ? 'skill_tables' then coalesce((select array_agg(x) from jsonb_array_elements_text(v_data -> 'skill_tables') x), '{}') else skill_tables end,
          skills = case when v_data ? 'skills' then coalesce((select array_agg(x) from jsonb_array_elements_text(v_data -> 'skills') x), '{}') else skills end,
          spells = case when v_data ? 'spells' then coalesce((select array_agg(x) from jsonb_array_elements_text(v_data -> 'spells') x), '{}') else spells end,
          injuries = coalesce(v_data -> 'injuries', injuries),
          flags = coalesce(v_data -> 'flags', flags),
          is_large = coalesce((v_data ->> 'is_large')::boolean, is_large),
          status = coalesce((v_data ->> 'status')::public.warrior_status, status),
          notes = coalesce(v_data ->> 'notes', notes),
          sort_order = coalesce((v_data ->> 'sort_order')::int, sort_order)
        where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      elsif v_op = 'delete' then
        delete from public.heroes where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      end if;

    elsif v_table = 'henchman_groups' then
      if v_op = 'insert' then
        insert into public.henchman_groups (id, warband_id, name, unit_type_rules_id, size, stats, xp, level_ups, stat_increases,
                                            is_large, notes, sort_order, model_names)
        values (coalesce(v_id, gen_random_uuid()), p_warband_id, v_data ->> 'name', v_data ->> 'unit_type_rules_id', coalesce((v_data ->> 'size')::int, 1),
                v_data -> 'stats', coalesce((v_data ->> 'xp')::int, 0), coalesce((v_data ->> 'level_ups')::int, 0),
                coalesce(v_data -> 'stat_increases', '{}'::jsonb), coalesce((v_data ->> 'is_large')::boolean, false),
                coalesce(v_data ->> 'notes', ''), coalesce((v_data ->> 'sort_order')::int, 0),
                coalesce(public.jsonb_text_array(v_data -> 'model_names'), '{}'::text[]));
        get diagnostics v_rows = row_count;
      elsif v_op = 'update' then
        update public.henchman_groups set
          name = coalesce(v_data ->> 'name', name),
          size = coalesce((v_data ->> 'size')::int, size),
          stats = coalesce(v_data -> 'stats', stats),
          xp = coalesce((v_data ->> 'xp')::int, xp),
          level_ups = coalesce((v_data ->> 'level_ups')::int, level_ups),
          stat_increases = coalesce(v_data -> 'stat_increases', stat_increases),
          is_large = coalesce((v_data ->> 'is_large')::boolean, is_large),
          notes = coalesce(v_data ->> 'notes', notes),
          sort_order = coalesce((v_data ->> 'sort_order')::int, sort_order),
          model_names = coalesce(public.jsonb_text_array(v_data -> 'model_names'), model_names)
        where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      elsif v_op = 'delete' then
        delete from public.henchman_groups where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      end if;

    elsif v_table = 'items' then
      if v_op = 'insert' then
        insert into public.items (id, warband_id, holder_type, holder_id, item_rules_id, custom_name, quantity, notes)
        values (coalesce(v_id, gen_random_uuid()), p_warband_id, coalesce((v_data ->> 'holder_type')::public.item_holder, 'stash'), (v_data ->> 'holder_id')::uuid,
                v_data ->> 'item_rules_id', v_data ->> 'custom_name', coalesce((v_data ->> 'quantity')::int, 1),
                coalesce(v_data ->> 'notes', ''));
        get diagnostics v_rows = row_count;
      elsif v_op = 'update' then
        update public.items set
          holder_type = coalesce((v_data ->> 'holder_type')::public.item_holder, holder_type),
          holder_id = case when v_data ? 'holder_type' then (v_data ->> 'holder_id')::uuid else holder_id end,
          item_rules_id = case when v_data ? 'item_rules_id' then v_data ->> 'item_rules_id' else item_rules_id end,
          custom_name = case when v_data ? 'custom_name' then v_data ->> 'custom_name' else custom_name end,
          quantity = coalesce((v_data ->> 'quantity')::int, quantity),
          notes = coalesce(v_data ->> 'notes', notes)
        where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      elsif v_op = 'delete' then
        delete from public.items where id = v_id and warband_id = p_warband_id;
        get diagnostics v_rows = row_count;
      end if;

    else
      raise exception 'unknown table %', v_table using errcode = '22023';
    end if;

    if v_rows = 0 then
      raise exception '% % on % matched no row of this warband', v_op, v_table, coalesce(v_id::text, '(new)') using errcode = 'P0002';
    end if;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Per-campaign aliases: what other members call this player inside one campaign.
-- ---------------------------------------------------------------------------------------------

create table public.campaign_aliases (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 40),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

comment on table public.campaign_aliases is 'A member''s display name inside one campaign; falls back to profiles.display_name when absent. Set by the member or the GM through set_campaign_alias().';

alter table public.campaign_aliases enable row level security;

create policy campaign_aliases_select on public.campaign_aliases
  for select to authenticated using (public.can_read_campaign(campaign_id));

-- Writes only through the function below.
create or replace function public.set_campaign_alias(p_campaign_id uuid, p_user_id uuid, p_alias text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_alias text := left(trim(coalesce(p_alias, '')), 40);
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if not (public.is_campaign_gm(p_campaign_id) or (v_uid = p_user_id and public.is_campaign_member(p_campaign_id))) then
    raise exception 'only the member or the GM can set an alias' using errcode = '42501';
  end if;
  if not exists (select 1 from public.campaign_members m where m.campaign_id = p_campaign_id and m.user_id = p_user_id)
     and not exists (select 1 from public.campaigns c where c.id = p_campaign_id and c.gm_id = p_user_id) then
    raise exception 'that player is not in this campaign' using errcode = '22023';
  end if;
  if v_alias = '' then
    delete from public.campaign_aliases where campaign_id = p_campaign_id and user_id = p_user_id;
  else
    insert into public.campaign_aliases (campaign_id, user_id, alias)
    values (p_campaign_id, p_user_id, v_alias)
    on conflict (campaign_id, user_id) do update set alias = excluded.alias, updated_at = now();
  end if;
end;
$$;

revoke all on function public.set_campaign_alias(uuid, uuid, text) from public;
grant execute on function public.set_campaign_alias(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Warband templates: a roster's shape (type, units, kit) saved for reuse. Private to the owner
-- for now; campaign_id is reserved so a template can later be shared with a campaign.
-- ---------------------------------------------------------------------------------------------

create table public.warband_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  type_rules_id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  campaign_id uuid references public.campaigns (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.warband_templates is 'Saved warband shapes for starting new rosters. campaign_id null = private; set = shared with that campaign (not yet exposed in the app).';

create index warband_templates_owner_idx on public.warband_templates (owner_id, created_at desc);

alter table public.warband_templates enable row level security;

create policy warband_templates_select on public.warband_templates
  for select to authenticated
  using (owner_id = (select auth.uid()) or (campaign_id is not null and public.can_read_campaign(campaign_id)));

create policy warband_templates_insert_own on public.warband_templates
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy warband_templates_update_own on public.warband_templates
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy warband_templates_delete_own on public.warband_templates
  for delete to authenticated using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Imported battle records carry shards, gold and the veteran pool roll when the file has them.
-- ---------------------------------------------------------------------------------------------

create or replace function public.import_battle_records(p_campaign_id uuid, p_matches jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_match jsonb;
  v_part jsonb;
  v_match_id uuid;
  v_played timestamptz;
  v_scenario text;
  v_scenario_name text;
  v_notes text;
  v_wb uuid;
  v_result text;
  v_won boolean;
  v_xp int;
  v_dead int;
  v_shards int;
  v_gold int;
  v_pool int;
  v_seen uuid[];
  v_count int := 0;
  v_index int := 0;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if not public.is_campaign_gm(p_campaign_id) then
    raise exception 'only the GM can import battle records' using errcode = '42501';
  end if;
  if p_matches is null or jsonb_typeof(p_matches) <> 'array' then
    raise exception 'matches must be an array' using errcode = '22023';
  end if;

  perform set_config('stirheim.audit_reason', 'import', true);

  for v_match in select * from jsonb_array_elements(p_matches) loop
    v_index := v_index + 1;
    if jsonb_typeof(v_match) <> 'object' then
      raise exception 'match % must be an object', v_index using errcode = '22023';
    end if;
    if jsonb_typeof(v_match -> 'participants') <> 'array' or jsonb_array_length(v_match -> 'participants') = 0 then
      raise exception 'match % needs at least one participant', v_index using errcode = '22023';
    end if;

    begin
      v_played := (v_match ->> 'played_at')::timestamptz;
    exception when others then
      raise exception 'match % has an unreadable date (%)', v_index, v_match ->> 'played_at' using errcode = '22023';
    end;
    if v_played is null then
      raise exception 'match % has no date', v_index using errcode = '22023';
    end if;

    v_scenario := nullif(trim(coalesce(v_match ->> 'scenario_rules_id', '')), '');
    v_scenario_name := nullif(trim(coalesce(v_match ->> 'scenario_name', '')), '');
    v_notes := coalesce(v_match ->> 'notes', '');
    if v_scenario is null and v_scenario_name is not null then
      v_notes := 'Scenario: ' || v_scenario_name || case when v_notes <> '' then E'\n' || v_notes else '' end;
    end if;

    -- Check every participant before writing anything for this match.
    v_seen := '{}';
    for v_part in select * from jsonb_array_elements(v_match -> 'participants') loop
      begin
        v_wb := (v_part ->> 'warband_id')::uuid;
      exception when others then
        raise exception 'match %: participant warband id is not a uuid', v_index using errcode = '22023';
      end;
      if v_wb is null then
        raise exception 'match %: participant without a warband', v_index using errcode = '22023';
      end if;
      if v_wb = any (v_seen) then
        raise exception 'match %: the same warband is listed twice', v_index using errcode = '22023';
      end if;
      v_seen := v_seen || v_wb;
      if not exists (
        select 1 from public.campaign_members m
         where m.campaign_id = p_campaign_id and m.warband_id = v_wb and m.left_at is null
      ) then
        raise exception 'warband % is not an active member of this campaign', v_wb using errcode = '22023';
      end if;
      v_result := coalesce(nullif(v_part ->> 'result', ''), case when (v_part ->> 'won')::boolean then 'won' else 'lost' end);
      if v_result not in ('won', 'lost', 'draw') then
        raise exception 'match %: result must be won, lost or draw (got %)', v_index, v_result using errcode = '22023';
      end if;
    end loop;

    -- The reports insert policy needs a match that is being fought, so complete it afterwards.
    insert into public.matches (campaign_id, scenario_rules_id, state, created_by, created_via, scheduled_for, started_at, completed_at, notes)
    values (p_campaign_id, v_scenario, 'awaiting_reports', v_uid, 'import', v_played, v_played, v_played, v_notes)
    returning id into v_match_id;

    for v_part in select * from jsonb_array_elements(v_match -> 'participants') loop
      v_wb := (v_part ->> 'warband_id')::uuid;
      v_result := coalesce(nullif(v_part ->> 'result', ''), case when (v_part ->> 'won')::boolean then 'won' else 'lost' end);
      v_won := coalesce((v_part ->> 'won')::boolean, v_result = 'won');
      v_xp := nullif(trim(coalesce(v_part ->> 'xp_gained', '')), '')::int;
      v_dead := nullif(trim(coalesce(v_part ->> 'casualties', '')), '')::int;
      v_shards := nullif(trim(coalesce(v_part ->> 'shards', '')), '')::int;
      v_gold := nullif(trim(coalesce(v_part ->> 'gold', '')), '')::int;
      v_pool := nullif(trim(coalesce(v_part ->> 'veteran_pool', '')), '')::int;
      if v_pool is not null and (v_pool < 2 or v_pool > 12) then v_pool := null; end if;

      insert into public.match_participants (match_id, warband_id, invited_at, accepted_at)
      values (v_match_id, v_wb, v_played, v_played);

      insert into public.match_reports (match_id, warband_id, submitted_by, won, result, xp_log, ooa, exploration, veteran_pool_roll, notes, submitted_at)
      values (
        v_match_id, v_wb, v_uid, v_won, v_result,
        case when v_xp is not null then jsonb_build_array(jsonb_build_object(
          'subjectType', 'group', 'subjectId', 'import', 'subjectName', 'Warband total (imported)',
          'amount', v_xp, 'reasons', jsonb_build_array('Imported battle record'),
          'xpBefore', 0, 'xpAfter', greatest(v_xp, 0), 'advancesEarned', 0
        )) else '[]'::jsonb end,
        case when coalesce(v_dead, 0) > 0 then jsonb_build_array(jsonb_build_object(
          'subjectType', 'group', 'subjectId', 'import', 'subjectName', 'Casualties (imported)', 'count', v_dead
        )) else '[]'::jsonb end,
        -- A minimal but complete exploration record, so the records page reads shards and gold from it.
        case when v_shards is not null or v_gold is not null then jsonb_build_object(
          'diceAllowed', 0, 'diceReason', 'Imported battle record', 'rolls', '[]'::jsonb, 'total', 0,
          'shards', greatest(coalesce(v_shards, 0), 0), 'locationId', null, 'locationName', null, 'locationText', null,
          'subRoll', null, 'goldFound', greatest(coalesce(v_gold, 0), 0), 'itemsFound', '[]'::jsonb,
          'notes', jsonb_build_array('Imported battle record')
        ) else '{}'::jsonb end,
        v_pool,
        coalesce(v_part ->> 'notes', ''),
        v_played
      );
    end loop;

    update public.matches set state = 'completed', completed_at = v_played where id = v_match_id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
