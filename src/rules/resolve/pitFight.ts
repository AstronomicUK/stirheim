// Sold to the Pits (#54): a Serious Injury that sends a captured Hero to fight a Pit Fighter for
// the crowd's entertainment, off the injuries chart entirely — the app only ever recorded the flag
// and gave up. Rulebook (paraphrased from the Serious Injuries entry): win and he returns with 50 gc
// for the warband and +2 Experience, keeping his kit; lose and he rolls again on the Serious
// Injuries chart restricted to 11-35, and if he survives that he rejoins without his weapons or
// armour regardless of what the second injury itself was.
//
// This is a warband-level resolver (not hero-level like the rest of injuries.ts) because the win
// case pays the warband, not the hero, in gold.

import type { HeroInjuryOutcome } from "./injuries";
import { applyHeroInjury } from "./injuries";
import { RulesError } from "./errors";
import type { Resolution, ResolutionEvent, RosterHero, RosterWarband } from "../types/roster";

/** Gold and Experience a won pit fight is worth, per the injury's own text. */
export const PIT_FIGHT_WIN_GOLD = 50;
export const PIT_FIGHT_WIN_XP = 2;

/** The D66 range the follow-up roll on a loss is restricted to. */
export const PIT_FIGHT_LOSS_ROLL_RANGE = { min: 11, max: 35 } as const;

export interface PitFightOwed {
  heroId: string;
  heroName: string;
}

/** Standing heroes currently owed a pit fight (the injury landed and hasn't been resolved yet). */
export function pitFightsOwed(roster: RosterWarband): PitFightOwed[] {
  return roster.heroes.filter((h) => h.status === "active" && h.flags.pitFightOwed).map((h) => ({ heroId: h.id, heroName: h.name }));
}

function requireHero(warband: RosterWarband, heroId: string): RosterHero {
  const hero = warband.heroes.find((h) => h.id === heroId);
  if (!hero) throw new RulesError("pitFight.unknownWarrior", `No hero with id "${heroId}"`);
  if (!hero.flags.pitFightOwed) throw new RulesError("pitFight.notOwed", `${hero.name} is not owed a pit fight`);
  return hero;
}

function replaceHero(warband: RosterWarband, hero: RosterHero): RosterWarband {
  return { ...warband, heroes: warband.heroes.map((h) => (h.id === hero.id ? hero : h)) };
}

function clearFlag(hero: RosterHero): RosterHero {
  const { pitFightOwed: _pitFightOwed, ...flags } = hero.flags;
  return { ...hero, flags };
}

/** He wins: 50 gc for the warband, +2 Experience, keeps his kit. */
export function resolvePitFightWin(warband: RosterWarband): Resolution<RosterWarband> {
  const [owed] = pitFightsOwed(warband);
  if (!owed) throw new RulesError("pitFight.notOwed", "Nobody in this warband is owed a pit fight");
  const hero = requireHero(warband, owed.heroId);
  const nextHero = clearFlag({ ...hero, xp: hero.xp + PIT_FIGHT_WIN_XP });
  const next = { ...replaceHero(warband, nextHero), gold: warband.gold + PIT_FIGHT_WIN_GOLD };
  return {
    value: next,
    events: [
      {
        kind: "pitFightWon",
        subjectId: hero.id,
        message: `${hero.name} wins his fight in the pits: +${PIT_FIGHT_WIN_XP} Experience, ${PIT_FIGHT_WIN_GOLD} gc for the warband, and keeps his kit.`,
        data: { gold: PIT_FIGHT_WIN_GOLD, xp: PIT_FIGHT_WIN_XP },
      },
    ],
  };
}

export interface PitFightLossOutcome {
  warband: RosterWarband;
  needsSubRoll?: HeroInjuryOutcome["needsSubRoll"];
  needsMoreRolls?: HeroInjuryOutcome["needsMoreRolls"];
}

/**
 * He loses: a full Serious Injury roll restricted to 11-35 (validated, not just trusted — a value
 * outside the range would silently look up the wrong injury), and regardless of that roll's own
 * result, thrown out without his weapons or armour if he survives it (equipment is cleared up
 * front; a "Dead" result makes that moot but harmless). Some results in this range still need a
 * follow-up die (Arm Wound, Madness, Smashed Leg, Deep Wound) or more D66 rolls (Multiple
 * Injuries) — this passes that straight through via the same `needsSubRoll`/`needsMoreRolls` shape
 * `applyHeroInjury` already uses, and does not clear the owed flag until the roll fully resolves.
 */
export function resolvePitFightLoss(warband: RosterWarband, d66: number, subRoll?: number, ctx?: { matchId?: string }): Resolution<PitFightLossOutcome> {
  const [owed] = pitFightsOwed(warband);
  if (!owed) throw new RulesError("pitFight.notOwed", "Nobody in this warband is owed a pit fight");
  const hero = requireHero(warband, owed.heroId);
  if (d66 < PIT_FIGHT_LOSS_ROLL_RANGE.min || d66 > PIT_FIGHT_LOSS_ROLL_RANGE.max) {
    throw new RulesError("pitFight.rollOutOfRange", `The follow-up roll must be ${PIT_FIGHT_LOSS_ROLL_RANGE.min}-${PIT_FIGHT_LOSS_ROLL_RANGE.max}, got ${d66}`);
  }
  const stripped: RosterHero = hero.equipment.length > 0 ? { ...hero, equipment: [] } : hero;
  const result = applyHeroInjury(stripped, d66, subRoll, ctx);

  if (result.value.needsSubRoll || result.value.needsMoreRolls) {
    return {
      value: { warband: replaceHero(warband, result.value.hero), needsSubRoll: result.value.needsSubRoll, needsMoreRolls: result.value.needsMoreRolls },
      events: result.events,
    };
  }

  const finalHero = clearFlag(result.value.hero);
  const events: ResolutionEvent[] = [
    { kind: "pitFightLost", subjectId: hero.id, message: `${hero.name} loses his fight in the pits and is thrown out without his weapons or armour.` },
    ...result.events,
  ];
  return { value: { warband: replaceHero(warband, finalHero) }, events };
}
