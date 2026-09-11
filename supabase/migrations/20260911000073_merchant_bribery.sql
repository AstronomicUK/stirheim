-- Bribery receipts live outside the autosaved battle sheet: a stale phone cannot erase payment.
-- The player confirms the tabletop count; the server validates access, skill, treasury and retries.
create table public.battle_bribes (
 id uuid primary key,
 match_id uuid not null references public.matches(id) on delete cascade,
 warband_id uuid not null references public.warbands(id) on delete cascade,
 merchant_id uuid not null,
 merchant_name text not null,
 actor_id uuid not null references public.profiles(user_id),
 non_heroes integer not null check(non_heroes between 1 and 1000),
 amount integer not null check(amount=5*non_heroes),
 declared_casualties numeric not null,
 declared_threshold integer not null,
 round integer not null check(round>=0),
 gold_before integer not null,
 exclusions_before integer not null,
 at timestamptz not null default now()
);
alter table public.battle_bribes enable row level security;
create policy battle_bribes_read on public.battle_bribes for select to authenticated
 using(public.can_read_campaign(public.match_campaign(match_id)));
grant select on public.battle_bribes to authenticated;
alter publication supabase_realtime add table public.battle_bribes;

create function public.pay_merchant_bribery(p_id uuid,p_match_id uuid,p_warband_id uuid,p_merchant_id uuid,
 p_non_heroes integer,p_casualties numeric,p_threshold integer,p_round integer,p_expected_gold integer,p_expected_exclusions integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.matches%rowtype; w public.warbands%rowtype; h public.heroes%rowtype;
 old public.battle_bribes%rowtype; result public.battle_bribes%rowtype; n integer;
begin
 select * into m from public.matches where id=p_match_id for update;
 if m.id is null or not public.may_act_for_warband(p_match_id,p_warband_id) then
  raise exception 'Only this warband owner or the GM may pay Bribery' using errcode='42501';
 end if;
 select * into old from public.battle_bribes where id=p_id;
 if old.id is not null then
  if old.match_id=p_match_id and old.warband_id=p_warband_id and old.merchant_id=p_merchant_id
   and old.non_heroes=p_non_heroes and old.declared_casualties=p_casualties and old.declared_threshold=p_threshold
   and old.round=p_round and old.gold_before=p_expected_gold and old.exclusions_before=p_expected_exclusions then return to_jsonb(old); end if;
  raise exception 'This payment reference was already used with different details';
 end if;
 if m.state<>'in_progress' then raise exception 'Bribery is only available during an active battle'; end if;
 if p_non_heroes is null or p_non_heroes not between 1 and 1000 or p_casualties is null or p_casualties not between 1 and 1000
  or p_threshold is null or p_threshold not between 1 and 1000 or p_round is null or p_round<0 then
  raise exception 'Confirm the remaining non-Hero count and Rout requirement before paying';
 end if;
 select * into h from public.heroes where id=p_merchant_id and warband_id=p_warband_id;
 if h.id is null or h.is_hired_sword or h.status<>'active' or not ('merchant_caravans_skills_bribery'=any(h.skills)) then
  raise exception 'An active Hero with the learned Bribery skill is required';
 end if;
 select * into w from public.warbands where id=p_warband_id for update;
 select count(*) into n from public.battle_bribes where match_id=p_match_id and warband_id=p_warband_id;
 if w.gold is distinct from p_expected_gold or n is distinct from p_expected_exclusions then
  raise exception 'The treasury or previous Bribery payments changed; review the updated cost';
 end if;
 if p_casualties-n<p_threshold then raise exception 'The confirmed casualties no longer require a Rout test'; end if;
 if w.gold<5*p_non_heroes then raise exception 'Not enough gold to pay all remaining non-Hero members'; end if;
 perform set_config('stirheim.audit_reason',format('Bribery: paid %s gc for %s remaining non-Hero members; one casualty excluded from Rout tests',5*p_non_heroes,p_non_heroes),true);
 update public.warbands set gold=gold-5*p_non_heroes where id=p_warband_id;
 insert into public.battle_bribes(id,match_id,warband_id,merchant_id,merchant_name,actor_id,non_heroes,amount,declared_casualties,declared_threshold,round,gold_before,exclusions_before)
 values(p_id,p_match_id,p_warband_id,h.id,h.name,auth.uid(),p_non_heroes,5*p_non_heroes,p_casualties,p_threshold,p_round,w.gold,n)
 returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.pay_merchant_bribery(uuid,uuid,uuid,uuid,integer,numeric,integer,integer,integer,integer) from public;
grant execute on function public.pay_merchant_bribery(uuid,uuid,uuid,uuid,integer,numeric,integer,integer,integer,integer) to authenticated;
