import type { BattleReport } from '../../../domain'
import { findItem } from '../../../rules/data/items'
import { Notice } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { STEP_IDS, STEP_TITLES } from '../model'
import { Intro, Row, type StepProps } from './bits'
import { StepBody } from './WizardShell'

function itemLabel(item: { item_rules_id: string | null; custom_name: string | null; quantity: number }): string {
  const name = item.item_rules_id ? (findItem(item.item_rules_id)?.name ?? item.item_rules_id) : (item.custom_name ?? 'item')
  return item.quantity > 1 ? `${name} ×${item.quantity}` : name
}

export function ReviewStep({ derived, ctx, mine }: StepProps) {
  const report = derived.report
  const advanceLines = derived.advances.items.map((i) => i.summary)
  if (!report) {
    const missing = STEP_IDS.filter((id) => derived.problems[id].length > 0)
    return (
      <StepBody title="Review">
        <Notice tone="warn" title="Not ready to file">
          <ul className="list-disc pl-4">
            {missing.map((id) => (
              <li key={id}>
                {STEP_TITLES[id]}: {derived.problems[id][0]}
              </li>
            ))}
          </ul>
        </Notice>
      </StepBody>
    )
  }
  return <ReportSummary report={report} warbandName={mine.warband_name} removedItems={derived.report ? removedItemLabels(report, ctx) : []} advanceLines={advanceLines} />
}

function removedItemLabels(report: BattleReport, ctx: StepProps['ctx']): string[] {
  return report.applied.remove_item_ids.map((id) => {
    const row = ctx.items.find((i) => i.id === id)
    if (!row) return id
    const holder = ctx.roster.heroes.find((h) => h.id === row.holder_id)?.name ?? 'someone'
    return `${itemLabel(row)} (${holder})`
  })
}

export function ReportSummary({ report, warbandName, removedItems, advanceLines = [] }: { report: BattleReport; warbandName: string; removedItems: string[]; advanceLines?: string[] }) {
  const { applied } = report
  return (
    <StepBody title="Review">
      <Intro>This is what will be recorded for {warbandName} and applied to the roster. Filing is final; only the GM can withdraw a report.</Intro>

      <Card className="px-4 py-2">
        <Row label="Result" value={report.result === 'won' ? 'Won' : report.result === 'lost' ? 'Lost' : 'Draw'} />
        <Row label="Routed" value={report.routed ? 'Yes' : 'No'} dim />
        <Row label="Out of action" value={report.ooa.reduce((n, o) => n + o.count, 0)} dim />
      </Card>

      <Section title="Injuries">
        {report.injuries.length === 0 ? <p className="text-sm text-ink-dim">No casualties.</p> : null}
        {report.injuries.length > 0 ? (
          <Card>
            <ul className="divide-y divide-border">
              {report.injuries.map((line) => (
                <li key={line.subjectId} className="flex flex-col gap-0.5 px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink">{line.subjectName}</span>
                    {line.subjectType === 'group' ? (
                      <Tag tone={line.dead > 0 ? 'danger' : 'brass'}>{line.dead === 0 ? 'All recover' : `${line.dead} dead`}</Tag>
                    ) : (
                      <Tag tone={line.outcome === 'recovered' ? 'brass' : line.outcome === 'injured' ? 'warn' : 'danger'}>{line.injuryName}</Tag>
                    )}
                  </div>
                  <p className="text-xs text-ink-dim">
                    Rolled {line.rolls.join(', ')}
                    {line.subjectType !== 'group' && line.effect ? ` · ${line.effect}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </Section>

      <Section title="Experience" aside={applied.pending_advances.length > 0 ? `${applied.pending_advances.length} ${applied.pending_advances.length === 1 ? 'advance' : 'advances'} to roll` : undefined}>
        {report.xp_log.length === 0 ? <p className="text-sm text-ink-dim">No experience earned.</p> : null}
        {report.xp_log.length > 0 ? (
          <Card>
            <ul className="divide-y divide-border">
              {report.xp_log.map((line) => (
                <li key={line.subjectId} className="flex flex-col gap-0.5 px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink">{line.subjectName}</span>
                    <span className="font-mono text-sm tabular-nums text-ink">
                      {line.xpBefore} → {line.xpAfter}
                      {line.advancesEarned > 0 ? <span className="text-brass"> · {line.advancesEarned === 1 ? 'advance owed' : `${line.advancesEarned} advances owed`}</span> : null}
                    </span>
                  </div>
                  <p className="text-xs text-ink-dim">{line.reasons.join(', ')}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <p className="text-xs text-ink-dim">Advances are rolled afterwards from the warband page, with your opponent watching.</p>
      </Section>

      <Section title="Advances" aside={advanceLines.length > 0 ? `${advanceLines.length}` : undefined}>
        {advanceLines.length === 0 ? <p className="text-sm text-ink-dim">No advances earned this battle.</p> : null}
        {advanceLines.length > 0 ? (
          <Card>
            <ul className="divide-y divide-border">
              {advanceLines.map((line) => (
                <li key={line} className="px-4 py-2.5 text-sm text-ink">
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <p className="text-xs text-ink-dim">Rolled advances are applied right after the report is filed; anything left for later waits under Bestow advancements.</p>
      </Section>

      <Section title="Exploration">
        {report.exploration ? (
          <Card className="px-4 py-2">
            <Row label={`Dice (${report.exploration.diceReason})`} value={report.exploration.rolls.join(', ')} />
            <Row label="Total" value={report.exploration.total} dim />
            <Row label="Location" value={report.exploration.locationName ?? 'None'} />
            {report.exploration.subRoll !== null ? <Row label="Location D6" value={report.exploration.subRoll} dim /> : null}
            {report.exploration.notes.map((n) => (
              <p key={n} className="py-1 text-xs text-ink-dim">
                {n}
              </p>
            ))}
          </Card>
        ) : (
          <p className="text-sm text-ink-dim">No exploration: no hero survived without going out of action.</p>
        )}
      </Section>

      <Section title="Treasury & stash">
        <Card className="px-4 py-2">
          <Row label="Wyrdstone" value={applied.warband.wyrdstone_delta >= 0 ? `+${applied.warband.wyrdstone_delta}` : applied.warband.wyrdstone_delta} />
          <Row label="Gold" value={applied.warband.gold_delta >= 0 ? `+${applied.warband.gold_delta} gc` : `${applied.warband.gold_delta} gc`} />
          <Row label="Veteran pool" value={report.veteran_pool_roll ?? 'Not rolled'} dim />
          <Row label="Into the stash" value={applied.stash_items.length === 0 ? 'Nothing' : applied.stash_items.map(itemLabel).join(', ')} dim />
          {removedItems.length > 0 ? <Row label="Lost" value={removedItems.join(', ')} dim /> : null}
        </Card>
      </Section>

      {report.notes ? (
        <Section title="Notes">
          <Card className="px-4 py-3">
            <p className="whitespace-pre-line text-sm text-ink-dim">{report.notes}</p>
          </Card>
        </Section>
      ) : null}
    </StepBody>
  )
}
