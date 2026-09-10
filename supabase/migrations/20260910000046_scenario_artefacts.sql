-- Scenario hoards and exploration share one lifetime campaign discovery ledger.
create or replace function public.record_campaign_artefact() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_campaign uuid; v_roll integer; v_existing uuid; v_reason text;
 v_entries jsonb := '[]'::jsonb; v_entry jsonb; v_seen integer[] := '{}';
begin
 if new.exploration -> 'artefact' is not null and new.exploration -> 'artefact' <> 'null'::jsonb then
   v_entries := jsonb_build_array(new.exploration -> 'artefact');
 end if;
 if new.applied -> 'scenario_artefacts' is not null and new.applied -> 'scenario_artefacts' <> 'null'::jsonb then
   if jsonb_typeof(new.applied -> 'scenario_artefacts') <> 'array' then raise exception 'Record scenario artefacts as a list.'; end if;
   v_entries := v_entries || (new.applied -> 'scenario_artefacts');
 end if;
 if jsonb_array_length(v_entries)=0 then return new; end if;
 select campaign_id into v_campaign from public.matches where id=new.match_id;
 perform 1 from public.campaigns where id=v_campaign for update;
 for v_entry in select value from jsonb_array_elements(v_entries) loop
   v_roll := (v_entry ->> 'roll')::integer;
   if v_roll is null or v_roll not between 1 and 6 then raise exception 'Record a valid magical artefact D6.'; end if;
   v_reason := trim(coalesce(v_entry ->> 'overrideReason',''));
   if v_roll = any(v_seen) and v_reason = '' then raise exception 'The same magical artefact appears twice in this report. Roll again, or record an explained override.'; end if;
   v_seen := array_append(v_seen,v_roll);
   select first_report_id into v_existing from public.campaign_artefacts where campaign_id=v_campaign and artefact_roll=v_roll;
   if found and v_existing is distinct from new.id then
     if v_reason = '' then raise exception 'This magical artefact has already been found in the campaign. Roll again, or record an explained override.'; end if;
   else
     insert into public.campaign_artefacts(campaign_id,artefact_roll,first_report_id,first_warband_id)
     values(v_campaign,v_roll,new.id,new.warband_id) on conflict do nothing;
   end if;
 end loop;
 return new;
end; $$;
drop trigger record_campaign_artefact on public.match_reports;
create trigger record_campaign_artefact after insert or update of exploration, applied on public.match_reports for each row execute function public.record_campaign_artefact();
