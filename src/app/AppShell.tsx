import { Outlet } from 'react-router'
import { Wordmark } from '../ui'
import { BottomNav } from './BottomNav'
import { useSession } from './session'

/** Root layout: compact header with the wordmark, a single phone-width column, and a tab bar when signed in. */
export function AppShell() {
  const status = useSession((s) => s.status)
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <Wordmark />
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-4">
        <Outlet />
      </main>
      {status === 'signed_in' ? <BottomNav /> : null}
    </div>
  )
}
