import type { WarbandDetail } from '../../../api/warbands'
import { useRosterEvent } from '../../../api/rosterEvents'
import type { RosterHiredSword } from '../../../rules/types/roster'
import { Notice,SelectField } from '../../../ui'
export function RetainedScout({detail,hire}:{detail:WarbandDetail;hire:RosterHiredSword}) {
 const scouts=detail.roster.hiredSwords.filter(h=>h.hiredSwordId==='hobgoblin_scout'&&h.status==='active')
 const save=useRosterEvent(detail)
 const selected=scouts.find(h=>h.id===hire.flags.retainedScoutId)?.id??scouts[0]?.id??''
 if(scouts.length<2)return null
 async function choose(id:string){
  const chosen=scouts.find(s=>s.id===id);if(!chosen)return
  try {await save.mutateAsync({reason:`${chosen.name} is chosen to remain if Maglah leaves.`,next:{...detail.roster,hiredSwords:detail.roster.hiredSwords.map(h=>h.id===hire.id?{...h,flags:{...h.flags,retainedScoutId:id}}:h)}})}catch{/* Mutation error is shown below. */}
 }
 return <><SelectField label="Scout who stays if Maglah leaves" value={selected} disabled={save.isPending} onChange={e=>void choose(e.target.value)}>{scouts.map(s=><option key={s.id} value={s.id}>{s.name} ({s.xp} XP)</option>)}</SelectField>{save.error?<Notice tone="error">{save.error.message}</Notice>:null}</>
}
