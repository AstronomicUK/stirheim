import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Spinner } from '../ui'
import { useSession } from './session'

function Waiting() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner label="Checking your session" />
    </div>
  )
}

/** Gate for screens that need a signed-in user. Sends visitors to /sign-in and remembers where they were going. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useSession((s) => s.status)
  const location = useLocation()
  if (status === 'loading') return <Waiting />
  if (status === 'signed_out') return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  return children
}

/** The opposite gate: sign-in and sign-up have nothing to offer someone already signed in. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const status = useSession((s) => s.status)
  if (status === 'loading') return <Waiting />
  if (status === 'signed_in') return <Navigate to="/" replace />
  return children
}
