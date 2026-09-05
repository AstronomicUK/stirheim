// "Dagger ... 1st free": nearly every equipment list gives each warrior one dagger for nothing.
// The builder and the recruitment resolver both hand it out on arrival, so a fresh warrior is
// never bare by accident.

import { resolveEquipmentName } from "../data/items/aliases";
import { findEquipmentList } from "../data/warbandTemplates";
import type { UnitTemplate, WarbandTemplate } from "../types";
import { parseEquipmentCost } from "./equipmentCost";

export interface FreeDaggerLine {
  /** The list's own wording, e.g. "Dagger". */
  name: string;
  /** The catalogue id ("dagger") when the name resolves. */
  itemId: string | null;
  /** The cost string, e.g. "1st free/2 gc". */
  costText: string;
}

/** The unit's equipment-list line that gives a free dagger, if it has one. */
export function freeDaggerLine(template: WarbandTemplate, unit: UnitTemplate): FreeDaggerLine | null {
  const list = findEquipmentList(template, unit.equipmentListId);
  if (!list) return null;
  for (const entry of list.meleeWeapons) {
    const cost = parseEquipmentCost(entry.cost);
    if (cost.kind !== "firstFree") continue;
    const item = resolveEquipmentName(entry.name);
    if (item?.id === "dagger" || /^dagger$/i.test(entry.name.trim())) {
      return { name: entry.name, itemId: item?.id ?? null, costText: entry.cost };
    }
  }
  return null;
}
