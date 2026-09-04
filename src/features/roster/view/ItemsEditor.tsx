import { useMemo } from 'react'
import type { ItemHolder } from '../../../domain'
import { ITEMS } from '../../../rules/data/items'
import type { ItemCategory } from '../../../rules/types/items'
import { Button, NumberField, SelectField, TextField } from '../../../ui'
import { Card } from './bits'
import { tempId, type ItemDraft } from './diff'
import type { DraftErrors } from './validate'

export interface HolderOption {
  id: string
  name: string
  type: Exclude<ItemHolder, 'stash'>
  group: 'Heroes' | 'Hired swords' | 'Henchmen'
}

export interface ItemsEditorProps {
  items: ItemDraft[]
  /** Saved heroes and groups only: a warrior added in this session cannot hold items until saved. */
  holders: HolderOption[]
  errors: DraftErrors
  onChange: (items: ItemDraft[]) => void
}

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  melee: 'Hand-to-hand weapons',
  missile: 'Missile weapons',
  blackpowder: 'Blackpowder weapons',
  armour: 'Armour',
  misc: 'Miscellaneous',
  animal: 'Animals',
}
const CATEGORY_ORDER: ItemCategory[] = ['melee', 'missile', 'blackpowder', 'armour', 'misc', 'animal']
const CUSTOM = '__custom__'

export function ItemsEditor({ items, holders, errors, onChange }: ItemsEditorProps) {
  const catalogue = useMemo(
    () => CATEGORY_ORDER.map((c) => ({ category: c, items: ITEMS.filter((i) => i.category === c).sort((a, b) => a.name.localeCompare(b.name)) })),
    [],
  )
  const holderGroups = useMemo(() => ['Heroes', 'Hired swords', 'Henchmen'].map((g) => ({ g, list: holders.filter((h) => h.group === g) })).filter((x) => x.list.length > 0), [holders])

  function update(id: string, patch: Partial<ItemDraft>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }
  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id))
  }
  function add() {
    onChange([
      ...items,
      { id: tempId('item'), isNew: true, holder_type: 'stash', holder_id: null, item_rules_id: 'dagger', custom_name: null, quantity: 1, notes: '' },
    ])
  }
  function setHolder(id: string, value: string) {
    if (value === '') return update(id, { holder_type: 'stash', holder_id: null })
    const holder = holders.find((h) => h.id === value)
    if (holder) update(id, { holder_type: holder.type, holder_id: holder.id })
  }
  function setItem(id: string, value: string) {
    if (value === CUSTOM) return update(id, { item_rules_id: null, custom_name: items.find((i) => i.id === id)?.custom_name ?? '' })
    update(id, { item_rules_id: value, custom_name: null })
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? <p className="text-sm text-ink-dim">No items on the roster.</p> : null}
      {items.map((item) => {
        const prefix = `items.${item.id}`
        const holderValue = item.holder_type === 'stash' ? '' : (item.holder_id ?? '')
        const holderKnown = holderValue === '' || holders.some((h) => h.id === holderValue)
        return (
          <Card key={item.id} className="flex flex-col gap-3 px-4 py-3">
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1">
                <SelectField label="Item" value={item.item_rules_id ?? CUSTOM} error={errors[`${prefix}.name`]} onChange={(e) => setItem(item.id, e.target.value)}>
                  <option value={CUSTOM}>Custom item…</option>
                  {catalogue.map((c) => (
                    <optgroup key={c.category} label={CATEGORY_LABEL[c.category]}>
                      {c.items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {item.item_rules_id && !ITEMS.some((i) => i.id === item.item_rules_id) ? <option value={item.item_rules_id}>{item.item_rules_id}</option> : null}
                </SelectField>
              </div>
              <NumberField label="Qty" value={item.quantity} error={errors[`${prefix}.quantity`]} className="w-20" onChange={(v) => update(item.id, { quantity: v ?? 0 })} />
            </div>
            {item.item_rules_id === null ? (
              <TextField label="Custom name" value={item.custom_name ?? ''} maxLength={80} placeholder="Lucky charm" onChange={(e) => update(item.id, { custom_name: e.target.value })} />
            ) : null}
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1">
                <SelectField label="Carried by" value={holderKnown ? holderValue : ''} error={errors[`${prefix}.holder`]} onChange={(e) => setHolder(item.id, e.target.value)}>
                  <option value="">Stash</option>
                  {holderGroups.map(({ g, list }) => (
                    <optgroup key={g} label={g}>
                      {list.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </SelectField>
              </div>
              <Button variant="ghost" className="px-2 text-accent-strong" onClick={() => remove(item.id)}>
                Remove
              </Button>
            </div>
          </Card>
        )
      })}
      <Button variant="secondary" block onClick={add}>
        Add item
      </Button>
    </div>
  )
}
