import { useState } from 'react'
import type { MatchParticipantView } from '../../../api/matches'
import { guidingDreamKind, setGuidingDreamTarget, type BattleLiveState } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, Notice, SelectField, TextField } from '../../../ui'
import { useEnemyRosters } from '../fight/useEnemyRosters'

export function GuidingDreamTargets({ matchId, others, roster, sheet, edit }: {
  matchId: string; others: MatchParticipantView[]; roster: RosterWarband; sheet: BattleLiveState;
  edit: (fn: (s: BattleLiveState) => BattleLiveState) => void;
}) {
  const enemies = useEnemyRosters(matchId, others)
  const dreamers = roster.heroes.filter(h => h.status === 'active' && h.unitTemplateId === 'dreamwalkers_dreamer' && ['hit', 'strength', 'frenzy'].includes(guidingDreamKind(sheet, h.id) ?? ''))
  if (!dreamers.length) return null
  const targets = enemies.warbands.flatMap(w => w.roster.heroes.filter(h => h.status === 'active').map(h => ({ id: h.id, warbandId: w.roster.id, name: `${h.name} (${w.roster.name})` })))
  return <Notice tone="info" title="The Hero in the Guiding Dream">
    {enemies.error ? <p>{enemies.error}</p> : enemies.isPending ? <p>Loading enemy Heroes…</p> : !targets.length ? <p>No enemy Heroes are available to designate.</p> : dreamers.map(h => <Target key={h.id} id={h.id} name={h.name} targets={targets} previous={sheet.guidingDreamTargets[h.id]} edit={edit} turn={sheet.turn} />)}
  </Notice>
}

function Target({ id, name, targets, previous, edit, turn }: {
  id: string; name: string; targets: { id: string; warbandId: string; name: string }[];
  previous?: { id: string; warbandId: string; name: string }; turn: number;
  edit: (fn: (s: BattleLiveState) => BattleLiveState) => void;
}) {
  const [selected, setSelected] = useState('')
  const [reason, setReason] = useState('')
  const [changing, setChanging] = useState(false)
  const picked = targets.find(t => `${t.warbandId}:${t.id}` === selected)
  return <div className="flex flex-col gap-3">
    {previous ? <p>{name}’s vision concerns {previous.name}.</p> : <p>Choose one enemy Hero for {name}. The vision’s combat bonus will apply only against this Hero.</p>}
    {previous && !changing ? <Button variant="secondary" onClick={() => setChanging(true)}>Correct the designated Hero</Button> : <>
      <SelectField label={`Enemy Hero for ${name}`} value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose an enemy Hero</option>{targets.map(t => <option key={`${t.warbandId}:${t.id}`} value={`${t.warbandId}:${t.id}`}>{t.name}</option>)}</SelectField>
      {previous ? <TextField label="Reason for changing the vision’s target" value={reason} onChange={e => setReason(e.target.value)} /> : null}
      <Button disabled={!picked || Boolean(previous && !reason.trim())} onClick={() => { if (!picked) return; edit(s => setGuidingDreamTarget(s, id, name, picked, reason, turn)); setChanging(false); setReason('') }}>Record the Hero in the vision</Button>
    </>}
  </div>
}
