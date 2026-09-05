// Import battle records from another tracker (the old tracker's "Export CSV" on its Battle Records
// page). GM only. Four steps: load the file, map its columns to our fields, match the warband and
// scenario names to this campaign, preview and import. Everything up to the last button is pure
// (model.ts); the import itself is one RPC (src/api/importer.ts) and writes matches and reports
// only, never rosters.

import { useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useCampaign, type CampaignDetail } from '../../api/campaigns'
import { useImportBattleRecords } from '../../api/importer'
import { useSession } from '../../app/session'
import { csvToRecords } from '../../domain'
import { findScenario, SCENARIOS } from '../../rules/data/campaign/scenarios'
import { Button, Notice, PageHeader, SelectField, Spinner, TextArea } from '../../ui'
import { Card, Section, Tag, TextLink } from '../campaign/bits'
import { formatMatchTime, RESULT_TONES } from '../match/shared/helpers'
import { resultLabel } from '../records/helpers'
import {
  autoMatchScenarios,
  autoMatchWarbands,
  buildMatches,
  buildPayload,
  detectMapping,
  distinctScenarioNames,
  distinctWarbandNames,
  TARGET_FIELD_INFO,
  unmatchedWarbands,
  validateMapping,
  type BuildResult,
  type ColumnMapping,
  type ImportMatch,
  type RowProblem,
  type TargetField,
} from './model'

export function ImportPage() {
  const { id } = useParams<{ id: string }>()
  const query = useCampaign(id)
  const user = useSession((s) => s.user)

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the campaign" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this campaign">
          {query.error.message}
        </Notice>
        <TextLink to="/campaigns">Back to your campaigns</TextLink>
      </>
    )
  }
  const { campaign } = query.data
  const back = <TextLink to={`/campaigns/${campaign.id}`}>Campaign</TextLink>
  if (campaign.gm_id !== user?.id) {
    return (
      <>
        <PageHeader eyebrow={campaign.name} title="Import battle records" aside={back} />
        <Notice tone="warn" title="GM only">
          Only the GM of {campaign.name} can import its battle history. Ask them to run the import, or send them the CSV.
        </Notice>
      </>
    )
  }
  if (campaign.archived) {
    return (
      <>
        <PageHeader eyebrow={campaign.name} title="Import battle records" aside={back} />
        <Notice tone="warn" title="This campaign is archived">
          Unarchive it from Settings before importing history into it.
        </Notice>
      </>
    )
  }
  return <ImportWizard detail={query.data} />
}

type Step = 1 | 2 | 3 | 4

const STEP_TITLES: Record<Step, string> = { 1: 'Load the file', 2: 'Map columns', 3: 'Match names', 4: 'Preview and import' }

const EMPTY_BUILD: BuildResult = { matches: [], problems: [], shape: 'per_report', usedRows: 0 }

/** Explicit picks win over the guess; an explicit empty string means "not in this file". */
function effectiveMapping(detected: ColumnMapping, overrides: Partial<Record<TargetField, string>>): ColumnMapping {
  const mapping: ColumnMapping = { ...detected }
  for (const [field, header] of Object.entries(overrides) as [TargetField, string][]) {
    if (header) mapping[field] = header
    else delete mapping[field]
  }
  return mapping
}

function withOverrides(auto: Record<string, string | null>, overrides: Record<string, string>): Record<string, string | null> {
  const out = { ...auto }
  for (const [name, id] of Object.entries(overrides)) out[name] = id || null
  return out
}

const SCENARIO_OPTIONS = [...SCENARIOS].sort((a, b) => a.title.localeCompare(b.title))

function ImportWizard({ detail }: { detail: CampaignDetail }) {
  const { campaign, members } = detail
  const navigate = useNavigate()
  const importer = useImportBattleRecords(campaign.id)

  const [step, setStep] = useState<Step>(1)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [mappingOverrides, setMappingOverrides] = useState<Partial<Record<TargetField, string>>>({})
  const [warbandOverrides, setWarbandOverrides] = useState<Record<string, string>>({})
  const [scenarioOverrides, setScenarioOverrides] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const records = useMemo(() => csvToRecords(text), [text])
  const detected = useMemo(() => detectMapping(records.headers), [records.headers])
  const mapping = useMemo(() => effectiveMapping(detected, mappingOverrides), [detected, mappingOverrides])
  const mappingErrors = useMemo(() => validateMapping(mapping), [mapping])
  const built = useMemo(() => (mappingErrors.length === 0 ? buildMatches(records.rows, mapping) : EMPTY_BUILD), [records.rows, mapping, mappingErrors])

  const memberOptions = useMemo(() => members.map((m) => ({ warband_id: m.warband_id, name: m.warband.name, player: m.display_name })), [members])
  const warbandNames = useMemo(() => distinctWarbandNames(built.matches), [built.matches])
  const warbandIds = useMemo(() => withOverrides(autoMatchWarbands(warbandNames, memberOptions), warbandOverrides), [warbandNames, memberOptions, warbandOverrides])
  const unmatched = useMemo(() => unmatchedWarbands(warbandNames, warbandIds), [warbandNames, warbandIds])
  const scenarioNames = useMemo(() => distinctScenarioNames(built.matches), [built.matches])
  const scenarioIds = useMemo(() => withOverrides(autoMatchScenarios(scenarioNames), scenarioOverrides), [scenarioNames, scenarioOverrides])
  const memberName = useMemo(() => new Map(memberOptions.map((m) => [m.warband_id, m.name])), [memberOptions])

  function load(nextText: string, name: string | null) {
    setText(nextText)
    setFileName(name)
    setMappingOverrides({})
    setWarbandOverrides({})
    setScenarioOverrides({})
    setError(null)
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      load(await file.text(), file.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  async function runImport() {
    setError(null)
    try {
      const payload = buildPayload(built.matches, warbandIds, scenarioIds)
      await importer.mutateAsync(payload)
      navigate(`/campaigns/${campaign.id}/records`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The import failed.')
    }
  }

  const reportCount = built.matches.reduce((n, m) => n + m.participants.length, 0)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={campaign.name}
        title="Import battle records"
        description="Bring the battles already fought in another tracker into this campaign's records. Only the battle history is written; every roster stays exactly as the players entered it."
        aside={<TextLink to={`/campaigns/${campaign.id}`}>Campaign</TextLink>}
      />

      <StepBar step={step} />

      {step === 1 ? (
        <>
          <Notice tone="info" title="From another tracker">
            Open the campaign's battle records page there and export them as CSV. Pick that file below, or open it and paste its contents. Nothing is saved until
            the last step.
          </Notice>
          <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-surface-high px-4 text-base font-medium text-ink hover:border-ink-dim">
            {fileName ? `Chosen: ${fileName}` : 'Choose a CSV file'}
            <input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => void onFile(e)} />
          </label>
          <TextArea label="Or paste the CSV" rows={8} value={text} onChange={(e) => load(e.target.value, null)} placeholder="match_id,date,scenario,warband,result,…" className="font-mono text-sm" />
          {text.trim() ? (
            <Card className="px-4 py-3">
              <p className="text-sm text-ink">
                {records.rows.length} {records.rows.length === 1 ? 'row' : 'rows'} · {records.headers.length} {records.headers.length === 1 ? 'column' : 'columns'}
              </p>
              {records.headers.length > 0 ? <p className="mt-1 truncate text-xs text-ink-dim">Columns: {records.headers.join(', ')}</p> : null}
              {records.rows.length === 0 ? <p className="mt-1 text-sm text-warn">Only a header row was found. The file needs at least one battle under it.</p> : null}
            </Card>
          ) : null}
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button block disabled={records.rows.length === 0} onClick={() => setStep(2)}>
            Next: map columns
          </Button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <p className="text-sm leading-relaxed text-ink-dim">
            Tell the importer which column holds each field. The guesses below come from the header names; correct any that are wrong. <strong>Date, warband and result</strong> are
            required (a winner column can stand in for the result); everything else is optional.
          </p>
          <div className="flex flex-col gap-4">
            {TARGET_FIELD_INFO.map((info) => {
              const header = mapping[info.field]
              const sample = header ? (records.rows[0]?.[header] ?? '').trim() : ''
              return (
                <SelectField
                  key={info.field}
                  label={info.required ? `${info.label} (required)` : info.label}
                  hint={sample ? `${info.hint} First row: "${sample.length > 40 ? `${sample.slice(0, 39)}…` : sample}"` : info.hint}
                  value={header ?? ''}
                  onChange={(e) => setMappingOverrides((o) => ({ ...o, [info.field]: e.target.value }))}
                >
                  <option value="">Not in this file</option>
                  {records.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </SelectField>
              )
            })}
          </div>
          {mappingErrors.length > 0 ? (
            <Notice tone="warn" title="Before going on">
              <ul className="list-disc pl-4">
                {mappingErrors.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Notice>
          ) : (
            <Card className="px-4 py-3">
              <p className="text-sm text-ink">
                {built.shape === 'per_match'
                  ? 'Each row is read as one battle between the warband and the second warband.'
                  : mapping.matchId
                    ? 'Each row is one warband’s report; rows sharing a match id are one battle.'
                    : 'Each row is one warband’s report; rows with the same date and scenario are one battle.'}
              </p>
              <p className="mt-1 text-sm text-ink-dim">
                {built.matches.length} {built.matches.length === 1 ? 'battle' : 'battles'} from {built.usedRows} of {records.rows.length} rows.
                {built.matches.length === 0 && records.rows.length > 0 ? ' Check the result and warband columns.' : ''}
              </p>
            </Card>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" disabled={mappingErrors.length > 0 || built.matches.length === 0} onClick={() => setStep(3)}>
              Next: match names
            </Button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <ProblemList problems={built.problems} />
          <Section title="Warbands" aside={`${warbandNames.length} in the file`}>
            <p className="text-sm leading-relaxed text-ink-dim">
              Each warband name in the file must be a warband already enrolled in {campaign.name}. Names were matched automatically where they agree; fix the rest here.
            </p>
            <div className="flex flex-col gap-4">
              {warbandNames.map((name) => {
                const value = warbandIds[name] ?? ''
                return (
                  <SelectField
                    key={name}
                    label={name}
                    value={value}
                    error={value ? undefined : 'Not in this campaign. Recreate the roster first, then join the campaign.'}
                    onChange={(e) => setWarbandOverrides((o) => ({ ...o, [name]: e.target.value }))}
                  >
                    <option value="">Not in this campaign</option>
                    {memberOptions.map((m) => (
                      <option key={m.warband_id} value={m.warband_id}>
                        {m.name} · {m.player}
                      </option>
                    ))}
                  </SelectField>
                )
              })}
            </div>
            {unmatched.length > 0 ? (
              <Notice tone="error" title={`${unmatched.length} ${unmatched.length === 1 ? 'warband has' : 'warbands have'} no match`}>
                Every warband in the file has to exist here before its battles can be imported. The player recreates the roster with the warband builder (or the manual editor),
                joins this campaign with the invite code, and then the import can go ahead. Unmatched: {unmatched.join(', ')}.
              </Notice>
            ) : null}
          </Section>
          {scenarioNames.length > 0 ? (
            <Section title="Scenarios" aside={`${scenarioNames.length} in the file`}>
              <p className="text-sm leading-relaxed text-ink-dim">Optional. A scenario matched to the library links to its rules; anything else keeps its name in the battle notes.</p>
              <div className="flex flex-col gap-4">
                {scenarioNames.map((name) => (
                  <SelectField key={name} label={name} value={scenarioIds[name] ?? ''} onChange={(e) => setScenarioOverrides((o) => ({ ...o, [name]: e.target.value }))}>
                    <option value="">Keep the name in the notes</option>
                    {SCENARIO_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.source})
                      </option>
                    ))}
                  </SelectField>
                ))}
              </div>
            </Section>
          ) : null}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button className="flex-1" disabled={unmatched.length > 0} onClick={() => setStep(4)}>
              Next: preview
            </Button>
          </div>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Notice tone="warn" title="There is no undo">
            This writes {built.matches.length} completed {built.matches.length === 1 ? 'battle' : 'battles'} with {reportCount} {reportCount === 1 ? 'report' : 'reports'} into
            the records, filed by you and dated as in the file. Rosters, experience totals and treasuries are not changed. Afterwards you can withdraw a single report from a
            battle's page, but imported battles cannot be deleted from the app.
          </Notice>
          <Section title="Battles" aside={`${built.matches.length}`}>
            <ul className="flex flex-col gap-2">
              {built.matches.map((m) => (
                <PreviewCard key={m.key} match={m} scenarioId={m.scenarioName ? (scenarioIds[m.scenarioName] ?? null) : null} warbandIds={warbandIds} memberName={memberName} />
              ))}
            </ul>
          </Section>
          {error ? (
            <Notice tone="error" title="Nothing was imported">
              {error}
            </Notice>
          ) : null}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(3)} disabled={importer.isPending}>
              Back
            </Button>
            <Button className="flex-1" pending={importer.isPending} onClick={() => void runImport()}>
              Import {built.matches.length} {built.matches.length === 1 ? 'battle' : 'battles'}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}

function StepBar({ step }: { step: Step }) {
  const steps: Step[] = [1, 2, 3, 4]
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Import steps">
      {steps.map((s) => (
        <li key={s} aria-current={s === step ? 'step' : undefined} className="flex flex-col gap-1.5">
          <span className={`h-1 rounded-full ${s <= step ? 'bg-brass' : 'bg-border'}`} />
          <span className={`text-xs leading-tight ${s === step ? 'text-ink' : 'text-ink-dim'}`}>{STEP_TITLES[s]}</span>
        </li>
      ))}
    </ol>
  )
}

const PROBLEMS_SHOWN = 8

function ProblemList({ problems }: { problems: RowProblem[] }) {
  const [showAll, setShowAll] = useState(false)
  if (problems.length === 0) return null
  const skipped = problems.filter((p) => p.level === 'skipped').length
  const warnings = problems.length - skipped
  const shown = showAll ? problems : problems.slice(0, PROBLEMS_SHOWN)
  const summary = [skipped ? `${skipped} ${skipped === 1 ? 'row' : 'rows'} skipped` : null, warnings ? `${warnings} ${warnings === 1 ? 'warning' : 'warnings'}` : null].filter(Boolean).join(', ')
  return (
    <Notice tone={skipped ? 'warn' : 'info'} title={summary}>
      <ul className="flex flex-col gap-0.5">
        {shown.map((p, i) => (
          <li key={`${p.line}-${i}`}>
            Line {p.line}: {p.message}
          </li>
        ))}
      </ul>
      {problems.length > PROBLEMS_SHOWN ? (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-1 inline-flex min-h-11 items-center text-sm text-brass underline-offset-4 hover:underline">
          {showAll ? 'Show fewer' : `Show all ${problems.length}`}
        </button>
      ) : null}
    </Notice>
  )
}

function PreviewCard({ match, scenarioId, warbandIds, memberName }: { match: ImportMatch; scenarioId: string | null; warbandIds: Record<string, string | null>; memberName: Map<string, string> }) {
  const scenario = scenarioId ? findScenario(scenarioId) : undefined
  return (
    <li>
      <Card className="flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-ink">{scenario?.title ?? match.scenarioName ?? 'Scenario not recorded'}</span>
            <span className="text-sm text-ink-dim">{formatMatchTime(match.playedAt)}</span>
          </span>
          {!scenario && match.scenarioName ? <Tag>Name only</Tag> : null}
        </div>
        <ul className="flex flex-col divide-y divide-border/60 border-t border-border">
          {match.participants.map((p) => {
            const id = warbandIds[p.warbandName]
            const name = id ? (memberName.get(id) ?? p.warbandName) : p.warbandName
            const details = [p.xpGained !== null ? `+${p.xpGained} XP` : null, p.casualties !== null ? `${p.casualties} ${p.casualties === 1 ? 'casualty' : 'casualties'}` : null].filter(Boolean)
            return (
              <li key={`${p.warbandName}-${p.line}`} className="flex flex-col gap-1 px-4 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-ink">{name}</span>
                    {name !== p.warbandName ? <span className="truncate text-xs text-ink-dim">“{p.warbandName}” in the file</span> : null}
                  </span>
                  <Tag tone={RESULT_TONES[p.result]}>{resultLabel(p.result)}</Tag>
                </div>
                {details.length > 0 ? <p className="text-sm text-ink-dim">{details.join(' · ')}</p> : null}
                {p.notes ? <p className="truncate text-sm italic text-ink-dim">“{p.notes}”</p> : null}
              </li>
            )
          })}
        </ul>
        {match.notes ? <p className="border-t border-border px-4 py-2 text-sm italic text-ink-dim">“{match.notes}”</p> : null}
      </Card>
    </li>
  )
}
