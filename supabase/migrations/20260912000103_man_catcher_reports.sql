-- Ordinary Man-catcher (Engine of Chaos), not the Slaaneshi Lock weapon.
-- Preserve the exact OOA/casualty identity and equipment share used by 092/096.
do $$
declare original text; updated text;
begin
 select pg_get_functiondef('public.open_forced_capture_cases()'::regprocedure) into original;
 updated := replace(original,
  $old$(cap->>'reason') is distinct from 'subjugator'$old$,
  $new$coalesce(cap->>'reason','') not in ('subjugator','man_catcher')$new$);
 updated := replace(updated,
  $old$payload->>'capture_reason' = 'subjugator'$old$,
  $new$payload->>'capture_reason' = cap->>'reason'$new$);
 updated := replace(updated,'no unreverted Subjugator capture event','no unreverted capture event');
 updated := replace(updated,$old$'reason', 'subjugator'$old$,$new$'reason', cap->>'reason'$new$);
 updated := replace(updated,
  $old$'Taken with the Subjugator of Mankind. Agree his release, ransom or sale with their player from your warband page.'$old$,
  $new$case when cap->>'reason'='man_catcher' then 'Taken out of action with a Man-catcher. Review imprisonment and the confiscated equipment with the Chaos Dwarf player from your warband page.' else 'Taken with the Subjugator of Mankind. Agree his release, ransom or sale with their player from your warband page.' end$new$);
 updated := replace(updated,
  $old$'Propose his release, a ransom or a sale from your warband page. The other player must accept it.'$old$,
  $new$case when cap->>'reason'='man_catcher' then 'Your Man-catcher took this model captive. Record which Engine holds the prisoner and agree the equipment transfer with the other player.' else 'Propose his release, a ransom or a sale from your warband page. The other player must accept it.' end$new$);
 if updated=original or position($check$payload->>'capture_reason' = cap->>'reason'$check$ in updated)=0 then raise exception 'Man-catcher bridge could not find the current forced-capture function.'; end if;
 execute updated;
end $$;

-- Reject a claimed weapon capture without an available Engine or an eligible actual target.
-- Native exclusions below were generated from unitIsLarge/unitRules.isAnimal and the
-- Hired Sword/DP rule headings. The mutable row's is_large is checked as well.
create function public.validate_man_catcher_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target_key text; target_large boolean; subject_found boolean := false;
begin
 if new.payload->>'capture_reason' is distinct from 'man_catcher' then return new; end if;
 if not coalesce((new.payload->>'out_of_action')::boolean,false)
    or new.payload->>'attacker_warband_id'=new.payload->>'target_warband_id' then
  raise exception 'A Man-catcher capture needs an enemy taken out of action.';
 end if;
 if not coalesce((new.payload->>'metadata_only')::boolean,false) and coalesce(new.payload->>'out_of_action_weapon_id','') not in ('man_catcher','gromril_man_catcher','ithilmar_man_catcher') then
  raise exception 'Record the actual Man-catcher that caused this out-of-action result.';
 end if;
 if not exists(select 1 from public.warbands where id::text=new.payload->>'attacker_warband_id' and type_rules_id='black_dwarfs')
    or not exists(select 1 from public.engine_of_chaos_units where warband_id::text=new.payload->>'attacker_warband_id' and state='present') then
  raise exception 'The Chaos Dwarf warband has no available Engine for a Man-catcher capture.';
 end if;
 if not exists(select 1 from public.items where warband_id::text=new.payload->>'attacker_warband_id'
    and holder_id::text=new.payload->>'attacker_id' and holder_type::text=new.payload->>'attacker_kind'
    and item_rules_id in ('man_catcher','gromril_man_catcher','ithilmar_man_catcher') and quantity>0) then
  raise exception 'The model did not carry the Man-catcher claimed for this capture.';
 end if;
 if new.payload->>'target_kind'='hero' then
  select case when is_hired_sword then 'hired:'||hired_sword_rules_id else unit_type_rules_id end,is_large
   into target_key,target_large from public.heroes where id::text=new.payload->>'target_id' and warband_id::text=new.payload->>'target_warband_id';
  subject_found:=found;
 elsif new.payload->>'target_kind'='group' then
  select unit_type_rules_id,is_large into target_key,target_large from public.henchman_groups
   where id::text=new.payload->>'target_id' and warband_id::text=new.payload->>'target_warband_id' and size>0;
  subject_found:=found;
 end if;
 if not subject_found then raise exception 'Choose an actual enemy warrior for the Man-catcher capture; equipment animals cannot be captured this way.'; end if;
 if coalesce(target_large,false) or target_key=any(array['beastmen_minotaur','beastmen_warhounds_of_chaos','black_dwarfs_bull_centaur','black_orcs_troll','companion_filly','court_of_pleasures_chaos_hounds','cursed_cavalcade_fighting_ape','cursed_cavalcade_great_bear','cursed_cavalcade_wild_beasts','dark_elves_cold_one_beasthound','druchii_slavehounds','forest_goblins_gigantic_spider','giant_bats','giant_rats','halflings_piggies','halflings_village_ogre_henchman','hired:bone_goliath','hired:clan_skryre_rat_ogre','hired:halfling_knight','hired:ogre_bodyguard','hired:ogre_slave_master','hired:snake_charmer','horned_hunters_warhound','hounds','kislevites_trained_bear','lizardmen_kroxigor','maneaters_bulls','maneaters_captain','maneaters_mountain_guide','maneaters_sabretusks','marauders_spawn_of_chaos','marauders_warhounds_of_chaos','mazzalupo_black_sheep','necrarchs_abomination','night_goblins_cave_squigs','night_goblins_troll','night_goblins_web_cave_squigs','night_goblins_web_great_squig','night_goblins_web_troll','norse_wolf','ogre_hunting_party_ogre_hunter','ogre_hunting_party_sabretusk_cubs','orc_mob_cave_squigs','orc_mob_troll','ostlander_ogre','pit_fighters_ogre','rat_ogres','restless_dead_variant_bone_goliath','skaven_giant_rats','skaven_pestilens_giant_rat','skaven_pestilens_rat_ogre','skaven_rat_ogre','sons_of_hashut_bull_centaur','tomb_guardians_tomb_scorpion','undead_dire_wolves','witch_hunters_war_hounds','wolf_rats','wolfhounds']::text[]) then
  raise exception 'A Man-catcher cannot capture Large models or animals.';
 end if;
 return new;
end $$;
revoke all on function public.validate_man_catcher_event() from public;
create trigger validate_man_catcher_event before insert on public.battle_events for each row execute function public.validate_man_catcher_event();
