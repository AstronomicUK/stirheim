import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useCreateCampaign } from '../../api/campaigns'
import { Button, Notice, PageHeader, TextField } from '../../ui'
import { TextLink } from './bits'
import { SettingsFields } from './SettingsFields'
import { defaultSettingsForm, settingsFromForm, validateCampaignName, type SettingsForm, type SettingsFormErrors } from './settingsForm'

export function NewCampaignPage() {
  const navigate = useNavigate()
  const create = useCreateCampaign()
  const [name, setName] = useState('')
  const [form, setForm] = useState<SettingsForm>(defaultSettingsForm)
  const [rules, setRules] = useState('')
  const [errors, setErrors] = useState<SettingsFormErrors & { name?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    const nameError = validateCampaignName(name)
    const result = settingsFromForm(form)
    if (nameError || !result.ok) {
      setErrors({ name: nameError, ...(result.ok ? {} : result.errors) })
      return
    }
    setErrors({})
    try {
      const id = await create.mutateAsync({ name: name.trim(), settings: result.settings, rules_markdown: rules })
      navigate(`/campaigns/${id}`, { replace: true })
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not create the campaign.')
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="New campaign"
        title="Start a campaign"
        description="You will run it as GM. Players join with the invite code the campaign is given on creation; you can change every setting later."
        aside={<TextLink to="/campaigns">Cancel</TextLink>}
      />

      <TextField
        label="Campaign name"
        value={name}
        required
        maxLength={80}
        autoComplete="off"
        placeholder="The Stirheim Ledger"
        error={errors.name}
        onChange={(e) => {
          setName(e.target.value)
          if (errors.name) setErrors((x) => ({ ...x, name: undefined }))
        }}
      />

      <SettingsFields
        form={form}
        onChange={(next) => {
          setForm(next)
          if (errors.startingGold || errors.maxRosters) setErrors((x) => ({ ...x, startingGold: undefined, maxRosters: undefined }))
        }}
        errors={errors}
        rules={rules}
        onRulesChange={setRules}
        disabled={create.isPending}
      />

      {submitError ? <Notice tone="error">{submitError}</Notice> : null}

      <div className="mt-auto pt-2">
        <div className="sticky bottom-0 -mx-5 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button type="submit" block pending={create.isPending}>
            Create campaign
          </Button>
        </div>
      </div>
    </form>
  )
}
