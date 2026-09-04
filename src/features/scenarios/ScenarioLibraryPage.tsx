import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCustomScenarios } from '../../api/scenarios'
import { useSession } from '../../app/session'
import type { ScenarioRow } from '../../domain'
import { Notice, PageHeader, SegmentedControl, Spinner, TextField } from '../../ui'
import { PrimaryLink, ScenarioRows, Section, Tag, type ScenarioRowItem } from './bits'
import { ALL_SETTINGS, coreScenarios, filterScenarios, libraryScenarios, settingsPresent, type SettingFilter } from './helpers'

const CORE = coreScenarios()
const LIBRARY = libraryScenarios()
const SETTING_OPTIONS: { value: SettingFilter; label: string }[] = [
  { value: ALL_SETTINGS, label: 'All' },
  ...settingsPresent(LIBRARY).map((setting) => ({ value: setting, label: setting })),
]

export function ScenarioLibraryPage() {
  const user = useSession((s) => s.user)
  const custom = useCustomScenarios()

  return (
    <>
      <PageHeader
        eyebrow="Ledger"
        title="Scenarios"
        description="The rulebook nine with their full text, your group's own, and the wider library."
        aside={
          <Link to="/scenarios/new" className="inline-flex min-h-11 items-center px-2 text-sm text-brass underline-offset-4 hover:underline">
            New scenario
          </Link>
        }
      />

      <Section title="Core rulebook">
        <ScenarioRows
          rows={CORE.map((s, index) => ({
            key: s.id,
            to: `/scenarios/builtin/${s.id}`,
            number: index + 1,
            title: s.title,
            description: s.description,
          }))}
        />
      </Section>

      <Section title="Your group's scenarios" aside={custom.data ? `${custom.data.length}` : undefined}>
        {custom.isPending ? (
          <div className="flex justify-center py-6">
            <Spinner label="Loading your group's scenarios" />
          </div>
        ) : custom.isError ? (
          <Notice tone="error" title="Could not load your group's scenarios">
            {custom.error.message}{' '}
            <button type="button" onClick={() => void custom.refetch()} className="text-brass underline-offset-4 hover:underline">
              Try again
            </button>
          </Notice>
        ) : custom.data.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-md border border-dashed border-border px-5 py-6 text-center">
            <p className="text-sm leading-relaxed text-ink-dim">
              Nothing written up yet. Custom scenarios are shared with everyone signed in, or kept to one campaign you run.
            </p>
            <PrimaryLink to="/scenarios/new">Write a scenario</PrimaryLink>
          </div>
        ) : (
          <>
            <ScenarioRows rows={custom.data.map((row) => customRow(row, user?.id))} />
            <PrimaryLink to="/scenarios/new">New scenario</PrimaryLink>
          </>
        )}
      </Section>

      <FullLibrary />
    </>
  )
}

function customRow(row: ScenarioRow, userId: string | undefined): ScenarioRowItem {
  return {
    key: row.id,
    to: `/scenarios/custom/${row.id}`,
    title: row.name,
    subtitle: row.setting,
    description: row.summary || undefined,
    badge: row.owner_id === userId ? <Tag tone="brass">Yours</Tag> : undefined,
  }
}

function FullLibrary() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [setting, setSetting] = useState<SettingFilter>(ALL_SETTINGS)

  const results = useMemo(() => filterScenarios(LIBRARY, query, setting), [query, setting])

  return (
    <Section
      title="Full library"
      aside={
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="inline-flex min-h-11 items-center text-sm text-brass hover:underline">
          {open ? 'Hide' : `Browse ${LIBRARY.length} more`}
        </button>
      }
    >
      {open ? (
        <>
          <div className="flex flex-col gap-3">
            <TextField
              label="Search"
              type="search"
              placeholder="Title, description, author or source"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SegmentedControl options={SETTING_OPTIONS} value={setting} onChange={setSetting} label="Filter by setting" />
            <p className="text-xs text-ink-dim" aria-live="polite">
              {results.length} of {LIBRARY.length} scenarios
            </p>
          </div>

          {results.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-dim">Nothing matches. Try a shorter search.</p>
          ) : (
            <ScenarioRows
              rows={results.map((s) => ({
                key: s.id,
                to: `/scenarios/builtin/${s.id}`,
                title: s.title,
                subtitle: `${s.source} · ${s.author}${s.setting !== 'Mordheim' ? ` · ${s.setting}` : ''}`,
                description: s.description,
              }))}
            />
          )}
        </>
      ) : (
        <p className="text-sm leading-relaxed text-ink-dim">
          {LIBRARY.length} further scenarios from Town Cryer, Fanatic and the archives, with full text for each.
        </p>
      )}
      <p className="text-xs leading-relaxed text-ink-dim">
        Campaign-setting scenario sets (Border Town Burning, Empire in Flames and the like) are not included yet.
      </p>
    </Section>
  )
}
