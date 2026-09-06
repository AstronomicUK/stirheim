import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useCreateCampaign } from '../../api/campaigns'
import { Button, HoverCard, Icon, Notice, PageHeader, TextField } from '../../ui'
import { TextLink } from './bits'
import { Section } from './bits'
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

      <Section title="Type of campaign">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                map: false,
                icon: 'campaigns' as const,
                title: 'Regular campaign',
                blurb: 'Battles are scheduled between warbands and scored on their own.',
                tip: 'The standard campaign: warbands play each other, keep their gold and wyrdstone, and the ledger tracks the results. No territory changes hands.',
              },
              {
                map: true,
                icon: 'map' as const,
                title: 'Map campaign',
                blurb: "Every battle is fought over a district of the city.",
                tip: "Played on the fan-made Mordheim campaign map. Each battle happens in one of thirty districts; the winner takes a foothold there, footholds bring that district's advantages to the trading post, recruitment and the battlefield, and reaching a district depends on what you already hold.",
              },
            ]
          ).map((choice) => {
            const on = form.mapCampaign === choice.map
            return (
              <button
                key={choice.title}
                type="button"
                aria-pressed={on}
                disabled={create.isPending}
                onClick={() => setForm({ ...form, mapCampaign: choice.map })}
                className={`flex min-h-28 flex-col items-start gap-1.5 rounded-md border px-3 py-3 text-left transition-colors ${
                  on ? 'border-brass bg-brass/10 shadow-[inset_0_0_0_1px_var(--color-brass)]' : 'border-border bg-surface-low hover:bg-surface-high'
                }`}
              >
                <Icon name={choice.icon} size={22} className="text-brass" />
                <span className="text-sm font-semibold leading-tight text-ink">{choice.title}</span>
                <span className="text-xs leading-snug text-ink-dim">{choice.blurb}</span>
                <HoverCard title={choice.title} label={<span className="text-xs text-brass underline decoration-dotted underline-offset-2">What is this?</span>}>
                  {choice.tip}
                </HoverCard>
              </button>
            )
          })}
        </div>
      </Section>

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
        showMapSection={false}
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
