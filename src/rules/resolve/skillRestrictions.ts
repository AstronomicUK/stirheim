// Skill prerequisites and "X only" clauses (Phase 16). Warband skill tables carry their restriction
// text verbatim ("Troll Slayers only", "Requires the Strongman skill", "Only the warband's leader may
// have this skill", "no more than two warriors in the warband may take this skill"). This reads the
// common shapes and says why a hero should not take the skill; the picker shows the reason and lets
// the player take it anyway, on the record. Anything it cannot read stays a plain note.

import { SKILLS } from "../data/skills";
import { WARBAND_SKILL_TABLES } from "../data/campaign/warbandSkills";
import { findUnitTemplate } from "../data/warbandTemplates";
import type { WarbandTemplate } from "../types";
import type { RosterHero, RosterWarband } from "../types/roster";
import { leaderTemplate } from "./roster";

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function singular(word: string): string {
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Does the unit name (e.g. "Troll Slayers") answer to the restriction's subject (e.g. "Slayers", "Troll Slayer")? */
export function unitAnswersTo(unitName: string, subject: string): boolean {
  const unit = normalise(unitName).split(" ").map(singular);
  const words = normalise(subject)
    .split(" ")
    .map(singular)
    .filter((w) => w.length > 2 && !["the", "and", "only", "hero", "heroes", "warband", "with", "may", "this", "skill"].includes(w));
  if (words.length === 0) return false;
  return words.every((w) => unit.some((u) => u === w || u.startsWith(w) || w.startsWith(u)));
}

/** Find a skill id by its printed name, across the core lists and every warband table. */
export function skillIdByName(name: string): string | undefined {
  const key = normalise(name);
  const core = SKILLS.find((s) => normalise(s.name) === key);
  if (core) return core.id;
  for (const table of WARBAND_SKILL_TABLES) {
    const hit = table.skills.find((s) => normalise(s.name) === key);
    if (hit) return hit.id;
  }
  return undefined;
}

export interface SkillRestrictionContext {
  hero: RosterHero;
  roster?: RosterWarband;
  template?: WarbandTemplate;
  skillId?: string;
}

/**
 * Why this hero should not take a skill with this restriction text, or null when the text allows it
 * or says nothing this reader understands.
 */
export function skillRestrictionBlock(restriction: string | undefined, ctx: SkillRestrictionContext): string | null {
  if (!restriction) return null;
  const text = restriction.trim();
  const lower = text.toLowerCase();
  const unit = ctx.template ? findUnitTemplate(ctx.template, ctx.hero.unitTemplateId) : undefined;

  // Prerequisite skills: "Requires the Strongman skill", "with the Rotten Body special skill", "must have the X skill".
  const prereq = /(?:requires?|must (?:already )?have|with) (?:the )?([a-z' -]+?) (?:special |strength |combat |shooting |speed |academic )?(?:skill|ability)/i.exec(text);
  if (prereq) {
    const id = skillIdByName(prereq[1]);
    if (id && !ctx.hero.skillIds.includes(id)) return `Requires ${prereq[1].trim()} first.`;
  }

  // Leader only.
  if (/leader/.test(lower) && /only/.test(lower) && ctx.template) {
    const leader = leaderTemplate(ctx.template);
    if (leader && ctx.hero.unitTemplateId !== leader.id && !/leader skill/.test(lower)) return `Only the warband's leader may take this skill.`;
  }

  // Limits across the warband: "no more than two warriors", "Only one Elven Hero may possess this skill".
  const limit = /(?:no more than|never be more than|more than|only) (one|two|three|1|2|3) (?:elven |dwarf |human )?(?:warriors?|heroes?|elves|dwarfs|models?)/i.exec(text);
  if (limit && ctx.roster && ctx.skillId) {
    const max = { one: 1, two: 2, three: 3, "1": 1, "2": 2, "3": 3 }[limit[1].toLowerCase()] ?? 1;
    const holders = ctx.roster.heroes.filter((h) => h.status === "active" && h.id !== ctx.hero.id && h.skillIds.includes(ctx.skillId!)).length;
    if (holders >= max) return `The warband may only have ${max === 1 ? "one warrior" : `${max} warriors`} with this skill, and it already does.`;
  }

  // Exclusions: "may not be taken by Shadow Weavers", "may not be used by Sisters of Sigmar or Warrior Priests", "The Sorceress may never take this skill".
  const exclusion = /(?:may not be (?:taken|used) by|may never take|cannot be taken by|never take) (?:the )?([a-z' ,-]+?)(?:\.|,| there| and no| the|$)/i.exec(text) ?? /^the ([a-z' -]+?) may never take/i.exec(text);
  if (exclusion && unit) {
    const subjects = exclusion[1].split(/\s+or\s+|,\s*/).map((s) => s.trim()).filter(Boolean);
    if (subjects.some((s) => unitAnswersTo(unit.name, s))) return `${unit.name} may not take this skill.`;
  }

  // "X only" / "Only the X may have this skill" / "only be taken by X" / "This skill is for X only" / "Only for X".
  const only = /^([a-z' -]+?) only!?$/i.exec(text) ?? /^only (?:the |a |for )?([a-z' -]+?)(?: may| can)/i.exec(text) ?? /only be taken by (?:a |an |the )?([a-z' -]+?)(?: with| who| and|\.|$)/i.exec(text) ?? /is for (?:the )?([a-z' -]+?) only/i.exec(text);
  if (only && unit) {
    const subject = only[1].trim();
    if (/leader|spellcaster|warrior capable of casting/i.test(subject)) return null;
    if (!unitAnswersTo(unit.name, subject)) return `${text.replace(/\.$/, "")}: ${unit.name} are not ${subject.replace(/^the /i, "")}.`;
  }
  return null;
}
