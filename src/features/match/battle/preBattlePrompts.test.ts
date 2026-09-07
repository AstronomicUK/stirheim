import { describe, expect, it } from 'vitest'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'
import { prompts } from './preBattlePrompts'

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function hero(id: string, extra: Partial<RosterHero> = {}): RosterHero {
  return {
    id,
    name: id,
    unitTemplateId: 'x',
    stats,
    xp: 0,
    levelUps: 0,
    skillTableIds: [],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [],
    status: 'active',
    ...extra,
  }
}

function roster(heroes: RosterHero[]): RosterWarband {
  return { id: 'w', name: 'Test', warbandTemplateId: 'reikland', gold: 0, wyrdstone: 0, veteranPool: null, heroes, hiredSwords: [], henchmenGroups: [], stash: [] }
}

describe('pre-battle prompts', () => {
  it('asks an Old Battle Wound holder to roll a flat D6, and nobody else', () => {
    const list = prompts(roster([hero('scarred', { flags: { oldBattleWound: true } }), hero('fine')]), undefined)
    const wound = list.find((p) => p.key === 'oldWound:scarred')
    expect(wound).toMatchObject({ test: 'D6', target: null })
    expect(wound?.text).toMatch(/on a 1 the wound flares up/)
    expect(list.some((p) => p.key.startsWith('oldWound:fine'))).toBe(false)
  })

  it('skips a warrior who is not active', () => {
    const list = prompts(roster([hero('down', { flags: { oldBattleWound: true }, status: 'dead' })]), undefined)
    expect(list.some((p) => p.key.startsWith('oldWound:'))).toBe(false)
  })

  it('asks both an Old Battle Wound and a Nurgle\'s Rot roll for the same warrior', () => {
    const list = prompts(roster([hero('unlucky', { flags: { oldBattleWound: true, nurglesRot: true } })]), undefined)
    expect(list.map((p) => p.key)).toEqual(['oldWound:unlucky', 'rot:unlucky'])
  })
})
