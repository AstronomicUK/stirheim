-- The GM records the receiving warband's vehicle eligibility explicitly.
-- Captured cargo keeps its identity; a group-form wagon becomes ordinary vehicle equipment.
create or replace function public.keep_captured_trade_wagon(p_report_id uuid,p_vehicle text,p_vehicle_allowed boolean,p_merchant_updated timestamptz,p_captor_updated timestamptz,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare c public.trade_wagon_captures%rowtype; w record; entry jsonb; received jsonb; wagon_id uuid; after_items jsonb; after_bands jsonb;
begin
  perform 1 from public.matches where id=(select match_id from public.trade_wagon_captures where report_id=p_report_id) for update;
  select * into c from public.trade_wagon_captures where report_id=p_report_id for update;
  if c.report_id is null or c.state<>'pending' then raise exception 'This Trade Wagon capture is no longer awaiting an outcome'; end if;
  if not public.can_edit_warband(c.merchant_id) or not public.can_edit_warband(c.captor_id) then
    raise exception 'The campaign GM or an owner of both warbands must record the capture outcome' using errcode='42501';
  end if;
  if p_vehicle is null or p_vehicle not in ('wagon','stagecoach') or p_vehicle_allowed is distinct from true or coalesce(btrim(p_reason),'')='' then
    raise exception 'Confirm that the capturing warband may keep this Wagon or Stage Coach and record the reason';
  end if;
  if not exists(select 1 from public.match_reports where match_id=c.match_id and warband_id=c.captor_id and result='won' and undo is not null) then
    raise exception 'The capturing warband must file its winning battle report before settlement';
  end if;
  for w in select * from public.warbands where id in(c.merchant_id,c.captor_id) order by id for update loop
    if (w.id=c.merchant_id and w.updated_at is distinct from p_merchant_updated)
      or (w.id=c.captor_id and w.updated_at is distinct from p_captor_updated) then
      raise exception 'A warband changed; reload and review the capture outcome';
    end if;
  end loop;
  perform set_config('stirheim.audit_reason','Captured Trade Wagon and cargo kept as '||p_vehicle||': '||btrim(p_reason),true);
  for entry in select * from jsonb_array_elements(c.snapshot->'cargo'->'items') loop
    if exists(select 1 from public.items where id=(entry->>'id')::uuid) then raise exception 'A reserved cargo item identity is already in use'; end if;
    received:=entry||jsonb_build_object('warband_id',c.captor_id,'holder_type','stash','holder_id',null);
    insert into public.items select * from jsonb_populate_record(null::public.items,received);
  end loop;
  if c.snapshot->'wagon'->>'kind'='item' then
    wagon_id:=(c.snapshot->'wagon'->'expected'->>'id')::uuid;
  else
    wagon_id:=gen_random_uuid();
  end if;
  if exists(select 1 from public.items where id=wagon_id) then raise exception 'A reserved wagon item identity is already in use'; end if;
  insert into public.items(id,warband_id,holder_type,item_rules_id,custom_name,quantity,notes)
    values(wagon_id,c.captor_id,'stash','wagon_stagecoach',case when p_vehicle='wagon' then 'Captured Wagon' else 'Captured Stage Coach' end,1,
      'Includes two draft horses from the captured Trade Wagon.'||case when coalesce(c.snapshot->'wagon'->'expected'->>'notes','')<>'' then ' Original notes: '||(c.snapshot->'wagon'->'expected'->>'notes') else '' end);
  update public.warbands set wyrdstone=wyrdstone+(c.snapshot->'cargo'->>'wyrdstone')::integer where id=c.captor_id;
  select coalesce(jsonb_agg(to_jsonb(i) order by id),'[]'::jsonb) into after_items from public.items i
    where id=wagon_id or id in(select (x->>'id')::uuid from jsonb_array_elements(c.snapshot->'cargo'->'items') x);
  select jsonb_agg(jsonb_build_object('id',id,'gold',gold,'wyrdstone',wyrdstone) order by id) into after_bands
    from public.warbands where id in(c.merchant_id,c.captor_id);
  update public.trade_wagon_captures set state='settled',settlement=jsonb_build_object('kind','keep','vehicle',p_vehicle,
    'vehicle_allowed',true,'reason',btrim(p_reason),'recorded_by',auth.uid(),'recorded_at',now(),'after_items',after_items,'after_warbands',after_bands)
    where report_id=p_report_id;
end;
$$;
revoke all on function public.keep_captured_trade_wagon(uuid,text,boolean,timestamptz,timestamptz,text) from public;
grant execute on function public.keep_captured_trade_wagon(uuid,text,boolean,timestamptz,timestamptz,text) to authenticated;

create or replace function public.undo_kept_trade_wagon(p_report_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare c public.trade_wagon_captures%rowtype; entry jsonb; current_row jsonb;
begin
  perform 1 from public.matches where id=(select match_id from public.trade_wagon_captures where report_id=p_report_id) for update;
  select * into c from public.trade_wagon_captures where report_id=p_report_id for update;
  if c.report_id is null or c.state<>'settled' or c.settlement->>'kind'<>'keep' then raise exception 'There is no kept Trade Wagon outcome to undo'; end if;
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
  perform set_config('stirheim.audit_reason','Kept Trade Wagon outcome undone: '||btrim(p_reason),true);
  delete from public.items where id in(select (x->>'id')::uuid from jsonb_array_elements(c.settlement->'after_items') x);
  update public.warbands set wyrdstone=wyrdstone-(c.snapshot->'cargo'->>'wyrdstone')::integer where id=c.captor_id;
  update public.trade_wagon_captures set state='pending',settlement=null where report_id=p_report_id;
end;
$$;
revoke all on function public.undo_kept_trade_wagon(uuid,text) from public;
grant execute on function public.undo_kept_trade_wagon(uuid,text) to authenticated;
