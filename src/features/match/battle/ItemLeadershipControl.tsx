import {warHornBonus} from '../../../domain/warHorn'
import {useState} from 'react'
import type {BattleLiveState} from '../../../domain/battle'
import {beginItemLeadership,rollItemLeadership,confirmItemLeadership,chooseItemLeadershipReroll,correctItemLeadership,type ItemLeadershipTest} from '../../../domain/itemLeadership'
import type {RosterWarband} from '../../../rules/types/roster'
import {Button,DieField,NumberField,SelectField,TextField} from '../../../ui'
import {leadershipItemBenefits,type LeadershipKind} from './leadershipItems'

export function ItemLeadershipControl({roster,warriorId,sheet,readOnly,edit,phaseKey}:{roster:RosterWarband;warriorId:string;phaseKey?:string;sheet:BattleLiveState;readOnly:boolean;edit:(fn:(s:BattleLiveState)=>BattleLiveState)=>void}) {
 const warrior=[...roster.heroes,...roster.hiredSwords,...roster.henchmenGroups].find(w=>w.id===warriorId)
 const [kind,setKind]=useState<LeadershipKind>('allAlone'),[benefitKey,setBenefitKey]=useState(''),[range,setRange]=useState(false),[model,setModel]=useState(0),[ld,setLd]=useState<number|null>(null),[reason,setReason]=useState(''),[otherTest,setOtherTest]=useState(''),[lastCorrection,setLastCorrection]=useState(''),[carried,setCarried]=useState(false)
 const options=leadershipItemBenefits(roster,sheet,warriorId,kind)
 const benefit=options.find(b=>b.key===benefitKey)
 const pending=sheet.itemLeadershipTests.find(t=>t.warriorId===warriorId&&t.modelIndex===model&&t.stage!=='done')
 const last=sheet.itemLeadershipTests.filter(t=>t.warriorId===warriorId&&t.modelIndex===model).at(-1)
 const hasItemBenefit=(['allAlone','fear','other'] as const).some(test=>leadershipItemBenefits(roster,sheet,warriorId,test).length>0)
 if(!warrior||(!hasItemBenefit&&!pending&&!last))return null
 const count='size' in warrior?warrior.size:1,baseLeadership=Math.min(10,warrior.stats.Ld+warHornBonus(sheet,phaseKey)),leadership=ld??baseLeadership
 const label=kind==='allAlone'?'All Alone':kind==='fear'?'Fear':otherTest.trim()
 const valid=Number.isInteger(leadership)&&leadership>=1&&leadership<=10&&(leadership===baseLeadership||reason.trim())&&(!benefit?.range||range)&&(benefit?.itemId!=='sashimono'||count===1||carried)&&Boolean(label)
 return <details className="rounded-md border border-border p-3 text-sm">
  <summary className="cursor-pointer">Leadership item benefits</summary>
  <div className="mt-3 flex flex-col gap-3">
   {count>1?<SelectField label="Model taking the test" value={String(model)} disabled={!!pending} onChange={e=>{setModel(Number(e.target.value));setCarried(false);setRange(false)}}>{Array.from({length:count},(_,i)=><option key={i} value={i}>Model {i+1}</option>)}</SelectField>:null}
   {pending?<PendingItemTest test={pending} edit={edit} readOnly={readOnly}/>:<>
    {last&&!last.correction?<p className="font-medium">Last {last.test}: {last.passed?'passed':'failed'}{last.secondDice?' after the item reroll':''}.</p>:null}
    {last&&!last.correction?<details><summary className="cursor-pointer">Correct the last test</summary><TextField label="Reason for correcting the last test" value={lastCorrection} onChange={e=>setLastCorrection(e.target.value)}/><Button variant="secondary" disabled={readOnly||!lastCorrection.trim()} onClick={()=>edit(s=>correctItemLeadership(s,last.id,lastCorrection))}>Withdraw last test</Button></details>:null}
    <p>Check whether a test is required and any range at the table. Stupidity and Rout have their own controls. Apply movement or charging consequences at the table; for failed Fear when charged, record that condition against the opponent in the attack panel.</p>
    <SelectField label="Leadership test" value={kind} onChange={e=>{setKind(e.target.value as LeadershipKind);setBenefitKey('');setRange(false)}}><option value="allAlone">All Alone</option><option value="fear">Fear</option><option value="other">Other Leadership test (not Rout)</option></SelectField>
    {kind==='other'?<TextField label="Name of the Leadership test" value={otherTest} onChange={e=>setOtherTest(e.target.value)}/>:null}
    <SelectField label="Item benefit" value={benefitKey} onChange={e=>{setBenefitKey(e.target.value);setRange(false)}}><option value="">Choose a benefit</option>{options.map(b=><option key={b.key} value={b.key}>{b.label} · {b.bearer}</option>)}</SelectField>
    {benefit?.range?<label className="flex items-start gap-2"><input type="checkbox" checked={range} onChange={e=>setRange(e.target.checked)}/>This model is within {benefit.range} inches of {benefit.bearer} carrying {benefit.label}.</label>:null}
    {benefit?.itemId==='sashimono'&&count>1?<label className="flex items-start gap-2"><input type="checkbox" checked={carried} onChange={e=>setCarried(e.target.checked)}/>This particular model carries the Sashimono.</label>:null}
    <NumberField label="Leadership used" value={leadership} onChange={setLd}/>
    {leadership!==baseLeadership?<TextField label="Reason for different Leadership (such as a nearby leader)" value={reason} onChange={e=>setReason(e.target.value)}/>:null}
    <Button variant="secondary" disabled={readOnly||!valid||!benefit} onClick={()=>{if(!benefit)return;edit(s=>beginItemLeadership(s,{id:crypto.randomUUID(),warriorId,modelIndex:model,name:`${warrior.name}${count>1?` model ${model+1}`:''}`,test:label,leadership,benefit:{key:benefit.key,label:benefit.label,kind:benefit.kind,condition:`${benefit.range?`Player confirmed within ${benefit.range} inches of ${benefit.bearer}`:`Player confirmed carried by ${warrior.name}${count>1?` model ${model+1}`:""}`}${reason.trim()?`; Leadership adjustment: ${reason.trim()}`:''}`}}))}}>{benefit?.kind==='immune'?'Record immunity — no test':'Begin Leadership test'}</Button>
   </>}
  </div>
 </details>
}
function PendingItemTest({test,edit,readOnly}:{test:ItemLeadershipTest;edit:(fn:(s:BattleLiveState)=>BattleLiveState)=>void;readOnly:boolean}) {
 const [values,setValues]=useState<[number|null,number|null]>([null,null]),[reason,setReason]=useState('')
 const original=test.stage==='second'?test.secondOriginal:test.original
 const faces=values.map((n,i)=>n??original?.[i]??null) as [number|null,number|null]
 return <div className="flex flex-col gap-3">
  <p>{test.test} against Leadership {test.leadership}. {test.benefit?.label}: {test.benefit?.condition}.</p>
  {test.stage==='choice'?<><p>First roll {test.dice?.join(' + ')}: {test.passed?'passed':'failed'}. A reroll must keep the second result.</p><div className="flex flex-wrap gap-2"><Button disabled={readOnly} onClick={()=>{setValues([null,null]);edit(s=>chooseItemLeadershipReroll(s,test.id,true))}}>Use item reroll</Button><Button variant="secondary" disabled={readOnly} onClick={()=>edit(s=>chooseItemLeadershipReroll(s,test.id,false))}>Keep first result</Button></div></>:<>
   {test.stage==='second'?<p>Reroll both dice; this result stands.</p>:null}
   <div className="grid grid-cols-2 gap-3">{([0,1] as const).map(i=><DieField key={i} label={`Leadership ${test.stage==='second'?'reroll ':''}die ${i+1}`} sides={6} value={faces[i]} onChange={n=>setValues(v=>i===0?[n,v[1]]:[v[0],n])}/>)}</div>
   <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={readOnly||!!original} onClick={()=>edit(s=>rollItemLeadership(s,test.id,[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)]))}>Roll 2D6</Button><Button disabled={readOnly||faces.some(n=>n===null||!Number.isInteger(n)||n<1||n>6)} onClick={()=>{edit(s=>confirmItemLeadership(s,test.id,faces as [number,number]));setValues([null,null])}}>Confirm test</Button></div>
   {original?<p className="text-xs text-ink-dim">App rolled {original.join(' + ')}. Any changed dice are recorded.</p>:null}
  </>}
  <details><summary className="cursor-pointer">Correct a mistaken test</summary><TextField label="Reason to withdraw this test" value={reason} onChange={e=>setReason(e.target.value)}/><Button disabled={readOnly||!reason.trim()} variant="secondary" onClick={()=>edit(s=>correctItemLeadership(s,test.id,reason))}>Withdraw test</Button></details>
 </div>
}
