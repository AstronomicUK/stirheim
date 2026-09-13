-- Cruel Fate applies to captured henchmen as well as Heroes (grade-1c:971).
create function public.validate_henchman_wretch(p_case public.captive_cases,p_choice jsonb,p_owner_changes jsonb,p_captor_changes jsonb,p_advances jsonb)
returns text language plpgsql security definer set search_path='' as $$
declare
 w public.warbands%rowtype; item public.items%rowtype;
 group_id uuid; c jsonb; d jsonb;
 keys text[]; tag text; seen text[]:='{}'; v_id uuid; qty int; key text;
 kit jsonb; gained jsonb:='{}'; group_seen boolean:=false;
 message text;
begin
 select * into w from public.warbands where id=p_case.captor_warband_id;
 if w.type_rules_id is distinct from 'court_of_the_profane_pleasures' or p_case.subject_kind<>'henchman' or p_case.source<>'forced_capture' then raise exception 'Choose a captured Court henchman case.'; end if;
 if p_choice->>'kind' is distinct from 'wretch' then raise exception 'Choose the Cruel Fate conversion.'; end if;
 if coalesce(p_owner_changes,'[]'::jsonb)<>'[]'::jsonb then raise exception 'This henchman already left in the battle report; do not remove or change another model.'; end if;
 if jsonb_typeof(p_captor_changes) is distinct from 'array' or jsonb_typeof(p_advances) is distinct from 'array' then raise exception 'Record the outcome changes and advances.'; end if;
 if not exists(select 1 from public.battle_events where id=(p_case.model_snapshot->>'event_id')::uuid and reverted_at is null) then raise exception 'The capture event was reverted; correct its report first.'; end if;
 if coalesce(p_advances,'[]'::jsonb)<>'[]'::jsonb then raise exception 'Cruel Fate awards no experience or advances.'; end if;
 group_id:=nullif(p_choice->>'groupId','')::uuid;
 if group_id is null or exists(select 1 from public.henchman_groups where id=group_id) then raise exception 'Choose a new group for the Wretch.'; end if;
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
  if c->>'table'='henchman_groups' and c->>'op'='insert' then
   if group_seen or v_id is distinct from group_id or not(keys<@array['name','unit_type_rules_id','size','stats','xp','level_ups','stat_increases','is_large','notes','sort_order','model_names','campaign_state']) then raise exception 'Create exactly one new printed Wretch.'; end if;
   if d->>'unit_type_rules_id' is distinct from 'court_of_pleasures_wretches' or d->'stats' is distinct from '{"M":4,"WS":2,"BS":2,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":5}'::jsonb
    or coalesce((d->>'size')::int,0)<>1 or coalesce((d->>'xp')::int,0)<>0 or coalesce((d->>'level_ups')::int,0)<>0
    or coalesce(d->'stat_increases','{}'::jsonb)<>'{}'::jsonb or coalesce(d->'campaign_state','{}'::jsonb)<>'{}'::jsonb or coalesce((d->>'is_large')::boolean,false)
    or coalesce(jsonb_array_length(d->'model_names'),0)>1 or length(coalesce(d->>'name','')) not between 1 and 80 then raise exception 'The Wretch must have its printed profile, size one and no experience or special state.'; end if;
   group_seen:=true;
  elsif c->>'table'='items' and c->>'op'='insert' then
   if not(keys<@array['holder_type','holder_id','item_rules_id','custom_name','quantity','notes']) then raise exception 'The outcome cannot add unrelated item fields.'; end if;
   qty:=coalesce((d->>'quantity')::int,1);
   if coalesce(d->>'holder_type','stash')='stash' and nullif(d->>'holder_id','') is null then
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
  else raise exception 'Cruel Fate does not make this roster change.'; end if;
 end loop;
 if gained<>kit then raise exception 'Transfer exactly the captive’s recorded kit, including annotations and quantities.'; end if;
 if not group_seen then raise exception 'Create exactly one Wretch.'; end if;
 message:='Cruel Fate: '||p_case.hero_name||' became a Wretch.';
 return message||' Removed from the original warband. '||w.name||' keeps: '||coalesce((select string_agg(public.captive_kit_label(e.key)||case when e.value::int>1 then ' ×'||e.value else '' end,', ' order by e.key) from jsonb_each_text(kit) e),'no equipment')||'.';
end $$;
revoke all on function public.validate_henchman_wretch(public.captive_cases,jsonb,jsonb,jsonb,jsonb) from public,authenticated;

do $$ declare original text; updated text; begin
 original:=pg_get_functiondef('public.validate_captive_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb)'::regprocedure);
 updated:=replace(original,'begin', $route$begin
  if p_case.subject_kind='henchman' and p_choice->>'kind'='wretch' then return public.validate_henchman_wretch(p_case,p_choice,p_owner_changes,p_captor_changes,coalesce(p_advances,'[]'::jsonb)); end if;
$route$);
 if updated=original then raise exception 'Captive proposal routing changed.'; end if;execute updated;
end $$;
