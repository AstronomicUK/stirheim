import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../../../domain/battle'
import type { ItemRow } from '../../../domain'
import type { BattleEventRow } from '../../../domain/battleEvent'
import type { Combatant } from '../fight/combatants'
import { blessedWaterRemaining, correctBlessedWater, declareBlessedWater, linkBlessedWaterAttack } from './blessedWaterUses'

const warrior = { id: 'hero', name: 'Captain', kind: 'hero', warbandId: 'warband', out: false, traitIds: [] } as unknown as Combatant
const item = { id: 'water', warband_id: 'warband', holder_type: 'hero', holder_id: 'hero', item_rules_id: 'blessed_water', quantity: 2 } as ItemRow
it('reserves each physical vial before a result, persists, and rejects an exhausted stack', () => {
  const once = declareBlessedWater(emptyBattleLiveState(), warrior, item, 'one')
  expect(declareBlessedWater(once, warrior, item, 'one')).toBe(once)
  const twice = parseBattleLiveState(JSON.parse(JSON.stringify(declareBlessedWater(once, warrior, item, 'two'))))
  expect(blessedWaterRemaining(twice, item)).toBe(0)
  expect(() => declareBlessedWater(twice, warrior, item, 'three')).toThrow('available vial')
  expect(twice.rollAttempts[0].rolls[0]).toContain('whether the throw hits or misses')
  const fixed = correctBlessedWater(twice, 'one', 'Wrong model selected', [])
  expect(blessedWaterRemaining(fixed, item)).toBe(1)
  expect(correctBlessedWater(fixed, 'one', 'Again', [])).toBe(fixed)
  expect(declareBlessedWater(fixed, warrior, item, 'one')).toBe(fixed)
})
it('requires the linked damage to be undone before returning its vial, with a reason', () => {
  const sheet = linkBlessedWaterAttack(declareBlessedWater(emptyBattleLiveState(), warrior, { ...item, quantity: 1 }, 'one'), 'one', 'attack')
  expect(() => correctBlessedWater(sheet, 'one', '', [])).toThrow('Explain')
  expect(() => correctBlessedWater(sheet, 'one', 'Wrong target', [])).toThrow('Undo')
  expect(() => correctBlessedWater(sheet, 'one', 'Wrong target', [{ id: 'attack', reverted_at: null } as BattleEventRow])).toThrow('Undo')
  const corrected = correctBlessedWater(sheet, 'one', 'Wrong target', [{ id: 'attack', reverted_at: 'now' } as BattleEventRow])
  expect(blessedWaterRemaining(corrected, { ...item, quantity: 1 })).toBe(1)
  expect(corrected.rollAttempts.at(-1)?.rolls[0]).toContain('Wrong target')
  expect(() => linkBlessedWaterAttack(corrected, 'one', 'new')).toThrow('No active')
})
it('rejects unavailable warriors, prohibited kinds and stock belonging elsewhere', () => {
  for (const changed of [{ out: true }, { kind: 'animal' as const }, { traitIds: ['undead'] }, { traitIds: ['possessed'] }]) {
    expect(() => declareBlessedWater(emptyBattleLiveState(), { ...warrior, ...changed }, item, 'one')).toThrow()
  }
  for (const changed of [{ holder_type: 'stash' as const }, { holder_id: 'other' }, { warband_id: 'other' }, { item_rules_id: 'garlic' }]) {
    expect(() => declareBlessedWater(emptyBattleLiveState(), warrior, { ...item, ...changed }, 'one')).toThrow('available vial')
  }
})

it('also protects damage linked by the persisted throw identity in a shared event payload', () => {
  const sheet = declareBlessedWater(emptyBattleLiveState(), warrior, item, 'one')
  const event = { id: 'attack', reverted_at: null, payload: { blessedWaterUseId: 'one' } } as BattleEventRow
  expect(() => correctBlessedWater(sheet, 'one', 'Wrong target', [event])).toThrow('Undo')
  expect(blessedWaterRemaining(correctBlessedWater(sheet, 'one', 'Wrong target', [{ ...event, reverted_at: 'now' }]), item)).toBe(2)
})
