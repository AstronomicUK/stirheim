import { useState } from 'react'
import type { XpLine } from '../../../domain'
import { nextAdvanceAt } from '../../../rules/resolve/advances'
import { Button, NumberField, TextField } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { addXpExtra, removeXpExtra, setUnderdog, type XpExtra } from '../model'
import { Intro, SwitchRow, type StepProps } from './bits'
import { StepBody } from './WizardShell'

export function ExperienceStep({ draft, derived, update }: StepProps) {
  const { lines, underdogAvailable } = derived.xp
  const byId = new Map(lines.map((l) => [l.subjectId, l]))
  const { participants } = derived
  const noXp = (id: string) => !byId.has(id)
  const earnedNothing = [
    ...participants.heroes.filter((h) => noXp(h.id)).map((h) => h.name),
    ...participants.hiredSwords.filter((s) => noXp(s.id)).map((s) => s.name),
    ...participants.groups.filter((g) => noXp(g.id)).map((g) => g.name),
  ]
  const owed = lines.reduce((n, l) => n + l.advancesEarned, 0)

  return (
    <StepBody title="Experience">
      <Intro>+1 for surviving, +1 to the leader for a win, +1 per enemy a hero put out of action. Add anything the scenario awards as an extra line with a reason.</Intro>
      {underdogAvailable > 0 ? (
        <SwitchRow
          label={`Underdog bonus: +${underdogAvailable} to every survivor`}
          description="The opposing warband's rating was higher (rulebook, Underdogs)."
          checked={draft.underdog}
          onChange={(v) => update((d) => setUnderdog(d, v))}
        />
      ) : null}
      <Section title="Awards" aside={owed > 0 ? `${owed} ${owed === 1 ? 'advance' : 'advances'} owed` : undefined}>
        {lines.length === 0 ? <p className="text-sm text-ink-dim">Nobody earns experience this time.</p> : null}
        {lines.map((line) => (
          <XpCard key={line.subjectId} line={line} extras={draft.xpExtras[line.subjectId] ?? []} onAdd={(x) => update((d) => addXpExtra(d, line.subjectId, x))} onRemove={(i) => update((d) => removeXpExtra(d, line.subjectId, i))} />
        ))}
      </Section>
      {earnedNothing.length > 0 ? (
        <p className="text-xs text-ink-dim">No experience for {earnedNothing.join(', ')}: dead, retired or wiped out.</p>
      ) : null}
    </StepBody>
  )
}

interface XpCardProps {
  line: XpLine
  extras: XpExtra[]
  onAdd: (extra: XpExtra) => void
  onRemove: (index: number) => void
}

function XpCard({ line, extras, onAdd, onRemove }: XpCardProps) {
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
          <p className="font-mono text-xs tabular-nums text-ink-dim">
            {line.xpBefore} → {line.xpAfter} xp{next !== null ? ` · next advance at ${next}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-lg tabular-nums text-brass">{line.amount >= 0 ? `+${line.amount}` : line.amount}</span>
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
