-- #229 Pirates "Kidnapped!" (Town Cryer #9): the Pirates' alternative to ransom/exchange/sale for a
-- captured human Hero, and their chance to carry off enemy human henchmen lost for good after a battle
-- they won. Built on the 090 case machinery: a case per warrior (hero cases already exist; henchman
-- cases are opened here, one per lost model), each player records their own 2D6 through an RPC, the
-- Pirates propose the outcome the dice dictate, the victim's player accepts, and the 090 snapshot,
-- dependency and reversal rules apply unchanged. The subject columns stay generic (subject_kind,
-- model_index, model_snapshot, source) so later forced captures (Man-catchers, Thingcatchers) can
-- reuse them.

alter table public.captive_cases
  add column source text not null default 'captured',
  -- Henchman cases: the group's pre-report profile/state and the items it carried (one share per
  -- model), plus the survival die that lost this model.
  add column model_snapshot jsonb,
  -- Henchman cases: the single D6 to recover the body (4+), recorded once.
  add column recovery jsonb,
  -- Both sides' 2D6 for the Leadership contest, each recorded once by its own player.
  add column contest jsonb;
-- One group model can be lost for good (a Pirate opportunity) while another is forcibly captured in
-- the same report at the same ordinal; the source keeps their cases apart.
alter table public.captive_cases drop constraint captive_cases_report_id_report_revision_hero_id_model_index_key;
alter table public.captive_cases add constraint captive_cases_report_model_source_key unique (report_id, report_revision, hero_id, model_index, source);

-- Units a Pirate warband may recruit: human by the racial-profile resolver (profile Human, not a
-- fallback match), animals excluded. Generated from the rules data; hired swords and Dramatis
-- Personae never qualify regardless.
create table public.kidnap_eligible_units (
  unit_type_rules_id text not null,
  warband_type_rules_id text not null,
  primary key (unit_type_rules_id, warband_type_rules_id)
);
insert into public.kidnap_eligible_units (unit_type_rules_id, warband_type_rules_id) values
('cult_of_the_possessed_magister', 'cult_of_the_possessed'),
('cult_of_the_possessed_mutants', 'cult_of_the_possessed'),
('cult_of_the_possessed_darksouls', 'cult_of_the_possessed'),
('cult_of_the_possessed_brethren', 'cult_of_the_possessed'),
('mercenaries_reikland_captain', 'mercenaries_reikland'),
('mercenaries_reikland_champions', 'mercenaries_reikland'),
('mercenaries_reikland_youngbloods', 'mercenaries_reikland'),
('mercenaries_reikland_champions__priest_of_morr', 'mercenaries_reikland'),
('mercenaries_reikland_youngbloods__priest_of_morr', 'mercenaries_reikland'),
('mercenaries_reikland_warriors', 'mercenaries_reikland'),
('mercenaries_reikland_marksmen', 'mercenaries_reikland'),
('mercenaries_reikland_swordsmen', 'mercenaries_reikland'),
('mercenaries_middenheim_captain', 'mercenaries_middenheim'),
('mercenaries_middenheim_champions', 'mercenaries_middenheim'),
('mercenaries_middenheim_youngbloods', 'mercenaries_middenheim'),
('mercenaries_middenheim_champions__priest_of_morr', 'mercenaries_middenheim'),
('mercenaries_middenheim_champions__wolf_priest_of_ulric', 'mercenaries_middenheim'),
('mercenaries_middenheim_youngbloods__priest_of_morr', 'mercenaries_middenheim'),
('mercenaries_middenheim_warriors', 'mercenaries_middenheim'),
('mercenaries_middenheim_marksmen', 'mercenaries_middenheim'),
('mercenaries_middenheim_swordsmen', 'mercenaries_middenheim'),
('mercenaries_marienburg_captain', 'mercenaries_marienburg'),
('mercenaries_marienburg_champions', 'mercenaries_marienburg'),
('mercenaries_marienburg_youngbloods', 'mercenaries_marienburg'),
('mercenaries_marienburg_champions__priest_of_morr', 'mercenaries_marienburg'),
('mercenaries_marienburg_youngbloods__priest_of_morr', 'mercenaries_marienburg'),
('mercenaries_marienburg_warriors', 'mercenaries_marienburg'),
('mercenaries_marienburg_marksmen', 'mercenaries_marienburg'),
('mercenaries_marienburg_swordsmen', 'mercenaries_marienburg'),
('mercenaries_ostermark_captain', 'mercenaries_ostermark'),
('mercenaries_ostermark_champions', 'mercenaries_ostermark'),
('mercenaries_ostermark_youngbloods', 'mercenaries_ostermark'),
('mercenaries_ostermark_champions__priest_of_morr', 'mercenaries_ostermark'),
('mercenaries_ostermark_youngbloods__priest_of_morr', 'mercenaries_ostermark'),
('mercenaries_ostermark_warriors', 'mercenaries_ostermark'),
('mercenaries_ostermark_marksmen', 'mercenaries_ostermark'),
('mercenaries_ostermark_swordsmen', 'mercenaries_ostermark'),
('sisters_of_sigmar_matriarch', 'sisters_of_sigmar'),
('sisters_of_sigmar_augur', 'sisters_of_sigmar'),
('sisters_of_sigmar_sister_superior', 'sisters_of_sigmar'),
('sisters_of_sigmar_sigmarite_sister', 'sisters_of_sigmar'),
('sisters_of_sigmar_novices', 'sisters_of_sigmar'),
('undead_necromancer', 'the_undead'),
('undead_dregs', 'the_undead'),
('undead_dire_wolves', 'the_undead'),
('undead_zombies', 'the_undead'),
('witch_hunters_captain', 'witch_hunters'),
('witch_hunters_witch_hunters', 'witch_hunters'),
('witch_hunters_warrior_priest', 'witch_hunters'),
('witch_hunters_flagellants', 'witch_hunters'),
('witch_hunters_zealots', 'witch_hunters'),
('averlander_captain', 'averlander_mercenaries'),
('averlander_sergeant', 'averlander_mercenaries'),
('averlander_bergjaeger', 'averlander_mercenaries'),
('averlander_youngblood', 'averlander_mercenaries'),
('averlander_sergeant__priest_of_morr', 'averlander_mercenaries'),
('averlander_bergjaeger__priest_of_morr', 'averlander_mercenaries'),
('averlander_youngblood__priest_of_morr', 'averlander_mercenaries'),
('averlander_mountainguard', 'averlander_mercenaries'),
('averlander_marksmen', 'averlander_mercenaries'),
('carnival_of_chaos_master', 'carnival_of_chaos'),
('carnival_of_chaos_brutes', 'carnival_of_chaos'),
('carnival_of_chaos_tainted_ones', 'carnival_of_chaos'),
('carnival_of_chaos_plague_bearers', 'carnival_of_chaos'),
('carnival_of_chaos_nurglings', 'carnival_of_chaos'),
('carnival_of_chaos_brethren', 'carnival_of_chaos'),
('carnival_of_chaos_plague_cart', 'carnival_of_chaos'),
('kislevites_druzhina_captain', 'kislevites'),
('kislevites_esaul', 'kislevites'),
('kislevites_bear_tamer', 'kislevites'),
('kislevites_youths', 'kislevites'),
('kislevites_warriors', 'kislevites'),
('kislevites_cossacks', 'kislevites'),
('kislevites_streltsi', 'kislevites'),
('ostlander_elder', 'ostlander_mercenaries'),
('ostlander_blood_brothers', 'ostlander_mercenaries'),
('ostlander_priest_of_taal', 'ostlander_mercenaries'),
('ostlander_blood_brothers__priest_of_morr', 'ostlander_mercenaries'),
('ostlander_priest_of_taal__priest_of_morr', 'ostlander_mercenaries'),
('ostlander_kin', 'ostlander_mercenaries'),
('ostlander_jaeger', 'ostlander_mercenaries'),
('ostlander_ruffians', 'ostlander_mercenaries'),
('amazons_lustria_serpent_priestess', 'amazons_lustria'),
('amazons_lustria_eagle_warrior', 'amazons_lustria'),
('amazons_lustria_piranha_warrior', 'amazons_lustria'),
('amazons_lustria_amazon_warrior', 'amazons_lustria'),
('amazons_lustria_jaguar_warrior', 'amazons_lustria'),
('amazons_mordheim_priestess', 'amazons_mordheim'),
('amazons_mordheim_champion', 'amazons_mordheim'),
('amazons_mordheim_totem_warrior', 'amazons_mordheim'),
('amazons_mordheim_amazon_warrior', 'amazons_mordheim'),
('amazons_mordheim_scout', 'amazons_mordheim'),
('arabian_tomb_raiders_sheikh', 'arabian_tomb_raiders'),
('arabian_tomb_raiders_champion', 'arabian_tomb_raiders'),
('arabian_tomb_raiders_mystic', 'arabian_tomb_raiders'),
('arabian_tomb_raiders_bedouin', 'arabian_tomb_raiders'),
('arabian_tomb_raiders_nomad_warrior', 'arabian_tomb_raiders'),
('arabian_tomb_raiders_slave', 'arabian_tomb_raiders'),
('bretonnian_knights_questing_knight', 'bretonnian_knights'),
('bretonnian_knights_knight_errant', 'bretonnian_knights'),
('bretonnian_knights_squire', 'bretonnian_knights'),
('bretonnian_knights_men_at_arms', 'bretonnian_knights'),
('bretonnian_knights_bowmen', 'bretonnian_knights'),
('gunnery_school_of_nuln_senior_gunnery_officer', 'gunnery_school_of_nuln'),
('gunnery_school_of_nuln_instructor', 'gunnery_school_of_nuln'),
('gunnery_school_of_nuln_senior_student', 'gunnery_school_of_nuln'),
('gunnery_school_of_nuln_underclassman', 'gunnery_school_of_nuln'),
('gunnery_school_of_nuln_sons_of_the_guns', 'gunnery_school_of_nuln'),
('gunnery_school_of_nuln_marksman', 'gunnery_school_of_nuln'),
('gunnery_school_of_nuln_pistolier', 'gunnery_school_of_nuln'),
('hochland_bandits_bandit_prince', 'hochland_bandits'),
('hochland_bandits_footpad', 'hochland_bandits'),
('hochland_bandits_duelist', 'hochland_bandits'),
('hochland_bandits_huckster', 'hochland_bandits'),
('hochland_bandits_thug', 'hochland_bandits'),
('hochland_bandits_looter', 'hochland_bandits'),
('hochland_bandits_blackheart', 'hochland_bandits'),
('hochland_bandits_poacher', 'hochland_bandits'),
('hochland_bandits_gutterscum', 'hochland_bandits'),
('horned_hunters_horned_hunter', 'horned_hunters'),
('horned_hunters_priest_of_taal', 'horned_hunters'),
('horned_hunters_initiate', 'horned_hunters'),
('horned_hunters_drunken_gang', 'horned_hunters'),
('horned_hunters_zealot', 'horned_hunters'),
('imperial_outriders_knight', 'imperial_outriders'),
('imperial_outriders_outrider', 'imperial_outriders'),
('imperial_outriders_scout', 'imperial_outriders'),
('imperial_outriders_chasseur', 'imperial_outriders'),
('imperial_outriders_hussar', 'imperial_outriders'),
('imperial_outriders_groom', 'imperial_outriders'),
('norse_jarl', 'norse_explorers'),
('norse_berserker', 'norse_explorers'),
('norse_bondsman', 'norse_explorers'),
('norse_hunter', 'norse_explorers'),
('outlaws_bandit_leader', 'outlaws_of_stirwood_forest'),
('outlaws_champion', 'outlaws_of_stirwood_forest'),
('outlaws_cleric', 'outlaws_of_stirwood_forest'),
('outlaws_petty_thief', 'outlaws_of_stirwood_forest'),
('outlaws_marksman', 'outlaws_of_stirwood_forest'),
('outlaws_outlaw', 'outlaws_of_stirwood_forest'),
('pirates_captain', 'pirates'),
('pirates_ships_mate', 'pirates'),
('pirates_cabin_boy', 'pirates'),
('pirates_crew', 'pirates'),
('pirates_gunner', 'pirates'),
('pirates_boatswain', 'pirates'),
('pirates_swabbie', 'pirates'),
('pit_fighters_pit_king', 'pit_fighters'),
('pit_fighters_pit_veteran', 'pit_fighters'),
('pit_fighters_pit_fighter', 'pit_fighters'),
('pit_fighters_pursuer', 'pit_fighters'),
('tileans_miragleans_captain', 'tileans_miragleans'),
('tileans_miragleans_champion', 'tileans_miragleans'),
('tileans_miragleans_youngblood', 'tileans_miragleans'),
('tileans_miragleans_warrior', 'tileans_miragleans'),
('tileans_miragleans_marksman', 'tileans_miragleans'),
('tileans_miragleans_duellist', 'tileans_miragleans'),
('tileans_remasens_captain', 'tileans_remasens'),
('tileans_remasens_champion', 'tileans_remasens'),
('tileans_remasens_youngblood', 'tileans_remasens'),
('tileans_remasens_warrior', 'tileans_remasens'),
('tileans_remasens_marksman', 'tileans_remasens'),
('tileans_remasens_duellist', 'tileans_remasens'),
('tileans_trantios_captain', 'tileans_trantios'),
('tileans_trantios_champion', 'tileans_trantios'),
('tileans_trantios_youngblood', 'tileans_trantios'),
('tileans_trantios_warrior', 'tileans_trantios'),
('tileans_trantios_marksman', 'tileans_trantios'),
('tileans_trantios_duellist', 'tileans_trantios'),
('battle_monks_emissary', 'battle_monks_of_cathay'),
('battle_monks_officer', 'battle_monks_of_cathay'),
('battle_monks_dragon_monks', 'battle_monks_of_cathay'),
('battle_monks_soldiers', 'battle_monks_of_cathay'),
('battle_monks_warrior_monks', 'battle_monks_of_cathay'),
('battle_monks_raging_peasants', 'battle_monks_of_cathay'),
('bretonnian_questing_knight', 'bretonnian_chapel_guard'),
('bretonnian_damsel', 'bretonnian_chapel_guard'),
('bretonnian_knight_errant', 'bretonnian_chapel_guard'),
('bretonnian_squires', 'bretonnian_chapel_guard'),
('bretonnian_battle_pilgrims', 'bretonnian_chapel_guard'),
('bretonnian_bowmen', 'bretonnian_chapel_guard'),
('court_of_pleasures_whipmaster', 'court_of_the_profane_pleasures'),
('court_of_pleasures_danseuse', 'court_of_the_profane_pleasures'),
('court_of_pleasures_flesh_merchant', 'court_of_the_profane_pleasures'),
('court_of_pleasures_priest_of_obscene', 'court_of_the_profane_pleasures'),
('court_of_pleasures_devout', 'court_of_the_profane_pleasures'),
('court_of_pleasures_wretches', 'court_of_the_profane_pleasures'),
('court_of_pleasures_cultists', 'court_of_the_profane_pleasures'),
('cursed_cavalcade_aristocrat', 'the_cursed_cavalcade'),
('cursed_cavalcade_companions', 'the_cursed_cavalcade'),
('cursed_cavalcade_twisted_scholar', 'the_cursed_cavalcade'),
('cursed_cavalcade_cursed_piper', 'the_cursed_cavalcade'),
('cursed_cavalcade_thrall', 'the_cursed_cavalcade'),
('cursed_cavalcade_captured_thrall', 'the_cursed_cavalcade'),
('lustrian_reavers_conqueror', 'lustrian_reavers'),
('lustrian_reavers_saurus_slayer', 'lustrian_reavers'),
('lustrian_reavers_beastmaster', 'lustrian_reavers'),
('lustrian_reavers_jungle_shadow', 'lustrian_reavers'),
('lustrian_reavers_trapmaster', 'lustrian_reavers'),
('lustrian_reavers_prospects', 'lustrian_reavers'),
('lustrian_reavers_estalian_warhound', 'lustrian_reavers'),
('lustrian_reavers_barbary_monkey', 'lustrian_reavers'),
('lustrian_reavers_tilean_hunting_hawk', 'lustrian_reavers'),
('merchant_merchant', 'merchant_caravans'),
('merchant_apprentice', 'merchant_caravans'),
('merchant_knights_vanguard', 'merchant_caravans'),
('merchant_magician', 'merchant_caravans'),
('merchant_sell_swords', 'merchant_caravans'),
('merchant_marksmen', 'merchant_caravans'),
('merchant_blackguards', 'merchant_caravans'),
('merchant_trade_wagon', 'merchant_caravans'),
('restless_dead_necromancer', 'the_restless_dead'),
('restless_dead_zombies', 'the_restless_dead'),
('restless_dead_skeletons', 'the_restless_dead'),
('restless_dead_scarecrows', 'the_restless_dead'),
('dreamwalkers_dreamer', 'dreamwalkers_cult_of_morr'),
('dreamwalkers_priest_of_morr', 'dreamwalkers_cult_of_morr'),
('dreamwalkers_black_guards_of_morr', 'dreamwalkers_cult_of_morr'),
('dreamwalkers_andanti', 'dreamwalkers_cult_of_morr'),
('dreamwalkers_deaths_heads_of_ostermark', 'dreamwalkers_cult_of_morr'),
('dreamwalkers_morr_worshwishpers_henchmen', 'dreamwalkers_cult_of_morr'),
('grave_robbers_graver', 'grave_robbers'),
('grave_robbers_grave_robber', 'grave_robbers'),
('grave_robbers_junior_medic', 'grave_robbers'),
('grave_robbers_lookout', 'grave_robbers'),
('grave_robbers_thugs', 'grave_robbers'),
('masters_of_horror_mad_scientist', 'masters_of_horror'),
('masters_of_horror_thrall', 'masters_of_horror'),
('masters_of_horror_hunchbacks', 'masters_of_horror'),
('masters_of_horror_zombies', 'masters_of_horror'),
('masters_of_horror_flesh_construct', 'masters_of_horror'),
('masters_of_horror_the_bitten', 'masters_of_horror'),
('mazzalupo_wandering_knight', 'mazzalupo'),
('mazzalupo_fallen_noble', 'mazzalupo'),
('mazzalupo_master_of_finances', 'mazzalupo'),
('mazzalupo_squire', 'mazzalupo'),
('mazzalupo_sheepherders', 'mazzalupo'),
('mazzalupo_churl', 'mazzalupo'),
('necrarchs_thrall', 'necrarchs_the_soul_stealers'),
('necrarchs_acolytes', 'necrarchs_the_soul_stealers'),
('necrarchs_skeletal_warriors', 'necrarchs_the_soul_stealers'),
('necrarchs_zombies', 'necrarchs_the_soul_stealers'),
('necrarchs_abomination', 'necrarchs_the_soul_stealers'),
('necrarchs_waifs', 'necrarchs_the_soul_stealers'),
('nipponese_hatamoto', 'nipponese_expedition'),
('nipponese_vim_to_mage', 'nipponese_expedition'),
('nipponese_shinobi_hero', 'nipponese_expedition'),
('nipponese_retainers', 'nipponese_expedition'),
('nipponese_ashigaru', 'nipponese_expedition'),
('nipponese_onnabushi', 'nipponese_expedition'),
('nipponese_warrior_monks', 'nipponese_expedition'),
('paragon', 'order_of_the_mare'),
('dame_of_the_mare', 'order_of_the_mare'),
('gallant', 'order_of_the_mare'),
('esquiresses', 'order_of_the_mare'),
('pilgrims', 'order_of_the_mare'),
('bowmen', 'order_of_the_mare'),
('redeemed_knights', 'order_of_the_mare'),
('companion_filly', 'order_of_the_mare'),
('bandit_leader', 'outlaws_of_stirwood_forest_redux'),
('champions', 'outlaws_of_stirwood_forest_redux'),
('cleric', 'outlaws_of_stirwood_forest_redux'),
('petty_thieves', 'outlaws_of_stirwood_forest_redux'),
('outlaws', 'outlaws_of_stirwood_forest_redux'),
('marksmen', 'outlaws_of_stirwood_forest_redux'),
('warrior_priest', 'protectorate_of_sigmar'),
('templars', 'protectorate_of_sigmar'),
('acolytes', 'protectorate_of_sigmar'),
('huntsman', 'protectorate_of_sigmar'),
('archers', 'protectorate_of_sigmar'),
('crusaders', 'protectorate_of_sigmar'),
('magus', 'sorcerous_society'),
('companions', 'sorcerous_society'),
('mages', 'sorcerous_society'),
('untrained', 'sorcerous_society'),
('grunts', 'sorcerous_society'),
('seer', 'survivors_of_strigos'),
('domnu', 'survivors_of_strigos'),
('strigany', 'survivors_of_strigos'),
('vampire_hunter', 'vampire_hunters_of_sylvania'),
('priest_of_morr', 'vampire_hunters_of_sylvania'),
('slayers', 'vampire_hunters_of_sylvania'),
('villagers', 'vampire_hunters_of_sylvania'),
('pilgrims_of_the_dark_shroud', 'vampire_hunters_of_sylvania'),
('restless_dead_variant_necromancer', 'the_restless_dead_variant'),
('restless_dead_variant_zombies', 'the_restless_dead_variant'),
('restless_dead_variant_skeletons', 'the_restless_dead_variant'),
('restless_dead_variant_bone_goliath', 'the_restless_dead_variant');
alter table public.kidnap_eligible_units enable row level security;
create policy kidnap_eligible_units_select on public.kidnap_eligible_units for select to authenticated using (true);
grant select on public.kidnap_eligible_units to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Henchman opportunities: once the Pirates have filed a winning report, every lost human henchman
-- (survival die 1-2) on an enemy's applied report gets one case, with the pre-death snapshot.
-- ---------------------------------------------------------------------------------------------
create function public.open_kidnap_cases(p_match_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare pr record; vr record; line jsonb; g jsonb; gname text; gunit text; i int; roll text; v_case uuid; items jsonb;
begin
  for pr in select r.id, r.warband_id, w.owner_id, w.name from public.match_reports r join public.warbands w on w.id = r.warband_id
             where r.match_id = p_match_id and r.undo is not null and r.result = 'won' and w.type_rules_id = 'pirates' loop
    for vr in select r.*, w.type_rules_id, w.owner_id, w.name as warband_name from public.match_reports r join public.warbands w on w.id = r.warband_id
               where r.match_id = p_match_id and r.undo is not null and r.warband_id <> pr.warband_id loop
      for line in select x from jsonb_array_elements(coalesce(vr.injuries, '[]'::jsonb)) x where x->>'subjectType' = 'group' and coalesce((x->>'dead')::int, 0) > 0 loop
        if (line->>'subjectId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then continue; end if;
        select name, unit_type_rules_id into gname, gunit from public.henchman_groups where id = (line->>'subjectId')::uuid and warband_id = vr.warband_id;
        if not found then continue; end if;
        if not exists (select 1 from public.kidnap_eligible_units e where e.unit_type_rules_id = gunit and e.warband_type_rules_id = vr.type_rules_id) then continue; end if;
        select e->'before' into g from jsonb_array_elements(coalesce(vr.undo->'groups', '[]'::jsonb)) e where e->>'id' = line->>'subjectId' limit 1;
        if g is null then select jsonb_build_object('stats', stats, 'size', size, 'xp', xp, 'level_ups', level_ups, 'campaign_state', campaign_state) into g from public.henchman_groups where id = (line->>'subjectId')::uuid; end if;
        -- Each lost model's share of the group's kit. The report's own casualty accounting
        -- (line.equipmentLost: what the dead models actually took with them, net of supplies spent in
        -- the battle) is the pool, divided evenly across the dead; a pool that does not divide is
        -- flagged for the victim's player to allocate by hand. A report without that accounting only
        -- records the rows the report reduced, as candidates with no quantity: inferring a share from
        -- before − final could hand the Pirates a vial the owner drank.
        select coalesce(jsonb_agg(((u->'row') - 'quantity' - 'updated_at' - 'created_at') || jsonb_build_object('quantity', share.per_model, 'lost', share.lost)), '[]'::jsonb) into items
          from jsonb_array_elements(coalesce(vr.undo->'items', '[]'::jsonb)) u
          cross join lateral (select case when jsonb_typeof(line->'equipmentLost') = 'array'
                                            -- casualty losses net of what forced-captured models of the same group took with them
                                            then greatest(0, coalesce((select (e->>'quantity')::int from jsonb_array_elements(line->'equipmentLost') e where e->>'sourceItemId' = u->>'id' limit 1), 0)
                                                             - coalesce((select sum((kk->>'quantity')::int) from jsonb_array_elements(coalesce(line->'captured', '[]'::jsonb)) cp, jsonb_array_elements(coalesce(cp->'kit', '[]'::jsonb)) kk where kk->>'sourceItemId' = u->>'id'), 0))
                                            else (u->'before'->>'quantity')::int - coalesce((select (pt->>'quantity')::int from jsonb_array_elements(coalesce(vr.applied->'item_patches', '[]'::jsonb)) pt where pt->>'id' = u->>'id' limit 1), (u->'before'->>'quantity')::int) end as lost,
                                     jsonb_typeof(line->'equipmentLost') = 'array' as accounted) l
          cross join lateral (select l.lost, case when l.accounted and l.lost > 0 and l.lost % greatest((line->>'dead')::int, 1) = 0 then l.lost / greatest((line->>'dead')::int, 1) else null end as per_model) share
          where u->'row'->>'holder_id' = line->>'subjectId' and l.lost > 0;
        i := 0;
        for roll in select x from jsonb_array_elements_text(coalesce(line->'rolls', '[]'::jsonb)) x loop
          i := i + 1;
          if roll not in ('1', '2') then continue; end if;
          insert into public.captive_cases (report_id, report_revision, match_id, victim_warband_id, captor_warband_id, hero_id, hero_name, state, assigned_at, subject_kind, model_index, source, model_snapshot)
            values (vr.id, vr.revision, p_match_id, vr.warband_id, pr.warband_id, (line->>'subjectId')::uuid, gname || ' (model ' || i || ')', 'open', now(), 'henchman', i, 'pirates_kidnapped',
                    jsonb_build_object('group', g || jsonb_build_object('id', line->>'subjectId', 'name', gname, 'unit_type_rules_id', gunit), 'items', items, 'survival_roll', roll::int,
                                       'kit_unresolved', exists (select 1 from jsonb_array_elements(items) x where x->'quantity' = 'null'::jsonb)))
            on conflict do nothing returning id into v_case;
          if v_case is null then continue; end if;
          insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
            values (pr.owner_id, 'captive', left('Kidnapped! chance: ' || gname || ' (' || vr.warband_name || ')', 140), 'A lost enemy henchman may be dragged aboard. Roll D6 to recover the body (4+) from your warband page.', '/warbands/' || pr.warband_id, 'captive:' || v_case || ':captor') on conflict do nothing;
          insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
            values (vr.owner_id, 'captive', left(pr.name || ' may press-gang your fallen ' || gname, 140), 'The Pirates won and may try to recruit a henchman you lost. You will be asked to roll your Leadership dice if they recover him.', '/warbands/' || vr.warband_id, 'captive:' || v_case || ':victim') on conflict do nothing;
        end loop;
      end loop;
    end loop;
  end loop;
end $$;
revoke all on function public.open_kidnap_cases(uuid) from public;

create function public.open_kidnap_cases_trigger() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.undo is not null and exists (select 1 from public.match_participants p join public.warbands w on w.id = p.warband_id where p.match_id = new.match_id and w.type_rules_id = 'pirates') then
    perform public.open_kidnap_cases(new.match_id);
  end if;
  return new;
end $$;
revoke all on function public.open_kidnap_cases_trigger() from public;
create trigger open_kidnap_cases after update of undo on public.match_reports for each row execute function public.open_kidnap_cases_trigger();

-- Withdrawing the Pirates' own winning report removes the win the opportunities rested on.
create function public.guard_kidnap_report() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' or (old.undo is not null and new.undo is null) then
    update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The Pirates'' report was withdrawn or corrected.'
      where state = 'proposed' and case_id in (select id from public.captive_cases where source = 'pirates_kidnapped' and captor_warband_id = old.warband_id and match_id = old.match_id);
    update public.captive_cases set state = 'withdrawn', resolved_at = now(), resolution_message = 'The Pirates'' report was withdrawn or corrected.'
      where source = 'pirates_kidnapped' and captor_warband_id = old.warband_id and match_id = old.match_id and state in ('unassigned', 'open');
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.guard_kidnap_report() from public;
create trigger guard_kidnap_report before update of undo or delete on public.match_reports for each row execute function public.guard_kidnap_report();

-- ---------------------------------------------------------------------------------------------
-- record_kidnap_recovery: the Pirates (or GM) roll once to see whether the body is recovered.
-- ---------------------------------------------------------------------------------------------
create function public.record_kidnap_recovery(p_case_id uuid, p_d6 integer, p_original integer default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.captive_cases%rowtype; v_gm boolean; v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_d6 is null or p_d6 not between 1 and 6 or (p_original is not null and p_original not between 1 and 6) then raise exception 'Enter a D6 result from 1 to 6.' using errcode = '22023'; end if;
  select * into c from public.captive_cases where id = p_case_id;
  if not found then raise exception 'Captive case not found.' using errcode = 'P0002'; end if;
  perform public.lock_captive_context(c.match_id, c.victim_warband_id, c.captor_warband_id);
  select * into c from public.captive_cases where id = p_case_id for update;
  v_gm := public.is_campaign_gm(public.match_campaign(c.match_id));
  if not (v_gm or public.can_edit_warband(c.captor_warband_id)) then raise exception 'Only the Pirate player or the campaign GM rolls to recover the body.' using errcode = '42501'; end if;
  if c.subject_kind <> 'henchman' or c.source <> 'pirates_kidnapped' then raise exception 'Only a lost henchman needs a recovery roll.' using errcode = 'P0001'; end if;
  if c.state <> 'open' then raise exception 'This opportunity is closed.' using errcode = 'P0001'; end if;
  if c.recovery is not null then raise exception 'The recovery die has already been rolled for this henchman; there is no second attempt.' using errcode = 'P0001'; end if;
  update public.captive_cases set recovery = jsonb_build_object('d6', p_d6, 'original', p_original, 'by', auth.uid(), 'at', now()),
         history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'recovery_rolled', 'd6', p_d6, 'original', p_original) where id = c.id;
  if p_d6 < 4 then
    update public.captive_cases set state = 'withdrawn', resolved_at = now(), resolution_kind = 'not_recovered',
           resolution_message = 'Not recovered: the Pirates rolled ' || p_d6 || case when p_original is not null and p_original <> p_d6 then ' (app rolled ' || p_original || ')' else '' end || ' and could not drag the body away.' where id = c.id;
    select owner_id into v_owner from public.warbands where id = c.victim_warband_id;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_owner, 'captive', left(c.hero_name || ': not recovered by the Pirates', 140), 'The Pirates failed to recover the body (D6 ' || p_d6 || ').', '/warbands/' || c.victim_warband_id, 'captive:' || c.id || ':not_recovered') on conflict do nothing;
  else
    select owner_id into v_owner from public.warbands where id = c.victim_warband_id;
    insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
      values (v_owner, 'captive', left(c.hero_name || ': recovered by the Pirates', 140), 'The Pirates recovered the body (D6 ' || p_d6 || '). Record your two Leadership dice for the contest from your warband page.', '/warbands/' || c.victim_warband_id, 'captive:' || c.id || ':recovered') on conflict do nothing;
  end if;
end $$;
revoke all on function public.record_kidnap_recovery(uuid, integer, integer) from public;
grant execute on function public.record_kidnap_recovery(uuid, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- record_kidnap_dice: each player records their own 2D6 once (the GM may record either side).
-- reset_kidnap_contest: the GM's reasoned override to let both sides roll again.
-- ---------------------------------------------------------------------------------------------
create function public.record_kidnap_dice(p_case_id uuid, p_dice integer[], p_original integer[] default null, p_side text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.captive_cases%rowtype; v_gm boolean; side text; v_other uuid; v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_dice is null or cardinality(p_dice) <> 2 or p_dice[1] not between 1 and 6 or p_dice[2] not between 1 and 6 then raise exception 'Roll two dice, each 1 to 6.' using errcode = '22023'; end if;
  if p_original is not null and (cardinality(p_original) <> 2 or p_original[1] not between 1 and 6 or p_original[2] not between 1 and 6) then raise exception 'Preserve both original dice.' using errcode = '22023'; end if;
  select * into c from public.captive_cases where id = p_case_id;
  if not found then raise exception 'Captive case not found.' using errcode = 'P0002'; end if;
  perform public.lock_captive_context(c.match_id, c.victim_warband_id, c.captor_warband_id);
  select * into c from public.captive_cases where id = p_case_id for update;
  if c.state <> 'open' or c.captor_warband_id is null then raise exception 'This captive case is not open.' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.warbands where id = c.captor_warband_id and type_rules_id = 'pirates') then raise exception 'Only a Pirate warband holds a Kidnapped! contest.' using errcode = 'P0001'; end if;
  if c.subject_kind = 'henchman' and coalesce((c.recovery->>'d6')::int, 0) < 4 then raise exception 'Roll to recover the body first.' using errcode = 'P0001'; end if;
  v_gm := public.is_campaign_gm(public.match_campaign(c.match_id));
  if public.can_edit_warband(c.captor_warband_id) and coalesce(p_side, 'pirates') = 'pirates' then side := 'pirates';
  elsif public.can_edit_warband(c.victim_warband_id) and coalesce(p_side, 'victim') = 'victim' then side := 'victim';
  elsif v_gm and p_side in ('pirates', 'victim') then side := p_side;
  else raise exception 'Record your own side''s dice; the GM may record either side by naming it.' using errcode = '42501'; end if;
  if c.contest -> side is not null then raise exception 'The % dice are already recorded. Ask the campaign GM to reset the contest if they must be rolled again.', side using errcode = 'P0001'; end if;
  update public.captive_cases set contest = coalesce(contest, '{}'::jsonb) || jsonb_build_object(side, jsonb_build_object('dice', to_jsonb(p_dice), 'original', to_jsonb(p_original), 'by', auth.uid(), 'at', now())),
         history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'contest_dice', 'side', side, 'dice', to_jsonb(p_dice), 'original', to_jsonb(p_original)) where id = c.id;
  v_other := case when side = 'pirates' then c.victim_warband_id else c.captor_warband_id end;
  select owner_id into v_owner from public.warbands where id = v_other;
  insert into public.app_notifications (user_id, kind, title, body, href, dedupe_key)
    values (v_owner, 'captive', left(c.hero_name || ': Kidnapped! dice recorded (' || p_dice[1] || ' + ' || p_dice[2] || ')', 140), case when side = 'pirates' then 'The Pirates rolled their Leadership dice. Record yours from your warband page.' else 'The other player rolled their Leadership dice. Record yours, then propose the outcome.' end, '/warbands/' || v_other, 'captive:' || c.id || ':dice:' || side) on conflict do nothing;
end $$;
revoke all on function public.record_kidnap_dice(uuid, integer[], integer[], text) from public;
grant execute on function public.record_kidnap_dice(uuid, integer[], integer[], text) to authenticated;

create function public.reset_kidnap_contest(p_case_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.captive_cases%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Explain why the contest is being reset.' using errcode = 'P0001'; end if;
  select * into c from public.captive_cases where id = p_case_id;
  if not found then raise exception 'Captive case not found.' using errcode = 'P0002'; end if;
  perform public.lock_captive_context(c.match_id, c.victim_warband_id, c.captor_warband_id);
  select * into c from public.captive_cases where id = p_case_id for update;
  if not public.is_campaign_gm(public.match_campaign(c.match_id)) then raise exception 'Only the campaign GM can reset a Kidnapped! contest.' using errcode = '42501'; end if;
  if c.state <> 'open' then raise exception 'This captive case is not open.' using errcode = 'P0001'; end if;
  update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The GM reset the Kidnapped! contest: ' || btrim(p_reason) where case_id = c.id and state = 'proposed';
  update public.captive_cases set contest = null, history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'contest_reset', 'reason', btrim(p_reason), 'previous', c.contest) where id = c.id;
end $$;
revoke all on function public.reset_kidnap_contest(uuid, text) from public;
grant execute on function public.reset_kidnap_contest(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Validation of a 'kidnapped' outcome. The server recomputes the contest from the recorded dice, the
-- reports on file and the Captain's Leadership, and pins the roster changes to it.
-- ---------------------------------------------------------------------------------------------
create function public.validate_kidnapped_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v public.warbands%rowtype; k public.warbands%rowtype; h public.heroes%rowtype; existing public.henchman_groups%rowtype; item_row public.items%rowtype;
  c jsonb; keys text[]; t text; op text; v_id uuid; d jsonb; key text; qty int; tag text; seen text[] := '{}';
  victim_name text; victim_stats jsonb; victim_ld int; victim_skills text[]; hero_items int := 0; moved int := 0; surrendered jsonb := '{}'::jsonb; gained jsonb := '{}'::jsonb; gained_total int := 0; snap_keys text[] := '{}';
  hero_status text; pirate_dice int[]; victim_dice int[]; pirate_total int; victim_total int; captain_ld int; winner text; outcome text;
  crew_stats jsonb := '{"M":4,"WS":3,"BS":3,"S":3,"T":3,"W":1,"I":3,"A":1,"Ld":7}'::jsonb;
  crew_kit text[] := array['dagger', 'hammer', 'mace', 'axe', 'boat_hook', 'sword', 'double_handed_weapon', 'belaying_pins', 'crossbow', 'pistol', 'duelling_pistol', 'buckler', 'toughened_leathers', 'helmet', 'light_armour'];
  group_id uuid; group_seen boolean := false; group_updated boolean := false; group_items_updated int := 0; kit_keys text[] := '{}'; group_dagger int := 0; group_name text; group_skills text[];
  crew_models int; swabbie_models int; parts text[]; contest_line text; snap_kit jsonb := '{}'::jsonb;
begin
  select * into v from public.warbands where id = p_case.victim_warband_id;
  select * into k from public.warbands where id = p_case.captor_warband_id;
  if k.id is null or k.type_rules_id <> 'pirates' then raise exception 'Only a Pirate warband can offer Kidnapped!.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_advances, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_advances, '[]'::jsonb)) > 0 then raise exception 'Kidnapped! awards no experience.' using errcode = '22023'; end if;
  outcome := p_choice->>'outcome';
  if outcome not in ('crew', 'swabbie') then raise exception 'The outcome must be crew or swabbie.' using errcode = '22023'; end if;
  group_id := coalesce(p_choice->'crew'->>'groupId', p_choice->>'groupId')::uuid;
  if group_id is null then raise exception 'Name the Crew or Swabbie group the recruit joins or forms.' using errcode = '22023'; end if;

  -- The victim ------------------------------------------------------------------------------------
  if p_case.subject_kind = 'hero' then
    select * into h from public.heroes where id = p_case.hero_id and warband_id = v.id and status = 'captured';
    if not found then raise exception 'This warrior is no longer recorded as captured.' using errcode = 'P0001'; end if;
    if h.is_hired_sword then raise exception 'Hired Swords and Dramatis Personae cannot be recruited by Kidnapped!' using errcode = '22023'; end if;
    if not exists (select 1 from public.kidnap_eligible_units e where e.unit_type_rules_id = h.unit_type_rules_id and e.warband_type_rules_id = v.type_rules_id) then
      raise exception 'Only human warriors can be recruited by Kidnapped!' using errcode = '22023';
    end if;
    if not exists (select 1 from public.match_reports r, jsonb_array_elements(coalesce(r.injuries, '[]'::jsonb)) l
                    where r.id = p_case.report_id and l->>'subjectId' = h.id::text and l->>'outcome' = 'captured' and (l->'rolls') @> '[61]'::jsonb) then
      raise exception 'The Hero must have rolled the Captured result (61).' using errcode = '22023';
    end if;
    victim_name := h.name; victim_stats := h.stats; victim_ld := (h.stats->>'Ld')::int;
    victim_skills := coalesce(h.skills, '{}');
    select count(*) into hero_items from public.items where warband_id = v.id and holder_type = 'hero' and holder_id = h.id;
  else
    if p_case.source <> 'pirates_kidnapped' or p_case.model_snapshot is null then raise exception 'This case is not a Kidnapped! opportunity.' using errcode = '22023'; end if;
    if coalesce((p_case.recovery->>'d6')::int, 0) < 4 then raise exception 'Roll to recover the body first (4+).' using errcode = 'P0001'; end if;
    victim_name := p_case.hero_name; victim_stats := p_case.model_snapshot->'group'->'stats'; victim_ld := (victim_stats->>'Ld')::int;
    select coalesce(array_agg(x), '{}') into victim_skills from jsonb_array_elements_text(coalesce(p_case.model_snapshot->'group'->'campaign_state'->'inheritedSkillIds', '[]'::jsonb)) x;
    select coalesce(array_agg(coalesce(i->>'item_rules_id', 'custom:' || coalesce(i->>'custom_name', ''))), '{}') into snap_keys from jsonb_array_elements(coalesce(p_case.model_snapshot->'items', '[]'::jsonb)) i where jsonb_typeof(i->'quantity') = 'number';
    snap_kit := (select coalesce(jsonb_object_agg(coalesce(i->>'item_rules_id', 'custom:' || coalesce(i->>'custom_name', '')), i->'quantity'), '{}'::jsonb) from jsonb_array_elements(coalesce(p_case.model_snapshot->'items', '[]'::jsonb)) i where jsonb_typeof(i->'quantity') = 'number');
  end if;
  if victim_ld is null then raise exception 'The captive has no Leadership on file.' using errcode = '22023'; end if;

  -- The contest -----------------------------------------------------------------------------------
  if p_case.contest->'pirates' is null or p_case.contest->'victim' is null then raise exception 'Both players must record their two Leadership dice before an outcome is proposed.' using errcode = 'P0001'; end if;
  select array_agg(x::int) into pirate_dice from jsonb_array_elements_text(p_case.contest->'pirates'->'dice') x;
  select array_agg(x::int) into victim_dice from jsonb_array_elements_text(p_case.contest->'victim'->'dice') x;
  if p_choice->'pirateRoll'->'dice' is distinct from p_case.contest->'pirates'->'dice' or p_choice->'victimRoll'->'dice' is distinct from p_case.contest->'victim'->'dice' then
    raise exception 'The proposal must use the dice both players recorded.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.match_reports where match_id = p_case.match_id and warband_id = k.id and undo is not null) then raise exception 'The Pirates must file their own report before Kidnapped! is resolved.' using errcode = 'P0001'; end if;
  winner := case when exists (select 1 from public.match_reports where match_id = p_case.match_id and warband_id = k.id and undo is not null and result = 'won') then 'pirates'
                 when exists (select 1 from public.match_reports where match_id = p_case.match_id and warband_id = v.id and undo is not null and result = 'won') then 'victim' else 'draw' end;
  if p_case.subject_kind = 'henchman' and winner <> 'pirates' then raise exception 'Pirates may only take lost henchmen when they won the battle.' using errcode = 'P0001'; end if;
  if p_choice->>'winner' is distinct from winner then raise exception 'The reports on file give the battle result "%".', winner using errcode = '22023'; end if;
  select max((stats->>'Ld')::int) into captain_ld from public.heroes where warband_id = k.id and status = 'active' and unit_type_rules_id = 'pirates_captain';
  if captain_ld is null then select max((stats->>'Ld')::int) into captain_ld from public.heroes where warband_id = k.id and status = 'active' and unit_type_rules_id = 'pirates_ships_mate'; end if;
  if captain_ld is null then raise exception 'The Pirates have no active Captain or Ship''s Mate to lead the contest.' using errcode = 'P0001'; end if;
  if (p_choice->>'captainLeadership')::int is distinct from captain_ld then raise exception 'The Captain''s Leadership on file is %.', captain_ld using errcode = '22023'; end if;
  pirate_total := pirate_dice[1] + pirate_dice[2] + captain_ld + case when winner = 'pirates' then 1 else 0 end;
  victim_total := victim_dice[1] + victim_dice[2] + victim_ld + case when winner = 'victim' then 1 else 0 end;
  if outcome <> (case when pirate_total > victim_total then 'crew' else 'swabbie' end) then raise exception 'The dice give % (Pirates % against %).', (case when pirate_total > victim_total then 'crew' else 'swabbie' end), pirate_total, victim_total using errcode = '22023'; end if;

  -- Owner (victim) side -------------------------------------------------------------------------
  for c in select x from jsonb_array_elements(p_owner_changes) x loop
    if p_case.subject_kind = 'henchman' then raise exception 'Nothing changes on the victim''s roster for a henchman already lost.' using errcode = '22023'; end if;
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    tag := t || ':' || op || ':' || coalesce(v_id::text, v.id::text);
    if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
    seen := seen || tag;
    if t = 'heroes' and op = 'update' and v_id = h.id then
      if not (keys <@ array['status', 'flags', 'injuries']) then raise exception 'Kidnapped! may only change the captive''s status, flags and injuries.' using errcode = '22023'; end if;
      if not public.captive_return_fields_ok(h, d) then raise exception 'The captive''s flags and injuries may only lose the Captured marker and close its entry; nothing else may change.' using errcode = '22023'; end if;
      hero_status := d->>'status';
    elsif t = 'items' and op = 'delete' then
      select * into item_row from public.items i where i.id = v_id and i.warband_id = v.id and i.holder_type = 'hero' and i.holder_id = h.id;
      if not found then raise exception 'The proposal changes something Kidnapped! cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023'; end if;
      key := coalesce(item_row.item_rules_id, 'custom:' || coalesce(item_row.custom_name, ''));
      surrendered := jsonb_set(surrendered, array[key], to_jsonb(coalesce((surrendered->>key)::int, 0) + item_row.quantity));
      moved := moved + 1;
    else
      raise exception 'The proposal changes something Kidnapped! cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
    end if;
  end loop;
  if p_case.subject_kind = 'hero' then
    if hero_status is distinct from 'retired' then raise exception 'The recruited Hero leaves his old warband: his status must become "retired".' using errcode = '22023'; end if;
    if moved <> hero_items then raise exception 'All of the Hero''s equipment leaves with him.' using errcode = '22023'; end if;
  end if;

  -- Captor (Pirates) side ---------------------------------------------------------------------
  for c in select x from jsonb_array_elements(p_captor_changes) x loop
    t := c->>'table'; op := c->>'op'; v_id := (c->>'id')::uuid; d := coalesce(c->'data', '{}'::jsonb);
    select coalesce(array_agg(x), '{}') into keys from jsonb_object_keys(d) x;
    tag := t || ':' || op || ':' || coalesce(v_id::text, coalesce(c->>'id', k.id::text));
    if op <> 'insert' or t = 'henchman_groups' then
      if tag = any(seen) then raise exception 'The proposal changes the same row twice (% %).', op, t using errcode = '22023'; end if;
      seen := seen || tag;
    end if;
    if t = 'henchman_groups' and op = 'insert' then
      if group_seen or group_updated then raise exception 'Kidnapped! creates or joins exactly one group.' using errcode = '22023'; end if;
      if (c->>'id')::uuid is distinct from group_id then raise exception 'The new group must be the one named in the outcome.' using errcode = '22023'; end if;
      if exists (select 1 from public.henchman_groups where id = group_id) then raise exception 'That group already exists.' using errcode = '22023'; end if;
      if not (keys <@ array['name', 'unit_type_rules_id', 'size', 'stats', 'xp', 'level_ups', 'stat_increases', 'is_large', 'notes', 'sort_order', 'model_names', 'campaign_state']) then raise exception 'The new group carries a field this outcome cannot set.' using errcode = '22023'; end if;
      if coalesce((d->>'size')::int, 1) <> 1 or coalesce((d->>'xp')::int, 0) <> 0 or coalesce((d->>'level_ups')::int, 0) <> 0 or coalesce(d->'stat_increases', '{}'::jsonb) <> '{}'::jsonb
         or coalesce((d->>'is_large')::boolean, false) or coalesce(jsonb_array_length(d->'model_names'), 0) > 1 or char_length(coalesce(d->>'name', '')) > 80 or char_length(coalesce(d->>'notes', '')) > 0 then
        raise exception 'The recruit becomes a single new model with no experience, no increases and no notes.' using errcode = '22023';
      end if;
      group_seen := true; group_name := d->>'name';
      if outcome = 'crew' then
        if d->>'unit_type_rules_id' <> 'pirates_crew' or d->'stats' is distinct from crew_stats or coalesce(d->'campaign_state', '{}'::jsonb) <> '{}'::jsonb then raise exception 'A new Crew model carries the printed Crew profile % and no campaign state.', crew_stats::text using errcode = '22023'; end if;
      else
        if d->>'unit_type_rules_id' <> 'pirates_swabbie' or d->'stats' is distinct from victim_stats then raise exception 'A Swabbie keeps the recruit''s own profile %.', victim_stats::text using errcode = '22023'; end if;
        select coalesce(array_agg(x order by x), '{}') into group_skills from jsonb_array_elements_text(coalesce(d->'campaign_state'->'inheritedSkillIds', '[]'::jsonb)) x;
        if group_skills is distinct from (select coalesce(array_agg(x order by x), '{}') from unnest(victim_skills) x) or (coalesce(d->'campaign_state', '{}'::jsonb) - 'inheritedSkillIds') <> '{}'::jsonb then
          raise exception 'A Swabbie retains exactly the recruit''s skills [%] and nothing else in campaign state.', array_to_string(victim_skills, ', ') using errcode = '22023';
        end if;
      end if;
    elsif t = 'henchman_groups' and op = 'update' and outcome = 'crew' and v_id = group_id then
      if group_seen or group_updated then raise exception 'Kidnapped! creates or joins exactly one group.' using errcode = '22023'; end if;
      select * into existing from public.henchman_groups where id = v_id and warband_id = k.id and unit_type_rules_id = 'pirates_crew';
      if not found then raise exception 'The recruit may only join an existing Crew group of this warband.' using errcode = '22023'; end if;
      if existing.size > 4 then raise exception 'A Crew group of four or fewer models may take him; % already has %.', existing.name, existing.size using errcode = '22023'; end if;
      if not (keys <@ array['size', 'model_names']) or coalesce((d->>'size')::int, 0) <> existing.size + 1 or coalesce(jsonb_array_length(d->'model_names'), 0) > existing.size + 1 then
        raise exception 'Joining a Crew group adds exactly one model to it.' using errcode = '22023';
      end if;
      group_updated := true; group_name := existing.name;
    elsif t = 'items' and op = 'insert' and coalesce(d->>'holder_type', 'stash') = 'group' then
      if (d->>'holder_id')::uuid is distinct from group_id then raise exception 'New kit may only be issued to the recruit''s group.' using errcode = '22023'; end if;
      key := d->>'item_rules_id'; qty := coalesce((d->>'quantity')::int, 1);
      if outcome = 'crew' then
        if group_updated then raise exception 'A recruit joining an existing Crew group is armed exactly as his crewmates; issue no new items.' using errcode = '22023'; end if;
        if key is null or not (key = any(crew_kit)) then raise exception 'Crew kit comes from the Pirate equipment list only (% is not on it).', coalesce(key, d->>'custom_name') using errcode = '22023'; end if;
        if not (qty = 1 or (qty = 2 and key in ('pistol', 'duelling_pistol'))) or key = any(kit_keys) then raise exception 'One of each Crew item (a brace for pistols).' using errcode = '22023'; end if;
        kit_keys := kit_keys || key;
      else
        if key <> 'dagger' or qty <> 1 or group_dagger > 0 then raise exception 'A Swabbie is issued only the list''s free dagger; re-arm him afterwards from the Swabbie list.' using errcode = '22023'; end if;
        group_dagger := 1;
      end if;
    elsif t = 'items' and op = 'update' and outcome = 'crew' then
      select * into item_row from public.items where id = v_id and warband_id = k.id and holder_type = 'group' and holder_id = group_id;
      if not found or not (keys <@ array['quantity']) or coalesce((d->>'quantity')::int, 0) <> item_row.quantity + 1 then raise exception 'A recruit joining a Crew group takes one of each item the group carries.' using errcode = '22023'; end if;
      group_items_updated := group_items_updated + 1;
    elsif t = 'items' and op = 'insert' then
      if outcome = 'crew' then raise exception 'A recruit''s old equipment is exchanged for Crew kit, not kept.' using errcode = '22023'; end if;
      if nullif(d->>'holder_id', '') is not null or not (keys <@ array['holder_type', 'holder_id', 'item_rules_id', 'custom_name', 'quantity', 'notes']) then raise exception 'Surrendered equipment goes to the Pirates'' stash.' using errcode = '22023'; end if;
      key := coalesce(d->>'item_rules_id', 'custom:' || coalesce(d->>'custom_name', '')); qty := coalesce((d->>'quantity')::int, 1);
      if qty < 1 then raise exception 'Item quantities must be positive.' using errcode = '22023'; end if;
      if p_case.subject_kind = 'henchman' then
        if coalesce((p_case.model_snapshot->>'kit_unresolved')::boolean, false) then raise exception 'The fallen henchman''s share of mixed equipment was not recorded evenly in the report; the Pirates gain no equipment from him automatically. Adjust the stash by hand with a note.' using errcode = '22023'; end if;
        if not (key = any(snap_keys)) or gained ? key or qty <> (snap_kit->>key)::int then raise exception 'Only the fallen henchman''s own share of kit may be kept (%).', (select string_agg(e.key || ' ×' || e.value, ', ' order by e.key) from jsonb_each_text(snap_kit) e) using errcode = '22023'; end if;
      end if;
      gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + qty)); gained_total := gained_total + qty;
    elsif t = 'items' and op = 'update' and outcome = 'swabbie' and p_case.subject_kind = 'hero' then
      select * into item_row from public.items where id = v_id and warband_id = k.id and holder_type = 'stash';
      if not found or not (keys <@ array['quantity']) or coalesce((d->>'quantity')::int, item_row.quantity) <= item_row.quantity then raise exception 'The proposal changes something Kidnapped! cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023'; end if;
      key := coalesce(item_row.item_rules_id, 'custom:' || coalesce(item_row.custom_name, '')); qty := (d->>'quantity')::int - item_row.quantity;
      gained := jsonb_set(gained, array[key], to_jsonb(coalesce((gained->>key)::int, 0) + qty)); gained_total := gained_total + qty;
    else
      raise exception 'The proposal changes something Kidnapped! cannot touch (% % on %).', op, t, coalesce(v_id::text, 'a new row') using errcode = '22023';
    end if;
  end loop;
  if outcome = 'crew' then
    if not (group_seen or group_updated) then raise exception 'The recruit must form a new Crew group or join one of four or fewer.' using errcode = '22023'; end if;
    if group_updated and group_items_updated <> (select count(*) from public.items where warband_id = k.id and holder_type = 'group' and holder_id = group_id) then raise exception 'A recruit joining a Crew group takes one of each item the group carries.' using errcode = '22023'; end if;
    if gained_total > 0 then raise exception 'A recruit''s old equipment is exchanged for Crew kit, not kept.' using errcode = '22023'; end if;
  else
    if not group_seen then raise exception 'The recruit must form his own Swabbie group.' using errcode = '22023'; end if;
    if p_case.subject_kind = 'hero' and gained <> surrendered then raise exception 'All of the Hero''s equipment passes to the Pirates'' stash exactly as carried.' using errcode = '22023'; end if;
    select coalesce(sum(size), 0) into crew_models from public.henchman_groups where warband_id = k.id and unit_type_rules_id = 'pirates_crew';
    select coalesce(sum(size), 0) into swabbie_models from public.henchman_groups where warband_id = k.id and unit_type_rules_id = 'pirates_swabbie';
    if swabbie_models + 1 > crew_models then raise exception 'A Pirate warband may never have more Swabbies than Crew (% Crew, % Swabbies already).', crew_models, swabbie_models using errcode = '22023'; end if;
  end if;

  -- The consent text ------------------------------------------------------------------------------
  contest_line := format('Pirates %s + %s + Ld %s%s = %s against %s %s + %s + Ld %s%s = %s', pirate_dice[1], pirate_dice[2], captain_ld, case when winner = 'pirates' then ' + 1 for winning' else '' end, pirate_total,
                         victim_name, victim_dice[1], victim_dice[2], victim_ld, case when winner = 'victim' then ' + 1 for winning' else '' end, victim_total);
  parts := array['Kidnapped!: ' || victim_name || ' (' || v.name || ')' || case when p_case.subject_kind = 'hero' then ' leaves his warband (retired)' else ' is carried aboard (recovery D6 ' || (p_case.recovery->>'d6') || ')' end, contest_line];
  if outcome = 'crew' then
    parts := parts || case when group_updated then format('joins %s''s Crew group "%s" (now %s models), armed exactly as his crewmates', k.name, group_name, existing.size + 1)
                           else format('joins %s as a new Crew model "%s" with the printed Crew profile%s', k.name, coalesce(group_name, victim_name), case when cardinality(kit_keys) > 0 then ', armed with ' || array_to_string(kit_keys, ', ') else ', unarmed' end) end;
    if moved > 0 then parts := parts || format('his %s old equipment item(s) are exchanged away and do not enter the stash', moved); end if;
  else
    parts := parts || format('becomes a Swabbie of %s%s keeping his own profile and skills [%s]; no experience, no magic', k.name, case when pirate_total = victim_total then ' (the contest was tied)' else '' end, array_to_string(victim_skills, ', '));
    if moved > 0 then parts := parts || format('surrenders %s to %s''s stash', (select string_agg(e.key || case when (e.value)::int > 1 then ' ×' || e.value else '' end, ', ' order by e.key) from jsonb_each_text(surrendered) e), k.name); end if;
    if p_case.subject_kind = 'henchman' and gained_total > 0 then parts := parts || format('%s item(s) from the fallen henchman go to the stash', gained_total); end if;
  end if;
  return left(array_to_string(parts, '. ') || '.', 1000);
end $$;
revoke all on function public.validate_kidnapped_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;

-- The 090 validator becomes the core branch; the entry point dispatches on the outcome kind.
alter function public.validate_captive_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) rename to validate_core_captive_proposal;
create function public.validate_captive_proposal(p_case public.captive_cases, p_choice jsonb, p_owner_changes jsonb, p_captor_changes jsonb, p_advances jsonb default '[]'::jsonb)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_choice) = 'object' and p_choice->>'kind' = 'kidnapped' then
    return public.validate_kidnapped_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
  end if;
  if p_case.subject_kind <> 'hero' then raise exception 'A lost henchman can only be resolved through Kidnapped!.' using errcode = '22023'; end if;
  return public.validate_core_captive_proposal(p_case, p_choice, p_owner_changes, p_captor_changes, coalesce(p_advances, '[]'::jsonb));
end $$;
revoke all on function public.validate_captive_proposal(public.captive_cases, jsonb, jsonb, jsonb, jsonb) from public;

-- ---------------------------------------------------------------------------------------------
-- allocate_kidnap_kit: when the report removed a lost group's kit unevenly, the victim's player (or
-- the GM) records what this fallen model actually carried, with a reason. Claims across the group's
-- lost models never exceed what the report removed from each row. Until recorded, the Pirates gain
-- no kit from him (see validate_kidnapped_proposal).
-- ---------------------------------------------------------------------------------------------
create function public.allocate_kidnap_kit(p_case_id uuid, p_items jsonb, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.captive_cases%rowtype; v_gm boolean; a jsonb; item jsonb; items jsonb := '[]'::jsonb; q int; claimed int; lost int; row_id text; allocated jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Explain how the fallen henchman''s kit was worked out.' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'items must be an array of {id, quantity}.' using errcode = '22023'; end if;
  select * into c from public.captive_cases where id = p_case_id;
  if not found then raise exception 'Captive case not found.' using errcode = 'P0002'; end if;
  perform public.lock_captive_context(c.match_id, c.victim_warband_id, c.captor_warband_id);
  select * into c from public.captive_cases where id = p_case_id for update;
  v_gm := public.is_campaign_gm(public.match_campaign(c.match_id));
  if not (v_gm or public.can_edit_warband(c.victim_warband_id)) then raise exception 'Only the fallen henchman''s player or the campaign GM records what he carried.' using errcode = '42501'; end if;
  if c.source <> 'pirates_kidnapped' or c.subject_kind <> 'henchman' then raise exception 'Only a lost henchman''s Kidnapped! case takes a kit allocation.' using errcode = 'P0001'; end if;
  if c.state <> 'open' then raise exception 'This opportunity is closed.' using errcode = 'P0001'; end if;
  if not coalesce((c.model_snapshot->>'kit_unresolved')::boolean, false) and not v_gm then raise exception 'His kit share is already recorded; ask the campaign GM to change it.' using errcode = 'P0001'; end if;
  for item in select x from jsonb_array_elements(coalesce(c.model_snapshot->'items', '[]'::jsonb)) x loop
    row_id := item->>'id'; lost := coalesce((item->>'lost')::int, 0);
    select coalesce((y->>'quantity')::int, 0) into q from jsonb_array_elements(p_items) y where y->>'id' = row_id limit 1;
    q := coalesce(q, 0);
    if q < 0 then raise exception 'Quantities must be zero or more.' using errcode = '22023'; end if;
    -- What the group's other lost models already account for from this row.
    select coalesce(sum((i->>'quantity')::int), 0) into claimed from public.captive_cases s, jsonb_array_elements(coalesce(s.model_snapshot->'items', '[]'::jsonb)) i
      where s.report_id = c.report_id and s.report_revision = c.report_revision and s.hero_id = c.hero_id and s.id <> c.id and s.state <> 'withdrawn' and i->>'id' = row_id and jsonb_typeof(i->'quantity') = 'number';
    if claimed + q > lost then raise exception 'The report removed only % of % from the group; the other lost models already account for %.', lost, coalesce(item->>'item_rules_id', item->>'custom_name'), claimed using errcode = '22023'; end if;
    items := items || (item || jsonb_build_object('quantity', q));
  end loop;
  for a in select x from jsonb_array_elements(p_items) x loop
    if not exists (select 1 from jsonb_array_elements(coalesce(c.model_snapshot->'items', '[]'::jsonb)) i where i->>'id' = a->>'id') then raise exception 'Item % was not carried by the group before this report.', a->>'id' using errcode = '22023'; end if;
  end loop;
  allocated := jsonb_build_object('by', auth.uid(), 'at', now(), 'reason', btrim(p_reason));
  update public.captive_cases set model_snapshot = c.model_snapshot || jsonb_build_object('items', items, 'kit_unresolved', false, 'allocation', allocated),
         history = history || jsonb_build_object('at', now(), 'by', auth.uid(), 'event', 'kit_allocated', 'reason', btrim(p_reason), 'items', p_items) where id = c.id;
  update public.captive_proposals set state = 'stale', resolved_at = now(), reason = 'The fallen henchman''s kit share was recorded: ' || btrim(p_reason) where case_id = c.id and state = 'proposed';
end $$;
revoke all on function public.allocate_kidnap_kit(uuid, jsonb, text) from public;
grant execute on function public.allocate_kidnap_kit(uuid, jsonb, text) to authenticated;
