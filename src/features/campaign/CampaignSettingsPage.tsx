import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  useCampaign,
  useDeleteCampaign,
  useLeaveCampaign,
  useRegenerateInviteCode,
  useUpdateCampaign,
  type CampaignDetail,
  type CampaignMemberView,
} from '../../api/campaigns'
import { useSession } from '../../app/session'
import { Button, Notice, Sheet, Spinner, TextField } from '../../ui'
import { Card, Section, TextLink } from './bits'
import { formatInviteCode } from './inviteCode'
import { SettingsFields } from './SettingsFields'
import { formFromSettings, settingsFormEqual, settingsFromForm, validateCampaignName, type SettingsForm, type SettingsFormErrors } from './settingsForm'

export function CampaignSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const user = useSession((s) => s.user)
  const query = useCampaign(id)
  // Lives here because SettingsView remounts after a save; the "Saved." notice must outlive that.
  const [saved, setSaved] = useState(false)

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the campaign" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this campaign">
          {query.error.message}
        </Notice>
        <TextLink to="/campaigns">Back to your campaigns</TextLink>
      </>
    )
  }
  if (query.data.campaign.gm_id !== user?.id) {
    return (
      <>
        <Notice tone="info" title="GM only">
          Only {query.data.gm_display_name} can change this campaign's settings.
        </Notice>
        <TextLink to={`/campaigns/${query.data.campaign.id}`}>Back to the campaign</TextLink>
      </>
    )
  }
  // Re-key on the editable fields so a successful save (or another device's change to them) resets the
  // form to what is stored, while a new invite code or an archive toggle leaves unsaved edits alone.
  const { campaign } = query.data
  const stored = JSON.stringify([campaign.name, campaign.settings, campaign.rules_markdown])
  return <SettingsView key={stored} detail={query.data} saved={saved} setSaved={setSaved} />
}

function SettingsView({ detail, saved, setSaved }: { detail: CampaignDetail; saved: boolean; setSaved: (saved: boolean) => void }) {
  const { campaign, settings, members } = detail
  const navigate = useNavigate()
  const update = useUpdateCampaign(campaign.id)
  const regenerate = useRegenerateInviteCode(campaign.id)
  const remove = useDeleteCampaign()
  const leave = useLeaveCampaign()

  const [name, setName] = useState(campaign.name)
  const [form, setForm] = useState<SettingsForm>(() => formFromSettings(settings))
  const [rules, setRules] = useState(campaign.rules_markdown)
  const [errors, setErrors] = useState<SettingsFormErrors & { name?: string }>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [codeOpen, setCodeOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [removing, setRemoving] = useState<CampaignMemberView | null>(null)

  const original = formFromSettings(settings)
  const dirty = name.trim() !== campaign.name || rules !== campaign.rules_markdown || !settingsFormEqual(form, original)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    setSaved(false)
    const nameError = validateCampaignName(name)
    const result = settingsFromForm(form)
    if (nameError || !result.ok) {
      setErrors({ name: nameError, ...(result.ok ? {} : result.errors) })
      return
    }
    setErrors({})
    try {
      await update.mutateAsync({
        ...(name.trim() !== campaign.name ? { name: name.trim() } : {}),
        ...(settingsFormEqual(form, original) ? {} : { settings: result.settings }),
        ...(rules !== campaign.rules_markdown ? { rules_markdown: rules } : {}),
      })
      setSaved(true)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save the settings.')
    }
  }

  async function toggleArchive() {
    setActionError(null)
    try {
      await update.mutateAsync({ archived: !campaign.archived })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update the campaign.')
    }
  }

  async function confirmRegenerate() {
    setActionError(null)
    try {
      await regenerate.mutateAsync()
      setCodeOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not change the invite code.')
    }
  }

  async function confirmDelete() {
    setActionError(null)
    try {
      await remove.mutateAsync(campaign.id)
      navigate('/campaigns', { replace: true })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not delete the campaign.')
    }
  }

  async function confirmRemove() {
    if (!removing) return
    setActionError(null)
    try {
      await leave.mutateAsync({ campaignId: campaign.id, warbandId: removing.warband_id })
      setRemoving(null)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not remove that warband.')
    }
  }

  const deleteReady = confirmText.trim() === campaign.name.trim()

  return (
    <>
      <form onSubmit={save} noValidate className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">Settings</p>
              <h1 className="font-headline text-3xl leading-tight text-ink">{campaign.name}</h1>
            </div>
            <div className="shrink-0 pt-1">
              <TextLink to={`/campaigns/${campaign.id}`}>Done</TextLink>
            </div>
          </div>
        </header>

        <TextField
          label="Campaign name"
          value={name}
          required
          maxLength={80}
          autoComplete="off"
          error={errors.name}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
            if (errors.name) setErrors((x) => ({ ...x, name: undefined }))
          }}
        />

        <SettingsFields
          form={form}
          onChange={(next) => {
            setForm(next)
            setSaved(false)
            if (errors.startingGold || errors.maxRosters) setErrors((x) => ({ ...x, startingGold: undefined, maxRosters: undefined }))
          }}
          errors={errors}
          rules={rules}
          onRulesChange={(next) => {
            setRules(next)
            setSaved(false)
          }}
          disabled={update.isPending}
        />

        {saveError ? <Notice tone="error">{saveError}</Notice> : null}
        {saved && !dirty ? <Notice tone="success">Saved.</Notice> : null}

        <div className="sticky bottom-0 z-10 -mx-5 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button type="submit" block disabled={!dirty} pending={update.isPending}>
            {dirty ? 'Save changes' : 'Nothing to save'}
          </Button>
        </div>
      </form>

      <Section title="Members" aside={`${members.length} enrolled`}>
        {members.length === 0 ? (
          <p className="text-sm text-ink-dim">Nobody has enrolled yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
            {members.map((m) => (
              <li key={m.warband_id} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium text-ink">{m.warband.name}</span>
                  <span className="truncate text-sm text-ink-dim">
                    {m.display_name} · {m.warband.type_name} · rating {m.warband.rating}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/warbands/${m.warband_id}/edit`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface-high px-3 text-sm font-medium text-ink no-underline hover:border-ink-dim"
                  >
                    Edit warband
                  </Link>
                  <Button variant="danger" className="flex-1 text-sm" onClick={() => setRemoving(m)}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Invite code">
        <Card className="flex flex-col gap-3 px-4 py-3">
          <p className="text-2xl tracking-[0.15em] text-ink">{formatInviteCode(campaign.invite_code)}</p>
          <p className="text-sm leading-relaxed text-ink-dim">Issuing a new code stops the old one working. Current members stay enrolled.</p>
          <Button variant="secondary" block onClick={() => setCodeOpen(true)}>
            New invite code
          </Button>
        </Card>
      </Section>

      <Section title="Danger zone">
        {actionError ? <Notice tone="error">{actionError}</Notice> : null}
        <Card className="flex flex-col gap-3 px-4 py-3">
          <Button variant="secondary" block pending={update.isPending} onClick={toggleArchive}>
            {campaign.archived ? 'Unarchive campaign' : 'Archive campaign'}
          </Button>
          <p className="text-sm leading-relaxed text-ink-dim">
            {campaign.archived
              ? 'Bring the campaign back: the invite code admits players again.'
              : 'Archived campaigns drop to the bottom of everyone’s list and stop admitting players. Nothing is lost.'}
          </p>
          <Button
            variant="danger"
            block
            onClick={() => {
              setConfirmText('')
              setDeleteOpen(true)
            }}
          >
            Delete campaign
          </Button>
        </Card>
      </Section>

      <Sheet
        open={codeOpen}
        onClose={() => setCodeOpen(false)}
        title="Issue a new invite code?"
        description="Anyone holding the old code or link will no longer be able to join. Members already enrolled are not affected."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCodeOpen(false)} disabled={regenerate.isPending}>
              Keep it
            </Button>
            <Button className="flex-1" pending={regenerate.isPending} onClick={confirmRegenerate}>
              New code
            </Button>
          </div>
        }
      >
        <p className="py-2 text-xl tracking-[0.15em] text-ink-dim">{formatInviteCode(campaign.invite_code)}</p>
      </Sheet>

      <Sheet
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this warband?"
        description="It leaves the campaign but keeps its roster and history. The player can rejoin with the invite code."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setRemoving(null)} disabled={leave.isPending}>
              Keep it
            </Button>
            <Button variant="danger" className="flex-1" pending={leave.isPending} onClick={confirmRemove}>
              Remove
            </Button>
          </div>
        }
      >
        {removing ? (
          <p className="py-2 text-sm text-ink">
            {removing.warband.name} <span className="text-ink-dim">({removing.display_name})</span>
          </p>
        ) : null}
      </Sheet>

      <Sheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this campaign?"
        description="Memberships and the campaign's own history go with it. Players keep their warbands. This cannot be undone."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={remove.isPending}>
              Keep it
            </Button>
            <Button variant="danger" className="flex-1" disabled={!deleteReady} pending={remove.isPending} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          <TextField
            label="Type the campaign's name to confirm"
            hint={campaign.name}
            value={confirmText}
            autoComplete="off"
            autoCapitalize="off"
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>
      </Sheet>
    </>
  )
}
