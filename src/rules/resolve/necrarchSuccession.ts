import type { Resolution, RosterWarband } from '../types/roster'
import { RulesError } from './errors'

export function canCreateNecrarchThrall(roster: RosterWarband) {
  return roster.warbandTemplateId === 'necrarchs_the_soul_stealers'
    && roster.heroes.some(h => h.unitTemplateId === 'necrarchs_necrarch_vampire' && h.status === 'dead')
    && roster.heroes.some(h => h.unitTemplateId === 'necrarchs_necrarch_vampire' && h.status === 'active')
    && !roster.heroes.some(h => h.unitTemplateId === 'necrarchs_thrall' && h.status === 'active')
}
/** Death of the Leader: an existing Acolyte can fill the successor's vacated Thrall position. */
export function createNecrarchThrall(roster: RosterWarband, acolyteId: string): Resolution<RosterWarband> {
  if (!canCreateNecrarchThrall(roster)) throw new RulesError('THRALL_REPLACEMENT', 'A new Thrall can be created only after a Thrall has succeeded the fallen Necrarch and the Thrall position is empty.')
  const acolyte=roster.heroes.find(h=>h.id===acolyteId&&h.status==='active'&&h.unitTemplateId==='necrarchs_acolytes')
  if(!acolyte)throw new RulesError('THRALL_ACOLYTE','Choose an active Acolyte.')
  const message=`${acolyte.name} becomes a Thrall, retaining characteristics, experience, skills and equipment. Gains Cause Fear, Immune to Psychology, Immune to Poison and No Pain.`
  return {value:{...roster,heroes:roster.heroes.map(h=>h.id===acolyteId?{...h,unitTemplateId:'necrarchs_thrall',notes:[h.notes,message].filter(Boolean).join('\n')}:h)},events:[{kind:'thrallCreated',subjectId:acolyteId,message}]}
}
