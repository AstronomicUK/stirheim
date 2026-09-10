import { KidnappedRewards } from './KidnappedRewards'
import { useState } from 'react'
import type { XpLine } from '../../../domain'
import { nextAdvanceAt } from '../../../rules/resolve/advances'
import { Button, Markdown, NumberField, Notice, TextField, SelectField } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { addXpExtra, removeXpExtra, setUnderdog, type XpExtra } from '../model'
import { Intro, SwitchRow, type StepProps } from './bits'
import { StepBody } from './WizardShell'
import { unitGainsExperience } from '../../../rules/data/campaignRules'
import { scenarioAftermath, type ScenarioAward } from '../../../rules/data/campaign/scenarioAftermath'
import { findScenario } from '../../../rules/data/campaign/scenarios'

export function ExperienceStep({ draft, derived, update, match, ctx }: StepProps) {
  const { lines, underdogAvailable } = derived.xp
  const byId = new Map(lines.map((l) => [l.subjectId, l]))
  const { participants } = derived
  const scenario = scenarioAftermath(match.scenario_rules_id, draft.scenarioMission, draft.scenarioUseBody)
  const scenarioExperience = scenario.selected?.text
  const scenarioTitle = match.scenario_rules_id ? findScenario(match.scenario_rules_id)?.title : undefined
  const noXp = (id: string) => !byId.has(id)
  const byRule = [
    ...participants.heroes.filter((h) => noXp(h.id) && !unitGainsExperience(h.unitTemplateId)).map((h) => h.name),
    ...participants.groups.filter((g) => noXp(g.id) && !unitGainsExperience(g.unitTemplateId)).map((g) => g.name),
  ]
  const earnedNothing = [
    ...participants.heroes.filter((h) => noXp(h.id) && unitGainsExperience(h.unitTemplateId)).map((h) => h.name),
    ...participants.hiredSwords.filter((s) => noXp(s.id)).map((s) => s.name),
    ...participants.groups.filter((g) => noXp(g.id) && unitGainsExperience(g.unitTemplateId)).map((g) => g.name),
  ]
  const owed = lines.reduce((n, l) => n + l.advancesEarned, 0)

  return (
    <StepBody title="Experience">
      <Intro>+{scenario.defaults.survival} for surviving, +{scenario.defaults.leader} to the leader for a win, +{scenario.defaults.kill} per enemy a hero put out of action. These use the selected scenario’s awards. Add objective awards or corrections below with a reason.</Intro>
      {scenario.options.length > 1 ? <SelectField label="Mission played" value={draft.scenarioMission ?? ''} onChange={e => update(d => ({ ...d, scenarioMission: e.target.value }))}><option value="">Choose the mission</option>{scenario.options.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}</SelectField> : null}
      {scenario.conflict ? <Notice tone="warn" title="Conflicting printed awards">
        <p>{scenario.conflict} Choose the interpretation agreed at the table; it will be recorded in the report.</p>
        <SelectField label="Award interpretation" value={draft.scenarioUseBody === undefined ? '' : String(draft.scenarioUseBody)} onChange={e => update(d => ({ ...d, scenarioUseBody: e.target.value === '' ? undefined : e.target.value === 'true' }))}>
          <option value="">Choose the agreed reading</option><option value="false">Use the heading value</option><option value="true">Use the explanatory text</option>
        </SelectField>
      </Notice> : null}
      {scenarioExperience ? (
        <Notice tone="info" title={`${scenarioTitle ?? 'This scenario'}'s own experience rules`}>
          <Markdown source={scenarioExperience} className="text-sm" />
          <p className="mt-2 text-xs text-ink-dim">Survival, winning-leader and ordinary kill awards shown above are already applied. Choose any additional objective awards on the relevant warrior’s card; adjust the amount for repeated deeds.</p>
        </Notice>
      ) : null}
      {underdogAvailable > 0 ? (
        <SwitchRow
          label={`Underdog bonus: +${underdogAvailable} to every survivor`}
          description="The opposing warband's rating was higher (rulebook, Underdogs)."
          checked={draft.underdog}
          onChange={(v) => update((d) => setUnderdog(d, v))}
        />
      ) : null}
      {match.scenario_rules_id === 'the_sword_of_the_herald' && !draft.scenarioNonCampaign ? <Section title="Zombie kills">
        <p className="text-sm text-ink-dim">Each hero earns at most +1 XP for all Zombies taken out. Record how many of their total kills were Zombies.</p>
        {participants.heroes.filter(h => (draft.enemiesOut[h.id] ?? 0) > 0).map(h => <NumberField key={h.id} label={`${h.name}: Zombie kills`} value={draft.scenarioZombieKills?.[h.id] ?? 0} onChange={v => update(d => ({ ...d, scenarioZombieKills: { ...d.scenarioZombieKills, [h.id]: Math.min(d.enemiesOut[h.id] ?? 0, Math.max(0, Math.trunc(v ?? 0))) } }))} />)}
      </Section> : null}
      {match.scenario_rules_id === 'kidnapped' ? <KidnappedRewards draft={draft} derived={derived} ctx={ctx} update={update} /> : null}
      <Section title="Awards" aside={owed > 0 ? `${owed} ${owed === 1 ? 'advance' : 'advances'} owed` : undefined}>
        {lines.length === 0 ? <p className="text-sm text-ink-dim">Nobody earns experience this time.</p> : null}
        {lines.map((line) => (
          <XpCard key={line.subjectId} line={line} suggestions={ctx.scenarioId==='the_hunters_become_the_hunted'?scenario.bonuses.filter(b=>!/cold one/i.test(b.label)):scenario.bonuses} extras={draft.xpExtras[line.subjectId] ?? []} onAdd={(x) => update((d) => addXpExtra(d, line.subjectId, x))} onRemove={(i) => update((d) => removeXpExtra(d, line.subjectId, i))} />
        ))}
      </Section>
      {earnedNothing.length > 0 ? (
        <p className="text-xs text-ink-dim">No experience for {earnedNothing.join(', ')}: dead, retired or wiped out.</p>
      ) : null}
      {byRule.length > 0 ? <p className="text-xs text-ink-dim">{byRule.join(', ')} never gain experience (animals, undead, daemons or constructs by their list).</p> : null}
    </StepBody>
  )
}

interface XpCardProps {
  suggestions: ScenarioAward[]
  line: XpLine
  extras: XpExtra[]
  onAdd: (extra: XpExtra) => void
  onRemove: (index: number) => void
}

function XpCard({ line, extras, onAdd, onRemove, suggestions }: XpCardProps) {
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState<number | null>(1)
  const [reason, setReason] = useState('')
  const role = line.subjectType === 'group' ? 'henchman' : 'hero'
  const next = nextAdvanceAt(role, line.xpAfter)
  const canAdd = amount !== null && Number.isInteger(amount) && amount !== 0 && reason.trim() !== ''

  function add() {
    if (!canAdd) return
    onAdd({ amount: amount!, reason })
    setReason('')
    setAmount(1)
    setAdding(false)
  }

  return (
    <Card className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink">{line.subjectName}</p>
          <p className="text-xs tabular-nums text-ink-dim">
            {line.xpBefore} → {line.xpAfter} xp{next !== null ? ` · next advance at ${next}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-lg tabular-nums text-brass">{line.amount >= 0 ? `+${line.amount}` : line.amount}</span>
          {line.advancesEarned > 0 ? <Tag tone="brass">{line.advancesEarned === 1 ? '1 advance owed' : `${line.advancesEarned} advances owed`}</Tag> : null}
        </div>
      </div>
      <ul className="flex flex-col gap-0.5 text-xs text-ink-dim">
        {line.reasons.map((r, i) => {
          // Extras are the last reasons in the list, in order.
          const extraIndex = i - (line.reasons.length - extras.length)
          return (
            <li key={`${r}-${i}`} className="flex items-center justify-between gap-3">
              <span>{r}</span>
              {extraIndex >= 0 ? (
                <button type="button" onClick={() => onRemove(extraIndex)} className="min-h-8 text-xs text-ink-dim underline-offset-4 hover:text-accent-strong hover:underline">
                  Remove
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
      {adding ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {suggestions.length > 0 ? <SelectField label="Scenario award" value="" onChange={e => { const a = suggestions[Number(e.target.value)]; if (a) { setAmount(a.amount); setReason(`${a.label}: ${a.text}`) } }}>
            <option value="">Choose an award, or enter your own below</option>{suggestions.map((a, i) => <option key={i} value={i}>+{a.amount} {a.label}</option>)}
          </SelectField> : null}
          <div className="grid grid-cols-[5rem_1fr] gap-2">
            <NumberField label="Amount" value={amount} onChange={setAmount} compact />
            <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="carried the shard off the table" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button variant="secondary" disabled={!canAdd} onClick={add}>
              Add line
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="min-h-11 self-start text-xs text-brass underline-offset-4 hover:underline">
          Add scenario experience
        </button>
      )}
    </Card>
  )
}
