// Shared link shapes for the onboarding screens.

import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** A router link dressed as the primary button (a button inside an anchor is not valid HTML). */
export function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-base font-medium text-ink no-underline transition-colors hover:bg-accent-strong"
    >
      {children}
    </Link>
  )
}
