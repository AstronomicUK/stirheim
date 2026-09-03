// Core data model — mirrors the JSON schema in the project brief (§6).

export type ArmourType = "none" | "light" | "heavy" | "gromril";
export type CritCategory = "missile" | "bludgeoning" | "bladed" | "thrusting" | "unarmed";
export type CritMode = "standard" | "optional";
export type WeaponKind = "melee" | "ranged";

export interface Stats {
  M: number;
  WS: number;
  BS: number;
  S: number;
  T: number;
  W: number;
  I: number;
  A: number;
  Ld: number;
}

export interface Armour {
  type: ArmourType;
  shield: boolean;
  /** Distinct from a shield (mordheimer.net): a buckler grants no save bonus but does grant a Parry attempt, the same as a Parry-tagged weapon. */
  buckler: boolean;
}

export interface RangedProfile {
  shortRange: number | null;
  maxRange: number | null;
  shotsPerTurn: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponKind;
  /** "user" = wielder's own Strength (melee default). A number = the weapon's fixed Strength (all ranged, some melee). */
  strength: "user" | number;
  /** Only meaningful when `strength` is "user" — a flat bonus on top of the wielder's own Strength (e.g. double-handed weapons: "As user +2", per mordheimer.net). Undefined = +0. */
  strengthBonus?: number;
  critCategory: CritCategory;
  concussion: boolean;
  /** Lowers the crit-trigger threshold on the to-wound roll below the normal natural-6-only rule. Undefined = standard natural-6-only. (No catalogue weapon currently uses this — kept for custom weapons.) */
  critTriggerThreshold?: number;
  /** This weapon can never cause a critical hit (Blowpipe, 02:774). */
  noCriticals?: boolean;
  /** Poison / evil magic: a natural 6 on the to-hit roll wounds automatically (Black Lotus wording — Blowpipe, Poison Daggers, Weeping Blades, Hobgoblin Poisoned Daggers, Wight Blades). The to-wound roll is still made to check for a critical. */
  autoWoundOnNaturalSixToHit?: boolean;
  /** The auto-wound above comes from poison, so a target that is Immune to Poison ignores it (Wight Blades' evil magic is not poison). */
  poisoned?: boolean;
  /** Grants the wielder a Parry attempt against one hit per Close Combat phase (mordheimer.net: Sword, Dwarf Axe). */
  parry?: boolean;
  /** Attacks with this weapon cannot be parried with a sword or buckler (whips — 02:64, 76, 154, 691). */
  cannotBeParried?: boolean;
  /** Counts as a "sword" for Expert Swordsman (03:381: normal swords and Weeping Blades only). */
  isSword?: boolean;
  /** Extra shift to the defender's armour-save threshold from this weapon alone. Positive = harder for the defender (Cutting Edge -1, pistols -2, Gromril -1). Negative = easier for the defender (Dagger/Fist +1); a negative modifier against a target with no armour creates a 6+ save (02:240). Stacks with the base save and with the Strength erosion house rule. */
  saveModifier?: number;
  /** No armour save is ever allowed against this weapon (Ball and Chain, Claw of the Old Ones, Sun Gauntlet, Sunstaff, Starsword). Ward saves and Step Aside still apply. */
  ignoresArmourSave?: boolean;
  /** The weapon's strengthBonus applies only in the first turn of a combat (Flail, Morning Star, Censer — "Heavy") or only when charging (Lance). Gated on CombatContext.charging / firstTurnOfCombat. */
  strengthBonusFirstTurnOnly?: boolean;
  /** Cannot be fired in a turn the model moved unless the shooter has Nimble (crossbows, handguns, etc.). */
  moveOrFire?: boolean;
  /** To-hit penalty applied to every shot when the weapon fires more than once per turn (Repeater Crossbow -1, Repeater Handgun/Pistol -1). Only meaningful when rangedProfile.shotsPerTurn > 1. */
  multiShotToHitPenalty?: number;
  /** Flat to-hit bonus from the weapon itself (Duelling Pistol +1 "Accuracy", Nehekharan Javelins +1). */
  toHitBonus?: number;
  /** Hard cap on attacks made with this weapon per turn (Fist: 1 — 02:321). */
  maxAttacks?: number;
  /** Sold and wielded as a pair: one catalogue entry already gives the "two weapons" +1 Attack (Fighting Claws, Weeping Blades, Brass Knuckles, Poison Daggers). */
  paired?: boolean;
  /** Extra attacks gained only in a turn the wielder charges (Whipcrack +1). */
  chargeBonusAttacks?: number;
  /** Flat Initiative bonus from the weapon itself (e.g. an Ithilmar weapon's own +1). Recorded for completeness, matching Initiative's `not modeled` status elsewhere (Stat/Skill Gain Analysers) — Initiative isn't wired into the probability engine, so this is informational only until it is. Undefined = +0. */
  initiativeModifier?: number;
  special: string[];
  rangedProfile: RangedProfile | null;
}

export type SkillEffectType =
  | "toHitModifier"
  | "toWoundModifier"
  | "armourSaveModifier"
  | "injuryRollModifier"
  | "critTableRollModifier"
  | "attackCountModifier"
  | "rerollToHit"
  | "rerollToWound"
  | "ignoresModifier"
  | "extraSaveThreshold"
  | "stunAvoidance"
  | "rangeExtension"
  | "injuryChartRemap"
  | "statModifier"
  /** Pit Fighter: +1 WS and +1 A inside buildings — handled directly in engine/buildAttackInput.ts. */
  | "pitFighter"
  /** Master of Blades: parry on beat-or-match, two attempts with two Parry weapons — handled directly in engine/buildAttackInput.ts. */
  | "parryImprovement"
  | "notModeled";

export interface SkillEffect {
  type: SkillEffectType;
  value?: number;
  appliesTo?: "melee" | "ranged" | "both";
  /** For ignoresModifier: which modifier it negates (e.g. "cover", "movingAndShooting"). */
  target?: string;
  /** For extraSaveThreshold / stunAvoidance: the D6 threshold for the extra roll. */
  threshold?: number;
  /** For statModifier: which stat it bumps (e.g. "WS"). */
  stat?: keyof Stats;
  /** For statModifier: whose stat it changes — the skill owner ("self", default) or their opponent this attack ("opponent", e.g. Resilient reducing the attacker's effective Strength). */
  appliesToParticipant?: "self" | "opponent";
  /** For injuryChartRemap: explicit band boundaries [koMax, stunnedMax] (OOA is anything above stunnedMax, out of 6). */
  remap?: [number, number];
}

export type SkillCategory = "combat" | "shooting" | "strength" | "speed" | "academic" | "warband-unique";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  modeled: boolean;
  effect: SkillEffect;
  /** True if this skill only applies in a specific circumstance (on the charge, vs 2+ enemies, etc.) and needs a UI toggle rather than being always-on. */
  conditional: boolean;
  /** Which CombatContext toggle gates a conditional skill (undefined for non-conditional or not-modeled skills). */
  conditionField?: "charging" | "fightingMultiple" | "firstTurnOfCombat" | "insideBuildings";
  description: string;
}

export type CharacterRole = "hero" | "henchman";

/**
 * Traits — always-on (or context-conditional) racial/psychology/Serious-Injury effects, distinct
 * from picked career Skills. Sourced from mordheimer.net's Leadership & Psychology and warband
 * racial-special-rules pages, not the original brief (which didn't cover these at all). Kept
 * deliberately simple (no generic effect object like Skill) — each modeled trait's mechanic is
 * hardcoded in the engine, since there are few of them and each has real cross-cutting nuance.
 */
export interface Trait {
  id: string;
  name: string;
  modeled: boolean;
  conditional: boolean;
  description: string;
  source: string;
}

export interface Character {
  id: string;
  name: string;
  warband: string;
  role: CharacterRole;
  stats: Stats;
  equippedWeapons: string[];
  armour: Armour;
  helmet: boolean;
  skills: string[];
  /** Racial special rules and Serious-Injury-derived traits — see the Trait catalogue. */
  traits: string[];
  /** Ward save threshold (mordheimer.net), e.g. 5 = "Ward (5+)". Null = no Ward save. Model-specific — not a chart lookup. */
  wardSaveThreshold: number | null;
  /** Skill lists this warrior may pick Advances from (from the warband entry; pre-filled by the template loader). Undefined/empty = unknown, treat as all lists. Henchmen normally have none. */
  skillTableIds?: SkillCategory[];
  notes: string;
}

// ---- Warband templates (sourced from rules/warbands/*.md) ----
// A read-only reference catalogue distinct from WarbandRoster above (which holds the user's own
// saved characters). This lets Character Builder pre-fill a new Character from a real warband's
// published Hero/Henchman line, instead of a blank stat sheet every time.

export type WarbandGrade = "core" | "1a" | "1b" | "1c" | "2a" | "variant";

export interface NamedRule {
  name: string;
  /** Full rule text, verbatim from the source — informational only unless it maps to a modeled Skill/Trait elsewhere. */
  text: string;
}

export interface EquipmentListItem {
  name: string;
  /** Kept as a string, not a number — source costs include things like "1st free/2 gc" or "3 times the cost". */
  cost: string;
}

export interface EquipmentList {
  id: string;
  name: string;
  meleeWeapons: EquipmentListItem[];
  missileWeapons: EquipmentListItem[];
  armour: EquipmentListItem[];
}

export interface UnitTemplate {
  id: string;
  name: string;
  role: CharacterRole;
  /** Gold crowns to hire. Null for units that aren't hired individually (e.g. warband-supplied). */
  cost: number | null;
  /** Roster composition limit as written, e.g. "1" (exactly one), "0-1", "0-2", "0-5", "any" — kept as free text since the source phrasing varies too much to force into a single numeric shape. */
  rosterLimit: string;
  startingExperience: number;
  stats: Stats;
  equipmentListId: string;
  /** Skill categories this unit type may pick advances from. */
  skillTableIds: SkillCategory[];
  specialRules: NamedRule[];
  /** Trait ids (data/traits.ts) this unit type always has, on top of the warband's raceTraits — e.g. No Pain on every undead henchman but not the Necromancer. */
  traitIds?: string[];
  notes?: string;
}

export interface WarbandTemplate {
  id: string;
  name: string;
  grade: WarbandGrade;
  race: string;
  originalSetting: string;
  sourcebook: string;
  /** Skill ids (data/skills.ts / data/traits.ts) auto-implied for every member of this warband, e.g. Dwarf warbands -> ["hard_to_kill", "hard_head"]. Only set where a rule already maps to something modeled — see rules/warbands for the full, unabridged text of every rule this warband has, whether modeled or not. */
  raceTraits: string[];
  /** Every warband-wide special rule, verbatim, whether or not it's mechanically modeled elsewhere. */
  specialRules: NamedRule[];
  /** Skill ids unique to this warband (e.g. Dwarf's Master of Blades) — these should also exist in data/skills.ts. */
  warbandSkillIds: string[];
  equipmentLists: EquipmentList[];
  heroTemplates: UnitTemplate[];
  henchmanTemplates: UnitTemplate[];
  sourceUrl: string;
  /** Roster composition limits from the "Choice of Warriors" paragraph. */
  composition?: {
    /** Minimum models at creation (usually 3). Null if not stated. */
    minModels: number | null;
    /** Maximum warriors in the warband. Null if not stated or unlimited. */
    maxModels: number | null;
    /** Gold crowns available to recruit the initial warband (usually 500). Null if not stated. */
    startingGold: number | null;
    /** The paragraph, verbatim, so the UI can show the exact wording (incl. caveats). */
    text: string;
  };
}

export interface WarbandRoster {
  warbandName: string;
  characters: Character[];
  customWeapons: Weapon[];
  customSkills: Skill[];
  customTraits?: Trait[];
}

/**
 * Group-wide toggles for optional/house rules — off by default, matching this tool's documented
 * v1 defaults, but switchable per install from the House Rules tab rather than requiring a code
 * change. Stored on `AppData` (state/storage.ts), not per-character, since these are table-wide
 * agreements, not something that varies model to model.
 */
export interface HouseRules {
  /** Strength erodes armour saves above a threshold (core rulebook chart 01:734-752, engine/armourSave.ts) — off by default per this group's current ruling. */
  strengthArmourPiercing: boolean;
}

export function defaultHouseRules(): HouseRules {
  return { strengthArmourPiercing: false };
}

// ---- Engine-facing types ----

export interface CombatContext {
  charging: boolean;
  fightingMultiple: boolean; // fighting 2+ enemies
  movedThisTurn: boolean; // ranged only
  cover: boolean;
  longRange: boolean;
  largeTarget: boolean;
  critMode: CritMode;
  /** Hatred trait: first turn of hand-to-hand combat against an enemy this model hates. */
  vsHatedEnemy: boolean;
  /** First turn of this hand-to-hand combat (Flail / Morning Star / Censer Strength bonus, Chain Sticks). Charging always implies this. */
  firstTurnOfCombat: boolean;
  /** Fighting inside buildings or ruins (Pit Fighter skill: +1 WS, +1 A). */
  insideBuildings: boolean;
}

export function defaultCombatContext(): CombatContext {
  return {
    charging: false,
    fightingMultiple: false,
    movedThisTurn: false,
    cover: false,
    longRange: false,
    largeTarget: false,
    critMode: "standard",
    vsHatedEnemy: false,
    firstTurnOfCombat: false,
    insideBuildings: false,
  };
}

export interface DefenderProfile {
  WS: number;
  T: number;
  S: number;
  /** Wounds characteristic — the target only rolls for Injury once it has lost all of them this phase (01:768). */
  W: number;
  armour: Armour;
  helmet: boolean;
  activeSkillIds: string[];
  activeTraitIds: string[];
  /** How many Parry-granting items (Parry weapons + a Buckler) this defender has this turn (0, 1, or 2). */
  parryWeaponCount: 0 | 1 | 2;
  /** Whether a failed Parry attempt may be re-rolled once. Core rule 01:846: buckler + sword (two swords do NOT); Dwarf Axe + any other Parry item (02:296); Fighting Claws (02:308); Iron Fist paired with a sword or another Iron Fist (02:409). See domain/opponentScenario.ts parryRerollFromItems. */
  parryReroll: boolean;
  /** Ward save threshold, e.g. 5 = "Ward (5+)". Null = no Ward save. */
  wardSaveThreshold: number | null;
}

export interface AttackerWeaponLoadout {
  weapon: Weapon;
  attacks: number; // attacks allocated to this weapon this turn (before skill attackCountModifier)
}

export interface InjuryBreakdown {
  /** Injury result ignored entirely (Undead Construct 4+) — the wound is still lost. */
  none?: number;
  knockedDown: number;
  stunned: number;
  outOfAction: number;
}
