import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { requestPasswordReset } from '../../api/auth'
import { Button, Notice, PageHeader, TextField } from '../../ui'
import { FormPage } from './FormPage'
import { forgotPasswordSchema, validate } from './schemas'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const check = validate(forgotPasswordSchema, { email })
    if (!check.ok) return setError(check.errors.email)
    setError(undefined)
    setPending(true)
    const result = await requestPasswordReset(check.data.email)
    setPending(false)
    if (!result.ok) return setFormError(result.error)
    setSentTo(check.data.email)
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6 pt-6">
        <PageHeader eyebrow="Sent" title="Check your email" />
        <Notice tone="success">
          If <span className="text-ink">{sentTo}</span> has an account, a reset link is on its way. Open it on this device
          to choose a new password.
        </Notice>
        <Link to="/sign-in" className="min-h-11 inline-flex items-center text-brass">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <FormPage
      title="Reset your password"
      description="Enter the email you signed up with and we will send a link."
      onSubmit={onSubmit}
      action={
        <Button type="submit" block pending={pending}>
          Send reset link
        </Button>
      }
      footer={
        <Link to="/sign-in" className="min-h-11 inline-flex items-center text-brass">
          Back to sign in
        </Link>
      }
    >
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      {formError ? <Notice tone="error">{formError}</Notice> : null}
    </FormPage>
  )
}
