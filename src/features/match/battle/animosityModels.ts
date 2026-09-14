import { hasNormalAnimosity } from '../../../domain/animosity'
import type { RosterWarband } from '../../../rules/types/roster'
import type { Combatant } from '../fight/combatants'

export function animosityApplies(model: Combatant, roster: RosterWarband): boolean {
  // The Orc Mob rule tests henchmen; becoming a Hero removes that eligibility.
  if (model.kind === 'hero' && model.unitTemplateId?.startsWith('orc_mob_')) return false
  const removed = roster.heroes.find(h => h.id === model.id)?.flags.animosityRemoved ?? false
  return hasNormalAnimosity(model.unitTemplateId, removed)
}
