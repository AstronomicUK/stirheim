import { expect, it } from 'vitest'
import { weaponLossSnapshot, type ItemRow, type BattleEventRow, type ReportApplied } from '../../../domain'
import { brokenWeaponSettlement } from './brokenWeapons'
import type { ReportContext } from './derive'
import type { ReportDraft } from './state'
const band = 'aaaaaaaa-0000-4000-8000-000000000001', holder = 'aaaaaaaa-0000-4000-8000-000000000002'
const item: ItemRow = { id: 'aaaaaaaa-0000-4000-8000-000000000003', warband_id: band, holder_type: 'group', holder_id: holder, item_rules_id: 'sword', custom_name: null, quantity: 3, notes: '', created_at: '2026-09-12T00:00:00Z', updated_at: '2026-09-12T00:00:00Z' }
const loss = weaponLossSnapshot(item, 'sword', 'Sword')
const event = { id: 'aaaaaaaa-0000-4000-8000-000000000004', reverted_at: null, payload: { brokenWeapons: [loss] } } as unknown as BattleEventRow
const ctx = { roster: { id: band }, items: [item], battleEvents: [event] } as unknown as ReportContext
const draft = {} as ReportDraft
const applied = { remove_item_ids: [], item_patches: [] } as unknown as ReportApplied
it('removes a broken copy and keeps source metadata for server validation', () => {
 const result = brokenWeaponSettlement(ctx, draft, applied)
 expect(result.problems).toEqual([]); expect(result.patches).toEqual([{ id: item.id, quantity: 2 }])
 expect(result.entries[0]).toEqual({ event_id: event.id, ...loss })
 expect(applied.item_patches).toEqual([])
})
it('requires a total for overlapping casualty losses, never silently double-removing a copy', () => {
 const prior = { ...applied, item_patches: [{ id: item.id, quantity: 2 }] }
 const unknown = brokenWeaponSettlement(ctx, draft, prior)
 expect(unknown.rows[0]).toMatchObject({ min: 1, max: 2, total: null })
 expect(unknown.problems).toHaveLength(1)
 const key = unknown.rows[0].key
 expect(brokenWeaponSettlement(ctx, { ...draft, brokenWeaponTotals: { [key]: 1 } }, prior).patches[0].quantity).toBe(2)
 expect(brokenWeaponSettlement(ctx, { ...draft, brokenWeaponTotals: { [key]: 2 } }, prior).patches[0].quantity).toBe(1)
 expect(brokenWeaponSettlement(ctx, { ...draft, brokenWeaponTotals: { [key]: 3 } }, prior).problems).toHaveLength(1)
 const lostAll = brokenWeaponSettlement(ctx, draft, { ...applied, remove_item_ids: [item.id] })
 expect(lostAll.problems).toEqual([]); expect(lostAll.patches).toEqual([]); expect(lostAll.entries).toHaveLength(1)
})
it('rejects changed or duplicate equipment and ignores reverted breaks or non-campaign games', () => {
 expect(brokenWeaponSettlement({ ...ctx, items: [{ ...item, quantity: 4 }] }, draft, applied).problems[0]).toContain('changed')
 expect(brokenWeaponSettlement({ ...ctx, battleEvents: [event, { ...event, id: 'other' }] }, draft, applied).problems[0]).toContain('same copy')
 expect(brokenWeaponSettlement({ ...ctx, battleEvents: [{ ...event, reverted_at: 'now' }] }, draft, applied).entries).toEqual([])
 expect(brokenWeaponSettlement(ctx, draft, applied, false).entries).toEqual([])
})

it('carries the confirmed combined loss through a complete report and clears it when casualties change', async () => {
 const { makeHero, makeHenchmanGroup, makeWarband } = await import('../../../rules/resolve/__tests__/fixtures')
 const { findWarbandTemplate } = await import('../../../rules/data/warbandTemplates')
 const { deriveReport } = await import('./derive')
 const { emptyDraft, setGroupInjuryRoll } = await import('./state')
 const context: ReportContext = { ...ctx, roster: makeWarband({ id: band, heroes: ['a', 'b', 'c'].map(id => makeHero({ id, xp: 20, levelUps: 8 })), henchmenGroups: [makeHenchmanGroup({ id: holder, size: 3 })] }), template: findWarbandTemplate('mercenaries_reikland'), matchId: 'match', myRating: 100, opponentRating: 100 }
 let reportDraft = emptyDraft(); reportDraft.result = 'lost'; reportDraft.groupsOut[holder] = 1; reportDraft.groupInjuries[holder] = [1]; reportDraft.exploration.rolls = [1, 2, 3]
 const first = deriveReport(reportDraft, context)
 expect(first.report).toBeNull()
 reportDraft = { ...reportDraft, brokenWeaponTotals: { [first.brokenEquipment.rows[0].key]: 2 } }
 const complete = deriveReport(reportDraft, context)
 expect(complete.report?.applied.item_patches).toContainEqual({ id: item.id, quantity: 1 })
 expect(complete.report?.applied.broken_weapons?.[0].event_id).toBe(event.id)
 expect(complete.report?.notes).toContain('2 copies lost or broken in total')
 expect(setGroupInjuryRoll(reportDraft, holder, 0, 6).brokenWeaponTotals).toEqual({})
})
