import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { usePendingAdvances } from '../../api/advances'
import { useDeleteWarband, useProfiles, useTransferWarband, useUpdateRoster, useWarband, type WarbandDetail } from '../../api/warbands'
import { useSession } from '../../app/session'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { warbandRating } from '../../rules/resolve/rating'
import { validateRoster, warbandHeroCount, warbandModelCount } from '../../rules/resolve/roster'
import { Button, Notice, SelectField, Sheet, Spinner, TextField } from '../../ui'
import { warbandTypeName } from './shared/names'
import { Card, ItemLines, KeyValue, Section, Tag } from './view/bits'
import { GroupCard } from './view/GroupCard'
import { itemsByHolder } from './view/lookups'
import { WarriorCard } from './view/WarriorCard'


export function WarbandPage() {
  const { id } = useParams<{ id: string }>()
  const query = useWarband(id)

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the roster" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this warband">
          {query.error.message}
        </Notice>
        <Link to="/" className="text-brass underline-offset-4 hover:underline">
          Back to your warbands
        </Link>
      </>
    )
  }
  return <WarbandView detail={query.data} />
}

function WarbandView({ detail }: { detail: WarbandDetail }) {
  const { warband, heroes, groups, items, roster } = detail
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const update = useUpdateRoster(warband.id)
  const remove = useDeleteWarband()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const template = useMemo(() => findWarbandTemplate(warband.type_rules_id), [warband.type_rules_id])
  const rating = useMemo(() => warbandRating(roster, template), [roster, template])
  const problems = useMemo(() => (template ? validateRoster(roster, template).problems : []), [roster, template])
  const byHolder = useMemo(() => itemsByHolder(items), [items])

  const isOwner = user?.id === warband.owner_id
  // Between-battles flows are for whoever may write the roster; the GM's view stays read-only for now.
  const canEdit = isOwner
  const pending = usePendingAdvances(canEdit ? warband.id : undefined)
  const advancesDue = pending.data?.length ?? 0
  const activeHeroes = heroes.filter((h) => !h.is_hired_sword)
  const hiredSwords = heroes.filter((h) => h.is_hired_sword)
  const stash = byHolder.get('') ?? []

  async function toggleArchive() {
    setActionError(null)
    try {
      await update.mutateAsync({
        reason: 'archive',
        changes: [{ table: 'warbands', op: 'update', id: warband.id, data: { archived: !warband.archived } }],
      })
      setMenuOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update the warband.')
    }
  }

  async function confirmDelete() {
    setActionError(null)
    try {
      await remove.mutateAsync(warband.id)
      navigate('/', { replace: true })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not delete the warband.')
    }
  }

  const deleteReady = confirmText.trim() === warband.name.trim()

  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">{warbandTypeName(warband.type_rules_id)}</p>
            <h1 className="font-headline text-3xl font-semibold leading-tight text-ink">{warband.name}</h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 pt-1">
            {warband.archived ? <Tag>Archived</Tag> : null}
            {!isOwner ? <Tag tone="brass">GM view</Tag> : null}
          </div>
        </div>
        <HandOver warbandId={warband.id} warbandName={warband.name} ownerId={warband.owner_id} viewerId={user?.id} onError={setActionError} />
      </header>

      <Card className="grid grid-cols-3 gap-y-4 px-4 py-3">
        <KeyValue label="Gold" value={`${warband.gold} gc`} />
        <KeyValue label="Wyrdstone" value={warband.wyrdstone} />
        <KeyValue label="Rating" value={rating.total} />
        <KeyValue label="Models" value={warbandModelCount(roster)} />
        <KeyValue label="Heroes" value={warbandHeroCount(roster)} />
        {warband.veteran_pool !== null ? <KeyValue label="Veteran pool" value={warband.veteran_pool} /> : null}
      </Card>

      {problems.length > 0 ? (
        <Notice tone="warn" title="Roster problems">
          <ul className="flex list-disc flex-col gap-1 pl-4">
            {problems.map((p, i) => (
              <li key={`${p.code}-${i}`}>{p.message}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
      {rating.notes.length > 0 ? (
        <Notice tone="info" title="Rating notes">
          <ul className="flex list-disc flex-col gap-1 pl-4">
            {rating.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      {canEdit ? (
        <Section title="Between battles">
          <div className="grid grid-cols-3 gap-3">
            <BetweenBattlesLink to={`/warbands/${warband.id}/advances`} badge={advancesDue > 0 ? `${advancesDue} due` : null} highlight={advancesDue > 0}>
              Bestow advancements
            </BetweenBattlesLink>
            <BetweenBattlesLink to={`/warbands/${warband.id}/trade`}>Trading post</BetweenBattlesLink>
            <BetweenBattlesLink to={`/warbands/${warband.id}/recruit`}>Recruit</BetweenBattlesLink>
          </div>
        </Section>
      ) : null}

      <Section title="Heroes" aside={`${activeHeroes.length}`}>
        {activeHeroes.length === 0 ? <p className="text-sm text-ink-dim">No heroes on the roster.</p> : null}
        {activeHeroes.map((h) => (
          <WarriorCard key={h.id} hero={h} equipment={byHolder.get(h.id) ?? []} template={template} />
        ))}
      </Section>

      {hiredSwords.length > 0 ? (
        <Section title="Hired swords" aside={`${hiredSwords.length}`}>
          {hiredSwords.map((h) => (
            <WarriorCard key={h.id} hero={h} equipment={byHolder.get(h.id) ?? []} template={template} />
          ))}
        </Section>
      ) : null}

      <Section title="Henchmen" aside={`${groups.reduce((n, g) => n + g.size, 0)} models`}>
        {groups.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups.</p> : null}
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} equipment={byHolder.get(g.id) ?? []} template={template} />
        ))}
      </Section>

      <Section title="Stash">
        <Card className="px-4 py-3">
          <ItemLines items={stash} emptyText="The stash is empty." />
        </Card>
      </Section>

      <Section title="Notes">
        <Card className="px-4 py-3">
          {warband.notes ? <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{warband.notes}</p> : <p className="text-sm text-ink-dim">No campaign notes yet.</p>}
        </Card>
      </Section>

      <div className="mt-auto pt-2">
        <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            to={`/warbands/${warband.id}/edit`}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-accent px-4 text-base font-medium text-ink hover:bg-accent-strong"
          >
            Edit
          </Link>
          <Link
            to={`/warbands/${warband.id}/print`}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface-high px-4 text-base font-medium text-ink hover:border-ink-dim"
          >
            Print
          </Link>
          <Button variant="secondary" onClick={() => setMenuOpen(true)} aria-label="More actions" className="px-3">
            More
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Warband" description={warband.name}>
        <div className="flex flex-col gap-3 py-2">
          <Button variant="secondary" block pending={update.isPending} onClick={toggleArchive}>
            {warband.archived ? 'Unarchive' : 'Archive'}
          </Button>
          <p className="text-sm text-ink-dim">
            {warband.archived
              ? 'Bring the warband back to the front of your list.'
              : 'Archived warbands drop to the bottom of your list and are left out of new matches. Nothing is lost.'}
          </p>
          <Button
            variant="danger"
            block
            onClick={() => {
              setMenuOpen(false)
              setConfirmText('')
              setDeleteOpen(true)
            }}
          >
            Delete warband
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this warband?"
        description="Every hero, henchman, item and history entry goes with it. This cannot be undone."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={remove.isPending}>
              Keep it
            </Button>
            <Button variant="danger" className="flex-1" disabled={!deleteReady} pending={remove.isPending} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          <TextField
            label={`Type the warband's name to confirm`}
            hint={warband.name}
            value={confirmText}
            autoComplete="off"
            autoCapitalize="off"
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>
      </Sheet>
    </>
  )
}

function BetweenBattlesLink({ to, badge, highlight = false, children }: { to: string; badge?: string | null; highlight?: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={`relative inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-center text-sm font-medium text-ink hover:border-ink-dim ${
        highlight ? 'border-brass bg-brass/10' : 'border-border bg-surface-high'
      }`}
    >
      {children}
      {badge ? (
        <span className="absolute -top-2 -right-1 rounded-full border border-brass/60 bg-surface px-1.5 text-[10px] leading-4 text-brass">{badge}</span>
      ) : null}
    </Link>
  )
}


/** Owner or GM: give the warband to another account (imported rosters start with the importer). */
function HandOver({ warbandId, warbandName, ownerId, viewerId, onError }: { warbandId: string; warbandName: string; ownerId: string; viewerId: string | undefined; onError: (e: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState('')
  const profiles = useProfiles(open)
  const transfer = useTransferWarband()
  const owner = profiles.data?.find((p) => p.user_id === ownerId)

  async function confirm() {
    if (!target) return
    onError(null)
    try {
      await transfer.mutateAsync({ warbandId, newOwnerId: target })
      setOpen(false)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not hand the warband over.')
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="self-start text-xs text-brass underline-offset-4 hover:underline">
        Hand over to another player
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Hand this warband over"
        description={`${warbandName} moves to another player's account. They take over its roster, reports and advances; you keep nothing but the history.${owner && owner.user_id !== viewerId ? ` Current owner: ${owner.display_name}.` : ''}`}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)} disabled={transfer.isPending}>
              Keep it
            </Button>
            <Button className="flex-1" disabled={!target || target === ownerId} pending={transfer.isPending} onClick={() => void confirm()}>
              Hand over
            </Button>
          </div>
        }
      >
        {profiles.isPending ? (
          <Spinner label="Loading players" />
        ) : profiles.isError ? (
          <Notice tone="error">{profiles.error.message}</Notice>
        ) : (
          <SelectField label="New owner" value={target} onChange={(e) => setTarget(e.target.value)} hint="Only players who have signed up appear here.">
            <option value="">Pick a player…</option>
            {profiles.data
              .filter((p) => p.user_id !== ownerId)
              .map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.display_name}
                </option>
              ))}
          </SelectField>
        )}
      </Sheet>
    </>
  )
}
