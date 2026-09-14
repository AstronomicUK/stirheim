import { describe, expect, it } from 'vitest'
import { battleLiveStateSchema, emptyBattleLiveState } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'
import { canUseRoutSilk, resolveRoutDice, chooseSilkReroll, resolveSilkReroll, correctPendingRout } from './routSilk'
import { isConsumable } from '../../../rules/data/itemRules'

const REIKLAND = findWarbandTemplate('mercenaries_reikland')!
const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 }
const hero = (id: string, name: string, unit: string, ld: number): RosterHero => ({
  id, name, unitTemplateId: unit, stats: { ...stats, Ld: ld }, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active',
})
const roster: RosterWarband = {
  id: 'w', name: 'Watch', warbandTemplateId: REIKLAND.id, gold: 0, wyrdstone: 0, veteranPool: null,
  heroes: [hero('cap', 'Kurt', 'mercenaries_reikland_captain', 8), hero('ch1', 'Hans', 'mercenaries_reikland_champions', 7), hero('yb', 'Pip', 'mercenaries_reikland_youngbloods', 6)],
  henchmenGroups: [], hiredSwords: [], stash: [],
}

const dressed = {...roster,heroes:roster.heroes.map((h,i)=>i===0?{...h,equipment:[{itemId:'cathayan_silk_clothes',quantity:1}]}:h)}
const roll = {id:'rout-1',warriorId:'cap',label:'Kurt',leadership:8,dice:[6,5] as [number,number],source:'app' as const}
describe('Cathayan Silk Clothes first failed Rout test', () => {
  it('requires the Mercenary leader’s worn clothes, never stash or a different hero', () => {
    expect(canUseRoutSilk(dressed,REIKLAND,emptyBattleLiveState())).toBe(true)
    expect(canUseRoutSilk(roster,REIKLAND,emptyBattleLiveState())).toBe(false)
    expect(canUseRoutSilk({...roster,heroes:roster.heroes.map((h,i)=>i===1?{...h,equipment:[{itemId:'cathayan_silk_clothes',quantity:1}]}:h)},REIKLAND,emptyBattleLiveState())).toBe(false)
    expect(canUseRoutSilk(dressed,findWarbandTemplate('sisters_of_sigmar'),emptyBattleLiveState())).toBe(false)
  })
  it('keeps the failed result pending across refresh and records only one Leadership test', () => {
    const initial = resolveRoutDice(emptyBattleLiveState(),roll,true)
    expect(initial.routed).toBe(false)
    expect(initial.routTests[0].stage).toBe('choice')
    expect(resolveRoutDice(initial,roll,true)).toBe(initial)
    const saved = battleLiveStateSchema.parse(initial)
    expect(saved.leadershipTests).toHaveLength(1)
    const reroll = chooseSilkReroll(saved,roll.id,true)
    const passed = resolveSilkReroll(reroll,roll.id,[2,3],'table')
    expect(passed.routed).toBe(false)
    expect(passed.routTests[0]).toMatchObject({stage:'done',passed:true,dice:[6,5],rerollDice:[2,3],rerollSource:'table'})
    expect(passed.leadershipTests).toHaveLength(1)
    expect(passed.rollAttempts[0].rolls.join(' ')).toMatch(/App rolled 6 \+ 5.*player entered tabletop dice 2 \+ 3/)
    expect(resolveSilkReroll(passed,roll.id,[6,6],'app')).toBe(passed)
    expect(canUseRoutSilk(dressed,REIKLAND,passed)).toBe(false)
  })
  it('routes only after declining or failing the reroll, and never rerolls a reroll', () => {
    const pending = resolveRoutDice(emptyBattleLiveState(),roll,true)
    expect(chooseSilkReroll(pending,roll.id,false).routed).toBe(true)
    const failed = resolveSilkReroll(chooseSilkReroll(pending,roll.id,true),roll.id,[6,6],'app')
    expect(failed.routed).toBe(true)
    expect(chooseSilkReroll(failed,roll.id,true)).toBe(failed)
    expect(resolveRoutDice(emptyBattleLiveState(),roll,false).routed).toBe(true)
  })
  it('passing earlier tests does not spend the first failure benefit; legacy failures do', () => {
    const passed = resolveRoutDice(emptyBattleLiveState(),{...roll,dice:[1,2]},true)
    expect(canUseRoutSilk(dressed,REIKLAND,passed)).toBe(true)
    expect(canUseRoutSilk(dressed,REIKLAND,{...passed,notes:'Rout check failed: rolled 12 against Kurt'})).toBe(false)
    expect(() => resolveRoutDice(emptyBattleLiveState(),{...roll,dice:[0,6]},true)).toThrow(/D6/)
  })
  it('war horns remain reusable equipment and cannot be consumed by a legacy used-item tick', () => {
    expect(isConsumable('war_horn')).toBe(false)
    expect(isConsumable('war_horn_of_nagarythe')).toBe(false)
  })
})

it('allows an explained correction of a mistaken pending test without deleting its original dice', () => {
  const pending = resolveRoutDice(emptyBattleLiveState(),roll,true)
  expect(correctPendingRout(pending,roll.id,'')).toBe(pending)
  const corrected = correctPendingRout(pending,roll.id,'Used the wrong Leadership')
  expect(corrected.routed).toBe(false)
  expect(corrected.routTests[0]).toMatchObject({stage:'done',correction:'Used the wrong Leadership',dice:[6,5]})
  expect(corrected.rollAttempts[0].rolls.join(' ')).toContain('App rolled 6 + 5')
  expect(canUseRoutSilk(dressed,REIKLAND,corrected)).toBe(true)
})
