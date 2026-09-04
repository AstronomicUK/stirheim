// Advancements: every advance a warrior has earned but not yet rolled for, one card per warrior,
// resolved one at a time in a bottom sheet (./ResolveSheet). Backed by usePendingAdvances /
// useResolveAdvance (src/api/advances.ts) and diffRoster (src/domain/rosterDiff.ts).

import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useAdvanceHistory, usePendingAdvances, type PendingAdvanceRow } from '../../api/advances'
import { useWarband, type WarbandDetail } from '../../api/warbands'
import { useSession } from '../../app/session'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { Button, Notice, PageHeader, Spinner } from '../../ui'
import { unitTypeName } from '../roster/shared/names'
import { Card, Section, Tag } from '../roster/view/bits'
import { hiredSwordName } from '../roster/view/lookups'
import { findSubject, groupAdvancesBySubject, readResolution, subjectName, type AdvanceGroup, type AdvanceSubject } from './model'
import { ResolveSheet } from './ResolveSheet'

export function AdvancesPage() {
  const { id } = useParams<{ id: string }>()
  const warband = useWarband(id)
  const pending = usePendingAdvances(id)
  const history = useAdvanceHistory(id)

  const back = (
    <Link to={`/warbands/${id}`} className="text-sm text-brass underline-offset-4 hover:underline">
      Back to the roster
    </Link>
  )

  if (warband.isPending || pending.isPending) {
    return (
      <>
        <PageHeader eyebrow="Between battles" title="Advances" aside={back} />
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner label="Loading advances" />
        </div>
      </>
    )
  }
  if (warband.isError || pending.isError) {
    return (
      <>
        <PageHeader eyebrow="Between battles" title="Advances" aside={back} />
        <Notice tone="error" title="Could not load the advances">
          {warband.error?.message ?? pending.error?.message}
        </Notice>
      </>
    )
  }
  return (
    <AdvancesView
      detail={warband.data}
      pending={pending.data}
      history={history.data ?? []}
      historyPending={history.isPending}
      historyError={history.error?.message ?? null}
      back={back}
    />
  )
}

interface AdvancesViewProps {
  detail: WarbandDetail
  pending: PendingAdvanceRow[]
  history: PendingAdvanceRow[]
  historyPending: boolean
  historyError: string | null
  back: ReactNode
}

function AdvancesView({ detail, pending, history, historyPending, historyError, back }: AdvancesViewProps) {
  const { warband, roster } = detail
  const user = useSession((s) => s.user)
  const isOwner = user?.id === warband.owner_id
  const template = useMemo(() => findWarbandTemplate(warband.type_rules_id), [warband.type_rules_id])
  const groups = useMemo(() => groupAdvancesBySubject(pending), [pending])
  const [openId, setOpenId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const open = openId ? pending.find((a) => a.id === openId) : undefined
  const openSubject = open ? findSubject(roster, open.subject_type, open.subject_id) : null

  return (
    <>
      <PageHeader
        eyebrow="Between battles"
        title="Advances"
        description={warband.name}
        aside={back}
      />

      {!isOwner ? <Notice tone="info">Only the warband's owner rolls for advances. This list is read-only.</Notice> : null}

      {groups.length === 0 ? (
        <Card className="flex flex-col gap-3 px-4 py-4">
          <p className="text-sm leading-relaxed text-ink">No advances due.</p>
          <p className="text-sm leading-relaxed text-ink-dim">Advances appear here when a warrior crosses an experience threshold after a battle.</p>
          <Link to={`/warbands/${warband.id}`} className="text-sm text-brass underline-offset-4 hover:underline">
            Back to the roster
          </Link>
        </Card>
      ) : (
        <Section title="Due" aside={`${pending.length} ${pending.length === 1 ? 'advance' : 'advances'}`}>
          {groups.map((g) => (
            <SubjectCard key={`${g.subjectType}:${g.subjectId}`} group={g} subject={findSubject(roster, g.subjectType, g.subjectId)} detail={detail} canResolve={isOwner} onResolve={() => setOpenId(g.advances[0].id)} />
          ))}
        </Section>
      )}

      <Section title="Recently resolved" aside={history.length > 0 ? `${history.length}` : undefined}>
        {historyError ? <Notice tone="error">{historyError}</Notice> : null}
        {history.length === 0 && !historyError && !historyPending ? <p className="text-sm text-ink-dim">Nothing resolved yet.</p> : null}
        {history.length > 0 ? (
          <Card className="px-4 py-3">
            <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((v) => !v)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm text-ink">
              <span>{historyOpen ? 'Hide' : 'Show'} the last {history.length === 1 ? 'advance' : `${history.length} advances`}</span>
              <span className="text-ink-dim" aria-hidden>
                {historyOpen ? '−' : '+'}
              </span>
            </button>
            {historyOpen ? (
              <ul className="mt-2 flex flex-col divide-y divide-border">
                {history.map((row) => (
                  <HistoryLine key={row.id} row={row} detail={detail} />
                ))}
              </ul>
            ) : null}
          </Card>
        ) : null}
      </Section>

      {open && openSubject ? (
        <ResolveSheet key={open.id} advance={open} subject={openSubject} detail={detail} template={template} onClose={() => setOpenId(null)} />
      ) : null}
    </>
  )
}

interface SubjectCardProps {
  group: AdvanceGroup
  subject: AdvanceSubject | null
  detail: WarbandDetail
  canResolve: boolean
  onResolve: () => void
}

function SubjectCard({ group, subject, detail, canResolve, onResolve }: SubjectCardProps) {
  const count = group.advances.length
  const thresholds = group.advances.map((a) => a.threshold_xp).join(', ')
  if (!subject) {
    return (
      <Card className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-ink">Warrior no longer on the roster</p>
          <Tag>{count} due</Tag>
        </div>
        <p className="text-xs text-ink-dim">
          {group.subjectType === 'group' ? 'The henchman group' : 'The hero'} this advance belongs to has been removed. Earned at {thresholds} xp.
        </p>
      </Card>
    )
  }
  const name = subjectName(subject)
  const type =
    subject.kind === 'group'
      ? `${unitTypeName(detail.warband.type_rules_id, subject.group.unitTemplateId)} · ${subject.group.size} ${subject.group.size === 1 ? 'model' : 'models'}`
      : subject.kind === 'hiredSword'
        ? `${hiredSwordName(subject.sword.hiredSwordId)} · hired sword`
        : unitTypeName(detail.warband.type_rules_id, subject.hero.unitTemplateId)
  const xp = subject.kind === 'group' ? subject.group.xp : subject.kind === 'hiredSword' ? subject.sword.xp : subject.hero.xp
  return (
    <Card className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base text-ink">{name}</p>
          <p className="text-xs text-ink-dim">{type}</p>
        </div>
        <Tag tone="brass">{count === 1 ? '1 advance due' : `${count} advances due`}</Tag>
      </div>
      <p className="text-xs text-ink-dim">
        <span className="font-mono tabular-nums text-ink">{xp}</span> xp · earned at {thresholds} xp
      </p>
      {canResolve ? (
        <Button variant="secondary" block onClick={onResolve}>
          {count === 1 ? 'Resolve' : 'Resolve the first'}
        </Button>
      ) : null}
    </Card>
  )
}

function HistoryLine({ row, detail }: { row: PendingAdvanceRow; detail: WarbandDetail }) {
  const { subjectName: storedName, text } = readResolution(row.resolution)
  const fallback = detail.heroes.find((h) => h.id === row.subject_id)?.name ?? detail.groups.find((g) => g.id === row.subject_id)?.name ?? 'Former warrior'
  const when = row.resolved_at ? new Date(row.resolved_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  return (
    <li className="flex flex-col gap-0.5 py-2 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink">{storedName ?? fallback}</span>
        <span className="shrink-0 text-xs text-ink-dim">{when}</span>
      </div>
      <span className="text-xs leading-relaxed text-ink-dim">{text ?? `Advance at ${row.threshold_xp} xp resolved.`}</span>
    </li>
  )
}
