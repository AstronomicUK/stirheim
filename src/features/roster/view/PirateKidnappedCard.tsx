import { PirateKitAllocation } from './PirateKitAllocation'
import { useState } from 'react'
import type { WarbandDetail } from '../../../api/warbands'
import { useMatchReports } from '../../../api/reports'
import { useProposeCaptiveOutcome, type CaptiveCase } from '../../../api/captives'
import { buildKidnappedProposal, kidnapSubject, kidnapWinner, pirateCaptainLeadership, useRecordKidnapDice, useRecordKidnapRecovery, useResetKidnapContest, CREW_KIT_ITEM_IDS, type KidnapContest } from '../../../api/pirates'
import { findItem } from '../../../rules/data/items'
import { skillName } from './lookups'
import { Button, DicePicker, DieField, Notice, SelectField, TextField } from '../../../ui'


/**
 * The Pirates' Kidnapped! alternative on a captive case: recovery die for a lost henchman, each
 * player's own Leadership dice, then the Pirate player's proposal of the outcome the dice dictate.
 * `side` is the viewer's relationship to the case; the GM may act for either side.
 */
type PirateKidnappedProps = { item: CaptiveCase; owner?: WarbandDetail; captor: WarbandDetail; side: 'pirates' | 'victim' | null; gm: boolean; otherName: string }
const contestRevision=(item:CaptiveCase)=>item.history.filter(h=>h!==null&&typeof h==='object'&&'event' in h&&h.event==='contest_reset').length
export function PirateKidnappedCard(props:PirateKidnappedProps){return <PirateKidnappedForm key={`${props.item.id}:${props.side}:${contestRevision(props.item)}`} {...props}/>}
function PirateKidnappedForm({ item, owner, captor, side, gm, otherName }: PirateKidnappedProps) {
  const reports = useMatchReports(item.match_id)
  const recovery = useRecordKidnapRecovery(), dice = useRecordKidnapDice(), reset = useResetKidnapContest(), propose = useProposeCaptiveOutcome()
  const [recD, setRecD] = useState<number | null>(null), [recOriginal, setRecOriginal] = useState<number | null>(null)
  const [d1, setD1] = useState<number | null>(null), [d2, setD2] = useState<number | null>(null), [original, setOriginal] = useState<[number, number] | null>(null)
  const [gmSide, setGmSide] = useState<'pirates' | 'victim'>('pirates')
  const [joinGroupId, setJoinGroupId] = useState(''), [kit, setKit] = useState<string[]>(['dagger']), [reason, setReason] = useState('')
  const [newGroupId] = useState(() => crypto.randomUUID())
  const rec = item.recovery as { d6?: number; original?: number | null } | null
  const contest = (item.contest ?? {}) as KidnapContest
  const mySide = side ?? (gm ? gmSide : null)
  const canPirate = side === 'pirates' || gm
  const filed = reports.data ?? []
  const piratesFiled = filed.some(r => r.warband_id === captor.warband.id)
  const winner = kidnapWinner(filed, captor.warband.id, item.victim_warband_id)
  const captainLd = pirateCaptainLeadership(captor.roster)
  const subject = kidnapSubject(item, owner)
  const needsRecovery = item.subject_kind === 'henchman' && !rec
  const needsKit=Boolean((item.model_snapshot as {kit_unresolved?:boolean}|null)?.kit_unresolved)
  const bothRolled = Boolean(contest.pirates && contest.victim)
  const error = recovery.error ?? dice.error ?? reset.error ?? propose.error
  let preview: ReturnType<typeof buildKidnappedProposal> | null = null, previewError = ''
  if (bothRolled && owner && subject && piratesFiled && !needsKit) {
    try { preview = buildKidnappedProposal({ item, owner, captor, winner, joinGroupId: joinGroupId || undefined, kit, newGroupId }) } catch (e) { previewError = e instanceof Error ? e.message : 'Review the contest.' }
  }
  const crewGroups = captor.roster.henchmenGroups.filter(g => g.unitTemplateId === 'pirates_crew' && g.size <= 4)
  // An app roll records its originals; a later hand edit keeps them so the server logs both values.
  return <div className="flex flex-col gap-3 rounded-md border border-border/60 p-3">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h4 className="font-semibold">Kidnapped!</h4>
      <span className="text-xs text-ink-dim">{item.subject_kind === 'henchman' ? 'Lost henchman the Pirates may press-gang' : 'The Pirates’ alternative to ransom, exchange or sale'}</span>
    </div>
    {subject ? <p className="text-sm text-ink-dim">{subject.victim.name}: Leadership {subject.victim.stats.Ld}{subject.victim.skillIds.length ? `, skills ${subject.victim.skillIds.map(skillName).join(', ')}` : ''}. Captain’s Leadership {captainLd ?? '—'}. Battle result on file: {piratesFiled ? winner === 'pirates' ? 'Pirates won (+1)' : winner === 'victim' ? `${otherName} won (+1)` : 'draw' : 'the Pirates have not filed their report yet'}.</p> : null}
    <PirateKitAllocation key={item.id} item={item} canAllocate={gm||side==='victim'||side==='pirates'&&owner?.warband.owner_id===captor.warband.owner_id}/>
    {needsRecovery ? canPirate ? <div className="flex flex-wrap items-end gap-2">
      <DieField label="Recover the body (4+)" sides={6} value={recD} onChange={(v, source) => { setRecD(v); if (source === 'app') setRecOriginal(v) }} rollable />
      <Button variant="secondary" disabled={!recD} pending={recovery.isPending} onClick={() => recovery.mutate({ caseId: item.id, d6: recD!, original: recOriginal })}>Record recovery roll</Button>
    </div> : <p className="text-sm text-ink-dim">Waiting for the Pirate player to roll for the body.</p> : null}
    {rec ? <p className="text-sm">Body recovered on a {rec.d6}{rec.original != null && rec.original !== rec.d6 ? ` (app rolled ${rec.original})` : ''}.</p> : null}
    {!needsRecovery ? <div className="grid gap-2 sm:grid-cols-2">
      {(['pirates', 'victim'] as const).map(s => {
        const roll = contest[s]
        return <div key={s} className="rounded border border-border/60 p-2 text-sm">
          <p className="font-medium">{s === 'pirates' ? captor.warband.name : subject?.victim.name ?? otherName} — 2D6</p>
          {roll ? <p>{roll.dice[0]} + {roll.dice[1]}{roll.original && (roll.original[0] !== roll.dice[0] || roll.original[1] !== roll.dice[1]) ? ` (app rolled ${roll.original.join(' + ')})` : ''}</p> : mySide === s ? <div className="mt-2 flex flex-col gap-3">
            <DicePicker count={2} label="Kidnapped! Leadership dice" resetKey={`${item.id}:${s}:${contestRevision(item)}`} onComplete={(values,manual)=>{setD1(values[0]);setD2(values[1]);if(!manual)setOriginal([values[0],values[1]])}}/>
            <div className="flex flex-wrap items-end gap-2">
            <DieField label="Die 1" sides={6} value={d1} onChange={v => setD1(v)} hideLabel />
            <DieField label="Die 2" sides={6} value={d2} onChange={v => setD2(v)} hideLabel />
            <Button variant="secondary" disabled={!d1 || !d2} pending={dice.isPending} onClick={() => dice.mutate({ caseId: item.id, dice: [d1!, d2!], original, side: gm && !side ? gmSide : undefined })}>Record my dice</Button>
            </div>
            {original && (d1!==original[0] || d2!==original[1]) ? <p className="text-xs text-ink-dim">App rolled {original.join(" + ")}; your edited result is {d1??"—"} + {d2??"—"}. Both will be recorded.</p>:null}
          </div> : <p className="text-ink-dim">Not yet rolled.</p>}
        </div>
      })}
    </div> : null}
    {gm && !side && !bothRolled && !needsRecovery ? <SelectField label="Recording dice for" value={gmSide} onChange={e => {setGmSide(e.target.value as 'pirates' | 'victim');setD1(null);setD2(null);setOriginal(null)}}><option value="pirates">{captor.warband.name}</option><option value="victim">{otherName}</option></SelectField> : null}
    {bothRolled && canPirate ? <>
      {preview?.outcome === 'crew' ? <>
        <SelectField label="Crew group" value={joinGroupId} onChange={e => setJoinGroupId(e.target.value)}><option value="">Form a new Crew group</option>{crewGroups.map(g => <option key={g.id} value={g.id}>Join {g.name} ({g.size} models)</option>)}</SelectField>
        {!joinGroupId ? <fieldset className="flex flex-wrap gap-2 text-sm"><legend className="text-xs uppercase tracking-wider text-ink-dim">Crew kit (even swap, no cost)</legend>
          {CREW_KIT_ITEM_IDS.map(id => <label key={id} className="flex items-center gap-1"><input type="checkbox" checked={kit.includes(id)} onChange={e => setKit(e.target.checked ? [...kit, id] : kit.filter(k => k !== id))} />{findItem(id)?.name ?? id}</label>)}
        </fieldset> : null}
      </> : null}
      {previewError ? <p className="text-sm text-ink-dim">{previewError}</p> : null}
      {preview ? <Notice tone="info" title={preview.outcome === 'crew' ? 'The dice say: joins the Crew' : 'The dice say: becomes a Swabbie'}>{preview.message}</Notice> : null}
      <Button disabled={!preview || !owner} pending={propose.isPending} onClick={() => { if (preview && owner) propose.mutate({ caseId: item.id, choice: preview.choice, owner, captor, nextOwner: preview.nextOwner, nextCaptor: preview.nextCaptor, message: preview.message }) }}>{gm ? 'Record Kidnapped! outcome' : `Propose Kidnapped! outcome to the player of ${otherName}`}</Button>
    </> : null}
    {bothRolled && !canPirate ? <p className="text-sm text-ink-dim">Both sides have rolled. The Pirate player proposes the outcome the dice dictate; you will be asked to accept it.</p> : null}
    {gm && (contest.pirates || contest.victim) ? <div className="flex flex-wrap items-end gap-2">
      <TextField label="Reason to reset the contest (GM)" value={reason} onChange={e => setReason(e.target.value)} />
      <Button variant="ghost" disabled={reason.trim().length < 5} pending={reset.isPending} onClick={() => { reset.mutate({ caseId: item.id, reason }); setReason('') }}>Reset dice</Button>
    </div> : null}
    {error ? <Notice tone="error" title="Could not update Kidnapped!">{error.message}</Notice> : null}
  </div>
}
