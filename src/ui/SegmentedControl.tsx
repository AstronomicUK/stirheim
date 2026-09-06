import { Icon, type IconName } from './icons'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Drawn before the label; the pill reads as a destination rather than a word. */
  icon?: IconName
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible name for the group ("Filter by source"). */
  label: string
}

/** A single-select row of pills; wraps onto further rows when they do not fit. */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${
              selected ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:text-ink'
            }`}
          >
            {option.icon ? <Icon name={option.icon} size={16} className={selected ? 'text-brass' : 'text-ink-dim'} /> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
