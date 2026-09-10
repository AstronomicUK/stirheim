import { useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import { diffRoster } from '../../../domain/rosterDiff'
import { findHiredSword } from '../../../rules/data/campaign/hiredSwords'
import { findItem } from '../../../rules/data/items'
import { hiredSwordStartingEquipment, OPTIONAL_HIRED_MOUNTS } from '../../../rules/resolve/recruitment'
import { HIRED_EQUIPMENT_CHOICES } from '../../../rules/resolve/hiredEquipmentChoices'
import { missingHiredEquipment, restoreHiredEquipment } from '../../../rules/resolve/hiredEquipmentReview'
import type { RosterHiredSword, RosterItem } from '../../../rules/types/roster'
import { Button, Notice, SelectField, Sheet, TextField } from '../../../ui'
const name = (i: RosterItem) => i.itemId ? findItem(i.itemId)?.name ?? i.itemId : i.customName ?? 'Equipment'
export function HiredEquipmentReview({detail}:{detail:WarbandDetail}) {
 const [open,setOpen]=useState(false)
 const hires=detail.roster.hiredSwords.filter(h=>h.status==='active'&&!h.flags.hireCompanion)
 return hires.length?<><Button variant="secondary" onClick={()=>setOpen(true)}>Review hired-character equipment</Button>{open?<EquipmentSheet detail={detail} hires={hires} close={()=>setOpen(false)}/>:null}</>:null
}
function EquipmentSheet({detail,hires,close}:{detail:WarbandDetail;hires:RosterHiredSword[];close:()=>void}) {
 const [id,setId]=useState(hires[0].id),[choice,setChoice]=useState(''),[mounted,setMounted]=useState(false),[role,setRole]=useState<'crimson'|'wizard'|'archer'|''>(''),[selected,setSelected]=useState<number[]>([]),[reason,setReason]=useState(''),[error,setError]=useState('')
 const save=useUpdateRoster(detail.warband.id)
 const hire=hires.find(h=>h.id===id)!,entry=findHiredSword(hire.hiredSwordId),options=HIRED_EQUIPMENT_CHOICES[hire.hiredSwordId]
 const activeRole=hire.flags.luthorRole??(role||undefined)
 const ready=(!options||!!choice)&&(hire.hiredSwordId!=='luthor_wolfenbaum'||!!activeRole)
 const expected=ready?hiredSwordStartingEquipment(hire.hiredSwordId,entry?.detail,activeRole,choice||undefined,mounted):[]
 const missing=missingHiredEquipment(hire.equipment,expected)
 const mount=OPTIONAL_HIRED_MOUNTS[hire.hiredSwordId]
 async function confirm(){try{
  if(!reason.trim()||!selected.length)throw new Error('Select the equipment to restore and explain the correction.')
  const equipment=restoreHiredEquipment(hire.equipment,expected,selected)
  const flags=activeRole?{...hire.flags,luthorRole:activeRole}:hire.flags
  const restoredMount=hire.hiredSwordId==='freelancer'&&selected.some(i=>missing[i].itemId==='warhorse')
  const skillIds=restoredMount?[...new Set([...hire.skillIds,'cavalry_ride_warhorse'])]:hire.skillIds
  const next={...detail.roster,hiredSwords:detail.roster.hiredSwords.map(h=>h.id===id?{...h,equipment,flags,skillIds}:h)}
  await save.mutateAsync({reason:`Equipment correction for ${hire.name}: restored ${selected.map(i=>`${missing[i].quantity} × ${name(missing[i])}`).join(', ')}. ${reason.trim()}`,changes:diffRoster(detail,next)});close()
 }catch(e){setError(e instanceof Error?e.message:'Could not save the equipment correction.')}}
 return <Sheet open onClose={close} title="Review hired-character equipment" footer={<Button block pending={save.isPending} disabled={!selected.length||!reason.trim()} onClick={()=>void confirm()}>Restore selected equipment</Button>}>
 <div className="flex flex-col gap-3 pb-3"><p className="text-sm">Use this to correct an older record. Missing equipment may have been lost in play: select only what this character should still own. Existing equipment is kept, and this correction does not charge gold.</p>
 <SelectField label="Hired character" value={id} onChange={e=>{setId(e.target.value);setChoice('');setMounted(false);setRole('');setSelected([]);setError('')}}>{hires.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
 {options?<SelectField label="Original equipment choice" value={choice} onChange={e=>{setChoice(e.target.value);setSelected([])}}><option value="">Choose…</option>{options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</SelectField>:null}
 {hire.hiredSwordId==='luthor_wolfenbaum'&&!hire.flags.luthorRole?<SelectField label="Luthor’s original role" value={role} onChange={e=>{setRole(e.target.value as typeof role);setSelected([])}}><option value="">Choose…</option><option value="crimson">Crimson Blade</option><option value="wizard">Wizard</option><option value="archer">Archer</option></SelectField>:null}
 {mount&&!mount.fromStash?<label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={mounted} onChange={e=>{setMounted(e.target.checked);setSelected([])}}/>Originally recruited with the optional mount</label>:null}
 {missing.map((item,i)=><label key={i} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={selected.includes(i)} onChange={e=>setSelected(e.target.checked?[...selected,i]:selected.filter(n=>n!==i))}/><span>{item.quantity} × {name(item)}{item.notes?<span className="block text-xs text-ink-dim">{item.notes}</span>:null}</span></label>)}
 {ready&&!missing.length?<p className="text-sm">All equipment in this selection is already recorded.</p>:null}
 <TextField label="Reason for equipment correction" value={reason} onChange={e=>setReason(e.target.value)}/>{error?<Notice tone="error">{error}</Notice>:null}
 </div></Sheet>
}
