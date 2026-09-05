import { useMemo, useState } from 'react'
import { sellItem } from '../../rules/resolve/trading'
import { Button, NumberField, Notice, Sheet, Stepper } from '../../ui'
import { itemName } from '../roster/shared/names'
import { Tag } from '../roster/view/bits'
import { sellForGold, sellListing, type SaleLine } from './helpers'
import type { TradeContext } from './useTrade'

export function SellTab({ trade }: { trade: TradeContext }) {
  const lines = useMemo(() => sellListing(trade.roster), [trade.roster])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const selected = lines.find((l) => l.key === selectedKey) ?? null
  const holders = useMemo(() => {
    const out: { holder: string; lines: SaleLine[] }[] = []
    for (const line of lines) {
      const last = out[out.length - 1]
      if (last && last.holder === line.holder) last.lines.push(line)
      else out.push({ holder: line.holder, lines: [line] })
    }
    return out
  }, [lines])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-ink-dim">
        Equipment sells for half its listed price, rounded down; variable-priced items fetch half the basic cost. Custom items and entries with no listed
        price take whatever the group agrees.
      </p>
      {lines.length === 0 ? <p className="text-sm text-ink-dim">Nothing to sell: the stash and every warrior are empty-handed.</p> : null}
      {holders.map(({ holder, lines: held }) => (
        <section key={holder} className="flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-wider text-ink-dim">{holder}</h3>
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
            {held.map((line) => (
              <li key={line.key}>
                <button
                  type="button"
                  disabled={!trade.canTrade}
                  onClick={() => setSelectedKey(line.key)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-high disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-ink">
                      {itemName(line.item)}
                      {line.item.quantity > 1 ? <span className="text-ink-dim"> ×{line.item.quantity}</span> : null}
                    </span>
                    <span className="text-xs tabular-nums text-ink-dim">
                      {line.base === null ? 'No listed price' : `Listed ${line.base} gc`}
                    </span>
                  </span>
                  {line.each === null ? <Tag tone="warn">Name a price</Tag> : <Tag tone="brass">{line.each} gc each</Tag>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {selected ? <SellSheet key={selected.key} line={selected} trade={trade} onClose={() => setSelectedKey(null)} /> : null}
    </div>
  )
}

function SellSheet({ line, trade, onClose }: { line: SaleLine; trade: TradeContext; onClose: () => void }) {
  const { roster, pending, run, error, clearError, canTrade } = trade
  const [quantity, setQuantity] = useState(1)
  const [manualGold, setManualGold] = useState<number | null>(null)
  const computed = line.each === null ? null : line.each * quantity
  const gold = computed ?? manualGold
  const ready = canTrade && gold !== null && Number.isInteger(gold) && gold >= 0

  async function confirm() {
    if (gold === null) return
    const ok = await run(() => {
      if (line.item.itemId !== null && line.base !== null) return sellItem(roster, line.location, line.item.itemId, quantity, line.base).value
      return sellForGold(roster, line.location, line.item, quantity, gold)
    })
    if (ok) onClose()
  }

  function close() {
    clearError()
    onClose()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={`Sell ${itemName(line.item)}`}
      description={`From ${line.holder}`}
      footer={
        <Button block pending={pending} disabled={!ready} onClick={confirm}>
          {gold === null ? 'Sell' : `Sell for ${gold} gc`}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {line.item.quantity > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">Quantity ({line.item.quantity} held)</span>
            <Stepper label="quantity to sell" value={quantity} min={1} max={line.item.quantity} onChange={setQuantity} />
          </div>
        ) : null}
        {line.each !== null ? (
          <p className="text-sm tabular-nums text-ink">
            {line.each} gc each (half of {line.base} gc){quantity > 1 ? ` × ${quantity} = ${computed} gc` : ''}
          </p>
        ) : (
          <NumberField
            label="Sale price (gc, total)"
            value={manualGold}
            allowEmpty
            hint={
              line.item.itemId === null
                ? 'A custom item has no catalogue price. Enter what the group agrees it fetches.'
                : `${line.catalogue?.price.text ?? 'No cost listed'}. Enter what the group agrees it fetches.`
            }
            onChange={setManualGold}
          />
        )}
        {line.item.notes ? <p className="text-xs text-ink-dim">{line.item.notes}</p> : null}
      </div>
    </Sheet>
  )
}
