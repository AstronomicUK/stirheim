import { Stepper } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { setEnemiesOut, setGroupOut, setHeroOut } from '../model'
import { Intro, SwitchRow, type StepProps } from './bits'
import { warriorTypeLabel } from './names'
import { StepBody } from './WizardShell'

export function CasualtiesStep({ draft, derived, ctx, update }: StepProps) {
  const { participants } = derived
  const out = new Set(draft.heroesOut)
  const warriors = [
    ...participants.heroes.map((w) => ({ id: w.id, name: w.name, type: warriorTypeLabel(ctx, w) })),
    ...participants.hiredSwords.map((w) => ({ id: w.id, name: w.name, type: warriorTypeLabel(ctx, w) })),
  ]
  return (
    <StepBody title="Who went down?">
      <Intro>Pre-filled from the battle sheet. Check it against the table before rolling injuries.</Intro>
      <Section title="Heroes & hired swords" aside={`${warriors.filter((w) => out.has(w.id)).length} out of action`}>
        {warriors.length === 0 ? <p className="text-sm text-ink-dim">Nobody fought.</p> : null}
        {warriors.map((w) => (
          <Card key={w.id} className="flex flex-col gap-3 px-4 py-3">
            <SwitchRow label={w.name} description={w.type} checked={out.has(w.id)} onChange={(v) => update((d) => setHeroOut(d, w.id, v))} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-dim">Enemies put out of action</span>
              <Stepper value={draft.enemiesOut[w.id] ?? 0} onChange={(n) => update((d) => setEnemiesOut(d, w.id, n))} label={`enemies out by ${w.name}`} />
            </div>
          </Card>
        ))}
      </Section>
      <Section title="Henchmen" aside={`${Object.values(draft.groupsOut).reduce((n, c) => n + c, 0)} out of action`}>
        {participants.groups.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups fought.</p> : null}
        {participants.groups.map((g) => (
          <Card key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-ink">{g.name}</p>
              <p className="text-xs text-ink-dim">
                {warriorTypeLabel(ctx, g)} · {g.size} {g.size === 1 ? 'model' : 'models'}
              </p>
            </div>
            <Stepper value={draft.groupsOut[g.id] ?? 0} onChange={(n) => update((d) => setGroupOut(d, g.id, n, g.size))} label={`${g.name} out of action`} max={g.size} />
          </Card>
        ))}
      </Section>
      {participants.satOut.length > 0 ? (
        <Section title="Sat this one out">
          <Card>
            <ul className="divide-y divide-border">
              {participants.satOut.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-ink">{s.name}</span>
                  <Tag tone="neutral">{s.reason}</Tag>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}
    </StepBody>
  )
}
