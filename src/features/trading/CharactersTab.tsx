// Dramatis Personae: send heroes looking for a named character instead of searching for rare items
// (rulebook 03:1230). Each searcher rolls a D6 against their Initiative; under it finds the character,
// who can then be hired for the listed fee. Searchers are recorded on the phase like rare searches.

import { useMemo, useState } from 'react'
import { DRAMATIS_PERSONAE, DRAMATIS_PERSONAE_RULES } from '../../rules/data/campaign/dramatisPersonae'
import { findHiredSword } from '../../rules/data/campaign/hiredSwords'
import { isBanned } from '../../rules/resolve/houseRules'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { rollDie } from '../../rules/resolve/dice'
import { characterSearchers, resolveCharacterSearch, type SearcherRoll } from '../../rules/resolve/dramatis'
import { hireHiredSword } from '../../rules/resolve/recruitment'
import { halfPriceHireSource, halved } from '../../rules/resolve/mapAdvantages'
import { actionsFor, performAction, type BetweenBattleAction } from '../../rules/resolve/betweenBattles'
import { findItem } from '../../rules/data/items'
import type { RosterHero } from '../../rules/types/roster'
import type { DramatisPersonaSummary } from '../../rules/types/campaignContent'
import { Button, DieField, Notice, SelectField, Sheet, TextField } from '../../ui'
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
        .filter((p) => !isBanned(trade.houseRules.bans, 'characters', p.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({ persona: p, eligibility: readRestriction(p.detail?.mayBeHired, template, p.name) })),
    [template, trade.houseRules.bans],
  )
  const [search, setSearch] = useState('')
  const [show, setShow] = useState<'all' | 'available' | 'check' | 'restricted'>('all')
  const shownRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(({ persona, eligibility }) => {
      if (q && !persona.name.toLowerCase().includes(q) && !(eligibility.reason ?? '').toLowerCase().includes(q)) return false
      if (show === 'available' && !(eligibility.kind === 'ok' || eligibility.kind === 'allowed')) return false
      if (show === 'check' && eligibility.kind !== 'check') return false
      if (show === 'restricted' && eligibility.kind !== 'restricted') return false
      return true
    })
  }, [rows, search, show])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-ink-dim">
        {DRAMATIS_PERSONAE_RULES.find((r) => /send any number/i.test(r.text))?.text.split('\n')[0] ??
          'After a battle you can send any number of your heroes to look for a special character instead of searching for rare items.'}{' '}
        {phase.matchId
          ? `${searchers.length} ${searchers.length === 1 ? 'hero' : 'heroes'} can look this sequence.`
          : 'No post-battle sequence is in progress, so a search here is not counted against a hero.'}
      </p>
      <ActionsSection trade={trade} searchers={searchers} />
      <Section title="Dramatis Personae" aside={`${rows.length}`}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <TextField label="Search Dramatis Personae" value={search} autoComplete="off" placeholder="Search by name" onChange={(e) => setSearch(e.target.value)} />
          </div>
          <SelectField label="Show" value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="check">Needs a check</option>
            <option value="restricted">Restricted</option>
          </SelectField>
        </div>
        {shownRows.length === 0 ? <p className="text-sm text-ink-dim">Nothing matches.</p> : null}
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
          {shownRows.map(({ persona, eligibility }) => (
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
  const listedFee = entry?.hireCost.base ?? null
  const halfFrom = halfPriceHireSource(trade.perks, persona.id)
  const fee = listedFee === null ? null : halfFrom ? halved(listedFee) : listedFee
  const autoFound = persona.id === 'luthor_wolfenbaum' && trade.perks?.findsLuthor ? trade.perks.findsLuthor : null
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
    const rolled = resolveCharacterSearch(withRolls)
    if (!rolled.complete) return
    // A gate district held: a hero sent to look for Luthor finds him.
    const result = autoFound && !rolled.found ? { ...rolled, found: true, lines: [...rolled.lines, `${autoFound.districtName}: a hero sent to look for ${persona.name} finds him automatically.`] } : rolled
    if (autoRoll) setRolls(Object.fromEntries(withRolls.map((s) => [s.heroId, s.roll])))
    // Record the searchers on the phase (no roster change), so they cannot also look for rare items.
    const ok = await run(() => roster, { heroesSearched: withRolls.map((s) => s.heroId), reason: `trading · Searched for ${persona.name}: ${result.lines.join('; ')}` })
    if (ok) setRecorded(result)
  }

  async function hire() {
    if (fee === null) return
    const ok = await run(() => hireHiredSword(roster, persona.id, crypto.randomUUID(), halfFrom && fee !== null ? { feeOverride: fee } : {}).value, { reason: `recruitment · ${persona.name} found and hired${halfFrom ? ` at half fee (${halfFrom.districtName})` : ''}` })
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


/** Things a hero may do instead of searching: brew poison, rob travellers, run a con, sell from the Trade Wagon. */
function ActionsSection({ trade, searchers }: { trade: TradeContext; searchers: RosterHero[] }) {
  const { roster, phase, run, pending, canTrade } = trade
  const able = roster.heroes.filter((h) => h.status === 'active' && actionsFor(h).length > 0)
  const [picked, setPicked] = useState<{ hero: RosterHero; action: BetweenBattleAction } | null>(null)
  if (able.length === 0) return null
  const searcherIds = new Set(searchers.map((s) => s.id))
  return (
    <Section title="Instead of searching">
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
        {able.flatMap((hero) =>
          actionsFor(hero).map((action) => {
            const free = phase.matchId === null || searcherIds.has(hero.id)
            return (
              <li key={`${hero.id}:${action.id}`}>
                <button type="button" disabled={!canTrade || !free} onClick={() => setPicked({ hero, action })} className="flex min-h-12 w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-surface-high disabled:cursor-default disabled:opacity-60">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium text-ink">
                      {hero.name}: {action.label}
                    </span>
                    <span className="text-sm text-ink-dim">{action.text}</span>
                  </span>
                  {!free ? <Tag tone="warn">Searched already</Tag> : null}
                </button>
              </li>
            )
          }),
        )}
      </ul>
      {picked ? (
        <ActionSheet
          key={`${picked.hero.id}:${picked.action.id}`}
          hero={picked.hero}
          action={picked.action}
          trade={trade}
          pending={pending}
          onClose={() => setPicked(null)}
          onRun={async (rolls, stashItemId) => {
            const ok = await run(() => performAction(roster, { actionId: picked.action.id, heroId: picked.hero.id, rolls, stashItemId }).value, {
              heroesSearched: phase.matchId !== null ? [picked.hero.id] : [],
              reason: `trading · ${picked.hero.name}: ${picked.action.label} (${Object.entries(rolls)
                .map(([k, v]) => `${k} ${v}`)
                .join(', ')})`,
            })
            if (ok) setPicked(null)
          }}
        />
      ) : null}
    </Section>
  )
}

interface ActionSheetProps {
  hero: RosterHero
  action: BetweenBattleAction
  trade: TradeContext
  pending: boolean
  onClose: () => void
  onRun: (rolls: Record<string, number>, stashItemId?: string) => Promise<void>
}

function ActionSheet({ hero, action, trade, pending, onClose, onRun }: ActionSheetProps) {
  const [rolls, setRolls] = useState<Record<string, number | null>>({})
  const [stashItemId, setStashItemId] = useState('')
  const rare = trade.roster.stash.filter((i) => i.itemId && findItem(i.itemId)?.availability.kind === 'rare')
  const failed = rolls.d6 === 1
  const needed = action.dice.filter((d) => !(d.key.startsWith('gold') && failed))
  const complete = needed.every((d) => typeof rolls[d.key] === 'number') && (!action.needsStashItem || stashItemId !== '')
  const filled = Object.fromEntries(Object.entries(rolls).filter(([, v]) => v !== null)) as Record<string, number>
  return (
    <Sheet
      open
      onClose={onClose}
      title={`${hero.name}: ${action.label}`}
      description={action.text}
      footer={
        <Button block pending={pending} disabled={!complete} onClick={() => void onRun(filled, stashItemId || undefined)}>
          Record it
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {action.needsStashItem ? (
          rare.length === 0 ? (
            <Notice tone="warn">Nothing rare is stored in the stash to sell.</Notice>
          ) : (
            <select className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink" aria-label="Item to sell" value={stashItemId} onChange={(e) => setStashItemId(e.target.value)}>
              <option value="">Choose the item to sell</option>
              {rare.map((i) => (
                <option key={i.itemId!} value={i.itemId!}>
                  {findItem(i.itemId!)?.name} (basic {findItem(i.itemId!)?.price.base ?? 0} gc)
                </option>
              ))}
            </select>
          )
        ) : null}
        <div className="flex flex-wrap items-end gap-3">
          {needed.map((d) => (
            <DieField key={d.key} label={d.label} sides={d.sides} value={rolls[d.key] ?? null} onChange={(v) => setRolls((r) => ({ ...r, [d.key]: v }))} rollable />
          ))}
        </div>
        <p className="text-xs text-ink-dim">Taking this uses {hero.name}'s rare-item search for the sequence.</p>
      </div>
    </Sheet>
  )
}
