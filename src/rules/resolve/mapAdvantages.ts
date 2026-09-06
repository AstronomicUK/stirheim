// The map advantages a warband enjoys right now, folded into one plain object the report wizard,
// the trading post, recruitment and the advances screen can read: which districts count (a
// foothold, and control where the district is Hard Fought), and what they add up to. Everything
// here is a suggestion the player can still override with a reason, as elsewhere.

import { findDistrict } from "../data/map/districts";
import { districtEffect, matchesItemList, type InjuryRewrite } from "../data/map/advantages";
import { advantagesFor, type MapState } from "./mapCampaign";

export interface PerkSource {
  districtId: string;
  districtName: string;
}

export interface MapPerks {
  /** Districts whose advantages apply, in map order. */
  districts: PerkSource[];
  explorationDice: number;
  explorationDiceSources: string[];
  explorationModifyOne: PerkSource | null;
  explorationMaxFinds: PerkSource | null;
  /** Fraction added to wyrdstone sales (0.2 = 20%), from The Rock. */
  wyrdstoneSaleBonus: number;
  wyrdstoneSaleSource: PerkSource | null;
  rareRollBonus: number;
  rareRollSource: PerkSource | null;
  resaleAtFull: PerkSource | null;
  veteranDice: { kind: "human" | "nonHuman"; source: PerkSource }[];
  chooseSpell: PerkSource | null;
  cheapRecruits: Record<string, { cost: number; source: PerkSource }>;
  fearImmunity: PerkSource | null;
  leaderLd: number;
  leaderLdSource: PerkSource | null;
  injuryRewrites: (InjuryRewrite & { source: PerkSource })[];
  pitFightAutoWin: PerkSource | null;
  findsLuthor: PerkSource | null;
  reminders: { source: PerkSource; text: string }[];
  /** Hired swords and personae at half fee: id -> where from. */
  halfPriceHires: Record<string, PerkSource>;
  /** Raw item lists per district, resolved by `halfPriceItemSource`. */
  halfPriceItemLists: { source: PerkSource; items: string[] }[];
}

export function emptyMapPerks(): MapPerks {
  return {
    districts: [],
    explorationDice: 0,
    explorationDiceSources: [],
    explorationModifyOne: null,
    explorationMaxFinds: null,
    wyrdstoneSaleBonus: 0,
    wyrdstoneSaleSource: null,
    rareRollBonus: 0,
    rareRollSource: null,
    resaleAtFull: null,
    veteranDice: [],
    chooseSpell: null,
    cheapRecruits: {},
    fearImmunity: null,
    leaderLd: 0,
    leaderLdSource: null,
    injuryRewrites: [],
    pitFightAutoWin: null,
    findsLuthor: null,
    reminders: [],
    halfPriceHires: {},
    halfPriceItemLists: [],
  };
}

/** The perks of every district the warband holds the advantage of. */
export function mapPerksFor(state: MapState, warbandId: string): MapPerks {
  const perks = emptyMapPerks();
  for (const { district, contested } of advantagesFor(state, warbandId)) {
    if (contested) continue;
    const source: PerkSource = { districtId: district.id, districtName: district.name };
    const e = districtEffect(district.id);
    perks.districts.push(source);
    if (e.explorationDice) {
      perks.explorationDice += e.explorationDice;
      perks.explorationDiceSources.push(district.name);
    }
    if (e.explorationModifyOne && !perks.explorationModifyOne) perks.explorationModifyOne = source;
    if (e.explorationMaxFinds && !perks.explorationMaxFinds) perks.explorationMaxFinds = source;
    if (e.wyrdstoneSaleBonus && e.wyrdstoneSaleBonus > perks.wyrdstoneSaleBonus) {
      perks.wyrdstoneSaleBonus = e.wyrdstoneSaleBonus;
      perks.wyrdstoneSaleSource = source;
    }
    if (e.rareRollBonus) {
      perks.rareRollBonus += e.rareRollBonus;
      perks.rareRollSource = perks.rareRollSource ?? source;
    }
    if (e.resaleAtFull && !perks.resaleAtFull) perks.resaleAtFull = source;
    if (e.veteranDice) perks.veteranDice.push({ kind: e.veteranDice, source });
    if (e.chooseSpell && !perks.chooseSpell) perks.chooseSpell = source;
    for (const [unitId, cost] of Object.entries(e.cheapRecruits ?? {})) perks.cheapRecruits[unitId] = { cost, source };
    if (e.fearImmunity && !perks.fearImmunity) perks.fearImmunity = source;
    if (e.leaderLd) {
      perks.leaderLd += e.leaderLd;
      perks.leaderLdSource = perks.leaderLdSource ?? source;
    }
    for (const r of e.injuryRewrites ?? []) perks.injuryRewrites.push({ ...r, source });
    if (e.pitFightAutoWin && !perks.pitFightAutoWin) perks.pitFightAutoWin = source;
    if (e.findsLuthor && !perks.findsLuthor) perks.findsLuthor = source;
    if (e.reminder) perks.reminders.push({ source, text: e.reminder });
    for (const id of e.halfPriceHires ?? []) perks.halfPriceHires[id] = perks.halfPriceHires[id] ?? source;
    if (e.halfPriceItems) perks.halfPriceItemLists.push({ source, items: e.halfPriceItems });
  }
  return perks;
}

/** Where an item is half price for this warband, or null. */
export function halfPriceItemSource(perks: MapPerks | null | undefined, itemId: string): PerkSource | null {
  if (!perks) return null;
  for (const list of perks.halfPriceItemLists) if (matchesItemList(list.items, itemId)) return list.source;
  return null;
}

/** Where a hired sword or persona is half fee for this warband, or null. */
export function halfPriceHireSource(perks: MapPerks | null | undefined, id: string): PerkSource | null {
  return perks?.halfPriceHires[id] ?? null;
}

/** Half a fee or price, rounded down as the map rules say. */
export function halved(amount: number): number {
  return Math.floor(amount / 2);
}

/** The injury rewrite a D66 result triggers, if any. */
export function injuryRewriteFor(perks: MapPerks | null | undefined, d66: number): (InjuryRewrite & { source: PerkSource }) | null {
  if (!perks) return null;
  return perks.injuryRewrites.find((r) => d66 >= r.min && d66 <= r.max) ?? null;
}

/** True when the district is a Wyrdstone district (winner gains D3 shards). */
export function isAbundanceDistrict(districtId: string | null | undefined): boolean {
  return Boolean(findDistrict(districtId)?.abundance);
}

/** One line per perk, for a summary card. */
export function describeMapPerks(perks: MapPerks): string[] {
  const out: string[] = [];
  if (perks.explorationDice) out.push(`+${perks.explorationDice} exploration ${perks.explorationDice === 1 ? "die" : "dice"} (${perks.explorationDiceSources.join(", ")})`);
  if (perks.explorationModifyOne) out.push(`Modify one exploration die by 1 (${perks.explorationModifyOne.districtName})`);
  if (perks.explorationMaxFinds) out.push(`Maximum gold and equipment at exploration locations (${perks.explorationMaxFinds.districtName})`);
  if (perks.wyrdstoneSaleBonus) out.push(`+${Math.round(perks.wyrdstoneSaleBonus * 100)}% when selling wyrdstone (${perks.wyrdstoneSaleSource?.districtName})`);
  if (perks.rareRollBonus) out.push(`+${perks.rareRollBonus} on rare item rolls (${perks.rareRollSource?.districtName})`);
  if (perks.resaleAtFull) out.push(`Weapons and armour sell at purchase price (${perks.resaleAtFull.districtName})`);
  for (const v of perks.veteranDice) out.push(`Veteran pool on 3D6 for ${v.kind === "human" ? "human" : "non-human"} henchman groups (${v.source.districtName})`);
  if (perks.chooseSpell) out.push(`New spells may be chosen (${perks.chooseSpell.districtName})`);
  for (const [unitId, c] of Object.entries(perks.cheapRecruits)) out.push(`${unitId.replace(/^.*_/, "")} recruits at ${c.cost} gc (${c.source.districtName})`);
  if (perks.fearImmunity) out.push(`Immune to Fear, Terror counts as Fear (${perks.fearImmunity.districtName})`);
  if (perks.leaderLd) out.push(`Leader +${perks.leaderLd} Ld (${perks.leaderLdSource?.districtName})`);
  for (const r of perks.injuryRewrites) out.push(`Serious Injury ${r.min === r.max ? r.min : `${r.min}-${r.max}`} becomes Full Recovery${r.test ? ` on a D6 of ${r.test}+` : ""} (${r.source.districtName})`);
  if (perks.pitFightAutoWin) out.push(`A hero Sold to the Pits wins the fight (${perks.pitFightAutoWin.districtName})`);
  for (const [id, s] of Object.entries(perks.halfPriceHires)) out.push(`${id.replace(/_/g, " ")} hired at half fee (${s.districtName})`);
  for (const l of perks.halfPriceItemLists) out.push(`Half price: ${l.items.filter((i) => !i.startsWith("prefix:")).map((i) => i.replace(/_/g, " ")).join(", ")} (${l.source.districtName})`);
  for (const r of perks.reminders) out.push(`${r.source.districtName}: ${r.text}`);
  return out;
}
