-- Phase 20: the map's tolls, paid from a treasury and recorded on the match.
--
-- The gate toll (5 gc, a warband without a foothold at the gate it enters through) goes nowhere;
-- the Middle Bridge toll (2D6 gc, another warband had to cross the bridge to reach the battle) goes
-- to the bridge's controller. pay_map_toll moves the gold in one transaction and keeps a row so the
-- match page shows what was paid, by whom and when. The owner of the paying warband or the GM may
-- pay; the amount is what the table agreed (the app suggests it).

create table public.map_tolls (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  warband_id uuid not null references public.warbands (id) on delete cascade,
  kind text not null check (kind in ('gate', 'bridge')),
  amount integer not null check (amount >= 0),
  to_warband_id uuid references public.warbands (id) on delete set null,
  note text not null default '',
  actor_id uuid not null references auth.users (id) on delete restrict,
  paid_at timestamptz not null default now()
);
create index map_tolls_match_idx on public.map_tolls (match_id, paid_at);
comment on table public.map_tolls is 'Map campaigns: gate and Middle Bridge tolls paid for a battle, with the gold moved by pay_map_toll.';

alter table public.map_tolls
  add constraint map_tolls_actor_profile_fkey foreign key (actor_id) references public.profiles (user_id) on delete restrict;

alter table public.map_tolls enable row level security;

create policy map_tolls_select on public.map_tolls
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));

create or replace function public.pay_map_toll(
  p_match_id uuid,
  p_warband_id uuid,
  p_kind text,
  p_amount integer,
  p_to_warband_id uuid default null,
  p_note text default ''
)
returns public.map_tolls
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_campaign uuid;
  v_gold integer;
  v_row public.map_tolls;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_kind not in ('gate', 'bridge') then
    raise exception 'unknown toll kind %', p_kind using errcode = '22023';
  end if;
  if p_amount is null or p_amount < 0 then
    raise exception 'the toll must be zero or more' using errcode = '22023';
  end if;
  select campaign_id into v_campaign from public.matches where id = p_match_id;
  if v_campaign is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.match_participants mp where mp.match_id = p_match_id and mp.warband_id = p_warband_id) then
    raise exception 'that warband is not in this battle' using errcode = '22023';
  end if;
  if not public.owns_warband(p_warband_id) and not public.is_campaign_gm(v_campaign) then
    raise exception 'only the warband owner or the GM can pay its tolls' using errcode = '42501';
  end if;
  if p_to_warband_id is not null and not exists (
    select 1 from public.campaign_members m where m.campaign_id = v_campaign and m.warband_id = p_to_warband_id and m.left_at is null
  ) then
    raise exception 'the toll must go to a warband in this campaign' using errcode = '22023';
  end if;
  if exists (select 1 from public.map_tolls t where t.match_id = p_match_id and t.warband_id = p_warband_id and t.kind = p_kind) then
    raise exception 'that toll has already been paid for this battle' using errcode = '23505';
  end if;

  select gold into v_gold from public.warbands where id = p_warband_id for update;
  if v_gold < p_amount then
    raise exception 'the warband has % gc, not enough for a toll of % gc', v_gold, p_amount using errcode = 'P0001';
  end if;

  perform set_config('stirheim.audit_reason', 'toll', true);
  update public.warbands set gold = gold - p_amount where id = p_warband_id;
  if p_to_warband_id is not null and p_amount > 0 then
    update public.warbands set gold = gold + p_amount where id = p_to_warband_id;
  end if;
  insert into public.map_tolls (match_id, warband_id, kind, amount, to_warband_id, note, actor_id)
  values (p_match_id, p_warband_id, p_kind, p_amount, p_to_warband_id, coalesce(p_note, ''), v_uid)
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.pay_map_toll(uuid, uuid, text, integer, uuid, text) from public;
grant execute on function public.pay_map_toll(uuid, uuid, text, integer, uuid, text) to authenticated;
