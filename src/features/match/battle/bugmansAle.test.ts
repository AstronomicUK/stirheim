import { describe, expect, it } from 'vitest'
import { battleLiveStateSchema, emptyBattleLiveState } from '../../../domain/battle'
import type { ItemRow } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { aleBarrels, aleDrunk, correctBugmansAle, describeBarrel, drinkBugmansAle, isElvenWarband } from './bugmansAle'
import { itemsUsedBy } from './sheet'

const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }
const roster: RosterWarband = {
  id: 'w', name: 'Watch', warbandTemplateId: 'mercenaries_reikland', gold: 0, wyrdstone: 0, veteranPool: null, stash: [], hiredSwords: [], henchmenGroups: [],
  heroes: [
    { id: 'cap', name: 'Captain', unitTemplateId: 'mercenaries_reikland_captain', stats, xp: 20, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, status: 'active', equipment: [] },
    { id: 'gone', name: 'Dead Man', unitTemplateId: 'mercenaries_reikland_champions', stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, status: 'dead', equipment: [] },
  ],
}
const row = (over: Partial<ItemRow>): ItemRow => ({ id: 'r1', warband_id: 'w', holder_type: 'stash', holder_id: null, item_rules_id: 'bugmans_ale', custom_name: null, quantity: 1, created_at: 't', updated_at: 't', ...over } as ItemRow)
const stashBarrel = row({ id: 'stash-row' })
const carried = row({ id: 'cap-row', holder_type: 'hero', holder_id: 'cap' })
const human = { race: 'Human' } as WarbandTemplate
const elves = { race: 'Wood Elf' } as WarbandTemplate
const drink = (sheet = emptyBattleLiveState(), items: ItemRow[] = [stashBarrel], template = human, over: Partial<{ id: string; barrelRowId: string; confirmedBeforeBattle: boolean }> = {}) =>
  drinkBugmansAle(sheet, roster, template, items, { id: 'drink-1', confirmedBeforeBattle: true, ...over })

describe("Bugman's Ale (core, 02:1510)", () => {
  it('finds barrels in the stash or carried by an active member, never by the dead or other warbands', () => {
    const items = [stashBarrel, carried, row({ id: 'dead-row', holder_type: 'hero', holder_id: 'gone' }), row({ id: 'other', warband_id: 'x' }), row({ id: 'empty', quantity: 0 }), row({ id: 'wine', item_rules_id: 'elven_wine' })]
    expect(aleBarrels(items, roster).map(b => b.id)).toEqual(['stash-row', 'cap-row'])
    expect(describeBarrel(stashBarrel, roster)).toBe('in the stash')
    expect(describeBarrel(row({ quantity: 2 }), roster)).toBe('in the stash (2 barrels)')
    expect(describeBarrel(carried, roster)).toBe('carried by Captain')
  })

  it('one barrel, drunk once, marks the stash barrel for the report and logs it', () => {
    const drunk = drink()
    expect(aleDrunk(drunk)).toMatchObject({ itemRulesId: 'bugmans_ale', itemRowId: 'stash-row', holderKey: 'stash' })
    expect(itemsUsedBy(drunk, 'stash')).toEqual(['bugmans_ale'])
    expect(drunk.rollAttempts[0].label).toBe('Watch: drank a barrel of Bugman’s Ale')
    expect(drunk.rollAttempts[0].rolls[0]).toContain('immune to fear for this battle (Elves excepted)')
    expect(drunk.rollAttempts[0].rolls[0]).toContain('in the stash')
    // Same id twice is idempotent; a second barrel this battle is refused.
    expect(drink(drunk)).toBe(drunk)
    expect(() => drink(drunk, [stashBarrel], human, { id: 'drink-2' })).toThrow(/already drunk a barrel/)
  })

  it('a carried barrel is keyed by its holder, so the report deducts that row', () => {
    const drunk = drink(emptyBattleLiveState(), [carried])
    expect(aleDrunk(drunk)?.holderKey).toBe('cap')
    expect(itemsUsedBy(drunk, 'cap')).toEqual(['bugmans_ale'])
    const chosen = drink(emptyBattleLiveState(), [stashBarrel, carried], human, { barrelRowId: 'cap-row' })
    expect(aleDrunk(chosen)?.itemRowId).toBe('cap-row')
  })

  it('refuses without the before-battle confirmation, for an elven warband, and with no barrel', () => {
    expect(() => drink(emptyBattleLiveState(), [stashBarrel], human, { confirmedBeforeBattle: false })).toThrow(/before the battle/)
    expect(isElvenWarband(elves)).toBe(true)
    expect(isElvenWarband(human)).toBe(false)
    expect(isElvenWarband(undefined)).toBe(false)
    expect(() => drink(emptyBattleLiveState(), [stashBarrel], elves)).toThrow(/Elves may not drink/)
    expect(() => drink(emptyBattleLiveState(), [])).toThrow(/No barrel/)
  })

  it('an explained correction withdraws the immunity and the deduction, keeping the records', () => {
    const drunk = drink()
    expect(correctBugmansAle(drunk, 'drink-1', '  ')).toBe(drunk)
    expect(correctBugmansAle(drunk, 'nope', 'reason')).toBe(drunk)
    const corrected = correctBugmansAle(drunk, 'drink-1', 'We forgot the barrel was sold last week')
    expect(aleDrunk(corrected)).toBeUndefined()
    expect(itemsUsedBy(corrected, 'stash')).toEqual([])
    expect(corrected.rollAttempts.map(a => a.label)).toEqual(['Watch: drank a barrel of Bugman’s Ale', 'Bugman’s Ale corrected'])
    expect(corrected.rollAttempts[1].rolls[0]).toContain('We forgot the barrel was sold last week')
    // Corrected once, it stays corrected; the warband may then drink for real.
    expect(correctBugmansAle(corrected, 'drink-1', 'again')).toBe(corrected)
    const again = drink(corrected, [stashBarrel], human, { id: 'drink-2' })
    expect(aleDrunk(again)?.id).toBe('drink-2')
    expect(itemsUsedBy(again, 'stash')).toEqual(['bugmans_ale'])
  })

  it('a correction does not unmark a barrel another uncorrected record still uses', () => {
    const drunk = drink()
    // Only reachable if the one-per-battle rule were bypassed; the guard still protects the report.
    const twice = { ...drunk, warbandConsumables: [...(drunk as unknown as { warbandConsumables: unknown[] }).warbandConsumables, { id: 'drink-2', itemRulesId: 'bugmans_ale', itemRowId: 'stash-row', holderKey: 'stash', at: 't' }] } as typeof drunk
    const corrected = correctBugmansAle(twice, 'drink-1', 'duplicate')
    expect(itemsUsedBy(corrected, 'stash')).toEqual(['bugmans_ale'])
    expect(aleDrunk(corrected)?.id).toBe('drink-2')
  })

  it('survives a save and reload', () => {
    const drunk = drink()
    const restored = battleLiveStateSchema.parse(JSON.parse(JSON.stringify(drunk)))
    expect(aleDrunk(restored)).toMatchObject({ id: 'drink-1', holderKey: 'stash' })
    expect(itemsUsedBy(restored, 'stash')).toEqual(['bugmans_ale'])
  })
})
