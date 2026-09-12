import { describe, expect, it } from 'vitest'
import { defaultCombatContext, type Character } from '../types'
import { characterToDefenderProfile } from '../domain/opponentScenario'
import { blessedWaterAttack, blessedWaterWeapon } from './blessedWater'
import { resolveSingleAttack } from './resolveAttack'

const attacker: Character = {
  id: 'hero', name: 'Hero', warband: 'Test', role: 'hero',
  stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
  equippedWeapons: [], armour: { type: 'none', shield: false, buckler: false },
  helmet: false, skills: [], traits: [], wardSaveThreshold: null, notes: '',
}
function params(traits = ['undead']) {
  return { attacker, defender: characterToDefenderProfile({ ...attacker, traits, stats: { ...attacker.stats, T: 10 }, armour: { type: 'gromril', shield: true, buckler: false } }, []), context: defaultCombatContext() }
}
describe('Blessed Water core profile', () => {
  it.each(['undead', 'daemon', 'possessed'])('automatically wounds %s after hitting regardless of Toughness, without criticals', trait => {
    const result = resolveSingleAttack(blessedWaterAttack(params([trait])))
    expect(result.pHit).toBeCloseTo(0.5)
    expect(result.pWound).toBeCloseTo(0.5)
    expect(result.pWoundTriggerEligible).toBe(0)
    expect(result.normalEvents.every(event => event.wounds === 1)).toBe(true)
    expect(result.hitFaces?.filter(face => face.face > 0).every(face => face.wound === 1 && face.trigger === 0)).toBe(true)
  })
  it('ignores range and movement penalties but retains cover', () => {
    const p = params()
    const plain = blessedWaterAttack(p)
    const moved = blessedWaterAttack({ ...p, context: { ...p.context, movedThisTurn: true, longRange: true } })
    expect(moved.hitThreshold).toBe(plain.hitThreshold)
    expect(blessedWaterAttack({ ...p, context: { ...p.context, cover: true } }).hitThreshold).toBe(5)
  })
  it('has twice the current Strength in range', () => {
    expect(blessedWaterWeapon({ ...attacker, stats: { ...attacker.stats, S: 4 } }).rangedProfile?.maxRange).toBe(8)
  })
  it.each(['undead', 'possessed'])('rejects a %s thrower', trait => {
    expect(() => blessedWaterWeapon({ ...attacker, traits: [trait] })).toThrow('may not use')
  })
  it('does not wound an ordinary target, including on a six to hit', () => {
    expect(resolveSingleAttack(blessedWaterAttack(params([]))).pWound).toBe(0)
  })
  it('retains the target’s ward save', () => {
    const p = params()
    const result = resolveSingleAttack(blessedWaterAttack({ ...p, defender: { ...p.defender, wardSaveThreshold: 4 } }))
    expect(result.normalEvents.filter(event => event.wounds === 0).reduce((sum, event) => sum + event.probability, 0)).toBeCloseTo(0.5)
  })
})
