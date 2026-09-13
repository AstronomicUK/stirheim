import { describe, expect, it } from 'vitest'
import { newPowderKegAttempt, rollPowderKegDie, confirmPowderKegDie, declarePowderKegTargets, powderKegDestroyed } from '../powderKeg'
import { battleLiveStateSchema, emptyBattleLiveState } from '../battle'
const input = { id: 'attempt', kegKey: 'east-gate-keg', kegName: 'East Gate keg', warriorId: 'gunner', warbandId: 'pirates', warriorName: 'Gunner', weaponName: 'Handgun', at: '2026-09-13T21:00:00Z', turn: 2, ignitionNote: 'Hit 4; wound 5 against T4, resolved at the table.', critical: false, underground: false }
describe('Powder Keg explosion after a confirmed hit and wound', () => {
  it.each([1, 2, 3, 4, 5, 6])('explodes on 4+ (%s)', die => {
    const attempt = confirmPowderKegDie(newPowderKegAttempt(input), die)
    expect(powderKegDestroyed(attempt)).toBe(die >= 4)
    expect(attempt.stage).toBe(die >= 4 ? 'radius' : 'stopped')
  })
  it('a critical bypasses the explosion check, with exactly one radius roll', () => {
    let attempt = newPowderKegAttempt({ ...input, critical: true })
    expect(attempt.stage).toBe('radius')
    expect(powderKegDestroyed(attempt)).toBe(true)
    attempt = confirmPowderKegDie(attempt, 6)
    expect(attempt.radius).toBe(9)
    expect(attempt.stage).toBe('targets')
    expect(() => confirmPowderKegDie(attempt, 6)).toThrow()
  })
  it('keeps the app roll across refresh, before a player confirms or changes it', () => {
    const attempt = rollPowderKegDie(newPowderKegAttempt(input), 2)
    const parsed = battleLiveStateSchema.parse(JSON.parse(JSON.stringify({ ...emptyBattleLiveState(), powderKegAttempts: [attempt] }))).powderKegAttempts[0]
    expect(parsed.original).toBe(2)
    expect(() => rollPowderKegDie(parsed, 6)).toThrow(/Confirm/)
    expect(confirmPowderKegDie(parsed, 4).stage).toBe('radius')
  })
  it.each([1, 3, 4, 6])('Horrors of the Underground has a separate cave-in test (%s)', die => {
    let attempt = newPowderKegAttempt({ ...input, underground: true, critical: true })
    attempt = confirmPowderKegDie(attempt, 1)
    expect(attempt.radius).toBe(4)
    expect(attempt.stage).toBe('caveIn')
    attempt = confirmPowderKegDie(attempt, die)
    expect(attempt.caveIn).toBe(die >= 4)
    expect(attempt.stage).toBe('targets')
  })
  it('allows an empty blast but never duplicates a victim or selects before radius', () => {
    const initial = newPowderKegAttempt(input)
    expect(() => declarePowderKegTargets(initial, [])).toThrow()
    const blast = confirmPowderKegDie(newPowderKegAttempt({ ...input, critical: true }), 3)
    expect(declarePowderKegTargets(blast, []).stage).toBe('complete')
    const victim = { key: 'w:g:0', warriorId: 'g', warbandId: 'w', name: 'Warrior 1' }
    expect(() => declarePowderKegTargets(blast, [victim, victim])).toThrow(/once/)
    expect(declarePowderKegTargets(blast, [victim]).targets).toEqual([victim])
  })
})

describe('saved Powder Keg battle state', () => {
  it('deducts a carried keg once only when it explodes, and correction withdraws that deduction', async () => {
    const { beginPowderKeg, acceptPowderKegDie, correctPowderKeg } = await import('../powderKegBattle')
    const supplied = { ...input, inventory: { itemRowId: 'keg-row', holderKey: 'stash' } }
    let sheet = beginPowderKeg(emptyBattleLiveState(), supplied)
    expect(sheet.warbandConsumables).toEqual([])
    sheet = acceptPowderKegDie(sheet, input.id, 4)
    sheet = acceptPowderKegDie(sheet, input.id, 2)
    expect(sheet.warbandConsumables).toHaveLength(1)
    expect(sheet.warbandConsumables[0]).toMatchObject({ itemRulesId: 'powder_keg', itemRowId: 'keg-row' })
    expect(() => beginPowderKeg(sheet, { ...supplied, id: 'another' })).toThrow(/already exploded/)
    sheet = correctPowderKeg(sheet, input.id, 'Wrong keg selected')
    expect(sheet.warbandConsumables[0].correction).toBe('Wrong keg selected')
    expect(beginPowderKeg(sheet, { ...supplied, id: 'replacement' }).powderKegAttempts).toHaveLength(2)
  })
  it('preserves an overridden app die in readable history and does not charge scenario scenery', async () => {
    const { beginPowderKeg, savePowderKegDie, acceptPowderKegDie } = await import('../powderKegBattle')
    let sheet = beginPowderKeg(emptyBattleLiveState(), input)
    sheet = savePowderKegDie(sheet, input.id, 1)
    sheet = acceptPowderKegDie(sheet, input.id, 4)
    expect(sheet.rollAttempts.flatMap(r => r.rolls).join(' ')).toContain('Player changed app roll 1 to 4')
    expect(sheet.warbandConsumables).toEqual([])
  })
  it('accepts the explosion roll already completed in the attack roller without rolling twice', async () => {
    const { beginPowderKeg } = await import('../powderKegBattle')
    const sheet = beginPowderKeg(emptyBattleLiveState(), { ...input, explosionDie: 5 })
    expect(sheet.powderKegAttempts[0].stage).toBe('radius')
    expect(sheet.rollAttempts.flatMap(r => r.rolls).join(' ')).toContain('Explosion roll 5')
  })
})

it('settles the exact destroyed inventory keg in the report and restores it on correction', async () => {
  const { beginPowderKeg, correctPowderKeg } = await import('../powderKegBattle')
  const { itemPatchesFor } = await import('../../features/postBattle/model/derive')
  const { emptyDraft } = await import('../../features/postBattle/model/state')
  const items = [{ id: 'keg-row', warband_id: 'pirates', holder_type: 'stash' as const, holder_id: null, item_rules_id: 'powder_keg', quantity: 2, notes: '', custom_name: null, created_at: 't', updated_at: 't' }]
  const ctx = (sheet: ReturnType<typeof emptyBattleLiveState>) => ({ items, matchId: 'm', warbandConsumables: sheet.warbandConsumables }) as unknown as import('../../features/postBattle/model/derive').ReportContext
  const sheet = beginPowderKeg(emptyBattleLiveState(), { ...input, critical: true, inventory: { itemRowId: 'keg-row', holderKey: 'stash' } })
  expect(itemPatchesFor(ctx(sheet), emptyDraft())).toEqual([{ id: 'keg-row', quantity: 1 }])
  expect(itemPatchesFor(ctx(correctPowderKeg(sheet, input.id, 'Wrong scenery')), emptyDraft())).toEqual([])
})
it('a repeated confirmation cannot accidentally become the next stage’s roll', async () => {
  const { beginPowderKeg, acceptPowderKegDie } = await import('../powderKegBattle')
  let sheet = beginPowderKeg(emptyBattleLiveState(), input)
  sheet = acceptPowderKegDie(sheet, input.id, 4, 'explosion')
  expect(acceptPowderKegDie(sheet, input.id, 4, 'explosion')).toBe(sheet)
  expect(sheet.powderKegAttempts[0].radius).toBeUndefined()
})
