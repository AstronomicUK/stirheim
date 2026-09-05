import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useUpdateRoster, useWarband, type WarbandDetail } from '../../api/warbands'
import { useSession } from '../../app/session'
import { findHiredSword } from '../../rules/data/campaign/hiredSwords'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { unitIsLarge } from '../../rules/resolve/builder'
import type { Stats } from '../../rules/types'
import { Button, Notice, NumberField, Spinner, TextArea, TextField } from '../../ui'
import { warbandTypeName } from './shared/names'
import { AddWarriorSheet, type AddWarriorChoice } from './view/AddWarriorSheet'
import { Card, Section } from './view/bits'
import { diffDraft, draftFromRows, removeHolder, tempId, type EditDraft, type GroupDraft, type HeroDraft, type LoadedRows } from './view/diff'
import { GroupEditor } from './view/GroupEditor'
import { HeroEditor } from './view/HeroEditor'
import { ItemsEditor, type HolderOption } from './view/ItemsEditor'
import { normaliseDraft, validateDraft, type DraftErrors } from './view/validate'

/** Used only when a hired sword entry has no profile in the data; the player corrects it by hand. */
const FALLBACK_STATS: Stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

export function EditWarbandPage() {
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
      <>
        <Notice tone="error" title="Could not load this warband">
          {query.error.message}
        </Notice>
        <Link to="/" className="text-brass underline-offset-4 hover:underline">
          Back to your warbands
        </Link>
      </>
    )
  }
  // Keyed on the warband so a different id starts a fresh draft; a background refetch does not reset edits.
  return <Editor key={query.data.warband.id} detail={query.data} />
}

function Editor({ detail }: { detail: WarbandDetail }) {
  const navigate = useNavigate()
  const profile = useSession((s) => s.profile)
  const update = useUpdateRoster(detail.warband.id)
  // The rows the draft is diffed against: fixed at mount so the diff and the server agree on "before".
  const [baseline] = useState<LoadedRows>(() => ({ warband: detail.warband, heroes: detail.heroes, groups: detail.groups, items: detail.items }))
  const [draft, setDraft] = useState<EditDraft>(() => draftFromRows(baseline))
  const [errors, setErrors] = useState<DraftErrors>({})
  const [addOpen, setAddOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const template = useMemo(() => findWarbandTemplate(baseline.warband.type_rules_id), [baseline.warband.type_rules_id])
  const changes = useMemo(() => diffDraft(baseline, normaliseDraft(draft)), [baseline, draft])
  const dirty = changes.length > 0

  const holders = useMemo<HolderOption[]>(
    () => [
      ...draft.heroes.filter((h) => !h.isNew).map<HolderOption>((h) => ({ id: h.id, name: h.name || '(unnamed)', type: 'hero', group: h.is_hired_sword ? 'Hired swords' : 'Heroes' })),
      ...draft.groups.filter((g) => !g.isNew).map<HolderOption>((g) => ({ id: g.id, name: g.name || '(unnamed)', type: 'group', group: 'Henchmen' })),
    ],
    [draft.heroes, draft.groups],
  )

  const patchWarband = (patch: Partial<EditDraft['warband']>) => setDraft((d) => ({ ...d, warband: { ...d.warband, ...patch } }))
  const patchHero = (id: string, patch: Partial<HeroDraft>) => setDraft((d) => ({ ...d, heroes: d.heroes.map((h) => (h.id === id ? { ...h, ...patch } : h)) }))
  const patchGroup = (id: string, patch: Partial<GroupDraft>) => setDraft((d) => ({ ...d, groups: d.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))

  function addWarrior(choice: AddWarriorChoice) {
    setDraft((d) => {
      const nextSort = Math.max(0, ...d.heroes.map((h) => h.sort_order + 1), ...d.groups.map((g) => g.sort_order + 1))
      if (choice.kind === 'group') {
        const group: GroupDraft = {
          id: tempId('group'),
          isNew: true,
          name: choice.unit.name,
          unit_type_rules_id: choice.unit.id,
          size: 1,
          stats: { ...choice.unit.stats },
          xp: choice.unit.startingExperience,
          level_ups: 0,
          stat_increases: {},
          is_large: unitIsLarge(choice.unit),
          notes: '',
          sort_order: nextSort,
        }
        return { ...d, groups: [...d.groups, group] }
      }
      const base: Omit<HeroDraft, 'name' | 'is_hired_sword' | 'unit_type_rules_id' | 'hired_sword_rules_id' | 'stats' | 'xp' | 'skill_tables' | 'is_large'> = {
        id: tempId('hero'),
        isNew: true,
        level_ups: 0,
        skills: [],
        spells: [],
        injuries: [],
        flags: {},
        status: 'active',
        notes: '',
        sort_order: nextSort,
      }
      if (choice.kind === 'hero') {
        const hero: HeroDraft = {
          ...base,
          name: choice.unit.name,
          is_hired_sword: false,
          unit_type_rules_id: choice.unit.id,
          hired_sword_rules_id: null,
          stats: { ...choice.unit.stats },
          xp: choice.unit.startingExperience,
          skill_tables: [...choice.unit.skillTableIds],
          is_large: unitIsLarge(choice.unit),
        }
        return { ...d, heroes: [...d.heroes, hero] }
      }
      const entry = findHiredSword(choice.hiredSwordId)
      const profileStats = entry?.detail?.profiles[0]?.stats
      const hero: HeroDraft = {
        ...base,
        name: entry?.name ?? choice.hiredSwordId,
        is_hired_sword: true,
        unit_type_rules_id: null,
        hired_sword_rules_id: choice.hiredSwordId,
        stats: profileStats ? { ...profileStats } : { ...FALLBACK_STATS },
        xp: 0,
        skill_tables: [],
        is_large: entry?.detail?.specialRules.some((r) => /large/i.test(r.name)) ?? false,
      }
      return { ...d, heroes: [...d.heroes, hero] }
    })
  }

  async function save() {
    setSaveError(null)
    const clean = normaliseDraft(draft)
    const found = validateDraft(clean)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const batch = diffDraft(baseline, clean)
    if (batch.length === 0) return
    try {
      await update.mutateAsync({ reason: 'manual_edit', changes: batch })
      navigate(`/warbands/${baseline.warband.id}`, { replace: true })
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save the changes.')
    }
  }

  const heroes = draft.heroes.filter((h) => !h.is_hired_sword)
  const hiredSwords = draft.heroes.filter((h) => h.is_hired_sword)
  const errorCount = Object.keys(errors).length

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">Edit · {warbandTypeName(baseline.warband.type_rules_id)}</p>
        <h1 className="font-headline text-3xl font-semibold leading-tight text-ink">{baseline.warband.name}</h1>
      </header>

      <Notice tone="info" title="Manual edits are logged">
        Every change saved here goes into the warband's history{profile ? ` as ${profile.display_name}` : ''}, so the group can see what was
        altered by hand. Use it to fix mistakes; battles and trading have their own screens.
      </Notice>

      <Section title="Warband">
        <Card className="flex flex-col gap-4 px-4 py-4">
          <TextField label="Name" value={draft.warband.name} maxLength={60} error={errors['warband.name']} onChange={(e) => patchWarband({ name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Gold crowns" value={draft.warband.gold} error={errors['warband.gold']} onChange={(v) => patchWarband({ gold: v ?? 0 })} />
            <NumberField label="Wyrdstone" value={draft.warband.wyrdstone} error={errors['warband.wyrdstone']} onChange={(v) => patchWarband({ wyrdstone: v ?? 0 })} />
          </div>
          <NumberField
            label="Veteran pool"
            value={draft.warband.veteran_pool}
            allowEmpty
            hint="2D6 rolled after the last battle; caps new henchmen's experience. Leave blank if none."
            error={errors['warband.veteran_pool']}
            onChange={(v) => patchWarband({ veteran_pool: v })}
          />
          <TextArea label="Campaign notes" value={draft.warband.notes} rows={3} onChange={(e) => patchWarband({ notes: e.target.value })} />
        </Card>
      </Section>

      <Section title="Heroes" aside={`${heroes.length}`}>
        {heroes.length === 0 ? <p className="text-sm text-ink-dim">No heroes.</p> : null}
        {heroes.map((h) => (
          <HeroEditor
            key={h.id}
            hero={h}
            warbandTemplateId={baseline.warband.type_rules_id}
            errors={errors}
            onChange={(patch) => patchHero(h.id, patch)}
            onRemove={() => setDraft((d) => removeHolder(d, h.id))}
          />
        ))}
      </Section>

      {hiredSwords.length > 0 ? (
        <Section title="Hired swords" aside={`${hiredSwords.length}`}>
          {hiredSwords.map((h) => (
            <HeroEditor
              key={h.id}
              hero={h}
              warbandTemplateId={baseline.warband.type_rules_id}
              errors={errors}
              onChange={(patch) => patchHero(h.id, patch)}
              onRemove={() => setDraft((d) => removeHolder(d, h.id))}
            />
          ))}
        </Section>
      ) : null}

      <Section title="Henchman groups" aside={`${draft.groups.length} groups`}>
        {draft.groups.length === 0 ? <p className="text-sm text-ink-dim">No henchman groups.</p> : null}
        {draft.groups.map((g) => (
          <GroupEditor
            key={g.id}
            group={g}
            warbandTemplateId={baseline.warband.type_rules_id}
            errors={errors}
            onChange={(patch) => patchGroup(g.id, patch)}
            onRemove={() => setDraft((d) => removeHolder(d, g.id))}
          />
        ))}
        <Button variant="secondary" block onClick={() => setAddOpen(true)}>
          Add hero or henchman group
        </Button>
      </Section>

      <Section title="Equipment and stash">
        {draft.heroes.some((h) => h.isNew) || draft.groups.some((g) => g.isNew) ? (
          <p className="text-xs text-ink-dim">Warriors added just now can be given equipment after this save.</p>
        ) : null}
        <ItemsEditor items={draft.items} holders={holders} errors={errors} onChange={(items) => setDraft((d) => ({ ...d, items }))} />
      </Section>

      {saveError ? <Notice tone="error">{saveError}</Notice> : null}
      {errorCount > 0 ? (
        <Notice tone="error">
          {errorCount === 1 ? 'One field needs attention before saving.' : `${errorCount} fields need attention before saving.`}
        </Notice>
      ) : null}

      <div className="mt-auto pt-2">
        <div className="sticky bottom-0 -mx-5 flex items-center gap-3 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            to={`/warbands/${baseline.warband.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface-high px-4 text-base font-medium text-ink hover:border-ink-dim"
          >
            Cancel
          </Link>
          <Button block className="flex-1" disabled={!dirty} pending={update.isPending} onClick={save}>
            {dirty ? (changes.length === 1 ? 'Save 1 change' : `Save ${changes.length} changes`) : 'Nothing to save'}
          </Button>
        </div>
      </div>

      <AddWarriorSheet open={addOpen} onClose={() => setAddOpen(false)} template={template} onAdd={addWarrior} />
    </>
  )
}
