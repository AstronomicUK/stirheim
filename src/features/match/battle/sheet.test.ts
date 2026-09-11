import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState } from '../../../domain'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import {
  addEnemyOut,
  setWoundsLost,
  woundsLost,
  addLoot,
  applyEdit,
  benchedByOldWound,
  completeSave,
  fightingGroups,
  groupOut,
  initialSync,
  isHeroOut,
  notFightingReason,
  perModelKit,
  reconcileRemote,
  removeLoot,
  routStatus,
  setGroupOut,
  setTurn,
  setWyrdstoneFound,
  sheetTotals,
  splitWarriors,
  startingModels,
  toggleHeroOut,
} from './sheet'

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function hero(id: string, extra: Partial<RosterHero> = {}): RosterHero {
  return {
    id,
    name: id,
    unitTemplateId: 'captain',
    stats,
    xp: 0,
    levelUps: 0,
    skillTableIds: [],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [],
    status: 'active',
    ...extra,
  }
}

function sword(id: string, extra: Partial<RosterHiredSword> = {}): RosterHiredSword {
  return { id, hiredSwordId: 'ogre_bodyguard', name: id, stats, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active', ...extra }
}

function group(id: string, size: number): RosterHenchmanGroup {
  return { id, name: id, unitTemplateId: 'warrior', size, stats, xp: 0, levelUps: 0, statIncreases: {}, equipment: [] }
}

const roster: RosterWarband = {
  id: 'w1',
  name: 'Test',
  warbandTemplateId: 'reikland',
  gold: 0,
  wyrdstone: 0,
  veteranPool: null,
  heroes: [hero('captain'), hero('dead'), hero('wounded', { flags: { missNextGames: 1 } }), hero('scarred', { flags: { oldBattleWound: true } })],
  hiredSwords: [sword('ogre'), sword('gone', { status: 'left' })],
  henchmenGroups: [group('watch', 3), group('wiped', 0)],
  stash: [],
}
roster.heroes[1].status = 'dead'

describe('who fights', () => {
  it('splits warriors into fighting and sitting out, with a reason', () => {
    const split = splitWarriors(roster)
    expect(split.fighting.map((e) => e.warrior.id)).toEqual(['captain', 'scarred', 'ogre'])
    expect(split.notFighting.map((e) => [e.entry.warrior.id, e.reason])).toEqual([
      ['dead', 'Dead'],
      ['wounded', 'Misses this game'],
      ['gone', 'Left the warband'],
    ])
    expect(split.fighting.find((e) => e.warrior.id === 'ogre')?.role).toBe('hiredSword')
  })

  it('an old battle wound does not bench a warrior until the pre-battle die actually fails', () => {
    expect(notFightingReason(hero('x', { flags: { oldBattleWound: true } }))).toBeNull()
    expect(notFightingReason(hero('x', { flags: { oldBattleWound: true } }), true)).toBe('Old battle wound flared up')
    expect(notFightingReason(hero('x', { status: 'captured' }))).toBe('Captured')
  })

  it('benchedByOldWound reads a flared roll from the pre-battle record, and nothing else', () => {
    const flared = { ...emptyBattleLiveState(), preBattle: { 'oldWound:scarred': 'flares up: cannot fight this battle', 'rot:ogre': 'passed' } }
    expect(benchedByOldWound(flared)).toEqual(new Set(['scarred']))
    const clean = { ...emptyBattleLiveState(), preBattle: { 'oldWound:scarred': 'fine' } }
    expect(benchedByOldWound(clean)).toEqual(new Set())
  })

  it('a flared Old Battle Wound benches the warrior for this sheet, and drops him from the model count', () => {
    const flared = { ...emptyBattleLiveState(), preBattle: { 'oldWound:scarred': 'flares up: cannot fight this battle' } }
    const split = splitWarriors(roster, flared)
    expect(split.fighting.map((e) => e.warrior.id)).toEqual(['captain', 'ogre'])
    expect(split.notFighting.find((e) => e.entry.warrior.id === 'scarred')?.reason).toBe('Old battle wound flared up')
    // Without the sheet (or before the roll), he still fights, same as today.
    expect(splitWarriors(roster).fighting.map((e) => e.warrior.id)).toContain('scarred')
    expect(startingModels(roster, flared)).toBe(2 + 3)
  })

  it('drops wiped-out groups and counts starting models', () => {
    expect(fightingGroups(roster).map((g) => g.id)).toEqual(['watch'])
    expect(startingModels(roster)).toBe(3 + 3)
  })

  it('divides a group kit per model only when it divides evenly', () => {
    expect(perModelKit([{ itemId: 'sword', quantity: 6 }], 3)).toEqual({ items: [{ itemId: 'sword', quantity: 2 }], exact: true })
    expect(perModelKit([{ itemId: 'sword', quantity: 4 }], 3).exact).toBe(false)
    expect(perModelKit([{ itemId: 'sword', quantity: 1 }], 1).exact).toBe(true)
  })
})

describe('tally edits', () => {
  it('counts enemies out and never goes negative', () => {
    let s = emptyBattleLiveState()
    s = addEnemyOut(s, 'captain', 1)
    s = addEnemyOut(s, 'captain', 1)
    expect(s.tallies).toEqual([{ id: 'captain', kind: 'hero', enemiesOutOfAction: 2, outOfAction: 0, woundsLost: 0, note: '' }])
    s = addEnemyOut(s, 'captain', -5)
    expect(s.tallies).toEqual([])
    expect(s.editedAt).toBeTypeOf('string')
  })

  it('toggles a hero out and back', () => {
    let s = toggleHeroOut(emptyBattleLiveState(), 'captain')
    expect(isHeroOut(s, 'captain')).toBe(true)
    s = toggleHeroOut(s, 'captain')
    expect(isHeroOut(s, 'captain')).toBe(false)
    expect(s.tallies).toEqual([])
  })

  it('caps a group at its size and floors at zero', () => {
    let s = setGroupOut(emptyBattleLiveState(), 'watch', 5, 3)
    expect(groupOut(s, 'watch')).toBe(3)
    s = setGroupOut(s, 'watch', -1, 3)
    expect(groupOut(s, 'watch')).toBe(0)
    expect(s.tallies).toEqual([])
  })

  it('turn and wyrdstone never go below zero; loot ignores blanks', () => {
    let s = setTurn(emptyBattleLiveState(), -2)
    expect(s.turn).toBe(0)
    s = setWyrdstoneFound(s, 2)
    expect(s.wyrdstoneFound).toBe(2)
    const before = s
    s = addLoot(s, '   ')
    expect(s).toBe(before)
    s = addLoot(s, ' Silver chalice ')
    s = addLoot(s, 'Map')
    expect(s.loot).toEqual(['Silver chalice', 'Map'])
    s = removeLoot(s, 0)
    expect(s.loot).toEqual(['Map'])
    expect(removeLoot(s, 7)).toBe(s)
  })
})

describe('totals and rout', () => {
  it('sums the sheet against the roster', () => {
    let s = addEnemyOut(emptyBattleLiveState(), 'captain', 2)
    s = setGroupOut(s, 'watch', 1, 3)
    s = setWyrdstoneFound(s, 1)
    expect(sheetTotals(s, roster)).toEqual({ enemiesOutOfAction: 2, ownOutOfAction: 1, startingModels: 6, routModels: 6, routCasualties: 1, wyrdstoneFound: 1, routAt: 2 })
  })

  it('warns once a quarter of the models are down, until routed', () => {
    let s = setGroupOut(emptyBattleLiveState(), 'watch', 1, 3)
    expect(routStatus(s, 6)).toBe('none')
    s = toggleHeroOut(s, 'captain')
    expect(routStatus(s, 6)).toBe('test')
    expect(routStatus({ ...s, routed: true }, 6)).toBe('routed')
    expect(routStatus(s, 0)).toBe('none')
  })
})

describe('sync with the server row', () => {
  const remote = (turn: number, updated_at: string) => ({ live_state: { ...emptyBattleLiveState(), turn }, updated_at })

  it('adopts the first server row, then only newer ones while clean', () => {
    let sync = initialSync(emptyBattleLiveState())
    expect(reconcileRemote(sync, undefined)).toBe(sync)
    sync = reconcileRemote(sync, remote(2, '2026-09-04T10:00:00+00:00'))
    expect(sync.sheet.turn).toBe(2)
    expect(sync.syncedAt).toBe('2026-09-04T10:00:00+00:00')
    const same = reconcileRemote(sync, remote(9, '2026-09-04T09:59:00+00:00'))
    expect(same).toBe(sync)
    const newer = reconcileRemote(sync, remote(3, '2026-09-04T10:01:00.000000+00:00'))
    expect(newer.sheet.turn).toBe(3)
  })

  it('keeps local edits over a newer server row', () => {
    let sync = reconcileRemote(initialSync(emptyBattleLiveState()), remote(1, '2026-09-04T10:00:00+00:00'))
    sync = applyEdit(sync, setTurn(sync.sheet, 4))
    expect(sync.dirty).toBe(true)
    expect(sync.version).toBe(1)
    expect(reconcileRemote(sync, remote(2, '2026-09-04T10:05:00+00:00'))).toBe(sync)
    expect(applyEdit(sync, sync.sheet)).toBe(sync)
  })

  it('a save clears dirty unless edits landed in flight, and records the server time', () => {
    let sync = applyEdit(initialSync(emptyBattleLiveState()), setTurn(emptyBattleLiveState(), 1))
    const sent = sync.version
    const clean = completeSave(sync, sent, '2026-09-04T10:10:00+00:00')
    expect(clean.dirty).toBe(false)
    expect(clean.syncedAt).toBe('2026-09-04T10:10:00+00:00')
    // A refetch of the very row we saved is not newer, so it is ignored.
    expect(reconcileRemote(clean, remote(1, '2026-09-04T10:10:00+00:00'))).toBe(clean)

    sync = applyEdit(sync, setTurn(sync.sheet, 2))
    const stillDirty = completeSave(sync, sent, '2026-09-04T10:10:00+00:00')
    expect(stillDirty.dirty).toBe(true)
    expect(stillDirty.sheet.turn).toBe(2)
  })
})

describe('wounds lost', () => {
  it("is clamped to the model's Wounds, carries in the tally and clears when zero again", () => {
    let s = setWoundsLost(emptyBattleLiveState(), 'ogre', 'hero', 5, 3)
    expect(woundsLost(s, 'ogre')).toBe(3)
    expect(s.tallies).toHaveLength(1)
    s = setWoundsLost(s, 'ogre', 'hero', 0, 3)
    expect(woundsLost(s, 'ogre')).toBe(0)
    expect(s.tallies).toHaveLength(0)
  })
})

describe('taken out by', () => {
  it('keeps one answer per model out and drops them as warriors come back in', async () => {
    const { emptyBattleLiveState } = await import('../../../domain')
    const { setGroupOut, setTakenOutBy, takenOutBy, toggleHeroOut } = await import('./sheet')
    const fall = { warbandId: null, modelId: null, name: 'a fall, terrain or a spell', turn: 1 }
    let s = toggleHeroOut(emptyBattleLiveState(), 'cap')
    s = setTakenOutBy(s, 'cap', [fall])
    expect(takenOutBy(s, 'cap')).toEqual([fall])
    s = toggleHeroOut(s, 'cap')
    expect(takenOutBy(s, 'cap')).toEqual([])
    s = setGroupOut(s, 'grp', 2, 4)
    s = setTakenOutBy(s, 'grp', [fall, { ...fall, name: 'Skritch (Claws)', modelId: 'skritch', warbandId: 'w2' }])
    s = setGroupOut(s, 'grp', 1, 4)
    expect(takenOutBy(s, 'grp')).toEqual([fall])
  })
})


describe('special Rout casualty weights (#68)', () => {
  it.each(['orc_mob_goblin_warriors', 'orc_mob_cave_squigs'])('matches the printed five Orcs / ten non-Orcs example for %s', unitTemplateId => {
    const r: RosterWarband = { ...roster, heroes: Array.from({ length: 5 }, (_, i) => hero(`orc${i}`)), hiredSwords: [], henchmenGroups: [{ ...group('nonOrcs', 10), unitTemplateId }] }
    let sheet = setGroupOut(emptyBattleLiveState(), 'nonOrcs', 7, 10)
    expect(sheetTotals(sheet, r)).toMatchObject({ startingModels: 15, ownOutOfAction: 7, routCasualties: 3.5, routAt: 4 })
    expect(routStatus(sheet, startingModels(r), r)).toBe('none')
    sheet = setGroupOut(sheet, 'nonOrcs', 8, 10)
    expect(routStatus(sheet, startingModels(r), r)).toBe('test')
    sheet = setGroupOut(sheet, 'nonOrcs', 6, 10)
    sheet = toggleHeroOut(sheet, 'orc0')
    expect(sheetTotals(sheet, r).routCasualties).toBe(4)
    expect(routStatus(sheet, startingModels(r), r)).toBe('test')
  })
  it.each(['battle_monks_raging_peasants', 'maneaters_sabretusks'])('ignores %s casualties without shrinking the starting warband', unitTemplateId => {
    const r: RosterWarband = { ...roster, heroes: [hero('leader'), hero('hero2')], hiredSwords: [], henchmenGroups: [{ ...group('ignored', 2), unitTemplateId }] }
    let sheet = setGroupOut(emptyBattleLiveState(), 'ignored', 2, 2)
    expect(sheetTotals(sheet, r)).toMatchObject({ startingModels: 4, ownOutOfAction: 2, routCasualties: 0, routAt: 1 })
    expect(routStatus(sheet, startingModels(r), r)).toBe('none')
    sheet = toggleHeroOut(sheet, 'leader')
    expect(routStatus(sheet, startingModels(r), r)).toBe('test')
  })
})


it.each(['night_goblins_snotling_mob', 'night_goblins_web_snotlings'])('counts %s collectively, even across roster groups', unitTemplateId => {
  const r: RosterWarband = { ...roster, heroes: [hero('leader'), hero('other')], hiredSwords: [], henchmenGroups: [{ ...group('s1', 3), unitTemplateId }, { ...group('s2', 2), unitTemplateId }] }
  let sheet = setGroupOut(emptyBattleLiveState(), 's1', 3, 3)
  sheet = setGroupOut(sheet, 's2', 1, 2)
  expect(sheetTotals(sheet, r)).toMatchObject({ startingModels: 7, ownOutOfAction: 4, routModels: 3, routCasualties: 0, routAt: 1 })
  expect(routStatus(sheet, startingModels(r), r)).toBe('none')
  sheet = setGroupOut(sheet, 's2', 2, 2)
  expect(sheetTotals(sheet, r).routCasualties).toBe(1)
  expect(routStatus(sheet, startingModels(r), r)).toBe('test')
  sheet = setGroupOut(sheet, 's2', 0, 2)
  expect(routStatus(sheet, startingModels(r), r)).toBe('none')
})


it('uses half-model starting and casualty counts only for web Night Goblin Squigs', () => {
  const r: RosterWarband = { ...roster, heroes: Array.from({ length: 5 }, (_, i) => hero(`g${i}`)), hiredSwords: [], henchmenGroups: [{ ...group('squigs', 2), unitTemplateId: 'night_goblins_web_cave_squigs' }] }
  let sheet = setGroupOut(emptyBattleLiveState(), 'squigs', 1, 2)
  expect(sheetTotals(sheet, r)).toMatchObject({ startingModels: 7, routModels: 6, routCasualties: 0.5, routAt: 1.5 })
  expect(routStatus(sheet, 7, r)).toBe('none')
  sheet = toggleHeroOut(sheet, 'g0')
  expect(routStatus(sheet, 7, r)).toBe('test')
  const otherList = { ...r, henchmenGroups: [{ ...r.henchmenGroups[0], unitTemplateId: 'night_goblins_cave_squigs' }] }
  expect(sheetTotals(sheet, otherList)).toMatchObject({ routModels: 7, routCasualties: 2, routAt: 2 })
})

it('paid Bribery reduces only the Rout count, never actual casualties or injury tallies', () => {
  const s = setGroupOut(emptyBattleLiveState(), 'watch', 2, 3);
  expect(routStatus(s, 6, roster)).toBe('test');
  expect(routStatus(s, 6, roster, 1)).toBe('none');
  expect(sheetTotals(s, roster, 1)).toMatchObject({ ownOutOfAction: 2, routCasualties: 1, startingModels: 6 });
  expect(groupOut(s, 'watch')).toBe(2);
  expect(sheetTotals(s, roster, 9).routCasualties).toBe(0);
});
