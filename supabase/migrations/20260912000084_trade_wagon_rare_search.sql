-- Capturing a Merchant's wagon affects rare-item searches, not character searches.
create or replace function public.trade_wagon_rare_search_blocked(p_warband_id uuid)
returns boolean language sql volatile security definer set search_path='' as $$
 select public.can_read_warband(p_warband_id) and exists(
   select 1 from public.trade_wagon_captures c join public.matches source on source.id=c.match_id
   where c.captor_id=p_warband_id and (c.snapshot->>'rare_search_blocked')::boolean
     and not exists(
       select 1 from public.match_participants mp join public.matches newer on newer.id=mp.match_id
       where mp.warband_id=p_warband_id and mp.accepted_at is not null
         and newer.state in ('in_progress','awaiting_reports','completed') and newer.id<>source.id
         and coalesce(newer.started_at,newer.created_at)>coalesce(source.started_at,source.created_at)
     )
 );
$$;
revoke all on function public.trade_wagon_rare_search_blocked(uuid) from public;
grant execute on function public.trade_wagon_rare_search_blocked(uuid) to authenticated;

-- Keep the check and the trade in one transaction, including haggled purchases.
-- Existing record_trade remains available for character searches and recorded player overrides.
create or replace function public.record_rare_item_trade(p_warband_id uuid,p_match_id uuid,p_changes jsonb,p_wyrdstone_sold boolean,p_heroes_searched uuid[],p_reason text,p_haggle jsonb default null)
returns integer language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'You cannot trade for this warband' using errcode='42501'; end if;
  perform 1 from public.warbands where id=p_warband_id for update;
  if public.trade_wagon_rare_search_blocked(p_warband_id) then
    raise exception 'Local traders refuse rare-item searches after this warband captured a Merchant Caravan wagon. The restriction ends when its next battle starts.';
  end if;
  if p_haggle is not null then
    return public.record_haggled_trade(p_warband_id,p_match_id,p_changes,p_heroes_searched,p_reason,
      (p_haggle->>'heroId')::uuid,array(select value::integer from jsonb_array_elements_text(p_haggle->'dice')),
      (p_haggle->>'requestId')::uuid,p_haggle->>'itemName',(p_haggle->>'priceBefore')::integer);
  end if;
  return public.record_trade(p_warband_id,p_match_id,p_changes,p_wyrdstone_sold,p_heroes_searched,p_reason);
end;
$$;
revoke all on function public.record_rare_item_trade(uuid,uuid,jsonb,boolean,uuid[],text,jsonb) from public;
grant execute on function public.record_rare_item_trade(uuid,uuid,jsonb,boolean,uuid[],text,jsonb) to authenticated;
