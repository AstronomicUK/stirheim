// Income resolvers — selling wyrdstone (rulebook Income section; data in data/campaign/income).
//
// Warband size for the income chart counts the warriors the warband must feed: active heroes and
// every henchman. Hired swords are left out (Hired Swords rules: they "don't affect your income
// from selling wyrdstone"); dead, retired and captured heroes are not in the warband.

import type { Resolution, RosterWarband } from "../types/roster";
import { wyrdstoneIncome } from "../data/campaign/income";
import { RulesError } from "./errors";
import { unitRules, warbandRules } from "../data/campaignRules";

export interface SellWyrdstoneOptions {
  /** Use this size instead of counting the roster (e.g. a house rule or a hired sword that does count). */
  sizeOverride?: number;
}

/**
 * Warriors counted for the income chart: active heroes plus every henchman; hired swords excluded.
 * Campaign rules adjust the count: an Ogre eats for two, a Snotling mob counts as one model, Snotlings
 * count as half their number.
 */
export function effectiveWarbandSize(warband: RosterWarband): number {
  return incomeSize(warband).size;
}

export interface IncomeSize {
  size: number;
  /** Plain head count before any rule. */
  headCount: number;
  /** Columns the size band moves (Foragers -1... as data says; positive = larger band). */
  bandShift: number;
  notes: string[];
}

export function incomeSize(warband: RosterWarband): IncomeSize {
  const notes: string[] = [];
  let heroes = 0;
  let heroCount = 0;
  for (const h of warband.heroes) {
    if (h.status !== "active") continue;
    heroCount += 1;
    const counts = unitRules(h.unitTemplateId).incomeCountsAs ?? 1;
    heroes += counts;
    if (counts !== 1) notes.push(`${h.name} counts as ${counts} for income`);
  }
  let henchmen = 0;
  let henchCount = 0;
  for (const g of warband.henchmenGroups) {
    henchCount += g.size;
    const rules = unitRules(g.unitTemplateId);
    if (rules.groupIncomeCountsAs !== undefined) {
      henchmen += g.size > 0 ? rules.groupIncomeCountsAs : 0;
      if (g.size > 0) notes.push(`${g.name} counts as ${rules.groupIncomeCountsAs} model${rules.groupIncomeCountsAs === 1 ? "" : "s"} for income`);
    } else {
      const each = rules.incomeCountsAs ?? 1;
      henchmen += g.size * each;
      if (each !== 1 && g.size > 0) notes.push(`${g.name} count as ${each} each for income`);
    }
  }
  const rules = warbandRules(warband.warbandTemplateId).income;
  let size = heroes + henchmen;
  if (rules?.sizeFactor !== undefined && rules.sizeFactor !== 1) {
    size = Math.ceil(size * rules.sizeFactor);
    notes.push(rules.note);
  }
  let bandShift = 0;
  if (rules?.bandShift) {
    const applies = !rules.bandShiftWith || warband.heroes.some((h) => h.status === "active" && h.unitTemplateId === rules.bandShiftWith) || warband.henchmenGroups.some((g) => g.size > 0 && g.unitTemplateId === rules.bandShiftWith);
    if (applies) {
      bandShift = rules.bandShift;
      notes.push(rules.note);
    }
  }
  return { size, headCount: heroCount + henchCount, bandShift, notes };
}

function assertSellable(warband: RosterWarband, shards: number): void {
  if (!Number.isInteger(shards) || shards < 1) {
    throw new RulesError("income.invalidShards", `You must sell at least one shard (got ${shards})`);
  }
  if (shards > warband.wyrdstone) {
    throw new RulesError(
      "income.notEnoughWyrdstone",
      `Cannot sell ${shards} wyrdstone: the warband only has ${warband.wyrdstone}`,
    );
  }
}

/** Gold the warband would receive for selling `shards` now, without applying it (0 for no shards). */
export function wyrdstoneQuote(warband: RosterWarband, shards: number, opts: SellWyrdstoneOptions = {}): number {
  if (!Number.isInteger(shards) || shards < 1) return 0;
  const info = incomeSize(warband);
  return wyrdstoneIncome(shards, opts.sizeOverride ?? info.size, opts.sizeOverride !== undefined ? 0 : info.bandShift);
}

/** Sell wyrdstone: adds the chart income to gold and removes the shards. Once per post-battle sequence (see trading.TradePhaseState). */
export function sellWyrdstone(
  warband: RosterWarband,
  shards: number,
  opts: SellWyrdstoneOptions = {},
): Resolution<RosterWarband> {
  assertSellable(warband, shards);
  const info = incomeSize(warband);
  const size = opts.sizeOverride ?? info.size;
  const shift = opts.sizeOverride !== undefined ? 0 : info.bandShift;
  const gold = wyrdstoneIncome(shards, size, shift);
  return {
    value: { ...warband, gold: warband.gold + gold, wyrdstone: warband.wyrdstone - shards },
    events: [
      {
        kind: "wyrdstone.sold",
        message: `Sold ${shards} wyrdstone for ${gold} gc (warband size ${size}${shift ? `, band ${shift > 0 ? "+" : ""}${shift}` : ""})`,
        data: { shards, gold, warbandSize: size },
      },
    ],
  };
}
