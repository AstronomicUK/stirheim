// Who is signed in right now. One zustand store, fed by supabase.auth and read by the router,
// the auth gate and the account screens.

import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { getProfile, type Profile } from '../api/auth'
import { supabase } from '../api/supabase'

export type SessionStatus = 'loading' | 'signed_out' | 'signed_in'

export interface SessionState {
  status: SessionStatus
  session: Session | null
  user: User | null
  profile: Profile | null
  /** Set when the user arrived through a password-recovery link; cleared once the password is changed. */
  passwordRecovery: boolean
  setProfile(profile: Profile | null): void
  clearPasswordRecovery(): void
  /** Re-read the profile row for the current user (after a display-name edit, for instance). */
  refreshProfile(): Promise<void>
}

export const useSession = create<SessionState>((set, get) => ({
  status: 'loading',
  session: null,
  user: null,
  profile: null,
  passwordRecovery: false,
  setProfile: (profile) => set({ profile }),
  clearPasswordRecovery: () => set({ passwordRecovery: false }),
  refreshProfile: async () => {
    const user = get().user
    if (!user) return
    const result = await getProfile(user.id)
    // Ignore a stale response if the user changed while we were waiting.
    if (result.ok && get().user?.id === user.id) set({ profile: result.data })
  },
}))

function applySession(session: Session | null) {
  const current = useSession.getState()
  const sameUser = session?.user.id === current.user?.id
  useSession.setState({
    status: session ? 'signed_in' : 'signed_out',
    session,
    user: session?.user ?? null,
    profile: sameUser ? current.profile : null,
    passwordRecovery: session ? current.passwordRecovery : false,
  })
  // supabase-js holds an internal lock while it emits auth events; querying inside the callback
  // can deadlock, so the profile fetch is deferred to the next tick.
  if (session && (!sameUser || !current.profile)) {
    setTimeout(() => void useSession.getState().refreshProfile(), 0)
  }
}

let started = false

/**
 * Initialise the store from the persisted session and keep it current. Safe to call more than
 * once; only the first call does anything. Returns a function that stops listening.
 */
export function startSessionListener(): () => void {
  if (started) return () => {}
  started = true

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      useSession.setState({ passwordRecovery: true })
    }
    applySession(session)
  })

  void supabase.auth.getSession().then(({ data: { session } }) => {
    // INITIAL_SESSION usually lands first; this only fills in if it has not.
    if (useSession.getState().status === 'loading') applySession(session)
  })

  return () => {
    data.subscription.unsubscribe()
    started = false
  }
}
