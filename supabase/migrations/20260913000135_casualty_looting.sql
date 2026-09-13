-- #158: one equipment snapshot per casualty, shared across every participating Bandit.
create table public.casualty_loot (
 id uuid primary key default gen_random_uuid(),
 report_id uuid not null references public.match_reports(id) on delete cascade,
 revision integer not null,match_id uuid not null references public.matches(id) on delete cascade,
 source_warband_id uuid not null references public.warbands(id) on delete cascade,
 subject_id uuid not null,subject_name text not null,body_count integer not null check(body_count>0),
 kit jsonb not null,allocations jsonb,
 eligible_warbands uuid[] not null,
 state text not null default 'open' check(state in ('open','withdrawn')),
 unique(report_id,revision,subject_id)
);
create table public.casualty_loot_attempts (
 id uuid primary key,
 casualty_id uuid not null references public.casualty_loot(id) on delete cascade,
 body_index integer not null,warband_id uuid not null references public.warbands(id) on delete cascade,
 looter_id uuid not null,looter_index integer not null,die integer not null check(die between 1 and 6),
 recipient_report_id uuid not null references public.match_reports(id),
 won boolean not null,created_items jsonb not null default '[]',
 reversed boolean not null default false,reason text not null default '',created_at timestamptz not null default now()
);
create unique index casualty_one_winner on public.casualty_loot_attempts(casualty_id,body_index) where won and not reversed;
create unique index casualty_one_attempt on public.casualty_loot_attempts(casualty_id,body_index,warband_id,looter_id,looter_index) where not reversed;
alter table public.casualty_loot enable row level security;
alter table public.casualty_loot_attempts enable row level security;
create policy loot_read on public.casualty_loot for select to authenticated using(public.can_edit_warband(source_warband_id) or exists(select 1 from unnest(eligible_warbands) w where public.can_edit_warband(w)));
create policy loot_attempt_read on public.casualty_loot_attempts for select to authenticated using(exists(select 1 from public.casualty_loot c where c.id=casualty_id));
grant select on public.casualty_loot,public.casualty_loot_attempts to authenticated;

create function public.create_casualty_loot() returns trigger language plpgsql security definer set search_path='' as $$
declare line jsonb;item jsonb;row_data jsonb;kit jsonb;allocation jsonb;allocations jsonb;bands uuid[];n integer;qty integer;captured_qty integer;i integer;manual boolean;sid uuid;
begin
 if new.undo is null or old.undo is not null then return new;end if;
 select array_agg(distinct w.id) into bands from public.match_participants p join public.warbands w on w.id=p.warband_id where p.match_id=new.match_id and w.type_rules_id='hochland_bandits' and (
 exists(select 1 from public.henchman_groups g where g.warband_id=w.id and g.unit_type_rules_id='hochland_bandits_looter' and g.size>0)
 or exists(select 1 from public.heroes h where h.warband_id=w.id and h.unit_type_rules_id='hochland_bandits_looter' and h.status='active'));
 if bands is null then return new;end if;
 for line in select x from jsonb_array_elements(new.injuries) x loop
  sid:=(line->>'subjectId')::uuid;kit:='[]';manual:=false;
  if line->>'subjectType' in ('hero','hiredSword') and line->>'outcome' in ('dead','retired') then
   n:=1;
   select coalesce(jsonb_agg(x),'[]') into kit from jsonb_array_elements(coalesce(new.undo->'removed_items','[]')) x where x->>'holder_id'=sid::text;
  elsif line->>'subjectType'='group' and coalesce((line->>'dead')::integer,0)>0 then
   n:=(line->>'dead')::integer;
   for item in select x from jsonb_array_elements(coalesce(line->'equipmentLost','[]')) x loop
    row_data:=null;
    select x->'row' into row_data from jsonb_array_elements(coalesce(new.undo->'items','[]')) x where x->>'id'=item->>'sourceItemId';
    if row_data is null then select x into row_data from jsonb_array_elements(coalesce(new.undo->'removed_items','[]')) x where x->>'id'=item->>'sourceItemId';end if;
    if row_data is null then continue;end if;
    select coalesce(sum((k->>'quantity')::integer),0) into captured_qty from jsonb_array_elements(coalesce(line->'captured','[]')) c cross join lateral jsonb_array_elements(coalesce(c->'kit','[]')) k where k->>'sourceItemId'=item->>'sourceItemId';
    qty:=greatest(0,(item->>'quantity')::integer-captured_qty);
    -- Bound by equipment actually removed, excluding survivor and captive gear.
    qty:=least(qty,greatest(0,(row_data->>'quantity')::integer-coalesce((select quantity from public.items where id=(row_data->>'id')::uuid),0)-captured_qty));
    if qty>0 then kit:=kit||jsonb_build_array(row_data||jsonb_build_object('quantity',qty));end if;
    manual:=manual or coalesce((item->>'manual')::boolean,false) or qty%n<>0;
   end loop;
  else continue;end if;
  if jsonb_array_length(kit)=0 then continue;end if;
  allocations:=null;
  if not manual then
   allocation:='[]';for item in select x from jsonb_array_elements(kit) x loop allocation:=allocation||jsonb_build_array(item||jsonb_build_object('quantity',(item->>'quantity')::integer/n));end loop;
   allocations:='[]';for i in 1..n loop allocations:=allocations||jsonb_build_array(allocation);end loop;
  end if;
  insert into public.casualty_loot(report_id,revision,match_id,source_warband_id,subject_id,subject_name,body_count,kit,allocations,eligible_warbands) values(new.id,new.revision,new.match_id,new.warband_id,sid,line->>'subjectName',n,kit,allocations,bands) on conflict do nothing;
 end loop;
 return new;
end $$;
revoke all on function public.create_casualty_loot() from public;
create trigger create_casualty_loot after update of undo on public.match_reports for each row execute function public.create_casualty_loot();

create function public.allocate_casualty_loot(p_id uuid,p_quantities jsonb) returns void language plpgsql security definer set search_path='' as $$
declare c public.casualty_loot%rowtype;item jsonb;allocation jsonb;saved_allocations jsonb:='[]';i integer;q integer;total integer;
begin
 select * into c from public.casualty_loot where id=p_id for update;
 if not found or not public.can_edit_warband(c.source_warband_id) then raise exception 'Only the casualty owner or GM can record its equipment';end if;
 if c.state<>'open' or exists(select 1 from public.casualty_loot_attempts where casualty_id=c.id and not reversed) then raise exception 'Equipment allocation is locked after looting begins';end if;
 if jsonb_typeof(p_quantities)<>'array' or jsonb_array_length(p_quantities)<>c.body_count then raise exception 'Record equipment for every casualty';end if;
 for item in select x from jsonb_array_elements(c.kit) x loop
  total:=0;for i in 0..c.body_count-1 loop
   q:=coalesce((p_quantities->i->>(item->>'id'))::integer,0);
   if q<0 then raise exception 'Equipment quantities cannot be negative';end if;total:=total+q;
  end loop;
  if total<>(item->>'quantity')::integer then raise exception 'Allocate all lost equipment exactly once';end if;
 end loop;
 for i in 0..c.body_count-1 loop
  allocation:='[]';for item in select x from jsonb_array_elements(c.kit) x loop
   q:=coalesce((p_quantities->i->>(item->>'id'))::integer,0);
   if q>0 then allocation:=allocation||jsonb_build_array(item||jsonb_build_object('quantity',q));end if;
  end loop;saved_allocations:=saved_allocations||jsonb_build_array(allocation);
 end loop;
 update public.casualty_loot set allocations=saved_allocations where id=c.id;
end $$;
revoke all on function public.allocate_casualty_loot(uuid,jsonb) from public;
grant execute on function public.allocate_casualty_loot(uuid,jsonb) to authenticated;

create function public.roll_casualty_loot(p_id uuid,p_body integer,p_warband uuid,p_looter uuid,p_looter_index integer,p_die integer,p_request uuid) returns text language plpgsql security definer set search_path='' as $$
declare c public.casualty_loot%rowtype;a public.casualty_loot_attempts%rowtype;recipient uuid;item jsonb;inserted uuid;created jsonb:='[]';looters integer;label text;note text;
begin
 if auth.uid() is null or not public.can_edit_warband(p_warband) then raise exception 'You cannot control these Looters';end if;
 select * into c from public.casualty_loot where id=p_id;
 if not found then raise exception 'Casualty not found';end if;
 perform id from public.match_reports where match_id=c.match_id order by id for update;
 perform id from public.warbands where id in(c.source_warband_id,p_warband) order by id for update;
 select * into c from public.casualty_loot where id=p_id for update;
 select * into a from public.casualty_loot_attempts where id=p_request;
 if found then
  if a.casualty_id<>c.id or a.warband_id<>p_warband or a.body_index<>p_body or a.looter_id<>p_looter or a.looter_index<>p_looter_index or a.die<>p_die then raise exception 'Request already used for a different roll';end if;
  return case when a.won then 'Equipment recovered.' else 'Looting failed.' end;
 end if;
 if p_request is null or p_die is null or p_die not between 1 and 6 or p_body is null or p_body<0 or p_body>=c.body_count then raise exception 'Choose a casualty and roll D6';end if;
 if c.state<>'open' or c.allocations is null or not(p_warband=any(c.eligible_warbands)) then raise exception 'This casualty is not ready for your Looters';end if;
 if not exists(select 1 from public.match_reports where id=c.report_id and revision=c.revision and undo is not null) then raise exception 'The source report has changed';end if;
 select id into recipient from public.match_reports where match_id=c.match_id and warband_id=p_warband and undo is not null;
 if recipient is null then raise exception 'File your battle report before looting';end if;
 if exists(select 1 from public.awakening_offers where report_id=c.report_id and hero_id=c.subject_id and state='accepted') then raise exception 'This warrior has already been raised; its equipment is no longer available';end if;
 if exists(select 1 from public.casualty_loot_attempts where casualty_id=c.id and body_index=p_body and won and not reversed) then raise exception 'This casualty has already been looted';end if;
 if exists(select 1 from public.casualty_loot_attempts where casualty_id=c.id and body_index=p_body and warband_id=p_warband and looter_id=p_looter and looter_index=p_looter_index and not reversed) then raise exception 'This Looter already tried this casualty';end if;
 select size,name into looters,label from public.henchman_groups where id=p_looter and warband_id=p_warband and unit_type_rules_id='hochland_bandits_looter';
 if looters is null then select 1,name into looters,label from public.heroes where id=p_looter and warband_id=p_warband and unit_type_rules_id='hochland_bandits_looter' and status='active';end if;
 looters:=least(looters,coalesce((select (x->'before'->>'size')::integer from public.match_reports r cross join lateral jsonb_array_elements(coalesce(r.undo->'groups','[]')) x where r.id=recipient and x->>'id'=p_looter::text),looters));
 if looters is null or p_looter_index is null or p_looter_index<0 or p_looter_index>=looters then raise exception 'Choose a surviving Looter';end if;
 -- A newly recruited Looter must not be used to gain attempts for an earlier battle.
 if exists(select 1 from public.henchman_groups g join public.match_reports r on r.id=recipient where g.id=p_looter and g.created_at>r.submitted_at) or exists(select 1 from public.heroes h join public.match_reports r on r.id=recipient where h.id=p_looter and h.created_at>r.submitted_at) then raise exception 'This Looter joined after the battle';end if;
 if p_die>=4 then
  perform set_config('stirheim.audit_reason','Looting the Dead: recovered equipment from '||c.subject_name,true);
  for item in select x from jsonb_array_elements(c.allocations->p_body) x loop
   insert into public.items(warband_id,holder_type,item_rules_id,custom_name,quantity,notes) values(p_warband,'stash',item->>'item_rules_id',item->>'custom_name',(item->>'quantity')::integer,coalesce(item->>'notes','')) returning id into inserted;
   created:=created||jsonb_build_array((select to_jsonb(i)-'updated_at' from public.items i where id=inserted));
  end loop;
 end if;
 insert into public.casualty_loot_attempts(id,casualty_id,body_index,warband_id,looter_id,looter_index,die,recipient_report_id,won,created_items) values(p_request,c.id,p_body,p_warband,p_looter,p_looter_index,p_die,recipient,p_die>=4,created);
 note:=label||' looted '||c.subject_name||', casualty '||(p_body+1)||': D6 '||p_die||case when p_die>=4 then ' — equipment recovered to the stash.' else ' — failed; another Looter may try.' end;
 update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),note) where id in(c.report_id,recipient);
 return note;
end $$;
revoke all on function public.roll_casualty_loot(uuid,integer,uuid,uuid,integer,integer,uuid) from public;
grant execute on function public.roll_casualty_loot(uuid,integer,uuid,uuid,integer,integer,uuid) to authenticated;

create function public.guard_looted_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' or (old.undo is not null and new.undo is null) then
  if exists(select 1 from public.casualty_loot_attempts a join public.casualty_loot c on c.id=a.casualty_id where not a.reversed and (a.recipient_report_id=old.id or c.report_id=old.id)) then raise exception 'Reverse the casualty looting attempts before correcting this report';end if;
  update public.casualty_loot set state='withdrawn' where report_id=old.id;
 end if;
 if tg_op='DELETE' then return old;end if;return new;
end $$;
revoke all on function public.guard_looted_report() from public;
create trigger guard_looted_report before update of undo or delete on public.match_reports for each row execute function public.guard_looted_report();

create function public.reverse_casualty_loot(p_attempt uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare a public.casualty_loot_attempts%rowtype;c public.casualty_loot%rowtype;item jsonb;current_item jsonb;
begin
 select * into a from public.casualty_loot_attempts where id=p_attempt;
 if not found or not public.can_edit_warband(a.warband_id) then raise exception 'Only the Looter owner or GM may reverse this attempt';end if;
 select * into c from public.casualty_loot where id=a.casualty_id;
 perform id from public.match_reports where match_id=c.match_id order by id for update;
 perform id from public.warbands where id in(c.source_warband_id,a.warband_id) order by id for update;
 perform id from public.casualty_loot where id=c.id for update;
 select * into a from public.casualty_loot_attempts where id=p_attempt for update;
 if a.reversed then raise exception 'This attempt was already reversed';end if;
 if a.won and exists(select 1 from public.awakening_offers where report_id=c.report_id and hero_id=c.subject_id and state='accepted') then raise exception 'Reverse the later Awakening before restoring looted equipment';end if;
 if p_reason is null or length(btrim(p_reason))<5 then raise exception 'Explain the correction';end if;
 for item in select x from jsonb_array_elements(a.created_items) x loop
  select to_jsonb(i)-'updated_at' into current_item from public.items i where id=(item->>'id')::uuid for update;
  if current_item is distinct from item then raise exception 'Recovered equipment has changed. Restore it to its original stash state before reversing';end if;
 end loop;
 perform set_config('stirheim.audit_reason','Looting correction: '||p_reason,true);
 delete from public.items where id in(select (x->>'id')::uuid from jsonb_array_elements(a.created_items) x);
 update public.casualty_loot_attempts set reversed=true,reason=btrim(p_reason) where id=a.id;
 update public.match_reports set notes=concat_ws(E'\n',nullif(notes,''),'Looting attempt for '||c.subject_name||' reversed: '||btrim(p_reason)) where id in(c.report_id,a.recipient_report_id);
end $$;
revoke all on function public.reverse_casualty_loot(uuid,text) from public;
grant execute on function public.reverse_casualty_loot(uuid,text) to authenticated;

-- Resurrection may still raise a looted Hero, but must not duplicate equipment already taken.
alter function public.resolve_awakening(uuid,text,text) rename to resolve_awakening_before_looting;
revoke all on function public.resolve_awakening_before_looting(uuid,text,text) from public,authenticated,anon;
create function public.resolve_awakening(p_offer_id uuid,p_action text,p_reason text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare o public.awakening_offers%rowtype;
begin
 select * into o from public.awakening_offers where id=p_offer_id;
 if not found or not public.can_edit_warband(o.to_warband_id) then raise exception 'Only the receiving player or GM can resolve Awakening';end if;
 perform id from public.match_reports where match_id=o.match_id order by id for update;
 if p_action='accept' and exists(select 1 from public.casualty_loot c join public.casualty_loot_attempts a on a.casualty_id=c.id where c.report_id=o.report_id and c.subject_id=o.hero_id and a.won and not a.reversed) then
  update public.awakening_offers set snapshot=jsonb_set(snapshot,'{items}','[]')||jsonb_build_object('looted_items',snapshot->'items') where id=o.id;
 end if;
 if p_action='accept' and o.snapshot ? 'looted_items' and not exists(select 1 from public.casualty_loot c join public.casualty_loot_attempts a on a.casualty_id=c.id where c.report_id=o.report_id and c.subject_id=o.hero_id and a.won and not a.reversed) then
  update public.awakening_offers set snapshot=jsonb_set(snapshot-'looted_items','{items}',o.snapshot->'looted_items') where id=o.id;
 end if;
 return public.resolve_awakening_before_looting(p_offer_id,p_action,p_reason);
end $$;
revoke all on function public.resolve_awakening(uuid,text,text) from public;
grant execute on function public.resolve_awakening(uuid,text,text) to authenticated;
