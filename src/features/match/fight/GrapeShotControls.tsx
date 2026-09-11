import { useState } from 'react'
import { confirmGrapeShotSpread, startGrapeShotSpread, grapeShotTargets, unresolvedGrapeShotTargets, type GrapeShotSpread, type GrapeShotCandidate, type LineShotTarget, type BattleLiveState, type BattleEventRow } from '../../../domain'
import { Button, DieField, NumberField, Sheet } from '../../../ui'
import type { Combatant } from './combatants'

export function GrapeShotControls({ attacker, models, sheet, events, readOnly, edit, onResolve }: {
  attacker: Combatant; models: Combatant[]; sheet: BattleLiveState; events: BattleEventRow[]; readOnly: boolean;
  edit?: (fn: (s: BattleLiveState) => BattleLiveState) => void; onResolve: (spread: GrapeShotSpread, target: LineShotTarget) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const spreads = sheet.grapeShotSpreads.filter(s => s.warriorId === attacker.id && sheet.blackpowderShots.some(shot => shot.id === s.shotId && !shot.correction))
  const active = spreads.find(s => s.shotId === selected)
  return <div className="flex flex-col gap-3 rounded border border-brass p-3 text-xs">
    <p className="font-semibold">Grape Shot additional hits</p>
    <p>After the primary hit, roll D6 and resolve the nearest eligible enemies within 4 inches and line of sight. Hidden models count. Cover is allowed only if the primary target was in cover.</p>
    {spreads.map(s => <div key={s.shotId} className="flex flex-col gap-2 border-t border-border pt-2">
      <p>Primary target: {s.primary.name}.</p>
      {s.die === undefined ? <Button variant="secondary" disabled={readOnly || !edit} onClick={() => setSelected(s.shotId)}>Resolve Grape Shot spread</Button> : <p>{unresolvedGrapeShotTargets(s, events).length} of {s.targets?.length ?? 0} additional hits left.</p>}
      {unresolvedGrapeShotTargets(s, events).map(t => <Button key={t.key} variant="secondary" disabled={readOnly || !models.some(m => m.id === t.warriorId && m.warbandId === t.warbandId)} onClick={() => onResolve(s, t)}>Resolve Grape Shot: {t.name}</Button>)}
    </div>)}
    {active && edit && !readOnly ? <SpreadTest key={active.shotId} spread={active} models={models} edit={edit} close={() => setSelected(null)} /> : null}
  </div>
}

function SpreadTest({ spread, models, edit, close }: { spread: GrapeShotSpread; models: Combatant[]; edit: (fn: (s: BattleLiveState) => BattleLiveState) => void; close: () => void }) {
  const [original, setOriginal] = useState(spread.original)
  const [die, setDie] = useState<number | null>(spread.original ?? null)
  const [candidates, setCandidates] = useState<GrapeShotCandidate[]>([])
  const options = models.filter(m => !m.out && m.warbandId !== spread.warbandId).flatMap(m => Array.from({ length: m.kind === 'henchman' ? Math.max(1, m.groupSize ?? 1) : 1 }, (_, n) => ({ key: `${m.warbandId}:${m.id}:${n}`, warriorId: m.id, warbandId: m.warbandId, name: `${m.name}${(m.groupSize ?? 1) > 1 ? ` (model ${n + 1})` : ''}` }))).filter(t => t.key !== spread.primary.key)
  const hits = die === null ? [] : grapeShotTargets(spread.primary, spread.primaryInCover, die, candidates)
  return <Sheet open title="Grape Shot spread" onClose={close} footer={<Button block disabled={die === null} onClick={() => { edit(s => confirmGrapeShotSpread(startGrapeShotSpread(s, { ...spread, original }), spread.shotId, die!, candidates)); close() }}>Confirm additional hits</Button>}>
    <div className="flex flex-col gap-4 p-4">
      <DieField label="Grape Shot additional hits D6" sides={6} value={die} onChange={setDie} />
      <Button variant="secondary" disabled={original !== undefined} onClick={() => { const n = 1 + Math.floor(Math.random() * 6); setOriginal(n); setDie(n); edit(s => startGrapeShotSpread(s, { ...spread, original: n })) }}>Roll additional hits</Button>
      {original !== undefined ? <p className="text-sm">App rolled {original}. Changes are recorded with the original.</p> : null}
      <p className="text-sm">Add every nearby enemy in line of sight, including hidden enemies. Enter distance from {spread.primary.name}. For equal distances, select the models in your agreed order. The app picks the nearest {die ?? 'D6'} eligible models.</p>
      {options.map(t => { const c = candidates.find(c => c.key === t.key); return <div key={t.key} className="rounded border border-border p-3">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(c)} onChange={e => setCandidates(old => e.target.checked ? [...old, { ...t, distance: 4, enemy: true, inLineOfSight: true, inCover: false }] : old.filter(c => c.key !== t.key))} />{t.name}</label>
        {c ? <div className="flex flex-col gap-2"><NumberField label={`Distance from primary target: ${t.name}`} value={c.distance} onChange={v => setCandidates(old => old.map(c => c.key === t.key ? { ...c, distance: Math.max(0, v ?? 0) } : c))} /><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={c.inCover} onChange={e => setCandidates(old => old.map(c => c.key === t.key ? { ...c, inCover: e.target.checked } : c))} />In cover</label><p className="text-sm">{hits.some(h => h.key === t.key) ? 'Will take one automatic hit' : 'Not among the eligible hits'}</p></div> : null}
      </div> })}
      <p className="text-sm">{hits.length ? `Additional hits: ${hits.map(t => t.name).join(', ')}.` : 'No additional victims selected.'}</p>
    </div>
  </Sheet>
}
