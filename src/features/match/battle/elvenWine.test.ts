import { describe, expect, it } from 'vitest'
import { battleLiveStateSchema, emptyBattleLiveState } from '../../../domain/battle'
import type { ItemRow } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import { aleDrunk, correctBugmansAle, drinkElvenWine } from './bugmansAle'

const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }
const roster: RosterWarband = {
  id: 'w', name: 'Watch', warbandTemplateId: 'mercenaries_reikland', gold: 0, wyrdstone: 0, veteranPool: null, stash: [], hiredSwords: [], henchmenGroups: [],
  heroes: [
    { id: 'cap', name: 'Captain', unitTemplateId: 'mercenaries_reikland_captain', stats, xp: 20, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, status: 'active', equipment: [] },
    { id: 'gone', name: 'Dead Man', unitTemplateId: 'mercenaries_reikland_champions', stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, status: 'dead', equipment: [] },
  ],
}
const row = (over: Partial<ItemRow>): ItemRow => ({ id: 'r1', warband_id: 'w', holder_type: 'stash', holder_id: null, item_rules_id: 'bugmans_ale', custom_name: null, quantity: 1, created_at: 't', updated_at: 't', ...over } as ItemRow)
const shadows = { ...roster, warbandTemplateId: 'shadow_warriors' }
const wine = row({ id: 'wine', item_rules_id: 'elven_wine' })
const options = { id: 'drink', itemRowId: 'wine', confirmedBeforeBattle: true }
describe('Elven Wine declaration', () => {
  it('requires a Shadow Warrior warband, before-battle confirmation and exact available stock', () => {
    expect(() => drinkElvenWine(emptyBattleLiveState(), roster, [wine], options)).toThrow(/Shadow/)
    expect(() => drinkElvenWine(emptyBattleLiveState(), shadows, [wine], {...options, confirmedBeforeBattle:false})).toThrow(/before/)
    for (const bad of [{...wine,quantity:0}, {...wine,warband_id:'other'}, {...wine,holder_type:'hero' as const,holder_id:'gone'}, {...wine,id:'other'}]) expect(() => drinkElvenWine(emptyBattleLiveState(), shadows, [bad], options)).toThrow(/available/)
  })
  it('persists one whole-warband declaration, retries once and permits an explained withdrawal', () => {
    const saved = battleLiveStateSchema.parse(drinkElvenWine(emptyBattleLiveState(), shadows, [wine], options))
    expect(aleDrunk(saved, 'elven_wine')).toMatchObject({itemRowId:'wine', holderKey:'stash'})
    expect(drinkElvenWine(saved, shadows, [wine], options)).toBe(saved)
    expect(() => drinkElvenWine(saved, shadows, [wine], {...options,id:'second'})).toThrow(/already/)
    const corrected = correctBugmansAle(saved,'drink','Did not drink it')
    expect(aleDrunk(corrected,'elven_wine')).toBeUndefined()
    expect(corrected.rollAttempts.at(-1)?.label).toBe('Elven Wine corrected')
    expect(drinkElvenWine(corrected,shadows,[wine],{...options,id:'replacement'}).warbandConsumables).toHaveLength(2)
  })
})
