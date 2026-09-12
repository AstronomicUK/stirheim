import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../battle'
import { beginMortarShot, rollMortarStage, confirmMortarStage, declareMortarBlast, correctMortarShot } from '../mortarShot'
import { blackpowderBlock } from '../blackpowderShot'
const primary = { key: 'enemy:hero:0', warriorId: 'hero', warbandId: 'enemy', name: 'Target' }
const shot = { id: 'mortar', warriorId: 'firer', warbandId: 'own', shooterName: 'Gunner', weaponKey: 'mortar:0', ownTurn: 1, at: '2026-09-11T19:30:00Z', primary, hitThreshold: 4, permissionRequired: false }
it('failed permission consumes no shell, preserves edited originals, and requires a correction before retrying', () => {
  let s = beginMortarShot(emptyBattleLiveState(), { ...shot, permissionRequired: true })
  s = rollMortarStage(s, shot.id, 'permission', [5])
  s = parseBattleLiveState(JSON.parse(JSON.stringify(s)))
  s = confirmMortarStage(s, shot.id, 'permission', [2])
  expect(s.blackpowderShots).toHaveLength(0)
  expect(s.rollAttempts.at(-1)?.rolls[0]).toContain('App rolled 5; player changed this to 2')
  expect(() => beginMortarShot(s, { ...shot, id: 'retry' })).toThrow(/earlier/)
  expect(beginMortarShot(correctMortarShot(s, shot.id, 'Agreed retry'), { ...shot, id: 'retry' }).blackpowderShots).toHaveLength(1)
})
it('natural one resolves misfire before scatter and all failed misfires stop the shell', () => {
  for (const die of [1, 2, 3, 4, 5]) {
    let s = confirmMortarStage(beginMortarShot(emptyBattleLiveState(), shot), shot.id, 'hit', [1])
    expect(s.mortarShots[0].stage).toBe('misfire')
    s = confirmMortarStage(s, shot.id, 'misfire', [die])
    expect(s.mortarShots[0].stage).toBe('stopped')
    expect(s.mortarShots[0].scatter).toBeUndefined()
    expect(blackpowderBlock(s, shot.warriorId, shot.weaponKey, 2)).toBeTruthy()
  }
})
it('KA-BOOM strengthens the blast and mandates the central target', () => {
  let s = confirmMortarStage(beginMortarShot(emptyBattleLiveState(), shot), shot.id, 'hit', [1])
  s = confirmMortarStage(s, shot.id, 'misfire', [6])
  expect(s.mortarShots[0]).toMatchObject({ stage: 'blast', onTarget: true, strength: 5 })
  expect(() => declareMortarBlast(s, shot.id, [])).toThrow(/centre/)
  s = declareMortarBlast(s, shot.id, [primary])
  expect(s.mortarShots[0].targets).toEqual([primary])
  expect(blackpowderBlock(s, shot.warriorId, shot.weaponKey, 3)).toBeNull()
})
it('misses scatter using persisted 2D6 and a clockface direction, including harmless empty blasts', () => {
  let s = confirmMortarStage(beginMortarShot(emptyBattleLiveState(), shot), shot.id, 'hit', [2])
  s = rollMortarStage(s, shot.id, 'scatter', [2, 3, 12])
  s = parseBattleLiveState(JSON.parse(JSON.stringify(s)))
  s = confirmMortarStage(s, shot.id, 'scatter', [2, 4, 6])
  expect(s.mortarShots[0]).toMatchObject({ stage: 'blast', scatter: [2, 4, 6], onTarget: false })
  expect(s.rollAttempts.at(-1)?.rolls.join(' ')).toContain('App rolled 2, 3, 12; player changed this to 2, 4, 6')
  expect(declareMortarBlast(s, shot.id, []).mortarShots[0].stage).toBe('complete')
  expect(confirmMortarStage(s, shot.id, 'hit', [6])).toBe(s)
})

it('does not duplicate a pending physical Mortar by changing its model slot',()=>{
 const held={itemId:'mortar-row',copyIndex:0} as import('../weaponLoss').BrokenWeapon
 const input={...shot,heldWeapon:held,permissionRequired:true}
 const state=beginMortarShot(emptyBattleLiveState(),input)
 expect(state.mortarShots[0].weaponKey).toBe('item:mortar-row:0')
 expect(()=>beginMortarShot(state,{...input,id:'same-gun',weaponKey:'mortar:1'})).toThrow(/earlier/)
 expect(beginMortarShot(state,{...input,id:'other-gun',weaponKey:'mortar:1',heldWeapon:{...held,copyIndex:1}}).mortarShots).toHaveLength(2)
})
