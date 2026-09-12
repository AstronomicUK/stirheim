-- Retain the established roster validator; add original-versus-edited dice to the
-- server-authored consent text that is later recorded in both warbands' history.
alter function public.validate_core_captive_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb)
  rename to validate_core_captive_roster_proposal;
create function public.validate_core_captive_proposal(p_case public.captive_cases,p_choice jsonb,p_owner_changes jsonb,p_captor_changes jsonb,p_advances jsonb default '[]'::jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  message text; dice_text text := ''; key text; original_key text; label text;
  faces integer; value numeric; original numeric;
begin
  if p_choice->>'kind' in ('sell','throne','slaveWork') then
    foreach key in array array['d6','xp'] loop
      if key='xp' and (p_choice->>'kind'<>'slaveWork' or p_choice->>'d6'<>'1') then continue; end if;
      faces := case when key='d6' then 6 else 3 end;
      label := case when key='d6' then 'D6' else 'Escape XP D3' end;
      original_key := case when key='d6' then 'originalD6' else 'originalXp' end;
      if jsonb_typeof(p_choice->key) is distinct from 'number' then raise exception 'Record a % result.',label; end if;
      value := (p_choice->>key)::numeric;
      if value<>trunc(value) or value<1 or value>faces then raise exception '% must be a whole number from 1 to %.',label,faces; end if;
      original := null;
      if p_choice ? original_key and p_choice->original_key<>'null'::jsonb then
        if jsonb_typeof(p_choice->original_key)<>'number' then raise exception 'The original % must be a number.',label; end if;
        original := (p_choice->>original_key)::numeric;
        if original<>trunc(original) or original<1 or original>faces then raise exception 'The original % must be from 1 to %.',label,faces; end if;
      end if;
      dice_text := dice_text || label || ': ' || case when original is null then 'tabletop result ' || value
        else 'app rolled ' || original || case when original<>value then '; player changed this to ' || value else '' end end || '. ';
    end loop;
  end if;
  message := public.validate_core_captive_roster_proposal(p_case,p_choice,p_owner_changes,p_captor_changes,p_advances);
  return trim(dice_text || message);
end;
$$;
revoke all on function public.validate_core_captive_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb) from public,authenticated;
revoke all on function public.validate_core_captive_roster_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb) from public,authenticated;
