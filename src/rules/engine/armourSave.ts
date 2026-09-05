// Armour Save chart — brief §4.3.
//
// House rule (brief §2): Strength-based armour save erosion defaults OFF, matching this group's
// current ruling — toggleable per-warband from the House Rules tab (types/index.ts's HouseRules,
// state/storage.ts's AppData.houseRules). Note this only ever touches the *save* — a weapon's
// Strength bonus to the To Wound roll is untouched regardless of this toggle.

import { IMPOSSIBLE, type Threshold } from "./dice";
import type { Armour } from "../types";

/** Strength-based armour save reduction chart (brief §4.3), used when the House Rules toggle is on. */
export function strengthSaveErosion(strength: number): number {
  if (strength <= 3) return 0;
  if (strength >= 9) return 6;
  // 4→1, 5→2, 6→3, 7→4, 8→5
  return strength - 3;
}

/**
 * Base save threshold from armour + shield, before any Strength erosion.
 * IMPOSSIBLE = no save at all (no armour, no shield).
 */
function baseArmourThreshold(armour: Armour, paviseCounts: boolean): Threshold {
  let base: Threshold;
  switch (armour.type) {
    case "light":
      base = 6;
      break;
    case "heavy":
      base = 5;
      break;
    case "gromril":
      base = 4;
      break;
    case "none":
    default:
      base = IMPOSSIBLE;
      break;
  }
  // Shield: +1 to whatever save is worn, or a save of 6+ on its own if no armour worn. A pavise is
  // a shield in close combat only when the bearer was charged to the front. Kite shield: +2, or 5+
  // alone; a second shield adds nothing (one shield arm).
  const shieldBonus = armour.kiteShield ? 2 : armour.shield || (armour.pavise && paviseCounts) ? 1 : 0;
  if (shieldBonus > 0) {
    base = base === IMPOSSIBLE ? 7 - shieldBonus : Math.max(2, base - shieldBonus);
  }
  return base;
}

/**
 * Final armour save threshold for a defender against a given attacker Strength.
 * Returns IMPOSSIBLE if the defender has no save available at all.
 */
export function armourSaveThreshold(armour: Armour, attackerStrength: number, applyStrengthErosion = false, paviseCounts = true): Threshold {
  let threshold = baseArmourThreshold(armour, paviseCounts);
  if (applyStrengthErosion && threshold !== IMPOSSIBLE) {
    threshold = threshold + strengthSaveErosion(attackerStrength);
  }
  return threshold;
}
