import { describe, it, expect } from 'vitest'
import { caravanRewards } from './caravanRewards'
import { scenarioRewards } from './scenarioRewards'
import { emptyDraft } from './state'
const participants = { heroes: [], hiredSwords: [], groups: [], satOut: [], leaderId: null }
describe('Caravan versions', () => {
  it('pays the escort base plus each escaped wagon and the all-three bonus independently', () => {
    const r = caravanRewards({ role: 'defender', escaped: 3, looted: 0 }, false, 'won')
    expect(r.problems).toEqual([])
    const finds = Object.fromEntries(['base', 'escaped-0', 'escaped-1', 'escaped-2', 'all'].map(id => [id, { discovery: null, dice: [1, 2, 3, 4, 5] }]))
    const reward = scenarioRewards({ ...emptyDraft(), result: 'won', scenarioRewards: { caravan: { role: 'defender', escaped: 3, looted: 0 }, finds } }, 'the_caravan', participants)
    expect(reward.gold).toBe(75); expect(reward.problems).toEqual([])
  })
  it('uses escaped wagons rather than rout outcome, with an explicit exception available', () => {
    expect(caravanRewards({ role: 'defender', escaped: 2, looted: 0 }, false, 'lost').problems).not.toEqual([])
    expect(caravanRewards({ role: 'defender', escaped: 2, looted: 0, overrideReason: 'Agreed alternate victory objective' }, false, 'lost').problems).toEqual([])
    expect(caravanRewards({ role: 'attacker', escaped: 2, looted: 2 }, false, 'lost').problems).not.toEqual([])
  })
  it('gives traitors only loot and records the duration and permanent escort restriction', () => {
    const r = caravanRewards({ role: 'traitor', escaped: 1, looted: 2, penaltyDie: 4 }, false, 'won')
    expect(r.effects).toEqual({ caravanTreachery: 4 })
    expect(r.rule?.kind === 'hoard' && r.rule.finds.map(f => f.id)).toEqual(['loot-0', 'loot-1'])
    const history = { caravanBannedCampaigns: ['c'], rarePenalty: -1, rareGamesRemaining: 4, notes: [] }
    expect(caravanRewards({ role: 'defender', escaped: 3, looted: 0 }, false, 'won', 'c', history).problems).not.toEqual([])
    expect(caravanRewards({ role: 'defender', escaped: 3, looted: 0 }, false, 'won', 'other', history).problems).toEqual([])
  })
  it('does not duplicate merchant cargo or enable an optional trading variant by default', () => {
    const state = { role: 'defender' as const, cargoDie: 2, heldShards: 0, merchantKept: true, friendVariant: false }
    expect(caravanRewards(state, true, 'won').effects).toEqual({})
    expect(caravanRewards({ ...state, heldShards: 3 }, true, 'won').problems).not.toEqual([])
    expect(caravanRewards({ ...state, friendVariant: true }, true, 'won').problems).not.toEqual([])
    expect(caravanRewards({ ...state, friendVariant: true, rounding: 'down' }, true, 'won').effects).toEqual({ caravanTrade: { percent: -20, rounding: 'down' } })
    expect(caravanRewards({ ...state, friendVariant: true, rounding: 'up' }, true, 'lost').effects).toEqual({ caravanTrade: { percent: 20, rounding: 'up' } })
    expect(caravanRewards({ ...state, friendVariant: true }, true, 'draw').effects).toEqual({})
  })
})
