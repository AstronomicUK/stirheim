import { useMemo, useState } from 'react'
import { warbandRules } from '../../rules/data/campaignRules'
import { SHOP_ITEMS } from '../../rules/data/items'
import { RARE_ROLL } from '../../rules/data/campaign/trading'
import { parseDice } from '../../rules/resolve/dice'
import { overrideNote, overrideReady, reasonWith, type Override } from '../../domain/override'
import { buyItem, itemPrice, rareSearch } from '../../rules/resolve/trading'
import type { Item } from '../../rules/types/items'
import { Button, DieField, NumberField, Notice, SelectField, Sheet, Stepper, TextField, OverrideField } from '../../ui'
import { Tag } from '../roster/view/bits'
import { availabilityLabel, diceTotal, eligibleSearchers, groupCatalogue, locationOptions, parseLocationKey, priceLine } from './helpers'
import type { TradeContext } from './useTrade'

export function BuyTab({ trade }: { trade: TradeContext }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Item | null>(null)
  const groups = useMemo(() => groupCatalogue(SHOP_ITEMS, query), [query])
  const searchesLeft = eligibleSearchers(trade.roster, trade.phase.heroesSearched).length

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

function BuySheet({ item, trade, onClose }: BuySheetProps) {
  const { roster, houseRules, phase, canTrade, pending, run, error, clearError } = trade
  const tracked = phase.matchId !== null
  const searchers = useMemo(() => eligibleSearchers(roster, phase.heroesSearched), [roster, phase.heroesSearched])
  const destinations = useMemo(() => locationOptions(roster), [roster])
  const priceSpec = useMemo(() => (item.price.dice ? parseDice(item.price.dice) : null), [item.price.dice])
  const rareSpec = useMemo(() => parseDice(RARE_ROLL), [])

  const [faces, setFaces] = useState<(number | null)[]>(() => (priceSpec ? Array.from({ length: priceSpec.count }, () => null) : []))
  const [manualPrice, setManualPrice] = useState<number | null>(null)
  const [priceOverride, setPriceOverride] = useState<Override | null>(null)
  const [searcherId, setSearcherId] = useState(searchers[0]?.id ?? '')
  const [searchFaces, setSearchFaces] = useState<(number | null)[]>([null, null])
  const [destinationKey, setDestinationKey] = useState('stash')
  const [quantity, setQuantity] = useState(1)
  const [searchRecorded, setSearchRecorded] = useState(false)

  // ---- Availability ----
  const kind = item.availability.kind
  const isRare = kind === 'rare' && item.availability.rarity !== undefined
  const searchTotal = diceTotal(rareSpec, searchFaces)
  const rareBonus = warbandRules(roster.warbandTemplateId).rareRollBonus ?? 0
  const search = isRare && searchTotal !== null ? rareSearch(item, searchTotal + rareBonus) : null
  const needsSearcher = isRare && tracked
  const searcherOk = !needsSearcher || (searcherId !== '' && searchers.some((h) => h.id === searcherId))
  const available = kind === 'common' || kind === 'special' || search?.available === true

  // ---- Price ----
  const rolledTotal = priceSpec ? diceTotal(priceSpec, faces) : undefined
  const quote = item.price.base === null ? null : priceSpec ? (rolledTotal === null ? null : itemPrice(item, houseRules, rolledTotal)) : itemPrice(item, houseRules)
  const computed = quote?.total ?? null
  const unitPrice = priceOverride !== null ? (overrideReady(priceOverride) ? priceOverride.amount : null) : (computed ?? manualPrice)
  const priceReady = unitPrice !== null && Number.isInteger(unitPrice) && unitPrice >= 0
  const total = priceReady ? unitPrice * quantity : null
  const affordable = total !== null && total <= roster.gold

  const canBuy = canTrade && available && searcherOk && priceReady && affordable && (!isRare || !searchRecorded)

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
    const ok = await run(() => buyItem(roster, item, unitPrice, parseLocationKey(destinationKey), quantity).value, {
      heroesSearched: needsSearcher && searcherId ? [searcherId] : [],
      reason: overrideReady(priceOverride) && computed !== null ? reasonWith('trading', overrideNote(`${item.name} price`, `${computed} gc`, `${priceOverride.amount} gc`, priceOverride.reason)) : undefined,
    })
    if (ok) onClose()
  }

  async function recordFailedSearch() {
    const ok = await run(() => roster, { heroesSearched: [searcherId] })
    if (ok) setSearchRecorded(true)
  }

  function close() {
    clearError()
    onClose()
  }

  const footer = searchRecorded ? (
    <Button variant="secondary" block onClick={close}>
      Close
    </Button>
  ) : isRare && search && !search.available && tracked ? (
    <Button block variant="secondary" pending={pending} disabled={!canTrade || !searcherOk} onClick={recordFailedSearch}>
      Record the failed search
    </Button>
  ) : (
    <Button block pending={pending} disabled={!canBuy} onClick={buy}>
      {total === null ? 'Buy' : `Buy for ${total} gc`}
    </Button>
  )

  return (
    <Sheet open onClose={close} title={item.name} description={`${availabilityLabel(item)} · ${item.price.text}`} footer={footer}>
      <div className="flex flex-col gap-4 py-2">
        {item.description ? <p className="text-sm leading-relaxed text-ink-dim">{item.description}</p> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}

        {isRare ? (
          <section className="flex flex-col gap-3 rounded-md border border-border px-4 py-3">
            <h3 className="text-xs uppercase tracking-wider text-ink-dim">Rare {item.availability.rarity}: roll 2D6{rareBonus ? ` (${rareBonus > 0 ? '+' : ''}${rareBonus} for this warband)` : ''}</h3>
            {needsSearcher ? (
              searchers.length === 0 ? (
                <Notice tone="warn">Every hero has already searched this sequence. No more rare-item rolls until the next battle.</Notice>
              ) : (
                <SelectField
                  label="Hero searching"
                  hint={`${searchers.length} ${searchers.length === 1 ? 'search' : 'searches'} left. One roll per hero per sequence.`}
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
                <Stepper label="quantity" value={quantity} min={1} onChange={setQuantity} />
              </div>
              {isRare && quantity > 1 ? <p className="text-xs text-warn">The rulebook allows one rare item per successful roll.</p> : null}
              {destinationKey.startsWith('henchmanGroup:') ? (
                <p className="text-xs text-ink-dim">Every member of a henchman group must be equipped alike, so buy one per model.</p>
              ) : null}
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
