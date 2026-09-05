import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useWarband, type WarbandDetail } from '../../api/warbands'
import type { HeroRow } from '../../domain'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { warbandRating } from '../../rules/resolve/rating'
import { warbandHeroCount, warbandModelCount } from '../../rules/resolve/roster'
import { Notice, Spinner } from '../../ui'
import { equipmentSummary, unitTypeName, warbandTypeName } from './shared/names'
import { STAT_ORDER } from './shared/stats'
import { flagTags, hiredSwordName, itemsByHolder, skillName, spellName, statusLabel } from './view/lookups'


export function PrintPage() {
  const { id } = useParams<{ id: string }>()
  const query = useWarband(id)
  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the roster" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <Notice tone="error" title="Could not load this warband">
        {query.error.message}
      </Notice>
    )
  }
  return <PrintSheet detail={query.data} />
}

const cell = 'border border-neutral-400 px-1.5 py-1 align-top'
const statCell = `${cell} text-center tabular-nums`
const head = `${cell} bg-neutral-100 text-left text-[10px] font-semibold uppercase tracking-wide`

function warriorNotes(hero: HeroRow): string {
  const parts = [
    ...hero.injuries.map((i) => (i.effect ? `${i.name} (${i.effect})` : i.name)),
    ...flagTags(hero.flags),
  ]
  const status = statusLabel(hero.status)
  if (status) parts.unshift(status.toUpperCase())
  return parts.join('; ')
}

function PrintSheet({ detail }: { detail: WarbandDetail }) {
  const { warband, heroes, groups, items, roster } = detail
  const template = useMemo(() => findWarbandTemplate(warband.type_rules_id), [warband.type_rules_id])
  const rating = useMemo(() => warbandRating(roster, template), [roster, template])
  const byHolder = useMemo(() => itemsByHolder(items), [items])
  const stash = byHolder.get('') ?? []
  const printedOn = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div data-print-sheet className="-mx-5 -mt-4 flex flex-1 flex-col bg-white text-black">
      <div data-print-hide className="flex items-center justify-between gap-3 border-b border-neutral-300 bg-neutral-50 px-4 py-2 text-sm">
        <Link to={`/warbands/${warband.id}`} className="inline-flex min-h-11 items-center text-neutral-700 underline-offset-4 hover:underline">
          Back to roster
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center rounded-md border border-neutral-800 bg-white px-4 font-medium text-neutral-900 hover:bg-neutral-100"
        >
          Print
        </button>
      </div>

      <article className="flex flex-col gap-4 px-4 py-4 text-[11px] leading-snug print:px-0 print:py-0">
        <header className="flex items-end justify-between gap-4 border-b-2 border-black pb-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">{warbandTypeName(warband.type_rules_id)}</p>
            <h1 className="font-headline text-2xl leading-tight">{warband.name}</h1>
          </div>
          <p className="text-[10px] text-neutral-600">Stirheim · {printedOn}</p>
        </header>

        <dl className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
          <Stat label="Gold" value={`${warband.gold} gc`} />
          <Stat label="Wyrdstone" value={warband.wyrdstone} />
          <Stat label="Rating" value={rating.total} />
          <Stat label="Models" value={warbandModelCount(roster)} />
          <Stat label="Heroes" value={warbandHeroCount(roster)} />
          <Stat label="Veteran pool" value={warband.veteran_pool ?? '—'} />
        </dl>

        <section className="flex flex-col gap-1.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide">Heroes</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={head}>Name</th>
                  <th className={head}>Type</th>
                  {STAT_ORDER.map((k) => (
                    <th key={k} className={`${head} text-center`}>
                      {k}
                    </th>
                  ))}
                  <th className={`${head} text-center`}>XP</th>
                  <th className={head}>Equipment</th>
                  <th className={head}>Skills / spells</th>
                  <th className={head}>Injuries / notes</th>
                </tr>
              </thead>
              <tbody>
                {heroes.length === 0 ? (
                  <tr>
                    <td className={cell} colSpan={15}>
                      No heroes.
                    </td>
                  </tr>
                ) : null}
                {heroes.map((h) => (
                  <tr key={h.id} className={h.status !== 'active' ? 'text-neutral-500' : ''}>
                    <td className={`${cell} font-semibold`}>{h.name}</td>
                    <td className={cell}>
                      {h.is_hired_sword ? hiredSwordName(h.hired_sword_rules_id ?? '') : unitTypeName(warband.type_rules_id, h.unit_type_rules_id ?? '')}
                      {h.is_hired_sword ? <span className="block text-[9px] uppercase text-neutral-500">Hired sword</span> : null}
                    </td>
                    {STAT_ORDER.map((k) => (
                      <td key={k} className={statCell}>
                        {h.stats[k]}
                      </td>
                    ))}
                    <td className={statCell}>{h.xp}</td>
                    <td className={cell}>{equipmentSummary(byHolder.get(h.id) ?? [])}</td>
                    <td className={cell}>{[...h.skills.map(skillName), ...h.spells.map(spellName)].join(', ') || '—'}</td>
                    <td className={cell}>{[warriorNotes(h), h.notes].filter(Boolean).join('; ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide">Henchman groups</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={head}>Group</th>
                  <th className={head}>Type</th>
                  <th className={`${head} text-center`}>#</th>
                  {STAT_ORDER.map((k) => (
                    <th key={k} className={`${head} text-center`}>
                      {k}
                    </th>
                  ))}
                  <th className={`${head} text-center`}>XP</th>
                  <th className={head}>Equipment (group total)</th>
                  <th className={head}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td className={cell} colSpan={15}>
                      No henchman groups.
                    </td>
                  </tr>
                ) : null}
                {groups.map((g) => (
                  <tr key={g.id}>
                    <td className={`${cell} font-semibold`}>{g.name}</td>
                    <td className={cell}>{unitTypeName(warband.type_rules_id, g.unit_type_rules_id)}</td>
                    <td className={statCell}>{g.size}</td>
                    {STAT_ORDER.map((k) => (
                      <td key={k} className={statCell}>
                        {g.stats[k]}
                        {(g.stat_increases[k] ?? 0) > 0 ? <sup>+</sup> : null}
                      </td>
                    ))}
                    <td className={statCell}>{g.xp}</td>
                    <td className={cell}>{equipmentSummary(byHolder.get(g.id) ?? [])}</td>
                    <td className={cell}>{g.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="flex flex-col gap-1.5">
            <h2 className="text-xs font-semibold uppercase tracking-wide">Stash</h2>
            <p className="min-h-8 border border-neutral-400 px-1.5 py-1">{stash.length > 0 ? equipmentSummary(stash) : ' '}</p>
          </section>
          <section className="flex flex-col gap-1.5">
            <h2 className="text-xs font-semibold uppercase tracking-wide">Battles fought</h2>
            <div className="flex flex-col gap-2.5 pt-1">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-5 border-b border-neutral-500" />
              ))}
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-1.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide">Campaign notes</h2>
          <div className="border border-neutral-400 px-1.5 py-1">
            {warband.notes ? <p className="whitespace-pre-line">{warband.notes}</p> : null}
            <div className="flex flex-col gap-2.5 pt-1">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="h-5 border-b border-neutral-300" />
              ))}
            </div>
          </div>
        </section>

        {rating.notes.length > 0 ? (
          <p className="text-[10px] text-neutral-600">{rating.notes.join(' ')}</p>
        ) : null}
      </article>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col border-b border-neutral-400 pb-0.5">
      <dt className="text-[9px] uppercase tracking-wider text-neutral-600">{label}</dt>
      <dd className="text-sm tabular-nums">{value}</dd>
    </div>
  )
}
