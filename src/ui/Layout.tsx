// Responsive building blocks. The app is one column on a phone; from `lg` (1024 px) a page may
// split into a wide main column and a narrower rail (see useMediaQuery for the matching hook).

import type { ReactNode } from 'react'

export interface TwoColumnProps {
  children: ReactNode
  /** The narrower column: actions, summaries, history. Rendered below the main column on a phone. */
  rail: ReactNode
  /** Put the rail first on a phone (for a page whose actions matter more than its body). */
  railFirst?: boolean
  /** Keep the rail pinned while the main column scrolls (desktop only). */
  stickyRail?: boolean
}

/** Main column plus rail from `lg`; a single column below that. */
export function TwoColumn({ children, rail, railFirst = false, stickyRail = true }: TwoColumnProps) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10">
      <div className={`flex min-w-0 flex-col gap-6 ${railFirst ? 'order-2 lg:order-1' : ''}`}>{children}</div>
      <div className={`flex flex-col gap-6 ${railFirst ? 'order-1 lg:order-2' : ''} ${stickyRail ? 'lg:sticky lg:top-6' : ''}`}>{rail}</div>
    </div>
  )
}
