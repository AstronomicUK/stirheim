import { expect, it } from 'vitest'
import type { RosterHero } from '../../../rules/types/roster'
import { canUseExtraTough, hasExtraTough, useExtraTough } from './extraTough'
import { addHeroInjuryRoll, emptyDraft, resetHeroInjury, setMedicineChestReroll } from './state'
import { resolveHeroInjuryFlow } from './injuries'
const hero: RosterHero = { id: 'hero', name: 'Tough Dwarf', unitTemplateId: 'dwarf_noble', stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 }, xp: 20, levelUps: 8, skillTableIds: [], skillIds: ['extra_tough'], spellIds: [], injuries: [], flags: {}, equipment: [{ itemId: 'sword', quantity: 1 }], status: 'active' }

it('replaces the initial injury, preserves original provenance and accepts a worse result', () => {
  const draft = addHeroInjuryRoll(emptyDraft(), hero.id, 41, 'app')
  const replaced = useExtraTough(draft, hero, 11, 'tabletop')
  const result = resolveHeroInjuryFlow(hero, replaced.heroInjuries.hero)
  expect(result.outcome).toBe('dead')
  expect(result.line?.rollHistory?.join(' ')).toContain('D66 41 (app roll)')
  expect(result.line?.rollHistory?.join(' ')).toContain('D66 11 (entered from tabletop dice)')
  expect(result.line?.rollHistory?.join(' ')).toContain('Extra Tough')
  expect(useExtraTough(replaced, hero, 41, 'app')).toBe(replaced)
  expect(setMedicineChestReroll(replaced, hero.id, 0, 'chest', 41)).toBe(replaced)
  const restarted = addHeroInjuryRoll(resetHeroInjury(replaced, hero.id, 'Agreed table correction'), hero.id, 22)
  expect(canUseExtraTough(hero, restarted.heroInjuries.hero)).toBe(false)
})

it('keeps equipment when replacing death and requests fresh follow-up dice', () => {
  const draft = addHeroInjuryRoll(emptyDraft(), hero.id, 11, 'app')
  const recovered = useExtraTough(draft, hero, 41, 'app')
  expect(resolveHeroInjuryFlow(hero, recovered.heroInjuries.hero).hero.equipment).toEqual(hero.equipment)
  const multiple = useExtraTough(draft, hero, 16, 'app')
  expect(resolveHeroInjuryFlow(hero, multiple.heroInjuries.hero).pending.kind).toBe('count')
  const arm = useExtraTough(draft, hero, 23, 'app')
  expect(resolveHeroInjuryFlow(hero, arm.heroInjuries.hero).pending.kind).toBe('subRoll')
})

it('requires the learned skill and an initial result without dependent dice or an existing reroll', () => {
  for (const skill of ['extra_tough', 'dwarf_treasure_hunters_dwarf_skills_extra_tough', 'dwarf_rangers_dwarf_skills_extra_tough', 'black_dwarfs_skills_extra_tough', 'the_sons_of_hashut_skills_extra_tough']) expect(hasExtraTough({ skillIds: [skill] })).toBe(true)
  const draft = addHeroInjuryRoll(emptyDraft(), hero.id, 22)
  expect(useExtraTough(draft, { ...hero, skillIds: [] }, 41, 'app')).toBe(draft)
  expect(canUseExtraTough(hero, { ...draft.heroInjuries.hero, countRoll: 2 })).toBe(false)
  const medicine = setMedicineChestReroll(draft, hero.id, 0, 'chest', 41)
  expect(canUseExtraTough(hero, medicine.heroInjuries.hero)).toBe(false)
  expect(canUseExtraTough(hero, { ...draft.heroInjuries.hero, rolls: [{ d66: 23, subRoll: 1 }] })).toBe(false)
})
