// Equipment catalogue types — the shopping/inventory view of every entry in
// rules/02-weapons-armour-equipment.md (weapons, armour, miscellaneous equipment, animals).
// Distinct from `Weapon` in ./index, which is the probability engine's mechanical model; an
// `Item` that also exists there links to it via `weaponId`.

import type { Availability, NamedRule, Price, SourceRef } from "./common";

export type ItemCategory = "melee" | "missile" | "blackpowder" | "armour" | "misc" | "animal";

export interface Item {
  /** snake_case from the name, unique across the catalogue; e.g. "light_armour", "club_mace_or_hammer". */
  id: string;
  /** Title-case display name. */
  name: string;
  category: ItemCategory;
  /** "50 + 3D6 gc" -> { base: 50, dice: "3D6", text: "50 + 3D6 gc" }; no Cost line -> base null, text "Not listed". */
  price: Price;
  /** "Common" -> kind common; "Rare 9 (Dwarfs only)" -> kind rare, rarity 9, restriction "Dwarfs only"; anything else -> kind special. */
  availability: Availability;
  /** The prose paragraph(s), verbatim (paragraphs joined with a blank line). */
  description: string;
  /** Verbatim, e.g. "Close Combat", "24\"". */
  range?: string;
  /** Verbatim, e.g. "As user", "3", "As user +1". */
  strength?: string;
  /** From the SPECIAL RULES bullets, verbatim. */
  specialRules: NamedRule[];
  /** id in src/rules/data/weapons if the same item exists there. */
  weaponId?: string;
  /** Publication from the Source field; file is "02-weapons-armour-equipment.md:<start>-<end>". */
  source: SourceRef;
  /** For armour: the save it grants, if the text states one, e.g. 6 for "6+". */
  armourSave?: number;
}
