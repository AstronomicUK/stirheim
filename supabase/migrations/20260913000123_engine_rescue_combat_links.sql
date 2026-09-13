-- A key event may cite a real casualty instead of leaving players to re-enter its provenance.
do $patch$ declare original text; updated text; begin
 original:=pg_get_functiondef('public.record_engine_rescue_action(uuid,integer,jsonb,text)'::regprocedure);
 updated:=replace(original,'shared_keys boolean:=false;','shared_keys boolean:=false; source_event public.battle_events%rowtype; target_key text;');
 updated:=replace(updated,$old$ next_state:=r.state;$old$,$new$ next_state:=r.state;
 if p_action->>'sourceEventId' is not null then
  select * into source_event from public.battle_events where id=(p_action->>'sourceEventId')::uuid and match_id=r.match_id and reverted_at is null and kind='attack';
  if source_event.id is null or not coalesce((source_event.payload->>'out_of_action')::boolean,false) then raise exception 'Choose an unreverted out-of-action result from this battle.'; end if;
  if action_type='gaolerOut' then target_key:=p_action->>'gaolerId';
  elsif action_type='keeperOut' then target_key:=split_part(p_action->>'keeperId',':',1);
  else raise exception 'Only a Gaoler or key-holder casualty can use this combat source.'; end if;
  if source_event.payload->>'target_id' is distinct from target_key then raise exception 'This combat result concerns a different casualty.'; end if;
  if action_type='keeperOut' and source_event.payload->>'target_kind'='group' and source_event.payload ? 'target_model_index' and split_part(p_action->>'keeperId',':',2) is distinct from source_event.payload->>'target_model_index' then raise exception 'This casualty is a different member of the group.'; end if;
  if p_action->'by' is not null and p_action->'by'<>'null'::jsonb and split_part(p_action->'by'->>'id',':',1) is distinct from source_event.payload->>'attacker_id' then raise exception 'The new key holder must match the attacker in this result.'; end if;
 end if;$new$);
 if updated=original or updated not like '%source_event public.battle_events%' then raise exception 'Rescue action source boundary changed.'; end if;execute updated;
end $patch$;

create function public.guard_engine_rescue_combat_source() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.reverted_at is not null and old.reverted_at is null and exists(select 1 from public.engine_rescue_battles r cross join lateral jsonb_array_elements(r.history) h where r.match_id=new.match_id and h->'action'->>'sourceEventId'=new.id::text and not h ? 'revertedAt') then raise exception 'Correct the linked prison-key event before reversing this casualty.'; end if;
 return new;
end $$;
revoke all on function public.guard_engine_rescue_combat_source() from public,authenticated;
create trigger guard_engine_rescue_combat_source before update of reverted_at on public.battle_events for each row execute function public.guard_engine_rescue_combat_source();

create function public.notify_engine_gaoler_keys() returns trigger
language plpgsql security definer set search_path='' as $$
declare gaoler public.heroes%rowtype; recipient uuid;
begin
 if new.reverted_at is not null then delete from public.app_notifications where dedupe_key='engine-keys:'||new.id;return new;end if;
 if not coalesce((new.payload->>'out_of_action')::boolean,false) then return new; end if;
 select * into gaoler from public.heroes where id::text=new.payload->>'target_id' and unit_type_rules_id='black_dwarfs_gaolers';
 if gaoler.id is null or not exists(select 1 from public.match_participants where match_id=new.match_id and warband_id=gaoler.warband_id) or not exists(select 1 from public.match_participants where match_id=new.match_id and warband_id::text=new.payload->>'attacker_warband_id') or not exists(select 1 from public.engine_of_chaos_units where warband_id=gaoler.warband_id and state='present') then return new; end if;
 select owner_id into recipient from public.warbands where id::text=new.payload->>'attacker_warband_id';
 if recipient is null or new.payload->>'attacker_warband_id'=gaoler.warband_id::text then return new; end if;
 insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key) values(recipient,'captive','Prison keys to record',left(coalesce(new.payload->>'attacker_name','Your model')||' took '||gaoler.name||' out of action. Confirm the key holder in Prisoners and rescue on the battle sheet.',2000),'/matches/'||new.match_id||'/battle','engine-keys:'||new.id) on conflict do nothing;
 return new;
end $$;
revoke all on function public.notify_engine_gaoler_keys() from public,authenticated;
create trigger notify_engine_gaoler_keys after insert on public.battle_events for each row execute function public.notify_engine_gaoler_keys();

create trigger refresh_engine_gaoler_keys after update of reverted_at on public.battle_events for each row when (old.reverted_at is distinct from new.reverted_at) execute function public.notify_engine_gaoler_keys();
