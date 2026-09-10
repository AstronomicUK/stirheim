import { describe, expect, it } from 'vitest'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import { addDraftHero, draftToRosterWarband, newWarbandDraft } from '../../../rules/resolve/builder'
import { participantsOf } from './participants'
import { slayerExploration } from './slayerExploration'
import { emptyDraft } from './state'
import { deriveExploration } from './exploration'

const template = findWarbandTemplate('dwarf_slayer_cult')!
const roster = draftToRosterWarband(addDraftHero(newWarbandDraft(template, 'Slayers', 'leader'), template, 'dwarf_slayer_cult_rememberer_hero', 'rememberer'), template)
const participants = participantsOf(roster, template)

describe('Slayer exploration (#107)', () => {
  it('keeps the Rememberer exception but suppresses other survivors after defeat or rout', () => {
    const draft = { ...emptyDraft(), result: 'lost' as const }
    expect(slayerExploration(draft, participants).eligibleHeroes.map(h => h.id)).toEqual(['rememberer'])
    for (const result of ['won', 'draw'] as const) expect(slayerExploration({...draft, result}, participants).eligibleHeroes).toHaveLength(2)
    draft.exploration.alliedWithWinner = true
    expect(slayerExploration(draft, participants).eligibleHeroes).toHaveLength(2)
    expect(slayerExploration({...draft, routed: true}, participants).eligibleHeroes).toHaveLength(1)
  })
  it('requires a named participant witness and allows the reward even without a standing hero', () => {
    const draft = { ...emptyDraft(), result: 'lost' as const, heroesOut: ['leader', 'rememberer'] }
    expect(slayerExploration(draft, participants).extraDice).toBe(0)
    draft.exploration.valorWitnesses = {leader:'rememberer', rememberer:'rememberer', nonexistent:'rememberer'}
    const result = slayerExploration(draft, participants)
    expect(result.extraDice).toBe(1)
    draft.exploration.rolls = [3]
    const exploration = deriveExploration(draft.exploration, roster, {won:false,eligibleHeroes:result.eligibleHeroes,extraDice:result.extraDice,extraDiceNote:result.note,allowWithoutSurvivors:true})
    expect(exploration.allowed?.count).toBe(1)
    expect(exploration.record?.diceReason).toContain('witnessed by')
    expect(slayerExploration({...draft, heroesOut:['rememberer']}, participants).extraDice).toBe(0)
    draft.exploration.valorWitnesses.leader = 'absent-bard'
    expect(slayerExploration(draft, participants).extraDice).toBe(0)
  })
})
