// Skill Gain Analyser — ranks a character's eligible, not-yet-taken skills by how they change the
// cumulative per-phase chain (chain.ts) in one of two roles: Attacking (the character attacks the
// reference opponent) or Defending (a synthetic opponent — a WS/S/BS set plus one weapon — attacks
// the character). A defensive skill whose effect isn't specific to melee or ranged (Thick Skull,
// True Grit) shows under both phases. The chain's "stunned or worse" / "knocked down or worse"
// columns are what let a skill that turns Stunned into Knocked Down (Thick Skull, True Grit, a
// helmet) show its value even when it never changes the Out of Action chance (01:955).

import type { Character, CombatContext, DefenderProfile, HouseRules, Skill, SkillCategory, SkillEffectType, Weapon, WeaponKind } from "../types";
import { defaultHouseRules } from "../types";
import { SKILLS } from "../data/skills";
import type { OpponentScenario } from "../domain/opponentScenario";
import { characterToDefenderProfile, opponentScenarioToDefenderProfile } from "../domain/opponentScenario";
import { phaseChain, type PhaseChain } from "./chain";

export type SkillSensitivityCategory = "offMelee" | "defMelee" | "offRanged" | "defRanged";

export function categoryFor(role: "offensive" | "defensive", phase: WeaponKind): SkillSensitivityCategory {
  if (role === "offensive") return phase === "melee" ? "offMelee" : "offRanged";
  return phase === "melee" ? "defMelee" : "defRanged";
}

type Role = "offensive" | "defensive";

const DEFENSIVE_EFFECT_TYPES: SkillEffectType[] = ["extraSaveThreshold", "stunAvoidance", "injuryChartRemap", "armourSaveModifier", "parryImprovement"];
const OFFENSIVE_EFFECT_TYPES: SkillEffectType[] = [
  "injuryRollModifier",
  "attackCountModifier",
  "critTableRollModifier",
  "rerollToHit",
  "rerollToWound",
  "ignoresModifier",
  "rangeExtension",
  "toHitModifier",
  "toWoundModifier",
  "pitFighter",
];

export function skillRole(skill: Skill): Role | undefined {
  const { type, appliesToParticipant } = skill.effect;
  if (type === "statModifier") return appliesToParticipant === "opponent" ? "defensive" : "offensive";
  if (DEFENSIVE_EFFECT_TYPES.includes(type)) return "defensive";
  if (OFFENSIVE_EFFECT_TYPES.includes(type)) return "offensive";
  return undefined; // notModeled etc — excluded from sensitivity candidates
}

function matchesCategory(skill: Skill, category: SkillSensitivityCategory): boolean {
  if (!skill.modeled) return false;
  const role = skillRole(skill);
  if (!role) return false;
  const appliesTo = skill.effect.appliesTo;

  switch (category) {
    case "offMelee":
      return role === "offensive" && (appliesTo === "melee" || appliesTo === "both" || appliesTo === undefined);
    case "defMelee":
      return role === "defensive" && (appliesTo === "melee" || appliesTo === "both" || appliesTo === undefined);
    case "offRanged":
      return role === "offensive" && (appliesTo === "ranged" || appliesTo === "both");
    case "defRanged":
      return role === "defensive" && (appliesTo === "ranged" || appliesTo === "both" || appliesTo === undefined);
  }
}

/** Skills this character can actually pick: restricted to their skill lists when known. Unknown/empty = no restriction. */
export function skillAvailableTo(skill: Skill, character: Character): boolean {
  if (character.skills.includes(skill.id)) return false;
  const tables: SkillCategory[] | undefined = character.skillTableIds;
  if (!tables || tables.length === 0) return true;
  return tables.includes(skill.category);
}

export interface SkillSensitivityRow {
  skill: Skill;
  /** The chain with this skill added (attacking: character's chain; defending: the opponent's chain against the character). */
  chain: PhaseChain;
}

export interface SkillSensitivityResult {
  /** The chain as things stand. */
  baseline: PhaseChain;
  /** Whether lower numbers are better (defending) or higher (attacking). */
  role: Role;
  rows: SkillSensitivityRow[];
}

export { characterToDefenderProfile };

/** A minimal synthetic "attacker" for defensive testing — not a saved character, just enough to swing a weapon: WS/BS/S from the opponent scenario, everything else a neutral default. */
export function syntheticAttacker(opponentWS: number, opponentS: number, opponentBS = 3, opponentA = 1): Character {
  return {
    id: "synthetic-opponent",
    name: "Opponent",
    warband: "",
    role: "henchman",
    stats: { M: 4, WS: opponentWS, BS: opponentBS, S: opponentS, T: 3, W: 1, I: 3, A: Math.max(1, opponentA), Ld: 7 },
    equippedWeapons: [],
    armour: { type: "none", shield: false, buckler: false },
    helmet: false,
    skills: [],
    traits: [],
    wardSaveThreshold: null,
    notes: "",
  };
}

export interface SkillSensitivityParams {
  character: Character;
  weapons: Weapon[];
  opponentWS: number;
  opponentT: number;
  opponentScenario: OpponentScenario;
  /** The opponent's weapon when THEY attack (defensive categories) — a single representative weapon. */
  opponentWeapon: Weapon;
  category: SkillSensitivityCategory;
  context: CombatContext;
  customSkills?: Skill[];
  houseRules?: HouseRules;
  /** Restrict candidates to the character's own skill lists (default true). */
  respectSkillTables?: boolean;
}

export function computeSkillSensitivity({ character, weapons, opponentWS, opponentT, opponentScenario, opponentWeapon, category, context, customSkills = [], houseRules = defaultHouseRules(), respectSkillTables = true }: SkillSensitivityParams): SkillSensitivityResult {
  const pool = [...SKILLS, ...customSkills].filter(
    (skill) => !character.skills.includes(skill.id) && matchesCategory(skill, category) && (!respectSkillTables || skillAvailableTo(skill, character))
  );
  const isDefensive = category !== "offMelee" && category !== "offRanged";
  const phase: WeaponKind = category === "offMelee" || category === "defMelee" ? "melee" : "ranged";

  if (!isDefensive) {
    const defenderProfile = opponentScenarioToDefenderProfile(opponentScenario, opponentWS, opponentT);
    const baseline = phaseChain(character, weapons, defenderProfile, context, customSkills, houseRules, phase);
    const rows = pool.map((skill) => ({
      skill,
      chain: phaseChain({ ...character, skills: [...character.skills, skill.id] }, weapons, defenderProfile, context, customSkills, houseRules, phase),
    }));
    return { baseline, role: "offensive", rows };
  }

  const attacker = syntheticAttacker(opponentWS, opponentScenario.S, opponentScenario.BS, opponentScenario.A);
  const baseDefenderProfile: DefenderProfile = characterToDefenderProfile(character, weapons);
  const baseline = phaseChain(attacker, [opponentWeapon], baseDefenderProfile, context, customSkills, houseRules, opponentWeapon.type);
  const rows = pool.map((skill) => ({
    skill,
    chain: phaseChain(attacker, [opponentWeapon], { ...baseDefenderProfile, activeSkillIds: [...character.skills, skill.id] }, context, customSkills, houseRules, opponentWeapon.type),
  }));
  return { baseline, role: "defensive", rows };
}
