// Who may buy or carry what (audit A1), plus the handful of items that cannot be moved or sold
// (A13, C). Anything not listed here follows the defaults in ./index.ts: miscellaneous equipment is
// Heroes only, everything else is open. The shop and the roster show these as warnings a player
// may override with a reason; nothing here stops a purchase outright.
//
// Sources: rules/02-weapons-armour-equipment.md (restriction text on each entry) and the rulebook's
// Trading section ("Heroes only" for miscellaneous equipment; the two hand weapons and two missile
// weapons a warrior may carry).

import type { ItemRestriction } from "./types";

export const BOWS = ["bow", "short_bow", "longbow", "elf_bow"];

export const ITEM_RESTRICTIONS: Record<string, ItemRestriction> = {
  // ---- Miscellaneous equipment henchmen may use ----
  rain_coat: { heroesOnly: false, note: "An exception to the Heroes-only rule: henchmen may carry Rain Coats." },
  winter_furs: { heroesOnly: false, notWarbands: ["beastmen"], note: "Henchmen may wear Winter Furs; Beastmen may not." },
  reptile_venom: { heroesOnly: false, onlyUnits: ["lizardmen_skink_brave"], note: "Skink henchmen only, one per missile weapon." },
  toughened_leathers: { heroesOnly: false, noShield: true, unsellable: true, note: "Cannot be combined with a shield and cannot be sold back." },
  hunting_arrows: { requiresAnyOf: { itemIds: BOWS, label: "a bow" }, countsAsMissile: false, note: "Arrows are only any use with a Short Bow, Bow, Long Bow or Elf Bow." },
  asp_arrows: { requiresAnyOf: { itemIds: BOWS, label: "a bow" }, onlyUnits: ["tomb_guardians_tomb_lord"], countsAsMissile: false, note: "Tomb Lord only; needs a bow." },
  fire_arrows: { requiresAnyOf: { itemIds: BOWS, label: "a bow" }, countsAsMissile: false },

  // ---- One per warband, once per campaign, creation only ----
  swivel_gun: { onePerWarband: true, onlyUnits: ["pirates_gunner"], heroesOnly: false, note: "Pirate Gunners only; a warband may have only one Swivel Gun." },
  clan_pestilens_banner: { onePerWarband: true, onlyWarbands: ["clanPestilens"], note: "A warband may have a single Clan Pestilens banner." },
  liber_bubonicus: { oncePerCampaign: true, onePerWarband: true, onlyWarbands: ["clanPestilens"], note: "Once per campaign; Clan Pestilens only." },
  standard_of_nagarythe: { creationOnly: true, onePerWarband: true, onlyWarbands: ["shadowWarriors"], note: "May only be bought when the warband is created." },
  trade_wagon: { onePerWarband: true, onlyWarbands: ["merchants"], heroesOnly: false },
  halfling_cookbook: { onePerWarband: true, notWarbands: ["undead", "carnival_of_chaos"], note: "Undead and the Carnival of Chaos may not use it; a second book adds nothing." },
  peg_leg: { onePerModel: true, onlyWarbands: ["pirates"], fused: true, unsellable: true, note: "Pirates only, one per model; a peg leg is not passed around." },
  hook_hand: { onePerModel: true, onlyWarbands: ["pirates"], fused: true, unsellable: true, note: "Pirates only; the wearer cannot use two-handed weapons." },

  // ---- Fused to the buyer ----
  chaos_armour: { fused: true, note: "Chaos armour fuses to the body of its wearer and can never be removed or given away." },
  mechanical_suit: { fused: true, onlyWarbands: ["chaosDwarfs"], note: "Chaos Dwarfs only; fused to the wearer like Chaos armour." },
  red_toof_tribal_jewellery: { fused: true, onlyWarbands: ["forestGoblins"], note: "Forest Goblins only; cannot be removed." },
  poisoned_weapon: { fused: true, unsellable: true, onlyWarbands: ["forestGoblins"], note: "Applied to one weapon for good; may not be traded or sold." },

  // ---- Race and creed ----
  obsidian_weapon: {
    onlyWarbands: ["marauders", "norse", "beastmen", "chaosDwarfs", "possessed"],
    notWarbands: ["dwarfs", "elves", "sistersOfSigmar", "witchHunters", "priests"],
    note: "Blemished: never used by Dwarfs, Elves, Sisters of Sigmar, Witch Hunters or Priests.",
  },
  sons_of_hashut_obsidian_weapon: { onlyWarbands: ["chaosDwarfs"] },
  bugmans_ale: { heroesOnly: false, notWarbands: ["elves"], note: "Elves may not drink Bugman's Ale." },
  elven_wine: { heroesOnly: false, onlyWarbands: ["shadowWarriors"] },
  garlic: { notWarbands: ["undead"], note: "May not be bought by Undead." },
  blessed_water: { notWarbands: ["undead", "possessed"], note: "Undead or Possessed models may not use blessed water." },
  tears_of_shallaya: { notWarbands: ["undead", "possessed"], note: "Undead and Possessed warriors may not use the Tears." },
  tarot_cards: { notWarbands: ["witchHunters", "sistersOfSigmar"] },
  dark_venom: { notWarbands: ["witchHunters", "priests", "sistersOfSigmar"] },
  black_lotus: { notWarbands: ["witchHunters", "priests", "sistersOfSigmar"] },
  holy_unholy_relic: {},
  hammer_of_witches: { onlyWarbands: ["witchHunters"] },
  sea_dragon_cloak: { onlyWarbands: ["darkElves"] },
  dark_elf_blade: { onlyWarbands: ["darkElves"] },
  wolfcloak: { onlyWarbands: ["middenheimers", "norse", "marauders"] },
  bear_claw_necklace: { onlyWarbands: ["kislevites"] },
  vodka: { onlyWarbands: ["kislevites"] },
  amulet_of_the_moon: { onlyWarbands: ["amazons"] },
  enchanted_skins: { onlyWarbands: ["amazonsLustria"] },
  starblade: { onlyWarbands: ["amazonsLustria"] },
  jolly_roger: { onlyWarbands: ["pirates"] },
  hardtack_biscuits: { onlyWarbands: ["pirates"] },
  cooking_pot_helmet: { onlyWarbands: ["mootlanders"], onlyUnits: ["mootlanders_master_chef"], heroesOnly: false, note: "The Master Chef's helmet." },
  ladle: { onlyWarbands: ["mootlanders"], onlyUnits: ["mootlanders_master_chef"], heroesOnly: false },
  ogre_club: { onlyWarbands: ["maneaters"], heroesOnly: false },
  lookout_gnoblar: { onlyWarbands: ["maneaters"] },
  luck_gnoblar: { onlyWarbands: ["maneaters"] },
  sword_gnoblar: { onlyWarbands: ["maneaters"] },
  sigmarite_warhammer: { onlyWarbands: ["sistersOfSigmar"], heroesOnly: false, note: "Only Matriarchs and Sister Superiors may carry two." },
  steel_whip: { onlyWarbands: ["sistersOfSigmar", "chaosDwarfs"], heroesOnly: false },
  war_horn_of_nagarythe: { onlyWarbands: ["shadowWarriors"] },
  ball_and_chain: { onlyWarbands: ["goblins", "orcsAndGoblins"], heroesOnly: false, requiresAnyOf: { itemIds: ["mad_cap_mushrooms"], label: "Mad Cap Mushrooms" }, note: "Only a model under the influence of Mad Cap Mushrooms can wield it; nothing else may be carried." },
  quarter_staff: { onlyWarbands: ["cathayans"], heroesOnly: false },
  chain_sticks: { onlyWarbands: ["cathayans"], heroesOnly: false },
  misericordia: { onlyWarbands: ["lustrianReavers", "cursedCavalcade"], heroesOnly: false },
  trade_wagon_reputation: {},

  // ---- Weapons whose kit rule makes them Heroes-only in the lists ----
  forest_cloak: { onlyWarbands: ["outlaws"] },
  war_horn: {},
  banner: {},
};
