-- Keep return history readable after its recipient leaves the roster. Names are taken
-- from the authoritative Hero rows when the award is applied, never from client text.
create function public.record_engine_reward_names() returns trigger
language plpgsql security definer set search_path = '' as $$
declare allocations jsonb;
begin
  if new.state = 'returned' and old.state is distinct from 'returned' then
    select coalesce(jsonb_agg(a.value || jsonb_build_object('name', h.name) order by a.ordinality), '[]'::jsonb)
      into allocations
      from jsonb_array_elements(coalesce(new.reward->'allocations', '[]'::jsonb)) with ordinality a(value, ordinality)
      join public.heroes h on h.id = (a.value->>'heroId')::uuid and h.warband_id = new.warband_id;
    if jsonb_array_length(allocations) <> jsonb_array_length(coalesce(new.reward->'allocations', '[]'::jsonb)) then
      raise exception 'An Engine reward recipient no longer belongs to this warband. Reload before recording the return.' using errcode = '40001';
    end if;
    new.reward := jsonb_set(new.reward, '{allocations}', allocations);
  end if;
  return new;
end $$;
revoke all on function public.record_engine_reward_names() from public;
create trigger record_engine_reward_names before update of state on public.engine_journeys
for each row execute function public.record_engine_reward_names();
