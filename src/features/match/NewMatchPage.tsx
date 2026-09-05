// Book a battle. The GM schedules a game between any two or more enrolled warbands (everyone is
// in from the start); a member issues a challenge from one of their own warbands to one or more
// rivals, who accept or decline from the match page.

import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useCampaign, type CampaignDetail, type CampaignMemberView } from '../../api/campaigns'
import { useScheduleMatch } from '../../api/matches'
import { useCustomScenarios } from '../../api/scenarios'
import { useSession } from '../../app/session'
import { Button, Notice, PageHeader, SegmentedControl, SelectField, Spinner, TextArea, TextField } from '../../ui'
import { Card, Tag, TextLink } from '../campaign/bits'
import { coreScenarios, filterScenarios, libraryScenarios } from '../scenarios/helpers'
import {
  customScenariosFor,
  NEW_MATCH_COPY,
  NO_SCENARIO,
  pickTitle,
  samePick,
  SCENARIO_SOURCE_OPTIONS,
  validateNewMatch,
  type NewMatchMode,
  type ScenarioPick,
  type ScenarioSource,
} from './schedule/helpers'

const CORE = coreScenarios()
const LIBRARY = libraryScenarios()
const LIBRARY_PAGE = 25

export function NewMatchPage() {
  const { id } = useParams<{ id: string }>()
  const query = useCampaign(id)

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
  return <NewMatchForm detail={query.data} />
}

function NewMatchForm({ detail }: { detail: CampaignDetail }) {
  const { campaign, members } = detail
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const schedule = useScheduleMatch()
  const custom = useCustomScenarios()

  const isGm = user?.id === campaign.gm_id
  const mode: NewMatchMode = isGm ? 'gm' : 'challenge'
  const copy = NEW_MATCH_COPY[mode]
  const mine = useMemo(() => members.filter((m) => m.user_id === user?.id), [members, user?.id])
  const myWarbandIds = useMemo(() => mine.map((m) => m.warband_id), [mine])

  // The challenger's own warband is fixed once they have only one; with several they pick which.
  const [challengerId, setChallengerId] = useState<string>(mine[0]?.warband_id ?? '')
  const [opponentIds, setOpponentIds] = useState<string[]>([])
  const [source, setSource] = useState<ScenarioSource>('core')
  const [scenario, setScenario] = useState<ScenarioPick>(NO_SCENARIO)
  const [search, setSearch] = useState('')
  const [scheduledLocal, setScheduledLocal] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const customRows = useMemo(() => customScenariosFor(custom.data ?? [], campaign.id), [custom.data, campaign.id])
  const libraryHits = useMemo(() => filterScenarios(LIBRARY, search), [search])

  const pickable: CampaignMemberView[] = mode === 'gm' ? members : members.filter((m) => m.user_id !== user?.id)
  const warbandIds = mode === 'gm' ? opponentIds : challengerId ? [challengerId, ...opponentIds] : opponentIds

  function toggle(warbandId: string) {
    setError(null)
    setOpponentIds((ids) => (ids.includes(warbandId) ? ids.filter((x) => x !== warbandId) : [...ids, warbandId]))
  }

  function choose(pick: ScenarioPick) {
    setScenario((current) => (samePick(current, pick) ? NO_SCENARIO : pick))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const result = validateNewMatch({ campaignId: campaign.id, warbandIds, scenario, scheduledLocal, notes }, { mode, myWarbandIds })
    if (!result.ok) {
      setError(result.error)
      return
    }
    try {
      const matchId = await schedule.mutateAsync(result.input)
      navigate(`/matches/${matchId}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not book the battle.')
    }
  }

  const back = <TextLink to={`/campaigns/${campaign.id}`}>Cancel</TextLink>

  if (campaign.archived) {
    return (
      <>
        <PageHeader eyebrow={copy.eyebrow} title={copy.title} aside={back} />
        <Notice tone="warn" title="This campaign is archived">
          Battles are not scheduled in an archived campaign.{isGm ? ' Unarchive it from Settings to carry on.' : ''}
        </Notice>
      </>
    )
  }

  if (mode === 'challenge' && mine.length === 0) {
    return (
      <>
        <PageHeader eyebrow={copy.eyebrow} title={copy.title} aside={back} />
        <Notice tone="warn" title="No warband to challenge with">
          Only players with a warband enrolled in {campaign.name} can issue a challenge. Join with the invite code first.
        </Notice>
      </>
    )
  }

  const selectedLabel = pickTitle(scenario, customRows)

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} aside={back} />

      {mode === 'challenge' ? (
        <div className="flex flex-col gap-2">
          {mine.length === 1 ? (
            <Card className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-ink">{mine[0].warband.name}</span>
                <span className="truncate text-sm text-ink-dim">Your warband · {mine[0].warband.type_name}</span>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-ink">Rating {mine[0].warband.rating}</span>
            </Card>
          ) : (
            <SelectField
              label="Your warband"
              value={challengerId}
              onChange={(e) => {
                setChallengerId(e.target.value)
                setError(null)
              }}
              disabled={schedule.isPending}
            >
              {mine.map((m) => (
                <option key={m.warband_id} value={m.warband_id}>
                  {m.warband.name} (rating {m.warband.rating})
                </option>
              ))}
            </SelectField>
          )}
        </div>
      ) : null}

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink-dim">
          {copy.warbands}
          <span className="ml-2 font-normal">{mode === 'gm' ? 'Pick two or more' : 'Pick one or more'}</span>
        </legend>
        {pickable.length === 0 ? (
          <Card className="px-4 py-4">
            <p className="text-sm leading-relaxed text-ink-dim">
              {mode === 'gm' ? 'Nobody has enrolled yet. Share the invite code first.' : 'No other warbands have enrolled yet. Share the invite code and come back.'}
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
            {pickable.map((m) => {
              const on = opponentIds.includes(m.warband_id)
              return (
                <li key={m.warband_id}>
                  <label className={`flex min-h-11 cursor-pointer items-center gap-3 px-4 py-3 ${on ? 'bg-surface-high' : 'hover:bg-surface-high'}`}>
                    <input type="checkbox" className="h-5 w-5 shrink-0 accent-brass" checked={on} disabled={schedule.isPending} onChange={() => toggle(m.warband_id)} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink">{m.warband.name}</span>
                        {m.user_id === user?.id ? <Tag tone="brass">You</Tag> : null}
                        {m.user_id === campaign.gm_id ? <Tag>GM</Tag> : null}
                        {m.warband.archived ? <Tag>Archived</Tag> : null}
                      </span>
                      <span className="truncate text-sm text-ink-dim">
                        {m.display_name} · {m.warband.type_name}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-ink">Rating {m.warband.rating}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="mb-2 text-sm font-medium text-ink-dim">Scenario</legend>
        <SegmentedControl options={SCENARIO_SOURCE_OPTIONS} value={source} onChange={setSource} label="Where to pick the scenario from" />

        {source === 'core' ? (
          <PickList
            items={CORE.map((s, i) => ({ pick: { kind: 'builtin', id: s.id } as ScenarioPick, number: i + 1, title: s.title, subtitle: s.description }))}
            selected={scenario}
            onPick={choose}
            disabled={schedule.isPending}
          />
        ) : source === 'library' ? (
          <>
            <TextField label="Search the library" type="search" placeholder="Title, description, author or source" autoComplete="off" value={search} onChange={(e) => setSearch(e.target.value)} />
            <p className="text-xs text-ink-dim" aria-live="polite">
              {libraryHits.length} of {LIBRARY.length} scenarios{libraryHits.length > LIBRARY_PAGE ? `, showing the first ${LIBRARY_PAGE}` : ''}
            </p>
            {libraryHits.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-dim">Nothing matches. Try a shorter search.</p>
            ) : (
              <PickList
                items={libraryHits.slice(0, LIBRARY_PAGE).map((s) => ({
                  pick: { kind: 'builtin', id: s.id } as ScenarioPick,
                  title: s.title,
                  subtitle: `${s.source} · ${s.author}${s.setting !== 'Mordheim' ? ` · ${s.setting}` : ''}`,
                }))}
                selected={scenario}
                onPick={choose}
                disabled={schedule.isPending}
              />
            )}
          </>
        ) : source === 'custom' ? (
          custom.isPending ? (
            <div className="flex justify-center py-4">
              <Spinner label="Loading your group's scenarios" />
            </div>
          ) : custom.isError ? (
            <Notice tone="error">{custom.error.message}</Notice>
          ) : customRows.length === 0 ? (
            <Card className="flex flex-col gap-2 px-4 py-4">
              <p className="text-sm leading-relaxed text-ink-dim">Nobody has written a scenario for this group yet.</p>
              <TextLink to="/scenarios/new">Write one in the scenario library</TextLink>
            </Card>
          ) : (
            <PickList
              items={customRows.map((r) => ({ pick: { kind: 'custom', id: r.id } as ScenarioPick, title: r.name, subtitle: r.summary || r.setting }))}
              selected={scenario}
              onPick={choose}
              disabled={schedule.isPending}
            />
          )
        ) : (
          <Card className="px-4 py-4">
            <p className="text-sm leading-relaxed text-ink-dim">
              Roll on the scenario table or agree one when you sit down. The match is recorded without a scenario until Phase 7 lets the report name it.
            </p>
          </Card>
        )}

        <p className="text-sm text-ink-dim">
          Selected: <span className="text-ink">{selectedLabel}</span>
          {scenario.kind !== 'none' ? (
            <>
              {' '}
              <button type="button" onClick={() => setScenario(NO_SCENARIO)} className="text-brass underline-offset-4 hover:underline">
                Clear
              </button>
            </>
          ) : null}
        </p>
      </fieldset>

      <TextField
        label="When (optional)"
        type="datetime-local"
        value={scheduledLocal}
        onChange={(e) => {
          setScheduledLocal(e.target.value)
          setError(null)
        }}
        hint="Leave blank to sort the date out later."
        disabled={schedule.isPending}
      />

      <TextArea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Where you are playing, table size, house rules for the night" maxLength={500} disabled={schedule.isPending} />

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="mt-auto pt-2">
        <div className="sticky bottom-0 -mx-5 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button type="submit" block pending={schedule.isPending} disabled={warbandIds.length < 2}>
            {copy.submit}
          </Button>
        </div>
      </div>
    </form>
  )
}

interface PickItem {
  pick: ScenarioPick
  number?: number
  title: string
  subtitle?: string
}

/** Single-select rows for scenarios; tapping the selected row clears it. */
function PickList({ items, selected, onPick, disabled }: { items: PickItem[]; selected: ScenarioPick; onPick: (pick: ScenarioPick) => void; disabled: boolean }) {
  return (
    <ul role="radiogroup" aria-label="Scenario" className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
      {items.map((item) => {
        const on = samePick(item.pick, selected)
        const key = item.pick.kind === 'none' ? 'none' : `${item.pick.kind}:${item.pick.id}`
        return (
          <li key={key}>
            <button
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onPick(item.pick)}
              className={`flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left ${on ? 'bg-surface-high' : 'hover:bg-surface-high'}`}
            >
              {item.number != null ? <span className="w-5 shrink-0 pt-0.5 text-right text-sm tabular-nums text-ink-dim">{item.number}</span> : null}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={`truncate font-medium ${on ? 'text-brass' : 'text-ink'}`}>{item.title}</span>
                {item.subtitle ? <span className="line-clamp-2 text-sm leading-snug text-ink-dim">{item.subtitle}</span> : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
