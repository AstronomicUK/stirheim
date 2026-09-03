// Adapter layer: turns a Character + Weapon + defender profile + context toggles into the flat
// AttackInput the pure resolveAttack.ts engine consumes. This is where skill, trait and weapon
// special-rule effects actually get applied — the engine files themselves stay rule-agnostic.

import type { Character, CombatContext, DefenderProfile, HouseRules, Skill, Stats, Weapon, WeaponKind } from "../types";
import { defaultHouseRules } from "../types";
import { findSkill } from "../data/skills";
import { meleeToHitThreshold, rangedToHitBaseThreshold } from "./toHit";
import { toWoundThreshold } from "./toWound";
import { armourSaveThreshold } from "./armourSave";
import type { AttackInput } from "./resolveAttack";
import type { CritTableKey } from "./crit";
import { IMPOSSIBLE, type Threshold } from "./dice";

// Weapon-id restrictions for attack-count skills that only apply to specific weapon families —
// the skill text names these families in prose (03:391-437), so the coupling to weapon ids below
// is this tool's own bridging choice, documented here.
//   Quick Shot (03:395): "twice per turn with a bow or crossbow (but not a crossbow pistol)".
//   Pistolier (03:401): "a brace of pistols of any type (including crossbow pistols)" — the brace
//     itself isn't checked here (a single pistol is assumed to be one of a pair).
//   Knife-Fighter (03:437): "a maximum of three" throwing knives/stars.
//   Hunter (03:431) is NOT an attack-count skill — it lets a handgun / long rifle fire every turn
//   instead of every other turn, which a single-turn model can't show, so it is not modelled.
const ATTACK_COUNT_WEAPON_RESTRICTIONS: Record<string, string[]> = {
  quick_shot: ["bow", "short_bow", "longbow", "elf_bow", "crossbow", "repeater_crossbow", "harpoon_crossbow"],
  pistolier: [
    "pistol",
    "duelling_pistol",
    "warplock_pistol",
    "crossbow_pistol",
    "double_barrelled_pistol",
    "double_barrelled_duelling_pistol",
    "ostlander_double_barrelled_pistol",
    "repeater_pistol",
  ],
  knife_fighter: ["throwing_knife"],
};

function resolveSkills(ids: string[], customSkills: Skill[]): Skill[] {
  return ids.map((id) => findSkill(id, customSkills)).filter((s): s is Skill => Boolean(s));
}

function isActive(skill: Skill, context: CombatContext): boolean {
  if (!skill.modeled) return false;
  if (!skill.conditional) return true;
  if (!skill.conditionField) return false;
  return Boolean(context[skill.conditionField]);
}

function appliesToAttackType(appliesTo: "melee" | "ranged" | "both" | undefined, weaponType: WeaponKind): boolean {
  return appliesTo === "both" || appliesTo === undefined || appliesTo === weaponType;
}

/** Pit Fighter (03:495 — a Strength skill, and also the Pit Fighters warband's racial rule): +1 WS and +1 A when fighting inside buildings or ruins. */
function pitFighterActive(character: Character, context: CombatContext): boolean {
  return context.insideBuildings && (character.skills.includes("pit_fighter") || character.traits.includes("pit_fighter"));
}

/** Charging is always the first turn of a combat; the separate toggle covers being charged / other first-turn cases. */
function isFirstTurnOfCombat(context: CombatContext): boolean {
  return context.charging || context.firstTurnOfCombat;
}

/**
 * Number of attacks this weapon contributes to its phase.
 *
 * - Ranged weapons don't draw on the Attacks characteristic — each fires its own `shotsPerTurn`,
 *   plus any weapon-restricted attackCountModifier skills (Quick Shot, Pistolier, Knife-Fighter).
 *   A Move-or-Fire weapon can't fire at all in a turn the shooter moved, unless they have Nimble
 *   (03:419) — the -1 for moving still applies either way.
 * - A primary melee weapon uses the character's full Attacks (A) characteristic (doubled by
 *   Frenzy), plus melee attackCountModifier skills (Combat Master), Pit Fighter, a paired
 *   weapon's built-in extra attack, and any charge-only bonus (Whipcrack).
 * - A secondary (off-hand) melee weapon grants exactly the "one extra Attack" for fighting with
 *   two weapons (01:811) — a flat +1, not scaled by A, skills or Frenzy (01:1100).
 * - `maxAttacks` (Fist: 1) caps the result.
 */
export function computeAttackCount(character: Character, weapon: Weapon, isPrimary: boolean, context: CombatContext, customSkills: Skill[] = []): number {
  const skills = resolveSkills(character.skills, customSkills);

  const skillBonus = () => {
    let bonus = 0;
    for (const skill of skills) {
      if (skill.effect.type !== "attackCountModifier") continue;
      if (!isActive(skill, context)) continue;
      if (!appliesToAttackType(skill.effect.appliesTo, weapon.type)) continue;
      const restriction = ATTACK_COUNT_WEAPON_RESTRICTIONS[skill.id];
      if (restriction && !restriction.includes(weapon.id)) continue;
      bonus += skill.effect.value ?? 0;
    }
    return bonus;
  };

  if (weapon.type === "ranged") {
    const nimble = skills.some((s) => s.id === "nimble" && isActive(s, context));
    if (weapon.moveOrFire && context.movedThisTurn && !nimble) return 0;
    const count = (weapon.rangedProfile?.shotsPerTurn ?? 1) + skillBonus();
    return Math.max(0, count);
  }

  if (!isPrimary) return Math.min(1, weapon.maxAttacks ?? 1);

  // Frenzy (01:1100): double Attacks in hand-to-hand combat; the off-hand +1 is not doubled.
  const baseAttacks = character.traits.includes("frenzy") ? character.stats.A * 2 : character.stats.A;
  let count = baseAttacks + skillBonus();
  if (pitFighterActive(character, context)) count += 1;
  if (weapon.paired) count += 1;
  if (context.charging && weapon.chargeBonusAttacks) count += weapon.chargeBonusAttacks;
  if (weapon.maxAttacks !== undefined) count = Math.min(count, weapon.maxAttacks);
  return Math.max(0, count);
}

/** Only weapons of this phase take part: the shooting phase and the hand-to-hand phase are separate (one crit per phase each, 01:707), so a loadout is never mixed. */
export function weaponsForPhase(weapons: Weapon[], phase: WeaponKind): Weapon[] {
  return weapons.filter((w) => w.type === phase);
}

/** Total attacks this phase across every weapon of that phase, in resolution order — the same count `resolveCharacterTurn` actually rolls. */
export function totalAttackCount(character: Character, weapons: Weapon[], context: CombatContext, customSkills: Skill[] = [], phase?: WeaponKind): number {
  const inPhase = weaponsForPhase(weapons, phase ?? weapons[0]?.type ?? "melee");
  return inPhase.reduce((sum, weapon, index) => sum + computeAttackCount(character, weapon, index === 0, context, customSkills), 0);
}

function effectiveStat(base: Stats, skills: Skill[], context: CombatContext, weaponType: WeaponKind, stat: keyof Stats, participant: "self" | "opponent"): number {
  let value = base[stat];
  for (const skill of skills) {
    if (skill.effect.type !== "statModifier") continue;
    if (skill.effect.stat !== stat) continue;
    if ((skill.effect.appliesToParticipant ?? "self") !== participant) continue;
    if (!appliesToAttackType(skill.effect.appliesTo, weaponType)) continue;
    if (!isActive(skill, context)) continue;
    value += skill.effect.value ?? 0;
  }
  return value;
}

function sumEffect(skills: Skill[], context: CombatContext, weaponType: WeaponKind, type: string): number {
  let total = 0;
  for (const skill of skills) {
    if (skill.effect.type !== type) continue;
    if (!appliesToAttackType(skill.effect.appliesTo, weaponType)) continue;
    if (!isActive(skill, context)) continue;
    total += skill.effect.value ?? 0;
  }
  return total;
}

function hasActiveEffect(skills: Skill[], context: CombatContext, weaponType: WeaponKind, type: string, target?: string): boolean {
  return skills.some((skill) => {
    if (skill.effect.type !== type) return false;
    if (target && skill.effect.target !== target) return false;
    if (!appliesToAttackType(skill.effect.appliesTo, weaponType)) return false;
    return isActive(skill, context);
  });
}

function findActiveEffect(skills: Skill[], context: CombatContext, weaponType: WeaponKind, type: string): Skill | undefined {
  return skills.find((skill) => skill.effect.type === type && appliesToAttackType(skill.effect.appliesTo, weaponType) && isActive(skill, context));
}

/** The weapon's Strength bonus this turn — Heavy weapons (Flail, Morning Star, Censer) and the Lance only get theirs in the first turn / on the charge. */
function weaponStrengthBonus(weapon: Weapon, context: CombatContext): number {
  const bonus = weapon.strengthBonus ?? 0;
  if (!weapon.strengthBonusFirstTurnOnly) return bonus;
  if (weapon.id === "lance") return context.charging ? bonus : 0;
  return isFirstTurnOfCombat(context) ? bonus : 0;
}

/** Attacker's effective WS / Strength for a given weapon and context, after self-targeting skills (Unstoppable Charge, Mighty Blow, Pit Fighter) and the weapon's own Strength bonus — used to highlight the right row on the Hit%/Wound% grids and as the attack's Strength for wounding. */
export function effectiveOffensiveStats(attacker: Character, weapon: Weapon, context: CombatContext, customSkills: Skill[] = []): { ws: number; strength: number } {
  const attackerSkills = resolveSkills(attacker.skills, customSkills);
  let ws = effectiveStat(attacker.stats, attackerSkills, context, weapon.type, "WS", "self");
  if (weapon.type === "melee" && pitFighterActive(attacker, context)) ws += 1;
  const s = effectiveStat(attacker.stats, attackerSkills, context, weapon.type, "S", "self");
  return { ws, strength: weapon.strength === "user" ? s + weaponStrengthBonus(weapon, context) : weapon.strength };
}

export interface BuildAttackInputParams {
  attacker: Character;
  weapon: Weapon;
  defender: DefenderProfile;
  context: CombatContext;
  customSkills?: Skill[];
  houseRules?: HouseRules;
}

/** Armour and Ward saves that would need a 7+ are simply no save (01:734-752 — modifiers reduce the save; there is no "natural 6" rescue for saves). */
function saveThresholdOrImpossible(threshold: Threshold): Threshold {
  if (threshold === IMPOSSIBLE) return IMPOSSIBLE;
  return threshold >= 7 ? IMPOSSIBLE : Math.max(2, threshold);
}

export function buildAttackInput({ attacker, weapon, defender, context, customSkills = [], houseRules = defaultHouseRules() }: BuildAttackInputParams): AttackInput {
  const attackerSkills = resolveSkills(attacker.skills, customSkills);
  const defenderSkills = resolveSkills(defender.activeSkillIds, customSkills);

  const { ws: effectiveWS, strength: attackStrength } = effectiveOffensiveStats(attacker, weapon, context, customSkills);

  // Resilient (03:501, defender, close combat only): -1 Strength on hits against him for the To
  // Wound roll — explicitly NOT for armour save modifiers, and not for the Parry 2×S check either.
  const strengthForToWound = effectiveStat({ ...attacker.stats, S: attackStrength }, defenderSkills, context, weapon.type, "S", "opponent");

  // ---- To Hit ----
  let hitThreshold: number;
  if (weapon.type === "melee") {
    hitThreshold = meleeToHitThreshold(effectiveWS, defender.WS);
  } else {
    let modifierSum = 0;
    if (context.cover && !hasActiveEffect(defenderSkills, context, weapon.type, "ignoresModifier", "cover")) modifierSum -= 1;
    if (context.longRange && !attackerSkills.some((s) => s.effect.type === "rangeExtension" && isActive(s, context))) modifierSum -= 1;
    // Moving and shooting is always -1 (01:673); Nimble only lets Move-or-Fire weapons shoot at all (see computeAttackCount).
    if (context.movedThisTurn) modifierSum -= 1;
    if (context.largeTarget || defender.activeTraitIds.includes("large_target")) modifierSum += 1;
    if ((weapon.rangedProfile?.shotsPerTurn ?? 1) > 1 && weapon.multiShotToHitPenalty) modifierSum -= weapon.multiShotToHitPenalty;
    modifierSum += weapon.toHitBonus ?? 0;
    hitThreshold = rangedToHitBaseThreshold(attacker.stats.BS) - modifierSum;
  }

  // ---- To Wound ----
  const woundThreshold = toWoundThreshold(strengthForToWound, defender.T);

  // ---- Armour save ----
  // Base save from armour/shield (with the Strength erosion house rule if on), then the weapon's
  // own modifier. Positive = harder for the defender (Cutting Edge, pistols, Gromril). Negative =
  // easier: a Dagger / Fist / Blowpipe gives +1 to the save, and "a 6+ armour save if he has none
  // normally" (02:240) — so a negative modifier against no armour creates a save. Anything that
  // ends up needing 7+ is no save at all.
  let armourThreshold: Threshold;
  if (weapon.ignoresArmourSave) {
    armourThreshold = IMPOSSIBLE;
  } else {
    const base = armourSaveThreshold(defender.armour, attackStrength, houseRules.strengthArmourPiercing);
    const modifier = weapon.saveModifier ?? 0;
    if (base === IMPOSSIBLE) {
      armourThreshold = modifier < 0 ? saveThresholdOrImpossible(7 + modifier) : IMPOSSIBLE;
    } else {
      armourThreshold = saveThresholdOrImpossible(base + modifier);
    }
  }

  // ---- Defensive extras: Step Aside (melee, after armour) / Dodge (ranged, before to-wound) ----
  const stepAsideSkill = weapon.type === "melee" ? findActiveEffect(defenderSkills, context, weapon.type, "extraSaveThreshold") : undefined;
  const dodgeSkill = weapon.type === "ranged" ? findActiveEffect(defenderSkills, context, weapon.type, "extraSaveThreshold") : undefined;

  // ---- Injury roll modifiers ----
  const injuryRollModifier = sumEffect(attackerSkills, context, weapon.type, "injuryRollModifier");
  const remapSkill = findActiveEffect(defenderSkills, context, weapon.type, "injuryChartRemap");
  const hardToKill = defender.activeTraitIds.includes("hard_to_kill");
  // Hard Head (Dwarf racial trait): ignores the special rules for maces, clubs, etc. — Concussion never applies.
  const concussion = weapon.concussion && !defender.activeTraitIds.includes("hard_head");
  // Stun avoidance: Helmet 4+ (02:1339); Thick Skull 3+, or 2+ with a helmet, replacing the helmet's own save.
  const stunAvoidanceSkill = findActiveEffect(defenderSkills, context, weapon.type, "stunAvoidance");
  let stunAvoidanceThreshold: number | undefined;
  if (stunAvoidanceSkill?.effect.threshold !== undefined) {
    stunAvoidanceThreshold = Math.max(2, stunAvoidanceSkill.effect.threshold - (defender.helmet ? 1 : 0));
  } else if (defender.helmet) {
    stunAvoidanceThreshold = 4;
  }
  // No Pain (undead): Stunned is always Knocked Down. Undead Construct (Bone Goliath): ignore any
  // Injury result on a 4+ — except wounds from magic or magic weapons.
  const stunnedBecomesKnockedDown = defender.activeTraitIds.includes("no_pain");
  const injuryIgnoreThreshold = defender.activeTraitIds.includes("undead_construct") && !weapon.special.includes("magical") ? 4 : undefined;
  // Immune to Poison: a poisoned weapon's auto-wound on a 6 to hit doesn't apply.
  const autoWound = Boolean(weapon.autoWoundOnNaturalSixToHit) && !(weapon.poisoned && defender.activeTraitIds.includes("immune_to_poison"));

  // ---- Crit trigger / table ----
  // Wight Blades (Restless Dead variant): any non-magical close-combat weapon the model carries
  // crits on a 5+ instead of a 6. Gromril and Ithilmar weapons can't become Wight Blades.
  const variantWightBlade = weapon.type === "melee" && attacker.traits.includes("wight_blades_5plus") && !weapon.id.startsWith("gromril_") && !weapon.id.startsWith("ithilmar_") && !weapon.special.includes("magical");
  let critTriggerFaces: number[];
  if (weapon.noCriticals) critTriggerFaces = [];
  else if (weapon.critTriggerThreshold !== undefined) critTriggerFaces = Array.from({ length: 6 - weapon.critTriggerThreshold + 1 }, (_, i) => weapon.critTriggerThreshold! + i);
  else if (variantWightBlade) critTriggerFaces = [5, 6];
  else critTriggerFaces = [6];
  const critTable: CritTableKey = context.critMode === "standard" ? "standard" : weapon.critCategory;
  const critTableRollModifier = sumEffect(attackerSkills, context, weapon.type, "critTableRollModifier");

  // ---- Rerolls ----
  // Expert Swordsman (03:381 — normal swords and Weeping Blades only, on the charge) and Hatred
  // (01:1110 — any melee weapon, first turn vs a hated enemy) both grant a to-hit reroll.
  const expertSwordsman = weapon.type === "melee" && Boolean(weapon.isSword) && hasActiveEffect(attackerSkills, context, weapon.type, "rerollToHit");
  const hatred = weapon.type === "melee" && attacker.traits.includes("hatred") && context.vsHatedEnemy;
  const rerollToHit = expertSwordsman || hatred;

  // ---- Parry (01:836-848; Sword / Buckler / Dwarf Axe rules; Master of Blades) ----
  const masterOfBlades = defenderSkills.some((s) => s.id === "master_of_blades" && isActive(s, context));
  const parryEligible = weapon.type === "melee" && !weapon.cannotBeParried && defender.parryWeaponCount > 0 && attackStrength < 2 * defender.S;
  const parrySuccessProbGivenAttempt = parryEligible ? parrySuccessProbability(hitThreshold, masterOfBlades, defender.parryReroll) : 0;

  return {
    hitThreshold,
    woundThreshold,
    armourThreshold,
    dodgeThreshold: dodgeSkill?.effect.threshold,
    stepAsideThreshold: stepAsideSkill?.effect.threshold,
    wardSaveThreshold: defender.wardSaveThreshold !== null && defender.wardSaveThreshold !== undefined ? saveThresholdOrImpossible(defender.wardSaveThreshold) ?? undefined : undefined,
    injuryRollModifier,
    concussion,
    trueGrit: Boolean(remapSkill),
    injuryRemap: remapSkill?.effect.remap,
    hardToKill,
    stunAvoidanceThreshold,
    stunnedBecomesKnockedDown,
    injuryIgnoreThreshold,
    critTriggerFaces,
    critTable,
    critTableRollModifier,
    rerollToHit,
    autoWoundOnNaturalSixToHit: autoWound,
    parryEligible,
    parrySuccessProbGivenAttempt,
  };
}

/**
 * How many Parry attempts (not successes — an attempt can fail) this defender gets per Close
 * Combat phase. Base rule (01:844): one blow per phase, however many Parry items are carried.
 * Master of Blades (Dwarf Treasure Hunters): with two Parry weapons, two attempts per phase.
 */
export function computeMaxParries(defender: DefenderProfile, customSkills: Skill[] = []): number {
  const defenderSkills = resolveSkills(defender.activeSkillIds, customSkills);
  const masterOfBlades = defenderSkills.some((s) => s.id === "master_of_blades");
  if (defender.parryWeaponCount >= 2 && masterOfBlades) return 2;
  if (defender.parryWeaponCount >= 1) return 1;
  return 0;
}

/**
 * Exact probability a single Parry attempt succeeds, averaged over the distribution of the
 * attacker's actual to-hit die face (uniform over the "winning" faces for `hitThreshold`, per the
 * shared natural-1-fails convention). Base rule (01:842): parry succeeds if the D6 STRICTLY beats
 * that face — so a 6 to hit can never be parried. Master of Blades: succeeds if it beats OR
 * MATCHES. `reroll`: a failed attempt is rerolled once (buckler + sword, Dwarf Axe pairings, etc).
 */
export function parrySuccessProbability(hitThreshold: number, beatsOrMatches: boolean, reroll: boolean): number {
  const winningFaces: number[] = [];
  const lowestWinningFace = hitThreshold <= 1 ? 2 : Math.max(2, Math.min(6, hitThreshold));
  for (let face = lowestWinningFace; face <= 6; face++) winningFaces.push(face);
  if (winningFaces.length === 0) return 0;

  const successProbForFace = (face: number) => {
    const p = beatsOrMatches ? (7 - face) / 6 : (6 - face) / 6;
    const clamped = Math.max(0, Math.min(1, p));
    return reroll ? 1 - (1 - clamped) * (1 - clamped) : clamped;
  };

  const total = winningFaces.reduce((sum, face) => sum + successProbForFace(face), 0);
  return total / winningFaces.length;
}
