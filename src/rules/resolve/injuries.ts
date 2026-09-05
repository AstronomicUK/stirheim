// Serious-injury resolvers (post-battle sequence step 1: "Injuries").
//
// Pure functions: dice results are inputs, inputs are never mutated, and every state change is
// narrated in `events`. Data comes from data/campaign/injuries.ts; this file only *applies* it.
//
// Rule judgements made here (see also the report in docs/ or the PR):
// - Stat floors: a negative statDelta never takes M/WS/S/T/W/I/A below 1 or Ld below 2. BS floors
//   at 0 because BS 0 profiles exist (Possessed, Saurus, Wulfen) and a BS 1 shooter who is blinded
//   genuinely cannot shoot any more. A delta never raises a stat above where it was.
// - Several missNextGames effects on one warrior (Multiple Injuries) do not stack: the warrior
//   sits out the *longest* recovery, since the recoveries run concurrently.
// - Deep Wound's "D3 games" is asked for as a D3 sub-roll (die "D3", pass the D3 result 1-3).
// - Second Blinded In One Eye: the source says he must retire, so status becomes "retired".
// - Captured sets both flags.captured and status "captured" so the hero drops out of play and
//   rating until ransomed/exchanged.
// - Robbed has no persistent flag; the equipment loss is recorded in the AppliedInjury.
// - Sold To The Pits is not resolved here (it needs a fight against a Pit Fighter): the injury is
//   recorded and a "pitFight" event tells the caller to run that fight.
// - Hired swords: the caller asked for the D6 henchman rule (1-2 dead). Note the rulebook itself
//   has hired swords roll on the Heroes' chart; use applyHeroInjury-style handling if that is
//   preferred later.

import type { Stats } from "../types";
import type { StatKey } from "../types/common";
import type { InjuryEffect, InjuryFlag, InjuryResult, InjurySubOutcome } from "../types/campaign";
import type {
  AppliedInjury,
  Resolution,
  ResolutionEvent,
  RosterHenchmanGroup,
  RosterHero,
  RosterHiredSword,
  RosterItem,
  WarriorFlags,
} from "../types/roster";
import { HENCHMAN_INJURY, lookupHeroInjury } from "../data/campaign/injuries";
import { RulesError } from "./errors";
import { unitRules, type InjuryException } from "../data/campaignRules";

/** Injury codes that must be re-rolled while resolving Multiple Injuries. */
export const MULTIPLE_INJURIES_REROLL_CODES: readonly string[] = ["dead", "captured", "multiple_injuries"];

/** Lowest value a negative injury delta may take each characteristic to. */
export const STAT_FLOORS: Stats = { M: 1, WS: 1, BS: 0, S: 1, T: 1, W: 1, I: 1, A: 1, Ld: 2 };

export const STAT_NAMES: Record<StatKey, string> = {
  M: "Movement",
  WS: "Weapon Skill",
  BS: "Ballistic Skill",
  S: "Strength",
  T: "Toughness",
  W: "Wounds",
  I: "Initiative",
  A: "Attacks",
  Ld: "Leadership",
};

export interface HeroInjuryOutcome {
  hero: RosterHero;
  /** The injury needs a follow-up die before it can be applied; call again with `subRoll`. */
  needsSubRoll?: { die: "D6" | "D3"; prompt: string };
  /** Multiple Injuries: roll `count` more times on the chart, re-rolling MULTIPLE_INJURIES_REROLL_CODES. */
  needsMoreRolls?: { count: number | string; note: string };
}

/** Plain-text description of a stack of equipment, for event messages. */
export function describeItems(items: RosterItem[]): string {
  if (items.length === 0) return "nothing";
  return items
    .map((i) => {
      const label = i.customName ?? i.itemId ?? "unknown item";
      return i.quantity > 1 ? `${label} x${i.quantity}` : label;
    })
    .join(", ");
}

function inBand(value: number, band: { min: number; max: number }): boolean {
  return value >= band.min && value <= band.max;
}

/** Which die a dice expression like "D3" / "D6" asks for. Only single-die expressions are needed here. */
function dieFor(expr: string): "D6" | "D3" {
  const norm = expr.trim().toUpperCase();
  if (norm === "D3" || norm === "1D3") return "D3";
  if (norm === "D6" || norm === "1D6") return "D6";
  throw new RulesError("UNSUPPORTED_DICE", `Injury data uses a dice expression this resolver cannot ask for: "${expr}"`);
}

function needsSubRollFor(effects: InjuryEffect[], injury: InjuryResult): HeroInjuryOutcome["needsSubRoll"] | undefined {
  for (const e of effects) {
    if (e.kind === "subRoll") {
      return { die: e.die, prompt: `${injury.name}: roll a ${e.die} to determine the outcome` };
    }
    if (e.kind === "missNextGames" && typeof e.games === "string") {
      const die = dieFor(e.games);
      return { die, prompt: `${injury.name}: roll a ${die} for the number of games missed` };
    }
  }
  return undefined;
}

/** Map an InjuryFlag onto the WarriorFlags key it sets, or null where the flag has no persistent marker. */
const FLAG_KEYS: Record<InjuryFlag, keyof WarriorFlags | null> = {
  stupidity: "stupidity",
  frenzy: "frenzy",
  immuneToFear: "immuneToFear",
  causesFear: "causesFear",
  oldBattleWound: "oldBattleWound",
  singleHandedWeaponsOnly: "singleHandedWeaponsOnly",
  noRunning: "noRunning",
  captured: "captured",
  blindedInOneEye: "blindedInOneEye",
  robbed: null,
  soldToThePits: null,
  bitterEnmity: null, // set via flags.hates from the sub-roll outcome text
};

const FLAG_TEXT: Record<InjuryFlag, string> = {
  stupidity: "suffers from stupidity",
  frenzy: "suffers from frenzy",
  immuneToFear: "immune to fear",
  causesFear: "causes fear",
  oldBattleWound: "old battle wound (D6 roll of 1 before each battle: cannot fight)",
  singleHandedWeaponsOnly: "may only use a single one-handed weapon",
  noRunning: "may not run (may still charge)",
  captured: "captured by the enemy warband",
  blindedInOneEye: "blinded in one eye",
  robbed: "robbed",
  soldToThePits: "sold to the fighting pits of Cutthroat's Haven",
  bitterEnmity: "bitter enmity",
};

interface ApplyState {
  hero: RosterHero;
  events: ResolutionEvent[];
  effectTexts: string[];
  /** Set when a bitterEnmity flag has been seen; the sub-roll outcome text becomes `hates`. */
  bitterEnmity: boolean;
}

function clampStat(stat: StatKey, current: number, delta: number): number {
  const target = current + delta;
  if (delta < 0) return Math.max(STAT_FLOORS[stat], Math.min(current, target));
  return target;
}

function applyEffects(
  state: ApplyState,
  effects: InjuryEffect[],
  injury: InjuryResult,
  subRoll: number | undefined,
): HeroInjuryOutcome["needsMoreRolls"] | undefined {
  let moreRolls: HeroInjuryOutcome["needsMoreRolls"] | undefined;
  const id = state.hero.id;
  const name = state.hero.name;

  for (const effect of effects) {
    switch (effect.kind) {
      case "dead": {
        state.hero = { ...state.hero, status: "dead" };
        state.effectTexts.push("Dead");
        state.events.push({ kind: "statusChange", subjectId: id, message: `${name} is dead and removed from the roster.`, data: { status: "dead" } });
        break;
      }
      case "statDelta": {
        const before = state.hero.stats[effect.stat];
        const after = clampStat(effect.stat, before, effect.delta);
        state.hero = { ...state.hero, stats: { ...state.hero.stats, [effect.stat]: after } };
        const label = STAT_NAMES[effect.stat];
        if (after === before) {
          state.effectTexts.push(`${label} ${before} (already at minimum, unchanged)`);
          state.events.push({ kind: "statChange", subjectId: id, message: `${name}: ${label} stays at ${before} (cannot go lower).`, data: { stat: effect.stat, before, after } });
        } else {
          state.effectTexts.push(`${label} ${before} -> ${after}`);
          state.events.push({ kind: "statChange", subjectId: id, message: `${name}: ${label} ${before} -> ${after}.`, data: { stat: effect.stat, before, after } });
        }
        break;
      }
      case "missNextGames": {
        let games: number;
        if (typeof effect.games === "number") {
          games = effect.games;
        } else {
          if (subRoll === undefined) throw new RulesError("SUB_ROLL_REQUIRED", `${injury.name} needs a ${effect.games} roll`);
          games = subRoll;
        }
        const existing = state.hero.flags.missNextGames ?? 0;
        const total = Math.max(existing, games);
        state.hero = { ...state.hero, flags: { ...state.hero.flags, missNextGames: total } };
        state.effectTexts.push(`Misses the next ${games} game${games === 1 ? "" : "s"}`);
        state.events.push({ kind: "missGames", subjectId: id, message: `${name} must miss the next ${total} game${total === 1 ? "" : "s"}.`, data: { games: total } });
        break;
      }
      case "flag": {
        if (effect.flag === "bitterEnmity") {
          state.bitterEnmity = true;
          break;
        }
        if (effect.flag === "blindedInOneEye" && state.hero.flags.blindedInOneEye) {
          // Blinded in the remaining good eye: the source says he must retire.
          state.hero = { ...state.hero, status: "retired" };
          state.effectTexts.push("Blinded in both eyes: retires from the warband");
          state.events.push({ kind: "statusChange", subjectId: id, message: `${name} has lost the sight in his remaining eye and must retire from the warband.`, data: { status: "retired" } });
          break;
        }
        const key = FLAG_KEYS[effect.flag];
        if (key) {
          state.hero = { ...state.hero, flags: { ...state.hero.flags, [key]: true } };
        }
        if (effect.flag === "captured") {
          state.hero = { ...state.hero, status: "captured" };
        }
        state.effectTexts.push(FLAG_TEXT[effect.flag].charAt(0).toUpperCase() + FLAG_TEXT[effect.flag].slice(1));
        if (effect.flag === "soldToThePits") {
          state.events.push({ kind: "pitFight", subjectId: id, message: `${name} has been sold to the pits and must fight a Pit Fighter before rejoining the warband (resolve that fight separately).` });
        } else if (effect.flag !== "robbed") {
          state.events.push({ kind: "flagSet", subjectId: id, message: `${name} ${FLAG_TEXT[effect.flag]}.`, data: { flag: effect.flag } });
        }
        break;
      }
      case "loseEquipment": {
        const lostItems = state.hero.equipment;
        const lost = describeItems(lostItems);
        state.hero = { ...state.hero, equipment: [] };
        state.effectTexts.push(`All equipment lost (${lost})`);
        state.events.push({ kind: "equipmentLost", subjectId: id, message: `${name} loses all weapons, armour and equipment: ${lost}.`, data: { lost: lostItems } });
        break;
      }
      case "experience": {
        state.hero = { ...state.hero, xp: state.hero.xp + effect.delta };
        state.effectTexts.push(`${effect.delta > 0 ? "+" : ""}${effect.delta} Experience`);
        state.events.push({ kind: "xpGained", subjectId: id, message: `${name} gains ${effect.delta} Experience (now ${state.hero.xp}).`, data: { delta: effect.delta, xp: state.hero.xp } });
        break;
      }
      case "multipleInjuries": {
        moreRolls = {
          count: effect.rolls,
          note: `Roll ${effect.rolls}, then roll that many more times on the Serious Injuries chart for ${name}, re-rolling Dead, Captured and further Multiple Injuries (codes: ${MULTIPLE_INJURIES_REROLL_CODES.join(", ")}).`,
        };
        state.effectTexts.push(`Multiple injuries: roll ${effect.rolls} more times`);
        state.events.push({ kind: "needsMoreRolls", subjectId: id, message: moreRolls.note, data: { count: effect.rolls } });
        break;
      }
      case "subRoll": {
        if (subRoll === undefined) throw new RulesError("SUB_ROLL_REQUIRED", `${injury.name} needs a ${effect.die} roll`);
        const outcome: InjurySubOutcome | undefined = effect.outcomes.find((o) => inBand(subRoll, o.band));
        if (!outcome) throw new RangeError(`${injury.name}: sub-roll ${subRoll} is not a valid ${effect.die} result`);
        if (state.bitterEnmity) {
          state.hero = { ...state.hero, flags: { ...state.hero.flags, hates: outcome.text } };
          state.effectTexts.push(`Hates: ${outcome.text}`);
          state.events.push({ kind: "flagSet", subjectId: id, message: `${name} now hates: ${outcome.text}`, data: { flag: "bitterEnmity", hates: outcome.text } });
        }
        const nested = applyEffects(state, outcome.effects, injury, undefined);
        if (nested) moreRolls = nested;
        break;
      }
    }
  }
  return moreRolls;
}

/**
 * Apply a Hero's Serious Injury from a D66 result.
 *
 * - Injuries that need a follow-up die (Arm Wound, Madness, Smashed Leg, Deep Wound, Bitter Enmity)
 *   return `needsSubRoll` and an unchanged hero when `subRoll` is undefined; call again with it.
 * - Multiple Injuries records the result and returns `needsMoreRolls`; the caller rolls the D6 and
 *   calls this function once per further roll, re-rolling any MULTIPLE_INJURIES_REROLL_CODES.
 * - An AppliedInjury is appended to `hero.injuries` every time an injury is actually applied.
 */
export function applyHeroInjury(
  hero: RosterHero,
  d66: number,
  subRoll?: number,
  ctx?: { matchId?: string },
): Resolution<HeroInjuryOutcome> {
  const injury = lookupHeroInjury(d66);
  const pending = needsSubRollFor(injury.effects, injury);
  if (pending && subRoll === undefined) {
    return {
      value: { hero, needsSubRoll: pending },
      events: [{ kind: "needsSubRoll", subjectId: hero.id, message: `${hero.name} suffers ${injury.name} (D66 ${d66}). ${pending.prompt}.`, data: { d66, code: injury.code, die: pending.die } }],
    };
  }

  const state: ApplyState = { hero, events: [], effectTexts: [], bitterEnmity: false };
  state.events.push({ kind: "injury", subjectId: hero.id, message: `${hero.name} rolls ${d66} on the Serious Injuries chart: ${injury.name}.`, data: { d66, subRoll, code: injury.code } });

  const needsMoreRolls = applyEffects(state, injury.effects, injury, subRoll);

  const record: AppliedInjury = {
    injuryCode: injury.code,
    name: injury.name,
    rolled: subRoll === undefined ? { d66 } : { d66, subRoll },
    effect: state.effectTexts.length > 0 ? state.effectTexts.join("; ") : "Full recovery, no lasting effect",
    ...(ctx?.matchId ? { matchId: ctx.matchId } : {}),
  };
  const finalHero: RosterHero = { ...state.hero, injuries: [...state.hero.injuries, record] };

  if (state.effectTexts.length === 0) {
    state.events.push({ kind: "recovered", subjectId: hero.id, message: `${hero.name} makes a full recovery.` });
  }

  return {
    value: needsMoreRolls ? { hero: finalHero, needsMoreRolls } : { hero: finalHero },
    events: state.events,
  };
}

function assertD6(d6: number): void {
  if (!Number.isInteger(d6) || d6 < 1 || d6 > 6) throw new RangeError(`Not a valid D6 result: ${d6}`);
}

/** The campaign rule that changes this group's injury roll (a Troll never rolls, a Hobgoblin leaves on 1-3), if any. */
export function henchmanInjuryException(group: Pick<RosterHenchmanGroup, "unitTemplateId">): InjuryException | undefined {
  return unitRules(group.unitTemplateId).injury;
}

/**
 * Henchman out of action: D6, 1-2 the warrior is removed from the group (or as the unit's own rule says). Returns null when the
 * group is now empty (the caller removes it from the roster).
 */
export function applyHenchmanInjury(group: RosterHenchmanGroup, d6: number): Resolution<RosterHenchmanGroup | null> {
  assertD6(d6);
  const exception = henchmanInjuryException(group);
  const deadOn = exception?.deadOn ?? HENCHMAN_INJURY.deadOn;
  if (!deadOn.includes(d6)) {
    return {
      value: group,
      events: [{ kind: "recovered", subjectId: group.id, message: `${group.name}: rolled ${d6}, the warrior recovers and fights in the next battle.`, data: { d6 } }],
    };
  }
  const size = group.size - 1;
  const events: ResolutionEvent[] = [
    { kind: "henchmanLost", subjectId: group.id, message: `${group.name}: rolled ${d6}, one warrior is ${exception ? exception.label : "dead or has quit"} (${group.size} -> ${size}).`, data: { d6, before: group.size, after: size } },
  ];
  if (size <= 0) {
    events.push({ kind: "groupDisbanded", subjectId: group.id, message: `${group.name} has no members left and is removed from the roster.` });
    return { value: null, events };
  }
  return { value: { ...group, size }, events };
}

/** Hired sword out of action: D6, 1-2 dead (house treatment; see file header). */
export function applyHiredSwordInjury(sword: RosterHiredSword, d6: number): Resolution<RosterHiredSword> {
  assertD6(d6);
  if (!HENCHMAN_INJURY.deadOn.includes(d6)) {
    return {
      value: sword,
      events: [{ kind: "recovered", subjectId: sword.id, message: `${sword.name}: rolled ${d6}, recovers and fights in the next battle.`, data: { d6 } }],
    };
  }
  return {
    value: { ...sword, status: "dead" },
    events: [{ kind: "statusChange", subjectId: sword.id, message: `${sword.name}: rolled ${d6}, the hired sword is dead.`, data: { d6, status: "dead" } }],
  };
}
