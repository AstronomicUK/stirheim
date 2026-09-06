// The "Bans" house rule: what the GM has removed from the campaign. Five lists (items, spells,
// hired swords, Dramatis Personae, skills), each searched from the rules data and shown as chips.
// Nurgle's Rot is offered first because most tables ban it.

import { useMemo, useState } from 'react'
import type { CampaignBans } from '../../rules/types/roster'
import { Button, SegmentedControl, TextField } from '../../ui'
import { KIND_LABEL, banCandidates, banName, type BanKind } from './bans'

/** Commonly banned at most tables; offered as one-tap chips while the list is empty. */
const SUGGESTED: Partial<Record<BanKind, string[]>> = { items: ['nurgles_rot'] }

export interface BansEditorProps {
  bans: CampaignBans
  onChange: (bans: CampaignBans) => void
  disabled?: boolean
}

export function BansEditor({ bans, onChange, disabled = false }: BansEditorProps) {
  const [kind, setKind] = useState<BanKind>('items')
  const [query, setQuery] = useState('')
  const candidates = useMemo(() => banCandidates(kind), [kind])
  const q = query.trim().toLowerCase()
  const matches = useMemo(() => (q.length < 2 ? [] : candidates.filter((e) => e.name.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q)).slice(0, 12)), [candidates, q])
  const current = bans[kind]
  const total = bans.items.length + bans.spells.length + bans.hiredSwords.length + bans.characters.length + bans.skills.length

  function add(id: string) {
    if (disabled || current.includes(id)) return
    onChange({ ...bans, [kind]: [...current, id] })
    setQuery('')
  }
  function remove(k: BanKind, id: string) {
    if (disabled) return
    onChange({ ...bans, [k]: bans[k].filter((x) => x !== id) })
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface-low px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">Banned in this campaign</p>
        <span className="text-xs text-ink-dim">{total === 0 ? 'Nothing yet' : `${total} ${total === 1 ? 'entry' : 'entries'}`}</span>
      </div>
      <p className="text-xs leading-relaxed text-ink-dim">
        Banned entries disappear from the trading post, the builder, spell tables, the hire sheet and skill pickers, and a roster that already holds one shows a warning.
      </p>
      <SegmentedControl label="What to ban" options={(Object.keys(KIND_LABEL) as BanKind[]).map((k) => ({ value: k, label: `${KIND_LABEL[k]}${bans[k].length ? ` (${bans[k].length})` : ''}` }))} value={kind} onChange={(v) => setKind(v as BanKind)} />
      {current.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={`Banned ${KIND_LABEL[kind].toLowerCase()}`}>
          {current.map((id) => (
            <li key={id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(kind, id)}
                aria-label={`Unban ${banName(kind, id)}`}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent/40 bg-surface px-3 text-xs text-ink line-through decoration-accent/70 hover:border-accent disabled:opacity-60"
              >
                {banName(kind, id)}
                <span aria-hidden className="no-underline text-ink-dim">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {current.length === 0 && SUGGESTED[kind]?.some((id) => candidates.some((c) => c.id === id)) ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-dim">
          Often banned:
          {SUGGESTED[kind]!.filter((id) => candidates.some((c) => c.id === id)).map((id) => (
            <Button key={id} variant="secondary" disabled={disabled} onClick={() => add(id)} className="min-h-8 px-3 text-xs">
              Ban {banName(kind, id)}
            </Button>
          ))}
        </div>
      ) : null}
      <TextField label={`Search ${KIND_LABEL[kind].toLowerCase()}`} value={query} autoComplete="off" disabled={disabled} placeholder="Type at least two letters" onChange={(e) => setQuery(e.target.value)} />
      {q.length >= 2 ? (
        matches.length === 0 ? (
          <p className="text-xs text-ink-dim">Nothing in the rules data matches.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {matches.map((e) => {
              const banned = current.includes(e.id)
              return (
                <li key={e.id}>
                  <button type="button" disabled={disabled || banned} onClick={() => add(e.id)} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-high disabled:cursor-default disabled:opacity-60">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-ink">{e.name}</span>
                      {e.detail ? <span className="truncate text-xs text-ink-dim">{e.detail}</span> : null}
                    </span>
                    <span className="shrink-0 text-xs text-brass">{banned ? 'Banned' : 'Ban'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )
      ) : null}
    </div>
  )
}
