// Campaign-phase datasets: serious injuries, experience/advances, income and trading.
// Source: reference/rules/03-campaigns-magic-optional-rules.md (mordheimer.net scrape).
// Everything here is plain data — the roll tables, their verbatim text, and a small structured
// `effects` encoding so a roster tool can apply the result without parsing prose.

import type { DiceExpression, RollBand, StatKey } from "./common";
import type { NamedRule, Stats } from "./index";

export type { NamedRule, RollBand, StatKey, Stats, DiceExpression };

// ---- Serious Injuries (Heroes' D66 chart) ----

export type InjuryFlag =
  | "stupidity"
  | "frenzy"
  | "immuneToFear"
  | "causesFear"
  | "oldBattleWound"
  | "singleHandedWeaponsOnly"
  | "noRunning"
  | "captured"
  | "robbed"
  | "soldToThePits"
  | "bitterEnmity"
  | "blindedInOneEye";

export type InjuryEffect =
  | { kind: "dead" }
  | { kind: "statDelta"; stat: StatKey; delta: number }
  | { kind: "missNextGames"; games: number | DiceExpression }
  | { kind: "flag"; flag: InjuryFlag }
  /** All weapons, armour and equipment carried are lost. */
  | { kind: "loseEquipment" }
  | { kind: "experience"; delta: number }
  /** Roll `rolls` more times on the chart (re-rolling Dead, Captured and further Multiple Injuries). */
  | { kind: "multipleInjuries"; rolls: DiceExpression }
  /** "Roll again:" — a follow-up D6 whose bands pick one of `outcomes`. */
  | { kind: "subRoll"; die: "D6"; outcomes: InjurySubOutcome[] };

export interface InjurySubOutcome {
  band: RollBand;
  /** Verbatim outcome text. */
  text: string;
  effects: InjuryEffect[];
}

export interface InjuryResult {
  /** Stable id, e.g. "leg_wound". */
  code: string;
  /** D66 band, inclusive, as printed (11-15, 16-21, 22, ...). Only values whose digits are both 1-6 are real rolls. */
  band: RollBand;
  name: string;
  /** Verbatim rule text. */
  text: string;
  effects: InjuryEffect[];
}

export interface HenchmanInjuryRule {
  /** D6 results on which the henchman is removed from the roster. */
  deadOn: number[];
  text: string;
}

// ---- Experience ----

export type AdvanceKind =
  /** Pick a skill from one of the warrior's skill tables (wizards may generate a spell instead). */
  | "newSkill"
  /** Player chooses one of `choice`. */
  | "statChoice"
  /** A fixed +1 to `stat` (henchman table). */
  | "statIncrease"
  /** "Roll again": D6 `subRoll` bands each name the stat that goes up. */
  | "statSubRoll"
  /** Henchman table 10-12: one model becomes a Hero. */
  | "ladsGotTalent";

export interface AdvanceResult {
  /** 2D6 band, inclusive. */
  band: RollBand;
  kind: AdvanceKind;
  /** Verbatim result text. */
  text: string;
  /** statChoice: the stats the player may pick between. */
  choice?: StatKey[];
  /** statIncrease: the stat that goes up by +1. */
  stat?: StatKey;
  /** statSubRoll: D6 bands -> stat. */
  subRoll?: { band: RollBand; stat: StatKey }[];
}

export interface RacialMaximum {
  /** Profile name verbatim from the table. */
  profile: string;
  stats: Stats;
  note?: string;
}

export interface UnderdogBonus {
  /** Difference in warband rating, inclusive. */
  band: RollBand;
  /** Extra Experience points earned by the underdog's warriors. */
  bonus: number;
}

// ---- Income ----

export interface ShardsFoundRow {
  /** Total of the exploration dice, inclusive. */
  band: RollBand;
  shards: number;
}

export interface IncomeRow {
  /** Shards sold this post-battle sequence; "8+" is the final, capped row. */
  shardsSold: number | "8+";
  /** Profit in gold crowns by warband size band; index i matches WARBAND_SIZE_BANDS[i]. */
  byWarbandSize: number[];
}
