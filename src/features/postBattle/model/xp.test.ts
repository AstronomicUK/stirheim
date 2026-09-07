// #60 A2: Dramatis Personae never earn Experience, unlike ordinary hired swords who earn as heroes.

import { describe, expect, it } from 'vitest'
import type { RosterHiredSword } from '../../../rules/types/roster'
import { warriorXpLine, type XpContext } from './xp'

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }
const hiredSword = (id: string, hiredSwordId: string): RosterHiredSword => ({
  id, hiredSwordId, name: id, stats, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active',
})
const ctx: XpContext = { won: false, leaderId: null, underdogBonus: 0, enemiesOut: {}, extras: {} }

describe('warriorXpLine and Dramatis Personae', () => {
  it('an ordinary hired sword still earns Experience for surviving (docs/PLANNING.md, confirmed as-is)', () => {
    const before = hiredSword('hs', 'ogre_bodyguard')
    const line = warriorXpLine('hiredSword', before, before, true, ctx)
    expect(line).not.toBeNull()
    expect(line!.reasons.some((r) => r.includes('survived the battle'))).toBe(true)
  })

  it('a Dramatis Persona earns none, even though he survived and fought well', () => {
    const before = hiredSword('p', 'johann_the_knife')
    const line = warriorXpLine('hiredSword', before, before, true, { ...ctx, won: true, leaderId: 'p', enemiesOut: { p: 2 } })
    expect(line).toBeNull()
  })
})
