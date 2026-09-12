-- A settled capture relies on both the source report and the captor's filed win.
-- Reverse the settlement before either report is withdrawn or its result changed.
create or replace function public.guard_trade_wagon_report_dependency()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if new.match_id is not distinct from old.match_id
      and new.warband_id is not distinct from old.warband_id
      and new.result is not distinct from old.result
      and new.won is not distinct from old.won
      and not (old.undo is not null and new.undo is null) then
      return new;
    end if;
  end if;
  perform 1 from public.matches where id=old.match_id for update;
  if exists(select 1 from public.trade_wagon_captures c
    where c.match_id=old.match_id and c.state='settled'
      and (c.report_id=old.id or c.captor_id=old.warband_id)) then
    raise exception 'Undo the agreed Trade Wagon settlement before withdrawing or changing this battle result';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_trade_wagon_report_dependency() from public,authenticated;
create trigger trade_wagon_report_dependency before update or delete on public.match_reports
for each row execute function public.guard_trade_wagon_report_dependency();
