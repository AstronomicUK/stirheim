-- Private pre-battle cargo declarations. Resources remain visible on the roster to avoid revealing a loaded wagon,
-- but are reserved against spending until the battle is cancelled or the reward is settled.
create table public.rawhide_cargo (
  match_id uuid primary key references public.matches(id) on delete cascade,
  warband_id uuid not null references public.warbands(id) on delete cascade,
  wagon integer check(wagon between 1 and 4),
  gold integer not null check(gold>=0),
  wyrdstone integer not null check(wyrdstone>=0),
  sale_value integer not null check(sale_value>=0),
  valuation_note text not null default '',
  rounding text not null check(rounding in ('up','down')),
  declared_at timestamptz not null default now(),
  reserved_at timestamptz,
  settled_report_id uuid references public.match_reports(id),
  check(wagon is not null or (gold=0 and wyrdstone=0 and sale_value=0))
);
alter table public.rawhide_cargo enable row level security;
revoke all on public.rawhide_cargo from public,anon,authenticated;
create index rawhide_cargo_warband_idx on public.rawhide_cargo(warband_id);

create or replace function public.get_rawhide_cargo(p_match_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c public.rawhide_cargo%rowtype; state public.match_state; revealed boolean;
begin
  if not public.is_match_participant(p_match_id) and not public.is_campaign_gm(public.match_campaign(p_match_id)) then raise exception 'Only battle participants or the GM can read its cargo status' using errcode='42501'; end if;
  select * into c from public.rawhide_cargo where match_id=p_match_id;
  if c.match_id is null then return jsonb_build_object('declared',false); end if;
  select m.state into state from public.matches m where id=p_match_id;
  revealed:=state in ('awaiting_reports','completed') or exists(select 1 from public.warbands w where w.id=c.warband_id and w.owner_id=auth.uid());
  return jsonb_build_object('declared',true,'warband_id',c.warband_id,'revealed',revealed,'locked',c.reserved_at is not null)
    || case when revealed then to_jsonb(c)-'match_id'-'warband_id' else '{}'::jsonb end;
end; $$;
revoke all on function public.get_rawhide_cargo(uuid) from public;
grant execute on function public.get_rawhide_cargo(uuid) to authenticated;

create or replace function public.set_rawhide_cargo(p_match_id uuid,p_warband_id uuid,p_wagon integer default null,p_sale_value integer default 0,p_valuation_note text default '',p_rounding text default 'down')
returns void language plpgsql volatile security definer set search_path='' as $$
declare m public.matches%rowtype; w public.warbands%rowtype; c public.rawhide_cargo%rowtype;
begin
  select * into m from public.matches where id=p_match_id for update;
  if m.id is null or m.scenario_rules_id is distinct from 'rawhide' or m.state<>'scheduled' then raise exception 'Rawhide cargo must be declared before the battle starts'; end if;
  select * into w from public.warbands where id=p_warband_id for update;
  if w.id is null or w.owner_id is distinct from auth.uid() or not exists(select 1 from public.match_participants mp where mp.match_id=p_match_id and mp.warband_id=p_warband_id) then raise exception 'Only the participating warband owner may declare its private cargo' using errcode='42501'; end if;
  select * into c from public.rawhide_cargo where match_id=p_match_id;
  if c.match_id is not null and (c.reserved_at is not null or not exists(select 1 from public.warbands old where old.id=c.warband_id and old.owner_id=auth.uid())) then raise exception 'Another player has already declared the merchant’s cargo'; end if;
  if p_rounding is null or p_rounding not in ('up','down') or (p_wagon is not null and (p_wagon<1 or p_wagon>4)) then raise exception 'Choose one of four wagons and a whole-gold rounding rule'; end if;
  if w.type_rules_id<>'mercenaries_marienburg' and coalesce(btrim(p_valuation_note),'')='' then raise exception 'Record the agreed exception for a merchant other than Marienburgers'; end if;
  if p_wagon is not null and (p_sale_value is null or p_sale_value<w.gold or (w.wyrdstone=0 and p_sale_value<>w.gold) or coalesce(btrim(p_valuation_note),'')='') then raise exception 'Record the cargo’s full gold value, including its gold coins, and the agreed wyrdstone valuation'; end if;
  insert into public.rawhide_cargo(match_id,warband_id,wagon,gold,wyrdstone,sale_value,valuation_note,rounding)
  values(p_match_id,p_warband_id,p_wagon,case when p_wagon is null then 0 else w.gold end,case when p_wagon is null then 0 else w.wyrdstone end,case when p_wagon is null then 0 else p_sale_value end,coalesce(btrim(p_valuation_note),''),p_rounding)
  on conflict(match_id) do update set warband_id=excluded.warband_id,wagon=excluded.wagon,gold=excluded.gold,wyrdstone=excluded.wyrdstone,sale_value=excluded.sale_value,valuation_note=excluded.valuation_note,rounding=excluded.rounding,declared_at=now();
end; $$;
revoke all on function public.set_rawhide_cargo(uuid,uuid,integer,integer,text,text) from public;
grant execute on function public.set_rawhide_cargo(uuid,uuid,integer,integer,text,text) to authenticated;

create or replace function public.reserve_rawhide_cargo()
returns trigger language plpgsql volatile security definer set search_path='' as $$
declare c public.rawhide_cargo%rowtype; w public.warbands%rowtype; reserved_gold bigint; reserved_shards bigint;
begin
  if new.scenario_rules_id is distinct from 'rawhide' or old.state<>'scheduled' or new.state<>'in_progress' then return new; end if;
  select * into c from public.rawhide_cargo where match_id=new.id for update;
  if c.match_id is null then raise exception 'The merchant must privately declare Rawhide cargo before starting'; end if;
  if not exists(select 1 from public.match_participants mp where mp.match_id=new.id and mp.warband_id=c.warband_id) then raise exception 'The declared Rawhide merchant is no longer participating'; end if;
  select * into w from public.warbands where id=c.warband_id for update;
  if c.wagon is not null then
    if c.gold<>w.gold or c.wyrdstone<>w.wyrdstone then raise exception 'The merchant’s treasury changed; review the private cargo declaration before starting'; end if;
    select coalesce(sum(r.gold),0),coalesce(sum(r.wyrdstone),0) into reserved_gold,reserved_shards from public.rawhide_cargo r join public.matches m on m.id=r.match_id where r.warband_id=w.id and r.match_id<>new.id and r.reserved_at is not null and r.settled_report_id is null and m.state in ('in_progress','awaiting_reports');
    if reserved_gold+c.gold>w.gold or reserved_shards+c.wyrdstone>w.wyrdstone then raise exception 'These resources are already committed to another Rawhide battle'; end if;
  end if;
  update public.rawhide_cargo set reserved_at=now() where match_id=new.id;
  return new;
end; $$;
revoke all on function public.reserve_rawhide_cargo() from public,authenticated;
create trigger reserve_rawhide_cargo_before_start before update of state on public.matches for each row execute function public.reserve_rawhide_cargo();

create or replace function public.protect_rawhide_reserves()
returns trigger language plpgsql volatile security definer set search_path='' as $$
declare reserved_gold bigint; reserved_shards bigint;
begin
  select coalesce(sum(c.gold),0),coalesce(sum(c.wyrdstone),0) into reserved_gold,reserved_shards from public.rawhide_cargo c join public.matches m on m.id=c.match_id where c.warband_id=new.id and c.reserved_at is not null and c.settled_report_id is null and m.state in ('in_progress','awaiting_reports');
  if new.gold<reserved_gold or new.wyrdstone<reserved_shards then raise exception 'These resources are committed to Rawhide cargo until that battle is resolved'; end if;
  return new;
end; $$;
revoke all on function public.protect_rawhide_reserves() from public,authenticated;
create trigger protect_rawhide_reserved_resources before update of gold,wyrdstone on public.warbands for each row execute function public.protect_rawhide_reserves();
