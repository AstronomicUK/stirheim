// Shared primitives for the campaign-rules datasets extracted in Phase 1.
// Every dataset (items, injuries, experience, exploration, income, hired swords, scenarios,
// spells) imports from here so prices, dice, rarity and stat changes look the same everywhere.

import type { NamedRule, Stats } from "./index";

export type StatKey = keyof Stats;

/**
 * A dice expression exactly as written in the source, e.g. "D6", "2D6", "D3", "D6x5",
 * "10 + D6", "75 + 3D6". Kept verbatim; `rollDice()` in rules/resolve parses it.
 */
export type DiceExpression = string;

/**
 * A price in gold crowns. `base` is the fixed part; `dice` is the variable part when the source
 * gives one ("50 + 3D6 gc" -> base 50, dice "3D6"). `text` is the source string verbatim, which is
 * what the UI shows. Items that are free, or priced relative to another item ("3 x base weapon
 * price"), set `base: null` and explain in `text`.
 */
export interface Price {
  base: number | null;
  dice?: DiceExpression;
  text: string;
}

/**
 * Availability as written: "common", or the 2D6 target for a rare item (Rare 9 -> 9).
 * `restriction` carries any bracketed qualifier verbatim, e.g. "Dwarfs only",
 * "Rare 7 for Skaven and Lizardmen".
 */
export interface Availability {
  kind: "common" | "rare" | "special";
  rarity?: number;
  restriction?: string;
  text: string;
}

/** Where a rule came from, so the UI can cite it and a reviewer can check it. */
export interface SourceRef {
  /** e.g. "Mordheim Rulebook (PDF)", "Town Cryer #12 (1b)". Verbatim from the source line. */
  publication: string;
  /** Path + line range in reference/rules, e.g. "03-campaigns-magic-optional-rules.md:113-230". */
  file: string;
}

/** A permanent change to one characteristic, e.g. Leg Wound -> { stat: "M", delta: -1 }. */
export interface StatDelta {
  stat: StatKey;
  delta: number;
}

/** A D6 (or D66) band, inclusive on both ends: "2-4" -> { min: 2, max: 4 }. */
export interface RollBand {
  min: number;
  max: number;
}

export type { NamedRule, Stats };
