-- Cancel battle's own confirmation text promises "no reports, no experience, no injuries" but
-- never actually delivered on it once a report had already been applied: it only flipped the
-- match to 'cancelled' and left every applied report's roster changes (gold, wyrdstone, hero XP,
-- pending advances, stash) in place, orphaned under a match that no longer exists (#75). Cancel
-- now walks back every applied report first, the same way withdraw_battle_report does for one.

create or replace function public.cancel_match(p_match_id uuid)
returns public.match_state
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_creator uuid;
  v_campaign uuid;
  v_report_id uuid;
begin
  select state, created_by, campaign_id into v_state, v_creator, v_campaign from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state in ('completed', 'cancelled') then
    raise exception 'this match is already %', v_state using errcode = 'P0001';
  end if;
  if not public.is_campaign_gm(v_campaign) and not (v_creator = (select auth.uid()) and v_state = 'scheduled') then
    raise exception 'only the GM (or the creator, before it starts) can cancel' using errcode = '42501';
  end if;
  perform set_config('stirheim.audit_reason', 'cancel_match', true);
  for v_report_id in select id from public.match_reports where match_id = p_match_id and status = 'applied' loop
    perform public.revert_battle_report(v_report_id);
    delete from public.match_reports where id = v_report_id;
  end loop;
  update public.matches set state = 'cancelled', completed_at = now() where id = p_match_id;
  return 'cancelled';
end;
$$;

revoke all on function public.cancel_match(uuid) from public, authenticated;
grant execute on function public.cancel_match(uuid) to authenticated;
