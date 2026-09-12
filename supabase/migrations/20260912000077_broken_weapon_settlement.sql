-- Apply recorded weapon breaks through the existing reversible report item patches.
create or replace function public.validate_broken_weapons(p_report_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.match_reports%rowtype;
  entry jsonb;
  source_count integer;
  declared jsonb;
  stock public.items%rowtype;
  lost integer;
  distinct_copies integer;
  remaining integer;
  patch_count integer;
begin
  select * into r from public.match_reports where id = p_report_id;
  perform 1 from public.battle_events where match_id = r.match_id order by id for update;
  if coalesce((r.applied->>'weapon_loss_non_campaign')::boolean, false) then
    if not exists(select 1 from public.matches where id=r.match_id and scenario_rules_id='the_sword_of_the_herald') then
      raise exception 'This battle does not allow the non-campaign weapon-loss exception';
    end if;
    return;
  end if;
  declared := coalesce(r.applied->'broken_weapons', '[]'::jsonb);
  if jsonb_typeof(declared) <> 'array' then raise exception 'Review the recorded broken weapons'; end if;
  select count(*) into source_count from public.battle_events e
    cross join lateral jsonb_array_elements(coalesce(e.payload->'brokenWeapons','[]'::jsonb)) loss
    where e.match_id=r.match_id and e.reverted_at is null and loss->>'warbandId'=r.warband_id::text;
  if source_count <> jsonb_array_length(declared) then raise exception 'Include every recorded weapon break before filing the report'; end if;
  if source_count = 0 then return; end if;
  perform 1 from public.items where id in (select (x->>'itemId')::uuid from jsonb_array_elements(declared) x) order by id for update;
  for entry in select * from jsonb_array_elements(declared) loop
    if not exists(select 1 from public.battle_events e
      cross join lateral jsonb_array_elements(coalesce(e.payload->'brokenWeapons','[]'::jsonb)) loss
      where e.id=(entry->>'event_id')::uuid and e.match_id=r.match_id and e.reverted_at is null
        and loss=entry-'event_id' and loss->>'warbandId'=r.warband_id::text) then
      raise exception 'A weapon break changed or was reverted; review the battle log';
    end if;
    select * into stock from public.items where id=(entry->>'itemId')::uuid and warband_id=r.warband_id;
    if stock.id is null or stock.holder_id::text is distinct from entry->>'holderId'
      or stock.holder_type::text is distinct from entry->>'holderType'
      or stock.item_rules_id is distinct from entry->'expected'->>'item_rules_id'
      or stock.custom_name is distinct from entry->'expected'->>'custom_name'
      or stock.quantity is distinct from (entry->'expected'->>'quantity')::integer
      or coalesce(stock.notes,'') <> coalesce(entry->'expected'->>'notes','') then
      raise exception 'Broken weapon equipment changed; review the original carried copies before filing';
    end if;
    if (entry->>'quantity')::integer < 1 or (entry->>'copyIndex')::integer < 0
      or (entry->>'copyIndex')::integer + (entry->>'quantity')::integer > stock.quantity then
      raise exception 'The broken weapon quantity exceeds the carried copies';
    end if;
  end loop;
  for stock in select * from public.items where id in (select (x->>'itemId')::uuid from jsonb_array_elements(declared) x) loop
    select sum((x->>'quantity')::integer) into lost from jsonb_array_elements(declared) x where x->>'itemId'=stock.id::text;
    select count(distinct copy) into distinct_copies from jsonb_array_elements(declared) x
      cross join lateral generate_series((x->>'copyIndex')::integer, (x->>'copyIndex')::integer+(x->>'quantity')::integer-1) copy
      where x->>'itemId'=stock.id::text;
    if lost <> distinct_copies then raise exception 'The same weapon copy was broken more than once; correct the duplicate battle entry'; end if;
    if coalesce(r.applied->'remove_item_ids','[]'::jsonb) ? stock.id::text then
      remaining := 0;
    else
      select count(*), min((x->>'quantity')::integer) into patch_count, remaining
        from jsonb_array_elements(coalesce(r.applied->'item_patches','[]'::jsonb)) x where x->>'id'=stock.id::text;
      if patch_count <> 1 or remaining is null then raise exception 'Remove the broken copies in the report equipment changes'; end if;
    end if;
    if remaining < 0 or remaining > stock.quantity-lost then raise exception 'The report retains a broken weapon copy'; end if;
  end loop;
end;
$$;
revoke all on function public.validate_broken_weapons(uuid) from public, authenticated;

-- Retain the current report implementation and all previously added scenario validators.
do $migration$
declare definition text; changed text;
begin
  select pg_get_functiondef('public.apply_battle_report(uuid)'::regprocedure) into definition;
  if strpos(definition, 'perform public.validate_broken_weapons(v_report.id);')=0 then
    changed := replace(definition, 'perform public.validate_lycanthrope_equipment(v_report.id);',
      'perform public.validate_broken_weapons(v_report.id);' || chr(10) || '  perform public.validate_lycanthrope_equipment(v_report.id);');
    if changed=definition then raise exception 'Could not locate the report validation insertion point'; end if;
    execute changed;
  end if;
end;
$migration$;

create or replace function public.guard_settled_weapon_break_reversal()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.reverted_at is null and new.reverted_at is not null and exists(
    select 1 from public.match_reports r
      cross join lateral jsonb_array_elements(coalesce(r.applied->'broken_weapons','[]'::jsonb)) loss
      where r.match_id=old.match_id and r.undo is not null and loss->>'event_id'=old.id::text
  ) then
    raise exception 'Withdraw the affected post-battle report before reverting this weapon break';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_settled_weapon_break_reversal() from public, authenticated;
create trigger guard_settled_weapon_break_reversal before update of reverted_at on public.battle_events
  for each row execute function public.guard_settled_weapon_break_reversal();
