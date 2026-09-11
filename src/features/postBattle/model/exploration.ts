import { locationXp } from './locationXp'
import { explorationFaction } from '../../../rules/resolve/explorationDiscoveries'
import type { ArtefactDiscovery } from '../../../api/artefacts'
import { MAGICAL_ARTEFACTS } from '../../../rules/data/campaign/exploration'
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
//   kept as custom stash items. Source conditions gate the rewards before they are suggested.

import type { ExplorationRecord, ReportAdjustment } from '../../../domain'
import { resolveEquipmentName } from '../../../rules/data/items/aliases'
import { warbandRules } from '../../../rules/data/campaignRules'
import { EXPLORATION_MAX_DICE } from '../../../rules/data/campaign/income'
import { explorationDiceAllowed, locationOutcome, resolveExploration, type ExplorationDiceAllowed, type ExplorationResult, type LocationOutcome, explorationBonuses } from '../../../rules/resolve/exploration'
import type { ExplorationLocation, ExplorationReward } from '../../../rules/types/exploration'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'
import { isDie, type ExplorationDraft, type FoundItem } from './state'
import { minMax } from '../../../rules/resolve/dice'

export interface ExplorationInput {
  artefacts?: ArtefactDiscovery[]
  rewardHeroes?: RosterHero[]
  leaderId?: string | null
  artefactsError?: string
  reportId?: string
  scenarioId?: string | null
  disabledReason?: string
  won: boolean
  allowWithoutSurvivors?: boolean
  noExplorationReason?: string
  /** Fighting heroes who were not taken out of action. */
  eligibleHeroes: RosterHero[]
  /** Enemies this warband put out of action (Grave Goods and the like). */
  enemiesOut?: number
  /** Map campaigns: extra exploration dice from districts held, and where from. */
  extraDice?: number
  extraDiceNote?: string
  /** Map campaigns: a district that makes every find at a location its maximum (Rich Quarter, Clock Tower). */
  maxFinds?: { districtName: string } | null
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
  /** True once every die is entered and more were rolled than the six the rulebook lets you keep: pick which to score. */
  needsKeepChoice: boolean
  /** Indices into `rolls` currently chosen to keep and score. */
  kept: number[]
  result: ExplorationResult | null
  location: ExplorationLocation | null
  outcome: LocationOutcome | null
  needsSubRoll: boolean
  needsTest: LocationOutcome['needsTest'] | null
  /** The Hero the test names, when `needsTest.pickHero` is set (Well) — null until chosen. */
  testSubject: RosterHero | null
  /** Set when the test was failed and failing has a structured consequence (Well: misses the next game). */
  missNextGameHeroId: string | null
  /** Rewards count: no test, or the test was recorded as passed. */
  rewardsApply: boolean
  gold: DiceAmount
  extraShards: DiceAmount
  itemQuantityPrompts: { key: string; name: string; expression: string; value: number | null }[]
  needsArtefact: boolean
  itemChoicePrompts: { key: string; name: string; choices: string[]; selected: string[]; quantity: number }[]
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

function diceAmount(rewards: ExplorationReward[], kind: 'gold' | 'wyrdstone', entered: number | null, maxFinds = false): DiceAmount {
  let fixed = 0
  const expressions: string[] = []
  for (const r of rewards) {
    if (r.kind !== kind) continue
    if (typeof r.amount === 'number') fixed += r.amount
    else if (typeof r.amount === 'string') expressions.push(r.amount)
  }
  // A district that guarantees the maximum find replaces the roll with the expression's ceiling.
  const value = expressions.length === 0 ? fixed : maxFinds ? fixed + expressions.reduce((n, e) => n + safeMax(e), 0) : entered
  return { fixed, expressions, value }
}

function safeMax(expression: string): number {
  try {
    return minMax(expression).max
  } catch {
    return 0
  }
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
    needsKeepChoice: false,
    kept: [],
    result: null,
    location: null,
    outcome: null,
    needsSubRoll: false,
    needsTest: null,
    testSubject: null,
    missNextGameHeroId: null,
    rewardsApply: false,
    gold: empty,
    extraShards: empty,
    itemQuantityPrompts: [],
    itemChoicePrompts: [],
    needsArtefact: false,
    suggestedItems: [],
    items: [],
    textNotes: [],
    totalShards: 0,
    problems: [],
    record: null,
  }
  const rules = warbandRules(roster.warbandTemplateId).exploration
  if (input.disabledReason) return { ...base, skippedReason: input.disabledReason }
  if (input.eligibleHeroes.length === 0 && !rules?.extraDiceWithoutHeroes && !input.allowWithoutSurvivors) return { ...base, skippedReason: input.noExplorationReason ?? NO_HEROES }

  const eligible = new Set(input.eligibleHeroes.map((h) => h.id))
  const heroesOutOfAction = roster.heroes.filter((h) => !eligible.has(h.id)).map((h) => h.id)
  const burning = input.scenarioId === 'mordheim_s_burning'
  const garden = input.scenarioId === 'a_stroll_in_the_garden'
  const normal = explorationDiceAllowed(roster, { won: input.won && !burning, heroesOutOfAction, extraDice: (input.extraDice ?? 0) + (garden ? 1 : 0), extraDiceNote: [input.extraDiceNote, garden ? 'A Stroll in the Garden: one additional die; may reroll the entire pool once' : '', burning ? 'Mordheim’s Burning: no winner’s extra die' : ''].filter(Boolean).join('; ') })
  const suggested = roster.explorationDiscoveries?.straggler
    ? { ...normal, count: normal.count + 1, capped: true, reason: `${normal.reason}; Straggler: roll one more die and discard one (keep ${normal.keep})` }
    : normal
  // Wizard’s Tower replaces exploration with the recovered-chest table.
  const scenarioSuggested = input.scenarioId === 'the_wizard_s_tower'
    ? { count: 0, keep: 0, capped: false, reason: 'The Wizard’s Tower: no exploration rolls after this battle; resolve recovered chests instead.' }
    : burning && !input.won
      ? { count: 0, keep: 0, capped: false, reason: 'Mordheim’s Burning: only the winning warband may search for wyrdstone.' }
      : suggested
  const override = draft.diceOverride
  const allowed: ExplorationDiceAllowed = override
    ? {
        count: override.count,
        keep: Math.min(override.count, EXPLORATION_MAX_DICE),
        capped: override.count > EXPLORATION_MAX_DICE,
        reason: `${scenarioSuggested.reason}; changed to ${override.count}${override.reason.trim() ? `: ${override.reason.trim()}` : ''}`,
      }
    : scenarioSuggested
  const adjustment: ReportAdjustment | null =
    override && override.count !== scenarioSuggested.count
      ? { label: 'Exploration dice', suggested: `${scenarioSuggested.count} (${scenarioSuggested.reason})`, used: String(override.count), reason: override.reason.trim() }
      : null
  if (allowed.count <= 0) return { ...base, allowed, suggested: scenarioSuggested, skippedReason: input.scenarioId === 'the_wizard_s_tower' || (burning && !input.won) ? scenarioSuggested.reason : input.noExplorationReason ?? NO_HEROES }

  const rolls: (number | null)[] = []
  for (let i = 0; i < allowed.count; i++) {
    const v = draft.rolls[i]
    rolls.push(isDie(v, 6) ? v : null)
  }
  const complete = rolls.every((r) => r !== null)
  // "You must pick a maximum of six dice out of all the dice you roll, even if you are allowed to
  // roll seven dice or more" (03:585): once every rolled die has a value, the player chooses which
  // six to keep and score, discarding the rest.
  const needsKeepChoice = rolls.length > allowed.keep
  const kept = needsKeepChoice ? (draft.kept ?? []) : rolls.map((_, i) => i)
  const problems: string[] = []
  if (adjustment && adjustment.reason === '') problems.push('Say why the number of exploration dice was changed.')
  if (!complete) {
    problems.push(`Enter all ${allowed.count} exploration dice.`)
    return { ...base, allowed, suggested: scenarioSuggested, adjustment, rolls, needsKeepChoice, kept, problems }
  }
  if (needsKeepChoice && kept.length !== allowed.keep) {
    problems.push(`Choose ${allowed.keep} of the ${rolls.length} dice to keep (${kept.length} chosen so far).`)
    return { ...base, allowed, suggested: scenarioSuggested, adjustment, rolls, complete, needsKeepChoice, kept, problems }
  }
  const keptRolls = kept.map((i) => rolls[i] as number)

  const result = resolveExploration(keptRolls)
  const location = result.location
  let outcome: LocationOutcome | null = null
  let needsSubRoll = false
  if (location) {
    const subRoll = isDie(draft.subRoll, 6) ? draft.subRoll : undefined
    outcome = locationOutcome(location, subRoll)
    needsSubRoll = Boolean(outcome.needsSubRoll)
    if (needsSubRoll) problems.push(`${location.name}: roll the location's D6.`)
  }
  const tavernAutoPass = location?.id === 'tavern' && ['the_undead', 'undead', 'witch_hunters', 'sisters_of_sigmar'].includes(roster.warbandTemplateId)
  const testPassed = tavernAutoPass ? true : draft.testPassed
  const needsTest = tavernAutoPass ? null : outcome?.needsTest ?? null
  const testSubject = needsTest?.pickHero ? (input.eligibleHeroes.find((h) => h.id === draft.testSubjectId) ?? null) : null
  if (needsTest?.pickHero && !testSubject) problems.push(`${location?.name}: choose which Hero was sent.`)
  if (needsTest && testPassed === null) problems.push(`${location?.name}: record whether the test was passed.`)
  const rewardsApply = outcome !== null && !needsSubRoll && (!needsTest || testPassed === true || location?.id === 'shattered_building' || (location?.id === 'tavern' && testPassed === false))
  // Well (03:671-675): a Hero who fails the test misses the next game through sickness.
  const missNextGameHeroId = needsTest?.failEffect === 'missNextGame' && draft.testPassed === false && testSubject ? testSubject.id : null
  let rewards = rewardsApply ? outcome!.rewards.filter(reward => {
    if (location?.id === 'tavern') return reward.amount === (testPassed ? '4D6' : 'D6')
    if (location?.id === 'shop' && reward.kind === 'item') return !input.maxFinds && draft.gold === 1
    return true
  }) : []

  const faction = explorationFaction(roster.warbandTemplateId)
  if (rewardsApply && location?.id === 'straggler' && faction === 'skaven') rewards = [{kind:'gold',amount:'2D6',text:'Straggler sold: 2D6 gc.'}]
  if (rewardsApply && !(roster.warbandTemplateId === 'pirates' && draft.pirateRecruits) && location?.id === 'prisoners' && (faction === 'skaven' || faction === 'other')) rewards = [{kind:'gold',amount:faction==='skaven'?'3D6':'2D6',text:faction==='skaven'?'Prisoners sold: 3D6 gc.':'Prisoners escorted to safety: 2D6 gc.'}]
  if (location?.id === 'graveyard' && ['witch_hunters','sisters_of_sigmar'].includes(roster.warbandTemplateId)) rewards = []
  const xp = locationXp(location?.id, roster.warbandTemplateId, draft, input.rewardHeroes ?? roster.heroes, input.leaderId)
  problems.push(...xp.problems)
  const maxFinds = Boolean(input.maxFinds) && rewardsApply
  const merchant = rewardsApply && location?.id === 'merchants_house'
  const merchantDice = draft.merchantDice ?? [null, null]
  const merchantReady = merchantDice.length === 2 && merchantDice.every(die => isDie(die, 6))
  const merchantSymbol = merchant && merchantReady && merchantDice[0] === merchantDice[1]
  const merchantGold = merchantReady ? merchantSymbol ? 0 : maxFinds ? 60 : (merchantDice[0]! + merchantDice[1]!) * 5 : null
  if (merchant && !merchantReady) problems.push('Merchant’s House: enter both D6 to check for doubles.')
  const gold = merchant ? {fixed: merchantGold ?? 0, expressions: [], value: merchantGold} : diceAmount(rewards, 'gold', draft.gold, maxFinds)
  const extraShards = diceAmount(rewards, 'wyrdstone', draft.extraShards, maxFinds)
  if (!merchant && gold.value === null) problems.push(`Enter the gold found (${gold.expressions.join(' + ')} gc).`)
  if (extraShards.value === null) problems.push(`Enter the shards found at the location (${extraShards.expressions.join(' + ')}).`)

  const itemQuantityPrompts: ExplorationDerived['itemQuantityPrompts'] = []
  const suggestedItems: FoundItem[] = []
  const itemChoicePrompts: ExplorationDerived['itemChoicePrompts'] = []
  for (const [index, reward] of rewards.entries()) {
    if (reward.kind !== 'item' || !reward.itemName) continue
    let quantity: number | null = typeof reward.amount === 'number' ? reward.amount : 1
    if (typeof reward.amount === 'string') {
      const key = `${location!.id}:${draft.subRoll ?? 'fixed'}:${index}`
      quantity = maxFinds ? safeMax(reward.amount) : draft.itemQuantities?.[key] ?? null
      itemQuantityPrompts.push({key,name:reward.itemName,expression:reward.amount,value:quantity})
      const range = minMax(reward.amount)
      if (quantity === null || !Number.isInteger(quantity) || quantity < range.min || quantity > range.max) {
        problems.push(`${reward.itemName}: enter the quantity rolled on ${reward.amount} (${range.min}–${range.max}).`)
        continue
      }
    }
    if (quantity > 0 && reward.itemName === 'Shields or Bucklers (choose which)') {
      const key = `${location!.id}:${draft.subRoll ?? 'fixed'}:${index}`
      const choices = ['Shield', 'Buckler']
      const selected = (draft.itemChoices?.[key] ?? []).slice(0, quantity)
      itemChoicePrompts.push({key,name:reward.itemName,choices,selected,quantity})
      if (selected.length !== quantity || selected.some(name => !choices.includes(name))) problems.push(`Armourer: choose a Shield or Buckler for each of the ${quantity} items found.`)
      else for (const name of choices) {
        const count = selected.filter(s => s === name).length
        if (count) suggestedItems.push(foundItemFromName(name,count))
      }
    } else if (quantity > 0) suggestedItems.push(foundItemFromName(reward.itemName, quantity))
  }
  const needsArtefact = rewards.some(r => r.kind === 'text' && /magical artefact/i.test(r.text))
  const artefact = needsArtefact ? MAGICAL_ARTEFACTS.find(a => a.band.min === draft.artefactRoll) : undefined
  const discovery = artefact ? input.artefacts?.find(a => a.roll === draft.artefactRoll && (!input.reportId || a.reportId !== input.reportId)) : undefined
  if (needsArtefact) {
    if (!input.artefacts) problems.push(input.artefactsError ? `Cannot check campaign artefacts: ${input.artefactsError}` : 'Waiting for the campaign artefact record.')
    if (!artefact) problems.push('Roll a D6 on the Magical Artefacts table.')
    if (discovery && !draft.artefactOverrideReason?.trim()) problems.push(`${artefact!.name} was already found by ${discovery.warbandName}. Roll again or explain the agreed override.`)
    if (artefact) suggestedItems.push(foundItemFromName(artefact.name))
  }
  if (location?.id === 'shattered_building' && testPassed === true) suggestedItems.push({ item_rules_id: 'wardogs', custom_name: null, quantity: 1 })
  if (merchantSymbol) suggestedItems.push({item_rules_id:'symbol_of_the_order_of_freetraders',custom_name:null,quantity:1})
  const items = draft.items ?? suggestedItems
  const textNotes = rewards.filter((r) => r.kind === 'text').map((r) => r.text)
  const notes: string[] = xp.awards.map(a=>`${a.reason}: +${a.amount} XP to ${a.name}${xp.sides ? ` (D${xp.sides} ${draft.locationXpDie})` : ''}.`)
  if (merchant && merchantReady) notes.push(`Merchant’s House: D6 ${merchantDice.join(' + ')}; ${merchantSymbol ? 'doubles — Symbol of the Order of Freetraders instead of gold.' : `${merchantGold} gc${maxFinds ? ' (maximum find)' : ''}.`}`)
  if (artefact) notes.push(`Magical artefact D6 ${draft.artefactRoll}: ${artefact.name}.${draft.artefactOverrideReason?.trim() ? ` Agreed override: ${draft.artefactOverrideReason.trim()}` : ''}`)
  if (location?.id === 'shattered_building') notes.push(`Shattered Building: D3 shards are found regardless of the Leadership test.${testPassed === true ? ' The wardog joins; assign it from the stash to a Hero.' : testPassed === false ? ' The wardog does not join.' : ''}`)
  if (tavernAutoPass) notes.push('Tavern: this warband automatically passes the Leadership test; 4D6 gc.')
  if (location && outcome && !needsSubRoll && outcome.text !== location.rules) notes.push(`${location.name} D6 ${draft.subRoll}: ${outcome.text}`)
  const testSubjectLabel = testSubject ? `${testSubject.name}'s ` : ''
  if (needsTest) notes.push(draft.testPassed ? `${testSubjectLabel}${needsTest.stat} test passed.` : draft.testPassed === false ? `${testSubjectLabel}${needsTest.stat} test failed: ${needsTest.prompt}` : '')
  if (missNextGameHeroId) notes.push(`${testSubject!.name} misses the next game through sickness.`)
  notes.push(...textNotes)
  for (const prompt of itemQuantityPrompts) if (prompt.value !== null) notes.push(`${prompt.name}: ${prompt.expression} quantity ${prompt.value}${maxFinds ? ` (maximum find: ${input.maxFinds!.districtName})` : ""}.`)
  if (maxFinds && (gold.expressions.length > 0 || extraShards.expressions.length > 0)) notes.push(`${input.maxFinds!.districtName}: the maximum was taken for what the location gives (${[...gold.expressions.map((e) => `${e} gc`), ...extraShards.expressions.map((e) => `${e} shards`)].join(', ')}).`)
  if (draft.notes.trim() !== '') notes.push(draft.notes.trim())

  const bonuses = explorationBonuses(roster, result.shards, input.enemiesOut ?? 0)
  if (needsKeepChoice) {
    const discarded = rolls.map((v, i) => (kept.includes(i) ? null : v)).filter((v): v is number => v !== null)
    notes.push(`Rolled ${rolls.length} dice (${(rolls as number[]).join(', ')}); kept ${keptRolls.join(', ')}, discarded ${discarded.join(', ')}.`)
  }
  for (const use of draft.aids ?? []) notes.push(`Die ${use.dieIndex + 1}: ${use.from} ${use.kind === 'rollTwoKeepOne' ? `and ${use.alternativeRoll ?? "another die"}; chose` : use.kind === 'rerollKeepEither' ? `rerolled (${use.alternativeRoll ?? 'new result'}); chose` : use.kind === 'modify' ? "modified to" : "re-rolled to"} ${use.to} with ${use.label}${use.test ? ` (Ld test ${use.test.rolls[0]}+${use.test.rolls[1]} passed)` : ''}`)
  const totalShards = result.shards + (extraShards.value ?? 0) + bonuses.shards
  notes.push(...bonuses.notes)
  const record: ExplorationRecord | null =
    problems.length === 0
      ? {
          ...(location?.id === 'straggler' && explorationFaction(roster.warbandTemplateId) === 'other' && !(roster.warbandTemplateId === 'pirates' && draft.pirateRecruits) ? { benefits: ['straggler' as const] } : {}),
          ...(artefact ? {artefact:{roll:draft.artefactRoll!, ...(draft.artefactOverrideReason?.trim() ? {overrideReason:draft.artefactOverrideReason.trim()} : {})}} : {}),
          ...(xp.awards.length ? {xpAwards:xp.awards} : {}),
          diceAllowed: allowed.count,
          diceReason: allowed.reason,
          rolls: rolls as number[],
          total: result.total,
          shards: totalShards,
          locationId: location?.id ?? null,
          locationName: location?.name ?? null,
          locationText: location ? location.rules : null,
          subRoll: location?.subRoll ? (draft.subRoll ?? null) : null,
          goldFound: (gold.value ?? 0) + bonuses.gold,
          itemsFound: items.filter((i) => i.quantity >= 1 && (i.item_rules_id || i.custom_name)),
          notes: notes.filter((n) => n !== ''),
        }
      : null

  return {
    ...base,
    allowed,
    suggested: scenarioSuggested,
    adjustment,
    rolls,
    complete,
    needsKeepChoice,
    kept,
    result,
    location,
    outcome,
    needsSubRoll,
    needsTest,
    testSubject,
    missNextGameHeroId,
    rewardsApply,
    gold,
    extraShards,
    itemQuantityPrompts,
    itemChoicePrompts,
    needsArtefact,
    suggestedItems,
    items,
    textNotes,
    totalShards,
    problems,
    record,
  }
}
