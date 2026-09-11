import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../battle'
import { recordBlackpowderShot, correctBlackpowderShot } from '../blackpowderShot'
import { confirmGrapeShotSpread, grapeShotTargets, startGrapeShotSpread, unresolvedGrapeShotTargets, type GrapeShotCandidate } from '../grapeShot'
import { battleEventRowSchema } from '../battleEvent'

const target = { key: 'enemy:group:0', warriorId: 'group', warbandId: 'aaaaaaaa-0000-4000-8000-000000000002', name: 'Primary' }
const candidate = (key: string, distance: number, extra: Partial<GrapeShotCandidate> = {}): GrapeShotCandidate => ({ ...target, key, name: key, distance, enemy: true, inLineOfSight: true, inCover: false, ...extra })
const input = { shotId: 'shot', warriorId: 'firer', warbandId: 'aaaaaaaa-0000-4000-8000-000000000001', shooterName: 'Pirate', at: '2026-09-11T18:15:00Z', primary: target, primaryInCover: false, original: 2 }
function fired() {
  return recordBlackpowderShot(emptyBattleLiveState(), { id: 'shot', warriorId: 'firer', weaponKey: 'swivel:0', weaponName: 'Grape Shot', ownTurn: 1, reloadTurns: 1, at: input.at, experimental: false }, 'Pirate')
}
it('selects nearest other enemies, including another member of the target group, and respects cover and line of sight', () => {
  const candidates = [candidate('far', 4), candidate('covered', 1, { inCover: true }), candidate('friend', 0.5, { enemy: false }), candidate('blocked', 1, { inLineOfSight: false }), candidate(target.key, 0), candidate('enemy:group:1', 2), candidate('outside', 4.01)]
  expect(grapeShotTargets(target, false, 6, candidates).map(t => t.key)).toEqual(['enemy:group:1', 'far'])
  expect(grapeShotTargets(target, true, 2, candidates).map(t => t.key)).toEqual(['covered', 'enemy:group:1'])
})
it('keeps player order for equally close models and rejects invalid positions or duplicate identities', () => {
  expect(grapeShotTargets(target, false, 1, [candidate('b', 1), candidate('a', 1)])[0].key).toBe('b')
  expect(() => grapeShotTargets(target, false, 2, [candidate('a', NaN)])).toThrow(/distance/)
  expect(() => grapeShotTargets(target, false, 2, [candidate('a', 1), candidate('a', 2)])).toThrow(/distinct/)
  expect(() => grapeShotTargets(target, false, 7, [])).toThrow(/D6/)
})
it('retains the original app die through reload and freezes confirmed victims without firing again', () => {
  let sheet = startGrapeShotSpread(fired(), input)
  sheet = parseBattleLiveState(JSON.parse(JSON.stringify(sheet)))
  const candidates = [candidate('a', 1), candidate('b', 2), candidate('c', 3)]
  sheet = confirmGrapeShotSpread(sheet, 'shot', 3, candidates)
  candidates[0].name = 'Changed later'
  expect(sheet.grapeShotSpreads[0].targets?.[0].name).toBe('a')
  expect(sheet.grapeShotSpreads[0].targets).toHaveLength(3)
  expect(sheet.blackpowderShots).toHaveLength(1)
  expect(sheet.tallies).toHaveLength(0)
  expect(sheet.rollAttempts.find(r => r.id === 'grape-spread:shot')?.rolls.join(' ')).toContain('App rolled 2; player changed it to 3')
  expect(confirmGrapeShotSpread(sheet, 'shot', 1, [])).toBe(sheet)
})
it('does not allow a missing, misfired or corrected shot to produce additional hits', () => {
  expect(() => startGrapeShotSpread(emptyBattleLiveState(), input)).toThrow(/active/)
  const sheet = fired()
  expect(() => startGrapeShotSpread({ ...sheet, blackpowderShots: sheet.blackpowderShots.map(s => ({ ...s, misfireDie: 2 })) }, input)).toThrow(/active/)
  const pending = startGrapeShotSpread(sheet, input)
  expect(() => confirmGrapeShotSpread(correctBlackpowderShot(pending, 'shot', 'Restarted'), 'shot', 3, [])).toThrow(/corrected/)
})
it('completes only the exact numbered model and reopens a reverted result', () => {
  const sheet = confirmGrapeShotSpread(startGrapeShotSpread(fired(), input), 'shot', 2, [candidate('a', 1), candidate('b', 2)])
  const spread = sheet.grapeShotSpreads[0]
  const uuid = 'aaaaaaaa-0000-4000-8000-000000000001'
  const event = battleEventRowSchema.parse({ id: uuid, match_id: uuid, actor_id: uuid, actor_warband_id: uuid, at: input.at, kind: 'attack', summary: '', reverted_at: null, reverted_by: null, revert_note: null, payload: { attacker_id: 'firer', attacker_warband_id: input.warbandId, attacker_kind: 'hero', attacker_name: 'Pirate', target_id: 'group', target_warband_id: target.warbandId, target_kind: 'group', target_name: 'Enemy', grapeShotId: 'shot', grapeTargetKey: 'a' } })
  expect(unresolvedGrapeShotTargets(spread, [event]).map(t => t.key)).toEqual(['b'])
  expect(unresolvedGrapeShotTargets(spread, [{ ...event, reverted_at: input.at }])).toHaveLength(2)
  expect(unresolvedGrapeShotTargets(spread, [{ ...event, payload: { ...event.payload, target_id: 'wrong' } }])).toHaveLength(2)
})
