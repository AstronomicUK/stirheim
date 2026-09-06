// What kit does on the table (audit A3, A4, A6, A10, A12). Read by the fight calculator's loadout
// mapping (features/match/fight/combatants.ts), the rout check and the post-battle consumable
// bookkeeping. Anything with a real rules effect the engine can carry is here; tabletop-only
// effects (fire, entangling, smoke) stay as notes.

import type { ItemEffect } from "./types";

const UNDEAD_AND_POSSESSED = ["undead", "possessed"];

export const ITEM_EFFECTS: Record<string, ItemEffect> = {
  // ---- Traits ----
  bear_claw_necklace: { traits: ["frenzy"], note: "Bear-Claw Necklace: subject to Frenzy." },
  red_toof_tribal_jewellery: { traits: ["frenzy"], note: "Red Toof Tribal Jewellery: subject to Frenzy." },
  hammer_of_witches: { traits: ["hatred"], note: "Hammer of Witches: hates Possessed, Skaven, Beastmen, Chaos, Daemons, Dark Elves, Orcs and Goblins and the Sisters of Sigmar." },
  venom_ring: { traits: ["immune_to_poison"], note: "Venom Ring: immune to all poisons." },
  lookout_gnoblar: { skills: ["dodge"], note: "Lookout-Gnoblar: the Ogre has Dodge." },
  luck_gnoblar: { note: "Luck-Gnoblar: one re-roll during the battle." },

  // ---- Saves and being hit ----
  amulet_of_the_moon: { missileWardSave: 5, toBeHit: { missile: -1 }, note: "Amulet of the Moon: -1 to be hit by missiles and a 5+ special save against them." },
  elven_cloak: { toBeHit: { missile: -1 }, note: "Elven Cloak: -1 to be hit by missiles." },
  forest_cloak: { toBeHit: { missile: -1 }, note: "Forest Cloak: -1 to be hit by missiles while beside a tree, bush or hedge (assumed)." },
  sea_dragon_cloak: { ownSave: { melee: 5, missile: 4 }, note: "Sea Dragon Cloak: 5+ save in close combat, 4+ against missiles; taken as the cloak's own save, not added to armour." },
  wolfcloak: { saveBonus: { missile: 1, savesFromNothing: true }, note: "Wolfcloak: +1 to armour saves against shooting." },
  bearcloak: { saveBonus: { missile: 1, savesFromNothing: true }, note: "Bearcloak: +1 to armour saves against shooting." },
  horo: { saveBonus: { missile: 1, savesFromNothing: true, note: "only while mounted" }, note: "Horo: +1 to armour saves against ranged weapons while mounted (6+ from nothing)." },
  cathayan_quilted_silk_armour: { saveBonus: { melee: 1, missile: 1, savesFromNothing: true }, note: "Cathayan Quilted Silk Armour: +1 to armour saves against any attack, combined with any armour." },
  shield_of_sigmar: { missileWardSave: 6, note: "Shield of Sigmar: a 6+ special save against all ranged attacks." },
  peg_leg: { afterSave: 6, note: "Peg Leg: an unmodified 6+ save after any failed save, even when no save is normally allowed." },
  lucky_charm: { firstHitDiscard: 4, note: "Lucky Charm: the first hit of the battle is discarded on a 4+." },
  enchanted_skins: { wardSave: 6, note: "Enchanted Skins: 6+ special save against every wound; unaffected by enemy magic on a 5+." },
  temple_dog: { note: "Temple Dog: unmodifiable 5+ save; fights as a mount (not modelled)." },

  // ---- Extra attacks ----
  hook_hand: { extraWeaponId: "dagger", note: "Hook Hand: counts as a dagger in that hand; no two-handed weapons." },
  sword_gnoblar: { extraWeaponId: "sword_gnoblar_attack", note: "Sword-Gnoblar: one extra Strength 2 attack at the Ogre's Weapon Skill." },
  iron_shod_boots: { extraWeaponId: "iron_shod_boots_kick", note: "Iron Shod Boots: an extra kick attack each turn at -1 to hit." },

  // ---- Leadership (rout check) ----
  holy_unholy_relic: { leadership: { autoPassFirstTest: true, note: "Holy Relic: the first Leadership test of the game is passed automatically (the first Rout test, if the leader carries it and has tested for nothing else)." } },
  war_horn: { leadership: { bonus: 1, note: "War Horn: +1 Leadership for one turn, once per battle; may be sounded just before a Rout test." }, consumable: "use" },
  war_horn_of_nagarythe: { leadership: { bonus: 1, note: "War Horn of Nagarythe: as a War Horn." }, consumable: "use" },
  vodka: { leadership: { bonus: 1, note: "Vodka: +1 Leadership for every warrior this game (maximum 10); each warrior tests Toughness before the game or is at -1 Initiative." }, consumable: "battle" },
  banner: { leadership: { allAloneReroll: true, note: "Banner: friends within 12\" re-roll failed All Alone tests." } },
  clan_pestilens_banner: { leadership: { allAloneReroll: true, note: "Clan Pestilens Banner: friends within 12\" re-roll failed All Alone tests." } },
  jolly_roger: { leadership: { note: "Jolly Roger: Pirates within 12\" never count as all alone." } },
  standard_of_nagarythe: { leadership: { note: "Standard of Nagarythe: Shadow Warriors within 12\" re-roll failed Leadership tests." } },
  sashimono: { leadership: { note: "Sashimono: re-roll non-rout Leadership tests, keeping the second roll." } },
  bugmans_ale: { traits: ["immune_to_fear"], consumable: "battle", preBattle: { label: "Drunk before the battle", appliesTo: "self", traits: ["immune_to_fear"], note: "The whole warband is immune to fear this battle." } },
  elven_wine: { traits: ["immune_to_fear"], consumable: "battle", preBattle: { label: "Drunk before the battle", appliesTo: "self", traits: ["immune_to_fear"], note: "The warband is immune to fear this battle." } },

  // ---- Poisons and coatings (used up per battle) ----
  dark_venom: { consumable: "battle", preBattle: { label: "Weapon coated with Dark Venom", appliesTo: "allWeapons", strengthBonus: 1 } },
  black_lotus: { consumable: "battle", preBattle: { label: "Weapon coated with Black Lotus", appliesTo: "allWeapons", autoWoundOnSixToHit: true } },
  spider_spittle: { consumable: "battle", preBattle: { label: "Weapon laced with Spider Spittle", appliesTo: "allWeapons", note: "A warrior hit must pass a Toughness test or is paralysed (table rule)." } },
  manticore_spoor: { consumable: "battle", preBattle: { label: "Weapon smeared with Manticore Spoor", appliesTo: "allWeapons", note: "A wounded model rolls a D6 each turn: 1 loses a wound, 6 ends the poison (table rule)." } },
  reptile_venom: { consumable: "battle", preBattle: { label: "Reptile Venom on the missile weapon", appliesTo: "ranged", strengthBonus: 1, strengthBonusNoSaveModifier: true } },
  poisoned_weapon: { preBattle: { label: "Forest Goblin poison (permanent)", appliesTo: "allWeapons", injuryRollBonus: 1 }, note: "Poisoned Weapon: +1 to injury rolls with the poisoned weapon." },
  hunting_arrows: { preBattle: { label: "Shooting Hunting Arrows", appliesTo: "bows", injuryRollBonus: 1 } },
  asp_arrows: { preBattle: { label: "Shooting Asp Arrows", appliesTo: "bows", toHitBonus: 1 } },
  fire_arrows: { consumable: "battle", preBattle: { label: "Shooting Fire Arrows", appliesTo: "bows", note: "A hit sets the target alight on a 4+ (table rule)." } },
  superior_blackpowder: { consumable: "battle", preBattle: { label: "Loaded with Superior Blackpowder", appliesTo: "blackpowder", strengthBonus: 1 } },

  // ---- Drugs (used up per battle) ----
  mandrake_root: { consumable: "battle", preBattle: { label: "Took Mandrake Root", appliesTo: "self", toughnessBonus: 1, stunnedBecomesKnockedDown: true, noEffectOn: UNDEAD_AND_POSSESSED, note: "After the battle roll 2D6: on 2-3 the model loses a point of Toughness for good." } },
  crimson_shade: { consumable: "battle", preBattle: { label: "Took Crimson Shade", appliesTo: "self", strengthBonus: 1, noEffectOn: UNDEAD_AND_POSSESSED, note: "+D3 Initiative and +1 Movement as well. After the battle roll 2D6: 2-3 addicted, 12 permanent +1 Initiative." } },
  mad_cap_mushrooms: { consumable: "battle", preBattle: { label: "Ate Mad Cap Mushrooms", appliesTo: "self", traits: ["frenzy"], noEffectOn: UNDEAD_AND_POSSESSED, note: "After the battle roll a D6: on a 1 the model becomes permanently stupid." } },
  hardtack_biscuits: { consumable: "use", preBattle: { label: "Eating Hardtack this turn", appliesTo: "self", toughnessBonus: 1, note: "+1 Toughness for this turn and the enemy's; on a 1 afterwards the pirate misses the next game." } },
  tears_of_shallaya: { consumable: "battle", preBattle: { label: "Drank the Tears of Shallaya", appliesTo: "self", traits: ["immune_to_poison"] } },
  healing_herbs: { consumable: "use", note: "Healing Herbs: restore all wounds lost, once, outside combat." },

  // ---- Other consumables ----
  garlic: { consumable: "battle", note: "Garlic: a Vampire must pass a Leadership test to charge the bearer." },
  blessed_water: { consumable: "use", note: "Blessed Water: thrown, one automatic wound on Undead, Daemons or Possessed, no armour save." },
  caltrops: { consumable: "use" },
  flash_powder: { consumable: "use" },
  firecrackers: { consumable: "use" },
  smoke_bomb: { consumable: "use" },
  fire_bomb: { consumable: "use" },
  cathayan_candles: { consumable: "battle" },
  torch: { consumable: "battle" },
  victuals: { consumable: "use" },

  // ---- Fire modes (audit A10) ----
  repeater_crossbow: { altFire: { label: "Single shot", shots: 1, toHitPenalty: 0, hint: "One shot with no penalty instead of two at -1." } },
  repeater_handgun: { altFire: { label: "Single shot", shots: 1, toHitPenalty: 0, hint: "One shot with no penalty instead of three at -1." } },
  repeater_pistol: { altFire: { label: "Single shot", shots: 1, toHitPenalty: 0, hint: "One shot with no penalty instead of three at -1." } },
  sling: { altFire: { label: "Two shots at half range", shots: 2, toHitPenalty: 1, hint: "Standing still and within 9\": fire twice, both at -1 to hit." } },
  slingshot: { altFire: { label: "Two shots at half range", shots: 2, toHitPenalty: 1, hint: "Standing still and within 9\": fire twice, both at -1 to hit." } },

  // ---- Weapon upgrades applied to a base weapon (the base is written on the item's note) ----
  dark_elf_blade: {
    upgrade: { bases: ["sword", "dagger"], apply: { concussion: true, critTableRollModifier: 1 }, namePrefix: "Dark Elf", note: "A Dark Elf Blade is a sword or dagger upgrade: the base weapon keeps its rules, gains Concussion and +1 on the critical chart." },
  },
  darksteel_blade: {
    upgrade: { bases: "anyMelee", apply: { concussion: true, critTableRollModifier: 1 }, namePrefix: "Darksteel", note: "A Darksteel Blade is an upgrade to a hand weapon: the base keeps its rules, gains Concussion and +1 on the critical chart." },
  },
  sons_of_hashut_obsidian_weapon: {
    upgrade: { bases: ["sword", "axe", "hammer"], apply: { strengthBonus: 1, initiativeModifier: -1 }, namePrefix: "Obsidian", note: "Sons of Hashut obsidian: a sword, axe or hammer keeping its own rules, at +1 Strength and -1 Initiative." },
  },

  // ---- Blessings of Nurgle ----
  nurgles_rot: { traits: ["immune_to_poison"], note: "Nurgle's Rot: a 6 to wound in close combat infects a living target with the Rot (mark it on their roster); immune to poison." },
  mark_of_nurgle: { traits: ["immune_to_poison"], note: "Mark of Nurgle: immune to poison (+1 Wound on the profile)." },
  cloud_of_flies: { toBeHit: { melee: -1 }, note: "Cloud of Flies: close combat opponents are at -1 to hit." },
  hideous: { traits: ["causes_fear"], note: "Hideous: causes Fear." },
  bloated_foulness: { note: "Bloated Foulness: +1 Wound and +1 Toughness, -1 Movement, on the profile." },
  stream_of_corruption: { extraWeaponId: "stream_of_corruption", note: "Stream of Corruption: a 6\" Strength 3 shooting attack with no armour save." },

  // ---- Notes only ----
  swivel_gun: { note: "Swivel Gun: pick the shot type on the calculator; every shot type is a separate one-battle supply." },
};
