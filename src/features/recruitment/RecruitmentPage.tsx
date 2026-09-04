// Recruitment between battles: hire heroes and henchmen from the warband template, hire and pay
// hired swords, dismiss warriors. Every action runs a src/rules/resolve/recruitment resolver on the
// loaded roster and sends the diff through useUpdateRoster with reason 'recruitment' (useCommit).

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useWarband, type WarbandDetail } from '../../api/warbands'
import { useSession } from '../../app/session'
import { findWarbandTemplate, heroCapacity } from '../../rules/data/warbandTemplates'
import { warbandHeroCount, warbandModelCount } from '../../rules/resolve/roster'
import { Notice, PageHeader, SegmentedControl, Spinner } from '../../ui'
import { warbandTypeName } from '../roster/shared/names'
import { Card, KeyValue } from '../roster/view/bits'
import { DismissSection } from './DismissSection'
import { HenchmenTab } from './HenchmenTab'
import { HeroesTab } from './HeroesTab'
import { HiredSwordsTab } from './HiredSwordsTab'
import type { Outcome } from './useCommit'

export function RecruitmentPage() {
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
  return <RecruitView detail={query.data} />
}

type Tab = 'heroes' | 'henchmen' | 'hired'

const TABS: { value: Tab; label: string }[] = [
  { value: 'heroes', label: 'Heroes' },
  { value: 'henchmen', label: 'Henchmen' },
  { value: 'hired', label: 'Hired swords' },
]

function RecruitView({ detail }: { detail: WarbandDetail }) {
  const { warband, roster } = detail
  const user = useSession((s) => s.user)
  const template = useMemo(() => findWarbandTemplate(warband.type_rules_id), [warband.type_rules_id])
  const [tab, setTab] = useState<Tab>('heroes')
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const isOwner = user?.id === warband.owner_id
  const canEdit = isOwner && !warband.archived
  const capacity = template ? heroCapacity(template) : null
  const maxModels = template?.composition?.maxModels ?? null

  function done(next: Outcome) {
    setOutcome(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <PageHeader
        eyebrow={warbandTypeName(warband.type_rules_id)}
        title="Recruit"
        description={warband.name}
        aside={
          <Link to={`/warbands/${warband.id}`} className="text-sm text-brass underline-offset-4 hover:underline">
            Back to the roster
          </Link>
        }
      />

      <div className="sticky top-0 z-10 -mx-5 bg-surface px-5 py-2">
        <Card className="grid grid-cols-4 gap-y-3 px-4 py-3">
          <KeyValue label="Gold" value={`${roster.gold} gc`} />
          <KeyValue label="Veteran pool" value={roster.veteranPool === null ? '—' : `${roster.veteranPool} xp`} />
          <KeyValue label="Models" value={maxModels === null ? warbandModelCount(roster) : `${warbandModelCount(roster)}/${maxModels}`} />
          <KeyValue label="Heroes" value={capacity === null ? warbandHeroCount(roster) : `${warbandHeroCount(roster)}/${capacity}`} />
        </Card>
      </div>

      {!isOwner ? (
        <Notice tone="info" title="Read-only">
          Only the warband&apos;s owner can recruit, pay or dismiss warriors. You can still browse what is available.
        </Notice>
      ) : warband.archived ? (
        <Notice tone="info" title="Archived warband">
          Unarchive the warband from its roster page before recruiting.
        </Notice>
      ) : null}

      {outcome ? (
        <Notice tone={outcome.tone} title={outcome.title}>
          <ul className="flex flex-col gap-1">
            {outcome.lines.map((line, i) => (
              <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
            ))}
          </ul>
          {outcome.suggestTrading ? (
            <p className="mt-2">
              New recruits arrive unarmed:{' '}
              <Link to={`/warbands/${warband.id}/trade`} className="text-brass underline-offset-4 hover:underline">
                buy their equipment at the trading post
              </Link>
              .
            </p>
          ) : null}
        </Notice>
      ) : null}

      <SegmentedControl<Tab> label="Who to recruit" options={TABS} value={tab} onChange={setTab} />

      {tab === 'hired' ? (
        <HiredSwordsTab detail={detail} template={template} canEdit={canEdit} onDone={done} />
      ) : !template ? (
        <Notice tone="warn" title="Warband type not in the rules data">
          &ldquo;{warband.type_rules_id}&rdquo; has no template, so heroes and henchmen cannot be hired from a list here. Add them by hand from
          the roster page; hired swords still work.
        </Notice>
      ) : tab === 'heroes' ? (
        <HeroesTab detail={detail} template={template} canEdit={canEdit} onDone={done} />
      ) : (
        <HenchmenTab detail={detail} template={template} canEdit={canEdit} onDone={done} />
      )}

      {canEdit ? <DismissSection detail={detail} template={template} onDone={done} /> : null}
    </>
  )
}
