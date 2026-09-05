// Dramatis Personae: send heroes looking for a named character instead of searching for rare items
// (rulebook 03:1230). Each searcher rolls a D6 against their Initiative; under it finds the character,
// who can then be hired for the listed fee. Searchers are recorded on the phase like rare searches.

import { useMemo, useState } from 'react'
import { DRAMATIS_PERSONAE, DRAMATIS_PERSONAE_RULES } from '../../rules/data/campaign/dramatisPersonae'
import { findHiredSword } from '../../rules/data/campaign/hiredSwords'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { rollDie } from '../../rules/resolve/dice'
import { characterSearchers, resolveCharacterSearch, type SearcherRoll } from '../../rules/resolve/dramatis'
import { hireHiredSword } from '../../rules/resolve/recruitment'
import type { DramatisPersonaSummary } from '../../rules/types/campaignContent'
import { Button, DieField, Notice, Sheet } from '../../ui'
import { readRestriction, type Eligibility } from '../recruitment/helpers'
import { Card, KeyValue, Section, Tag } from '../roster/view/bits'
import type { TradeContext } from './useTrade'

export function CharactersTab({ trade }: { trade: TradeContext }) {
  const { roster, phase } = trade
  const template = useMemo(() => findWarbandTemplate(roster.warbandTemplateId), [roster.warbandTemplateId])
  const [picked, setPicked] = useState<DramatisPersonaSummary | null>(null)
  const searchers = characterSearchers(roster.heroes, phase.heroesSearched, phase.heroesOutOfAction)
  const hiredIds = new Set(roster.hiredSwords.filter((s) => s.status === 'active').map((s) => s.hiredSwordId))

  const rows = useMemo(
    () =>
      [...DRAMATIS_PERSONAE]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({ persona: p, eligibility: readRestriction(p.detail?.mayBeHired, template, p.name) })),
    [template],
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-ink-dim">
        {DRAMATIS_PERSONAE_RULES.find((r) => /send any number/i.test(r.text))?.text.split('\n')[0] ??
          'After a battle you can send any number of your heroes to look for a special character instead of searching for rare items.'}{' '}
        {phase.matchId
          ? `${searchers.length} ${searchers.length === 1 ? 'hero' : 'heroes'} can look this sequence.`
          : 'No post-battle sequence is in progress, so a search here is not counted against a hero.'}
      </p>
      <Section title="Characters" aside={`${rows.length}`}>
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
          {rows.map(({ persona, eligibility }) => (
            <li key={persona.id}>
              <button
                type="button"
                disabled={!trade.canTrade}
                onClick={() => setPicked(persona)}
                className="flex min-h-12 w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-surface-high disabled:cursor-default"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{persona.name}</span>
                    {hiredIds.has(persona.id) ? <Tag tone="brass">In the warband</Tag> : null}
                    {eligibility.kind === 'restricted' ? <Tag tone="warn">Not for this warband</Tag> : null}
                  </span>
                  <span className="text-sm text-ink-dim">
                    {persona.hireCost?.text ?? persona.detail?.hireFee ?? 'No plain fee'} · upkeep {persona.upkeep?.text ?? 'none'} · {persona.source}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Section>
      {picked ? <SearchSheet key={picked.id} persona={picked} eligibility={rows.find((r) => r.persona.id === picked.id)?.eligibility} trade={trade} searchers={searchers} alreadyHired={hiredIds.has(picked.id)} onClose={() => setPicked(null)} /> : null}
    </div>
  )
}

interface SearchSheetProps {
  persona: DramatisPersonaSummary
  eligibility: Eligibility | undefined
  trade: TradeContext
  searchers: ReturnType<typeof characterSearchers>
  alreadyHired: boolean
  onClose: () => void
}

function SearchSheet({ persona, eligibility, trade, searchers, alreadyHired, onClose }: SearchSheetProps) {
  const { roster, run, pending, error, clearError } = trade
  const [chosen, setChosen] = useState<string[]>([])
  const [rolls, setRolls] = useState<Record<string, number | null>>({})
  const [recorded, setRecorded] = useState<ReturnType<typeof resolveCharacterSearch> | null>(null)
  const entry = findHiredSword(persona.id)
  const fee = entry?.hireCost.base ?? null
  const canHire = fee !== null && !alreadyHired && roster.gold >= fee

  const lineup: SearcherRoll[] = chosen
    .map((id) => searchers.find((h) => h.id === id))
    .filter((h): h is NonNullable<typeof h> => Boolean(h))
    .map((h) => ({ heroId: h.id, name: h.name, initiative: h.stats.I, roll: rolls[h.id] ?? null }))
  const preview = lineup.length > 0 ? resolveCharacterSearch(lineup) : null

  function toggle(id: string) {
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }

  async function search(autoRoll: boolean) {
    const withRolls = lineup.map((s) => ({ ...s, roll: autoRoll ? rollDie(6) : s.roll }))
    const result = resolveCharacterSearch(withRolls)
    if (!result.complete) return
    if (autoRoll) setRolls(Object.fromEntries(withRolls.map((s) => [s.heroId, s.roll])))
    // Record the searchers on the phase (no roster change), so they cannot also look for rare items.
    const ok = await run(() => roster, { heroesSearched: withRolls.map((s) => s.heroId), reason: `trading · Searched for ${persona.name}: ${result.lines.join('; ')}` })
    if (ok) setRecorded(result)
  }

  async function hire() {
    if (fee === null) return
    const ok = await run(() => hireHiredSword(roster, persona.id, crypto.randomUUID()).value, { reason: `recruitment · ${persona.name} found and hired` })
    if (ok) onClose()
  }

  function close() {
    clearError()
    onClose()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={persona.name}
      description={`${persona.hireCost?.text ?? persona.detail?.hireFee ?? 'no plain fee'} to hire · upkeep ${persona.upkeep?.text ?? 'none'} · ${persona.source}`}
      footer={
        recorded ? (
          recorded.found ? (
            <Button block pending={pending} disabled={!canHire} onClick={() => void hire()}>
              {alreadyHired ? 'Already in the warband' : fee === null ? 'Hire fee is not plain gold: add by hand' : roster.gold < fee ? `Cannot afford ${fee} gc` : `Hire for ${fee} gc`}
            </Button>
          ) : (
            <Button block variant="secondary" onClick={close}>
              Nobody found them
            </Button>
          )
        ) : (
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" disabled={lineup.length === 0 || pending} onClick={() => void search(true)}>
              Roll for me
            </Button>
            <Button className="flex-1" disabled={!preview?.complete || pending} pending={pending} onClick={() => void search(false)}>
              Resolve the search
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {eligibility?.kind === 'restricted' ? (
          <Notice tone="warn" title="The rules say this character will not join this warband">
            {eligibility.reason}
          </Notice>
        ) : eligibility?.kind === 'check' && eligibility.reason ? (
          <Notice tone="info" title="May be hired">
            {eligibility.reason}
          </Notice>
        ) : null}
        {alreadyHired ? <Notice tone="info">{persona.name} is already in the warband; only one can ever be found.</Notice> : null}
        {!recorded ? (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink">Who goes looking?</p>
              {searchers.length === 0 ? (
                <p className="text-sm text-ink-dim">Nobody can search: every hero has already searched this sequence or was taken out of action.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
                  {searchers.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <label className="flex min-h-9 flex-1 items-center gap-3 text-sm text-ink">
                        <input type="checkbox" className="h-5 w-5 accent-brass" checked={chosen.includes(h.id)} onChange={() => toggle(h.id)} />
                        {h.name} <span className="text-ink-dim">· Initiative {h.stats.I}</span>
                      </label>
                      {chosen.includes(h.id) ? (
                        <DieField label={`${h.name} D6`} hideLabel sides={6} value={rolls[h.id] ?? null} onChange={(v) => setRolls((r) => ({ ...r, [h.id]: v }))} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-ink-dim">A roll under the hero&apos;s Initiative finds the character. Searchers forgo their rare-item search this sequence.</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Notice tone={recorded.found ? 'success' : 'warn'} title={recorded.found ? `Found by ${recorded.finders.join(', ')}` : 'Not found this time'}>
              <ul className="flex flex-col gap-0.5">
                {recorded.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </Notice>
            {recorded.found && !alreadyHired ? (
              <div className="grid grid-cols-2 gap-3">
                <KeyValue label="Hire fee" value={fee === null ? (persona.detail?.hireFee ?? 'n/a') : `${fee} gc`} />
                <KeyValue label="Treasury" value={`${roster.gold} gc`} />
              </div>
            ) : null}
          </div>
        )}
        {persona.detail ? (
          <Card className="flex flex-col gap-2 px-4 py-3 text-sm text-ink-dim">
            <p className="whitespace-pre-line">{persona.detail.flavour.split('\n\n')[0]}</p>
            {persona.detail.rating ? <p>{persona.detail.rating}</p> : null}
          </Card>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Sheet>
  )
}
