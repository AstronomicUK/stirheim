import {RestlessRituals} from '../roster/view/RestlessRituals'
import { ConstructController } from './ConstructController'
import { SINGLE_GROUP_UNITS, SCARECROW, NIGHT_MOB, CONTROLLERS } from '../../rules/resolve/rosterComposition'
import { RecruitGifts } from './RecruitGifts'
import { recruitGiftItems, recruitGiftProblem, recruitPurchasesTotal } from '../../rules/resolve/recruitPurchases'
import type { PerkSource } from '../../rules/resolve/mapAdvantages'
import { useMemo, useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { VETERAN_XP_COST_GC } from '../../rules/data/campaign/trading'
import { overrideNote, overrideReady, reasonWith, type Override } from '../../domain/override'
import { recruitHenchmen, type RecruitHenchmenResult } from '../../rules/resolve/recruitment'
import type { RosterWarband } from '../../rules/types/roster'
import { Button, Notice, SegmentedControl, SelectField, Sheet, Stepper, TextField, OverrideField } from '../../ui'
import { StatLine } from '../roster/shared/StatLine'
import { KeyValue } from '../roster/view/bits'
import { defaultGroupName, groupsOfType, listUnits, maxRecruitable, veteranQuote, type UnitListing } from './helpers'
import type { RecruitTabProps } from './HeroesTab'
import { UnitList } from './UnitList'
import { outcomeFrom, useCommit, type Outcome } from './useCommit'

/**
 * The 2D6 veteran pool is rolled in the post-battle wizard and lives on the warband row. The
 * resolver only reports what is left, so the remaining pool is written back here, including 0 or 1.
 */
function withPool(result: RecruitHenchmenResult): RosterWarband {
  const { warband, poolRemaining } = result
  if (poolRemaining === null || poolRemaining === warband.veteranPool) return warband
  return { ...warband, veteranPool: poolRemaining }
}

/** Hire henchmen as a new group or into an existing group of the same type, paying for veterans' experience. */
export function HenchmenTab({ detail, template, canEdit, onDone, perks, bans }: RecruitTabProps) {
  const listings = useMemo(() => listUnits(detail.roster, template, 'henchman'), [detail.roster, template])
  const [picked, setPicked] = useState<UnitListing | null>(null)
  const pool = detail.roster.veteranPool
  return (
    <>
      <p className="text-sm text-ink-dim">
        Henchmen arrive unarmed; new members of an existing group must be equipped like the rest of it at the trading post.
      </p>
      <Notice tone="info" title={pool === null ? 'No veterans available' : `Veteran pool: ${pool} experience`}>
        Recruits joining a group with experience take on the group&apos;s experience: each one normally uses that many points of the 2D6 pool rolled
        after the last battle and costs {VETERAN_XP_COST_GC} gc extra per point.
        {template.id === 'the_sons_of_hashut' ? ' Uncommon: Chaos Dwarf recruits use 1.5× the normal pool points, rounded up per recruit; their gold surcharge and Hobgoblin costs are unchanged.' : ''}
        {pool === null ? ' Roll the pool in the post-battle wizard before adding to an experienced group; green groups are unaffected.' : ''}
      </Notice>
      <UnitList listings={listings} disabled={!canEdit} onPick={setPicked} />
      {picked?.unit.id==='restless_dead_variant_bone_goliath'?<Sheet open onClose={()=>setPicked(null)} title="Construct a Bone Goliath"><RestlessRituals detail={detail} allowed={canEdit} constructOnly onDone={note=>{setPicked(null);onDone({tone:'success',title:'Bone Goliath constructed',lines:[note]})}}/></Sheet>:picked ? (
        <HenchmenSheet
          key={picked.unit.id}
          detail={detail}
          bans={bans}
          template={template}
          listing={picked}
          cheap={perks?.cheapRecruits[picked.unit.id] ?? null}
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
  bans?: RecruitTabProps["bans"]
  detail: WarbandDetail
  template: RecruitTabProps['template']
  listing: UnitListing
  /** Map campaigns: a district price for this unit (the Cemetery's Zombies and Ghouls). */
  cheap: { cost: number; source: PerkSource } | null
  onClose: () => void
  onDone: (outcome: Outcome) => void
}

function HenchmenSheet({ detail, template, listing, cheap, onClose, onDone, bans }: HenchmenSheetProps) {
  const { roster } = detail
  const unit = listing.unit
  const groups = useMemo(() => groupsOfType(roster, unit.id), [roster, unit.id])
  const [mode, setMode] = useState<Mode>(groups.length > 0 && !SINGLE_GROUP_UNITS.includes(unit.id) ? 'join' : 'new')
  const [groupName, setGroupName] = useState(() => defaultGroupName(unit, roster))
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
  const [size, setSize] = useState(unit.id === NIGHT_MOB && !groups.length ? 5 : 1)
  const [controller, setController] = useState<typeof CONTROLLERS[number]>()
  const [giftIds, setGiftIds] = useState<string[]>([])
  const giftProblem = recruitGiftProblem(template.id, unit.id, giftIds)
  const giftCost = recruitPurchasesTotal(recruitGiftItems(giftIds)).total * size
  const { commit, error, pending } = useCommit(detail)

  const maxSize = useMemo(() => maxRecruitable(roster, template, unit), [roster, template, unit])
  const target = mode === 'join' ? groups.find((g) => g.id === groupId) : undefined
  const quote = veteranQuote(target, size, roster.veteranPool, roster.warbandTemplateId)
  const listedHire = (cheap ? cheap.cost : (unit.cost ?? 0)) * size
  const [costOverride, setCostOverride] = useState<Override | null>(null)
  const hireCost = overrideReady(costOverride) ? costOverride.amount : listedHire
  const costBlocks = costOverride !== null && !overrideReady(costOverride)
  const total = hireCost + quote.gold + giftCost
  const nameMissing = mode === 'new' && groupName.trim().length === 0

  async function confirm() {
    const id = crypto.randomUUID()
    const result = await commit(
      () =>
        recruitHenchmen(roster, template, unit.id, groupName.trim(), size, id, {
          intoGroupId: mode === 'join' ? groupId : undefined,
          poolUsed: 0,
          recruitGiftIds: giftIds, bans,
          constructController:controller,
          ...(overrideReady(costOverride) ? { costOverride: costOverride.amount } : cheap ? { costOverride: listedHire } : {}),
        }),
      withPool,
      reasonWith('recruitment', overrideReady(costOverride) ? overrideNote('Hire cost', `${listedHire} gc`, `${costOverride.amount} gc`, costOverride.reason) : null),
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
        <Button block pending={pending} disabled={nameMissing || costBlocks || !!giftProblem || (unit.id === SCARECROW && !controller) || (mode === 'join' && !target)} onClick={() => void confirm()}>
          Hire {size} for {total} gc
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {groups.length > 0 && !SINGLE_GROUP_UNITS.includes(unit.id) ? (
          <SegmentedControl<Mode>
            label="Where the recruits go"
            value={mode}
            onChange={value => { setMode(value); if (unit.id === NIGHT_MOB) setSize(value === 'new' ? 5 : 1) }}
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
          <Stepper label="recruits" value={size} onChange={setSize} min={unit.id === NIGHT_MOB && mode === "new" ? 5 : 1} max={SINGLE_GROUP_UNITS.includes(unit.id) ? 1 : maxSize} />
        </div>

        {unit.id === SCARECROW ? <ConstructController value={controller} onChange={setController} /> : null}
        <RecruitGifts warbandId={template.id} unitId={unit.id} ids={giftIds} onChange={setGiftIds} bans={bans} />
        <div className="grid grid-cols-3 gap-3">
          <KeyValue label="Hire cost" value={`${hireCost} gc`} />
          {cheap ? <p className="col-span-full text-xs text-ink-dim">{cheap.source.districtName}: {cheap.cost} gc each instead of {unit.cost ?? 0} gc (map advantage).</p> : null}
          <span className="col-span-full">
            <OverrideField what="the hire cost" suggested={listedHire} value={costOverride} onChange={setCostOverride} />
          </span>
          <KeyValue label="Veterans" value={quote.gold > 0 ? `+${quote.gold} gc` : '—'} />
          <KeyValue label="Treasury after" value={`${roster.gold - total} gc`} />
        </div>

        {target && target.xp > 0 ? (
          <Notice tone={quote.needsPool || quote.exceedsPool ? 'warn' : 'info'} title={`${target.name} have ${target.xp} experience`}>
            {quote.xp > target.xp * size && <p>Uncommon: Chaos Dwarfs use 1.5× veteran experience per recruit, rounded up. The gold surcharge remains 2 gc per actual XP.</p>}
            {quote.needsPool
              ? `Each recruit would need ${quote.xp / size} experience of veterans, but no 2D6 pool has been rolled since the last battle.`
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
