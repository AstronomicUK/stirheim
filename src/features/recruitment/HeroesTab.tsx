import { useMemo, useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { overrideNote, overrideReady, reasonWith, type Override } from '../../domain/override'
import { recruitHero } from '../../rules/resolve/recruitment'
import type { WarbandTemplate } from '../../rules/types'
import { Button, Notice, Sheet, TextField, OverrideField } from '../../ui'
import { StatLine } from '../roster/shared/StatLine'
import { KeyValue } from '../roster/view/bits'
import { defaultHeroName, listUnits, singular, type UnitListing } from './helpers'
import { UnitList } from './UnitList'
import { outcomeFrom, useCommit, type Outcome } from './useCommit'

export interface RecruitTabProps {
  detail: WarbandDetail
  template: WarbandTemplate
  canEdit: boolean
  onDone: (outcome: Outcome) => void
}

/** Hire a hero from the warband list: name him, pay the hire cost, arm him later at the trading post. */
export function HeroesTab({ detail, template, canEdit, onDone }: RecruitTabProps) {
  const listings = useMemo(() => listUnits(detail.roster, template, 'hero'), [detail.roster, template])
  const [picked, setPicked] = useState<UnitListing | null>(null)
  return (
    <>
      <p className="text-sm text-ink-dim">
        Heroes arrive with their starting experience and no equipment; buy their weapons and armour at the trading post afterwards.
      </p>
      <UnitList listings={listings} disabled={!canEdit} onPick={setPicked} />
      {picked ? (
        <HeroSheet
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

interface HeroSheetProps {
  detail: WarbandDetail
  template: WarbandTemplate
  listing: UnitListing
  onClose: () => void
  onDone: (outcome: Outcome) => void
}

function HeroSheet({ detail, template, listing, onClose, onDone }: HeroSheetProps) {
  const { roster } = detail
  const unit = listing.unit
  const [name, setName] = useState(() => defaultHeroName(unit, roster))
  const { commit, error, pending } = useCommit(detail)
  const [override, setOverride] = useState<Override | null>(null)
  const listed = unit.cost ?? 0
  const cost = overrideReady(override) ? override.amount : listed
  const overrideBlocks = override !== null && !overrideReady(override)
  const trimmed = name.trim()

  async function confirm() {
    const id = crypto.randomUUID()
    const note = overrideReady(override) ? overrideNote('Hire cost', `${listed} gc`, `${override.amount} gc`, override.reason) : null
    const result = await commit(() => recruitHero(roster, template, unit.id, trimmed, id, overrideReady(override) ? { costOverride: override.amount } : {}), (w) => w, reasonWith('recruitment', note))
    if (result) onDone(outcomeFrom(`${trimmed} joins the warband`, result.events, { suggestTrading: true }))
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Hire a ${singular(unit.name)}`}
      description={`${listing.countText} on the roster · limit ${unit.rosterLimit}`}
      footer={
        <Button block pending={pending} disabled={trimmed.length === 0 || overrideBlocks} onClick={() => void confirm()}>
          Hire for {cost} gc
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" error={trimmed ? undefined : 'Give the hero a name'} />
        <div className="grid grid-cols-3 gap-3">
          <KeyValue label="Hire cost" value={`${cost} gc`} />
          <KeyValue label="Treasury after" value={`${roster.gold - cost} gc`} />
          <KeyValue label="Starting xp" value={unit.startingExperience} />
        </div>
        <OverrideField what="the hire cost" suggested={listed} value={override} onChange={setOverride} />
        <StatLine stats={unit.stats} />
        {unit.specialRules.length > 0 ? (
          <dl className="flex flex-col gap-2 text-xs leading-relaxed">
            {unit.specialRules.map((rule) => (
              <div key={rule.name}>
                <dt className="font-medium text-ink">{rule.name}</dt>
                <dd className="whitespace-pre-line text-ink-dim">{rule.text}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Sheet>
  )
}
