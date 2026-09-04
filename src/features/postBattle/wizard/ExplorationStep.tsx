import { useState } from 'react'
import { findItem } from '../../../rules/data/items'
import { rollDice, rollDie } from '../../../rules/resolve/dice'
import { Button, DieField, Markdown, Notice, NumberField, SegmentedControl, Stepper, TextArea, TextField } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import {
  foundItemFromName,
  setExplorationExtraDice,
  setExplorationExtraShards,
  setExplorationGold,
  setExplorationItems,
  setExplorationNotes,
  setExplorationRoll,
  setExplorationRolls,
  setExplorationSubRoll,
  setExplorationTest,
  type FoundItem,
} from '../model'
import { Intro, Row, type StepProps } from './bits'
import { StepBody } from './WizardShell'

type TestChoice = 'passed' | 'failed' | 'pending'

export function ExplorationStep({ draft, derived, update }: StepProps) {
  const ex = derived.exploration
  const [newItem, setNewItem] = useState('')

  if (ex.allowed === null) {
    return (
      <StepBody title="Exploration">
        <Notice tone="info" title="No exploration">
          {ex.skippedReason}
        </Notice>
        <p className="text-xs text-ink-dim">Rulebook: "Roll a D6 for each Hero in your warband who survives without going out of action." Hired swords and henchmen do not search.</p>
      </StepBody>
    )
  }

  const { allowed } = ex
  const won = draft.result === 'won'
  const survivors = ex.eligibleHeroes.map((h) => h.name).join(', ')
  const items = ex.items
  const testValue: TestChoice = draft.exploration.testPassed === null ? 'pending' : draft.exploration.testPassed ? 'passed' : 'failed'

  function setItems(next: FoundItem[]) {
    update((d) => setExplorationItems(d, next))
  }

  return (
    <StepBody title="Exploration">
      <Intro>
        {allowed.count} {allowed.count === 1 ? 'die' : 'dice'}: {allowed.reason}. Surviving {ex.eligibleHeroes.length === 1 ? 'hero' : 'heroes'}: {survivors}.
        {won ? '' : ' No winner’s die.'}
        {allowed.capped ? ' Roll them all and keep the six you like.' : ''}
      </Intro>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-dim">Extra dice from skills or equipment</span>
        <Stepper value={draft.exploration.extraDice} onChange={(n) => update((d) => setExplorationExtraDice(d, n))} label="extra exploration dice" />
      </div>

      <Section title="Dice">
        <Card className="flex flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-end gap-2">
            {ex.rolls.map((v, i) => (
              <DieField key={i} label={`Die ${i + 1}`} sides={6} value={v} onChange={(n) => update((d) => setExplorationRoll(d, i, n))} />
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => update((d) => setExplorationRolls(d, ex.rolls.map((v) => v ?? rollDie(6))))}>
              Roll the rest for me
            </Button>
          </div>
        </Card>
      </Section>

      {ex.result ? (
        <Section title="What you found">
          <Card className="px-4 py-2">
            <Row label="Dice total" value={ex.result.total} />
            <Row label="Wyrdstone shards" value={ex.result.shards} />
            {ex.result.multiple ? (
              <Row label={`${ex.result.multiple.count === 2 ? 'Doubles' : ex.result.multiple.count === 3 ? 'Triples' : `${ex.result.multiple.count} of a kind`} of ${ex.result.multiple.value}`} value={ex.location?.name ?? 'No entry'} />
            ) : (
              <Row label="Multiples" value="None" dim />
            )}
          </Card>

          {ex.location ? (
            <Card className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-headline text-lg font-semibold text-ink">{ex.location.name}</h3>
                {ex.rewardsApply ? <Tag tone="brass">Resolved</Tag> : <Tag tone="warn">To resolve</Tag>}
              </div>
              <p className="text-sm italic leading-relaxed text-ink-dim">{ex.location.flavour}</p>
              <Markdown source={ex.location.rules} className="text-sm" />

              {ex.location.subRoll ? (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <p className="text-xs text-ink-dim">{ex.location.subRoll.prompt}</p>
                  <DieField label="Location D6" sides={6} value={draft.exploration.subRoll} onChange={(v) => update((d) => setExplorationSubRoll(d, v))} rollable />
                  {ex.outcome && !ex.needsSubRoll ? <p className="text-sm text-ink">Result: {ex.outcome.text}</p> : null}
                </div>
              ) : null}

              {ex.needsTest ? (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <p className="text-xs text-ink-dim">Test ({ex.needsTest.stat}): {ex.needsTest.prompt}</p>
                  <SegmentedControl
                    options={[
                      { value: 'pending', label: 'Not rolled yet' },
                      { value: 'passed', label: 'Passed' },
                      { value: 'failed', label: 'Failed' },
                    ]}
                    value={testValue}
                    onChange={(v: TestChoice) => update((d) => setExplorationTest(d, v === 'pending' ? null : v === 'passed'))}
                    label="Test result"
                  />
                </div>
              ) : null}

              {ex.rewardsApply ? (
                <div className="flex flex-col gap-3 border-t border-border pt-3">
                  {ex.gold.expressions.length > 0 || ex.gold.fixed > 0 ? (
                    <div className="flex items-end gap-2">
                      <NumberField
                        label={`Gold found${ex.gold.expressions.length > 0 ? ` (${ex.gold.expressions.join(' + ')} gc)` : ''}`}
                        value={ex.gold.value}
                        onChange={(v) => update((d) => setExplorationGold(d, v === null || Number.isNaN(v) ? null : v))}
                        allowEmpty
                        disabled={ex.gold.expressions.length === 0}
                        className="flex-1"
                      />
                      {ex.gold.expressions.length > 0 ? (
                        <Button variant="secondary" onClick={() => update((d) => setExplorationGold(d, ex.gold.fixed + ex.gold.expressions.reduce((n, e) => n + rollDice(e).total, 0)))}>
                          Roll
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  {ex.extraShards.expressions.length > 0 || ex.extraShards.fixed > 0 ? (
                    <div className="flex items-end gap-2">
                      <NumberField
                        label={`Shards at the location${ex.extraShards.expressions.length > 0 ? ` (${ex.extraShards.expressions.join(' + ')})` : ''}`}
                        value={ex.extraShards.value}
                        onChange={(v) => update((d) => setExplorationExtraShards(d, v === null || Number.isNaN(v) ? null : v))}
                        allowEmpty
                        disabled={ex.extraShards.expressions.length === 0}
                        className="flex-1"
                      />
                      {ex.extraShards.expressions.length > 0 ? (
                        <Button variant="secondary" onClick={() => update((d) => setExplorationExtraShards(d, ex.extraShards.fixed + ex.extraShards.expressions.reduce((n, e) => n + rollDice(e).total, 0)))}>
                          Roll
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  {ex.textNotes.map((t) => (
                    <p key={t} className="text-xs text-ink-dim">
                      {t}
                    </p>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}
        </Section>
      ) : null}

      {ex.result && ex.rewardsApply ? (
        <Section title="Items found" aside="Go to the stash">
          <Card className="flex flex-col gap-3 px-4 py-3">
            {items.length === 0 ? <p className="text-sm text-ink-dim">Nothing. Add anything the text gives you.</p> : null}
            {items.map((item, i) => (
              <div key={`${item.item_rules_id ?? item.custom_name}-${i}`} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-ink">{item.item_rules_id ? (findItem(item.item_rules_id)?.name ?? item.item_rules_id) : item.custom_name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Stepper value={item.quantity} min={1} onChange={(q) => setItems(items.map((it, j) => (j === i ? { ...it, quantity: q } : it)))} label={`quantity of ${item.custom_name ?? item.item_rules_id}`} />
                  <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="min-h-11 text-xs text-ink-dim underline-offset-4 hover:text-accent-strong hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-end gap-2 border-t border-border pt-3">
              <div className="flex-1">
                <TextField label="Add an item" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Lucky Charm" hint="Catalogue names are matched; anything else is kept as written." />
              </div>
              <Button
                variant="secondary"
                disabled={newItem.trim() === ''}
                onClick={() => {
                  setItems([...items, foundItemFromName(newItem.trim())])
                  setNewItem('')
                }}
              >
                Add
              </Button>
            </div>
            {draft.exploration.items !== null && ex.suggestedItems.length > 0 ? (
              <button type="button" onClick={() => update((d) => setExplorationItems(d, null))} className="min-h-11 self-start text-xs text-ink-dim underline-offset-4 hover:text-ink hover:underline">
                Back to what the text suggests
              </button>
            ) : null}
          </Card>
        </Section>
      ) : null}

      {ex.result ? (
        <TextArea label="Exploration notes" value={draft.exploration.notes} onChange={(e) => update((d) => setExplorationNotes(d, e.target.value))} placeholder="Straggler interrogated: roll one extra die next time." rows={2} />
      ) : null}
    </StepBody>
  )
}
