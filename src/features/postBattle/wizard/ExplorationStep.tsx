import { PettyThief } from './PettyThief'
import { LocationRecruits } from './LocationRecruits'
import { LocationExperience } from './LocationExperience'
import { MAGICAL_ARTEFACTS } from '../../../rules/data/campaign/exploration'
import { slayerExploration } from '../model/slayerExploration'
import { emptyExploration } from '../model/state'
import { battleTreasureAwards } from '../../../rules/resolve/battleTreasure'
import { heroOoaIds } from '../model/derive'
import { useState } from 'react'
import { findItem } from '../../../rules/data/items'
import { rollDice, rollDie } from '../../../rules/resolve/dice'
import { Button, DieFace, DieField, Markdown, Notice, NumberField, SegmentedControl, SelectField, Stepper, TextArea, TextField } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import {
  foundItemFromName,
  setExplorationDiceOverride,
  setExplorationExtraShards,
  setExplorationGold,
  setExplorationItems,
  setExplorationNotes,
  setExplorationRoll,
  setExplorationRolls,
  setExplorationSubRoll,
  setExplorationTest,
  setExplorationTestSubject,
  toggleExplorationKeep,
  type FoundItem,
} from '../model'
import { Intro, Row, type StepProps } from './bits'
import { abundanceShardsDue } from '../model/derive'
import { d3Of, setAbundanceRoll } from '../model/state'
import { ExplorationAidsCard } from './ExplorationAids'
import { StepBody } from './WizardShell'

type TestChoice = 'passed' | 'failed' | 'pending'

export function ExplorationStep({ draft, derived, update, ctx }: StepProps) {
  const ex = derived.exploration
  const [newItem, setNewItem] = useState('')
  const awards = ctx.scenarioId === 'the_sword_of_the_herald' && draft.scenarioNonCampaign ? [] : battleTreasureAwards(derived.participants.heroes, heroOoaIds(draft), draft.enemiesOut)
  const awardSummary = awards.length ? <Notice tone="info" title="Extra treasure earned"><ul>{awards.map(a=><li key={`${a.subjectId}:${a.rule}`}>{a.name}: +{a.shards} wyrdstone/treasure — {a.rule}.</li>)}</ul>Added automatically; do not include this in manually recorded battle loot.</Notice> : null

  const slayer = ctx.roster.warbandTemplateId === 'dwarf_slayer_cult' ? slayerExploration(draft, derived.participants) : null
  const slayerControls = slayer ? <Card className="flex flex-col gap-3 px-4 py-3">
    <p className="font-medium">Slayer exploration</p>
    <p className="text-sm text-ink-dim">Only in Victory: Slayer heroes search after a win, draw or alliance with the winner, provided you did not rout. The Rememberer is exempt.</p>
    {draft.result === 'lost' && !draft.routed ? <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!draft.exploration.alliedWithWinner} onChange={e => update(d => ({...d, exploration: {...emptyExploration(), valorWitnesses: d.exploration.valorWitnesses, alliedWithWinner: e.target.checked}}))} />Allied with the winning warband</label> : null}
    {slayer.casualties.length > 0 ? <p className="text-sm text-ink-dim">Record of Valor: choose a witness only if an enemy or hostile event caused this casualty and that witness was still on the board at the time. Self-inflicted falls do not count. A hero who returned to the battle gives no extra die. Each casualty counts once, even with two witnesses.</p> : null}
    {slayer.casualties.map(h => <SelectField key={h.id} label={`${h.name} — qualifying witness`} value={draft.exploration.valorWitnesses?.[h.id] ?? ''} onChange={e => update(d => ({...d, exploration: {...emptyExploration(), alliedWithWinner: d.exploration.alliedWithWinner, valorWitnesses: {...d.exploration.valorWitnesses, [h.id]: e.target.value}}}))}>
      <option value="">No qualifying witnessed casualty</option>{slayer.witnesses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
    </SelectField>)}
  </Card> : null

  if (ex.allowed === null || ex.allowed.count === 0) {
    return (
      <StepBody title="Exploration">
        {awardSummary}
        {slayerControls}
        <PettyThief draft={draft} derived={derived} ctx={ctx} update={update} />
        <Notice tone="info" title="No exploration">
          {ex.skippedReason}
        </Notice>
        {ctx.scenarioId === 'the_wizard_s_tower' && ex.eligibleHeroes.length > 0 ? <Button variant="secondary" onClick={() => update(d => setExplorationDiceOverride(d, { count: 1, reason: '' }))}>Record an agreed exploration adjustment</Button> : null}
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
        {awardSummary}
        {slayerControls}
      <Intro>
        Suggested: {ex.suggested?.count ?? allowed.count} {(ex.suggested?.count ?? allowed.count) === 1 ? 'die' : 'dice'} ({ex.suggested?.reason ?? allowed.reason}). Surviving{' '}
        {ex.eligibleHeroes.length === 1 ? 'hero' : 'heroes'}: {survivors}.{won ? '' : ' No winner’s die.'}
        {ex.suggested?.capped ? ` Keep and score ${ex.suggested.keep} dice: pick which once they are all rolled.` : ''} Roll a different number if a skill, item, map bonus or house rule says so; the change is logged.
      </Intro>
      <Card className="flex flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-ink">Dice to roll</span>
            {draft.exploration.diceOverride ? (
              <button type="button" onClick={() => update((d) => setExplorationDiceOverride(d, null))} className="self-start text-xs text-brass underline-offset-4 hover:underline">
                Back to the suggested {ex.suggested?.count ?? 0}
              </button>
            ) : (
              <span className="text-xs text-ink-dim">As suggested</span>
            )}
          </div>
          <Stepper
            value={allowed.count}
            min={1}
            max={12}
            onChange={(n) => update((d) => setExplorationDiceOverride(d, n === (ex.suggested?.count ?? n) ? null : { count: n, reason: d.exploration.diceOverride?.reason ?? '' }))}
            label="exploration dice to roll"
          />
        </div>
        {draft.exploration.diceOverride && draft.exploration.diceOverride.count !== (ex.suggested?.count ?? 0) ? (
          <TextField
            label="Why a different number"
            value={draft.exploration.diceOverride.reason}
            autoComplete="off"
            placeholder="e.g. Streetwise skill, controls the Merchant Quarter"
            onChange={(e) => update((d) => setExplorationDiceOverride(d, { count: d.exploration.diceOverride?.count ?? allowed.count, reason: e.target.value }))}
          />
        ) : null}
      </Card>

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
            {ctx.scenarioId === 'a_stroll_in_the_garden' && ex.rolls.every(v => v !== null) && !draft.scenarioGardenRerolled ? <Button variant="secondary" onClick={() => update(d => ({ ...setExplorationRolls(d, ex.rolls.map(() => rollDie(6))), scenarioGardenRerolled: true }))}>Garden: re-roll the entire pool</Button> : null}
          </div>
        </Card>
      </Section>

      {allowed.capped ? (
        <Section title={`Keep ${allowed.keep}`}>
          <Card className="flex flex-col gap-3 px-4 py-3">
            <p className="text-sm text-ink-dim">
              You rolled {allowed.count}; the rulebook lets you keep and score only {allowed.keep} of them, even though you were entitled to roll more. Tap the ones to keep ({ex.kept.length} of {allowed.keep} chosen).
            </p>
            <div className="flex flex-wrap gap-2">
              {ex.rolls.map((v, i) =>
                v === null ? null : (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Die ${i + 1}, ${v}: ${ex.kept.includes(i) ? 'kept' : 'discarded'}`}
                    aria-pressed={ex.kept.includes(i)}
                    onClick={() => update((d) => toggleExplorationKeep(d, i, allowed.keep))}
                    className={`rounded-[22%] transition-opacity ${ex.kept.includes(i) ? '' : 'opacity-40 hover:opacity-70'}`}
                  >
                    <DieFace value={v} size={38} tone={ex.kept.includes(i) ? 'good' : 'plain'} />
                  </button>
                ),
              )}
            </div>
          </Card>
        </Section>
      ) : null}

      <ExplorationAidsCard draft={draft} derived={derived} ctx={ctx} update={update} rolls={ex.rolls} />

      <AbundanceCard draft={draft} ctx={ctx} update={update} />

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
                <h3 className="font-headline text-lg text-ink">{ex.location.name}</h3>
                {ex.record !== null ? <Tag tone="brass">Resolved</Tag> : <Tag tone="warn">To resolve</Tag>}
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
                  {ex.needsTest.pickHero ? (
                    <SelectField
                      label="Which Hero"
                      value={ex.testSubject?.id ?? ''}
                      onChange={(e) => update((d) => setExplorationTestSubject(d, e.target.value || null))}
                    >
                      <option value="">Choose a Hero</option>
                      {ex.eligibleHeroes.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </SelectField>
                  ) : null}
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
                  {ex.missNextGameHeroId ? <p className="text-sm text-ink">{ex.testSubject?.name} swallows tainted water and misses the next game through sickness.</p> : null}
                </div>
              ) : null}

              {ex.rewardsApply ? (
                <div className="flex flex-col gap-3 border-t border-border pt-3">
                  {ex.gold.expressions.length > 0 ? (
                    <div className="flex items-end gap-2">
                      <NumberField
                        label={`Gold found (${ex.gold.expressions.join(' + ')} gc)`}
                        value={ex.gold.value}
                        onChange={(v) => update((d) => setExplorationGold(d, v === null || Number.isNaN(v) ? null : v))}
                        allowEmpty
                        className="flex-1"
                      />
                      <Button variant="secondary" onClick={() => update((d) => setExplorationGold(d, ex.gold.fixed + ex.gold.expressions.reduce((n, e) => n + rollDice(e).total, 0)))}>
                        Roll
                      </Button>
                    </div>
                  ) : ex.gold.fixed > 0 ? (
                    <Row label="Gold found" value={`${ex.gold.fixed} gc`} />
                  ) : null}
                  {ex.extraShards.expressions.length > 0 ? (
                    <div className="flex items-end gap-2">
                      <NumberField
                        label={`Shards at the location (${ex.extraShards.expressions.join(' + ')})`}
                        value={ex.extraShards.value}
                        onChange={(v) => update((d) => setExplorationExtraShards(d, v === null || Number.isNaN(v) ? null : v))}
                        allowEmpty
                        className="flex-1"
                      />
                      <Button variant="secondary" onClick={() => update((d) => setExplorationExtraShards(d, ex.extraShards.fixed + ex.extraShards.expressions.reduce((n, e) => n + rollDice(e).total, 0)))}>
                        Roll
                      </Button>
                    </div>
                  ) : ex.extraShards.fixed > 0 ? (
                    <Row label="Shards at the location" value={ex.extraShards.fixed} />
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

      {ex.needsArtefact ? <Section title="Magical artefact">
        <Card className="flex flex-col gap-3 px-4 py-3">
          <p className="text-sm text-ink-dim">Each artefact may be found only once per campaign, even if its bearer has died. The campaign record is checked again when you file this report.</p>
          {ctx.artefacts === undefined ? <Notice tone={ctx.artefactsError ? 'error' : 'info'}>{ctx.artefactsError ?? 'Loading the campaign artefact record…'}</Notice> : <ul className="text-sm">{MAGICAL_ARTEFACTS.map(a => {
            const found = ctx.artefacts?.find(f => f.roll === a.band.min && (!ctx.reportId || f.reportId !== ctx.reportId))
            return <li key={a.band.min} className={found ? 'text-warn' : ''}>{a.band.min}. {a.name} — {found ? `already found by ${found.warbandName}; reroll` : 'available'}</li>
          })}</ul>}
          <DieField label="Magical artefact D6" sides={6} value={draft.exploration.artefactRoll ?? null} rollable onChange={value => update(d => ({...d,exploration:{...d.exploration,artefactRoll:value,artefactOverrideReason:'',items:null}}))} />
          {MAGICAL_ARTEFACTS.filter(a => a.band.min === draft.exploration.artefactRoll).map(a => <div key={a.name}><p className="font-medium">{a.name}</p><Markdown source={a.text} /></div>)}
          {ctx.artefacts?.some(a => a.roll === draft.exploration.artefactRoll && (!ctx.reportId || a.reportId !== ctx.reportId)) ? <TextField label="Agreed override reason (only to allow a duplicate)" value={draft.exploration.artefactOverrideReason ?? ''} onChange={e => update(d => ({...d,exploration:{...d.exploration,artefactOverrideReason:e.target.value}}))} hint="Leave blank and reroll to follow the campaign uniqueness rule." /> : null}
        </Card>
      </Section> : null}

      <PettyThief draft={draft} derived={derived} ctx={ctx} update={update} />
      <LocationRecruits draft={draft} derived={derived} ctx={ctx} update={update} />
      <LocationExperience draft={draft} derived={derived} ctx={ctx} update={update} />
      {ex.result && ex.rewardsApply ? (
        <Section title="Items found" aside="Go to the stash">
          {ex.itemQuantityPrompts.map(prompt => <div key={prompt.key} className="flex items-end gap-2">
            <NumberField label={`${prompt.name} — quantity (${prompt.expression})`} value={prompt.value} disabled={!!ctx.map?.perks.explorationMaxFinds} allowEmpty onChange={value => update(d => ({...d,exploration:{...d.exploration,items:null,itemQuantities:{...d.exploration.itemQuantities,[prompt.key]:value}}}))} />
            <Button variant="secondary" disabled={!!ctx.map?.perks.explorationMaxFinds} onClick={() => { const value = rollDice(prompt.expression).total; update(d => ({...d,exploration:{...d.exploration,items:null,itemQuantities:{...d.exploration.itemQuantities,[prompt.key]:value}}})) }}>Roll quantity</Button>
          </div>)}
          {ex.itemChoicePrompts.map(prompt => <div key={prompt.key} className="grid grid-cols-1 gap-2 sm:grid-cols-3">{Array.from({length:prompt.quantity}, (_,i) => <SelectField key={i} label={`Armourer item ${i + 1}`} value={prompt.selected[i] ?? ''} onChange={e => update(d => { const selected = Array.from({length:prompt.quantity}, (_,j) => j === i ? e.target.value : d.exploration.itemChoices?.[prompt.key]?.[j] ?? ''); return {...d,exploration:{...d.exploration,items:null,itemChoices:{...d.exploration.itemChoices,[prompt.key]:selected}}} })}><option value="">Choose…</option>{prompt.choices.map(name => <option key={name} value={name}>{name}</option>)}</SelectField>)}</div>)}
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

/** Map campaigns: the winner of a battle in an Abundance of Wyrdstone district gains D3 extra shards. */
function AbundanceCard({ draft, ctx, update }: Pick<StepProps, 'draft' | 'ctx' | 'update'>) {
  if (!abundanceShardsDue(draft, ctx) || !ctx.map) return null
  const shards = d3Of(draft.abundanceRoll)
  return (
    <Section title="Abundance of Wyrdstone" aside={ctx.map.districtName}>
      <Card className="flex flex-col gap-3 px-4 py-3">
        <p className="text-sm leading-relaxed text-ink-dim">
          {ctx.map.districtName} is rich in wyrdstone: the winner of a battle here gains D3 extra shards (map rules, Points of Interest). Roll a D6: 1-2 is one shard, 3-4 two, 5-6 three.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <DieField label="D6" sides={6} value={draft.abundanceRoll} onChange={(v) => update((d) => setAbundanceRoll(d, v))} rollable />
          {shards !== null ? (
            <p className="text-sm text-ink">
              +{shards} {shards === 1 ? 'shard' : 'shards'}
            </p>
          ) : null}
        </div>
      </Card>
    </Section>
  )
}
