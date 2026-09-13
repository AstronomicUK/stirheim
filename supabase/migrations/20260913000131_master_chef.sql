-- One saved Master Chef roll per warband/sequence, including the pre-first-battle phase.
-- Corrections retain the original result and require an explanation; no treasury changes here.
create table public.master_chef_checks (
 id uuid primary key default gen_random_uuid(),
 warband_id uuid not null references public.warbands(id) on delete cascade,
 match_id uuid references public.matches(id) on delete cascade,
 roll integer not null check (roll between 1 and 6),
 original_roll integer not null check (original_roll between 1 and 6),
 source text not null check (source in ('app','tabletop')),
 revision integer not null default 1,
 request_id uuid not null,
 correction_reason text not null default '',
 sold boolean not null default false,
 unique nulls not distinct (warband_id,match_id)
);
alter table public.master_chef_checks enable row level security;
create policy master_chef_read on public.master_chef_checks for select to authenticated using (public.can_read_warband(warband_id));
revoke all on public.master_chef_checks from anon,authenticated;
grant select on public.master_chef_checks to authenticated;
create trigger audit_master_chef_checks after insert or update of roll,revision or delete on public.master_chef_checks for each row execute function public.audit_row();

create function public.record_master_chef(p_warband_id uuid,p_match_id uuid,p_roll integer,p_source text,p_request_id uuid,p_expected_revision integer default null,p_reason text default '')
returns public.master_chef_checks language plpgsql security definer set search_path='' as $$
declare r public.master_chef_checks%rowtype; latest uuid; reason text; template text;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'You cannot trade for this warband' using errcode='42501'; end if;
 select type_rules_id into template from public.warbands where id=p_warband_id for update;
 if p_roll is null or p_roll not between 1 and 6 or p_source is null or p_source not in ('app','tabletop') or p_request_id is null then raise exception 'Record one D6 and how it was rolled'; end if;
 select * into r from public.master_chef_checks where warband_id=p_warband_id and match_id is not distinct from p_match_id for update;
 if r.request_id=p_request_id then
  if r.roll=p_roll and r.source=p_source and r.correction_reason=coalesce(trim(p_reason),'') then return r; end if;
  raise exception 'This request was already saved with different details';
 end if;
 select match_id into latest from public.match_reports where warband_id=p_warband_id order by submitted_at desc limit 1;
 if latest is distinct from p_match_id then raise exception 'The post-battle sequence changed; reload before rolling'; end if;
 if template<>'halflings' or not (exists(select 1 from public.heroes where warband_id=p_warband_id and unit_type_rules_id='halflings_cook' and status='active' and not is_hired_sword) or exists(select 1 from public.henchman_groups where warband_id=p_warband_id and unit_type_rules_id='halflings_cook' and size>0)) then raise exception 'An active Halfling Cook is required'; end if;
 if coalesce(r.sold,false) or exists(select 1 from public.trade_phase_state where warband_id=p_warband_id and match_id=p_match_id and wyrdstone_sold) then raise exception 'Wyrdstone has already been sold; the Cook roll cannot change'; end if;
 if r.id is not null then
  if p_expected_revision is distinct from r.revision then raise exception 'The Cook roll changed or is already recorded; reload before correcting'; end if;
  if length(trim(coalesce(p_reason,'')))<3 then raise exception 'Explain the correction to the saved Cook roll'; end if;
  reason:=format('Master Chef: corrected D6 %s to %s (original %s). %s',r.roll,p_roll,r.original_roll,trim(p_reason));
 else
  if p_expected_revision is not null then raise exception 'No saved Cook roll exists to correct'; end if;
  reason:=format('Master Chef: %s D6 %s.',case when p_source='app' then 'rolled in app' else 'entered tabletop roll' end,p_roll);
 end if;
 reason:=reason||case when p_roll>=5 then ' 5+ succeeded: sell as one size band smaller (minimum 1–3).' else ' 5+ failed: normal income band.' end;
 perform set_config('stirheim.audit_reason',reason,true);
 insert into public.master_chef_checks(warband_id,match_id,roll,original_roll,source,request_id,correction_reason)
 values(p_warband_id,p_match_id,p_roll,p_roll,p_source,p_request_id,coalesce(trim(p_reason),''))
 on conflict(warband_id,match_id) do update set roll=excluded.roll,source=excluded.source,request_id=excluded.request_id,correction_reason=excluded.correction_reason,revision=master_chef_checks.revision+1 returning * into r;
 return r;
end $$;
revoke all on function public.record_master_chef(uuid,uuid,integer,text,uuid,integer,text) from public,anon;
grant execute on function public.record_master_chef(uuid,uuid,integer,text,uuid,integer,text) to authenticated;

-- Wrap the ordinary sale transaction with the persisted-roll and treasury freshness checks.
create function public.record_wyrdstone_sale(p_warband_id uuid,p_match_id uuid,p_changes jsonb,p_reason text,p_expected_gold integer,p_expected_shards integer,p_chef_revision integer default null)
returns integer language plpgsql security definer set search_path='' as $$
declare w public.warbands%rowtype; r public.master_chef_checks%rowtype; latest uuid; result integer; chef boolean;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband_id) then raise exception 'You cannot trade for this warband' using errcode='42501'; end if;
 select * into w from public.warbands where id=p_warband_id for update;
 if w.gold is distinct from p_expected_gold or w.wyrdstone is distinct from p_expected_shards then raise exception 'The treasury changed; reload before selling'; end if;
 select match_id into latest from public.match_reports where warband_id=p_warband_id order by submitted_at desc limit 1;
 if latest is distinct from p_match_id then raise exception 'The post-battle sequence changed; reload before selling'; end if;
 select * into r from public.master_chef_checks where warband_id=p_warband_id and match_id is not distinct from p_match_id for update;
 chef:=w.type_rules_id='halflings' and (exists(select 1 from public.heroes where warband_id=p_warband_id and unit_type_rules_id='halflings_cook' and status='active' and not is_hired_sword) or exists(select 1 from public.henchman_groups where warband_id=p_warband_id and unit_type_rules_id='halflings_cook' and size>0));
 if chef and (r.id is null or p_chef_revision is distinct from r.revision) then raise exception 'Record or reload the Cook roll before selling'; end if;
 if not chef and p_chef_revision is not null then raise exception 'The Cook is no longer available; reload the income quote'; end if;
 if r.sold then raise exception 'Wyrdstone already sold this sequence'; end if;
 result:=public.record_trade(p_warband_id,p_match_id,p_changes,true,'{}'::uuid[],p_reason);
 if r.id is not null then
  perform set_config('stirheim.audit_reason','Master Chef result used for the wyrdstone sale.',true);
  update public.master_chef_checks set sold=true where id=r.id;
 end if;
 return result;
end $$;
revoke all on function public.record_wyrdstone_sale(uuid,uuid,jsonb,text,integer,integer,integer) from public,anon;
grant execute on function public.record_wyrdstone_sale(uuid,uuid,jsonb,text,integer,integer,integer) to authenticated;
