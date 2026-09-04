import { describe, expect, it } from 'vitest'
import { GENERIC_AUTH_ERROR, friendlyAuthError } from './authErrors'

describe('friendlyAuthError', () => {
  it('prefers the machine-readable code', () => {
    expect(friendlyAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'That email and password do not match.',
    )
    expect(friendlyAuthError({ code: 'user_already_exists', message: 'x' })).toMatch(/already exists/)
    expect(friendlyAuthError({ code: 'weak_password', message: 'x' })).toMatch(/8 characters/)
    expect(friendlyAuthError({ code: 'email_not_confirmed', message: 'x' })).toMatch(/Confirm your email/)
  })

  it('falls back to matching the message when there is no code', () => {
    expect(friendlyAuthError({ message: 'Invalid login credentials' })).toBe('That email and password do not match.')
    expect(friendlyAuthError({ message: 'User already registered' })).toMatch(/already exists/)
    expect(friendlyAuthError({ message: 'Password should be at least 8 characters.' })).toMatch(/8 characters/)
    expect(friendlyAuthError({ message: 'Email rate limit exceeded' })).toMatch(/Too many attempts/)
    expect(friendlyAuthError({ message: 'Auth session missing!' })).toMatch(/expired/)
    expect(friendlyAuthError({ message: 'TypeError: Failed to fetch' })).toMatch(/connection/)
  })

  it('reports server trouble for 5xx statuses without a known message', () => {
    expect(friendlyAuthError({ message: 'unexpected_failure', status: 500 })).toMatch(/server is having trouble/)
  })

  it('passes through unknown messages and never returns an empty string', () => {
    expect(friendlyAuthError({ message: 'Something odd' })).toBe('Something odd')
    expect(friendlyAuthError({ message: '   ' })).toBe(GENERIC_AUTH_ERROR)
    expect(friendlyAuthError(null)).toBe(GENERIC_AUTH_ERROR)
    expect(friendlyAuthError(undefined)).toBe(GENERIC_AUTH_ERROR)
  })
})
