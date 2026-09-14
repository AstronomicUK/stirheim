-- Powered rewards belong to the opposing model; record their warband and a reversible receipt.
create table public.abomination_shard_rewards (
 report_id uuid not null references public.match_reports(id) on delete cascade,
 group_id uuid not null references public.henchman_groups(id),
 model_index integer not null check(model_index>=0),
 recipient_id uuid not null references public.warbands(id),
 model_name text not null,
 primary key(report_id,group_id,model_index)
);
alter table public.abomination_shard_rewards enable row level security;
revoke all on public.abomination_shard_rewards from anon,authenticated;

alter function public.apply_battle_report(uuid) rename to apply_battle_report_before_powered;
revoke all on function public.apply_battle_report_before_powered(uuid) from public,anon,authenticated;
create function public.apply_battle_report(p_report_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare r public.match_reports%rowtype; reward jsonb; g public.henchman_groups%rowtype; expected integer; recorded integer;
begin
 select * into r from public.match_reports where id=p_report_id for update;
 if r.id is null or not public.can_edit_warband(r.warband_id) then raise exception 'You cannot apply this report' using errcode='42501'; end if;
 if r.undo is not null then raise exception 'This report has already been applied'; end if;
 if r.applied ? 'abomination_rewards' then
  perform 1 from public.warbands where id=r.warband_id or id in(select (x->>'recipient_id')::uuid from jsonb_array_elements(r.applied->'abomination_rewards') x) order by id for update;
  for reward in select * from jsonb_array_elements(r.applied->'abomination_rewards') loop
   select * into g from public.henchman_groups where id=(reward->>'group_id')::uuid and warband_id=r.warband_id;
   select coalesce(sum((o->>'count')::integer),0) into expected from jsonb_array_elements(coalesce(r.ooa,'[]')) o where o->>'subjectId'=g.id::text;
   if g.id is null or g.unit_type_rules_id<>'necrarchs_abomination' or (reward->>'model_index')::integer not between 0 and expected-1 or expected>g.size-coalesce((g.campaign_state->>'reanimationOwed')::integer,0)
    or (reward->>'recipient_id')::uuid=r.warband_id or length(trim(coalesce(reward->>'model_name','')))=0
    or not exists(select 1 from public.match_participants where match_id=r.match_id and warband_id=(reward->>'recipient_id')::uuid)
   then raise exception 'Invalid Abomination shard recipient or casualty'; end if;
   select count(*) into recorded from jsonb_array_elements(r.applied->'abomination_rewards') x where x->>'group_id'=g.id::text;
   if recorded<>expected or not exists(select 1 from jsonb_array_elements(r.applied->'groups') x where x->>'id'=g.id::text and (x->'patch'->'campaign_state'->>'reanimationOwed')::integer=coalesce((g.campaign_state->>'reanimationOwed')::integer,0)+expected) then raise exception 'Record every lost Abomination shard and its reanimation debt'; end if;
   insert into public.abomination_shard_rewards values(r.id,g.id,(reward->>'model_index')::integer,(reward->>'recipient_id')::uuid,trim(reward->>'model_name'));
  end loop;
 end if;
 perform public.apply_battle_report_before_powered(p_report_id);
 for reward in select jsonb_build_object('recipient',recipient_id,'model',model_name) from public.abomination_shard_rewards where report_id=r.id loop
  perform set_config('stirheim.audit_reason',format('%s took down an Abomination and recovered its wyrdstone shard.',reward->>'model'),true);
  update public.warbands set wyrdstone=wyrdstone+1 where id=(reward->>'recipient')::uuid;
 end loop;
end $$;
revoke all on function public.apply_battle_report(uuid) from public,anon;
grant execute on function public.apply_battle_report(uuid) to authenticated;

alter function public.withdraw_battle_report(uuid,uuid) rename to withdraw_battle_report_before_powered;
revoke all on function public.withdraw_battle_report_before_powered(uuid,uuid) from public,anon,authenticated;
create function public.withdraw_battle_report(p_match_id uuid,p_warband_id uuid) returns public.match_state language plpgsql security definer set search_path='' as $$
declare report uuid; reward record; result public.match_state;
begin
 if not public.can_edit_warband(p_warband_id) then raise exception 'You cannot withdraw this report' using errcode='42501'; end if;
 select id into report from public.match_reports where match_id=p_match_id and warband_id=p_warband_id for update;
 perform 1 from public.warbands where id=p_warband_id or id in(select recipient_id from public.abomination_shard_rewards where report_id=report) order by id for update;
 for reward in select recipient_id,count(*) amount from public.abomination_shard_rewards where report_id=report group by recipient_id loop
  if (select wyrdstone from public.warbands where id=reward.recipient_id)<reward.amount then raise exception 'The opponent has spent an Abomination shard. Restore the shards before withdrawing this report.'; end if;
  perform set_config('stirheim.audit_reason','Withdrew the Abomination casualty report; returned its awarded shard.',true);
  update public.warbands set wyrdstone=wyrdstone-reward.amount where id=reward.recipient_id;
 end loop;
 result:=public.withdraw_battle_report_before_powered(p_match_id,p_warband_id);
 delete from public.abomination_shard_rewards where report_id=report;
 return result;
end $$;
revoke all on function public.withdraw_battle_report(uuid,uuid) from public,anon;
grant execute on function public.withdraw_battle_report(uuid,uuid) to authenticated;

create function public.reanimate_abomination(p_group_id uuid,p_request_id uuid,p_undo boolean,p_expected_state jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare g public.henchman_groups%rowtype; shards integer; debt integer; next_state jsonb; receipt jsonb;
begin
 select * into g from public.henchman_groups where id=p_group_id;
 if auth.uid() is null or g.id is null or not public.can_edit_warband(g.warband_id) then raise exception 'You cannot reanimate this warrior' using errcode='42501'; end if;
 select wyrdstone into shards from public.warbands where id=g.warband_id for update;
 select * into g from public.henchman_groups where id=p_group_id for update;
 if g.unit_type_rules_id<>'necrarchs_abomination' or p_request_id is null or p_undo is null then raise exception 'Invalid reanimation request'; end if;
 receipt:=g.campaign_state->'reanimationReceipt';
 if not p_undo and receipt->>'requestId'=p_request_id::text then return; end if;
 if exists(select 1 from public.match_participants mp join public.matches m on m.id=mp.match_id where mp.warband_id=g.warband_id and m.state='in_progress') then raise exception 'Resolve reanimation between battles, not during an active battle'; end if;
 if g.campaign_state is distinct from p_expected_state then raise exception 'The Abomination changed; reload before continuing'; end if;
 if p_undo then
  if receipt is null or receipt->>'requestId'<>p_request_id::text or g.campaign_state-'reanimationReceipt' is distinct from receipt->'afterState' or g.size<>(receipt->>'size')::integer then raise exception 'This reanimation cannot be undone after later changes'; end if;
  if exists(select 1 from public.match_participants mp join public.matches m on m.id=mp.match_id where mp.warband_id=g.warband_id and m.started_at>(receipt->>'at')::timestamptz) then raise exception 'Another battle started after reanimation; correct that battle first'; end if;
  next_state:=receipt->'beforeState';
  perform set_config('stirheim.audit_reason',format('Undid reanimation of %s; refunded 1 shard and restored its reanimation requirement.',g.name),true);
  update public.warbands set wyrdstone=wyrdstone+1 where id=g.warband_id;
 else
  debt:=coalesce((g.campaign_state->>'reanimationOwed')::integer,0);
  if debt<1 or debt>g.size then raise exception 'This Abomination does not need reanimation'; end if;
  if shards<1 then raise exception 'Reanimation needs one wyrdstone shard'; end if;
  next_state:=g.campaign_state-'reanimationReceipt';
  if debt=1 then next_state:=next_state-'reanimationOwed'; else next_state:=jsonb_set(next_state,'{reanimationOwed}',to_jsonb(debt-1)); end if;
  next_state:=next_state||jsonb_build_object('reanimationReceipt',jsonb_build_object('requestId',p_request_id,'beforeState',g.campaign_state,'afterState',next_state,'size',g.size,'at',now()));
  perform set_config('stirheim.audit_reason',format('Reanimated %s with 1 wyrdstone shard; one Abomination can fight again.',g.name),true);
  update public.warbands set wyrdstone=wyrdstone-1 where id=g.warband_id;
 end if;
 update public.henchman_groups set campaign_state=next_state where id=g.id;
end $$;
revoke all on function public.reanimate_abomination(uuid,uuid,boolean,jsonb) from public,anon;
grant execute on function public.reanimate_abomination(uuid,uuid,boolean,jsonb) to authenticated;
notify pgrst,'reload schema';
