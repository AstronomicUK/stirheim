// One filed post-battle report, collapsed behind a one-line summary so a match with several
// reports still fits a phone. Expanded: who filed it and when, experience lines with their
// reasons, casualties, injuries with the effect text, the exploration roll, the veteran pool
// roll and notes. The GM gets a Withdraw button when a handler is passed.

import { useState, type ReactNode } from 'react'
import type { ReportView } from '../../../api/reports'
import type { ExplorationRecord, HenchmanInjuryLine, HeroInjuryLine } from '../../../domain'
import { Button } from '../../../ui'
import { KeyValue, Tag } from '../../campaign/bits'
import { ooaCount, reportSummary, resultLabel, xpGained } from '../../records/helpers'
import { formatMatchTime, RESULT_TONES } from './helpers'

export interface ReportCardProps {
  report: ReportView
  /** GM only: opens the withdraw confirmation for this report. */
  onWithdraw?: (report: ReportView) => void
  defaultOpen?: boolean
}

type TagTone = 'neutral' | 'warn' | 'brass'

export function ReportCard({ report, onWithdraw, defaultOpen = false }: ReportCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const summary = reportSummary(report)

  return (
    <li className="flex flex-col rounded-md border border-border bg-surface-low">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex min-h-11 w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-surface-high">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium text-ink">{report.warband_name}</span>
          <span className="text-sm text-ink-dim">{summary}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <Tag tone={RESULT_TONES[report.result]}>{resultLabel(report.result)}</Tag>
          <span className="text-xs text-ink-dim">{open ? 'Hide' : 'Show'}</span>
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-3">
          <p className="text-sm text-ink-dim">
            Filed by {report.submitted_by_display_name} · {formatMatchTime(report.submitted_at)}
          </p>

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
                      <span className="font-mono text-sm tabular-nums text-ink">
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
                    <span className="shrink-0 font-mono tabular-nums text-ink-dim">{line.subjectType === 'group' ? `${line.count} out of action` : 'out of action'}</span>
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
                Rolled <span className="font-mono tabular-nums">{report.veteran_pool_roll}</span> on 2D6 for new henchmen's starting experience.
              </p>
            </Block>
          ) : null}

          {report.notes.trim() ? (
            <Block title="Notes">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{report.notes}</p>
            </Block>
          ) : null}

          {onWithdraw ? (
            <Button variant="danger" block onClick={() => onWithdraw(report)}>
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
