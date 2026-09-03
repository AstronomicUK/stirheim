// Magic data model — mordheimer.net Magic section (reference/rules/03-campaigns-magic-optional-rules.md:1447-3501).
// Spell and lore text is kept verbatim; nothing here is mechanically modeled by the engine yet.

import type { RollBand, SourceRef } from "./common";

export interface Spell {
  id: string;
  name: string;
  /**
   * The die value(s) on the lore's random-spell table that generate this spell. Normally a single
   * D6 value ({ min: 3, max: 3 }); Rituals of Hashut has a 0 row, and The Restless Dead's row 6
   * covers two spells (Deathly Visage / Living Horror), which therefore share a band.
   */
  roll: RollBand;
  /** 2D6 target to cast. Null where the source says "Auto" (spells cast automatically, e.g. Spell of Awakening). */
  difficulty: number | null;
  /** Spell text, verbatim, paragraphs separated by blank lines. Inline markdown tables are preserved. */
  text: string;
}

export interface SpellLore {
  id: string;
  name: string;
  sourceUrl: string;
  /** Verbatim paragraphs between the Source line and the random-spell table (includes the "used by" sentence). */
  intro: string;
  /** Wizard descriptions from the Wizard -> Type of Magic table whose Type of Magic is this lore's name. */
  usedBy: string[];
  /** Die rolled on the lore's spell table, as written in the table header ("D6" for every lore so far). */
  die: string;
  spells: Spell[];
  /** Any editorial text between spells or after the last spell that isn't part of a spell (e.g. mordheimer.net's bold-labelled notes). */
  notes?: string;
  source: SourceRef;
}

export interface WizardAllocation {
  /** Row label as written, e.g. "Sisters of Sigmar Sigmarite Matriarch". */
  wizard: string;
  /** Type of Magic column as written. */
  loreName: string;
  /** Resolved SpellLore id where `loreName` matches a lore name exactly; null otherwise. */
  loreId: string | null;
}
