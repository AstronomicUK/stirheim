-- Persistent, per-model Slaaneshi Man-Catcher holds. A hold is not an OOA casualty.
-- The source attack retains the dice; release and end confirmation retain table facts.
create table public.slaaneshi_holds (
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null references public.matches(id) on delete cascade,
 source_event_id uuid not null unique references public.battle_events(id) on delete cascade,
 wielder_warband_id uuid not null references public.warbands(id) on delete cascade,
 wielder_id uuid not null,
 target_warband_id uuid not null references public.warbands(id) on delete cascade,
 target_id uuid not null,
 target_kind text not null check(target_kind in ('hero','group')),
 target_model_index integer not null check(target_model_index>=0),
 target_name text not null,
 created_at timestamptz not null default clock_timestamp(),
 released_at timestamptz,
 released_by_event_id uuid references public.battle_events(id),
 release_reason text,
 confirmed_end_at timestamptz,
 history jsonb not null default '[]'::jsonb,
 check(wielder_warband_id<>target_warband_id)
);
create unique index slaaneshi_one_wielder on public.slaaneshi_holds(match_id,wielder_id) where released_at is null;
create unique index slaaneshi_one_target on public.slaaneshi_holds(match_id,target_id,target_model_index) where released_at is null;
alter table public.slaaneshi_holds enable row level security;
create policy slaaneshi_holds_read on public.slaaneshi_holds for select to authenticated using(public.can_read_campaign(public.match_campaign(match_id)));
grant select on public.slaaneshi_holds to authenticated;

create function public.record_slaaneshi_hold() returns trigger
language plpgsql security definer set search_path='' as $$
declare h public.heroes%rowtype; target_hero public.heroes%rowtype; target_group public.henchman_groups%rowtype; target_unit text; target_large boolean; ordinal numeric; weapon text; held public.slaaneshi_holds%rowtype;
begin
 if new.payload ? 'slaaneshi_lock' or exists(select 1 from public.slaaneshi_holds where match_id=new.match_id and released_at is null) then perform id from public.matches where id=new.match_id for update; end if;
 if new.payload ? 'slaaneshi_lock' then
  perform id from public.warbands where id::text in (new.payload->>'attacker_warband_id',new.payload->>'target_warband_id') order by id for update;
  if not exists(select 1 from public.matches where id=new.match_id and state='in_progress') then raise exception 'A new hold requires a battle in progress.'; end if;
  if lower(coalesce(new.payload->>'outcome',''))<>'knocked down' then raise exception 'A Man-Catcher hold knocks its target down.'; end if;
  if coalesce((new.payload->>'out_of_action')::boolean,false) or coalesce((new.payload->>'kill')::boolean,false) or coalesce((new.payload->>'wounds_lost')::integer,0)<1 then raise exception 'A Man-Catcher hold requires an unsaved wound, not an out-of-action kill.'; end if;
  select * into h from public.heroes where id::text=new.payload->>'attacker_id' and warband_id::text=new.payload->>'attacker_warband_id' for update;
  if h.id is null or h.status<>'active' or h.unit_type_rules_id<>'court_of_pleasures_whipmaster' or h.is_hired_sword then raise exception 'Only the Whipmaster can use the Slaaneshi Man-Catcher.'; end if;
  if not public.can_edit_warband(h.warband_id) and not public.is_campaign_gm(public.match_campaign(new.match_id)) then raise exception 'You cannot record this wielder''s hold.' using errcode='42501'; end if;
  weapon:=new.payload->'slaaneshi_lock'->>'weaponId';
  if weapon not in ('slaaneshi_man_catcher','gromril_slaaneshi_man_catcher','ithilmar_slaaneshi_man_catcher') or weapon is null or not exists(select 1 from public.items where warband_id=h.warband_id and holder_type='hero' and holder_id=h.id and item_rules_id=weapon and quantity>0) then raise exception 'The Whipmaster must carry the recorded Man-Catcher.'; end if;
  if jsonb_typeof(new.payload->'slaaneshi_lock'->'modelIndex') is distinct from 'number' then raise exception 'Choose the particular model held.'; end if;
  ordinal:=(new.payload->'slaaneshi_lock'->>'modelIndex')::numeric;
  if ordinal<>trunc(ordinal) or ordinal<0 then raise exception 'Choose a valid model number.'; end if;
  if new.payload->>'target_kind'='hero' then
   select * into target_hero from public.heroes where id::text=new.payload->>'target_id' and warband_id::text=new.payload->>'target_warband_id' and status='active' for update;
   if target_hero.id is null or ordinal<>0 then raise exception 'Choose an active enemy warrior.'; end if;
   target_unit:=public.capture_unit_key(target_hero.unit_type_rules_id,target_hero.is_hired_sword,target_hero.hired_sword_rules_id);target_large:=target_hero.is_large;
  elsif new.payload->>'target_kind'='group' then
   select * into target_group from public.henchman_groups where id::text=new.payload->>'target_id' and warband_id::text=new.payload->>'target_warband_id' for update;
   if target_group.id is null or ordinal>=target_group.size then raise exception 'Choose a model still in this group.'; end if;
   target_unit:=target_group.unit_type_rules_id;target_large:=target_group.is_large;
  else raise exception 'Choose an enemy warrior or individual henchman.';
  end if;
  if h.warband_id::text=new.payload->>'target_warband_id' or not exists(select 1 from public.match_participants where match_id=new.match_id and warband_id=h.warband_id) or not exists(select 1 from public.match_participants where match_id=new.match_id and warband_id::text=new.payload->>'target_warband_id') then raise exception 'Both warriors must be opposing participants in this battle.'; end if;
  if public.capture_unit_large(target_unit,target_large) or target_unit='companion_filly' then raise exception 'The Slaaneshi Man-Catcher cannot hold Large creatures or steeds.'; end if;
  insert into public.slaaneshi_holds(match_id,source_event_id,wielder_warband_id,wielder_id,target_warband_id,target_id,target_kind,target_model_index,target_name,history)
  values(new.match_id,new.id,h.warband_id,h.id,(new.payload->>'target_warband_id')::uuid,(new.payload->>'target_id')::uuid,new.payload->>'target_kind',ordinal::integer,new.payload->>'target_name',jsonb_build_array(jsonb_build_object('event','held','at',clock_timestamp(),'by',auth.uid())));
 end if;
 -- A Hero's OOA result identifies the exact model; a group needs an explicit model index.
 if coalesce((new.payload->>'out_of_action')::boolean,false) then
  for held in select * from public.slaaneshi_holds where match_id=new.match_id and released_at is null and
   (wielder_id::text=new.payload->>'target_id' or (target_id::text=new.payload->>'target_id' and (target_kind='hero' or target_model_index::text=new.payload->>'target_model_index'))) for update loop
   update public.slaaneshi_holds set released_at=clock_timestamp(),released_by_event_id=new.id,confirmed_end_at=null,release_reason=case when held.wielder_id::text=new.payload->>'target_id' then 'wielderOutOfAction' else 'targetOutOfAction' end,
   history=history||jsonb_build_array(jsonb_build_object('event','released','sourceEventId',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
  end loop;
 end if;
 return new;
end $$;
revoke all on function public.record_slaaneshi_hold() from public,authenticated;
create trigger record_slaaneshi_hold after insert on public.battle_events for each row execute function public.record_slaaneshi_hold();

create function public.slaaneshi_hold_action(p_hold_id uuid,p_action text,p_reason text default '') returns public.slaaneshi_holds
language plpgsql security definer set search_path='' as $$
declare held public.slaaneshi_holds%rowtype;
begin
 select * into held from public.slaaneshi_holds where id=p_hold_id;
 perform id from public.matches where id=held.match_id for update;
 select * into held from public.slaaneshi_holds where id=p_hold_id for update;
 if held.id is null then raise exception 'This hold is not available.'; end if;
 if not public.can_edit_warband(held.wielder_warband_id) and not public.can_edit_warband(held.target_warband_id) and not public.is_campaign_gm(public.match_campaign(held.match_id)) then raise exception 'Only the involved players or GM can resolve this hold.' using errcode='42501'; end if;
 if held.released_at is not null then raise exception 'This hold has already ended.'; end if;
 if not exists(select 1 from public.matches where id=held.match_id and state='in_progress') then raise exception 'Correct the dependent report before changing a finished battle''s hold.'; end if;
 if p_action='confirmEnd' then
  if held.confirmed_end_at is not null then return held; end if;
  update public.slaaneshi_holds set confirmed_end_at=clock_timestamp(),history=history||jsonb_build_array(jsonb_build_object('event','confirmedAtEnd','at',clock_timestamp(),'by',auth.uid())) where id=held.id returning * into held;
 elsif p_action in ('weaponSwitched','magicEscape','meleeEnded','wielderOutOfAction','targetOutOfAction') then
  update public.slaaneshi_holds set released_at=clock_timestamp(),released_by_event_id=null,release_reason=p_action,confirmed_end_at=null,
   history=history||jsonb_build_array(jsonb_build_object('event','released','reason',p_action,'note',left(btrim(p_reason),500),'at',clock_timestamp(),'by',auth.uid())) where id=held.id returning * into held;
 else raise exception 'Choose a release reason or confirm the hold at the end.';
 end if;
 return held;
end $$;
revoke all on function public.slaaneshi_hold_action(uuid,text,text) from public;
grant execute on function public.slaaneshi_hold_action(uuid,text,text) to authenticated;

-- Corrections retain history and do not silently release or revive an unrelated hold.
create function public.correct_slaaneshi_hold_event() returns trigger
language plpgsql security definer set search_path='' as $$
declare held public.slaaneshi_holds%rowtype;
begin
 if new.reverted_at is not distinct from old.reverted_at then return new; end if;
 for held in select * from public.slaaneshi_holds where source_event_id=new.id or released_by_event_id=new.id for update loop
  if exists(select 1 from public.match_reports where match_id=held.match_id and warband_id=held.target_warband_id and undo is not null) then raise exception 'Reverse the dependent report before correcting this Man-Catcher event.'; end if;
  if held.source_event_id=new.id then
   if new.reverted_at is not null and held.released_at is null then
    update public.slaaneshi_holds set released_at=clock_timestamp(),release_reason='sourceReverted',confirmed_end_at=null,
     history=history||jsonb_build_array(jsonb_build_object('event','sourceReverted','at',clock_timestamp(),'by',auth.uid())) where id=held.id;
   elsif held.release_reason='sourceReverted' then
    update public.slaaneshi_holds set released_at=null,release_reason=null,released_by_event_id=null,confirmed_end_at=null,
     history=history||jsonb_build_array(jsonb_build_object('event','sourceRestored','at',clock_timestamp(),'by',auth.uid())) where id=held.id;
   end if;
  elsif new.reverted_at is not null and not exists(select 1 from public.battle_events where id=held.source_event_id and reverted_at is not null) then
   update public.slaaneshi_holds set released_at=null,release_reason=null,confirmed_end_at=null,
    history=history||jsonb_build_array(jsonb_build_object('event','releaseEventReverted','sourceEventId',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
  elsif new.reverted_at is null and held.released_at is null then
   update public.slaaneshi_holds set released_at=clock_timestamp(),release_reason=case when held.wielder_id::text=new.payload->>'target_id' then 'wielderOutOfAction' else 'targetOutOfAction' end,confirmed_end_at=null,
    history=history||jsonb_build_array(jsonb_build_object('event','releaseEventRestored','sourceEventId',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=held.id;
  end if;
 end loop;
 return new;
end $$;
revoke all on function public.correct_slaaneshi_hold_event() from public,authenticated;
create trigger correct_slaaneshi_hold_event after update of reverted_at on public.battle_events for each row execute function public.correct_slaaneshi_hold_event();

-- Confirmation belongs to the end of this battle, not an earlier point followed
-- by further combat. Every new attack requires active holds to be checked again.
create function public.invalidate_slaaneshi_end_confirmation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update public.slaaneshi_holds set confirmed_end_at=null where match_id=new.match_id and released_at is null and confirmed_end_at is not null;
 return new;
end $$;
revoke all on function public.invalidate_slaaneshi_end_confirmation() from public,authenticated;
create trigger invalidate_slaaneshi_end_confirmation after insert on public.battle_events for each row execute function public.invalidate_slaaneshi_end_confirmation();
create function public.require_slaaneshi_end_confirmation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.state='in_progress' and new.state='awaiting_reports' and exists(select 1 from public.slaaneshi_holds where match_id=new.id and released_at is null and confirmed_end_at is null) then
  raise exception 'Confirm which Man-Catcher holds remain at the end of the battle, or record their release, before ending the battle.';
 end if;
 return new;
end $$;
revoke all on function public.require_slaaneshi_end_confirmation() from public,authenticated;
create trigger require_slaaneshi_end_confirmation before update of state on public.matches for each row execute function public.require_slaaneshi_end_confirmation();
