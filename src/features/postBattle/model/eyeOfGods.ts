import type {ReportApplied} from '../../../domain/report'
import type {RosterHero} from '../../../rules/types/roster'
import {currentLeader} from '../../../rules/resolve/roster'
import {findLore} from '../../../rules/data/campaign/magic'
import {casterProfile} from '../../../rules/resolve/casting'
import {participantsOf} from './participants'
import type {ReportContext} from './derive'
import type {ReportDraft} from './state'
import {CHAOS_MARKS,chaosMarkId} from '../../../rules/resolve/chaosMarks'
export {CHAOS_MARKS} from '../../../rules/resolve/chaosMarks'
export function eyeLeader(ctx:ReportContext){return ctx.template?currentLeader(ctx.roster.heroes,ctx.template):undefined}
export function eyeThreshold(tribe:string|undefined,hero:RosterHero){return (tribe==='norse'?13:12)-(hero.skillIds.includes('marauders_of_chaos_skills_tattooed_body')?2:0)}
export function chaosAftermathChoice(draft:ReportDraft,ctx:ReportContext){
 const current=draft.chaosAftermath??{},leader=eyeLeader(ctx)
 const legacy=leader?draft.kit[`rule:eye_of_the_gods:${leader.id}`]:undefined
 return {...current,dice:current.dice??(legacy?.length===2?[legacy[0],legacy[1]] as [number|null,number|null]:undefined)}
}
export function eyeOfGodsState(draft:ReportDraft,ctx:ReportContext){
 const leader=eyeLeader(ctx),choice=chaosAftermathChoice(draft,ctx)
 const relevant=ctx.roster.warbandTemplateId==='marauders_of_chaos'&&!(ctx.scenarioId==='the_sword_of_the_herald'&&draft.scenarioNonCampaign)
 const awarded=leader&&(leader.flags.eyeOfGodsMarked===true||Boolean(leader.flags.chaosMark&&leader.unitTemplateId!=='marauders_seer'&&leader.flags.eyeOfGodsMarked!==false))
 const due=Boolean(relevant&&leader&&!awarded&&participantsOf(ctx.roster,ctx.template).heroes.some(h=>h.id===leader.id))
 const tribe=ctx.roster.marauderTribe??choice?.tribe
 const threshold=leader?eyeThreshold(tribe,leader):12
 const modifier=draft.result==='lost'?new Set(draft.heroesOut.filter(id=>ctx.roster.heroes.some(h=>h.id===id))).size:draft.result==='won'&&leader?draft.enemiesOut[leader.id]??0:0
 const dice=choice?.dice,valid=dice?.length===2&&dice.every(n=>n!==null&&Number.isInteger(n)&&n>=1&&n<=6)
 const total=valid?dice![0]!+dice![1]!+modifier:null
 const outcome=!due||total===null||total<threshold||draft.result==='draw'?'none':draft.result==='won'?'mark':'spawn'
 return {leader,due,tribe,threshold,modifier,total,outcome,relevant}
}
export function allowedChaosMarks(ctx:ReportContext,leader:RosterHero){
 const otherMarks=ctx.roster.heroes.filter(h=>h.status==='active'&&h.id!==leader.id).map(h=>chaosMarkId(h.flags.chaosMark)).filter(id=>id&&id!=='undivided')
 const seer=leader.unitTemplateId==='marauders_seer'?chaosMarkId(leader.flags.chaosMark):undefined
 return CHAOS_MARKS.filter(mark=>seer?mark.id===seer:mark.id==='undivided'||otherMarks.every(id=>id===mark.id))
}
export function condemnedAtFate(ctx:ReportContext,xp:ReadonlyMap<string,number>=new Map()){
 return ctx.roster.warbandTemplateId==='marauders_of_chaos'?ctx.roster.heroes.filter(h=>h.status==='active'&&h.unitTemplateId==='marauders_condemned'&&(xp.get(h.id)??h.xp)>=90&&!h.flags.condemnedAttributesFixed):[]
}
export function applyEyeOfGods(draft:ReportDraft,ctx:ReportContext,applied:ReportApplied,phase:"all"|"leader"|"fate"="all"){
 const state=eyeOfGodsState(draft,ctx),problems:string[]=[],notes:string[]=[]
 if(!state.relevant)return {problems,notes}
 const choice=chaosAftermathChoice(draft,ctx)
 const patchFor=(hero:RosterHero)=>{let entry=applied.heroes.find(p=>p.id===hero.id);if(!entry){entry={id:hero.id,patch:{}};applied.heroes.push(entry)}return entry.patch}
 const alive=(hero:RosterHero)=>!['dead','retired','left','captured'].includes(applied.heroes.find(p=>p.id===hero.id)?.patch.status??hero.status)
 let spawnExists=Boolean(applied.new_groups?.some(g=>g.unit_type_rules_id==='marauders_spawn_of_chaos'))||ctx.roster.henchmenGroups.some(g=>g.unitTemplateId==='marauders_spawn_of_chaos'&&(applied.groups.find(p=>p.id===g.id)?.patch.size??g.size)>0)
 const transform=(hero:RosterHero,reason:string)=>{
  const spawnId=choice?.spawnIds?.[hero.id]
  if(!spawnExists&&(!spawnId||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(spawnId))){problems.push(`${hero.name}: confirm the transformation to create its Spawn.`);return}
  const patch=patchFor(hero);Object.assign(patch,{status:'retired',xp:0,skills:[],spells:[],injuries:[],flags:{...hero.flags,...patch.flags,transformedIntoSpawn:true}})
  for(const item of ctx.items.filter(i=>i.holder_type==='hero'&&i.holder_id===hero.id)){const existing=applied.item_patches.find(p=>p.id===item.id);if(existing)existing.quantity=0;else applied.item_patches.push({id:item.id,quantity:0})}
  applied.pending_advances=applied.pending_advances.filter(p=>p.subject_id!==hero.id)
  if(!spawnExists){const unit=ctx.template!.henchmanTemplates.find(u=>u.id==='marauders_spawn_of_chaos')!;applied.new_groups=[...(applied.new_groups??[]),{id:spawnId!,name:`${hero.name} — Spawn of Chaos`,unit_type_rules_id:unit.id,size:1,stats:unit.stats,xp:0,level_ups:0}];notes.push(`${hero.name}: ${reason}; replaced by a Spawn of Chaos. All experience, skills, injuries and equipment are lost.`);spawnExists=true}
  else notes.push(`${hero.name}: ${reason}; leaves permanently because the warband already has a Spawn of Chaos. All experience, skills, injuries and equipment are lost.`)
 }
 if(state.due&&phase!=="fate"){
  if(!state.tribe)problems.push('Choose the Marauder tribe for Eye of the Gods; the Norse threshold differs.')
  if(state.total===null)problems.push('Roll both Eye of the Gods dice.')
  else{
   const original=choice?.originalDice
   notes.push(`Eye of the Gods — ${state.leader!.name}: ${original?`app rolled ${original.join(' + ')}${original.some((v,i)=>v!==choice!.dice![i])?`; player changed to ${choice!.dice!.join(' + ')}`:''}`:`table dice ${choice!.dice!.join(' + ')}`}, +${state.modifier} = ${state.total}; ${state.tribe??'tribe not recorded'} threshold ${state.threshold}+.`)
   if(!alive(state.leader!))notes.push('The leader did not survive the injury sequence; no Mark or Spawn is added.')
   else if(state.outcome==='spawn')transform(state.leader!,'Eye of the Gods after a defeat')
   else if(state.outcome==='mark'){
    if(choice?.mark==='decline')notes.push(`${state.leader!.name} declines the Mark; future Eye of the Gods rolls remain due.`)
    else if(!allowedChaosMarks(ctx,state.leader!).some(m=>m.id===choice?.mark))problems.push('Choose a permitted Mark of Chaos, or decline the reward.')
    else{
     const hero=state.leader!,patch=patchFor(hero),mark=choice!.mark!
     patch.flags={...hero.flags,...patch.flags,chaosMark:mark,eyeOfGodsMarked:true}
     if(mark==='crow')patch.stats={...(patch.stats??hero.stats),T:(patch.stats??hero.stats).T+1}
     if(mark==='arkhar')patch.flags.frenzy=true
     if(mark==='eagle'){
      const lore=findLore('tchar_rituals')!,die=choice?.spellDie
      if(!die||!Number.isInteger(die)||die<1||die>6)problems.push('Roll the random Tchar spell for the new Mark.')
      else {const spell=lore.spells[die-1];if(hero.spellIds.includes(spell.id))patch.flags.spellDifficultyReductions={...hero.flags.spellDifficultyReductions,...patch.flags.spellDifficultyReductions,[spell.id]:(patch.flags.spellDifficultyReductions?.[spell.id]??hero.flags.spellDifficultyReductions?.[spell.id]??0)+1};patch.spells=[...new Set([...(patch.spells??hero.spellIds),spell.id])];patch.flags.magicLoreId=hero.flags.magicLoreId??lore.id;patch.flags.eyeOfGodsNovice=!(casterProfile({hero})?.kind==='spell'||hero.unitTemplateId==='marauders_seer'&&chaosMarkId(hero.flags.chaosMark)!=='arkhar');notes.push(`Mark of Tchar: ${choice?.originalSpellDie?`app rolled ${choice.originalSpellDie}${choice.originalSpellDie!==die?`; player changed to ${die}`:''}`:`table D6 ${die}`} — ${spell.name}.`)}
     }
     notes.push(`${hero.name} receives the Mark of ${CHAOS_MARKS.find(m=>m.id===mark)!.name} through Eye of the Gods. No further Eye tests are due while this leader remains.`)
    }
   }else notes.push('The Dark Gods grant no change after this battle.')
  }
 }
 if(phase!=="leader")for(const hero of condemnedAtFate(ctx,new Map(applied.heroes.filter(p=>p.patch.xp!==undefined).map(p=>[p.id,p.patch.xp!])))){
  if(!alive(hero))continue
  const fixed=choice?.condemnedFixed?.[hero.id]
  if(fixed===undefined){problems.push(`${hero.name} has reached 90 Experience: confirm whether all variable attributes were fixed through advances.`);continue}
  if(fixed){const patch=patchFor(hero);patch.flags={...hero.flags,...patch.flags,condemnedAttributesFixed:true};notes.push(`${hero.name}: player confirmed WS, Strength, Toughness and Attacks were all fixed through advances; Fate does not transform him.`)}
  else transform(hero,'Fate at 90 Experience with attributes still variable')
 }
 return {problems,notes}
}
