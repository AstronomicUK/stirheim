-- Lustrian Prospect replacements earn an immediate Hero advance even at zero XP.
-- Keep replacement, equipment transfer and queued advance in one snapshot-checked transaction.
create or replace function public.resolve_roster_event(
 p_warband_id uuid, p_updated timestamptz, p_reason text,
 p_changes jsonb, p_expected jsonb, p_advances jsonb
) returns void language plpgsql security invoker set search_path='' as $$
declare w record; t text; a jsonb; actual_count int;
begin
 if not public.can_edit_warband(p_warband_id) then raise exception 'Cannot edit this warband.' using errcode='42501'; end if;
 select id,updated_at into strict w from public.warbands where id=p_warband_id for update;
 if w.updated_at is distinct from p_updated then raise exception 'The warband changed. Reload and review the outcome.' using errcode='40001'; end if;
 foreach t in array array['heroes','henchman_groups','items'] loop
  if jsonb_typeof(p_expected->t) is distinct from 'array' then raise exception 'Missing roster snapshot.'; end if;
  actual_count:=0;
  for w in execute format('select id,updated_at from public.%I where warband_id=$1 order by id for update',t) using p_warband_id loop
   actual_count:=actual_count+1;
   if not exists(select 1 from jsonb_array_elements(p_expected->t) e where (e->>'id')::uuid=w.id and (e->>'updated_at')::timestamptz=w.updated_at) then raise exception 'The roster changed. Reload and review the outcome.' using errcode='40001'; end if;
  end loop;
  if actual_count<>jsonb_array_length(p_expected->t) then raise exception 'The roster changed. Reload and review the outcome.' using errcode='40001'; end if;
 end loop;
 perform public.update_roster(p_warband_id,p_reason,p_changes);
 for a in select * from jsonb_array_elements(p_advances) loop
  insert into public.pending_advances(warband_id,subject_type,subject_id,threshold_xp)
  select p_warband_id,'hero',(a->>'subject_id')::uuid,(a->>'threshold_xp')::int
  where exists(select 1 from public.heroes h where h.id=(a->>'subject_id')::uuid and h.warband_id=p_warband_id and (h.xp>=(a->>'threshold_xp')::int or ((a->>'threshold_xp')::int=1 and h.flags->>'lustrianReplacementOf' is not null and exists(select 1 from public.warbands wb where wb.id=p_warband_id and wb.type_rules_id='lustrian_reavers'))))
   and not exists(select 1 from public.pending_advances p where p.subject_id=(a->>'subject_id')::uuid and p.threshold_xp=(a->>'threshold_xp')::int);
 end loop;
end;
$$;
revoke all on function public.resolve_roster_event(uuid,timestamptz,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.resolve_roster_event(uuid,timestamptz,text,jsonb,jsonb,jsonb) to authenticated;
