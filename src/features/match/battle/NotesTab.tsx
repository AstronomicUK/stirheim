import { useState } from 'react'
import type { BattleLiveState } from '../../../domain'
import { Button, Stepper, TextArea, TextField } from '../../../ui'
import { Card, Section } from '../../roster/view/bits'
import { scenarioObjectives } from '../../../rules/data/campaign/scenarioObjectives'
import { addLoot, removeLoot, setNotes, setWyrdstoneFound } from './sheet'

export interface NotesTabProps {
  sheet: BattleLiveState
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void
  readOnly: boolean
  /** The scenario being played, so the tab only offers what this game actually yields. */
  scenarioId?: string | null
  /** A scenario written by the group: the app has no rules for it, so it offers everything. */
  custom?: boolean
}

export function NotesTab({ sheet, edit, readOnly, scenarioId }: NotesTabProps) {
  const [lootDraft, setLootDraft] = useState('')
  const objectives = scenarioObjectives(scenarioId)
  // A custom scenario, or one the catalogue does not carry, gets both: better to offer than to hide.
  // An absent extracted heading is not evidence that the scenario has no objectives.
  // Always keep manual recording available for rules in prose and agreed adaptations.
  const showWyrdstone = true
  const showLoot = true

  function submitLoot() {
    const line = lootDraft.trim()
    if (line === '') return
    edit((s) => addLoot(s, line))
    setLootDraft('')
  }

  return (
    <>
      {showWyrdstone ? (
        <Section title="Wyrdstone">
          <Card className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink">Shards found</p>
                <p className="text-xs text-ink-dim">Picked up during the battle. Exploration comes after.</p>
              </div>
              <Stepper value={sheet.wyrdstoneFound} onChange={(v) => edit((s) => setWyrdstoneFound(s, v))} label="wyrdstone shards" disabled={readOnly} />
            </div>
            {objectives.wyrdstone ? <p className="border-t border-border pt-2 text-xs leading-relaxed text-ink-dim">{objectives.wyrdstone}</p> : null}
          </Card>
        </Section>
      ) : null}

      {showLoot ? (
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
      ) : null}

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
