import { explorationFaction } from '../../../rules/resolve/explorationDiscoveries'
import { unitGainsExperience } from '../../../rules/data/campaignRules'
import type { RosterHero } from '../../../rules/types/roster'
import type { ExplorationDraft } from './state'
export interface LocationXpAward { id: string; name: string; amount: number; reason: string }
export function locationXp(locationId: string | undefined, warbandId: string, draft: ExplorationDraft, heroes: RosterHero[], leaderId?: string | null) {
  const eligible=heroes.filter(h=>h.status==='active'&&unitGainsExperience(h.unitTemplateId))
  const faction=explorationFaction(warbandId)
  const fixed=locationId==='straggler'&&faction==='possessed'
  const sides=locationId==='prisoners'&&faction==='possessed'?3:locationId==='graveyard'&&['witch_hunters','sisters_of_sigmar'].includes(warbandId)?6:null
  const label=locationId==='straggler'?'Straggler sacrifice':locationId==='prisoners'?'Prisoner sacrifice':'Sealing the graves'
  const total=fixed?1:sides&&Number.isInteger(draft.locationXpDie)&&draft.locationXpDie!>=1&&draft.locationXpDie!<=sides?draft.locationXpDie!:null
  const awards:LocationXpAward[]=[];const problems:string[]=[]
  if (!fixed&&!sides) return {fixed:false,sides:null,total:null,eligible:[],awards,problems,label}
  if (total===null) problems.push(`${label}: roll D${sides} for the experience reward.`)
  if (fixed) {
    const leader=eligible.find(h=>h.id===leaderId)??eligible.find(h=>h.id===draft.locationLeaderId)
    if (!leader) problems.push('Choose the new warband leader to receive the Straggler reward.')
    else awards.push({id:leader.id,name:leader.name,amount:1,reason:label})
  } else if (total!==null) {
    const values=Object.entries(draft.locationXp??{})
    if (values.some(([id,n])=>!Number.isInteger(n)||n<0||(n>0&&!eligible.some(h=>h.id===id)))) problems.push('Allocate exploration experience only to eligible living Heroes.')
    if (values.reduce((sum,[,n])=>sum+n,0)!==total) problems.push(`Distribute all ${total} experience from ${label} amongst your Heroes.`)
    if (!problems.length) for (const [id,amount] of values) if(amount>0) {const hero=eligible.find(h=>h.id===id)!;awards.push({id,name:hero.name,amount,reason:label})}
  }
  return {fixed,sides,total,eligible,awards,problems,label}
}
