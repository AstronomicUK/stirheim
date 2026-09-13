-- #229: preserve the exploration D3 and later player edit, and prevent taking both prisoners
-- and the ordinary gold/Straggler reward from the same find. Custody/capacity remain in 102.
alter function public.place_anonymous_prisoners(uuid, uuid, jsonb, integer) rename to place_anonymous_prisoners_102;
revoke all on function public.place_anonymous_prisoners_102(uuid, uuid, jsonb, integer) from public, authenticated;

create function public.place_anonymous_prisoners(p_engine_id uuid, p_report_id uuid, p_prisoners jsonb, p_count_roll integer default null)
returns setof uuid language plpgsql security definer set search_path = '' as $$
declare e public.engine_of_chaos_units%rowtype; r public.match_reports%rowtype; v_id uuid; v_find jsonb; v_count int; v_original int; v_roll int;
begin
  select * into e from public.engine_of_chaos_units where id = p_engine_id;
  if e.id is null or not public.can_edit_warband(e.warband_id) then raise exception 'Only this warband''s player or the campaign GM locks prisoners in its Engine.' using errcode = '42501'; end if;
  select * into r from public.match_reports where id = p_report_id and warband_id = e.warband_id and undo is not null;
  if r.id is null then raise exception 'Prisoners come from this warband''s own applied report of the battle.' using errcode = '22023'; end if;
  perform id from public.match_reports where match_id = r.match_id order by id for update;
  select * into r from public.match_reports where id = p_report_id;
  if coalesce((r.exploration->>'goldFound')::int, 0) > 0 then raise exception 'This exploration already awarded gold instead of Engine captives. Correct the report before placing prisoners.' using errcode = '22023'; end if;
  if coalesce(r.exploration->'benefits', '[]'::jsonb) ? 'straggler' then raise exception 'This report already used the Straggler for insight; it cannot also provide an Engine captive.' using errcode = '22023'; end if;
  v_find := r.exploration->'enginePrisoners';
  v_roll := p_count_roll;
  if v_find is not null and v_find <> 'null'::jsonb then
    if jsonb_typeof(v_find) <> 'object' or coalesce(v_find->>'count','') !~ '^[1-3]$' then raise exception 'The report needs a valid Engine captive count.' using errcode = '22023'; end if;
    v_count := (v_find->>'count')::int;
    if v_find->>'originalRoll' is not null and (v_find->>'originalRoll') !~ '^[1-3]$' then raise exception 'The original Prisoners D3 must be from 1 to 3.' using errcode = '22023'; end if;
    v_original := (v_find->>'originalRoll')::int;
    if r.exploration->>'locationId' = 'straggler' then
      if v_count <> 1 or v_original is not null then raise exception 'A Straggler is one prisoner; no D3 applies.' using errcode = '22023'; end if;
    elsif r.exploration->>'locationId' = 'prisoners' then
      if p_count_roll is not null and p_count_roll <> v_count then raise exception 'Use the Prisoners D3 saved in the battle report (%); correct the report to change it.', v_count using errcode = '22023'; end if;
      v_roll := v_count;
    else raise exception 'The Engine captive count belongs to a Straggler or Prisoners find.' using errcode = '22023'; end if;
  end if;
  for v_id in select public.place_anonymous_prisoners_102(p_engine_id, p_report_id, p_prisoners, v_roll) loop
    if v_find is not null and v_find <> 'null'::jsonb then
      update public.engine_prisoners set snapshot = snapshot || jsonb_build_object('exploration_dice', v_find),
        history = history || jsonb_build_object('event', 'exploration_count', 'at', now(), 'count', v_count, 'original_roll', v_original,
          'maximum_finds', coalesce((v_find->>'maximumFinds')::boolean,false)) where id = v_id;
    end if;
    return next v_id;
  end loop;
end $$;
revoke all on function public.place_anonymous_prisoners(uuid, uuid, jsonb, integer) from public;
grant execute on function public.place_anonymous_prisoners(uuid, uuid, jsonb, integer) to authenticated;

notify pgrst, 'reload schema';
