-- #178: the remainder of a promoted group cannot promote another member on the same advance.
-- Keep this separate from editable dice JSON so reloads and dice corrections retain the rule.
alter table public.pending_advances add column promotion_reroll boolean not null default false;
comment on column public.pending_advances.promotion_reroll is 'Remaining group re-roll after promotion: results 10-12 must be rolled again.';

create or replace function public.resolve_pending_advance(p_advance_id uuid, p_resolution jsonb, p_changes jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_adv public.pending_advances%rowtype;
  v_count int;
  v_rows int;
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_resolution is not null and jsonb_typeof(p_resolution) <> 'object' then
    raise exception 'resolution must be an object' using errcode = '22023';
  end if;

  -- RLS: an advance on a warband the caller cannot read does not exist for them. A fellow
  -- player can read it (shared campaign) but not resolve it; say so rather than "not found".
  select * into v_adv from public.pending_advances a where a.id = p_advance_id;
  if not found then
    raise exception 'pending advance % not found', p_advance_id using errcode = 'P0002';
  end if;
  if not public.can_edit_warband(v_adv.warband_id) then
    raise exception 'only the warband owner or the GM can resolve its advances' using errcode = '42501';
  end if;
  -- Lock the row so two phones cannot take the same advance twice.
  select * into v_adv from public.pending_advances a where a.id = p_advance_id for update;
  if v_adv.resolved_at is not null then
    raise exception 'this advance has already been resolved' using errcode = 'P0001';
  end if;

  if v_adv.promotion_reroll and p_resolution ->> 'outcome' = 'promotion' then
    raise exception 'remaining group members must reroll Lad''s Got Talent for this advance' using errcode = '22023';
  end if;

  v_count := public.update_roster(v_adv.warband_id, 'advancement', coalesce(p_changes, '[]'::jsonb));

  update public.pending_advances
     set resolved_at = now(),
         resolution = coalesce(p_resolution, '{}'::jsonb)
   where id = p_advance_id;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'only the warband owner or the GM can resolve its advances' using errcode = '42501';
  end if;

  -- Follow-up advances the resolution asks for (promotion: the new hero rolls on the hero table
  -- straight away, the rest of the group re-roll). [{subjectType, subjectId, thresholdXp}]
  if jsonb_typeof(p_resolution -> 'followUps') = 'array' then
    insert into public.pending_advances (warband_id, subject_type, subject_id, threshold_xp, promotion_reroll)
    select v_adv.warband_id,
           (f ->> 'subjectType')::public.advance_subject,
           (f ->> 'subjectId')::uuid,
           greatest(coalesce((f ->> 'thresholdXp')::int, v_adv.threshold_xp), 1),
           coalesce(p_resolution ->> 'outcome' = 'promotion' and v_adv.subject_type = 'group'
             and f ->> 'subjectType' = 'group' and (f ->> 'subjectId')::uuid = v_adv.subject_id, false)
      from jsonb_array_elements(p_resolution -> 'followUps') f;
  end if;

  return v_count;
end;
$$;
