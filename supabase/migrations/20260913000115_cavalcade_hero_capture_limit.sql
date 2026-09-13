-- Cavalcade Capture!: reroll Hero 61 after two captures this battle, or while
-- the warband has five Captured Thralls. Recheck under the same captor lock as
-- the Misericordia event path, including assigning an initially unknown captor.
create function public.guard_cavalcade_hero_capture() returns trigger
language plpgsql security definer set search_path='' as $$
declare facts jsonb; faction text;
begin
 if new.captor_warband_id is null or new.subject_kind<>'hero' or new.source<>'captured' or new.state='withdrawn' then return new; end if;
 if tg_op='UPDATE' then
  if old.captor_warband_id is not distinct from new.captor_warband_id then return new; end if;
 end if;
 select type_rules_id into faction from public.warbands where id=new.captor_warband_id for update;
 if faction is distinct from 'the_cursed_cavalcade' then return new; end if;
 facts:=public.cavalcade_capture_counts(new.match_id,new.captor_warband_id);
 if (facts->>'capturedThralls')::int>=5 or (facts->>'capturedThisBattle')::int>=2 then
  raise exception 'The Cavalcade capture limit has been reached. Reroll this Hero''s Captured (61) injury before filing the report.';
 end if;
 return new;
end $$;
revoke all on function public.guard_cavalcade_hero_capture() from public,authenticated;
create trigger guard_cavalcade_hero_capture before insert or update of captor_warband_id on public.captive_cases for each row execute function public.guard_cavalcade_hero_capture();
