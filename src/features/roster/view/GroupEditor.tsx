import { Button, NumberField, Stepper, TextArea, TextField } from '../../../ui'
import { unitTypeName } from '../shared/names'
import { Card, Tag } from './bits'
import type { GroupDraft } from './diff'
import { StatsGrid } from './StatsGrid'
import type { DraftErrors } from './validate'

export interface GroupEditorProps {
  group: GroupDraft
  warbandTemplateId: string
  errors: DraftErrors
  onChange: (patch: Partial<GroupDraft>) => void
  onRemove: () => void
}

export function GroupEditor({ group, warbandTemplateId, errors, onChange, onRemove }: GroupEditorProps) {
  const prefix = `groups.${group.id}`
  const err = (field: string) => errors[`${prefix}.${field}`]
  return (
    <Card className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-dim">{unitTypeName(warbandTemplateId, group.unit_type_rules_id)}</p>
          {group.isNew ? <Tag tone="brass">New</Tag> : null}
        </div>
        <Button variant="ghost" onClick={onRemove} className="-mr-2 px-2 text-accent-strong">
          Remove
        </Button>
      </div>

      <TextField label="Group name" value={group.name} maxLength={60} error={err('name')} onChange={(e) => onChange({ name: e.target.value })} />

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-dim">Models in the group</span>
          <Stepper label="models" value={group.size} min={0} onChange={(size) => onChange({ size })} />
          {err('size') ? <p className="text-sm text-accent-strong">{err('size')}</p> : null}
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
          <input type="checkbox" className="h-5 w-5 accent-brass" checked={group.is_large} onChange={(e) => onChange({ is_large: e.target.checked })} />
          Large
        </label>
      </div>

      <StatsGrid stats={group.stats} onChange={(stats) => onChange({ stats })} errorFor={(k) => err(`stats.${k}`)} />

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Experience" value={group.xp} error={err('xp')} onChange={(v) => onChange({ xp: v ?? 0 })} />
        <NumberField label="Advances taken" value={group.level_ups} error={err('level_ups')} onChange={(v) => onChange({ level_ups: v ?? 0 })} />
      </div>

      <TextArea
        label="Model names"
        hint="One per line: the names of the individual models, or a short note about each."
        value={group.model_names.join('\n')}
        rows={Math.min(6, Math.max(2, group.size))}
        onChange={(e) => onChange({ model_names: e.target.value.split('\n') })}
      />

      <TextArea label="Notes" value={group.notes} rows={2} onChange={(e) => onChange({ notes: e.target.value })} />
    </Card>
  )
}
