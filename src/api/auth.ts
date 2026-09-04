// Thin, typed wrappers around Supabase Auth and the `profiles` table. Every function resolves
// (never throws) with an AuthResult so screens can render errors inline.

import type { Session, User } from '@supabase/supabase-js'
import { friendlyAuthError } from './authErrors'
import type { Database } from './database.types'
import { supabase } from './supabase'

export type Profile = Database['public']['Tables']['profiles']['Row']

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Outcome of a sign-up. Local Supabase has email confirmations off, so a session comes back at
 * once; the hosted project has them on, so `data.session` is null until the link is clicked.
 */
export type SignUpOutcome =
  | { status: 'signed_in'; session: Session; user: User }
  | { status: 'confirm_email'; email: string }

const ok = <T>(data: T): AuthResult<T> => ({ ok: true, data })
const fail = <T>(error: { code?: string | null; message: string; status?: number } | null): AuthResult<T> => ({
  ok: false,
  error: friendlyAuthError(error),
})

export async function signIn(email: string, password: string): Promise<AuthResult<Session>> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) return fail(error)
  if (!data.session) return fail({ message: 'Signed in but no session was returned. Try again.' })
  return ok(data.session)
}

export async function signUp(email: string, password: string, displayName: string): Promise<AuthResult<SignUpOutcome>> {
  const trimmedEmail = email.trim()
  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    // The DB trigger reads raw_user_meta_data.display_name when it creates the profile row.
    options: { data: { display_name: displayName.trim() } },
  })
  if (error) return fail(error)
  // Supabase returns a user with an empty identities array when the address is already taken
  // and confirmations are on (it will not say so outright, to avoid leaking who has an account).
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return fail({ code: 'user_already_exists', message: 'User already registered' })
  }
  if (data.session && data.user) return ok({ status: 'signed_in', session: data.session, user: data.user })
  return ok({ status: 'confirm_email', email: trimmedEmail })
}

export async function signOut(): Promise<AuthResult<null>> {
  const { error } = await supabase.auth.signOut()
  return error ? fail(error) : ok(null)
}

export async function requestPasswordReset(email: string): Promise<AuthResult<null>> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return error ? fail(error) : ok(null)
}

/** Requires a live session: either a normal sign-in or the one created by a recovery link. */
export async function updatePassword(newPassword: string): Promise<AuthResult<User>> {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return fail(error)
  return ok(data.user)
}

export async function getProfile(userId: string): Promise<AuthResult<Profile | null>> {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) return fail({ message: error.message })
  return ok(data)
}

export async function updateDisplayName(userId: string, displayName: string): Promise<AuthResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) return fail({ message: error.message })
  return ok(data)
}
