-- Stirheim - Campaign Ledger. Phase 3 migration 2 of 3: row level security.
--
-- In one sentence each (docs/FRAMEWORK.md section 4):
--   users read and write their own warbands; campaign members read every warband and match in
--   their campaigns; the GM can additionally update warbands and settings in their campaigns;
--   reports are insert-once by the owning member; scenarios are readable by all, writable by
--   owner. Joining a campaign goes through join_campaign(invite_code, warband_id) so nobody
--   needs to read a campaign row before they belong to it.
--
-- Helper predicates are SECURITY DEFINER so policies on campaign_members can consult
-- campaign_members without recursing through RLS. All are STABLE and pinned to an empty
-- search_path.

-- ---------------------------------------------------------------------------------------------
-- Predicates
-- ---------------------------------------------------------------------------------------------

create or replace function public.is_campaign_gm(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaigns c
     where c.id = p_campaign_id and c.gm_id = (select auth.uid())
  );
$$;

create or replace function public.is_campaign_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaign_members m
     where m.campaign_id = p_campaign_id
       and m.user_id = (select auth.uid())
       and m.left_at is null
  );
$$;

-- Member or GM: everyone who may see a campaign's shared state.
create or replace function public.can_read_campaign(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_campaign_gm(p_campaign_id) or public.is_campaign_member(p_campaign_id);
$$;

create or replace function public.owns_warband(p_warband_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.warbands w
     where w.id = p_warband_id and w.owner_id = (select auth.uid())
  );
$$;

-- Owner, or anyone sharing an active campaign with the warband, or the GM of that campaign.
create or replace function public.can_read_warband(p_warband_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.owns_warband(p_warband_id)
      or exists (
        select 1
          from public.campaign_members target
         where target.warband_id = p_warband_id
           and target.left_at is null
           and public.can_read_campaign(target.campaign_id)
      );
$$;

-- Owner, or the GM of the campaign the warband is currently enrolled in (edits are audited).
create or replace function public.can_edit_warband(p_warband_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.owns_warband(p_warband_id)
      or exists (
        select 1
          from public.campaign_members target
         where target.warband_id = p_warband_id
           and target.left_at is null
           and public.is_campaign_gm(target.campaign_id)
      );
$$;

create or replace function public.is_match_participant(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.match_participants mp
      join public.warbands w on w.id = mp.warband_id
     where mp.match_id = p_match_id and w.owner_id = (select auth.uid())
  );
$$;

create or replace function public.match_campaign(p_match_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select campaign_id from public.matches where id = p_match_id;
$$;

-- ---------------------------------------------------------------------------------------------
-- Enable RLS everywhere. Nothing is readable by anonymous users.
-- ---------------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.warbands enable row level security;
alter table public.heroes enable row level security;
alter table public.henchman_groups enable row level security;
alter table public.items enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.scenarios enable row level security;
alter table public.matches enable row level security;
alter table public.match_participants enable row level security;
alter table public.battle_sessions enable row level security;
alter table public.match_reports enable row level security;
alter table public.pending_advances enable row level security;
alter table public.trade_phase_state enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Profiles: any signed-in user can see display names; you edit only your own.
-- ---------------------------------------------------------------------------------------------

create policy profiles_select on public.profiles
  for select to authenticated using (true);

create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Warbands and warriors
-- ---------------------------------------------------------------------------------------------

-- owner_id is tested on the row itself, not through owns_warband(): a STABLE helper cannot see a
-- row inserted by the current statement, which would make `insert ... returning` fail its
-- SELECT policy check.
create policy warbands_select on public.warbands
  for select to authenticated using (owner_id = (select auth.uid()) or public.can_read_warband(id));

create policy warbands_insert_own on public.warbands
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy warbands_update on public.warbands
  for update to authenticated
  using (public.can_edit_warband(id))
  with check (public.can_edit_warband(id));

create policy warbands_delete_own on public.warbands
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy heroes_select on public.heroes
  for select to authenticated using (public.can_read_warband(warband_id));
create policy heroes_write on public.heroes
  for all to authenticated
  using (public.can_edit_warband(warband_id))
  with check (public.can_edit_warband(warband_id));

create policy henchman_groups_select on public.henchman_groups
  for select to authenticated using (public.can_read_warband(warband_id));
create policy henchman_groups_write on public.henchman_groups
  for all to authenticated
  using (public.can_edit_warband(warband_id))
  with check (public.can_edit_warband(warband_id));

create policy items_select on public.items
  for select to authenticated using (public.can_read_warband(warband_id));
create policy items_write on public.items
  for all to authenticated
  using (public.can_edit_warband(warband_id))
  with check (public.can_edit_warband(warband_id));

create policy pending_advances_select on public.pending_advances
  for select to authenticated using (public.can_read_warband(warband_id));
create policy pending_advances_write on public.pending_advances
  for all to authenticated
  using (public.can_edit_warband(warband_id))
  with check (public.can_edit_warband(warband_id));

create policy trade_phase_state_select on public.trade_phase_state
  for select to authenticated using (public.can_read_warband(warband_id));
create policy trade_phase_state_write on public.trade_phase_state
  for all to authenticated
  using (public.can_edit_warband(warband_id))
  with check (public.can_edit_warband(warband_id));

-- ---------------------------------------------------------------------------------------------
-- Campaigns and membership
-- ---------------------------------------------------------------------------------------------

create policy campaigns_select on public.campaigns
  for select to authenticated using (gm_id = (select auth.uid()) or public.is_campaign_member(id));

create policy campaigns_insert_as_gm on public.campaigns
  for insert to authenticated with check (gm_id = (select auth.uid()));

create policy campaigns_update_gm on public.campaigns
  for update to authenticated
  using (gm_id = (select auth.uid()))
  with check (gm_id = (select auth.uid()));

create policy campaigns_delete_gm on public.campaigns
  for delete to authenticated using (gm_id = (select auth.uid()));

create policy campaign_members_select on public.campaign_members
  for select to authenticated using (public.can_read_campaign(campaign_id));

-- No insert policy: rows are created by join_campaign() below, which runs as definer.

-- Leaving: the member marks their own row; the GM may mark or remove anyone.
create policy campaign_members_update on public.campaign_members
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_campaign_gm(campaign_id))
  with check (user_id = (select auth.uid()) or public.is_campaign_gm(campaign_id));

create policy campaign_members_delete_gm on public.campaign_members
  for delete to authenticated using (public.is_campaign_gm(campaign_id));

-- What a prospective member sees before joining: the campaign's name and GM, nothing else.
create or replace function public.campaign_preview(p_invite_code text)
returns table (campaign_id uuid, name text, gm_display_name text, member_count bigint, archived boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id,
         c.name,
         p.display_name,
         (select count(*) from public.campaign_members m where m.campaign_id = c.id and m.left_at is null),
         c.archived
    from public.campaigns c
    join public.profiles p on p.user_id = c.gm_id
   where lower(replace(c.invite_code, '-', '')) = lower(replace(trim(p_invite_code), '-', ''))
     and (select auth.uid()) is not null;
$$;

-- Enrol one of your own warbands in a campaign using its invite code.
create or replace function public.join_campaign(p_invite_code text, p_warband_id uuid)
returns public.campaign_members
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_campaign public.campaigns;
  v_member public.campaign_members;
  v_max int;
  v_count int;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into v_campaign
    from public.campaigns c
   where lower(replace(c.invite_code, '-', '')) = lower(replace(trim(p_invite_code), '-', ''));
  if v_campaign.id is null then
    raise exception 'No campaign has the invite code %', p_invite_code using errcode = 'P0002';
  end if;
  if v_campaign.archived then
    raise exception 'That campaign is archived' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.warbands w
     where w.id = p_warband_id and w.owner_id = (select auth.uid()) and not w.archived
  ) then
    raise exception 'You can only enrol a warband you own' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.campaign_members m where m.warband_id = p_warband_id and m.left_at is null
  ) then
    raise exception 'That warband is already in a campaign' using errcode = '23505';
  end if;

  v_max := nullif(v_campaign.settings ->> 'maxRosters', '')::int;
  if v_max is not null then
    select count(*) into v_count
      from public.campaign_members m
     where m.campaign_id = v_campaign.id and m.left_at is null;
    if v_count >= v_max then
      raise exception 'That campaign is full (% warbands)', v_max using errcode = 'P0001';
    end if;
  end if;

  -- Re-joining with the same warband reopens the old row rather than duplicating it.
  insert into public.campaign_members (campaign_id, warband_id, user_id)
  values (v_campaign.id, p_warband_id, (select auth.uid()))
  on conflict (campaign_id, warband_id) do update set left_at = null, joined_at = now()
  returning * into v_member;

  return v_member;
end;
$$;

revoke all on function public.campaign_preview(text) from public;
revoke all on function public.join_campaign(text, uuid) from public;
grant execute on function public.campaign_preview(text) to authenticated;
grant execute on function public.join_campaign(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Scenarios: readable by every signed-in user, written by their owner.
-- ---------------------------------------------------------------------------------------------

create policy scenarios_select on public.scenarios
  for select to authenticated using (true);

create policy scenarios_insert_own on public.scenarios
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy scenarios_update_own on public.scenarios
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy scenarios_delete_own on public.scenarios
  for delete to authenticated using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Matches. State transitions become server-owned (edge functions) in Phase 6/7; these policies
-- bound who may touch a row at all.
-- ---------------------------------------------------------------------------------------------

create policy matches_select on public.matches
  for select to authenticated using (public.can_read_campaign(campaign_id));

-- GM schedules; any member may issue a challenge in their own name.
create policy matches_insert on public.matches
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (created_via = 'gm' and public.is_campaign_gm(campaign_id))
      or (created_via = 'challenge' and public.is_campaign_member(campaign_id))
    )
  );

create policy matches_update on public.matches
  for update to authenticated
  using (public.is_campaign_gm(campaign_id) or public.is_match_participant(id))
  with check (public.is_campaign_gm(campaign_id) or public.is_match_participant(id));

create policy matches_delete_gm on public.matches
  for delete to authenticated using (public.is_campaign_gm(campaign_id));

create policy match_participants_select on public.match_participants
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));

-- The GM or the match creator adds participants; only warbands enrolled in the campaign qualify.
create policy match_participants_insert on public.match_participants
  for insert to authenticated
  with check (
    exists (
      select 1 from public.matches mt
       where mt.id = match_id
         and (mt.created_by = (select auth.uid()) or public.is_campaign_gm(mt.campaign_id))
         and exists (
           select 1 from public.campaign_members cm
            where cm.campaign_id = mt.campaign_id and cm.warband_id = match_participants.warband_id and cm.left_at is null
         )
    )
  );

-- Accepting a challenge: the warband's owner; the GM may also amend.
create policy match_participants_update on public.match_participants
  for update to authenticated
  using (public.owns_warband(warband_id) or public.is_campaign_gm(public.match_campaign(match_id)))
  with check (public.owns_warband(warband_id) or public.is_campaign_gm(public.match_campaign(match_id)));

create policy match_participants_delete on public.match_participants
  for delete to authenticated
  using (
    public.is_campaign_gm(public.match_campaign(match_id))
    or exists (select 1 from public.matches mt where mt.id = match_id and mt.created_by = (select auth.uid()))
  );

create policy battle_sessions_select on public.battle_sessions
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));

create policy battle_sessions_write on public.battle_sessions
  for all to authenticated
  using (public.can_edit_warband(warband_id))
  with check (
    public.can_edit_warband(warband_id)
    and exists (select 1 from public.match_participants mp where mp.match_id = battle_sessions.match_id and mp.warband_id = battle_sessions.warband_id)
  );

create policy match_reports_select on public.match_reports
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));

-- Insert once, by the warband's owner (or GM on their behalf), for a match they are in.
create policy match_reports_insert on public.match_reports
  for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and public.can_edit_warband(warband_id)
    and exists (
      select 1 from public.match_participants mp
       join public.matches mt on mt.id = mp.match_id
      where mp.match_id = match_reports.match_id
        and mp.warband_id = match_reports.warband_id
        and mt.state in ('in_progress', 'awaiting_reports')
    )
  );

-- No update policy: reports are immutable. The GM may delete one so a player can resubmit.
create policy match_reports_delete_gm on public.match_reports
  for delete to authenticated using (public.is_campaign_gm(public.match_campaign(match_id)));
