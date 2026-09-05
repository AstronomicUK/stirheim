-- Phase 12: hand a warband to another player. Imported rosters are created by the GM and passed
-- on once their player has an account; a player may also hand their own warband over. Only the
-- current owner (or the GM of a campaign the warband is enrolled in) may do it; the owner-change
-- trigger lets it through only inside this function.

create or replace function public.warbands_prevent_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id <> old.owner_id and coalesce(current_setting('stirheim.allow_owner_change', true), '') <> 'on' then
    raise exception 'warband owner cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.transfer_warband(p_warband_id uuid, p_new_owner uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner uuid;
  v_allowed boolean;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select owner_id into v_owner from public.warbands where id = p_warband_id;
  if v_owner is null then
    raise exception 'warband not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.profiles where user_id = p_new_owner) then
    raise exception 'that player has no account yet' using errcode = 'P0002';
  end if;
  v_allowed := v_owner = v_uid or exists (
    select 1 from public.campaign_members cm join public.campaigns c on c.id = cm.campaign_id
     where cm.warband_id = p_warband_id and cm.left_at is null and c.gm_id = v_uid
  );
  if not v_allowed then
    raise exception 'only the owner, or the GM of a campaign this warband is in, can hand it over' using errcode = '42501';
  end if;
  if v_owner = p_new_owner then
    return;
  end if;
  perform set_config('stirheim.audit_reason', 'transfer_warband', true);
  perform set_config('stirheim.allow_owner_change', 'on', true);
  update public.warbands set owner_id = p_new_owner where id = p_warband_id;
end;
$$;

revoke all on function public.transfer_warband(uuid, uuid) from public;
grant execute on function public.transfer_warband(uuid, uuid) to authenticated;
