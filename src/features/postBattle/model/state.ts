import type {SurvivalXpTest} from './survivalXp'
import { assertNoSecondReroll } from '../../../rules/resolve/explorationAids'
// The post-battle report draft: everything the player has entered, and nothing derived from it.
//
// The draft is a plain JSON object so it can sit in localStorage between sittings ("Continue
// later"). Every edit is a pure function `(draft) => draft`; the derived view (who is injured,
// which xp lines result, what the exploration found) is recomputed from the draft plus the roster
// in ./derive.ts. Dice are stored as the player rolled them; the rules are applied on read.

import type { BattleLiveState } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import type { AdvanceDraft } from '../../advances/model'
import type { AidUse } from '../../../rules/resolve/explorationAids'
import { animalFighters } from '../../../rules/resolve/animals'

export const REPORT_DRAFT_VERSION = 6

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
  /**
   * D66 results; `subRoll` stays null until the injury asks for one and the player supplies it.
   * `districtRoll` is the D6 a map district lets the player make to turn the result into a Full
   * Recovery (Temple of Morr, Temple of Sigmar), null until rolled.
   */
  rolls: { d66: number; source?: 'app' | 'tabletop'; subRoll: number | null; districtRoll?: number | null; medicine?: {itemId:string;d66:number;originalSubRoll:number|null;originalDistrictRoll:number|null} }[]
  /** Multiple Injuries: the D6 that says how many further rolls to make. */
  countRoll: number | null
  /** Discarded attempts survive a restart; missing on older drafts. */
  previousAttempts?: { rolls: HeroInjuryFlow['rolls']; countRoll: number | null; reason: string }[]
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
 * the skill or spell later (the Advancements screen), or leave the whole advance for later.
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

export interface PirateRecruitDraft {
  count?: number | null
  leadership?: number | null
  leadershipReason?: string
  people: { id: string; rolls: [number | null, number | null]; destination?: string; kitCost?: number | null; kitReason?: string }[]
}
export interface ExplorationDraft {
  raidCaptivesSpent?: number

  pirateRecruits?: PirateRecruitDraft

  recruitDie?: number | null
  recruitChoice?: string
  recruitGroupId?: string
  recruitKitCost?: number | null
  recruitKitReason?: string
  locationXpDie?: number | null
  locationXp?: Record<string, number>
  locationLeaderId?: string
  artefactRoll?: number | null
  artefactOverrideReason?: string
  alliedWithWinner?: boolean
  /** One qualifying witness per enemy-caused Slayer hero casualty. */
  valorWitnesses?: Record<string, string>
  shrineChoice?: 'strip' | 'save';
  shrineWeaponId?: string;
  pitChoice?: 'skip' | 'send';
  pitHeroId?: string;
  pitShardDie?: number | null;
  merchantDice?: [number | null, number | null];
  itemQuantities?: Record<string, number | null>;
  itemChoices?: Record<string, string[]>;
  /** Null = roll what the app suggests. */
  diceOverride: DiceOverride | null
  /** One entry per die allowed; null until entered. */
  rolls: (number | null)[]
  /** Indices into `rolls` chosen to keep, when more were rolled than the six the rulebook lets you score; null until chosen. */
  kept: number[] | null
  /** The location's own D6, when it has a table. */
  subRoll: number | null
  /** The location's characteristic test, when it has one: null until recorded. */
  testPassed: boolean | null
  /** The Hero the test was taken against, when the text names a specific Hero rather than the leader (Well): null until chosen. */
  testSubjectId: string | null
  /** Gold found at the location; null = not entered yet (the fixed amount is used when the text states one). */
  gold: number | null
  /** Shards the location itself gives (on top of the dice total); null = not entered yet. */
  extraShards: number | null
  /** Items found; null = the suggestions from the location text stand as they are. */
  items: FoundItem[] | null
  /** Re-rolls and modifiers applied to the dice (Mordheim Map, Pendulum, Tarot...). */
  aids: AidUse[]
  notes: string
}

export interface ReportDraft {
  woods?: import('./lycanthropeReport').WoodsDraft
  plantCasualties?: Record<string, boolean>
  groupEquipmentLosses?: Record<string, number | null>
  retainedScoutId?: string
  pettyThiefRoll?: number | null
  pettyThiefSelection?: number | null
  scenarioMission?: string
  scenarioGardenRerolled?: boolean
  /** Explicit per-report resolution of contradictory printed award values. */
  scenarioUseBody?: boolean
  scenarioRewards?: import('./scenarioRewards').ScenarioRewardDraft
  towerChests?: import('./scenarioTreasure').TowerChest[]
  scenarioRewardOverrideReason?: string
  scenarioItems?: FoundItem[]
  scenarioInjuryDice?: Record<string, number | null>
  scenarioNonCampaign?: boolean
  scenarioZombieKills?: Record<string, number>
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
  /** Animals (Wardogs, Gnoblar Fighters) taken out of action, by animal id. */
  animalsOut: string[]
  /** Animal id -> its D6 injury roll (dead on 1-2). */
  animalInjuries: Record<string, number | null>
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
  survivalXpTests?: Record<string, SurvivalXpTest>
  xpExtras: Record<string, XpExtra[]>
  /** advanceKey -> the dice and choices for an advance earned this battle. */
  advances: Record<string, AdvanceDraft>
  /** advanceKey -> how the player wants to handle it (default 'now'). */
  advanceModes: Record<string, AdvanceMode>
  exploration: ExplorationDraft
  /** Post-battle item prompt key -> dice faces (kit after the battle: drugs, maps, wishes). */
  kit: Record<string, (number | null)[]>
  /** Prompt key -> the outcome's own dice (gold expressions). */
  kitExtra: Record<string, (number | null)[]>
  /** Wyrdstone picked up during the battle itself (scenario objectives). */
  battleWyrdstone: number
  /** Gold looted during the battle itself. */
  battleGold: number
  /** The two veteran-pool dice. */
  veteranPool: [number | null, number | null]
  /** A third veteran-pool die, where a map district allows 3D6 (Quayside, Memorial Gardens). */
  veteranPoolExtra: number | null
  /** Map campaigns: the D6 for the D3 extra shards of an Abundance of Wyrdstone district (winner only). */
  abundanceRoll: number | null
  notes: string
}

export function emptyExploration(): ExplorationDraft {
  return { diceOverride: null, rolls: [], kept: null, subRoll: null, testPassed: null, testSubjectId: null, gold: null, extraShards: null, items: null, aids: [], notes: '' }
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
    animalsOut: [],
    animalInjuries: {},
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
    kit: {},
    kitExtra: {},
    battleWyrdstone: 0,
    battleGold: 0,
    veteranPool: [null, null],
    veteranPoolExtra: null,
    abundanceRoll: null,
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
  const animalIds = new Set(animalFighters(roster).map((a) => a.id))
  for (const tally of live.tallies) {
    if (animalIds.has(tally.id)) {
      if (tally.outOfAction > 0) draft.animalsOut.push(tally.id)
    } else if (tally.kind === 'hero' && warriorIds.has(tally.id)) {
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

export function setAnimalOut(draft: ReportDraft, id: string, out: boolean): ReportDraft {
  const already = draft.animalsOut.includes(id)
  if (out === already) return draft
  const injuries = { ...draft.animalInjuries }
  delete injuries[id]
  return { ...draft, animalsOut: out ? [...draft.animalsOut, id] : draft.animalsOut.filter((x) => x !== id), animalInjuries: injuries }
}

export function setAnimalInjury(draft: ReportDraft, id: string, roll: number | null): ReportDraft {
  return { ...draft, animalInjuries: { ...draft.animalInjuries, [id]: roll } }
}

/** A die of a post-battle kit prompt; `null` clears it. */
export function setKitRoll(draft: ReportDraft, key: string, index: number, value: number | null): ReportDraft {
  const rolls = [...(draft.kit[key] ?? [])]
  while (rolls.length <= index) rolls.push(null)
  rolls[index] = value
  return { ...draft, kit: { ...draft.kit, [key]: rolls }, kitExtra: { ...draft.kitExtra, [key]: [] } }
}

export function setKitExtraRoll(draft: ReportDraft, key: string, index: number, value: number | null): ReportDraft {
  const rolls = [...(draft.kitExtra[key] ?? [])]
  while (rolls.length <= index) rolls.push(null)
  rolls[index] = value
  return { ...draft, kitExtra: { ...draft.kitExtra, [key]: rolls } }
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
  return { ...draft, groupsOut, groupInjuries, groupEquipmentLosses: {} }
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

export function addHeroInjuryRoll(draft: ReportDraft, heroId: string, d66: number, source?: 'app' | 'tabletop'): ReportDraft {
  const flow = flowOf(draft, heroId)
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [heroId]: { ...flow, rolls: [...flow.rolls, { d66, subRoll: null, ...(source ? {source} : {}) }] } } }
}

/** Replace one original result while retaining its provenance; later dependent rolls must be made afresh. */
export function setMedicineChestReroll(draft:ReportDraft,heroId:string,rollIndex:number,itemId:string,d66:number):ReportDraft {
  const flow=flowOf(draft,heroId),original=flow.rolls[rollIndex]
  if(!original||original.medicine)return draft
  const rolls=flow.rolls.slice(0,rollIndex+1)
  rolls[rollIndex]={...original,subRoll:null,districtRoll:null,medicine:{itemId,d66,originalSubRoll:original.subRoll,originalDistrictRoll:original.districtRoll??null}}
  return {...draft,heroInjuries:{...draft.heroInjuries,[heroId]:{...flow,rolls,countRoll:rollIndex===0?null:flow.countRoll}}}
}

export function setHeroInjurySubRoll(draft: ReportDraft, heroId: string, rollIndex: number, subRoll: number): ReportDraft {
  const flow = flowOf(draft, heroId)
  if (rollIndex < 0 || rollIndex >= flow.rolls.length) return draft
  const rolls = flow.rolls.map((r, i) => (i === rollIndex ? { ...r, subRoll } : r))
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [heroId]: { ...flow, rolls } } }
}

export function setHeroDistrictRoll(draft: ReportDraft, heroId: string, rollIndex: number, districtRoll: number): ReportDraft {
  const flow = flowOf(draft, heroId)
  if (rollIndex < 0 || rollIndex >= flow.rolls.length) return draft
  const rolls = flow.rolls.map((r, i) => (i === rollIndex ? { ...r, districtRoll } : r))
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [heroId]: { ...flow, rolls } } }
}

export function setVeteranExtraDie(draft: ReportDraft, value: number | null): ReportDraft {
  return { ...draft, veteranPoolExtra: value }
}

export function setAbundanceRoll(draft: ReportDraft, value: number | null): ReportDraft {
  return { ...draft, abundanceRoll: value }
}

/** D3 from a D6 face: 1-2 = 1, 3-4 = 2, 5-6 = 3. */
export function d3Of(d6: number | null): number | null {
  return isDie(d6, 6) ? Math.ceil(d6 / 2) : null
}

export function setHeroInjuryCount(draft: ReportDraft, heroId: string, countRoll: number): ReportDraft {
  const flow = flowOf(draft, heroId)
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [heroId]: { ...flow, countRoll } } }
}

export function resetHeroInjury(draft: ReportDraft, heroId: string, reason: string): ReportDraft {
  const flow = flowOf(draft, heroId)
  if (!flow.rolls.length || !reason.trim()) return draft
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [heroId]: {
    rolls: [], countRoll: null,
    previousAttempts: [...(flow.previousAttempts ?? []), {rolls: flow.rolls, countRoll: flow.countRoll, reason: reason.trim()}],
  } } }
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
  return { ...draft, groupInjuryDice, groupEquipmentLosses: {} }
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
  return { ...draft, groupInjuries: { ...draft.groupInjuries, [groupId]: rolls }, groupEquipmentLosses: {} }
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

/** Apply an exploration aid to one die: the die takes the new value and the use is kept for the record. */
export function applyExplorationAid(draft: ReportDraft, use: AidUse): ReportDraft {
  assertNoSecondReroll(use, draft.exploration.aids);
  const rolls = [...draft.exploration.rolls]
  while (rolls.length <= use.dieIndex) rolls.push(null)
  rolls[use.dieIndex] = use.to
  return withExploration(draft, { rolls, aids: [...draft.exploration.aids, use], subRoll: null, testPassed: null, testSubjectId: null, gold: null, extraShards: null, items: null, shrineChoice: undefined, shrineWeaponId: undefined, pitChoice: undefined, pitHeroId: undefined, pitShardDie: null, merchantDice: undefined, itemQuantities: {}, itemChoices: {}, artefactRoll: null, artefactOverrideReason: '', locationXpDie: null, locationXp: {}, locationLeaderId: undefined, pirateRecruits: undefined, recruitDie: null, recruitChoice: undefined, recruitGroupId: undefined, recruitKitCost: null, recruitKitReason: '' })
}

/** Roll a different number of exploration dice than suggested (1..12); null goes back to the suggestion. The reason is required to file. */
export function setExplorationDiceOverride(draft: ReportDraft, override: DiceOverride | null): ReportDraft {
  if (override === null) return withExploration(draft, { diceOverride: null, kept: null })
  return withExploration(draft, { diceOverride: { count: Math.max(1, Math.min(12, Math.trunc(override.count))), reason: override.reason }, kept: null })
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
  return withExploration(draft, { rolls, kept: null, subRoll: null, testPassed: null, testSubjectId: null, gold: null, extraShards: null, items: null, shrineChoice: undefined, shrineWeaponId: undefined, pitChoice: undefined, pitHeroId: undefined, pitShardDie: null, merchantDice: undefined, itemQuantities: {}, itemChoices: {}, artefactRoll: null, artefactOverrideReason: '', locationXpDie: null, locationXp: {}, locationLeaderId: undefined, pirateRecruits: undefined, recruitDie: null, recruitChoice: undefined, recruitGroupId: undefined, recruitKitCost: null, recruitKitReason: '' })
}

export function setExplorationRolls(draft: ReportDraft, rolls: (number | null)[]): ReportDraft {
  return withExploration(draft, { rolls, kept: null, subRoll: null, testPassed: null, testSubjectId: null, gold: null, extraShards: null, items: null, shrineChoice: undefined, shrineWeaponId: undefined, pitChoice: undefined, pitHeroId: undefined, pitShardDie: null, merchantDice: undefined, itemQuantities: {}, itemChoices: {}, artefactRoll: null, artefactOverrideReason: '', locationXpDie: null, locationXp: {}, locationLeaderId: undefined, pirateRecruits: undefined, recruitDie: null, recruitChoice: undefined, recruitGroupId: undefined, recruitKitCost: null, recruitKitReason: '' })
}

/** Toggle whether a rolled die (by index) is one of the six kept and scored; extra picks past `limit` are ignored. */
export function toggleExplorationKeep(draft: ReportDraft, index: number, limit: number): ReportDraft {
  const current = draft.exploration.kept ?? []
  const reset: Partial<ExplorationDraft> = {shrineChoice:undefined,shrineWeaponId:undefined,pitChoice:undefined,pitHeroId:undefined,pitShardDie:null,merchantDice:undefined,subRoll:null,gold:null,extraShards:null,items:null}
  if (current.includes(index)) return withExploration(draft, { ...reset, kept: current.filter((i) => i !== index) })
  if (current.length >= limit) return draft
  return withExploration(draft, { ...reset, kept: [...current, index] })
}

/** The location's D6; a new value resets the answers that depend on it. */
export function setExplorationSubRoll(draft: ReportDraft, subRoll: number | null): ReportDraft {
  if (draft.exploration.subRoll === subRoll) return draft
  return withExploration(draft, { subRoll, gold: null, extraShards: null, items: null, pitShardDie: null, merchantDice: undefined, itemQuantities: {}, itemChoices: {}, artefactRoll: null, artefactOverrideReason: '', locationXpDie: null, locationXp: {}, locationLeaderId: undefined, pirateRecruits: undefined, recruitDie: null, recruitChoice: undefined, recruitGroupId: undefined, recruitKitCost: null, recruitKitReason: '' })
}

export function setExplorationTest(draft: ReportDraft, testPassed: boolean | null): ReportDraft {
  return withExploration(draft, { testPassed, gold: null, extraShards: null, items: null, shrineChoice: undefined, shrineWeaponId: undefined, pitChoice: undefined, pitHeroId: undefined, pitShardDie: null, merchantDice: undefined, itemQuantities: {}, itemChoices: {}, artefactRoll: null, artefactOverrideReason: '', locationXpDie: null, locationXp: {}, locationLeaderId: undefined, pirateRecruits: undefined, recruitDie: null, recruitChoice: undefined, recruitGroupId: undefined, recruitKitCost: null, recruitKitReason: '' })
}

export function setExplorationTestSubject(draft: ReportDraft, heroId: string | null): ReportDraft {
  return withExploration(draft, { testSubjectId: heroId })
}

export function setExplorationGold(draft: ReportDraft, gold: number | null): ReportDraft {
  return withExploration(draft, { gold: gold === null ? null : Math.max(0, Math.trunc(gold)), items: null })
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


/** Switching a casualty's source clears only that model's previous roll. */
export function setPlantCasualty(draft:ReportDraft,id:string,checked:boolean):ReportDraft {
  const next={...draft,plantCasualties:{...draft.plantCasualties,[id]:checked},groupEquipmentLosses:{}}
  const group=id.match(/^(.*):(\d+)$/)
  if(group){const rolls=[...(draft.groupInjuries[group[1]]??[])];rolls[Number(group[2])]=null;return {...next,groupInjuries:{...draft.groupInjuries,[group[1]]:rolls}}}
  return {...next,scenarioInjuryDice:{...draft.scenarioInjuryDice,[id]:null},heroInjuries:{...draft.heroInjuries,[id]:{rolls:[],countRoll:null}},swordInjuries:{...draft.swordInjuries,[id]:null}}
}
