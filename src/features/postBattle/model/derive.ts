// From the draft and the roster to the BattleReport the server applies. Everything here is pure
// and recomputed on every edit; `report` is null until every step is complete.
//
// Patches follow the resolvers: heroes get stats / injuries / flags / status from the injury
// step and xp from the experience step; groups get size and xp. Advances are never resolved here
// (Phase 8): each threshold crossed becomes a pending_advances request and level_ups is untouched.
//
// Judgements:
// - Items: when a hero's resolved equipment is empty but they carried something (Dead: "All the
//   weapons and equipment he carried are lost"; Robbed: "all his weapons, armour and equipment
//   are lost"), the item rows they held go in remove_item_ids. Dead heroes are not deleted (status
//   becomes dead), so nothing moves to the stash. Hired swords' kit is never touched.
// - Heroes who sat this game out because of missNextGames have the counter reduced by one in
//   their flags patch: the game they had to miss has now been played. Nothing else in the app
//   counts games down.
// - Wyrdstone and gold picked up during the battle itself (scenario objectives, loot) are added
//   to the treasury alongside the exploration finds; they appear in the notes for the record.

import type { BattleReport, HenchmanInjuryLine, HeroInjuryLine, ItemRow, OoaLine, ReportApplied, XpLine } from '../../../domain'
import { REPORT_VERSION } from '../../../domain'
import { HENCHMAN_XP_THRESHOLDS, HERO_XP_THRESHOLDS } from '../../../rules/data/campaign/experience'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { deriveExploration, type ExplorationDerived } from './exploration'
import { resolveGroupInjuries, resolveHeroInjuryFlow, resolveHiredSwordInjury, type GroupInjuryResolution, type HeroInjuryResolution, type HiredSwordInjuryResolution, type InjuryOutcome } from './injuries'
import { participantsOf, type Participants } from './participants'
import { isDie, STEP_IDS, type ReportDraft, type StepId } from './state'
import { groupXpLine, underdogBonusFor, warriorXpLine } from './xp'

export interface ReportContext {
  roster: RosterWarband
  template: WarbandTemplate | undefined
  /** Item rows of the warband, to find the row ids behind a hero's equipment. */
  items: readonly ItemRow[]
  matchId: string
  /** This warband's rating going into the battle. */
  myRating: number
  /** Highest rating among the opponents, or null when there were none. */
  opponentRating: number | null
}

export interface InjurySummary {
  dead: number
  captured: number
  retired: number
  injured: number
  recovered: number
  henchmenDead: number
  /** Rolls still to be made across every warrior. */
  pending: number
}

export interface InjuriesDerived {
  heroes: { hero: RosterHero; resolution: HeroInjuryResolution }[]
  hiredSwords: { sword: RosterHiredSword; resolution: HiredSwordInjuryResolution }[]
  groups: { group: RosterHenchmanGroup; outOfAction: number; resolution: GroupInjuryResolution }[]
  summary: InjurySummary
  complete: boolean
}

export interface XpDerived {
  lines: XpLine[]
  /** The bonus the rating difference would give, whether or not the toggle is on. */
  underdogAvailable: number
  /** The bonus actually applied. */
  underdogApplied: number
}

export interface DerivedReport {
  participants: Participants
  /** Heroes (not hired swords) who fought and were not out of action. */
  survivingHeroes: RosterHero[]
  injuries: InjuriesDerived
  xp: XpDerived
  exploration: ExplorationDerived
  veteranPool: number | null
  problems: Record<StepId, string[]>
  /** Index of the first step with a problem, or null when the report is complete. */
  firstIncompleteStep: number | null
  report: BattleReport | null
}

function heroOoaIds(draft: ReportDraft): Set<string> {
  return new Set(draft.heroesOut)
}

export function deriveInjuries(draft: ReportDraft, participants: Participants, matchId: string): InjuriesDerived {
  const out = heroOoaIds(draft)
  const heroes = participants.heroes
    .filter((h) => out.has(h.id))
    .map((hero) => ({ hero, resolution: resolveHeroInjuryFlow(hero, draft.heroInjuries[hero.id] ?? { rolls: [], countRoll: null }, matchId) }))
  const hiredSwords = participants.hiredSwords
    .filter((s) => out.has(s.id))
    .map((sword) => ({ sword, resolution: resolveHiredSwordInjury(sword, draft.swordInjuries[sword.id] ?? null) }))
  const groups = participants.groups
    .filter((g) => (draft.groupsOut[g.id] ?? 0) > 0)
    .map((group) => {
      const outOfAction = Math.min(group.size, draft.groupsOut[group.id] ?? 0)
      return { group, outOfAction, resolution: resolveGroupInjuries(group, outOfAction, draft.groupInjuries[group.id] ?? []) }
    })

  const summary: InjurySummary = { dead: 0, captured: 0, retired: 0, injured: 0, recovered: 0, henchmenDead: 0, pending: 0 }
  const count = (outcome: InjuryOutcome | null) => {
    if (outcome === null) summary.pending += 1
    else summary[outcome] += 1
  }
  for (const h of heroes) count(h.resolution.outcome)
  for (const s of hiredSwords) count(s.resolution.outcome)
  for (const g of groups) {
    summary.henchmenDead += g.resolution.dead
    if (!g.resolution.complete) summary.pending += 1
  }
  return { heroes, hiredSwords, groups, summary, complete: summary.pending === 0 }
}

function alive(outcome: InjuryOutcome | null): boolean {
  return outcome !== 'dead' && outcome !== 'retired'
}

export function deriveXp(draft: ReportDraft, participants: Participants, injuries: InjuriesDerived, ctx: ReportContext): XpDerived {
  const underdogAvailable = underdogBonusFor(ctx.myRating, ctx.opponentRating)
  const underdogApplied = draft.underdog ? underdogAvailable : 0
  const won = draft.result === 'won'
  const xpCtx = { won, leaderId: participants.leaderId, underdogBonus: underdogApplied, enemiesOut: draft.enemiesOut, extras: draft.xpExtras }
  const heroAfter = new Map(injuries.heroes.map((h) => [h.hero.id, h.resolution]))
  const swordAfter = new Map(injuries.hiredSwords.map((s) => [s.sword.id, s.resolution]))
  const groupAfter = new Map(injuries.groups.map((g) => [g.group.id, g.resolution]))

  const lines: XpLine[] = []
  for (const hero of participants.heroes) {
    const res = heroAfter.get(hero.id)
    // An unfinished injury flow counts as alive for the preview; the report itself waits for it.
    const line = warriorXpLine('hero', hero, res?.hero ?? hero, res ? alive(res.outcome) : true, xpCtx)
    if (line) lines.push(line)
  }
  for (const sword of participants.hiredSwords) {
    const res = swordAfter.get(sword.id)
    const line = warriorXpLine('hiredSword', sword, res?.sword ?? sword, res ? alive(res.outcome) : true, xpCtx)
    if (line) lines.push(line)
  }
  for (const group of participants.groups) {
    const res = groupAfter.get(group.id)
    const line = groupXpLine(group, res?.group ?? group, xpCtx)
    if (line) lines.push(line)
  }
  return { lines, underdogAvailable, underdogApplied }
}

/** Threshold boxes crossed between two totals, as pending advance requests. */
export function thresholdsCrossed(role: 'hero' | 'henchman', xpBefore: number, xpAfter: number): number[] {
  const table = role === 'hero' ? HERO_XP_THRESHOLDS : HENCHMAN_XP_THRESHOLDS
  return table.filter((t) => t > xpBefore && t <= xpAfter)
}

export function veteranPoolOf(draft: ReportDraft): number | null {
  const [a, b] = draft.veteranPool
  return isDie(a, 6) && isDie(b, 6) ? a + b : null
}

function stepProblems(draft: ReportDraft, injuries: InjuriesDerived, exploration: ExplorationDerived): Record<StepId, string[]> {
  const problems: Record<StepId, string[]> = { outcome: [], casualties: [], injuries: [], experience: [], exploration: [], veterans: [], review: [] }
  if (draft.result === null) problems.outcome.push('Record whether the warband won, lost or drew.')
  if (!injuries.complete) {
    const n = injuries.summary.pending
    problems.injuries.push(`${n} ${n === 1 ? 'warrior still needs' : 'warriors still need'} their injury dice.`)
  }
  problems.exploration.push(...exploration.problems)
  const [a, b] = draft.veteranPool
  if ((a === null) !== (b === null) || (a !== null && !isDie(a, 6)) || (b !== null && !isDie(b, 6))) problems.veterans.push('Enter both veteran-pool dice, or leave both blank.')
  return problems
}

/** Item rows held by a warrior. */
function heldItemIds(items: readonly ItemRow[], holderId: string): string[] {
  return items.filter((i) => i.holder_type === 'hero' && i.holder_id === holderId).map((i) => i.id)
}

function buildApplied(draft: ReportDraft, ctx: ReportContext, participants: Participants, injuries: InjuriesDerived, xp: XpDerived, exploration: ExplorationDerived): ReportApplied {
  const xpBySubject = new Map(xp.lines.map((l) => [l.subjectId, l]))
  const heroes: ReportApplied['heroes'] = []
  const pending: ReportApplied['pending_advances'] = []
  const removeItemIds: string[] = []

  const heroRes = new Map(injuries.heroes.map((h) => [h.hero.id, h.resolution]))
  for (const hero of participants.heroes) {
    const res = heroRes.get(hero.id)
    const line = xpBySubject.get(hero.id)
    const patch: ReportApplied['heroes'][number]['patch'] = {}
    if (res) {
      const after = res.hero
      patch.stats = after.stats
      patch.injuries = after.injuries
      patch.flags = after.flags
      if (after.status !== hero.status) patch.status = after.status
      if (after.equipment.length === 0 && hero.equipment.length > 0) removeItemIds.push(...heldItemIds(ctx.items, hero.id))
    }
    if (line) {
      patch.xp = line.xpAfter
      for (const t of thresholdsCrossed('hero', line.xpBefore, line.xpAfter)) pending.push({ subject_type: 'hero', subject_id: hero.id, threshold_xp: t })
    }
    if (Object.keys(patch).length > 0) heroes.push({ id: hero.id, patch })
  }

  const swordRes = new Map(injuries.hiredSwords.map((s) => [s.sword.id, s.resolution]))
  for (const sword of participants.hiredSwords) {
    const res = swordRes.get(sword.id)
    const line = xpBySubject.get(sword.id)
    const patch: ReportApplied['heroes'][number]['patch'] = {}
    if (res && res.sword.status !== sword.status) patch.status = res.sword.status
    if (line) {
      patch.xp = line.xpAfter
      for (const t of thresholdsCrossed('hero', line.xpBefore, line.xpAfter)) pending.push({ subject_type: 'hero', subject_id: sword.id, threshold_xp: t })
    }
    if (Object.keys(patch).length > 0) heroes.push({ id: sword.id, patch })
  }

  // Heroes who missed this game: one fewer to miss.
  for (const sat of participants.satOut) {
    if (sat.missNextGames && sat.missNextGames > 0) {
      const hero = ctx.roster.heroes.find((h) => h.id === sat.id)
      if (!hero) continue
      const flags = { ...hero.flags }
      if (sat.missNextGames - 1 > 0) flags.missNextGames = sat.missNextGames - 1
      else delete flags.missNextGames
      heroes.push({ id: hero.id, patch: { flags } })
    }
  }

  const groups: ReportApplied['groups'] = []
  const groupRes = new Map(injuries.groups.map((g) => [g.group.id, g.resolution]))
  for (const group of participants.groups) {
    const res = groupRes.get(group.id)
    const line = xpBySubject.get(group.id)
    const patch: ReportApplied['groups'][number]['patch'] = {}
    if (res && res.group.size !== group.size) patch.size = res.group.size
    if (line) {
      patch.xp = line.xpAfter
      for (const t of thresholdsCrossed('henchman', line.xpBefore, line.xpAfter)) pending.push({ subject_type: 'group', subject_id: group.id, threshold_xp: t })
    }
    if (Object.keys(patch).length > 0) groups.push({ id: group.id, patch })
  }

  const record = exploration.record
  return {
    heroes,
    groups,
    warband: {
      wyrdstone_delta: draft.battleWyrdstone + (record?.shards ?? 0),
      gold_delta: draft.battleGold + (record?.goldFound ?? 0),
      veteran_pool: veteranPoolOf(draft),
    },
    pending_advances: pending,
    remove_item_ids: [...new Set(removeItemIds)],
    stash_items: record?.itemsFound ?? [],
  }
}

function ooaLines(draft: ReportDraft, participants: Participants): OoaLine[] {
  const out = heroOoaIds(draft)
  const lines: OoaLine[] = []
  for (const h of participants.heroes) if (out.has(h.id)) lines.push({ subjectType: 'hero', subjectId: h.id, subjectName: h.name, count: 1 })
  for (const s of participants.hiredSwords) if (out.has(s.id)) lines.push({ subjectType: 'hiredSword', subjectId: s.id, subjectName: s.name, count: 1 })
  for (const g of participants.groups) {
    const n = Math.min(g.size, draft.groupsOut[g.id] ?? 0)
    if (n > 0) lines.push({ subjectType: 'group', subjectId: g.id, subjectName: g.name, count: n })
  }
  return lines
}

function battleNotes(draft: ReportDraft): string {
  const parts: string[] = []
  if (draft.battleWyrdstone > 0) parts.push(`${draft.battleWyrdstone} ${draft.battleWyrdstone === 1 ? 'shard' : 'shards'} of wyrdstone picked up during the battle.`)
  if (draft.battleGold > 0) parts.push(`${draft.battleGold} gc looted during the battle.`)
  if (draft.notes.trim() !== '') parts.push(draft.notes.trim())
  return parts.join('\n')
}

export function deriveReport(draft: ReportDraft, ctx: ReportContext): DerivedReport {
  const participants = participantsOf(ctx.roster, ctx.template)
  const out = heroOoaIds(draft)
  const survivingHeroes = participants.heroes.filter((h) => !out.has(h.id))
  const injuries = deriveInjuries(draft, participants, ctx.matchId)
  const xp = deriveXp(draft, participants, injuries, ctx)
  const exploration = deriveExploration(draft.exploration, ctx.roster, { won: draft.result === 'won', eligibleHeroes: survivingHeroes })
  const problems = stepProblems(draft, injuries, exploration)
  const firstIncomplete = STEP_IDS.findIndex((id) => problems[id].length > 0)
  const firstIncompleteStep = firstIncomplete === -1 ? null : firstIncomplete

  let report: BattleReport | null = null
  if (firstIncompleteStep === null && draft.result !== null) {
    const injuryLines: (HeroInjuryLine | HenchmanInjuryLine)[] = []
    for (const h of injuries.heroes) if (h.resolution.line) injuryLines.push(h.resolution.line)
    for (const s of injuries.hiredSwords) if (s.resolution.line) injuryLines.push(s.resolution.line)
    for (const g of injuries.groups) if (g.resolution.line) injuryLines.push(g.resolution.line)
    report = {
      version: REPORT_VERSION,
      won: draft.result === 'won',
      result: draft.result,
      routed: draft.routed,
      xp_log: xp.lines,
      ooa: ooaLines(draft, participants),
      injuries: injuryLines,
      exploration: exploration.record,
      veteran_pool_roll: veteranPoolOf(draft),
      notes: battleNotes(draft),
      applied: buildApplied(draft, ctx, participants, injuries, xp, exploration),
    }
  }

  return { participants, survivingHeroes, injuries, xp, exploration, veteranPool: veteranPoolOf(draft), problems, firstIncompleteStep, report }
}

/** The finished report, or an error naming what is still missing. */
export function buildReport(draft: ReportDraft, ctx: ReportContext): BattleReport {
  const derived = deriveReport(draft, ctx)
  if (!derived.report) {
    const missing = STEP_IDS.flatMap((id) => derived.problems[id])
    throw new Error(missing[0] ?? 'The report is not complete yet.')
  }
  return derived.report
}
