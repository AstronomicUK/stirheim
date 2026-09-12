import { describe, expect, it } from 'vitest'
import { WARBAND_TEMPLATES } from '../../rules/data/warbandTemplates'
import { startingMagicOptions } from '../../rules/data/campaign/magic'
import { loreForHero } from './model'

describe('native casters before their first spell', () => {
  it.each([
    ['warrior_priest', 'prayers_of_sigmar'],
    ['sisters_of_sigmar_matriarch', 'prayers_of_sigmar'],
    ['undead_necromancer', 'necromancy'],
    ['skaven_eshin_sorcerer', 'magic_of_the_horned_rat'],
    ['cult_of_the_possessed_magister', 'chaos_rituals'],
  ])('%s has the same native lore in creation and the empty-spell editor', (unitTemplateId, expected) => {
    const template = WARBAND_TEMPLATES.find(t => t.heroTemplates.some(h => h.id === unitTemplateId))
    expect(template).toBeDefined()
    expect(loreForHero({ unitTemplateId, spellIds: [] }, template)?.id).toBe(expected)
    expect(startingMagicOptions(unitTemplateId, template!)).toContainEqual(expect.objectContaining({ loreId: expected, count: 1 }))
  })
})
