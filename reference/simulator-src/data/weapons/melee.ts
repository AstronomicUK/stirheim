// Melee weapon catalogue — converted from rules/02-weapons-armour-equipment.md, the
// "## Close-combat Weapons" section (mordheimer.net source), lines 20-751.
//
// id reuse: several ids below (dagger, sword, axe, dwarf_axe, hammer, mace, club, flail,
// spear, halberd, double_handed_sword, unarmed) intentionally match ids used by saved characters
// in browser localStorage — changing them would silently break existing saves. "unarmed" is the
// "Fist" entry; "double_handed_sword" is the generic "Double-handed Weapon" entry.
//
// Mechanical fields (all wired into engine/buildAttackInput.ts):
//   concussion              — the 2-4 = Stunned Injury remap. Per the source this is on Club, Mace,
//                             Hammer and "Club, Mace or Hammer" (identical rule text, 02:220/230/
//                             373/469), Sigmarite Warhammer (02:624), Dark Elf Blade "Wicked Edge"
//                             (02:251), Ogre Club (02:535), Tenderiser (02:725) and Bec de Corbin
//                             (02:89). Horseman's Hammer has NO such rule (02:388-397).
//   saveModifier            — positive = harder for the defender (Cutting Edge -1 on axes, Cleaver,
//                             Katar, Ogre Club); negative = easier (+1 enemy save on Dagger, Fist,
//                             Shortsword, Kitchen Knife, Misericordia, Main Gauche, daggers, Starblade,
//                             Rapier, Cat o' Nine Tails — and a 6+ save if the target has none).
//   ignoresArmourSave       — Ball and Chain, Claw of the Old Ones, Starsword (Ward still applies).
//   parry / cannotBeParried — Parry-granting weapons; whips can't be parried.
//   isSword                 — Expert Swordsman eligibility (03:381: normal swords, Weeping Blades;
//                             Dark Elf Blade is an upgraded sword, 02:245).
//   strengthBonusFirstTurnOnly — "Heavy" (Flail, Morning Star, Censer) and the Lance.
//   paired                  — sold as a pair, the +1 Attack for two weapons is built in.
//   maxAttacks              — Fist: only ever 1 attack (02:321). Pike (Tileans): 1 attack.
//   chargeBonusAttacks      — Whipcrack +1 A on the charge.
//   autoWoundOnNaturalSixToHit — Black-Lotus-style poison (Poison / Hobgoblin daggers, Weeping Blades).
//
// `special` slugs are informational tags for anything not covered by the fields above.
//
// Gromril Weapon and Ithilmar Weapon are material upgrades, not weapons — see ./materialVariants.ts.

import type { Weapon } from "../../types";

export const MELEE_WEAPONS: Weapon[] = [
  { id: "axe", name: "Axe", type: "melee", strength: "user", critCategory: "bladed", concussion: false, saveModifier: 1, special: ["cuttingEdge"], rangedProfile: null },
  { id: "ball_and_chain", name: "Ball and Chain", type: "melee", strength: "user", strengthBonus: 2, critCategory: "bludgeoning", concussion: false, ignoresArmourSave: true, special: ["multipleWoundsD3OnHit", "randomMovement", "cumbersomeNoOtherWeapons", "unwieldyPostBattleInjury"], rangedProfile: null },
  { id: "barbed_whip", name: "Barbed Whip", type: "melee", strength: "user", critCategory: "bladed", concussion: false, cannotBeParried: true, chargeBonusAttacks: 1, special: ["whipcrackBonusAttack", "enrageNearbyWarhounds"], rangedProfile: null },
  { id: "beastlash", name: "Beastlash", type: "melee", strength: "user", strengthBonus: -1, critCategory: "bladed", concussion: false, cannotBeParried: true, chargeBonusAttacks: 1, special: ["causesFearInAnimals", "whipcrackBonusAttack"], rangedProfile: null },
  { id: "bec_de_corbin", name: "Bec de Corbin", type: "melee", strength: "user", strengthBonus: 1, critCategory: "thrusting", concussion: true, special: ["twoHanded", "strikesFirstWhenCharged"], rangedProfile: null },
  { id: "boat_hook", name: "Boat Hook", type: "melee", strength: "user", strengthBonus: -1, critCategory: "thrusting", concussion: false, special: ["strikesFirstFirstTurn", "twoHanded"], rangedProfile: null },
  { id: "boss_pole", name: "Boss Pole", type: "melee", strength: "user", critCategory: "thrusting", concussion: false, special: ["actsAsSpear", "strikesFirstFirstTurn", "unwieldyOffHandOnly", "mountedChargeStrengthBonus", "ignoreAnimosityAura"], rangedProfile: null },
  { id: "brass_knuckles", name: "Brass Knuckles", type: "melee", strength: "user", strengthBonus: 1, critCategory: "unarmed", concussion: false, paired: true, special: ["cumbersomeInitiativePenalty"], rangedProfile: null },
  { id: "brazier_iron", name: "Brazier Iron", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bludgeoning", concussion: false, special: ["twoHanded", "setsTargetOnFire"], rangedProfile: null },
  { id: "broadsword", name: "Broadsword", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bladed", concussion: false, special: ["difficultToUseOffHand", "strikesLast"], rangedProfile: null },
  { id: "cat_o_nine_tails", name: "Cat o' Nine Tails", type: "melee", strength: "user", critCategory: "bladed", concussion: false, cannotBeParried: true, saveModifier: -1, chargeBonusAttacks: 1, special: ["whipcrackBonusAttack"], rangedProfile: null },
  { id: "cathayan_longsword", name: "Cathayan Longsword", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, isSword: true, saveModifier: 1, special: ["mastercraftedPlus1WsAndI", "cuttingEdge"], rangedProfile: null },
  { id: "censer", name: "Censer", type: "melee", strength: "user", strengthBonus: 2, strengthBonusFirstTurnOnly: true, critCategory: "bludgeoning", concussion: false, special: ["twoHanded", "toughnessTestOrAutoWound", "difficultToShootTarget"], rangedProfile: null },
  { id: "chain_sticks", name: "Chain Sticks", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: false, special: ["plus2AttacksFirstTurn", "twoHanded"], rangedProfile: null },
  { id: "claw_of_the_old_ones", name: "Claw of the Old Ones", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bladed", concussion: false, parry: true, ignoresArmourSave: true, special: [], rangedProfile: null },
  { id: "cleaver", name: "Cleaver", type: "melee", strength: "user", critCategory: "bladed", concussion: false, saveModifier: 1, special: [], rangedProfile: null },
  { id: "club", name: "Club", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: true, special: [], rangedProfile: null },
  { id: "club_mace_or_hammer", name: "Club, Mace or Hammer", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: true, special: ["genericBludgeonChoice"], rangedProfile: null },
  { id: "dagger", name: "Dagger", type: "melee", strength: "user", critCategory: "bladed", concussion: false, saveModifier: -1, special: [], rangedProfile: null },
  { id: "dark_elf_blade", name: "Dark Elf Blade", type: "melee", strength: "user", critCategory: "bladed", concussion: true, isSword: true, special: ["critTablePlus1", "upgradedSwordOrDagger"], rangedProfile: null },
  { id: "disease_dagger", name: "Disease Dagger", type: "melee", strength: "user", critCategory: "bladed", concussion: false, saveModifier: -1, special: ["infectsOnNatural6ToHit"], rangedProfile: null },
  // Generic "Double-handed Weapon" entry — flavour text says "double-handed axe or sword", so
  // grouped as bladed and mapped to the existing double_handed_sword id. Not a "sword" for Expert Swordsman (03:381).
  { id: "double_handed_sword", name: "Double-handed Weapon", type: "melee", strength: "user", strengthBonus: 2, critCategory: "bladed", concussion: false, special: ["twoHanded", "strikesLast"], rangedProfile: null },
  { id: "dragon_sword", name: "Dragon Sword", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bladed", concussion: false, parry: true, special: ["twoHanded"], rangedProfile: null },
  { id: "dwarf_axe", name: "Dwarf Axe", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, saveModifier: 1, special: ["cuttingEdge"], rangedProfile: null },
  { id: "fighting_claws", name: "Fighting Claws", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, paired: true, special: ["climbingPlus1Initiative", "cumbersomeNoOtherWeapons", "parryReroll"], rangedProfile: null },
  // "Fist" (unarmed combat) — reuses the existing "unarmed" id. Only ever 1 attack (02:321).
  { id: "unarmed", name: "Fist", type: "melee", strength: "user", strengthBonus: -1, critCategory: "unarmed", concussion: false, saveModifier: -1, maxAttacks: 1, special: [], rangedProfile: null },
  { id: "flail", name: "Flail", type: "melee", strength: "user", strengthBonus: 2, strengthBonusFirstTurnOnly: true, critCategory: "bludgeoning", concussion: false, special: ["twoHanded"], rangedProfile: null },
  { id: "great_axe", name: "Great Axe", type: "melee", strength: "user", strengthBonus: 2, critCategory: "bladed", concussion: false, saveModifier: 1, special: ["twoHanded", "strikesLast", "cuttingEdge"], rangedProfile: null },
  { id: "halberd", name: "Halberd", type: "melee", strength: "user", strengthBonus: 1, critCategory: "thrusting", concussion: false, special: ["twoHanded"], rangedProfile: null },
  { id: "hammer", name: "Hammer", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: true, special: [], rangedProfile: null },
  { id: "hobgoblin_poisoned_daggers", name: "Hobgoblin Poisoned Daggers", type: "melee", strength: "user", critCategory: "bladed", concussion: false, paired: true, saveModifier: -1, autoWoundOnNaturalSixToHit: true, poisoned: true, special: ["swiftPlus1Initiative", "permanentPoison"], rangedProfile: null },
  { id: "horsemans_hammer", name: "Horseman's Hammer", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bludgeoning", concussion: false, special: ["twoHanded", "mountedChargeStrengthBonus"], rangedProfile: null },
  { id: "iron_fist", name: "Iron Fist", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, parry: true, special: ["glovedNoOffhandWeapon", "dualRoleParryReroll"], rangedProfile: null },
  { id: "katar", name: "Katar", type: "melee", strength: "user", critCategory: "thrusting", concussion: false, saveModifier: 1, special: [], rangedProfile: null },
  { id: "kitchen_knife", name: "Kitchen Knife", type: "melee", strength: "user", critCategory: "bladed", concussion: false, saveModifier: -1, special: [], rangedProfile: null },
  { id: "ladle", name: "Ladle", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: false, special: ["noArmourSaveExceptShieldsOrSkills", "disarmOnNatural6"], rangedProfile: null },
  { id: "lance", name: "Lance", type: "melee", strength: "user", strengthBonus: 2, strengthBonusFirstTurnOnly: true, critCategory: "thrusting", concussion: false, special: ["strengthBonusOnlyWhenChargingMounted", "mountedOnly"], rangedProfile: null },
  { id: "mace", name: "Mace", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: true, special: [], rangedProfile: null },
  { id: "main_gauche", name: "Main Gauche", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, saveModifier: -1, special: [], rangedProfile: null },
  { id: "man_catcher", name: "Man-catcher", type: "melee", strength: "user", critCategory: "thrusting", concussion: false, special: ["capturesInsteadOfInjuryRoll", "twoHanded"], rangedProfile: null },
  { id: "misericordia", name: "Misericordia", type: "melee", strength: "user", critCategory: "bladed", concussion: false, saveModifier: -1, special: ["armourPiercingVsKnockedDown"], rangedProfile: null },
  { id: "morning_star", name: "Morning Star", type: "melee", strength: "user", strengthBonus: 1, strengthBonusFirstTurnOnly: true, critCategory: "bludgeoning", concussion: false, special: ["difficultToUseOffHand"], rangedProfile: null },
  { id: "obsidian_weapon", name: "Obsidian Weapon", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bladed", concussion: false, special: ["strikesLast", "restrictedRaces"], rangedProfile: null },
  // Ogre Club: Crushing Attack (-1 enemy save, +1 S for the parry check) applies when used two-handed — assumed here.
  { id: "ogre_club", name: "Ogre Club", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: true, saveModifier: 1, special: ["crushingAttackParryStrengthPlus1"], rangedProfile: null },
  { id: "pike_merchant_caravans", name: "Pike (Merchant Caravans)", type: "melee", strength: "user", critCategory: "thrusting", concussion: false, special: ["strikesFirstFirstTurn", "twoHanded"], rangedProfile: null },
  { id: "pike_tileans", name: "Pike (Tileans)", type: "melee", strength: "user", critCategory: "thrusting", concussion: false, maxAttacks: 1, special: ["strikesFirstFirstTurn", "reach3Inches", "largeCreaturesOnly"], rangedProfile: null },
  { id: "poison_daggers", name: "Poison Daggers", type: "melee", strength: "user", critCategory: "bladed", concussion: false, paired: true, saveModifier: -1, autoWoundOnNaturalSixToHit: true, poisoned: true, special: ["permanentPoison"], rangedProfile: null },
  { id: "quarter_staff", name: "Quarter Staff", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: false, parry: true, special: ["balancedPlus1Initiative", "freestyleNoOtherWeapon"], rangedProfile: null },
  { id: "rapier", name: "Rapier", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, saveModifier: -1, special: ["barrageExtraAttacksOnMiss"], rangedProfile: null },
  { id: "serpent_staff", name: "Serpent Staff", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: false, parry: true, special: ["alternativeStaffAttackWs4S4"], rangedProfile: null },
  { id: "shortsword", name: "Shortsword", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, saveModifier: -1, special: [], rangedProfile: null },
  { id: "sigmarite_warhammer", name: "Sigmarite Warhammer", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bludgeoning", concussion: true, special: ["holyBonusVsUndeadAndPossessed"], rangedProfile: null },
  { id: "sons_of_hashut_obsidian_weapon", name: "Sons of Hashut Obsidian Weapon", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bladed", concussion: false, special: ["restrictedToSwordAxeOrHammerForm", "minus1Initiative"], rangedProfile: null },
  { id: "spear", name: "Spear", type: "melee", strength: "user", critCategory: "thrusting", concussion: false, special: ["strikesFirstFirstTurn", "unwieldyOffHandOnly", "mountedChargeStrengthBonus"], rangedProfile: null },
  { id: "spiked_gauntlet", name: "Spiked Gauntlet", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, parry: true, special: ["countsAsHandWeaponAndBuckler"], rangedProfile: null },
  { id: "starblade", name: "Starblade", type: "melee", strength: "user", critCategory: "bladed", concussion: false, saveModifier: -1, special: ["potentialParryOn4Plus"], rangedProfile: null },
  { id: "starsword", name: "Starsword", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bladed", concussion: false, parry: true, ignoresArmourSave: true, special: ["ignoresArmourExceptWardAndDodge"], rangedProfile: null },
  { id: "steel_whip", name: "Steel Whip", type: "melee", strength: "user", critCategory: "bladed", concussion: false, cannotBeParried: true, chargeBonusAttacks: 1, special: ["whipcrackBonusAttack"], rangedProfile: null },
  { id: "sword", name: "Sword", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, isSword: true, special: [], rangedProfile: null },
  { id: "sword_breaker", name: "Sword Breaker", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, special: ["breaksOpponentWeaponOnParry4Plus"], rangedProfile: null },
  { id: "tenderiser", name: "Tenderiser", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: true, special: [], rangedProfile: null },
  { id: "trident", name: "Trident", type: "melee", strength: "user", critCategory: "thrusting", concussion: false, parry: true, special: ["strikesFirstWhenCharged"], rangedProfile: null },
  { id: "weeping_blades", name: "Weeping Blades", type: "melee", strength: "user", critCategory: "bladed", concussion: false, parry: true, isSword: true, paired: true, autoWoundOnNaturalSixToHit: true, poisoned: true, special: ["permanentPoison"], rangedProfile: null },
];
