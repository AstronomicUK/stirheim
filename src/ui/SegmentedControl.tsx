export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible name for the group ("Filter by source"). */
  label: string
}

/** A single-select row of pills. Scrolls sideways when there are more than fit a phone. */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${
              selected ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
