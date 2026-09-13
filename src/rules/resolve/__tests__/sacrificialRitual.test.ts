import { expect, it } from 'vitest'
import { planSacrificialRitual, type RitualCaptive } from '../sacrificialRitual'
const captives: RitualCaptive[] = [
  { id: 'a', engineId: 'engine', name: 'Captain', state: 'held', victimWarbandId: 'first', large: false },
  { id: 'b', engineId: 'engine', name: 'Ogre', state: 'held', victimWarbandId: 'second', large: true },
  { id: 'c', engineId: 'engine', name: 'Straggler', state: 'held', victimWarbandId: null, large: false },
]
const input = { engineId: 'engine', holderWarbandId: 'captor', casterName: 'Sorcerer', contactConfirmed: true, mortalCaptivesConfirmed: true, primaryId: 'a', extraIds: ['b', 'c'], captives }
it('requires each affected warband agreement and counts a Large captive once for difficulty', () => {
  const plan = planSacrificialRitual(input)
  expect(plan.requiredWarbandAgreements).toEqual(['captor', 'first', 'second'])
  expect(plan.difficultyReduction).toBe(2)
  expect(plan.primary.id).toBe('a')
  expect(plan.additional.map(c => c.id)).toEqual(['b', 'c'])
  expect(plan.summary).toContain('before rolling')
  expect(captives.every(c => c.state === 'held')).toBe(true)
})
it('rejects reused captives, a rescued captive and a captive from a different Engine', () => {
  expect(() => planSacrificialRitual({ ...input, extraIds: ['a'] })).toThrow(/only be selected once/)
  for (const patch of [{ state: 'freed' }, { state: 'dispatched' }, { engineId: 'other' }]) {
    expect(() => planSacrificialRitual({ ...input, captives: captives.map(c => c.id === 'b' ? { ...c, ...patch } : c) })).toThrow(/still held/)
  }
})
it('requires explicit contact and mortal eligibility, with no automatic sacrifice', () => {
  expect(() => planSacrificialRitual({ ...input, contactConfirmed: false })).toThrow(/in contact/)
  expect(() => planSacrificialRitual({ ...input, mortalCaptivesConfirmed: false })).toThrow(/eligible mortals/)
  const anonymous = planSacrificialRitual({ ...input, primaryId: 'c', extraIds: [] })
  expect(anonymous.requiredWarbandAgreements).toEqual(['captor'])
  expect(anonymous.difficultyReduction).toBe(0)
})
