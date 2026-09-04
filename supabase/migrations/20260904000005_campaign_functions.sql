-- Stirheim - Campaign Ledger. Phase 5: campaign helpers.

-- Let PostgREST embed display names: campaign_members.user_id -> profiles.user_id. A profile
-- row always exists (created by the sign-up trigger), so the constraint is safe.
alter table public.campaign_members
  add constraint campaign_members_user_profile_fkey
  foreign key (user_id) references public.profiles (user_id) on delete cascade;

alter table public.campaigns
  add constraint campaigns_gm_profile_fkey
  foreign key (gm_id) references public.profiles (user_id) on delete restrict;

-- The GM can issue a fresh invite code (for example after sharing the old one too widely).
create or replace function public.regenerate_invite_code(p_campaign_id uuid)
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_code text;
  v_tries int := 0;
begin
  if not public.is_campaign_gm(p_campaign_id) then
    raise exception 'only the GM can change the invite code' using errcode = '42501';
  end if;
  loop
    v_code := public.generate_invite_code();
    exit when not exists (select 1 from public.campaigns c where c.invite_code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 20 then
      raise exception 'could not generate a unique invite code';
    end if;
  end loop;
  update public.campaigns set invite_code = v_code where id = p_campaign_id;
  return v_code;
end;
$$;

-- A member takes their warband out of a campaign (history kept via left_at); the GM may remove any.
create or replace function public.leave_campaign(p_campaign_id uuid, p_warband_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_rows int;
begin
  perform set_config('stirheim.audit_reason', 'leave_campaign', true);
  update public.campaign_members
     set left_at = now()
   where campaign_id = p_campaign_id and warband_id = p_warband_id and left_at is null;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'that warband is not an active member of this campaign' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.regenerate_invite_code(uuid) from public;
revoke all on function public.leave_campaign(uuid, uuid) from public;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
grant execute on function public.leave_campaign(uuid, uuid) to authenticated;
