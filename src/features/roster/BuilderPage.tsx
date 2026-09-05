import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useCreateWarband } from '../../api/warbands'
import { findWarbandTemplate, heroCapacity } from '../../rules/data/warbandTemplates'
import {
  addDraftGroup,
  addDraftHero,
  withFreeDagger,
  draftCosts,
  draftToCreatePayload,
  draftToRosterWarband,
  validateDraft,
  type WarbandDraft,
} from '../../rules/resolve/builder'
import { warbandRating } from '../../rules/resolve/rating'
import { leaderTemplate } from '../../rules/resolve/roster'
import type { WarbandTemplate } from '../../rules/types'
import { Button, Notice, PageHeader, TextField } from '../../ui'
import { AddUnitSheet } from './builder/AddUnitSheet'
import { newDraftId, useDraftStore } from './builder/draftStore'
import { GroupCard } from './builder/GroupCard'
import { modelCount } from './builder/helpers'
import { HeroCard } from './builder/HeroCard'
import { ProblemsSection } from './builder/ProblemsSection'
import { SummaryBar } from './builder/SummaryBar'
import { warbandTypeName } from './shared/names'

export function BuilderPage() {
  const { templateId } = useParams()
  const template = templateId ? findWarbandTemplate(templateId) : undefined
  const draft = useDraftStore((s) => s.draft)
  const start = useDraftStore((s) => s.start)

  if (!template) {
    return (
      <>
        <PageHeader eyebrow="New warband" title="Unknown warband type" description="That warband is not in the rules catalogue." />
        <Link to="/warbands/new" className="text-brass underline-offset-4 hover:underline">
          Choose a warband
        </Link>
      </>
    )
  }

  if (!draft) {
    return (
      <>
        <PageHeader eyebrow="New warband" title={template.name} description="There is no draft in progress for this warband." />
        <Button block onClick={() => start(template, '')}>
          Start a {template.name} warband
        </Button>
        <Link to="/warbands/new" className="text-brass underline-offset-4 hover:underline">
          Choose a different warband
        </Link>
      </>
    )
  }

  if (draft.warbandTemplateId !== template.id) {
    return (
      <>
        <PageHeader eyebrow="New warband" title={template.name} />
        <Notice tone="warn" title="You have a different draft in progress">
          {draft.name.trim() || 'Unnamed warband'} ({warbandTypeName(draft.warbandTemplateId)}). Only one draft is kept at a time.
        </Notice>
        <Link
          to={`/warbands/new/${draft.warbandTemplateId}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-base font-medium text-ink no-underline hover:bg-accent-strong"
        >
          Continue that draft
        </Link>
        <Button variant="danger" block onClick={() => start(template, '')}>
          Discard it and start a {template.name} warband
        </Button>
      </>
    )
  }

  return <Builder draft={draft} template={template} />
}

function Builder({ draft, template }: { draft: WarbandDraft; template: WarbandTemplate }) {
  const navigate = useNavigate()
  const update = useDraftStore((s) => s.update)
  const clear = useDraftStore((s) => s.clear)
  const lastError = useDraftStore((s) => s.lastError)
  const dismissError = useDraftStore((s) => s.dismissError)
  const create = useCreateWarband()

  const [adding, setAdding] = useState<'hero' | 'henchman' | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const derived = useMemo(() => {
    const costs = draftCosts(draft, template)
    const problems = validateDraft(draft, template)
    const rating = warbandRating(draftToRosterWarband(draft, template), template).total
    return { costs, problems, rating }
  }, [draft, template])

  const leader = leaderTemplate(template)
  const capacity = heroCapacity(template)
  const maxModels = template.composition?.maxModels ?? null
  const ready = derived.problems.length === 0

  async function onCreate() {
    if (!ready || create.isPending) return
    setCreateError(null)
    try {
      const id = await create.mutateAsync(draftToCreatePayload(draft, template))
      clear()
      navigate(`/warbands/${id}`, { replace: true })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'The warband could not be saved.')
    }
  }

  function onDiscard() {
    clear()
    navigate('/warbands/new', { replace: true })
  }

  return (
    <>
      <PageHeader eyebrow="New warband" title={template.name} description={`${template.race} · ${template.originalSetting}`} />

      <SummaryBar
        costs={derived.costs}
        startingGold={draft.startingGold}
        models={modelCount(draft)}
        maxModels={maxModels}
        heroes={draft.heroes.length}
        heroCapacity={capacity}
        rating={derived.rating}
      />

      <TextField
        label="Warband name"
        autoComplete="off"
        maxLength={80}
        placeholder="Give the warband a name"
        value={draft.name}
        onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
      />

      {template.composition?.text ? (
        <details className="rounded-md border border-border bg-surface-low">
          <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm text-ink-dim">Choice of warriors</summary>
          <p className="px-4 pb-4 text-sm leading-relaxed text-ink-dim">{template.composition.text}</p>
        </details>
      ) : null}

      {lastError ? (
        <Notice tone="error" title="That change was not applied">
          {lastError}{' '}
          <button type="button" onClick={dismissError} className="text-brass underline-offset-4 hover:underline">
            Dismiss
          </button>
        </Notice>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-headline text-xl font-semibold text-ink">Heroes</h2>
          <span className="font-mono text-sm tabular-nums text-ink-dim">
            {draft.heroes.length}
            {capacity !== null ? ` / ${capacity}` : ''}
          </span>
        </div>
        {draft.heroes.map((hero) => (
          <HeroCard key={hero.id} hero={hero} template={template} isLeader={hero.unitTemplateId === leader?.id} />
        ))}
        <Button variant="secondary" block onClick={() => setAdding('hero')}>
          Add hero
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-headline text-xl font-semibold text-ink">Henchman groups</h2>
          <span className="font-mono text-sm tabular-nums text-ink-dim">
            {draft.groups.reduce((sum, g) => sum + g.size, 0)} in {draft.groups.length} {draft.groups.length === 1 ? 'group' : 'groups'}
          </span>
        </div>
        {draft.groups.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups yet.</p> : null}
        {draft.groups.map((group) => (
          <GroupCard key={group.id} group={group} draft={draft} template={template} />
        ))}
        <Button variant="secondary" block onClick={() => setAdding('henchman')}>
          Add group
        </Button>
      </section>

      <ProblemsSection problems={derived.problems} />

      {createError ? (
        <Notice tone="error" title="Could not create the warband">
          {createError}
        </Notice>
      ) : null}

      <div className="sticky bottom-0 mt-auto -mx-5 flex flex-col gap-3 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {confirmDiscard ? (
          <>
            <p className="text-sm text-ink-dim">Discard this draft? Everything you have added is lost.</p>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" onClick={onDiscard}>
                Discard
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDiscard(false)}>
                Keep
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button block disabled={!ready} pending={create.isPending} onClick={() => void onCreate()}>
              Create warband
            </Button>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-dim">
                {ready ? 'Ready to create.' : `${derived.problems.length} ${derived.problems.length === 1 ? 'problem' : 'problems'} to fix.`}
              </span>
              <Button variant="ghost" onClick={() => setConfirmDiscard(true)} disabled={create.isPending}>
                Discard draft
              </Button>
            </div>
          </>
        )}
      </div>

      <AddUnitSheet
        open={adding !== null}
        onClose={() => setAdding(null)}
        role={adding ?? 'hero'}
        template={template}
        draft={draft}
        onPick={(unit) => {
          update((d) => {
            const id = newDraftId()
            const added = unit.role === 'hero' ? addDraftHero(d, template, unit.id, id) : addDraftGroup(d, template, unit.id, id, 1)
            return withFreeDagger(added, template, { kind: unit.role === 'hero' ? 'hero' : 'group', id })
          })
          setAdding(null)
        }}
      />
    </>
  )
}
