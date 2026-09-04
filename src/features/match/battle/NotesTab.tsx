import { useState } from 'react'
import type { BattleLiveState } from '../../../domain'
import { Button, Stepper, TextArea, TextField } from '../../../ui'
import { Card, Section } from '../../roster/view/bits'
import { addLoot, removeLoot, setNotes, setWyrdstoneFound } from './sheet'

export interface NotesTabProps {
  sheet: BattleLiveState
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void
  readOnly: boolean
}

export function NotesTab({ sheet, edit, readOnly }: NotesTabProps) {
  const [lootDraft, setLootDraft] = useState('')

  function submitLoot() {
    const line = lootDraft.trim()
    if (line === '') return
    edit((s) => addLoot(s, line))
    setLootDraft('')
  }

  return (
    <>
      <Section title="Wyrdstone">
        <Card className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm text-ink">Shards found</p>
            <p className="text-xs text-ink-dim">Picked up during the battle. Exploration comes after.</p>
          </div>
          <Stepper value={sheet.wyrdstoneFound} onChange={(v) => edit((s) => setWyrdstoneFound(s, v))} label="wyrdstone shards" disabled={readOnly} />
        </Card>
      </Section>

      <Section title="Loot" aside={sheet.loot.length > 0 ? `${sheet.loot.length}` : undefined}>
        {sheet.loot.length > 0 ? (
          <Card>
            <ul className="divide-y divide-border">
              {sheet.loot.map((line, i) => (
                <li key={`${i}-${line}`} className="flex items-center justify-between gap-3 py-1 pl-4 pr-2">
                  <span className="min-w-0 break-words text-sm text-ink">{line}</span>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => edit((s) => removeLoot(s, i))}
                      aria-label={`Remove ${line}`}
                      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-sm text-ink-dim hover:text-accent-strong"
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <p className="text-sm text-ink-dim">No loot recorded.</p>
        )}
        {!readOnly ? (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              submitLoot()
            }}
          >
            <div className="min-w-0 flex-1">
              <TextField label="Add loot" value={lootDraft} onChange={(e) => setLootDraft(e.target.value)} placeholder="Treasure chest, 20 gc, a map…" maxLength={120} />
            </div>
            <Button type="submit" variant="secondary" disabled={lootDraft.trim() === ''}>
              Add
            </Button>
          </form>
        ) : null}
      </Section>

      <Section title="Notes">
        <TextArea
          label="Battle notes"
          value={sheet.notes}
          onChange={(e) => edit((s) => setNotes(s, e.target.value))}
          rows={5}
          disabled={readOnly}
          placeholder="Leader used Leadership for the rout test, scenario objectives, who is carrying what…"
          hint="Carried into your post-battle report."
        />
      </Section>
    </>
  )
}
