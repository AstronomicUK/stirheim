import { useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { payHenchmanUpkeep,trollFoodGroups,type HenchmanUpkeepLine,type PayUpkeepOptions } from '../../rules/resolve/recruitment'
import { Button,Notice,NumberField,SelectField,Sheet } from '../../ui'
import { KeyValue } from '../roster/view/bits'
import { useCommit,outcomeFrom,type Outcome } from './useCommit'
export function GroupUpkeepSheet({detail,line,onClose,onDone}:{detail:WarbandDetail;line:HenchmanUpkeepLine;onClose:()=>void;onDone:(outcome:Outcome)=>void}){
 const {roster}=detail
 const {commit,error,pending}=useCommit(detail)
 const [method,setMethod]=useState<NonNullable<PayUpkeepOptions['trollPayment']>>('gold')
 const [food,setFood]=useState<Record<string,number>>({})
 const group=roster.henchmenGroups.find(g=>g.id===line.groupId)!
 const foodGroups=trollFoodGroups(roster,line.groupId)
 const alternative=roster.gold<line.gold
 const opts={trollPayment:method,sacrificeGroups:food}
 let preview:ReturnType<typeof payHenchmanUpkeep>|undefined,problem=''
 try{preview=payHenchmanUpkeep(roster,line.groupId,opts)}catch(e){problem=e instanceof Error?e.message:'Check the upkeep choice.'}
 const willLeave=preview&&!preview.value.paid
 async function confirm(){
  const result=await commit(()=>payHenchmanUpkeep(roster,line.groupId,opts),v=>v.warband)
  if(result)onDone(outcomeFrom(result.value.paid?`${line.name} fed`:`${line.name} leave`,result.events,{tone:result.value.paid?'success':'warn'}))
 }
 return <Sheet open onClose={onClose} title="Henchman upkeep" description={line.name} footer={<Button block variant={willLeave?'danger':'primary'} pending={pending} disabled={!preview} onClick={()=>void confirm()}>{willLeave?'Cannot pay: let them leave':method==='sacrifice'?'Confirm sacrifice':`Pay ${preview?roster.gold-preview.value.warband.gold:line.gold} gc`}</Button>}>
  <div className="flex flex-col gap-4 pb-2">
   <div className="grid grid-cols-2 gap-3"><KeyValue label="Normal upkeep" value={`${line.gold} gc`}/><KeyValue label="Treasury" value={`${roster.gold} gc`}/></div>
   {alternative&&(foodGroups.length>0||group.unitTemplateId==='black_orcs_troll')?<SelectField label="How to feed the Troll" value={method} onChange={e=>setMethod(e.target.value as typeof method)}><option value="gold">Pay normal upkeep, or let them leave</option>{foodGroups.length?<option value="sacrifice">Sacrifice two Goblins / Cave Squigs per Troll</option>:null}{group.unitTemplateId==='black_orcs_troll'?<option value="cheap">Pay 5 gc; Troll counts as two members</option>:null}</SelectField>:null}
   {method==='sacrifice'?<><p className="text-sm">Choose {2*group.size} models in total. Their equipment is lost with them.</p>{foodGroups.map(g=><NumberField key={g.id} label={`${g.name} (${g.size} available)`} value={food[g.id]??0} onChange={n=>setFood(f=>({...f,[g.id]:n??0}))}/>)}</>:null}
   {method==='cheap'?<p className="text-sm">Until paid normally again, each Troll counts as two members for income and the warband’s size limit.</p>:null}
   {preview?.events.map((e,i)=><p key={i} className="text-sm">{e.message}</p>)}
   {problem?<Notice tone="warn">{problem}</Notice>:null}{error?<Notice tone="error">{error}</Notice>:null}
  </div>
 </Sheet>
}
