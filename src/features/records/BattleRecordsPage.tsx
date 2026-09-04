// The campaign's battle records: every finished (or awaiting-reports, or cancelled) match as a
// card with one line per warband, per-warband standings at the top, filters by warband and
// result, and the table exported as CSV or copied as text. Mirrors the Battle Records table in
// the Relic & Ruin walkthrough.

import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useCampaign } from '../../api/campaigns'
import { useBattleRecords, type BattleRecord } from '../../api/reports'
import { Button, Notice, PageHeader, SelectField, Sheet, Spinner } from '../../ui'
import { Card, KeyValue, Section, Tag, TextLink } from '../campaign/bits'
import { copyText, selectContents } from '../campaign/clipboard'
import { MatchStateTag } from '../match/shared/bits'
import { formatMatchTime, RESULT_TONES } from '../match/shared/helpers'
import { toRecordsCsv, toRecordsText } from './csv'
import { downloadTextFile } from './download'
import {
  filterRows,
  groupRowsByMatch,
  NO_FILTERS,
  notesExcerpt,
  recordRows,
  recordsFileName,
  resultLabel,
  warbandOptions,
  warbandTotals,
  type RecordFilters,
  type RecordRow,
  type ResultFilter,
} from './helpers'

export function BattleRecordsPage() {
  const { id } = useParams<{ id: string }>()
  const campaign = useCampaign(id)
  const records = useBattleRecords(id)

  if (campaign.isPending || records.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the records" />
      </div>
    )
  }
  if (campaign.isError || records.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load the battle records">
          {campaign.isError ? campaign.error.message : records.isError ? records.error.message : ''}
        </Notice>
        <TextLink to={id ? `/campaigns/${id}` : '/campaigns'}>Back to the campaign</TextLink>
      </>
    )
  }
  return <RecordsView campaignId={campaign.data.campaign.id} campaignName={campaign.data.campaign.name} records={records.data} />
}

const RESULT_OPTIONS: { value: ResultFilter; label: string }[] = [
  { value: 'all', label: 'All results' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'draw', label: 'Draw' },
  { value: 'none', label: 'No report yet' },
]

function RecordsView({ campaignId, campaignName, records }: { campaignId: string; campaignName: string; records: BattleRecord[] }) {
  const [filters, setFilters] = useState<RecordFilters>(NO_FILTERS)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const manualRef = useRef<HTMLPreElement>(null)

  const rows = useMemo(() => recordRows(records), [records])
  const options = useMemo(() => warbandOptions(rows), [rows])
  const totals = useMemo(() => warbandTotals(records), [records])
  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters])
  const groups = useMemo(() => groupRowsByMatch(filtered), [filtered])
  const byMatch = useMemo(() => new Map(records.map((r) => [r.match_id, r])), [records])
  const shownTotals = filters.warbandId === 'all' ? totals : totals.filter((t) => t.warband_id === filters.warbandId)
  const filtering = filters.warbandId !== 'all' || filters.result !== 'all'

  const battles = records.filter((r) => r.state !== 'cancelled').length

  function exportCsv() {
    downloadTextFile(toRecordsCsv(records), recordsFileName(campaignName))
  }

  async function copyAsText() {
    const ok = await copyText(toRecordsText(records))
    setCopyState(ok ? 'copied' : 'manual')
  }

  return (
    <>
      <PageHeader
        eyebrow={campaignName}
        title="Battle records"
        description={`${battles} ${battles === 1 ? 'battle' : 'battles'} recorded. One line per warband per game: result, experience, casualties, injuries and wyrdstone.`}
        aside={<TextLink to={`/campaigns/${campaignId}`}>Campaign</TextLink>}
      />

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={exportCsv} disabled={records.length === 0}>
          Export CSV
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => void copyAsText()} disabled={records.length === 0}>
          Copy as text
        </Button>
      </div>
      {copyState === 'copied' ? <Notice tone="success">Copied to the clipboard.</Notice> : null}

      {records.length === 0 ? (
        <Card className="px-4 py-4">
          <p className="text-sm leading-relaxed text-ink-dim">No battles have been fought to a finish yet. Records appear here once a battle is over and the players file their reports.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Warband" value={filters.warbandId} onChange={(e) => setFilters((f) => ({ ...f, warbandId: e.target.value }))}>
              <option value="all">All warbands</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Result" value={filters.result} onChange={(e) => setFilters((f) => ({ ...f, result: e.target.value as ResultFilter }))}>
              {RESULT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
          </div>

          <Section title="Standings" aside={filters.warbandId === 'all' ? `${totals.length} warbands` : undefined}>
            {shownTotals.length === 0 ? (
              <Card className="px-4 py-4">
                <p className="text-sm text-ink-dim">This warband has only been in cancelled battles.</p>
              </Card>
            ) : (
              <ul className="flex flex-col gap-2">
                {shownTotals.map((t) => (
                  <li key={t.warband_id}>
                    <Card className="flex flex-col gap-2 px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link to={`/warbands/${t.warband_id}`} className="truncate font-medium text-ink no-underline hover:underline">
                          {t.warband_name}
                        </Link>
                        <span className="shrink-0 text-sm text-ink-dim">{t.player}</span>
                      </div>
                      <dl className="grid grid-cols-4 gap-2">
                        <KeyValue label="Games" value={t.games} />
                        <KeyValue label="W · L · D" value={`${t.wins} · ${t.losses} · ${t.draws}`} />
                        <KeyValue label="XP" value={`+${t.xp_gained}`} />
                        <KeyValue label="Shards" value={t.shards_found} />
                      </dl>
                      {t.unreported > 0 ? (
                        <p className="text-xs text-ink-dim">
                          {t.unreported} {t.unreported === 1 ? 'report' : 'reports'} still to file
                        </p>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Battles" aside={filtering ? `${groups.length} of ${records.length}` : `${records.length}`}>
            {groups.length === 0 ? (
              <Card className="px-4 py-4">
                <p className="text-sm text-ink-dim">Nothing matches these filters.</p>
                <button type="button" onClick={() => setFilters(NO_FILTERS)} className="mt-1 inline-flex min-h-11 items-center text-sm text-brass underline-offset-4 hover:underline">
                  Clear filters
                </button>
              </Card>
            ) : (
              <ul className="flex flex-col gap-2">
                {groups.map((g) => {
                  const record = byMatch.get(g.match_id)
                  return record ? <RecordCard key={g.match_id} record={record} rows={g.rows} /> : null
                })}
              </ul>
            )}
          </Section>
        </>
      )}

      <Sheet
        open={copyState === 'manual'}
        onClose={() => setCopyState('idle')}
        title="Copy by hand"
        description="The clipboard is not available here. Select the text below and copy it."
        footer={
          <Button variant="secondary" block onClick={() => selectContents(manualRef.current)}>
            Select all
          </Button>
        }
      >
        <pre ref={manualRef} className="whitespace-pre-wrap py-2 font-mono text-xs leading-relaxed text-ink">
          {toRecordsText(records)}
        </pre>
      </Sheet>
    </>
  )
}

function RecordCard({ record, rows }: { record: BattleRecord; rows: RecordRow[] }) {
  const date = rows[0]?.date ?? null
  return (
    <li>
      <Card className="flex flex-col">
        <Link to={`/matches/${record.match_id}`} className="flex items-start justify-between gap-3 px-4 py-3 no-underline hover:bg-surface-high">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-ink">{record.scenario_title}</span>
            <span className="text-sm text-ink-dim">{date ? formatMatchTime(date) : 'No date'}</span>
          </span>
          <MatchStateTag state={record.state} />
        </Link>
        <ul className="flex flex-col divide-y divide-border/60 border-t border-border">
          {rows.map((row) => (
            <RecordLine key={row.warband_id} row={row} />
          ))}
        </ul>
      </Card>
    </li>
  )
}

function RecordLine({ row }: { row: RecordRow }) {
  const details: string[] = []
  if (row.report) {
    if (row.routed) details.push('routed')
    details.push(`+${row.xp_gained} XP`)
    details.push(`${row.own_out_of_action} out of action`)
    if (row.injuries) details.push(row.injuries)
    if (row.shards_found) details.push(`${row.shards_found} ${row.shards_found === 1 ? 'shard' : 'shards'}`)
    if (row.gold_found) details.push(`${row.gold_found} gc found`)
  }
  const excerpt = notesExcerpt(row.notes)
  return (
    <li className="flex flex-col gap-1 px-4 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-ink">{row.warband_name}</span>
          <span className="truncate text-xs text-ink-dim">{row.player}</span>
        </span>
        <Tag tone={RESULT_TONES[row.result]}>{resultLabel(row.result, row.state)}</Tag>
      </div>
      {details.length > 0 ? <p className="text-sm text-ink-dim">{details.join(' · ')}</p> : null}
      {excerpt ? <p className="text-sm italic leading-relaxed text-ink-dim">“{excerpt}”</p> : null}
    </li>
  )
}
