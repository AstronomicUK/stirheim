-- Haggle and the Merchant's House symbol share a Hero's once-per-post-battle allowance.
create or replace function public.record_haggled_trade(p_warband_id uuid,p_match_id uuid,p_changes jsonb,p_heroes_searched uuid[],p_reason text,
 p_hero_id uuid,p_dice integer[],p_request_id uuid,p_item_name text,p_price_before integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare
 h public.heroes%rowtype; latest uuid; price_after integer; result integer; treasury integer; proposed_gold integer; reason text;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'You cannot trade for this warband' using errcode='42501'; end if;
 select gold into treasury from public.warbands where id=p_warband_id for update;
 select * into h from public.heroes where id=p_hero_id and warband_id=p_warband_id and status='active' and not is_hired_sword for update;
 if h.id is null then raise exception 'Choose a living Hero to haggle'; end if;
 if p_request_id is null or p_match_id is null or p_price_before is null or p_price_before<1 or coalesce(array_length(p_dice,1),0)<>2 or p_dice[1] is null or p_dice[2] is null or p_dice[1] not between 1 and 6 or p_dice[2] not between 1 and 6 or nullif(trim(p_item_name),'') is null then raise exception 'Haggle requires a post-battle phase, one priced item and two D6'; end if;
 price_after:=greatest(1,p_price_before-p_dice[1]-p_dice[2]);
 if h.flags->'haggleUse'->>'requestId'=p_request_id::text then
  if h.flags->'haggleUse'->>'matchId'=p_match_id::text and h.flags->'haggleUse'->'dice'=to_jsonb(p_dice) and h.flags->'haggleUse'->>'itemName'=p_item_name and (h.flags->'haggleUse'->>'priceBefore')::integer=p_price_before then return 0; end if;
  raise exception 'This Haggle request was already used with different details';
 end if;
 select match_id into latest from public.match_reports where warband_id=p_warband_id order by submitted_at desc limit 1;
 if latest is distinct from p_match_id then raise exception 'The post-battle phase changed; reload before haggling'; end if;
 if exists(select 1 from public.match_reports r cross join lateral jsonb_array_elements(coalesce(r.ooa,'[]'::jsonb)) o where r.warband_id=p_warband_id and r.match_id=p_match_id and o->>'subjectId'=p_hero_id::text) then raise exception 'A Hero taken out of action cannot haggle this sequence'; end if;
 if h.flags->'haggleUse'->>'matchId'=p_match_id::text then raise exception 'This Hero has already used Haggle this post-battle sequence'; end if;
 if not ('haggle'=any(h.skills)) and not exists(select 1 from public.items where warband_id=p_warband_id and holder_type='hero' and holder_id=h.id and item_rules_id='symbol_of_the_order_of_freetraders' and quantity>0) then raise exception 'This Hero no longer has Haggle or the Freetraders symbol'; end if;
 select (c->'data'->>'gold')::integer into proposed_gold from jsonb_array_elements(p_changes)c where c->>'table'='warbands' and c->>'op'='update' and c->>'id'=p_warband_id::text and c->'data'?'gold' limit 1;
 if proposed_gold is distinct from treasury-price_after or treasury<price_after then raise exception 'The treasury changed or the discounted total is incorrect; reload before buying'; end if;
 reason:=h.name||' used Haggle on '||p_item_name||': recorded 2D6 '||p_dice[1]||' + '||p_dice[2]||', price '||p_price_before||' → '||price_after||' gc. Used for this post-battle sequence.';
 result:=public.record_trade(p_warband_id,p_match_id,p_changes,false,p_heroes_searched,concat_ws(' ',reason,nullif(p_reason,'')));
 perform set_config('stirheim.audit_reason',reason,true);
 update public.heroes set flags=coalesce(flags,'{}'::jsonb)||jsonb_build_object('haggleUse',jsonb_build_object('matchId',p_match_id,'requestId',p_request_id,'itemName',p_item_name,'dice',to_jsonb(p_dice),'priceBefore',p_price_before,'priceAfter',price_after)) where id=h.id;
 return result;
end $$;
revoke all on function public.record_haggled_trade(uuid,uuid,jsonb,uuid[],text,uuid,integer[],uuid,text,integer) from public;
grant execute on function public.record_haggled_trade(uuid,uuid,jsonb,uuid[],text,uuid,integer[],uuid,text,integer) to authenticated;
