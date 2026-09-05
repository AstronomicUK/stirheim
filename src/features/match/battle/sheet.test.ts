import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState } from '../../../domain'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import {
  addEnemyOut,
  setWoundsLost,
  woundsLost,
  addLoot,
  applyEdit,
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
  return { id, hiredSwordId: 'ogre_bodyguard', name: id, stats, xp: 0, levelUps: 0, skillIds: [], injuries: [], flags: {}, equipment: [], status: 'active', ...extra }
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

  it('an old battle wound does not bench a warrior (the dice decide at the table)', () => {
    expect(notFightingReason(hero('x', { flags: { oldBattleWound: true } }))).toBeNull()
    expect(notFightingReason(hero('x', { status: 'captured' }))).toBe('Captured')
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
    expect(sheetTotals(s, roster)).toEqual({ enemiesOutOfAction: 2, ownOutOfAction: 1, startingModels: 6, wyrdstoneFound: 1, routAt: 2 })
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
