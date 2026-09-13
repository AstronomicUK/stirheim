import type { RosterWarband } from '../types/roster'
import type { RosterProblem } from './roster'

export const SCARECROW = 'restless_dead_scarecrows'
export const CONTROLLERS = ['restless_dead_liche', 'restless_dead_necromancer'] as const
export const WAR_BEASTS = ['lustrian_reavers_estalian_warhound', 'lustrian_reavers_barbary_monkey', 'lustrian_reavers_tilean_hunting_hawk']
export const NIGHT_MOB = 'night_goblins_snotling_mob'
export const SINGLE_GROUP_UNITS = [SCARECROW, 'rat_ogres']

/** Source-specific relationships that a total Hero cap cannot express. */
export function compositionProblems(roster: RosterWarband, atCreation = false): RosterProblem[] {
  const out: RosterProblem[] = []
  const heroes = roster.heroes.filter(hero => ['active', 'captured'].includes(hero.status))
  const count = (ids: string[]) => heroes.filter(hero => ids.includes(hero.unitTemplateId)).length
  const slots = roster.warbandTemplateId === 'outlaws_of_stirwood_forest' ? ['outlaws_champion', 'outlaws_petty_thief', 'outlaws_cleric'] : roster.warbandTemplateId === 'outlaws_of_stirwood_forest_redux' ? ['champions', 'petty_thieves', 'cleric'] : null
  if (slots && count(slots) > 4) out.push({code:'roster.sharedSlots', message:'The Cleric replaces a Champion or Petty Thief: those three roles share four slots.'})
  if (roster.warbandTemplateId === 'protectorate_of_sigmar' && count(['templars', 'huntsman']) > 2) out.push({code:'roster.sharedSlots',message:'The Huntsman replaces one Templar: those two roles share two slots.'})
  const controllers = new Set<string>()
  for (const group of roster.henchmenGroups.filter(group => group.size > 0)) {
    const problem = (message: string) => out.push({code:'roster.composition',subjectId:group.id,message:`${group.name}: ${message}`})
    if (SINGLE_GROUP_UNITS.includes(group.unitTemplateId) && group.size !== 1) problem('Each model must have its own roster entry.')
    if (group.unitTemplateId === SCARECROW) {
      const controller = group.campaignState?.constructController
      if (!controller || !heroes.some(hero => hero.unitTemplateId === controller)) problem('Assign a living Liche or Necromancer as controller.')
      else if (controllers.has(controller)) problem('Each Liche or Necromancer can control only one Scarecrow.')
      if (controller) controllers.add(controller)
    }
    if (group.equipment.some(item => item.itemId === 'swivel_gun') && group.size !== 1) problem('A Swivel Gunner must be in a group of one.')
    if (group.unitTemplateId === 'bretonnian_battle_pilgrims') {
      const relics = group.equipment.filter(item => item.itemId === 'holy_unholy_relic').reduce((n,item)=>n+item.quantity,0)
      if (relics > 0 && relics < group.size) problem('Split the Pilgrims carrying Holy Relics into their own group, preserving their experience and equipment.')
    }
    if (group.unitTemplateId === NIGHT_MOB && atCreation && group.size !== 5) problem('A new mob starts with exactly five Snotlings for 50 gc.')
    if (WAR_BEASTS.includes(group.unitTemplateId) && !count(['lustrian_reavers_beastmaster'])) problem('War Beasts require a Beastmaster.')
  }
  const beasts = roster.henchmenGroups.filter(group => WAR_BEASTS.includes(group.unitTemplateId)).reduce((n,group)=>n+group.size,0)
  if (beasts > 2) out.push({code:'roster.warBeasts',message:'The Beastmaster may have no more than two War Beasts in total.'})
  if (roster.henchmenGroups.filter(g=>g.unitTemplateId===NIGHT_MOB&&g.size>0).length>1) out.push({code:'roster.mob',message:'The Night Goblin Snotlings form a single mob, with up to five members.'})
  return out
}
