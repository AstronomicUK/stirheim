-- Retained Flesh Constructs are repaired or abandoned explicitly, with a reversible receipt.
create function public.resolve_construct_repair(p_group_id uuid,p_request_id uuid,p_action text,p_expected_state jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare g public.henchman_groups%rowtype; treasury integer; debt jsonb; next_state jsonb; receipt jsonb; cost integer; next_size integer; reason text; latest uuid; profile jsonb;
begin
 select * into g from public.henchman_groups where id=p_group_id;
 if auth.uid() is null or g.id is null or not public.can_edit_warband(g.warband_id) then raise exception 'You cannot change this Construct' using errcode='42501'; end if;
 select gold into treasury from public.warbands where id=g.warband_id for update;
 select * into g from public.henchman_groups where id=p_group_id for update;
 if p_request_id is null or p_action is null or p_action not in ('repair','abandon','undo') then raise exception 'Choose repair, abandon or undo'; end if;
 if g.unit_type_rules_id<>'masters_of_horror_flesh_construct' then raise exception 'This is not a Flesh Construct'; end if;
 if p_action<>'undo' and g.campaign_state->'constructRepairReceipt'->>'requestId'=p_request_id::text then return; end if;
 if g.campaign_state is distinct from p_expected_state then raise exception 'The Construct changed; reload before continuing'; end if;
 select match_id into latest from public.match_reports where warband_id=g.warband_id order by submitted_at desc limit 1;
 profile:=jsonb_build_object('xp',g.xp,'levelUps',g.level_ups,'stats',g.stats,'latestMatch',latest);
 if p_action='undo' then
  receipt:=g.campaign_state->'constructRepairReceipt';
  if receipt is null or receipt->>'requestId'<>p_request_id::text then raise exception 'This repair action cannot be undone'; end if;
  if g.size is distinct from (receipt->>'afterSize')::integer or (g.campaign_state-'constructRepairReceipt') is distinct from receipt->'afterState' then raise exception 'The Construct changed after this action; restore it before undoing'; end if;
  if profile is distinct from receipt->'afterProfile' then raise exception 'The Construct advanced, changed profile or completed another battle; undo that later change first'; end if;
  next_state:=receipt->'beforeState';next_size:=(receipt->>'beforeSize')::integer;cost:=-(receipt->>'paid')::integer;
  reason:=format('Undid Flesh Construct %s for %s; refunded %s gc and restored the repair debt.',receipt->>'action',g.name,-cost);
 else
  debt:=g.campaign_state->'constructRepairs'->0;
  if debt is null or g.size<1 then raise exception 'This Construct is not awaiting repairs'; end if;
  cost:=case when p_action='repair' then (debt->>'cost')::integer else 0 end;
  if p_action='repair' and (cost is null or cost not between 5 and 30 or cost%5<>0) then raise exception 'Invalid saved repair cost'; end if;
  if treasury<cost then raise exception 'Not enough gold to repair this Construct'; end if;
  next_state:=g.campaign_state-'constructRepairReceipt';
  if jsonb_array_length(next_state->'constructRepairs')=1 then next_state:=next_state-'constructRepairs'; else next_state:=jsonb_set(next_state,'{constructRepairs}',(next_state->'constructRepairs')-0); end if;
  next_size:=g.size-case when p_action='abandon' then 1 else 0 end;
  receipt:=jsonb_build_object('requestId',p_request_id,'action',p_action,'paid',cost,'beforeSize',g.size,'afterSize',next_size,'beforeState',g.campaign_state,'afterState',next_state,'afterProfile',profile);
  next_state:=next_state||jsonb_build_object('constructRepairReceipt',receipt);
  reason:=case when p_action='repair' then format('Repaired %s for %s gc; the Flesh Construct can fight again.',g.name,cost) else format('Abandoned damaged %s; removed one Flesh Construct from the roster.',g.name) end;
 end if;
 perform set_config('stirheim.audit_reason',reason,true);
 if cost<>0 then update public.warbands set gold=gold-cost where id=g.warband_id; end if;
 update public.henchman_groups set size=next_size,campaign_state=next_state where id=g.id;
end $$;
revoke all on function public.resolve_construct_repair(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.resolve_construct_repair(uuid,uuid,text,jsonb) to authenticated;
