import { useId } from 'react'
import type { Override } from '../domain/override'
import { NumberField } from './NumberField'
import { TextField } from './TextField'

export interface OverrideFieldProps {
  /** "the cost", "the hire fee", "the number of dice". */
  what: string
  /** What the app worked out, shown next to the switch. */
  suggested: number | null
  unit?: string
  value: Override | null
  onChange: (value: Override | null) => void
  disabled?: boolean
}

/**
 * The "suggested, not forced" control: a tick box to override the app's figure, the figure to use
 * instead, and the reason, which is logged with the change.
 */
export function OverrideField({ what, suggested, unit = 'gc', value, onChange, disabled = false }: OverrideFieldProps) {
  const id = useId()
  const on = value !== null
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-low px-3 py-2">
      <label htmlFor={id} className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-ink">
        <input
          id={id}
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-brass"
          checked={on}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? { amount: suggested ?? 0, reason: '' } : null)}
        />
        <span>
          Override {what}
          {suggested !== null ? <span className="text-ink-dim"> (suggested {suggested} {unit})</span> : null}
        </span>
      </label>
      {on ? (
        <div className="grid grid-cols-[7rem_1fr] gap-2">
          <NumberField label={`${unit === 'gc' ? 'Gold' : 'Amount'}`} value={value.amount} onChange={(v) => onChange({ amount: v ?? Number.NaN, reason: value.reason })} disabled={disabled} />
          <TextField label="Reason" value={value.reason} autoComplete="off" placeholder="e.g. GM ruling, house rule, map bonus" onChange={(e) => onChange({ amount: value.amount, reason: e.target.value })} error={value.reason.trim() ? undefined : 'Say why'} disabled={disabled} />
        </div>
      ) : null}
    </div>
  )
}
