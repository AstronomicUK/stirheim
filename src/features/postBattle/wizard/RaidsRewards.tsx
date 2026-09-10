import {Button,DieField,NumberField,SelectField,TextField} from '../../../ui'
import {raidsRewards,type RaidsDraft,type RaidSurvivors} from '../model/raidsRewards'
import {Card} from '../../roster/view/bits'
export function RaidsRewards({state,survivors,change}:{state:RaidsDraft;survivors:RaidSurvivors;change:(s:RaidsDraft)=>void}) {
 const result=raidsRewards(state,survivors)
 const pool=survivors.groups.slice().sort((a,b)=>a.group.id.localeCompare(b.group.id)).flatMap(({group})=>Array.from({length:Math.max(0,group.size-Math.max(0,state.surrenderedGroups?.[group.id]??0))},(_,i)=>({name:group.name,number:i+1})))
 const selections=[]
 for(let i=0;i<result.targets;i++){
  const row=state.ambush?.[i]??{selection:null,injury:null},remaining=[...pool]
  const picked=row.selection!=null&&Number.isInteger(row.selection)&&row.selection>=1&&row.selection<=pool.length?pool.splice(row.selection-1,1)[0]:null
  selections.push({i,row,remaining,picked})
  if(!picked)break
 }
 function setSelection(i:number,value:number|null){const ambush=(state.ambush??[]).slice(0,i);ambush.push({selection:value,injury:null});change({...state,ambush})}
 return <div className="flex flex-col gap-3">
  <SelectField label="Your Raids role" value={state.role??''} onChange={e=>change({role:e.target.value as RaidsDraft['role']})}><option value="">Choose…</option><option value="raider">Raiding warband</option><option value="townsfolk">Townsfolk</option></SelectField>
  {state.role==='raider'?<>
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.setupConfirmed??false} onChange={e=>change({...state,setupConfirmed:e.target.checked})}/>We had fought at least five battles and our previous battle was not a Raid.</label>
   {!state.setupConfirmed?<TextField label="Agreed Raids setup exception" value={state.setupReason??''} onChange={e=>change({...state,setupReason:e.target.value})}/>:null}
   <p className="text-sm">Record what was actually brought back from the village. Jewellery sells for 5 gc each. Three captured Inhabitants or one Townsman make one resource for a future exploration; it cannot be used in this report.</p>
   <NumberField label="Jewellery brought back" allowEmpty value={state.jewellery??null} onChange={jewellery=>change({...state,jewellery})}/>
   <NumberField label="Inhabitants captured" allowEmpty value={state.inhabitants??null} onChange={inhabitants=>change({...state,inhabitants,ambush:[]})}/>
   <NumberField label="Townsmen captured" allowEmpty value={state.townsmen??null} onChange={townsmen=>change({...state,townsmen,ambush:[]})}/>
   <NumberField label="Buildings burned" allowEmpty value={state.burned??null} onChange={burned=>change({...state,burned,ambush:[]})}/>
   <Card className="flex flex-col gap-3 px-4 py-3"><p className="font-medium">Warriors who surrendered</p><p className="text-sm">Choose only warriors still on the table at the end. They remain on your roster with their equipment, but miss the next two battles.</p>
    {survivors.warriors.filter(w=>w.canSurrender).map(w=><label key={w.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.surrenderedWarriors?.includes(w.id)??false} onChange={e=>change({...state,surrenderedWarriors:e.target.checked?[...(state.surrenderedWarriors??[]),w.id]:(state.surrenderedWarriors??[]).filter(id=>id!==w.id)})}/>{w.name} surrendered</label>)}
    {survivors.groups.filter(g=>g.canSurrender>0).map(({group,canSurrender})=><NumberField key={group.id} label={`${group.name}: surrendered models`} value={state.surrenderedGroups?.[group.id]??0} hint={`Up to ${canSurrender} models still on the table.`} onChange={n=>change({...state,surrenderedGroups:{...state.surrenderedGroups,[group.id]:n??0},ambush:[]})}/>)}
   </Card>
   <DieField label="Covering tracks D6" sides={6} rollable value={state.trackingDie??null} onChange={trackingDie=>change({...state,trackingDie,ambushDie:null,ambush:[]})}/>
   {result.ambushed?<Card className="flex flex-col gap-3 px-4 py-3"><p className="font-medium">The townsfolk ambush your warband</p><p className="text-sm">Subtract captured resources and add burned buildings to the tracking roll. A total of 1 or less triggers the ambush. Randomly select distinct returning henchmen, then resolve each injury.</p>
    <DieField label="Henchmen ambushed D6" sides={6} rollable value={state.ambushDie??null} onChange={ambushDie=>change({...state,ambushDie,ambush:[]})}/>
    {selections.map(({i,row,remaining,picked})=><div key={i} className="flex flex-col gap-2 border-t border-border pt-3"><p className="text-sm">Selection {i+1}: {remaining.map((m,n)=>`${n+1}. ${m.name} (${m.number})`).join('; ')}</p><NumberField label={`Ambush random selection ${i+1}`} allowEmpty value={row.selection} hint={`Record 1–${remaining.length}, or let the app choose uniformly.`} onChange={v=>setSelection(i,v)}/><Button variant="secondary" onClick={()=>setSelection(i,Math.floor(Math.random()*remaining.length)+1)}>Select henchman {i+1} at random</Button>{picked?<><p className="text-sm">Selected: {picked.name}, model {picked.number}</p><DieField label={`Ambush injury ${i+1} D6`} sides={6} rollable value={row.injury} onChange={injury=>{const ambush=[...(state.ambush??[])];ambush[i]={...row,injury};change({...state,ambush})}}/></>:null}</div>)}
   </Card>:null}
  </>:null}
 </div>
}
