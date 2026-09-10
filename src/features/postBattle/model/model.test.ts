import { describe, expect, it } from 'vitest'
import { battleReportSchema, emptyBattleLiveState, heroReportPatchSchema, type ItemRow } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { deriveExploration } from './exploration'
import { buildReport as buildRawReport, deriveReport as deriveRawReport, type ReportContext } from './derive'
import { resolveGroupInjuries, resolveHeroInjuryFlow, resolveHiredSwordInjury } from './injuries'
import { participantsOf } from './participants'
import {
  addHeroInjuryRoll,
  emptyDraft,
  seedFromBattleSheet,
  setExplorationRolls,
  setExplorationSubRoll,
  setExplorationDiceOverride,
  toggleExplorationKeep,
  setInjurySkip,
  setGroupInjuryDice,
  setGroupInjuryRoll,
  setGroupOut,
  setHeroInjuryCount,
  setHeroInjurySubRoll,
  setHeroOut,
  setResult,
  setSwordInjury,
  setVeteranDie,
  addXpExtra,
  setEnemiesOut,
  seedAdvance,
  setAdvanceMode,
  updateAdvance,
  advanceKey,
  type ReportDraft,
} from './state'
import { rosterAfterReport } from './derive'
import { emptyDraft as emptyAdvanceDraft, setDice } from '../../advances/model'

/** Unrelated report tests complete their earned rolls explicitly; advancement-gate tests use the raw derivation below. */
function rollEarnedAdvances(draft: ReportDraft, context: ReportContext): ReportDraft {
  for (let pass = 0; pass < 12; pass++) {
    const next = deriveRawReport(draft, context).advances.items.find(item => !item.complete)
    if (!next) return draft
    if (next.subject?.kind !== 'group') {
      draft = updateAdvance(seedAdvance(draft, next.key, emptyAdvanceDraft('test-promotion')), next.key, a => setDice(a, 1, 1))
      draft = setAdvanceMode(draft, next.key, 'pickLater')
    } else {
      let resolved = false
      for (const [one, two] of [[1,1], [3,3], [2,3], [4,4]]) {
        const candidate = updateAdvance(seedAdvance(draft, next.key, emptyAdvanceDraft('test-promotion')), next.key, a => setDice(a, one, two))
        const planned = deriveRawReport(candidate, context).advances.items.find(item => item.key === next.key)!
        if (planned.complete) { draft = candidate; resolved = true; break }
      }
      if (!resolved) throw new Error('Fixture must supply a legal group advance')
    }
  }
  throw new Error('Fixture advancement limit exceeded')
}
function deriveReport(draft: ReportDraft, context: ReportContext) { return deriveRawReport(rollEarnedAdvances(draft, context), context) }
function buildReport(draft: ReportDraft, context: ReportContext) { return buildRawReport(rollEarnedAdvances(draft, context), context) }

const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }

function hero(id: string, extra: Partial<RosterHero> = {}): RosterHero {
  return {
    id,
    name: id,
    unitTemplateId: 'mercenaries_reikland_champions',
    stats,
    xp: 0,
    levelUps: 0,
    skillTableIds: [],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [{ itemId: 'sword', quantity: 1 }],
    status: 'active',
    ...extra,
  }
}

function sword(id: string, extra: Partial<RosterHiredSword> = {}): RosterHiredSword {
  return { id, hiredSwordId: 'ogre_bodyguard', name: id, stats, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active', ...extra }
}

function group(id: string, size: number, xp = 0): RosterHenchmanGroup {
  return { id, name: id, unitTemplateId: 'mercenaries_reikland_warriors', size, stats, xp, levelUps: 0, statIncreases: {}, equipment: [] }
}

const template = findWarbandTemplate('mercenaries_reikland')

/** Captain (leader, 20 xp), two champions, a youngblood sitting out, an ogre and a warrior group. */
function makeRoster(): RosterWarband {
  return {
    id: 'w1',
    name: 'The Sellswords',
    warbandTemplateId: 'mercenaries_reikland',
    gold: 100,
    wyrdstone: 0,
    veteranPool: null,
    heroes: [
      hero('captain', { unitTemplateId: 'mercenaries_reikland_captain', xp: 20 }),
      hero('champion', { xp: 7 }),
      hero('marksman', { xp: 1 }),
      hero('youngblood', { unitTemplateId: 'mercenaries_reikland_youngbloods', flags: { missNextGames: 2 } }),
    ],
    hiredSwords: [sword('ogre', { xp: 1 })],
    henchmenGroups: [group('watch', 3, 1)],
    stash: [],
  }
}

const itemRows: ItemRow[] = [
  { id: 'item-captain-sword', warband_id: 'w1', holder_type: 'hero', holder_id: 'captain', item_rules_id: 'sword', custom_name: null, quantity: 1, notes: '', created_at: '', updated_at: '' },
  { id: 'item-champion-sword', warband_id: 'w1', holder_type: 'hero', holder_id: 'champion', item_rules_id: 'sword', custom_name: null, quantity: 1, notes: '', created_at: '', updated_at: '' },
  { id: 'item-marksman-sword', warband_id: 'w1', holder_type: 'hero', holder_id: 'marksman', item_rules_id: 'sword', custom_name: null, quantity: 1, notes: '', created_at: '', updated_at: '' },
]

function ctx(overrides: Partial<ReportContext> = {}): ReportContext {
  return { roster: makeRoster(), template, items: itemRows, matchId: 'm1', myRating: 100, opponentRating: 100, ...overrides }
}

/** Fill the exploration dice with distinct values (no location) so the report can be built. */
function withDice(draft: ReportDraft, c: ReportContext): ReportDraft {
  const n = deriveReport(draft, c).exploration.allowed?.count ?? 0
  return n > 0 ? setExplorationRolls(draft, [1, 2, 3, 4, 5, 6].slice(0, n)) : draft
}

/** Derive with the exploration dice filled in. */
function derive(draft: ReportDraft, c: ReportContext = ctx()) {
  return deriveReport(withDice(draft, c), c)
}

describe('participants', () => {
  it('lists who fought and picks the captain as leader', () => {
    const p = participantsOf(makeRoster(), template)
    expect(p.heroes.map((h) => h.id)).toEqual(['captain', 'champion', 'marksman'])
    expect(p.hiredSwords.map((s) => s.id)).toEqual(['ogre'])
    expect(p.groups.map((g) => g.id)).toEqual(['watch'])
    expect(p.satOut).toEqual([{ id: 'youngblood', name: 'youngblood', reason: 'Misses this game', missNextGames: 2 }])
    expect(p.leaderId).toBe('captain')
  })

  it('falls back to the highest Leadership when the captain is gone', () => {
    const roster = makeRoster()
    roster.heroes[0].status = 'dead'
    roster.heroes[2].stats = { ...stats, Ld: 9 }
    expect(participantsOf(roster, template).leaderId).toBe('marksman')
  })
})

describe('seedFromBattleSheet', () => {
  it('pre-fills out-of-action, enemies out, rout and battle loot from the tallies', () => {
    const live = {
      ...emptyBattleLiveState(),
      routed: true,
      wyrdstoneFound: 2,
      loot: ['a silver ring'],
      tallies: [
        { id: 'captain', kind: 'hero' as const, enemiesOutOfAction: 2, outOfAction: 0, woundsLost: 0, note: '' },
        { id: 'champion', kind: 'hero' as const, enemiesOutOfAction: 0, outOfAction: 1, woundsLost: 0, note: '' },
        { id: 'watch', kind: 'group' as const, enemiesOutOfAction: 0, outOfAction: 5, woundsLost: 0, note: '' },
        { id: 'stranger', kind: 'hero' as const, enemiesOutOfAction: 1, outOfAction: 1, woundsLost: 0, note: '' },
      ],
    }
    const draft = seedFromBattleSheet(makeRoster(), live)
    expect(draft.heroesOut).toEqual(['champion'])
    expect(draft.enemiesOut).toEqual({ captain: 2 })
    expect(draft.groupsOut).toEqual({ watch: 3 })
    expect(draft.routed).toBe(true)
    expect(draft.battleWyrdstone).toBe(2)
    expect(draft.notes).toBe('Loot: a silver ring')
    expect(draft.result).toBeNull()
  })
})

describe('experience', () => {
  it('awards survive, winning leader and enemies out, and counts thresholds crossed', () => {
    let draft = setResult(emptyDraft(), 'won')
    draft = setEnemiesOut(draft, 'captain', 2)
    draft = setEnemiesOut(draft, 'champion', 1)
    const d = derive(draft)
    const byId = new Map(d.xp.lines.map((l) => [l.subjectId, l]))
    // Captain 20 -> 24: survive, leader, 2 enemies; crosses the 24 box.
    expect(byId.get('captain')).toMatchObject({ amount: 4, xpBefore: 20, xpAfter: 24, advancesEarned: 1 })
    expect(byId.get('captain')?.reasons).toEqual(['+1 survived the battle', '+1 winning leader', '+2 enemies out of action'])
    // Champion 7 -> 9: crosses 8.
    expect(byId.get('champion')).toMatchObject({ amount: 2, xpAfter: 9, advancesEarned: 1 })
    // Marksman 1 -> 2: crosses 2.
    expect(byId.get('marksman')).toMatchObject({ amount: 1, xpAfter: 2, advancesEarned: 1 })
    // Ogre earns as a hero: 1 -> 2 crosses the hero box at 2.
    expect(byId.get('ogre')).toMatchObject({ subjectType: 'hiredSword', amount: 1, advancesEarned: 1 })
    // Group 1 -> 2 crosses the henchman box at 2.
    expect(byId.get('watch')).toMatchObject({ subjectType: 'group', amount: 1, advancesEarned: 1 })
    // The youngblood sat out: nothing.
    expect(byId.has('youngblood')).toBe(false)
    expect(d.report?.applied.pending_advances).toEqual(
      expect.arrayContaining([
        { subject_type: 'hero', subject_id: 'captain', threshold_xp: 24 },
        { subject_type: 'hero', subject_id: 'champion', threshold_xp: 8 },
        { subject_type: 'hero', subject_id: 'ogre', threshold_xp: 2 },
        { subject_type: 'group', subject_id: 'watch', threshold_xp: 2 },
      ]),
    )
  })

  it('applies the underdog bonus to every survivor, and only when toggled on', () => {
    const draft = setResult(emptyDraft(), 'lost')
    const d = deriveReport(draft, ctx({ myRating: 100, opponentRating: 180 }))
    expect(d.xp.underdogAvailable).toBe(2)
    for (const line of d.xp.lines) expect(line.reasons).toContain('+2 underdog bonus')
    const off = deriveReport({ ...draft, underdog: false }, ctx({ myRating: 100, opponentRating: 180 }))
    expect(off.xp.underdogApplied).toBe(0)
    expect(off.xp.lines.every((l) => l.amount === 1)).toBe(true)
  })

  it('takes free extras with a reason', () => {
    let draft = setResult(emptyDraft(), 'draw')
    draft = addXpExtra(draft, 'champion', { amount: 2, reason: 'carried the shard off the table' })
    const line = deriveReport(draft, ctx()).xp.lines.find((l) => l.subjectId === 'champion')
    expect(line).toMatchObject({ amount: 3, reasons: ['+1 survived the battle', '+2 carried the shard off the table'] })
  })
})

describe('hero injuries', () => {
  const champion = hero('champion', { xp: 7 })

  it('asks for a D66, then a sub-roll for Arm Wound, then applies it', () => {
    const start = resolveHeroInjuryFlow(champion, { rolls: [], countRoll: null })
    expect(start.pending.kind).toBe('d66')
    const askSub = resolveHeroInjuryFlow(champion, { rolls: [{ d66: 23, subRoll: null }], countRoll: null })
    expect(askSub.pending).toMatchObject({ kind: 'subRoll', die: 'D6', rollIndex: 0 })
    expect(askSub.line).toBeNull()
    const done = resolveHeroInjuryFlow(champion, { rolls: [{ d66: 23, subRoll: 1 }], countRoll: null })
    expect(done.pending.kind).toBe('done')
    expect(done.outcome).toBe('injured')
    expect(done.hero.flags.singleHandedWeaponsOnly).toBe(true)
    expect(done.line).toMatchObject({ injuryCode: 'arm_wound', injuryName: 'Arm Wound', rolls: [23, 1], outcome: 'injured' })
  })

  it('a Dead result kills the hero, removes their kit and awards no survive xp', () => {
    let draft = setResult(emptyDraft(), 'won')
    draft = setHeroOut(draft, 'champion', true)
    draft = addHeroInjuryRoll(draft, 'champion', 12)
    const d = derive(draft)
    const res = d.injuries.heroes[0].resolution
    expect(res.outcome).toBe('dead')
    expect(d.xp.lines.find((l) => l.subjectId === 'champion')).toBeUndefined()
    const patch = d.report?.applied.heroes.find((h) => h.id === 'champion')?.patch
    expect(patch?.status).toBe('dead')
    expect(patch?.xp).toBeUndefined()
    expect(d.report?.applied.remove_item_ids).toEqual(['item-champion-sword'])
    expect(d.report?.ooa).toContainEqual({ subjectType: 'hero', subjectId: 'champion', subjectName: 'champion', count: 1 })
  })

  it('a hero out of action who recovers still earns survive xp', () => {
    let draft = setResult(emptyDraft(), 'lost')
    draft = setHeroOut(draft, 'champion', true)
    draft = addHeroInjuryRoll(draft, 'champion', 44)
    const d = derive(draft)
    expect(d.injuries.heroes[0].resolution.outcome).toBe('recovered')
    expect(d.xp.lines.find((l) => l.subjectId === 'champion')).toMatchObject({ amount: 1, xpAfter: 8, advancesEarned: 1 })
    expect(d.report?.applied.remove_item_ids).toEqual([])
  })

  it('Sold to the Pits sets pitFightOwed on the hero, in the applied patch, and survives the report schema (#54)', () => {
    let draft = setResult(emptyDraft(), 'lost')
    draft = setHeroOut(draft, 'champion', true)
    draft = addHeroInjuryRoll(draft, 'champion', 65)
    const d = derive(draft)
    const res = d.injuries.heroes[0].resolution
    expect(res.hero.flags.pitFightOwed).toBe(true)
    const patch = d.report?.applied.heroes.find((h) => h.id === 'champion')?.patch
    expect(patch?.flags).toMatchObject({ pitFightOwed: true })
    // #54's actual bug: derive.ts got this right, but warriorFlagsSchema (domain/json.ts) didn't
    // know the key yet, and battleReportSchema.parse() silently stripped it before the RPC call —
    // `satisfies z.ZodType<WarriorFlags>` does not catch a schema missing an optional field, so
    // this only ever shows up by actually parsing a real patch through it, not from tsc.
    expect(heroReportPatchSchema.shape.patch.parse(patch).flags).toMatchObject({ pitFightOwed: true })
  })

  it('Robbed removes the equipment rows and keeps the hero', () => {
    let draft = setResult(emptyDraft(), 'lost')
    draft = setHeroOut(draft, 'marksman', true)
    draft = addHeroInjuryRoll(draft, 'marksman', 36)
    const d = derive(draft)
    expect(d.injuries.heroes[0].resolution.outcome).toBe('injured')
    expect(d.report?.applied.remove_item_ids).toEqual(['item-marksman-sword'])
    expect(d.report?.applied.heroes.find((h) => h.id === 'marksman')?.patch.status).toBeUndefined()
  })

  it('Multiple Injuries asks for the count, re-rolls excluded results and stops when done', () => {
    let draft = setResult(emptyDraft(), 'lost')
    draft = setHeroOut(draft, 'champion', true)
    draft = addHeroInjuryRoll(draft, 'champion', 16)
    let res = deriveReport(draft, ctx()).injuries.heroes[0].resolution
    expect(res.pending.kind).toBe('count')
    draft = setHeroInjuryCount(draft, 'champion', 2)
    res = deriveReport(draft, ctx()).injuries.heroes[0].resolution
    expect(res.pending.kind).toBe('d66')
    // Dead is re-rolled during Multiple Injuries.
    draft = addHeroInjuryRoll(draft, 'champion', 11)
    res = deriveReport(draft, ctx()).injuries.heroes[0].resolution
    expect(res.steps[1]).toMatchObject({ d66: 11, rerolled: true })
    expect(res.pending.kind).toBe('d66')
    draft = addHeroInjuryRoll(draft, 'champion', 22) // Leg Wound
    draft = addHeroInjuryRoll(draft, 'champion', 24) // Madness: needs a sub-roll
    res = deriveReport(draft, ctx()).injuries.heroes[0].resolution
    expect(res.pending).toMatchObject({ kind: 'subRoll', rollIndex: 3 })
    draft = setHeroInjurySubRoll(draft, 'champion', 3, 5)
    const d = derive(draft)
    res = d.injuries.heroes[0].resolution
    expect(res.pending.kind).toBe('done')
    expect(res.hero.stats.M).toBe(3)
    expect(res.hero.flags.frenzy).toBe(true)
    expect(res.hero.status).toBe('active')
    expect(res.line).toMatchObject({ injuryCode: 'multiple_injuries', injuryName: 'Multiple Injuries: Leg Wound, Madness', rolls: [16, 2, 11, 22, 24, 5] })
    expect(d.report?.applied.heroes.find((h) => h.id === 'champion')?.patch).toMatchObject({ stats: { M: 3 }, flags: { frenzy: true }, xp: 8 })
  })

  it('Survives Against The Odds adds its experience to the line', () => {
    let draft = setResult(emptyDraft(), 'lost')
    draft = setHeroOut(draft, 'marksman', true)
    draft = addHeroInjuryRoll(draft, 'marksman', 66)
    const line = deriveReport(draft, ctx()).xp.lines.find((l) => l.subjectId === 'marksman')
    expect(line).toMatchObject({ amount: 2, xpBefore: 1, xpAfter: 3, reasons: ['+1 survived the battle', '+1 from the Serious Injuries chart'] })
  })
})

describe('hired sword and henchman injuries', () => {
  it('hired swords roll a D6: 1-2 dead', () => {
    expect(resolveHiredSwordInjury(sword('ogre'), null).line).toBeNull()
    expect(resolveHiredSwordInjury(sword('ogre'), 2).outcome).toBe('dead')
    expect(resolveHiredSwordInjury(sword('ogre'), 3)).toMatchObject({ outcome: 'recovered', sword: { status: 'active' } })
    let draft = setResult(emptyDraft(), 'lost')
    draft = setHeroOut(draft, 'ogre', true)
    draft = setSwordInjury(draft, 'ogre', 1)
    const d = derive(draft)
    expect(d.report?.applied.heroes.find((h) => h.id === 'ogre')?.patch).toEqual({ status: 'dead' })
    expect(d.xp.lines.find((l) => l.subjectId === 'ogre')).toBeUndefined()
  })

  it('a group with two out rolling [1, 5] loses one model', () => {
    const res = resolveGroupInjuries(group('watch', 3), 2, [1, 5])
    expect(res).toMatchObject({ dead: 1, complete: true, group: { size: 2 }, line: { subjectType: 'group', rolls: [1, 5], dead: 1 } })
    expect(resolveGroupInjuries(group('watch', 3), 2, [1, null]).complete).toBe(false)
    let draft = setResult(emptyDraft(), 'lost')
    draft = setGroupOut(draft, 'watch', 2, 3)
    draft = setGroupInjuryRoll(draft, 'watch', 0, 1)
    draft = setGroupInjuryRoll(draft, 'watch', 1, 5)
    const d = derive(draft)
    expect(d.report?.applied.groups).toEqual([{ id: 'watch', patch: { size: 2, xp: 2 } }])
    expect(d.injuries.summary.henchmenDead).toBe(1)
  })

  it('a wiped-out group earns nothing and keeps size 0', () => {
    const res = resolveGroupInjuries(group('pair', 2, 1), 2, [1, 2])
    expect(res.group.size).toBe(0)
    expect(res.dead).toBe(2)
    const roster = makeRoster()
    roster.henchmenGroups = [group('pair', 2, 1)]
    let draft = setResult(emptyDraft(), 'lost')
    draft = setGroupOut(draft, 'pair', 2, 2)
    draft = setGroupInjuryRoll(draft, 'pair', 0, 1)
    draft = setGroupInjuryRoll(draft, 'pair', 1, 2)
    const d = derive(draft, ctx({ roster }))
    expect(d.xp.lines.find((l) => l.subjectId === 'pair')).toBeUndefined()
    expect(d.report?.applied.groups).toEqual([{ id: 'pair', patch: { size: 0 } }])
  })
})

describe('exploration', () => {
  const roster = makeRoster()

  it('counts a die per surviving hero plus one for winning', () => {
    const p = participantsOf(roster, template)
    const won = deriveExploration(emptyDraft().exploration, roster, { won: true, eligibleHeroes: p.heroes })
    expect(won.allowed?.count).toBe(4)
    expect(won.problems).toEqual(['Enter all 4 exploration dice.'])
    const lostOneOut = deriveExploration(emptyDraft().exploration, roster, { won: false, eligibleHeroes: p.heroes.slice(1) })
    expect(lostOneOut.allowed?.count).toBe(2)
  })

  it('doubles find a location and the dice total gives shards', () => {
    let draft = setResult(emptyDraft(), 'won')
    draft = setExplorationRolls(draft, [3, 3, 1, 2]) // total 9 -> 2 shards; doubles of 3 -> Corpse
    let d = deriveReport(draft, ctx())
    expect(d.exploration.result?.shards).toBe(2)
    expect(d.exploration.location?.id).toBe('corpse')
    expect(d.exploration.needsSubRoll).toBe(true)
    expect(d.problems.exploration).toEqual(["Corpse: roll the location's D6."])
    draft = setExplorationSubRoll(draft, 5) // Sword
    d = deriveReport(draft, ctx())
    expect(d.exploration.problems).toEqual([])
    expect(d.exploration.items).toEqual([{ item_rules_id: 'sword', custom_name: null, quantity: 1 }])
    expect(d.exploration.record).toMatchObject({ diceAllowed: 4, rolls: [3, 3, 1, 2], total: 9, shards: 2, locationId: 'corpse', subRoll: 5, goldFound: 0 })
    expect(d.report?.applied.stash_items).toEqual([{ item_rules_id: 'sword', custom_name: null, quantity: 1 }])
    expect(d.report?.applied.warband.wyrdstone_delta).toBe(2)
  })

  it('a dice-amount gold reward must be entered', () => {
    let draft = setResult(emptyDraft(), 'won')
    draft = setExplorationRolls(draft, [2, 2, 1, 4]) // doubles of 2 -> Shop: D6 gc, Lucky Charm on a 1
    let d = deriveReport(draft, ctx())
    expect(d.exploration.location?.id).toBe('shop')
    expect(d.exploration.gold).toEqual({ fixed: 0, expressions: ['D6'], value: null })
    expect(d.exploration.suggestedItems).toEqual([])
    expect(d.problems.exploration[0]).toMatch(/gold/)
    draft = { ...draft, exploration: { ...draft.exploration, gold: 4, items: [] } }
    d = deriveReport(draft, ctx())
    expect(d.report?.applied.warband.gold_delta).toBe(4)
    expect(d.report?.applied.stash_items).toEqual([])
  })

  it('a location with a test gives its reward only when passed', () => {
    let draft = setResult(emptyDraft(), 'lost')
    draft = setExplorationRolls(draft, [1, 1, 6]) // total 8 -> 2 shards; doubles of 1 -> Well
    let d = deriveReport(draft, ctx())
    expect(d.exploration.location?.id).toBe('well')
    expect(d.exploration.needsTest?.stat).toBe('T')
    expect(d.problems.exploration).toEqual(['Well: choose which Hero was sent.', 'Well: record whether the test was passed.'])
    draft = { ...draft, exploration: { ...draft.exploration, testSubjectId: 'captain' } }
    d = deriveReport(draft, ctx())
    expect(d.problems.exploration).toEqual(['Well: record whether the test was passed.'])
    draft = { ...draft, exploration: { ...draft.exploration, testPassed: true } }
    d = deriveReport(draft, ctx())
    expect(d.exploration.record?.shards).toBe(3)
    expect(d.exploration.missNextGameHeroId).toBeNull()
    draft = { ...draft, exploration: { ...draft.exploration, testPassed: false } }
    d = deriveReport(draft, ctx())
    expect(d.exploration.record?.shards).toBe(2)
    expect(d.exploration.record?.notes[0]).toMatch(/T test failed/)
    expect(d.exploration.missNextGameHeroId).toBe('captain')
    expect(d.report?.applied.heroes).toContainEqual(expect.objectContaining({ id: 'captain', patch: expect.objectContaining({ flags: expect.objectContaining({ missNextGames: 1 }) }) }))
  })

  it('no surviving hero means no exploration at all', () => {
    let draft = setResult(emptyDraft(), 'won')
    for (const id of ['captain', 'champion', 'marksman']) {
      draft = setHeroOut(draft, id, true)
      draft = addHeroInjuryRoll(draft, id, 45)
    }
    const d = deriveReport(draft, ctx())
    expect(d.exploration.allowed).toBeNull()
    expect(d.exploration.skippedReason).toMatch(/no exploration/)
    expect(d.problems.exploration).toEqual([])
    expect(d.report?.exploration).toBeNull()
  })

  it('rolling more than six dice rolls the true total and needs a keep choice before scoring (#66)', () => {
    let draft = setResult(emptyDraft(), 'won')
    draft = setExplorationDiceOverride(draft, { count: 7, reason: 'Mordheim Map' })
    expect(deriveReport(draft, ctx()).exploration.allowed?.count).toBe(7)
    draft = setExplorationRolls(draft, [6, 5, 4, 3, 2, 1, 1]) // no multiple among the six best, so no location to resolve
    let d = deriveReport(draft, ctx())
    expect(d.exploration.needsKeepChoice).toBe(true)
    expect(d.exploration.result).toBeNull()
    expect(d.problems.exploration).toEqual(['Choose 6 of the 7 dice to keep (0 chosen so far).'])

    // Keep the six highest; discard the spare 1 (index 6).
    for (const i of [0, 1, 2, 3, 4, 5]) draft = toggleExplorationKeep(draft, i, 6)
    d = deriveReport(draft, ctx())
    expect(d.problems.exploration).toEqual([])
    expect(d.exploration.result?.total).toBe(21) // 6+5+4+3+2+1, not all 7 rolled pips (22)
    expect(d.exploration.record?.rolls).toEqual([6, 5, 4, 3, 2, 1, 1]) // every rolled die kept on the record
    expect(d.exploration.record?.notes.some((n) => n.includes('kept 6, 5, 4, 3, 2, 1, discarded 1'))).toBe(true)

    // Toggling a kept die back off drops it, so a wrong pick can be corrected.
    draft = toggleExplorationKeep(draft, 5, 6)
    d = deriveReport(draft, ctx())
    expect(d.exploration.needsKeepChoice).toBe(true)
    expect(d.problems.exploration).toEqual(['Choose 6 of the 7 dice to keep (5 chosen so far).'])
  })
})

describe('the finished report', () => {
  function completeDraft(): ReportDraft {
    let draft = setResult(emptyDraft(), 'won')
    draft = setEnemiesOut(draft, 'captain', 1)
    draft = setHeroOut(draft, 'champion', true)
    draft = addHeroInjuryRoll(draft, 'champion', 55)
    draft = setGroupOut(draft, 'watch', 1, 3)
    draft = setGroupInjuryRoll(draft, 'watch', 0, 6)
    draft = setExplorationRolls(draft, [4, 5]) // two survivors + win = 3 dice: one short on purpose
    draft = setVeteranDie(draft, 0, 3)
    draft = setVeteranDie(draft, 1, 4)
    return draft
  }

  it('refuses to build while a step is incomplete, naming it', () => {
    const draft = completeDraft()
    const d = deriveReport(draft, ctx())
    expect(d.firstIncompleteStep).toBe(5)
    expect(() => buildReport(draft, ctx())).toThrow(/exploration dice/)
  })

  it('records the veteran pool, battle loot and the sat-out hero, and parses against the contract', () => {
    let draft = completeDraft()
    draft = setExplorationRolls(draft, [4, 5, 6]) // total 15 -> 3 shards, no multiple
    draft = { ...draft, battleWyrdstone: 1, battleGold: 5, notes: 'Held the bridge.' }
    const report = buildReport(draft, ctx())
    expect(battleReportSchema.parse(report)).toEqual(report)
    expect(report.won).toBe(true)
    expect(report.veteran_pool_roll).toBe(7)
    expect(report.applied.warband).toEqual({ wyrdstone_delta: 4, gold_delta: 5, veteran_pool: 7 })
    expect(report.exploration).toMatchObject({ diceAllowed: 3, total: 15, shards: 3, locationId: null })
    expect(report.notes).toContain('1 shard of wyrdstone picked up during the battle.')
    expect(report.notes).toContain('Held the bridge.')
    // The youngblood missed this game: one fewer to miss.
    expect(report.applied.heroes.find((h) => h.id === 'youngblood')?.patch).toEqual({ flags: { missNextGames: 1 } })
    // Injuries recorded for the record, patches for the roster.
    expect(report.injuries).toHaveLength(2)
    expect(report.applied.heroes.find((h) => h.id === 'champion')?.patch).toMatchObject({ xp: 8, injuries: [{ injuryCode: 'full_recovery', matchId: 'm1' }] })
    expect(report.applied.heroes.find((h) => h.id === 'captain')?.patch).toEqual({ xp: 23 })
    expect(report.applied.groups).toEqual([{ id: 'watch', patch: { xp: 2 } }])
  })

  it('an unrolled veteran pool is recorded as null', () => {
    let draft = completeDraft()
    draft = setExplorationRolls(draft, [4, 5, 6])
    draft = setVeteranDie(draft, 0, null)
    draft = setVeteranDie(draft, 1, null)
    const report = buildReport(draft, ctx())
    expect(report.veteran_pool_roll).toBeNull()
    expect(report.applied.warband.veteran_pool).toBeNull()
    expect(battleReportSchema.safeParse(report).success).toBe(true)
  })
})

describe('advances in the wizard', () => {
  const derive = (draft: ReportDraft) => deriveRawReport(withDice(draft, ctx()), ctx())
  function wonDraft(): ReportDraft {
    return setEnemiesOut(setResult(emptyDraft(), 'won'), 'captain', 2)
  }

  it('lists every advance earned; untouched rolls block filing', () => {
    const d = derive(wonDraft())
    expect(d.advances.items.map((i) => i.key)).toEqual(expect.arrayContaining([advanceKey('captain', 24), advanceKey('champion', 8), advanceKey('ogre', 2), advanceKey('watch', 2)]))
    expect(d.advances.items.every((i) => i.complete)).toBe(false)
    expect(d.problems.advances.length).toBeGreaterThan(0)
    expect(d.report).toBeNull()
    expect(d.advances.items.find((i) => i.key === advanceKey('captain', 24))?.summary).toMatch(/before completing the report/)
    // The roster the advances are planned against already carries the report's experience.
    expect(d.advances.rosterAfter.heroes.find((h) => h.id === 'captain')?.xp).toBe(24)
  })

  it('allows a rolled skill choice to be deferred, but rejects legacy whole-advance deferral', () => {
    const key = advanceKey('captain', 24)
    let draft = seedAdvance(wonDraft(), key, emptyAdvanceDraft('dddddddd-0000-4000-8000-000000000009'))
    // 1 + 1 = 2: New skill on the hero table, so a skill has to be chosen.
    draft = updateAdvance(draft, key, (a) => setDice(a, 1, 1))
    let d = derive(draft)
    const item = d.advances.items.find((i) => i.key === key)!
    expect(item.plan?.total).toBe(2)
    expect(item.complete).toBe(false)
    expect(d.problems.advances.length).toBeGreaterThan(0)
    expect(d.report).toBeNull()

    d = derive(setAdvanceMode(draft, key, 'pickLater'))
    expect(d.advances.items.find((i) => i.key === key)).toMatchObject({ complete: true })
    expect(d.advances.items.find((i) => i.key === key)?.summary).toMatch(/skill to pick later/)
    expect(d.report).toBeNull()

    d = derive(setAdvanceMode(draft, key, 'later'))
    expect(d.advances.items.find((i) => i.key === key)).toMatchObject({ mode: 'now', complete: false })
    expect(d.report).toBeNull()
  })

  it('accepts a finished set of rolls with only skill selections deferred', () => {
    const draft = rollEarnedAdvances(wonDraft(), ctx())
    expect(derive(draft).report).not.toBeNull()
    expect(derive(draft).problems.advances).toEqual([])
    expect(() => buildRawReport(wonDraft(), ctx())).toThrow(/advance/)
  })

  it('rosterAfterReport applies the patches without touching anything else', () => {
    const roster = makeRoster()
    const after = rosterAfterReport(roster, {
      heroes: [{ id: 'captain', patch: { xp: 24, status: 'captured' } }, { id: 'ogre', patch: { xp: 2, status: 'left' } }],
      groups: [{ id: 'watch', patch: { size: 2, xp: 2 } }],
      warband: { wyrdstone_delta: 0, gold_delta: 0, veteran_pool: null },
      pending_advances: [],
      remove_item_ids: [],
      stash_items: [],
      item_patches: [],
    })
    expect(after.heroes.find((h) => h.id === 'captain')).toMatchObject({ xp: 24, status: 'captured', levelUps: 0 })
    expect(after.hiredSwords[0]).toMatchObject({ xp: 2, status: 'left' })
    expect(after.henchmenGroups[0]).toMatchObject({ size: 2, xp: 2 })
    expect(after.heroes.find((h) => h.id === 'champion')).toEqual(roster.heroes.find((h) => h.id === 'champion'))
  })
})

describe('suggested exploration dice', () => {
  it('rolls the suggested count unless the player overrides it with a reason, which is logged as an adjustment', () => {
    const base = setResult(emptyDraft(), 'won')
    const suggested = deriveReport(base, ctx()).exploration
    expect(suggested.suggested?.count).toBe(4)
    expect(suggested.allowed?.count).toBe(4)
    expect(suggested.adjustment).toBeNull()

    const noReason = deriveReport(setExplorationDiceOverride(base, { count: 5, reason: '' }), ctx()).exploration
    expect(noReason.allowed?.count).toBe(5)
    expect(noReason.rolls).toHaveLength(5)
    expect(noReason.problems[0]).toMatch(/why the number of exploration dice/)

    let draft = setExplorationDiceOverride(base, { count: 5, reason: 'Holds the Merchant Quarter' })
    draft = setExplorationRolls(draft, [1, 2, 3, 4, 5])
    const d = deriveReport(draft, ctx())
    expect(d.exploration.adjustment).toEqual({ label: 'Exploration dice', suggested: '4 (4 surviving heroes, +1 for winning = 5 dice)'.replace('4 (4 surviving heroes, +1 for winning = 5 dice)', d.exploration.adjustment!.suggested), used: '5', reason: 'Holds the Merchant Quarter' })
    expect(d.exploration.adjustment?.suggested).toMatch(/^4 \(/)
    expect(d.report?.adjustments).toHaveLength(1)
    expect(d.report?.exploration?.diceAllowed).toBe(5)
    expect(d.report?.exploration?.diceReason).toMatch(/changed to 5: Holds the Merchant Quarter/)

    // Setting the count back to the suggestion clears the override.
    expect(setExplorationDiceOverride(draft, null).exploration.diceOverride).toBeNull()
    expect(setExplorationDiceOverride(draft, { count: 40, reason: 'x' }).exploration.diceOverride?.count).toBe(12)
  })
})

describe('scenario aftermath', () => {
  it('Burning replaces injuries and XP, removes dead heroes’ equipment, and awards recovery XP once per group', () => {
    let draft = setGroupOut(setHeroOut(setHeroOut(setResult(emptyDraft(), 'lost'), 'captain', true), 'champion', true), 'watch', 2, 3)
    draft = { ...draft, scenarioInjuryDice: { captain: 5, champion: 6 }, groupInjuries: { watch: [1, 6] } }
    const c = ctx({ scenarioId: 'mordheim_s_burning' })
    let d = deriveReport(draft, c)
    expect(d.injuries.heroes.map(h => h.resolution.outcome)).toEqual(['dead', 'recovered'])
    expect(d.xp.lines.find(x => x.subjectId === 'captain')).toBeUndefined()
    expect(d.xp.lines.find(x => x.subjectId === 'champion')?.amount).toBe(6)
    expect(d.xp.lines.find(x => x.subjectId === 'watch')?.amount).toBe(6)
    expect(d.exploration.allowed?.count).toBe(1)
    draft = setExplorationRolls(draft, [1])
    for (const advance of d.advances.items) draft = setAdvanceMode(draft, advance.key, 'later')
    d = deriveReport(draft, c)
    expect(d.report?.applied.remove_item_ids).toContain('item-captain-sword')
    expect(d.report?.applied.groups.find(g => g.id === 'watch')?.patch).toMatchObject({ size: 2, xp: 7 })
  })

  it('uses scenario exploration counts without removing reasoned player adjustments', () => {
    const won = setResult(emptyDraft(), 'won')
    expect(deriveReport(won, ctx({ scenarioId: 'mordheim_s_burning' })).exploration.suggested?.count).toBe(3)
    expect(deriveReport(setResult(emptyDraft(), 'lost'), ctx({ scenarioId: 'mordheim_s_burning' })).exploration.suggested?.count).toBe(3)
    expect(deriveReport(won, ctx({ scenarioId: 'a_stroll_in_the_garden' })).exploration.suggested?.count).toBe(5)
    const override = setExplorationDiceOverride(setResult(emptyDraft(), 'lost'), { count: 2, reason: 'Agreed scenario adaptation' })
    expect(deriveReport(override, ctx({ scenarioId: 'mordheim_s_burning' })).exploration.allowed?.count).toBe(2)
  })

  it('Wizard’s Tower replaces exploration with chest rewards but permits an explained adaptation', () => {
    const c = ctx({ scenarioId: 'the_wizard_s_tower' })
    for (const result of ['won', 'lost', 'draw'] as const) {
      const d = deriveReport(setResult(emptyDraft(), result), c)
      expect(d.exploration.allowed?.count).toBe(0)
      expect(d.exploration.skippedReason).toMatch(/recovered chests/)
      expect(d.exploration.record).toBeNull()
    }
    const adjusted = setExplorationDiceOverride(setResult(emptyDraft(), 'won'), { count: 2, reason: 'Agreed campaign adaptation' })
    const d = deriveReport(setExplorationRolls(adjusted, [1, 2]), c)
    expect(d.exploration.record?.rolls).toEqual([1, 2])
    expect(d.exploration.adjustment?.suggested).toMatch(/^0 /)
    expect(d.exploration.adjustment?.reason).toBe('Agreed campaign adaptation')
  })

  it('files each Wizard’s Tower chest once and rejects incomplete rewards or unexplained extra loot', () => {
    const c = ctx({ scenarioId: 'the_wizard_s_tower' })
    const draft = { ...setResult(emptyDraft(), 'lost'), towerChests: [
      { result: 1, goldDice: [] }, { result: 4, goldDice: [2, 3, 4] }, { result: 6, goldDice: [1, 2, 3, 4, 5, 6] },
    ] }
    const d = deriveReport(draft, c)
    expect(d.report?.applied.warband.gold_delta).toBe(30)
    expect(d.report?.notes).toContain('Illusions — no reward')
    expect(d.report?.notes).toContain('3D6 rolled 2, 3, 4 — 9 gc')
    expect(d.report?.notes).toContain('6D6 rolled 1, 2, 3, 4, 5, 6 — 21 gc')
    expect(deriveReport({ ...draft, towerChests: [{ result: 6, goldDice: [1, 2, 3] }] }, c).report).toBeNull()
    expect(deriveReport({ ...draft, battleGold: 5 }, c).report).toBeNull()
    const adjusted = deriveReport({ ...draft, battleGold: 5, scenarioRewardOverrideReason: 'Agreed campaign bonus' }, c)
    expect(adjusted.report?.applied.warband.gold_delta).toBe(35)
    expect(adjusted.report?.notes).toContain('Agreed campaign bonus')
    expect(deriveReport({ ...draft, towerChests: [] }, c).report?.applied.warband.gold_delta).toBe(0)
  })

  it('files earned chest items and totals, logs dice, and requires reasons for extra loot', () => {
    const draft: ReportDraft = { ...setExplorationRolls(setResult(emptyDraft(), 'won'), [1,2,3,4]), scenarioRewards: { finds: {
      gold: { discovery: null, dice: [1,2,3] }, shards: { discovery: 5, dice: [3] },
      armour: { discovery: 1, dice: [] }, sword: { discovery: 3, dice: [] }, gems: { discovery: 1, dice: [] },
    } } }
    const c = ctx({ scenarioId: 'hidden_treasure' })
    const d = deriveReport(draft, c)
    expect(d.report?.applied.warband.gold_delta).toBe(6)
    expect(d.report?.applied.warband.wyrdstone_delta).toBe(3 + d.exploration.totalShards)
    expect(d.report?.applied.stash_items).toContainEqual({ item_rules_id: 'sword', custom_name: null, quantity: 1 })
    expect(d.report?.notes).toContain('3D6 rolled 1, 2, 3')
    expect(deriveReport({ ...draft, battleGold: 10 }, c).report).toBeNull()
    expect(deriveReport({ ...draft, battleGold: 10, scenarioRewardOverrideReason: 'Agreed bounty' }, c).report?.applied.warband.gold_delta).toBe(16)
    expect(deriveReport({ ...draft, scenarioRewards: {} }, c).report).toBeNull()
    expect(battleReportSchema.safeParse(d.report).success).toBe(true)
  })

  it('Herald non-campaign mode applies only the explicitly recorded object rewards', () => {
    const draft = { ...setGroupOut(setHeroOut(setResult(emptyDraft(), 'won'), 'captain', true), 'watch', 2, 3), scenarioNonCampaign: true, battleGold: 30, battleWyrdstone: 2, scenarioItems: [{ item_rules_id: 'sword', custom_name: null, quantity: 1 }] }
    const d = deriveReport(draft, ctx({ scenarioId: 'the_sword_of_the_herald', itemsUsed: { captain: ['sword'] } }))
    expect(d.problems).toEqual({ outcome: [], casualties: [], injuries: [], experience: [], advances: [], exploration: [], veterans: [], review: [] })
    expect(d.report?.applied).toEqual({ heroes: [], groups: [], pending_advances: [], remove_item_ids: [], item_patches: [], stash_items: draft.scenarioItems, warband: { gold_delta: 30, wyrdstone_delta: 2, veteran_pool: null } })
    expect(d.report?.xp_log).toEqual([])
    expect(d.report?.injuries).toEqual([])
    expect(d.report?.exploration).toBeNull()
    expect(battleReportSchema.safeParse(d.report).success).toBe(true)
  })

  it('Herald caps only Zombie kills, retaining normal enemy awards', () => {
    const draft = { ...setEnemiesOut(setResult(emptyDraft(), 'lost'), 'captain', 5), scenarioZombieKills: { captain: 3 } }
    const d = deriveReport(draft, ctx({ scenarioId: 'the_sword_of_the_herald' }))
    expect(d.xp.lines.find(x => x.subjectId === 'captain')?.amount).toBe(4)
  })
})

describe('injury overrides', () => {
  it('waiving a hero roll counts as a recovery, needs a reason, and is logged as an adjustment', () => {
    let draft = setHeroOut(setResult(emptyDraft(), 'won'), 'captain', true)
    let d = deriveReport(draft, ctx())
    expect(d.injuries.complete).toBe(false)
    draft = setInjurySkip(draft, 'captain', '')
    d = deriveReport(draft, ctx())
    expect(d.injuries.heroes[0].resolution.outcome).toBe('recovered')
    expect(d.problems.injuries).toContain('Say why a warrior is not rolling for injury.')
    draft = setInjurySkip(draft, 'captain', 'Lucky charm took the blow')
    d = derive(draft)
    expect(d.problems.injuries).toEqual([])
    expect(d.report?.adjustments).toEqual([{ label: 'Captain: injury roll'.replace('Captain', 'captain'), suggested: 'roll', used: 'no roll (recovered)', reason: 'Lucky charm took the blow' }])
    expect(d.report?.injuries[0]).toMatchObject({ subjectId: 'captain', outcome: 'recovered', rolls: [] })
    expect(setInjurySkip(draft, 'captain', null).injurySkips).toEqual({})
  })

  it('a group may roll a different number of dice than models out of action, with a reason', () => {
    let draft = setGroupOut(setResult(emptyDraft(), 'won'), 'watch', 2, 3)
    draft = setGroupInjuryDice(draft, 'watch', { count: 1, reason: '' })
    let d = deriveReport(draft, ctx())
    expect(d.injuries.groups[0].dice).toBe(1)
    expect(d.problems.injuries).toContain('Say why a group rolls a different number of injury dice.')
    draft = setGroupInjuryDice(draft, 'watch', { count: 1, reason: 'One stood back up' })
    draft = setGroupInjuryRoll(draft, 'watch', 0, 5)
    d = derive(draft)
    expect(d.injuries.groups[0].resolution.complete).toBe(true)
    expect(d.report?.adjustments).toEqual([{ label: 'watch: injury dice', suggested: '2', used: '1', reason: 'One stood back up' }])
    expect(d.report?.ooa[0]).toMatchObject({ subjectId: 'watch', count: 2 })
  })
})

it('persists single-battle departures and clears the rehire gap after the next battle',()=>{
 const completeDraft=()=>setVeteranDie(setVeteranDie(setResult(emptyDraft(),'won'),0,3),1,4)
 const roster=makeRoster()
 roster.hiredSwords=[sword('aenur',{hiredSwordId:'aenur_the_sword_of_twilight'})]
 const c=ctx({roster})
 const draft=withDice(completeDraft(),c)
 const report=buildReport(draft,c)
 const checked=battleReportSchema.parse(report)
 expect(checked.applied.heroes.find(h=>h.id==='aenur')?.patch).toMatchObject({status:'left',flags:{mustMissNextBattle:true}})
 const next=rosterAfterReport(roster,checked.applied)
 expect(next.hiredSwords[0]).toMatchObject({status:'left',flags:{mustMissNextBattle:true}})
 const c2=ctx({roster:next,matchId:'m2'})
 const report2=buildReport(withDice(completeDraft(),c2),c2)
 expect(rosterAfterReport(next,report2.applied).hiredSwords[0].flags.mustMissNextBattle).toBe(false)
})

describe('automatic treasure and quantity rewards (#108, #109, #188)', () => {
  it('files earned treasure in the roster change and report log', () => {
    const roster = makeRoster()
    roster.heroes[0].unitTemplateId = 'halflings_thief_hero'
    roster.heroes[1].skillIds = ['survivors_of_strigos_strigany_skills_light_fingers']
    const context = ctx({roster})
    const draft = withDice(setEnemiesOut(setResult(emptyDraft(),'lost'),'champion',3),context)
    const report = buildReport(draft,context)
    expect(report.applied.warband.wyrdstone_delta).toBe((report.exploration?.shards ?? 0) + 2)
    expect(report.notes).toContain('Cutpurse')
    expect(report.notes).toContain('Light Fingers (once this game)')
  })
  it('requires the Smithy D3 quantity and saves the result instead of one halberd', () => {
    let draft = setExplorationSubRoll(setExplorationRolls(setResult(emptyDraft(),'won'),[2,2,2,6]),4)
    let result = deriveReport(draft,ctx())
    expect(result.exploration.location?.id).toBe('smithy')
    expect(result.problems.exploration.join(' ')).toContain('quantity rolled on D3')
    expect(result.report).toBeNull()
    const key = result.exploration.itemQuantityPrompts[0].key
    draft = {...draft,exploration:{...draft.exploration,itemQuantities:{[key]:3}}}
    result = deriveReport(draft,ctx())
    expect(result.report?.applied.stash_items).toContainEqual({item_rules_id:'halberd',custom_name:null,quantity:3})
    expect(result.report?.exploration?.notes.join(' ')).toContain('D3 quantity 3')
    expect(deriveReport({...draft,exploration:{...draft.exploration,itemQuantities:{[key]:4}}},ctx()).report).toBeNull()
    expect(setExplorationSubRoll(draft,5).exploration.itemQuantities).toEqual({})
  })
})


describe('Exploration recruits applied through reports',()=>{
 it('adds a human prisoner to a veteran group with identical paid equipment and no XP fee',()=>{
  const c=ctx();c.items=[...c.items,{id:'group-swords',warband_id:'w1',holder_type:'group',holder_id:'watch',item_rules_id:'sword',custom_name:null,quantity:3,notes:'',created_at:'',updated_at:''}]
  const draft={...emptyDraft(),result:'lost' as const,exploration:{...emptyDraft().exploration,rolls:[3,3,3],gold:5,recruitChoice:'watch'}}
  const d=deriveRawReport(draft,c)
  expect(d.problems.exploration).toEqual([])
  const applied=deriveReport(draft,c)
  // Veteran dice remain an independent required step; inspect the report with them supplied.
  const report=buildReport({...draft,veteranPool:[1,1]},c)
  expect(report.applied.groups.find(g=>g.id==='watch')?.patch.size).toBe(4)
  expect(report.applied.item_patches.find(i=>i.id==='group-swords')?.quantity).toBe(4)
  expect(report.applied.warband.gold_delta).toBe(-5)
  expect(report.exploration?.notes.join(' ')).toContain('no hire or veteran-experience fee')
  expect(applied.problems.exploration).toEqual([])
 })
 it('blocks an unexplained equipment price and overfilled group',()=>{
  const c=ctx();c.roster.henchmenGroups[0].size=5
  const draft={...emptyDraft(),result:'lost' as const,exploration:{...emptyDraft().exploration,rolls:[3,3,3],gold:5,recruitChoice:'watch',recruitKitCost:0}}
  expect(deriveRawReport(draft,c).problems.exploration.join(' ')).toContain('at most five')
  expect(deriveRawReport(draft,c).problems.exploration.join(' ')).toContain('Explain')
 })
})

it('creates the rolled Zombie reward as a new zero-experience group and preserves it in the report schema',()=>{
 const c=ctx();c.template=findWarbandTemplate('the_undead');c.roster={...c.roster,warbandTemplateId:'the_undead',hiredSwords:[],henchmenGroups:[],heroes:c.roster.heroes.slice(0,3).map(h=>({...h,unitTemplateId:'the_undead_dregs',xp:0}))}
 const id='8c26f284-565f-4d6d-972f-5a51953e9083'
 const draft={...emptyDraft(),result:'lost' as const,veteranPool:[1,1] as [number,number],exploration:{...emptyDraft().exploration,rolls:[3,3,3],recruitDie:2,recruitChoice:'new',recruitGroupId:id}}
 const report=buildReport(draft,c)
 expect(report.applied.new_groups).toHaveLength(1)
 expect(report.applied.new_groups![0]).toMatchObject({id,size:2,xp:0,level_ups:0})
 expect(battleReportSchema.parse(report).applied.new_groups).toEqual(report.applied.new_groups)
 expect(rosterAfterReport(c.roster,report.applied).henchmenGroups.find(g=>g.id===id)?.size).toBe(2)
})
