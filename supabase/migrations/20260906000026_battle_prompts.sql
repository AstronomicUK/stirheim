-- Phase 23: asking the other player to roll.
--
-- An attack is resolved on the attacker's phone, but some of its steps belong to the defender — a
-- parry, an armour save, a Lucky Charm, Step Aside. Until now the attacker rolled those too, or
-- handed the phone across. A prompt is that question sent to the defender's own screen: the
-- attacker's calculator pauses, the defender is asked, and the answer comes back as the dice to
-- carry on with.
--
-- The resolution itself stays on the attacker's device — a prompt carries only the questions and
-- the faces that answer them, never the state machine — so a defender who does not answer costs
-- nothing: the attacker withdraws the prompt and rolls it themselves, as before.

create table public.battle_prompts (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  -- Who is asking, and on whose behalf.
  attacker_warband_id uuid not null references public.warbands (id) on delete cascade,
  attacker_name text not null,
  -- Who must answer.
  target_warband_id uuid not null references public.warbands (id) on delete cascade,
  /** heroes.id or henchman_groups.id on the target's roster, for naming the model. */
  target_id text not null,
  target_name text not null,
  turn integer not null default 0,
  /** What is being asked, in order: [{ kind, label, detail, optional }]. */
  asks jsonb not null,
  /** What came back, in the same order: [{ roll } | { declined: true }]. */
  answers jsonb not null default '[]'::jsonb,
  state text not null default 'waiting' check (state in ('waiting', 'answered', 'withdrawn')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
comment on table public.battle_prompts is
  'A step of an attack that belongs to the defender, asked on their own screen. Carries the questions and the dice that answer them, never the resolution itself.';

create index battle_prompts_match_idx on public.battle_prompts (match_id, created_at);
create index battle_prompts_target_idx on public.battle_prompts (target_warband_id, state);

alter table public.battle_prompts enable row level security;

create policy battle_prompts_select on public.battle_prompts
  for select to authenticated using (public.can_read_campaign(public.match_campaign(match_id)));

alter publication supabase_realtime add table public.battle_prompts;

-- ---------------------------------------------------------------------------------------------
-- Asking, answering, withdrawing
-- ---------------------------------------------------------------------------------------------

/** True when the caller may act for this warband: they own it, or they run the campaign. */
create or replace function public.may_act_for_warband(p_match_id uuid, p_warband_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.match_participants mp
      join public.warbands w on w.id = mp.warband_id
     where mp.match_id = p_match_id and mp.warband_id = p_warband_id
       and (w.owner_id = (select auth.uid()) or public.is_campaign_gm(public.match_campaign(p_match_id)))
  );
$$;

revoke all on function public.may_act_for_warband(uuid, uuid) from public;
grant execute on function public.may_act_for_warband(uuid, uuid) to authenticated;

/**
 * Put a question to the defender. Any earlier question this attacker left open against the same
 * target is withdrawn first, so a player who backs out of one attack and starts another does not
 * leave the other side staring at a stale prompt.
 */
create or replace function public.ask_battle_prompt(
  p_match_id uuid,
  p_attacker_warband_id uuid,
  p_attacker_name text,
  p_target_warband_id uuid,
  p_target_id text,
  p_target_name text,
  p_turn integer,
  p_asks jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_state public.match_state;
  v_id uuid;
begin
  select state into v_state from public.matches where id = p_match_id;
  if v_state is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_state <> 'in_progress' then
    raise exception 'this match is %, so nothing can be asked of it', v_state using errcode = 'P0001';
  end if;
  if not public.may_act_for_warband(p_match_id, p_attacker_warband_id) then
    raise exception 'only the attacking player may ask' using errcode = '42501';
  end if;
  if not exists (select 1 from public.match_participants mp where mp.match_id = p_match_id and mp.warband_id = p_target_warband_id) then
    raise exception 'that warband is not in this match' using errcode = '22023';
  end if;
  if jsonb_typeof(p_asks) <> 'array' or jsonb_array_length(p_asks) = 0 then
    raise exception 'ask for at least one roll' using errcode = '22023';
  end if;

  update public.battle_prompts
     set state = 'withdrawn'
   where match_id = p_match_id
     and attacker_warband_id = p_attacker_warband_id
     and state = 'waiting';

  insert into public.battle_prompts (match_id, attacker_warband_id, attacker_name, target_warband_id, target_id, target_name, turn, asks)
  values (p_match_id, p_attacker_warband_id, p_attacker_name, p_target_warband_id, p_target_id, p_target_name, coalesce(p_turn, 0), p_asks)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.ask_battle_prompt(uuid, uuid, text, uuid, text, text, integer, jsonb) from public;
grant execute on function public.ask_battle_prompt(uuid, uuid, text, uuid, text, text, integer, jsonb) to authenticated;

/** The defender's answer: one entry per question asked, in the same order. */
create or replace function public.answer_battle_prompt(p_prompt_id uuid, p_answers jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_match uuid;
  v_target uuid;
  v_state text;
  v_asks jsonb;
begin
  select match_id, target_warband_id, state, asks into v_match, v_target, v_state, v_asks
    from public.battle_prompts where id = p_prompt_id for update;
  if v_match is null then
    raise exception 'prompt not found' using errcode = 'P0002';
  end if;
  if v_state <> 'waiting' then
    raise exception 'that question is no longer open' using errcode = 'P0001';
  end if;
  if not public.may_act_for_warband(v_match, v_target) then
    raise exception 'only the defending player may answer' using errcode = '42501';
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> jsonb_array_length(v_asks) then
    raise exception 'answer every question asked' using errcode = '22023';
  end if;

  update public.battle_prompts
     set answers = p_answers, state = 'answered', answered_at = now()
   where id = p_prompt_id;
end;
$$;

revoke all on function public.answer_battle_prompt(uuid, jsonb) from public;
grant execute on function public.answer_battle_prompt(uuid, jsonb) to authenticated;

/** Take the question back: the attacker gave up waiting, or abandoned the attack. */
create or replace function public.withdraw_battle_prompt(p_prompt_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_match uuid;
  v_attacker uuid;
  v_state text;
begin
  select match_id, attacker_warband_id, state into v_match, v_attacker, v_state
    from public.battle_prompts where id = p_prompt_id;
  if v_match is null then
    raise exception 'prompt not found' using errcode = 'P0002';
  end if;
  if not public.may_act_for_warband(v_match, v_attacker) then
    raise exception 'only the asking player may withdraw it' using errcode = '42501';
  end if;
  if v_state = 'waiting' then
    update public.battle_prompts set state = 'withdrawn' where id = p_prompt_id;
  end if;
end;
$$;

revoke all on function public.withdraw_battle_prompt(uuid) from public;
grant execute on function public.withdraw_battle_prompt(uuid) to authenticated;
