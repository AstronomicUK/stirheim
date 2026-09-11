import { useState } from 'react'
import type { WarbandDetail } from '../../../api/warbands'
import { useRosterEvent } from '../../../api/rosterEvents'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import { lustrianVacancies, replaceLustrianHero } from '../../../rules/resolve/lustrianPromotion'
import { Button, Notice, SelectField, TextField } from '../../../ui'
import { Card, Section } from './bits'
import { skillTableName } from './lookups'

export function LustrianPromotionCard({detail,canEdit,onError}:{detail:WarbandDetail;canEdit:boolean;onError:(message:string|null)=>void}) {
  const [fallenId,setFallenId]=useState(''),[groupId,setGroupId]=useState(''),[name,setName]=useState(''),[tables,setTables]=useState<string[]>([])
  const save=useRosterEvent(detail)
  const roster=detail.roster, vacancies=lustrianVacancies(roster)
  if(!canEdit||!vacancies.length)return null
  const template=findWarbandTemplate('lustrian_reavers')!
  const groups=roster.henchmenGroups.filter(g=>g.unitTemplateId==='lustrian_reavers_prospects'&&g.size>0)
  const allowed=[...new Set(template.heroTemplates.flatMap(h=>h.skillTableIds))]
  const fallen=vacancies.find(h=>h.id===fallenId)
  const chosenGroup=groups.find(g=>g.id===groupId)
  async function confirm(){
    onError(null)
    try{
      const result=replaceLustrianHero(roster,fallenId,groupId,name,tables,crypto.randomUUID())
      await save.mutateAsync({next:result.value,reason:result.events[0].message})
      setFallenId('');setGroupId('');setName('');setTables([])
    }catch(e){onError(e instanceof Error?e.message:'Could not promote the Prospect.')}
  }
  return <Section title="Replace a lost Hero"><Card className="flex flex-col gap-3 px-4 py-3">
    <p className="text-sm">Rare Heroes cannot be bought again. Promote one Prospect into a lost Hero’s position, keeping the Prospect’s experience and characteristics.</p>
    {!groups.length?<Notice>Recruit a Prospect to fill one of these positions: {vacancies.map(h=>template.heroTemplates.find(t=>t.id===h.unitTemplateId)?.name??h.name).join(', ')}.</Notice>:<>
      <SelectField label="Lost Hero’s position" value={fallenId} onChange={e=>setFallenId(e.target.value)}><option value="">Choose a position</option>{vacancies.map(h=><option key={h.id} value={h.id}>{template.heroTemplates.find(t=>t.id===h.unitTemplateId)?.name} — formerly {h.name}</option>)}</SelectField>
      <SelectField label="Prospect to promote" value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">Choose a Prospect group</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name} · {g.xp} XP</option>)}</SelectField>
      <TextField label="Replacement Hero’s name" value={name} onChange={e=>setName(e.target.value)}/>
      <p className="text-sm">Choose two skill tables · {tables.length} of 2</p>
      <div className="flex flex-wrap gap-2">{allowed.map(id=><button type="button" key={id} aria-pressed={tables.includes(id)} onClick={()=>setTables(old=>old.includes(id)?old.filter(t=>t!==id):old.length<2?[...old,id]:old)} className={`min-h-11 rounded-full border px-4 text-sm ${tables.includes(id)?'border-brass bg-surface-high text-ink':'border-border text-ink-dim'}`}>{skillTableName(id)}</button>)}</div>
      {fallen&&chosenGroup?<Notice title="When you confirm">One member of {chosenGroup.name} becomes the new Hero. Equipment retained with {fallen.name} passes to the replacement; the Prospect’s own equipment goes to the stash. The immediate Hero advance will appear in Advancements. Remaining Prospects do not receive an extra advance.</Notice>:null}
      <Button disabled={!fallen||!chosenGroup||!name.trim()||tables.length!==2} pending={save.isPending} onClick={()=>void confirm()}>Confirm replacement</Button>
    </>}
  </Card></Section>
}
