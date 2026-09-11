import { findWarbandTemplate, findUnitTemplate } from '../data/warbandTemplates'
import type { RosterWarband, Resolution } from '../types/roster'
import { RulesError } from './errors'

/** Commands are deliberately separate from spells: their bearer is not a Wizard. */
export function mazzalupoCommands() {
  const template = findWarbandTemplate('mazzalupo')!
  return findUnitTemplate(template, 'mazzalupo_wandering_knight')!.specialRules
    .filter(rule => rule.name.startsWith('Command: '))
    .map((rule, index) => ({id:`mazzalupo_command_${index + 1}`, name:rule.name.slice(9), text:rule.text}))
}
export function resolveSuccessorCommand(warband: RosterWarband, heroId: string, die: number, history: string): Resolution<RosterWarband> {
  const hero = warband.heroes.find(h => h.id === heroId && h.status === 'active')
  if (warband.warbandTemplateId !== 'mazzalupo' || !hero?.flags.successorCommandPending) throw new RulesError('command.unavailable','This warrior has no pending successor Command.')
  if (!Number.isInteger(die) || die < 1 || die > 6) throw new RulesError('command.die','Roll a D6 for the new Command.')
  const command = mazzalupoCommands()[die - 1]
  const next = {...hero, flags:{...hero.flags,successorCommandPending:false,commandIds:[...new Set([...(hero.flags.commandIds ?? []),command.id])]}}
  return {value:{...warband,heroes:warband.heroes.map(h => h.id === heroId ? next : h)},events:[{kind:'leader.succession',subjectId:heroId,message:`${hero.name} learns the Command “${command.name}” (D6: ${die}). ${history}`,data:{commandId:command.id,die,history}}]}
}
