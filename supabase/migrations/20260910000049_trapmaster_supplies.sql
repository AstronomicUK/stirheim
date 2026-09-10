-- Trapmaster allowances: one free trap, up to five purchased at 5 gc when battle starts.
create or replace function public.set_trap_order(p_match_id uuid,p_hero_id uuid,p_extra integer)
returns void language plpgsql volatile security definer set search_path='' as $$
declare v_hero public.heroes%rowtype;
begin
  perform 1 from public.matches where id=p_match_id and state='scheduled' for update;
  if not found then raise exception 'Trap orders can only be changed before the battle starts'; end if;
  select * into v_hero from public.heroes where id=p_hero_id;
  if not found or not public.can_edit_warband(v_hero.warband_id) then raise exception 'Only the owner or GM may prepare these traps' using errcode='42501'; end if;
  perform 1 from public.warbands where id=v_hero.warband_id for update;
  if v_hero.unit_type_rules_id <> 'lustrian_reavers_trapmaster' or v_hero.status <> 'active' or not exists(select 1 from public.match_participants where match_id=p_match_id and warband_id=v_hero.warband_id) then raise exception 'Choose a participating Trapmaster'; end if;
  if p_extra is null or p_extra not between 0 and 5 then raise exception 'Choose zero to five extra traps'; end if;
  perform set_config('stirheim.audit_reason','Trapmaster: reserved ' || p_extra || ' extra traps for battle ' || p_match_id || '; charged only at battle start',true);
  update public.heroes set flags=jsonb_set(coalesce(flags,'{}'),'{trapOrders}',coalesce(flags->'trapOrders','{}') || jsonb_build_object(p_match_id::text,p_extra)) where id=p_hero_id;
end; $$;
create or replace function public.prepare_trap_supplies(p_match_id uuid)
returns void language plpgsql volatile security definer set search_path='' as $$
declare h record; n integer; cost integer; gold integer;
begin
  for h in select heroes.* from public.heroes join public.match_participants mp on mp.warband_id=heroes.warband_id where mp.match_id=p_match_id and heroes.unit_type_rules_id='lustrian_reavers_trapmaster' and heroes.status='active' order by heroes.warband_id,heroes.id for update of heroes loop
    if coalesce((h.flags->>'mustMissNextBattle')::boolean,false) or coalesce((h.flags->>'missNextGames')::integer,0)>0 then continue; end if;
    n:=coalesce((h.flags->'trapOrders'->>p_match_id::text)::integer,0);
    if n not between 0 and 5 then raise exception 'Invalid Trapmaster order for %',h.name; end if;
    cost:=n*5;
    select w.gold into gold from public.warbands w where id=h.warband_id for update;
    if gold<cost then raise exception '% needs % gc for reserved traps. Reduce the order or add funds before starting.',h.name,cost; end if;
    perform set_config('stirheim.audit_reason',format('Trapmaster supplies for %s: 1 free + %s bought for %s gc',p_match_id,n,cost),true);
    update public.warbands set gold=warbands.gold-cost where id=h.warband_id;
    update public.heroes set flags=(coalesce(flags,'{}') || jsonb_build_object('trapSupplyMatch',p_match_id::text,'trapSupplyBought',n,'trapSupplyRemaining',1+n,'trapOrders',coalesce(flags->'trapOrders','{}')-p_match_id::text)) where id=h.id;
  end loop;
end; $$;
create or replace function public.use_trap_supply(p_match_id uuid,p_hero_id uuid)
returns integer language plpgsql volatile security definer set search_path='' as $$
declare h public.heroes%rowtype; remaining integer;
begin
  perform 1 from public.matches where id=p_match_id and state='in_progress' for update;
  if not found then raise exception 'Traps may only be used during the battle'; end if;
  select * into h from public.heroes where id=p_hero_id;
  if not found or not public.can_edit_warband(h.warband_id) then raise exception 'Only the owner or GM may use these traps' using errcode='42501'; end if;
  perform 1 from public.warbands where id=h.warband_id for update;
  select * into h from public.heroes where id=p_hero_id for update;
  if h.status<>'active' or h.unit_type_rules_id<>'lustrian_reavers_trapmaster' or h.flags->>'trapSupplyMatch' is distinct from p_match_id::text or not exists(select 1 from public.match_participants where match_id=p_match_id and warband_id=h.warband_id) then raise exception 'This Trapmaster has no supply for this battle'; end if;
  remaining:=coalesce((h.flags->>'trapSupplyRemaining')::integer,0);
  if remaining<1 then raise exception 'No traps remain this battle'; end if;
  perform set_config('stirheim.audit_reason','Trapmaster used one trap in battle ' || p_match_id,true);
  update public.heroes set flags=jsonb_set(flags,'{trapSupplyRemaining}',to_jsonb(remaining-1)) where id=p_hero_id;
  return remaining-1;
end; $$;
revoke all on function public.prepare_trap_supplies(uuid) from public,authenticated;
revoke all on function public.set_trap_order(uuid,uuid,integer) from public;
revoke all on function public.use_trap_supply(uuid,uuid) from public;
grant execute on function public.set_trap_order(uuid,uuid,integer) to authenticated;
grant execute on function public.use_trap_supply(uuid,uuid) to authenticated;

create or replace function public.start_match(p_match_id uuid, p_combat_mode public.combat_mode default null, p_unpaid_ids uuid[] default null)
returns public.match_state
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_pending int;
  v_settings jsonb;
  v_default public.combat_mode;
  v_locked boolean;
  v_mode public.combat_mode;
  v_gm boolean;
  v_unpaid uuid[];
  v_ack uuid[];
begin
  select state into v_state from public.matches where id = p_match_id for update;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state <> 'scheduled' then
    raise exception 'this match is already %', v_state using errcode = 'P0001';
  end if;
  v_gm := public.is_campaign_gm(public.match_campaign(p_match_id));
  if not public.is_match_participant(p_match_id) and not v_gm then
    raise exception 'only a participant or the GM can start the battle' using errcode = '42501';
  end if;
  select count(*) into v_pending from public.match_participants where match_id = p_match_id and accepted_at is null;
  if v_pending > 0 then
    raise exception '% warband(s) have not accepted yet', v_pending using errcode = 'P0001';
  end if;
  if (select count(*) from public.match_participants where match_id = p_match_id) < 2 then
    raise exception 'a battle needs at least two warbands' using errcode = 'P0001';
  end if;

  select settings into v_settings from public.campaigns where id = public.match_campaign(p_match_id);
  v_default := coalesce(v_settings ->> 'combatMode', 'app')::public.combat_mode;
  v_locked := coalesce((v_settings ->> 'lockCombatMode')::boolean, false);
  v_mode := coalesce(p_combat_mode, v_default);
  if v_mode <> v_default and v_locked and not v_gm then
    raise exception 'the GM has fixed how combat is scored in this campaign' using errcode = '42501';
  end if;

  -- Share roster locks with payment/trading, in deterministic order.
  perform w.id from public.warbands w join public.match_participants mp on mp.warband_id = w.id
    where mp.match_id = p_match_id order by w.id for update of w;
  perform h.id from public.heroes h join public.match_participants mp on mp.warband_id = h.warband_id
    where mp.match_id = p_match_id order by h.id for update of h;
  select coalesce(array_agg(u.id order by u.id), '{}'::uuid[]) into v_unpaid from public.unpaid_match_hires(p_match_id) u;
  select coalesce(array_agg(distinct x order by x), '{}'::uuid[]) into v_ack from unnest(p_unpaid_ids) x;
  if cardinality(v_unpaid) > 0 and v_unpaid <> v_ack then
    raise exception 'Upkeep has changed. Review unpaid hired characters before starting this battle.' using errcode = 'P0001';
  end if;
  perform set_config('stirheim.audit_reason', 'Unpaid upkeep: dismissed before starting battle ' || p_match_id::text, true);
  update public.heroes set status = 'left', flags = flags - 'upkeepOwedAfter' - 'contractCheckOwed'
    where id = any(v_unpaid);
  perform public.prepare_trap_supplies(p_match_id);
  perform set_config('stirheim.audit_reason', 'start_match', true);
  update public.matches set state = 'in_progress', started_at = now(), combat_mode = v_mode where id = p_match_id;
  return 'in_progress';
end;
$$;

revoke all on function public.start_match(uuid, public.combat_mode, uuid[]) from public;
grant execute on function public.start_match(uuid, public.combat_mode, uuid[]) to authenticated;
