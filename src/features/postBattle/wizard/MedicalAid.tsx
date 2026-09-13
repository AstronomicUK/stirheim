import {useState} from 'react'
import {Button,DieField,SelectField} from '../../../ui'
import {medicalAidOptions,applyMedicalAid} from '../model/medicalAid'
import {D66Entry,type StepProps} from './bits'
export function MedicalAid({heroId,...props}:Pick<StepProps,'ctx'|'draft'|'derived'|'update'>&{heroId:string}){
 const [selected,setSelected]=useState(''),[face,setFace]=useState<'tens'|'units'>('units')
 const options=medicalAidOptions(props.ctx,props.draft,props.derived.injuries,heroId)
 if(!options.length)return null
 const aid=options.find(a=>`${a.id}:${a.kind}`===selected)
 const use=(value:number)=>{if(aid)props.update(d=>applyMedicalAid(d,heroId,aid,value,face))}
 return <div className="flex flex-col gap-2 rounded border border-brass p-3"><SelectField label="Medical aid or death reroll" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Keep the injury, or choose available aid</option>{options.map(a=><option key={`${a.id}:${a.kind}`} value={`${a.id}:${a.kind}`}>{a.name}</option>)}</SelectField>{aid?.kind==='reroll'?<D66Entry confirmLabel="Use replacement injury" onCommit={die=>use(die)}/>:aid?<><SelectField label="Which D66 die?" value={face} onChange={e=>setFace(e.target.value as 'tens'|'units')}><option value="tens">Tens die</option><option value="units">Units die</option></SelectField>{aid.kind==='die'?<DieField label="Replacement D6" sides={6} value={null} rollable onChange={v=>{if(v!==null)use(v)}}/>:<div className="flex gap-2"><Button variant="secondary" onClick={()=>use(-1)}>Subtract 1</Button><Button variant="secondary" onClick={()=>use(1)}>Add 1</Button></div>}<p className="text-xs">Dice stay between 1 and 6. This uses the provider’s aid for this battle.</p></>:null}</div>
}
