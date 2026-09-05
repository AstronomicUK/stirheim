// Aggregates every WarbandTemplate batch extracted from rules/warbands/*.md. See rules/00-index.md
// for provenance — this is a read-only reference catalogue (distinct from the user's own saved
// WarbandRoster data in state/storage.ts) that lets Character Builder pre-fill a new Character
// from a real warband's published Hero/Henchman line.

import type { WarbandTemplate } from "../../types";
import { WARBANDS as CORE_AND_1A } from "./core-and-grade-1a";
import { WARBANDS as GRADE_1B_1 } from "./grade-1b-part1";
import { WARBANDS as GRADE_1B_2 } from "./grade-1b-part2";
import { WARBANDS as GRADE_1C } from "./grade-1c";
import { WARBANDS as GRADE_2A_1 } from "./grade-2a-part1";
import { WARBANDS as GRADE_2A_2 } from "./grade-2a-part2";
import { WARBANDS as VARIANTS } from "./variants";
import { warbandRules } from "../campaignRules";

export const WARBAND_TEMPLATES: WarbandTemplate[] = [
  ...CORE_AND_1A,
  ...GRADE_1B_1,
  ...GRADE_1B_2,
  ...GRADE_1C,
  ...GRADE_2A_1,
  ...GRADE_2A_2,
  ...VARIANTS,
];

export function findWarbandTemplate(id: string): WarbandTemplate | undefined {
  return WARBAND_TEMPLATES.find((w) => w.id === id);
}

export function findUnitTemplate(warband: WarbandTemplate, unitId: string) {
  return [...warband.heroTemplates, ...warband.henchmanTemplates].find((u) => u.id === unitId);
}

export function findEquipmentList(warband: WarbandTemplate, listId: string) {
  return warband.equipmentLists.find((l) => l.id === listId);
}

/**
 * Upper bound of a UnitTemplate.rosterLimit string: "1" -> 1, "0-2" -> 2, "0-2 (caveat)" -> 2.
 * Open-ended or non-numeric limits ("1+", "any", "may not exceed …") return null (unlimited).
 */
export function rosterLimitUpperBound(rosterLimit: string): number | null {
  const m = rosterLimit.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?(?:\s*\(.*)?$/s);
  if (!m) return null;
  return Number(m[2] ?? m[1]);
}

/**
 * Maximum number of Heroes implied by the hero templates' rosterLimit values (sum of upper bounds),
 * e.g. Mercenaries (Reikland): 1 Captain + 0-2 Champions + 0-2 Youngbloods -> 5. Null if any hero
 * line is unlimited ("1+", "any" …), since the total is then unbounded.
 */
export function heroCapacity(template: WarbandTemplate): number | null {
  const ruled = warbandRules(template.id).heroCapacity;
  if (ruled !== undefined) return ruled;
  let total = 0;
  for (const hero of template.heroTemplates) {
    const upper = rosterLimitUpperBound(hero.rosterLimit);
    if (upper === null) return null;
    total += upper;
  }
  return total;
}
