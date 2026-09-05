// Bring a roster over from the old tracker: paste the text of its printer-friendly page (or of the
// campaign's "View details" panel for another player's warband), check what the parser made of
// it, fix anything it could not match, and create the warband. The importer owns it until it is
// handed to its player from the roster page.

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HIRED_SWORDS } from '../../rules/data/campaign/hiredSwords'
import { WARBAND_TEMPLATES } from '../../rules/data/warbandTemplates'
import { createWarband, fetchWarband, updateRoster } from '../../api/warbands'
import { useQueryClient } from '@tanstack/react-query'
import { warbandKeys } from '../../api/warbands'
import { Button, Notice, PageHeader, SelectField, TextArea } from '../../ui'
import { StatLine } from '../roster/shared/StatLine'
import { Card, Section, Tag } from '../roster/view/bits'
import { usePageTitle } from '../onboarding/usePageTitle'
import { followUpChanges, resolveRelicRoster, toCreatePayload, type ResolvedRoster, type RosterOverrides } from './rosterImport'
import { parseRelicRoster } from './rosterText'

export function RosterImportPage() {
  usePageTitle('Import a roster')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [overrides, setOverrides] = useState<RosterOverrides>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo(() => (text.trim() ? parseRelicRoster(text) : null), [text])
  const resolved: ResolvedRoster | null = useMemo(() => (parsed ? resolveRelicRoster(parsed, overrides) : null), [parsed, overrides])

  const blocking = resolved ? !resolved.template || resolved.heroes.some((h) => !h.unitId) || resolved.henchmen.some((g) => !g.unitId) || resolved.hiredSwords.some((s) => !s.hiredSwordId) : true

  async function save() {
    if (!resolved || blocking) return
    setSaving(true)
    setError(null)
    try {
      const payload = toCreatePayload(resolved)
      const id = await createWarband(payload)
      const detail = await fetchWarband(id)
      const created = detail.heroes.filter((h) => !h.is_hired_sword).map((h) => ({ id: h.id, sort_order: h.sort_order, name: h.name }))
      const changes = followUpChanges(resolved, created)
      await updateRoster(id, 'import', changes)
      await qc.invalidateQueries({ queryKey: warbandKeys.all })
      navigate(`/warbands/${id}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The roster could not be created.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="From another tracker"
        title="Import a roster"
        description="Paste the text of the roster's printer-friendly page from the old tracker, or of its campaign details panel for another player's warband. Nothing is saved until you press Create."
        aside={
          <Link to="/" className="text-sm text-brass underline-offset-4 hover:underline">
            Your warbands
          </Link>
        }
      />

      <TextArea label="Roster text" value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder={"Thorgrim's Seekers\nDWARF TREASURE HUNTERS\nGold 5 gc\n…"} />

      {resolved && parsed ? (
        <>
          <Section title="Warband">
            <Card className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-headline text-xl font-semibold text-ink">{parsed.name}</p>
                  <p className="text-sm text-ink-dim">
                    {parsed.gold} gc · {parsed.wyrdstone} wyrdstone{parsed.veteranPool !== null ? ` · veteran pool ${parsed.veteranPool}` : ''}
                  </p>
                </div>
                {resolved.template ? <Tag tone="brass">{resolved.template.name}</Tag> : <Tag tone="danger">Type unknown</Tag>}
              </div>
              <SelectField label="Warband type" value={resolved.template?.id ?? ''} onChange={(e) => setOverrides((o) => ({ ...o, templateId: e.target.value || undefined, heroUnits: {}, groupUnits: {} }))}>
                <option value="">Pick a warband type…</option>
                {WARBAND_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </SelectField>
            </Card>
          </Section>

          {resolved.issues.length > 0 ? (
            <Notice tone="warn" title={`${resolved.issues.length} ${resolved.issues.length === 1 ? 'thing' : 'things'} to check`}>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-sm">
                {resolved.issues.map((i, n) => (
                  <li key={n}>{i}</li>
                ))}
              </ul>
            </Notice>
          ) : (
            <Notice tone="success">Everything matched. Check the cards below, then create the warband.</Notice>
          )}

          <Section title="Heroes" aside={`${resolved.heroes.length}`}>
            {resolved.heroes.map((h, i) => (
              <Card key={i} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base text-ink">{h.parsed.name}</p>
                    <p className="text-xs text-ink-dim">
                      {h.parsed.typeName ?? 'no type on the page'} · {h.parsed.xp} xp
                    </p>
                  </div>
                  {h.guessed ? <Tag tone="warn">Guessed</Tag> : h.unitId ? null : <Tag tone="danger">Pick a type</Tag>}
                </div>
                {h.parsed.stats ? <StatLine stats={h.parsed.stats} /> : <p className="text-xs text-accent-strong">No stat line found.</p>}
                {resolved.template ? (
                  <SelectField label="Unit type" hideLabel value={h.unitId ?? ''} onChange={(e) => setOverrides((o) => ({ ...o, heroUnits: { ...(o.heroUnits ?? {}), [i]: e.target.value } }))}>
                    <option value="">Pick a unit type…</option>
                    {[...resolved.template.heroTemplates, ...resolved.template.henchmanTemplates].map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </SelectField>
                ) : null}
                <p className="text-xs text-ink-dim">
                  Kit: {h.items.map((it) => (it.itemId ? it.name : `${it.name} (custom)`)).join(', ') || 'none'}
                  {h.skillIds.length + h.spellIds.length > 0 ? ` · skills/spells: ${h.parsed.skills.join(', ')}` : ''}
                  {h.parsed.injuries.length > 0 ? ` · injuries: ${h.parsed.injuries.join(', ')}` : ''}
                  {h.parsed.mutations.length > 0 ? ` · mutations: ${h.parsed.mutations.join(', ')}` : ''}
                </p>
              </Card>
            ))}
          </Section>

          <Section title="Henchmen" aside={`${resolved.henchmen.length} ${resolved.henchmen.length === 1 ? 'group' : 'groups'}`}>
            {resolved.henchmen.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups.</p> : null}
            {resolved.henchmen.map((g, i) => (
              <Card key={i} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base text-ink">{g.parsed.name}</p>
                    <p className="text-xs text-ink-dim">
                      {g.parsed.typeName ?? 'no type on the page'} · {g.size} {g.size === 1 ? 'model' : 'models'} · {g.parsed.xp} xp
                    </p>
                  </div>
                  {g.guessed ? <Tag tone="warn">Guessed</Tag> : g.unitId ? null : <Tag tone="danger">Pick a type</Tag>}
                </div>
                {g.parsed.stats ? <StatLine stats={g.parsed.stats} /> : null}
                {resolved.template ? (
                  <SelectField label="Unit type" hideLabel value={g.unitId ?? ''} onChange={(e) => setOverrides((o) => ({ ...o, groupUnits: { ...(o.groupUnits ?? {}), [i]: e.target.value } }))}>
                    <option value="">Pick a unit type…</option>
                    {resolved.template.henchmanTemplates.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </SelectField>
                ) : null}
                <p className="text-xs text-ink-dim">Kit per model: {g.items.map((it) => (it.itemId ? it.name : `${it.name} (custom)`)).join(', ') || 'none'}</p>
              </Card>
            ))}
          </Section>

          {resolved.hiredSwords.length > 0 ? (
            <Section title="Hired swords" aside={`${resolved.hiredSwords.length}`}>
              {resolved.hiredSwords.map((s, i) => (
                <Card key={i} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base text-ink">{s.parsed.name}</p>
                      <p className="text-xs text-ink-dim">
                        {s.parsed.typeName ?? ''} · {s.parsed.xp} xp
                      </p>
                    </div>
                    {s.hiredSwordId ? null : <Tag tone="danger">Pick one</Tag>}
                  </div>
                  {s.parsed.stats ? <StatLine stats={s.parsed.stats} /> : null}
                  <SelectField label="Hired sword" hideLabel value={s.hiredSwordId ?? ''} onChange={(e) => setOverrides((o) => ({ ...o, hiredSwordIds: { ...(o.hiredSwordIds ?? {}), [i]: e.target.value } }))}>
                    <option value="">Pick a hired sword…</option>
                    {HIRED_SWORDS.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </SelectField>
                </Card>
              ))}
            </Section>
          ) : null}

          {resolved.stash.length > 0 ? (
            <Section title="Stash">
              <Card className="px-4 py-3">
                <p className="text-sm text-ink">{resolved.stash.map((it) => (it.itemId ? it.name : `${it.name} (custom)`)).join(', ')}</p>
              </Card>
            </Section>
          ) : null}

          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button block pending={saving} disabled={blocking} onClick={() => void save()}>
            Create {parsed.name || 'this warband'}
          </Button>
          <p className="text-xs text-ink-dim">
            Experience, characteristics, kit, skills, spells and injuries come across as printed; advances already taken are counted so none are owed. You own the
            warband until you hand it to its player from the roster page.
          </p>
        </>
      ) : null}
    </>
  )
}
