-- A declared cargo must have exactly one settlement before the battle is complete.
-- Undeclared legacy/imported battles are not retroactively assigned invented cargo.
create or replace function public.check_rawhide_completion()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.state='completed' and old.state is distinct from 'completed' and exists(select 1 from public.rawhide_cargo c where c.match_id=new.id and c.reserved_at is not null and c.settled_report_id is null) then
    raise exception 'Settle the declared Rawhide cargo in the receiving warband’s report before completing this battle';
  end if;
  return new;
end; $$;
revoke all on function public.check_rawhide_completion() from public,authenticated;
create trigger check_rawhide_completion before update of state on public.matches for each row execute function public.check_rawhide_completion();
