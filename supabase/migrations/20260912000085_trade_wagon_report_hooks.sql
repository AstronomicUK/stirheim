create or replace function public.reserve_report_trade_wagon(p_report_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare r public.match_reports%rowtype; c jsonb; ids uuid[]; wagon_id uuid;
begin
  select * into r from public.match_reports where id=p_report_id;
  c:=r.applied->'trade_wagon_capture';
  if c is null or c='null'::jsonb then return; end if;
  wagon_id:=(c->'wagon'->'expected'->>'id')::uuid;
  select coalesce(array_agg((x->>'id')::uuid),'{}'::uuid[]) into ids from jsonb_array_elements(c->'cargo'->'items') x;
  if c->'wagon'->>'kind'='item' then ids:=array_append(ids,wagon_id); end if;
  if exists(select 1 from jsonb_array_elements(coalesce(r.applied->'item_patches','[]'::jsonb)) x where (x->>'id')::uuid=any(ids))
    or exists(select 1 from jsonb_array_elements_text(coalesce(r.applied->'remove_item_ids','[]'::jsonb)) x where x::uuid=any(ids))
    or exists(select 1 from jsonb_array_elements(coalesce(r.applied->'awarded_items','[]'::jsonb)) x where (x->>'source_item_id')::uuid=any(ids))
    or exists(select 1 from jsonb_array_elements(coalesce(r.applied->'scenario_item_transfers','[]'::jsonb)) x where (x->>'item_id')::uuid=any(ids))
    or (c->'wagon'->>'kind'='group' and exists(select 1 from jsonb_array_elements(coalesce(r.applied->'groups','[]'::jsonb)) x where (x->>'id')::uuid=wagon_id))
    then raise exception 'Captured Trade Wagon cargo cannot also be changed by this report; review the overlapping equipment or wagon changes';
  end if;
  perform public.reserve_trade_wagon_capture(p_report_id,c);
end;
$$;
revoke all on function public.reserve_report_trade_wagon(uuid) from public,authenticated;

-- Patch checked anchors in the accumulated report functions without replacing other fixes.
do $$
declare body text; anchor text;
begin
  select pg_get_functiondef('public.apply_battle_report(uuid)'::regprocedure) into body;
  anchor:='  v_applied := coalesce(v_report.applied, ''{}''::jsonb);';
  if position(anchor in body)=0 or position('reserve_report_trade_wagon' in body)>0 then raise exception 'Unexpected apply_battle_report version'; end if;
  body:=replace(body,anchor,anchor||E'\n  perform public.reserve_report_trade_wagon(v_report.id);');
  execute body;
  select pg_get_functiondef('public.revert_battle_report(uuid)'::regprocedure) into body;
  anchor:='  update public.match_reports set undo = null where id = p_report_id;';
  if position(anchor in body)=0 or position('release_trade_wagon_capture' in body)>0 then raise exception 'Unexpected revert_battle_report version'; end if;
  body:=replace(body,anchor,E'  perform public.release_trade_wagon_capture(v_report.id);\n'||anchor);
  execute body;
end;
$$;
