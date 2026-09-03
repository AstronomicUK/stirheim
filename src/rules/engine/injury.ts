// Injury chart — core rules 01:772-776. Standard bands: 1-2 Knocked Down, 3-4 Stunned, 5-6 Out of
// Action. Modified by a numeric roll bonus (Strike to Injure +1, crit-table bonuses, etc.) and,
// where applicable, remapped entirely by a weapon's Concussion property (clubs, maces, hammers) or
// a defensive rule like True Grit / Hard to Kill. Modify the roll first, THEN look up the
// (possibly remapped) band.

import { probabilityAtLeast } from "./dice";
import type { InjuryBreakdown } from "../types";

/** [koMax, stunnedMax] — rolls <= koMax are Knocked Down, <= stunnedMax are Stunned, above is OOA. */
export type InjuryBand = [number, number];

export const STANDARD_INJURY_BAND: InjuryBand = [2, 4];
/** Concussion remap (02:220 — club, mace, hammer, etc.): 1 KD / 2-4 Stunned / 5-6 OOA. */
export const CONCUSSION_INJURY_BAND: InjuryBand = [1, 4];
/** True Grit (Dwarf skill) remap: 1-3 KD / 4-5 Stunned / 6 OOA. */
export const TRUE_GRIT_INJURY_BAND: InjuryBand = [3, 5];
/** Hard to Kill (Dwarf racial trait, mordheimer.net) remap: 1-2 KD / 3-5 Stunned / 6 OOA. */
export const HARD_TO_KILL_INJURY_BAND: InjuryBand = [2, 5];

export interface InjuryModifiers {
  /** Sum of all numeric bonuses to the Injury roll (Strike to Injure, crit bonuses, Crushing Blow, etc.). */
  injuryRollModifier: number;
  /** Weapon used has the Concussion property, AND the defender doesn't ignore it (Hard Head) — resolved by the caller. */
  concussion: boolean;
  /** Defender has True Grit (or any other injuryChartRemap skill — see `remap`). */
  trueGrit: boolean;
  /** Explicit band for the defender's injuryChartRemap skill. Defaults to True Grit's band when `trueGrit` is set without one. */
  remap?: InjuryBand;
  /** Defender has the Hard to Kill racial trait (Dwarfs). */
  hardToKill: boolean;
  /** D6 threshold for the extra save that converts a Stunned result to Knocked Down (Helmet 4+, Thick Skull 3+, Thick Skull + helmet 2+). Undefined = none. */
  stunAvoidanceThreshold?: number;
  /** No Pain (undead): every Stunned result is treated as Knocked Down. */
  stunnedBecomesKnockedDown?: boolean;
  /** Undead Construct (Bone Goliath): each Injury roll is ignored entirely on this D6 threshold or better; the wound is still lost. Not an armour save, not modified by Strength. */
  injuryIgnoreThreshold?: number;
}

/**
 * Precedence when more than one remap could apply is not specified anywhere in the source rules
 * text — documented assumption: the weapon's Concussion remap first (an always-on weapon rule),
 * then the chosen True Grit skill, then the innate Hard to Kill racial trait, then standard. In
 * practice Dwarfs (the only True Grit / Hard to Kill users) also have Hard Head, which cancels
 * Concussion before it reaches here, so the first branch only matters for a mis-built character.
 */
export function resolveInjuryBand(concussion: boolean, trueGrit: boolean, hardToKill: boolean, remap?: InjuryBand): InjuryBand {
  if (concussion) return CONCUSSION_INJURY_BAND;
  if (trueGrit) return remap ?? TRUE_GRIT_INJURY_BAND;
  if (hardToKill) return HARD_TO_KILL_INJURY_BAND;
  return STANDARD_INJURY_BAND;
}

/** Exact KD/Stunned/OOA probability breakdown for a single Injury roll under the given modifiers. */
export function injuryDistribution(mods: InjuryModifiers): InjuryBreakdown {
  const [koMax, stunnedMax] = resolveInjuryBand(mods.concussion, mods.trueGrit, mods.hardToKill, mods.remap);

  let knockedDown = 0;
  let stunned = 0;
  let outOfAction = 0;

  for (let roll = 1; roll <= 6; roll++) {
    const modified = roll + mods.injuryRollModifier;
    const p = 1 / 6;
    if (modified <= koMax) knockedDown += p;
    else if (modified <= stunnedMax) stunned += p;
    else outOfAction += p;
  }

  if (mods.stunnedBecomesKnockedDown) {
    knockedDown += stunned;
    stunned = 0;
  } else if (mods.stunAvoidanceThreshold !== undefined) {
    const saveChance = probabilityAtLeast(mods.stunAvoidanceThreshold);
    const converted = stunned * saveChance;
    stunned -= converted;
    knockedDown += converted;
  }

  let none = 0;
  if (mods.injuryIgnoreThreshold !== undefined) {
    const pIgnore = probabilityAtLeast(mods.injuryIgnoreThreshold);
    none = pIgnore;
    knockedDown *= 1 - pIgnore;
    stunned *= 1 - pIgnore;
    outOfAction *= 1 - pIgnore;
  }

  return { none, knockedDown, stunned, outOfAction };
}

/**
 * Injury outcome when `wounds` separate wounds get through in the same turn: one Injury roll per
 * wound, and the HIGHEST result applies (01:770 — "If a model suffers several wounds in one turn,
 * roll once for each of them and apply the highest result"). This is what makes a "doubled to 2
 * wounds" critical hit deadly even against a single-Wound model.
 */
export function injuryDistributionForWounds(mods: InjuryModifiers, wounds: number): InjuryBreakdown {
  const single = injuryDistribution(mods);
  if (wounds <= 1) return single;
  const none = single.none ?? 0;
  const pNone = Math.pow(none, wounds);
  const pKdOrLess = Math.pow(none + single.knockedDown, wounds);
  const pStunOrLess = Math.pow(none + single.knockedDown + single.stunned, wounds);
  return {
    none: pNone,
    knockedDown: pKdOrLess - pNone,
    stunned: pStunOrLess - pKdOrLess,
    outOfAction: 1 - pStunOrLess,
  };
}
