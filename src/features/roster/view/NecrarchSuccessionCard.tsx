import { useState } from 'react'
import type { WarbandDetail } from '../../../api/warbands'
import { useRosterEvent } from '../../../api/rosterEvents'
import { canCreateNecrarchThrall, createNecrarchThrall } from '../../../rules/resolve/necrarchSuccession'
import { Button, Notice, SelectField } from '../../../ui'
import { Card, Section } from './bits'
export function NecrarchSuccessionCard({detail,canEdit,onError}:{detail:WarbandDetail;canEdit:boolean;onError:(s:string|null)=>void}) {
 const [choice,setChoice]=useState(''),save=useRosterEvent(detail)
 if(!canEdit||!canCreateNecrarchThrall(detail.roster))return null
 const acolytes=detail.roster.heroes.filter(h=>h.status==='active'&&h.unitTemplateId==='necrarchs_acolytes')
 return <Section title="Create a new Thrall"><Card className="flex flex-col gap-3 px-4 py-3">
  <p className="text-sm">The former Thrall now leads the warband. An Acolyte may take the empty Thrall position, keeping their earned profile and gaining Fear, immunity to Poison and Psychology, and No Pain.</p>
  {acolytes.length?<><SelectField label="Acolyte to become a Thrall" value={choice} onChange={e=>setChoice(e.target.value)}><option value="">Choose an Acolyte</option>{acolytes.map(h=><option key={h.id} value={h.id}>{h.name} · {h.xp} XP</option>)}</SelectField>
  <Button disabled={!acolytes.some(h=>h.id===choice)} pending={save.isPending} onClick={async()=>{onError(null);try{const r=createNecrarchThrall(detail.roster,choice);await save.mutateAsync({next:r.value,reason:r.events[0].message});setChoice('')}catch(e){onError(e instanceof Error?e.message:'Could not create the Thrall.')}}}>Confirm new Thrall</Button></>:<Notice>There are no active Acolytes to take this position.</Notice>}
 </Card></Section>
}
