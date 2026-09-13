import {groupMedicalAidOptions,applyGroupMedicalAid} from '../model/medicalAid'
import {Button,DieField} from '../../../ui'
import {setGroupInjuryRoll,setGroupFlamingCasualty} from '../model/state'
import type {StepProps} from './bits'
import type {RosterHenchmanGroup} from '../../../rules/types/roster'
export function GroupInjuryProtection({group,ctx,draft,derived,update}:Pick<StepProps,'ctx'|'draft'|'derived'|'update'>&{group:RosterHenchmanGroup}){
 const flaming=draft.groupFlamingCasualties?.[group.id]??false
 const construct=group.unitTemplateId==='restless_dead_scarecrows'
 const troll=group.unitTemplateId==='black_orcs_troll'
 const luck=ctx.roster.warbandTemplateId==='dwarf_slayer_cult'

 return <div className="flex flex-col gap-3">{construct||troll?<label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={flaming} onChange={e=>update(d=>setGroupFlamingCasualty(d,group.id,e.target.checked))}/>Taken out of action by fire or a flaming weapon/spell.</label>:null}
 {(draft.groupInjuries[group.id]??[]).map((die,index)=>{
  const key=`${group.id}:${index}`,used=draft.groupInjuryRerolls?.[key]
  const label=construct?'Construct':'Damnable Luck'
  if(used)return <p className="text-xs" key={key}>{used.label}: D6 {used.original} → {used.result}; the second result stands.</p>
  if(!construct&&!luck||die===null||troll||construct&&flaming||luck&&(!derived.injuries.complete||die>2||draft.medicalAidUsed?.damnable_luck))return null
  return <DieField key={key} label={`${label}: optional replacement D6 for casualty ${index+1}`} sides={6} value={null} rollable onChange={result=>{if(result!==null)update(d=>{if(d.groupInjuryRerolls?.[key]||luck&&d.medicalAidUsed?.damnable_luck)return d;const next=setGroupInjuryRoll(d,group.id,index,result);return {...next,groupInjuryRerolls:{...d.groupInjuryRerolls,[key]:{original:die,result,label}},medicalAidUsed:luck?{...d.medicalAidUsed,damnable_luck:key}:d.medicalAidUsed}})}}/>
 })}
 {(draft.groupInjuries[group.id]??[]).flatMap((_,index)=>groupMedicalAidOptions(ctx,draft,derived.injuries,group.id,index).map(aid=><div key={`${index}:${aid.id}:${aid.kind}`}><p className="text-sm">{aid.name} — casualty {index+1}</p>{aid.kind==='die'?<DieField label="Replacement injury D6" sides={6} rollable value={null} onChange={v=>{if(v!==null)update(d=>applyGroupMedicalAid(d,group.id,index,aid,v))}}/>:<div className="flex gap-2">{[-1,1].map(v=><Button key={v} variant="secondary" onClick={()=>update(d=>applyGroupMedicalAid(d,group.id,index,aid,v))}>{v<0?'Subtract 1':'Add 1'}</Button>)}</div>}</div>))}
 </div>
}
