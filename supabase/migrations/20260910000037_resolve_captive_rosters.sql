drop function if exists public.resolve_captive_rosters(uuid,uuid,timestamptz,timestamptz,text,jsonb,jsonb,jsonb);
-- Captive outcomes change two rosters together. Keep the existing per-roster RLS,
-- lock in a stable order, and reject stale previews before applying either half.
create or replace function public.resolve_captive_rosters(
  p_first uuid, p_second uuid, p_first_updated timestamptz, p_second_updated timestamptz,
  p_reason text, p_first_changes jsonb, p_second_changes jsonb, p_expected jsonb, p_advances jsonb default '[]'::jsonb
) returns void language plpgsql security invoker set search_path = '' as $$
declare w record; t text; expected_count int; actual_count int; a jsonb;
begin
  if p_first = p_second or not public.can_edit_warband(p_first) or not public.can_edit_warband(p_second) then
    raise exception 'The owner of both warbands or their campaign GM must record this outcome.' using errcode = '42501';
  end if;
  for w in select id, updated_at from public.warbands where id in (p_first, p_second) order by id for update loop
    if (w.id = p_first and w.updated_at is distinct from p_first_updated)
       or (w.id = p_second and w.updated_at is distinct from p_second_updated) then
      raise exception 'A warband changed. Reload and review the captive outcome again.' using errcode = '40001';
    end if;
  end loop;
  foreach t in array array['heroes','henchman_groups','items'] loop
    if jsonb_typeof(p_expected -> t) is distinct from 'array' then raise exception 'Missing roster snapshot.'; end if;
    expected_count := jsonb_array_length(p_expected -> t);
    actual_count := 0;
    for w in execute format('select id, updated_at from public.%I where warband_id in ($1,$2) order by id for update', t) using p_first,p_second loop
      actual_count := actual_count + 1;
      if not exists (select 1 from jsonb_array_elements(p_expected -> t) e where (e->>'id')::uuid=w.id and (e->>'updated_at')::timestamptz=w.updated_at) then
        raise exception 'A warrior or item changed. Reload and review the outcome again.' using errcode='40001';
      end if;
    end loop;
    if actual_count <> expected_count then raise exception 'The roster changed. Reload and review the outcome again.' using errcode='40001'; end if;
  end loop;
  perform public.update_roster(p_first, p_reason, p_first_changes);
  perform public.update_roster(p_second, p_reason, p_second_changes);
  for a in select * from jsonb_array_elements(p_advances) loop
    if (a->>'warband_id')::uuid not in (p_first,p_second) then raise exception 'Advance belongs to another warband.'; end if;
    insert into public.pending_advances(warband_id,subject_type,subject_id,threshold_xp)
    select (a->>'warband_id')::uuid,'hero',(a->>'subject_id')::uuid,(a->>'threshold_xp')::int
    where exists (select 1 from public.heroes h where h.id=(a->>'subject_id')::uuid and h.warband_id=(a->>'warband_id')::uuid and h.xp >= (a->>'threshold_xp')::int)
      and not exists (select 1 from public.pending_advances p where p.subject_id=(a->>'subject_id')::uuid and p.threshold_xp=(a->>'threshold_xp')::int);
  end loop;
end;
$$;
revoke all on function public.resolve_captive_rosters(uuid,uuid,timestamptz,timestamptz,text,jsonb,jsonb,jsonb,jsonb) from public;
grant execute on function public.resolve_captive_rosters(uuid,uuid,timestamptz,timestamptz,text,jsonb,jsonb,jsonb,jsonb) to authenticated;
