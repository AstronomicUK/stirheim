import { useState } from 'react'
import { Button, DicePicker, NumberField, SelectField, TextField } from '../../../ui'
import { startPhase, applyRoll, OUTCOME_LABEL, type RollState, type LogLine } from '../fight/rollThrough'
import type { AttackInput } from '../../../rules/engine/resolveAttack'
import { IMPOSSIBLE } from '../../../rules/engine/dice'

/** Damage rolls after a successful cast; the player supplies the spell's explicit target/conditions. */
export function SpellDamage({ spellName, onLog }: { spellName: string; onLog: (lines: LogLine[]) => void }) {
  const [target, setTarget] = useState('')
  const [hits, setHits] = useState<number | null>(1)
  const [wounds, setWounds] = useState<number | null>(1)
  const [toWound, setToWound] = useState('4')
  const [armour, setArmour] = useState('none')
  const [ward, setWard] = useState('none')
  const [run, setRun] = useState<RollState | null>(null)
  const save = (value: string) => value === 'none' ? IMPOSSIBLE : Number(value)
  function roll(value: number, manual?: boolean) {
    if (!run) return
    const next = applyRoll(run, value, manual)
    onLog(next.log.slice(run.log.length)); setRun(next)
  }
  return <details className="border-t border-border pt-3"><summary className="cursor-pointer text-sm text-brass">Resolve spell damage</summary>
    <div className="mt-3 flex flex-col gap-3">
      <p className="text-xs text-ink-dim">For ordinary hits that this spell has already caused, enter the target’s remaining Wounds and the required wound/save rolls after the spell’s modifiers. Spells cannot cause critical hits. Armour saves apply unless the spell says otherwise. Resolve special effects and changes on the table.</p>
      {!run ? <>
        <TextField label="Damage target" value={target} onChange={e => setTarget(e.target.value)} />
        <div className="grid grid-cols-2 gap-3"><NumberField label="Hits caused by the spell" value={hits} onChange={setHits} /><NumberField label="Target’s remaining Wounds" value={wounds} onChange={setWounds} /></div>
        <SelectField label="Required wound roll" value={toWound} onChange={e => setToWound(e.target.value)}>{[2,3,4,5,6].map(n => <option key={n} value={n}>{n}+</option>)}</SelectField>
        <div className="grid grid-cols-2 gap-3">{[{ label: 'Armour save', value: armour, set: setArmour }, { label: 'Applicable ward save', value: ward, set: setWard }].map(field => <SelectField key={field.label} label={field.label} value={field.value} onChange={e => field.set(e.target.value)}><option value="none">No save</option>{[2,3,4,5,6].map(n => <option key={n} value={n}>{n}+</option>)}</SelectField>)}</div>
        <Button variant="secondary" disabled={!target.trim() || !hits || hits < 1 || hits > 30 || !Number.isInteger(hits) || !wounds || wounds < 1 || !Number.isInteger(wounds)} onClick={() => {
          const input: AttackInput = { automaticHits: true, hitThreshold: 2, woundThreshold: Number(toWound), armourThreshold: save(armour), wardSaveThreshold: save(ward), critTriggerFaces: [], critTable: 'standard', critTableRollModifier: 0, injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, parryEligible: false, parrySuccessProbGivenAttempt: 0 }
          const next = startPhase(Array.from({ length: hits! }, () => ({ weaponName: `${spellName} → ${target.trim()}`, input, parry: { beatsOrMatches: false, reroll: false } })), wounds!, 0)
          onLog([{ text: `Spell damage: ${hits} hit(s) on ${target}; ${wounds} Wounds remaining, wound ${toWound}+, armour ${armour}, ward ${ward}; no critical hits.`, tone: 'neutral' }, ...next.log]); setRun(next)
        }}>Roll spell damage</Button>
      </> : <>
        {run.pending ? <><p className="text-sm">{run.pending.label}: {run.pending.detail}</p><DicePicker key={run.log.length} count={1} label={run.pending.label} resetKey={String(run.log.length)} onComplete={(values, manual) => roll(values[0], manual)} /></> : <p className="text-sm">{run.worst ? OUTCOME_LABEL[run.worst] : 'Resolved'} · {run.woundsLost} wound(s) inflicted.</p>}
        {!run.pending ? <Button variant="secondary" onClick={() => setRun(null)}>Resolve another target or damage effect</Button> : null}
      </>}
    </div>
  </details>
}
