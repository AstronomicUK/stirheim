-- The player who controls a defeated key holder must confirm the next keeper.
create function public.notify_engine_key_holder_loss() returns trigger
language plpgsql security definer set search_path='' as $$
declare recipient record;
begin
 if new.reverted_at is not null then
  delete from public.app_notifications where dedupe_key like 'engine-key-loss:'||new.id||':%';
  return new;
 end if;
 if not coalesce((new.payload->>'out_of_action')::boolean,false) then return new; end if;
 for recipient in
  select distinct w.owner_id,w.id warband_id
  from public.engine_rescue_battles r
  cross join lateral jsonb_array_elements(r.state->'keys') k
  join public.warbands w on w.id::text=k->'keeper'->>'warbandId'
  where r.match_id=new.match_id and split_part(k->'keeper'->>'id',':',1)=new.payload->>'target_id'
   and (new.payload->>'target_kind'<>'group' or not new.payload ? 'target_model_index'
    or split_part(k->'keeper'->>'id',':',2)=new.payload->>'target_model_index')
 loop
  insert into public.app_notifications(user_id,kind,title,body,href,dedupe_key)
  values(recipient.owner_id,'captive','Check your prison keys',left(coalesce(new.payload->>'target_name','Your key holder')||' was taken out of action. Confirm the particular model and who now carries the keys in Prisoners and rescue.',2000),'/matches/'||new.match_id||'/battle','engine-key-loss:'||new.id||':'||recipient.warband_id)
  on conflict do nothing;
 end loop;
 return new;
end $$;
revoke all on function public.notify_engine_key_holder_loss() from public,authenticated;
create trigger notify_engine_key_holder_loss after insert on public.battle_events for each row execute function public.notify_engine_key_holder_loss();
create trigger refresh_engine_key_holder_loss after update of reverted_at on public.battle_events for each row when(old.reverted_at is distinct from new.reverted_at) execute function public.notify_engine_key_holder_loss();
