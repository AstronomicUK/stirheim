import {useState} from 'react'
import {useTradeWagonCaptures,useSettleTradeWagon,useUndoTradeWagon,type TradeWagonCapture} from '../../../api/tradeWagons'
import {useWarband} from '../../../api/warbands'
import {useMatch} from '../../../api/matches'
import {useCampaign} from '../../../api/campaigns'
import {findItem} from '../../../rules/data/items'
import {Button,Notice,SelectField,TextField} from '../../../ui'
import {Card,Section} from './bits'

export function TradeWagonCard({warbandId,userId}:{warbandId:string;userId?:string}) {
  const query=useTradeWagonCaptures(warbandId)
  if(query.error)return <Notice tone="error" title="Could not load captured wagons">{query.error.message}</Notice>
  if(!query.data?.length)return null
  const pending=query.data.filter(c=>c.state==='pending'),settled=query.data.filter(c=>c.state==='settled')
  return <Section title="Captured Trade Wagons">
    {pending.map(c=><Capture key={c.report_id} capture={c} userId={userId}/>)}
    {settled.length>0?<details><summary className="cursor-pointer py-3 text-sm">Previous capture outcomes ({settled.length})</summary>
      {settled.map(c=><Capture key={`${c.report_id}-${c.state}`} capture={c} userId={userId}/>)}</details>:null}
  </Section>
}
function Capture({capture:c,userId}:{capture:TradeWagonCapture;userId?:string}) {
  const merchant=useWarband(c.merchant_id),captor=useWarband(c.captor_id)
  const match=useMatch(c.match_id,userId),campaign=useCampaign(match.data?.campaign_id)
  const save=useSettleTradeWagon(),undo=useUndoTradeWagon()
  const [kind,setKind]=useState<'ransom'|'keep'>('ransom'),[gold,setGold]=useState('0')
  const [vehicle,setVehicle]=useState<'wagon'|'stagecoach'>('wagon'),[allowed,setAllowed]=useState(false)
  const [reason,setReason]=useState(''),[confirmed,setConfirmed]=useState(false),[undoOpen,setUndoOpen]=useState(false)
  const m=merchant.data?.warband,k=captor.data?.warband
  const permitted=!!userId&&(campaign.data?.campaign.gm_id===userId||(m?.owner_id===userId&&k?.owner_id===userId))
  const amount=gold.trim()===''?NaN:Number(gold),validAmount=Number.isSafeInteger(amount)&&amount>=0&&!!m&&amount<=m.gold
  const busy=save.isPending||undo.isPending
  const pending=c.state==='pending'
  const reset=()=>{setConfirmed(false);save.reset();undo.reset()}
  const error=save.error??undo.error??merchant.error??captor.error??match.error??campaign.error
  return <Card className="mb-3 flex min-w-0 flex-col gap-3 p-4">
    <p className="font-medium">{m?.name??'Merchant Caravan'} → {k?.name??'Capturing warband'}</p>
    <p className="text-sm text-ink-dim">{pending?'Awaiting an agreed outcome. The wagon and this cargo are held aside.':c.settlement?.kind==='ransom'?`Returned for ${c.settlement.gold} gc.`:`Kept as a ${c.settlement?.vehicle==='stagecoach'?'Stage Coach':'Wagon'}.`}</p>
    <details><summary className="cursor-pointer text-sm">View captured wagon and cargo</summary>
      <ul className="mt-2 list-inside list-disc text-sm">
        <li>Trade Wagon with two draft horses</li>
        {c.snapshot.cargo.items.map(i=><li key={i.id}>{i.quantity} × {i.custom_name||findItem(i.item_rules_id??'')?.name||'Equipment'}{i.notes?` — ${i.notes}`:''}</li>)}
        <li>{c.snapshot.cargo.wyrdstone} wyrdstone shards</li>
      </ul><p className="mt-2 text-sm text-ink-dim">Gold crowns are not captured.</p>
    </details>
    {!pending&&c.settlement?<p className="text-sm">{c.settlement.reason}</p>:null}
    {!permitted?<p className="text-sm text-ink-dim">The campaign GM, or an owner of both warbands, records the agreed outcome.</p>:pending?<>
      <SelectField label="Agreed outcome" value={kind} onChange={e=>{setKind(e.target.value as typeof kind);reset()}}>
        <option value="ransom">Return wagon and cargo for a ransom</option><option value="keep">Keep wagon and cargo</option>
      </SelectField>
      {kind==='ransom'?<TextField label="Agreed ransom (gc)" type="number" min="0" step="1" value={gold} onChange={e=>{setGold(e.target.value);reset()}} hint={m?`${m.name} has ${m.gold} gc.`:undefined}/>:<>
        <SelectField label="Keep as" value={vehicle} onChange={e=>{setVehicle(e.target.value as typeof vehicle);reset()}}><option value="wagon">Wagon</option><option value="stagecoach">Stage Coach</option></SelectField>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={allowed} onChange={e=>{setAllowed(e.target.checked);reset()}} className="mt-1"/>I have checked that this warband is allowed to keep this vehicle.</label>
      </>}
      <TextField label="Agreement or ruling to record" value={reason} onChange={e=>{setReason(e.target.value);reset()}}/>
      <p className="text-sm">{kind==='ransom'&&validAmount?`${m!.name} pays ${amount} gc (${m!.gold-amount} gc left). ${k?.name??'The captor'} receives it. All captured equipment and shards return to ${m!.name}.`:kind==='keep'?`${k?.name??'The captor'} receives the wagon, two draft horses, equipment and ${c.snapshot.cargo.wyrdstone} shards. No gold changes hands.`:'Enter an affordable whole-number ransom.'}</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1"/>Both players have agreed to this outcome.</label>
      <Button pending={busy} disabled={!m||!k||!confirmed||!reason.trim()||(kind==='ransom'?!validAmount:!allowed)} onClick={()=>{
        if(!m||!k)return
        const common={reportId:c.report_id,reason,merchantUpdated:m.updated_at,captorUpdated:k.updated_at}
        save.mutate(kind==='ransom'?{...common,kind,gold:amount}:{...common,kind,vehicle,vehicleAllowed:allowed})
      }}>Record agreed outcome</Button>
    </>:<>
      <Button onClick={()=>{setUndoOpen(!undoOpen);setReason('');reset()}}>Correct this outcome</Button>
      {undoOpen?<>
        <TextField label="Reason for undoing the outcome" value={reason} onChange={e=>setReason(e.target.value)}/>
        <p className="text-sm">This returns the capture to awaiting an outcome. Later spending or equipment changes must be reversed first.</p>
        <Button pending={busy} disabled={!reason.trim()} onClick={()=>{if(c.settlement)undo.mutate({reportId:c.report_id,kind:c.settlement.kind,reason})}}>Undo outcome</Button>
      </>:null}
    </>}
    {error?<Notice tone="error" title="Could not complete capture action">{error.message}</Notice>:null}
  </Card>
}
