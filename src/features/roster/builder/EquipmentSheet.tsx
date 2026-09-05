import {
  addDraftEquipment,
  removeDraftEquipment,
  type DraftItem,
  type DraftSubject,
  type EquipmentOption,
} from '../../../rules/resolve/builder'
import { Button, Sheet, Stepper } from '../../../ui'
import { useDraftStore } from './draftStore'
import { PriceField } from './EquipmentRows'
import { groupEquipmentOptions, optionForItem, quantityOf } from './helpers'

export interface EquipmentSheetProps {
  open: boolean
  onClose: () => void
  /** Who is shopping: "Hans (Mercenary Captain)" or "The Lads (each model)". */
  subjectLabel: string
  subject: DraftSubject
  equipment: DraftItem[]
  options: EquipmentOption[]
}

/** The unit's equipment list as a shopping sheet: every line with its price text and a quantity stepper. */
export function EquipmentSheet({ open, onClose, subjectLabel, subject, equipment, options }: EquipmentSheetProps) {
  const update = useDraftStore((s) => s.update)
  const groups = groupEquipmentOptions(options)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add equipment"
      description={subjectLabel}
      footer={
        <Button block onClick={onClose}>
          Done
        </Button>
      }
    >
      {groups.length === 0 ? (
        <p className="py-4 text-sm text-ink-dim">This unit has no equipment list.</p>
      ) : (
        <div className="flex flex-col gap-5 pb-2">
          {groups.map((group) => (
            <section key={group.section} className="flex flex-col gap-1">
              <h3 className="text-xs uppercase tracking-wider text-ink-dim">{group.title}</h3>
              <ul className="flex flex-col divide-y divide-border">
                {group.options.map((option) => {
                  const quantity = quantityOf(equipment, option)
                  const unpriced = option.cost.kind === 'multiplier' || option.cost.kind === 'unknown'
                  const stack = quantity > 0 ? equipment.find((item) => optionForItem([option], item) === option) : undefined
                  return (
                    <li key={option.name} className="flex flex-col gap-2 py-2">
                      <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        <span className={`truncate text-sm ${quantity > 0 ? 'text-ink' : 'text-ink-dim'}`}>{option.name}</span>
                        <span className="font-mono text-xs tabular-nums text-ink-dim">
                          {option.cost.text}
                          {unpriced ? ' · enter the price once taken' : ''}
                        </span>
                        {!option.item ? <span className="text-xs text-warn">Not in the item catalogue; saved by name.</span> : null}
                      </div>
                      <Stepper
                        label={option.name}
                        value={quantity}
                        min={0}
                        onChange={(next) =>
                          update((d) =>
                            next > quantity
                              ? addDraftEquipment(d, subject, option, next - quantity)
                              : removeDraftEquipment(d, subject, option, quantity - next),
                          )
                        }
                      />
                      </div>
                      {stack && unpriced ? <PriceField item={stack} subject={subject} option={option} /> : null}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Sheet>
  )
}
