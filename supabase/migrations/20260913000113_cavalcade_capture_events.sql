-- Capture! source facts and the actual Misericordia casualty bridge. Counts are
-- shared by every participant and rechecked under a captor-row lock when saved.
create function public.cavalcade_capture_counts(p_match uuid,p_warband uuid) returns jsonb
language sql volatile security definer set search_path='' as $$
 select jsonb_build_object(
  'capturedThralls',coalesce((select sum(size) from public.henchman_groups where warband_id=p_warband and unit_type_rules_id='cursed_cavalcade_captured_thrall'),0),
  'capturedThisBattle',(select count(*) from public.battle_events e where e.match_id=p_match and e.reverted_at is null and e.payload->>'attacker_warband_id'=p_warband::text and coalesce(e.payload->>'capture_reason','')<>'')
   +(select count(*) from public.captive_cases c where c.match_id=p_match and c.captor_warband_id=p_warband and c.subject_kind='hero' and c.state<>'withdrawn'
      and not exists(select 1 from public.battle_events e where e.match_id=p_match and e.reverted_at is null and e.payload->>'attacker_warband_id'=p_warband::text and e.payload->>'target_id'=c.hero_id::text and coalesce(e.payload->>'capture_reason','')<>''))
 );
$$;
revoke all on function public.cavalcade_capture_counts(uuid,uuid) from public,authenticated;

create function public.cavalcade_capture_facts(p_match_id uuid,p_captor_id uuid,p_attacker_id uuid,p_target_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare human boolean; hero boolean; facts jsonb;
begin
 if auth.uid() is null or not public.can_read_campaign(public.match_campaign(p_match_id)) then raise exception 'This battle is not available.' using errcode='42501'; end if;
 if not exists(select 1 from public.match_participants where match_id=p_match_id and warband_id=p_captor_id) then raise exception 'The captor does not belong to this battle.' using errcode='42501'; end if;
 select exists(select 1 from public.heroes h join public.warbands w on w.id=h.warband_id join public.match_participants mp on mp.warband_id=w.id and mp.match_id=p_match_id where h.id=p_attacker_id and w.id=p_captor_id and w.type_rules_id='the_cursed_cavalcade' and not h.is_hired_sword and h.status='active') into hero;
 select exists(select 1 from public.henchman_groups g join public.warbands w on w.id=g.warband_id join public.kidnap_eligible_units u on u.unit_type_rules_id=g.unit_type_rules_id and u.warband_type_rules_id=w.type_rules_id join public.match_participants mp on mp.warband_id=w.id and mp.match_id=p_match_id where g.id=p_target_id and w.id<>p_captor_id and g.size>0) into human;
 facts:=public.cavalcade_capture_counts(p_match_id,p_captor_id);
 return facts||jsonb_build_object('attackerIsHero',hero,'targetIsEnemyHumanHenchman',human,'eligible',hero and human and (facts->>'capturedThralls')::int<5 and (facts->>'capturedThisBattle')::int<2);
end $$;
revoke all on function public.cavalcade_capture_facts(uuid,uuid,uuid,uuid) from public;
grant execute on function public.cavalcade_capture_facts(uuid,uuid,uuid,uuid) to authenticated;

create function public.validate_cavalcade_capture_event() returns trigger language plpgsql security definer set search_path='' as $$
declare w public.warbands%rowtype; facts jsonb; human boolean; hero boolean; die numeric; original numeric; captured boolean; attempt jsonb;
begin
 if new.payload->>'capture_reason'='cavalcade' or new.payload ? 'cavalcade_capture' then
  if not coalesce((new.payload->>'out_of_action')::boolean,false) or coalesce(new.payload->>'out_of_action_weapon_id','') not in ('misericordia','gromril_misericordia','ithilmar_misericordia') then raise exception 'Capture! requires the actual Misericordia out-of-action result.'; end if;
 elsif not coalesce((new.payload->>'out_of_action')::boolean,false) or coalesce(new.payload->>'out_of_action_weapon_id','') not in ('misericordia','gromril_misericordia','ithilmar_misericordia') then return new;
 end if;
 select * into w from public.warbands where id::text=new.payload->>'attacker_warband_id' for update;
 if w.type_rules_id is distinct from 'the_cursed_cavalcade' then
  if new.payload ? 'cavalcade_capture' or new.payload->>'capture_reason'='cavalcade' then raise exception 'Only the Cursed Cavalcade has Capture!.'; end if;
  return new;
 end if;
 select exists(select 1 from public.heroes h where h.id::text=new.payload->>'attacker_id' and h.warband_id=w.id and not h.is_hired_sword and h.status='active' and new.payload->>'attacker_kind'='hero') into hero;
 select exists(select 1 from public.henchman_groups g join public.warbands v on v.id=g.warband_id join public.kidnap_eligible_units u on u.unit_type_rules_id=g.unit_type_rules_id and u.warband_type_rules_id=v.type_rules_id
  where g.id::text=new.payload->>'target_id' and g.warband_id::text=new.payload->>'target_warband_id' and g.warband_id<>w.id and g.size>0 and new.payload->>'target_kind'='group') into human;
 if not hero or not human then
  if new.payload ? 'cavalcade_capture' or new.payload->>'capture_reason'='cavalcade' then raise exception 'Capture! requires a Hero and an enemy human henchman.'; end if;
  return new;
 end if;
 if not exists(select 1 from public.match_participants where match_id=new.match_id and warband_id=w.id) or not exists(select 1 from public.match_participants where match_id=new.match_id and warband_id::text=new.payload->>'target_warband_id') then raise exception 'Both warriors must belong to this battle.'; end if;
 facts:=public.cavalcade_capture_counts(new.match_id,w.id);
 if (facts->>'capturedThralls')::int>=5 or (facts->>'capturedThisBattle')::int>=2 then
  if new.payload ? 'cavalcade_capture' or new.payload->>'capture_reason'='cavalcade' then raise exception 'The Cavalcade capture limit has been reached. Refresh the battle before recording this casualty.'; end if;
  return new;
 end if;
 if not exists(select 1 from public.items where warband_id=w.id and holder_type='hero' and holder_id::text=new.payload->>'attacker_id' and item_rules_id=new.payload->>'out_of_action_weapon_id' and quantity>0) then raise exception 'The Hero must carry the Misericordia used for Capture!.'; end if;
 attempt:=new.payload->'cavalcade_capture';
 if jsonb_typeof(attempt) is distinct from 'object' or jsonb_typeof(attempt->'roll') is distinct from 'number' then raise exception 'Record the Capture! D6 after this Misericordia casualty.'; end if;
 die:=(attempt->>'roll')::numeric;
 if die<>trunc(die) or die<1 or die>6 then raise exception 'Capture! needs a D6 result from 1 to 6.'; end if;
 if attempt ? 'originalRoll' and attempt->'originalRoll'<>'null'::jsonb then
  if jsonb_typeof(attempt->'originalRoll') is distinct from 'number' then raise exception 'The original Capture! die must be a number.'; end if;
  original:=(attempt->>'originalRoll')::numeric;
  if original<>trunc(original) or original<1 or original>6 then raise exception 'The original Capture! die must be from 1 to 6.'; end if;
 end if;
 captured:=die>=5;
 new.payload:=jsonb_set(new.payload-'capture_reason','{cavalcade_capture}',jsonb_build_object('roll',die,'originalRoll',original,'captured',captured));
 if captured then new.payload:=jsonb_set(new.payload,'{capture_reason}','"cavalcade"'::jsonb); end if;
 return new;
end $$;
revoke all on function public.validate_cavalcade_capture_event() from public,authenticated;
create trigger validate_cavalcade_capture_event before insert on public.battle_events for each row execute function public.validate_cavalcade_capture_event();

do $$
declare original text; updated text;
begin
 select pg_get_functiondef('public.open_forced_capture_cases()'::regprocedure) into original;
 updated:=replace(original,$old$not in ('subjugator','man_catcher')$old$,$new$not in ('subjugator','man_catcher','cavalcade')$new$);
 updated:=replace(updated,$old$case when cap->>'reason'='man_catcher' then$old$,$new$case when cap->>'reason'='cavalcade' then 'Captured by the Misericordia. Agree the Throne of Worms outcome with the Cavalcade player from your warband page.' when cap->>'reason'='man_catcher' then$new$);
 if updated=original then raise exception 'Could not find the forced-capture report bridge.'; end if;
 execute updated;
end $$;

-- A failed Capture! attempt is still worth recording at the table. Its marker
-- keeps the dice but has no capture_reason and never adds another casualty/XP.
do $$
declare original text; updated text;
begin
 select pg_get_functiondef('public.mark_casualty_event(uuid,uuid,jsonb,text)'::regprocedure) into original;
 updated:=replace(original,$old$coalesce(p_payload->>'capture_reason', '') = ''$old$,$new$(coalesce(p_payload->>'capture_reason', '') = '' and not (p_payload ? 'cavalcade_capture'))$new$);
 if updated=original then raise exception 'Could not find the manual casualty marker validation.'; end if;
 execute updated;
end $$;
