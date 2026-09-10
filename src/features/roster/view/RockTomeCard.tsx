import { useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import { diffRoster } from '../../../domain/rosterDiff'
import { planRockTome, ROCK_TOME, rockTomeBlocked, rockTomeSources, type RockLesson } from '../../../rules/resolve/rockTome'
import type { WarbandTemplate } from '../../../rules/types'
import { Button, DieField, Notice, SelectField } from '../../../ui'
import { Card, Section } from './bits'
export function RockTomeCard({detail,template,canEdit,onError}:{detail:WarbandDetail;template?:WarbandTemplate;canEdit:boolean;onError:(s:string|null)=>void}) {
  const [readerId,setReaderId]=useState(''),[lessons,setLessons]=useState<RockLesson[]>([{},{}])
  const update=useUpdateRoster(detail.warband.id)
  const roster=detail.roster
  if(!canEdit||![...roster.stash,...roster.heroes.filter(h=>h.status==='active').flatMap(h=>h.equipment),...roster.hiredSwords.filter(h=>h.status==='active').flatMap(h=>h.equipment)].some(i=>i.itemId===ROCK_TOME&&i.quantity>0))return null
  const readers=roster.heroes.filter(h=>rockTomeSources(h,template).length)
  const reader=readers.find(h=>h.id===readerId)
  const sources=reader?rockTomeSources(reader,template):[]
  const plan=planRockTome(roster,readerId,lessons,template)
  const change=(i:number,value:RockLesson)=>setLessons(lessons.map((old,n)=>n===i?value:n>i?{}:old))
  return <Section title="Tome from the Rock"><Card className="flex flex-col gap-3 px-4 py-3">
    <p className="text-sm">Choose one reader and resolve both spells from their own list, Lesser Magic, or one from each. This copy is then marked as read and bound to that warrior.</p>
    {rockTomeBlocked(roster)?<Notice>This warband cannot use this tome: Sisters of Sigmar, Witch Hunters and warbands containing a Priest of Morr are excluded.</Notice>:<>
      <SelectField label="Reader of the Rock tome" value={readerId} onChange={e=>{setReaderId(e.target.value);setLessons([{},{}])}}><option value="">Choose a reader…</option>{readers.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
      {!readers.length?<Notice>A living wizard or warrior with Arcane Lore is needed to read this tome.</Notice>:null}
      {reader?lessons.map((lesson,i)=>{
        const lore=sources.find(l=>l.id===lesson.loreId)
        const spells=lore?.spells.filter(s=>lesson.roll!=null&&lesson.roll>=s.roll.min&&lesson.roll<=s.roll.max)??[]
        return <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <h3 className="font-semibold">Spell {i+1}</h3>
          <SelectField label={`Spell ${i+1} list`} value={lesson.loreId??''} onChange={e=>change(i,{loreId:e.target.value})}><option value="">Choose a list…</option>{sources.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</SelectField>
          {lore?<DieField label={`Spell ${i+1} D6`} sides={6} rollable value={lesson.roll??null} onChange={roll=>change(i,{loreId:lesson.loreId,roll})}/>:null}
          {spells.length>1?<SelectField label={`Spell ${i+1} result`} value={lesson.spellId??''} onChange={e=>change(i,{...lesson,spellId:e.target.value,lowerDifficulty:false})}><option value="">Choose the matching result…</option>{spells.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</SelectField>:spells[0]?<p className="text-sm">{spells[0].name}</p>:null}
          {spells.length?<label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={lesson.lowerDifficulty??false} onChange={e=>change(i,{...lesson,lowerDifficulty:e.target.checked})}/>If already known, reduce its difficulty by 1 instead of rerolling.</label>:null}
        </div>
      }):null}
      {reader&&plan.problems.length?<Notice>{plan.problems.join(' ')}</Notice>:null}
      {plan.notes.map((note,i)=><p key={i} className="text-sm">{note}</p>)}
      <Button disabled={!plan.next} pending={update.isPending} onClick={async()=>{if(!plan.next)return;onError(null);try{await update.mutateAsync({reason:`Read the Tome from the Rock: ${reader?.name}. ${plan.notes.join(' ')}`,changes:diffRoster(detail,plan.next)});setReaderId('');setLessons([{},{}])}catch(e){onError(e instanceof Error?e.message:'Could not record the tome’s spells.')}}}>Record both spells</Button>
    </>}
  </Card></Section>
}
