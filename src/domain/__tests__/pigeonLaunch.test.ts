import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../battle'
import { battleEventRowSchema } from '../battleEvent'
import { startPigeonLaunch, confirmPigeonLaunch, pigeonBlastCentre, declarePigeonBlast, unresolvedPigeonVictims } from '../pigeonLaunch'
const own = 'aaaaaaaa-0000-4000-8000-000000000001', enemy = 'aaaaaaaa-0000-4000-8000-000000000002'
const victim = { key: `${enemy}:victim:0`, warbandId: enemy, warriorId: 'victim', name: 'Enemy' }
const input = () => ({ id: 'launch', warriorId: 'shooter', warbandId: own, shooterName: 'Shooter', ownTurn: 1, at: '2026-09-11T16:30:00Z', reason: '', original: 1, intendedTarget: { ...victim } })
it('preserves original dice and target through reload, then records an edit without applying wounds', () => {
  const attempt = input()
  let sheet = startPigeonLaunch(emptyBattleLiveState(), attempt)
  attempt.intendedTarget.name = 'Changed'
  sheet = parseBattleLiveState(JSON.parse(JSON.stringify(sheet)))
  expect(sheet.pigeonLaunches[0].intendedTarget.name).toBe('Enemy')
  expect(sheet.pigeonLaunches[0].original).toBe(1)
  expect(pigeonBlastCentre(sheet.pigeonLaunches[0])).toBeNull()
  sheet = confirmPigeonLaunch(sheet, 'launch', 5)
  expect(sheet.rollAttempts[0].rolls.join(' ')).toContain('App rolled 1; player changed it to 5')
  expect(pigeonBlastCentre(sheet.pigeonLaunches[0])).toEqual(victim)
  expect(sheet.tallies).toHaveLength(0)
  expect(confirmPigeonLaunch(sheet, 'launch', 1)).toBe(sheet)
})
it('backfires at the firer, requires that central victim, and freezes all nearby model identities', () => {
  let sheet = confirmPigeonLaunch(startPigeonLaunch(emptyBattleLiveState(), input()), 'launch', 1)
  const centre = pigeonBlastCentre(sheet.pigeonLaunches[0])!
  expect(centre.warriorId).toBe('shooter')
  expect(() => declarePigeonBlast(sheet, 'launch', [victim])).toThrow(/centre/)
  expect(() => declarePigeonBlast(sheet, 'launch', [centre, centre])).toThrow(/distinct/)
  const targets = [centre, { ...victim }]
  sheet = declarePigeonBlast(sheet, 'launch', targets)
  targets[1].name = 'Changed'
  expect(sheet.pigeonLaunches[0].targets?.[1].name).toBe('Enemy')
  expect(declarePigeonBlast(sheet, 'launch', [centre])).toBe(sheet)
  expect(unresolvedPigeonVictims(sheet.pigeonLaunches[0], [])).toHaveLength(2)
})
it('harmless launches have no victims and retries preserve history with a required explanation', () => {
  let sheet = startPigeonLaunch(emptyBattleLiveState(), input())
  expect(() => startPigeonLaunch(sheet, { ...input(), id: 'retry' })).toThrow(/Explain/)
  sheet = confirmPigeonLaunch(sheet, 'launch', 3)
  expect(sheet.pigeonLaunches[0].targets).toEqual([])
  expect(pigeonBlastCentre(sheet.pigeonLaunches[0])).toBeNull()
  expect(startPigeonLaunch(sheet, { ...input(), id: 'retry', reason: 'Agreed retry' }).pigeonLaunches).toHaveLength(2)
  expect(startPigeonLaunch(sheet, { ...input(), id: 'next', ownTurn: 2 }).pigeonLaunches).toHaveLength(2)
})
it('only matching unreverted shared results complete a victim, and reversal reopens just that model', () => {
  const sheet = declarePigeonBlast(confirmPigeonLaunch(startPigeonLaunch(emptyBattleLiveState(), input()), 'launch', 5), 'launch', [victim])
  const launch = sheet.pigeonLaunches[0]
  const event = battleEventRowSchema.parse({ id: own, match_id: own, actor_id: own, actor_warband_id: own, at: input().at, kind: 'attack', summary: '', reverted_at: null, reverted_by: null, revert_note: null, payload: { attacker_id: 'shooter', attacker_warband_id: own, attacker_kind: 'hero', attacker_name: 'Shooter', target_id: 'victim', target_warband_id: enemy, target_kind: 'hero', target_name: 'Enemy', pigeonLaunchId: 'launch', pigeonTargetKey: victim.key } })
  expect(unresolvedPigeonVictims(launch, [event])).toHaveLength(0)
  expect(unresolvedPigeonVictims(launch, [{ ...event, reverted_at: event.at }])).toHaveLength(1)
  expect(unresolvedPigeonVictims(launch, [{ ...event, payload: { ...event.payload, target_id: 'wrong' } }])).toHaveLength(1)
  expect(unresolvedPigeonVictims(launch, [{ ...event, payload: { ...event.payload, attacker_warband_id: enemy } }])).toHaveLength(1)
})

it('requires permission before launch, preserves both original dice separately, and does not retest blast victims', async () => {
  const { startPigeonPermission, confirmPigeonPermission } = await import('../pigeonLaunch')
  let sheet = startPigeonPermission(emptyBattleLiveState(), input(), 2)
  expect(() => startPigeonLaunch(sheet, { ...input(), original: 5 })).toThrow(/Pass/)
  sheet = parseBattleLiveState(JSON.parse(JSON.stringify(sheet)))
  sheet = confirmPigeonPermission(sheet, 'launch', 4)
  sheet = startPigeonLaunch(sheet, { ...input(), original: 6 })
  expect(sheet.pigeonLaunches).toHaveLength(1)
  expect(sheet.pigeonLaunches[0].permissionOriginal).toBe(2)
  expect(sheet.pigeonLaunches[0].original).toBe(6)
  sheet = confirmPigeonLaunch(sheet, 'launch', 5)
  sheet = declarePigeonBlast(sheet, 'launch', [victim])
  expect(sheet.rollAttempts.find(r => r.id === 'pigeon-permission:launch')?.rolls.join(' ')).toContain('App rolled 2; player changed it to 4')
  expect(sheet.rollAttempts.find(r => r.id === 'launch')?.rolls.join(' ')).toContain('App rolled 6; player changed it to 5')
  expect(sheet.pigeonLaunches[0].targets).toHaveLength(1)
})
it('a failed permission prevents the launch and requires a reason for another attempt this turn', async () => {
  const { startPigeonPermission, confirmPigeonPermission } = await import('../pigeonLaunch')
  const sheet = confirmPigeonPermission(startPigeonPermission(emptyBattleLiveState(), input()), 'launch', 3)
  expect(sheet.pigeonLaunches[0].die).toBeUndefined()
  expect(sheet.pigeonLaunches[0].targets).toEqual([])
  expect(() => confirmPigeonLaunch(sheet, 'launch', 6)).toThrow(/Pass/)
  expect(() => startPigeonPermission(sheet, { ...input(), id: 'again' }, 5)).toThrow(/Explain/)
  expect(startPigeonPermission(sheet, { ...input(), id: 'later', ownTurn: 2 }, 5).pigeonLaunches).toHaveLength(2)
})
