import {Button,DieField,NumberField,SelectField,TextField} from '../../../ui'
import {STAT_KEYS} from '../../../domain/json'
import type {ItemRow} from '../../../domain'
import type {RosterHero,RosterHiredSword} from '../../../rules/types/roster'
import {absentGroupModels} from '../../../rules/resolve/groupAbsences'
import {Card,Section} from '../../roster/view/bits'
import {deriveInjuries} from '../model/derive'
import {curableFlags,BALEWOLF_RULES,type CurableInjuryFlag,type TransformationItemDecision} from '../model/lycanthrope'
import {woodsInjuryDraft,transformationItems,intactTransformationItems,type WoodsVictim,type TransformationDraft,type WoodsGroupDraft} from '../model/lycanthropeReport'
import type {StepProps} from './bits'
const flagNames:Record<CurableInjuryFlag,string>={missNextGames:'Injury recovery time',oldBattleWound:'Old battle wound',singleHandedWeaponsOnly:'One-handed weapons only',noRunning:'Cannot run',blindedInOneEye:'Blind in one eye',stupidity:'Stupidity',frenzy:'Frenzy',immuneToFear:'Immune to fear',causesFear:'Causes fear',hates:'Hatred'}
const survives=(w:RosterHero|RosterHiredSword)=>!['dead','left','retired'].includes(w.status)
function Eligibility({value,change}:{value:WoodsVictim;change:(v:WoodsVictim)=>void}){
 return <SelectField label="Curse eligibility" value={value.manSized===false?'large':value.nonMutant===false?'mutant':value.manSized&&value.nonMutant?'yes':''} onChange={e=>change({...value,manSized:e.target.value===''?undefined:e.target.value!=='large',nonMutant:e.target.value===''?undefined:e.target.value!=='mutant',die:null,cure:undefined})}><option value="">Confirm…</option><option value="yes">Man-sized and non-mutant — roll D6</option><option value="large">Not man-sized — ineligible</option><option value="mutant">Mutant — ineligible</option></SelectField>
}
function HealthyProfile({warrior,value,change}:{warrior:RosterHero|RosterHiredSword;value:WoodsVictim;change:(v:WoodsVictim)=>void}){
 const review=value.cure??{stats:{...warrior.stats},clearFlags:[],confirmed:false,reason:''}
 return <div className="flex flex-col gap-3 rounded border border-border p-3"><p className="text-sm">Curse D6 6: cure current injuries. Review the healthy characteristics against your records; the app cannot safely reconstruct every older reduction. Equipment already lost is not recreated.</p>
 <div className="grid grid-cols-3 gap-2">{STAT_KEYS.map(k=><NumberField key={k} label={`Healthy ${k}`} value={review.stats[k]} onChange={n=>change({...value,cure:{...review,stats:{...review.stats,[k]:n},confirmed:false}})}/>)}</div>
 {curableFlags(warrior).map(key=><label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={review.clearFlags.includes(key)} onChange={e=>change({...value,cure:{...review,clearFlags:e.target.checked?[...review.clearFlags,key]:review.clearFlags.filter(k=>k!==key),confirmed:false}})}/>Clear injury-derived {flagNames[key].toLowerCase()}</label>)}
 <TextField label="Healthy profile review" value={review.reason} onChange={e=>change({...value,cure:{...review,reason:e.target.value}})} hint="Record how you checked the profile and which conditions came from injuries. Preserve unrelated abilities and obligations."/>
 <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={review.confirmed} onChange={e=>change({...value,cure:{...review,confirmed:e.target.checked}})}/>I have reviewed the healthy profile and injury conditions.</label>
 </div>
}
function GearChoices({items,holderId,groupSize,value,change}:{items:readonly ItemRow[];holderId:string;groupSize?:number;value:TransformationDraft;change:(v:TransformationDraft)=>void}){
 const rows=items.filter(i=>i.holder_id===holderId&&i.quantity>0)
 const quantities=Object.fromEntries(rows.map(i=>[i.id,value.quantities?.[i.id]??(groupSize?Math.floor(i.quantity/groupSize):i.quantity)]))
 const held=transformationItems(items,holderId,quantities)
 function updateGear(itemId:string,patch:Partial<TransformationItemDecision>){const old=value.gear?.find(d=>d.itemId===itemId);change({...value,quantities,gearReviewed:false,gear:[...(value.gear??[]).filter(d=>d.itemId!==itemId),{itemId,fate:old?.fate??'destroyed',...old,...patch}]})}
 return <div className="flex flex-col gap-3 rounded border border-border p-3"><p className="text-sm">Review what this model wore or carried when it transformed. Worn equipment is destroyed; dropped weapons may be recovered as their original copies. Weapons already recorded as broken are excluded.</p>
 {rows.map(row=>{const item=transformationItems([row],holderId)[0],decision=value.gear?.find(d=>d.itemId===row.id);return <div key={row.id} className="flex flex-col gap-2 border-b border-border pb-3">
 <p className="text-sm font-medium">{item.name}</p>
 {groupSize?<NumberField label={`${item.name}: copies this model carried`} value={quantities[row.id]} onChange={n=>change({...value,quantities:{...quantities,[row.id]:n??0},gearReviewed:false,gear:(value.gear??[]).filter(d=>d.itemId!==row.id)})}/>:null}
 {held.some(i=>i.id===row.id)?<><SelectField label={`${item.name}: transformation result`} value={decision?.fate??''} onChange={e=>updateGear(row.id,{fate:e.target.value as TransformationItemDecision['fate']})}><option value="">Choose…</option>{item.kind!=='weapon'?<><option value="destroyed">Worn — destroyed</option><option value="not-worn">Not worn — retain with an explanation</option></>:null}{item.kind==='weapon'||item.kind==='custom'?<><option value="weapon-lost">Dropped weapon — not recovered</option><option value="weapon-recovered">Dropped weapon — recovered</option></>:null}</SelectField>{decision?.fate==='not-worn'||item.kind==='custom'?<TextField label={`${item.name}: explanation`} value={decision?.reason??''} onChange={e=>updateGear(row.id,{reason:e.target.value})}/>:null}</>:null}
 </div>})}
 <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={!!value.gearReviewed} onChange={e=>change({...value,quantities,gear:(value.gear??[]).filter(d=>held.some(i=>i.id===d.itemId)),gearReviewed:e.target.checked})}/>I have checked the actual carried copies and their fate.</label>
 </div>
}
function ReturnChoices({name,value,alive,items,holderId,groupSize,canSitOut,change}:{name:string;value:TransformationDraft;alive:boolean;items:readonly ItemRow[];holderId:string;groupSize?:number;canSitOut?:boolean;change:(v:TransformationDraft)=>void}){
 return <div className="flex flex-col gap-3"><p className="font-medium">{name}</p>
 {canSitOut?<label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={!!value.absent} onChange={e=>change({absent:e.target.checked})}/>This cursed member sat out the battle.</label>:null}
 {!value.absent?<><SelectField label={`${name}: transformed this battle?`} value={value.transformed===undefined?'':String(value.transformed)} onChange={e=>change({transformed:e.target.value===''?undefined:e.target.value==='true'})}><option value="">Choose…</option><option value="false">No transformation</option><option value="true">Transformed after a failed Leadership test</option></SelectField>
 {value.transformed?<>{alive?<DieField label={`${name}: return D6`} sides={6} value={value.die??null} onChange={die=>change({...value,die})} rollable/>:<p className="text-sm">Lost to the injury roll; no return D6 is needed. Account for any weapons dropped before the casualty.</p>}<GearChoices items={items} holderId={holderId} groupSize={groupSize} value={value} change={change}/></>:null}</>:null}
 </div>
}
export function LycanthropeAftermath({draft,derived,ctx,update}:Pick<StepProps,'draft'|'derived'|'ctx'|'update'>){
 if(ctx.scenarioId==='the_sword_of_the_herald'&&draft.scenarioNonCampaign)return null
 const woods=ctx.scenarioId==='the_thing_in_the_woods',state=draft.woods??{},participants=derived.participants
 const cursed=[...participants.heroes,...participants.hiredSwords].filter(h=>h.flags.lycanthrope)
 const groups=participants.groups.filter(g=>g.campaignState?.lycanthropes?.length||woods&&(draft.groupsOut[g.id]??0)>0)
 const casualties=woods?[...participants.heroes,...participants.hiredSwords].filter(h=>draft.heroesOut.includes(h.id)):[]
 if(!woods&&!cursed.length&&!groups.length)return null
 const base=deriveInjuries(woodsInjuryDraft(draft,ctx.scenarioId),participants,ctx.matchId,ctx.roster,ctx.map?.perks,ctx.scenarioId)
 const after=(id:string)=>base.heroes.find(h=>h.hero.id===id)?.resolution.hero??base.hiredSwords.find(h=>h.sword.id===id)?.resolution.sword??[...participants.heroes,...participants.hiredSwords].find(h=>h.id===id)!
 const victim=(id:string,value:WoodsVictim)=>update(d=>({...d,woods:{...d.woods,victims:{...d.woods?.victims,[id]:value}}}))
 const changeGroup=(id:string,value:WoodsGroupDraft)=>update(d=>({...d,woods:{...d.woods,groups:{...d.woods?.groups,[id]:value}}}))
 return <Section title="Balewolf curse"><p className="text-sm">{woods?'Fear of the Dark escapees do not roll Serious Injuries. After ordinary injuries, surviving man-sized non-mutants taken out by a Balewolf roll D6: on 6 their injuries are cured and they carry the curse.':'Resolve every participating cursed warrior’s actual transformation and equipment.'}</p>
 <details className="text-sm"><summary className="min-h-11 cursor-pointer">Curse and Balewolf profile</summary><p>Whenever wounded in a later battle, take a Leadership test; failure transforms the warrior. M5 WS4 BS0 S5 T5 W3 I4 A2 + jaws Ld7. {BALEWOLF_RULES} After a transformation, D6 1 leaves permanently; 2–6 returns to normal but remains cursed.</p></details>
 {casualties.map(h=>{const v=state.victims?.[h.id]??{},w=after(h.id),finished=base.heroes.find(x=>x.hero.id===h.id)?.resolution.pending.kind==='done'||base.hiredSwords.find(x=>x.sword.id===h.id)?.resolution.outcome!=null;return <Card key={h.id} className="flex flex-col gap-3 p-4"><p className="font-medium">{h.name}</p><SelectField label={`${h.name}: casualty cause`} value={v.source??''} onChange={e=>victim(h.id,{source:e.target.value as WoodsVictim['source']})}><option value="">Choose…</option><option value="other">Other attack or cause</option><option value="dark">Fled off the board — Fear of the Dark</option><option value="balewolf">Taken out by a Balewolf attack</option></SelectField>
 {v.source==='balewolf'&&finished&&survives(w)?<><Eligibility value={v} change={n=>victim(h.id,n)}/>{v.manSized&&v.nonMutant?<DieField label={`${h.name}: curse D6`} sides={6} value={v.die??null} onChange={die=>victim(h.id,{...v,die,cure:undefined})} rollable/>:null}{v.manSized&&v.nonMutant&&v.die===6?<HealthyProfile warrior={w} value={v} change={n=>victim(h.id,n)}/>:null}</>:null}
 </Card>})}
 {cursed.map(h=><Card key={`return:${h.id}`} className="p-4"><ReturnChoices name={h.name} value={state.returns?.[h.id]??{}} alive={survives(after(h.id))} items={intactTransformationItems(ctx)} holderId={h.id} change={value=>update(d=>({...d,woods:{...d.woods,returns:{...d.woods?.returns,[h.id]:value}}}))}/></Card>)}
 {groups.map(p=>{const group=ctx.roster.henchmenGroups.find(g=>g.id===p.id)??p,g=state.groups?.[group.id]??{},old=group.campaignState?.lycanthropes??[],out=draft.groupsOut[group.id]??0;return <Card key={group.id} className="flex flex-col gap-3 p-4"><p className="font-medium">{group.name}</p>
 {woods&&out>0?<><NumberField label={`${group.name}: fled through Fear of the Dark`} value={g.fled??0} onChange={fled=>changeGroup(group.id,{...g,fled:fled??0,reviewed:false})}/>
 {(g.victims??[]).map((v,index)=><div key={v.id} className="flex flex-col gap-3 rounded border border-border p-3"><TextField label="Surviving Balewolf casualty name" value={v.name} onChange={e=>changeGroup(group.id,{...g,reviewed:false,victims:g.victims!.map((x,i)=>i===index?{...x,name:e.target.value}:x)})}/>{old.length?<SelectField label="Already cursed member?" value={v.existingId??''} onChange={e=>changeGroup(group.id,{...g,victims:g.victims!.map((x,i)=>i===index?{...x,existingId:e.target.value||undefined}:x)})}><option value="">Not previously cursed</option>{old.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</SelectField>:null}<Eligibility value={v} change={value=>changeGroup(group.id,{...g,victims:g.victims!.map((x,i)=>i===index?{...x,...value}:x)})}/>{v.manSized&&v.nonMutant?<DieField label={`${v.name||'Henchman'}: curse D6`} sides={6} value={v.die??null} onChange={die=>changeGroup(group.id,{...g,victims:g.victims!.map((x,i)=>i===index?{...x,die}:x)})} rollable/>:null}<Button variant="ghost" onClick={()=>changeGroup(group.id,{...g,victims:g.victims!.filter((_,i)=>i!==index),reviewed:false})}>Remove casualty entry</Button></div>)}
 <Button variant="secondary" onClick={()=>changeGroup(group.id,{...g,reviewed:false,victims:[...(g.victims??[]),{id:crypto.randomUUID(),name:''}]})}>Add surviving Balewolf casualty</Button>
 <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={!!g.reviewed} onChange={e=>changeGroup(group.id,{...g,reviewed:e.target.checked})}/>All actual surviving Balewolf casualties are listed, including none if there were none.</label></>:null}
 {old.map(m=><div key={m.id} className="flex flex-col gap-2 border-t border-border pt-3"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={g.deadIds?.includes(m.id)??false} onChange={e=>changeGroup(group.id,{...g,deadIds:e.target.checked?[...(g.deadIds??[]),m.id]:(g.deadIds??[]).filter(id=>id!==m.id)})}/>{m.name} was lost in the ordinary injury rolls.</label><ReturnChoices name={m.name} value={g.returns?.[m.id]??{}} alive={!g.deadIds?.includes(m.id)} items={intactTransformationItems(ctx)} holderId={group.id} groupSize={group.size} canSitOut={absentGroupModels(group)>0} change={t=>changeGroup(group.id,{...g,returns:{...g.returns,[m.id]:t}})}/></div>)}
 </Card>})}
 </Section>
}
