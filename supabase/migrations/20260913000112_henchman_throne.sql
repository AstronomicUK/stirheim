-- Cursed Cavalcade: captured henchmen have already left their group in the
-- applied report. Throne outcomes resolve that exact case, never remove a second
-- model or award the ordinary OOA experience again.
create function public.validate_henchman_throne(p_case public.captive_cases,p_choice jsonb,p_owner_changes jsonb,p_captor_changes jsonb,p_advances jsonb)
returns text language plpgsql security definer set search_path='' as $$
declare
 w public.warbands%rowtype; hero public.heroes%rowtype; item public.items%rowtype;
 die numeric; original numeric; group_id uuid; hero_id uuid; c jsonb; d jsonb; a jsonb;
 keys text[]; tag text; seen text[]:='{}'; v_id uuid; qty int; key text;
 kit jsonb; gained jsonb:='{}'; group_seen boolean:=false; xp_seen boolean:=false; dagger int:=0;
 expected_advances int[]:='{}'; received_advances int[]:='{}'; threshold int; message text;
begin
 select * into w from public.warbands where id=p_case.captor_warband_id;
 if w.type_rules_id is distinct from 'the_cursed_cavalcade' or p_case.subject_kind<>'henchman' or p_case.source<>'forced_capture' then raise exception 'Choose a captured Cavalcade henchman case.'; end if;
 if p_choice->>'kind' is distinct from 'throne' then raise exception 'The Throne of Worms replaces ordinary captured outcomes for the Cavalcade.'; end if;
 if coalesce(p_owner_changes,'[]'::jsonb)<>'[]'::jsonb then raise exception 'This henchman already left in the battle report; do not remove or change another model.'; end if;
 if jsonb_typeof(p_captor_changes) is distinct from 'array' or jsonb_typeof(p_advances) is distinct from 'array' then raise exception 'Record the outcome changes and advances.'; end if;
 if not exists(select 1 from public.battle_events where id=(p_case.model_snapshot->>'event_id')::uuid and reverted_at is null) then raise exception 'The capture event was reverted; correct its report first.'; end if;
 if jsonb_typeof(p_choice->'d6') is distinct from 'number' then raise exception 'Record a Throne D6 result.'; end if;
 die:=(p_choice->>'d6')::numeric;
 if die<>trunc(die) or die<1 or die>6 then raise exception 'Throne D6 must be a whole number from 1 to 6.'; end if;
 if p_choice ? 'originalD6' and p_choice->'originalD6'<>'null'::jsonb then
  if jsonb_typeof(p_choice->'originalD6') is distinct from 'number' then raise exception 'The original D6 must be a number.'; end if;
  original:=(p_choice->>'originalD6')::numeric;
  if original<>trunc(original) or original<1 or original>6 then raise exception 'The original D6 must be from 1 to 6.'; end if;
 end if;
 group_id:=nullif(p_choice->>'groupId','')::uuid; hero_id:=nullif(p_choice->>'leaderId','')::uuid;
 if die between 3 and 5 then
  if group_id is null or exists(select 1 from public.henchman_groups where id=group_id) then raise exception 'Choose a new group for the Captured Thrall.'; end if;
  if coalesce((select sum(size) from public.henchman_groups where warband_id=w.id and unit_type_rules_id='cursed_cavalcade_captured_thrall'),0)>=5 then raise exception 'This warband already has five Captured Thralls.'; end if;
 elsif die=6 then
  select * into hero from public.heroes where id=hero_id and warband_id=w.id and status='active' and not is_hired_sword;
  if not found then raise exception 'Randomly select a surviving ordinary Hero for +1 XP.'; end if;
  select coalesce(array_agg(t),'{}') into expected_advances from unnest(public.hero_xp_thresholds(hero.unit_type_rules_id)) t where t>hero.xp and t<=hero.xp+1;
 end if;
 select coalesce(jsonb_object_agg(x.key,x.total),'{}'::jsonb) into kit from (
  select public.captive_item_key(i->>'item_rules_id',i->>'custom_name',i->>'notes') key,sum((i->>'quantity')::int) total from jsonb_array_elements(coalesce(p_case.model_snapshot->'items','[]'::jsonb)) i group by 1
 ) x;
 for c in select x from jsonb_array_elements(p_captor_changes) x loop
  v_id:=nullif(c->>'id','')::uuid; d:=coalesce(c->'data','{}'::jsonb);
  select coalesce(array_agg(x),'{}') into keys from jsonb_object_keys(d) x;
  tag:=(c->>'table')||':'||coalesce(v_id::text,'missing');
  if c->>'op'<>'insert' or v_id is not null then
   if tag=any(seen) then raise exception 'The outcome changes the same row twice.'; end if;
   seen:=seen||tag;
  end if;
  if c->>'table'='henchman_groups' and c->>'op'='insert' and die between 3 and 5 then
   if group_seen or v_id is distinct from group_id or not(keys<@array['name','unit_type_rules_id','size','stats','xp','level_ups','stat_increases','is_large','notes','sort_order','model_names','campaign_state']) then raise exception 'Create exactly one new printed Captured Thrall.'; end if;
   if d->>'unit_type_rules_id' is distinct from 'cursed_cavalcade_captured_thrall' or d->'stats' is distinct from '{"M":4,"WS":3,"BS":3,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":5}'::jsonb
    or coalesce((d->>'size')::int,0)<>1 or coalesce((d->>'xp')::int,0)<>0 or coalesce((d->>'level_ups')::int,0)<>0
    or coalesce(d->'stat_increases','{}'::jsonb)<>'{}'::jsonb or coalesce(d->'campaign_state','{}'::jsonb)<>'{}'::jsonb or coalesce((d->>'is_large')::boolean,false)
    or coalesce(jsonb_array_length(d->'model_names'),0)>1 or length(coalesce(d->>'name','')) not between 1 and 80 then raise exception 'The Captured Thrall must have its printed profile, size one and no experience or special state.'; end if;
   group_seen:=true;
  elsif c->>'table'='heroes' and c->>'op'='update' and die=6 and v_id=hero_id then
   if xp_seen or keys<>array['xp'] or (d->>'xp')::int is distinct from hero.xp+1 then raise exception 'The selected Hero gains exactly one XP.'; end if;
   xp_seen:=true;
  elsif c->>'table'='items' and c->>'op'='insert' then
   if not(keys<@array['holder_type','holder_id','item_rules_id','custom_name','quantity','notes']) then raise exception 'The outcome cannot add unrelated item fields.'; end if;
   qty:=coalesce((d->>'quantity')::int,1);
   if d->>'holder_type'='group' and die between 3 and 5 and nullif(d->>'holder_id','')::uuid=group_id and d->>'item_rules_id'='dagger' and coalesce(d->>'notes','')='' and nullif(d->>'custom_name','') is null then
    if qty<>1 then raise exception 'The new Thrall receives one free dagger.'; end if; dagger:=dagger+qty;
   elsif coalesce(d->>'holder_type','stash')='stash' and nullif(d->>'holder_id','') is null then
    key:=public.captive_item_key(d->>'item_rules_id',d->>'custom_name',d->>'notes');
    if not(kit ? key) or qty<1 then raise exception 'Keep only the captive’s recorded kit.'; end if;
    gained:=jsonb_set(gained,array[key],to_jsonb(coalesce((gained->>key)::int,0)+qty));
   else raise exception 'The captive’s kit goes to the captor’s stash.'; end if;
  elsif c->>'table'='items' and c->>'op'='update' then
   select * into item from public.items where public.items.id=v_id and warband_id=w.id and holder_type='stash';
   if not found or keys<>array['quantity'] or coalesce((d->>'quantity')::int,0)<=item.quantity then raise exception 'Only add the recorded captive kit to the stash.'; end if;
   key:=public.captive_item_key(item.item_rules_id,item.custom_name,item.notes);
   if not(kit ? key) then raise exception 'Keep only the captive’s recorded kit.'; end if;
   gained:=jsonb_set(gained,array[key],to_jsonb(coalesce((gained->>key)::int,0)+(d->>'quantity')::int-item.quantity));
  else raise exception 'The Throne does not make this roster change.'; end if;
 end loop;
 if gained<>kit then raise exception 'Transfer exactly the captive’s recorded kit, including annotations and quantities.'; end if;
 if group_seen is distinct from (die between 3 and 5) or xp_seen is distinct from (die=6) or dagger>1 then raise exception 'The reward must match the Throne result.'; end if;
 for a in select x from jsonb_array_elements(p_advances) x loop
  threshold:=(a->>'threshold_xp')::int;
  if threshold is null or die<>6 or (a->>'subject_id')::uuid is distinct from hero_id or (a->>'warband_id')::uuid is distinct from w.id or coalesce(a->>'subject_type','hero')<>'hero' or not(threshold=any(expected_advances)) or threshold=any(received_advances) then raise exception 'Record only the advancement earned by this one XP.'; end if;
  received_advances:=received_advances||threshold;
 end loop;
 if cardinality(received_advances)<>cardinality(expected_advances) then raise exception 'Record the advancement earned by this one XP.'; end if;
 message:='D6: '||case when original is null then 'tabletop result '||die else 'app rolled '||original||case when original<>die then '; player changed this to '||die else '' end end||'. '||p_case.hero_name||case when die<3 then ' was swallowed by the Throne of Worms.' when die<6 then ' became a Captured Thrall.' else ' was sacrificed to the Throne; '||hero.name||' gains +1 XP.' end;
 return message||' Removed from the original warband. '||w.name||' keeps: '||coalesce((select string_agg(public.captive_kit_label(e.key)||case when e.value::int>1 then ' ×'||e.value else '' end,', ' order by e.key) from jsonb_each_text(kit) e),'no equipment')||'.';
end $$;
revoke all on function public.validate_henchman_throne(public.captive_cases,jsonb,jsonb,jsonb,jsonb) from public,authenticated;

do $$
declare original text; updated text;
begin
 select pg_get_functiondef('public.validate_captive_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb)'::regprocedure) into original;
 updated:=replace(original,'begin', $new$begin
  if p_case.subject_kind in ('hero','henchman') and exists(select 1 from public.warbands where id=p_case.captor_warband_id and type_rules_id='the_cursed_cavalcade') then
    if p_choice->>'kind' is distinct from 'throne' then raise exception 'The Throne of Worms replaces ordinary captured outcomes for the Cavalcade.'; end if;
    if p_case.subject_kind='henchman' then return public.validate_henchman_throne(p_case,p_choice,p_owner_changes,p_captor_changes,coalesce(p_advances,'[]'::jsonb)); end if;
  end if;
$new$);
 if updated=original then raise exception 'Could not find the captive routing function.'; end if;
 execute updated;
end $$;
