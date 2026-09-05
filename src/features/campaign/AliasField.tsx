import { useState, type FormEvent } from 'react'
import { useCampaignAliases, useSetCampaignAlias } from '../../api/aliases'
import { Button, TextField } from '../../ui'

export interface AliasFieldProps {
  campaignId: string
  userId: string
  /** The account name shown when no alias is set. */
  accountName: string
  /** "Your name in this campaign" for the member; "Name in this campaign" for the GM editing someone else. */
  label: string
  compact?: boolean
}

/**
 * The name a player goes by inside one campaign, Discord-style. Blank means "use the account
 * name". The member sets their own; the GM can set anyone's from Settings.
 */
export function AliasField({ campaignId, userId, accountName, label, compact = false }: AliasFieldProps) {
  const aliases = useCampaignAliases(campaignId)
  const set = useSetCampaignAlias(campaignId)
  const current = aliases.data?.get(userId) ?? ''
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const value = draft ?? current
  const dirty = draft !== null && draft.trim() !== current

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!dirty) return
    setError(null)
    try {
      await set.mutateAsync({ userId, alias: value.trim() })
      setDraft(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the name.')
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className={`flex ${compact ? 'items-end gap-2' : 'flex-col gap-2'}`}>
      <div className="min-w-0 flex-1">
        <TextField
          label={label}
          value={value}
          maxLength={40}
          placeholder={accountName}
          autoComplete="off"
          hint={compact ? undefined : `Blank means your account name, ${accountName}. Other players see this name in this campaign only.`}
          error={error ?? undefined}
          onChange={(e) => setDraft(e.target.value)}
        />
      </div>
      <Button type="submit" variant="secondary" disabled={!dirty} pending={set.isPending} className={compact ? 'shrink-0' : 'self-start'}>
        Save
      </Button>
    </form>
  )
}
