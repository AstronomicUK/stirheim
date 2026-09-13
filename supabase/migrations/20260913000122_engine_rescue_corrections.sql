-- An unknown key holder can be confirmed later without inventing another Gaoler casualty.
do $patch$ declare original text; updated text; begin
 original:=pg_get_functiondef('public.record_engine_rescue_action(uuid,integer,jsonb,text)'::regprocedure);
 updated:=replace(original,$old$ elsif action_type='keeperOut' then$old$,$new$ elsif action_type='locateKeys' then
  if not exists(select 1 from jsonb_array_elements(r.state->'keys') k where k->>'gaolerId'=p_action->>'gaolerId' and (k->'keeper'='null'::jsonb or k->'keeper' is null)) then raise exception 'These keys already have a keeper, or were never recorded.'; end if;
  keeper:=public.engine_rescue_model(r.match_id,p_action->'by');
  if keeper is null then raise exception 'Choose the now-known key holder.'; end if;
  if not gm and not public.can_edit_warband((keeper->>'warbandId')::uuid) then raise exception 'The identified model''s player or GM must confirm the keys.' using errcode='42501'; end if;
  p_action:=p_action||jsonb_build_object('by',keeper);
  next_state:=jsonb_set(next_state,'{keys}',(select jsonb_agg(case when k->>'gaolerId'=p_action->>'gaolerId' then jsonb_set(k,'{keeper}',keeper) else k end) from jsonb_array_elements(r.state->'keys') k));shared_keys:=true;
 elsif action_type='keeperOut' then$new$);
 if updated=original then raise exception 'Key transfer boundary changed.'; end if;execute updated;
end $patch$;

create function public.correct_last_engine_rescue_action(p_rescue_id uuid,p_revision integer,p_reason text) returns public.engine_rescue_battles
language plpgsql security definer set search_path='' as $$
declare r public.engine_rescue_battles%rowtype; other public.engine_rescue_battles%rowtype; entry jsonb; latest jsonb; position integer; other_position integer; shared boolean; corrected_at timestamptz:=clock_timestamp(); h jsonb;
begin
 select * into r from public.engine_rescue_battles where id=p_rescue_id;
 perform id from public.matches where id=r.match_id and state<>'cancelled' for update;
 if not found then raise exception 'This rescue battle is unavailable.'; end if;
 select * into r from public.engine_rescue_battles where id=p_rescue_id for update;
 if r.revision<>p_revision then raise exception 'Rescue facts changed. Refresh before correcting them.'; end if;
 if not public.is_campaign_gm(public.match_campaign(r.match_id)) and not exists(select 1 from public.match_participants where match_id=r.match_id and public.can_edit_warband(warband_id)) then raise exception 'You no longer control a participant in this battle.' using errcode='42501'; end if;
 if length(btrim(coalesce(p_reason,'')))<5 then raise exception 'Explain the correction.'; end if;
 select x.value,(x.ordinality-1)::integer into entry,position from jsonb_array_elements(r.history) with ordinality x where x.value ? 'action' and not x.value ? 'revertedAt' order by x.ordinality desc limit 1;
 if entry is null then raise exception 'No recorded action remains to correct.'; end if;
 if entry ? 'sharedFrom' then raise exception 'This shared key or rout event must be corrected from the Engine where it was recorded.'; end if;
 if auth.uid()::text is distinct from entry->>'by' and not public.is_campaign_gm(public.match_campaign(r.match_id)) then raise exception 'Only the original recorder or GM can correct this event.' using errcode='42501'; end if;
 if exists(select 1 from public.captive_proposals where state in ('proposed','accepted') and choice->>'rescueId'=r.id::text) or exists(select 1 from public.engine_prisoners p where p.state='freed' and exists(select 1 from jsonb_array_elements(r.state->'prisoners') x where x->>'id'=p.id::text)) then raise exception 'Withdraw pending returns or reverse completed returns before correcting their rescue facts.'; end if;
 shared:=entry->'action'->>'type' in ('gaolerOut','keeperOut','locateKeys','holderRouted');
 if shared then
  for other in select * from public.engine_rescue_battles where match_id=r.match_id and id<>r.id and state->>'holderWarbandId'=r.state->>'holderWarbandId' order by id for update loop
   select x.value,(x.ordinality-1)::integer into latest,other_position from jsonb_array_elements(other.history) with ordinality x where x.value ? 'action' and not x.value ? 'revertedAt' order by x.ordinality desc limit 1;
   if latest is not null and latest->>'at' is distinct from entry->>'at' then raise exception 'Correct the later action in the other Engine first; it may depend on these keys.'; end if;
   if exists(select 1 from public.captive_proposals where state in ('proposed','accepted') and choice->>'rescueId'=other.id::text) then raise exception 'Resolve the other Engine''s return proposals before correcting shared rescue facts.'; end if;
   h:=other.history;
   if latest is not null then h:=jsonb_set(h,array[other_position::text,'revertedAt'],to_jsonb(corrected_at)); end if;
   update public.engine_rescue_battles set state=case when entry->'action'->>'type'='holderRouted' then jsonb_set(state,'{holderRouted}',entry->'before'->'holderRouted') else jsonb_set(state,'{keys}',entry->'before'->'keys') end,revision=revision+1,history=h||jsonb_build_array(jsonb_build_object('event','correction','note','Correction: '||left(btrim(p_reason),1000),'at',corrected_at,'by',auth.uid(),'sharedFrom',r.id)) where id=other.id;
  end loop;
 end if;
 h:=jsonb_set(r.history,array[position::text,'revertedAt'],to_jsonb(corrected_at));
 update public.engine_rescue_battles set state=entry->'before',revision=revision+1,history=h||jsonb_build_array(jsonb_build_object('event','correction','note','Correction: '||left(btrim(p_reason),1000),'at',corrected_at,'by',auth.uid(),'correctedActionIndex',position)) where id=r.id returning * into r;
 return r;
end $$;
revoke all on function public.correct_last_engine_rescue_action(uuid,integer,text) from public;
grant execute on function public.correct_last_engine_rescue_action(uuid,integer,text) to authenticated;

create function public.reverse_anonymous_engine_rescue(p_rescue_id uuid,p_prisoner_id uuid,p_reason text) returns void
language plpgsql security definer set search_path='' as $$
declare r public.engine_rescue_battles%rowtype; p public.engine_prisoners%rowtype;
begin
 select * into r from public.engine_rescue_battles where id=p_rescue_id;
 perform id from public.matches where id=r.match_id for update;
 select * into p from public.engine_prisoners where id=p_prisoner_id for update;
 if p.id is null or p.engine_id<>r.engine_id or p.case_id is not null or p.state<>'freed' or not exists(select 1 from jsonb_array_elements(p.history) h where h->>'event'='rescuedAnonymous' and h->>'rescueId'=r.id::text) then raise exception 'Choose an anonymous departure recorded in this rescue.'; end if;
 if not public.can_edit_warband(p.holder_warband_id) and not public.is_campaign_gm(public.match_campaign(r.match_id)) then raise exception 'Only the Engine owner or GM can correct this departure.' using errcode='42501'; end if;
 if length(btrim(coalesce(p_reason,'')))<5 then raise exception 'Explain why the departure was recorded wrongly.'; end if;
 perform id from public.engine_of_chaos_units where id=p.engine_id for update;
 if not exists(select 1 from public.engine_of_chaos_units where id=p.engine_id and state='present') or public.engine_places_used(p.engine_id)+p.places>6 then raise exception 'The original Engine must be present with room before restoring this prisoner.'; end if;
 update public.engine_prisoners set state='held',released_at=null,release_reason='',history=history||jsonb_build_array(jsonb_build_object('event','anonymousRescueReversed','rescueId',r.id,'note',left(btrim(p_reason),1000),'at',clock_timestamp(),'by',auth.uid())) where id=p.id;
end $$;
revoke all on function public.reverse_anonymous_engine_rescue(uuid,uuid,text) from public;
grant execute on function public.reverse_anonymous_engine_rescue(uuid,uuid,text) to authenticated;

create function public.guard_anonymous_rescue_reports() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.undo is null or (tg_op='UPDATE' and new.undo is not null) then if tg_op='DELETE' then return old; else return new; end if; end if;
 if exists(select 1 from public.engine_prisoners p join public.engine_rescue_battles r on exists(select 1 from jsonb_array_elements(p.history) h where h->>'event'='rescuedAnonymous' and h->>'rescueId'=r.id::text) where p.state='freed' and p.case_id is null and (p.exploration_report_id=old.id or r.match_id=old.match_id)) then raise exception 'Reverse the anonymous prisoner departure before changing its source or rescue report.'; end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function public.guard_anonymous_rescue_reports() from public,authenticated;
create trigger guard_anonymous_rescue_reports before delete or update of undo on public.match_reports for each row execute function public.guard_anonymous_rescue_reports();
