import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { signOut, updateDisplayName } from '../../api/auth'
import { queryClient } from '../../app/queryClient'
import { useSession } from '../../app/session'
import { Button, Notice, PageHeader, TextField } from '../../ui'
import { DISPLAY_NAME_MAX, displayNameFormSchema, validate } from './schemas'

export function AccountPage() {
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const profile = useSession((s) => s.profile)
  const setProfile = useSession((s) => s.setProfile)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [pending, setPending] = useState<'name' | 'signout' | null>(null)

  const displayName = profile?.display_name ?? ''

  function startEditing() {
    setDraft(displayName)
    setFieldError(undefined)
    setMessage(null)
    setEditing(true)
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    const check = validate(displayNameFormSchema, { displayName: draft })
    if (!check.ok) return setFieldError(check.errors.displayName)
    setFieldError(undefined)
    setPending('name')
    const result = await updateDisplayName(user.id, check.data.displayName)
    setPending(null)
    if (!result.ok) return setMessage({ tone: 'error', text: result.error })
    setProfile(result.data)
    setEditing(false)
    setMessage({ tone: 'success', text: 'Display name saved.' })
  }

  async function onSignOut() {
    setPending('signout')
    const result = await signOut()
    setPending(null)
    if (!result.ok) return setMessage({ tone: 'error', text: result.error })
    queryClient.clear()
    navigate('/sign-in', { replace: true })
  }

  return (
    <>
      <PageHeader eyebrow="Account" title={displayName || 'Your account'} description="How you appear to the other players." />

      <section className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
        <div className="flex flex-col gap-1 px-4 py-3">
          <span className="text-xs uppercase tracking-wider text-ink-dim">Email</span>
          <span className="break-all text-ink">{user?.email ?? 'Unknown'}</span>
        </div>

        {editing ? (
          <form onSubmit={saveName} noValidate className="flex flex-col gap-3 px-4 py-4">
            <TextField
              label="Display name"
              name="displayName"
              autoComplete="nickname"
              maxLength={DISPLAY_NAME_MAX}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              error={fieldError}
              hint={`Up to ${DISPLAY_NAME_MAX} characters.`}
            />
            <div className="flex gap-3">
              <Button type="submit" pending={pending === 'name'} className="flex-1">
                Save
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)} disabled={pending === 'name'} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-ink-dim">Display name</span>
              <span className="truncate text-ink">{displayName || (profile ? '' : 'Loading...')}</span>
            </div>
            <Button variant="secondary" onClick={startEditing} disabled={!profile}>
              Edit
            </Button>
          </div>
        )}
      </section>

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <div className="mt-auto pt-4">
        <Button variant="danger" block pending={pending === 'signout'} onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </>
  )
}
