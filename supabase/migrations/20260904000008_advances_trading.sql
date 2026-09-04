-- Stirheim - Campaign Ledger. Phase 8: advancements and the trading post.
--
-- Three things, all SECURITY INVOKER so RLS still decides who may touch which warband:
--
--   1. update_roster is re-created so an `insert` on heroes, henchman_groups or items honours a
--      client-supplied `id`. A phone can then hire a hero and hand him his kit in ONE batch: the
--      hero insert carries `id: <uuid>` and the item inserts use that uuid as `holder_id`. The
--      items_check_holder trigger sees the hero because both happen in the same transaction, in
--      order. Everything else about the function is unchanged.
--   2. resolve_pending_advance applies the roster changes an advance produced (level_ups, a stat,
--      a skill, a promotion...) and closes the pending_advances row in the same transaction.
--   3. record_trade applies a trading-post batch and, when a match is given, keeps the
--      once-per-post-battle bookkeeping in trade_phase_state: one wyrdstone sale, one rare-item
--      search per hero. The "phase" is the warband's latest match report (chosen by the client);
--      a warband with no report yet trades without those limits.

-- ---------------------------------------------------------------------------------------------
-- update_roster(warband_id, reason, changes): apply a batch of row changes atomically.
--
-- changes = [{ table: 'warbands' | 'heroes' | 'henchman_groups' | 'items',
--              op: 'insert' | 'update' | 'delete', id?, data? }]
-- Only whitelisted columns are writable; owner/warband_id/timestamps never are. On `insert` the
-- change's `id` (a uuid) becomes the new row's id when present, otherwise one is generated.
-- Every row is checked to belong to warband_id, and RLS still decides whether the caller may
-- edit that warband. `reason` is written to audit_log.reason (e.g. 'manual_edit', 'trading',
-- 'recruitment', 'advancement', 'post_battle'). Returns the number of changes applied.
-- ---------------------------------------------------------------------------------------------

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
                                            is_large, notes, sort_order)
        values (coalesce(v_id, gen_random_uuid()), p_warband_id, v_data ->> 'name', v_data ->> 'unit_type_rules_id', coalesce((v_data ->> 'size')::int, 1),
                v_data -> 'stats', coalesce((v_data ->> 'xp')::int, 0), coalesce((v_data ->> 'level_ups')::int, 0),
                coalesce(v_data -> 'stat_increases', '{}'::jsonb), coalesce((v_data ->> 'is_large')::boolean, false),
                coalesce(v_data ->> 'notes', ''), coalesce((v_data ->> 'sort_order')::int, 0));
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
          sort_order = coalesce((v_data ->> 'sort_order')::int, sort_order)
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

comment on function public.update_roster(uuid, text, jsonb) is
  'Apply a labelled batch of whitelisted roster row changes atomically. Inserts honour a client-supplied uuid `id` so items can reference a warrior created in the same batch.';

-- ---------------------------------------------------------------------------------------------
-- resolve_pending_advance(advance_id, resolution, changes): take an advance.
--
-- The client rolls (or the player enters the roll), chooses the stat/skill/spell, runs the Phase
-- 2 resolvers and diffs the result into update_roster changes (src/domain/rosterDiff.ts). This
-- applies those changes with reason 'advancement' and closes the pending row in one transaction.
-- `resolution` is the narrative (what was rolled and chosen; shape owned by the client). A row
-- that is already resolved is refused. Returns the number of roster changes applied.
-- ---------------------------------------------------------------------------------------------

create or replace function public.resolve_pending_advance(p_advance_id uuid, p_resolution jsonb, p_changes jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_adv public.pending_advances%rowtype;
  v_count int;
  v_rows int;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_resolution is not null and jsonb_typeof(p_resolution) <> 'object' then
    raise exception 'resolution must be an object' using errcode = '22023';
  end if;

  -- RLS: an advance on a warband the caller cannot read does not exist for them. A fellow
  -- player can read it (shared campaign) but not resolve it; say so rather than "not found".
  select * into v_adv from public.pending_advances a where a.id = p_advance_id;
  if not found then
    raise exception 'pending advance % not found', p_advance_id using errcode = 'P0002';
  end if;
  if not public.can_edit_warband(v_adv.warband_id) then
    raise exception 'only the warband owner or the GM can resolve its advances' using errcode = '42501';
  end if;
  -- Lock the row so two phones cannot take the same advance twice.
  select * into v_adv from public.pending_advances a where a.id = p_advance_id for update;
  if v_adv.resolved_at is not null then
    raise exception 'this advance has already been resolved' using errcode = 'P0001';
  end if;

  v_count := public.update_roster(v_adv.warband_id, 'advancement', coalesce(p_changes, '[]'::jsonb));

  update public.pending_advances
     set resolved_at = now(),
         resolution = coalesce(p_resolution, '{}'::jsonb)
   where id = p_advance_id;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'only the warband owner or the GM can resolve its advances' using errcode = '42501';
  end if;

  -- Follow-up advances the resolution asks for (promotion: the new hero rolls on the hero table
  -- straight away, the rest of the group re-roll). [{subjectType, subjectId, thresholdXp}]
  if jsonb_typeof(p_resolution -> 'followUps') = 'array' then
    insert into public.pending_advances (warband_id, subject_type, subject_id, threshold_xp)
    select v_adv.warband_id,
           (f ->> 'subjectType')::public.advance_subject,
           (f ->> 'subjectId')::uuid,
           greatest(coalesce((f ->> 'thresholdXp')::int, v_adv.threshold_xp), 1)
      from jsonb_array_elements(p_resolution -> 'followUps') f;
  end if;

  return v_count;
end;
$$;

comment on function public.resolve_pending_advance(uuid, jsonb, jsonb) is
  'Apply the roster changes an advance produced (reason advancement) and close the pending_advances row in one transaction. Refuses an already-resolved advance.';

-- ---------------------------------------------------------------------------------------------
-- record_trade(warband_id, match_id, changes, wyrdstone_sold, heroes_searched): a trading-post visit.
--
-- Applies `changes` with reason 'trading'. When `match_id` is given (the warband's latest match
-- report, chosen by the client), the once-per-post-battle limits are enforced against
-- trade_phase_state (warband_id, match_id): a second wyrdstone sale, or a rare-item search by a
-- hero who has already searched, fails the whole call. With `match_id` null nothing is recorded
-- and no limit applies (a warband that has not fought yet). Returns the number of roster changes.
-- ---------------------------------------------------------------------------------------------

create or replace function public.record_trade(
  p_warband_id uuid,
  p_match_id uuid default null,
  p_changes jsonb default '[]'::jsonb,
  p_wyrdstone_sold boolean default false,
  p_heroes_searched uuid[] default '{}'::uuid[]
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

  v_count := public.update_roster(p_warband_id, 'trading', coalesce(p_changes, '[]'::jsonb));

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

comment on function public.record_trade(uuid, uuid, jsonb, boolean, uuid[]) is
  'Apply a trading-post batch (reason trading) and, when a match is given, enforce and record the once-per-phase limits in trade_phase_state: one wyrdstone sale, one rare-item search per hero.';

revoke all on function public.update_roster(uuid, text, jsonb) from public;
revoke all on function public.resolve_pending_advance(uuid, jsonb, jsonb) from public;
revoke all on function public.record_trade(uuid, uuid, jsonb, boolean, uuid[]) from public;
grant execute on function public.update_roster(uuid, text, jsonb) to authenticated;
grant execute on function public.resolve_pending_advance(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.record_trade(uuid, uuid, jsonb, boolean, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Veteran pool: recruitment spends the 2D6 pool down, so 0 and 1 are legitimate remainders
-- (null still means "no pool rolled").
-- ---------------------------------------------------------------------------------------------

alter table public.warbands drop constraint warbands_veteran_pool_check;
alter table public.warbands add constraint warbands_veteran_pool_check check (veteran_pool between 0 and 12);
