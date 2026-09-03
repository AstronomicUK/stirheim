// Campaign content catalogues: Hired Swords, Dramatis Personae and Scenarios.
//
// The summary rows (name / cost / upkeep / grade / source) come from the index tables captured in
// reference/rules/03-campaigns-magic-optional-rules.md lines 1097-1446. The per-entry write-ups
// (`detail`) come from the per-grade sub-pages rescraped into reference/rules/04-hired-swords.md and
// 05-dramatis-personae.md. Everything in `detail` is verbatim source text (only the scraper's review
// markers are stripped); nothing is invented to fill gaps, so a field the page doesn't have is "".
// Scenario rules text is still not captured.

import type { NamedRule, Stats } from "./common";
import type { Price } from "./common";

/**
 * mordheimer.net's content grade, kept as the source's own string: "core" (original rulebook),
 * "1a" (official per the 2005 Rules Review), "1b" (unofficial but GW/Fanatic-released), "1c"
 * (experimental, vouched for), "2a" (reliable fan material). The `string` fallback keeps any
 * further grade the site adds from breaking the type.
 */
export type ContentGrade = "core" | "1a" | "1b" | "1c" | "2a" | "2b" | "3" | string;

/** One row of a profile table. Most entries have one; mounts, companions and pairs add more. */
export interface StatProfile {
  /** The table's first-column label ("Troll Slayer", "Warhorse", "Ulli"); the entry or section name when the column is blank. */
  name: string;
  /**
   * Integer characteristics. Where the source cell isn't a plain integer ("5*", "1(2)", "D6", "-")
   * this holds the leading integer (0 when there is none) and `rawStats` keeps the cells verbatim.
   */
  stats: Stats;
  /** Present only when some cell wasn't a plain integer: the nine cells verbatim, in M..Ld order. */
  rawStats?: string[];
  /** The extra "Save" column a few fan entries add, e.g. "6+". */
  save?: string;
}

/**
 * Full write-up for a Hired Sword or Dramatis Persona, verbatim from the rescraped per-grade pages.
 * Text fields keep the page's Markdown (links, italics, tables). Fields the page lacks are "".
 */
export interface HiredSwordDetail {
  /** The "_Source: …_" line minus the italics, e.g. "Source: Mordheim Rulebook ([PDF](…))". */
  sourceLine: string;
  /** The hire/upkeep line verbatim, e.g. "25 gold crowns to hire +10 gold crowns upkeep". "" where the page has none (see `hireFee`). */
  hireLine: string;
  /** Text after "**Hire Fee:**" — mostly Dramatis Personae whose fee is conditional or "None". */
  hireFee?: string;
  /** The flavour paragraphs (italic and otherwise), verbatim, joined by blank lines. */
  flavour: string;
  /** Text after "**May be Hired:**" (or empty). */
  mayBeHired: string;
  /** Text after "**Rating:**". */
  rating: string;
  profiles: StatProfile[];
  /** Text after "**Weapons/Armour:**" (or "**Weapons and Armour:**"). */
  weaponsArmour: string;
  /** Text after "**Equipment:**" — the label some pages use instead of Weapons/Armour. */
  equipment?: string;
  /** Text after "**Skills:**", or the body of a "SKILLS" block (personae list named skills there). */
  skills: string;
  /** Text after "**Spells:**"/"**Prayers:**", or the body of a "SPELLS"/"PRAYERS …" block. */
  spells?: string;
  /** The "Special Rules" block, one entry per "**Name:** text" paragraph (sub-headings and tables kept in `text`). */
  specialRules: NamedRule[];
  /** A skills table unique to this Hired Sword, e.g. "TROLL SLAYER SKILLS". */
  uniqueSkills?: { tableName: string; intro?: string; skills: NamedRule[] };
  /** Any other "####" block, name = heading, text = verbatim body (e.g. "Dark Magic", "Wolf Companion", a second "Special Rules (…)"). */
  otherSections?: NamedRule[];
  /** "04-hired-swords.md:<start>-<end>" — the entry's line range in reference/rules. */
  sourceFile: string;
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
  /** Full write-up from the per-grade page; absent only if no page entry matched this index row. */
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
  /** Full write-up from the per-grade page; same shape as a Hired Sword's. */
  detail?: HiredSwordDetail;
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
