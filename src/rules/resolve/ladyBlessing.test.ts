import { expect, it } from 'vitest'
import { findWeapon } from '../data/weapons'
import { ladyBlessingActive, ladyBlessingReason } from './ladyBlessing'

it('requires the actual Bretonnian blessing result', () => {
  expect(ladyBlessingActive('bretonnian_knights', { 'blessing:leader': 'passed' })).toBe(true)
  expect(ladyBlessingActive('bretonnian_knights', { 'blessing:leader': 'failed' })).toBe(false)
  expect(ladyBlessingActive('mercenaries', { 'blessing:leader': 'passed' })).toBe(false)
})
it('covers Experimental and built-in blackpowder, including a pistol fired in melee but not an ordinary blade', () => {
  for (const id of ['hand_held_mortar', 'repeater_handgun', 'veskit_warplock_pistols']) {
    expect(ladyBlessingReason(findWeapon(id)!, 'enemy', 'third', undefined, ['bretonnia'])).toBeTruthy()
  }
  expect(ladyBlessingReason({ ...findWeapon('pistol')!, type: 'melee' }, 'enemy', 'third', undefined, ['bretonnia'])).toBeTruthy()
  expect(ladyBlessingReason(findWeapon('sword')!, 'enemy', 'bretonnia', 'bretonnian_knights_questing_knight', ['bretonnia'])).toBeUndefined()
})
it('curses opposing blackpowder even against a third warband, but only shields Knights from bows', () => {
  const bow = findWeapon('bow')!
  const handgun = findWeapon('handgun')!
  expect(ladyBlessingReason(handgun, 'enemy', 'third', undefined, ['bretonnia'])).toBeTruthy()
  expect(ladyBlessingReason(handgun, 'bretonnia', 'enemy', undefined, ['bretonnia'])).toBeUndefined()
  expect(ladyBlessingReason(bow, 'enemy', 'bretonnia', 'bretonnian_knights_questing_knight', ['bretonnia'])).toBeTruthy()
  expect(ladyBlessingReason(bow, 'enemy', 'bretonnia', 'bretonnian_knights_knight_errant', ['bretonnia'])).toBeTruthy()
  expect(ladyBlessingReason(bow, 'enemy', 'bretonnia', 'bretonnian_knights_squire', ['bretonnia'])).toBeUndefined()
  expect(ladyBlessingReason(bow, 'enemy', 'third', 'bretonnian_knights_questing_knight', ['bretonnia'])).toBeUndefined()
})
