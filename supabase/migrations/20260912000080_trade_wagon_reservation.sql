-- Pending captures keep original cargo outside spendable inventory until an agreed settlement.
-- Report hooks and player settlement controls are added separately once their undo is complete.
create table public.trade_wagon_captures (
  report_id uuid primary key references public.match_reports(id) on delete restrict,
  match_id uuid not null references public.matches(id) on delete restrict,
  merchant_id uuid not null references public.warbands(id) on delete restrict,
  captor_id uuid not null references public.warbands(id) on delete restrict,
  snapshot jsonb not null,
  state text not null default 'pending' check (state in ('pending','settled')),
  settlement jsonb,
  created_at timestamptz not null default now(),
  unique(match_id,merchant_id),
  check(merchant_id<>captor_id)
);
alter table public.trade_wagon_captures enable row level security;
create policy trade_wagon_capture_read on public.trade_wagon_captures for select to authenticated
  using(public.can_read_warband(merchant_id) or public.can_read_warband(captor_id));
grant select on public.trade_wagon_captures to authenticated;

create or replace function public.reserve_trade_wagon_capture(p_report_id uuid,p_capture jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare merchant uuid; wagon_id uuid; wagon jsonb;
begin
  perform public.validate_trade_wagon_capture(p_report_id,p_capture);
  merchant:=(p_capture->>'merchant_id')::uuid;
  wagon:=p_capture->'wagon'; wagon_id:=(wagon->'expected'->>'id')::uuid;
  if wagon->>'kind'='group' and exists(select 1 from public.items where warband_id=merchant and holder_type='group' and holder_id=wagon_id) then
    raise exception 'Review equipment attached to the Trade Wagon before reserving its capture';
  end if;
  insert into public.trade_wagon_captures(report_id,match_id,merchant_id,captor_id,snapshot)
    values(p_report_id,(p_capture->>'match_id')::uuid,merchant,(p_capture->>'captor_id')::uuid,p_capture);
  delete from public.items where warband_id=merchant and id in
    (select (x->>'id')::uuid from jsonb_array_elements(p_capture->'cargo'->'items') x);
  if wagon->>'kind'='item' then
    delete from public.items where id=wagon_id and warband_id=merchant;
  else
    -- Keep the original group identity and any history; the zero-size wagon is unavailable.
    update public.henchman_groups set size=0 where id=wagon_id and warband_id=merchant;
  end if;
  update public.warbands set wyrdstone=wyrdstone-(p_capture->'cargo'->>'wyrdstone')::integer where id=merchant;
end;
$$;
revoke all on function public.reserve_trade_wagon_capture(uuid,jsonb) from public,authenticated;
grant execute on function public.reserve_trade_wagon_capture(uuid,jsonb) to service_role;

create or replace function public.release_trade_wagon_capture(p_report_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare capture public.trade_wagon_captures%rowtype; wagon jsonb; original jsonb; current_wagon jsonb; entry jsonb;
begin
  -- Match first, consistently with capture validation and subsequent settlement.
  perform 1 from public.matches where id=(select match_id from public.trade_wagon_captures where report_id=p_report_id) for update;
  select * into capture from public.trade_wagon_captures where report_id=p_report_id for update;
  if capture.report_id is null then return; end if;
  if capture.state<>'pending' then raise exception 'Undo the agreed Trade Wagon settlement before withdrawing its capture'; end if;
  perform 1 from public.warbands where id in (capture.merchant_id,capture.captor_id) order by id for update;
  wagon:=capture.snapshot->'wagon'; original:=wagon->'expected';
  if wagon->>'kind'='group' then
    select to_jsonb(g) into current_wagon from public.henchman_groups g where id=(original->>'id')::uuid for update;
    if current_wagon-'updated_at' is distinct from (original||jsonb_build_object('size',0))-'updated_at' then
      raise exception 'The reserved Trade Wagon changed; reconcile later edits before withdrawal';
    end if;
    update public.henchman_groups set size=(original->>'size')::integer where id=(original->>'id')::uuid;
  else
    if exists(select 1 from public.items where id=(original->>'id')::uuid) then raise exception 'A reserved wagon item identity is already in use'; end if;
    insert into public.items select * from jsonb_populate_record(null::public.items,original);
  end if;
  for entry in select * from jsonb_array_elements(capture.snapshot->'cargo'->'items') loop
    if exists(select 1 from public.items where id=(entry->>'id')::uuid) then raise exception 'A reserved cargo item identity is already in use'; end if;
    insert into public.items select * from jsonb_populate_record(null::public.items,entry);
  end loop;
  -- Add only the reserved treasure back; do not overwrite later exploration finds or gold.
  update public.warbands set wyrdstone=wyrdstone+(capture.snapshot->'cargo'->>'wyrdstone')::integer where id=capture.merchant_id;
  delete from public.trade_wagon_captures where report_id=p_report_id;
end;
$$;
revoke all on function public.release_trade_wagon_capture(uuid) from public,authenticated;
grant execute on function public.release_trade_wagon_capture(uuid) to service_role;
