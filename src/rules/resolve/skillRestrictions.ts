// Skill prerequisites and "X only" clauses (Phase 16). Warband skill tables carry their restriction
// text verbatim ("Troll Slayers only", "Requires the Strongman skill", "Only the warband's leader may
// have this skill", "no more than two warriors in the warband may take this skill"). This reads the
// common shapes and says why a hero should not take the skill; the picker shows the reason and lets
// the player take it anyway, on the record. Anything it cannot read stays a plain note.

import { loreForCaster, PRAYER_LORE_IDS } from "./casting";
import { warbandRules } from "../data/campaignRules";
import { SPELL_LORES } from "../data/campaign/magic";
import { SKILLS } from "../data/skills";
import { WARBAND_SKILL_TABLES } from "../data/campaign/warbandSkills";
import { findUnitTemplate } from "../data/warbandTemplates";
import type { WarbandTemplate } from "../types";
import type { RosterHero, RosterWarband } from "../types/roster";
import { currentLeader, leaderTemplate } from "./roster";

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function singular(word: string): string {
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Restriction subjects whose unit names say something else: which unit ids they mean. */
export const SUBJECT_UNITS: Record<string, string[]> = {
  gnoblars: ["ogre_hunting_party_trappers", "ogre_hunting_party_sabre_baiter"],
  ogres: ["ogre_hunting_party_ogre_hunter", "maneaters_captain", "maneaters_youngbloods", "maneaters_mountain_guide", "ostlander_elder"],
  slayers: ["dwarf_slayer_cult_giant_slayer", "dwarf_slayer_cult_doomseeker_hero", "dwarf_slayer_cult_troll_slayers", "dwarf_treasure_hunters_troll_slayers", "dwarf_rangers_troll_slayer"],
  "troll slayers": ["dwarf_slayer_cult_giant_slayer", "dwarf_slayer_cult_doomseeker_hero", "dwarf_slayer_cult_troll_slayers", "dwarf_treasure_hunters_troll_slayers", "dwarf_rangers_troll_slayer"],
  "night goblin big boss": ["night_goblins_big_boss"],
  "halfling thieves": ["mootlanders_halfling_thief", "halflings_thief_hero"],
  "scout and promoted runts": ["snotling_scouts", "bigsnotz"],
  skinks: ["lizardmen_skink_priest", "lizardmen_skink_great_crest", "lizardmen_skink_brave"],
  saurus: ["lizardmen_saurus_totem_warrior", "lizardmen_saurus_brave"],
  "warrior priest": ["warrior_priest", "witch_hunters_warrior_priest"],
  "squig herders": ["night_goblins_web_squig_herder"],
  "strigany heroes": ["seer", "domnu"],
  "strigoi vampire": ["strigoi_vampire"],
  rememberer: ["dwarf_slayer_cult_rememberer_hero"],
  dreamer: ["dreamwalkers_dreamer"],
  shinobi: ["nipponese_shinobi_hero"],
  "shadow weavers": ["shadow_warriors_shadow_weaver"],
  matriarch: ["sisters_of_sigmar_matriarch"],
  "beastmen chief": ["beastmen_chieftain"],
  "questing knight": ["bretonnian_knights_questing_knight", "bretonnian_questing_knight"],
  stormvermin: ["stormvermin"],
  snotlings: ["bigsnotz", "snotling_scouts", "snotling_shaman"],
};

/** Does the unit answer to the restriction's subject, by an explicit id list first, then by name? */
export function unitMatches(unitId: string, unitName: string, subject: string): boolean {
  const key = normalise(subject).replace(/\bonly\b/g, "").trim();
  const listed = SUBJECT_UNITS[key] ?? SUBJECT_UNITS[singular(key)];
  if (listed) return listed.includes(unitId);
  return unitAnswersTo(unitName, subject);
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

/** Printed core eligibility clauses. These annotate the picker, never remove its override. */
export const CORE_SKILL_RESTRICTIONS: Record<string, string> = {
  battle_tongue: "Only the warband leader may take this skill. Undead leaders may not use it.",
  sorcery: "Only spellcasting Heroes may take this skill. Sisters of Sigmar and Warrior Priests may not use it.",
  warrior_wizard: "Only spellcasters may take this skill.",
  arcane_lore: "Witch Hunters, Sisters of Sigmar and Warrior Priests may not take this skill.",
};

function spellcaster(ctx: SkillRestrictionContext): boolean {
  const prayer = (id: string) => (PRAYER_LORE_IDS as readonly string[]).includes(id);
  if (SPELL_LORES.some(lore => !prayer(lore.id) && lore.spells.some(spell => ctx.hero.spellIds.includes(spell.id)))) return true;
  const unit = ctx.template && findUnitTemplate(ctx.template, ctx.hero.unitTemplateId);
  const lore = loreForCaster(ctx.hero, ctx.template?.name, unit?.name);
  return Boolean(lore && !prayer(lore.id)) || Boolean(unit?.specialRules.some(rule => /^wizard$/i.test(rule.name)));
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

  if ((ctx.skillId === 'sorcery' || ctx.skillId === 'sorcerous_society_additional_academic_skills_magical_aptitude') && (ctx.template?.id === 'sisters_of_sigmar' || unitMatches(ctx.hero.unitTemplateId, unit?.name ?? '', 'warrior priest'))) return 'Sisters of Sigmar and Warrior Priests may not take this skill.';
  if (ctx.skillId === 'arcane_lore' && (['witch_hunters', 'sisters_of_sigmar'].includes(ctx.template?.id ?? '') || unitMatches(ctx.hero.unitTemplateId, unit?.name ?? '', 'warrior priest'))) return 'Witch Hunters, Sisters of Sigmar and Warrior Priests may not take Arcane Lore.';
  if (ctx.skillId === 'battle_tongue' && (warbandRules(ctx.template?.id ?? '').undeadUnitIds?.includes(ctx.hero.unitTemplateId) || /vampire|necrarch|strigoi/i.test(ctx.hero.unitTemplateId) || unit?.specialRules.some(rule => /^undead$/i.test(rule.name)))) return 'Undead leaders may not use Battle Tongue.';
  if (/only/.test(lower) && /spellcast|capable of casting spells/.test(lower) && !spellcaster(ctx)) return 'Only a warrior capable of casting spells may take this skill; prayers alone do not qualify.';
  if (ctx.skillId === 'black_orcs_skills_proven_warrior' && ctx.hero.xp < 25) return "Proven Warrior requires at least 25 Experience and the purchased Black Orc Blood upgrade.";
  if (ctx.skillId === 'black_orcs_skills_proven_warrior' && !ctx.hero.flags.blackOrcBlood) return "Proven Warrior requires the 10 gc Black Orc Blood upgrade. No purchase is recorded for this Young’un.";

  // Prerequisite skills: "Requires the Strongman skill", "with the Rotten Body special skill", "must have the X skill".
  const prereq = /(?:requires?|must (?:already )?have|with) (?:the )?([a-z' -]+?) (?:special |strength |combat |shooting |speed |academic )?(?:skill|ability)/i.exec(text);
  if (prereq) {
    const id = skillIdByName(prereq[1]);
    if (id && !ctx.hero.skillIds.includes(id)) return `Requires ${prereq[1].trim()} first.`;
  }

  // Leader only. ("...with the leader skill" means the leader role, not a takeable skill: no such skill exists in the catalogue.)
  if (/leader/.test(lower) && /only/.test(lower) && ctx.template) {
    const leader = leaderTemplate(ctx.template);
    if (leader && (ctx.roster ? currentLeader(ctx.roster.heroes, ctx.template)?.id !== ctx.hero.id : ctx.hero.unitTemplateId !== leader.id && !ctx.hero.flags.temporaryLeader && ctx.hero.flags.leaderRoleId !== leader.id)) return `Only the warband's leader may take this skill.`;
  }

  // Limits across the warband: "no more than two warriors", "Only one Elven Hero may possess this skill",
  // "A warband may only contain one pathfinder" (a role name standing in for the noun), "may be taken only once".
  const limit =
    /(?:no more than|never be more than|more than|only|may only contain|may contain no more than) (one|two|three|1|2|3)(?: (?:elven |dwarf |human )?(?:warriors?|heroes?|elves|dwarfs|models?|[a-z]+))?/i.exec(text) ??
    /(?:may be taken|taken|used) only once\b/i.exec(text);
  if (limit && ctx.roster && ctx.skillId) {
    const max = limit[1] ? ({ one: 1, two: 2, three: 3, "1": 1, "2": 2, "3": 3 }[limit[1].toLowerCase()] ?? 1) : 1;
    const holders = ctx.roster.heroes.filter((h) => h.status === "active" && h.id !== ctx.hero.id && h.skillIds.includes(ctx.skillId!)).length;
    const message = holders >= max ? `The warband may only have ${max === 1 ? "one warrior" : `${max} warriors`} with this skill, and it already does.` : null;
    // A clause that IS the whole restriction (matched at the very start of the text) is fully handled
    // here; don't let its own "only N ..." phrasing also be reinterpreted by the "X only" check below
    // as if it named a unit type. A clause combined with a separate exclusion elsewhere in the text
    // (e.g. "The Sorceress may never take this skill and no more than two Elves...") falls through.
    if (limit.index === 0) return message;
    if (message) return message;
  }

  // Exclusions: "The Sorceress may never take this skill" (checked first: more specific, so its
  // trailing clause doesn't get swallowed by the general pattern below), "may not be taken by Shadow
  // Weavers", "may not be used by Sisters of Sigmar or Warrior Priests".
  const exclusion = /^the ([a-z' -]+?) may never take/i.exec(text) ?? /(?:may not be (?:taken|used) by|may never take|cannot be taken by|never take) (?:the )?([a-z' ,-]+?)(?:\.|,| there| and no| the|$)/i.exec(text);
  if (exclusion && unit) {
    const subjects = exclusion[1].split(/\s+or\s+|,\s*/).map((s) => s.trim()).filter(Boolean);
    if (subjects.some((s) => unitMatches(unit.id, unit.name, s))) return `${unit.name} may not take this skill.`;
  }

  // "X only" / "Only the X may have this skill" / "only be taken by X" / "This skill is for X only" / "Only for X".
  const only =
    /^([a-z' -]+?) only!?$/i.exec(text) ??
    /^only (?:the |a |for )?([a-z' -]+?)(?: may| can)/i.exec(text) ??
    /only be taken by (?:a |an |the )?([a-z' -]+?)(?: with| who| and|\.|$)/i.exec(text) ??
    /is for (?:the )?([a-z' -]+?) only/i.exec(text) ??
    /^only for (?:the )?([a-z' -]+?)\.?$/i.exec(text);
  if (only && unit) {
    const subject = only[1].trim();
    if (/leader|spellcast|warrior capable of casting/i.test(subject)) return null;
    if (!unitMatches(unit.id, unit.name, subject)) return `${text.replace(/\.$/, "")}: ${unit.name} are not ${subject.replace(/^the /i, "")}.`;
  }
  return null;
}
