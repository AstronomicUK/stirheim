-- Stirheim - Campaign Ledger. Phase 3 migration 3 of 3: audit log.
--
-- Every insert, update and delete on player-visible state is recorded with the acting user,
-- the row before and after, and an optional reason the app sets for the transaction:
--
--   select set_config('stirheim.audit_reason', 'manual_edit', true);   -- local to the txn
--
-- The GM editing another player's warband is therefore visible to that player. The log is
-- append-only: no update or delete policy exists, and inserts happen only through the trigger
-- (SECURITY DEFINER) because the table grants nothing to clients.

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  table_name text not null,
  row_id uuid,
  warband_id uuid,
  campaign_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  reason text,
  before jsonb,
  after jsonb
);

comment on table public.audit_log is 'Append-only history of changes to warbands, warriors, items, campaigns and matches.';

create index audit_log_warband_idx on public.audit_log (warband_id, at desc) where warband_id is not null;
create index audit_log_campaign_idx on public.audit_log (campaign_id, at desc) where campaign_id is not null;
create index audit_log_actor_idx on public.audit_log (actor_id, at desc);

-- Also protect the owner column: transfers are not a feature yet, and a GM must not be able to
-- take a warband by editing it.
create or replace function public.warbands_prevent_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'warband owner cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger warbands_prevent_owner_change
  before update of owner_id on public.warbands
  for each row execute function public.warbands_prevent_owner_change();

create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
  v_warband uuid;
  v_campaign uuid;
begin
  if tg_table_name = 'warbands' then
    v_warband := (rec ->> 'id')::uuid;
  else
    v_warband := (rec ->> 'warband_id')::uuid;
  end if;

  if tg_table_name = 'campaigns' then
    v_campaign := (rec ->> 'id')::uuid;
  elsif rec ? 'campaign_id' then
    v_campaign := (rec ->> 'campaign_id')::uuid;
  elsif rec ? 'match_id' then
    select campaign_id into v_campaign from public.matches where id = (rec ->> 'match_id')::uuid;
  end if;

  insert into public.audit_log (actor_id, table_name, row_id, warband_id, campaign_id, action, reason, before, after)
  values (
    auth.uid(),
    tg_table_name,
    (rec ->> 'id')::uuid,
    v_warband,
    v_campaign,
    lower(tg_op),
    nullif(current_setting('stirheim.audit_reason', true), ''),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_warbands after insert or update or delete on public.warbands
  for each row execute function public.audit_row();
create trigger audit_heroes after insert or update or delete on public.heroes
  for each row execute function public.audit_row();
create trigger audit_henchman_groups after insert or update or delete on public.henchman_groups
  for each row execute function public.audit_row();
create trigger audit_items after insert or update or delete on public.items
  for each row execute function public.audit_row();
create trigger audit_campaigns after insert or update or delete on public.campaigns
  for each row execute function public.audit_row();
create trigger audit_campaign_members after insert or update or delete on public.campaign_members
  for each row execute function public.audit_row();
create trigger audit_matches after insert or update or delete on public.matches
  for each row execute function public.audit_row();
create trigger audit_match_reports after insert or delete on public.match_reports
  for each row execute function public.audit_row();
create trigger audit_pending_advances after insert or update or delete on public.pending_advances
  for each row execute function public.audit_row();

-- Reading: anyone who may read the warband or campaign the entry concerns.
alter table public.audit_log enable row level security;

create policy audit_log_select on public.audit_log
  for select to authenticated
  using (
    (warband_id is not null and public.can_read_warband(warband_id))
    or (campaign_id is not null and public.can_read_campaign(campaign_id))
    or actor_id = (select auth.uid())
  );

revoke insert, update, delete on public.audit_log from anon, authenticated;
