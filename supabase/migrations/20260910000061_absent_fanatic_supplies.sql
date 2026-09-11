-- Preserve absence cohorts when Fanatics are split, and do not feed absent fighters.
create or replace function public.fanatic_member_campaign_state(p_state jsonb,p_number integer,p_parent uuid)
returns jsonb language plpgsql immutable set search_path='' as $$
declare result jsonb:=coalesce(p_state,'{}')-'raidAbsences'; cohort jsonb;
begin
  with cohorts as (
    select a.value,sum((a.value->>'count')::int) over(order by a.ordinality) as total
    from jsonb_array_elements(coalesce(p_state->'raidAbsences','[]'::jsonb)) with ordinality a(value,ordinality)
  ) select value into cohort from cohorts where p_number<=total and p_number>total-(value->>'count')::int limit 1;
  if cohort is not null then result:=result||jsonb_build_object('raidAbsences',jsonb_build_array(jsonb_build_object('count',1,'games',(cohort->>'games')::int))); end if;
  return result||jsonb_build_object('fanaticSplitFrom',p_parent::text);
end; $$;
revoke all on function public.fanatic_member_campaign_state(jsonb,integer,uuid) from public,authenticated;

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
      values(new_id,g.warband_id,coalesce(nullif(g.model_names[n],''),g.name || ' ' || n),g.unit_type_rules_id,1,g.stats,g.xp,g.level_ups,g.stat_increases,g.is_large,g.notes,g.sort_order+n-1,'{}',public.fanatic_member_campaign_state(g.campaign_state,n,g.id));
      for i in select * from public.items where warband_id=g.warband_id and holder_type='group' and holder_id=g.id loop
        insert into public.items(warband_id,holder_type,holder_id,item_rules_id,custom_name,quantity,notes) values(g.warband_id,'group',new_id,i.item_rules_id,i.custom_name,i.quantity/g.size,i.notes);
      end loop;
    end loop;
    update public.items set quantity=quantity/g.size where warband_id=g.warband_id and holder_type='group' and holder_id=g.id;
    update public.henchman_groups set name=coalesce(nullif(g.model_names[1],''),g.name || ' 1'),size=1,model_names='{}',campaign_state=public.fanatic_member_campaign_state(g.campaign_state,1,g.id) where id=g.id;
  end loop;
  for g in select hg.* from public.henchman_groups hg join public.match_participants mp on mp.warband_id=hg.warband_id where mp.match_id=p_match_id and hg.unit_type_rules_id in ('night_goblins_fanatics','night_goblins_web_fanatics') and hg.size>0 order by hg.warband_id,hg.sort_order,hg.name,hg.id for update of hg loop
    if exists(select 1 from jsonb_array_elements(coalesce(g.campaign_state->'raidAbsences','[]'::jsonb)) a where (a->>'count')::int>0 and (a->>'games')::int>0) then
      perform set_config('stirheim.audit_reason',g.name || ': misses battle after Raids surrender; no mushroom dose consumed',true);
      update public.henchman_groups set campaign_state=coalesce(campaign_state,'{}')-'fanaticBattleMatch'-'fanaticSittingOut' where id=g.id;
      continue;
    end if;
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
