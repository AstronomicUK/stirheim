import { rollDie } from '../../../rules/resolve/dice'
import { Button, DieField, NumberField, TextArea } from '../../../ui'
import { Card, Section } from '../../roster/view/bits'
import { setBattleGold, setBattleWyrdstone, setNotes, setVeteranDie } from '../model'
import { Intro, type StepProps } from './bits'
import { StepBody } from './WizardShell'

export function VeteransStep({ draft, derived, update }: StepProps) {
  const [a, b] = draft.veteranPool
  return (
    <StepBody title="Veterans & notes">
      <Intro>
        Rulebook: "Between each battle, roll 2D6: this represents the experience of the warriors currently available for hire." New henchmen may start with that much experience between them.
      </Intro>
      <Section title="Veteran pool (2D6)">
        <Card className="flex flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <DieField label="First D6" sides={6} value={a} onChange={(v) => update((d) => setVeteranDie(d, 0, v))} />
            <DieField label="Second D6" sides={6} value={b} onChange={(v) => update((d) => setVeteranDie(d, 1, v))} />
            <div className="flex flex-1 items-end justify-end">
              <Button variant="secondary" onClick={() => update((d) => setVeteranDie(setVeteranDie(d, 0, rollDie(6)), 1, rollDie(6)))}>
                Roll for me
              </Button>
            </div>
          </div>
          <p className="text-sm text-ink-dim">
            {derived.veteranPool !== null ? (
              <>
                Pool: <span className="tabular-nums text-ink">{derived.veteranPool}</span> experience worth of veterans available.
              </>
            ) : (
              'Leave both blank to skip; the previous pool stays on the roster.'
            )}
          </p>
        </Card>
      </Section>
      <Section title="Picked up during the battle">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Wyrdstone shards" value={draft.battleWyrdstone} onChange={(v) => update((d) => setBattleWyrdstone(d, Number.isNaN(v ?? Number.NaN) ? 0 : (v ?? 0)))} hint="Scenario objectives, from the sheet." />
          <NumberField label="Gold crowns" value={draft.battleGold} onChange={(v) => update((d) => setBattleGold(d, Number.isNaN(v ?? Number.NaN) ? 0 : (v ?? 0)))} hint="Loot the scenario paid out." />
        </div>
      </Section>
      <TextArea label="Notes for the record" value={draft.notes} onChange={(e) => update((d) => setNotes(d, e.target.value))} rows={4} placeholder="What happened, who did what, anything the GM should know." />
    </StepBody>
  )
}
