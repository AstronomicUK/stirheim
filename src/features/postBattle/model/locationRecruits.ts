import type { ReportApplied } from '../../../domain'
import { explorationFaction } from '../../../rules/resolve/explorationDiscoveries'
import { resolveRacialProfile } from '../../../rules/resolve/advances'
import { recruitmentBlock } from '../../../rules/resolve/recruitment'
import { itemPrice } from '../../../rules/resolve/trading'
import { applyHouseRuleDefaults } from '../../../rules/resolve/houseRules'
import { unitStartingStats, startingLevelUps } from '../../../rules/resolve/builder'
import { findItem } from '../../../rules/data/items'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import type { ReportContext, InjuriesDerived } from './derive'
import type { ExplorationDerived } from './exploration'
import type { ReportDraft } from './state'

export function locationRecruits(draft:ReportDraft, ctx:ReportContext, ex:ExplorationDerived, injuries:InjuriesDerived) {
 const faction=explorationFaction(ctx.roster.warbandTemplateId)
 const zombie=faction==='undead'&&['straggler','prisoners'].includes(ex.location?.id??'')
 const human=faction==='other'&&ex.location?.id==='prisoners'
 const kind=zombie?'zombie':human?'human':null
 const needsDie=zombie&&ex.location?.id==='prisoners'
 const count=needsDie?(Number.isInteger(draft.exploration.recruitDie)&&draft.exploration.recruitDie!>=1&&draft.exploration.recruitDie!<=3?draft.exploration.recruitDie!:null):kind?1:0
 const roster={...ctx.roster,heroes:ctx.roster.heroes.map(h=>injuries.heroes.find(r=>r.hero.id===h.id)?.resolution.hero??h),henchmenGroups:ctx.roster.henchmenGroups.map(g=>injuries.groups.find(r=>r.group.id===g.id)?.resolution.group??g)}
 const groups=roster.henchmenGroups.filter(g=>{
  if(g.size<1||!ctx.template) return false
  const unit=findUnitTemplate(ctx.template,g.unitTemplateId)
  if(zombie) return /zombie/i.test(unit?.name??'')
  if(!human||!unit||unit.specialRules.some(r=>/^animals?$/i.test(r.name))) return false
  const race=resolveRacialProfile(g,roster.warbandTemplateId).value
  return race.profile==='Human'&&race.matchedBy!=='fallback'
 })
 const newUnit=zombie?ctx.template?.henchmanTemplates.find(u=>/zombie/i.test(u.name)):undefined
 const out={kind,needsDie,count,groups,newUnit,problems:[] as string[],goldCost:0,listedCost:0 as number|null,newGroups:[] as NonNullable<ReportApplied['new_groups']>,groupPatches:[] as ReportApplied['groups'],itemPatches:[] as ReportApplied['item_patches'],notes:[] as string[]}
 if(!kind) return out
 if(count===null){out.problems.push('Roll D3 for the number of rescued prisoners raised as Zombies.');return out}
 const choice=draft.exploration.recruitChoice
 if(!choice){out.problems.push('Choose whether to accept the exploration recruit reward.');return out}
 if(choice==='decline'){out.notes.push(`${ex.location!.name}: declined the ${count} free ${zombie?'Zombies':'human recruit'}.`);return out}
 const group=groups.find(g=>g.id===choice)
 const unit=choice==='new'?newUnit:ctx.template&&group?findUnitTemplate(ctx.template,group.unitTemplateId):undefined
 if(!unit||!ctx.template){out.problems.push('Choose an eligible group for the exploration recruit.');return out}
 const block=recruitmentBlock(roster,ctx.template,unit,count)
 if(block) out.problems.push(block)
 if((group?.size??0)+count>5)out.problems.push('A henchman group may contain at most five models; use a new Zombie group instead.')
 if(group&&human){
  for(const item of ctx.items.filter(i=>i.holder_type==='group'&&i.holder_id===group.id)){
   const quantity=item.quantity/group.size
   if(!Number.isInteger(quantity)){out.problems.push(`${group.name}: equip existing members alike before adding the free recruit.`);continue}
   const entry=item.item_rules_id?findItem(item.item_rules_id):undefined
   const cost=entry?itemPrice(entry,ctx.houseRules??applyHouseRuleDefaults()).total:null
   if(cost===null)out.listedCost=null
   else if(out.listedCost!==null)out.listedCost+=cost*(item.item_rules_id==='dagger'?Math.max(0,quantity-1):quantity)
   out.itemPatches.push({id:item.id,quantity:item.quantity+quantity})
  }
  const override=draft.exploration.recruitKitCost
  if(override!=null){
   if(!Number.isSafeInteger(override)||override<0)out.problems.push('The recruit’s equipment cost must be a non-negative whole number.')
   if(!draft.exploration.recruitKitReason?.trim())out.problems.push('Explain the agreed equipment price for the free recruit.')
   out.goldCost=override
  }else if(out.listedCost===null)out.problems.push('Record an agreed price for the recruit’s variable-priced or custom equipment.')
  else out.goldCost=out.listedCost

 }
 if(choice==='new'){
  if(!draft.exploration.recruitGroupId)out.problems.push('Confirm the new Zombie group.')
  else out.newGroups.push({id:draft.exploration.recruitGroupId,name:'Zombies',unit_type_rules_id:unit.id,size:count,stats:unitStartingStats(unit),xp:unit.startingExperience,level_ups:startingLevelUps(unit,'henchman')})
 }else if(group)out.groupPatches.push({id:group.id,patch:{size:group.size+count}})
 out.notes.push(`${ex.location!.name}: ${count} free ${zombie?'Zombies':'human recruit'} ${group?`join ${group.name}, retaining the group’s stats and experience`:'form a new Zombie group'}${human?`; identical equipment costs ${out.goldCost} gc; no hire or veteran-experience fee`:''}.${draft.exploration.recruitKitReason?.trim()?` Equipment price ruling: ${draft.exploration.recruitKitReason.trim()}`:''}`)
 return out
}
