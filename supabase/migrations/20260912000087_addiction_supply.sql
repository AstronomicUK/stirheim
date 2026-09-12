-- #139/#140: Crimson Shade addiction supply (core rulebook 02:1983 — "you must try to buy him a new
-- batch of Crimson Shade before every battle from now on. If you fail to buy any, he will leave").
--
-- Before every battle each addicted hero needs one physical dose. Doses are allocated deterministically
-- in roster order — his own kit first, then the warband stash while it lasts — so a stash of one can
-- never supply two addicts, and preview and start agree. At battle start the allocated dose is used up
-- (quantity - 1 on that row) and recorded in a per-match, per-hero ledger; a hero with no dose leaves.
-- The ledger is what lets the battle sheet still offer "Took Crimson Shade" after the last copy hit 0,
-- and what tells the post-battle report not to use a second dose for the same hero. It is never
-- overwritten by later battles, so an earlier report can still be refiled or withdrawn correctly.
-- Cancelling a match does not refund a dose (the habit consumed it); the audit log names the match
-- and a GM roster edit is the correction path.

create table public.addiction_supplies (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  hero_id uuid not null references public.heroes(id) on delete cascade,
  warband_id uuid not null references public.warbands(id) on delete cascade,
  item_rules_id text not null,
  source text not null check (source in ('kit', 'stash')),
  /** The stock row the dose came from; null once that row is deleted. */
  item_row_id uuid references public.items(id) on delete set null,
  quantity_before integer not null check (quantity_before >= 1),
  created_at timestamptz not null default now(),
  unique (match_id, hero_id, item_rules_id)
);
comment on table public.addiction_supplies is 'One row per addicted hero per battle: the dose his habit used up at battle start, where it came from and how many were in that row beforehand. Written only by start_match.';

alter table public.addiction_supplies enable row level security;
create policy addiction_supplies_select on public.addiction_supplies
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));
grant select on public.addiction_supplies to authenticated;

-- The allocation, read-only: every addicted hero in the match, supplied (kit or stash) or not.
-- Mirrors src/rules/resolve/addiction.ts (allocateAddictionBatches): heroes in roster order
-- (sort_order, created_at, id); own kit row first; then stash rows by created_at, id, counting what
-- earlier heroes already took from each row.
create or replace function public.addiction_supply(p_match_id uuid)
returns table(hero_id uuid, hero_name text, warband_id uuid, warband_name text, item_rules_id text, source text, item_row_id uuid, quantity_before integer)
language plpgsql stable security definer set search_path = '' as $$
declare
  h record;
  v_item text;
  v_row record;
  v_used jsonb := '{}'::jsonb;
  v_prev integer;
begin
  if auth.uid() is null or not (public.is_match_participant(p_match_id) or public.is_campaign_gm(public.match_campaign(p_match_id))) then
    raise exception 'only a participant or the GM can check addiction supply' using errcode = '42501';
  end if;
  for h in
    select he.id, he.name, he.warband_id as wid, w.name as wname, he.flags
      from public.heroes he
      join public.match_participants mp on mp.warband_id = he.warband_id and mp.match_id = p_match_id
      join public.warbands w on w.id = he.warband_id
     where he.status = 'active' and not he.is_hired_sword
       and jsonb_typeof(he.flags -> 'addictedTo') = 'array' and jsonb_array_length(he.flags -> 'addictedTo') > 0
     order by he.warband_id, he.sort_order, he.created_at, he.id
  loop
    for v_item in select jsonb_array_elements_text(h.flags -> 'addictedTo') loop
      hero_id := h.id; hero_name := h.name; warband_id := h.wid; warband_name := h.wname; item_rules_id := v_item;
      source := null; item_row_id := null; quantity_before := null;
      -- His own kit first.
      select i.id, i.quantity into v_row from public.items i
        where i.holder_type = 'hero' and i.holder_id = h.id and i.item_rules_id = v_item and i.quantity > 0
        order by i.created_at, i.id limit 1;
      if found then
        source := 'kit'; item_row_id := v_row.id; quantity_before := v_row.quantity;
        return next;
        continue;
      end if;
      -- Then the stash, one dose per hero, remembering what earlier heroes took from each row.
      for v_row in
        select i.id, i.quantity from public.items i
         where i.holder_type = 'stash' and i.warband_id = h.wid and i.item_rules_id = v_item and i.quantity > 0
         order by i.created_at, i.id
      loop
        v_prev := coalesce((v_used ->> v_row.id::text)::integer, 0);
        if v_row.quantity - v_prev > 0 then
          v_used := v_used || jsonb_build_object(v_row.id::text, v_prev + 1);
          source := 'stash'; item_row_id := v_row.id; quantity_before := v_row.quantity - v_prev;
          exit;
        end if;
      end loop;
      return next;
    end loop;
  end loop;
end;
$$;
revoke all on function public.addiction_supply(uuid) from public;
grant execute on function public.addiction_supply(uuid) to authenticated;

-- start_match now also takes the acknowledged set of unsupplied addicts, exactly as it takes the
-- unpaid hires: the client must name precisely the heroes who will leave.
drop function public.start_match(uuid, public.combat_mode, uuid[]);

create function public.start_match(p_match_id uuid, p_combat_mode public.combat_mode default null, p_unpaid_ids uuid[] default null, p_unsupplied_ids uuid[] default null)
returns public.match_state
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_pending int;
  v_settings jsonb;
  v_default public.combat_mode;
  v_locked boolean;
  v_mode public.combat_mode;
  v_gm boolean;
  v_unpaid uuid[];
  v_ack uuid[];
  v_unsupplied uuid[];
  v_ack_supply uuid[];
  a record;
begin
  select state into v_state from public.matches where id = p_match_id for update;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state <> 'scheduled' then
    raise exception 'this match is already %', v_state using errcode = 'P0001';
  end if;
  v_gm := public.is_campaign_gm(public.match_campaign(p_match_id));
  if not public.is_match_participant(p_match_id) and not v_gm then
    raise exception 'only a participant or the GM can start the battle' using errcode = '42501';
  end if;
  select count(*) into v_pending from public.match_participants where match_id = p_match_id and accepted_at is null;
  if v_pending > 0 then
    raise exception '% warband(s) have not accepted yet', v_pending using errcode = 'P0001';
  end if;
  if (select count(*) from public.match_participants where match_id = p_match_id) < 2 then
    raise exception 'a battle needs at least two warbands' using errcode = 'P0001';
  end if;

  select settings into v_settings from public.campaigns where id = public.match_campaign(p_match_id);
  v_default := coalesce(v_settings ->> 'combatMode', 'app')::public.combat_mode;
  v_locked := coalesce((v_settings ->> 'lockCombatMode')::boolean, false);
  v_mode := coalesce(p_combat_mode, v_default);
  if v_mode <> v_default and v_locked and not v_gm then
    raise exception 'the GM has fixed how combat is scored in this campaign' using errcode = '42501';
  end if;

  -- Share roster locks with payment/trading, in deterministic order; items too, since doses are used up here.
  perform w.id from public.warbands w join public.match_participants mp on mp.warband_id = w.id
    where mp.match_id = p_match_id order by w.id for update of w;
  perform h.id from public.heroes h join public.match_participants mp on mp.warband_id = h.warband_id
    where mp.match_id = p_match_id order by h.id for update of h;
  perform i.id from public.items i join public.match_participants mp on mp.warband_id = i.warband_id
    where mp.match_id = p_match_id order by i.id for update of i;

  -- Unpaid upkeep (#219): the client must acknowledge precisely the currently unpaid set.
  select coalesce(array_agg(u.id order by u.id), '{}'::uuid[]) into v_unpaid from public.unpaid_match_hires(p_match_id) u;
  select coalesce(array_agg(distinct x order by x), '{}'::uuid[]) into v_ack from unnest(p_unpaid_ids) x;
  if cardinality(v_unpaid) > 0 and v_unpaid <> v_ack then
    raise exception 'Upkeep has changed. Review unpaid hired characters before starting this battle.' using errcode = 'P0001';
  end if;

  -- Addiction supply (#139/#140): same shape — acknowledge precisely who has no dose and will leave.
  select coalesce(array_agg(s.hero_id order by s.hero_id), '{}'::uuid[]) into v_unsupplied from public.addiction_supply(p_match_id) s where s.source is null;
  select coalesce(array_agg(distinct x order by x), '{}'::uuid[]) into v_ack_supply from unnest(p_unsupplied_ids) x;
  -- Exact match both ways: naming a hero who is supplied after all is as stale as missing one who is not.
  if v_unsupplied <> v_ack_supply then
    raise exception 'Supply has changed. Review addicted heroes before starting this battle.' using errcode = 'P0001';
  end if;

  -- The habit uses up one dose per supplied hero, recorded in the ledger before the stock changes.
  for a in select * from public.addiction_supply(p_match_id) where source is not null loop
    perform set_config('stirheim.audit_reason', 'Addiction: one batch of ' || a.item_rules_id || ' used up before battle ' || p_match_id::text, true);
    insert into public.addiction_supplies (match_id, hero_id, warband_id, item_rules_id, source, item_row_id, quantity_before)
      values (p_match_id, a.hero_id, a.warband_id, a.item_rules_id, a.source, a.item_row_id, a.quantity_before);
    -- items.quantity must stay > 0: the last copy's row goes, as apply_battle_report does (the ledger
    -- keeps source and quantity_before; its item_row_id is set null by the foreign key).
    if a.quantity_before <= 1 then
      delete from public.items where id = a.item_row_id;
    else
      update public.items set quantity = quantity - 1 where id = a.item_row_id;
    end if;
  end loop;
  if cardinality(v_unsupplied) > 0 then
    perform set_config('stirheim.audit_reason', 'Addiction unsupplied: left before starting battle ' || p_match_id::text, true);
    update public.heroes set status = 'left' where id = any(v_unsupplied);
  end if;

  perform set_config('stirheim.audit_reason', 'Unpaid upkeep: dismissed before starting battle ' || p_match_id::text, true);
  update public.heroes set status = 'left', flags = flags - 'upkeepOwedAfter' - 'contractCheckOwed'
    where id = any(v_unpaid);
  -- Carried forward from 049/050: Trapmaster traps and Fanatic doses are prepared here too.
  perform public.prepare_trap_supplies(p_match_id);
  perform public.prepare_fanatic_supplies(p_match_id);
  perform set_config('stirheim.audit_reason', 'start_match', true);
  update public.matches set state = 'in_progress', started_at = now(), combat_mode = v_mode where id = p_match_id;
  return 'in_progress';
end;
$$;

revoke all on function public.start_match(uuid, public.combat_mode, uuid[], uuid[]) from public;
grant execute on function public.start_match(uuid, public.combat_mode, uuid[], uuid[]) to authenticated;
