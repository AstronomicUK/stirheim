export interface SpinnerProps {
  size?: 'sm' | 'md'
  label?: string
}

export function Spinner({ size = 'md', label = 'Loading' }: SpinnerProps) {
  const dims = size === 'sm' ? 'h-4 w-4 border-2' : 'h-7 w-7 border-2'
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <span className={`${dims} animate-spin rounded-full border-ink-dim/40 border-t-brass`} />
    </span>
  )
}
