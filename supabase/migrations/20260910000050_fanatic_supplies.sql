-- Fanatics need individual supply and permanent-damage records.
create or replace function public.prepare_fanatic_supplies(p_match_id uuid)
returns void language plpgsql volatile security definer set search_path='' as $$
declare g public.henchman_groups%rowtype; i public.items%rowtype; n integer; new_id uuid; dose public.items%rowtype; supplied boolean;
begin
  -- Split identical groups before play so partial supplies and later Stupidity never affect peers.
  for g in select hg.* from public.henchman_groups hg join public.match_participants mp on mp.warband_id=hg.warband_id where mp.match_id=p_match_id and hg.unit_type_rules_id in ('night_goblins_fanatics','night_goblins_web_fanatics') and hg.size>1 order by hg.warband_id,hg.id for update of hg loop
    if exists(select 1 from public.pending_advances a where a.subject_type='group' and a.subject_id=g.id and a.resolved_at is null) then raise exception '%: finish the group’s pending advances before its Fanatics are recorded individually.',g.name; end if;
    if exists(select 1 from public.items x where x.warband_id=g.warband_id and x.holder_type='group' and x.holder_id=g.id and x.item_rules_id is distinct from 'mad_cap_mushrooms' and x.quantity % g.size <> 0) then raise exception '%: equip the Fanatics alike before starting so their individual kit can be recorded correctly.',g.name; end if;
    perform set_config('stirheim.audit_reason','Fanatics tracked individually for mushroom supply and permanent damage before battle ' || p_match_id,true);
    update public.items set holder_type='stash',holder_id=null where warband_id=g.warband_id and holder_type='group' and holder_id=g.id and item_rules_id='mad_cap_mushrooms';
    for n in 2..g.size loop
      new_id:=gen_random_uuid();
      insert into public.henchman_groups(id,warband_id,name,unit_type_rules_id,size,stats,xp,level_ups,stat_increases,is_large,notes,sort_order,model_names,campaign_state)
      values(new_id,g.warband_id,coalesce(nullif(g.model_names[n],''),g.name || ' ' || n),g.unit_type_rules_id,1,g.stats,g.xp,g.level_ups,g.stat_increases,g.is_large,g.notes,g.sort_order+n-1,'{}',coalesce(g.campaign_state,'{}') || jsonb_build_object('fanaticSplitFrom',g.id::text));
      for i in select * from public.items where warband_id=g.warband_id and holder_type='group' and holder_id=g.id loop
        insert into public.items(warband_id,holder_type,holder_id,item_rules_id,custom_name,quantity,notes) values(g.warband_id,'group',new_id,i.item_rules_id,i.custom_name,i.quantity/g.size,i.notes);
      end loop;
    end loop;
    update public.items set quantity=quantity/g.size where warband_id=g.warband_id and holder_type='group' and holder_id=g.id;
    update public.henchman_groups set name=coalesce(nullif(g.model_names[1],''),g.name || ' 1'),size=1,model_names='{}',campaign_state=coalesce(campaign_state,'{}') || jsonb_build_object('fanaticSplitFrom',g.id::text) where id=g.id;
  end loop;
  for g in select hg.* from public.henchman_groups hg join public.match_participants mp on mp.warband_id=hg.warband_id where mp.match_id=p_match_id and hg.unit_type_rules_id in ('night_goblins_fanatics','night_goblins_web_fanatics') and hg.size>0 order by hg.warband_id,hg.sort_order,hg.name,hg.id for update of hg loop
    select * into dose from public.items x where x.warband_id=g.warband_id and x.item_rules_id='mad_cap_mushrooms' and x.quantity>0 and (x.holder_type='stash' or x.holder_type='group' and x.holder_id=g.id) order by (x.holder_id=g.id) desc nulls last,x.id limit 1 for update;
    supplied:=found;
    perform set_config('stirheim.audit_reason',g.name || case when supplied then ': consumed one Mad Cap Mushroom dose before battle ' else ': sits out without Mad Cap Mushrooms for battle ' end || p_match_id,true);
    if supplied then
      if dose.quantity=1 then delete from public.items where id=dose.id; else update public.items set quantity=quantity-1 where id=dose.id; end if;
    end if;
    update public.henchman_groups set campaign_state=coalesce(campaign_state,'{}') || jsonb_build_object('fanaticBattleMatch',p_match_id::text,'fanaticSittingOut',not supplied) where id=g.id;
  end loop;
end; $$;
revoke all on function public.prepare_fanatic_supplies(uuid) from public,authenticated;

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
  perform public.prepare_fanatic_supplies(p_match_id);
  perform set_config('stirheim.audit_reason', 'start_match', true);
  update public.matches set state = 'in_progress', started_at = now(), combat_mode = v_mode where id = p_match_id;
  return 'in_progress';
end;
$$;

revoke all on function public.start_match(uuid, public.combat_mode, uuid[]) from public;
grant execute on function public.start_match(uuid, public.combat_mode, uuid[]) to authenticated;
