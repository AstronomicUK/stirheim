-- Facio's fine clothes affect recruitment in the first battle after finding
-- his stash, including captive cases resolved later. They never change base Ld.
create function public.facio_recruitment_bonus(p_warband_id uuid, p_match_id uuid)
returns boolean language sql stable set search_path = '' as $fn$
  select exists (
    select 1 from public.match_reports r
    join public.matches origin on origin.id=r.match_id
    where r.warband_id=p_warband_id and r.status='applied'
      and r.applied->'scenario_effects'->>'facio'='true'
      and p_match_id=(
        select next_match.id from public.match_participants participant
        join public.matches next_match on next_match.id=participant.match_id
        where participant.warband_id=p_warband_id and next_match.id<>r.match_id
          and next_match.started_at>coalesce(origin.started_at,r.submitted_at)
        order by next_match.started_at,next_match.id limit 1
      )
  );
$fn$;
revoke all on function public.facio_recruitment_bonus(uuid,uuid) from public,anon,authenticated;

do $migration$
declare definition text;
 original text := '  if (p_choice->>''captainLeadership'')::int is distinct from captain_ld then';
 replacement text := '  if public.facio_recruitment_bonus(k.id,p_case.match_id) then captain_ld:=least(10,captain_ld+1); end if;
  if (p_choice->>''captainLeadership'')::int is distinct from captain_ld then';
begin
 select pg_get_functiondef('public.validate_kidnapped_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb)'::regprocedure) into definition;
 if strpos(definition,original)=0 then raise exception 'Kidnapped Leadership guard changed; review Facio integration'; end if;
 execute replace(definition,original,replacement);
end $migration$;
