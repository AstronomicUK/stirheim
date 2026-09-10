import type {RosterWarband} from '../../../rules/types/roster'
import {unitGainsExperience} from '../../../rules/data/campaignRules'
import {hiredSwordGainsExperience} from '../../../rules/resolve/hiredSwordRules'
import {isDramatisPersona} from '../../../rules/data/campaign/hiredSwords'
import {ROCK_TOME} from '../../../rules/resolve/rockTome'
import {rockLoot,type RockLootRoll} from './rockLoot'
import type {LocationXpAward} from './locationXp'
export interface RockConscript {id:string;patrol:string;dice:(number|null)[];leadership:number|null;kit:'hammers'|'whip';survived:boolean;retain:boolean;eligiblePatrol:boolean}
export interface RockDraft {
  loot?:RockLootRoll[];evil?:boolean;leaderId?:string;initiative?:number|null;initiativeReason?:string
  matriarchId?:string;destructionDie?:number|null;xp?:Record<string,number>
  witchKills?:{recipientId:string;enemy:string;kind:'augur'|'matriarch'}[]
  conscripts?:RockConscript[]
}
export type RockRoster=Partial<RosterWarband>&Pick<RosterWarband,'warbandTemplateId'>
export function rockFaction(roster:RockRoster) {
 const sisters=roster.warbandTemplateId==='sisters_of_sigmar',witch=roster.warbandTemplateId==='witch_hunters'
 const morr=[...(roster.heroes??[]),...(roster.hiredSwords??[])].some(h=>h.status!=='dead'&&h.status!=='left'&&/priest.*morr|morr.*priest/i.test('unitTemplateId' in h?h.unitTemplateId:h.hiredSwordId))
 return {sisters,witch,morr}
}
export function rockXpRecipients(roster:RockRoster) {
 return [...(roster.heroes??[]).filter(h=>h.status==='active'&&unitGainsExperience(h.unitTemplateId)),...(roster.hiredSwords??[]).filter(h=>h.status==='active'&&!isDramatisPersona(h.hiredSwordId)&&hiredSwordGainsExperience(h.hiredSwordId)),...(roster.henchmenGroups??[]).filter(g=>g.size>0&&unitGainsExperience(g.unitTemplateId))].map(h=>({id:h.id,name:h.name}))
}
export function rockRewards(state:RockDraft,won:boolean,roster:RockRoster) {
 const faction=rockFaction(roster),leader=roster.heroes?.find(h=>h.id===state.leaderId)
 const loot=rockLoot(state.loot??[],{sisters:faction.sisters,evil:!!state.evil,leaderName:leader?.name,leaderInitiative:state.initiative??leader?.stats.I})
 const out={...loot,gold:0,xpAwards:[] as LocationXpAward[]}
 const recipients=rockXpRecipients(roster)
 if(state.loot?.some(l=>l.die===6&&l.desecrate)&&state.initiative!=null&&state.initiative!==leader?.stats.I&&!state.initiativeReason?.trim())out.problems.push('Explain the agreed leader Initiative used for desecration.')
 if(state.initiativeReason?.trim())out.notes.push(`Desecration Initiative adjustment: ${state.initiativeReason.trim()}`)
 if(faction.witch) {
  const seen=new Set<string>()
  for(const kill of state.witchKills??[]) {
   const recipient=recipients.find(h=>h.id===kill.recipientId),name=kill.enemy.trim()
   if(!recipient||!name||seen.has(name.toLowerCase())||!['augur','matriarch'].includes(kill.kind))out.problems.push('For each distinct Augur or Matriarch taken out, choose the credited warrior and name the enemy.')
   else out.xpAwards.push({...recipient,amount:2,reason:`Assault on the Rock: ${name} (${kill.kind}) taken out of action`})
   seen.add(name.toLowerCase())
  }
 }
 if(!won){out.notes.push('No recovered-tome reward: this warband did not win. Actual room loot and Witch Hunter casualty bonuses are retained.');return out}
 if(faction.sisters) {
  out.gold=100
  const matriarch=roster.heroes?.find(h=>h.id===state.matriarchId&&/matriarch/i.test(h.unitTemplateId))
  if(!matriarch)out.problems.push('Select the Matriarch for the Sisters’ +2 experience reward.')
  else out.xpAwards.push({id:matriarch.id,name:matriarch.name,amount:2,reason:'Assault on the Rock: recovered the tome for the Sisterhood'})
  out.notes.push('Sisters’ recovered-tome reward: 100 gc and +2 Matriarch XP, subject to survival. No usable tome awarded.')
 } else if(faction.witch||faction.morr) {
  out.gold=faction.witch?50:0
  const die=state.destructionDie
  if(die==null||!Number.isInteger(die)||die<1||die>6)out.problems.push('Roll D6 for destroying the tome.')
  else {
   const allocation=Object.entries(state.xp??{})
   if(!recipients.length)out.notes.push('No surviving eligible warriors remain to receive the destroyed-tome experience.')
   else if(allocation.some(([id,n])=>!Number.isInteger(n)||n<0||(n>0&&!recipients.some(h=>h.id===id)))||allocation.reduce((sum,[,n])=>sum+n,0)!==die)out.problems.push(`Allocate all ${die} XP for destroying the tome amongst eligible warriors.`)
   else for(const [id,amount] of allocation)if(amount>0)out.xpAwards.push({...recipients.find(h=>h.id===id)!,amount,reason:'Assault on the Rock: destroyed the tome'})
   out.notes.push(`Destroyed the tome: D6 ${die} XP distributed to the recorded warriors.${faction.witch?' Witch Hunter reward: 50 gc.':''}`)
  }
 } else {
  out.items.push({item_rules_id:ROCK_TOME,custom_name:null,quantity:1})
  out.notes.push('Recovered the Tome from the Rock: one reader gains two spells, from their own list, Lesser Magic, or a combination. Complete both lessons on the warband screen.')
 }
 return out
}
