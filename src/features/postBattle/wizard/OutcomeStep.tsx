import {TradeWagonFacts} from './TradeWagonFacts'
import type { HarpyDraft } from '../model/harpyRewards'
import { Notice, SegmentedControl, SelectField, TextField, DieField, NumberField } from '../../../ui'
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
      {ctx.scenarioId==='brigands_in_the_pasturelands'?<SelectField label="Brigands role" value={draft.scenarioRewards?.brigands?.role??''} onChange={e=>update(d=>({...d,scenarioRewards:{...d.scenarioRewards,brigands:{role:e.target.value as 'attacker'|'defender'}}}))}><option value="">Choose…</option><option value="attacker">Attacker — 1 XP for survival / winning leader</option><option value="defender">Defender — 2 XP for survival / winning leader</option></SelectField>:null}
      {ctx.scenarioId==='the_hunters_become_the_hunted'&&draft.result==='won'?<NumberField label="Cold Ones alive at the end" hint="0–2; each surviving unit gains this much extra experience" allowEmpty value={draft.scenarioRewards?.hunters?.alive??null} onChange={alive=>update(d=>({...d,scenarioRewards:{...d.scenarioRewards,hunters:{...d.scenarioRewards?.hunters,alive,liveCaptured:null,liveKept:null,deadRecovered:null,saleBasis:undefined,saleReason:''}}}))}/>:null}
      {ctx.scenarioId === 'the_sword_of_the_herald' ? <SwitchRow label="Agreed non-campaign mode" description="The referee’s optional mode: no injuries, XP or exploration. Only rewards for removing the sword and Star Stone splinters may be recorded." checked={draft.scenarioNonCampaign ?? false} onChange={v => update(d => ({ ...d, scenarioNonCampaign: v }))} /> : null}
      {ctx.scenarioId === 'stake_out' ? <Card className="flex flex-col gap-3 px-4 py-3"><p className="text-sm">Stake-Out gives fixed wyrdstone income but does not specify whether normal exploration also applies. Record your table’s interpretation before proceeding.</p><SelectField label="Agreed Stake-Out exploration" value={draft.scenarioRewards?.stakeOut?.mode ?? ''} onChange={e => update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, stakeOut: { ...d.scenarioRewards?.stakeOut, mode: e.target.value as 'income-only' | 'also-explore' } } }))}><option value="">Choose…</option><option value="income-only">Printed income replaces exploration</option><option value="also-explore">Printed income plus normal exploration</option></SelectField><TextField label="Stake-Out table ruling" value={draft.scenarioRewards?.stakeOut?.reason ?? ''} onChange={e => update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, stakeOut: { ...d.scenarioRewards?.stakeOut, reason: e.target.value } } }))} /></Card> : null}
      {ctx.scenarioId === 'happy_harpy_hunting_grounds' && draft.result === 'won' ? <Card className="flex flex-col gap-3 px-4 py-3">
        <SelectField label="Were all three Harpies taken out before the rivals routed?" value={draft.scenarioRewards?.harpy?.defeated === undefined ? '' : String(draft.scenarioRewards.harpy.defeated)} onChange={e => update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, harpy: { defeated: e.target.value === '' ? undefined : e.target.value === 'true' }, finds: {} } }))}><option value="">Choose…</option><option value="true">Yes — our warband claims the nest</option><option value="false">No — nobody receives the nest</option></SelectField>
        {draft.scenarioRewards?.harpy?.defeated ? <>
          <NumberField label="Wyrdstone originally placed in the Harpy nest" allowEmpty value={draft.scenarioRewards.harpy.shards ?? null} onChange={shards => update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, harpy: { ...d.scenarioRewards?.harpy, shards } } }))} hint="Use the setup roll’s 1–3 shards; do not roll again." />
          <DieField label="Harpy nest Straggler D6 (5+)" sides={6} rollable value={draft.scenarioRewards.harpy.stragglerDie ?? null} onChange={stragglerDie => update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, harpy: { ...d.scenarioRewards?.harpy, stragglerDie, stragglerUse: undefined } } }))} />
          {(draft.scenarioRewards.harpy.stragglerDie ?? 0) >= 5 ? <SelectField label="When should the rescued Straggler help?" value={draft.scenarioRewards.harpy.stragglerUse ?? ''} onChange={e => update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, harpy: { ...d.scenarioRewards?.harpy, stragglerUse: e.target.value as HarpyDraft['stragglerUse'] } } }))}><option value="">Choose…</option><option value="now">This exploration — roll an extra die and discard one</option><option value="next">Next exploration — save the benefit</option></SelectField> : null}
        </> : null}
      </Card> : null}
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
      <TradeWagonFacts draft={draft} ctx={ctx} update={update}/>
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
