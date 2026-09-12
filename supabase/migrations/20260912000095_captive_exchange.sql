-- #229 captive-for-captive exchange across case kinds. A proposal on case A with
-- {kind: 'exchange', otherCaseId} names an open case B held the other way round (B's victim is A's
-- captor and B's captor is A's victim). Each side simply gets its own captive back: A's victim by A's
-- release rules (henchman 092, companion 093, or a Hero returned for nothing by the core rules) applied
-- to the owner changes, and A's captor by B's release rules applied to the captor changes. No gold moves
-- and nothing else changes. Acceptance resolves both cases (B via resolved_by_proposal, as the hero
-- exchange already does), pins both reports, and reversal reopens both. Consent stays two-party.

create function public.validate_exchange_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare b public.captive_cases%rowtype; text_a text; text_b text;
  release_a jsonb := jsonb_build_object('kind', 'release', 'groupId', p_choice->'groupId', 'holderId', p_choice->'holderId');
  release_b jsonb := jsonb_build_object('kind', 'release', 'groupId', p_choice->'otherGroupId', 'holderId', p_choice->'otherHolderId');
begin
  if jsonb_typeof(coalesce(p_advances, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_advances, '[]'::jsonb)) > 0 then raise exception 'An exchange awards no experience.' using errcode = '22023'; end if;
  if (p_choice->>'otherCaseId') !~* '^[0-9a-f]{8}-' then raise exception 'Name the captive offered in exchange.' using errcode = '22023'; end if;
  select * into b from public.captive_cases where id = (p_choice->>'otherCaseId')::uuid;
  if not found or b.id = p_case.id then raise exception 'The captive offered in exchange was not found.' using errcode = 'P0002'; end if;
  if b.state <> 'open' or b.victim_warband_id is distinct from p_case.captor_warband_id or b.captor_warband_id is distinct from p_case.victim_warband_id then
    raise exception 'An exchange needs an open captive held the other way round: one of %''s warriors held by %.', (select name from public.warbands where id = p_case.captor_warband_id), (select name from public.warbands where id = p_case.victim_warband_id) using errcode = '22023';
  end if;
  if b.subject_kind = 'henchman' and b.source = 'pirates_kidnapped' then raise exception 'A lost henchman in a Kidnapped! contest cannot be exchanged.' using errcode = '22023'; end if;
  if p_case.subject_kind = 'henchman' and p_case.source = 'pirates_kidnapped' then raise exception 'A lost henchman in a Kidnapped! contest cannot be exchanged.' using errcode = '22023'; end if;
  -- Side A: the victim gets his captive back, by that captive's own release rules.
  text_a := case p_case.subject_kind
    when 'henchman' then public.validate_forced_henchman_proposal(p_case, release_a, p_owner_changes, '[]'::jsonb, '[]'::jsonb)
    when 'companion' then public.validate_companion_proposal(p_case, release_a, p_owner_changes, '[]'::jsonb, '[]'::jsonb)
    else public.validate_core_captive_proposal(p_case, '{"kind":"ransom","gold":0}'::jsonb, p_owner_changes, '[]'::jsonb, '[]'::jsonb) end;
  -- Side B: the captor gets theirs back; B's victim is A's captor, so the captor changes are B's owner changes.
  text_b := case b.subject_kind
    when 'henchman' then public.validate_forced_henchman_proposal(b, release_b, p_captor_changes, '[]'::jsonb, '[]'::jsonb)
    when 'companion' then public.validate_companion_proposal(b, release_b, p_captor_changes, '[]'::jsonb, '[]'::jsonb)
    else public.validate_core_captive_proposal(b, '{"kind":"ransom","gold":0}'::jsonb, p_captor_changes, '[]'::jsonb, '[]'::jsonb) end;
  return left('Exchange of captives. ' || regexp_replace(text_a, '^(Ransom|Released)[^:]*: ', '') || ' In return: ' || regexp_replace(text_b, '^(Ransom|Released)[^:]*: ', ''), 1000);
end $$;
revoke all on function public.validate_exchange_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;

create or replace function public.validate_captive_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb default '[]'::jsonb)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_choice) <> 'object' then raise exception 'Choose an outcome.' using errcode = '22023'; end if;
  if p_choice->>'kind' = 'kidnapped' then
    return public.validate_kidnapped_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_choice->>'kind' = 'exchange' and p_choice ? 'otherCaseId' then
    return public.validate_exchange_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind = 'companion' then
    return public.validate_companion_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind = 'henchman' and p_case.source = 'forced_capture' then
    return public.validate_forced_henchman_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind <> 'hero' then raise exception 'A lost henchman can only be resolved through Kidnapped!.' using errcode = '22023'; end if;
  return public.validate_core_captive_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
end $$;
revoke all on function public.validate_captive_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;
