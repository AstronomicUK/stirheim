import { useMemo, useState } from 'react'
import type { WarriorStatus } from '../../../domain'
import { Button, NumberField, SelectField, Sheet, TextArea, TextField } from '../../../ui'
import { unitTypeName } from '../shared/names'
import { Card, Tag } from './bits'
import type { HeroDraft } from './diff'
import {
  STATUS_OPTIONS,
  allSpellOptions,
  hiredSwordName,
  skillName,
  skillOptionsFor,
  skillTableName,
  skillTableOptions,
  spellName,
} from './lookups'
import { StatsGrid } from './StatsGrid'
import type { DraftErrors } from './validate'

export interface HeroEditorProps {
  hero: HeroDraft
  warbandTemplateId: string
  errors: DraftErrors
  onChange: (patch: Partial<HeroDraft>) => void
  onRemove: () => void
}

const chip = (on: boolean) =>
  `min-h-11 rounded-full border px-3 text-sm transition-colors ${on ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:text-ink'}`

export function HeroEditor({ hero, warbandTemplateId, errors, onChange, onRemove }: HeroEditorProps) {
  const [skillsOpen, setSkillsOpen] = useState(false)
  const prefix = `heroes.${hero.id}`
  const err = (field: string) => errors[`${prefix}.${field}`]
  const typeName = hero.is_hired_sword ? hiredSwordName(hero.hired_sword_rules_id ?? '') : unitTypeName(warbandTemplateId, hero.unit_type_rules_id ?? '')
  const tableOptions = useMemo(() => skillTableOptions(warbandTemplateId), [warbandTemplateId])
  const skillOptions = useMemo(() => skillOptionsFor(hero.skill_tables), [hero.skill_tables])
  const spellOptions = useMemo(() => allSpellOptions().sort((a, b) => a.lore.localeCompare(b.lore) || a.name.localeCompare(b.name)), [])
  const lores = useMemo(() => [...new Set(spellOptions.map((s) => s.lore))], [spellOptions])

  function toggleTable(id: string) {
    const has = hero.skill_tables.includes(id)
    onChange({ skill_tables: has ? hero.skill_tables.filter((t) => t !== id) : [...hero.skill_tables, id] })
  }
  function toggleSkill(id: string) {
    const has = hero.skills.includes(id)
    onChange({ skills: has ? hero.skills.filter((s) => s !== id) : [...hero.skills, id] })
  }

  return (
    <Card className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-dim">
            {typeName}
            {hero.is_hired_sword ? ' · Hired sword' : ''}
          </p>
          {hero.isNew ? <Tag tone="brass">New</Tag> : null}
        </div>
        <Button variant="ghost" onClick={onRemove} className="-mr-2 px-2 text-accent-strong">
          Remove
        </Button>
      </div>

      <TextField label="Name" value={hero.name} maxLength={60} error={err('name')} onChange={(e) => onChange({ name: e.target.value })} />

      <StatsGrid stats={hero.stats} onChange={(stats) => onChange({ stats })} errorFor={(k) => err(`stats.${k}`)} />

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Experience" value={hero.xp} error={err('xp')} onChange={(v) => onChange({ xp: v ?? 0 })} />
        <NumberField label="Advances taken" value={hero.level_ups} error={err('level_ups')} onChange={(v) => onChange({ level_ups: v ?? 0 })} />
      </div>

      <div className="grid grid-cols-2 items-end gap-3">
        <SelectField label="Status" value={hero.status} onChange={(e) => onChange({ status: e.target.value as WarriorStatus })}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <label className="flex min-h-12 items-center gap-3 text-sm text-ink">
          <input type="checkbox" className="h-5 w-5 accent-brass" checked={hero.is_large} onChange={(e) => onChange({ is_large: e.target.checked })} />
          Large creature
        </label>
      </div>

      {!hero.is_hired_sword ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink-dim">Skill tables</legend>
          <div className="flex flex-wrap gap-2">
            {tableOptions.map((t) => {
              const on = hero.skill_tables.includes(t.id)
              return (
                <button key={t.id} type="button" aria-pressed={on} className={chip(on)} onClick={() => toggleTable(t.id)}>
                  {t.name}
                </button>
              )
            })}
            {hero.skill_tables
              .filter((id) => !tableOptions.some((t) => t.id === id))
              .map((id) => (
                <button key={id} type="button" aria-pressed className={chip(true)} onClick={() => toggleTable(id)}>
                  {skillTableName(id)}
                </button>
              ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-dim">Skills</span>
          <Button variant="ghost" className="-mr-2 px-2" onClick={() => setSkillsOpen(true)}>
            Choose
          </Button>
        </div>
        {hero.skills.length === 0 ? <p className="text-sm text-ink-dim">None.</p> : null}
        <div className="flex flex-wrap gap-2">
          {hero.skills.map((id) => (
            <button key={id} type="button" className={chip(true)} onClick={() => toggleSkill(id)} aria-label={`Remove ${skillName(id)}`}>
              {skillName(id)} <span aria-hidden className="ml-1 text-ink-dim">×</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SelectField
          label="Spells"
          value=""
          hint={hero.spells.length === 0 ? 'Only wizards and priests need these.' : undefined}
          onChange={(e) => {
            const id = e.target.value
            if (id && !hero.spells.includes(id)) onChange({ spells: [...hero.spells, id] })
          }}
        >
          <option value="">Add a spell or prayer…</option>
          {lores.map((lore) => (
            <optgroup key={lore} label={lore}>
              {spellOptions
                .filter((s) => s.lore === lore)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </SelectField>
        {hero.spells.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {hero.spells.map((id) => (
              <button
                key={id}
                type="button"
                className={chip(true)}
                onClick={() => onChange({ spells: hero.spells.filter((s) => s !== id) })}
                aria-label={`Remove ${spellName(id)}`}
              >
                {spellName(id)} <span aria-hidden className="ml-1 text-ink-dim">×</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <TextArea label="Notes" value={hero.notes} rows={2} onChange={(e) => onChange({ notes: e.target.value })} />

      <Sheet
        open={skillsOpen}
        onClose={() => setSkillsOpen(false)}
        title={`Skills for ${hero.name || typeName}`}
        description={
          skillOptions.length === 0
            ? 'Tick at least one skill table above to see skills.'
            : `From ${hero.skill_tables.map(skillTableName).join(', ')}.`
        }
        footer={
          <Button block onClick={() => setSkillsOpen(false)}>
            Done
          </Button>
        }
      >
        <ul className="flex flex-col divide-y divide-border">
          {skillOptions.map((s) => {
            const on = hero.skills.includes(s.id)
            return (
              <li key={s.id}>
                <label className="flex min-h-12 cursor-pointer items-start gap-3 py-2.5">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brass" checked={on} onChange={() => toggleSkill(s.id)} />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-ink">
                      {s.name} <span className="text-xs text-ink-dim">· {s.group}</span>
                    </span>
                    <span className="text-xs leading-relaxed text-ink-dim">{s.text}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </Card>
  )
}
