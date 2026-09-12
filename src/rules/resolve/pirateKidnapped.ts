import type { Stats } from '../types'
import { RulesError } from './errors'

export interface KidnappedVictim {
  name: string
  kind: 'hero' | 'henchman' | 'hiredSword' | 'dramatisPersona'
  /** Verified from the unit's rules, not inferred from its warband being mostly human. */
  human: boolean
  finalResult: 'captured' | 'dead' | 'survived'
  injuryRoll: number
  outOfAction: boolean
  stats: Stats
  skillIds: string[]
}
export interface KidnappedDice { dice: [number, number]; original?: [number, number] }
export interface KidnappedChoice {
  winner: 'pirates' | 'victim' | 'draw'
  captainLeadership: number
  recoveredBody?: number
  pirateRoll?: KidnappedDice
  victimRoll?: KidnappedDice
  /** A new group uses the printed Crew profile; an existing group supplies its actual profile. */
  crew: { groupId?: string; size: number; stats: Stats; skillIds: string[] }
}
function fail(message:string):never {throw new RulesError('pirates.kidnapped',message)}
function d6(value:number) { if(!Number.isInteger(value)||value<1||value>6)fail('Enter a D6 result from 1 to 6.');return value }
function leadership(value:number) {if(!Number.isInteger(value)||value<1||value>10)fail('Leadership must be from 1 to 10.');return value}
function diceText(label:string,roll:KidnappedDice) {
  if(roll.dice.length!==2)fail('Roll two dice for each side of the Leadership contest.')
  roll.dice.forEach(d6)
  if(roll.original){if(roll.original.length!==2)fail('Preserve both original dice.');roll.original.forEach(d6)}
  return `${label}: ${roll.original?`app rolled ${roll.original.join(' + ')}${roll.original.some((v,i)=>v!==roll.dice[i])?`; player changed this to ${roll.dice.join(' + ')}`:''}`:`tabletop dice ${roll.dice.join(' + ')}`}.`
}
/** Town Cryer #9: exactly one opportunity; persistence/consent must enforce that per casualty. */
export function resolvePirateKidnapped(victim:KidnappedVictim,choice:KidnappedChoice) {
  if(victim.kind==='hiredSword'||victim.kind==='dramatisPersona')fail('Hired Swords and Dramatis Personae cannot be recruited by Kidnapped!')
  if(!victim.human)fail('Only human warriors can be recruited by Kidnapped!')
  if(!['pirates','victim','draw'].includes(choice.winner))fail('Record the battle result before resolving Kidnapped!')
  const log:string[]=[]
  if(victim.kind==='hero') {
    if(victim.finalResult!=='captured'||victim.injuryRoll!==61)fail('The Hero must have a final Captured result of 61.')
  } else {
    if(!victim.outOfAction||victim.finalResult!=='dead'||![1,2].includes(victim.injuryRoll))fail('The henchman must have gone out of action and been lost on a survival roll of 1 or 2.')
    if(choice.winner!=='pirates')fail('Pirates may only take lost henchmen when they won the battle.')
    if(choice.recoveredBody===undefined)fail('Roll D6 to see whether the Pirates recover this henchman.')
    d6(choice.recoveredBody)
    log.push(`${victim.name}: recovery D6 ${choice.recoveredBody}; ${choice.recoveredBody>=4?'recovered':'not recovered'}.`)
    if(choice.recoveredBody<4)return {outcome:'notRecovered' as const,log}
  }
  const pirateLd=leadership(choice.captainLeadership),victimLd=leadership(victim.stats.Ld)
  if(!choice.pirateRoll||!choice.victimRoll)fail('Both players must roll their two Leadership dice.')
  log.push(diceText('Pirates',choice.pirateRoll),diceText(victim.name,choice.victimRoll))
  const pirateBonus=choice.winner==='pirates'?1:0,victimBonus=choice.winner==='victim'?1:0
  const pirateTotal=choice.pirateRoll.dice.reduce((a,b)=>a+b,0)+pirateLd+pirateBonus
  const victimTotal=choice.victimRoll.dice.reduce((a,b)=>a+b,0)+victimLd+victimBonus
  log.push(`Pirates: ${choice.pirateRoll.dice.join(' + ')} + Leadership ${pirateLd}${pirateBonus?' + 1 for winning':''} = ${pirateTotal}. ${victim.name}: ${choice.victimRoll.dice.join(' + ')} + Leadership ${victimLd}${victimBonus?' + 1 for winning':''} = ${victimTotal}.`)
  if(pirateTotal>victimTotal) {
    if(choice.crew.groupId ? !Number.isInteger(choice.crew.size)||choice.crew.size<1||choice.crew.size>4 : choice.crew.size!==0)fail('Choose a new Crew group or an existing Crew group with no more than four models.')
    log.push(`${victim.name} joins the Crew. Characteristics and skills match ${choice.crew.groupId?'the chosen group':'a starting Crewman'}; old equipment is exchanged for matching Crew equipment at no gold cost.`)
    return {outcome:'crew' as const,pirateTotal,victimTotal,groupId:choice.crew.groupId,stats:{...choice.crew.stats},skillIds:[...choice.crew.skillIds],spellIds:[] as string[],equipment:'exchangeForCrewKit' as const,log}
  }
  log.push(`${victim.name} becomes a Swabbie${pirateTotal===victimTotal?' because the contest was tied':''}, retaining characteristics and skills. All old equipment goes to the Pirates; re-arm only from the Swabbie list. No magic or experience gains.`)
  return {outcome:'swabbie' as const,pirateTotal,victimTotal,stats:{...victim.stats},skillIds:[...victim.skillIds],spellIds:[] as string[],equipment:'captorStash' as const,log}
}
