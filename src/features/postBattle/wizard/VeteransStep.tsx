import { rollDice, rollDie } from '../../../rules/resolve/dice'
import { useState } from 'react'
import { Button, DieField, NumberField, TextArea, TextField, Markdown } from '../../../ui'
import { scenarioAftermath } from '../../../rules/data/campaign/scenarioAftermath'
import { foundItemFromName } from '../model/exploration'
import { findItem } from '../../../rules/data/items'
import { Card, Section } from '../../roster/view/bits'
import { setBattleGold, setBattleWyrdstone, setNotes, setVeteranDie } from '../model'
import { setVeteranExtraDie } from '../model/state'
import { Intro, type StepProps } from './bits'
import { StepBody } from './WizardShell'

export function VeteransStep({ draft, derived, update, ctx }: StepProps) {
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState<number | null>(1)
  const scenario = scenarioAftermath(ctx.scenarioId, draft.scenarioMission, draft.scenarioUseBody)
  const nonCampaign = ctx.scenarioId === 'the_sword_of_the_herald' && draft.scenarioNonCampaign
  const [a, b] = draft.veteranPool
  const veteranDice = ctx.map?.perks.veteranDice ?? []
  return (
    <StepBody title="Veterans & notes">
      {!nonCampaign && <><Intro>
        Rulebook: "Between each battle, roll 2D6: this represents the experience of the warriors currently available for hire." New henchmen may start with that much experience between them.
      </Intro>
      <Section title={veteranDice.length > 0 ? 'Veteran pool (2D6, or 3D6 from the map)' : 'Veteran pool (2D6)'}>
        <Card className="flex flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <DieField label="First D6" sides={6} value={a} onChange={(v) => update((d) => setVeteranDie(d, 0, v))} />
            <DieField label="Second D6" sides={6} value={b} onChange={(v) => update((d) => setVeteranDie(d, 1, v))} />
            {veteranDice.length > 0 ? <DieField label="Third D6 (map)" sides={6} value={draft.veteranPoolExtra} onChange={(v) => update((d) => setVeteranExtraDie(d, v))} /> : null}
            <div className="flex flex-1 items-end justify-end">
              <Button variant="secondary" onClick={() => update((d) => setVeteranDie(setVeteranDie(d, 0, rollDie(6)), 1, rollDie(6)))}>
                Roll for me
              </Button>
            </div>
          </div>
          {veteranDice.length > 0 ? (
            <p className="text-sm text-ink-dim">
              {veteranDice.map((v) => `${v.source.districtName}: roll 3D6 when recruiting for existing ${v.kind === 'human' ? 'human' : 'non-human'} henchman groups`).join('. ')}. Add the third die when
              the recruits are for such a group; leave it blank otherwise.
            </p>
          ) : null}
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
      </Section></>}
      <Section title="Picked up during the battle">
        {scenario.rewardRules.length > 0 ? <details className="text-sm text-ink-dim"><summary className="cursor-pointer text-brass">Scenario reward rules</summary>{scenario.rewardRules.map((r, i) => <div key={i} className="mt-3"><p className="font-semibold">{r.name}</p><Markdown source={r.text} /></div>)}</details> : null}
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Wyrdstone shards" value={draft.battleWyrdstone} onChange={(v) => update((d) => setBattleWyrdstone(d, Number.isNaN(v ?? Number.NaN) ? 0 : (v ?? 0)))} hint="Scenario objectives, from the sheet." />
          <NumberField label="Gold crowns" value={draft.battleGold} onChange={(v) => update((d) => setBattleGold(d, Number.isNaN(v ?? Number.NaN) ? 0 : (v ?? 0)))} hint="Loot the scenario paid out." />
        </div>
        <p className="text-sm text-ink-dim">Record the rewards earned under those conditions, including any dice rolled, in the report notes. Items below go into your stash when the report is applied.</p>
        {scenario.goldDice.length > 0 ? <div className="flex flex-wrap gap-2">{scenario.goldDice.map(expression => <Button key={expression} variant="secondary" onClick={() => {
          const rolled = rollDice(expression)
          update(d => ({ ...setBattleGold(d, d.battleGold + rolled.total), notes: [d.notes, `Scenario reward ${expression}: rolled ${rolled.rolls.join(', ')}; added ${rolled.total} gc.`].filter(Boolean).join('\n') }))
        }}>Add earned {expression} gc reward</Button>)}</div> : null}
        {(draft.scenarioItems ?? []).map((item, i) => <div key={i} className="flex items-center justify-between gap-2 text-sm"><span>{item.quantity} × {item.custom_name ?? (item.item_rules_id ? findItem(item.item_rules_id)?.name ?? item.item_rules_id : '')}</span><Button variant="ghost" onClick={() => update(d => ({ ...d, scenarioItems: d.scenarioItems?.filter((_, j) => j !== i) }))}>Remove</Button></div>)}
        <div className="flex flex-wrap items-end gap-2">
          <TextField label="Scenario item reward" value={itemName} onChange={e => setItemName(e.target.value)} maxLength={80} placeholder="Sword, treasure map…" />
          <NumberField label="Quantity" value={quantity} onChange={setQuantity} />
          <Button variant="secondary" disabled={!itemName.trim() || !quantity || !Number.isInteger(quantity) || quantity < 1} onClick={() => { const item = foundItemFromName(itemName.trim(), quantity!); update(d => ({ ...d, scenarioItems: [...(d.scenarioItems ?? []), item] })); setItemName(''); setQuantity(1) }}>Add reward</Button>
        </div>
      </Section>
      <TextArea label="Notes for the record" value={draft.notes} onChange={(e) => update((d) => setNotes(d, e.target.value))} rows={4} placeholder="What happened, who did what, anything the GM should know." />
    </StepBody>
  )
}
