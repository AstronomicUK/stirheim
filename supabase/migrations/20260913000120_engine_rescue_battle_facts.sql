-- Rescue facts are temporary battle state. Permanent return/kit outcomes remain consent-based.
create table public.engine_rescue_battles (
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null references public.matches(id) on delete cascade,
 engine_id uuid not null references public.engine_of_chaos_units(id),
 state jsonb not null,
 revision integer not null default 0,
 history jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default clock_timestamp(),
 unique(match_id,engine_id)
);
alter table public.engine_rescue_battles enable row level security;
create policy engine_rescue_read on public.engine_rescue_battles for select to authenticated using(public.can_read_campaign(public.match_campaign(match_id)));
grant select on public.engine_rescue_battles to authenticated;

create function public.start_engine_rescue(p_match_id uuid,p_engine_id uuid) returns public.engine_rescue_battles
language plpgsql security definer set search_path='' as $$
declare engine public.engine_of_chaos_units%rowtype; record public.engine_rescue_battles%rowtype; prisoners jsonb; shared jsonb;
begin
 perform id from public.matches where id=p_match_id and state='in_progress' for update;
 if not found then raise exception 'Rescue facts require a battle in progress.'; end if;
 if not public.is_campaign_gm(public.match_campaign(p_match_id)) and not exists(select 1 from public.match_participants where match_id=p_match_id and public.can_edit_warband(warband_id)) then raise exception 'Only participants or the GM can record this rescue.' using errcode='42501'; end if;
 select * into engine from public.engine_of_chaos_units where id=p_engine_id for update;
 if engine.id is null or engine.state<>'present' or not exists(select 1 from public.match_participants where match_id=p_match_id and warband_id=engine.warband_id) then raise exception 'Choose a present Engine belonging to a participant.'; end if;
 select * into record from public.engine_rescue_battles where match_id=p_match_id and engine_id=p_engine_id;
 if found then return record; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'formerWarbandId',p.victim_warband_id,'state','held','large',p.large,'profile',case when exists(select 1 from public.match_participants where match_id=p_match_id and warband_id=p.victim_warband_id) then coalesce(p.snapshot->'hero'->'stats',p.snapshot->'henchman'->'group'->'stats') else '{"M":4,"WS":3,"BS":3,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":7}'::jsonb end) order by p.placed_at,p.id),'[]'::jsonb) into prisoners from public.engine_prisoners p where engine_id=p_engine_id and state='held';
 select state into shared from public.engine_rescue_battles where match_id=p_match_id and state->>'holderWarbandId'=engine.warband_id::text order by created_at limit 1;
 insert into public.engine_rescue_battles(match_id,engine_id,state,history) values(p_match_id,p_engine_id,jsonb_build_object('engineId',engine.id,'holderWarbandId',engine.warband_id,'destroyed',false,'holderRouted',coalesce((shared->>'holderRouted')::boolean,false),'prisoners',prisoners,'keys',coalesce(shared->'keys','[]'::jsonb)),jsonb_build_array(jsonb_build_object('event','started','at',clock_timestamp(),'by',auth.uid()))) returning * into record;
 return record;
end $$;
revoke all on function public.start_engine_rescue(uuid,uuid) from public;
grant execute on function public.start_engine_rescue(uuid,uuid) to authenticated;

-- Canonical physical model identity; a group member is UUID:index, with a zero-based index.
create function public.engine_rescue_model(p_match_id uuid,p_model jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare parts text[]; h public.heroes%rowtype; g public.henchman_groups%rowtype; member integer;
begin
 if p_model is null or p_model='null'::jsonb then return null; end if;
 parts:=string_to_array(p_model->>'id',':');
 if cardinality(parts)=1 then
  select * into h from public.heroes where id::text=parts[1] and status='active';
  if h.id is null then raise exception 'Choose an active battle model.'; end if;
  if not exists(select 1 from public.match_participants where match_id=p_match_id and warband_id=h.warband_id) then raise exception 'The key holder must belong to this battle.'; end if;
  return jsonb_build_object('id',h.id,'warbandId',h.warband_id,'name',h.name);
 elsif cardinality(parts)=2 and parts[2]~'^[0-9]+$' then
  member:=parts[2]::integer;
  select * into g from public.henchman_groups where id::text=parts[1];
  if g.id is null or member<0 or member>=g.size or not exists(select 1 from public.match_participants where match_id=p_match_id and warband_id=g.warband_id) then raise exception 'Choose a particular model in a participating group.'; end if;
  return jsonb_build_object('id',g.id::text||':'||member,'warbandId',g.warband_id,'name',g.name||' · model '||(member+1));
 end if;
 raise exception 'Choose a Hero or a particular henchman.';
end $$;
revoke all on function public.engine_rescue_model(uuid,jsonb) from public,authenticated;

create function public.record_engine_rescue_action(p_rescue_id uuid,p_revision integer,p_action jsonb,p_note text) returns public.engine_rescue_battles
language plpgsql security definer set search_path='' as $$
declare r public.engine_rescue_battles%rowtype; next_state jsonb; keeper jsonb; gaoler public.heroes%rowtype; action_type text:=p_action->>'type'; holder uuid; gm boolean; entry jsonb; shared_keys boolean:=false;
begin
 select * into r from public.engine_rescue_battles where id=p_rescue_id;
 perform id from public.matches where id=r.match_id and state='in_progress' for update;
 if not found then raise exception 'Rescue facts require a battle in progress.'; end if;
 select * into r from public.engine_rescue_battles where id=p_rescue_id for update;
 if r.revision<>p_revision then raise exception 'Rescue facts changed on another device. Refresh before recording this action.'; end if;
 holder:=(r.state->>'holderWarbandId')::uuid;gm:=public.is_campaign_gm(public.match_campaign(r.match_id));
 if not gm and not exists(select 1 from public.match_participants where match_id=r.match_id and public.can_edit_warband(warband_id)) then raise exception 'Only participants or the GM can record this rescue.' using errcode='42501'; end if;
 if length(btrim(coalesce(p_note,'')))<3 or length(p_note)>1000 then raise exception 'Add a short description of the confirmed tabletop event.'; end if;
 next_state:=r.state;
 if action_type='gaolerOut' then
  select * into gaoler from public.heroes where id::text=p_action->>'gaolerId' and warband_id=holder and unit_type_rules_id='black_dwarfs_gaolers';
  if gaoler.id is null then raise exception 'Choose a Gaoler from this Engine''s warband.'; end if;
  if exists(select 1 from jsonb_array_elements(r.state->'keys') k where k->>'gaolerId'=gaoler.id::text) then raise exception 'The keys from this Gaoler are already recorded.'; end if;
  keeper:=public.engine_rescue_model(r.match_id,p_action->'by');
  if not gm and not public.can_edit_warband(coalesce((keeper->>'warbandId')::uuid,holder)) then raise exception 'Record your own model taking keys, or ask the GM.' using errcode='42501'; end if;
  p_action:=p_action||jsonb_build_object('by',keeper);
  next_state:=jsonb_set(next_state,'{keys}',(next_state->'keys')||jsonb_build_array(jsonb_build_object('gaolerId',gaoler.id,'keeper',keeper)));shared_keys:=true;
 elsif action_type='keeperOut' then
  select k->'keeper' into keeper from jsonb_array_elements(r.state->'keys') k where k->'keeper'->>'id'=p_action->>'keeperId' limit 1;
  if keeper is null then raise exception 'That model has no recorded keys.'; end if;
  if not gm and not public.can_edit_warband((keeper->>'warbandId')::uuid) then raise exception 'Only the key holder''s player or GM can record its loss.' using errcode='42501'; end if;
  keeper:=public.engine_rescue_model(r.match_id,p_action->'by');
  if keeper->>'id'=p_action->>'keeperId' then raise exception 'A model taken out of action cannot keep the keys.'; end if;
  p_action:=p_action||jsonb_build_object('by',keeper);
  next_state:=jsonb_set(next_state,'{keys}',(select jsonb_agg(case when k->'keeper'->>'id'=p_action->>'keeperId' then jsonb_set(k,'{keeper}',coalesce(keeper,'null'::jsonb)) else k end) from jsonb_array_elements(r.state->'keys') k));shared_keys:=true;
 elsif action_type='free' then
  if (r.state->>'holderRouted')::boolean then raise exception 'The captors routed before release; the prisoners remain captured.'; end if;
  if coalesce((p_action->>'baseContactConfirmed')::boolean,false)=false then raise exception 'Confirm base contact with the Engine.'; end if;
  select k->'keeper' into keeper from jsonb_array_elements(r.state->'keys') k where k->'keeper'->>'id'=p_action->>'keeperId' limit 1;
  if keeper is null or keeper->>'warbandId'=holder::text then raise exception 'Choose an opposing model carrying the keys.'; end if;
  if not gm and not public.can_edit_warband((keeper->>'warbandId')::uuid) then raise exception 'Only the key holder''s player or GM can confirm contact.' using errcode='42501'; end if;
  if not exists(select 1 from jsonb_array_elements(r.state->'prisoners') p where p->>'state'='held') then raise exception 'No held prisoners remain in this Engine.'; end if;
  next_state:=jsonb_set(next_state,'{prisoners}',(select jsonb_agg(case when p->>'state'='held' then jsonb_set(p,'{state}','"freed"'::jsonb) else p end) from jsonb_array_elements(r.state->'prisoners') p));
 elsif action_type='destroyed' then
  if not gm and not public.can_edit_warband(holder) then raise exception 'The Engine owner or GM must confirm its destruction.' using errcode='42501'; end if;
  if (r.state->>'destroyed')::boolean or (r.state->>'holderRouted')::boolean then raise exception 'Correct the earlier destruction or rout before recording this.'; end if;
  next_state:=jsonb_set(jsonb_set(next_state,'{destroyed}','true'::jsonb),'{prisoners}',coalesce((select jsonb_agg(case when p->>'state'='held' then jsonb_set(p,'{state}','"freed"'::jsonb) else p end) from jsonb_array_elements(r.state->'prisoners') p),'[]'::jsonb));
 elsif action_type='holderRouted' then
  if not gm and not public.can_edit_warband(holder) then raise exception 'The Engine owner or GM must confirm the rout.' using errcode='42501'; end if;
  next_state:=jsonb_set(next_state,'{holderRouted}','true'::jsonb);
 elsif action_type='escaped' then
  if not exists(select 1 from jsonb_array_elements(r.state->'prisoners') p where p->>'id'=p_action->>'prisonerId' and p->>'state'='freed') then raise exception 'Only a freed prisoner can reach the table edge.'; end if;
  if not gm and not public.can_edit_warband(holder) and not exists(select 1 from jsonb_array_elements(r.state->'prisoners') p where p->>'id'=p_action->>'prisonerId' and public.can_edit_warband((p->>'formerWarbandId')::uuid)) then raise exception 'The prisoner owner, Engine owner or GM must confirm escape.' using errcode='42501'; end if;
  next_state:=jsonb_set(next_state,'{prisoners}',(select jsonb_agg(case when p->>'id'=p_action->>'prisonerId' then jsonb_set(p,'{state}','"escaped"'::jsonb) else p end) from jsonb_array_elements(r.state->'prisoners') p));
 else raise exception 'Choose a supported rescue action.';
 end if;
 entry:=jsonb_build_object('action',p_action,'note',btrim(p_note),'at',clock_timestamp(),'by',auth.uid(),'before',r.state);
 update public.engine_rescue_battles set state=next_state,revision=revision+1,history=history||jsonb_build_array(entry) where id=r.id returning * into r;
 -- Keys and rout belong to the whole captor warband, including its other Engines.
 if shared_keys or action_type='holderRouted' then
  update public.engine_rescue_battles set state=case when shared_keys then jsonb_set(state,'{keys}',next_state->'keys') else jsonb_set(state,'{holderRouted}','true'::jsonb) end,revision=revision+1,history=history||jsonb_build_array(entry||jsonb_build_object('sharedFrom',r.id)) where match_id=r.match_id and id<>r.id and state->>'holderWarbandId'=holder::text;
 end if;
 return r;
end $$;
revoke all on function public.record_engine_rescue_action(uuid,integer,jsonb,text) from public;
grant execute on function public.record_engine_rescue_action(uuid,integer,jsonb,text) to authenticated;
