import {useState} from 'react'
import {useSession} from '../../../app/session'
import {useLogBattleEvent} from '../../../api/matches'
import {useSlaaneshiHolds} from '../../../api/slaaneshiHolds'
import {attackEventPayloadSchema} from '../../../domain/battleEvent'
import type {RosterWarband} from '../../../rules/types/roster'
import type {EnemyWarband} from '../fight/useEnemyRosters'
import {combatantsOf} from '../fight/combatants'
import {Button,Notice,SelectField,Sheet,Stepper} from '../../../ui'

/** A tabletop unsaved wound is a hold, not an out-of-action casualty. */
export function TabletopSlaaneshiHold({matchId,roster,enemies,turn,readOnly}:{matchId:string;roster:RosterWarband;enemies:EnemyWarband[];turn:number;readOnly:boolean}){
 const user=useSession(s=>s.user),log=useLogBattleEvent(user?.id),holds=useSlaaneshiHolds(matchId)
 const [open,setOpen]=useState(false),[wielderId,setWielderId]=useState(''),[targetId,setTargetId]=useState(''),[member,setMember]=useState(0),[wounds,setWounds]=useState(1),[alreadyRecorded,setAlreadyRecorded]=useState(false)
 const catchers=roster.heroes.filter(h=>h.status==='active'&&h.unitTemplateId==='court_of_pleasures_whipmaster'&&h.equipment.some(e=>e.quantity>0&&e.itemId?.endsWith('slaaneshi_man_catcher')))
 const wielder=catchers.find(h=>h.id===wielderId)??catchers[0]
 const targets=enemies.flatMap(e=>combatantsOf(e.roster,e.template,e.roster.name,undefined)).filter(c=>!c.out&&c.kind!=='animal'&&!c.traitIds.includes('large_target')&&!c.traitIds.includes('steed'))
 const target=targets.find(c=>c.id===targetId)??targets[0]
 const occupied=holds.data?.some(h=>!h.released_at&&(h.wielder_id===wielder?.id||(h.target_id===target?.id&&h.target_model_index===member)))
 if(!catchers.length)return null
 return <div className="rounded-md border border-brass/40 bg-brass/5 p-3">
  <Button variant="secondary" disabled={readOnly} onClick={()=>setOpen(true)}>Record a tabletop Man-Catcher hold</Button>
  {open?<Sheet open title="A model is held" onClose={()=>setOpen(false)} footer={<Button block disabled={readOnly||log.isPending||holds.isPending||holds.isError||!target||!wielder||occupied} onClick={()=>{
   if(!target||!wielder)return
   const weapon=wielder.equipment.find(e=>e.quantity>0&&e.itemId?.endsWith('slaaneshi_man_catcher'))!.itemId!
   log.mutate({matchId,actorWarbandId:roster.id,payload:attackEventPayloadSchema.parse({attacker_warband_id:roster.id,attacker_id:wielder.id,attacker_kind:'hero',attacker_name:wielder.name,target_warband_id:target.warbandId,target_id:target.id,target_kind:target.kind==='henchman'?'group':'hero',target_name:target.name,target_size:target.groupSize??1,target_model_index:member,turn,wounds_lost:wounds,outcome:'Knocked down',out_of_action:false,kill:false,slaaneshi_lock:{weaponId:weapon,modelIndex:member},metadata_only:alreadyRecorded,rolls:[`Tabletop result confirmed: ${wounds} unsaved wound${wounds===1?'':'s'}. ${alreadyRecorded?'Wounds already recorded on the sheet.':'Wounds added to the sheet.'} No app dice roll.`]})},{onSuccess:()=>{void holds.refetch();setOpen(false)}})
  }}>Confirm unsaved wound and hold</Button>}>
   <p className="mb-4 text-sm text-ink-dim">Use this after resolving the attack and all saves at the table. The target is knocked down and held; this does not count as taking them out of action.</p>
   <SelectField label="Whipmaster" value={wielder?.id??''} onChange={e=>setWielderId(e.target.value)}>{catchers.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
   <SelectField label="Held enemy" value={target?.id??''} onChange={e=>{setTargetId(e.target.value);setMember(0)}}>{targets.map(c=><option key={c.id} value={c.id}>{c.name} · {c.warbandName}</option>)}</SelectField>
   {target?.kind==='henchman'?<SelectField label="Held group member" value={member} onChange={e=>setMember(Number(e.target.value))}>{Array.from({length:target.groupSize??1},(_,i)=><option key={i} value={i}>Model {i+1}</option>)}</SelectField>:null}
   <Stepper label="Unsaved wounds" value={wounds} min={1} max={20} onChange={setWounds}/>
   <label className="my-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={alreadyRecorded} onChange={e=>setAlreadyRecorded(e.target.checked)}/>These wounds are already recorded on the battle sheet</label>
   {occupied?<p className="text-sm">Resolve the existing hold before recording another for this wielder or target.</p>:null}
   {holds.error||log.error?<Notice tone="error" title="Could not record the hold">{holds.error?.message??log.error?.message}</Notice>:null}
  </Sheet>:null}
 </div>
}
