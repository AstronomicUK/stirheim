import { useState } from 'react'
import type { WarbandDetail } from '../../../api/warbands'
import { useRosterEvent } from '../../../api/rosterEvents'
import { mazzalupoCommands, resolveSuccessorCommand } from '../../../rules/resolve/mazzalupoCommands'
import { Button, DieField, Notice } from '../../../ui'
import { Card, Section } from './bits'

export function SuccessorCommandCard({detail,canEdit}:{detail:WarbandDetail;canEdit:boolean}) {
  const [die,setDie] = useState<number|null>(null)
  const [history,setHistory] = useState<string[]>([])
  const save = useRosterEvent(detail)
  const hero = detail.roster.heroes.find(h => h.status === 'active' && h.flags.successorCommandPending)
  if (!canEdit || detail.warband.archived || detail.roster.warbandTemplateId !== 'mazzalupo' || !hero) return null
  const command = die !== null && Number.isInteger(die) ? mazzalupoCommands()[die - 1] : undefined
  return <Section title="The new captain’s Command"><Card className="flex flex-col gap-3 px-4 py-3">
    <p>{hero.name} inherits Commands and learns one at random. This does not make them a wizard.</p>
    <DieField label="Successor Command D6" sides={6} value={die} rollable onChange={(n,source)=>{setDie(n);if(n!==null&&Number.isInteger(n)&&n>=1&&n<=6)setHistory(old=>[...old,`${source==='app'?'App rolled':'Player entered'} ${n}`])}} />
    {command?<Notice title={command.name}>{command.text}</Notice>:null}
    <Button disabled={!command} pending={save.isPending} onClick={()=>{const result=resolveSuccessorCommand(detail.roster,hero.id,die!,history.join('; '));save.mutate({next:result.value,reason:result.events[0].message})}}>Confirm Command</Button>
    {save.error?<Notice tone="error">{save.error.message}</Notice>:null}
  </Card></Section>
}
