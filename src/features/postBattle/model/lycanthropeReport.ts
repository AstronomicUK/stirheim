import {isConsumable} from '../../../rules/data/itemRules'
import {weaponQuantityRemaining,type ItemRow,type ReportApplied} from '../../../domain'
import {findItem} from '../../../rules/data/items'
import {absentGroupModels} from '../../../rules/resolve/groupAbsences'
import type {RosterHero,RosterHiredSword} from '../../../rules/types/roster'
import type {InjuriesDerived,ReportContext} from './derive'
import type {Participants} from './participants'
import type {ReportDraft} from './state'
import {balewolfCurseRoll,curseEligibility,cureLycanthropeInjuries,cursedGroupAftermath,lycanthropeReturn,transformationEquipment,type HealthyProfileReview,type TransformationItem,type TransformationItemDecision,type CursedGroupMember} from './lycanthrope'
export interface WoodsVictim {source?:'balewolf'|'dark'|'other';manSized?:boolean;nonMutant?:boolean;die?:number|null;cure?:HealthyProfileReview}
export interface GroupWoodsVictim extends WoodsVictim {id:string;name:string;existingId?:string}
export interface TransformationDraft {transformed?:boolean;die?:number|null;absent?:boolean;gear?:TransformationItemDecision[];quantities?:Record<string,number>;gearReviewed?:boolean}
export interface WoodsGroupDraft {fled?:number;reviewed?:boolean;victims?:GroupWoodsVictim[];deadIds?:string[];returns?:Record<string,TransformationDraft>}
export interface WoodsDraft {victims?:Record<string,WoodsVictim>;returns?:Record<string,TransformationDraft>;groups?:Record<string,WoodsGroupDraft>}
export function woodsInjuryDraft(draft:ReportDraft,scenarioId?:string|null):ReportDraft {
 if(scenarioId!=='the_thing_in_the_woods')return draft
 const injurySkips={...draft.injurySkips},groupInjuryDice={...draft.groupInjuryDice}
 for(const [id,v] of Object.entries(draft.woods?.victims??{}))if(v.source==='dark')injurySkips[id]='Fear of the Dark: fled off the board; no Serious Injury roll.'
 for(const [id,v] of Object.entries(draft.woods?.groups??{}))if(v.fled&&Number.isInteger(v.fled)&&v.fled>0&&v.fled<=(draft.groupsOut[id]??0))groupInjuryDice[id]={count:(draft.groupsOut[id]??0)-v.fled,reason:`Fear of the Dark: ${v.fled} fled off the board without Serious Injury rolls.`}
 return {...draft,injurySkips,groupInjuryDice}
}
/** Escapees are out of the game, but are not attack casualties for exploration, kit or kill records. */
export function woodsCasualtyDraft(draft:ReportDraft,scenarioId?:string|null):ReportDraft {
 if(scenarioId!=='the_thing_in_the_woods')return draft
 return {...draft,heroesOut:draft.heroesOut.filter(id=>draft.woods?.victims?.[id]?.source!=='dark'),groupsOut:Object.fromEntries(Object.entries(draft.groupsOut).map(([id,n])=>[id,Math.max(0,n-(draft.woods?.groups?.[id]?.fled??0))]))}
}
/** Broken copies cannot be recovered or consumed a second time by transformation. */
export function intactTransformationItems(ctx:Pick<ReportContext,'items'|'battleEvents'>):ItemRow[]{
 return ctx.items.map(row=>({...row,quantity:weaponQuantityRemaining(row,ctx.battleEvents??[])})).filter(row=>row.quantity>0)
}
export function transformationItems(items:readonly ItemRow[],holderId:string,quantities?:Record<string,number>):TransformationItem[]{return items.filter(i=>i.holder_id===holderId&&i.quantity>0).map<TransformationItem>(i=>{const def=i.item_rules_id?findItem(i.item_rules_id):undefined;return {id:i.id,name:i.custom_name||def?.name||'Custom equipment',quantity:quantities?.[i.id]??i.quantity,kind:!def?'custom':['melee','missile','blackpowder'].includes(def.category)?'weapon':def.category==='armour'?'armour':'other'}}).filter(i=>i.quantity>0)}
const alive=(w:RosterHero|RosterHiredSword)=>!['dead','left','retired'].includes(w.status)
/** Resolve source aftermath against freshly derived injuries; never mutate the original roster. */
export function lycanthropeReport(draft:ReportDraft,ctx:ReportContext,participants:Participants,initial:InjuriesDerived){
 const injuries:InjuriesDerived={...initial,heroes:initial.heroes.map(h=>({...h,resolution:{...h.resolution}})),hiredSwords:initial.hiredSwords.map(h=>({...h,resolution:{...h.resolution}})),groups:initial.groups.map(g=>({...g,resolution:{...g.resolution}}))}
 const problems:string[]=[],notes:string[]=[],losses:{itemId:string;quantity:number}[]=[],recovered:{itemId:string;quantity:number}[]=[]
 const groups:{id:string;members:CursedGroupMember[];feralLosses:number}[]=[]
 const woods=ctx.scenarioId==='the_thing_in_the_woods',state=draft.woods??{}
 function equipment(holderId:string,name:string,t:TransformationDraft,leaves:boolean,normalGroupDeath=false){
  if(!t.transformed)return
  if(!t.gearReviewed){problems.push(`${name}: review the equipment worn and weapons dropped during transformation.`);return}
  const rows=intactTransformationItems(ctx).filter(i=>i.holder_id===holderId),isGroup=ctx.roster.henchmenGroups.some(g=>g.id===holderId)
  if(isGroup&&rows.some(i=>!Number.isInteger(t.quantities?.[i.id])||t.quantities![i.id]<0||t.quantities![i.id]>i.quantity)){problems.push(`${name}: record the actual copies carried from each group stack.`);return}
  const held=transformationItems(rows,holderId,isGroup?t.quantities:undefined),result=transformationEquipment(held,t.gear??[])
  problems.push(...result.problems.map(p=>`${name}: ${p}`));notes.push(...result.notes.map(n=>`${name}: ${n}`))
  if(result.problems.length)return
  if(!normalGroupDeath)losses.push(...(leaves?held.map(i=>({itemId:i.id,quantity:i.quantity})):result.losses))
  if(leaves)for(const d of t.gear??[])if(d.fate==='weapon-recovered'||d.fate==='not-worn'){const row=held.find(i=>i.id===d.itemId);if(row)recovered.push({itemId:row.id,quantity:row.quantity})}
 }
 for(const original of [...participants.heroes,...participants.hiredSwords]){
  const heroEntry=injuries.heroes.find(h=>h.hero.id===original.id),hireEntry=injuries.hiredSwords.find(h=>h.sword.id===original.id)
  let current=heroEntry?.resolution.hero??hireEntry?.resolution.sword??original
  const casualty=draft.heroesOut.includes(original.id),v=state.victims?.[original.id],t=state.returns?.[original.id]??{}
  if(!original.flags.lycanthrope&&!(woods&&casualty))continue
  const complete=heroEntry?heroEntry.resolution.pending.kind==='done':hireEntry?hireEntry.resolution.outcome!==null:true
  const originalLine=heroEntry?.resolution.line??hireEntry?.resolution.line
  const detail:string[]=[]
  if(woods&&casualty){
   if(!v?.source)problems.push(`${original.name}: record whether a Balewolf attack, Fear of the Dark or another cause removed them from play.`)
   if(v?.source==='balewolf'&&complete){
    const eligibility=curseEligibility({survived:alive(current),manSized:v.manSized,nonMutant:v.nonMutant})
    if(eligibility.problem)problems.push(`${original.name}: ${eligibility.problem}`)
    const roll=balewolfCurseRoll(eligibility.eligible,v.die)
    if(roll.problem)problems.push(`${original.name}: ${roll.problem}`)
    if(eligibility.eligible&&!roll.problem)detail.push(`Balewolf curse D6 ${v.die}: ${roll.cursed?'cursed; current injuries are cured':'no curse'}.`)
    if(roll.cursed){try{if(!v.cure)throw new Error('Review the healthy profile and injury-derived conditions.');current=cureLycanthropeInjuries(current,v.cure,ctx.matchId);detail.push(`Healthy profile reviewed: ${v.cure.reason}`)}catch(e){problems.push(`${original.name}: ${e instanceof Error?e.message:String(e)}`)}}
   }
  }
  if(!complete)continue
  if(original.flags.lycanthrope){
   if(t.transformed===undefined)problems.push(`${original.name}: record whether they transformed during this battle.`)
   const survives=alive(current),result=survives?lycanthropeReturn(t.transformed,t.die):null
   if(result?.problem)problems.push(`${original.name}: ${result.problem}`)
   if(result?.note)detail.push(result.note)
   equipment(original.id,original.name,t,!survives||!!result?.leaves)
   if(result?.leaves)current='hiredSwordId' in current?{...current,status:'left',equipment:[]}:{...current,status:'retired',equipment:[]}
  }
  if(detail.length)notes.push(...detail.map(n=>`${original.name}: ${n}`))
  if(current!==original){
   const outcome=!alive(current)?current.status==='dead'?'dead':'retired':woods&&v?.source==='balewolf'&&v.die===6&&current.flags.lycanthrope?'injured':heroEntry?.resolution.outcome??hireEntry?.resolution.outcome??'recovered'
   const line=originalLine?{...originalLine,effect:[originalLine.effect,...detail].filter(Boolean).join('; '),outcome}:{subjectType:'hiredSwordId' in original?'hiredSword' as const:'hero' as const,subjectId:original.id,subjectName:original.name,rolls:[],injuryCode:null,injuryName:'Balewolf curse aftermath',effect:detail.join('; '),outcome}
   if('hiredSwordId' in original){if(hireEntry){hireEntry.resolution.sword=current as RosterHiredSword;hireEntry.resolution.line=line;hireEntry.resolution.outcome=outcome}else injuries.hiredSwords.push({sword:original,resolution:{sword:current as RosterHiredSword,line,outcome}})}
   else if(heroEntry){heroEntry.resolution.hero=current as RosterHero;heroEntry.resolution.line=line;heroEntry.resolution.outcome=outcome}
   else injuries.heroes.push({hero:original,resolution:{hero:current as RosterHero,line,outcome,pending:{kind:'done'},steps:[]}})
  }
 }
 for(const participant of participants.groups){
  const group=ctx.roster.henchmenGroups.find(g=>g.id===participant.id)??participant,g=state.groups?.[group.id]??{},entry=injuries.groups.find(r=>r.group.id===group.id)
  const previous=group.campaignState?.lycanthropes??[],normalDeaths=entry?.resolution.dead??0,newCurses:CursedGroupMember[]=[]
  if(woods&&(draft.groupsOut[group.id]??0)>0){
   if(!g.reviewed)problems.push(`${group.name}: review Fear of the Dark escapees and surviving Balewolf casualties.`)
   const fled=g.fled??0
   if(!Number.isInteger(fled)||fled<0||fled>(draft.groupsOut[group.id]??0))problems.push(`${group.name}: review the number who fled without injury rolls.`)
   const victims=g.victims??[],limit=Math.max(0,(draft.groupsOut[group.id]??0)-fled-normalDeaths)
   if(victims.length>limit)problems.push(`${group.name}: only ${limit} actual surviving attack casualties can roll for the curse.`)
   const seen=new Set<string>()
   for(const victim of victims){
    if(!victim.id||!victim.name.trim()||seen.has(victim.existingId||victim.id)){problems.push(`${group.name}: name each Balewolf casualty once.`);continue}seen.add(victim.existingId||victim.id)
    if(victim.existingId&&(!previous.some(m=>m.id===victim.existingId)||(g.deadIds??[]).includes(victim.existingId))){problems.push(`${victim.name}: select an actual surviving cursed member.`);continue}
    const eligibility=curseEligibility({survived:true,manSized:victim.manSized,nonMutant:victim.nonMutant}),roll=balewolfCurseRoll(eligibility.eligible,victim.die)
    if(eligibility.problem||roll.problem)problems.push(`${victim.name}: ${eligibility.problem||roll.problem}`)
    if(eligibility.eligible&&!roll.problem){notes.push(`${group.name} — ${victim.name}: Balewolf curse D6 ${victim.die}${roll.cursed?'; cursed':' ; no curse'}.`);if(roll.cursed&&!victim.existingId)newCurses.push({id:victim.id,name:victim.name,contractedAfter:ctx.matchId})}
   }
  }
  if(previous.length||newCurses.length){
   const absent=previous.filter(m=>g.returns?.[m.id]?.absent)
   if(absent.length>absentGroupModels(group)||absent.some(m=>(g.deadIds??[]).includes(m.id)))problems.push(`${group.name}: review which cursed members sat out rather than suffered casualties.`)
   const choices=Object.fromEntries(previous.map(m=>[m.id,g.returns?.[m.id]?.absent?{transformed:false}:g.returns?.[m.id]??{}]))
   const result=cursedGroupAftermath(previous,group.size,normalDeaths,{deadIds:g.deadIds??[],transformations:choices,newCurses})
   problems.push(...result.problems.map(p=>`${group.name}: ${p}`));notes.push(...result.notes.map(n=>`${group.name} — ${n}`))
   for(const member of previous){const t=g.returns?.[member.id]??{};if(t.absent)continue;const died=(g.deadIds??[]).includes(member.id);if(died&&t.transformed===undefined)problems.push(`${member.name}: record whether they transformed before the injury casualty.`);equipment(group.id,member.name,t,died||t.transformed===true&&t.die===1,died)}
   groups.push({id:group.id,members:result.members,feralLosses:result.feralLosses})
  }
 }
 return {injuries,problems,notes,losses,recovered,groups}
}
/** Apply extra transformation losses after normal casualty/kit handling; return recovered original copies to stash. */
export function applyLycanthropeReport(result:ReturnType<typeof lycanthropeReport>,applied:ReportApplied,ctx:ReportContext){
 const problems:string[]=[],totals=new Map<string,number>(),recoveries=new Map<string,number>()
 for(const loss of result.losses)totals.set(loss.itemId,(totals.get(loss.itemId)??0)+loss.quantity)
 for(const r of result.recovered)recoveries.set(r.itemId,(recoveries.get(r.itemId)??0)+r.quantity)
 for(const [id,quantity] of totals){const row=ctx.items.find(i=>i.id===id);if(!row)continue;const patch=applied.item_patches.find(p=>p.id===id);const alreadyRemoved=applied.remove_item_ids.includes(id);const remaining=alreadyRemoved?0:patch?.quantity??row.quantity
  // A dead/retired solo already lost all carried copies through the ordinary injury patch.
  if(alreadyRemoved&&row.holder_type==='hero')continue
  if(quantity>remaining){problems.push('Transformation losses exceed the remaining original equipment; reconcile the carried copies.');continue}
  if(patch)patch.quantity=remaining-quantity;else applied.item_patches.push({id,quantity:remaining-quantity})
 }
 for(const [id,quantity] of recoveries){const row=ctx.items.find(i=>i.id===id);if(!row)continue;const removed=applied.remove_item_ids.includes(id)?row.quantity:row.quantity-(applied.item_patches.find(p=>p.id===id)?.quantity??row.quantity)
  const consumed=(applied.medicine_chests?.find(m=>m.item_id===id)?.quantity??0)+(row.item_rules_id&&isConsumable(row.item_rules_id)&&row.holder_id&&ctx.itemsUsed?.[row.holder_id]?.includes(row.item_rules_id)?1:0)
  if(quantity>removed||quantity>weaponQuantityRemaining(row,ctx.battleEvents??[])-consumed){problems.push('Recovered weapons must come from original copies actually removed from the departing warrior.');continue}
  applied.awarded_items=[...(applied.awarded_items??[]),{holder_type:'stash',holder_id:null,item_rules_id:row.item_rules_id,custom_name:row.custom_name,quantity,notes:row.notes}]
 }
 for(const change of result.groups){const group=ctx.roster.henchmenGroups.find(g=>g.id===change.id)!;let patch=applied.groups.find(g=>g.id===change.id);if(!patch){patch={id:change.id,patch:{}};applied.groups.push(patch)}patch.patch.campaign_state={...(patch.patch.campaign_state??group.campaignState),lycanthropes:change.members};patch.patch.size=(patch.patch.size??group.size)-change.feralLosses;if(patch.patch.size<0)problems.push('Review the group’s feral departures and injury casualties.');if(patch.patch.size===0)applied.pending_advances=applied.pending_advances.filter(a=>a.subject_id!==group.id)}
 const touched=new Set([...totals.keys(),...recoveries.keys()])
 if(touched.size)applied.lycanthrope_equipment=ctx.items.filter(i=>touched.has(i.id)).map(i=>({item_id:i.id,expected:{id:i.id,warband_id:i.warband_id,holder_type:i.holder_type,holder_id:i.holder_id,item_rules_id:i.item_rules_id,custom_name:i.custom_name,quantity:i.quantity,notes:i.notes}}))
 return problems
}
