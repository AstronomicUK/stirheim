-- Escaped prisoners return only after the rescue battle has completed.
-- Named prisoners use the existing two-player consent and exact reversal snapshots.
create function public.engine_rescue_return_changes(p_case public.captive_cases,p_group_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare h public.heroes%rowtype; g jsonb;
begin
 if p_case.subject_kind='hero' then
  select * into h from public.heroes where id=p_case.hero_id and warband_id=p_case.victim_warband_id and status='captured';
  if h.id is null then raise exception 'The rescued warrior is no longer recorded as captured.'; end if;
  return jsonb_build_array(jsonb_build_object('table','heroes','op','update','id',h.id,'data',jsonb_build_object('status','active','flags',h.flags-'captured')));
 elsif p_case.subject_kind='henchman' then
  g:=p_case.model_snapshot->'group';
  if g is null or p_group_id is null or exists(select 1 from public.henchman_groups where id=p_group_id) then raise exception 'Choose a new group identity for this rescued henchman.'; end if;
  return jsonb_build_array(jsonb_build_object('table','henchman_groups','op','insert','data',jsonb_build_object('id',p_group_id,'name',g->>'name','unit_type_rules_id',g->>'unit_type_rules_id','size',1,'stats',g->'stats','xp',coalesce((g->>'xp')::integer,0),'level_ups',coalesce((g->>'level_ups')::integer,0),'stat_increases',coalesce(g->'stat_increases','{}'::jsonb),'campaign_state',coalesce(g->'campaign_state','{}'::jsonb),'is_large',coalesce((g->>'is_large')::boolean,false))));
 end if;
 raise exception 'Unsupported Engine prisoner type.';
end $$;
revoke all on function public.engine_rescue_return_changes(public.captive_cases,uuid) from public,authenticated;

create function public.validate_engine_rescue_return(p_case public.captive_cases,p_choice jsonb,p_owner_changes jsonb,p_captor_changes jsonb,p_advances jsonb) returns text
language plpgsql security definer set search_path='' as $$
declare r public.engine_rescue_battles%rowtype; p public.engine_prisoners%rowtype;
begin
 select * into r from public.engine_rescue_battles where id=(p_choice->>'rescueId')::uuid;
 select * into p from public.engine_prisoners where id=(p_choice->>'prisonerId')::uuid;
 if p_case.state<>'held' or p.id is null or p.case_id<>p_case.id or p.state<>'held' or p.journey_id is not null or p.engine_id<>r.engine_id then raise exception 'The captive is no longer held in this Engine.'; end if;
 if r.id is null or not exists(select 1 from public.matches where id=r.match_id and state='completed') then raise exception 'Finish the rescue battle and its reports before returning the captive.'; end if;
 if not exists(select 1 from jsonb_array_elements(r.state->'prisoners') x where x->>'id'=p.id::text and x->>'state'='escaped') then raise exception 'Record this prisoner reaching the table edge first.'; end if;
 if coalesce(p_captor_changes,'[]'::jsonb)<>'[]'::jsonb or coalesce(p_advances,'[]'::jsonb)<>'[]'::jsonb or p_owner_changes is distinct from public.engine_rescue_return_changes(p_case,(p_choice->>'groupId')::uuid) then raise exception 'Rescue returns exactly the prisoner; confiscated equipment stays with the captors and no reward is invented.'; end if;
 return p.name||' escaped and returns to the former warband. Confiscated equipment stays with the Chaos Dwarfs.';
end $$;
revoke all on function public.validate_engine_rescue_return(public.captive_cases,jsonb,jsonb,jsonb,jsonb) from public,authenticated;

do $patch$ declare original text; updated text; begin
 original:=pg_get_functiondef('public.validate_captive_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb)'::regprocedure);
 updated:=replace(original,$old$  if p_choice->>'kind' = 'kidnapped' then$old$,$new$  if p_choice->>'kind'='engine_rescue' then return public.validate_engine_rescue_return(p_case,p_choice,p_owner_changes,p_captor_changes,p_advances); end if;
  if p_choice->>'kind' = 'kidnapped' then$new$);
 if updated=original then raise exception 'Captive validator route changed.'; end if;execute updated;
 original:=pg_get_functiondef('public.respond_captive_proposal(uuid,text,text)'::regprocedure);
 updated:=replace(original,$old$pr.choice->>'kind' = 'dispatch'$old$,$new$pr.choice->>'kind' in ('dispatch','engine_rescue')$new$);
 -- Dispatch has a different change builder; extend only the held-state boundary.
 updated:=replace(updated,$old$if pr.choice->>'kind' in ('dispatch','engine_rescue') then$old$,$new$if pr.choice->>'kind'='engine_rescue' then
    update public.captive_proposals set owner_changes=public.engine_rescue_return_changes(c,(pr.choice->>'groupId')::uuid),expected=public.captive_roster_expected(c.victim_warband_id,c.captor_warband_id) where id=pr.id returning * into pr;
  end if;
  if pr.choice->>'kind' = 'dispatch' then$new$);
 if updated=original then raise exception 'Captive response boundary changed.'; end if;execute updated;
end $patch$;

create function public.propose_engine_rescue_return(p_rescue_id uuid,p_prisoner_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare r public.engine_rescue_battles%rowtype; p public.engine_prisoners%rowtype; c public.captive_cases%rowtype; choice jsonb; changes jsonb; message text; proposal uuid; proposer uuid; recipient uuid;
begin
 select * into r from public.engine_rescue_battles where id=p_rescue_id;
 select * into p from public.engine_prisoners where id=p_prisoner_id;
 if r.id is null or p.id is null or p.engine_id<>r.engine_id then raise exception 'Choose a prisoner from this rescue.'; end if;
 if p.case_id is null then raise exception 'This anonymous prisoner has no former player; record its departure instead.'; end if;
 select * into c from public.captive_cases where id=p.case_id;
 perform id from public.matches where id in (r.match_id,c.match_id) order by id for update;
 perform public.lock_captive_context(c.match_id,c.victim_warband_id,c.captor_warband_id);
 select * into c from public.captive_cases where id=c.id for update;
 select * into p from public.engine_prisoners where id=p_prisoner_id for update;
 if not public.can_edit_warband(c.victim_warband_id) and not public.can_edit_warband(c.captor_warband_id) and not public.is_campaign_gm(public.match_campaign(r.match_id)) then raise exception 'Only the involved players or GM can propose the return.' using errcode='42501'; end if;
 if exists(select 1 from public.captive_proposals where case_id=c.id and state='proposed') then raise exception 'Answer or withdraw the existing proposal first.'; end if;
 choice:=jsonb_build_object('kind','engine_rescue','rescueId',r.id,'prisonerId',p.id,'groupId',gen_random_uuid());
 changes:=public.engine_rescue_return_changes(c,(choice->>'groupId')::uuid);
 message:=public.validate_engine_rescue_return(c,choice,changes,'[]'::jsonb,'[]'::jsonb);
 proposer:=case when public.can_edit_warband(c.victim_warband_id) then c.victim_warband_id else c.captor_warband_id end;
 insert into public.captive_proposals(case_id,proposed_by,proposed_by_warband_id,choice,message,owner_changes,captor_changes,advances,expected)
 values(c.id,auth.uid(),proposer,choice,message,changes,'[]'::jsonb,'[]'::jsonb,public.captive_roster_expected(c.victim_warband_id,c.captor_warband_id)) returning id into proposal;
 select owner_id into recipient from public.warbands where id=case when proposer=c.victim_warband_id then c.captor_warband_id else c.victim_warband_id end;
 insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) values(recipient,'captive',left(p.name||': rescue return proposed',140),message,'/warbands/'||case when proposer=c.victim_warband_id then c.captor_warband_id else c.victim_warband_id end,'engine-rescue:'||proposal) on conflict do nothing;
 return proposal;
end $$;
revoke all on function public.propose_engine_rescue_return(uuid,uuid) from public;
grant execute on function public.propose_engine_rescue_return(uuid,uuid) to authenticated;

create function public.engine_rescue_return_applied() returns trigger
language plpgsql security definer set search_path='' as $$
declare p public.engine_prisoners%rowtype; rescue_match uuid; links uuid[];
begin
 if new.choice->>'kind'<>'engine_rescue' or new.state=old.state then return new; end if;
 select * into p from public.engine_prisoners where id=(new.choice->>'prisonerId')::uuid for update;
 if new.state='accepted' then
  update public.engine_prisoners set state='freed',released_at=clock_timestamp(),release_reason='Escaped and returned by agreement.',history=history||jsonb_build_array(jsonb_build_object('event','rescued','proposal_id',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=p.id;
  select match_id into rescue_match from public.engine_rescue_battles where id=(new.choice->>'rescueId')::uuid;
  select array_agg(id) into links from public.match_reports where match_id=rescue_match and undo is not null;
  update public.captive_proposals set linked_report_ids=(select array_agg(distinct x) from unnest(coalesce(linked_report_ids,'{}'::uuid[])||coalesce(links,'{}'::uuid[])) x) where id=new.id;
 elsif new.state='reversed' and current_setting('stirheim.rescue_release_only',true) is distinct from '1' then
  if not exists(select 1 from public.engine_of_chaos_units where id=p.engine_id and state='present') or public.engine_places_used(p.engine_id)+p.places>6 then raise exception 'The original Engine must be present with space before restoring custody.'; end if;
  update public.engine_prisoners set state='held',released_at=null,release_reason='',history=history||jsonb_build_array(jsonb_build_object('event','rescueReversed','proposal_id',new.id,'at',clock_timestamp(),'by',auth.uid())) where id=p.id;
 end if;
 return new;
end $$;
revoke all on function public.engine_rescue_return_applied() from public,authenticated;
create trigger engine_rescue_return_applied after update of state on public.captive_proposals for each row execute function public.engine_rescue_return_applied();

create function public.engine_rescue_case_reversed() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.resolution_kind='engine_rescue' and new.state='open' then
  new.state:='held';new.resolution_kind:='engine_placement';new.resolved_at:=clock_timestamp();
  new.resolution_message:='Rescue return reversed; the prisoner remains in the original Engine. Confiscated equipment remains with the captors.';
 end if;
 return new;
end $$;
revoke all on function public.engine_rescue_case_reversed() from public,authenticated;
create trigger engine_rescue_case_reversed before update of state on public.captive_cases for each row execute function public.engine_rescue_case_reversed();

do $patch$ declare original text; updated text; begin
 original:=pg_get_functiondef('public.reverse_captive_resolution(uuid,text,boolean)'::regprocedure);
 updated:=replace(original,$old$  v_gm := public.is_campaign_gm(public.match_campaign(c.match_id));$old$,$new$  perform set_config('stirheim.rescue_release_only',case when p_release_only then '1' else '0' end,true);
  v_gm := public.is_campaign_gm(public.match_campaign(c.match_id));$new$);
 if updated=original then raise exception 'Captive reversal boundary changed.'; end if;execute updated;
end $patch$;

create function public.finish_anonymous_engine_rescue(p_rescue_id uuid,p_prisoner_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r public.engine_rescue_battles%rowtype; p public.engine_prisoners%rowtype;
begin
 select * into r from public.engine_rescue_battles where id=p_rescue_id;
 perform id from public.matches where id=r.match_id and state='completed' for update;
 if not found then raise exception 'Complete the rescue battle and its reports first.'; end if;
 select * into p from public.engine_prisoners where id=p_prisoner_id for update;
 if p.id is null or p.engine_id<>r.engine_id or p.case_id is not null or p.journey_id is not null or p.state<>'held' then raise exception 'Choose an anonymous prisoner still held by this Engine.'; end if;
 if not public.can_edit_warband(p.holder_warband_id) and not public.is_campaign_gm(public.match_campaign(r.match_id)) then raise exception 'Only the Engine owner or GM can record this departure.' using errcode='42501'; end if;
 if not exists(select 1 from jsonb_array_elements(r.state->'prisoners') x where x->>'id'=p.id::text and x->>'state'='escaped') then raise exception 'Record the prisoner reaching the table edge first.'; end if;
 update public.engine_prisoners set state='freed',released_at=clock_timestamp(),release_reason='Anonymous prisoner escaped.',history=history||jsonb_build_array(jsonb_build_object('event','rescuedAnonymous','rescueId',r.id,'at',clock_timestamp(),'by',auth.uid())) where id=p.id;
end $$;
revoke all on function public.finish_anonymous_engine_rescue(uuid,uuid) from public;
grant execute on function public.finish_anonymous_engine_rescue(uuid,uuid) to authenticated;

-- A prisoner already freed at the table cannot be sacrificed while the return awaits agreement.
do $patch$ declare original text; updated text; begin
 original:=pg_get_functiondef('public.dispatch_engine(uuid,uuid,uuid[],timestamp with time zone)'::regprocedure);
 updated:=replace(original,$old$  perform id from public.engine_prisoners where id = any(ids) order by id for update;$old$,$new$  if exists(select 1 from public.engine_rescue_battles r join public.matches m on m.id=r.match_id cross join lateral jsonb_array_elements(r.state->'prisoners') p where m.state<>'cancelled' and (p->>'id')::uuid=any(ids) and p->>'state' in ('freed','escaped')) then raise exception 'Resolve the freed prisoners and rescue returns before selecting captives for a journey.'; end if;
  perform id from public.engine_prisoners where id = any(ids) order by id for update;$new$);
 if updated=original then raise exception 'Engine dispatch prisoner boundary changed.'; end if;execute updated;
end $patch$;
