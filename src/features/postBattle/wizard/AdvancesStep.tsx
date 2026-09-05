// Advances earned this battle, rolled right here (Relic & Ruin makes you come back for them).
// Each card runs the same roll / choose flow as the Bestow Advancements screen. A skill or spell
// choice can be left for later ("Pick later"), or the whole advance can wait.

import { useEffect } from 'react'
import { Button, SegmentedControl } from '../../../ui'
import { AdvanceBody } from '../../advances/AdvanceBody'
import { defaultPromotedName, emptyDraft as emptyAdvanceDraft, setStep as setAdvanceStep } from '../../advances/model'
import { Card, Section, Tag } from '../../roster/view/bits'
import { seedAdvance, setAdvanceMode, updateAdvance, type AdvanceMode, type WizardAdvance } from '../model'
import { Intro, type StepProps } from './bits'
import { StepBody } from './WizardShell'

const MODE_OPTIONS: { value: AdvanceMode; label: string }[] = [
  { value: 'now', label: 'Roll now' },
  { value: 'later', label: 'Roll later' },
]

export function AdvancesStep({ derived, update }: StepProps) {
  const { items, rosterAfter } = derived.advances

  // Give every earned advance a stored draft (with a real id for a promoted hero) on first view.
  useEffect(() => {
    for (const item of items) {
      if (item.seeded || !item.subject) continue
      const name = item.subject.kind === 'group' ? defaultPromotedName(item.subject.group, rosterAfter) : ''
      update((d) => seedAdvance(d, item.key, emptyAdvanceDraft(crypto.randomUUID(), name)))
    }
  }, [items, rosterAfter, update])

  return (
    <StepBody title="Advances">
      <Intro>
        {items.length === 0
          ? 'Nobody crossed an experience threshold this battle, so there is nothing to roll.'
          : 'Roll each advance now, or leave it for the roster\'s Bestow advancements screen. A skill or spell can be picked later once the dice are in; the rulebook wants it chosen before the next battle.'}
      </Intro>
      {items.length > 0 ? (
        <Section title="Earned this battle" aside={`${items.length} ${items.length === 1 ? 'advance' : 'advances'}`}>
          {items.map((item) => (
            <AdvanceCard key={item.key} item={item} update={update} />
          ))}
        </Section>
      ) : null}
    </StepBody>
  )
}

function AdvanceCard({ item, update }: { item: WizardAdvance; update: StepProps['update'] }) {
  const { subject, plan } = item
  const kind = subject?.kind === 'group' ? 'Henchman group' : subject?.kind === 'hiredSword' ? 'Hired sword' : 'Hero'
  const editAdvance = (edit: Parameters<typeof updateAdvance>[2]) => update((d) => updateAdvance(d, item.key, edit))
  const setMode = (mode: AdvanceMode) => update((d) => setAdvanceMode(d, item.key, mode))

  if (!subject || !plan) {
    return (
      <Card className="flex flex-col gap-1 px-4 py-3">
        <p className="text-sm text-ink">{item.name}</p>
        <p className="text-xs text-ink-dim">{item.summary}</p>
      </Card>
    )
  }

  const canPickLater = subject.kind !== 'group' && plan.need === 'skill' && plan.roll !== null
  const mode = item.mode
  return (
    <Card className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base text-ink">{item.name}</p>
          <p className="text-xs text-ink-dim">
            {kind} · earned at {item.request.threshold_xp} xp
          </p>
        </div>
        {item.complete ? <Tag tone="brass">{mode === 'later' ? 'Later' : mode === 'pickLater' ? 'Pick later' : 'Done'}</Tag> : <Tag tone="warn">To do</Tag>}
      </div>
      <SegmentedControl label={`${item.name}: when to roll`} options={MODE_OPTIONS} value={mode === 'pickLater' ? 'now' : mode} onChange={setMode} />
      {mode === 'later' ? (
        <p className="text-sm text-ink-dim">Left pending. Roll it from the roster page under Bestow advancements.</p>
      ) : (
        <>
          <AdvanceBody draft={item.draft} plan={plan} subject={subject} step={mode === 'pickLater' ? 'choose' : item.step} update={editAdvance} hideRail />
          {mode === 'pickLater' ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-brass/50 bg-surface-low px-3 py-2 text-sm">
              <span className="text-ink">Skill to be picked later.</span>
              <Button variant="ghost" onClick={() => setMode('now')}>
                Pick it now
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {item.step === 'roll' && plan.total !== null && plan.need !== 'reroll' && plan.error === null ? (
                <Button variant="secondary" onClick={() => editAdvance((d) => setAdvanceStep(d, plan.result && subject.kind === 'group' && plan.roll?.kind === 'statIncrease' ? 'review' : 'choose'))}>
                  Continue
                </Button>
              ) : null}
              {item.step === 'choose' ? (
                <Button variant="ghost" onClick={() => editAdvance((d) => setAdvanceStep(d, 'roll'))}>
                  Change the roll
                </Button>
              ) : null}
              {item.step === 'choose' && plan.result ? (
                <Button variant="secondary" onClick={() => editAdvance((d) => setAdvanceStep(d, 'review'))}>
                  Confirm choice
                </Button>
              ) : null}
              {item.step === 'review' ? (
                <Button variant="ghost" onClick={() => editAdvance((d) => setAdvanceStep(d, 'choose'))}>
                  Change the choice
                </Button>
              ) : null}
              {canPickLater ? (
                <Button variant="ghost" onClick={() => setMode('pickLater')}>
                  Pick the skill later
                </Button>
              ) : null}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
