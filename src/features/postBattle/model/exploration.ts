// Exploration for the report (core rulebook, "Income"):
//   "Roll a D6 for each Hero in your warband who survives without going out of action ... Do not
//    roll for any Heroes who went out of action during the battle ... If you won your last game,
//    you may roll one extra dice."
//   "you must pick a maximum of six dice out of all the dice you roll"
//
// Judgements:
// - Only heroes who fought and were not out of action roll (hired swords never do: "Do not roll
//   for Henchmen", and hired swords are administered as henchmen). Heroes who sat the game out
//   did not "survive the battle" and give no die.
// - A warband with no such hero does not explore at all, even if it somehow won: the dice are
//   "for each Hero", the winner's die is an extra on top. Exploration is then recorded as null.
// - Routing does not stop exploration: the text only asks who survived and whether you won. A
//   routed warband lost, so it simply gets no winner's die.
// - Location rewards: fixed amounts are taken from the text; dice amounts ("D6 gc") are rolled or
//   entered by the player; a location with a characteristic test gives its rewards only when the
//   player records a pass. Item names are matched to the catalogue where possible and otherwise
//   kept as custom stash items. Conditional items ("If you roll a 1 you will also find a Lucky
//   Charm") are suggested and can be removed.

import type { ExplorationRecord, ReportAdjustment } from '../../../domain'
import { resolveEquipmentName } from '../../../rules/data/items/aliases'
import { explorationDiceAllowed, locationOutcome, resolveExploration, type ExplorationDiceAllowed, type ExplorationResult, type LocationOutcome } from '../../../rules/resolve/exploration'
import type { ExplorationLocation, ExplorationReward } from '../../../rules/types/exploration'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'
import { isDie, type ExplorationDraft, type FoundItem } from './state'

export interface ExplorationInput {
  won: boolean
  /** Fighting heroes who were not taken out of action. */
  eligibleHeroes: RosterHero[]
}

export interface DiceAmount {
  /** Sum of the amounts the text states as plain numbers. */
  fixed: number
  /** Dice expressions the text uses, to be rolled by the player ("D6 gc"). */
  expressions: string[]
  /** The amount that counts: fixed when there are no dice, otherwise what the player entered (null until then). */
  value: number | null
}

export interface ExplorationDerived {
  eligibleHeroes: RosterHero[]
  /** Dice actually rolled: the suggestion, or the player's override. Null when the warband cannot explore. */
  allowed: ExplorationDiceAllowed | null
  /** What the rulebook suggests before any override. */
  suggested: ExplorationDiceAllowed | null
  /** Set when the player rolls a different count; goes on the report as an adjustment. */
  adjustment: ReportAdjustment | null
  skippedReason: string | null
  /** Sized to the dice allowed. */
  rolls: (number | null)[]
  complete: boolean
  result: ExplorationResult | null
  location: ExplorationLocation | null
  outcome: LocationOutcome | null
  needsSubRoll: boolean
  needsTest: LocationOutcome['needsTest'] | null
  /** Rewards count: no test, or the test was recorded as passed. */
  rewardsApply: boolean
  gold: DiceAmount
  extraShards: DiceAmount
  suggestedItems: FoundItem[]
  items: FoundItem[]
  textNotes: string[]
  /** Shards from the dice total plus any the location gave. */
  totalShards: number
  problems: string[]
  record: ExplorationRecord | null
}

export function foundItemFromName(name: string, quantity = 1): FoundItem {
  const item = resolveEquipmentName(name)
  return item ? { item_rules_id: item.id, custom_name: null, quantity } : { item_rules_id: null, custom_name: name, quantity }
}

function diceAmount(rewards: ExplorationReward[], kind: 'gold' | 'wyrdstone', entered: number | null): DiceAmount {
  let fixed = 0
  const expressions: string[] = []
  for (const r of rewards) {
    if (r.kind !== kind) continue
    if (typeof r.amount === 'number') fixed += r.amount
    else if (typeof r.amount === 'string') expressions.push(r.amount)
  }
  const value = expressions.length === 0 ? fixed : entered
  return { fixed, expressions, value }
}

const NO_HEROES = 'No hero came through the battle without going out of action, so nobody can lead the search: no exploration this time.'

export function deriveExploration(draft: ExplorationDraft, roster: RosterWarband, input: ExplorationInput): ExplorationDerived {
  const empty: DiceAmount = { fixed: 0, expressions: [], value: 0 }
  const base: ExplorationDerived = {
    eligibleHeroes: input.eligibleHeroes,
    allowed: null,
    suggested: null,
    adjustment: null,
    skippedReason: null,
    rolls: [],
    complete: false,
    result: null,
    location: null,
    outcome: null,
    needsSubRoll: false,
    needsTest: null,
    rewardsApply: false,
    gold: empty,
    extraShards: empty,
    suggestedItems: [],
    items: [],
    textNotes: [],
    totalShards: 0,
    problems: [],
    record: null,
  }
  if (input.eligibleHeroes.length === 0) return { ...base, skippedReason: NO_HEROES }

  const eligible = new Set(input.eligibleHeroes.map((h) => h.id))
  const heroesOutOfAction = roster.heroes.filter((h) => !eligible.has(h.id)).map((h) => h.id)
  const suggested = explorationDiceAllowed(roster, { won: input.won, heroesOutOfAction })
  const override = draft.diceOverride
  const allowed: ExplorationDiceAllowed = override
    ? { count: override.count, capped: false, reason: `${suggested.reason}; changed to ${override.count}${override.reason.trim() ? `: ${override.reason.trim()}` : ''}` }
    : suggested
  const adjustment: ReportAdjustment | null =
    override && override.count !== suggested.count
      ? { label: 'Exploration dice', suggested: `${suggested.count} (${suggested.reason})`, used: String(override.count), reason: override.reason.trim() }
      : null
  if (allowed.count <= 0) return { ...base, allowed, suggested, skippedReason: NO_HEROES }

  const rolls: (number | null)[] = []
  for (let i = 0; i < allowed.count; i++) {
    const v = draft.rolls[i]
    rolls.push(isDie(v, 6) ? v : null)
  }
  const complete = rolls.every((r) => r !== null)
  const problems: string[] = []
  if (adjustment && adjustment.reason === '') problems.push('Say why the number of exploration dice was changed.')
  if (!complete) {
    problems.push(`Enter all ${allowed.count} exploration dice.`)
    return { ...base, allowed, suggested, adjustment, rolls, problems }
  }

  const result = resolveExploration(rolls as number[])
  const location = result.location
  let outcome: LocationOutcome | null = null
  let needsSubRoll = false
  if (location) {
    const subRoll = isDie(draft.subRoll, 6) ? draft.subRoll : undefined
    outcome = locationOutcome(location, subRoll)
    needsSubRoll = Boolean(outcome.needsSubRoll)
    if (needsSubRoll) problems.push(`${location.name}: roll the location's D6.`)
  }
  const needsTest = outcome?.needsTest ?? null
  if (needsTest && draft.testPassed === null) problems.push(`${location?.name}: record whether the test was passed.`)
  const rewardsApply = outcome !== null && !needsSubRoll && (!needsTest || draft.testPassed === true)
  const rewards = rewardsApply ? outcome!.rewards : []

  const gold = diceAmount(rewards, 'gold', draft.gold)
  const extraShards = diceAmount(rewards, 'wyrdstone', draft.extraShards)
  if (gold.value === null) problems.push(`Enter the gold found (${gold.expressions.join(' + ')} gc).`)
  if (extraShards.value === null) problems.push(`Enter the shards found at the location (${extraShards.expressions.join(' + ')}).`)

  const suggestedItems = rewards.filter((r) => r.kind === 'item' && r.itemName).map((r) => foundItemFromName(r.itemName!))
  const items = draft.items ?? suggestedItems
  const textNotes = rewards.filter((r) => r.kind === 'text').map((r) => r.text)
  const notes: string[] = []
  if (location && outcome && !needsSubRoll && outcome.text !== location.rules) notes.push(`${location.name} D6 ${draft.subRoll}: ${outcome.text}`)
  if (needsTest) notes.push(draft.testPassed ? `${needsTest.stat} test passed.` : draft.testPassed === false ? `${needsTest.stat} test failed: ${needsTest.prompt}` : '')
  notes.push(...textNotes)
  if (draft.notes.trim() !== '') notes.push(draft.notes.trim())

  const totalShards = result.shards + (extraShards.value ?? 0)
  const record: ExplorationRecord | null =
    problems.length === 0
      ? {
          diceAllowed: allowed.count,
          diceReason: allowed.reason,
          rolls: rolls as number[],
          total: result.total,
          shards: totalShards,
          locationId: location?.id ?? null,
          locationName: location?.name ?? null,
          locationText: location ? location.rules : null,
          subRoll: location?.subRoll ? (draft.subRoll ?? null) : null,
          goldFound: gold.value ?? 0,
          itemsFound: items.filter((i) => i.quantity >= 1 && (i.item_rules_id || i.custom_name)),
          notes: notes.filter((n) => n !== ''),
        }
      : null

  return {
    ...base,
    allowed,
    suggested,
    adjustment,
    rolls,
    complete,
    result,
    location,
    outcome,
    needsSubRoll,
    needsTest,
    rewardsApply,
    gold,
    extraShards,
    suggestedItems,
    items,
    textNotes,
    totalShards,
    problems,
    record,
  }
}
