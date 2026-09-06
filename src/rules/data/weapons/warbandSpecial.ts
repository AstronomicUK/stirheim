// Engine entries for the warband-specific kit in data/items/warbandSpecial.ts, plus the attacks
// a piece of miscellaneous equipment grants (Sword-Gnoblar, Iron Shod Boots). Mechanical fields
// follow the conventions in ./melee.ts.

import type { Weapon } from "../../types";

export const WARBAND_SPECIAL_WEAPONS: Weapon[] = [
  { id: "beastwhip", name: "Beastwhip", type: "melee", strength: "user", critCategory: "bladed", concussion: false, cannotBeParried: true, chargeBonusAttacks: 1, special: ["whipcrackBonusAttack", "cruelBarbsGoading"], rangedProfile: null },
  { id: "boar_spear", name: "Boar Spear", type: "melee", strength: "user", strengthBonus: 1, critCategory: "thrusting", concussion: false, special: ["strikesFirstFirstTurn", "unwieldyOffHandOnly", "mountedChargeStrengthBonus", "crossGuardChargerMinus1Attack"], rangedProfile: null },
  { id: "chest_talon", name: "Chest Talon", type: "melee", strength: "user", strengthBonus: 1, critCategory: "thrusting", concussion: false, vsTraits: { traits: ["vampire"], toWound: 1 }, special: ["twoHanded", "heartPierceVsBloodThirster"], rangedProfile: null },
  // Swift: a two-handed sword that does not strike last.
  { id: "draich", name: "Draich", type: "melee", strength: "user", strengthBonus: 2, critCategory: "bladed", concussion: false, special: ["twoHanded"], rangedProfile: null },
  { id: "hedonist_whip", name: "Hedonist Whip", type: "melee", strength: "user", critCategory: "bladed", concussion: false, cannotBeParried: true, chargeBonusAttacks: 1, special: ["whipcrackBonusAttack"], rangedProfile: null },
  { id: "kanabo", name: "Kanabo", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bludgeoning", concussion: true, special: ["twoHanded"], rangedProfile: null },
  { id: "kusarigama", name: "Kusarigama", type: "melee", strength: "user", critCategory: "bladed", concussion: false, cannotBeParried: true, special: ["twoHanded"], rangedProfile: null },
  { id: "pry_bar", name: "Pry Bar", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: true, parry: true, special: [], rangedProfile: null },
  { id: "scythe", name: "Scythe", type: "melee", strength: "user", strengthBonus: 1, critCategory: "bladed", concussion: false, special: ["twoHanded"], rangedProfile: null },
  { id: "silver_tip_stake", name: "Silver-tip Stake", type: "melee", strength: "user", critCategory: "thrusting", concussion: false, vsTraits: { traits: ["vampire"], injury: 1 }, special: ["heartSeekerVsVampires"], rangedProfile: null },
  { id: "slaaneshi_man_catcher", name: "Slaaneshi Man-Catcher", type: "melee", strength: "user", strengthBonus: 1, critCategory: "thrusting", concussion: false, special: ["twoHanded", "lockKnocksDownAndCaptures"], rangedProfile: null },
  { id: "thingcatcher", name: "Thingcatcher", type: "melee", strength: "user", strengthBonus: 1, critCategory: "thrusting", concussion: false, special: ["twoHanded", "ironGripGoading"], rangedProfile: null },
  // Pair: the +1 Attack for two weapons is built in; Dance of Doom is the whipcrack bonus.
  { id: "whirling_blades", name: "Whirling Blades", type: "melee", strength: "user", critCategory: "bladed", concussion: false, cannotBeParried: true, saveModifier: 1, paired: true, chargeBonusAttacks: 1, special: ["cuttingEdge", "whipcrackBonusAttack", "whirlwindStrikeFirstWhenCharged"], rangedProfile: null },
  { id: "wizards_staff", name: "Wizard's Staff", type: "melee", strength: "user", critCategory: "bludgeoning", concussion: true, parry: true, special: ["twoHanded"], rangedProfile: null },

  // ---- Missile ----
  { id: "pebble", name: "Pebble", type: "ranged", strength: "user", critCategory: "missile", concussion: false, saveModifier: -1, special: ["thrownWeaponNoRangeOrMovingPenalty", "cannotBeUsedInCloseCombat", "doesNotCountAsMissileWeapon"], rangedProfile: { shortRange: 3, maxRange: 6, shotsPerTurn: 1 } },
  { id: "slingshot", name: "Slingshot", type: "ranged", strength: 2, critCategory: "missile", concussion: false, special: ["fireTwiceAtMinus1IfStationaryWithinHalfRange"], rangedProfile: { shortRange: 9, maxRange: 18, shotsPerTurn: 1 } },

  // ---- Attacks granted by miscellaneous kit ----
  { id: "stream_of_corruption", name: "Stream of Corruption", type: "ranged", strength: 3, critCategory: "missile", concussion: false, ignoresArmourSave: true, special: ["blessingOfNurgle"], rangedProfile: { shortRange: 6, maxRange: 6, shotsPerTurn: 1 } },
  { id: "sword_gnoblar_attack", name: "Sword-Gnoblar", type: "melee", strength: 2, critCategory: "bladed", concussion: false, maxAttacks: 1, special: ["extraAttackAtOwnersWs"], rangedProfile: null },
  { id: "iron_shod_boots_kick", name: "Iron Shod Boots (kick)", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, maxAttacks: 1, toHitBonus: -1, special: ["extraKickAttack"], rangedProfile: null },
];
