import { HiredEquipmentReview } from './HiredEquipmentReview'
import { useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import { diffRoster } from '../../../domain/rosterDiff'
import { hireHiredSword } from '../../../rules/resolve/recruitment'
import { hiredSwordStartingSkills } from '../../../rules/resolve/hiredSwordRules'
import { Button, Notice } from '../../../ui'
import { Card, Section } from './bits'
import { skillName } from './lookups'
export function HiredRosterRepairCard({detail,canEdit}:{detail:WarbandDetail;canEdit:boolean}) {
 const save=useUpdateRoster(detail.warband.id),[error,setError]=useState('')
 const repairs=detail.roster.hiredSwords.filter(s=>s.status==='active'&&!s.flags.hireCompanion).map(s=>({s,skills:hiredSwordStartingSkills(s.hiredSwordId).filter(id=>!s.skillIds.includes(id)),companions:['ulli_and_marquand','snake_charmer'].includes(s.hiredSwordId)&&!s.flags.hireGroupId})).filter(r=>r.skills.length||r.companions)
 const scouts=detail.roster.hiredSwords.filter(s=>s.hiredSwordId==='hobgoblin_scout'&&s.status==='active').length
 const missingScouts=detail.roster.hiredSwords.some(s=>s.hiredSwordId==='maglah_khan_s_horde'&&s.status==='active')&&scouts<2
 if(!canEdit)return null
 if(!repairs.length&&!missingScouts)return <HiredEquipmentReview detail={detail}/>
 async function repair(id:string){try{const r=repairs.find(r=>r.s.id===id)!;let next={...detail.roster,hiredSwords:detail.roster.hiredSwords.map(s=>s.id===id?{...s,skillIds:[...s.skillIds,...r.skills]}:s)}
 if(r.companions){const blank={...detail.roster,hiredSwords:[]};const generated=hireHiredSword(blank,r.s.hiredSwordId,id,{feeOverride:0}).value.hiredSwords;next={...next,hiredSwords:[...next.hiredSwords.map(s=>s.id===id?{...s,flags:{...s.flags,hireGroupId:id}}:s),...generated.filter(s=>s.id!==id)]}}
 await save.mutateAsync({reason:'Restored published hired-character starting skills and missing companion records after reviewing the roster.',changes:diffRoster(detail,next)});setError('')
 }catch(e){setError(e instanceof Error?e.message:'Could not restore the details.')}}
 return <Section title="Review hired-character details"><HiredEquipmentReview detail={detail}/>{missingScouts?<Notice tone="warn" title="Maglah needs his retinue">Maglah must have two to five Hobgoblin Scouts. You currently have {scouts}; recruit {2-scouts} more before his next battle.</Notice>:null}{repairs.map(r=><Card key={r.s.id} className="flex flex-col gap-2 p-4"><p className="font-semibold">{r.s.name}</p>{r.skills.length?<p className="text-sm">Published starting skills missing from this record: {r.skills.map(skillName).join(', ')}.</p>:null}{r.companions?<p className="text-sm">This older record is missing {r.s.hiredSwordId==='snake_charmer'?'the three starting snakes':'Ulli’s separate fighter record'}. Restore these only if they are still part of your warband.</p>:null}<Button pending={save.isPending} onClick={()=>void repair(r.s.id)}>Restore these details</Button></Card>)}{error?<Notice tone="error">{error}</Notice>:null}</Section>
}
