import { RecruitGifts } from './RecruitGifts'
import type { MapPerks } from '../../rules/resolve/mapAdvantages'
import type { FirstSpellRule, CampaignBans } from '../../rules/types/roster'
import { startingMagicFor, startingMagicOptions } from '../../rules/data/campaign/magic'
import { StartingMagicCard } from '../roster/builder/StartingMagicCard'
import { useMemo, useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { overrideNote, overrideReady, reasonWith, type Override } from '../../domain/override'
import { recruitHero, INITIAL_OUTLAW_ARROWS_COST } from '../../rules/resolve/recruitment'
import { isBanned } from '../../rules/resolve/houseRules'
import { recruitGiftItems, recruitGiftProblem, recruitPurchasesTotal } from '../../rules/resolve/recruitPurchases'
import type { WarbandTemplate } from '../../rules/types'
import { Button, Notice, Sheet, TextField, OverrideField } from '../../ui'
import { StatLine } from '../roster/shared/StatLine'
import { KeyValue } from '../roster/view/bits'
import { defaultHeroName, listUnits, singular, type UnitListing } from './helpers'
import { UnitList } from './UnitList'
import { outcomeFrom, useCommit, type Outcome } from './useCommit'

export interface RecruitTabProps {
  bans?: CampaignBans
  firstSpellRule?: FirstSpellRule
  detail: WarbandDetail
  template: WarbandTemplate
  canEdit: boolean
  onDone: (outcome: Outcome) => void
  /** Map campaigns: the district advantages the warband holds. */
  perks?: MapPerks | null
}

/** Hire a hero from the warband list: name him, pay the hire cost, arm him later at the trading post. */
export function HeroesTab({ detail, template, canEdit, onDone, bans, firstSpellRule = 'random' }: RecruitTabProps) {
  const listings = useMemo(() => listUnits(detail.roster, template, 'hero'), [detail.roster, template])
  const [picked, setPicked] = useState<UnitListing | null>(null)
  return (
    <>
      <p className="text-sm text-ink-dim">
        Heroes arrive with their starting experience and the free dagger from their list; buy the rest of their kit at the trading post afterwards.
      </p>
      <UnitList listings={listings} disabled={!canEdit} onPick={setPicked} />
      {picked ? (
        <HeroSheet
          key={picked.unit.id}
          bans={bans}
          detail={detail}
          template={template}
          listing={picked}
          firstSpellRule={firstSpellRule}
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
  bans?: CampaignBans
  firstSpellRule: FirstSpellRule
  detail: WarbandDetail
  template: WarbandTemplate
  listing: UnitListing
  onClose: () => void
  onDone: (outcome: Outcome) => void
}

function HeroSheet({ detail, template, listing, onClose, onDone, firstSpellRule, bans }: HeroSheetProps) {
  const { roster } = detail
  const unit = listing.unit
  const [magicChoiceId, setMagicChoiceId] = useState<string>()
  const [initialArrows, setInitialArrows] = useState(false)
  const [wardog, setWardog] = useState(false)
  const canBuyWardog = unit.id === "mercenaries_ostermark_captain" && !isBanned(bans,"items","wardogs")
  const canBuyInitialArrows = template.id === 'outlaws_of_stirwood_forest' && !isBanned(bans, 'items', 'hunting_arrows')
  const withArrows = canBuyInitialArrows && initialArrows
  const [spellIds, setSpellIds] = useState<string[]>([])
  const magic = startingMagicFor(unit.id, template, magicChoiceId)
  const needsMagic = startingMagicOptions(unit.id, template).length > 0 && (!magic || new Set(spellIds.filter(Boolean)).size !== magic.count)
  const [name, setName] = useState(() => defaultHeroName(unit, roster))
  const { commit, error, pending } = useCommit(detail)
  const [override, setOverride] = useState<Override | null>(null)
  const listed = (unit.cost ?? 0) + (magic?.extraCost ?? 0)
  const hireCost = overrideReady(override) ? override.amount : listed
  const overrideBlocks = override !== null && !overrideReady(override)
  const trimmed = name.trim()
  // Mutations and Blessings are bought with the recruit: the first at the listed price, later ones double.
  const [chosenGifts, setChosenGifts] = useState<string[]>([])
  const giftTotal = recruitPurchasesTotal(recruitGiftItems(chosenGifts))
  const cost = hireCost + giftTotal.total + (wardog && canBuyWardog ? 25 : 0) + (withArrows ? INITIAL_OUTLAW_ARROWS_COST : 0)
  const giftProblem = recruitGiftProblem(template.id, unit.id, chosenGifts)

  async function confirm() {
    const id = crypto.randomUUID()
    const note = overrideReady(override) ? overrideNote('Hire cost', `${listed} gc`, `${override.amount} gc`, override.reason) : null
    const result = await commit(
      () => {
        const hired = recruitHero(roster, template, unit.id, trimmed, id, { ...(overrideReady(override) ? { costOverride: override.amount } : {}), magicChoiceId, spellIds, initialHuntingArrows: withArrows, bans, recruitGiftIds: chosenGifts, startingWardog: wardog && canBuyWardog })
        return hired
      },
      (w) => w,
      reasonWith('recruitment', [note, withArrows ? `Hunting Arrows bought at initial recruitment for ${INITIAL_OUTLAW_ARROWS_COST} gc; no rarity roll required.` : null].filter(Boolean).join(' · ') || null),
    )
    if (result) onDone(outcomeFrom(`${trimmed} joins the warband`, result.events, { suggestTrading: true }))
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Hire a ${singular(unit.name)}`}
      description={`${listing.countText} on the roster · limit ${unit.rosterLimit}`}
      footer={
        <Button block pending={pending} disabled={trimmed.length === 0 || overrideBlocks || needsMagic || !!giftProblem} onClick={() => void confirm()}>
          Hire for {cost} gc
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {unit.id==='ogre_hunting_party_ogre_hunter' && roster.hiredSwords.some(h=>h.status==='active'&&['ogre_bodyguard','ogre_slave_master'].includes(h.hiredSwordId)) ? <Notice tone="warn" title="Hired Ogres will leave">Recruiting this Hunter removes {roster.hiredSwords.filter(h=>h.status==='active'&&['ogre_bodyguard','ogre_slave_master'].includes(h.hiredSwordId)).map(h=>h.name).join(', ')} from the active warband, as required by Distasteful Company.</Notice> : null}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" error={trimmed ? undefined : 'Give the hero a name'} />
        <div className="grid grid-cols-3 gap-3">
          <KeyValue label="Hire cost" value={`${cost} gc`} />
          <KeyValue label="Treasury after" value={`${roster.gold - cost} gc`} />
          <KeyValue label="Starting xp" value={unit.startingExperience} />
        </div>
        <OverrideField what="the hire cost" suggested={listed} value={override} onChange={setOverride} />
        {canBuyInitialArrows ? <label className="flex min-h-11 items-start gap-3 rounded-md border border-border p-3 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brass" checked={initialArrows} onChange={e => setInitialArrows(e.target.checked)} />
          <span>Hunting Arrows · {INITIAL_OUTLAW_ARROWS_COST} gc<span className="mt-1 block text-xs text-ink-dim">Buy with this new Hero without a rarity roll. Later purchases require the normal roll. A bow is still needed to use them.</span></span>
        </label> : null}
        {canBuyWardog ? <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={wardog} onChange={e => setWardog(e.target.checked)} />Starting Wardog · 25 gc</label> : null}
        <StartingMagicCard unitId={unit.id} template={template} choiceId={magicChoiceId} spells={spellIds} rule={firstSpellRule} onChoice={id => { setMagicChoiceId(id); setSpellIds([]) }} onSpells={setSpellIds}
          apprenticeSpells={unit.id === 'restless_dead_variant_necromancer' ? roster.heroes.find(h => h.unitTemplateId === 'restless_dead_variant_liche' && h.status === 'active')?.spellIds : undefined} />
        <RecruitGifts warbandId={template.id} unitId={unit.id} ids={chosenGifts} onChange={setChosenGifts} bans={bans} />
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
