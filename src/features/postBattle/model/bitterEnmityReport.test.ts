import { describe, expect, it } from 'vitest'
import { bitterEnmityFor, type ReportContext } from './derive'
import { emptyDraft, setHeroEnmityTarget } from './state'
import type { BitterEnmityTarget } from '../../../rules/types/roster'

const base: BitterEnmityTarget = { scope: 'individual', roll: 2, text: 'The individual who caused the injury. If it was a Henchman, he hates the enemy leader instead.', source: 'unresolved' }
const enemies = [{ id: 'cult', name: 'Test Cult', typeId: 'cult_of_the_possessed', typeName: 'Cult of the Possessed', leaderId: 'mag', leaderName: 'Magister', models: [{ id: 'mag', name: 'Magister', kind: 'hero' as const }, { id: 'beg', name: 'Beggar', kind: 'hiredSword' as const }] }]
const ctx = (over: Partial<ReportContext>): ReportContext => ({ matchId: 'm1', enemies, ...over }) as unknown as ReportContext

describe('Bitter Enmity in the report (#96)', () => {
  it('fixes the target from the battle sheet record and stamps the match', () => {
    const c = ctx({ takenOutByDetail: { h1: [{ warbandId: 'cult', modelId: 'beg', name: 'Beggar' }] } })
    expect(bitterEnmityFor('h1', base, c, emptyDraft())).toMatchObject({ source: 'attribution', warriorId: 'beg', warriorName: 'Beggar', warbandName: 'Test Cult', matchId: 'm1', text: base.text })
  })

  it('falls back to the player’s choice, and otherwise stays unresolved with the printed text', () => {
    const c = ctx({ takenOutByDetail: { h1: [{ warbandId: null, modelId: null, name: 'a fall' }] } })
    expect(bitterEnmityFor('h1', base, c, emptyDraft())).toMatchObject({ source: 'unresolved', warriorId: undefined })
    const chosen = setHeroEnmityTarget(emptyDraft(), 'h1', { warbandId: 'cult', modelId: null })
    // Warband named but no model: a henchman or unknown culprit means the enemy leader.
    expect(bitterEnmityFor('h1', base, c, chosen)).toMatchObject({ source: 'chosen', warriorId: 'mag', warriorName: 'Magister' })
    expect(bitterEnmityFor('h1', base, c, setHeroEnmityTarget(chosen, 'h1', null))).toMatchObject({ source: 'unresolved' })
  })
})
