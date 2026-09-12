import { withRollAttempt, type BattleLiveState } from '../../../domain/battle'
import { blackpowderBlock, physicalGunKey, recordBlackpowderShot, correctBlackpowderShot } from '../../../domain/blackpowderShot'
import type { BrokenWeapon } from '../../../domain/weaponLoss'

/** A combat lasts until the player confirms it ended; changing target or turn does not reset it. */
export function beginPistolCombat(state: BattleLiveState, modelKey: string, name: string, phaseKey: string, id: string, reason: string): BattleLiveState {
  if (!reason.trim() || state.pistolCombats[modelKey]?.id === id) return state
  return withRollAttempt({ ...state, pistolCombats: { ...state.pistolCombats, [modelKey]: { id, firstPhaseKey: phaseKey, at: new Date().toISOString() } } }, {
    id: `combat:${id}`, at: new Date().toISOString(), turn: state.turn, kind: 'attack', status: 'complete',
    label: `${name}: new hand-to-hand combat`, rolls: [`Player confirmed the start of a separate combat: ${reason.trim()}. Existing firearm reload restrictions still apply.`],
  })
}

export function pistolCombatBlock(state: BattleLiveState, modelKey: string, warriorId: string, weapon: BrokenWeapon, mode: 'single' | 'brace' | 'crossbow', phaseKey: string, ownTurn: number): string | null {
  if (weapon.holderId !== warriorId || weapon.quantity !== 1) return 'Select one pistol carried by this warrior.'
  if (mode === 'crossbow' ? weapon.weaponId !== 'crossbow_pistol' : !['pistol', 'duelling_pistol', 'warplock_pistol'].includes(weapon.weaponId)) return 'Select the appropriate physical pistol for this attack.'
  const combat = state.pistolCombats[modelKey]
  if (!combat) return 'Confirm the start of this hand-to-hand combat first.'
  if ((mode === 'brace' || mode === 'crossbow') && combat.firstPhaseKey !== phaseKey) return 'This attack is only available in the first round of this combat.'
  const uses = state.pistolCombatUses.filter(use => use.combatId === combat.id && use.modelKey === modelKey && !use.correction)
  const sameKind = uses.filter(use => (use.mode === 'crossbow') === (mode === 'crossbow'))
  if (sameKind.some(use => use.weaponKey === physicalGunKey(weapon, ''))) return 'This physical pistol has already been used in this combat.'
  if (sameKind.length && (mode !== 'brace' || sameKind.some(use => use.mode !== 'brace') || sameKind.length >= 2)) return 'The pistol attacks for this combat have been used.'
  return mode === 'crossbow' ? null : blackpowderBlock(state, warriorId, physicalGunKey(weapon, ''), ownTurn)
}

export function useCombatPistol(state: BattleLiveState, args: { id: string; modelKey: string; warriorId: string; name: string; weapon: BrokenWeapon; mode: 'single' | 'brace' | 'crossbow'; phaseKey: string; ownTurn: number; reloadTurns: number }): BattleLiveState {
  if (state.pistolCombatUses.some(use => use.id === args.id)) return state
  const block = pistolCombatBlock(state, args.modelKey, args.warriorId, args.weapon, args.mode, args.phaseKey, args.ownTurn)
  if (block) throw new Error(block)
  const weaponKey = physicalGunKey(args.weapon, '')
  const next = { ...state, pistolCombatUses: [...state.pistolCombatUses, { id: args.id, combatId: state.pistolCombats[args.modelKey].id, modelKey: args.modelKey, warriorId: args.warriorId, weaponKey, sourceWeaponId: args.weapon.weaponId, mode: args.mode, phaseKey: args.phaseKey }] }
  return args.mode === 'crossbow' ? withRollAttempt(next, { id: args.id, at: new Date().toISOString(), turn: state.turn, kind: 'attack', status: 'incomplete', label: `${args.name}: crossbow pistol opening shot`, rolls: ['Resolve this BS shot before melee blows, with the extra −2 to hit penalty.'] }) : recordBlackpowderShot(next, { id: args.id, warriorId: args.warriorId, weaponKey, weaponName: `${args.weapon.name} in close combat`, heldWeapon: args.weapon, ownTurn: args.ownTurn, reloadTurns: args.reloadTurns, experimental: false, at: new Date().toISOString() }, args.name)
}

export function correctCombatPistol(state: BattleLiveState, id: string, reason: string): BattleLiveState {
  const use = state.pistolCombatUses.find(use => use.id === id)
  if (!use || use.correction || !reason.trim()) return state
  const next = correctBlackpowderShot(state, id, reason)
  return withRollAttempt({ ...next, pistolCombatUses: next.pistolCombatUses.map(use => use.id === id ? { ...use, correction: reason.trim() } : use) }, { id: `combat-correction:${id}`, at: new Date().toISOString(), turn: state.turn, kind: 'attack', status: 'complete', label: 'Close-combat pistol use corrected', rolls: [`Pistol availability restored: ${reason.trim()}. Correct any earlier attack results separately; they are unchanged.`] })
}
