import { useState } from 'react'
import { WAR_HORNS, correctWarHorn, soundWarHorn, warHornBonus } from '../../../domain/warHorn'
import type { BattleLiveState, ItemRow } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import { findItem } from '../../../rules/data/items'
import { Button, Notice, SelectField, TextField } from '../../../ui'
import { Card } from '../../roster/view/bits'

export function WarHornControl({roster,items,sheet,phaseKey,readOnly,edit}:{roster:RosterWarband;items:readonly ItemRow[];sheet:BattleLiveState;phaseKey:string;readOnly:boolean;edit:(fn:(s:BattleLiveState)=>BattleLiveState)=>void}) {
  const [choice,setChoice]=useState(''),[confirmed,setConfirmed]=useState(false),[error,setError]=useState(''),[reason,setReason]=useState('')
  const members=new Set([...roster.heroes,...roster.hiredSwords].filter(w=>w.status==='active').map(w=>w.id))
  const available=items.filter(row=>row.warband_id===roster.id&&row.quantity>0&&WAR_HORNS.some(id=>id===row.item_rules_id)&&(row.holder_type==='stash'||row.holder_type==='hero'&&members.has(row.holder_id??'')))
    .filter(row=>row.item_rules_id!=='war_horn_of_nagarythe'||roster.warbandTemplateId==='shadow_warriors')
    .filter(row=>row.item_rules_id!=='liturgicus_infecticus'||roster.warbandTemplateId==='skaven_of_clan_pestilens')
    .flatMap(row=>Array.from({length:row.quantity},(_,copyIndex)=>({key:`${row.id}:${copyIndex}`,row,copyIndex,name:findItem(row.item_rules_id!)?.name??'Leadership item'})))
  const unused=available.filter(copy=>!sheet.warHornUses.some(use=>!use.correction&&use.itemRowId===copy.row.id&&use.copyIndex===copy.copyIndex&&(copy.row.item_rules_id!=='liturgicus_infecticus'||use.phaseKey===phaseKey)))
  const selected=unused.find(copy=>copy.key===choice)??unused[0]
  if(!available.length&&!sheet.warHornUses.length)return null
  const active=Boolean(warHornBonus(sheet,phaseKey))
  return <Card><div className="flex flex-col gap-3 p-4 text-sm">
    <h3 className="font-semibold">Warband Leadership items</h3>
    {active?<Notice tone="success">+1 Leadership for the whole warband until the next turn starts. The item remains in inventory.</Notice>:<p>A War Horn can be sounded once per battle, at the beginning of a turn or just before a Rout test. Liturgicus Infecticus is a chant available again in later turns.</p>}
    {phaseKey.startsWith('legacy:')?<p className="text-ink-dim">Without the shared turn tracker, advance the sheet’s turn counter when the next player’s turn starts to end this bonus.</p>:null}
    {!active&&selected?<>
      <SelectField label="Leadership item to use" value={selected.key} disabled={readOnly} onChange={e=>setChoice(e.target.value)}>{unused.map(copy=><option key={copy.key} value={copy.key}>{copy.name}{copy.row.quantity>1?` #${copy.copyIndex+1}`:''} — {copy.row.holder_type==='stash'?'stash':[...roster.heroes,...roster.hiredSwords].find(w=>w.id===copy.row.holder_id)?.name??'warrior'}</option>)}</SelectField>
      <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={readOnly} onChange={e=>setConfirmed(e.target.checked)}/>This is the beginning of the turn or immediately before a Rout test.</label>
      <Button variant="secondary" disabled={readOnly||!confirmed} onClick={()=>{
        const input={id:crypto.randomUUID(),warbandId:roster.id,name:selected.name,copyIndex:selected.copyIndex,phaseKey,confirmedTiming:confirmed}
        try{soundWarHorn(sheet,selected.row,input);edit(s=>soundWarHorn(s,selected.row,input));setConfirmed(false);setError('')}
        catch(e){setError(e instanceof Error?e.message:'Could not record the item.')}
      }}>Activate +1 Leadership</Button>
    </>:!active?<p>No unused horn remains for this battle.</p>:null}
    {error?<Notice tone="error">{error}</Notice>:null}
    {sheet.warHornUses.some(use=>!use.correction)?<details><summary className="cursor-pointer">Recorded uses and corrections</summary>
      <TextField label="Reason for correcting a Leadership item use" value={reason} onChange={e=>setReason(e.target.value)}/>
      {sheet.warHornUses.filter(use=>!use.correction).map(use=><div key={use.id} className="mt-2 flex flex-wrap items-center gap-2"><span>{use.name}: {use.phaseKey===phaseKey?'active':'expired'}</span><Button variant="ghost" disabled={readOnly||!reason.trim()} onClick={()=>edit(s=>correctWarHorn(s,use.id,reason))}>Withdraw {use.name} use</Button></div>)}
    </details>:null}
  </div></Card>
}
