import { useId } from 'react'
import {
  addDraftEquipment,
  draftItemCost,
  removeDraftEquipment,
  setDraftEquipmentCost,
  type DraftItem,
  type DraftSubject,
  type EquipmentOption,
} from '../../../rules/resolve/builder'
import { Stepper } from '../../../ui'
import { itemName } from '../shared/names'
import { useDraftStore } from './draftStore'
import { formatAmount, itemCurrency, needsPrice, optionForItem } from './helpers'

export interface EquipmentRowsProps {
  subject: DraftSubject
  equipment: DraftItem[]
  /** The subject's equipment list, so a stack can be traced back to the option it came from. */
  options: EquipmentOption[]
  /** Group size, so the line shows what the whole group pays. 1 for a hero. */
  models?: number
}

/** The kit a warrior (or every model of a group) carries: one row per stack with a quantity stepper, remove and, when the list has no price, a price field. */
export function EquipmentRows({ subject, equipment, options, models = 1 }: EquipmentRowsProps) {
  const update = useDraftStore((s) => s.update)

  if (equipment.length === 0) return <p className="text-sm text-ink-dim">No equipment yet.</p>

  return (
    <ul className="flex flex-col divide-y divide-border">
      {equipment.map((item) => {
        const option = optionForItem(options, item)
        const each = draftItemCost(item)
        const currency = itemCurrency(item)
        const key = item.itemId ?? `custom:${item.customName ?? ''}`
        return (
          <li key={key} className="flex flex-col gap-2 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-ink">{itemName(item)}</span>
                <span className="font-mono text-xs tabular-nums text-ink-dim">
                  {item.costText}
                  {each !== null && models > 1 ? ` · ${formatAmount(each * models, currency)} for ${models}` : ''}
                  {each !== null && models === 1 ? ` · ${formatAmount(each, currency)}` : ''}
                </span>
              </div>
              {option ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Stepper
                    label={itemName(item)}
                    value={item.quantity}
                    min={0}
                    onChange={(next) =>
                      update((d) =>
                        next > item.quantity
                          ? addDraftEquipment(d, subject, option, next - item.quantity)
                          : removeDraftEquipment(d, subject, option, item.quantity - next),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${itemName(item)}`}
                    onClick={() => update((d) => removeDraftEquipment(d, subject, option, item.quantity))}
                    className="inline-flex min-h-11 items-center px-2 text-xs text-ink-dim hover:text-accent-strong"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="font-mono text-sm text-ink-dim">x{item.quantity}</span>
              )}
            </div>
            {option && needsPrice(item) ? <PriceField item={item} subject={subject} option={option} /> : null}
          </li>
        )
      })}
    </ul>
  )
}

export interface PriceFieldProps {
  item: DraftItem
  subject: DraftSubject
  option: EquipmentOption
}

/** Price per copy for a line the list only describes ("3 times the cost"). Blank = not decided yet. */
export function PriceField({ item, subject, option }: PriceFieldProps) {
  const update = useDraftStore((s) => s.update)
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-xs text-ink-dim">
        Price each ({option.cost.currency})
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        placeholder="?"
        value={item.unitCost ?? ''}
        onChange={(e) => {
          const raw = e.target.value.trim()
          const parsed = raw === '' ? null : Number.parseInt(raw, 10)
          const next = parsed === null || Number.isNaN(parsed) ? null : Math.max(0, parsed)
          update((d) => setDraftEquipmentCost(d, subject, option, next))
        }}
        className="min-h-11 w-24 rounded-md border border-warn/60 bg-surface px-3 font-mono text-base tabular-nums text-ink focus:border-brass focus:outline-none"
      />
    </div>
  )
}
