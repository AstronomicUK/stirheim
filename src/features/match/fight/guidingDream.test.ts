import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState, setGuidingDreamTarget } from '../../../domain'
import { defaultCampaignHouseRules } from '../../../rules/types/roster'
import { withGuidingDream, loadoutFor, type Combatant } from './combatants'
import { combatContextFor, computeOdds } from './odds'

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 2, Ld: 8 }
const dreamer: Combatant = { id: 'dreamer', kind: 'hero', name: 'Dreamer', typeName: 'Dreamer', warbandId: 'morr', warbandName: 'Morr', stats, equipment: [{ itemId: 'sword', quantity: 1 }, { itemId: 'pistol', quantity: 1 }], traitIds: [], skillIds: [], out: false, woundsLost: 0 }
const target: Combatant = { ...dreamer, id: 'target', name: 'Target', warbandId: 'enemy', equipment: [] }
function sheet(result: string) {
  const s = { ...emptyBattleLiveState(), preBattle: { 'guiding_dream:dreamer': `${result}: recorded vision` } }
  return result === 'Disturbing Vision' ? s : setGuidingDreamTarget(s, 'dreamer', 'Dreamer', { id: target.id, warbandId: target.warbandId, name: target.name })
}
function odds(c: Combatant, weaponId = 'sword', extra = {}, defender = target) {
  const kit = loadoutFor(c)
  const primary = [...kit.melee, ...kit.ranged].find(w => w.id === weaponId)!
  return computeOdds({ attacker: c, attackerKit: kit, defender, defenderKit: loadoutFor(defender), primary, offHand: null, context: combatContextFor(defaultCampaignHouseRules(), extra), houseRules: defaultCampaignHouseRules() })
}
describe('Guiding Dream combat effects', () => {
  it('adds to hit only against the designated Hero, retaining base stats and weapon definitions', () => {
    const s = sheet('Vision of Truth')
    const changed = withGuidingDream(dreamer, target, s)
    expect(odds(changed).weapons[0].input.hitThreshold).toBe(3)
    expect(odds(dreamer).weapons[0].input.hitThreshold).toBe(4)
    expect(odds(changed, 'sword', { failedFearWhenCharged: true }, { ...target, traitIds: ['causes_fear'] }).weapons[0].input.hitThreshold).toBe(6)
    expect(withGuidingDream(dreamer, { ...target, id: 'other' }, s)).toBe(dreamer)
    expect(withGuidingDream(dreamer, { ...target, warbandId: 'wrong' }, s)).toBe(dreamer)
    expect(withGuidingDream(dreamer, { ...target, kind: 'henchman' }, s)).toBe(dreamer)
    expect(withGuidingDream({ ...dreamer, id: 'other' }, target, s).guidingDream).toBeUndefined()
  })
  it('adds characteristic Strength without increasing fixed-Strength pistol shots', () => {
    const changed = withGuidingDream(dreamer, target, sheet('Empowering Vision'))
    expect(odds(changed).weapons[0].strength).toBe(4)
    expect(odds(changed, 'pistol').weapons[0].strength).toBe(4)
    expect(dreamer.stats.S).toBe(3)
  })
  it('grants target-specific Frenzy, which can end, and battle-only Movement loss', () => {
    const changed = withGuidingDream(dreamer, target, sheet('Infuriating Vision'))
    expect(odds(changed).attacks).toBe(4)
    expect(odds(changed, 'sword', { frenzyEnded: true }).attacks).toBe(2)
    expect(withGuidingDream(dreamer, { ...target, id: 'other' }, sheet('Infuriating Vision')).traitIds).not.toContain('frenzy')
    expect(withGuidingDream(dreamer, undefined, sheet('Disturbing Vision')).stats.M).toBe(3)
    expect(dreamer.stats.M).toBe(4)
  })
  it('persists target choice and records an explained change', () => {
    const s = parseBattleLiveState(JSON.parse(JSON.stringify(sheet('Vision of Truth'))))
    expect(s.guidingDreamTargets.dreamer.id).toBe('target')
    const next = { id: 'other', warbandId: 'enemy', name: 'Other Hero' }
    expect(() => setGuidingDreamTarget(s, 'dreamer', 'Dreamer', next)).toThrow(/Explain/)
    const corrected = setGuidingDreamTarget(s, 'dreamer', 'Dreamer', next, 'Selected the wrong Hero')
    expect(corrected.rollAttempts[1].rolls.join(' ')).toContain('Selected the wrong Hero')
    expect(() => setGuidingDreamTarget(sheet('Disturbing Vision'), 'dreamer', 'Dreamer', next)).toThrow(/does not require/)
  })
})
