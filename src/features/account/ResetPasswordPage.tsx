import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { updatePassword } from '../../api/auth'
import { useSession } from '../../app/session'
import { Button, Notice, PageHeader, Spinner, TextField } from '../../ui'
import { FormPage } from './FormPage'
import { PASSWORD_MIN, resetPasswordSchema, validate, type FieldErrors } from './schemas'

type Values = { password: string; confirm: string }

/** Supabase reports an expired or reused link in the URL fragment rather than as an auth event. */
function linkErrorFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null
  const params = new URLSearchParams(hash)
  const code = params.get('error_code')
  const description = params.get('error_description')
  if (!code && !description) return null
  if (code === 'otp_expired') return 'That link has expired. Request a new one.'
  return description?.replace(/\+/g, ' ') ?? 'That link did not work. Request a new one.'
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const status = useSession((s) => s.status)
  const passwordRecovery = useSession((s) => s.passwordRecovery)
  const clearPasswordRecovery = useSession((s) => s.clearPasswordRecovery)
  const [linkError] = useState(linkErrorFromHash)
  const [values, setValues] = useState<Values>({ password: '', confirm: '' })
  const [errors, setErrors] = useState<FieldErrors<Values>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const check = validate(resetPasswordSchema, values)
    if (!check.ok) return setErrors(check.errors)
    setErrors({})
    setPending(true)
    const result = await updatePassword(check.data.password)
    setPending(false)
    if (!result.ok) return setFormError(result.error)
    clearPasswordRecovery()
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6 pt-6">
        <PageHeader eyebrow="Done" title="Password changed" />
        <Notice tone="success">You are signed in with your new password.</Notice>
        <Button block onClick={() => navigate('/', { replace: true })}>
          Continue
        </Button>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Checking the reset link" />
      </div>
    )
  }

  // A live session is what updateUser needs. The recovery link creates one; a normal sign-in also counts.
  const mayReset = status === 'signed_in'

  if (linkError || !mayReset) {
    return (
      <div className="flex flex-col gap-6 pt-6">
        <PageHeader eyebrow="Reset" title="This link did not work" />
        <Notice tone="warn">{linkError ?? 'The reset link has expired or was already used.'}</Notice>
        <Link to="/forgot-password" className="min-h-11 inline-flex items-center text-brass">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <FormPage
      title="Choose a new password"
      description={passwordRecovery ? 'The link worked. Set a new password to finish.' : 'You are signed in. Set a new password below.'}
      onSubmit={onSubmit}
      action={
        <Button type="submit" block pending={pending}>
          Save new password
        </Button>
      }
    >
      <TextField
        label="New password"
        type="password"
        name="password"
        autoComplete="new-password"
        autoFocus
        value={values.password}
        onChange={(e) => setValues({ ...values, password: e.target.value })}
        error={errors.password}
        hint={`At least ${PASSWORD_MIN} characters.`}
      />
      <TextField
        label="Confirm new password"
        type="password"
        name="confirm"
        autoComplete="new-password"
        value={values.confirm}
        onChange={(e) => setValues({ ...values, confirm: e.target.value })}
        error={errors.confirm}
      />
      {formError ? <Notice tone="error">{formError}</Notice> : null}
    </FormPage>
  )
}
