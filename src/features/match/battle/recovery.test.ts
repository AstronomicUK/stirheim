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

it('keeps the particular held Hero down through recovery and releases only for a later recovery',()=>{
 const source=event('Knocked down',t(0),{slaaneshi_lock:{weaponId:'slaaneshi_man_catcher',modelIndex:0}})
 const hold={id:A,match_id:A,source_event_id:A,wielder_warband_id:A,wielder_id:'a',target_warband_id:B,target_id:'b',target_kind:'hero' as const,target_model_index:0,target_name:'B',created_at:t(0),released_at:null,release_reason:null,confirmed_end_at:null}
 const recoveries=[{warbandId:B,at:t(1)}]
 expect(conditionsFor([source],B,4,recoveries,[hold]).get('b')).toBe('Knocked down')
 const released={...hold,released_at:t(2),release_reason:'magicEscape'}
 expect(conditionsFor([source],B,4,recoveries,[released]).get('b')).toBe('Knocked down')
 expect(conditionsFor([source],B,4,[...recoveries,{warbandId:B,at:t(3)}],[released]).has('b')).toBe(false)
})
it.each([false,true])('a held henchman never knocks the whole group down (wounds already recorded: %s)',(metadata_only)=>{
 const source=event('Knocked down',t(0),{metadata_only,target_kind:'group',target_size:3,slaaneshi_lock:{weaponId:'slaaneshi_man_catcher',modelIndex:1}})
 const hold={id:A,match_id:A,source_event_id:A,wielder_warband_id:A,wielder_id:'a',target_warband_id:B,target_id:'b',target_kind:'group' as const,target_model_index:1,target_name:'B',created_at:t(0),released_at:null,release_reason:null,confirmed_end_at:null}
 const conditions=conditionsFor([source],B,4,[{warbandId:B,at:t(1)}],[hold])
 expect(conditions.has('b')).toBe(false);expect(conditions.get('b:1')).toBe('Knocked down');expect(conditions.has('b:0')).toBe(false)
 const released={...hold,released_at:t(2)}
 expect(conditionsFor([source],B,4,[{warbandId:B,at:t(1)}],[released]).get('b:1')).toBe('Knocked down')
 expect(conditionsFor([source],B,4,[{warbandId:B,at:t(1)},{warbandId:B,at:t(3)}],[released]).has('b:1')).toBe(false)
})
