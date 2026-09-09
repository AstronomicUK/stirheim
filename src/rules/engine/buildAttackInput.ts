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
    // An alternative fire mode (single shot for repeaters, the Sling's double shot) replaces the profile's shots.
    const shots = context.altFire && weapon.altFire ? weapon.altFire.shots : (weapon.rangedProfile?.shotsPerTurn ?? 1);
    const count = shots + skillBonus();
    return Math.max(0, count);
  }

  if (!isPrimary) return Math.min(1, weapon.maxAttacks ?? 1);

  // Frenzy (01:1100): double Attacks in hand-to-hand combat; the off-hand +1 is not doubled.
  const baseAttacks = character.traits.includes("frenzy") ? character.stats.A * 2 : character.stats.A;
  let count = baseAttacks + skillBonus();
  if (pitFighterActive(character, context)) count += 1;
  if (weapon.paired) count += 1;
  // Whipcrack: +1 Attack when charging, and +1 against the charger when charged (the first turn either way).
  if (isFirstTurnOfCombat(context) && weapon.chargeBonusAttacks) count += weapon.chargeBonusAttacks;
  // Chain Sticks' Flurry: extra attacks in the first turn of each combat.
  if (isFirstTurnOfCombat(context) && weapon.firstTurnBonusAttacks) count += weapon.firstTurnBonusAttacks;
  // Quarter Staff: the free hand strikes as well when the staff is used alone.
  if (weapon.unarmedBonusAttack && context.twoHanded) count += 1;
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
  if (weapon.strengthBonusMountedChargeOnly) return context.charging && context.mounted ? bonus : 0;
  if (!weapon.strengthBonusFirstTurnOnly) return bonus;
  return isFirstTurnOfCombat(context) ? bonus : 0;
}

/** Attacker's effective WS / Strength for a given weapon and context, after self-targeting skills (Unstoppable Charge, Mighty Blow, Pit Fighter) and the weapon's own Strength bonus — used to highlight the right row on the Hit%/Wound% grids and as the attack's Strength for wounding. */
export function effectiveOffensiveStats(attacker: Character, weapon: Weapon, context: CombatContext, customSkills: Skill[] = []): { ws: number; strength: number } {
  const attackerSkills = resolveSkills(attacker.skills, customSkills);
  let ws = effectiveStat(attacker.stats, attackerSkills, context, weapon.type, "WS", "self");
  if (weapon.type === "melee" && pitFighterActive(attacker, context)) ws += 1;
  if (weapon.type === "melee" && weapon.wsBonus) ws += weapon.wsBonus;
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
    // Kit on either side can shift the roll: a kick at -1 (Iron Shod Boots), a Ball and Chain's -1 to be hit.
    hitThreshold = meleeToHitThreshold(effectiveWS, defender.WS) - (weapon.toHitBonus ?? 0) - (defender.toBeHit?.melee ?? 0);
  } else {
    let modifierSum = 0;
    // A pavise makes its bearer count as in cover against missiles (02: Pavise), the same -1 as real cover.
    if ((context.cover || defender.armour.pavise) && !hasActiveEffect(defenderSkills, context, weapon.type, "ignoresModifier", "cover")) modifierSum -= 1;
    if (context.longRange && !attackerSkills.some((s) => s.effect.type === "rangeExtension" && isActive(s, context))) modifierSum -= 1;
    // Moving and shooting is always -1 (01:673); Nimble only lets Move-or-Fire weapons shoot at all (see computeAttackCount).
    if (context.movedThisTurn) modifierSum -= 1;
    if (context.largeTarget || defender.activeTraitIds.includes("large_target")) modifierSum += 1;
    if (context.altFire && weapon.altFire) modifierSum -= weapon.altFire.toHitPenalty;
    else if ((weapon.rangedProfile?.shotsPerTurn ?? 1) > 1 && weapon.multiShotToHitPenalty) modifierSum -= weapon.multiShotToHitPenalty;
    modifierSum += weapon.toHitBonus ?? 0;
    // Cloaks and amulets: -1 to be hit by missiles.
    modifierSum += defender.toBeHit?.missile ?? 0;
    hitThreshold = rangedToHitBaseThreshold(attacker.stats.BS) - modifierSum;
  }

  // ---- To Wound ----
  const vsTraitsApply = Boolean(weapon.vsTraits && weapon.vsTraits.traits.some((t) => defender.activeTraitIds.includes(t)));
  const woundBase = toWoundThreshold(strengthForToWound, defender.T);
  // Sigmarite Warhammer: +1 to wound against Undead and Possessed (a 6 is still needed for a critical, handled by the trigger faces).
  const woundThreshold: Threshold = vsTraitsApply && weapon.vsTraits?.toWound && woundBase !== IMPOSSIBLE ? Math.max(2, woundBase - weapon.vsTraits.toWound) : woundBase;

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
    // A pavise counts as a shield in close combat only when the bearer was charged to the front; never against shooting.
    const paviseCounts = weapon.type === "melee" && (context.paviseFront ?? true);
    // A Ladle lets only a shield save; body armour and helmets do not count.
    const armour = weapon.ignoresArmourSaveExceptShield ? { ...defender.armour, type: "none" as const, kiteShield: false } : defender.armour;
    let base = armourSaveThreshold(armour, attackStrength, houseRules.strengthArmourPiercing, paviseCounts);
    // A Sea Dragon Cloak is a save of its own, used when better than the armour worn.
    const own = defender.ownSave ? (weapon.type === "melee" ? defender.ownSave.melee : defender.ownSave.missile) : null;
    if (own !== null && !weapon.ignoresArmourSaveExceptShield && (base === IMPOSSIBLE || own < base)) base = own;
    // Wolfcloaks, Silk Armour: a bonus to the save, sometimes even a 6+ from nothing.
    const bonus = weapon.ignoresArmourSaveExceptShield ? 0 : (weapon.type === "melee" ? defender.saveBonus?.melee : defender.saveBonus?.missile) ?? 0;
    if (bonus > 0) base = base === IMPOSSIBLE ? (defender.saveBonus?.savesFromNothing ? 7 - bonus : IMPOSSIBLE) : Math.max(2, base - bonus);
    // The Ogre Club's Crushing Attack needs both hands on the club.
    const modifier = weapon.saveModifierTwoHandedOnly && !context.twoHanded ? 0 : (weapon.saveModifier ?? 0);
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
  const injuryRollModifier = sumEffect(attackerSkills, context, weapon.type, "injuryRollModifier") + (vsTraitsApply ? weapon.vsTraits?.injury ?? 0 : 0);
  const remapSkill = findActiveEffect(defenderSkills, context, weapon.type, "injuryChartRemap");
  const hardToKill = defender.activeTraitIds.includes("hard_to_kill");
  // Hard Head (Dwarf racial trait): ignores the special rules for maces, clubs, etc. — Concussion never applies.
  const concussion = weapon.concussion && !defender.activeTraitIds.includes("hard_head");
  // Stun avoidance: Helmet 4+ (02:1339); Thick Skull 3+, or 2+ with a helmet, replacing the helmet's own save.
  const stunAvoidanceSkill = findActiveEffect(defenderSkills, context, weapon.type, "stunAvoidance");
  let stunAvoidanceThreshold: number | undefined;
  if (defender.stunSave?.unmodifiable) {
    // Cooking Pot Helmet: a 5+ that is never modified and does not stack with Thick Skull.
    stunAvoidanceThreshold = defender.stunSave.threshold;
  } else if (stunAvoidanceSkill?.effect.threshold !== undefined) {
    stunAvoidanceThreshold = Math.max(2, stunAvoidanceSkill.effect.threshold - (defender.helmet || defender.stunSave ? 1 : 0));
  } else if (defender.stunSave) {
    stunAvoidanceThreshold = defender.stunSave.threshold;
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
  const critTableRollModifier = sumEffect(attackerSkills, context, weapon.type, "critTableRollModifier") + (weapon.critTableRollModifier ?? 0);

  // ---- Rerolls ----
  // Expert Swordsman (03:381 — normal swords and Weeping Blades only, on the charge) and Hatred
  // (01:1110 — any melee weapon, first turn vs a hated enemy) both grant a to-hit reroll.
  const expertSwordsman = weapon.type === "melee" && Boolean(weapon.isSword) && hasActiveEffect(attackerSkills, context, weapon.type, "rerollToHit");
  const hatred = weapon.type === "melee" && attacker.traits.includes("hatred") && context.vsHatedEnemy;
  const rerollToHit = expertSwordsman || hatred;

  // ---- Parry (01:836-848; Sword / Buckler / Dwarf Axe rules; Master of Blades) ----
  const masterOfBlades = defenderSkills.some((s) => s.id === "master_of_blades" && isActive(s, context));
  // The Ogre Club counts one Strength higher for the parry check when swung two-handed.
  const parryStrength = attackStrength + (weapon.id === "ogre_club" && context.twoHanded ? 1 : 0);
  const parryEligible = weapon.type === "melee" && !weapon.cannotBeParried && defender.parryWeaponCount > 0 && parryStrength < 2 * defender.S && !context.targetKnockedDown;
  // A fixed parry threshold (Starblade) is its own mechanic — always a flat save regardless of
  // either side's WS — so it still wins over the opposed-WS house rule when both are in play.
  const opposedParryWS = parryEligible && houseRules.opposedParryWS && defender.parryThreshold === undefined;
  const parrySuccessProbGivenAttempt = parryEligible
    ? defender.parryThreshold !== undefined
      ? probabilityAtLeastForParry(defender.parryThreshold, defender.parryReroll)
      : opposedParryWS
        ? opposedParrySuccessProbability(effectiveWS, hitThreshold, defender.WS, masterOfBlades, defender.parryReroll)
        : parrySuccessProbability(hitThreshold, masterOfBlades, defender.parryReroll)
    : 0;
  // Misericordia against a knocked-down target: 2D6 to wound, keep the highest.
  const rerollToWound = Boolean(weapon.toWoundHighestOf2D6VsKnockedDown && context.targetKnockedDown);
  // Attacking stunned and knocked down warriors in hand-to-hand combat (01:947-959): a knocked-down
  // target is hit automatically (still wounded and saved against normally); a stunned target is
  // taken out of action by the first hit, no rolls at all. Ranged attacks are unaffected — the rule
  // only covers hand-to-hand.
  const autoHitKnockedDown = weapon.type === "melee" && Boolean(context.targetKnockedDown);
  const autoOutOfActionStunned = weapon.type === "melee" && Boolean(context.targetStunned);
  // Amulet of the Moon and the Shield of Sigmar: a special save against missiles, the better of it and any Ward.
  const missileWard = weapon.type === "ranged" ? defender.missileWardSaveThreshold ?? null : null;
  const wardCandidates = [defender.wardSaveThreshold, missileWard].filter((t): t is number => t !== null && t !== undefined);
  const wardThreshold = wardCandidates.length ? Math.min(...wardCandidates) : undefined;

  return {
    hitThreshold,
    woundThreshold,
    armourThreshold,
    dodgeThreshold: dodgeSkill?.effect.threshold,
    stepAsideThreshold: stepAsideSkill?.effect.threshold,
    wardSaveThreshold: wardThreshold !== undefined ? saveThresholdOrImpossible(wardThreshold) ?? undefined : undefined,
    afterSaveThreshold: defender.afterSaveThreshold,
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
    rerollToWound: rerollToWound || undefined,
    autoWoundOnNaturalSixToHit: autoWound,
    parryEligible,
    parrySuccessProbGivenAttempt,
    parrySuccessByFace: Array.from({ length: 7 }, (_, hit) => {
      if (!parryEligible) return 0;
      let wins = 0;
      for (let die = 1; die <= 6; die++) {
        const success = defender.parryThreshold !== undefined ? die >= Math.max(2, defender.parryThreshold)
          : opposedParryWS ? (masterOfBlades ? defender.WS + die >= effectiveWS + hit : defender.WS + die > effectiveWS + hit)
          : masterOfBlades ? die >= hit : die > hit;
        if (success) wins++;
      }
      const p = wins / 6;
      return defender.parryReroll ? 1 - (1 - p) ** 2 : p;
    }),
    autoHitKnockedDown,
    autoOutOfActionStunned,
    multipleWoundsD3OnHit: weapon.multipleWoundsD3OnHit,
    opposedParryWS: opposedParryWS || undefined,
    attackerWS: opposedParryWS ? effectiveWS : undefined,
    defenderWS: opposedParryWS ? defender.WS : undefined,
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

/** A Starblade parries on a fixed roll (4+) rather than beating the to-hit die. */
/**
 * House rule: Parry as an opposed WS roll. Each side adds their Weapon Skill to a D6; the
 * defender needs to strictly beat the attacker's total (or match it, with Master of Blades), same
 * spirit as the flat rule but comparing sums instead of raw faces. Averaged the same way as
 * `parrySuccessProbability` — uniformly over the attacker's possible winning to-hit faces, and
 * uniformly over the defender's own D6 (the opposed sum has no natural-1/6 special case of its
 * own; Tom's own worked example just compares WS + die on each side).
 */
export function opposedParrySuccessProbability(attackerWS: number, hitThreshold: number, defenderWS: number, beatsOrMatches: boolean, reroll: boolean): number {
  const winningFaces: number[] = [];
  const lowestWinningFace = hitThreshold <= 1 ? 2 : Math.max(2, Math.min(6, hitThreshold));
  for (let face = lowestWinningFace; face <= 6; face++) winningFaces.push(face);
  if (winningFaces.length === 0) return 0;

  const successProbForFace = (hitFace: number) => {
    const attackerTotal = attackerWS + hitFace;
    let wins = 0;
    for (let p = 1; p <= 6; p++) {
      const defenderTotal = defenderWS + p;
      if (beatsOrMatches ? defenderTotal >= attackerTotal : defenderTotal > attackerTotal) wins += 1;
    }
    const q = wins / 6;
    return reroll ? 1 - (1 - q) * (1 - q) : q;
  };

  const total = winningFaces.reduce((sum, face) => sum + successProbForFace(face), 0);
  return total / winningFaces.length;
}

export function probabilityAtLeastForParry(threshold: number, reroll: boolean): number {
  const p = Math.max(0, Math.min(1, (7 - Math.max(2, Math.min(6, threshold))) / 6));
  return reroll ? 1 - (1 - p) * (1 - p) : p;
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
