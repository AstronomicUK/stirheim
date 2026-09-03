// Exploration types — the post-battle "rolling multiples" locations (core rulebook Income chapter)
// and the Magical Artefacts table. Data lives in data/campaign/exploration.ts.

import type { DiceExpression, RollBand, SourceRef } from "./common";

/** Which multiple was rolled on the exploration dice: two 3s -> "doubles", five 6s -> "fiveOfAKind". */
export type MultipleKind = "doubles" | "triples" | "fourOfAKind" | "fiveOfAKind" | "sixOfAKind";

/**
 * One thing a location hands out. `amount` is a number or a dice expression verbatim from the
 * source ("D6", "2D6x5", "D6+1"); `itemName` names the item for "item" rewards; `text` is always
 * present and is what the UI shows, including any condition ("if the Leadership test is passed").
 */
export interface ExplorationReward {
  kind: "gold" | "wyrdstone" | "item" | "text";
  amount?: number | DiceExpression;
  itemName?: string;
  text: string;
}

/** One row of a location's D6 table: "1-2 | D6 gc" -> band {1,2}, text "D6 gc", one gold reward. */
export interface SubRollOutcome {
  band: RollBand;
  text: string;
  rewards: ExplorationReward[];
}

export interface ExplorationLocation {
  /** Slug of the name, e.g. "well", "corpse", "entrance_to_the_catacombs". */
  id: string;
  /** Doubles of 3 -> kind "doubles", value 3. */
  kind: MultipleKind;
  value: number;
  /** Heading name verbatim, e.g. "Noble's Villa". */
  name: string;
  /** The opening scene-setting paragraph, verbatim. */
  flavour: string;
  /** Everything after the flavour paragraph, verbatim — including any Markdown table. */
  rules: string;
  /** Set when the text says "roll a D6" and resolves it with a table or an unambiguous band list. */
  subRoll?: { die: DiceExpression; prompt: string; outcomes: SubRollOutcome[] };
  /** A characteristic test the text calls for, e.g. Well: pick a Hero, D6 <= Toughness. */
  test?: { stat: "T" | "I" | "Ld" | "S" | "WS"; prompt: string };
  /** Fixed rewards stated in the text (Shop: D6 gc). Conditions are spelled out in each `text`. */
  rewards: ExplorationReward[];
  source: SourceRef;
}

/** One row of the Magical Artefacts table (D6). `text` is the full entry, background plus rules. */
export interface MagicalArtefact {
  band: RollBand;
  name: string;
  text: string;
}
