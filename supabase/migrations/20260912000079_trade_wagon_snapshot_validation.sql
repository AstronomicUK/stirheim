-- Capture-time validation only. The settlement ledger will call this before reserving cargo.
-- This migration does not yet attach capture transfers to report application.
create or replace function public.validate_trade_wagon_capture(p_report_id uuid, p_capture jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.match_reports%rowtype;
  wagon jsonb;
  original jsonb;
  cargo jsonb;
  entry jsonb;
  merchant uuid;
  captor uuid;
  wagon_id uuid;
  stock_count integer;
  current_shards integer;
begin
  select * into r from public.match_reports where id=p_report_id;
  if r.id is null then raise exception 'The source battle report was not found'; end if;
  merchant:=(p_capture->>'merchant_id')::uuid;
  captor:=(p_capture->>'captor_id')::uuid;
  if merchant is distinct from r.warband_id or (p_capture->>'match_id')::uuid is distinct from r.match_id
    or captor is null or captor=merchant then raise exception 'Review the Merchant Caravan and capturing warband'; end if;
  perform 1 from public.matches where id=r.match_id and state in ('awaiting_reports','completed') for update;
  if not found then raise exception 'End the battle before recording Trade Wagon capture'; end if;
  if not exists(select 1 from public.match_participants where match_id=r.match_id and warband_id=captor and accepted_at is not null)
    or not exists(select 1 from public.match_participants where match_id=r.match_id and warband_id=merchant and accepted_at is not null) then
    raise exception 'Both warbands must be participants in the source battle';
  end if;
  -- A not-yet-filed winning report is confirmed by the later settlement; a known losing result contradicts capture.
  if exists(select 1 from public.match_reports where match_id=r.match_id and warband_id=captor and result<>'won') then
    raise exception 'The capturing warband did not win this battle';
  end if;
  if not r.routed or (p_capture->>'failed_rout')::boolean is distinct from true
    or (p_capture->>'driver_present')::boolean is distinct from false then
    raise exception 'Capture requires a failed Rout test with no Trade Wagon driver';
  end if;
  if jsonb_typeof(p_capture->'merchant_all_ooa') is distinct from 'boolean'
    or (p_capture->>'rare_search_blocked')::boolean is distinct from not (p_capture->>'merchant_all_ooa')::boolean then
    raise exception 'Review the captor rare-item search restriction';
  end if;
  perform 1 from public.warbands where id in (merchant,captor) order by id for update;
  select wyrdstone into current_shards from public.warbands where id=merchant and type_rules_id='merchant_caravans';
  if not found then raise exception 'This is not a Merchant Caravan'; end if;
  wagon:=p_capture->'wagon'; wagon_id:=(wagon->'expected'->>'id')::uuid;
  if wagon->>'kind'='item' then
    select to_jsonb(i) into original from public.items i where id=wagon_id and warband_id=merchant and item_rules_id='trade_wagon' and quantity=1 for update;
  elsif wagon->>'kind'='group' then
    select to_jsonb(g) into original from public.henchman_groups g where id=wagon_id and warband_id=merchant and unit_type_rules_id='merchant_trade_wagon' and size=1 for update;
  end if;
  if original is null or original-'created_at'-'updated_at' is distinct from (wagon->'expected')-'created_at'-'updated_at' then
    raise exception 'The original Trade Wagon changed; review its capture snapshot';
  end if;
  cargo:=p_capture->'cargo';
  if jsonb_typeof(cargo->'items') is distinct from 'array' or cargo ? 'gold'
    or (cargo->>'wyrdstone')::integer is distinct from current_shards then
    raise exception 'Review the original stored cargo and wyrdstone; gold is not wagon cargo';
  end if;
  perform 1 from public.items where warband_id=merchant and holder_type='stash' order by id for update;
  select count(*) into stock_count from public.items where warband_id=merchant and holder_type='stash' and quantity>0
    and not (wagon->>'kind'='item' and id=wagon_id);
  if stock_count<>jsonb_array_length(cargo->'items') or stock_count<>(select count(distinct x->>'id') from jsonb_array_elements(cargo->'items') x) then
    raise exception 'Include each original stored cargo item exactly once';
  end if;
  for entry in select * from jsonb_array_elements(cargo->'items') loop
    if not exists(select 1 from public.items i where id=(entry->>'id')::uuid and warband_id=merchant and holder_type='stash' and quantity>0
      and not (wagon->>'kind'='item' and id=wagon_id)
      and to_jsonb(i)-'created_at'-'updated_at'=entry-'created_at'-'updated_at') then
      raise exception 'Stored cargo changed or includes carried equipment; review the capture snapshot';
    end if;
  end loop;
end;
$$;
revoke all on function public.validate_trade_wagon_capture(uuid,jsonb) from public, authenticated;
grant execute on function public.validate_trade_wagon_capture(uuid,jsonb) to service_role;
