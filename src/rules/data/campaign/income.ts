// Income — reference/rules/03-campaigns-magic-optional-rules.md lines 565-611
// (mordheimer.net/docs/campaigns/income): the exploration procedure, the shards-found chart and
// the wyrdstone-selling income chart.

import type { IncomeRow, ShardsFoundRow } from "../../types/campaign";
import type { SourceRef } from "../../types/common";

export const INCOME_SOURCE: SourceRef = {
  publication: "Mordheim Rulebook (mordheimer.net/docs/campaigns/income)",
  file: "03-campaigns-magic-optional-rules.md:565-611",
};

// ---- Exploration ----

/** "you must pick a maximum of six dice out of all the dice you roll" (03:585). */
export const EXPLORATION_MAX_DICE = 6;

/** Verbatim — the four numbered steps under "exploration procedure" (03:583-588). */
export const EXPLORATION_PROCEDURE: string[] = [
  "Roll 1D6 for each of your Heroes who survived the battle and one extra dice if you won, plus any extra dice allowed by skills or equipment. Note, however, that you must pick a maximum of six dice out of all the dice you roll, even if you are allowed to roll seven dice or more.",
  "Some things, such as skills and equipment, (like the Mordheim Map) may allow you to re-roll dice. If your warband includes an Elf Ranger, you may modify one dice by +1 or -1.",
  "If you rolled any doubles, triples, etc, you have found an unusual location in Mordheim. Consult the Exploration chart below to see what you find. Refer to the appropriate entry on the following pages and follow the instructions given there.",
  "Add the results together and consult the chart below to see how many shards of wyrdstone you have found. Mark down the amount of wyrdstone on your warband's roster sheet.",
];

/** Open-ended top band ("36+"). */
const UNBOUNDED = 999;

/** Number of Wyrdstone Shards Found, by the total of the exploration dice. */
export const SHARDS_FOUND: ShardsFoundRow[] = [
  { band: { min: 1, max: 5 }, shards: 1 },
  { band: { min: 6, max: 11 }, shards: 2 },
  { band: { min: 12, max: 17 }, shards: 3 },
  { band: { min: 18, max: 24 }, shards: 4 },
  { band: { min: 25, max: 30 }, shards: 5 },
  { band: { min: 31, max: 35 }, shards: 6 },
  { band: { min: 36, max: UNBOUNDED }, shards: 7 },
];

/** Shards of wyrdstone found for a given exploration dice total. */
export function shardsFound(diceTotal: number): number {
  if (diceTotal < 1) return 0;
  const row = SHARDS_FOUND.find((r) => diceTotal >= r.band.min && diceTotal <= r.band.max);
  return row ? row.shards : SHARDS_FOUND[SHARDS_FOUND.length - 1].shards;
}

// ---- Selling wyrdstone ----

/** Column headings of the income chart — number of warriors in the warband. */
export const WARBAND_SIZE_BANDS = ["1-3", "4-6", "7-9", "10-12", "13-15", "16+"] as const;

/**
 * Wyrdstone income chart: profit in gold crowns (after maintenance) by shards sold and warband size.
 *
 * The scrape at 03:597-611 keeps the prose of "selling wyrdstone" but the table itself is MISSING,
 * so these figures are the canonical Mordheim Rulebook, Income chart.
 * Verified 2026-09-03 against the site's income table image (reference/rules/wyrdstone-income-table.jpg): all values match.
 */
export const WYRDSTONE_INCOME: IncomeRow[] = [
  { shardsSold: 1, byWarbandSize: [45, 40, 35, 30, 30, 25] },
  { shardsSold: 2, byWarbandSize: [60, 55, 50, 45, 40, 35] },
  { shardsSold: 3, byWarbandSize: [75, 70, 65, 60, 55, 50] },
  { shardsSold: 4, byWarbandSize: [90, 80, 70, 65, 60, 55] },
  { shardsSold: 5, byWarbandSize: [110, 100, 90, 80, 70, 65] },
  { shardsSold: 6, byWarbandSize: [120, 110, 100, 90, 80, 70] },
  { shardsSold: 7, byWarbandSize: [145, 130, 120, 110, 100, 90] },
  { shardsSold: "8+", byWarbandSize: [155, 140, 130, 120, 110, 100] },
];

/** Index into WARBAND_SIZE_BANDS / IncomeRow.byWarbandSize for a warband of `size` warriors. */
export function warbandSizeBandIndex(size: number): number {
  if (size <= 3) return 0;
  if (size <= 6) return 1;
  if (size <= 9) return 2;
  if (size <= 12) return 3;
  if (size <= 15) return 4;
  return 5;
}

/** Gold crowns earned by selling `shards` wyrdstone with a warband of `warbandSize` warriors (0 for no shards). */
export function wyrdstoneIncome(shards: number, warbandSize: number, bandShift = 0): number {
  if (shards < 1) return 0;
  const row = WYRDSTONE_INCOME.find((r) => (shards >= 8 ? r.shardsSold === "8+" : r.shardsSold === shards));
  if (!row) throw new RangeError(`No income row for ${shards} shards`);
  const index = Math.max(0, Math.min(WARBAND_SIZE_BANDS.length - 1, warbandSizeBandIndex(warbandSize) + bandShift));
  return row.byWarbandSize[index];
}
