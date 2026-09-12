import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../../../domain/battle'
import { applyBattleEvents, type BattleEventRow } from '../../../domain/battleEvent'
import type { ItemRow } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import { correctHealingHerbs, herbsRemaining, applyHealingHerbs } from './healingHerbs'
import { setWoundsLost, woundsLost } from './sheet'

const roster = { id: 'warband', heroes: [{ id: 'hero', name: 'Captain', status: 'active', stats: { W: 3 } }] } as RosterWarband
const item = { id: 'herbs', warband_id: 'warband', holder_type: 'hero', holder_id: 'hero', item_rules_id: 'healing_herbs', quantity: 2 } as ItemRow
const options = { id: 'use1', singleUse: false, recoveryConfirmed: true, outsideCombatConfirmed: true }
const attack = (id: string) => ({ id, reverted_at: null, kind: 'attack', payload: { attacker_warband_id: 'enemy', target_warband_id: 'warband', target_id: 'hero', target_kind: 'hero', wounds_lost: 1, out_of_action: false } }) as BattleEventRow

it('heals manual and logged wounds, survives reload, and does not erase future damage when an old attack is reverted', () => {
  const original = setWoundsLost(emptyBattleLiveState(), 'hero', 'hero', 1, 3)
  const old = attack('old')
  const healed = applyHealingHerbs(original, roster, [old], item, options)
  expect(healed.healingHerbUses[0].woundsRestored).toBe(2)
  const saved = parseBattleLiveState(JSON.parse(JSON.stringify(healed)))
  expect(woundsLost(applyBattleEvents(saved, [old], 'warband'), 'hero')).toBe(0)
  expect(woundsLost(applyBattleEvents(saved, [{ ...old, reverted_at: 'later' }, attack('new')], 'warband'), 'hero')).toBe(1)
  expect(herbsRemaining(saved, item)).toBe(2)
  expect(applyHealingHerbs(saved, roster, [old], item, options)).toBe(saved)
})

it('spends each single-use dose once and restores it with an explained correction', () => {
  const first = attack('first'), second = attack('second'), third = attack('third')
  const once = applyHealingHerbs(emptyBattleLiveState(), roster, [first], item, { ...options, singleUse: true })
  const twice = applyHealingHerbs(once, roster, [first, second], item, { ...options, id: 'use2', singleUse: true })
  expect(herbsRemaining(twice, item)).toBe(0)
  expect(() => applyHealingHerbs(twice, roster, [first, second, third], item, { ...options, id: 'use3' })).toThrow(/available dose/)
  expect(() => correctHealingHerbs(twice, 'use1', 'Wrong use')).toThrow(/later/)
  const corrected = correctHealingHerbs(twice, 'use2', 'Not in recovery yet')
  expect(herbsRemaining(corrected, item)).toBe(1)
  expect(woundsLost(applyBattleEvents(corrected, [first, second, third], 'warband'), 'hero')).toBe(2)
  expect(corrected.rollAttempts.at(-1)?.rolls[0]).toContain('Not in recovery yet')
})

it('requires an eligible Hero, confirmed timing, lost wounds and a carried dose; never revives OOA', () => {
  const sheet = emptyBattleLiveState(), event = attack('hit')
  expect(() => applyHealingHerbs(sheet, roster, [event], item, { ...options, recoveryConfirmed: false })).toThrow(/Confirm/)
  expect(() => applyHealingHerbs(sheet, roster, [event], { ...item, holder_type: 'stash' }, options)).toThrow(/active Hero/)
  expect(() => applyHealingHerbs(sheet, roster, [], item, options)).toThrow(/no lost Wounds/)
  expect(() => applyHealingHerbs(sheet, roster, [{ ...event, payload: { ...event.payload, out_of_action: true } }], item, options)).toThrow(/out-of-action/)
})
