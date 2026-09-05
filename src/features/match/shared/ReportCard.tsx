// One filed post-battle report, collapsed behind a one-line summary so a match with several
// reports still fits a phone. Expanded: who filed it and when, experience lines with their
// reasons, casualties, injuries with the effect text, the exploration roll, the veteran pool
// roll and notes. The GM gets a Withdraw button when a handler is passed.

import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useReportRevisions, type ReportView } from '../../../api/reports'
import type { ExplorationRecord, HenchmanInjuryLine, HeroInjuryLine } from '../../../domain'
import { Button } from '../../../ui'
import { KeyValue, Tag } from '../../campaign/bits'
import { ooaCount, reportSummary, resultLabel, xpGained } from '../../records/helpers'
import { formatMatchTime, RESULT_TONES } from './helpers'

export interface ReportCardProps {
  report: ReportView
  /** GM only: opens the withdraw confirmation for this report. */
  onWithdraw?: (report: ReportView) => void
  /** GM only, pending reports: apply it. */
  onApprove?: (report: ReportView) => void
  /** GM only, pending reports: send it back with a note. */
  onReturn?: (report: ReportView) => void
  /** GM only, applied reports: link to the wizard in amend mode. */
  amendTo?: string
  busy?: boolean
  defaultOpen?: boolean
}

type TagTone = 'neutral' | 'warn' | 'brass'

export function ReportCard({ report, onWithdraw, onApprove, onReturn, amendTo, busy = false, defaultOpen = false }: ReportCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const summary = reportSummary(report)
  const amended = report.revision > 1

  return (
    <li className="flex flex-col rounded-md border border-border bg-surface-low">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex min-h-11 w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-surface-high">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium text-ink">{report.warband_name}</span>
          <span className="text-sm text-ink-dim">{summary}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1">
            {report.status === 'pending' ? <Tag tone="warn">Awaiting GM</Tag> : null}
            {report.status === 'returned' ? <Tag tone="warn">Returned</Tag> : null}
            {amended && report.status !== 'returned' ? <Tag tone="warn">Amended by GM</Tag> : null}
            {report.adjustments.length > 0 ? <Tag>Adjusted</Tag> : null}
            <Tag tone={RESULT_TONES[report.result]}>{resultLabel(report.result)}</Tag>
          </span>
          <span className="text-xs text-ink-dim">{open ? 'Hide' : 'Show'}</span>
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-3">
          <p className="text-sm text-ink-dim">
            Filed by {report.submitted_by_display_name} · {formatMatchTime(report.submitted_at)}
            {report.status === 'pending' ? ' · waiting for the GM; nothing applied yet' : ''}
          </p>
          {report.status === 'returned' ? (
            <p className="rounded-md border border-warn/60 bg-warn/10 px-3 py-2 text-sm text-ink">
              Returned by the GM{report.review_note ? `: ${report.review_note}` : ''}. Nothing was applied; the player files again.
            </p>
          ) : null}
          {amended ? (
            <div className="flex flex-col gap-1 rounded-md border border-warn/60 bg-warn/10 px-3 py-2 text-sm">
              <span className="text-ink">
                Amended by the GM{report.amended_at ? ` · ${formatMatchTime(report.amended_at)}` : ''} · revision {report.revision}
              </span>
              {report.amendment_note ? <span className="text-ink-dim">{report.amendment_note}</span> : null}
              <Revisions reportId={report.id} current={report} />
            </div>
          ) : null}

          <dl className="grid grid-cols-4 gap-2">
            <KeyValue label="Result" value={resultLabel(report.result)} />
            <KeyValue label="Routed" value={report.routed ? 'Yes' : 'No'} />
            <KeyValue label="XP" value={`+${xpGained(report)}`} />
            <KeyValue label="Own OOA" value={ooaCount(report)} />
          </dl>

          <Block title="Experience">
            {report.xp_log.length === 0 ? (
              <Empty>No experience recorded.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60">
                {report.xp_log.map((line, i) => (
                  <li key={`${line.subjectId}-${i}`} className="flex items-start justify-between gap-3 py-1.5">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-ink">{line.subjectName}</span>
                      {line.reasons.length > 0 ? <span className="text-xs text-ink-dim">{line.reasons.join(', ')}</span> : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {line.advancesEarned > 0 ? <Tag tone="brass">{line.advancesEarned === 1 ? 'Advance' : `${line.advancesEarned} advances`}</Tag> : null}
                      <span className="text-sm tabular-nums text-ink">
                        +{line.amount}
                        <span className="text-ink-dim"> → {line.xpAfter}</span>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title="Casualties">
            {report.ooa.length === 0 ? (
              <Empty>Nobody was taken out of action.</Empty>
            ) : (
              <ul className="flex flex-col gap-1">
                {report.ooa.map((line, i) => (
                  <li key={`${line.subjectId}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{line.subjectName}</span>
                    <span className="shrink-0 tabular-nums text-ink-dim">{line.subjectType === 'group' ? `${line.count} out of action` : 'out of action'}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title="Injuries">
            {report.injuries.length === 0 ? (
              <Empty>No injury rolls.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60">
                {report.injuries.map((line, i) => (
                  <li key={`${line.subjectId}-${i}`} className="py-1.5">
                    {line.subjectType === 'group' ? <GroupInjury line={line} /> : <HeroInjury line={line} />}
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title="Exploration">{report.exploration ? <Exploration record={report.exploration} /> : <Empty>No exploration roll.</Empty>}</Block>

          {report.veteran_pool_roll !== null ? (
            <Block title="Veteran pool">
              <p className="text-sm text-ink">
                Rolled <span className="tabular-nums">{report.veteran_pool_roll}</span> on 2D6 for new henchmen's starting experience.
              </p>
            </Block>
          ) : null}

          {report.adjustments.length > 0 ? (
            <Block title="Adjustments">
              <ul className="flex flex-col gap-1.5">
                {report.adjustments.map((a, i) => (
                  <li key={i} className="flex flex-col text-sm">
                    <span className="text-ink">
                      {a.label}: {a.used} <span className="text-ink-dim">(suggested {a.suggested})</span>
                    </span>
                    <span className="text-xs text-ink-dim">{a.reason}</span>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          {report.notes.trim() ? (
            <Block title="Notes">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{report.notes}</p>
            </Block>
          ) : null}

          {onApprove || onReturn ? (
            <div className="flex gap-2">
              {onReturn ? (
                <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => onReturn(report)}>
                  Return with a note
                </Button>
              ) : null}
              {onApprove ? (
                <Button className="flex-1" pending={busy} onClick={() => onApprove(report)}>
                  Approve and apply
                </Button>
              ) : null}
            </div>
          ) : null}
          {amendTo ? (
            <Link to={amendTo} className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-surface-high px-4 text-base font-medium text-ink no-underline hover:border-ink-dim">
              Amend report
            </Link>
          ) : null}
          {onWithdraw ? (
            <Button variant="danger" block disabled={busy} onClick={() => onWithdraw(report)}>
              Withdraw report
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

const OUTCOME_LABELS: Record<HeroInjuryLine['outcome'], string> = {
  recovered: 'Recovered',
  injured: 'Injured',
  dead: 'Dead',
  captured: 'Captured',
  retired: 'Retired',
}

const OUTCOME_TONES: Record<HeroInjuryLine['outcome'], TagTone> = {
  recovered: 'neutral',
  injured: 'warn',
  dead: 'warn',
  captured: 'warn',
  retired: 'neutral',
}

function HeroInjury({ line }: { line: HeroInjuryLine }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm text-ink">{line.subjectName}</span>
          <span className="text-xs text-ink-dim">
            {line.injuryName}
            {line.rolls.length > 0 ? ` · rolled ${line.rolls.join('')}` : ''}
          </span>
        </span>
        <Tag tone={OUTCOME_TONES[line.outcome]}>{OUTCOME_LABELS[line.outcome]}</Tag>
      </div>
      {line.effect.trim() ? <p className="text-sm leading-relaxed text-ink-dim">{line.effect}</p> : null}
    </div>
  )
}

function GroupInjury({ line }: { line: HenchmanInjuryLine }) {
  const survived = Math.max(0, line.rolls.length - line.dead)
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm text-ink">{line.subjectName}</span>
        <span className="text-xs text-ink-dim">
          {line.rolls.length > 0 ? `Rolled ${line.rolls.join(', ')}` : 'No rolls'} · 1–2 dies
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {line.dead > 0 ? <Tag tone="warn">{line.dead} dead</Tag> : null}
        {survived > 0 ? <Tag>{survived} recovered</Tag> : null}
      </span>
    </div>
  )
}

function Exploration({ record }: { record: ExplorationRecord }) {
  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-4 gap-2">
        <KeyValue label="Dice" value={record.rolls.length > 0 ? record.rolls.join(' ') : '—'} />
        <KeyValue label="Total" value={record.total} />
        <KeyValue label="Shards" value={record.shards} />
        <KeyValue label="Gold" value={record.goldFound} />
      </dl>
      <p className="text-xs text-ink-dim">
        {record.diceAllowed} {record.diceAllowed === 1 ? 'die' : 'dice'} allowed{record.diceReason ? `: ${record.diceReason}` : ''}
      </p>
      {record.locationName ? (
        <div className="flex flex-col gap-1 rounded-md border border-border bg-surface-high px-3 py-2">
          <span className="text-sm font-medium text-ink">
            {record.locationName}
            {record.subRoll !== null ? <span className="font-normal text-ink-dim"> · sub-roll {record.subRoll}</span> : null}
          </span>
          {record.locationText ? <p className="text-sm leading-relaxed text-ink-dim">{record.locationText}</p> : null}
        </div>
      ) : null}
      {record.itemsFound.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {record.itemsFound.map((item, i) => (
            <li key={i}>
              <Tag tone="brass">
                {item.quantity > 1 ? `${item.quantity} × ` : ''}
                {item.custom_name ?? item.item_rules_id?.replace(/_/g, ' ') ?? 'Item'}
              </Tag>
            </li>
          ))}
        </ul>
      ) : null}
      {record.notes.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {record.notes.map((note, i) => (
            <li key={i} className="text-sm leading-relaxed text-ink-dim">
              {note}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** The superseded versions of an amended report, one line each, loaded when asked for. */
function Revisions({ reportId, current }: { reportId: string; current: ReportView }) {
  const [show, setShow] = useState(false)
  const revisions = useReportRevisions(reportId, show)
  return (
    <div className="flex flex-col gap-1">
      <button type="button" aria-expanded={show} onClick={() => setShow((v) => !v)} className="self-start text-xs text-brass underline-offset-4 hover:underline">
        {show ? 'Hide the change log' : 'Show the change log'}
      </button>
      {show ? (
        revisions.isPending ? (
          <span className="text-xs text-ink-dim">Loading…</span>
        ) : revisions.isError ? (
          <span className="text-xs text-ink-dim">{revisions.error.message}</span>
        ) : (
          <ol className="flex flex-col gap-1 text-xs text-ink-dim">
            {revisions.data.map((rev) => (
              <li key={rev.id}>
                <span className="text-ink">Revision {rev.revision}</span> · {reportSummary(rev.report)} · +{xpGained(rev.report)} xp · {ooaCount(rev.report)} out of action · replaced {formatMatchTime(rev.replaced_at)} by{' '}
                {rev.replaced_by_display_name}
                {rev.note ? ` (${rev.note})` : ''}
              </li>
            ))}
            <li>
              <span className="text-ink">Revision {current.revision} (current)</span> · {reportSummary(current)} · +{xpGained(current)} xp · {ooaCount(current)} out of action
            </li>
          </ol>
        )
      ) : null}
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-[10px] uppercase tracking-wider text-ink-dim">{title}</h4>
      {children}
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-dim">{children}</p>
}
