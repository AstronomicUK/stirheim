// Full per-scenario rules as scraped from mordheimer.net (reference/rules/06-scenarios.md).
// Kept separate from `ScenarioSummary` (types/campaignContent.ts) so the index table and the full
// page text can be loaded independently — the details are large (verbatim Markdown, some with
// inline images) and only needed when a scenario is actually opened.

import type { NamedRule } from "./common";

export interface ScenarioDetail {
  /** The site's own scenario number, e.g. 2 for "2. Skirmish"; null where the page has no number. */
  number: number | null;
  /** URL group segment, e.g. "mordheim-rulebook", "town-cryer", "archive-pestilen", "fanatic-magazine", "fanatic-online", "other". */
  group: string;
  /** The mordheimer.net page URL. */
  url: string;
  /**
   * Verbatim intro — everything between the metadata block (Source / Setting / Author / Notes) and the
   * first section heading, normally one or more italic paragraphs. Paragraphs are joined with blank lines.
   */
  intro: string;
  /**
   * Every section of the page in page order. `name` is the heading text title-cased (trailing ":" or "."
   * dropped); `text` is the verbatim body Markdown, including any nested #### sub-headings.
   */
  sections: NamedRule[];
  /** Body of the "Experience" section, if present — a duplicate of that section for quick access. */
  experience: string | null;
  /** The whole page body after the title heading, verbatim (metadata lines, intro and all sections). */
  rulesMarkdown: string;
  /** Path + line range in reference/rules, e.g. "06-scenarios.md:2632-2668". */
  sourceFile: string;
}
