-- #61/#74: one named Staff of Light attempt per shared player turn.
-- Keep this outside individual warband sheets so another caster/device cannot spend it twice.
create table public.battle_dispels (
 id uuid primary key,
 match_id uuid not null references public.matches(id) on delete cascade,
 actor_id uuid not null references public.profiles(user_id),
 caster_warband_id uuid not null references public.warbands(id),
 source_warband_id uuid not null references public.warbands(id),
 source_hero_id uuid not null,
 source_name text not null,
 source_id text not null check(source_id='staff_of_light'),
 round integer not null check(round>0),
 active_warband_id uuid not null,
 spell_name text not null,
 roll integer not null check(roll between 1 and 6),
 manual boolean not null,
 at timestamptz not null default now(),
 unique(match_id,round,active_warband_id,source_hero_id,source_id)
);
alter table public.battle_dispels enable row level security;
create policy battle_dispels_read on public.battle_dispels for select to authenticated
 using(public.can_read_campaign(public.match_campaign(match_id)));
grant select on public.battle_dispels to authenticated;
alter publication supabase_realtime add table public.battle_dispels;

create function public.record_staff_dispel(p_id uuid,p_match_id uuid,p_caster_warband_id uuid,
 p_source_hero_id uuid,p_round integer,p_active_warband_id uuid,p_spell_name text,p_roll integer,p_manual boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 m public.matches%rowtype; t public.battle_turns%rowtype; h public.heroes%rowtype;
 old public.battle_dispels%rowtype; result public.battle_dispels%rowtype;
begin
 select * into m from public.matches where id=p_match_id for update;
 if m.id is null or not public.may_act_for_warband(p_match_id,p_caster_warband_id) then
  raise exception 'Only the casting player or GM may record this dispel' using errcode='42501';
 end if;
 -- An exact retry returns its original outcome, including after the turn moves on.
 select * into old from public.battle_dispels where id=p_id;
 if old.id is not null then
  if old.match_id=p_match_id and old.caster_warband_id=p_caster_warband_id and
     old.source_hero_id=p_source_hero_id and old.round=p_round and old.active_warband_id=p_active_warband_id and
     old.spell_name=trim(p_spell_name) and old.roll=p_roll and old.manual=p_manual then return to_jsonb(old); end if;
  raise exception 'This attempt was already recorded with different details';
 end if;
 if m.state<>'in_progress' or m.combat_mode<>'app' then raise exception 'Dispelling requires an App Calculates battle in progress'; end if;
 select * into t from public.battle_turns where match_id=p_match_id for update;
 if t.match_id is null then raise exception 'Set the shared turn order before using the Staff of Light'; end if;
 if t.finished or t.round is distinct from p_round or t.turn_order[t.active_index+1] is distinct from p_active_warband_id
    or p_caster_warband_id is distinct from p_active_warband_id then
  raise exception 'The active turn changed; refresh before attempting this dispel';
 end if;
 if p_roll is null or p_roll<1 or p_roll>6 or p_manual is null or nullif(trim(p_spell_name),'') is null or length(p_spell_name)>200 then
  raise exception 'Provide the spell name and a D6 result';
 end if;
 select * into h from public.heroes where id=p_source_hero_id and status='active';
 if h.id is null or h.warband_id=p_caster_warband_id or not exists(
  select 1 from public.match_participants where match_id=p_match_id and warband_id=h.warband_id
 ) then raise exception 'Choose an active opposing staff bearer in this battle'; end if;
 if not exists(select 1 from public.items i where i.holder_id=h.id and i.holder_type='hero' and i.warband_id=h.warband_id and i.quantity>0 and (
  i.item_rules_id='staff_of_light' or
  (i.item_rules_id is null and lower(trim(i.custom_name))='staff of light') or
  (h.hired_sword_rules_id='truthsayer' and i.item_rules_id='halberd' and i.notes like 'Staff of Light:%')
 )) then raise exception 'This warrior no longer carries the Staff of Light'; end if;
 if exists(select 1 from public.battle_dispels where match_id=p_match_id and round=p_round and
  active_warband_id=p_active_warband_id and source_hero_id=h.id and source_id='staff_of_light') then
  raise exception 'This Staff of Light has already attempted a dispel this turn';
 end if;
 insert into public.battle_dispels(id,match_id,actor_id,caster_warband_id,source_warband_id,source_hero_id,
  source_name,source_id,round,active_warband_id,spell_name,roll,manual)
 values(p_id,p_match_id,auth.uid(),p_caster_warband_id,h.warband_id,h.id,h.name,'staff_of_light',p_round,p_active_warband_id,trim(p_spell_name),p_roll,p_manual)
 returning * into result;
 return to_jsonb(result);
end;
$$;
revoke all on function public.record_staff_dispel(uuid,uuid,uuid,uuid,integer,uuid,text,integer,boolean) from public;
grant execute on function public.record_staff_dispel(uuid,uuid,uuid,uuid,integer,uuid,text,integer,boolean) to authenticated;
