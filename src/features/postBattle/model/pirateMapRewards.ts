import type { ReportApplied } from '../../../domain'
import type { ReportContext } from './derive'
import type { ReportDraft } from './state'
import type { KitDerived } from './kit'
import { pirateMapChoice } from './pirateMapChoice'

export function applyPirateMapRewards(draft:ReportDraft,ctx:ReportContext,kit:KitDerived,applied:ReportApplied) {
  const problems:string[]=[],notes:string[]=[]
  if(!pirateMapChoice(draft,ctx).row)return {problems,notes}
  const prompt=kit.prompts.find(p=>p.itemId==='treasure_map')
  if(!prompt?.complete)return {problems,notes}
  const face=prompt.rolls[0]
  if(face===4) {
    applied.scenario_effects={...applied.scenario_effects,facio:true}
    notes.push("Facio’s fine clothes: +1 Captain Leadership for captive, Straggler and Prisoner recruitment in the next game only.")
  }
  if(face===3) {
    applied.stash_items.push({item_rules_id:'bugmans_ale',custom_name:null,quantity:1})
    notes.push("Long Drong’s alestash: one barrel of Bugman’s Ale added to the stash.")
  }
  if(face===6) {
    const die=draft.pirateMapDetails?.shards
    if(!Number.isInteger(die)||die!<1||die!>3)problems.push('Black-Wyrd’s burial spot: roll the D3 for wyrdstone.')
    else {
      applied.warband.wyrdstone_delta+=2+die!
      applied.stash_items.push({item_rules_id:'mordheim_map',custom_name:null,quantity:1})
      notes.push(`Black-Wyrd’s burial spot: 2 + D3 (${die}) = ${2+die!} wyrdstone shards and one Mordheim Map.`)
    }
  }
  if(face===5) {
    const hero=ctx.roster.heroes.find(h=>h.id===draft.pirateMapDetails?.heroId&&h.status==='active')
    const existing=hero?applied.heroes.find(h=>h.id===hero.id):undefined
    if(!hero||existing?.patch.status&&existing.patch.status!=='active') {problems.push('Choose a surviving Hero to attempt the trapped chest.');return {problems,notes}}
    const die=draft.pirateMapDetails?.test
    if(!Number.isInteger(die)||die!<1||die!>6){problems.push(`${hero.name}: roll the Initiative test for the trapped chest.`);return {problems,notes}}
    const initiative=(existing?.patch.stats??hero.stats).I
    const passed=die!<6&&die!<=initiative
    if(passed)applied.awarded_items=[...(applied.awarded_items??[]),{holder_type:'hero',holder_id:hero.id,item_rules_id:'lucky_charm',custom_name:null,quantity:1,notes:'Claimed from a trapped Pirate Treasure Map chest.'}]
    else {
      const patch={...(existing?.patch??{}),flags:{...(existing?.patch.flags??hero.flags),missNextGames:Math.max(existing?.patch.flags?.missNextGames??hero.flags.missNextGames??0,1)}}
      if(existing)existing.patch=patch
      else applied.heroes.push({id:hero.id,patch})
    }
    notes.push(`${hero.name}: trapped chest Initiative test ${die} against ${initiative}; ${passed?'passed, claims one Lucky Charm':'failed, misses the next game'}. The chest gold is recovered either way.`)
  }
  return {problems,notes}
}
