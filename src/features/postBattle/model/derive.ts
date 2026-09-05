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

import type { BattleReport, HenchmanInjuryLine, HeroInjuryLine, ItemRow, OoaLine, ReportAdjustment, ReportApplied, XpLine } from '../../../domain'
import { REPORT_VERSION } from '../../../domain'
import { xpThresholds, type AdvanceRate } from '../../../rules/data/campaign/experience'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { deriveExploration, type ExplorationDerived } from './exploration'
import { resolveGroupInjuries, resolveHeroInjuryFlow, resolveHiredSwordInjury, type GroupInjuryResolution, type HeroInjuryResolution, type HiredSwordInjuryResolution, type InjuryOutcome } from './injuries'
import { participantsOf, type Participants } from './participants'
import { advanceKey, isDie, STEP_IDS, type AdvanceMode, type ReportDraft, type StepId } from './state'
import { unitRules } from '../../../rules/data/campaignRules'
import { henchmanInjuryException } from '../../../rules/resolve/injuries'
import { groupXpLine, underdogBonusFor, warriorXpLine } from './xp'
import { defaultPromotedName, effectiveStep, emptyDraft as emptyAdvanceDraft, findSubject, planGroup, planHero, subjectName, type AdvanceDraft, type AdvanceStep, type AdvanceSubject, type GroupPlan, type HeroPlan } from '../../advances/model'
import { skillTableName } from '../../roster/view/lookups'
import type { CampaignHouseRules } from '../../../rules/types/roster'

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
  /** The campaign's house rules (defaults when the warband is in no campaign). */
  houseRules?: CampaignHouseRules
  /** Outcomes recorded on the battle sheet before the game (tarot readings, list rules). */
  preBattle?: Record<string, string>
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
  /** `dice` is the number rolled: models out of action unless the player overrode it. */
  groups: { group: RosterHenchmanGroup; outOfAction: number; dice: number; resolution: GroupInjuryResolution }[]
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

/** Placeholder id for a promotion draft the step has not seeded yet; never reaches the server. */
export const UNSEEDED_HERO_ID = '00000000-0000-4000-8000-000000000000'

/** One advance earned this battle, as the Advances step sees it. */
export interface WizardAdvance {
  key: string
  request: ReportApplied['pending_advances'][number]
  /** Null when the warrior died or left in this very report. */
  subject: AdvanceSubject | null
  name: string
  draft: AdvanceDraft
  /** False until the step has stored a draft (with a real new-hero id) for it. */
  seeded: boolean
  mode: AdvanceMode
  plan: HeroPlan | GroupPlan | null
  step: AdvanceStep
  /** Nothing more is needed from the player for this advance. */
  complete: boolean
  /** One line for the review: what was rolled and chosen, or what was deferred. */
  summary: string
}

export interface AdvancesDerived {
  items: WizardAdvance[]
  /** The roster after the report and every advance resolved in the wizard. */
  rosterAfter: RosterWarband
  problems: string[]
}

export interface DerivedReport {
  participants: Participants
  advances: AdvancesDerived
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

export function heroOoaIds(draft: ReportDraft): Set<string> {
  return new Set(draft.heroesOut)
}

/** A warrior whose injury roll was waived: a full recovery with no dice, the reason on the line. */
function skippedHero(hero: RosterHero, reason: string): HeroInjuryResolution {
  return {
    hero,
    steps: [],
    pending: { kind: 'done' },
    outcome: 'recovered',
    line: { subjectType: 'hero', subjectId: hero.id, subjectName: hero.name, rolls: [], injuryCode: null, injuryName: 'No roll', effect: `No injury roll: ${reason}`, outcome: 'recovered' },
  }
}

function skippedSword(sword: RosterHiredSword, reason: string): HiredSwordInjuryResolution {
  return {
    sword,
    outcome: 'recovered',
    line: { subjectType: 'hiredSword', subjectId: sword.id, subjectName: sword.name, rolls: [], injuryCode: null, injuryName: 'No roll', effect: `No injury roll: ${reason}`, outcome: 'recovered' },
  }
}

export function deriveInjuries(draft: ReportDraft, participants: Participants, matchId: string): InjuriesDerived {
  const out = heroOoaIds(draft)
  const heroes = participants.heroes
    .filter((h) => out.has(h.id))
    .map((hero) => {
      const skip = draft.injurySkips[hero.id]
      return { hero, resolution: skip !== undefined ? skippedHero(hero, skip) : resolveHeroInjuryFlow(hero, draft.heroInjuries[hero.id] ?? { rolls: [], countRoll: null }, matchId) }
    })
  const hiredSwords = participants.hiredSwords
    .filter((s) => out.has(s.id))
    .map((sword) => {
      const skip = draft.injurySkips[sword.id]
      return { sword, resolution: skip !== undefined ? skippedSword(sword, skip) : resolveHiredSwordInjury(sword, draft.swordInjuries[sword.id] ?? null) }
    })
  const groups = participants.groups
    .filter((g) => (draft.groupsOut[g.id] ?? 0) > 0)
    .map((group) => {
      const outOfAction = Math.min(group.size, draft.groupsOut[group.id] ?? 0)
      const dice = draft.groupInjuryDice[group.id]?.count ?? (henchmanInjuryException(group)?.deadOn.length === 0 ? 0 : outOfAction)
      return { group, outOfAction, dice, resolution: resolveGroupInjuries(group, dice, draft.groupInjuries[group.id] ?? []) }
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
export function thresholdsCrossed(role: 'hero' | 'henchman', xpBefore: number, xpAfter: number, rate: AdvanceRate = 'normal'): number[] {
  return xpThresholds(role, rate).filter((t) => t > xpBefore && t <= xpAfter)
}

export function veteranPoolOf(draft: ReportDraft): number | null {
  const [a, b] = draft.veteranPool
  return isDie(a, 6) && isDie(b, 6) ? a + b : null
}

/** Every place the player overrode what the wizard suggested, for the report. */
export function reportAdjustments(draft: ReportDraft, participants: Participants, injuries: InjuriesDerived, exploration: ExplorationDerived): ReportAdjustment[] {
  const out: ReportAdjustment[] = []
  const nameOf = (id: string) => participants.heroes.find((h) => h.id === id)?.name ?? participants.hiredSwords.find((s) => s.id === id)?.name ?? id
  for (const [id, reason] of Object.entries(draft.injurySkips)) {
    if (!draft.heroesOut.includes(id)) continue
    out.push({ label: `${nameOf(id)}: injury roll`, suggested: 'roll', used: 'no roll (recovered)', reason: reason.trim() })
  }
  for (const g of injuries.groups) {
    const o = draft.groupInjuryDice[g.group.id]
    if (o && o.count !== g.outOfAction) out.push({ label: `${g.group.name}: injury dice`, suggested: String(g.outOfAction), used: String(o.count), reason: o.reason.trim() })
  }
  if (exploration.adjustment) out.push(exploration.adjustment)
  return out
}

function stepProblems(draft: ReportDraft, injuries: InjuriesDerived, exploration: ExplorationDerived): Record<StepId, string[]> {
  const problems: Record<StepId, string[]> = { outcome: [], casualties: [], injuries: [], experience: [], advances: [], exploration: [], veterans: [], review: [] }
  if (draft.result === null) problems.outcome.push('Record whether the warband won, lost or drew.')
  if (!injuries.complete) {
    const n = injuries.summary.pending
    problems.injuries.push(`${n} ${n === 1 ? 'warrior still needs' : 'warriors still need'} their injury dice.`)
  }
  if (Object.entries(draft.injurySkips).some(([id, reason]) => draft.heroesOut.includes(id) && reason.trim() === '')) problems.injuries.push('Say why a warrior is not rolling for injury.')
  if (injuries.groups.some((g) => draft.groupInjuryDice[g.group.id] && draft.groupInjuryDice[g.group.id].count !== g.outOfAction && draft.groupInjuryDice[g.group.id].reason.trim() === '')) {
    problems.injuries.push('Say why a group rolls a different number of injury dice.')
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
      for (const t of thresholdsCrossed('hero', line.xpBefore, line.xpAfter, unitRules(hero.unitTemplateId).advanceRate ?? 'normal')) pending.push({ subject_type: 'hero', subject_id: hero.id, threshold_xp: t })
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
      for (const t of thresholdsCrossed('henchman', line.xpBefore, line.xpAfter, unitRules(group.unitTemplateId).advanceRate ?? 'normal')) pending.push({ subject_type: 'group', subject_id: group.id, threshold_xp: t })
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

/** The roster as it will stand once the report's patches are applied (advances not yet rolled). */
export function rosterAfterReport(roster: RosterWarband, applied: ReportApplied): RosterWarband {
  const heroPatches = new Map(applied.heroes.map((h) => [h.id, h.patch]))
  const groupPatches = new Map(applied.groups.map((g) => [g.id, g.patch]))
  return {
    ...roster,
    heroes: roster.heroes.map((h) => {
      const p = heroPatches.get(h.id)
      if (!p) return h
      return {
        ...h,
        stats: p.stats ?? h.stats,
        xp: p.xp ?? h.xp,
        levelUps: p.level_ups ?? h.levelUps,
        injuries: p.injuries ?? h.injuries,
        flags: p.flags ?? h.flags,
        status: p.status === undefined ? h.status : p.status === 'left' ? 'retired' : p.status,
      }
    }),
    hiredSwords: roster.hiredSwords.map((s) => {
      const p = heroPatches.get(s.id)
      if (!p) return s
      return {
        ...s,
        stats: p.stats ?? s.stats,
        xp: p.xp ?? s.xp,
        levelUps: p.level_ups ?? s.levelUps,
        injuries: p.injuries ?? s.injuries,
        flags: p.flags ?? s.flags,
        status: p.status === undefined ? s.status : p.status === 'dead' ? 'dead' : p.status === 'active' ? 'active' : 'left',
      }
    }),
    henchmenGroups: roster.henchmenGroups.map((g) => {
      const p = groupPatches.get(g.id)
      if (!p) return g
      return { ...g, size: p.size ?? g.size, xp: p.xp ?? g.xp, levelUps: p.level_ups ?? g.levelUps }
    }),
  }
}

/**
 * The advances earned this battle, planned one after another against the post-report roster so a
 * second advance for the same warrior sees the first. Drafts the step has not seeded yet are
 * planned from an empty draft.
 */
export function deriveAdvances(draft: ReportDraft, ctx: ReportContext, applied: ReportApplied): AdvancesDerived {
  let roster = rosterAfterReport(ctx.roster, applied)
  const items: WizardAdvance[] = []
  const problems: string[] = []
  for (const request of applied.pending_advances) {
    const key = advanceKey(request.subject_id, request.threshold_xp)
    const subject = findSubject(roster, request.subject_type, request.subject_id)
    const stored = draft.advances[key]
    const mode = draft.advanceModes[key] ?? 'now'
    if (!subject || (subject.kind !== 'group' && subject.kind !== 'hiredSword' && subject.hero.status !== 'active') || (subject.kind === 'hiredSword' && subject.sword.status !== 'active')) {
      const name = subject ? subjectName(subject) : 'A warrior no longer on the roster'
      items.push({ key, request, subject, name, draft: stored ?? emptyAdvanceDraft(UNSEEDED_HERO_ID), seeded: Boolean(stored), mode: 'later', plan: null, step: 'roll', complete: true, summary: `${name}: advance at ${request.threshold_xp} xp left pending (out of the fight).` })
      continue
    }
    const name = subjectName(subject)
    const advDraft = stored ?? emptyAdvanceDraft(UNSEEDED_HERO_ID, subject.kind === 'group' ? defaultPromotedName(subject.group, roster) : '')
    const actx = { roster, template: ctx.template, thresholdXp: request.threshold_xp }
    const plan = subject.kind === 'group' ? planGroup(advDraft, subject.group, actx, skillTableName) : planHero(advDraft, subject, actx)
    const step = effectiveStep(advDraft, plan)
    let complete: boolean
    let summary: string
    if (mode === 'later') {
      complete = true
      summary = `${name}: advance at ${request.threshold_xp} xp to roll later.`
    } else if (mode === 'pickLater') {
      complete = subject.kind !== 'group' && plan.need === 'skill' && plan.roll !== null
      summary = complete ? `${name}: rolled ${plan.total}, ${plan.roll?.text.toLowerCase() ?? 'new skill'}; skill to pick later.` : `${name}: roll the advance first.`
    } else if (plan.total === null) {
      // Untouched: left pending, exactly as before the wizard could roll advances.
      complete = true
      summary = `${name}: advance at ${request.threshold_xp} xp not rolled here; left for Bestow advancements.`
    } else {
      complete = plan.result !== null
      summary = plan.result ? `${name}: ${plan.result.resolution.text}` : `${name}: rolled ${plan.total}, choice still to make.`
      if (plan.result) roster = plan.result.next
    }
    if (!complete) problems.push(`${name}: finish the choice for the advance, pick the skill later, or leave the whole advance for later.`)
    items.push({ key, request, subject, name, draft: advDraft, seeded: Boolean(stored), mode, plan, step, complete, summary })
  }
  return { items, rosterAfter: roster, problems }
}

export function deriveReport(draft: ReportDraft, ctx: ReportContext): DerivedReport {
  const participants = participantsOf(ctx.roster, ctx.template)
  const out = heroOoaIds(draft)
  const survivingHeroes = participants.heroes.filter((h) => !out.has(h.id))
  const injuries = deriveInjuries(draft, participants, ctx.matchId)
  const xp = deriveXp(draft, participants, injuries, ctx)
  const exploration = deriveExploration(draft.exploration, ctx.roster, {
    won: draft.result === 'won',
    eligibleHeroes: survivingHeroes,
    enemiesOut: Object.values(draft.enemiesOut).reduce((n, v) => n + (v ?? 0), 0),
  })
  const applied = buildApplied(draft, ctx, participants, injuries, xp, exploration)
  const advances = deriveAdvances(draft, ctx, applied)
  const problems = stepProblems(draft, injuries, exploration)
  problems.advances.push(...advances.problems)
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
      adjustments: reportAdjustments(draft, participants, injuries, exploration),
      applied,
    }
  }

  return { participants, advances, survivingHeroes, injuries, xp, exploration, veteranPool: veteranPoolOf(draft), problems, firstIncompleteStep, report }
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
