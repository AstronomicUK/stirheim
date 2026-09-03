// Dice expressions — parsing and rolling for every `DiceExpression` string in src/rules/data.
//
// The data keeps expressions verbatim from the source ("2D6", "D6 x 10", "75 + 3D6", "45 + 2D6 gc",
// "D6+1"). `parseDice` normalises them into a DiceSpec; `rollDice` turns a spec into numbers using
// an injected rng so that resolvers stay pure and tests are deterministic. Nothing in this module
// calls Math.random except `rollDice`'s default parameter.

import { RulesError } from "./errors";

export interface DiceSpec {
  /** Number of dice rolled (1 for "D6"). */
  count: number;
  /** Faces per die. 66 marks a D66 (tens die * 10 + units die, 11..66). */
  sides: number;
  /** Applied to the dice total before the bonus: "D6x5" -> 5. Defaults to 1. */
  multiplier: number;
  /** Flat addition after the multiplier: "75 + 3D6" -> 75, "D6+1" -> 1. Defaults to 0. */
  bonus: number;
  /** The expression as supplied, trimmed. */
  text: string;
}

export interface DiceRoll {
  total: number;
  /** Individual dice results, before the multiplier and bonus. */
  rolls: number[];
}

export const D66_SIDES = 66;

/**
 * Grammar (case-insensitive, whitespace optional):
 *   [bonus +] [count] D sides [x multiplier] [+ bonus] [gc]
 * Both bonus positions may appear; they are summed.
 */
const DICE_RE = /^(?:(\d+)\s*\+\s*)?(\d*)\s*d\s*(\d+)(?:\s*[x*×]\s*(\d+))?(?:\s*\+\s*(\d+))?(?:\s*gc)?$/i;

export function parseDice(expr: string): DiceSpec {
  const text = expr.trim();
  const m = DICE_RE.exec(text);
  if (!m) throw new RulesError("dice.unparseable", `Cannot parse dice expression "${expr}"`);
  const [, prefixBonus, countStr, sidesStr, multStr, suffixBonus] = m;
  const count = countStr === "" ? 1 : Number(countStr);
  const sides = Number(sidesStr);
  if (count < 1) throw new RulesError("dice.unparseable", `Dice count must be at least 1 in "${expr}"`);
  if (sides < 2) throw new RulesError("dice.unparseable", `Dice must have at least 2 sides in "${expr}"`);
  return {
    count,
    sides,
    multiplier: multStr === undefined ? 1 : Number(multStr),
    bonus: (prefixBonus === undefined ? 0 : Number(prefixBonus)) + (suffixBonus === undefined ? 0 : Number(suffixBonus)),
    text,
  };
}

function toSpec(spec: DiceSpec | string): DiceSpec {
  return typeof spec === "string" ? parseDice(spec) : spec;
}

/** One die of `sides` faces from an rng in [0, 1). A D66 is two D6 read as tens and units. */
export function rollDie(sides: number, rng: () => number = Math.random): number {
  if (sides === D66_SIDES) return rollDie(6, rng) * 10 + rollDie(6, rng);
  return Math.min(sides, Math.floor(rng() * sides) + 1);
}

/**
 * Roll a spec or expression. `rng` defaults to Math.random; pass a seeded function in tests and
 * in any resolver that needs determinism. This is the only place randomness enters src/rules.
 */
export function rollDice(spec: DiceSpec | string, rng: () => number = Math.random): DiceRoll {
  const s = toSpec(spec);
  const rolls: number[] = [];
  for (let i = 0; i < s.count; i++) rolls.push(rollDie(s.sides, rng));
  return { rolls, total: sumDice(rolls) * s.multiplier + s.bonus };
}

/** Lowest and highest total the expression can produce. */
export function minMax(spec: DiceSpec | string): { min: number; max: number } {
  const s = toSpec(spec);
  const lowFace = s.sides === D66_SIDES ? 11 : 1;
  return {
    min: s.count * lowFace * s.multiplier + s.bonus,
    max: s.count * s.sides * s.multiplier + s.bonus,
  };
}

export function sumDice(rolls: number[]): number {
  return rolls.reduce((sum, r) => sum + r, 0);
}

/**
 * Every value that appears two or more times, with how often, sorted by count descending and
 * then value descending. Used by exploration to spot doubles/triples: [5, 5, 1, 3] -> [{5, 2}].
 */
export function multiplesIn(rolls: number[]): { value: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const r of rolls) counts.set(r, (counts.get(r) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
}
