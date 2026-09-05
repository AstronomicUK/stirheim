import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { signIn } from '../../api/auth'
import { Button, Notice, TextField } from '../../ui'
import { FormPage } from './FormPage'
import { signInSchema, validate, type FieldErrors } from './schemas'

type Values = { email: string; password: string }

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [values, setValues] = useState<Values>({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors<Values>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const check = validate(signInSchema, values)
    if (!check.ok) return setErrors(check.errors)
    setErrors({})
    setPending(true)
    const result = await signIn(check.data.email, check.data.password)
    setPending(false)
    if (!result.ok) return setFormError(result.error)
    // The session store picks up SIGNED_IN; navigating now avoids a flash of the sign-in form.
    navigate(from, { replace: true })
  }

  return (
    <FormPage
      promises
      title="Sign in"
      description="Pick up your ledger where you left it."
      onSubmit={onSubmit}
      action={
        <Button type="submit" block pending={pending}>
          Sign in
        </Button>
      }
      footer={
        <>
          <Link to="/forgot-password" className="min-h-11 inline-flex items-center text-brass">
            Forgotten your password?
          </Link>
          <p>
            New here?{' '}
            <Link to="/sign-up" className="text-brass">
              Create an account
            </Link>
          </p>
        </>
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
        value={values.email}
        onChange={(e) => setValues({ ...values, email: e.target.value })}
        error={errors.email}
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={values.password}
        onChange={(e) => setValues({ ...values, password: e.target.value })}
        error={errors.password}
      />
      {formError ? <Notice tone="error">{formError}</Notice> : null}
    </FormPage>
  )
}
