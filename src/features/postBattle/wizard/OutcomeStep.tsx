import { Notice, SegmentedControl } from '../../../ui'
import { Card } from '../../roster/view/bits'
import { setResult, setRouted, type ReportResult } from '../model'
import { Intro, Row, SwitchRow, type StepProps } from './bits'
import { StepBody } from './WizardShell'

const RESULTS: { value: ReportResult; label: string }[] = [
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'draw', label: 'Draw' },
]

export function OutcomeStep({ draft, derived, update, mine, opponents }: StepProps) {
  const highest = opponents.reduce<number | null>((best, o) => (best === null || o.rating > best ? o.rating : best), null)
  const bonus = derived.xp.underdogAvailable
  return (
    <StepBody title="How did it go?">
      <Intro>Each side files its own report. Winning gives the leader +1 experience and one more exploration die.</Intro>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-dim">Result for {mine.warband_name}</span>
        <SegmentedControl options={RESULTS} value={draft.result ?? ('' as ReportResult)} onChange={(r) => update((d) => setResult(d, r))} label="Battle result" />
      </div>
      <SwitchRow
        label="The warband routed"
        description="Failed a rout test or withdrew voluntarily. Recorded for the record; it does not change the rules below."
        checked={draft.routed}
        onChange={(routed) => update((d) => setRouted(d, routed))}
      />
      <Card className="px-4 py-2">
        <Row label={`${mine.warband_name} rating`} value={mine.rating} />
        {opponents.map((o) => (
          <Row key={o.warband_id} label={`${o.warband_name} rating`} value={o.rating} dim />
        ))}
      </Card>
      {highest !== null && highest > mine.rating ? (
        <Notice tone="info" title={bonus > 0 ? `Underdog: +${bonus} experience per survivor` : 'Slightly outmatched'}>
          The strongest opponent was rated {highest - mine.rating} higher.{' '}
          {bonus > 0
            ? 'The rulebook gives the underdog’s warriors extra experience; you can switch it off on the Experience step.'
            : 'A difference of 50 or less earns no underdog bonus.'}
        </Notice>
      ) : null}
    </StepBody>
  )
}
