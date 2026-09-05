import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useCampaignPreview, useJoinCampaign, useMyCampaigns } from '../../api/campaigns'
import { useMyWarbands, type WarbandSummary } from '../../api/warbands'
import { useSession } from '../../app/session'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { Button, Notice, PageHeader, Spinner, TextField } from '../../ui'
import { Card, Section, Tag, TextLink } from './bits'
import { formatInviteCode, isCompleteInviteCode, normaliseInviteCode } from './inviteCode'

export function JoinCampaignPage() {
  const { code: prefill } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const [code, setCode] = useState(prefill ? formatInviteCode(prefill) : '')
  const [warbandId, setWarbandId] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)

  const complete = isCompleteInviteCode(code)
  const preview = useCampaignPreview(complete ? normaliseInviteCode(code) : '')
  const warbands = useMyWarbands(user?.id)
  const campaigns = useMyCampaigns(user?.id)
  const join = useJoinCampaign()

  // Which of my warbands already sit in a campaign I can see. Membership elsewhere is caught by the server.
  const enrolledIn = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of campaigns.data ?? []) for (const id of c.my_warband_ids) map.set(id, c.name)
    return map
  }, [campaigns.data])

  const candidates = (warbands.data ?? []).filter((w) => !w.archived)
  const available = candidates.filter((w) => !enrolledIn.has(w.id))
  const selected = warbandId && available.some((w) => w.id === warbandId) ? warbandId : null
  const canJoin = complete && Boolean(preview.data) && !preview.data?.archived && selected !== null

  async function submit() {
    if (!canJoin || !selected || !preview.data) return
    setJoinError(null)
    try {
      await join.mutateAsync({ code: normaliseInviteCode(code), warbandId: selected })
      navigate(`/campaigns/${preview.data.campaign_id}`, { replace: true })
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Could not join the campaign.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Join"
        title="Join a campaign"
        description="Enter the eight-character code your GM shared, then choose which of your warbands takes the field."
        aside={<TextLink to="/campaigns">Cancel</TextLink>}
      />

      <TextField
        label="Invite code"
        value={code}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="abcd-efgh"
        className="tracking-widest"
        hint={complete ? undefined : 'Dashes, spaces and capitals do not matter.'}
        onChange={(e) => {
          setCode(e.target.value)
          setJoinError(null)
        }}
        onBlur={() => setCode((c) => formatInviteCode(c))}
      />

      {complete ? (
        preview.isPending ? (
          <div className="flex justify-center py-4">
            <Spinner label="Looking up the campaign" />
          </div>
        ) : preview.isError ? (
          <Notice tone="error" title="Could not look up that code">
            {preview.error.message}
          </Notice>
        ) : preview.data ? (
          <Card className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-headline text-xl text-ink">{preview.data.name}</p>
              {preview.data.archived ? <Tag>Archived</Tag> : null}
            </div>
            <p className="text-sm text-ink-dim">
              Run by {preview.data.gm_display_name} · {preview.data.member_count} {preview.data.member_count === 1 ? 'warband' : 'warbands'} enrolled
            </p>
            {preview.data.archived ? <p className="text-sm text-warn">This campaign is archived; nobody can join it until the GM brings it back.</p> : null}
          </Card>
        ) : (
          <Notice tone="warn">No campaign has that code. Check it with your GM.</Notice>
        )
      ) : null}

      <Section title="Your warband" aside={available.length ? `${available.length} available` : undefined}>
        {warbands.isPending ? (
          <div className="flex justify-center py-4">
            <Spinner label="Loading warbands" />
          </div>
        ) : warbands.isError ? (
          <Notice tone="error">{warbands.error.message}</Notice>
        ) : candidates.length === 0 ? (
          <Notice tone="info" title="No warband to enrol">
            Build one first, then come back with the code.{' '}
            <Link to="/warbands/new" className="text-brass underline-offset-4 hover:underline">
              New warband
            </Link>
          </Notice>
        ) : (
          <>
            <WarbandPicker warbands={candidates} enrolledIn={enrolledIn} selected={selected} onSelect={setWarbandId} />
            {available.length === 0 ? (
              <p className="text-sm text-ink-dim">
                Each of your warbands is already in a campaign; a warband plays in one at a time.{' '}
                <Link to="/warbands/new" className="text-brass underline-offset-4 hover:underline">
                  Build another
                </Link>
                .
              </p>
            ) : null}
          </>
        )}
      </Section>

      {joinError ? <Notice tone="error">{joinError}</Notice> : null}

      <div className="mt-auto pt-2">
        <div className="sticky bottom-0 -mx-5 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button block disabled={!canJoin} pending={join.isPending} onClick={submit}>
            Join
          </Button>
        </div>
      </div>
    </>
  )
}

function WarbandPicker({
  warbands,
  enrolledIn,
  selected,
  onSelect,
}: {
  warbands: WarbandSummary[]
  enrolledIn: Map<string, string>
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <ul role="radiogroup" aria-label="Warband to enrol" className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
      {warbands.map((w) => {
        const inCampaign = enrolledIn.get(w.id)
        const on = selected === w.id
        return (
          <li key={w.id}>
            <button
              type="button"
              role="radio"
              aria-checked={on}
              disabled={Boolean(inCampaign)}
              onClick={() => onSelect(w.id)}
              className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
                on ? 'bg-surface-high' : 'hover:bg-surface-high'
              }`}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={`truncate font-medium ${on ? 'text-brass' : 'text-ink'}`}>{w.name}</span>
                <span className="truncate text-sm text-ink-dim">{findWarbandTemplate(w.type_rules_id)?.name ?? w.type_rules_id}</span>
                {inCampaign ? <span className="truncate text-sm text-ink-dim">In {inCampaign}</span> : null}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-ink-dim">
                {w.gold} gc · {w.model_count} {w.model_count === 1 ? 'model' : 'models'}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
