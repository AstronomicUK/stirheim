// Exploration resolvers — the post-battle search for wyrdstone (rulebook Income chapter; data in
// data/campaign/income and data/campaign/exploration).
//
// Dice are inputs: the UI (or a seeded rng via ./dice) rolls, these functions interpret. Rule
// judgements made here:
//   - "Roll 1D6 for each of your Heroes who survived the battle": only heroes with status "active"
//     count, minus those the caller lists as out of action. Hired swords never contribute a die —
//     the source says "each Hero" and hired swords are administered as henchmen. Heroes who sat the
//     battle out (missNextGames, Old Battle Wound) are the caller's responsibility: pass them in
//     `heroesOutOfAction` if the group rules they did not "survive the battle".
//   - Extra dice from skills or equipment (Streetwise, Mordheim Map…) are entered by the player as
//     `extraDice`; the cap of six is applied after everything is summed (03:585).
//   - Multiples: "Choose the most numerous multiples… In the case of two doubles or triples look
//     up the highest result" — implemented by taking the first entry of dice.multiplesIn, which is
//     sorted by count desc then value desc.

import type { ExplorationLocation, ExplorationReward, MultipleKind } from "../types/exploration";
import type { Resolution, ResolutionEvent, RosterItem, RosterWarband } from "../types/roster";
import { findLocation } from "../data/campaign/exploration";
import { EXPLORATION_MAX_DICE, shardsFound } from "../data/campaign/income";
import { multiplesIn } from "./dice";
import { RulesError } from "./errors";

const KIND_BY_COUNT: Record<number, MultipleKind> = {
  2: "doubles",
  3: "triples",
  4: "fourOfAKind",
  5: "fiveOfAKind",
  6: "sixOfAKind",
};

export interface ExplorationDiceOptions {
  /** The warband won the battle (+1 die). */
  won: boolean;
  /** Ids of heroes who went out of action (or otherwise did not survive the battle). */
  heroesOutOfAction: string[];
  /** Extra dice granted by skills or equipment, as entered by the player. */
  extraDice?: number;
}

export interface ExplorationDiceAllowed {
  count: number;
  /** True when the uncapped total exceeded EXPLORATION_MAX_DICE. */
  capped: boolean;
  reason: string;
}

/** How many exploration dice the warband rolls: one per surviving active hero, +1 if won, + extras, max six. */
export function explorationDiceAllowed(warband: RosterWarband, opts: ExplorationDiceOptions): ExplorationDiceAllowed {
  const outOfAction = new Set(opts.heroesOutOfAction);
  const survivors = warband.heroes.filter((h) => h.status === "active" && !outOfAction.has(h.id));
  const extra = Math.max(0, Math.floor(opts.extraDice ?? 0));
  const raw = survivors.length + (opts.won ? 1 : 0) + extra;
  const count = Math.min(raw, EXPLORATION_MAX_DICE);
  const parts = [`${survivors.length} surviving ${survivors.length === 1 ? "hero" : "heroes"}`];
  if (opts.won) parts.push("+1 for winning");
  if (extra > 0) parts.push(`+${extra} from skills/equipment`);
  const capped = raw > EXPLORATION_MAX_DICE;
  const reason = `${parts.join(", ")} = ${raw} dice${capped ? `, capped at ${EXPLORATION_MAX_DICE}` : ""}`;
  return { count, capped, reason };
}

export interface ExplorationMultiple {
  kind: MultipleKind;
  value: number;
  count: number;
}

export interface ExplorationResult {
  /** Sum of the dice kept. */
  total: number;
  /** Shards of wyrdstone found for that total (data/campaign/income SHARDS_FOUND). */
  shards: number;
  /** The multiple that counts, or null if every die was different. */
  multiple: ExplorationMultiple | null;
  /** The Exploration chart entry for that multiple, or null if none / no multiple. */
  location: ExplorationLocation | null;
  events: ResolutionEvent[];
}

function assertExplorationRolls(rolls: number[]): void {
  if (rolls.length > EXPLORATION_MAX_DICE) {
    throw new RulesError(
      "exploration.tooManyDice",
      `You may keep at most ${EXPLORATION_MAX_DICE} exploration dice (got ${rolls.length})`,
    );
  }
  for (const r of rolls) {
    if (!Number.isInteger(r) || r < 1 || r > 6) {
      throw new RulesError("exploration.invalidDie", `Exploration dice must be whole numbers from 1 to 6 (got ${r})`);
    }
  }
}

/** Interpret the exploration dice the player kept: total, shards found, and the multiple / location if any. */
export function resolveExploration(rolls: number[]): ExplorationResult {
  assertExplorationRolls(rolls);
  const total = rolls.reduce((sum, r) => sum + r, 0);
  const shards = shardsFound(total);
  const best = multiplesIn(rolls)[0];
  const multiple: ExplorationMultiple | null = best
    ? { kind: KIND_BY_COUNT[best.count], value: best.value, count: best.count }
    : null;
  const location = multiple ? (findLocation(multiple.kind, multiple.value) ?? null) : null;

  const events: ResolutionEvent[] = [
    {
      kind: "exploration.rolled",
      message: `Exploration dice ${rolls.join(", ")} total ${total}: ${shards} ${shards === 1 ? "shard" : "shards"} of wyrdstone found`,
      data: { rolls: [...rolls], total, shards },
    },
  ];
  if (multiple) {
    events.push({
      kind: "exploration.multiple",
      message: location
        ? `${describeMultiple(multiple)}: ${location.name}`
        : `${describeMultiple(multiple)}: no Exploration chart entry`,
      data: { ...multiple, locationId: location?.id ?? null },
    });
  }
  return { total, shards, multiple, location, events };
}

function describeMultiple(m: ExplorationMultiple): string {
  const label: Record<MultipleKind, string> = {
    doubles: "Doubles",
    triples: "Triples",
    fourOfAKind: "Four of a kind",
    fiveOfAKind: "Five of a kind",
    sixOfAKind: "Six of a kind",
  };
  return `${label[m.kind]} of ${m.value}`;
}

export interface ExplorationGains {
  shards: number;
  gold: number;
  /** Items found; each goes into the warband stash as its own stack. */
  items: RosterItem[];
  /** Anything the player should remember (a hero missing the next game, a free re-roll…). */
  notes?: string[];
}

/** Add what the exploration turned up: wyrdstone and gold to the treasury, items to the stash. */
export function applyExplorationGains(warband: RosterWarband, gains: ExplorationGains): Resolution<RosterWarband> {
  if (!Number.isInteger(gains.shards) || gains.shards < 0) {
    throw new RulesError("exploration.invalidGains", `Shards found must be a whole number of 0 or more (got ${gains.shards})`);
  }
  if (!Number.isInteger(gains.gold) || gains.gold < 0) {
    throw new RulesError("exploration.invalidGains", `Gold found must be a whole number of 0 or more (got ${gains.gold})`);
  }
  for (const item of gains.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new RulesError("exploration.invalidGains", `Found items need a quantity of at least 1 (${itemLabel(item)})`);
    }
  }

  const events: ResolutionEvent[] = [];
  if (gains.shards > 0) {
    events.push({
      kind: "exploration.wyrdstone",
      message: `Found ${gains.shards} ${gains.shards === 1 ? "shard" : "shards"} of wyrdstone (now ${warband.wyrdstone + gains.shards})`,
      data: { shards: gains.shards },
    });
  }
  if (gains.gold > 0) {
    events.push({
      kind: "exploration.gold",
      message: `Found ${gains.gold} gc (treasury now ${warband.gold + gains.gold} gc)`,
      data: { gold: gains.gold },
    });
  }
  for (const item of gains.items) {
    events.push({
      kind: "exploration.item",
      message: `Found ${item.quantity > 1 ? `${item.quantity} x ` : ""}${itemLabel(item)} (added to the stash)`,
      data: { itemId: item.itemId, customName: item.customName, quantity: item.quantity },
    });
  }
  for (const note of gains.notes ?? []) {
    events.push({ kind: "exploration.note", message: note });
  }

  return {
    value: {
      ...warband,
      gold: warband.gold + gains.gold,
      wyrdstone: warband.wyrdstone + gains.shards,
      stash: [...warband.stash, ...gains.items.map((i) => ({ ...i }))],
    },
    events,
  };
}

function itemLabel(item: RosterItem): string {
  return item.customName ?? item.itemId ?? "unnamed item";
}

export interface LocationOutcome {
  rewards: ExplorationReward[];
  /** What the player reads: the sub-roll row, or the location's rules text. */
  text: string;
  /** Set when the location needs a D6 that has not been supplied yet. */
  needsSubRoll?: { die: string; prompt: string };
  /** Set when the location calls for a characteristic test the player must make. */
  needsTest?: { stat: "T" | "I" | "Ld" | "S" | "WS"; prompt: string };
}

/**
 * What a found location gives. Locations with a D6 table need `subRoll`; without it the result
 * asks for one. Locations with a characteristic test return their (conditional) rewards and flag
 * the test — the caller decides whether it was passed. Everything else returns the fixed rewards.
 */
export function locationOutcome(location: ExplorationLocation, subRoll?: number): LocationOutcome {
  const needsTest = location.test ? { stat: location.test.stat, prompt: location.test.prompt } : undefined;

  if (location.subRoll) {
    if (subRoll === undefined) {
      return {
        rewards: [],
        text: location.subRoll.prompt,
        needsSubRoll: { die: location.subRoll.die, prompt: location.subRoll.prompt },
        ...(needsTest ? { needsTest } : {}),
      };
    }
    const outcome = location.subRoll.outcomes.find((o) => subRoll >= o.band.min && subRoll <= o.band.max);
    if (!outcome) {
      throw new RulesError(
        "exploration.invalidSubRoll",
        `${location.name}: ${subRoll} is not on the ${location.subRoll.die} table`,
      );
    }
    return {
      rewards: outcome.rewards,
      text: outcome.text,
      ...(needsTest ? { needsTest } : {}),
    };
  }

  return {
    rewards: location.rewards,
    text: location.rules,
    ...(needsTest ? { needsTest } : {}),
  };
}
