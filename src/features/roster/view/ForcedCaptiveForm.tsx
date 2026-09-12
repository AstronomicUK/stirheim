import {useState} from 'react'
import {Button, DicePicker, Notice, NumberField, SelectField} from '../../../ui'

export type ForcedCaptiveChoice={kind:'release'|'ransom'|'sell';groupId:string;gold?:number;d6?:number;originalD6?:number|null}
/** One captured henchman is a temporary case, never an extra permanent warband. */
export function ForcedCaptiveForm({name,ownerGold,pending,submitLabel,onSubmit,error}:{name:string;ownerGold:number;pending:boolean;submitLabel:string;onSubmit:(choice:ForcedCaptiveChoice)=>void;error?:string}){
 const [kind,setKind]=useState<ForcedCaptiveChoice['kind']>('release')
 const [gold,setGold]=useState<number|null>(null)
 const [die,setDie]=useState<number|null>(null),[original,setOriginal]=useState<number|null>(null)
 const [groupId]=useState(()=>crypto.randomUUID())
 const valid=kind==='release'||kind==='ransom'&&gold!==null&&Number.isInteger(gold)&&gold>=0&&gold<=ownerGold||kind==='sell'&&die!==null&&Number.isInteger(die)&&die>=1&&die<=6
 return <div className="flex flex-col gap-3 border-t border-border pt-3">
  <SelectField label="Agree what happens to the captive" value={kind} onChange={e=>setKind(e.target.value as ForcedCaptiveChoice['kind'])}>
   <option value="release">Release — return without payment</option>
   <option value="ransom">Ransom — pay for their return</option>
   <option value="sell">Sell — remove the captive permanently</option>
  </SelectField>
  {kind==='ransom'?<NumberField label="Agreed ransom (gc)" value={gold} onChange={setGold} hint={`The captive’s warband has ${ownerGold} gc.`}/>:null}
  <div className={kind==='sell'?'flex flex-col gap-3':'hidden'}>
   <DicePicker label="Captive sale" onComplete={(values,manual)=>{setDie(values[0]);if(!manual)setOriginal(values[0])}}/>
   {die!==null?<NumberField label="Sale die result" value={die} onChange={setDie} hint="D6 × 5 gc. Changes to an app roll stay in the record."/>:null}
   {original!==null&&die!==original?<p className="text-sm text-ink-dim">App rolled {original}; changed to {die??'—'}.</p>:null}
  </div>
  <Notice tone={kind==='sell'?'warn':'info'} title={kind==='sell'?'The captive will not return':'Return with the recorded equipment'}>
   {kind==='sell'?`${name} leaves permanently. The captor receives ${die!==null?die*5:'D6 × 5'} gc and the captive’s recorded equipment.`:`${name} returns with their recorded equipment${kind==='ransom'&&gold!==null?` once ${gold} gc is paid`:''}. If their old group has changed, they return as a separate group with their saved profile.`}
  </Notice>
  <Button pending={pending} disabled={!valid} onClick={()=>onSubmit({kind,groupId,...(kind==='ransom'?{gold:gold!}:{}),...(kind==='sell'?{d6:die!,originalD6:original}:{})})}>{submitLabel}</Button>
  {error?<Notice tone="error" title="Could not propose this outcome">{error}</Notice>:null}
 </div>
}
