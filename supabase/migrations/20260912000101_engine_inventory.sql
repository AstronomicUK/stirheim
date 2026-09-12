-- Engine of Chaos: stable identity for every physical copy in inventory.
-- This is an inventory foundation, not the prisoner/dispatch implementation.
-- Custody must extend engine_inventory_locked before it is exposed to players.
create table public.engine_of_chaos_units (
 id uuid primary key default gen_random_uuid(),
 warband_id uuid not null references public.warbands(id) on delete cascade,
 inventory_item_id uuid references public.items(id) on delete set null,
 stock_index integer not null check(stock_index>=0),
 name text not null default 'Engine of Chaos' check(char_length(btrim(name)) between 1 and 80),
 state text not null default 'present' check(state in('present','away','retired')),
 history jsonb not null default '[]'::jsonb check(jsonb_typeof(history)='array'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(state='retired' or inventory_item_id is not null)
);
create unique index engine_inventory_copy on public.engine_of_chaos_units(inventory_item_id,stock_index) where state<>'retired';
create index engine_inventory_warband on public.engine_of_chaos_units(warband_id);
create trigger engine_units_updated_at before update on public.engine_of_chaos_units for each row execute function public.set_updated_at();
alter table public.engine_of_chaos_units enable row level security;
revoke all on public.engine_of_chaos_units from anon,authenticated;
grant select on public.engine_of_chaos_units to authenticated;
create policy engine_units_read on public.engine_of_chaos_units for select to authenticated using(public.can_read_warband(warband_id));

-- Single extension point for custody/journey locks. Future placement writers must
-- lock the stock row, then its engine rows in id order, matching inventory edits.
create function public.engine_inventory_locked(p_engine_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.engine_of_chaos_units where id=p_engine_id and state='away');
$$;
revoke all on function public.engine_inventory_locked(uuid) from public,authenticated;

create function public.guard_engine_inventory_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare unit public.engine_of_chaos_units%rowtype; remaining integer; reason text;
begin
 if old.item_rules_id is distinct from 'engine_of_chaos' then
  if tg_op='DELETE' then return old; else return new; end if;
 end if;
 remaining := case when tg_op='DELETE' then 0 when new.item_rules_id is distinct from 'engine_of_chaos' or new.warband_id<>old.warband_id then 0 else new.quantity end;
 reason := coalesce(nullif(current_setting('stirheim.audit_reason',true),''),'Removed from inventory');
 for unit in select * from public.engine_of_chaos_units where inventory_item_id=old.id and state<>'retired' order by id for update loop
  if unit.stock_index<remaining then continue; end if;
  -- A deliberate deletion of the entire parent warband already cascades its ledger.
  if exists(select 1 from public.warbands where id=old.warband_id) and public.engine_inventory_locked(unit.id) then
   raise exception '% is away or has unresolved custody. Resolve that state before removing this engine.',unit.name;
  end if;
  update public.engine_of_chaos_units set state='retired',inventory_item_id=null,
    history=history||jsonb_build_object('event','retired','at',now(),'by',auth.uid(),'reason',reason) where id=unit.id;
 end loop;
 if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.guard_engine_inventory_change() from public,authenticated;
create trigger guard_engine_inventory before update of quantity,item_rules_id,warband_id or delete on public.items
 for each row execute function public.guard_engine_inventory_change();

create function public.sync_engine_inventory() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if new.item_rules_id='engine_of_chaos' then
  insert into public.engine_of_chaos_units(warband_id,inventory_item_id,stock_index,history)
   select new.warband_id,new.id,n,jsonb_build_array(jsonb_build_object('event','added','at',now(),'by',auth.uid()))
   from generate_series(0,new.quantity-1) n
   where not exists(select 1 from public.engine_of_chaos_units e where e.inventory_item_id=new.id and e.stock_index=n and e.state<>'retired');
 end if;
 return new;
end;
$$;
revoke all on function public.sync_engine_inventory() from public,authenticated;
create trigger sync_engine_inventory after insert or update of quantity,item_rules_id,warband_id on public.items
 for each row execute function public.sync_engine_inventory();

insert into public.engine_of_chaos_units(warband_id,inventory_item_id,stock_index,history)
 select i.warband_id,i.id,n,jsonb_build_array(jsonb_build_object('event','existing_inventory','at',now()))
 from public.items i cross join lateral generate_series(0,i.quantity-1) n where i.item_rules_id='engine_of_chaos';

create function public.rename_engine(p_engine_id uuid,p_name text,p_expected_updated_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare unit public.engine_of_chaos_units%rowtype;
begin
 select * into unit from public.engine_of_chaos_units where id=p_engine_id;
 if not found or not public.can_edit_warband(unit.warband_id) then raise exception 'Only this warband’s player or campaign GM can rename the engine.' using errcode='42501'; end if;
 if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then raise exception 'Use an engine name from 1 to 80 characters.'; end if;
 perform id from public.items where id=unit.inventory_item_id for update;
 select * into unit from public.engine_of_chaos_units where id=p_engine_id for update;
 if unit.state='retired' then raise exception 'This engine has left the warband.'; end if;
 if unit.updated_at is distinct from p_expected_updated_at then raise exception 'The engine changed. Refresh its record before renaming it.' using errcode='40001'; end if;
 update public.engine_of_chaos_units set name=btrim(p_name),history=history||jsonb_build_object('event','renamed','at',now(),'by',auth.uid(),'from',unit.name,'to',btrim(p_name)) where id=unit.id;
end;
$$;
revoke all on function public.rename_engine(uuid,text,timestamptz) from public;
grant execute on function public.rename_engine(uuid,text,timestamptz) to authenticated;

-- Remove a selected empty physical copy, including a lower-index copy while a
-- different engine is away. This changes inventory only: no sale payment is invented.
create function public.remove_engine_copy(p_engine_id uuid,p_reason text,p_expected_updated_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare unit public.engine_of_chaos_units%rowtype; stock public.items%rowtype; later public.engine_of_chaos_units%rowtype;
begin
 select * into unit from public.engine_of_chaos_units where id=p_engine_id;
 if not found or not public.can_edit_warband(unit.warband_id) then raise exception 'Only this warband’s player or campaign GM can remove the engine.' using errcode='42501'; end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 5 and 2000 then raise exception 'Explain why this engine is leaving the inventory.'; end if;
 select * into stock from public.items where id=unit.inventory_item_id for update;
 perform id from public.engine_of_chaos_units where inventory_item_id=stock.id order by id for update;
 select * into unit from public.engine_of_chaos_units where id=p_engine_id;
 if stock.id is null or unit.state='retired' then raise exception 'This engine has already left the inventory.'; end if;
 if unit.updated_at is distinct from p_expected_updated_at then raise exception 'The engine changed. Refresh its record before removing it.' using errcode='40001'; end if;
 if public.engine_inventory_locked(unit.id) then raise exception 'This engine is away or has unresolved custody. Resolve that state first.'; end if;
 perform set_config('stirheim.audit_reason','Removed engine '||unit.name||': '||btrim(p_reason),true);
 update public.engine_of_chaos_units set state='retired',inventory_item_id=null,
  history=history||jsonb_build_object('event','retired','at',now(),'by',auth.uid(),'reason',btrim(p_reason)) where id=unit.id;
 -- Shift display/stock indices only; the surviving engines retain their own UUIDs,
 -- names and history. Ascending order avoids transient unique-index collisions.
 for later in select * from public.engine_of_chaos_units where inventory_item_id=stock.id and state<>'retired' and stock_index>unit.stock_index order by stock_index loop
  update public.engine_of_chaos_units set stock_index=stock_index-1 where id=later.id;
 end loop;
 if stock.quantity=1 then delete from public.items where id=stock.id;
 else update public.items set quantity=quantity-1 where id=stock.id; end if;
end;
$$;
revoke all on function public.remove_engine_copy(uuid,text,timestamptz) from public;
grant execute on function public.remove_engine_copy(uuid,text,timestamptz) to authenticated;
