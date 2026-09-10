import { scenarioPurchasePrice } from '../../rules/resolve/scenarioCampaignEffects'
import { useMemo, useState } from 'react'
import { warbandRules } from '../../rules/data/campaignRules'
import { mordheimMapResult } from '../../rules/resolve/explorationAids'
import { SHOP_ITEMS } from '../../rules/data/items'
import { RARE_ROLL } from '../../rules/data/campaign/trading'
import { parseDice } from '../../rules/resolve/dice'
import { overrideNote, overrideReady, reasonWith, type Override } from '../../domain/override'
import { buyItem, itemPrice, rareSearch } from '../../rules/resolve/trading'
import { itemRestrictionWarnings, type ItemHolder } from '../../rules/resolve/itemRestrictions'
import { effectivePricing, warbandRareRollBonus } from '../../rules/resolve/itemPricing'
import { braceAmountOf } from '../../rules/resolve/equipmentCost'
import { halfPriceItemSource } from '../../rules/resolve/mapAdvantages'
import { itemEffect } from '../../rules/data/itemRules'
import { isBanned } from '../../rules/resolve/houseRules'
import { findWeapon } from '../../rules/data/weapons'
import type { Item } from '../../rules/types/items'
import { Button, DieField, NumberField, Notice, SelectField, Sheet, Stepper, TextField, OverrideField } from '../../ui'
import { Tag } from '../roster/view/bits'
import { availabilityLabel, diceTotal, eligibleSearchers, groupCatalogue, locationOptions, parseLocationKey, priceLine } from './helpers'
import type { TradeContext } from './useTrade'

export function BuyTab({ trade }: { trade: TradeContext }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Item | null>(null)
  const bans = trade.houseRules.bans
  const groups = useMemo(() => groupCatalogue(SHOP_ITEMS.filter((i) => !isBanned(bans, 'items', i.id)), query), [query, bans])
  const searchesLeft = eligibleSearchers(trade.roster, trade.phase.heroesSearched, trade.phase.heroesOutOfAction).length

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Search the catalogue"
        placeholder="Sword, Rare 8, armour…"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        hint={
          trade.phase.matchId === null
            ? 'No post-battle limits: rare-item rolls are not tracked.'
            : `${searchesLeft} rare-item ${searchesLeft === 1 ? 'search' : 'searches'} left this sequence.`
        }
      />
      {groups.length === 0 ? <p className="text-sm text-ink-dim">Nothing in the catalogue matches.</p> : null}
      {groups.map((group) => (
        <section key={group.category} className="flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-wider text-ink-dim">
            {group.title} <span className="normal-case tracking-normal">· {group.items.length}</span>
          </h3>
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
            {group.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-high"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-ink">{item.name}</span>
                    <span className="text-xs tabular-nums text-ink-dim">{priceLine(item, trade.houseRules)}</span>
                  </span>
                  <AvailabilityTag item={item} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {selected ? <BuySheet key={selected.id} item={selected} trade={trade} onClose={() => setSelected(null)} /> : null}
    </div>
  )
}

function AvailabilityTag({ item }: { item: Item }) {
  const kind = item.availability.kind
  return <Tag tone={kind === 'common' ? 'neutral' : kind === 'rare' ? 'brass' : 'warn'}>{availabilityLabel(item)}</Tag>
}

interface BuySheetProps {
  item: Item
  trade: TradeContext
  onClose: () => void
}

function BuySheet({ item: listed, trade, onClose }: BuySheetProps) {
  const { roster, houseRules, phase, canTrade, pending, run, error, clearError } = trade
  const tracked = phase.matchId !== null
  const searchers = useMemo(() => eligibleSearchers(roster, phase.heroesSearched, phase.heroesOutOfAction), [roster, phase.heroesSearched, phase.heroesOutOfAction])
  const downCount = phase.heroesOutOfAction.filter((id) => roster.heroes.some((h) => h.id === id && h.status === 'active')).length
  const destinations = useMemo(() => locationOptions(roster), [roster])
  // Dice in the price never change with the buyer, so the listed entry is enough to size the fields.
  const priceSpec = useMemo(() => (listed.price.dice ? parseDice(listed.price.dice) : null), [listed.price.dice])
  const rareSpec = useMemo(() => parseDice(RARE_ROLL), [])

  const [faces, setFaces] = useState<(number | null)[]>(() => (priceSpec ? Array.from({ length: priceSpec.count }, () => null) : []))
  const [manualPrice, setManualPrice] = useState<number | null>(null)
  const [priceOverride, setPriceOverride] = useState<Override | null>(null)
  const [searcherId, setSearcherId] = useState(searchers[0]?.id ?? '')
  const [searchFaces, setSearchFaces] = useState<(number | null)[]>([null, null])
  const [destinationKey, setDestinationKey] = useState('stash')
  const [quantity, setQuantity] = useState(1)
  const [searchRecorded, setSearchRecorded] = useState(false)
  const [huntDie, setHuntDie] = useState<number | null>(null)
  const [huntRecorded, setHuntRecorded] = useState(false)
  const [restrictionReason, setRestrictionReason] = useState('')
  const [upgradeBase, setUpgradeBase] = useState('')
  const isMap = listed.id === 'mordheim_map'
  const [mapDie, setMapDie] = useState<number | null>(null)
  const mapResult = isMap && mapDie !== null ? mordheimMapResult(mapDie) : null

  // ---- Who is buying, and what the rules say to them ----
  const destination = parseLocationKey(destinationKey)
  const holder: ItemHolder = useMemo(() => {
    if (destination.kind === 'hero') {
      const h = roster.heroes.find((x) => x.id === destination.id)
      return { kind: 'hero', id: destination.id, name: h?.name, unitTemplateId: h?.unitTemplateId, equipment: h?.equipment ?? [], flags: h?.flags }
    }
    if (destination.kind === 'henchmanGroup') {
      const g = roster.henchmenGroups.find((x) => x.id === destination.id)
      return { kind: 'henchmanGroup', id: destination.id, name: g?.name, unitTemplateId: g?.unitTemplateId, size: g?.size, equipment: g?.equipment ?? [] }
    }
    return { kind: 'stash', equipment: roster.stash }
  }, [destination, roster])
  const buyerHero = destination.kind === 'hero' ? roster.heroes.find((x) => x.id === destination.id) : undefined
  const pricing = useMemo(
    () => effectivePricing(listed, roster, { unitTemplateId: holder.unitTemplateId, role: holder.kind === 'henchmanGroup' ? 'henchman' : holder.kind === 'hero' ? 'hero' : undefined, hero: buyerHero }),
    [listed, roster, holder.unitTemplateId, holder.kind, buyerHero],
  )
  const item = pricing.item
  const warnings = useMemo(() => itemRestrictionWarnings(roster, item, holder, { quantity, bans: houseRules.bans }), [roster, item, holder, quantity, houseRules.bans])
  const needsReason = warnings.length > 0 && restrictionReason.trim().length === 0
  const upgrade = itemEffect(item.id)?.upgrade
  const upgradeBases = upgrade ? (upgrade.bases === 'anyMelee' ? holder.equipment.map((e) => e.itemId).filter((id): id is string => Boolean(id && findWeapon(id)?.type === 'melee')) : upgrade.bases) : []
  const hunt = pricing.strengthHunt
  const huntStrength = buyerHero?.stats.S ?? null
  const huntPassed = hunt === null || hunt.free || (huntDie !== null && huntStrength !== null && huntDie <= huntStrength)
  const huntFailed = hunt !== null && !hunt.free && huntDie !== null && huntStrength !== null && huntDie > huntStrength

  // ---- Availability ----
  const kind = item.availability.kind
  const isRare = kind === 'rare' && item.availability.rarity !== undefined
  const searchTotal = diceTotal(rareSpec, searchFaces)
  const warbandBonus = useMemo(() => warbandRareRollBonus(roster), [roster])
  const mapRareBonus = trade.perks?.rareRollBonus ?? 0
  const wornGemBonus = roster.heroes.find(h => h.id === searcherId)?.equipment.some(e => e.itemId === 'scenario_smuggled_gems' && e.quantity > 0) ? 1 : 0
  const rareBonus = (warbandRules(roster.warbandTemplateId).rareRollBonus ?? 0) + pricing.rareRollBonus + warbandBonus.bonus + mapRareBonus + wornGemBonus + (roster.scenarioEffects?.rarePenalty ?? 0)
  const search = isRare && searchTotal !== null ? rareSearch(item, searchTotal + rareBonus) : null
  const needsSearcher = isRare && tracked
  const searcherOk = !needsSearcher || (searcherId !== '' && searchers.some((h) => h.id === searcherId))
  const available = kind === 'common' || kind === 'special' || search?.available === true

  // ---- Price ----
  const rolledTotal = priceSpec ? diceTotal(priceSpec, faces) : undefined
  const quote = item.price.base === null ? null : priceSpec ? (rolledTotal === null ? null : itemPrice(item, houseRules, rolledTotal)) : itemPrice(item, houseRules)
  // Map campaigns: a district held makes some items half price (rounded down).
  const mapHalf = halfPriceItemSource(trade.perks, item.id)
  const listedTotal = quote?.total ?? null
  const computed = listedTotal !== null && mapHalf ? Math.floor(listedTotal / 2) : listedTotal
  const unitPrice = priceOverride !== null ? (overrideReady(priceOverride) ? priceOverride.amount : null) : (computed ?? manualPrice)
  const priceReady = unitPrice !== null && Number.isInteger(unitPrice) && unitPrice >= 0
  // Two pistols bought together are a brace at the bracketed price (the item's own line, house rules aside).
  const braceAmount = braceAmountOf(item.price.text)
  const isBrace = braceAmount !== null && quantity === 2 && priceOverride === null && computed !== null
  const beforeScenarioPrice = priceReady ? (isBrace ? braceAmount : unitPrice * quantity) : null
  const total = beforeScenarioPrice === null ? null : priceOverride !== null ? beforeScenarioPrice : scenarioPurchasePrice(beforeScenarioPrice, roster.scenarioEffects?.trade)
  const affordable = total !== null && total <= roster.gold
  // "You can only buy one rare item for each successful roll" — a brace of pistols is one purchase priced for two, so it keeps its own cap of 2.
  const rareMaxQty = isRare ? (braceAmount !== null ? 2 : 1) : null
  const withinRareCap = rareMaxQty === null || quantity <= rareMaxQty

  const canBuy = canTrade && available && searcherOk && priceReady && affordable && withinRareCap && (!isRare || !searchRecorded) && (!isMap || mapResult !== null) && !needsReason && huntPassed && !huntRecorded && (!upgrade || upgradeBase !== '')

  /** A henchman group is equipped alike, so default to one per model when it is picked. */
  function chooseDestination(key: string) {
    setDestinationKey(key)
    const loc = parseLocationKey(key)
    if (loc.kind === 'henchmanGroup') {
      const size = roster.henchmenGroups.find((g) => g.id === loc.id)?.size
      if (size) setQuantity(size)
    } else if (destinationKey.startsWith('henchmanGroup:')) {
      setQuantity(1)
    }
  }

  async function buy() {
    if (unitPrice === null) return
    const notes = [mapResult?.note, upgrade && upgradeBase ? `base: ${upgradeBase}` : null].filter((n): n is string => Boolean(n)).join(' · ') || undefined
    const reasons = [
      roster.scenarioEffects?.trade && priceOverride === null ? `${roster.scenarioEffects.notes.join(" ")} Purchase total: ${total} gc.` : null,
      overrideReady(priceOverride) && computed !== null ? overrideNote(`${item.name} price`, `${computed} gc`, `${priceOverride.amount} gc`, priceOverride.reason) : null,
      warnings.length > 0 ? `${item.name} bought despite: ${warnings.join(' ')} Reason: ${restrictionReason.trim()}` : null,
    ].filter((r): r is string => Boolean(r))
    const ok = await run(() => buyItem(roster, item, unitPrice, parseLocationKey(destinationKey), quantity, notes, total ?? undefined).value, {
      heroesSearched: needsSearcher && searcherId ? [searcherId] : [],
      reason: reasons.length ? reasonWith('trading', reasons.join(' · ')) : undefined,
    })
    if (ok) onClose()
  }

  async function recordFailedSearch() {
    // A Familiar's ritual costs its gold whether or not it works.
    const spend = pricing.paidOnFailure && total !== null ? total : 0
    const ok = await run(() => (spend > 0 ? { ...roster, gold: Math.max(0, roster.gold - spend) } : roster), {
      heroesSearched: [searcherId],
      reason: spend > 0 ? reasonWith('trading', `${item.name}: ${spend} gc spent on a failed search (paid on failure)`) : undefined,
    })
    if (ok) setSearchRecorded(true)
  }

  async function recordFailedHunt() {
    const spend = total ?? computed ?? unitPrice ?? 0
    const ok = await run(() => ({ ...roster, gold: Math.max(0, roster.gold - spend) }), {
      reason: reasonWith('trading', `${item.name}: hunt failed (rolled ${huntDie} against Strength ${huntStrength}); ${spend} gc spent`),
    })
    if (ok) setHuntRecorded(true)
  }

  function close() {
    clearError()
    onClose()
  }

  const footer = searchRecorded || huntRecorded ? (
    <Button variant="secondary" block onClick={close}>
      Close
    </Button>
  ) : isRare && search && !search.available && tracked ? (
    <Button block variant="secondary" pending={pending} disabled={!canTrade || !searcherOk} onClick={recordFailedSearch}>
      {pricing.paidOnFailure && total !== null ? `Record the failed search (${total} gc spent)` : 'Record the failed search'}
    </Button>
  ) : huntFailed ? (
    <Button block variant="secondary" pending={pending} disabled={!canTrade} onClick={recordFailedHunt}>
      Record the failed hunt (gold spent)
    </Button>
  ) : (
    <div className="flex flex-col gap-1.5">
      {isRare && searchTotal === null ? <p className="text-xs text-ink-dim">Roll the rarity dice first.</p> : null}
      <Button block pending={pending} disabled={!canBuy} onClick={buy}>
        {total === null ? 'Buy' : `Buy for ${total} gc`}
      </Button>
    </div>
  )

  return (
    <Sheet open onClose={close} title={item.name} description={`${availabilityLabel(item)} · ${item.price.text}`} footer={footer}>
      <div className="flex flex-col gap-4 py-2">
        {item.description ? <p className="text-sm leading-relaxed text-ink-dim">{item.description}</p> : null}
        {mapHalf && listedTotal !== null ? <Notice tone="info">{mapHalf.districtName}: half price, {computed} gc instead of {listedTotal} gc (map advantage).</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {roster.scenarioEffects?.notes.map(note => <p key={note} className="text-sm text-ink-dim">{note}</p>)}
        {pricing.notes.length > 0 ? (
          <Notice tone="info" title="For this buyer">
            {pricing.notes.join(' ')}
          </Notice>
        ) : null}
        {warbandBonus.notes.length > 0 && isRare ? <p className="text-xs text-ink-dim">{warbandBonus.notes.join(' ')}</p> : null}
        {warnings.length > 0 ? (
          <Notice tone="warn" title="The rules say">
            <ul className="flex flex-col gap-1">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <TextField label="Reason for buying anyway" value={restrictionReason} autoComplete="off" placeholder="The table agreed …" hint="Goes on the record with the purchase." onChange={(e) => setRestrictionReason(e.target.value)} />
          </Notice>
        ) : null}
        {upgrade ? (
          <section className="flex flex-col gap-2 rounded-md border border-border px-4 py-3">
            <h3 className="text-xs uppercase tracking-wider text-ink-dim">Applied to which weapon?</h3>
            <p className="text-xs text-ink-dim">{upgrade.note}</p>
            <SelectField label="Base weapon" hideLabel value={upgradeBase} onChange={(e) => setUpgradeBase(e.target.value)}>
              <option value="">Choose the weapon it upgrades</option>
              {[...new Set(upgradeBases)].map((id) => (
                <option key={id} value={id}>
                  {findWeapon(id)?.name ?? id}
                </option>
              ))}
            </SelectField>
            {upgrade.bases === 'anyMelee' && upgradeBases.length === 0 ? <p className="text-xs text-warn">Give it to a warrior who carries a hand weapon, or add the base weapon first.</p> : null}
          </section>
        ) : null}
        {hunt && !hunt.free ? (
          <section className="flex flex-col gap-2 rounded-md border border-border px-4 py-3">
            <h3 className="text-xs uppercase tracking-wider text-ink-dim">The hunt: D6 equal to or under Strength {huntStrength ?? '?'}</h3>
            {huntStrength === null ? (
              <p className="text-xs text-warn">Pick the hero who goes hunting as the destination first.</p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <DieField label="Hunt D6" sides={6} value={huntDie} onChange={setHuntDie} rollable disabled={huntRecorded} />
                {huntDie !== null ? <p className="text-sm text-ink">{huntDie <= huntStrength ? 'The beast is slain: buy the cloak below.' : 'The hunt fails; the gold is spent all the same.'}</p> : null}
              </div>
            )}
          </section>
        ) : null}

        {isMap ? (
          <section className="flex flex-col gap-2 rounded-md border border-border px-4 py-3">
            <h3 className="text-xs uppercase tracking-wider text-ink-dim">When you buy a map, roll a D6</h3>
            <div className="flex flex-wrap items-end gap-3">
              <DieField label="Map D6" sides={6} value={mapDie} onChange={setMapDie} rollable />
              {mapResult ? <p className="text-sm text-ink">{mapResult.text}</p> : <p className="text-xs text-ink-dim">The result is kept on the item and the exploration step offers the re-rolls it grants.</p>}
            </div>
          </section>
        ) : null}
        <section className="flex flex-col gap-3 rounded-md border border-border px-4 py-3">
          <h3 className="text-xs uppercase tracking-wider text-ink-dim">Destination</h3>
          <SelectField label="Give to" hideLabel value={destinationKey} onChange={(e) => chooseDestination(e.target.value)}>
            <option value="stash">Stash</option>
            <optgroup label="Heroes">
              {destinations
                .filter((d) => d.group === 'Heroes')
                .map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Henchmen">
              {destinations
                .filter((d) => d.group === 'Henchmen')
                .map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
            </optgroup>
          </SelectField>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">Quantity</span>
            <Stepper label="quantity" value={quantity} min={1} max={rareMaxQty} onChange={setQuantity} />
          </div>
          {isRare ? (
            <p className="text-xs text-ink-dim">{rareMaxQty === 2 ? 'Two make a brace at the bracketed price; that is the most a single roll allows.' : 'The rulebook allows one rare item per successful roll.'}</p>
          ) : null}
          {destinationKey.startsWith('henchmanGroup:') ? (
            <p className="text-xs text-ink-dim">Every member of a henchman group must be equipped alike, so buy one per model.</p>
          ) : null}
        </section>
        {isRare ? (
          <section className="flex flex-col gap-3 rounded-md border border-border px-4 py-3">
            <h3 className="text-xs uppercase tracking-wider text-ink-dim">Rare {item.availability.rarity}: roll 2D6{rareBonus ? ` (${rareBonus > 0 ? '+' : ''}${rareBonus} for this search${wornGemBonus ? ', +1 from worn Smuggled Gems' : ''}${mapRareBonus ? `, ${mapRareBonus} of it from ${trade.perks?.rareRollSource?.districtName}` : ''})` : ''}</h3>
            {needsSearcher ? (
              searchers.length === 0 ? (
                <Notice tone="warn">Every hero able to search has done so this sequence{downCount > 0 ? ` (${downCount} taken out of action may not)` : ''}. No more rare-item rolls until the next battle.</Notice>
              ) : (
                <SelectField
                  label="Hero searching"
                  hint={`${searchers.length} ${searchers.length === 1 ? 'search' : 'searches'} left. One roll per hero per sequence.${downCount > 0 ? ` ${downCount} ${downCount === 1 ? 'hero' : 'heroes'} taken out of action cannot search.` : ''}`}
                  value={searcherId}
                  disabled={searchRecorded}
                  onChange={(e) => setSearcherId(e.target.value)}
                >
                  {searchers.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </SelectField>
              )
            ) : (
              <p className="text-xs text-ink-dim">No post-battle sequence in progress, so this roll is not counted against a hero.</p>
            )}
            <div className="flex items-end gap-3">
              {searchFaces.map((face, i) => (
                <DieField
                  key={i}
                  label={`Die ${i + 1}`}
                  sides={6}
                  value={face}
                  rollable
                  disabled={searchRecorded || (needsSearcher && searchers.length === 0)}
                  onChange={(v) => setSearchFaces((prev) => prev.map((p, n) => (n === i ? v : p)))}
                />
              ))}
              {searchTotal !== null ? (
                <span className="pb-2 text-base tabular-nums text-ink">
                  = {searchTotal} <span className="text-ink-dim">vs {item.availability.rarity}</span>
                </span>
              ) : null}
            </div>
            {search ? (
              search.available ? (
                <Notice tone="success">Found. The merchant has one; agree the price below.</Notice>
              ) : searchRecorded ? (
                <Notice tone="info">Search recorded. This hero cannot look again until the next battle.</Notice>
              ) : tracked ? (
                <Notice tone="warn">Not available this time. Record the search so the roll stands; the hero may not re-roll.</Notice>
              ) : (
                <Notice tone="warn">Not available on that roll.</Notice>
              )
            ) : null}
          </section>
        ) : null}

        {kind === 'special' ? (
          <Notice tone="warn" title="Special availability">
            {item.availability.text}. This cannot be settled by a roll; buy it only if your group agrees it is available.
          </Notice>
        ) : null}

        {available && !searchRecorded ? (
          <>
            <section className="flex flex-col gap-3 rounded-md border border-border px-4 py-3">
              <h3 className="text-xs uppercase tracking-wider text-ink-dim">Price</h3>
              {priceSpec ? (
                <div className="flex flex-wrap items-end gap-3">
                  {faces.map((face, i) => (
                    <DieField
                      key={i}
                      label={`${priceSpec.text} die ${i + 1}`}
                      sides={priceSpec.sides}
                      value={face}
                      rollable
                      onChange={(v) => setFaces((prev) => prev.map((p, n) => (n === i ? v : p)))}
                    />
                  ))}
                </div>
              ) : null}
              {item.price.base === null ? (
                <NumberField label="Agreed price (gc each)" value={manualPrice} allowEmpty hint={item.price.text} onChange={setManualPrice} />
              ) : quote ? (
                <p className="text-sm tabular-nums text-ink">{quote.text}</p>
              ) : (
                <p className="text-sm text-ink-dim">Roll the price dice to see the cost.</p>
              )}
              {computed !== null ? <OverrideField what="the cost" suggested={computed} value={priceOverride} onChange={setPriceOverride} /> : null}
            </section>


            <div className="flex items-baseline justify-between gap-3 px-1">
              <span className="text-sm text-ink-dim">Treasury {roster.gold} gc</span>
              {total !== null ? (
                <span className={`text-base tabular-nums ${affordable ? 'text-ink' : 'text-accent-strong'}`}>
                  {affordable ? `${roster.gold - total} gc after` : `${total - roster.gold} gc short`}
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </Sheet>
  )
}
