import { useMemo, useState } from 'react'
import { SKILLS } from '../../rules/data/skills'
import { skillAvailableTo } from '../../rules/engine/skillSensitivity'
import type { Stats } from '../../rules/types'
import { SelectField } from '../../ui'
import { Card, Section } from '../roster/view/bits'
import { STATS_1_TO_10, toCharacter, type FightSetup } from '../match/fight/odds'
import { atOpponent, reverseSetup, stageOdds, withUpgrade, type AttackMeasure, type Direction, type StageResult, type Upgrade } from './statistics'

const pct = (p: number) => `${(p * 100).toFixed(1)}%`
const stats: (keyof Stats)[] = ['WS', 'BS', 'S', 'T', 'W', 'A', 'I', 'Ld']

export function SimulatorTabs<T extends string>({ label, value, options, onChange, compact = false }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; compact?: boolean
}) {
  return <div role="group" aria-label={label} className={compact ? 'inline-flex rounded-md border border-border p-0.5' : 'flex rounded-lg border border-border bg-surface-low p-1'}>
    {options.map((o) => <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
      className={`${compact ? 'min-h-9 px-2 text-xs' : 'min-h-11 flex-1 px-3 text-sm'} rounded-md transition-colors ${value === o.value ? 'bg-surface-high font-semibold text-ink shadow-sm' : 'text-ink-dim hover:text-ink'}`}>{o.label}</button>)}
  </div>
}

function ProbabilityTable({ label, characteristic, results, stage, selected, onSelect }: {
  label: string; characteristic: string; results: StageResult[]; stage: 'hit' | 'wound'; selected: number; onSelect: (n: number) => void
}) {
  return <div className="min-w-0"><h3 className="mb-2 text-sm font-semibold text-ink">{label}</h3>
    <table className="w-full table-fixed text-sm tabular-nums"><thead><tr className="border-b border-border text-xs text-ink-dim">
      <th className="py-2 text-left" scope="col">Opponent {characteristic}</th><th scope="col">At least 1</th><th scope="col">All attacks</th>
    </tr></thead><tbody>{results.map((r, i) => <tr key={i} onClick={() => onSelect(i + 1)} className={`cursor-pointer border-b border-border/40 ${selected === i + 1 ? 'bg-blue-600 font-semibold text-white' : 'text-ink hover:bg-surface-high'}`}>
      <th scope="row"><button type="button" aria-label={`Select opponent ${characteristic} ${i + 1}`} aria-pressed={selected === i + 1} onClick={() => onSelect(i + 1)} className="min-h-10 w-full px-2 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px]">{i + 1}</button></th>
      <td className="text-center">{pct(r[stage].any)}</td><td className="text-center">{pct(r[stage].all)}</td>
    </tr>)}</tbody></table>
  </div>
}

function Change({ before, after, defensive }: { before: number; after: number; defensive: boolean }) {
  const improvement = (defensive ? before - after : after - before) * 100
  return <div className="py-2 text-right tabular-nums"><span className="whitespace-nowrap text-ink">{pct(before)} → <strong>{pct(after)}</strong></span>
    <span className={`block text-[11px] ${improvement > 0.05 ? 'text-ok' : improvement < -0.05 ? 'text-accent' : 'text-ink-dim'}`}>
      {Math.abs(improvement) < 0.05 ? 'No change' : `${Math.abs(improvement).toFixed(1)} percentage points ${improvement > 0 ? 'better' : 'worse'}`}
    </span></div>
}

export function StatisticsView({ setup, reverse, simulation = false }: { setup: FightSetup; reverse?: FightSetup; simulation?: boolean }) {
  const [direction, setDirection] = useState<Direction>('attacking')
  const [incoming, setIncoming] = useState(1)
  const [selections, setSelections] = useState({ attacking: { ws: 3, power: 3 }, defending: { ws: 3, power: 3 } })
  const [ooaWsOverrides, setOoaWsOverrides] = useState<Record<Direction, number | '' | null>>({ attacking: null, defending: null })
  const [gainType, setGainType] = useState<'stats' | 'skills'>('stats')
  const [measure, setMeasure] = useState<AttackMeasure>('any')
  const [stat, setStat] = useState<keyof Stats>('WS')
  const [skillId, setSkillId] = useState('')
  const [respectTables, setRespectTables] = useState(true)
  const [conditionOn, setConditionOn] = useState(false)
  const defensive = direction === 'defending'
  const selection = selections[direction]
  const baseSetup = useMemo(() => defensive ? simulation && reverse ? reverse : reverseSetup(setup, simulation ? undefined : incoming) : setup, [setup, reverse, defensive, simulation, incoming])
  const reference = simulation ? { ws: defensive ? baseSetup.attacker.stats.WS : baseSetup.defender.stats.WS, power: defensive ? baseSetup.attacker.stats.S : baseSetup.defender.stats.T } : selection
  const ooaWs = ooaWsOverrides[direction] === '' ? reference.ws : ooaWsOverrides[direction] ?? reference.ws
  const model = setup.attacker
  const skills = SKILLS.filter((s) => s.modeled && !model.skillIds.includes(s.id) && (!respectTables || skillAvailableTo(s, toCharacter(model, setup.attackerKit))))
  const selectedSkill = skills.find((s) => s.id === skillId) ?? skills[0]
  const upgradeSkillId = selectedSkill?.id
  const condition = gainType === 'skills' ? selectedSkill?.conditionField : undefined
  const calculations = (() => {
    const effectiveSetup = condition ? { ...baseSetup, context: { ...baseSetup.context, [condition]: conditionOn } } : baseSetup
    const upgrade: Upgrade | undefined = gainType === 'stats' ? { stat } : upgradeSkillId ? { skill: upgradeSkillId } : undefined
    const at = (ws: number, power: number) => atOpponent(effectiveSetup, direction, ws, power)
    const selected = stageOdds(at(reference.ws, reference.power))
    const hit = simulation ? [selected] : STATS_1_TO_10.map((ws) => stageOdds(at(ws, reference.power)))
    const wound = simulation ? [selected] : STATS_1_TO_10.map((power) => stageOdds(at(reference.ws, power)))
    const changed = upgrade ? withUpgrade(effectiveSetup, direction, upgrade) : effectiveSetup
    const afterAt = (ws: number, power: number) => stageOdds(atOpponent(changed, direction, ws, power))
    const ooaPowers = simulation ? [reference.power] : STATS_1_TO_10
    const ooa = ooaPowers.map((power) => stageOdds(at(ooaWs, power)))
    const afterOoa = ooaPowers.map((power) => afterAt(ooaWs, power))
    return { selected, hit, wound, ooa, afterOoa, afterHit: simulation ? [afterAt(reference.ws, reference.power)] : STATS_1_TO_10.map((ws) => afterAt(ws, reference.power)),
      afterWound: simulation ? [afterAt(reference.ws, reference.power)] : STATS_1_TO_10.map((power) => afterAt(reference.ws, power)) }
  })()
  const setSelection = (key: 'ws' | 'power', value: number) => setSelections((current) => ({ ...current, [direction]: { ...current[direction], [key]: value } }))
  const hitLabel = defensive ? 'Chance to be hit' : 'Chance to hit'
  const woundLabel = defensive ? 'Chance to be wounded' : 'Chance to wound'
  const ooaLabel = defensive ? 'Chance to be taken OOA' : 'Chance to take OOA'
  const powerLabel = defensive ? 'Strength' : 'Toughness'

  return <div className="flex min-w-0 flex-col gap-5">
    <SimulatorTabs label="Statistics direction" value={direction} onChange={setDirection} options={[{ value: 'attacking', label: 'Attacking' }, { value: 'defending', label: 'Defending' }]} />
    {!simulation && <>
      {defensive && <div className="flex items-center justify-between gap-3"><label htmlFor="incoming-attacks" className="text-sm text-ink">Incoming attacks</label><input id="incoming-attacks" type="number" min={1} max={20} value={incoming} onChange={(e) => setIncoming(Math.max(1, Math.min(20, Math.floor(Number(e.target.value)) || 1)))} className="w-20 rounded-md border border-border bg-surface px-3 py-2 text-ink" /></div>}
      <Section title="Probability By Stage"><Card className="flex flex-col gap-3 p-4">
        <p className="text-sm text-ink-dim">Opponent WS {reference.ws} · {powerLabel} {reference.power} · {calculations.selected.attacks} attacks</p>
        <div className="grid grid-cols-3 gap-2">{[
          { label: 'At least one', value: calculations.selected.combined.any, detail: 'Hits and wounds' },
          { label: 'All attacks', value: calculations.selected.combined.all, detail: 'Hit and wound' },
          { label: 'OOA Chance', value: calculations.selected.ooa, detail: 'Whole phase' },
        ].map((tile) => <div key={tile.label} className="rounded-md bg-surface-low p-2 text-center"><p className="text-xs text-ink-dim">{tile.label}</p><p className="my-1 text-xl font-semibold tabular-nums text-ink">{pct(tile.value)}</p><p className="text-[10px] text-ink-dim">{tile.detail}</p></div>)}</div>
        <p className="text-xs text-ink-dim">Hit and wound figures are before parries and saves. OOA includes saves, critical hits, injuries and remaining Wounds.</p>
      </Card></Section>
      <p className="text-xs text-ink-dim">Select a row in each table to change the combination above. Wound chances assume the attacks have hit.</p>
      {baseSetup.primary.type === 'ranged' && <p className="text-xs text-ink-dim">Shooting uses Ballistic Skill; opponent WS does not change the chance to hit.</p>}
      <div className="grid gap-5 md:grid-cols-2">
        <ProbabilityTable label={hitLabel} characteristic="WS" results={calculations.hit} stage="hit" selected={reference.ws} onSelect={(v) => setSelection('ws', v)} />
        <ProbabilityTable label={woundLabel} characteristic={powerLabel} results={calculations.wound} stage="wound" selected={reference.power} onSelect={(v) => setSelection('power', v)} />
      </div>
      <details className="rounded-md border border-border p-3 text-xs text-ink-dim"><summary className="cursor-pointer text-sm">Calculation assumptions</summary>
        <p className="mt-2">{defensive ? `Incoming hand-to-hand attacks use a hammer, no skills or off-hand weapon, against ${model.name}’s current equipment and remaining Wounds.` : 'The reference opponent is standing, with one Wound, no armour, skills, parry or special saves. Your chosen weapons and situation apply.'} Each row changes only the named characteristic. The wound table assumes every allocated attack hits, preserving the mix of weapons.</p>
        {calculations.selected.notes.map((note, i) => <p className="mt-1" key={i}>{note}</p>)}
      </details>
    </>}
    <Section title="Explore an upgrade"><Card className="flex min-w-0 flex-col gap-4 p-3 sm:p-4">
      <p className="text-sm text-ink-dim">What one upgrade would change for {model.name}{simulation ? ` against ${setup.defender.name}` : ''}. Before → after, with the improvement in percentage points.</p>
      <SimulatorTabs label="Upgrade type" value={gainType} onChange={setGainType} options={[{ value: 'stats', label: 'Stat gains' }, { value: 'skills', label: 'Skill gains' }]} />
      {gainType === 'stats' ? <SelectField label="Characteristic to improve" value={stat} onChange={(e) => setStat(e.target.value as keyof Stats)}>{stats.map((s) => <option key={s} value={s}>+1 {s}</option>)}</SelectField> : <>
        <label className="flex min-h-9 items-center gap-2 text-sm text-ink"><input type="checkbox" checked={respectTables} onChange={(e) => setRespectTables(e.target.checked)} />Only skills on this warrior’s lists</label>
        <SelectField label="Skill to explore" value={selectedSkill?.id ?? ''} onChange={(e) => { setSkillId(e.target.value); setConditionOn(false) }}>{skills.length ? skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="">No modelled skills available</option>}</SelectField>
        {selectedSkill && <p className="text-xs text-ink-dim">{selectedSkill.description}</p>}
        {condition && <label className="flex min-h-9 items-center gap-2 text-sm text-ink"><input type="checkbox" checked={conditionOn} onChange={(e) => setConditionOn(e.target.checked)} />Apply skill situation: {condition.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>}
      </>}
      <div className="flex justify-end"><SimulatorTabs compact label="Upgrade attack measure" value={measure} onChange={setMeasure} options={[{ value: 'any', label: 'At least 1 attack' }, { value: 'all', label: 'All attacks' }]} /></div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">{(['hit', 'wound', 'ooa'] as const).map((stage) => {
        const before = stage === 'hit' ? calculations.hit : stage === 'ooa' ? calculations.ooa : calculations.wound
        const after = stage === 'hit' ? calculations.afterHit : stage === 'ooa' ? calculations.afterOoa : calculations.afterWound
        return <div key={stage} className="min-w-0"><div className="flex min-h-9 items-center justify-between gap-2"><h3 className="text-sm font-semibold text-ink">{stage === 'hit' ? hitLabel : stage === 'wound' ? woundLabel : ooaLabel}</h3>
          {stage === 'ooa' && <label className="flex shrink-0 items-center gap-1 text-xs text-ink-dim">WS
            <input type="number" inputMode="numeric" min={1} max={10} step={1} aria-label="OOA comparison opponent WS" title="Opponent Weapon Skill for this OOA comparison" value={ooaWsOverrides[direction] ?? reference.ws}
              onChange={(e) => { const value = e.target.value === '' ? '' : Math.max(1, Math.min(10, Math.floor(Number(e.target.value)) || 1)); setOoaWsOverrides((current) => ({ ...current, [direction]: value })) }}
              onBlur={() => { if (ooaWsOverrides[direction] === '') setOoaWsOverrides((current) => ({ ...current, [direction]: null })) }}
              className="min-h-9 w-14 rounded-md border border-border bg-surface-low px-2 text-sm tabular-nums text-ink focus:border-brass focus:outline-none" />
          </label>}</div>
          <p className="mb-2 text-[11px] text-ink-dim">{stage === 'ooa' ? `Whole phase · opponent WS ${ooaWs}` : measure === 'any' ? 'At least one attack' : 'All attacks'}</p>
          <table className="w-full text-xs"><thead><tr className="border-b border-border text-ink-dim"><th scope="col" className="py-2 text-left">{simulation ? 'Matchup' : stage === 'hit' ? 'WS' : powerLabel}</th><th scope="col" className="text-right">Before → after</th></tr></thead><tbody>
            {before.map((r, i) => <tr key={i} className="border-b border-border/50"><th scope="row" className="text-left font-normal text-ink">{simulation ? 'Selected' : i + 1}</th><td><Change before={stage === 'ooa' ? r.ooa : r[stage][measure]} after={stage === 'ooa' ? after[i].ooa : after[i][stage][measure]} defensive={defensive} /></td></tr>)}
          </tbody></table></div>
      })}</div>
      <p className="text-xs text-ink-dim">OOA always covers the whole phase; the small attack toggle changes the hit and wound columns. Lower odds are better when defending. These are hypothetical upgrades, not an advancement eligibility check.</p>
    </Card></Section>
  </div>
}
