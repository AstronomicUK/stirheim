import type { MapPerks } from '../../rules/resolve/mapAdvantages'
import type { FirstSpellRule, CampaignBans } from '../../rules/types/roster'
import { startingMagicFor, startingMagicOptions } from '../../rules/data/campaign/magic'
import { StartingMagicCard } from '../roster/builder/StartingMagicCard'
import { useMemo, useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { overrideNote, overrideReady, reasonWith, type Override } from '../../domain/override'
import { recruitHero, INITIAL_OUTLAW_ARROWS_COST } from '../../rules/resolve/recruitment'
import { isBanned } from '../../rules/resolve/houseRules'
import { buyItem } from '../../rules/resolve/trading'
import { recruitPurchaseOptions, recruitPurchasesTotal } from '../../rules/resolve/recruitPurchases'
import type { Item } from '../../rules/types/items'
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
  const gifts = useMemo(() => recruitPurchaseOptions(roster.warbandTemplateId, unit.id), [roster.warbandTemplateId, unit.id])
  const [chosenGifts, setChosenGifts] = useState<string[]>([])
  const giftItems = gifts.filter((g) => chosenGifts.includes(g.id))
  const giftTotal = recruitPurchasesTotal(giftItems)
  const cost = hireCost + giftTotal.total + (withArrows ? INITIAL_OUTLAW_ARROWS_COST : 0)
  const mustHaveGift = gifts.length > 0 && unit.specialRules.some((r) => /must start the game with one or more/i.test(r.text))

  async function confirm() {
    const id = crypto.randomUUID()
    const note = overrideReady(override) ? overrideNote('Hire cost', `${listed} gc`, `${override.amount} gc`, override.reason) : null
    const result = await commit(
      () => {
        const hired = recruitHero(roster, template, unit.id, trimmed, id, { ...(overrideReady(override) ? { costOverride: override.amount } : {}), magicChoiceId, spellIds, initialHuntingArrows: withArrows, bans })
        let warband = hired.value
        const events = [...hired.events]
        for (const line of giftTotal.lines) {
          const bought = buyItem(warband, line.item, line.price, { kind: 'hero', id }, 1)
          warband = bought.value
          events.push(...bought.events)
        }
        return { value: warband, events }
      },
      (w) => w,
      reasonWith('recruitment', [note, withArrows ? `Hunting Arrows bought at initial recruitment for ${INITIAL_OUTLAW_ARROWS_COST} gc; no rarity roll required.` : null].filter(Boolean).join(' · ') || null),
    )
    if (result) onDone(outcomeFrom(`${trimmed} joins the warband`, result.events, { suggestTrading: true }))
  }

  function toggleGift(item: Item) {
    setChosenGifts((ids) => (ids.includes(item.id) ? ids.filter((x) => x !== item.id) : [...ids, item.id]))
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Hire a ${singular(unit.name)}`}
      description={`${listing.countText} on the roster · limit ${unit.rosterLimit}`}
      footer={
        <Button block pending={pending} disabled={trimmed.length === 0 || overrideBlocks || needsMagic || (mustHaveGift && giftItems.length === 0)} onClick={() => void confirm()}>
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
        <StartingMagicCard unitId={unit.id} template={template} choiceId={magicChoiceId} spells={spellIds} rule={firstSpellRule} onChoice={id => { setMagicChoiceId(id); setSpellIds([]) }} onSpells={setSpellIds}
          apprenticeSpells={unit.id === 'restless_dead_variant_necromancer' ? roster.heroes.find(h => h.unitTemplateId === 'restless_dead_variant_liche' && h.status === 'active')?.spellIds : undefined} />
        {gifts.length > 0 ? (
          <fieldset className="flex flex-col gap-2 rounded-md border border-border px-4 py-3">
            <legend className="px-1 text-xs uppercase tracking-wider text-ink-dim">Bought with the recruit</legend>
            <p className="text-xs leading-relaxed text-ink-dim">
              These can only be bought now. The first costs its listed price; second and later ones on the same model cost double.
              {mustHaveGift ? ' This warrior must start with at least one.' : ''}
            </p>
            {gifts.map((g) => {
              const on = chosenGifts.includes(g.id)
              const line = giftTotal.lines.find((l) => l.item.id === g.id)
              return (
                <label key={g.id} className="flex min-h-11 items-start gap-3 py-1 text-sm text-ink">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brass" checked={on} onChange={() => toggleGift(g)} />
                  <span className="flex min-w-0 flex-col">
                    <span>
                      {g.name.replace(/^(Mutation|Blessing of Nurgle): /, '')} <span className="text-ink-dim">· {line ? `${line.price} gc` : `${g.price.base ?? 0} gc`}</span>
                    </span>
                    <span className="text-xs leading-relaxed text-ink-dim">{g.specialRules[0]?.text ?? g.description}</span>
                  </span>
                </label>
              )
            })}
            {giftItems.length > 0 ? <p className="text-xs text-ink">Total for these: {giftTotal.total} gc</p> : null}
          </fieldset>
        ) : null}
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
