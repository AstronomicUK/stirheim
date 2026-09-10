import type { RosterHero } from '../../../rules/types/roster'
import type { Participants } from './participants'
import type { ReportDraft } from './state'

const isRememberer = (hero: RosterHero) => hero.unitTemplateId === 'dwarf_slayer_cult_rememberer_hero'

/** The player records the witness at the moment of an enemy-caused casualty, not merely at the end. */
export function slayerExploration(draft: ReportDraft, participants: Participants) {
  const out = new Set(draft.heroesOut)
  const witnesses = [
    ...participants.heroes.filter(isRememberer),
    ...participants.hiredSwords.filter(h => h.hiredSwordId === 'bard'),
  ]
  const casualties = participants.heroes.filter(h => !isRememberer(h) && out.has(h.id))
  const recorded = casualties.flatMap(h => {
    const witness = witnesses.find(w => w.id === draft.exploration.valorWitnesses?.[h.id])
    return witness ? [`${h.name}, witnessed by ${witness.name}`] : []
  })
  const victory = !draft.routed && (draft.result === 'won' || draft.result === 'draw' || !!draft.exploration.alliedWithWinner)
  const eligibleHeroes = participants.heroes.filter(h => !out.has(h.id) && (isRememberer(h) || victory))
  return { witnesses, casualties, eligibleHeroes, extraDice: recorded.length,
    note: `Only in Victory: ${victory ? 'Slayer survivors may explore' : 'only the Rememberer may explore'}${recorded.length ? `; Record of Valor: ${recorded.join('; ')}` : ''}` }
}
