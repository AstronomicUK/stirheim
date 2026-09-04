import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useMyCampaigns } from '../../api/campaigns'
import { useCustomScenario, useDeleteScenario } from '../../api/scenarios'
import { useSession } from '../../app/session'
import type { ScenarioRow } from '../../domain'
import { findScenario } from '../../rules/data/campaign/scenarios'
import type { ScenarioSummary } from '../../rules/types/campaignContent'
import type { ScenarioDetail } from '../../rules/types/scenarioDetail'
import { Button, Markdown, Notice, PageHeader, Sheet, Spinner } from '../../ui'
import { SecondaryLink, Tag } from './bits'
import { absoluteImageUrls, parseScenarioKind } from './helpers'

export function ScenarioPage() {
  const { kind: rawKind, id } = useParams<{ kind: string; id: string }>()
  const kind = parseScenarioKind(rawKind)

  if (!kind || !id) return <NotFound />
  if (kind === 'builtin') {
    const summary = findScenario(id)
    return summary ? <BuiltinScenario summary={summary} /> : <NotFound />
  }
  return <CustomScenario id={id} />
}

function NotFound() {
  return (
    <>
      <Notice tone="info" title="No such scenario">
        Nothing in the library or your group's scenarios has this address. It may have been deleted.
      </Notice>
      <BackLink />
    </>
  )
}

function BackLink() {
  return (
    <Link to="/scenarios" className="inline-flex min-h-11 items-center text-sm text-brass underline-offset-4 hover:underline">
      Back to scenarios
    </Link>
  )
}

/** Small label / value pairs under the title. */
function Meta({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-ink-dim">{item.label}</dt>
          <dd className="min-w-0 break-words text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function RuleSection({ name, text }: { name: string; text: string }) {
  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4">
      <h2 className="font-headline text-xl font-semibold leading-tight text-ink">{name}</h2>
      <Markdown source={text} className="[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md" />
    </section>
  )
}

// ---- Built-in ----

type DetailState = { status: 'loading' } | { status: 'ready'; detail: ScenarioDetail | null } | { status: 'error'; message: string }
type DetailResult = { id: string } & Exclude<DetailState, { status: 'loading' }>

/**
 * The 1.3 MB details module is only fetched when a built-in scenario is actually opened. The result
 * is keyed by id so a change of scenario reads as loading until its own text arrives.
 */
function useScenarioDetail(id: string): DetailState {
  const [result, setResult] = useState<DetailResult | null>(null)
  useEffect(() => {
    let cancelled = false
    import('../../rules/data/campaign/scenarioDetails')
      .then(({ SCENARIO_DETAILS }) => {
        if (!cancelled) setResult({ id, status: 'ready', detail: SCENARIO_DETAILS[id] ?? null })
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ id, status: 'error', message: error instanceof Error ? error.message : 'The scenario text could not be loaded.' })
      })
    return () => {
      cancelled = true
    }
  }, [id])
  return result && result.id === id ? result : { status: 'loading' }
}

function BuiltinScenario({ summary }: { summary: ScenarioSummary }) {
  const detail = useScenarioDetail(summary.id)
  const number = detail.status === 'ready' && detail.detail?.number != null ? detail.detail.number : null

  return (
    <>
      <PageHeader eyebrow={number != null ? `Scenario ${number}` : 'Scenario'} title={summary.title} description={summary.description} />

      <Meta
        items={[
          { label: 'Source', value: summary.source },
          { label: 'Author', value: summary.author },
          { label: 'Setting', value: summary.setting },
        ]}
      />

      {detail.status === 'loading' ? (
        <div className="flex justify-center py-10">
          <Spinner label="Loading the scenario text" />
        </div>
      ) : detail.status === 'error' ? (
        <Notice tone="error" title="Could not load the scenario text">
          {detail.message}
        </Notice>
      ) : detail.detail === null ? (
        <Notice tone="info" title="No full text yet">
          Only the index entry for this scenario has been captured so far.
        </Notice>
      ) : (
        <DetailBody detail={detail.detail} />
      )}

      <div className="mt-auto pt-2">
        <BackLink />
      </div>
    </>
  )
}

function DetailBody({ detail }: { detail: ScenarioDetail }) {
  return (
    <>
      {detail.intro.trim() ? <Markdown source={absoluteImageUrls(detail.intro)} className="text-base leading-relaxed" /> : null}
      {detail.sections.map((section, index) => (
        <RuleSection key={`${section.name}-${index}`} name={section.name} text={absoluteImageUrls(section.text)} />
      ))}
      <p className="border-t border-border pt-4 text-sm text-ink-dim">
        Text from{' '}
        <a href={detail.url} target="_blank" rel="noopener noreferrer" className="text-brass underline-offset-4 hover:underline">
          mordheimer.net
        </a>
        , reproduced for play at the table.
      </p>
    </>
  )
}

// ---- Custom ----

function CustomScenario({ id }: { id: string }) {
  const query = useCustomScenario(id)

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the scenario" />
      </div>
    )
  }
  if (query.isError) {
    if (/does not exist/i.test(query.error.message)) return <NotFound />
    return (
      <>
        <Notice tone="error" title="Could not load this scenario">
          {query.error.message}
        </Notice>
        <BackLink />
      </>
    )
  }
  return <CustomScenarioView row={query.data} />
}

function CustomScenarioView({ row }: { row: ScenarioRow }) {
  const user = useSession((s) => s.user)
  const navigate = useNavigate()
  const campaigns = useMyCampaigns(row.campaign_id ? user?.id : undefined)
  const remove = useDeleteScenario()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const mine = row.owner_id === user?.id
  const scopedCampaign = row.campaign_id ? campaigns.data?.find((c) => c.id === row.campaign_id) : undefined

  async function confirmDelete() {
    try {
      await remove.mutateAsync(row.id)
      navigate('/scenarios', { replace: true })
    } catch {
      // The mutation exposes the error; the sheet stays open to show it.
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Custom scenario"
        title={row.name}
        description={row.summary || undefined}
        aside={mine ? <Tag tone="brass">Yours</Tag> : undefined}
      />

      <Meta
        items={[
          { label: 'Setting', value: row.setting },
          { label: 'Written by', value: mine ? 'You' : 'A member of your group' },
          {
            label: 'Shared with',
            value: row.campaign_id ? (scopedCampaign ? `The ${scopedCampaign.name} campaign only` : 'One campaign only') : 'Everyone signed in',
          },
        ]}
      />

      {row.rules_markdown.trim() ? (
        <section className="border-t border-border pt-4">
          <Markdown source={row.rules_markdown} className="[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md" />
        </section>
      ) : (
        <p className="border-t border-border pt-4 text-sm text-ink-dim">No rules text has been written for this scenario yet.</p>
      )}

      <div className="mt-auto pt-2">
        <BackLink />
      </div>

      {mine ? (
        <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button variant="danger" className="flex-1" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
          <SecondaryLink to={`/scenarios/custom/${row.id}/edit`}>Edit</SecondaryLink>
        </div>
      ) : null}

      <Sheet
        open={deleteOpen}
        onClose={() => {
          if (!remove.isPending) setDeleteOpen(false)
        }}
        title="Delete this scenario?"
        description={row.name}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={remove.isPending}>
              Keep it
            </Button>
            <Button variant="danger" className="flex-1" pending={remove.isPending} onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-ink-dim">
            The scenario and its rules text are removed for everyone who could see it. This cannot be undone.
          </p>
          {remove.isError ? (
            <Notice tone="error" title="Could not delete">
              {remove.error.message}
            </Notice>
          ) : null}
        </div>
      </Sheet>
    </>
  )
}
