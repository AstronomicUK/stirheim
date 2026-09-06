-- Phase 21: three more house-rule switches in campaigns.settings.houseRules. Existing rows read
-- through the app's zod defaults (false), so only the column default changes.
--   halfPriceShields, halfPriceHelmets: the half-price armour rule also covers shields / helmets
--   rewardsOfTheShadowlord: the rulebook's optional Rewards table for Possessed Magisters and Mutants

alter table public.campaigns alter column settings set default jsonb_build_object(
  'startingGold', 500,
  'maxRosters', null,
  'houseRules', jsonb_build_object(
    'strengthArmourPiercing', false,
    'optionalCriticalTables', true,
    'halfPriceArmour', true,
    'halfPriceShields', false,
    'halfPriceHelmets', false,
    'rabbitsFootBattleOnly', true,
    'rewardsOfTheShadowlord', false,
    'bans', jsonb_build_object('items', '[]'::jsonb, 'spells', '[]'::jsonb, 'hiredSwords', '[]'::jsonb, 'characters', '[]'::jsonb, 'skills', '[]'::jsonb)
  ),
  'dicePolicy', 'players_roll',
  'combatMode', 'app',
  'lockCombatMode', false,
  'reportApproval', false,
  'mapCampaign', false
);
