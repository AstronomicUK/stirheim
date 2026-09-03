// Campaign content catalogues: Hired Swords, Dramatis Personae and Scenarios.
//
// These model what the mordheimer.net scrape actually captured (reference/rules/
// 03-campaigns-magic-optional-rules.md lines 1097-1446): the general rules text plus the summary
// index tables. The per-entry detail (stat lines, equipment, special rules, full scenario rules)
// was NOT captured, so it lives behind clearly optional fields that stay undefined until a later
// extraction pass fills them in. Nothing here should be invented to fill those gaps.

import type { NamedRule, Price, Stats } from "./common";

/**
 * mordheimer.net's content grade, kept as the source's own string: "core" (original rulebook),
 * "1a" (official per the 2005 Rules Review), "1b" (unofficial but GW/Fanatic-released), "1c"
 * (experimental, vouched for), "2a" (reliable fan material). The `string` fallback keeps any
 * further grade the site adds from breaking the type.
 */
export type ContentGrade = "core" | "1a" | "1b" | "1c" | "2a" | "2b" | "3" | string;

/**
 * Full write-up for a Hired Sword or special character. Not in the scrape yet — populate in a
 * later pass from mordheimer.net/docs/hired-swords/<slug> (and the Dramatis Personae equivalents).
 */
export interface HiredSwordDetail {
  stats: Stats;
  /** Equipment lines verbatim, e.g. "Dwarf axe, double-handed axe, helmet". */
  equipment: string[];
  /** Skill tables the Hired Sword may pick from when he gains an advance, e.g. "Combat", "Strength". */
  skillTables: string[];
  specialRules: NamedRule[];
  /** "May be hired by" text verbatim, e.g. "Any warband except Skaven, Undead and Possessed". */
  mayBeHiredBy: string;
  /** Warband rating contribution text verbatim, e.g. "+25 points plus 1 point for each Experience point". */
  rating: string;
}

export interface HiredSwordSummary {
  /** snake_case of `name`. */
  id: string;
  name: string;
  /** Hire fee as listed. `base` is null where the fee isn't a plain gold amount ("Hero", "2 treasures"). */
  hireCost: Price;
  /** Per-battle upkeep. Null where the index shows "n/a". */
  upkeep: Price | null;
  grade: ContentGrade;
  /** Publication as listed in the index, e.g. "Mordheim Rulebook", "Town Cryer 13 (Lustria)". */
  source: string;
  /** Anything the index flags but doesn't explain (e.g. an asterisked upkeep whose footnote wasn't captured). */
  notes?: string;
  /** Not in the scrape yet. Populate in a later pass from mordheimer.net/docs/hired-swords/<slug>. */
  detail?: HiredSwordDetail;
}

export interface DramatisPersonaSummary {
  /** snake_case of `name`. */
  id: string;
  name: string;
  /** Hire fee as listed. Null where the index shows "n/a" (e.g. Bertha Bestraufrung, who can't be hired for gold). */
  hireCost: Price | null;
  /** Per-battle upkeep. Null where the index shows "n/a" or "—". */
  upkeep: Price | null;
  grade: ContentGrade;
  source: string;
  /** Anything the index flags but doesn't explain (e.g. an asterisked upkeep whose footnote wasn't captured). */
  notes?: string;
  /** Not in the scrape yet. Same shape as a Hired Sword's write-up. */
  detail?: HiredSwordSummary["detail"];
}

/** The setting filter values used by mordheimer.net's scenario index. */
export type ScenarioSetting = "Mordheim" | "Albion" | "Khemri" | "Lustria" | "The Empire" | string;

export interface ScenarioSummary {
  /** snake_case of `title`, suffixed with the source (and author if needed) when several scenarios share a title. */
  id: string;
  title: string;
  /** The index's one-line summary, verbatim ("(no description given)" where the index had none). */
  description: string;
  setting: ScenarioSetting;
  author: string;
  /** Publication as listed in the index, e.g. "Mordheim Rulebook", "Town Cryer #5", "Archive Pestilen". */
  source: string;
  /** Full rules Markdown — not in the scrape yet; only the core rulebook scenarios need it for v1. */
  rulesMarkdown?: string;
}
