// Warband-specific skill tables (the "Special" column of a warband's skill-access table), extracted
// from reference/rules/warbands/*.md into data/campaign/warbandSkills.ts. The five core lists
// (Combat, Shooting, Academic, Strength, Speed) are the `Skill` catalogue in data/skills.ts — these
// types only cover the extra lists a warband gets on top of, or instead of, those.

import type { SourceRef } from "./common";

export interface WarbandSkill {
  /** snake_case, prefixed with the owning table id so the same skill name in several warbands stays unique, e.g. "dwarf_treasure_hunters_dwarf_skills_true_grit". */
  id: string;
  name: string;
  /** Rule text verbatim from the source. */
  text: string;
  /** Who may take the skill, verbatim, when the source says so — e.g. "Troll Slayers only", "Captain only". */
  restriction?: string;
}

export interface WarbandSkillTable {
  /** e.g. "dwarf_treasure_hunters_dwarf_skills", "dwarf_rangers_slayer_special_skills". */
  id: string;
  /** Heading verbatim from the source, e.g. "Dwarf Skill Table", "Beastmen Special Skills". */
  name: string;
  /** Id of the owning WarbandTemplate (data/warbandTemplates). */
  warbandId: string;
  /** Verbatim text between the heading and the first skill (usually who may use the list). */
  intro?: string;
  skills: WarbandSkill[];
  source: SourceRef;
}
