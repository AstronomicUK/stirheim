-- An agreed ransom restores the original reservation and moves only the agreed gold.
create or replace function public.settle_trade_wagon_ransom(p_report_id uuid,p_gold integer,p_merchant_updated timestamptz,p_captor_updated timestamptz,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare c public.trade_wagon_captures%rowtype; w record; after_bands jsonb; after_items jsonb; after_group jsonb; details jsonb;
begin
  perform 1 from public.matches where id=(select match_id from public.trade_wagon_captures where report_id=p_report_id) for update;
  select * into c from public.trade_wagon_captures where report_id=p_report_id for update;
  if c.report_id is null or c.state<>'pending' then raise exception 'This Trade Wagon capture is no longer awaiting an outcome'; end if;
  if not public.can_edit_warband(c.merchant_id) or not public.can_edit_warband(c.captor_id) then
    raise exception 'The campaign GM or an owner of both warbands must record the agreed ransom' using errcode='42501';
  end if;
  if p_gold is null or p_gold<0 or coalesce(btrim(p_reason),'')='' then raise exception 'Record the agreed ransom and an explanation'; end if;
  if not exists(select 1 from public.match_reports where match_id=c.match_id and warband_id=c.captor_id and result='won' and undo is not null) then
    raise exception 'The capturing warband must file its winning battle report before settlement';
  end if;
  for w in select * from public.warbands where id in(c.merchant_id,c.captor_id) order by id for update loop
    if (w.id=c.merchant_id and w.updated_at is distinct from p_merchant_updated)
      or (w.id=c.captor_id and w.updated_at is distinct from p_captor_updated) then
      raise exception 'A warband changed; reload and review the ransom before recording it';
    end if;
    if w.id=c.merchant_id and w.gold<p_gold then raise exception 'The Merchant Caravan cannot afford this ransom'; end if;
  end loop;
  perform set_config('stirheim.audit_reason',format('Trade Wagon ransom: %s gc paid to return the original wagon and cargo. %s',p_gold,p_reason),true);
  perform public.release_trade_wagon_capture(p_report_id);
  update public.warbands set gold=gold-p_gold where id=c.merchant_id;
  update public.warbands set gold=gold+p_gold where id=c.captor_id;
  select jsonb_agg(jsonb_build_object('id',id,'gold',gold,'wyrdstone',wyrdstone) order by id) into after_bands
    from public.warbands where id in(c.merchant_id,c.captor_id);
  select coalesce(jsonb_agg(to_jsonb(i) order by id),'[]'::jsonb) into after_items from public.items i where id in
    (select (x->>'id')::uuid from jsonb_array_elements(c.snapshot->'cargo'->'items') x)
    or (c.snapshot->'wagon'->>'kind'='item' and id=(c.snapshot->'wagon'->'expected'->>'id')::uuid);
  if c.snapshot->'wagon'->>'kind'='group' then
    select to_jsonb(g) into after_group from public.henchman_groups g where id=(c.snapshot->'wagon'->'expected'->>'id')::uuid;
  end if;
  details:=jsonb_build_object('kind','ransom','gold',p_gold,'reason',btrim(p_reason),'recorded_by',auth.uid(),'recorded_at',now(),
    'after_warbands',after_bands,'after_items',after_items,'after_group',after_group);
  insert into public.trade_wagon_captures(report_id,match_id,merchant_id,captor_id,snapshot,state,settlement,created_at)
    values(c.report_id,c.match_id,c.merchant_id,c.captor_id,c.snapshot,'settled',details,c.created_at);
end;
$$;
revoke all on function public.settle_trade_wagon_ransom(uuid,integer,timestamptz,timestamptz,text) from public;
grant execute on function public.settle_trade_wagon_ransom(uuid,integer,timestamptz,timestamptz,text) to authenticated;

create or replace function public.undo_trade_wagon_ransom(p_report_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare c public.trade_wagon_captures%rowtype; entry jsonb; current_row jsonb; amount integer; wagon_id uuid;
begin
  perform 1 from public.matches where id=(select match_id from public.trade_wagon_captures where report_id=p_report_id) for update;
  select * into c from public.trade_wagon_captures where report_id=p_report_id for update;
  if c.report_id is null or c.state<>'settled' or c.settlement->>'kind'<>'ransom' then raise exception 'There is no settled Trade Wagon ransom to undo'; end if;
  if not public.can_edit_warband(c.merchant_id) or not public.can_edit_warband(c.captor_id) then
    raise exception 'The campaign GM or an owner of both warbands must undo this ransom' using errcode='42501';
  end if;
  if coalesce(btrim(p_reason),'')='' then raise exception 'Explain why the ransom is being undone'; end if;
  perform 1 from public.warbands where id in(c.merchant_id,c.captor_id) order by id for update;
  for entry in select * from jsonb_array_elements(c.settlement->'after_warbands') loop
    if not exists(select 1 from public.warbands where id=(entry->>'id')::uuid and gold=(entry->>'gold')::integer and wyrdstone=(entry->>'wyrdstone')::integer) then
      raise exception 'A treasury changed after the ransom; reverse later spending or rewards first';
    end if;
  end loop;
  perform 1 from public.items where id in(select (x->>'id')::uuid from jsonb_array_elements(c.settlement->'after_items') x) order by id for update;
  for entry in select * from jsonb_array_elements(c.settlement->'after_items') loop
    select to_jsonb(i) into current_row from public.items i where id=(entry->>'id')::uuid;
    if current_row-'updated_at' is distinct from entry-'updated_at' then raise exception 'Returned equipment changed after the ransom; reconcile it before undoing'; end if;
  end loop;
  wagon_id:=(c.snapshot->'wagon'->'expected'->>'id')::uuid;
  if c.snapshot->'wagon'->>'kind'='group' then
    select to_jsonb(g) into current_row from public.henchman_groups g where id=wagon_id for update;
    if current_row-'updated_at' is distinct from (c.settlement->'after_group')-'updated_at'
      or exists(select 1 from public.items where holder_type='group' and holder_id=wagon_id) then
      raise exception 'The returned Trade Wagon changed; reconcile it before undoing';
    end if;
  end if;
  perform set_config('stirheim.audit_reason','Trade Wagon ransom undone: '||btrim(p_reason),true);
  delete from public.items where id in(select (x->>'id')::uuid from jsonb_array_elements(c.settlement->'after_items') x);
  if c.snapshot->'wagon'->>'kind'='group' then update public.henchman_groups set size=0 where id=wagon_id; end if;
  amount:=(c.settlement->>'gold')::integer;
  update public.warbands set gold=gold+amount,wyrdstone=wyrdstone-(c.snapshot->'cargo'->>'wyrdstone')::integer where id=c.merchant_id;
  update public.warbands set gold=gold-amount where id=c.captor_id;
  update public.trade_wagon_captures set state='pending',settlement=null where report_id=c.report_id;
end;
$$;
revoke all on function public.undo_trade_wagon_ransom(uuid,text) from public;
grant execute on function public.undo_trade_wagon_ransom(uuid,text) to authenticated;
