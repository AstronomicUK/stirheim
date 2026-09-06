-- Phase 18: move a warband to another campaign in one step.
--
-- move_warband_campaign(warband_id, invite_code): the owner takes the warband out of its current
-- campaign (history kept via left_at) and enrols it in the campaign the invite code names, with the
-- same checks as join_campaign (code, archived, roster cap). Battle records stay with the campaign
-- they were fought in. A warband in no campaign simply joins.

create or replace function public.move_warband_campaign(p_warband_id uuid, p_invite_code text)
returns public.campaign_members
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_campaign public.campaigns;
  v_current uuid;
  v_member public.campaign_members;
  v_max int;
  v_count int;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.warbands w
     where w.id = p_warband_id and w.owner_id = (select auth.uid()) and not w.archived
  ) then
    raise exception 'You can only move a warband you own' using errcode = '42501';
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

  select m.campaign_id into v_current from public.campaign_members m where m.warband_id = p_warband_id and m.left_at is null;
  if v_current = v_campaign.id then
    raise exception 'That warband is already in this campaign' using errcode = '23505';
  end if;

  v_max := nullif(v_campaign.settings ->> 'maxRosters', '')::int;
  if v_max is not null then
    select count(*) into v_count from public.campaign_members m where m.campaign_id = v_campaign.id and m.left_at is null;
    if v_count >= v_max then
      raise exception 'That campaign is full (% warbands)', v_max using errcode = 'P0001';
    end if;
  end if;

  perform set_config('stirheim.audit_reason', 'move_warband_campaign', true);
  if v_current is not null then
    update public.campaign_members set left_at = now() where campaign_id = v_current and warband_id = p_warband_id and left_at is null;
  end if;
  insert into public.campaign_members (campaign_id, warband_id, user_id)
  values (v_campaign.id, p_warband_id, (select auth.uid()))
  on conflict (campaign_id, warband_id) do update set left_at = null, joined_at = now()
  returning * into v_member;
  return v_member;
end;
$$;

revoke all on function public.move_warband_campaign(uuid, text) from public;
grant execute on function public.move_warband_campaign(uuid, text) to authenticated;
