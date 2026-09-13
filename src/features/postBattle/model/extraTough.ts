import type { RosterHero } from '../../../rules/types/roster'
import { lookupHeroInjury } from '../../../rules/data/campaign/injuries'
import type { HeroInjuryFlow, ReportDraft } from './state'

type InjuryRerollHero = Pick<RosterHero, 'skillIds'> & Partial<Pick<RosterHero, 'flags' | 'unitTemplateId' | 'equipment'>>
export function injuryRerollName(hero: InjuryRerollHero): string | null {
  if(hero.equipment?.some(i=>i.quantity>0&&(i.itemId==='silver_death_mask'||/silver death mask/i.test(i.customName??''))))return 'Silver Death Mask'
  if (hero.skillIds.includes('amazons_lustria_skills_elixir_of_life')) return 'Elixir of Life'
  if (hero.skillIds.includes('nipponese_expedition_skills_blessed_by_the_kami')) return 'Blessed by the Kami'
  if (['crow','onogal'].includes(hero.flags?.chaosMark ?? '') && (hero.unitTemplateId === 'marauders_chieftain' || hero.flags?.leaderRoleId === 'marauders_chieftain')) return 'Mark of Onogal'
  return hasExtraTough(hero) ? 'Extra Tough' : null
}
export function hasExtraTough(hero: Pick<RosterHero, 'skillIds'>): boolean {
  return hero.skillIds.some(id => ['extra_tough', 'dwarf_treasure_hunters_dwarf_skills_extra_tough', 'dwarf_rangers_dwarf_skills_extra_tough', 'black_dwarfs_skills_extra_tough', 'the_sons_of_hashut_skills_extra_tough'].includes(id))
}

/** Choose the reroll before resolving dependent dice; no reroll of a reroll. */
export function canUseExtraTough(hero: InjuryRerollHero, flow: HeroInjuryFlow | undefined): boolean {
  if (!injuryRerollName(hero) || !flow || flow.extraToughUsed || !flow.rolls.length) return false
  if(hasExtraTough(hero)&&(flow.rolls.length!==1||flow.countRoll!==null))return false
  const index=flow.rolls.length-1
  if(index===0?flow.countRoll!==null:flow.countRolls?.[index]!==undefined)return false
  const roll = flow.rolls[index]
  return !roll.medicine && !roll.medicalAid && roll.subRoll === null && roll.districtRoll == null
}

export function applyExtraToughReroll(draft: ReportDraft, hero: InjuryRerollHero & Pick<RosterHero, 'id'>, d66: number, source: 'app' | 'tabletop'): ReportDraft {
  const flow = draft.heroInjuries[hero.id]
  if (!canUseExtraTough(hero, flow)) return draft
  lookupHeroInjury(d66)
  const index=flow.rolls.length-1
  return { ...draft, heroInjuries: { ...draft.heroInjuries, [hero.id]: {
    ...flow, extraToughUsed: true, countRoll: index===0?null:flow.countRoll,
    countRolls:Object.fromEntries(Object.entries(flow.countRolls??{}).filter(([key])=>Number(key)<index)),
    rolls: [...flow.rolls.slice(0,index),{ d66, source, subRoll: null,medicalAid:injuryRerollName(hero)! }],
    previousAttempts: [...(flow.previousAttempts ?? []), { rolls: flow.rolls, countRoll: flow.countRoll,countRolls:flow.countRolls, reason: `${injuryRerollName(hero)}: used the once-only Serious Injury reroll. The second result must stand, even if worse.` }],
  } } }
}
