-- Recovered and blessed equipment uses original intact stock, not newly found copies.
create or replace function public.validate_equipment_conversions(p_report_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.match_reports%rowtype;
  stock public.items%rowtype;
  award jsonb;
  converted integer;
  broken integer;
  remaining integer;
begin
  select * into r from public.match_reports where id=p_report_id;
  perform 1 from public.items where id in (
    select (x->>'source_item_id')::uuid
    from jsonb_array_elements(coalesce(r.applied->'awarded_items','[]'::jsonb)) x
    where x->>'source_item_id' is not null
  ) order by id for update;
  for award in select * from jsonb_array_elements(coalesce(r.applied->'awarded_items','[]'::jsonb)) x
    where x->>'source_item_id' is not null loop
    select * into stock from public.items where id=(award->>'source_item_id')::uuid and warband_id=r.warband_id;
    if stock.id is null or stock.item_rules_id is distinct from award->>'item_rules_id'
      or stock.custom_name is distinct from award->>'custom_name' then
      raise exception 'Recovered or blessed equipment must match an original owned item';
    end if;
    if r.applied->'shrine_equipment'->>'item_id' is distinct from stock.id::text
      and not exists(select 1 from jsonb_array_elements(coalesce(r.applied->'lycanthrope_equipment','[]'::jsonb)) x
        where x->>'item_id'=stock.id::text) then
      raise exception 'Review the original equipment before recovering or blessing it';
    end if;
    select coalesce(sum((x->>'quantity')::integer),0) into converted
      from jsonb_array_elements(coalesce(r.applied->'awarded_items','[]'::jsonb)) x
      where x->>'source_item_id'=stock.id::text;
    select coalesce(sum((x->>'quantity')::integer),0) into broken
      from jsonb_array_elements(coalesce(r.applied->'broken_weapons','[]'::jsonb)) x
      where x->>'itemId'=stock.id::text;
    if coalesce(r.applied->'remove_item_ids','[]'::jsonb) ? stock.id::text then
      remaining:=0;
    else
      select coalesce(min((x->>'quantity')::integer),stock.quantity) into remaining
        from jsonb_array_elements(coalesce(r.applied->'item_patches','[]'::jsonb)) x where x->>'id'=stock.id::text;
    end if;
    if (award->>'quantity')::integer<1 or remaining<0 or converted+broken+remaining>stock.quantity then
      raise exception 'Recovered or blessed equipment exceeds the intact original copies';
    end if;
  end loop;
end;
$$;
revoke all on function public.validate_equipment_conversions(uuid) from public, authenticated;

do $migration$
declare definition text; changed text;
begin
  select pg_get_functiondef('public.apply_battle_report(uuid)'::regprocedure) into definition;
  if strpos(definition,'perform public.validate_equipment_conversions(v_report.id);')=0 then
    changed:=replace(definition,'perform public.validate_broken_weapons(v_report.id);',
      'perform public.validate_broken_weapons(v_report.id);' || chr(10) || '  perform public.validate_equipment_conversions(v_report.id);');
    if changed=definition then raise exception 'Could not locate the equipment conversion validation insertion point'; end if;
    execute changed;
  end if;
end;
$migration$;
