import { useMemo, useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { VETERAN_XP_COST_GC } from '../../rules/data/campaign/trading'
import { recruitHenchmen, type RecruitHenchmenResult } from '../../rules/resolve/recruitment'
import type { RosterWarband } from '../../rules/types/roster'
import { Button, Notice, SegmentedControl, SelectField, Sheet, Stepper, TextField } from '../../ui'
import { StatLine } from '../roster/shared/StatLine'
import { KeyValue } from '../roster/view/bits'
import { defaultGroupName, groupsOfType, listUnits, maxRecruitable, veteranQuote, type UnitListing } from './helpers'
import type { RecruitTabProps } from './HeroesTab'
import { UnitList } from './UnitList'
import { outcomeFrom, useCommit, type Outcome } from './useCommit'

/**
 * The 2D6 veteran pool is rolled in the post-battle wizard and lives on the warband row. The
 * resolver only reports what is left, so the remaining pool is written back here. The column only
 * accepts 2-12: a pool spent down to 0 or 1 is stored as null (no veterans available).
 */
function withPool(result: RecruitHenchmenResult): RosterWarband {
  const { warband, poolRemaining } = result
  if (poolRemaining === null || poolRemaining === warband.veteranPool) return warband
  return { ...warband, veteranPool: poolRemaining }
}

/** Hire henchmen as a new group or into an existing group of the same type, paying for veterans' experience. */
export function HenchmenTab({ detail, template, canEdit, onDone }: RecruitTabProps) {
  const listings = useMemo(() => listUnits(detail.roster, template, 'henchman'), [detail.roster, template])
  const [picked, setPicked] = useState<UnitListing | null>(null)
  const pool = detail.roster.veteranPool
  return (
    <>
      <p className="text-sm text-ink-dim">
        Henchmen arrive unarmed; new members of an existing group must be equipped like the rest of it at the trading post.
      </p>
      <Notice tone="info" title={pool === null ? 'No veterans available' : `Veteran pool: ${pool} experience`}>
        Recruits joining a group with experience take on the group&apos;s experience: each one uses that many points of the 2D6 pool rolled
        after the last battle and costs {VETERAN_XP_COST_GC} gc extra per point.
        {pool === null ? ' Roll the pool in the post-battle wizard before adding to an experienced group; green groups are unaffected.' : ''}
      </Notice>
      <UnitList listings={listings} disabled={!canEdit} onPick={setPicked} />
      {picked ? (
        <HenchmenSheet
          key={picked.unit.id}
          detail={detail}
          template={template}
          listing={picked}
          onClose={() => setPicked(null)}
          onDone={(outcome) => {
            setPicked(null)
            onDone(outcome)
          }}
        />
      ) : null}
    </>
  )
}

type Mode = 'new' | 'join'

interface HenchmenSheetProps {
  detail: WarbandDetail
  template: RecruitTabProps['template']
  listing: UnitListing
  onClose: () => void
  onDone: (outcome: Outcome) => void
}

function HenchmenSheet({ detail, template, listing, onClose, onDone }: HenchmenSheetProps) {
  const { roster } = detail
  const unit = listing.unit
  const groups = useMemo(() => groupsOfType(roster, unit.id), [roster, unit.id])
  const [mode, setMode] = useState<Mode>(groups.length > 0 ? 'join' : 'new')
  const [groupName, setGroupName] = useState(() => defaultGroupName(unit, roster))
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
  const [size, setSize] = useState(1)
  const { commit, error, pending } = useCommit(detail)

  const maxSize = useMemo(() => maxRecruitable(roster, template, unit), [roster, template, unit])
  const target = mode === 'join' ? groups.find((g) => g.id === groupId) : undefined
  const quote = veteranQuote(target, size, roster.veteranPool)
  const hireCost = (unit.cost ?? 0) * size
  const total = hireCost + quote.gold
  const nameMissing = mode === 'new' && groupName.trim().length === 0

  async function confirm() {
    const id = crypto.randomUUID()
    const result = await commit(
      () =>
        recruitHenchmen(roster, template, unit.id, groupName.trim(), size, id, {
          intoGroupId: mode === 'join' ? groupId : undefined,
          poolUsed: 0,
        }),
      withPool,
    )
    if (!result) return
    const title =
      mode === 'join' && target
        ? `${size} ${size === 1 ? 'recruit joins' : 'recruits join'} ${target.name}`
        : `${groupName.trim()} formed with ${size} ${unit.name}`
    onDone(outcomeFrom(title, result.events, { suggestTrading: true }))
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Hire ${unit.name}`}
      description={`${listing.countText} on the roster · limit ${unit.rosterLimit}`}
      footer={
        <Button block pending={pending} disabled={nameMissing || (mode === 'join' && !target)} onClick={() => void confirm()}>
          Hire {size} for {total} gc
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {groups.length > 0 ? (
          <SegmentedControl<Mode>
            label="Where the recruits go"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'join', label: 'Add to existing group' },
              { value: 'new', label: 'New group' },
            ]}
          />
        ) : null}

        {mode === 'new' ? (
          <TextField
            label="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            autoComplete="off"
            error={nameMissing ? 'Give the group a name' : undefined}
          />
        ) : (
          <SelectField label="Group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.size} {g.size === 1 ? 'model' : 'models'} · {g.xp} xp
              </option>
            ))}
          </SelectField>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-dim">How many</span>
          <Stepper label="recruits" value={size} onChange={setSize} min={1} max={maxSize} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <KeyValue label="Hire cost" value={`${hireCost} gc`} />
          <KeyValue label="Veterans" value={quote.gold > 0 ? `+${quote.gold} gc` : '—'} />
          <KeyValue label="Treasury after" value={`${roster.gold - total} gc`} />
        </div>

        {target && target.xp > 0 ? (
          <Notice tone={quote.needsPool || quote.exceedsPool ? 'warn' : 'info'} title={`${target.name} have ${target.xp} experience`}>
            {quote.needsPool
              ? `Each recruit would need ${target.xp} experience of veterans, but no 2D6 pool has been rolled since the last battle.`
              : quote.exceedsPool
                ? `${size} ${size === 1 ? 'recruit needs' : 'recruits need'} ${quote.xp} experience of veterans but only ${roster.veteranPool} ${roster.veteranPool === 1 ? 'is' : 'are'} in the pool.`
                : `Uses ${quote.xp} of the ${roster.veteranPool} experience in the pool (${(roster.veteranPool ?? 0) - quote.xp} left) and costs ${quote.gold} gc on top of the hire fee.`}
          </Notice>
        ) : null}

        <StatLine stats={target?.stats ?? unit.stats} />
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Sheet>
  )
}
