import { Notice, SegmentedControl, SelectField, TextField } from '../../../ui'
import { Card } from '../../roster/view/bits'
import { setResult, setRouted, type ReportResult } from '../model'
import { Intro, Row, SwitchRow, type StepProps } from './bits'
import { StepBody } from './WizardShell'

const RESULTS: { value: ReportResult; label: string }[] = [
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'draw', label: 'Draw' },
]

const RESULT_LABEL: Record<ReportResult, string> = { won: 'won', lost: 'lost', draw: 'drew' }

/** Two sides can't both have won, both have lost, or have one call it a draw and the other not. */
function conflicts(mine: ReportResult, theirs: ReportResult): boolean {
  if (mine === 'draw' || theirs === 'draw') return mine !== theirs
  return mine === theirs
}

export function OutcomeStep({ draft, derived, update, mine, opponents, opponentReports, ctx }: StepProps) {
  const highest = opponents.reduce<number | null>((best, o) => (best === null || o.rating > best ? o.rating : best), null)
  const bonus = derived.xp.underdogAvailable
  const conflicting = draft.result ? opponentReports.filter((r) => conflicts(draft.result!, r.result)) : []
  return (
    <StepBody title="How did it go?">
      <Intro>Each side files its own report. Experience and exploration use the played scenario’s rules.</Intro>
      {ctx.scenarioId === 'the_sword_of_the_herald' ? <SwitchRow label="Agreed non-campaign mode" description="The referee’s optional mode: no injuries, XP or exploration. Only rewards for removing the sword and Star Stone splinters may be recorded." checked={draft.scenarioNonCampaign ?? false} onChange={v => update(d => ({ ...d, scenarioNonCampaign: v }))} /> : null}
      {ctx.scenarioId === 'stake_out' ? <Card className="flex flex-col gap-3 px-4 py-3"><p className="text-sm">Stake-Out gives fixed wyrdstone income but does not specify whether normal exploration also applies. Record your table’s interpretation before proceeding.</p><SelectField label="Agreed Stake-Out exploration" value={draft.scenarioRewards?.stakeOut?.mode ?? ''} onChange={e => update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, stakeOut: { ...d.scenarioRewards?.stakeOut, mode: e.target.value as 'income-only' | 'also-explore' } } }))}><option value="">Choose…</option><option value="income-only">Printed income replaces exploration</option><option value="also-explore">Printed income plus normal exploration</option></SelectField><TextField label="Stake-Out table ruling" value={draft.scenarioRewards?.stakeOut?.reason ?? ''} onChange={e => update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, stakeOut: { ...d.scenarioRewards?.stakeOut, reason: e.target.value } } }))} /></Card> : null}
      {opponentReports.length > 0 ? (
        <Card className="px-4 py-2">
          {opponentReports.map((r) => (
            <Row key={r.warband_id} label={`${r.warband_name} already filed`} value={RESULT_LABEL[r.result]} dim />
          ))}
        </Card>
      ) : null}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-dim">Result for {mine.warband_name}</span>
        <SegmentedControl options={RESULTS} value={draft.result ?? ('' as ReportResult)} onChange={(r) => update((d) => setResult(d, r))} label="Battle result" />
      </div>
      {conflicting.length > 0 ? (
        <Notice tone="warn" title="This doesn't match what the other side filed">
          {conflicting.map((r) => `${r.warband_name} already filed that they ${RESULT_LABEL[r.result]}`).join('; ')}. One side has this wrong — a GM can amend either report from the match page.
        </Notice>
      ) : null}
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
