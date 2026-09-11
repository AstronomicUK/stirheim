import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../battle'
import { startLinePermission, finishLinePermission, declareLineShot, correctLineShot, lineShotBlock, unresolvedLineTargets, type LineShot } from '../lineShot'
import { battleEventRowSchema } from '../battleEvent'
const input = (weaponId: LineShot['weaponId'] = 'blunderbuss') => ({ id: 'shot', shooterSlot: 0, warriorId: 'shooter', weaponId, ownTurn: 1, targets: [{ key: 'enemy', warriorId: 'enemy', warbandId: 'aaaaaaaa-0000-4000-8000-000000000005', name: 'Enemy' }, { key: 'friend', warriorId: 'friend', warbandId: 'aaaaaaaa-0000-4000-8000-000000000004', name: 'Friend' }] })
describe('declared Blunderbuss lines', () => {
  it('freezes friends and enemies, persists one shot, and does not allow another normal shot', () => {
    const declaration = input()
    const sheet = declareLineShot(emptyBattleLiveState(), declaration, 'Shooter')
    declaration.targets[0].name = 'Changed outside the sheet'
    const restored = parseBattleLiveState(JSON.parse(JSON.stringify(sheet)))
    expect(restored.lineShots[0].targets[0].name).toBe('Enemy')
    expect(unresolvedLineTargets(restored.lineShots[0], [])).toHaveLength(2)
    expect(lineShotBlock(restored, 'shooter', 'blunderbuss', 20)).toContain('already fired')
    expect(lineShotBlock(restored, 'shooter', 'blunderbuss', 1, 1)).toBeNull() // Different model in the same group
    expect(declareLineShot(restored, input(), 'Shooter')).toBe(restored)
    expect(() => declareLineShot(restored, { ...input(), id: 'again' }, 'Shooter')).toThrow(/already fired/)
  })
  it('gives a Chaos Dwarf weapon a complete own turn to reload', () => {
    const sheet = declareLineShot(emptyBattleLiveState(), input('chaos_dwarf_blunderbuss'), 'Shooter')
    expect(lineShotBlock(sheet, 'shooter', 'chaos_dwarf_blunderbuss', 1)).not.toBeNull()
    expect(lineShotBlock(sheet, 'shooter', 'chaos_dwarf_blunderbuss', 2)).not.toBeNull()
    expect(lineShotBlock(sheet, 'shooter', 'chaos_dwarf_blunderbuss', 3)).toBeNull()
    expect(lineShotBlock(sheet, 'other', 'chaos_dwarf_blunderbuss', 1)).toBeNull()
  })
  it('reopening one reverted target does not create another shot or reopen other targets', () => {
    const shot = declareLineShot(emptyBattleLiveState(), input(), 'Shooter').lineShots[0]
    const event = battleEventRowSchema.parse({ id: 'aaaaaaaa-0000-4000-8000-000000000001', match_id: 'aaaaaaaa-0000-4000-8000-000000000002', actor_id: 'aaaaaaaa-0000-4000-8000-000000000003', actor_warband_id: null, at: '2026-09-11T15:00:00Z', kind: 'attack', summary: '', reverted_at: null, reverted_by: null, revert_note: null, payload: { attacker_warband_id: 'aaaaaaaa-0000-4000-8000-000000000004', attacker_id: 'shooter', attacker_kind: 'hero', attacker_name: 'Shooter', target_warband_id: 'aaaaaaaa-0000-4000-8000-000000000005', target_id: 'enemy', target_kind: 'hero', target_name: 'Enemy', lineShotId: shot.id, lineShotTargetKey: 'enemy' } })
    expect(unresolvedLineTargets(shot, [{ ...event, payload: { ...event.payload, target_id: 'wrong-target' } }])).toHaveLength(2)
    expect(unresolvedLineTargets(shot, [event]).map(t => t.key)).toEqual(['friend'])
    expect(unresolvedLineTargets(shot, [{ ...event, reverted_at: event.at }])).toHaveLength(2)
  })
  it('requires a reason to restore usage and rejects an empty or duplicate target list', () => {
    const sheet = declareLineShot(emptyBattleLiveState(), input(), 'Shooter')
    expect(correctLineShot(sheet, 'shot', '')).toBe(sheet)
    const fixed = correctLineShot(sheet, 'shot', 'Accidental declaration')
    expect(lineShotBlock(fixed, 'shooter', 'blunderbuss', 1)).toBeNull()
    expect(fixed.rollAttempts[1].rolls.join(' ')).toContain('Accidental declaration')
    expect(() => declareLineShot(emptyBattleLiveState(), { ...input(), targets: [] }, 'S')).toThrow(/Choose/)
    expect(() => declareLineShot(emptyBattleLiveState(), { ...input(), targets: [input().targets[0], input().targets[0]] }, 'S')).toThrow(/distinct/)
  })
})


describe('one Blessing test for the whole firing line', () => {
  const attempt = () => ({ ...input(), original: 2, reason: '', at: '2026-09-11T16:20:00Z' })
  it('persists the app die and frozen targets, then logs a player correction and creates exactly one line', () => {
    const test = attempt()
    let sheet = startLinePermission(emptyBattleLiveState(), test, 'Shooter')
    test.targets[0].name = 'Changed'
    sheet = parseBattleLiveState(JSON.parse(JSON.stringify(sheet)))
    expect(sheet.linePermissionTests[0].original).toBe(2)
    expect(sheet.linePermissionTests[0].targets[0].name).toBe('Enemy')
    expect(sheet.rollAttempts[0].status).toBe('incomplete')
    sheet = finishLinePermission(sheet, test.id, 5, 'Shooter')
    expect(sheet.lineShots).toHaveLength(1)
    expect(sheet.lineShots[0].targets).toHaveLength(2)
    expect(sheet.rollAttempts[0].rolls.join(' ')).toContain('App rolled 2; player changed it to 5')
    expect(finishLinePermission(sheet, test.id, 6, 'Shooter')).toBe(sheet)
  })
  it('a failed attempt spends no shot or reload but requires an explanation for a same-turn retry', () => {
    let sheet = startLinePermission(emptyBattleLiveState(), attempt(), 'Shooter')
    sheet = finishLinePermission(sheet, 'shot', 2, 'Shooter')
    expect(sheet.lineShots).toHaveLength(0)
    expect(lineShotBlock(sheet, 'shooter', 'blunderbuss', 2)).toBeNull()
    expect(() => startLinePermission(sheet, { ...attempt(), id: 'retry' }, 'Shooter')).toThrow(/Explain/)
    expect(startLinePermission(sheet, { ...attempt(), id: 'retry', reason: 'Agreed exception' }, 'Shooter').linePermissionTests).toHaveLength(2)
    expect(startLinePermission(sheet, { ...attempt(), id: 'next-turn', ownTurn: 2 }, 'Shooter').linePermissionTests).toHaveLength(2)
    expect(startLinePermission(sheet, { ...attempt(), id: 'other-model', shooterSlot: 1 }, 'Shooter').linePermissionTests).toHaveLength(2)
  })
  it('does not discard an incomplete app test when reloaded, and distinguishes tabletop dice', () => {
    let sheet = startLinePermission(emptyBattleLiveState(), attempt(), 'Shooter')
    expect(() => startLinePermission(sheet, { ...attempt(), id: 'discard' }, 'Shooter')).toThrow(/Explain/)
    sheet = startLinePermission(sheet, { ...attempt(), id: 'table', ownTurn: 2, original: undefined }, 'Shooter')
    sheet = finishLinePermission(sheet, 'table', 4, 'Shooter')
    expect(sheet.rollAttempts.find(r => r.id === 'table')?.rolls.join(' ')).toContain('Tabletop D6 entered: 4')
  })
})
