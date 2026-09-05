// Experience and advance resolvers (post-battle sequence step 2: "Experience").
//
// Pure functions: dice results are inputs, inputs are never mutated, and every state change is
// narrated in `events`. Tables come from data/campaign/experience.ts, skills from data/skills.ts and
// data/campaign/warbandSkills.ts, spells from data/campaign/magic.ts.
//
// Rule judgements made here:
// - Every apply* function that consumes an Advance (stat increase, new skill, new spell) calls
//   recordAdvanceTaken, so `levelUps` climbs by one per advance without the caller remembering.
// - Racial maxima: a hero's profile is found from an exported keyword table + per-warband override
//   map (WARBAND_PROFILE_OVERRIDES). Anything unrecognised falls back to Human with a warning
//   event. Chaos Dwarfs use the Dwarf profile (the source table has no Chaos Dwarf row).
// - eligibleStatChoices: if every offered stat is at its racial maximum the player may take any
//   other characteristic that is not maxed (`fallbackToAny: true`).
// - Henchmen: at most HENCHMAN_MAX_INCREASE_PER_STAT (+1) per characteristic, tracked in
//   `statIncreases`; an increase that is not allowed must be re-rolled (empty eligible list).
// - The lad's got talent: the new hero takes one of each item the group holds. If the group's
//   stack of that item is at least as big as the group (per-model stacks), the stack shrinks by
//   one; a smaller stack is read as a shared loadout descriptor and is left as it is.
// - There is no hero-capacity data on WarbandTemplate yet (TODO): promoteHenchman only enforces
//   the cap when the caller passes `opts.heroCapacity`.

import type { CharacterRole, Skill, Stats } from "../types";
import type { StatKey } from "../types/common";
import type { AdvanceResult, RollBand } from "../types/campaign";
import type { Resolution, ResolutionEvent, RosterHenchmanGroup, RosterHero, RosterItem, RosterWarband } from "../types/roster";
import type { WarbandSkill } from "../types/warbandSkills";
import {
  HENCHMAN_MAX_INCREASE_PER_STAT,
  advancesEarned,
  findRacialMaximum,
  lookupAdvance,
  nextThreshold,
 type AdvanceRate } from "../data/campaign/experience";
import { SKILLS, findSkill } from "../data/skills";
import { WARBAND_SKILL_TABLES, findWarbandSkill, skillTablesForWarband } from "../data/campaign/warbandSkills";
import { findSpell } from "../data/campaign/magic";
import { findUnitTemplate, findWarbandTemplate } from "../data/warbandTemplates/index";
import { RulesError } from "./errors";
import { unitRules } from "../data/campaignRules";
import { STAT_NAMES } from "./injuries";

export const STAT_KEYS: readonly StatKey[] = ["M", "WS", "BS", "S", "T", "W", "I", "A", "Ld"];

/** The five core skill lists every warband draws from. */
export const CORE_SKILL_TABLE_IDS: readonly string[] = ["combat", "shooting", "academic", "strength", "speed"];

/** Token used by the warband templates for "this warband's own special skill list(s)". */
export const WARBAND_UNIQUE_TABLE_ID = "warband-unique";

// ---- Experience thresholds ----

/** Advance rolls earned by moving from `xpBefore` to `xpAfter`. */
export function pendingAdvances(role: CharacterRole, xpBefore: number, xpAfter: number, rate: AdvanceRate = "normal"): number {
  return advancesEarned(xpBefore, xpAfter, role, rate);
}

/** Experience points still needed to reach the next Advance box, or null once the roster sheet runs out. */
export function xpToNextLevel(role: CharacterRole, xp: number, rate: AdvanceRate = "normal"): number | null {
  const next = nextThreshold(xp, role, rate);
  return next === null ? null : next - xp;
}

/** The absolute experience total of the next Advance box, or null once the roster sheet runs out. */
export function nextAdvanceAt(role: CharacterRole, xp: number, rate: AdvanceRate = "normal"): number | null {
  return nextThreshold(xp, role, rate);
}

// ---- Advance rolls ----

export type HeroAdvanceRoll =
  | { kind: "newSkill"; text: string }
  | { kind: "statChoice"; options: StatKey[]; text: string }
  | { kind: "statSubRoll"; die: "D6"; outcomes: { band: RollBand; stat: StatKey }[]; text: string };

export type HenchmanAdvanceRoll =
  | { kind: "statIncrease"; stat: StatKey; text: string }
  | { kind: "statChoice"; options: StatKey[]; text: string }
  | { kind: "ladsGotTalent"; text: string };

function assert2D6(roll: number): void {
  if (!Number.isInteger(roll) || roll < 2 || roll > 12) throw new RangeError(`Not a valid 2D6 result: ${roll}`);
}

function assertD6(roll: number): void {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) throw new RangeError(`Not a valid D6 result: ${roll}`);
}

export function resolveHeroAdvanceRoll(roll2d6: number): HeroAdvanceRoll {
  assert2D6(roll2d6);
  const row: AdvanceResult = lookupAdvance(roll2d6, "hero");
  switch (row.kind) {
    case "newSkill":
      return { kind: "newSkill", text: row.text };
    case "statChoice":
      return { kind: "statChoice", options: [...(row.choice ?? [])], text: row.text };
    case "statSubRoll":
      return { kind: "statSubRoll", die: "D6", outcomes: (row.subRoll ?? []).map((o) => ({ band: { ...o.band }, stat: o.stat })), text: row.text };
    default:
      throw new RangeError(`Hero advance table has an unexpected kind "${row.kind}" at ${roll2d6}`);
  }
}

/** Resolve the D6 follow-up of a hero "Characteristic Increase. Roll again" result. */
export function resolveHeroAdvanceSubRoll(roll2d6: number, d6: number): StatKey {
  assertD6(d6);
  const row = resolveHeroAdvanceRoll(roll2d6);
  if (row.kind !== "statSubRoll") {
    throw new RulesError("NO_SUB_ROLL", `Hero advance ${roll2d6} (${row.kind}) has no follow-up roll`);
  }
  const hit = row.outcomes.find((o) => d6 >= o.band.min && d6 <= o.band.max);
  if (!hit) throw new RangeError(`Hero advance ${roll2d6}: D6 ${d6} matches no band`);
  return hit.stat;
}

export function resolveHenchmanAdvanceRoll(roll2d6: number): HenchmanAdvanceRoll {
  assert2D6(roll2d6);
  const row = lookupAdvance(roll2d6, "henchman");
  switch (row.kind) {
    case "statIncrease":
      if (!row.stat) throw new RangeError(`Henchman advance ${roll2d6} names no stat`);
      return { kind: "statIncrease", stat: row.stat, text: row.text };
    case "statChoice":
      return { kind: "statChoice", options: [...(row.choice ?? [])], text: row.text };
    case "ladsGotTalent":
      return { kind: "ladsGotTalent", text: row.text };
    default:
      throw new RangeError(`Henchman advance table has an unexpected kind "${row.kind}" at ${roll2d6}`);
  }
}

// ---- Racial maximums ----

export interface ProfileKeywordRule {
  /** Tested against the unit template name (first) and the warband's `race` string (later). */
  pattern: RegExp;
  /** RACIAL_MAXIMUMS profile name. */
  profile: string;
  /** Only applies when the warband template id contains this substring. */
  warbandIdIncludes?: string;
}

/**
 * Ordered keyword table: the first matching rule wins, so specific names come before generic ones
 * ("black orc" before "orc", "liche priest" before "liche", "vampire hunter" before "vampire").
 */
export const PROFILE_KEYWORD_RULES: ProfileKeywordRule[] = [
  { pattern: /\bvampire hunters?\b/i, profile: "Human" },
  { pattern: /\bbull centaurs?\b/i, profile: "Bull Centaur (The Sons of Hashut)", warbandIdIncludes: "hashut" },
  { pattern: /\bbull centaurs?\b/i, profile: "Bull Centaur (Black Dwarfs)" },
  { pattern: /\bhobgoblins?\b/i, profile: "Hobgoblin (The Sons of Hashut)" },
  { pattern: /\bblack orcs?\b/i, profile: "Black Orc" },
  { pattern: /\borcs?\b/i, profile: "Orc" },
  { pattern: /\bgoblins?\b/i, profile: "Goblin" },
  { pattern: /\bliche priests?\b/i, profile: "Liche Priest & Acolyte (Tomb Guardians)" },
  { pattern: /\btomb lords?\b/i, profile: "Tomb Lord (Tomb Guardians)" },
  { pattern: /\bliche\b/i, profile: "Liche (Restless Dead)" },
  { pattern: /\bgrave guards?\b/i, profile: "Grave Guard (Restless Dead)" },
  { pattern: /\bvampires?\b/i, profile: "Vampire" },
  { pattern: /\bghouls?\b/i, profile: "Ghoul" },
  { pattern: /\bpossessed\b/i, profile: "Possessed" },
  { pattern: /\bsaurus\b/i, profile: "Saurus" },
  { pattern: /\bskinks?\b/i, profile: "Skink" },
  { pattern: /\bpestilens\b/i, profile: "Skaven (Clan Pestilens)" },
  { pattern: /\bskaven\b/i, profile: "Skaven" },
  { pattern: /\b(elf|elves|elven)\b/i, profile: "Elf" },
  { pattern: /\bdwarfs?\b|\bdwarves\b/i, profile: "Dwarf" }, // Chaos Dwarfs included: no separate row in the source table
  { pattern: /\bogres?\b/i, profile: "Ogre" },
  { pattern: /\bhalflings?\b/i, profile: "Halfling" },
  { pattern: /\bminotaurs?\b/i, profile: "Minotaur" },
  { pattern: /\bcentigors?\b/i, profile: "Centigor" },
  { pattern: /\bungors?\b/i, profile: "Ungor" },
  { pattern: /\b(gors?|bestigors?|beastmen|beastman)\b/i, profile: "Other Beastmen" },
  { pattern: /\bmarauders?\b/i, profile: "Marauder Of Chaos" },
  { pattern: /\b(warriors? of chaos|chaos warriors?)\b/i, profile: "Warrior Of Chaos" },
  { pattern: /\b(wulfen|ulfwerenar|werecreature|werewolf)\b/i, profile: "Werecreature (Norse) Wulfen/Ulfwerenar" },
  { pattern: /\bhumans?\b/i, profile: "Human" },
];

export interface WarbandProfileOverride {
  /** Profile for any hero of this warband not matched by `units` or a unit-name keyword. */
  default?: string;
  /** Unit template id or unit template name -> profile. Checked before the keyword table. */
  units?: Record<string, string>;
}

/**
 * Per-warband corrections where the keyword table gets it wrong. Keyed by WarbandTemplate id.
 * Extend this as rosters are imported rather than growing the keyword table.
 */
export const WARBAND_PROFILE_OVERRIDES: Record<string, WarbandProfileOverride> = {
  amazons_lustria: { default: "Human" },
  amazons_mordheim: { default: "Human" },
  black_orcs: { default: "Black Orc" },
  forest_goblins: { default: "Goblin" },
  skaven_of_clan_pestilens: { default: "Skaven (Clan Pestilens)" },
  marauders_of_chaos: { default: "Marauder Of Chaos" },
  lustrian_reavers: { default: "Human", units: { "Saurus Slayer": "Human", "Reaver Beastmaster": "Human" } },
  necrarchs_the_soul_stealers: { default: "Human", units: { Thrall: "Human", Acolytes: "Human" } },
  tomb_guardians: { units: { Acolyte: "Liche Priest & Acolyte (Tomb Guardians)" } },
  the_restless_dead: { default: "Human" },
  the_restless_dead_variant: { default: "Human" },
  masters_of_horror: { units: { Wolfman: "Werecreature (Norse) Wulfen/Ulfwerenar" } },
  snotlings: { default: "Goblin" },
  ogre_hunting_party: { default: "Ogre" },
};

export interface RacialProfileMatch {
  profile: string;
  maxima: Stats;
  /** How the profile was chosen, for the UI/debugging. */
  matchedBy: "unitOverride" | "unitName" | "warbandDefault" | "raceString" | "fallback";
}

function matchKeyword(text: string, warbandId: string): string | undefined {
  for (const rule of PROFILE_KEYWORD_RULES) {
    if (rule.warbandIdIncludes && !warbandId.includes(rule.warbandIdIncludes)) continue;
    if (rule.pattern.test(text)) return rule.profile;
  }
  return undefined;
}

/** Work out which RACIAL_MAXIMUMS profile caps a hero, with a warning event when we had to guess. */
export function resolveRacialProfile(hero: RosterHero, warbandTemplateId: string): Resolution<RacialProfileMatch> {
  const template = findWarbandTemplate(warbandTemplateId);
  const unit = template ? findUnitTemplate(template, hero.unitTemplateId) : undefined;
  const unitName = unit?.name ?? hero.name;
  const override = WARBAND_PROFILE_OVERRIDES[warbandTemplateId];
  const events: ResolutionEvent[] = [];

  let profile: string | undefined;
  let matchedBy: RacialProfileMatch["matchedBy"] = "fallback";

  const unitOverride = unitRules(hero.unitTemplateId).racialProfile ?? override?.units?.[hero.unitTemplateId] ?? override?.units?.[unitName];
  if (unitOverride) {
    profile = unitOverride;
    matchedBy = "unitOverride";
  }
  if (!profile) {
    profile = matchKeyword(unitName, warbandTemplateId);
    if (profile) matchedBy = "unitName";
  }
  if (!profile && override?.default) {
    profile = override.default;
    matchedBy = "warbandDefault";
  }
  if (!profile && template) {
    // Mixed-race warbands list their non-human members by unit name (handled above), so any
    // "Human" in the race string means the remaining heroes are human.
    profile = /\bhumans?\b/i.test(template.race) ? "Human" : matchKeyword(template.race, warbandTemplateId);
    if (profile) matchedBy = "raceString";
  }
  if (!profile) {
    profile = "Human";
    matchedBy = "fallback";
    events.push({
      kind: "warning",
      subjectId: hero.id,
      message: `Could not determine a racial maximum profile for ${hero.name} (${unitName}, warband ${warbandTemplateId}); using Human. Add an entry to WARBAND_PROFILE_OVERRIDES to correct this.`,
      data: { unitName, warbandTemplateId },
    });
  }

  const row = findRacialMaximum(profile);
  if (!row) {
    // A mapping table entry names a profile the data does not have: fall back loudly.
    events.push({ kind: "warning", subjectId: hero.id, message: `Racial profile "${profile}" is not in RACIAL_MAXIMUMS; using Human for ${hero.name}.`, data: { profile } });
    const human = findRacialMaximum("Human");
    if (!human) throw new RangeError("RACIAL_MAXIMUMS has no Human row");
    return { value: { profile: "Human", maxima: { ...human.stats }, matchedBy: "fallback" }, events };
  }
  return { value: { profile: row.profile, maxima: { ...row.stats }, matchedBy }, events };
}

/** Racial maximum characteristics for a hero (Human when the race cannot be determined). */
export function racialMaximumFor(hero: RosterHero, warbandTemplateId: string): Stats {
  return resolveRacialProfile(hero, warbandTemplateId).value.maxima;
}

// ---- Applying advances ----

/** Count one Advance as taken. Called by every apply* function below; callers rarely need it directly. */
export function recordAdvanceTaken<T extends { levelUps: number }>(x: T): T {
  return { ...x, levelUps: x.levelUps + 1 };
}

export function applyStatIncrease(hero: RosterHero, stat: StatKey, maxima: Stats): Resolution<RosterHero> {
  const before = hero.stats[stat];
  if (before >= maxima[stat]) {
    throw new RulesError("AT_RACIAL_MAX", `${hero.name}: ${STAT_NAMES[stat]} is already at its racial maximum of ${maxima[stat]}`);
  }
  const after = before + 1;
  const next = recordAdvanceTaken({ ...hero, stats: { ...hero.stats, [stat]: after } });
  return {
    value: next,
    events: [
      { kind: "statChange", subjectId: hero.id, message: `${hero.name}: ${STAT_NAMES[stat]} ${before} -> ${after}.`, data: { stat, before, after } },
      { kind: "advanceTaken", subjectId: hero.id, message: `${hero.name} has taken ${next.levelUps} advance${next.levelUps === 1 ? "" : "s"}.`, data: { levelUps: next.levelUps } },
    ],
  };
}

export interface StatChoiceEligibility {
  /** Stats the player may increase. */
  options: StatKey[];
  /** True when none of the offered stats could be raised, so `options` is every other non-maxed stat. */
  fallbackToAny: boolean;
}

/** Filter an offered stat choice by racial maximum; if every offered stat is maxed, any non-maxed stat may be taken. */
export function eligibleStatChoices(hero: RosterHero, options: StatKey[], maxima: Stats): StatChoiceEligibility {
  const open = (s: StatKey) => hero.stats[s] < maxima[s];
  const eligible = options.filter(open);
  if (eligible.length > 0) return { options: eligible, fallbackToAny: false };
  return { options: STAT_KEYS.filter((s) => !options.includes(s) && open(s)), fallbackToAny: true };
}

export function applyHenchmanStatIncrease(group: RosterHenchmanGroup, stat: StatKey): Resolution<RosterHenchmanGroup> {
  const taken = group.statIncreases[stat] ?? 0;
  if (taken >= HENCHMAN_MAX_INCREASE_PER_STAT) {
    throw new RulesError("HENCHMAN_STAT_CAPPED", `${group.name}: ${STAT_NAMES[stat]} has already been increased (henchmen may never add more than +${HENCHMAN_MAX_INCREASE_PER_STAT} to a characteristic); roll again`);
  }
  const before = group.stats[stat];
  const after = before + 1;
  const next = recordAdvanceTaken({
    ...group,
    stats: { ...group.stats, [stat]: after },
    statIncreases: { ...group.statIncreases, [stat]: taken + 1 },
  });
  return {
    value: next,
    events: [
      { kind: "statChange", subjectId: group.id, message: `${group.name} (all ${group.size}): ${STAT_NAMES[stat]} ${before} -> ${after}.`, data: { stat, before, after } },
      { kind: "advanceTaken", subjectId: group.id, message: `${group.name} has taken ${next.levelUps} advance${next.levelUps === 1 ? "" : "s"}.`, data: { levelUps: next.levelUps } },
    ],
  };
}

/**
 * Which of the offered stats a henchman group may still increase. Empty means the roll must be
 * re-rolled ("roll again until an unincreased characteristic is rolled"). Pass `maxima` to also
 * respect a racial maximum.
 */
export function eligibleHenchmanStats(group: RosterHenchmanGroup, options: StatKey[], maxima?: Stats): StatKey[] {
  return options.filter((s) => (group.statIncreases[s] ?? 0) < HENCHMAN_MAX_INCREASE_PER_STAT && (!maxima || group.stats[s] < maxima[s]));
}

// ---- Skills and spells ----

interface ResolvedSkill {
  id: string;
  name: string;
  description: string;
  /** Skill table the skill belongs to: a core category, "warband-unique", or a WarbandSkillTable id. */
  tableId: string;
  /** Owning warband for warband-specific skills. */
  warbandId?: string;
  restriction?: string;
}

function resolveSkill(skillId: string): ResolvedSkill | undefined {
  const core = findSkill(skillId);
  if (core) return { id: core.id, name: core.name, description: core.description, tableId: core.category };
  const found = findWarbandSkill(skillId);
  if (found) {
    return {
      id: found.skill.id,
      name: found.skill.name,
      description: found.skill.text,
      tableId: found.table.id,
      warbandId: found.table.warbandId,
      ...(found.skill.restriction ? { restriction: found.skill.restriction } : {}),
    };
  }
  return undefined;
}

function heroMayUseTable(hero: RosterHero, skill: ResolvedSkill, warbandTemplateId?: string): boolean {
  if (hero.skillTableIds.includes(skill.tableId)) return true;
  // Templates say "warband-unique" rather than naming the table; accept any warband skill table
  // in that case, restricted to the hero's own warband when we know it.
  if (skill.warbandId && hero.skillTableIds.includes(WARBAND_UNIQUE_TABLE_ID)) {
    return !warbandTemplateId || skill.warbandId === warbandTemplateId;
  }
  return false;
}

/**
 * Learn a skill as an Advance.
 * - `allSkillIds`, when given, is the caller's full skill universe (e.g. including custom skills).
 *   A skill in that set that the catalogues do not know is accepted without a table check.
 * - `opts.warbandTemplateId` tightens "warband-unique" to the hero's own warband tables.
 */
export function learnSkill(
  hero: RosterHero,
  skillId: string,
  allSkillIds?: Set<string>,
  opts?: { warbandTemplateId?: string },
): Resolution<RosterHero> {
  if (hero.skillIds.includes(skillId)) {
    throw new RulesError("SKILL_KNOWN", `${hero.name} already has the skill "${skillId}"`);
  }
  const skill = resolveSkill(skillId);
  const events: ResolutionEvent[] = [];
  let label = skillId;
  if (skill) {
    if (!heroMayUseTable(hero, skill, opts?.warbandTemplateId)) {
      throw new RulesError("SKILL_TABLE_NOT_AVAILABLE", `${hero.name} may not pick from the "${skill.tableId}" skill table (available: ${hero.skillTableIds.join(", ") || "none"})`);
    }
    label = skill.name;
  } else if (allSkillIds?.has(skillId)) {
    events.push({ kind: "warning", subjectId: hero.id, message: `"${skillId}" is not in the skill catalogues; learned as a custom skill without a table check.`, data: { skillId } });
  } else {
    throw new RulesError("UNKNOWN_SKILL", `No skill with id "${skillId}" exists`);
  }
  const next = recordAdvanceTaken({ ...hero, skillIds: [...hero.skillIds, skillId] });
  events.push(
    { kind: "skillLearned", subjectId: hero.id, message: `${hero.name} learns ${label}.`, data: { skillId, tableId: skill?.tableId } },
    { kind: "advanceTaken", subjectId: hero.id, message: `${hero.name} has taken ${next.levelUps} advance${next.levelUps === 1 ? "" : "s"}.`, data: { levelUps: next.levelUps } },
  );
  return { value: next, events };
}

export interface AvailableSkill {
  id: string;
  name: string;
  /** Plain-English description (core skills) or verbatim rule text (warband skills). */
  description: string;
  restriction?: string;
}

export interface AvailableSkillTable {
  tableId: string;
  tableName: string;
  skills: AvailableSkill[];
}

const CORE_TABLE_NAMES: Record<string, string> = {
  combat: "Combat Skills",
  shooting: "Shooting Skills",
  academic: "Academic Skills",
  strength: "Strength Skills",
  speed: "Speed Skills",
};

function coreSkillEntry(s: Skill): AvailableSkill {
  return { id: s.id, name: s.name, description: s.description };
}

function warbandSkillEntry(s: WarbandSkill): AvailableSkill {
  return { id: s.id, name: s.name, description: s.text, ...(s.restriction ? { restriction: s.restriction } : {}) };
}

/**
 * Skills the hero could learn right now, grouped by table, for the UI. Pass `warbandTemplateId` so
 * "warband-unique" resolves to that warband's own skill tables (without it, only the core
 * warband-unique entries in data/skills.ts are listed under that heading).
 */
export function availableSkills(hero: RosterHero, warbandTemplateId?: string): AvailableSkillTable[] {
  const known = new Set(hero.skillIds);
  const tables: AvailableSkillTable[] = [];
  for (const tableId of hero.skillTableIds) {
    if (CORE_SKILL_TABLE_IDS.includes(tableId)) {
      tables.push({
        tableId,
        tableName: CORE_TABLE_NAMES[tableId],
        skills: SKILLS.filter((s) => s.category === tableId && !known.has(s.id)).map(coreSkillEntry),
      });
    } else if (tableId === WARBAND_UNIQUE_TABLE_ID) {
      if (warbandTemplateId) {
        for (const t of skillTablesForWarband(warbandTemplateId)) {
          tables.push({ tableId: t.id, tableName: t.name, skills: t.skills.filter((s) => !known.has(s.id)).map(warbandSkillEntry) });
        }
      } else {
        tables.push({
          tableId,
          tableName: "Warband Skills",
          skills: SKILLS.filter((s) => s.category === WARBAND_UNIQUE_TABLE_ID && !known.has(s.id)).map(coreSkillEntry),
        });
      }
    } else {
      const t = WARBAND_SKILL_TABLES.find((w) => w.id === tableId);
      if (t) tables.push({ tableId: t.id, tableName: t.name, skills: t.skills.filter((s) => !known.has(s.id)).map(warbandSkillEntry) });
    }
  }
  // Drop duplicate tables (a hero listing both "warband-unique" and an explicit table id).
  const seen = new Set<string>();
  return tables.filter((t) => (seen.has(t.tableId) ? false : (seen.add(t.tableId), true)));
}

/**
 * Learn a spell instead of a skill (wizards). With a `loreId` the spell must exist in that lore;
 * pass null to record a spell the catalogue does not have (custom / house lore).
 */
export function learnSpell(hero: RosterHero, loreId: string | null, spellId: string): Resolution<RosterHero> {
  if (hero.spellIds.includes(spellId)) {
    throw new RulesError("SPELL_KNOWN", `${hero.name} already knows the spell "${spellId}"`);
  }
  let label = spellId;
  const events: ResolutionEvent[] = [];
  if (loreId !== null) {
    const spell = findSpell(loreId, spellId);
    if (!spell) throw new RulesError("UNKNOWN_SPELL", `No spell "${spellId}" in lore "${loreId}"`);
    label = spell.name;
  } else {
    events.push({ kind: "warning", subjectId: hero.id, message: `Spell "${spellId}" recorded without lore validation.`, data: { spellId } });
  }
  const next = recordAdvanceTaken({ ...hero, spellIds: [...hero.spellIds, spellId] });
  events.push(
    { kind: "spellLearned", subjectId: hero.id, message: `${hero.name} learns the spell ${label}.`, data: { spellId, loreId } },
    { kind: "advanceTaken", subjectId: hero.id, message: `${hero.name} has taken ${next.levelUps} advance${next.levelUps === 1 ? "" : "s"}.`, data: { levelUps: next.levelUps } },
  );
  return { value: next, events };
}

// ---- The lad's got talent ----

/** Skill tables a new hero of this warband may be given: the five core lists plus the warband's own. */
export function allowedSkillTablesFor(warbandTemplateId: string): string[] {
  const ids = new Set<string>(CORE_SKILL_TABLE_IDS);
  for (const t of skillTablesForWarband(warbandTemplateId)) ids.add(t.id);
  const template = findWarbandTemplate(warbandTemplateId);
  if (template) {
    for (const h of template.heroTemplates) for (const t of h.skillTableIds) ids.add(t);
  }
  return [...ids];
}

/** Split one of each item off a group's equipment for a promoted member (see file header for the stack rule). */
function splitEquipment(group: RosterHenchmanGroup): { heroItems: RosterItem[]; groupItems: RosterItem[] } {
  const heroItems: RosterItem[] = [];
  const groupItems: RosterItem[] = [];
  for (const item of group.equipment) {
    if (item.quantity < 1) continue;
    heroItems.push({ ...item, quantity: 1 });
    if (item.quantity >= group.size) {
      if (item.quantity - 1 > 0) groupItems.push({ ...item, quantity: item.quantity - 1 });
    } else {
      groupItems.push({ ...item });
    }
  }
  return { heroItems, groupItems };
}

/**
 * "The lad's got talent": one member of a henchman group becomes a Hero of the same type, keeping
 * his experience, advances and characteristic increases. The caller chooses two skill tables from
 * `allowedSkillTablesFor(warband.warbandTemplateId)`. The new hero may immediately roll once on the
 * Heroes Advance table; the remaining group members re-roll their own advance (re-rolling 10-12).
 */
export function promoteHenchman(
  warband: RosterWarband,
  groupId: string,
  newHeroName: string,
  skillTableIds: string[],
  newHeroId: string,
  opts?: { heroCapacity?: number },
): Resolution<RosterWarband> {
  const group = warband.henchmenGroups.find((g) => g.id === groupId);
  if (!group) throw new RulesError("UNKNOWN_GROUP", `No henchman group "${groupId}" in ${warband.name}`);
  if (group.size < 1) throw new RulesError("EMPTY_GROUP", `${group.name} has no members to promote`);
  if (warband.heroes.some((h) => h.id === newHeroId)) throw new RulesError("DUPLICATE_ID", `Hero id "${newHeroId}" is already in use`);

  const unique = [...new Set(skillTableIds)];
  if (unique.length !== 2 || skillTableIds.length !== 2) {
    throw new RulesError("SKILL_TABLE_COUNT", `A new hero must be given exactly two different skill tables (got ${skillTableIds.length})`);
  }
  const allowed = allowedSkillTablesFor(warband.warbandTemplateId);
  const bad = unique.filter((t) => !allowed.includes(t));
  if (bad.length > 0) {
    throw new RulesError("INVALID_SKILL_TABLES", `Skill table(s) not available to heroes of this warband: ${bad.join(", ")} (allowed: ${allowed.join(", ")})`);
  }

  // TODO: enforce the warband's hero maximum from the WarbandTemplate once that data exists
  // (only `opts.heroCapacity` is checked today). The rule: "If you already have the maximum
  // number of Heroes, roll again."
  const activeHeroes = warband.heroes.filter((h) => h.status === "active").length;
  if (opts?.heroCapacity !== undefined && activeHeroes >= opts.heroCapacity) {
    throw new RulesError("HERO_CAP", `${warband.name} already has the maximum number of heroes (${opts.heroCapacity}); roll again`);
  }

  const { heroItems, groupItems } = splitEquipment(group);
  const hero: RosterHero = {
    id: newHeroId,
    name: newHeroName,
    unitTemplateId: group.unitTemplateId,
    stats: { ...group.stats },
    xp: group.xp,
    levelUps: group.levelUps,
    skillTableIds: [...unique],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: heroItems,
    ...(group.isLarge ? { isLarge: true } : {}),
    status: "active",
    notes: `Promoted from ${group.name} (The lad's got talent).`,
  };

  const newSize = group.size - 1;
  const remaining: RosterHenchmanGroup | null = newSize > 0 ? { ...group, size: newSize, equipment: groupItems } : null;
  const henchmenGroups = remaining
    ? warband.henchmenGroups.map((g) => (g.id === groupId ? remaining : g))
    : warband.henchmenGroups.filter((g) => g.id !== groupId);

  const events: ResolutionEvent[] = [
    {
      kind: "heroPromoted",
      subjectId: hero.id,
      message: `The lad's got talent! ${newHeroName} leaves ${group.name} and becomes a Hero with ${group.xp} Experience, skill tables: ${unique.join(", ")}. Takes: ${heroItems.length ? heroItems.map((i) => i.customName ?? i.itemId).join(", ") : "nothing"}.`,
      data: { groupId, heroId: hero.id, xp: group.xp, skillTableIds: unique },
    },
    { kind: "advanceDue", subjectId: hero.id, message: `${newHeroName} may immediately roll once on the Heroes Advance table.` },
  ];
  if (remaining) {
    events.push({
      kind: "groupShrunk",
      subjectId: group.id,
      message: `${group.name}: ${group.size} -> ${newSize}. The remaining members roll again for their advance, re-rolling any 10-12.`,
      data: { before: group.size, after: newSize },
    });
  } else {
    events.push({ kind: "groupDisbanded", subjectId: group.id, message: `${group.name} has no members left and is removed from the roster.` });
  }

  return { value: { ...warband, heroes: [...warband.heroes, hero], henchmenGroups }, events };
}
