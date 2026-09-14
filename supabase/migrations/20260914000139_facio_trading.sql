-- Purchase first from existing money; sell the notebooks only afterwards.
create table public.facio_purchases (
 report_id uuid primary key references public.match_reports(id) on delete restrict,
 warband_id uuid not null references public.warbands(id) on delete cascade,
 request_id uuid not null unique,
 item_id text not null,
 cost integer not null check(cost>=0),
 payout integer check(payout between 20 and 120),
 dice integer[],
 created_at timestamptz not null default now()
);
alter table public.facio_purchases enable row level security;
revoke all on public.facio_purchases from anon,authenticated;

create function public.facio_trade_state(p_warband_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.can_read_warband(p_warband_id) then raise exception 'This warband is not available.'; end if;
 return jsonb_build_object(
  'available',coalesce((select jsonb_agg(jsonb_build_object('reportId',r.id,'matchId',r.match_id))
    from public.match_reports r where r.warband_id=p_warband_id and r.status='applied'
    and r.applied->'scenario_effects'->>'facio'='true'
    and not exists(select 1 from public.facio_purchases p where p.report_id=r.id)
    and r.id=(select latest.id from public.match_reports latest where latest.warband_id=p_warband_id order by latest.submitted_at desc,latest.id desc limit 1)
    and not exists(select 1 from public.match_participants mp join public.matches m on m.id=mp.match_id where mp.warband_id=p_warband_id and m.id<>r.match_id and m.started_at>coalesce((select started_at from public.matches where id=r.match_id),r.submitted_at))
   ),'[]'::jsonb),
  'notebooks',coalesce((select jsonb_agg(jsonb_build_object('reportId',p.report_id,'itemId',p.item_id,'cost',p.cost)) from public.facio_purchases p where p.warband_id=p_warband_id and p.payout is null),'[]'::jsonb)
 );
end $$;
revoke all on function public.facio_trade_state(uuid) from public,anon;
grant execute on function public.facio_trade_state(uuid) to authenticated;

create function public.record_facio_purchase(p_warband_id uuid,p_report_id uuid,p_request_id uuid,p_changes jsonb,p_cost integer,p_expected_gold integer,p_item_id text,p_reason text default '',p_haggle jsonb default null)
returns integer language plpgsql security definer set search_path='' as $$
declare w public.warbands; receipt public.facio_purchases; r public.match_reports; c jsonb; d jsonb; item public.items; item_count integer:=0; gold_count integer:=0; result integer;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'Only the warband owner or GM may trade.'; end if;
 select * into w from public.warbands where id=p_warband_id for update;
 select * into receipt from public.facio_purchases where request_id=p_request_id;
 if found then
  if receipt.warband_id<>p_warband_id or receipt.report_id<>p_report_id then raise exception 'This purchase identity belongs to another reward.'; end if;
  return 0;
 end if;
 if p_request_id is null or p_cost is null or p_cost<0 or p_expected_gold is distinct from w.gold then raise exception 'Your gold changed; refresh before buying.'; end if;
 if w.gold<p_cost then raise exception 'Afford the item before selling Facio''s notebooks.'; end if;
 if not exists(select 1 from jsonb_array_elements(public.facio_trade_state(p_warband_id)->'available') a where a->>'reportId'=p_report_id::text) then raise exception 'Facio''s purchase has been used or is no longer available.'; end if;
 select * into r from public.match_reports where id=p_report_id for update;
 if r.status<>'applied' or r.applied->'scenario_effects'->>'facio' is distinct from 'true' then raise exception 'The Facio reward is no longer applied.'; end if;
 if exists(select 1 from public.match_participants mp join public.matches m on m.id=mp.match_id where mp.warband_id=w.id and (m.state='in_progress' or m.state='awaiting_reports' and not exists(select 1 from public.match_reports own where own.match_id=m.id and own.warband_id=w.id))) then raise exception 'Finish the current battle and file its report before trading.'; end if;
 if not (p_item_id=any(array['axe','club','club_mace_or_hammer','dagger','double_handed_weapon','fighting_claws','flail','halberd','hammer','lance','mace','morning_star','sigmarite_warhammer','spear','spiked_gauntlet','steel_whip','sword','weeping_blades','blowpipe','bow','crossbow','crossbow_pistol','elf_bow','longbow','repeater_crossbow','short_bow','sling','throwing_knives_stars','blunderbuss','duelling_pistol','handgun','hunting_rifle','pistol','warplock_pistol','barding','buckler','gromril_armour','heavy_armour','helmet','ithilmar_armour','light_armour','shield','blessed_water','bugmans_ale','cathayan_silk_clothes','elven_cloak','garlic','halfling_cookbook','holy_unholy_relic','holy_tome','hunting_arrows','lantern','lucky_charm','mordheim_map','net','black_lotus','crimson_shade','dark_venom','healing_herbs','mad_cap_mushrooms','mandrake_root','tears_of_shallaya','rope_and_hook','superior_blackpowder','tome_of_magic','wardogs','riding_draft_horse','warhorse','gromril_axe','gromril_club','gromril_double_handed_weapon','gromril_flail','gromril_halberd','gromril_hammer','gromril_lance','gromril_mace','gromril_morning_star','gromril_sigmarite_warhammer','gromril_spear','gromril_steel_whip','gromril_sword','ithilmar_axe','ithilmar_club','ithilmar_double_handed_weapon','ithilmar_flail','ithilmar_halberd','ithilmar_hammer','ithilmar_lance','ithilmar_mace','ithilmar_morning_star','ithilmar_sigmarite_warhammer','ithilmar_spear','ithilmar_steel_whip','ithilmar_sword']::text[])) then raise exception 'Choose one item from the regular Price Chart; Pirate equipment and found-only rewards are excluded.'; end if;
 if jsonb_typeof(p_changes) is distinct from 'array' then raise exception 'Invalid purchase.'; end if;
 for c in select value from jsonb_array_elements(p_changes) loop
  d:=c->'data';
  if c->>'table'='warbands' and c->>'op'='update' and c->>'id'=w.id::text then
   gold_count:=gold_count+1;
   if d is distinct from jsonb_build_object('gold',w.gold-p_cost) then raise exception 'The purchase must deduct exactly its price.'; end if;
  elsif c->>'table'='items' then
   item_count:=item_count+1;
   if c->>'op'='insert' then
    if d->>'item_rules_id' is distinct from p_item_id or (d->>'quantity')::int is distinct from 1 or coalesce(d->>'custom_name','')<>'' then raise exception 'Facio allows exactly one regular item.'; end if;
   elsif c->>'op'='update' then
    select * into item from public.items where id=(c->>'id')::uuid and warband_id=w.id for update;
    if not found or item.item_rules_id is distinct from p_item_id or (d->>'quantity')::int is distinct from item.quantity+1 or d-'quantity'-'notes'<>'{}'::jsonb then raise exception 'The item stack changed; refresh before buying one item.'; end if;
   else raise exception 'Facio cannot remove or move equipment.';
   end if;
  else raise exception 'Facio only buys one item and deducts its price.';
  end if;
 end loop;
 if item_count<>1 or gold_count<>(case when p_cost>0 then 1 else 0 end) then raise exception 'Facio requires one item purchase.'; end if;
 if p_haggle is not null then
  result:=public.record_haggled_trade(w.id,r.match_id,p_changes,'{}'::uuid[],concat('Facio: bought ',p_item_id,' for ',p_cost,' gc as Common. ',p_reason),(p_haggle->>'heroId')::uuid,array(select value::int from jsonb_array_elements_text(p_haggle->'dice')),(p_haggle->>'requestId')::uuid,p_haggle->>'itemName',(p_haggle->>'priceBefore')::int);
 else
  result:=public.record_trade(w.id,r.match_id,p_changes,false,'{}'::uuid[],concat('Facio: bought ',p_item_id,' for ',p_cost,' gc as Common. ',p_reason));
 end if;
 insert into public.facio_purchases(report_id,warband_id,request_id,item_id,cost) values(r.id,w.id,p_request_id,p_item_id,p_cost);
 return result;
end $$;
revoke all on function public.record_facio_purchase(uuid,uuid,uuid,jsonb,integer,integer,text,text,jsonb) from public,anon;
grant execute on function public.record_facio_purchase(uuid,uuid,uuid,jsonb,integer,integer,text,text,jsonb) to authenticated;

create function public.sell_facio_notebooks(p_warband_id uuid,p_report_id uuid,p_dice integer[],p_reason text default '')
returns integer language plpgsql security definer set search_path='' as $$
declare w public.warbands; receipt public.facio_purchases; notebook_gold integer;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'Only the warband owner or GM may sell the notebooks.'; end if;
 select * into w from public.warbands where id=p_warband_id for update;
 select * into receipt from public.facio_purchases where report_id=p_report_id and warband_id=w.id for update;
 if not found then raise exception 'Buy the item before selling Facio''s notebooks.'; end if;
 if receipt.payout is not null then return receipt.payout; end if;
 if coalesce(array_length(p_dice,1),0)<>2 or exists(select 1 from unnest(p_dice) d where d is null or d<1 or d>6) then raise exception 'Roll two D6 for the notebooks.'; end if;
 notebook_gold:=(p_dice[1]+p_dice[2])*10;
 perform public.update_roster(w.id,concat('Facio: sold the notebooks after buying ',receipt.item_id,'. Rolled ',p_dice[1],' + ',p_dice[2],' = ',notebook_gold,' gc. ',p_reason),jsonb_build_array(jsonb_build_object('table','warbands','op','update','id',w.id,'data',jsonb_build_object('gold',w.gold+notebook_gold))));
 update public.facio_purchases set payout=notebook_gold,dice=p_dice where report_id=p_report_id;
 return notebook_gold;
end $$;
revoke all on function public.sell_facio_notebooks(uuid,uuid,integer[],text) from public,anon;
grant execute on function public.sell_facio_notebooks(uuid,uuid,integer[],text) to authenticated;

notify pgrst, 'reload schema';
