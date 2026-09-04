import { Link, Outlet } from 'react-router'
import { Wordmark } from '../ui'
import { useSession } from './session'

/** Root layout: compact header with the wordmark, then a single phone-width column. */
export function AppShell() {
  const status = useSession((s) => s.status)
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <Wordmark />
        {status === 'signed_in' ? (
          <Link to="/account" className="min-h-11 inline-flex items-center px-2 text-sm text-ink-dim hover:text-ink">
            Account
          </Link>
        ) : null}
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <Outlet />
      </main>
    </div>
  )
}
