import { describe, expect, it } from 'vitest'
import { conditionsFor } from './sheet'
import { battleEventRowSchema } from '../../../domain/battleEvent'
const A = 'aaaaaaaa-0000-4000-8000-000000000001'
const B = 'aaaaaaaa-0000-4000-8000-000000000002'
function event(outcome: string, at: string, extra = {}) {
  return battleEventRowSchema.parse({ id: A, match_id: A, actor_id: A, actor_warband_id: A, at, kind: 'attack', summary: '', reverted_at: null, reverted_by: null, revert_note: null,
    payload: { attacker_warband_id: A, attacker_id: 'a', attacker_kind: 'hero', attacker_name: 'A', target_warband_id: B, target_id: 'b', target_kind: 'hero', target_name: 'B', outcome, turn: 1, ...extra } })
}
const t = (n: number) => `2026-09-09T12:0${n}:00.000Z`
describe('recovery timeline', () => {
  it('keeps a stunned warrior down across round changes until two separate recoveries', () => {
    const events = [event('Stunned', t(0))]
    expect(conditionsFor(events, B, 4, []).get('b')).toBe('Stunned')
    expect(conditionsFor(events, B, 4, [{ warbandId: B, at: t(1) }]).get('b')).toBe('Knocked down')
    expect(conditionsFor(events, B, 4, [{ warbandId: B, at: t(1) }, { warbandId: B, at: t(2) }]).has('b')).toBe(false)
  })
  it('only recovers the active warband, and never clears a later injury', () => {
    const events = [event('Knocked down', t(0)), event('Stunned', t(2))]
    expect(conditionsFor(events, B, 2, [{ warbandId: B, at: t(1) }]).get('b')).toBe('Stunned')
    expect(conditionsFor([events[0]], B, 2, [{ warbandId: A, at: t(1) }]).get('b')).toBe('Knocked down')
  })
  it('misses do not clear conditions; out-of-action models never recover', () => {
    const events = [event('Stunned', t(0)), event('Missed', t(1))]
    expect(conditionsFor(events, B, 1, []).get('b')).toBe('Stunned')
    events.push(event('Out of action', t(2), { out_of_action: true }))
    expect(conditionsFor(events, B, 2, [{ warbandId: B, at: t(3) }]).size).toBe(0)
  })
  it('ignores reverted injuries and preserves legacy turn filtering without tracking', () => {
    const e = event('Stunned', t(0)); e.reverted_at = t(1)
    expect(conditionsFor([e], B, 1, []).size).toBe(0)
    expect(conditionsFor([event('Stunned', t(0))], B, 2).size).toBe(0)
  })
})
