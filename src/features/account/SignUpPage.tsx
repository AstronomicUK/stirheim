import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { signUp } from '../../api/auth'
import { Button, Notice, PageHeader, TextField } from '../../ui'
import { FormPage } from './FormPage'
import { DISPLAY_NAME_MAX, PASSWORD_MIN, signUpSchema, validate, type FieldErrors } from './schemas'

type Values = { displayName: string; email: string; password: string }

export function SignUpPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>({ displayName: '', email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors<Values>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const check = validate(signUpSchema, values)
    if (!check.ok) return setErrors(check.errors)
    setErrors({})
    setPending(true)
    const result = await signUp(check.data.email, check.data.password, check.data.displayName)
    setPending(false)
    if (!result.ok) return setFormError(result.error)
    if (result.data.status === 'confirm_email') return setConfirmEmail(result.data.email)
    navigate('/', { replace: true })
  }

  if (confirmEmail) {
    return (
      <div className="flex flex-col gap-6 pt-6">
        <PageHeader eyebrow="One more step" title="Check your email" />
        <Notice tone="success">
          We sent a confirmation link to <span className="text-ink">{confirmEmail}</span>. Open it on this device, then
          sign in.
        </Notice>
        <p className="text-sm leading-relaxed text-ink-dim">
          Nothing arrived after a few minutes? Check the junk folder, or try signing up again with the same address.
        </p>
        <Link to="/sign-in" className="min-h-11 inline-flex items-center text-brass">
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <FormPage
      title="Create an account"
      description="One account holds all your warbands. Your display name is what the other players see."
      onSubmit={onSubmit}
      action={
        <Button type="submit" block pending={pending}>
          Create account
        </Button>
      }
      footer={
        <p>
          Already have one?{' '}
          <Link to="/sign-in" className="text-brass">
            Sign in
          </Link>
        </p>
      }
    >
      <TextField
        label="Display name"
        name="displayName"
        autoComplete="nickname"
        maxLength={DISPLAY_NAME_MAX}
        autoFocus
        value={values.displayName}
        onChange={(e) => setValues({ ...values, displayName: e.target.value })}
        error={errors.displayName}
        hint={`Up to ${DISPLAY_NAME_MAX} characters.`}
      />
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        value={values.email}
        onChange={(e) => setValues({ ...values, email: e.target.value })}
        error={errors.email}
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => setValues({ ...values, password: e.target.value })}
        error={errors.password}
        hint={`At least ${PASSWORD_MIN} characters.`}
      />
      {formError ? <Notice tone="error">{formError}</Notice> : null}
    </FormPage>
  )
}
