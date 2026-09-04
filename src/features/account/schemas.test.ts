import { describe, expect, it } from 'vitest'
import { displayNameFormSchema, resetPasswordSchema, signInSchema, signUpSchema, validate } from './schemas'

describe('signUpSchema', () => {
  it('accepts a sane sign-up and trims text fields', () => {
    const r = validate(signUpSchema, { email: ' gm@stirheim.test ', password: 'stirheim-dev', displayName: ' Ulrich ' })
    expect(r).toEqual({ ok: true, data: { email: 'gm@stirheim.test', password: 'stirheim-dev', displayName: 'Ulrich' } })
  })

  it('reports one message per field', () => {
    const r = validate(signUpSchema, { email: 'nope', password: 'short', displayName: '' })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.email).toBe('Enter a valid email address.')
    expect(r.errors.password).toBe('Use at least 8 characters.')
    expect(r.errors.displayName).toBe('Enter a display name.')
  })

  it('caps the display name at 40 characters', () => {
    const r = validate(signUpSchema, { email: 'a@b.co', password: 'longenough', displayName: 'x'.repeat(41) })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.displayName).toBe('Use at most 40 characters.')
    expect(validate(signUpSchema, { email: 'a@b.co', password: 'longenough', displayName: 'x'.repeat(40) }).ok).toBe(true)
  })
})

describe('signInSchema', () => {
  it('only requires a password to be present', () => {
    expect(validate(signInSchema, { email: 'a@b.co', password: 'x' }).ok).toBe(true)
    const r = validate(signInSchema, { email: 'a@b.co', password: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.password).toBe('Enter your password.')
  })
})

describe('resetPasswordSchema', () => {
  it('requires both passwords to match', () => {
    const r = validate(resetPasswordSchema, { password: 'stirheim-dev', confirm: 'stirheim-def' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.confirm).toBe('The two passwords do not match.')
    expect(validate(resetPasswordSchema, { password: 'stirheim-dev', confirm: 'stirheim-dev' }).ok).toBe(true)
  })

  it('checks length before the match', () => {
    const r = validate(resetPasswordSchema, { password: 'short', confirm: 'short' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.password).toBe('Use at least 8 characters.')
  })
})

describe('displayNameFormSchema', () => {
  it('rejects whitespace-only names', () => {
    const r = validate(displayNameFormSchema, { displayName: '   ' })
    expect(r.ok).toBe(false)
  })
})
