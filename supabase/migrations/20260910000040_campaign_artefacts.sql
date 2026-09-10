-- A discovery survives the original bearer, roster and report. Never delete player items.
create table public.campaign_artefacts (
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 artefact_roll integer not null check (artefact_roll between 1 and 6),
 first_report_id uuid references public.match_reports(id) on delete set null,
 first_warband_id uuid references public.warbands(id) on delete set null,
 found_at timestamptz not null default now(),
 primary key (campaign_id, artefact_roll)
);
-- Seed exact named discoveries from saved reports; do not alter any historic reward or item.
with names(roll,name) as (values
 (1,$n$The Boots and Rope of Pieter$n$),(2,$n$The Count of Ventimiglia's Misericordia$n$),
 (3,$n$Att'la's Plate Mail$n$),(4,$n$Bow of Seeking$n$),(5,$n$Executioner's Hood$n$),(6,$n$All-Seeing Eye of Numas$n$)
), discoveries as (
 select distinct on (m.campaign_id,n.roll) m.campaign_id,n.roll,r.id,r.warband_id,r.submitted_at
 from public.match_reports r join public.matches m on m.id=r.match_id
 cross join lateral jsonb_array_elements(case when jsonb_typeof(r.applied->'stash_items')='array' then r.applied->'stash_items' else '[]'::jsonb end) item
 join names n on lower(trim(item->>'custom_name'))=lower(n.name)
 where r.status <> 'returned'
 order by m.campaign_id,n.roll,r.submitted_at,r.id
)
insert into public.campaign_artefacts(campaign_id,artefact_roll,first_report_id,first_warband_id,found_at)
select campaign_id,roll,id,warband_id,submitted_at from discoveries on conflict do nothing;

alter table public.campaign_artefacts enable row level security;
create policy campaign_artefacts_read on public.campaign_artefacts for select to authenticated using (public.can_read_campaign(campaign_id));
revoke all on public.campaign_artefacts from anon, authenticated;
grant select on public.campaign_artefacts to authenticated;

create function public.campaign_artefact_ledger(p_campaign_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null or not public.can_read_campaign(p_campaign_id) then raise exception 'You cannot read this campaign.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('roll',a.artefact_roll,'reportId',a.first_report_id,'warbandId',a.first_warband_id,'warbandName',coalesce(w.name,'Former warband'),'foundAt',a.found_at) order by a.artefact_roll) from public.campaign_artefacts a left join public.warbands w on w.id=a.first_warband_id where a.campaign_id=p_campaign_id),'[]'::jsonb);
end; $$;
revoke all on function public.campaign_artefact_ledger(uuid) from public;
grant execute on function public.campaign_artefact_ledger(uuid) to authenticated;

create function public.record_campaign_artefact() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_campaign uuid; v_roll integer; v_existing uuid; v_reason text;
begin
 if new.exploration -> 'artefact' is null or new.exploration -> 'artefact' = 'null'::jsonb then return new; end if;
 v_roll := (new.exploration -> 'artefact' ->> 'roll')::integer;
 if v_roll is null or v_roll not between 1 and 6 then raise exception 'Record a valid magical artefact D6.'; end if;
 select campaign_id into v_campaign from public.matches where id=new.match_id;
 -- Campaign lock serializes simultaneous discoveries even when the ledger is still empty.
 perform 1 from public.campaigns where id=v_campaign for update;
 select first_report_id into v_existing from public.campaign_artefacts where campaign_id=v_campaign and artefact_roll=v_roll;
 if found and v_existing is distinct from new.id then
   v_reason := trim(coalesce(new.exploration -> 'artefact' ->> 'overrideReason',''));
   if v_reason = '' then raise exception 'This magical artefact has already been found in the campaign. Roll again, or record an explained override.'; end if;
 else
   insert into public.campaign_artefacts(campaign_id,artefact_roll,first_report_id,first_warband_id)
   values(v_campaign,v_roll,new.id,new.warband_id) on conflict do nothing;
 end if;
 return new;
end; $$;
create trigger record_campaign_artefact after insert or update of exploration on public.match_reports for each row execute function public.record_campaign_artefact();
