-- Phase 12: the shared combat log. One event stream per match that any participant appends to;
-- every phone at the table sees it live and lays it over its own sheet (kills on the attacker's
-- side, Wounds lost and out-of-action on the target's side), so a result rolled on one phone
-- lands on both. Events are never deleted: a revert marks the row, with who and why, and the
-- sheets recompute. The per-player battle_sessions rows are untouched by events.

create table public.battle_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete restrict,
  actor_warband_id uuid references public.warbands (id) on delete set null,
  at timestamptz not null default now(),
  kind text not null check (kind in ('attack')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  summary text not null default '',
  reverted_at timestamptz,
  reverted_by uuid references auth.users (id) on delete set null,
  revert_note text
);
create index battle_events_match_idx on public.battle_events (match_id, at);
comment on table public.battle_events is 'Shared combat log for a match: attack results logged from the calculator, revertable. Sheets derive from battle_sessions plus these.';

alter table public.battle_events
  add constraint battle_events_actor_profile_fkey foreign key (actor_id) references public.profiles (user_id) on delete restrict;

alter table public.battle_events enable row level security;

create policy battle_events_select on public.battle_events
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));

-- A participant (or the GM) logs an event while the battle is in progress.
create policy battle_events_insert on public.battle_events
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and (public.is_match_participant(match_id) or public.is_campaign_gm(public.match_campaign(match_id)))
    and exists (select 1 from public.matches m where m.id = match_id and m.state = 'in_progress')
  );

alter publication supabase_realtime add table public.battle_events;

-- Revert: a participant or the GM marks an event reverted, once. Only the revert columns change.
create or replace function public.revert_battle_event(p_event_id uuid, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event public.battle_events%rowtype;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select * into v_event from public.battle_events where id = p_event_id;
  if v_event.id is null then
    raise exception 'event not found' using errcode = 'P0002';
  end if;
  if not public.is_match_participant(v_event.match_id) and not public.is_campaign_gm(public.match_campaign(v_event.match_id)) then
    raise exception 'only a participant or the GM can revert a log entry' using errcode = '42501';
  end if;
  if v_event.reverted_at is not null then
    raise exception 'this entry was already reverted' using errcode = 'P0001';
  end if;
  update public.battle_events set reverted_at = now(), reverted_by = v_uid, revert_note = nullif(trim(coalesce(p_note, '')), '') where id = p_event_id;
end;
$$;

revoke all on function public.revert_battle_event(uuid, text) from public;
grant execute on function public.revert_battle_event(uuid, text) to authenticated;
