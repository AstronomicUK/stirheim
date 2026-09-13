import type { BattleLiveState, BattleEventRow, ItemRow } from '../../../domain'
import { blackpowderBlock, physicalGunKey } from '../../../domain/blackpowderShot'
import { doubleBarrelState } from '../../../domain/chambers'
import type { Combatant } from './combatants'
import { physicalWeaponChoices } from './weaponLoss'

export const CORE_PISTOLS = ['pistol', 'duelling_pistol', 'warplock_pistol', 'crossbow_pistol'] as const
export const SHOOTING_PISTOLS = [...CORE_PISTOLS, 'double_barrelled_pistol', 'double_barrelled_duelling_pistol', 'ostlander_double_barrelled_pistol'] as const
export function isCorePistol(id: string): boolean { return (CORE_PISTOLS as readonly string[]).includes(id) }

/** A group is represented by one fighter at a time; copies stay assigned to that model. */
export function pistolShootingOptions(sheet: BattleLiveState, warrior: Combatant, rows: readonly ItemRow[], events: readonly BattleEventRow[], weaponId: string, selectedKey: string | undefined, ownTurn: number, modelIndex = 0) {
  const size = warrior.kind === 'henchman' ? Math.max(1, warrior.groupSize ?? 1) : 1
  const all = SHOOTING_PISTOLS.flatMap(id => physicalWeaponChoices(rows, events, warrior.warbandId, warrior.id, id))
  const uneven = all.some(copy => copy.snapshot.expected.quantity % size !== 0)
  const belongs = (copy: { copyIndex: number; expected: { quantity: number } }) => size === 1 || Math.floor(copy.copyIndex / (copy.expected.quantity / size)) === modelIndex
  const modelCopies = all.filter(copy => belongs(copy.snapshot))
  const copies = modelCopies.filter(copy => copy.snapshot.weaponId === weaponId)
  const blockFor=(copy:typeof copies[number])=>copy.snapshot.weaponId.includes('double_barrelled')?doubleBarrelState(sheet,{warriorId:warrior.id,modelIndex,weaponKey:physicalGunKey(copy.snapshot,copy.key),name:copy.snapshot.name},ownTurn).block:blackpowderBlock(sheet,warrior.id,physicalGunKey(copy.snapshot,copy.key),ownTurn)
  const selected = copies.find(copy => copy.key === selectedKey) ?? copies.find(copy => !blockFor(copy)) ?? copies[0]
  const limit = warrior.skillIds.includes('pistolier') && modelCopies.length >= 2 ? 2 : 1
  const shots = sheet.blackpowderShots.filter(shot => !shot.correction && shot.warriorId === warrior.id && shot.ownTurn === ownTurn && shot.heldWeapon && (SHOOTING_PISTOLS as readonly string[]).includes(shot.heldWeapon.weaponId) && belongs(shot.heldWeapon))
  const remaining = Math.max(0, limit - shots.length)
  const blocked = uneven ? 'This group has uneven pistol equipment. Assign equal equipment before using automatic per-model pistol tracking.'
    : !selected ? 'No intact pistol is available for this model.'
    : remaining === 0 ? 'This model has used its pistol shots for this own turn.'
    : blockFor(selected)
  return { copies, selected, remaining, blocked, pistolCount: modelCopies.length }
}
