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
].map(template => ({ ...template, heroTemplates: [...template.heroTemplates], equipmentLists: [...template.equipmentLists] }));

// Town Cryer 12/8, reference/rules/04-hired-swords.md:1407-1443,1719-1753.
// These are ordinary Heroes occupying existing slots, not Hired Swords.
for (const template of WARBAND_TEMPLATES.filter(w => /mercenar/i.test(w.name))) {
  const bases = template.heroTemplates.filter(h => /^0-/.test(h.rosterLimit));
  template.equipmentLists.push({ id: 'priest_of_morr_equipment', name: 'Priest of Morr', meleeWeapons: [{ name: 'Dagger', cost: '1st free/2 gc' }, { name: 'Scythe', cost: '10 gc' }], missileWeapons: [], armour: [] });
  for (const base of bases) {
    template.heroTemplates.push({ ...base, id: `${base.id}__priest_of_morr`, name: `Priest of Morr (instead of ${base.name})`, replacementFor: base.id, alternateHero: 'priest_of_morr', cost: 35, rosterLimit: '0-1', startingExperience: 8, stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 9 }, equipmentListId: 'priest_of_morr_equipment', skillTableIds: ['academic', 'speed'], specialRules: [{ name: 'Funerary Rites', text: 'Choose a Funerary Rite using the rules for Magic.' }, { name: 'Loner', text: 'Does not suffer from the All Alone rules.' }, { name: 'Weapons and armour', text: 'Dagger and Scythe only; may never wear armour.' }] });
    if (template.id === 'mercenaries_middenheim' && /champion/i.test(base.name)) {
      const list = template.equipmentLists.find(l => l.id === base.equipmentListId)!;
      template.equipmentLists.push({ ...list, id: 'wolf_priest_equipment', name: 'Wolf Priest of Ulric', meleeWeapons: list.meleeWeapons.filter(w => /dagger|hammer|mace|club|flail|morning|double.hand/i.test(w.name)), missileWeapons: [], armour: [] });
      template.heroTemplates.push({ ...base, id: `${base.id}__wolf_priest_of_ulric`, name: 'Wolf Priest of Ulric (instead of a Champion)', replacementFor: base.id, alternateHero: 'wolf_priest_of_ulric', cost: 60, rosterLimit: '0-1', stats: { M: 4, WS: 3, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 }, equipmentListId: 'wolf_priest_equipment', skillTableIds: ['combat', 'academic', 'strength', 'speed'], specialRules: [{ name: 'Prayers', text: 'Uses the Prayers of Ulric.' }, { name: 'Wolfcloak', text: 'Included in the hire price; 6+ armour save. Other armour may not be used.' }, { name: 'Hatred', text: 'Hates Witch Hunters, Warrior-Priests, Sigmarite Matriarchs and Sisters Superior.' }] });
    }
  }
}

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
  const listed = listedHeroSlots(template);
  if (listed === null) return null;
  return Math.max(listed, HERO_MAXIMUM);
}

/**
 * The rulebook's ceiling: "If you already have the maximum number of Heroes, roll again" (The
 * Lad's Got Talent). Every list starts with five or six hero slots and may grow to six through the
 * Lad; lists that already field more keep their own total.
 */
export const HERO_MAXIMUM = 6;

/** The hero slots the list itself offers (sum of upper bounds, or a ruled override); null when open-ended. */
export function listedHeroSlots(template: WarbandTemplate): number | null {
  const ruled = warbandRules(template.id).heroCapacity;
  if (ruled !== undefined) return ruled;
  let total = 0;
  for (const hero of template.heroTemplates) {
    if (hero.replacementFor) continue;
    const upper = rosterLimitUpperBound(hero.rosterLimit);
    if (upper === null) return null;
    total += upper;
  }
  return total;
}
