// Pure helpers for the scenario screens: library grouping and search, the custom-scenario form
// schema and its mapping to the API input, and the Markdown skeleton for a new scenario.

import { z } from 'zod'
import type { ScenarioInput } from '../../api/scenarios'
import type { ScenarioRow } from '../../domain'
import { CORE_RULEBOOK_SCENARIO_IDS, SCENARIOS } from '../../rules/data/campaign/scenarios'
import type { ScenarioSummary } from '../../rules/types/campaignContent'

// ---- Library grouping ----

export type ScenarioKind = 'builtin' | 'custom'

export function parseScenarioKind(kind: string | undefined): ScenarioKind | null {
  return kind === 'builtin' || kind === 'custom' ? kind : null
}

/** The nine rulebook scenarios in rulebook order (ids that are missing from the index are skipped). */
export function coreScenarios(all: ScenarioSummary[] = SCENARIOS, ids: string[] = CORE_RULEBOOK_SCENARIO_IDS): ScenarioSummary[] {
  const byId = new Map(all.map((s) => [s.id, s]))
  return ids.map((id) => byId.get(id)).filter((s): s is ScenarioSummary => s !== undefined)
}

/** Everything in the index that is not a core rulebook scenario, in index order. */
export function libraryScenarios(all: ScenarioSummary[] = SCENARIOS, coreIds: string[] = CORE_RULEBOOK_SCENARIO_IDS): ScenarioSummary[] {
  const core = new Set(coreIds)
  return all.filter((s) => !core.has(s.id))
}

/** Distinct settings present, alphabetical with Mordheim first (it is the home setting). */
export function settingsPresent(scenarios: Pick<ScenarioSummary, 'setting'>[]): string[] {
  const present = Array.from(new Set(scenarios.map((s) => s.setting.trim()).filter(Boolean)))
  present.sort((a, b) => a.localeCompare(b))
  const home = present.indexOf('Mordheim')
  if (home > 0) {
    present.splice(home, 1)
    present.unshift('Mordheim')
  }
  return present
}

export const ALL_SETTINGS = 'all'
export type SettingFilter = typeof ALL_SETTINGS | (string & {})

/**
 * Case-insensitive search over title, description, author and source. Every whitespace-separated
 * word of the query must appear somewhere; an empty query matches everything. `setting` narrows
 * further (exact match, `all` for no filter).
 */
export function filterScenarios<T extends Pick<ScenarioSummary, 'title' | 'description' | 'author' | 'source' | 'setting'>>(
  scenarios: T[],
  query: string,
  setting: SettingFilter = ALL_SETTINGS,
): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return scenarios.filter((s) => {
    if (setting !== ALL_SETTINGS && s.setting !== setting) return false
    if (words.length === 0) return true
    const haystack = `${s.title} ${s.description} ${s.author} ${s.source}`.toLowerCase()
    return words.every((w) => haystack.includes(w))
  })
}

// ---- Detail text ----

const MORDHEIMER_ORIGIN = 'https://mordheimer.net'

/**
 * The scraped Markdown references site-relative images (`![](/assets/images/...)`). Point them at
 * mordheimer.net so they load; inline data: URIs and absolute URLs are left alone.
 */
export function absoluteImageUrls(markdown: string): string {
  return markdown.replace(/(!\[[^\]]*\]\()\/(?!\/)/g, `$1${MORDHEIMER_ORIGIN}/`)
}

// ---- Custom scenario form ----

export const SCENARIO_NAME_MAX = 80
export const SCENARIO_SETTING_MAX = 40
export const SCENARIO_SUMMARY_MAX = 280
export const DEFAULT_SETTING = 'Custom'

/** The select's "shared with everyone" option; `campaignId` in the API is `null` for it. */
export const EVERYONE = ''

export const scenarioFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give the scenario a name.')
    .max(SCENARIO_NAME_MAX, `Use at most ${SCENARIO_NAME_MAX} characters.`),
  setting: z.string().trim().max(SCENARIO_SETTING_MAX, `Use at most ${SCENARIO_SETTING_MAX} characters.`),
  summary: z.string().trim().max(SCENARIO_SUMMARY_MAX, `Keep the summary under ${SCENARIO_SUMMARY_MAX} characters.`),
  rulesMarkdown: z.string(),
  /** Campaign id, or `EVERYONE` for a scenario shared with every signed-in user. */
  campaignId: z.string(),
})

export type ScenarioFormValues = z.input<typeof scenarioFormSchema>
export type ScenarioFormErrors = Partial<Record<keyof ScenarioFormValues, string>>

export const EMPTY_SCENARIO_FORM: ScenarioFormValues = {
  name: '',
  setting: DEFAULT_SETTING,
  summary: '',
  rulesMarkdown: '',
  campaignId: EVERYONE,
}

/** Runs the schema and returns either the parsed values or the first message per field. */
export function validateScenarioForm(
  values: ScenarioFormValues,
): { ok: true; data: z.output<typeof scenarioFormSchema> } | { ok: false; errors: ScenarioFormErrors } {
  const result = scenarioFormSchema.safeParse(values)
  if (result.success) return { ok: true, data: result.data }
  const errors: ScenarioFormErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ScenarioFormValues | undefined
    if (key && !(key in errors)) errors[key] = issue.message
  }
  return { ok: false, errors }
}

/** Form values to the API shape. Blank setting falls back to "Custom"; blank campaign means shared. */
export function toScenarioInput(values: ScenarioFormValues): ScenarioInput {
  return {
    name: values.name.trim(),
    setting: values.setting.trim() || DEFAULT_SETTING,
    summary: values.summary.trim(),
    rules_markdown: values.rulesMarkdown,
    campaign_id: values.campaignId || null,
  }
}

/** A stored row back into form values, for the edit screen. */
export function fromScenarioRow(row: Pick<ScenarioRow, 'name' | 'setting' | 'summary' | 'rules_markdown' | 'campaign_id'>): ScenarioFormValues {
  return {
    name: row.name,
    setting: row.setting,
    summary: row.summary,
    rulesMarkdown: row.rules_markdown,
    campaignId: row.campaign_id ?? EVERYONE,
  }
}

/** True when saving `next` would change what is stored for `initial` (whitespace-only edits do not count). */
export function scenarioFormChanged(initial: ScenarioFormValues, next: ScenarioFormValues): boolean {
  const a = toScenarioInput(initial)
  const b = toScenarioInput(next)
  return a.name !== b.name || a.setting !== b.setting || a.summary !== b.summary || a.rules_markdown !== b.rules_markdown || a.campaign_id !== b.campaign_id
}

// ---- Skeleton ----

export const SKELETON_SECTIONS = ['Terrain', 'Warbands', 'Starting the game', 'Ending the game', 'Experience'] as const

/** Section headings a rulebook scenario uses, ready to be filled in. */
export function rulesSkeleton(): string {
  return SKELETON_SECTIONS.map((name) => `## ${name}\n\n`).join('\n').trimEnd() + '\n'
}

/** Insert the skeleton only when there is nothing but whitespace to overwrite; otherwise leave the text alone. */
export function withSkeleton(current: string): string {
  return current.trim() ? current : rulesSkeleton()
}
