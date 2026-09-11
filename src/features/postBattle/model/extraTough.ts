import type { RosterHero } from '../../../rules/types/roster'
import { lookupHeroInjury } from '../../../rules/data/campaign/injuries'
import type { HeroInjuryFlow, ReportDraft } from './state'

export function hasExtraTough(hero: Pick<RosterHero, 'skillIds'>): boolean {
  return hero.skillIds.some(id => ['extra_tough', 'dwarf_treasure_hunters_dwarf_skills_extra_tough', 'dwarf_rangers_dwarf_skills_extra_tough', 'black_dwarfs_skills_extra_tough', 'the_sons_of_hashut_skills_extra_tough'].includes(id))
}

/** Choose the reroll before resolving dependent dice; no reroll of a reroll. */
export function canUseExtraTough(hero: Pick<RosterHero, 'skillIds'>, flow: HeroInjuryFlow | undefined): boolean {
  if (!hasExtraTough(hero) || !flow || flow.extraToughUsed || flow.rolls.length !== 1 || flow.countRoll !== null) return false
  const roll = flow.rolls[0]
  return !roll.medicine && roll.subRoll === null && roll.districtRoll == null
}

export function useExtraTough(draft: ReportDraft, hero: Pick<RosterHero, 'id' | 'skillIds'>, d66: number, source: 'app' | 'tabletop'): ReportDraft {
  const flow = draft.heroInjuries[hero.id]
  if (!canUseExtraTough(hero, flow)) return draft
  lookupHeroInjury(d66)
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [hero.id]: {
    ...flow, extraToughUsed: true, countRoll: null,
    rolls: [{ d66, source, subRoll: null }],
    previousAttempts: [...(flow.previousAttempts ?? []), { rolls: flow.rolls, countRoll: flow.countRoll, reason: 'Extra Tough: used the once-only Serious Injury reroll. The second result must stand, even if worse.' }],
  } } }
}
