import { expect, it } from 'vitest'
import { weaponLossSnapshot, weaponQuantityRemaining, type BattleEventRow, type ItemRow } from '../../../domain'
import { breakableWeaponChoices, physicalWeaponChoices } from './weaponLoss'
const band = 'aaaaaaaa-0000-4000-8000-000000000001'
const warrior = 'aaaaaaaa-0000-4000-8000-000000000002'
const row: ItemRow = { id: 'aaaaaaaa-0000-4000-8000-000000000003', warband_id: band, holder_type: 'hero', holder_id: warrior, item_rules_id: 'sword', custom_name: null, quantity: 2, notes: 'Family heirloom', created_at: '2026-09-12T00:00:00Z', updated_at: '2026-09-12T00:00:00Z' }
const event = (loss = weaponLossSnapshot(row, 'sword', 'Sword')) => ({ id: 'event', reverted_at: null, payload: { brokenWeapons: [loss] } }) as unknown as BattleEventRow
it('keeps duplicate catalogue items distinct and preserves their loss snapshot', () => {
 const second = { ...row, id: 'aaaaaaaa-0000-4000-8000-000000000004', notes: 'Poisoned copy' }
 const choices = breakableWeaponChoices([row, second], [event()], band, warrior, 'sword')
 expect(choices.map(c => c.remaining)).toEqual([1, 2])
 expect(choices.map(c => c.snapshot.itemId)).toEqual([row.id, second.id])
 expect(choices[0].snapshot.expected.notes).toBe('Family heirloom')
 expect(row.quantity).toBe(2)
})
it('an exhausted row disappears and reversal restores it without affecting another holder', () => {
 const broken = event(weaponLossSnapshot(row, 'sword', 'Sword', 2))
 expect(breakableWeaponChoices([row], [broken], band, warrior, 'sword')).toEqual([])
 expect(weaponQuantityRemaining(row, [{ ...broken, reverted_at: 'now' }])).toBe(2)
 expect(breakableWeaponChoices([row], [], band, 'another-warrior', 'sword')).toEqual([])
 expect(() => weaponLossSnapshot({ ...row, holder_type: 'stash', holder_id: null }, 'sword', 'Sword')).toThrow(/carried/)
 expect(() => weaponLossSnapshot(row, 'sword', 'Sword', 3)).toThrow(/available/)
})
it('uses real profile mapping for material variants and does not invent an item for natural attacks', () => {
 const material = { ...row, item_rules_id: 'gromril_sword' }
 expect(breakableWeaponChoices([material], [], band, warrior, 'gromril_sword')).toHaveLength(1)
 expect(breakableWeaponChoices([material], [], band, warrior, 'sword')).toEqual([])
 expect(breakableWeaponChoices([], [], band, warrior, 'unarmed')).toEqual([])
})


it('offers remaining physical copies rather than assigning a broken copy again', () => {
 const broken = event(weaponLossSnapshot(row, 'sword', 'Sword', 1, 0))
 expect(physicalWeaponChoices([row], [], band, warrior, 'sword').map(c => c.snapshot.copyIndex)).toEqual([0, 1])
 expect(physicalWeaponChoices([row], [broken], band, warrior, 'sword').map(c => c.snapshot.copyIndex)).toEqual([1])
 expect(() => weaponLossSnapshot(row, 'sword', 'Sword', 1, 2)).toThrow(/available/)
})
