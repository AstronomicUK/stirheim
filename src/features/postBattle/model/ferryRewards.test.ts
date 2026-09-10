import { describe, expect, it } from 'vitest'
import { ferryRewards } from './ferryRewards'
describe('Hornsby contracts', () => {
  it('pays each attacker its victory contract and the independent roughing bonus', () => {
    const state = { side: 'attacker' as const, roughedUp: true, paymentDice: [1, 2, 3], bonusDice: [4, 5] }
    expect(ferryRewards(state, true)).toMatchObject({ gold: 15, problems: [] })
    expect(ferryRewards(state, false)).toMatchObject({ gold: 9, problems: [] })
    expect(ferryRewards({ ...state, roughedUp: false }, false).gold).toBe(0)
  })
  it('withholds defence pay for harmed Hornsbys and deducts the actual patrol dice', () => {
    const state = { side: 'defender' as const, roughedUp: false, patrol: true, shared: false, paymentDice: [1, 2, 3, 4, 5], feeDice: [5, 6] }
    expect(ferryRewards(state, true)).toMatchObject({ gold: 4, problems: [] })
    expect(ferryRewards({ ...state, roughedUp: true }, true).gold).toBe(0)
    expect(ferryRewards(state, false).gold).toBe(0)
    expect(ferryRewards({ ...state, feeDice: [1] }, true).problems).toHaveLength(1)
  })
  it('records only the agreed own share, requiring names and an amount within the pool', () => {
    const state = { side: 'defenders-ally' as const, roughedUp: false, patrol: false, shared: true, paymentDice: [2, 2, 2, 2, 2], ownShare: 3, allocation: 'Defenders keep 7 gc; our warband receives 3 gc.' }
    expect(ferryRewards(state, true)).toMatchObject({ gold: 3, problems: [] })
    expect(ferryRewards({ ...state, ownShare: 11 }, true).problems).toHaveLength(1)
    expect(ferryRewards({ ...state, allocation: '' }, true).problems).toHaveLength(1)
    expect(ferryRewards({ ...state, shared: false }, true).problems).toHaveLength(1)
  })
})
