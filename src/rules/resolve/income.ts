// Income resolvers — selling wyrdstone (rulebook Income section; data in data/campaign/income).
//
// Warband size for the income chart counts the warriors the warband must feed: active heroes and
// every henchman. Hired swords are left out (Hired Swords rules: they "don't affect your income
// from selling wyrdstone"); dead, retired and captured heroes are not in the warband.

import type { Resolution, RosterWarband } from "../types/roster";
import { wyrdstoneIncome } from "../data/campaign/income";
import { RulesError } from "./errors";

export interface SellWyrdstoneOptions {
  /** Use this size instead of counting the roster (e.g. a house rule or a hired sword that does count). */
  sizeOverride?: number;
}

/** Warriors counted for the income chart: active heroes plus every henchman; hired swords excluded. */
export function effectiveWarbandSize(warband: RosterWarband): number {
  const heroes = warband.heroes.filter((h) => h.status === "active").length;
  const henchmen = warband.henchmenGroups.reduce((sum, g) => sum + g.size, 0);
  return heroes + henchmen;
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
  return wyrdstoneIncome(shards, opts.sizeOverride ?? effectiveWarbandSize(warband));
}

/** Sell wyrdstone: adds the chart income to gold and removes the shards. Once per post-battle sequence (see trading.TradePhaseState). */
export function sellWyrdstone(
  warband: RosterWarband,
  shards: number,
  opts: SellWyrdstoneOptions = {},
): Resolution<RosterWarband> {
  assertSellable(warband, shards);
  const size = opts.sizeOverride ?? effectiveWarbandSize(warband);
  const gold = wyrdstoneIncome(shards, size);
  return {
    value: { ...warband, gold: warband.gold + gold, wyrdstone: warband.wyrdstone - shards },
    events: [
      {
        kind: "wyrdstone.sold",
        message: `Sold ${shards} wyrdstone for ${gold} gc (warband size ${size})`,
        data: { shards, gold, warbandSize: size },
      },
    ],
  };
}
