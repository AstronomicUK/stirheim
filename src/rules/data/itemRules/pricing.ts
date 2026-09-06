// Prices and rarities that depend on who is buying (audit A2). The catalogue keeps one listed
// price and rarity per item; these rules replace them for the named warbands or buyers. Rules are
// tried in order and the first match wins.

import type { ItemPricing } from "./types";

export const ITEM_PRICING: Record<string, ItemPricing> = {
  blowpipe: {
    rules: [{ when: { warbands: ["forestGoblins"] }, rarity: "common", note: "Common for Forest Goblins." }],
  },
  black_lotus: {
    rules: [
      { when: { units: ["lizardmen_skink_priest", "lizardmen_skink_great_crest"] }, price: 10, rarity: "common", note: "10 gc and Common for Skink Heroes." },
      { when: { warbands: ["skaven", "lizardmen"] }, rarity: 7, note: "Rare 7 for Skaven and Lizardmen." },
    ],
  },
  dark_venom: {
    rules: [
      { when: { units: ["lizardmen_skink_priest", "lizardmen_skink_great_crest"] }, price: 20, rarity: "common", note: "20 gc and Common for Skink Heroes." },
      { when: { warbands: ["darkElves", "lizardmen"] }, rarity: 6, note: "Rare 6 for Dark Elves and Lizardmen." },
    ],
  },
  holy_unholy_relic: {
    rules: [{ when: { warbands: ["priests"] }, rarity: 6, note: "Rare 6 for Warrior-Priests and Sisters of Sigmar." }],
  },
  blessed_water: {
    rules: [{ when: { warbands: ["priests"] }, rarity: "common", note: "Common for Warrior-Priests and Sisters of Sigmar." }],
  },
  mad_cap_mushrooms: {
    rules: [{ when: { warbands: ["goblins", "orcsAndGoblins"] }, rarity: "common", note: "Common if the warband includes Goblins." }],
  },
  healing_herbs: {
    rules: [{ when: { warbands: ["amazonsLustria"] }, rarity: "common", note: "Common for Amazons (Lustria)." }],
  },
  amulet_of_the_moon: {
    rules: [{ when: { warbands: ["amazonsLustria"] }, rarity: 11, note: "Rare 11 for Amazons (Lustria)." }],
  },
  light_armour: {
    rules: [{ when: { warbands: ["lizardmen"] }, price: 50, note: "Lizardmen pay 50 gc for light armour (scaled hides are hard to fit)." }],
  },
  handgun: {
    rules: [{ when: { warbands: ["gunnerySchool"] }, price: 30, note: "The Gunnery School buys its black powder weapons at a discount." }],
  },
  pistol: {
    rules: [{ when: { warbands: ["gunnerySchool"] }, price: 12, note: "The Gunnery School buys its black powder weapons at a discount." }],
  },
  duelling_pistol: {
    rules: [{ when: { warbands: ["gunnerySchool"] }, price: 25, note: "The Gunnery School buys its black powder weapons at a discount." }],
  },
  hunting_rifle: {
    rules: [{ when: { warbands: ["gunnerySchool"] }, price: 160, note: "The Gunnery School buys its black powder weapons at a discount." }],
  },
  blunderbuss: {
    rules: [{ when: { warbands: ["gunnerySchool"] }, price: 25, note: "The Gunnery School buys its black powder weapons at a discount." }],
  },
  chaos_armour: { dynamic: "chaosArmour" },
  mechanical_suit: { dynamic: "chaosArmour" },
  rhinox: { dynamic: "rhinox" },
  familiar: { dynamic: "familiar", paidOnFailure: true },
  wolfcloak: { dynamic: "strengthHunt", strengthHuntFreeAtCreationFor: ["middenheimers"] },
  bearcloak: { dynamic: "strengthHunt", strengthHuntFreeAtCreationFor: ["mazzalupo"] },
  opulent_coach: { warbandRareRollBonus: 3 },
};
