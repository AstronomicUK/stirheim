// Maps Supabase Auth errors to the short, plain sentences shown under a form. Pure.

export interface AuthErrorLike {
  code?: string | null
  message: string
  status?: number
}

export const GENERIC_AUTH_ERROR = 'Something went wrong. Try again.'

const BY_CODE: Record<string, string> = {
  invalid_credentials: 'That email and password do not match.',
  email_not_confirmed: 'Confirm your email first. The link is in your inbox.',
  user_already_exists: 'An account with that email already exists. Sign in instead.',
  email_exists: 'An account with that email already exists. Sign in instead.',
  weak_password: 'Choose a longer password: at least 8 characters.',
  same_password: 'Choose a password you have not used before.',
  over_email_send_rate_limit: 'Too many attempts. Wait a minute and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
  otp_expired: 'That link has expired. Request a new one.',
  session_not_found: 'Your session has ended. Sign in again.',
  session_expired: 'Your session has ended. Sign in again.',
  refresh_token_not_found: 'Your session has ended. Sign in again.',
  signup_disabled: 'Sign-ups are closed at the moment.',
  email_address_invalid: 'Enter a valid email address.',
  validation_failed: 'Enter a valid email address.',
  user_not_found: 'No account uses that email.',
  email_provider_disabled: 'Email sign-in is switched off for this site.',
}

const BY_MESSAGE: Array<[RegExp, string]> = [
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/already (been )?registered/i, BY_CODE.user_already_exists],
  [/password should be at least/i, BY_CODE.weak_password],
  [/different from the old password/i, BY_CODE.same_password],
  [/rate limit/i, BY_CODE.over_email_send_rate_limit],
  [/auth session missing/i, 'That link has expired or was already used. Request a new one.'],
  [/invalid format/i, BY_CODE.email_address_invalid],
  [/failed to fetch|network|load failed/i, 'Could not reach the server. Check your connection and try again.'],
]

/** A short sentence to show the user for a Supabase auth error. Never returns an empty string. */
export function friendlyAuthError(error: AuthErrorLike | null | undefined): string {
  if (!error) return GENERIC_AUTH_ERROR
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code]
  for (const [pattern, copy] of BY_MESSAGE) {
    if (pattern.test(error.message)) return copy
  }
  if (error.status !== undefined && error.status >= 500) {
    return 'The server is having trouble. Try again in a moment.'
  }
  const trimmed = error.message.trim()
  return trimmed === '' ? GENERIC_AUTH_ERROR : trimmed
}
