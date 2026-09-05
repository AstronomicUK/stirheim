import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMyCampaigns, type CampaignSummary } from '../../api/campaigns'
import { useCreateScenario, useCustomScenario, useUpdateScenario } from '../../api/scenarios'
import { useSession } from '../../app/session'
import type { ScenarioRow } from '../../domain'
import { Button, Markdown, Notice, PageHeader, SegmentedControl, SelectField, Spinner, TextArea, TextField } from '../../ui'
import {
  EMPTY_SCENARIO_FORM,
  EVERYONE,
  fromScenarioRow,
  SCENARIO_NAME_MAX,
  SCENARIO_SUMMARY_MAX,
  scenarioFormChanged,
  toScenarioInput,
  validateScenarioForm,
  withSkeleton,
  type ScenarioFormErrors,
  type ScenarioFormValues,
} from './helpers'

type RulesView = 'write' | 'preview'

const RULES_VIEW_OPTIONS: { value: RulesView; label: string }[] = [
  { value: 'write', label: 'Write' },
  { value: 'preview', label: 'Preview' },
]

/** `/scenarios/new` creates; `/scenarios/custom/:id/edit` loads the row first, then edits. */
export function ScenarioFormPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) return <ScenarioForm />
  return <EditLoader id={id} />
}

function EditLoader({ id }: { id: string }) {
  const user = useSession((s) => s.user)
  const query = useCustomScenario(id)

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the scenario" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this scenario">
          {query.error.message}
        </Notice>
        <Link to="/scenarios" className="text-brass underline-offset-4 hover:underline">
          Back to scenarios
        </Link>
      </>
    )
  }
  if (query.data.owner_id !== user?.id) {
    return (
      <>
        <Notice tone="warn" title="Not yours to edit">
          Only the person who wrote a scenario can change it.
        </Notice>
        <Link to={`/scenarios/custom/${id}`} className="text-brass underline-offset-4 hover:underline">
          Back to the scenario
        </Link>
      </>
    )
  }
  return <ScenarioForm key={query.data.updated_at} existing={query.data} />
}

function ScenarioForm({ existing }: { existing?: ScenarioRow }) {
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const campaigns = useMyCampaigns(user?.id)
  const create = useCreateScenario()
  const update = useUpdateScenario(existing?.id ?? '')

  const initial = useMemo<ScenarioFormValues>(() => (existing ? fromScenarioRow(existing) : EMPTY_SCENARIO_FORM), [existing])
  const [values, setValues] = useState<ScenarioFormValues>(initial)
  const [errors, setErrors] = useState<ScenarioFormErrors>({})
  const [rulesView, setRulesView] = useState<RulesView>('write')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const changed = scenarioFormChanged(initial, values)
  const pending = create.isPending || update.isPending
  const gmCampaigns = useMemo(() => (campaigns.data ?? []).filter((c) => c.is_gm), [campaigns.data])

  function set<K extends keyof ScenarioFormValues>(key: K, value: ScenarioFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
    setSubmitError(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateScenarioForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      setRulesView('write')
      return
    }
    const input = toScenarioInput(result.data)
    try {
      if (existing) {
        await update.mutateAsync(input)
        navigate(`/scenarios/custom/${existing.id}`, { replace: true })
      } else {
        const id = await create.mutateAsync(input)
        navigate(`/scenarios/custom/${id}`, { replace: true })
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong while saving.')
    }
  }

  const canSubmit = existing ? changed : values.name.trim().length > 0

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow={existing ? 'Edit scenario' : 'New scenario'}
        title={existing ? existing.name : 'Write a scenario'}
        description={
          existing
            ? 'Changes are visible to everyone who can see this scenario.'
            : 'A house scenario for your group. Everyone signed in can read it unless you keep it to one campaign.'
        }
      />

      <div className="flex flex-col gap-4">
        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          maxLength={SCENARIO_NAME_MAX}
          autoComplete="off"
          autoFocus={!existing}
          error={errors.name}
          hint={errors.name ? undefined : `${values.name.trim().length} of ${SCENARIO_NAME_MAX}`}
        />
        <TextField
          label="Setting"
          value={values.setting}
          onChange={(e) => set('setting', e.target.value)}
          placeholder="Custom"
          autoComplete="off"
          error={errors.setting}
          hint={errors.setting ? undefined : 'Mordheim, Lustria, your own city. Blank means Custom.'}
        />
        <TextArea
          label="Summary"
          rows={2}
          value={values.summary}
          onChange={(e) => set('summary', e.target.value)}
          maxLength={SCENARIO_SUMMARY_MAX}
          placeholder="One or two lines for the library list"
          error={errors.summary}
        />

        <CampaignScope campaigns={gmCampaigns} loading={campaigns.isPending && Boolean(user)} value={values.campaignId} existing={existing} onChange={(v) => set('campaignId', v)} />

        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-3">
            <SegmentedControl options={RULES_VIEW_OPTIONS} value={rulesView} onChange={setRulesView} label="Rules editor view" />
            {rulesView === 'write' && !values.rulesMarkdown.trim() ? (
              <button
                type="button"
                onClick={() => set('rulesMarkdown', withSkeleton(values.rulesMarkdown))}
                className="inline-flex min-h-11 shrink-0 items-center text-sm text-brass underline-offset-4 hover:underline"
              >
                Insert template
              </button>
            ) : null}
          </div>
          {rulesView === 'write' ? (
            <TextArea
              label="Rules"
              rows={14}
              value={values.rulesMarkdown}
              onChange={(e) => set('rulesMarkdown', e.target.value)}
              placeholder={'## Terrain\n\nHow the table is set up...'}
              className="text-sm"
              hint="Markdown: ## headings, - lists, **bold**. The template gives the rulebook's five sections."
              error={errors.rulesMarkdown}
            />
          ) : (
            <div className="flex min-h-40 flex-col gap-2 rounded-md border border-border bg-surface-low px-4 py-3">
              <span className="text-sm font-medium text-ink-dim">Rules preview</span>
              {values.rulesMarkdown.trim() ? (
                <Markdown source={values.rulesMarkdown} className="[&_img]:max-w-full" />
              ) : (
                <p className="text-sm text-ink-dim">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {submitError ? (
        <Notice tone="error" title={existing ? 'Could not save' : 'Could not create the scenario'}>
          {submitError}
        </Notice>
      ) : null}

      <div className="sticky bottom-0 mt-auto -mx-5 flex items-center gap-3 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <Link
          to={existing ? `/scenarios/custom/${existing.id}` : '/scenarios'}
          className="inline-flex min-h-11 items-center px-2 text-sm text-ink-dim no-underline hover:text-ink"
        >
          Cancel
        </Link>
        <Button type="submit" className="flex-1" pending={pending} disabled={!canSubmit}>
          {existing ? (changed ? 'Save changes' : 'No changes') : 'Create scenario'}
        </Button>
      </div>
    </form>
  )
}

function CampaignScope({
  campaigns,
  loading,
  value,
  existing,
  onChange,
}: {
  campaigns: CampaignSummary[]
  loading: boolean
  value: string
  existing?: ScenarioRow
  onChange: (value: string) => void
}) {
  // A scenario already scoped to a campaign the user no longer runs keeps that scope selectable
  // so that opening the form does not silently widen who can see it.
  const orphaned = value !== EVERYONE && !campaigns.some((c) => c.id === value)

  if (!loading && campaigns.length === 0 && !orphaned) {
    return (
      <p className="text-sm leading-relaxed text-ink-dim">
        Shared with everyone signed in. Run a campaign to keep a scenario to that group alone.
      </p>
    )
  }

  return (
    <SelectField
      label="Only for campaign"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      hint={value === EVERYONE ? 'Everyone signed in can read it.' : 'Only members of that campaign can read it.'}
    >
      <option value={EVERYONE}>Everyone signed in</option>
      {campaigns.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
          {c.archived ? ' (archived)' : ''}
        </option>
      ))}
      {orphaned && existing?.campaign_id ? <option value={existing.campaign_id}>Its current campaign</option> : null}
    </SelectField>
  )
}
