// Income resolvers — selling wyrdstone (rulebook Income section; data in data/campaign/income).
//
// Warband size for the income chart counts the warriors the warband must feed: active heroes and
// every henchman. Hired swords are left out (Hired Swords rules: they "don't affect your income
// from selling wyrdstone"); dead, retired and captured heroes are not in the warband.

import type { Resolution, RosterItem, RosterWarband } from "../types/roster";
import { wyrdstoneIncome } from "../data/campaign/income";
import { RulesError } from "./errors";
import { unitRules, warbandRules } from "../data/campaignRules";

export interface SellWyrdstoneOptions {
  /** Supplies consumed for one smaller income band each. */
  victuals?: number;
  /** Saved Master Chef D6 for this post-battle sequence. */
  masterChefRoll?: number;
  /** Use this size instead of counting the roster (e.g. a house rule or a hired sword that does count). */
  sizeOverride?: number;
  /** Map campaigns: extra gold as a fraction of the chart income, rounded down (The Rock: 0.2). */
  bonusRate?: number;
  /** Mordheim's Burning triples the income after this scenario. */
  scenarioMultiplier?: 3;
  /** Where the bonus comes from, for the record. */
  bonusSource?: string;
}

/** The chart income plus any map bonus (rounded down). */
export function withSaleBonus(income: number, rate: number | undefined): number {
  return rate && rate > 0 ? income + Math.floor(income * rate) : income;
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

export function hasMasterChef(warband: RosterWarband): boolean {
  const rule = warbandRules(warband.warbandTemplateId).income;
  return Boolean(rule?.bandShiftRollTarget && (warband.heroes.some(h => h.status === "active" && h.unitTemplateId === rule.bandShiftWith) || warband.henchmenGroups.some(g => g.size > 0 && g.unitTemplateId === rule.bandShiftWith)));
}

/** Supplies in the stash or carried by available warriors; hired equipment is excluded. */
export function availableVictuals(w: RosterWarband): number {
  const count = (items: RosterItem[]) => items.reduce((n, i) => n + (i.itemId === "victuals" ? i.quantity : 0), 0);
  return count(w.stash) + w.heroes.filter(h => h.status === "active").reduce((n,h) => n + count(h.equipment),0)
    + w.henchmenGroups.filter(g => g.size > 0).reduce((n,g) => n + count(g.equipment),0);
}

function consumeVictuals(w: RosterWarband, quantity: number): RosterWarband {
  let remaining = quantity;
  const take = (items: RosterItem[]) => items.flatMap(i => {
    if (i.itemId !== "victuals" || remaining === 0) return [i];
    const used = Math.min(i.quantity, remaining); remaining -= used;
    return i.quantity === used ? [] : [{...i, quantity:i.quantity-used}];
  });
  const stash = take(w.stash);
  const heroes = w.heroes.map(h => h.status === "active" ? {...h,equipment:take(h.equipment)} : h);
  const henchmenGroups = w.henchmenGroups.map(g => g.size > 0 ? {...g,equipment:take(g.equipment)} : g);
  return {...w,stash,heroes,henchmenGroups};
}

export function incomeSize(warband: RosterWarband, opts: SellWyrdstoneOptions = {}): IncomeSize {
  const supplies = opts.victuals ?? 0;
  if (!Number.isInteger(supplies) || supplies < 0 || supplies > availableVictuals(warband)) throw new RulesError("income.victuals", "Choose a whole number of Victuals available to this warband.");
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
      const each = g.unitTemplateId==='black_orcs_troll'&&g.campaignState?.cheapTrollFeed?2:rules.incomeCountsAs ?? 1;
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
    if (applies && (!rules.bandShiftRollTarget || (Number.isInteger(opts.masterChefRoll) && opts.masterChefRoll! >= rules.bandShiftRollTarget && opts.masterChefRoll! <= 6))) {
      bandShift = rules.bandShift;
      notes.push(rules.note);
    }
  }
  bandShift -= supplies;
  if (supplies) notes.push(`Use ${supplies} Victuals: ${supplies} smaller income band${supplies === 1 ? "" : "s"} (minimum 1–3)`);
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
  const info = incomeSize(warband, opts);
  return withSaleBonus(wyrdstoneIncome(shards, opts.sizeOverride ?? info.size, opts.sizeOverride !== undefined ? -(opts.victuals ?? 0) : info.bandShift), opts.bonusRate) * (opts.scenarioMultiplier ?? 1);
}

/** Sell wyrdstone: adds the chart income to gold and removes the shards. Once per post-battle sequence (see trading.TradePhaseState). */
export function sellWyrdstone(
  warband: RosterWarband,
  shards: number,
  opts: SellWyrdstoneOptions = {},
): Resolution<RosterWarband> {
  assertSellable(warband, shards);
  if (hasMasterChef(warband) && (!Number.isInteger(opts.masterChefRoll) || opts.masterChefRoll! < 1 || opts.masterChefRoll! > 6)) throw new RulesError("income.masterChefRollRequired", "Record the Master Chef D6 before selling wyrdstone.");
  const info = incomeSize(warband, opts);
  const size = opts.sizeOverride ?? info.size;
  const shift = opts.sizeOverride !== undefined ? -(opts.victuals ?? 0) : info.bandShift;
  const chart = wyrdstoneIncome(shards, size, shift);
  const gold = withSaleBonus(chart, opts.bonusRate) * (opts.scenarioMultiplier ?? 1);
  return {
    value: { ...consumeVictuals(warband, opts.victuals ?? 0), gold: warband.gold + gold, wyrdstone: warband.wyrdstone - shards },
    events: [
      {
        kind: "wyrdstone.sold",
        message: `${opts.victuals ? `Consumed ${opts.victuals} Victuals. ` : ""}Sold ${shards} wyrdstone for ${gold} gc (warband size ${size}${shift ? `, ${Math.abs(shift) === 1 ? "one" : Math.abs(shift)} ${shift < 0 ? "smaller" : "larger"} income band${Math.abs(shift) === 1 ? "" : "s"}` : ""}${opts.bonusRate ? `; ${chart} gc on the chart +${Math.round((opts.bonusRate ?? 0) * 100)}% from ${opts.bonusSource ?? "the map"}` : ""}${opts.scenarioMultiplier ? "; ×3 for Mordheim’s Burning" : ""})${hasMasterChef(warband) ? `; Master Chef rolled ${opts.masterChefRoll}: ${opts.masterChefRoll! >= 5 ? "5+ succeeded; one size band smaller (minimum 1–3)" : "5+ failed; normal income band"}` : ""}`,
        data: { shards, gold, warbandSize: size, victuals: opts.victuals ?? 0, ...(opts.masterChefRoll !== undefined ? { masterChefRoll: opts.masterChefRoll } : {}) },
      },
    ],
  };
}
