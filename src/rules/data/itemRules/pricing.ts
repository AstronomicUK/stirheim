// Prices and rarities that depend on who is buying (audit A2). The catalogue keeps one listed
// price and rarity per item; these rules replace them for the named warbands or buyers. Rules are
// tried in order and the first match wins.

import type { ItemPricing, PriceRule } from "./types";

// Impeccable Care retains these printed starting-list gun prices after recruitment.
const nulnPrice = (price: number, bracePrice?: number): PriceRule => ({ when: { warbands: ["gunnerySchool"] }, price, priceDice: null, ...(bracePrice !== undefined ? { bracePrice } : {}), note: "Impeccable Care: the Gunnery School always uses its printed equipment-list gun prices." });

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
  handgun: { rules: [nulnPrice(25)] },
  pistol: { rules: [nulnPrice(10, 20)] },
  duelling_pistol: { rules: [nulnPrice(20, 35)] },
  hunting_rifle: { rules: [nulnPrice(100)] },
  blunderbuss: { rules: [nulnPrice(20)] },
  double_barrelled_pistol: { rules: [nulnPrice(20, 35)] },
  double_barrelled_duelling_pistol: { rules: [nulnPrice(35, 65)] },
  double_barrelled_handgun: { rules: [nulnPrice(45)] },
  repeater_pistol: { rules: [nulnPrice(25)] },
  repeater_handgun: { rules: [nulnPrice(50)] },
  hand_held_mortar: { rules: [nulnPrice(70)] },
  hersten_wenkler_pigeon_bombs: { rules: [nulnPrice(25)] },
  chaos_armour: { dynamic: "chaosArmour" },
  mechanical_suit: { dynamic: "chaosArmour" },
  rhinox: { dynamic: "rhinox" },
  familiar: { dynamic: "familiar", paidOnFailure: true },
  wolfcloak: { dynamic: "strengthHunt", strengthHuntFreeAtCreationFor: ["middenheimers"] },
  bearcloak: { dynamic: "strengthHunt", strengthHuntFreeAtCreationFor: ["mazzalupo"] },
  opulent_coach: { warbandRareRollBonus: 3 },
};
