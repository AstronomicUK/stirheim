// Campaign-level roster model used by the Phase 2 resolvers (src/rules/resolve).
//
// This is the *rules* view of a warband: everything a resolver needs to apply an injury, an
// advance, a purchase or an exploration result, and nothing about storage or UI. The persisted
// database rows (src/domain, Phase 3) map onto these shapes one to one; ids are opaque strings.
//
// Rules entities are referenced by their stable string ids from src/rules/data:
//   warbandTemplateId -> WARBAND_TEMPLATES[].id          unitTemplateId -> UnitTemplate.id
//   itemId            -> ITEMS[].id                        skillId -> SKILLS[].id or WarbandSkill.id
//   spellId           -> SpellLore.spells[].id             hiredSwordId -> HIRED_SWORDS[].id
//   injuryCode        -> HERO_INJURIES[].code

import type { Stats } from "./index";
import type { StatKey } from "./common";

export type RosterRole = "hero" | "henchmanGroup" | "hiredSword";

/** One stack of an item held by a warrior, a henchman group, or the warband stash. */
export interface RosterItem {
  itemId: string | null;
  /** Free-text treasure or house items when itemId is null. */
  customName?: string;
  quantity: number;
  notes?: string;
}

/** A serious injury a hero has suffered, as applied to the roster. */
export interface AppliedInjury {
  injuryCode: string;
  name: string;
  /** D66 rolled, plus any sub-roll, for the record. */
  rolled: { d66: number; subRoll?: number };
  /** Human-readable effect summary, e.g. "-1 Movement". */
  effect: string;
  /** Battle number / match id it was suffered in, if known. */
  matchId?: string;
}

/** Persistent conditions that change how a warrior plays or is administered. */
export interface WarriorFlags {
  /** Games the warrior must sit out before playing again (Deep Wound, Light arm wound, etc.). */
  missNextGames?: number;
  /** Old Battle Wound: roll a D6 at the start of each battle, 1 = cannot fight. */
  oldBattleWound?: boolean;
  /** Severe arm wound: may only use a single one-handed weapon. */
  singleHandedWeaponsOnly?: boolean;
  /** Smashed leg (1): may not run, may still charge. */
  noRunning?: boolean;
  blindedInOneEye?: boolean;
  /** From Madness: gains stupidity / frenzy. */
  stupidity?: boolean;
  frenzy?: boolean;
  /** Hardened: immune to fear. */
  immuneToFear?: boolean;
  /** Horrible Scars: causes fear. */
  causesFear?: boolean;
  /** Captured by another warband (roster keeps the record until ransomed/sold/exchanged). */
  captured?: boolean;
  /** Bitter Enmity: what the warrior now hates, verbatim from the sub-roll. */
  hates?: string;
}

export interface RosterHero {
  id: string;
  name: string;
  unitTemplateId: string;
  /** Current characteristics, with all advances and injuries applied. */
  stats: Stats;
  xp: number;
  /** Number of advances already taken (thresholds resolved). */
  levelUps: number;
  /** Skill tables this hero may pick from: core categories and/or warband skill table ids. */
  skillTableIds: string[];
  skillIds: string[];
  spellIds: string[];
  injuries: AppliedInjury[];
  flags: WarriorFlags;
  equipment: RosterItem[];
  /** Large creatures count 20 rating points instead of 5 (rulebook "Warband rating"). */
  isLarge?: boolean;
  /** Dead or retired: kept for history, excluded from play and rating. */
  status: "active" | "dead" | "retired" | "captured";
  notes?: string;
}

export interface RosterHenchmanGroup {
  id: string;
  name: string;
  unitTemplateId: string;
  size: number;
  /** Group characteristics (identical for every member). */
  stats: Stats;
  xp: number;
  levelUps: number;
  /** Increases already taken per stat; henchmen may never exceed +1 on any characteristic. */
  statIncreases: Partial<Record<StatKey, number>>;
  equipment: RosterItem[];
  isLarge?: boolean;
  notes?: string;
  /** Names of the individual models, when the player has written them down. */
  modelNames?: string[];
}

export interface RosterHiredSword {
  id: string;
  hiredSwordId: string;
  name: string;
  stats: Stats;
  xp: number;
  levelUps: number;
  skillIds: string[];
  injuries: AppliedInjury[];
  flags: WarriorFlags;
  /** Equipment is fixed by the hired sword's entry and cannot be bought or sold. */
  equipment: RosterItem[];
  status: "active" | "dead" | "left";
}

export interface RosterWarband {
  id: string;
  name: string;
  warbandTemplateId: string;
  gold: number;
  wyrdstone: number;
  /** 2D6 rolled at the last post-battle submission; caps the experience of new henchmen recruits. */
  veteranPool: number | null;
  heroes: RosterHero[];
  henchmenGroups: RosterHenchmanGroup[];
  hiredSwords: RosterHiredSword[];
  stash: RosterItem[];
  notes?: string;
  /** Names of the individual models, when the player has written them down. */
  modelNames?: string[];
}

/**
 * Per-campaign rule switches. Defaults match Tom's group (docs/PLANNING.md "House rules"):
 * armour erosion off, optional crit tables on, half-price armour on.
 */
export interface CampaignHouseRules {
  /** Strength erodes armour saves (core chart). Off by house rule. */
  strengthArmourPiercing: boolean;
  /** Use the expanded per-weapon-type critical hit charts (Optional Rules). */
  optionalCriticalTables: boolean;
  /** Armour costs half its listed price, rounded down. Shields and helmets are excluded. */
  halfPriceArmour: boolean;
  /** A Rabbit's Foot re-rolls one die in the battle only; its exploration re-roll is off (house rule). */
  rabbitsFootBattleOnly: boolean;
}

export function defaultCampaignHouseRules(): CampaignHouseRules {
  return { strengthArmourPiercing: false, optionalCriticalTables: true, halfPriceArmour: true, rabbitsFootBattleOnly: true };
}

/** Any change a resolver makes, so the UI can narrate it and the server can audit it. */
export interface ResolutionEvent {
  kind: string;
  /** Warrior or group id the event applies to, if any. */
  subjectId?: string;
  /** Plain-English line, e.g. "Test Captain: Weapon Skill 4 -> 5". */
  message: string;
  data?: Record<string, unknown>;
}

/** Standard resolver return: the new state plus what happened. Resolvers never mutate inputs. */
export interface Resolution<T> {
  value: T;
  events: ResolutionEvent[];
}
