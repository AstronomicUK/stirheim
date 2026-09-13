-- A Human advancement maximum is not evidence that a model is a living human.
-- These printed units are explicitly Undead, Daemons, animals or a vehicle.
-- Preserve living Necromancers, Dregs, human mutants and human animal handlers.
-- Sources: the corresponding unit special rules in reference/rules/warbands/
-- core-and-grade-1a.md, grade-1c.md, grade-2a-part1.md,
-- grade-2a-part2.md and restless-dead-variant.md (and roster data).
-- Only future eligibility changes; existing cases/history are not rewritten.
delete from public.kidnap_eligible_units where unit_type_rules_id in (
 'undead_dire_wolves',
 'undead_zombies',
 'carnival_of_chaos_plague_bearers',
 'carnival_of_chaos_nurglings',
 'carnival_of_chaos_plague_cart',
 'lustrian_reavers_estalian_warhound',
 'lustrian_reavers_barbary_monkey',
 'lustrian_reavers_tilean_hunting_hawk',
 'merchant_trade_wagon',
 'restless_dead_zombies',
 'restless_dead_skeletons',
 'restless_dead_scarecrows',
 'masters_of_horror_zombies',
 'masters_of_horror_flesh_construct',
 'necrarchs_skeletal_warriors',
 'necrarchs_zombies',
 'necrarchs_abomination',
 'companion_filly',
 'restless_dead_variant_zombies',
 'restless_dead_variant_skeletons',
 'restless_dead_variant_bone_goliath'
);
