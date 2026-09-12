-- Tom's 12 September ruling: contents-only theft returns the empty wagon to the Merchant.
create or replace function public.loot_captured_trade_wagon(p_report_id uuid,p_merchant_updated timestamptz,p_captor_updated timestamptz,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare c public.trade_wagon_captures%rowtype; w record; entry jsonb; received jsonb; wagon_id uuid; after_items jsonb; after_bands jsonb; original jsonb; current_row jsonb; after_group jsonb;
begin
  perform 1 from public.matches where id=(select match_id from public.trade_wagon_captures where report_id=p_report_id) for update;
  select * into c from public.trade_wagon_captures where report_id=p_report_id for update;
  if c.report_id is null or c.state<>'pending' then raise exception 'This Trade Wagon capture is no longer awaiting an outcome'; end if;
  if not public.can_edit_warband(c.merchant_id) or not public.can_edit_warband(c.captor_id) then
    raise exception 'The campaign GM or an owner of both warbands must record the capture outcome' using errcode='42501';
  end if;
  if coalesce(btrim(p_reason),'')='' then raise exception 'Record the agreed contents-only outcome'; end if;
  if not exists(select 1 from public.match_reports where match_id=c.match_id and warband_id=c.captor_id and result='won' and undo is not null) then
    raise exception 'The capturing warband must file its winning battle report before settlement';
  end if;
  for w in select * from public.warbands where id in(c.merchant_id,c.captor_id) order by id for update loop
    if (w.id=c.merchant_id and w.updated_at is distinct from p_merchant_updated)
      or (w.id=c.captor_id and w.updated_at is distinct from p_captor_updated) then
      raise exception 'A warband changed; reload and review the capture outcome';
    end if;
  end loop;
  perform set_config('stirheim.audit_reason','Trade Wagon contents stolen; empty wagon and two draft horses returned to the Merchant: '||btrim(p_reason),true);
  for entry in select * from jsonb_array_elements(c.snapshot->'cargo'->'items') loop
    if exists(select 1 from public.items where id=(entry->>'id')::uuid) then raise exception 'A reserved cargo item identity is already in use'; end if;
    received:=entry||jsonb_build_object('warband_id',c.captor_id,'holder_type','stash','holder_id',null);
    insert into public.items select * from jsonb_populate_record(null::public.items,received);
  end loop;
  original:=c.snapshot->'wagon'->'expected'; wagon_id:=(original->>'id')::uuid;
  if c.snapshot->'wagon'->>'kind'='item' then
    if exists(select 1 from public.items where id=wagon_id) then raise exception 'A reserved wagon item identity is already in use'; end if;
    insert into public.items select * from jsonb_populate_record(null::public.items,original);
  else
    select to_jsonb(g) into current_row from public.henchman_groups g where id=wagon_id for update;
    if current_row-'updated_at' is distinct from (original||jsonb_build_object('size',0))-'updated_at'
      or exists(select 1 from public.items where holder_type='group' and holder_id=wagon_id) then
      raise exception 'The reserved Trade Wagon changed; reconcile it before returning the empty wagon';
    end if;
    update public.henchman_groups set size=(original->>'size')::integer where id=wagon_id;
    select to_jsonb(g) into after_group from public.henchman_groups g where id=wagon_id;
  end if;
  update public.warbands set wyrdstone=wyrdstone+(c.snapshot->'cargo'->>'wyrdstone')::integer where id=c.captor_id;
  select coalesce(jsonb_agg(to_jsonb(i) order by id),'[]'::jsonb) into after_items from public.items i
    where id=wagon_id or id in(select (x->>'id')::uuid from jsonb_array_elements(c.snapshot->'cargo'->'items') x);
  select jsonb_agg(jsonb_build_object('id',id,'gold',gold,'wyrdstone',wyrdstone) order by id) into after_bands
    from public.warbands where id in(c.merchant_id,c.captor_id);
  update public.trade_wagon_captures set state='settled',settlement=jsonb_build_object('kind','loot','empty_wagon','returned','after_group',after_group,'reason',btrim(p_reason),'recorded_by',auth.uid(),'recorded_at',now(),'after_items',after_items,'after_warbands',after_bands)
    where report_id=p_report_id;
end;
$$;
revoke all on function public.loot_captured_trade_wagon(uuid,timestamptz,timestamptz,text) from public;
grant execute on function public.loot_captured_trade_wagon(uuid,timestamptz,timestamptz,text) to authenticated;

create or replace function public.undo_looted_trade_wagon(p_report_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare c public.trade_wagon_captures%rowtype; entry jsonb; current_row jsonb;
begin
  perform 1 from public.matches where id=(select match_id from public.trade_wagon_captures where report_id=p_report_id) for update;
  select * into c from public.trade_wagon_captures where report_id=p_report_id for update;
  if c.report_id is null or c.state<>'settled' or c.settlement->>'kind'<>'loot' then raise exception 'There is no looted Trade Wagon outcome to undo'; end if;
  if not public.can_edit_warband(c.merchant_id) or not public.can_edit_warband(c.captor_id) then
    raise exception 'The campaign GM or an owner of both warbands must undo this capture outcome' using errcode='42501';
  end if;
  if coalesce(btrim(p_reason),'')='' then raise exception 'Explain why the capture outcome is being undone'; end if;
  perform 1 from public.warbands where id in(c.merchant_id,c.captor_id) order by id for update;
  for entry in select * from jsonb_array_elements(c.settlement->'after_warbands') loop
    if not exists(select 1 from public.warbands where id=(entry->>'id')::uuid and gold=(entry->>'gold')::integer and wyrdstone=(entry->>'wyrdstone')::integer) then
      raise exception 'A treasury changed after the capture outcome; reverse later spending or rewards first';
    end if;
  end loop;
  perform 1 from public.items where id in(select (x->>'id')::uuid from jsonb_array_elements(c.settlement->'after_items') x) order by id for update;
  for entry in select * from jsonb_array_elements(c.settlement->'after_items') loop
    select to_jsonb(i) into current_row from public.items i where id=(entry->>'id')::uuid;
    if current_row-'updated_at' is distinct from entry-'updated_at' then raise exception 'Captured equipment changed; reconcile it before undoing'; end if;
  end loop;
  if c.snapshot->'wagon'->>'kind'='group' then
    select to_jsonb(g) into current_row from public.henchman_groups g where id=(c.snapshot->'wagon'->'expected'->>'id')::uuid for update;
    if current_row-'updated_at' is distinct from (c.settlement->'after_group')-'updated_at'
      or exists(select 1 from public.items where holder_type='group' and holder_id=(c.snapshot->'wagon'->'expected'->>'id')::uuid) then
      raise exception 'The returned Trade Wagon changed; reconcile it before undoing';
    end if;
  end if;
  perform set_config('stirheim.audit_reason','Trade Wagon contents-only outcome undone: '||btrim(p_reason),true);
  delete from public.items where id in(select (x->>'id')::uuid from jsonb_array_elements(c.settlement->'after_items') x);
  update public.warbands set wyrdstone=wyrdstone-(c.snapshot->'cargo'->>'wyrdstone')::integer where id=c.captor_id;
  if c.snapshot->'wagon'->>'kind'='group' then update public.henchman_groups set size=0 where id=(c.snapshot->'wagon'->'expected'->>'id')::uuid; end if;
  update public.trade_wagon_captures set state='pending',settlement=null where report_id=p_report_id;
end;
$$;
revoke all on function public.undo_looted_trade_wagon(uuid,text) from public;
grant execute on function public.undo_looted_trade_wagon(uuid,text) to authenticated;
