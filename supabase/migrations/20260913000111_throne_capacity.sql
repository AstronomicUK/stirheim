-- Recheck the source's five Captured Thralls limit at proposal and acceptance.
-- Do not apply the ordinary thirteen-model maximum: Extra Servitors explicitly
-- places these Thralls outside it (grade-1c.md:1337). Existing consent locks and
-- snapshot checks serialize competing outcomes on the same captor warband.
do $migration$
declare original text; updated text;
begin
 select pg_get_functiondef('public.validate_core_captive_roster_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb)'::regprocedure) into original;
 updated := replace(original,
  $old$if d6 between 3 and 5 then expect_group := 'cursed_cavalcade_captured_thrall';$old$,
  $new$if d6 between 3 and 5 then
        if coalesce((select sum(size) from public.henchman_groups where warband_id=k.id and unit_type_rules_id='cursed_cavalcade_captured_thrall'),0) >= 5 then
          raise exception 'This warband already has five Captured Thralls.' using errcode='22023';
        end if;
        expect_group := 'cursed_cavalcade_captured_thrall';$new$);
 if updated=original then raise exception 'Could not find the current Throne reward validation.'; end if;
 execute updated;
end $migration$;
