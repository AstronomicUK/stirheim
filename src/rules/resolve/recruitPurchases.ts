// Purchases made at recruitment (Phase 17, warband audit A17): mutations for the Possessed, Mutants,
// Court heroes, Marauder Mutants and Clan Moulder Rat Ogres; Blessings of Nurgle for Tainted Ones.
// The rules for both say the first is bought at the listed price and second and subsequent ones on
// the same model cost double, and that none may be bought after recruitment.

import { findItem } from "../data/items";
import { ITEM_RESTRICTIONS, warbandInAny } from "../data/itemRules";
import type { Item } from "../types/items";

/** Items a warrior of this unit type may buy when hired, in catalogue order. */
export function recruitPurchaseOptions(warbandTemplateId: string, unitTemplateId: string): Item[] {
  if (warbandTemplateId === "marauders_of_chaos") return []; // Mutant is earned as a skill, not granted to fresh recruits.
  const out: Item[] = [];
  for (const [id, rule] of Object.entries(ITEM_RESTRICTIONS)) {
    if (!rule.recruitOnly) continue;
    if (rule.onlyWarbands && !warbandInAny(warbandTemplateId, rule.onlyWarbands)) continue;
    if (rule.onlyUnits && !rule.onlyUnits.includes(unitTemplateId)) continue;
    const item = findItem(id);
    if (item) out.push(item);
  }
  return out;
}

/** What the nth (0-based) recruit-time purchase for one model costs: the listed price, then double. */
export function recruitPurchasePrice(item: Item, index: number): number {
  const base = item.price.base ?? 0;
  return index === 0 ? base : base * 2;
}

/** Total for a set of purchases on one model, highest listed price first so the doubling costs the least. */
export function recruitPurchasesTotal(items: readonly Item[]): { total: number; lines: { item: Item; price: number }[] } {
  const sorted = [...items].sort((a, b) => (b.price.base ?? 0) - (a.price.base ?? 0));
  const lines = sorted.map((item, i) => ({ item, price: recruitPurchasePrice(item, i) }));
  return { total: lines.reduce((n, l) => n + l.price, 0), lines };
}

/** Recruitment clauses, separate from the advancement-only Mutant and Twistkin skills. */
export function recruitGiftLimit(unitId: string): { min: number; max: number | null } {
  if (unitId === 'rat_ogres') return { min: 1, max: 1 };
  if (unitId.startsWith('court_of_pleasures_')) return { min: 0, max: 1 };
  return { min: ['cult_of_the_possessed_mutants', 'carnival_of_chaos_tainted_ones'].includes(unitId) ? 1 : 0, max: null };
}

export function recruitGiftProblem(warbandId: string, unitId: string, ids: readonly string[]): string | undefined {
  const options = recruitPurchaseOptions(warbandId, unitId);
  if (ids.some(id => !options.some(item => item.id === id))) return 'A selected mutation or Blessing is unavailable to this recruit.';
  const { min, max } = recruitGiftLimit(unitId);
  if (ids.length < min) return 'Choose the mandatory mutation or Blessing before recruiting this warrior.';
  if (max !== null && ids.length > max) return `This warrior may buy ${max} mutation at recruitment.`;
}

export function recruitGiftItems(ids: readonly string[] = []): Item[] {
  return ids.map(id => findItem(id)).filter((item): item is Item => !!item);
}

/** Apply permanent profile gifts once, when acquired. Equipment effects do not apply these again. */
export function giftStats(stats: import('../types').Stats, ids: readonly string[] = []): import('../types').Stats {
  const next = { ...stats };
  for (const id of ids) {
    if (id === 'cloven_hoofs') next.M += 1;
    if (id === 'mark_of_nurgle') next.W += 1;
    if (id === 'bloated_foulness') { next.M = Math.max(1, next.M - 1); next.T += 1; next.W += 1; }
  }
  return next;
}
export function giftEquipment(ids: readonly string[] = [], models = 1): import('../types/roster').RosterItem[] {
  return [...new Set(ids)].map(itemId => ({ itemId, quantity: ids.filter(id => id === itemId).length * models }));
}

export const MARAUDER_MUTANT = 'marauders_of_chaos_skills_mutant';
export const TWISTKIN = 'skaven_of_clan_moulder_special_skills_twistkin';
export const BEASTMAN_MUTANT = 'beastmen_raiders_special_skills_mutant';
export function advancementGiftOptions(skillId: string | null, hero: import('../types/roster').RosterHero): { item: Item; price: number }[] {
  if (![MARAUDER_MUTANT, TWISTKIN, BEASTMAN_MUTANT].includes(skillId ?? '')) return [];
  const mutations = recruitPurchaseOptions('cult_of_the_possessed', 'cult_of_the_possessed_mutants');
  const blessings = skillId === MARAUDER_MUTANT && ['crow', 'onogal'].includes(hero.flags.chaosMark ?? '')
    ? recruitPurchaseOptions('carnival_of_chaos', 'carnival_of_chaos_tainted_ones').filter(item => item.id !== 'mark_of_nurgle') : [];
  const prior = hero.equipment.reduce((n, line) => n + (mutations.some(item => item.id === line.itemId) || blessings.some(item => item.id === line.itemId) ? line.quantity : 0), 0);
  return [...mutations, ...blessings].map(item => ({item, price: skillId === TWISTKIN ? Math.ceil((item.price.base ?? 0) / 2) : recruitPurchasePrice(item, prior)}));
}
