-- Captures depend on the casualty log. Reversing a prior group casualty also changes
-- the ordinal used to identify its captured members, even if that hit was ordinary.
-- Use the existing correction order: reverse resolved outcomes, withdraw the report,
-- then correct the combat log and submit the corrected report.
create function public.guard_applied_capture_event_reversal()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.reverted_at is not null or new.reverted_at is null
     or old.payload->>'out_of_action' is distinct from 'true' then return new; end if;

  perform r.id from public.match_reports r where r.match_id=old.match_id
    order by r.id for update;
  if exists (
    select 1 from public.captive_cases c join public.match_reports r on r.id=c.report_id
    where c.match_id=old.match_id and r.undo is not null
      and r.revision=c.report_revision
      and c.victim_warband_id::text=old.payload->>'target_warband_id'
      and (
        c.model_snapshot->>'event_id'=old.id::text
        or (c.subject_kind in ('hero','henchman') and c.hero_id::text=old.payload->>'target_id')
      )
  ) then
    raise exception 'Withdraw the affected post-battle report before reverting this casualty. Reverse any resolved capture outcome first.';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_applied_capture_event_reversal() from public, authenticated;
create trigger guard_applied_capture_event_reversal before update of reverted_at on public.battle_events
  for each row execute function public.guard_applied_capture_event_reversal();
