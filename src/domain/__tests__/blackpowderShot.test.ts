import { expect, it } from 'vitest'
import { blackpowderMisfire } from '../../rules/resolve/blackpowderMisfire'
import { emptyBattleLiveState, parseBattleLiveState } from '../battle'
import { recordBlackpowderShot, recordMisfireDie, blackpowderBlock, correctBlackpowderShot } from '../blackpowderShot'
const shot = { id: 'shot', warriorId: 'gunner', weaponKey: 'gunner:swivel:0', weaponName: 'Swivel Gun', ownTurn: 1, reloadTurns: 1, experimental: false, at: '2026-09-11T17:15:00Z' }
it('matches every printed misfire outcome, including no-critical self-hit and strengthened successful shot', () => {
  expect(blackpowderMisfire(1)).toMatchObject({ weaponDestroyed: true, fires: false, selfHit: { strength: 4, criticals: false } })
  expect(blackpowderMisfire(2).jammedForBattle).toBe(true)
  expect(blackpowderMisfire(3).extraReloadTurns).toBe(1)
  for (const die of [4, 5]) expect(blackpowderMisfire(die)).toMatchObject({ name: 'Click', fires: false, extraReloadTurns: 0 })
  expect(blackpowderMisfire(6)).toMatchObject({ fires: true, strengthBonus: 1, selfHit: null })
  expect(() => blackpowderMisfire(0)).toThrow(/D6/)
})
it('shares reload between ammunition profiles through the physical weapon key and permits other guns', () => {
  const sheet = recordBlackpowderShot(emptyBattleLiveState(), shot, 'Gunner')
  expect(blackpowderBlock(sheet, 'gunner', shot.weaponKey, 2)).toContain('turn 3')
  expect(blackpowderBlock(sheet, 'gunner', shot.weaponKey, 3)).toBeNull()
  expect(blackpowderBlock(sheet, 'gunner', 'second-gun', 1)).toBeNull()
  expect(() => recordBlackpowderShot(sheet, { ...shot, id: 'chain-shot', weaponName: 'Chain Shot' }, 'Gunner')).toThrow(/turn 3/)
  expect(recordBlackpowderShot(sheet, shot, 'Gunner')).toBe(sheet)
})
it('preserves pending app dice across reload, records an edit and applies an extra Phut turn', () => {
  let sheet = recordMisfireDie(recordBlackpowderShot(emptyBattleLiveState(), shot, 'Gunner'), 'shot', 2, 2, false)
  sheet = parseBattleLiveState(JSON.parse(JSON.stringify(sheet)))
  expect(blackpowderBlock(sheet, 'gunner', shot.weaponKey, 9)).toContain('pending')
  sheet = recordMisfireDie(sheet, 'shot', 3)
  expect(sheet.rollAttempts.find(r => r.id === 'misfire:shot')?.rolls.join(' ')).toContain('App rolled 2; player changed it to 3')
  expect(blackpowderBlock(sheet, 'gunner', shot.weaponKey, 3)).toContain('turn 4')
  expect(blackpowderBlock(sheet, 'gunner', shot.weaponKey, 4)).toBeNull()
})
it('preserves destroyed/jammed weapons for the battle and needs a reason to correct their usage record', () => {
  for (const die of [1, 2]) {
    const sheet = recordMisfireDie(recordBlackpowderShot(emptyBattleLiveState(), shot, 'Gunner'), 'shot', die)
    expect(blackpowderBlock(sheet, 'gunner', shot.weaponKey, 99)).not.toBeNull()
    expect(correctBlackpowderShot(sheet, 'shot', '')).toBe(sheet)
    expect(blackpowderBlock(correctBlackpowderShot(sheet, 'shot', 'Agreed correction'), 'gunner', shot.weaponKey, 1)).toBeNull()
  }
})
it('forces Experimental weapons to reload on non-BOOM outcomes even with no normal reload delay', () => {
  const sheet = recordMisfireDie(recordBlackpowderShot(emptyBattleLiveState(), { ...shot, experimental: true, reloadTurns: 0 }, 'Gunner'), 'shot', 6)
  expect(blackpowderBlock(sheet, 'gunner', shot.weaponKey, 2)).toContain('turn 3')
  expect(blackpowderBlock(sheet, 'gunner', shot.weaponKey, 3)).toBeNull()
})
