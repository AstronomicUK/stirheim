import {useState} from 'react'
import {useRawhideCargo,useDeclareRawhideCargo} from '../../api/rawhide'
import {useWarband} from '../../api/warbands'
import type {MatchSummary} from '../../api/matches'
import {Button,Notice,NumberField,SelectField,TextField} from '../../ui'
import {Card} from '../roster/view/bits'
export function RawhideCargoCard({match}:{match:MatchSummary}) {
 const cargo=useRawhideCargo(match.id,match.state),save=useDeclareRawhideCargo()
 const owned=match.participants.filter(p=>p.mine)
 const [selected,setSelected]=useState(''),[wagon,setWagon]=useState(''),[value,setValue]=useState<number|null>(null),[note,setNote]=useState(''),[rounding,setRounding]=useState<'up'|'down'>('down')
 const merchantId=selected||(cargo.data?.declared?cargo.data.warband_id:owned.length===1?owned[0].warband_id:'')
 const detail=useWarband(owned.some(w=>w.warband_id===merchantId)?merchantId:undefined)
 const declaration=cargo.data?.declared?cargo.data:null
 const editable=!!cargo.data&&match.state==='scheduled'&&owned.some(w=>w.warband_id===merchantId)&&(!declaration||declaration.revealed)
 const roster=detail.data?.roster
 const ready=!!roster&&(roster.warbandTemplateId==='mercenaries_marienburg'||!!note.trim())&&wagon!==''&&(wagon==='empty'||value!=null&&Number.isSafeInteger(value)&&value>=roster.gold&&!!note.trim())
 return <Card className="flex flex-col gap-3 px-4 py-3">
  <p className="font-medium">Rawhide cargo</p>
  <p className="text-sm">The merchant privately chooses one of four wagons for all remaining gold and wyrdstone, or sends four empty wagons. The choice locks when battle starts and is revealed after the battle ends.</p>
  {cargo.isError?<Notice tone="error">{cargo.error.message}</Notice>:null}
  {declaration?<p className="text-sm">Merchant: {match.participants.find(p=>p.warband_id===declaration.warband_id)?.warband_name}. {declaration.locked?'Declaration locked.':'Declaration saved; it can still be reviewed before starting.'}</p>:<p className="text-sm">Waiting for the merchant’s private declaration.</p>}
  {declaration?.revealed?<Notice>{declaration.wagon==null?'All four wagons are empty.':`Wagon ${declaration.wagon}: ${declaration.gold} gc and ${declaration.wyrdstone} wyrdstone. Agreed full cargo value: ${declaration.sale_value} gc; round the 30% profit ${declaration.rounding}.`} {declaration.valuation_note}</Notice>:null}
  {match.state==='scheduled'&&owned.length>1&&!declaration?<SelectField label="Your merchant warband" value={merchantId} onChange={e=>setSelected(e.target.value)}><option value="">Choose…</option>{owned.map(w=><option key={w.warband_id} value={w.warband_id}>{w.warband_name}</option>)}</SelectField>:null}
  {editable?<>
   {roster?<p className="text-sm">Current treasury: {roster.gold} gc and {roster.wyrdstone} wyrdstone. These amounts remain visible on the roster to keep the wagon choice secret, but committed cargo cannot be spent during the battle.</p>:null}
   <SelectField label="Private wagon choice" value={wagon} onChange={e=>setWagon(e.target.value)}><option value="">Choose explicitly…</option><option value="empty">All four wagons empty</option>{[1,2,3,4].map(n=><option key={n} value={n}>Load everything into wagon {n}</option>)}</SelectField>
   {wagon!==''&&wagon!=='empty'?<><NumberField label="Agreed full cargo value (gc)" allowEmpty value={value} onChange={setValue} hint="Include the gold coins plus the agreed normal value of all loaded wyrdstone. This is the value before the extra 30%."/><SelectField label="Round the final sale proceeds" value={rounding} onChange={e=>setRounding(e.target.value as 'up'|'down')}><option value="down">Down to whole gold crowns</option><option value="up">Up to whole gold crowns</option></SelectField></>:null}
   <TextField label="Cargo valuation or agreed setup exception" value={note} onChange={e=>setNote(e.target.value)} hint="Record the agreed wyrdstone valuation. If the merchant is not Marienburgers, record the table’s agreed exception here."/>
   {save.isError?<Notice tone="error">{save.error.message}</Notice>:null}
   <Button variant="secondary" disabled={!ready} pending={save.isPending} onClick={()=>save.mutate({matchId:match.id,warbandId:merchantId,wagon:wagon==='empty'?null:Number(wagon),saleValue:value??0,note,rounding})}>Save private cargo declaration</Button>
  </>:null}
 </Card>
}
