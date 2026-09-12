import { findItem } from '../../rules/data/items'
import { itemRestrictionWarnings, equipmentRemovalWarnings, type ItemHolder } from '../../rules/resolve/itemRestrictions'
import { useMemo, useState } from 'react'
import { moveItem, type InventoryLocation } from '../../rules/resolve/trading'
import type { RosterItem } from '../../rules/types/roster'
import { Button, Notice, SelectField, Sheet, Stepper, TextField } from '../../ui'
import { itemName } from '../roster/shared/names'
import { Card, ItemLines, Tag } from '../roster/view/bits'
import { locationKey, locationLabel, locationOptions, moveStack, parseLocationKey, readInventory, type LocationOption } from './helpers'
import type { TradeContext } from './useTrade'

interface Selection {
  from: InventoryLocation
  item: RosterItem
}

export function StashTab({ trade }: { trade: TradeContext }) {
  const { roster, canTrade } = trade
  const locations = useMemo(() => locationOptions(roster), [roster])
  const [selection, setSelection] = useState<Selection | null>(null)
  const hiredSwords = roster.hiredSwords.filter((s) => s.status === 'active')

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-ink-dim">
        Swap equipment between the stash and your warriors. The app checks equipment restrictions and asks you to record a reason for any agreed exception.
      </p>
      {locations.map((loc) => (
        <Inventory
          key={loc.key}
          option={loc}
          items={readInventory(roster, loc.location)}
          flags={flagsFor(trade, loc.location)}
          canMove={canTrade}
          onMove={(item) => setSelection({ from: loc.location, item })}
        />
      ))}
      {hiredSwords.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-wider text-ink-dim">Hired swords</h3>
          {hiredSwords.map((s) => (
            <Card key={s.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{s.name}</span>
                <Tag>Kit fixed</Tag>
              </div>
              <ItemLines items={s.equipment} />
            </Card>
          ))}
          <p className="text-xs text-ink-dim">A hired sword's equipment is set by their entry and cannot be traded or swapped.</p>
        </section>
      ) : null}
      {selection ? (
        <MoveSheet
          key={`${locationKey(selection.from)}/${selection.item.itemId ?? selection.item.customName}`}
          selection={selection}
          locations={locations}
          trade={trade}
          onClose={() => setSelection(null)}
        />
      ) : null}
    </div>
  )
}

/** Informational notes from a hero's injuries that bear on what he can carry. */
function flagsFor(trade: TradeContext, loc: InventoryLocation): string[] {
  if (loc.kind !== 'hero') return []
  const hero = trade.roster.heroes.find((h) => h.id === loc.id)
  if (!hero) return []
  const out: string[] = []
  if (hero.flags.singleHandedWeaponsOnly) out.push('Severe arm wound: one single-handed weapon only')
  if (hero.flags.blindedInOneEye) out.push('Blinded in one eye')
  if (hero.flags.missNextGames) out.push(`Misses the next ${hero.flags.missNextGames} ${hero.flags.missNextGames === 1 ? 'game' : 'games'}`)
  return out
}

interface InventoryProps {
  option: LocationOption
  items: RosterItem[]
  flags: string[]
  canMove: boolean
  onMove: (item: RosterItem) => void
}

function Inventory({ option, items, flags, canMove, onMove }: InventoryProps) {
  return (
    <Card className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">{option.label}</span>
        {option.group ? <span className="text-xs text-ink-dim">{option.group === 'Heroes' ? 'Hero' : 'Henchman group'}</span> : null}
      </div>
      {flags.map((f) => (
        <Tag key={f} tone="warn">
          {f}
        </Tag>
      ))}
      {items.length === 0 ? (
        <p className="text-sm text-ink-dim">{option.location.kind === 'stash' ? 'The stash is empty.' : 'No equipment.'}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item, i) => (
            <li key={`${item.itemId ?? item.customName}-${i}`} className="flex items-center justify-between gap-3 py-1.5">
              <span className="min-w-0 truncate text-sm text-ink">
                {itemName(item)}
                {item.quantity > 1 ? <span className="text-ink-dim"> ×{item.quantity}</span> : null}
              </span>
              {canMove ? (
                <Button variant="ghost" className="min-h-9 shrink-0 px-2 text-sm" onClick={() => onMove(item)}>
                  Move
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

interface MoveSheetProps {
  selection: Selection
  locations: LocationOption[]
  trade: TradeContext
  onClose: () => void
}

function MoveSheet({ selection, locations, trade, onClose }: MoveSheetProps) {
  const { roster, pending, run, error, clearError, canTrade } = trade
  const fromKey = locationKey(selection.from)
  const targets = locations.filter((l) => l.key !== fromKey)
  const [toKey, setToKey] = useState(targets[0]?.key ?? '')
  const [quantity, setQuantity] = useState(selection.item.quantity)
  const [overrideReason, setOverrideReason] = useState('')
  const destination = parseLocationKey(toKey || 'stash')
  let holder: ItemHolder = { kind: 'stash', equipment: roster.stash }
  if (destination.kind === 'hero') {
    const hero = roster.heroes.find(h => h.id === destination.id)
    holder = { kind: 'hero', id: destination.id, name: hero?.name, unitTemplateId: hero?.unitTemplateId, flags: hero?.flags, equipment: [...(hero?.equipment ?? []), { ...selection.item, quantity }] }
  } else if (destination.kind === 'henchmanGroup') {
    const group = roster.henchmenGroups.find(g => g.id === destination.id)
    holder = { kind: 'henchmanGroup', id: destination.id, name: group?.name, unitTemplateId: group?.unitTemplateId, size: group?.size, equipment: [...(group?.equipment ?? []), { ...selection.item, quantity }] }
  }
  const catalogueItem = findItem(selection.item.itemId ?? '')
  const warnings = destination.kind !== 'stash' && catalogueItem ? itemRestrictionWarnings(roster, catalogueItem, holder, { alreadyHeld: true, bans: trade.houseRules.bans }) : []
  const sourceLocation = selection.from
  let sourceHolder: ItemHolder | undefined
  if (sourceLocation.kind === 'hero') {
    const source = roster.heroes.find(h => h.id === sourceLocation.id)
    if (source) sourceHolder = { kind: 'hero', id: source.id, name: source.name, unitTemplateId: source.unitTemplateId, equipment: source.equipment }
  } else if (sourceLocation.kind === 'henchmanGroup') {
    const source = roster.henchmenGroups.find(g => g.id === sourceLocation.id)
    if (source) sourceHolder = { kind: 'henchmanGroup', id: source.id, name: source.name, unitTemplateId: source.unitTemplateId, size: source.size, equipment: source.equipment }
  }
  if (sourceHolder) warnings.push(...equipmentRemovalWarnings(roster, sourceHolder, selection.item.itemId, quantity))
  const ready = canTrade && toKey !== '' && quantity >= 1 && (!warnings.length || Boolean(overrideReason.trim()))

  async function confirm() {
    const to = parseLocationKey(toKey)
    const ok = await run(() => {
      const itemId = selection.item.itemId
      if (itemId !== null) return moveItem(roster, selection.from, to, itemId, quantity).value
      return moveStack(roster, selection.from, to, selection.item, quantity)
    }, warnings.length ? { reason: `${itemName(selection.item)} moved to ${locationLabel(roster, to)} despite: ${warnings.join(' ')} Reason: ${overrideReason.trim()}` } : undefined)
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
      title={`Move ${itemName(selection.item)}`}
      description={`From ${locationLabel(roster, selection.from)}`}
      footer={
        <Button block pending={pending} disabled={!ready} onClick={confirm}>
          Move{quantity > 1 ? ` ${quantity}` : ''}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {targets.length === 0 ? (
          <Notice tone="info">There is nowhere else to put it: the warband has no other warriors.</Notice>
        ) : (
          <SelectField label="Move to" value={toKey} onChange={(e) => { setToKey(e.target.value); setOverrideReason('') }}>
            {targets.some((t) => !t.group) ? <option value="stash">Stash</option> : null}
            {(['Heroes', 'Henchmen'] as const).map((group) => {
              const list = targets.filter((t) => t.group === group)
              return list.length > 0 ? (
                <optgroup key={group} label={group}>
                  {list.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ) : null
            })}
          </SelectField>
        )}
        {selection.item.quantity > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">Quantity ({selection.item.quantity} held)</span>
            <Stepper label="quantity to move" value={quantity} min={1} max={selection.item.quantity} onChange={setQuantity} />
          </div>
        ) : null}
        {warnings.length ? <Notice tone="warn" title="Equipment restrictions">
          {warnings.map(warning => <p key={warning}>{warning}</p>)}
          <TextField label="Reason for moving anyway" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="The table agreed …" hint="Saved with this equipment move." />
        </Notice> : null}
        {toKey.startsWith('henchmanGroup:') ? (
          <p className="text-xs text-ink-dim">Henchmen in a group are equipped alike; move one per model to keep the roster tidy.</p>
        ) : null}
      </div>
    </Sheet>
  )
}
