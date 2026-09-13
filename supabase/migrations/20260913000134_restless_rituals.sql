-- Distinguish actual rare searches from other actions that use a Hero's allowance.
alter table public.trade_phase_state add column rare_item_searchers uuid[] not null default '{}';
alter table public.trade_phase_state add column bone_goliath_constructed boolean not null default false;
-- Older records do not distinguish search types; retain their spent allowance conservatively.
update public.trade_phase_state set rare_item_searchers=heroes_searched;
create table public.restless_rituals(
 id uuid primary key, warband_id uuid not null references public.warbands(id) on delete cascade,
 hero_id uuid not null, match_id uuid, kind text not null check(kind in ('feed','construct')),
 die integer, group_id uuid, before_state jsonb not null, after_state jsonb not null,
 note text not null, undone boolean not null default false, created_at timestamptz not null default now()
);
alter table public.restless_rituals enable row level security;
create policy restless_ritual_read on public.restless_rituals for select to authenticated using(public.can_read_warband(warband_id));
grant select on public.restless_rituals to authenticated;

alter function public.record_rare_item_trade(uuid,uuid,jsonb,boolean,uuid[],text,jsonb) rename to record_rare_item_trade_before_restless;
revoke all on function public.record_rare_item_trade_before_restless(uuid,uuid,jsonb,boolean,uuid[],text,jsonb) from public,anon,authenticated;
create function public.record_rare_item_trade(p_warband_id uuid,p_match_id uuid,p_changes jsonb,p_wyrdstone_sold boolean,p_heroes_searched uuid[],p_reason text,p_haggle jsonb default null)
returns integer language plpgsql security definer set search_path='' as $$
declare result integer;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'You cannot trade for this warband' using errcode='42501';end if;
 perform 1 from public.warbands where id=p_warband_id for update;
 if exists(select 1 from public.trade_phase_state where warband_id=p_warband_id and match_id=p_match_id and bone_goliath_constructed) then raise exception 'Bone Goliath construction prevents rare-item searches this post-battle phase';end if;
 result:=public.record_rare_item_trade_before_restless(p_warband_id,p_match_id,p_changes,p_wyrdstone_sold,p_heroes_searched,p_reason,p_haggle);
 update public.trade_phase_state set rare_item_searchers=array(select distinct unnest(rare_item_searchers||coalesce(p_heroes_searched,'{}'::uuid[]))) where warband_id=p_warband_id and match_id=p_match_id;
 return result;
end $$;
revoke all on function public.record_rare_item_trade(uuid,uuid,jsonb,boolean,uuid[],text,jsonb) from public,anon;
grant execute on function public.record_rare_item_trade(uuid,uuid,jsonb,boolean,uuid[],text,jsonb) to authenticated;

create function public.resolve_restless_ritual(p_warband_id uuid,p_request_id uuid,p_kind text,p_die integer default null,p_name text default null)
returns text language plpgsql security definer set search_path='' as $$
declare w public.warbands%rowtype;h public.heroes%rowtype;r public.restless_rituals%rowtype;
 phase public.trade_phase_state%rowtype; latest uuid;before_data jsonb;after_data jsonb;new_group uuid;shards integer;wounds integer;initial boolean;note text;report jsonb;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'You cannot manage this warband' using errcode='42501';end if;
 select * into w from public.warbands where id=p_warband_id for update;
 if w.type_rules_id<>'the_restless_dead_variant' then raise exception 'These rituals belong to the Restless Dead variant';end if;
 if p_request_id is null or (p_kind is null or p_kind not in ('feed','construct','undo')) then raise exception 'Choose a valid ritual';end if;
 select * into r from public.restless_rituals where id=p_request_id;
 if r.id is not null and r.warband_id<>w.id then raise exception 'This action belongs to another warband';end if;
 if p_kind<>'undo' and r.id is not null then if r.kind<>p_kind then raise exception 'Request ID already used for another ritual';end if;return r.note;end if;
 if exists(select 1 from public.matches m join public.match_participants mp on mp.match_id=m.id where mp.warband_id=w.id and (m.state='in_progress' or (m.state='awaiting_reports' and not exists(select 1 from public.match_reports mr where mr.match_id=m.id and mr.warband_id=w.id)))) then raise exception 'Complete the current battle before performing or undoing a ritual';end if;
 select match_id,to_jsonb(mr) into latest,report from public.match_reports mr where warband_id=w.id order by submitted_at desc limit 1;
 select * into h from public.heroes where warband_id=w.id and unit_type_rules_id='restless_dead_variant_liche' and status='active' order by sort_order limit 1 for update;
 if h.id is null then raise exception 'An active Liche is required';end if;
 if latest is not null then
  insert into public.trade_phase_state(warband_id,match_id) values(w.id,latest) on conflict do nothing;
  select * into phase from public.trade_phase_state where warband_id=w.id and match_id=latest for update;
 end if;
 before_data:=jsonb_build_object('gold',w.gold,'shards',w.wyrdstone,'stats',h.stats,'searched',coalesce(to_jsonb(phase.heroes_searched),'[]'),'rare',coalesce(to_jsonb(phase.rare_item_searchers),'[]'),'constructed',coalesce(phase.bone_goliath_constructed,false));
 if p_kind='undo' then
  if r.id is null or r.undone then raise exception 'This ritual cannot be undone again';end if;
  if r.hero_id<>h.id or r.match_id is distinct from latest or r.after_state is distinct from before_data then raise exception 'Gold, shards, profile, searches or the battle phase changed; undo those later changes first';end if;
  if exists(select 1 from public.restless_rituals later where later.warband_id=w.id and not later.undone and later.created_at>r.created_at) then raise exception 'Undo the later ritual first';end if;
  if r.group_id is not null then
   if not exists(select 1 from public.henchman_groups where id=r.group_id and size=1 and xp=0 and level_ups=0 and stats='{"M":5,"WS":3,"BS":0,"S":5,"T":5,"W":3,"I":2,"A":3,"Ld":6}'::jsonb) or exists(select 1 from public.items where holder_id=r.group_id) then raise exception 'The constructed Goliath changed; it cannot be removed by this undo';end if;
  end if;
  perform set_config('stirheim.audit_reason','Undid ritual: '||r.note,true);
  update public.warbands set gold=(r.before_state->>'gold')::integer,wyrdstone=(r.before_state->>'shards')::integer where id=w.id;
  update public.heroes set stats=r.before_state->'stats' where id=h.id;
  if r.group_id is not null then delete from public.henchman_groups where id=r.group_id;end if;
  if latest is not null then update public.trade_phase_state set heroes_searched=array(select value::uuid from jsonb_array_elements_text(r.before_state->'searched')),bone_goliath_constructed=(r.before_state->>'constructed')::boolean where warband_id=w.id and match_id=latest;end if;
  update public.restless_rituals set undone=true where id=r.id;
  return 'Undid ritual: '||r.note;
 end if;
 wounds:=(h.stats->>'W')::integer;
 if p_kind='feed' then
  if latest is null then raise exception 'Feed Upon Magic is performed between battles, after a report is filed';end if;
  if p_die is null or p_die not between 1 and 3 then raise exception 'Roll D3 for the wyrdstone cost';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(report->'ooa','[]')) entry where entry->>'subjectId'=h.id::text and coalesce((entry->>'count')::integer,1)>0) then raise exception 'The Liche went out of action and cannot Feed Upon Magic';end if;
  if h.id=any(phase.rare_item_searchers) or (h.id=any(phase.heroes_searched) and not exists(select 1 from public.restless_rituals where warband_id=w.id and match_id=latest and kind='feed' and not undone)) then raise exception 'The Liche already searched or used its between-battle action';end if;
  shards:=least(w.wyrdstone,p_die);
  note:=format('Feed Upon Magic: D3 %s; consumed %s wyrdstone. %s',p_die,shards,case when w.wyrdstone>=p_die then format('Liche Wounds %s to %s.',wounds,wounds+1) else 'Insufficient shards: no Wound gained.' end);
  perform set_config('stirheim.audit_reason',note,true);
  update public.warbands set wyrdstone=wyrdstone-shards where id=w.id;
  if w.wyrdstone>=p_die then update public.heroes set stats=jsonb_set(stats,'{W}',to_jsonb(wounds+1)) where id=h.id;end if;
  update public.trade_phase_state set heroes_searched=array(select distinct unnest(heroes_searched||array[h.id])) where warband_id=w.id and match_id=latest;
 else
  if exists(select 1 from public.henchman_groups where warband_id=w.id and unit_type_rules_id='restless_dead_variant_bone_goliath' and size>0) then raise exception 'The warband already has its Bone Goliath';end if;
  initial:=latest is null and not exists(select 1 from public.henchman_groups where warband_id=w.id and unit_type_rules_id='restless_dead_variant_bone_goliath');
  if not initial and (p_die is null or p_die not between 1 and 3) then raise exception 'Roll D3 for the permanent Liche Wound cost';end if;
  if not initial and coalesce(cardinality(phase.rare_item_searchers),0)>0 then raise exception 'The warband already searched for rare items; it cannot construct a Goliath in the same phase';end if;
  if w.gold<225 then raise exception 'A Bone Goliath costs 225 gc';end if;
  new_group:=gen_random_uuid();
  note:=format('Constructed %s for 225 gc. %s',coalesce(nullif(trim(p_name),''),'Bone Goliath'),case when initial then 'Starting-warband exemption: no Liche Wounds lost.' else format('D3 %s: Liche Wounds %s to %s (minimum 1). No rare-item searches this phase.',p_die,wounds,greatest(1,wounds-p_die)) end);
  perform set_config('stirheim.audit_reason',note,true);
  update public.warbands set gold=gold-225 where id=w.id;
  if not initial then update public.heroes set stats=jsonb_set(stats,'{W}',to_jsonb(greatest(1,wounds-p_die))) where id=h.id;end if;
  insert into public.henchman_groups(id,warband_id,name,unit_type_rules_id,size,xp,level_ups,is_large,stats) values(new_group,w.id,coalesce(nullif(trim(p_name),''),'Bone Goliath'),'restless_dead_variant_bone_goliath',1,0,0,true,'{"M":5,"WS":3,"BS":0,"S":5,"T":5,"W":3,"I":2,"A":3,"Ld":6}');
  if not initial and latest is not null then update public.trade_phase_state set bone_goliath_constructed=true where warband_id=w.id and match_id=latest;end if;
 end if;
 select jsonb_build_object('gold',gold,'shards',wyrdstone,'stats',(select stats from public.heroes where id=h.id),'searched',coalesce((select to_jsonb(heroes_searched) from public.trade_phase_state where warband_id=w.id and match_id=latest),'[]'),'rare',coalesce((select to_jsonb(rare_item_searchers) from public.trade_phase_state where warband_id=w.id and match_id=latest),'[]'),'constructed',coalesce((select bone_goliath_constructed from public.trade_phase_state where warband_id=w.id and match_id=latest),false)) into after_data from public.warbands where id=w.id;
 insert into public.restless_rituals(id,warband_id,hero_id,match_id,kind,die,group_id,before_state,after_state,note) values(p_request_id,w.id,h.id,latest,p_kind,p_die,new_group,before_data,after_data,note);
 return note;
end $$;
revoke all on function public.resolve_restless_ritual(uuid,uuid,text,integer,text) from public,anon;
grant execute on function public.resolve_restless_ritual(uuid,uuid,text,integer,text) to authenticated;
