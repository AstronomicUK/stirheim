import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Spinner, Wordmark } from '../ui'
import { BottomNav } from './BottomNav'
import { SideRail } from './SideRail'
import { useSession } from './session'

/**
 * Root layout. On a phone: compact header, one column, a tab bar when signed in. From `lg`: the
 * navigation rail on the left and a wider content column; pages that want two columns use
 * TwoColumn inside it. Signed-out screens stay a single centred column at every width.
 */
export function AppShell() {
  const status = useSession((s) => s.status)
  const signedIn = status === 'signed_in'
  return (
    <div className={`min-h-dvh w-full ${signedIn ? 'lg:grid lg:grid-cols-[232px_minmax(0,1fr)]' : ''}`}>
      {signedIn ? <SideRail /> : null}
      <div className="flex min-h-dvh min-w-0 flex-col">
        {signedIn ? (
          <header className="flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] lg:hidden">
            <Wordmark />
          </header>
        ) : (
          <div className="pt-[env(safe-area-inset-top)]" />
        )}
        <main
          data-app-main
          className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pt-4 md:max-w-2xl ${
            signedIn ? 'pb-6 lg:max-w-6xl lg:px-10 lg:pb-12 lg:pt-8' : 'pb-[max(1.5rem,env(safe-area-inset-bottom))]'
          }`}
        >
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <Spinner label="Loading page" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
        {signedIn ? <BottomNav /> : null}
      </div>
    </div>
  )
}
