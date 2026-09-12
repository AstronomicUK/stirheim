-- Hero captures retain the same exact kit identity as forced henchmen: annotations
-- are part of the transferred item. Existing Enchanted Skins are ordinary equipment;
-- only an extra copy is the Lustrian Amazon sacrifice reward.
do $migration$
declare definition text; updated text;
begin
  select pg_get_functiondef('public.validate_core_captive_roster_proposal(public.captive_cases,jsonb,jsonb,jsonb,jsonb)'::regprocedure) into definition;
  updated := replace(definition,
    $$key := coalesce(item_row.item_rules_id, 'custom:' || coalesce(item_row.custom_name, ''));$$,
    $$key := public.captive_item_key(item_row.item_rules_id,item_row.custom_name,item_row.notes);$$);
  updated := replace(updated,
    $$key := coalesce(d->>'item_rules_id', 'custom:' || coalesce(d->>'custom_name', ''));$$,
    $$key := public.captive_item_key(d->>'item_rules_id',d->>'custom_name',d->>'notes');$$);
  updated := replace(updated,
    $$if key = 'enchanted_skins' then skins := skins + qty; else gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + qty)); gained_total := gained_total + qty; end if;$$,
    $$gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + qty)); gained_total := gained_total + qty;$$);
  updated := replace(updated,
    $$if skins > 0 and (not skins_allowed or skins <> 1) then$$,
    $$skins := greatest(0,coalesce((gained->>'enchanted_skins')::int,0)-coalesce((surrendered->>'enchanted_skins')::int,0));
  if skins > 0 and (not skins_allowed or skins <> 1) then$$);
  updated := replace(updated,
    $$if expect_move then
    if moved <> hero_items$$,
    $$if skins > 0 then
    if coalesce((surrendered->>'enchanted_skins')::int,0)=0 then gained := gained-'enchanted_skins';
    else gained := jsonb_set(gained,array['enchanted_skins'],surrendered->'enchanted_skins'); end if;
  end if;
  if expect_move then
    if moved <> hero_items$$);
  updated := replace(updated,
    $$(same items, same quantities).$$,$$(same items, same quantities, same notes and annotations).$$);
  updated := replace(updated,
    $$group_dagger := group_dagger + 1;$$,
    $$if not (keys <@ array['holder_type','holder_id','item_rules_id','quantity','notes','custom_name'])
         or coalesce(d->>'notes','')<>'' or nullif(d->>'custom_name','') is not null then
        raise exception 'The free dagger must be the ordinary unmodified item.' using errcode='22023';
      end if;
      group_dagger := group_dagger + 1;$$);
  if updated=definition or strpos(updated,'skins := greatest')=0 or strpos(updated,'if skins > 0 then')=0
    or strpos(updated,'public.captive_item_key')=0 then raise exception 'Could not locate the core captive kit validation insertion points'; end if;
  execute updated;
end;
$migration$;
