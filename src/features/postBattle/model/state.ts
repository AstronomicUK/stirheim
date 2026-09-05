// The post-battle report draft: everything the player has entered, and nothing derived from it.
//
// The draft is a plain JSON object so it can sit in localStorage between sittings ("Continue
// later"). Every edit is a pure function `(draft) => draft`; the derived view (who is injured,
// which xp lines result, what the exploration found) is recomputed from the draft plus the roster
// in ./derive.ts. Dice are stored as the player rolled them; the rules are applied on read.

import type { BattleLiveState } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import type { AdvanceDraft } from '../../advances/model'

export const REPORT_DRAFT_VERSION = 2

export type ReportResult = 'won' | 'lost' | 'draw'

export const STEP_IDS = ['outcome', 'casualties', 'injuries', 'experience', 'advances', 'exploration', 'veterans', 'review'] as const
export type StepId = (typeof STEP_IDS)[number]

export const STEP_TITLES: Record<StepId, string> = {
  outcome: 'Outcome',
  casualties: 'Casualties',
  injuries: 'Injuries',
  experience: 'Experience',
  advances: 'Advances',
  exploration: 'Exploration',
  veterans: 'Veterans & notes',
  review: 'Review',
}

/** One hero's Serious Injury rolls, in the order they were made. */
export interface HeroInjuryFlow {
  /** D66 results; `subRoll` stays null until the injury asks for one and the player supplies it. */
  rolls: { d66: number; subRoll: number | null }[]
  /** Multiple Injuries: the D6 that says how many further rolls to make. */
  countRoll: number | null
}

export interface FoundItem {
  item_rules_id: string | null
  custom_name: string | null
  quantity: number
}

export interface XpExtra {
  amount: number
  reason: string
}

/**
 * What to do with an advance earned this battle: roll and choose in the wizard, roll now and pick
 * the skill or spell later (Bestow advancements screen), or leave the whole advance for later.
 */
export type AdvanceMode = 'now' | 'pickLater' | 'later'

/** Key of an advance earned this battle: the warrior and the threshold crossed. */
export function advanceKey(subjectId: string, thresholdXp: number): string {
  return `${subjectId}:${thresholdXp}`
}

/** The player rolls a different number of dice than the app suggests (skills, equipment, map bonuses, missed rules). */
export interface DiceOverride {
  count: number
  reason: string
}

export interface ExplorationDraft {
  /** Null = roll what the app suggests. */
  diceOverride: DiceOverride | null
  /** One entry per die allowed; null until entered. */
  rolls: (number | null)[]
  /** The location's own D6, when it has a table. */
  subRoll: number | null
  /** The location's characteristic test, when it has one: null until recorded. */
  testPassed: boolean | null
  /** Gold found at the location; null = not entered yet (the fixed amount is used when the text states one). */
  gold: number | null
  /** Shards the location itself gives (on top of the dice total); null = not entered yet. */
  extraShards: number | null
  /** Items found; null = the suggestions from the location text stand as they are. */
  items: FoundItem[] | null
  notes: string
}

export interface ReportDraft {
  version: typeof REPORT_DRAFT_VERSION
  /** Index into STEP_IDS. */
  step: number
  result: ReportResult | null
  routed: boolean
  /** Apply the underdog bonus (defaults on when an opponent's rating was higher). */
  underdog: boolean
  /** Heroes and hired swords taken out of action. */
  heroesOut: string[]
  /** Henchman group id -> models out of action. */
  groupsOut: Record<string, number>
  /** Hero or hired sword id -> enemies they put out of action. */
  enemiesOut: Record<string, number>
  heroInjuries: Record<string, HeroInjuryFlow>
  /** Hired sword id -> D6. */
  swordInjuries: Record<string, number | null>
  /** Group id -> one D6 per model out of action. */
  groupInjuries: Record<string, (number | null)[]>
  /** Hero or hired sword id -> reason no injury roll is made (counts as a full recovery); logged as an adjustment. */
  injurySkips: Record<string, string>
  /** Group id -> a different number of injury dice than models out of action, with the reason. */
  groupInjuryDice: Record<string, DiceOverride>
  /** Subject id -> extra experience lines (scenario objectives and the like). */
  xpExtras: Record<string, XpExtra[]>
  /** advanceKey -> the dice and choices for an advance earned this battle. */
  advances: Record<string, AdvanceDraft>
  /** advanceKey -> how the player wants to handle it (default 'now'). */
  advanceModes: Record<string, AdvanceMode>
  exploration: ExplorationDraft
  /** Wyrdstone picked up during the battle itself (scenario objectives). */
  battleWyrdstone: number
  /** Gold looted during the battle itself. */
  battleGold: number
  /** The two veteran-pool dice. */
  veteranPool: [number | null, number | null]
  notes: string
}

export function emptyExploration(): ExplorationDraft {
  return { diceOverride: null, rolls: [], subRoll: null, testPassed: null, gold: null, extraShards: null, items: null, notes: '' }
}

export function emptyDraft(): ReportDraft {
  return {
    version: REPORT_DRAFT_VERSION,
    step: 0,
    result: null,
    routed: false,
    underdog: true,
    heroesOut: [],
    groupsOut: {},
    enemiesOut: {},
    heroInjuries: {},
    swordInjuries: {},
    groupInjuries: {},
    injurySkips: {},
    groupInjuryDice: {},
    xpExtras: {},
    advances: {},
    advanceModes: {},
    exploration: emptyExploration(),
    battleWyrdstone: 0,
    battleGold: 0,
    veteranPool: [null, null],
    notes: '',
  }
}

/**
 * Pre-fill the draft from the live battle sheet: who went out of action, how many enemies each
 * hero put down, whether the warband routed, and the wyrdstone and loot tallied during the game.
 * Tallies for warriors no longer on the roster are ignored.
 */
export function seedFromBattleSheet(roster: RosterWarband, live: BattleLiveState | undefined): ReportDraft {
  const draft = emptyDraft()
  if (!live) return draft
  const warriorIds = new Set([...roster.heroes.map((h) => h.id), ...roster.hiredSwords.map((s) => s.id)])
  const groups = new Map(roster.henchmenGroups.map((g) => [g.id, g]))
  for (const tally of live.tallies) {
    if (tally.kind === 'hero' && warriorIds.has(tally.id)) {
      if (tally.outOfAction > 0) draft.heroesOut.push(tally.id)
      if (tally.enemiesOutOfAction > 0) draft.enemiesOut[tally.id] = tally.enemiesOutOfAction
    } else if (tally.kind === 'group') {
      const group = groups.get(tally.id)
      if (group && tally.outOfAction > 0) draft.groupsOut[tally.id] = Math.min(group.size, tally.outOfAction)
    }
  }
  draft.routed = live.routed
  draft.battleWyrdstone = live.wyrdstoneFound
  const lootLines = live.loot.map((l) => `Loot: ${l}`)
  draft.notes = [...lootLines, live.notes.trim()].filter((s) => s !== '').join('\n')
  return draft
}

// ---------------------------------------------------------------------------------------------
// Reducers
// ---------------------------------------------------------------------------------------------

export function setStep(draft: ReportDraft, step: number): ReportDraft {
  return { ...draft, step: Math.max(0, Math.min(STEP_IDS.length - 1, Math.trunc(step))) }
}

export function setResult(draft: ReportDraft, result: ReportResult): ReportDraft {
  return { ...draft, result }
}

export function setRouted(draft: ReportDraft, routed: boolean): ReportDraft {
  return { ...draft, routed }
}

export function setUnderdog(draft: ReportDraft, underdog: boolean): ReportDraft {
  return { ...draft, underdog }
}

/** Marking a hero back in clears whatever injury rolls were entered for them. */
export function setHeroOut(draft: ReportDraft, id: string, out: boolean): ReportDraft {
  const already = draft.heroesOut.includes(id)
  if (out === already) return draft
  if (out) return { ...draft, heroesOut: [...draft.heroesOut, id] }
  const heroInjuries = { ...draft.heroInjuries }
  delete heroInjuries[id]
  const swordInjuries = { ...draft.swordInjuries }
  delete swordInjuries[id]
  return { ...draft, heroesOut: draft.heroesOut.filter((h) => h !== id), heroInjuries, swordInjuries }
}

/** Models of a group out of action, clamped to 0..size; extra injury dice beyond the count are dropped. */
export function setGroupOut(draft: ReportDraft, id: string, count: number, size: number): ReportDraft {
  const clamped = Math.max(0, Math.min(size, Math.trunc(count)))
  const groupsOut = { ...draft.groupsOut }
  if (clamped === 0) delete groupsOut[id]
  else groupsOut[id] = clamped
  const rolls = (draft.groupInjuries[id] ?? []).slice(0, clamped)
  const groupInjuries = { ...draft.groupInjuries }
  if (rolls.length === 0) delete groupInjuries[id]
  else groupInjuries[id] = rolls
  return { ...draft, groupsOut, groupInjuries }
}

export function setEnemiesOut(draft: ReportDraft, id: string, count: number): ReportDraft {
  const clamped = Math.max(0, Math.trunc(count))
  const enemiesOut = { ...draft.enemiesOut }
  if (clamped === 0) delete enemiesOut[id]
  else enemiesOut[id] = clamped
  return { ...draft, enemiesOut }
}

function flowOf(draft: ReportDraft, heroId: string): HeroInjuryFlow {
  return draft.heroInjuries[heroId] ?? { rolls: [], countRoll: null }
}

export function addHeroInjuryRoll(draft: ReportDraft, heroId: string, d66: number): ReportDraft {
  const flow = flowOf(draft, heroId)
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [heroId]: { ...flow, rolls: [...flow.rolls, { d66, subRoll: null }] } } }
}

export function setHeroInjurySubRoll(draft: ReportDraft, heroId: string, rollIndex: number, subRoll: number): ReportDraft {
  const flow = flowOf(draft, heroId)
  if (rollIndex < 0 || rollIndex >= flow.rolls.length) return draft
  const rolls = flow.rolls.map((r, i) => (i === rollIndex ? { ...r, subRoll } : r))
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [heroId]: { ...flow, rolls } } }
}

export function setHeroInjuryCount(draft: ReportDraft, heroId: string, countRoll: number): ReportDraft {
  const flow = flowOf(draft, heroId)
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [heroId]: { ...flow, countRoll } } }
}

export function resetHeroInjury(draft: ReportDraft, heroId: string): ReportDraft {
  const heroInjuries = { ...draft.heroInjuries }
  delete heroInjuries[heroId]
  return { ...draft, heroInjuries }
}

/** No injury roll for this warrior (a skill, an item, a house rule): treated as a full recovery and logged. Null clears it. */
export function setInjurySkip(draft: ReportDraft, warriorId: string, reason: string | null): ReportDraft {
  const injurySkips = { ...draft.injurySkips }
  if (reason === null) delete injurySkips[warriorId]
  else injurySkips[warriorId] = reason
  return { ...draft, injurySkips }
}

/** Roll a different number of dice for a group than models out of action; null goes back to the suggestion. */
export function setGroupInjuryDice(draft: ReportDraft, groupId: string, override: DiceOverride | null): ReportDraft {
  const groupInjuryDice = { ...draft.groupInjuryDice }
  if (override === null) delete groupInjuryDice[groupId]
  else groupInjuryDice[groupId] = { count: Math.max(0, Math.min(20, Math.trunc(override.count))), reason: override.reason }
  return { ...draft, groupInjuryDice }
}

export function setSwordInjury(draft: ReportDraft, swordId: string, d6: number | null): ReportDraft {
  return { ...draft, swordInjuries: { ...draft.swordInjuries, [swordId]: d6 } }
}

export function setGroupInjuryRoll(draft: ReportDraft, groupId: string, index: number, d6: number | null): ReportDraft {
  const count = draft.groupInjuryDice[groupId]?.count ?? draft.groupsOut[groupId] ?? 0
  if (index < 0 || index >= count) return draft
  const rolls = [...(draft.groupInjuries[groupId] ?? [])]
  while (rolls.length < count) rolls.push(null)
  rolls[index] = d6
  return { ...draft, groupInjuries: { ...draft.groupInjuries, [groupId]: rolls } }
}

export function addXpExtra(draft: ReportDraft, subjectId: string, extra: XpExtra): ReportDraft {
  const amount = Math.trunc(extra.amount)
  const reason = extra.reason.trim()
  if (amount === 0 || reason === '') return draft
  const list = [...(draft.xpExtras[subjectId] ?? []), { amount, reason }]
  return { ...draft, xpExtras: { ...draft.xpExtras, [subjectId]: list } }
}

export function removeXpExtra(draft: ReportDraft, subjectId: string, index: number): ReportDraft {
  const list = (draft.xpExtras[subjectId] ?? []).filter((_, i) => i !== index)
  const xpExtras = { ...draft.xpExtras }
  if (list.length === 0) delete xpExtras[subjectId]
  else xpExtras[subjectId] = list
  return { ...draft, xpExtras }
}

/** Start a draft for one earned advance; a no-op when one exists (the wizard seeds on first view). */
export function seedAdvance(draft: ReportDraft, key: string, advance: AdvanceDraft): ReportDraft {
  if (draft.advances[key]) return draft
  return { ...draft, advances: { ...draft.advances, [key]: advance } }
}

export function updateAdvance(draft: ReportDraft, key: string, edit: (advance: AdvanceDraft) => AdvanceDraft): ReportDraft {
  const current = draft.advances[key]
  if (!current) return draft
  const next = edit(current)
  if (next === current) return draft
  return { ...draft, advances: { ...draft.advances, [key]: next } }
}

export function setAdvanceMode(draft: ReportDraft, key: string, mode: AdvanceMode): ReportDraft {
  if ((draft.advanceModes[key] ?? 'now') === mode) return draft
  return { ...draft, advanceModes: { ...draft.advanceModes, [key]: mode } }
}

function withExploration(draft: ReportDraft, patch: Partial<ExplorationDraft>): ReportDraft {
  return { ...draft, exploration: { ...draft.exploration, ...patch } }
}

/** Roll a different number of exploration dice than suggested (1..12); null goes back to the suggestion. The reason is required to file. */
export function setExplorationDiceOverride(draft: ReportDraft, override: DiceOverride | null): ReportDraft {
  if (override === null) return withExploration(draft, { diceOverride: null })
  return withExploration(draft, { diceOverride: { count: Math.max(1, Math.min(12, Math.trunc(override.count))), reason: override.reason } })
}

/**
 * One exploration die. Changing the dice can change the location found, so the location's own
 * answers (sub-roll, test, gold, items) start again.
 */
export function setExplorationRoll(draft: ReportDraft, index: number, value: number | null): ReportDraft {
  if (index < 0) return draft
  const rolls = [...draft.exploration.rolls]
  while (rolls.length <= index) rolls.push(null)
  if (rolls[index] === value) return draft
  rolls[index] = value
  return withExploration(draft, { rolls, subRoll: null, testPassed: null, gold: null, extraShards: null, items: null })
}

export function setExplorationRolls(draft: ReportDraft, rolls: (number | null)[]): ReportDraft {
  return withExploration(draft, { rolls, subRoll: null, testPassed: null, gold: null, extraShards: null, items: null })
}

/** The location's D6; a new value resets the answers that depend on it. */
export function setExplorationSubRoll(draft: ReportDraft, subRoll: number | null): ReportDraft {
  if (draft.exploration.subRoll === subRoll) return draft
  return withExploration(draft, { subRoll, gold: null, extraShards: null, items: null })
}

export function setExplorationTest(draft: ReportDraft, testPassed: boolean | null): ReportDraft {
  return withExploration(draft, { testPassed, gold: null, extraShards: null, items: null })
}

export function setExplorationGold(draft: ReportDraft, gold: number | null): ReportDraft {
  return withExploration(draft, { gold: gold === null ? null : Math.max(0, Math.trunc(gold)) })
}

export function setExplorationExtraShards(draft: ReportDraft, extraShards: number | null): ReportDraft {
  return withExploration(draft, { extraShards: extraShards === null ? null : Math.max(0, Math.trunc(extraShards)) })
}

export function setExplorationItems(draft: ReportDraft, items: FoundItem[] | null): ReportDraft {
  return withExploration(draft, { items })
}

export function setExplorationNotes(draft: ReportDraft, notes: string): ReportDraft {
  return withExploration(draft, { notes })
}

export function setBattleWyrdstone(draft: ReportDraft, count: number): ReportDraft {
  return { ...draft, battleWyrdstone: Math.max(0, Math.trunc(count)) }
}

export function setBattleGold(draft: ReportDraft, gold: number): ReportDraft {
  return { ...draft, battleGold: Math.max(0, Math.trunc(gold)) }
}

export function setVeteranDie(draft: ReportDraft, index: 0 | 1, value: number | null): ReportDraft {
  const veteranPool: [number | null, number | null] = [draft.veteranPool[0], draft.veteranPool[1]]
  veteranPool[index] = value
  return { ...draft, veteranPool }
}

export function setNotes(draft: ReportDraft, notes: string): ReportDraft {
  return { ...draft, notes }
}

/** True for a whole number within [1, sides]. */
export function isDie(value: number | null | undefined, sides: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= sides
}
