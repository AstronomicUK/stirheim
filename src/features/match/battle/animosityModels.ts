import { hasNormalAnimosity } from '../../../domain/animosity'
import type { RosterWarband } from '../../../rules/types/roster'
import type { Combatant } from '../fight/combatants'

export function animosityApplies(model: Combatant, roster: RosterWarband): boolean {
  // The Orc Mob rule tests henchmen; becoming a Hero removes that eligibility.
  if (model.kind === 'hero' && model.unitTemplateId?.startsWith('orc_mob_')) return false
  const removed = roster.heroes.find(h => h.id === model.id)?.flags.animosityRemoved ?? false
  if(['black_orcs_orc_boy','black_orcs_orc_shoota'].includes(model.unitTemplateId??''))return model.kind!=='hero'
  return hasNormalAnimosity(model.unitTemplateId, removed)
}

/** Only Orc/Goblin henchmen or hired swords are legal targets of I 'Erd Dat. */
export function animosityFriend(model: Combatant, roster: RosterWarband): 'orc' | 'goblin' | 'hiredSword' | null {
 if(model.out || model.kind==='hero' || model.isAnimal)return null
 if(model.kind==='hiredSword') {
  const hire=roster.hiredSwords.find(h=>h.id===model.id)?.hiredSwordId
  return hire==='black_orc_overseer'?'orc':hire==='goblin_lantern_bearer'?'goblin':'hiredSword'
 }
 const unit=model.unitTemplateId??''
 if(['orc_mob_orc_boyz','black_orcs_orc_boy','black_orcs_orc_shoota','black_orcs_orc_nutta'].includes(unit))return 'orc'
 if(unit==='orc_mob_goblin_warriors'||unit.startsWith('forest_goblins_'))return 'goblin'
 return null
}
