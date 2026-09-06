-- Phase 23: agreeing where the battle is fought.
--
-- A map campaign's battle has to happen somewhere, and the two sides do not always want the same
-- somewhere. Scheduling may now leave the district open ("let the players decide"), after which
-- each side puts one forward on its own screen. A side may propose, agree to what the other side
-- proposed, or call for a roll-off. When everyone has landed on the same district it is settled;
-- when everyone has called a roll-off it is settled by one, decided here so that both screens see
-- the same answer.
--
-- 1. matches.district_decided_by: how the district was arrived at, for the record.
-- 2. match_district_proposals: one row per warband, its current position.
-- 3. propose / agree / roll_off, each of which tries to settle the match afterwards.

alter table public.matches add column district_decided_by text
  check (district_decided_by in ('scheduled', 'agreed', 'roll_off'));
comment on column public.matches.district_decided_by is
  'How the district was arrived at: set when the match was scheduled, agreed between the players, or settled by a roll-off. Null while it is still open.';

-- Districts named on matches that already exist were chosen when they were scheduled.
update public.matches set district_decided_by = 'scheduled' where district_id is not null;

-- ---------------------------------------------------------------------------------------------
-- Proposals
-- ---------------------------------------------------------------------------------------------

create table public.match_district_proposals (
  match_id uuid not null references public.matches (id) on delete cascade,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  -- What this side has settled on: its own suggestion while proposing or calling a roll-off, or
  -- the other side's suggestion once it has agreed.
  district_id text not null,
  stance text not null default 'proposed' check (stance in ('proposed', 'agreed', 'roll_off')),
  updated_at timestamptz not null default now(),
  primary key (match_id, warband_id)
);
comment on table public.match_district_proposals is
  'Map campaigns: where each side wants the battle fought, while the district is still open.';

create index match_district_proposals_match_idx on public.match_district_proposals (match_id);

alter table public.match_district_proposals enable row level security;

-- Everyone who can read the campaign can see the state of the negotiation; only the functions
-- below write, so there is no insert or update policy for clients.
create policy match_district_proposals_select on public.match_district_proposals
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));

-- ---------------------------------------------------------------------------------------------
-- Settling it
-- ---------------------------------------------------------------------------------------------

/**
 * Settle the district if the positions allow it. Everyone landing on the same district settles it
 * outright; everyone calling a roll-off settles it by picking one of the districts on the table.
 * Does nothing while a side has yet to speak or the positions still differ.
 *
 * Called from inside the three actions below, which have already taken a lock on the match row,
 * so the roll-off happens once however many clients are talking at the same time.
 */
create or replace function public.try_settle_match_district(p_match_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_participants int;
  v_spoken int;
  v_districts int;
  v_roll_offs int;
  v_pick text;
begin
  -- Already settled: a district chosen at scheduling, or an earlier call to this function.
  if exists (select 1 from public.matches m where m.id = p_match_id and m.district_id is not null) then
    return;
  end if;

  select count(*) into v_participants from public.match_participants mp where mp.match_id = p_match_id;
  select count(*), count(distinct p.district_id), count(*) filter (where p.stance = 'roll_off')
    into v_spoken, v_districts, v_roll_offs
    from public.match_district_proposals p
   where p.match_id = p_match_id;

  if v_participants = 0 or v_spoken < v_participants then
    return;
  end if;

  if v_districts = 1 then
    select p.district_id into v_pick from public.match_district_proposals p where p.match_id = p_match_id limit 1;
    update public.matches set district_id = v_pick, district_decided_by = 'agreed' where id = p_match_id;
    return;
  end if;

  if v_roll_offs = v_participants then
    select p.district_id into v_pick
      from (select distinct district_id from public.match_district_proposals where match_id = p_match_id) p
     order by random()
     limit 1;
    update public.matches set district_id = v_pick, district_decided_by = 'roll_off' where id = p_match_id;
  end if;
end;
$$;

revoke all on function public.try_settle_match_district(uuid) from public;

/** Shared guard: the caller owns this warband, it is in this match, and the district is still open. */
create or replace function public.check_district_proposal(p_match_id uuid, p_warband_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_district text;
begin
  select m.state, m.district_id into v_state, v_district from public.matches m where m.id = p_match_id for update;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state in ('completed', 'cancelled') then
    raise exception 'this match is %, so its district cannot change', v_state using errcode = 'P0001';
  end if;
  if v_district is not null then
    raise exception 'this battle already has a district' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.match_participants mp
      join public.warbands w on w.id = mp.warband_id
     where mp.match_id = p_match_id and mp.warband_id = p_warband_id and w.owner_id = (select auth.uid())
  ) then
    raise exception 'only the warband''s own player may answer for it' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.check_district_proposal(uuid, uuid) from public;

/** Put a district forward for this warband, replacing whatever it said before. */
create or replace function public.propose_match_district(p_match_id uuid, p_warband_id uuid, p_district_id text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if coalesce(trim(p_district_id), '') = '' then
    raise exception 'name a district' using errcode = '22023';
  end if;
  perform public.check_district_proposal(p_match_id, p_warband_id);
  insert into public.match_district_proposals (match_id, warband_id, district_id, stance)
  values (p_match_id, p_warband_id, trim(p_district_id), 'proposed')
  on conflict (match_id, warband_id)
    do update set district_id = excluded.district_id, stance = 'proposed', updated_at = now();
  perform public.try_settle_match_district(p_match_id);
end;
$$;

revoke all on function public.propose_match_district(uuid, uuid, text) from public;
grant execute on function public.propose_match_district(uuid, uuid, text) to authenticated;

/** Take the district the other side proposed. Settles the match when everyone has landed on it. */
create or replace function public.agree_match_district(p_match_id uuid, p_warband_id uuid, p_district_id text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.check_district_proposal(p_match_id, p_warband_id);
  if not exists (
    select 1 from public.match_district_proposals p
     where p.match_id = p_match_id and p.warband_id <> p_warband_id and p.district_id = trim(p_district_id)
  ) then
    raise exception 'nobody has proposed that district' using errcode = '22023';
  end if;
  insert into public.match_district_proposals (match_id, warband_id, district_id, stance)
  values (p_match_id, p_warband_id, trim(p_district_id), 'agreed')
  on conflict (match_id, warband_id)
    do update set district_id = excluded.district_id, stance = 'agreed', updated_at = now();
  perform public.try_settle_match_district(p_match_id);
end;
$$;

revoke all on function public.agree_match_district(uuid, uuid, text) from public;
grant execute on function public.agree_match_district(uuid, uuid, text) to authenticated;

/**
 * Call for a roll-off, keeping this side's own district on the table. Once every side has called
 * one, the district is picked from those proposed and the match is settled.
 */
create or replace function public.roll_off_match_district(p_match_id uuid, p_warband_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.check_district_proposal(p_match_id, p_warband_id);
  if not exists (select 1 from public.match_district_proposals p where p.match_id = p_match_id and p.warband_id = p_warband_id) then
    raise exception 'propose a district before calling a roll-off' using errcode = '22023';
  end if;
  update public.match_district_proposals
     set stance = 'roll_off', updated_at = now()
   where match_id = p_match_id and warband_id = p_warband_id;
  perform public.try_settle_match_district(p_match_id);
end;
$$;

revoke all on function public.roll_off_match_district(uuid, uuid) from public;
grant execute on function public.roll_off_match_district(uuid, uuid) to authenticated;

/**
 * Clear the negotiation. Definer because clients have no write policy on the proposals — every
 * change to them goes through one of the functions here — and the caller's own authorisation is
 * checked by set_match_district before it calls this.
 */
create or replace function public.clear_match_district_proposals(p_match_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.match_district_proposals where match_id = p_match_id;
$$;

revoke all on function public.clear_match_district_proposals(uuid) from public;

-- ---------------------------------------------------------------------------------------------
-- set_match_district also records how it was decided, so a district set by hand does not look
-- like one the players agreed.
-- ---------------------------------------------------------------------------------------------
create or replace function public.set_match_district(p_match_id uuid, p_district_id text)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_next text := nullif(trim(p_district_id), '');
begin
  select state into v_state from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state in ('completed', 'cancelled') then
    raise exception 'this match is %, so its district cannot change', v_state using errcode = 'P0001';
  end if;
  if not public.is_match_participant(p_match_id) and not public.is_campaign_gm(public.match_campaign(p_match_id)) then
    raise exception 'only a participant or the GM can move the battle' using errcode = '42501';
  end if;
  perform set_config('stirheim.audit_reason', 'set_district', true);
  update public.matches
     set district_id = v_next,
         district_decided_by = case when v_next is null then null else 'scheduled' end
   where id = p_match_id;
  -- Reopening the question clears whatever the players had said.
  if v_next is null then
    perform public.clear_match_district_proposals(p_match_id);
  end if;
end;
$$;

revoke all on function public.set_match_district(uuid, text) from public;
grant execute on function public.set_match_district(uuid, text) to authenticated;
