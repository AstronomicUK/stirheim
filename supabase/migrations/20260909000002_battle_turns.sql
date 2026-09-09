-- #11: shared, serialized player turns. Recovery is a timestamped history, not an edit to attack rolls.
create table public.battle_turns (
  match_id uuid primary key references public.matches(id) on delete cascade,
  turn_order uuid[] not null,
  active_index integer not null default 0,
  round integer not null default 1 check (round > 0),
  round_limit integer check (round_limit > 0),
  recovered boolean not null default false,
  finished boolean not null default false,
  revision integer not null default 1,
  recoveries jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.battle_turns enable row level security;
create policy battle_turns_read on public.battle_turns for select to authenticated
  using (public.can_read_campaign(public.match_campaign(match_id)));
grant select on public.battle_turns to authenticated;
alter publication supabase_realtime add table public.battle_turns;

create function public.battle_turn_action(p_match_id uuid, p_action text, p_revision integer,
  p_order uuid[] default null, p_limit integer default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v public.battle_turns%rowtype;
  m public.matches%rowtype;
  ids uuid[];
  active_id uuid;
begin
  -- Lock the parent too: concurrent first-start requests must not create two turn orders.
  select * into m from public.matches where id=p_match_id for update;
  if m.id is null or m.state <> 'in_progress' or m.combat_mode <> 'app' then
    raise exception 'Turn controls require an App Calculates battle in progress';
  end if;
  if not public.is_match_participant(p_match_id) and not public.is_campaign_gm(m.campaign_id) then
    raise exception 'Only a participant or GM may manage turns' using errcode='42501';
  end if;
  select * into v from public.battle_turns where match_id=p_match_id for update;
  if p_action='start' then
    if v.match_id is not null then raise exception 'Turns have already started; refresh the battle'; end if;
    select array_agg(warband_id order by warband_id) into ids from public.match_participants where match_id=p_match_id;
    if p_order is null or cardinality(p_order) < 2 or
       (select array_agg(x order by x) from unnest(p_order) x) is distinct from ids then
      raise exception 'Turn order must contain every participating warband exactly once';
    end if;
    if p_limit is not null and p_limit < 1 then raise exception 'Round limit must be positive'; end if;
    insert into public.battle_turns(match_id,turn_order,round_limit) values(p_match_id,p_order,p_limit) returning * into v;
  else
    if v.match_id is null then raise exception 'Set the turn order first'; end if;
    if p_revision is distinct from v.revision then raise exception 'The turn changed on another screen; refresh and try again'; end if;
    active_id := v.turn_order[v.active_index+1];
    if not public.may_act_for_warband(p_match_id,active_id) then
      raise exception 'Only the active player or GM may advance this turn' using errcode='42501';
    end if;
    if p_action='recover' then
      if v.finished or v.recovered then raise exception 'Recovery has already happened, or the round limit was reached'; end if;
      v.recovered := true;
      v.recoveries := v.recoveries || jsonb_build_array(jsonb_build_object('warbandId',active_id,'at',clock_timestamp(),'round',v.round));
    elsif p_action='end' then
      if v.finished or not v.recovered then raise exception 'Recover units before finishing your turn'; end if;
      if v.active_index+1 = cardinality(v.turn_order) then
        if v.round_limit is not null and v.round >= v.round_limit then
          v.finished := true;
        else
          v.active_index := 0; v.round := v.round+1; v.recovered := false;
        end if;
      else
        v.active_index := v.active_index+1; v.recovered := false;
      end if;
    elsif p_action='extend' then
      if not v.finished then raise exception 'The round limit has not been reached'; end if;
      v.round_limit := v.round+1; v.round := v.round+1; v.active_index := 0;
      v.finished := false; v.recovered := false;
    else raise exception 'Unknown turn action';
    end if;
    update public.battle_turns set active_index=v.active_index,round=v.round,round_limit=v.round_limit,
      recovered=v.recovered,finished=v.finished,recoveries=v.recoveries,revision=revision+1,updated_at=clock_timestamp()
      where match_id=p_match_id returning * into v;
  end if;
  return to_jsonb(v);
end;
$$;
revoke all on function public.battle_turn_action(uuid,text,integer,uuid[],integer) from public;
grant execute on function public.battle_turn_action(uuid,text,integer,uuid[],integer) to authenticated;
