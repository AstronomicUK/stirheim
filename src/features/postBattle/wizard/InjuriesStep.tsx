import {GroupInjuryProtection} from './GroupInjuryProtection'
import {MedicalAid} from './MedicalAid'
import {captureRuleName} from '../../../rules/resolve/forcedCapture'
import { ExtraTough } from './ExtraTough'
import {LycanthropeAftermath} from './LycanthropeAftermath'
import {MedicineChest} from './MedicineChest'
import type {ReactNode} from 'react'
import { setEternalInjury, setPlantCasualty, setHeroEnmityTarget } from '../model/state'
import { describeBitterEnmity, resolveBitterEnmityTarget } from '../../../rules/resolve/bitterEnmity'
import { useState } from 'react'
import { lookupHeroInjury } from '../../../rules/data/campaign/injuries'
import { HENCHMAN_INJURY } from '../../../rules/data/campaign/injuries'
import { rollDie } from '../../../rules/resolve/dice'
import { Button, DieField, Markdown, Stepper, TextField, SelectField, NumberField } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import {
  addHeroInjuryRoll,
  resetHeroInjury,
  setGroupInjuryDice,
  setGroupInjuryRoll,
  setHeroInjuryCount,
  setInjurySkip,
  setAnimalInjury,
  setKitExtraRoll,
  setKitRoll,
  setHeroInjurySubRoll,
  setHeroDistrictRoll,
  setSwordInjury,
  type HeroInjuryResolution,
  type InjuryOutcome,
} from '../model'
import { D66Entry, Intro, type StepProps } from './bits'
import { warriorTypeLabel } from './names'
import { modelLabel } from '../../roster/shared/names'
import { StepBody } from './WizardShell'
import { henchmanInjuryException } from '../../../rules/resolve/injuries'

const OUTCOME_TAG: Record<InjuryOutcome, { label: string; tone: 'neutral' | 'warn' | 'danger' | 'brass' }> = {
  recovered: { label: 'Recovered', tone: 'brass' },
  injured: { label: 'Injured', tone: 'warn' },
  dead: { label: 'Dead', tone: 'danger' },
  captured: { label: 'Captured', tone: 'danger' },
  retired: { label: 'Retired', tone: 'danger' },
}

export function InjuriesStep({ draft, derived, ctx, update }: StepProps) {
  const burning = ctx.scenarioId === 'mordheim_s_burning'
  const hunters=ctx.scenarioId==='the_hunters_become_the_hunted'
  const plant=(id:string)=>hunters&&!!draft.plantCasualties?.[id]
  const { heroes, hiredSwords, groups, animals, summary } = derived.injuries
  const nothing = heroes.length === 0 && hiredSwords.length === 0 && groups.length === 0 && animals.length === 0
  const kit = derived.kit.prompts.filter(p=>p.itemId!=='treasure_map')
  const maglah=hiredSwords.find(s=>s.sword.hiredSwordId==='maglah_khan_s_horde'&&['dead','left','retired'].includes(s.resolution.sword.status))
  const scouts=ctx.roster.hiredSwords.filter(s=>s.hiredSwordId==='hobgoblin_scout'&&(hiredSwords.find(r=>r.sword.id===s.id)?.resolution.sword.status??s.status)==='active')
  return (
    <StepBody title="Serious injuries">
      <Intro>
        {burning ? 'Mordheim’s Burning replaces the injury chart: roll D6 for each warrior out of action. 1–5 dies; 6 recovers unharmed and earns +1 Experience.' : 'Roll for every warrior taken out of action. Heroes and Dramatis Personae roll D66; ordinary hired swords and henchmen roll D6. If a rule waives the roll, record the reason.'}
      </Intro>
      <LycanthropeAftermath draft={draft} derived={derived} ctx={ctx} update={update}/>
      {hunters&&!nothing?<Section title="Carnivorous plant casualties"><Card className="flex flex-col gap-2 px-4 py-3">
        <p className="text-sm">Mark each model taken out by a plant. It rolls D6 instead of its ordinary injury roll: 1 is eaten and removed; 2–6 survives.</p>
        {[...heroes.map(h=>({id:h.hero.id,name:h.hero.name})),...hiredSwords.map(h=>({id:h.sword.id,name:h.sword.name})),...groups.flatMap(g=>Array.from({length:g.outOfAction},(_,index)=>({id:`${g.group.id}:${index}`,name:`${g.group.name} — ${modelLabel(g.group.modelNames,index)}`})))].map(h=><label key={h.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={plant(h.id)} onChange={e=>{const checked=e.target.checked;update(d=>setPlantCasualty(d,h.id,checked))}}/>{h.name}</label>)}
      </Card></Section>:null}
      {maglah&&scouts.length>1?<Card className="p-4"><SelectField label="Hobgoblin Scout who stays after Maglah’s departure" value={draft.retainedScoutId??maglah.sword.flags.retainedScoutId??''} onChange={e=>update(d=>({...d,retainedScoutId:e.target.value}))}><option value="">Choose the Scout who stays</option>{scouts.map(s=><option key={s.id} value={s.id}>{s.name} ({s.xp} XP)</option>)}</SelectField></Card>:null}
      {nothing ? (
        <Card className="px-4 py-3">
          <p className="text-sm text-ink">No warriors were taken out of action. Resolve any curse aftermath above.</p>
        </Card>
      ) : null}
      {heroes.length > 0 ? (
        <Section title={hunters?'Heroes':burning ? 'Heroes (D6)' : 'Heroes (D66)'}>
          {heroes.map(({ hero, resolution }) => (
            resolution.line?.injuryName.startsWith('Captured — ') ? <Card key={hero.id} className="flex flex-col gap-3 px-4 py-3"><p className="font-semibold">{hero.name}: Captured</p><p className="text-sm">{resolution.line.effect}</p><SkipRow skip={draft.injurySkips[hero.id]} onSkip={reason=>update(d=>setInjurySkip(d,hero.id,reason))}/></Card> : burning || plant(hero.id) ? <Card key={hero.id} className="flex flex-col gap-3 px-4 py-3">
              <p>{hero.name}</p>
              {draft.injurySkips[hero.id] === undefined ? <DieField label={`${hero.name} injury D6`} sides={6} value={draft.scenarioInjuryDice?.[hero.id] ?? null} onChange={v => update(d => ({ ...d, scenarioInjuryDice: { ...d.scenarioInjuryDice, [hero.id]: v } }))} rollable /> : null}
              <SkipRow skip={draft.injurySkips[hero.id]} onSkip={reason => update(d => setInjurySkip(d, hero.id, reason))} />
              {resolution.line ? <p className="text-sm">{resolution.line.effect}</p> : null}
            </Card> : <HeroInjuryCard
              key={hero.id}
              onSurvival={(index,patch)=>update(d=>{const flow=d.heroInjuries[hero.id];return {...d,heroInjuries:{...d.heroInjuries,[hero.id]:{...flow,rolls:flow.rolls.slice(0,index+1).map((r,i)=>i===index?{...r,...patch}:r)}}}})}
              onEternal={(index,choice,die)=>update(d=>setEternalInjury(d,hero.id,index,choice,die))}
              restartReasonRequired
              name={hero.name}
              type={warriorTypeLabel(ctx, hero)}
              resolution={resolution}
              medicine={<><MedicalAid heroId={hero.id} ctx={ctx} draft={draft} derived={derived} update={update}/> {hero.skillIds.some(id=>id.endsWith('_rotten_body'))?<label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.censerSelfInjury?.[hero.id]??false} onChange={e=>update(d=>({...d,censerSelfInjury:{...d.censerSelfInjury,[hero.id]:e.target.checked}}))}/>Rotten Body: went out of action from this warrior’s own failed censer test.</label>:null}<ExtraTough hero={hero} draft={draft} update={update}/><MedicineChest heroId={hero.id} draft={draft} items={ctx.items} resolution={resolution} update={update}/></>}
              enmity={resolution.hero.flags.bitterEnmity && resolution.hero.flags.bitterEnmity !== hero.flags.bitterEnmity ? (() => {
                // Bitter Enmity rolled here (#96): show who it is from the battle record, or ask.
                const flow = draft.heroInjuries[hero.id]
                const resolved = resolveBitterEnmityTarget({ ...resolution.hero.flags.bitterEnmity, matchId: ctx.matchId }, ctx.takenOutByDetail?.[hero.id]?.[0], ctx.enemies ?? [], flow?.enmityTarget ?? null)
                const value = flow?.enmityTarget ? `${flow.enmityTarget.warbandId}|${flow.enmityTarget.modelId ?? ''}` : ''
                return (
                  <div className="flex flex-col gap-2 rounded border border-border px-3 py-2 text-xs">
                    <p><span className="font-semibold">Bitter Enmity:</span> hates {describeBitterEnmity(resolved)}{resolved.source === 'attribution' ? ' — from the battle sheet' : resolved.source === 'chosen' ? ' — as you chose' : ' — decide at the table unless you name them below'}.</p>
                    {resolved.source !== 'attribution' && (ctx.enemies?.length ?? 0) > 0 ? (
                      <SelectField label="Who caused the injury?" value={value} onChange={(e) => update((d) => {
                        const [warbandId, modelId] = e.target.value.split('|')
                        return setHeroEnmityTarget(d, hero.id, warbandId ? { warbandId, modelId: modelId || null } : null)
                      })}>
                        <option value="">Not known — leave it to the table</option>
                        {(ctx.enemies ?? []).map((enemy) => (
                          <optgroup key={enemy.id} label={enemy.name}>
                            <option value={`${enemy.id}|`}>{enemy.name} — a henchman or unknown model (counts as the leader)</option>
                            {enemy.models.filter((m) => m.kind !== 'group').map((m) => <option key={m.id} value={`${enemy.id}|${m.id}`}>{m.name}</option>)}
                          </optgroup>
                        ))}
                      </SelectField>
                    ) : null}
                  </div>
                )
              })() : undefined}
              skip={draft.injurySkips[hero.id]}
              onSkip={(reason) => update((d) => setInjurySkip(d, hero.id, reason))}
              onD66={(d66, source) => update((d) => addHeroInjuryRoll(d, hero.id, d66, source, resolution.steps.at(-1)?.captureRerollReason))}
              onSubRoll={(index, v) => update((d) => (v === null ? d : setHeroInjurySubRoll(d, hero.id, index, v)))}
              onDistrictRoll={(index, v) => update((d) => (v === null ? d : setHeroDistrictRoll(d, hero.id, index, v)))}
              onCount={(v) => update((d) => (v === null ? d : setHeroInjuryCount(d, hero.id, v, resolution.pending.kind==='count'?resolution.pending.rollIndex??0:0)))}
              onReset={reason => update((d) => resetHeroInjury(d, hero.id, reason))}
            />
          ))}
        </Section>
      ) : null}
      {hiredSwords.length > 0 ? (
        <Section title="Hired swords and Dramatis Personae">
          {hiredSwords.map(({ sword, resolution }) => (
            resolution.line?.injuryName.startsWith('Captured — ') ? <Card key={sword.id} className="flex flex-col gap-3 px-4 py-3"><p className="font-semibold">{sword.name}: Captured</p><p className="text-sm">{resolution.line.effect}</p><SkipRow skip={draft.injurySkips[sword.id]} onSkip={reason=>update(d=>setInjurySkip(d,sword.id,reason))}/></Card> : resolution.heroFlow ? <HeroInjuryCard restartReasonRequired key={sword.id} name={sword.name} type="Dramatis Persona · D66" resolution={resolution.heroFlow}
              medicine={<MedicineChest heroId={sword.id} draft={draft} items={ctx.items} resolution={resolution.heroFlow} update={update}/>}
              skip={draft.injurySkips[sword.id]} onSkip={reason => update(d => setInjurySkip(d, sword.id, reason))}
              onD66={(d66, source) => update(d => addHeroInjuryRoll(d, sword.id, d66, source))}
              onSubRoll={(index,v) => update(d => v === null ? d : setHeroInjurySubRoll(d,sword.id,index,v))}
              onDistrictRoll={(index,v) => update(d => v === null ? d : setHeroDistrictRoll(d,sword.id,index,v))}
              onCount={v => update(d => v === null ? d : setHeroInjuryCount(d,sword.id,v))}
              onReset={reason => update(d => resetHeroInjury(d,sword.id,reason))} /> : <Card key={sword.id} className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink">{sword.name}</p>
                  <p className="text-xs text-ink-dim">{warriorTypeLabel(ctx, sword)} · {plant(sword.id)?'Plant injury: 1 eaten; 2–6 survives':burning ? '1–5 dies, 6 survives and earns +1 XP' : '1–2 lost, 3–6 survives'}</p>
                </div>
                {resolution.outcome ? <Tag tone={OUTCOME_TAG[resolution.outcome].tone}>{OUTCOME_TAG[resolution.outcome].label}</Tag> : null}
              </div>
              {draft.injurySkips[sword.id] === undefined ? (
                <DieField label="D6" sides={6} value={draft.swordInjuries[sword.id] ?? null} onChange={(v) => update((d) => setSwordInjury(d, sword.id, v))} rollable />
              ) : null}
              <SkipRow skip={draft.injurySkips[sword.id]} onSkip={(reason) => update((d) => setInjurySkip(d, sword.id, reason))} />
              {resolution.line ? <p className="text-xs text-ink-dim">{resolution.line.effect}.</p> : null}
            </Card>
          ))}
        </Section>
      ) : null}
      {groups.length > 0 ? (
        <Section title="Henchmen (D6 each)">
          {groups.map(({ group, outOfAction, dice, resolution }) => {
            const rolls = draft.groupInjuries[group.id] ?? []
            const diceOverride = draft.groupInjuryDice[group.id]
            const captures=resolution.line?.captured??[]
            const flamingTroll=group.unitTemplateId==='black_orcs_troll'&&draft.groupFlamingCasualties?.[group.id]===true
            const suggested=!burning&&!flamingTroll&&henchmanInjuryException(group)?.deadOn.length===0?0:outOfAction-captures.filter(c=>c.reason!=='slaaneshi_lock').length
            return (
              <Card key={group.id} className="flex flex-col gap-3 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{group.name}</p>
                    <p className="text-xs text-ink-dim">
                      {outOfAction} of {group.size} out of action ·{' '}
                      {(() => {
                        if (burning) return 'dead on 1–5; 6 survives and earns +1 group XP'
                        if(flamingTroll)return 'flaming injury: dead on 1–2; 3–6 recovers'
                        if(group.unitTemplateId==='masters_of_horror_flesh_construct')return '1–2: damaged, D6 × 5 gc to repair; 3–6: recovers'
                        const ex = henchmanInjuryException(group)
                        if (!ex) return `dead on ${HENCHMAN_INJURY.deadOn.join('-')}`
                        if (ex.deadOn.length === 0) return `no injury roll (${ex.note})`
                        return `${ex.label} on ${ex.deadOn[0]}-${ex.deadOn[ex.deadOn.length - 1]} (${ex.note})`
                      })()}
                    </p>
                  </div>
                  {resolution.complete ? (
                    <Tag tone={resolution.dead > 0 ? 'danger' : 'brass'}>{captures.length?`${captures.length} captured; ${resolution.dead} dead`:resolution.line?.repairCosts?.length ? 'Repairs needed' : resolution.dead === 0 ? 'All recover' : `${resolution.dead} dead`}</Tag>
                  ) : null}
                </div>
                {captures.map(c=><p key={c.eventId} className="text-sm">{c.reason==='slaaneshi_lock'?`Model ${c.heldModelIndex}: held at battle end`:`Casualty ${c.modelIndex}: captured by ${captureRuleName(c.reason)}`}; no injury roll.</p>)}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-ink-dim">Dice to roll {diceOverride ? '(changed)' : `· suggested ${suggested}`}</span>
                    {diceOverride ? (
                      <button type="button" onClick={() => update((d) => setGroupInjuryDice(d, group.id, null))} className="self-start text-xs text-brass underline-offset-4 hover:underline">
                        Back to {suggested}
                      </button>
                    ) : null}
                  </div>
                  <Stepper value={dice} min={0} max={20} onChange={(n) => update((d) => setGroupInjuryDice(d, group.id, n === suggested ? null : { count: n, reason: d.groupInjuryDice[group.id]?.reason ?? '' }))} label={`${group.name} injury dice`} />
                </div>
                {diceOverride && diceOverride.count !== suggested ? (
                  <TextField
                    label="Why a different number"
                    value={diceOverride.reason}
                    autoComplete="off"
                    placeholder="e.g. one was only knocked down when the game ended"
                    onChange={(e) => update((d) => setGroupInjuryDice(d, group.id, { count: diceOverride.count, reason: e.target.value }))}
                    error={diceOverride.reason.trim() ? undefined : 'Say why; it goes on the report'}
                  />
                ) : null}
                <div className="flex flex-wrap items-end gap-2">
                  {Array.from({ length: dice }, (_, i) => (
                    <DieField key={i} label={modelLabel(group.modelNames, i)} sides={6} value={rolls[i] ?? null} onChange={(v) => update((d) => setGroupInjuryRoll(d, group.id, i, v))} />
                  ))}
                  {dice > 0 ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        update((d) => {
                          let next = d
                          for (let i = 0; i < dice; i++) if ((d.groupInjuries[group.id]?.[i] ?? null) === null) next = setGroupInjuryRoll(next, group.id, i, rollDie(6))
                          return next
                        })
                      }
                    >
                      Roll the rest
                    </Button>
                  ) : null}
                </div>
                {!burning?<GroupInjuryProtection group={group} ctx={ctx} draft={draft} derived={derived} update={update}/>:null}
                {!burning && group.unitTemplateId==='masters_of_horror_flesh_construct' && rolls.slice(0,dice).map((roll,index)=>roll!==null && roll<=2 ? <DieField key={`repair-${index}`} label={`Repair cost, model ${index+1} · D6 × 5 gc`} sides={6} value={draft.constructRepairDice?.[group.id]?.[index]??null} rollable onChange={value=>update(d=>{const values=[...(d.constructRepairDice?.[group.id]??[])];values[index]=value;return {...d,constructRepairDice:{...d.constructRepairDice,[group.id]:values}}})}/> : null)}
                {resolution.line?.effect && <p className="text-sm">{resolution.line.effect}{group.unitTemplateId==='masters_of_horror_flesh_construct'?' Pay from the warband screen after filing this report, or leave the model awaiting repairs.':''}</p>}
                {resolution.complete ? (
                  <p className="text-xs text-ink-dim">
                    {group.size} → {resolution.group.size} {resolution.group.size === 1 ? 'model' : 'models'}
                    {resolution.group.size === 0 ? ' · the group is wiped out and stays on the roster for history' : ''}
                  </p>
                ) : null}
              </Card>
            )
          })}
        </Section>
      ) : null}
      {!nothing ? (
        <Card className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">Running summary</p>
          <p className="mt-1 text-sm text-ink">
            {[
              summary.dead > 0 ? `${summary.dead} dead` : null,
              summary.captured > 0 ? `${summary.captured} captured` : null,
              summary.retired > 0 ? `${summary.retired} retired` : null,
              summary.injured > 0 ? `${summary.injured} injured` : null,
              summary.recovered > 0 ? `${summary.recovered} recovered` : null,
              summary.henchmenDead > 0 ? `${summary.henchmenDead} ${summary.henchmenDead === 1 ? 'henchman' : 'henchmen'} lost` : null,
              summary.pending > 0 ? `${summary.pending} still to roll` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Nothing rolled yet'}
          </p>
        </Card>
      ) : null}
          {animals.length > 0 ? (
        <Section title="Animal casualties">
          {animals.map(({ animal, roll, dead, capture }) => (
            <Card key={animal.id} className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink">{animal.name}</p>
                  <p className="text-xs text-ink-dim">{animal.holderName}&apos;s · {capture ? (capture.event.payload.capture_reason==='slaaneshi_lock'?'Held by the Slaaneshi Man-Catcher at battle end; no injury roll':'Captured by Subjugator of Mankind; no injury roll') : burning ? '1–5 dead, 6 survives' : '1–2 dead (the item is lost), 3–6 survives'}</p>
                </div>
                {capture?<Tag tone="brass">Captured</Tag>:dead !== null ? <Tag tone={dead ? 'danger' : 'brass'}>{dead ? 'Dead' : 'Survives'}</Tag> : null}
              </div>
              {capture?<p className="text-sm text-ink-dim">Their captive case will appear on the warband screen after this report is applied.</p>:<DieField label="D6" sides={6} value={roll} onChange={(v) => update((d) => setAnimalInjury(d, animal.id, v))} rollable />}
            </Card>
          ))}
        </Section>
      ) : null}
      {kit.length > 0 ? (
        <Section title="Kit after the battle" aside={kit.some(p=>!p.complete) ? `${kit.filter(p=>!p.complete).length} to roll` : 'All rolled'}>
          {kit.map((p) => {
            const dice = p.prompt.dice === '2D6' ? 2 : 1
            const gold = p.outcome?.effect?.gold
            const extraDice = gold && typeof gold !== 'number' ? gold.dice : 0
            return (
              <Card key={p.key} className="flex flex-col gap-3 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{p.prompt.label}</p>
                    <p className="text-xs text-ink-dim">
                      {p.holderName} · {p.prompt.text}
                      {p.prompt.optional ? ' Leave it blank if the wish is not taken.' : ''}
                    </p>
                  </div>
                  {p.outcome ? <Tag tone={p.outcome.effect ? 'warn' : 'brass'}>{p.complete ? 'Rolled' : 'Roll the gold'}</Tag> : null}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  {Array.from({ length: dice }, (_, i) => (
                    <DieField key={i} label={dice === 1 ? p.prompt.dice : `Die ${i + 1}`} sides={6} value={p.rolls[i] ?? null} onChange={(v) => update((d) => setKitRoll(d, p.key, i, v))} rollable />
                  ))}
                  {p.outcome && extraDice > 0
                    ? Array.from({ length: extraDice }, (_, i) => (
                        <DieField key={`x${i}`} label={`Gold D6 ${i + 1}`} sides={6} value={p.extraRolls[i] ?? null} onChange={(v) => update((d) => setKitExtraRoll(d, p.key, i, v))} rollable />
                      ))
                    : null}
                </div>
                {p.outcome ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-ink">{p.outcome.text}</p>
                    {p.summary ? <p className="text-xs text-ink-dim">{p.summary}</p> : null}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </Section>
      ) : null}
      {ctx.roster.henchmenGroups.filter(g=>g.campaignState?.trainedSquig&&g.size>0).map(g=><label key={g.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.trainedSquigGoneWild?.[g.id]??false} onChange={e=>update(d=>({...d,trainedSquigGoneWild:{...d.trainedSquigGoneWild,[g.id]:e.target.checked}}))}/>{g.name} went wild and could not protect the Squig Herder.</label>)}
      {derived.handlerAftermath.rows.length?<Section title="Claimed Gnoblars"><p className="text-sm">Their Ogre went out of action. Each pet dies on 1–2; 3–6 survives.</p>{derived.handlerAftermath.rows.map(row=><Card key={row.id} className="flex flex-wrap gap-3 p-4">{Array.from({length:row.quantity},(_,i)=><DieField key={i} label={`${row.name} ${i+1}`} sides={6} rollable value={row.rolls[i]??null} onChange={value=>update(d=>{const dice=[...(d.claimedGnoblarDice?.[row.id]??[])];dice[i]=value;return {...d,claimedGnoblarDice:{...d.claimedGnoblarDice,[row.id]:dice}}})}/>)}</Card>)}</Section>:null}
      {derived.equipmentLosses.rows.length ? <Section title="Equipment lost with henchmen"><Card className="flex flex-col gap-3 px-4 py-3">
        <p className="text-sm">Equipment carried by dead or captured warriors leaves this group. Identical kit is removed automatically. For mixed or used equipment, record which copies left with those casualties.</p>
        {derived.equipmentLosses.rows.map(row=><div key={row.key} className="flex flex-col gap-1">
          {row.manual?<NumberField label={`${row.groupName}: ${row.name} lost`} value={row.lost} onChange={lost=>update(d=>({...d,groupEquipmentLosses:{...d.groupEquipmentLosses,[row.key]:lost}}))}/>:<p className="text-sm">{row.groupName}: {row.lost} {row.name} lost; {row.available-row.lost!} retained.</p>}
          {row.manual?<p className="text-xs text-ink-dim">{row.available} copies remain after recorded use; enter 0–{row.available} lost.</p>:null}
        </div>)}
      </Card></Section>:null}
      {derived.equipmentLosses.captureRows.length ? <Section title="Equipment carried by captives"><Card className="flex flex-col gap-3 px-4 py-3">
        <p className="text-sm">This equipment stays with each captive’s record. It is included in the losses above, not removed a second time.</p>
        {derived.equipmentLosses.captureRows.map(row=><div key={row.key}>{row.manual?<NumberField label={`${row.modelName}: ${row.name}`} value={row.quantity} onChange={quantity=>update(d=>({...d,capturedEquipment:{...d.capturedEquipment,[row.key]:quantity}}))}/>:<p className="text-sm">{row.modelName}: {row.quantity} {row.name}.</p>}</div>)}
      </Card></Section>:null}
      {derived.brokenEquipment.rows.length ? <Section title="Weapons broken in battle"><Card className="flex flex-col gap-3 px-4 py-3">
        {derived.brokenEquipment.rows.map(row => <div key={row.key} className="flex flex-col gap-2">
          <p className="text-sm">{row.name}: {row.broken} broken in battle{row.otherLost ? `; other injury or equipment results already lose ${row.otherLost}` : ''}.</p>
          {row.min !== row.max ? <><NumberField label={`${row.name}: total lost or broken`} value={row.total} onChange={total => update(d => ({ ...d, brokenWeaponTotals: { ...d.brokenWeaponTotals, [row.key]: total } }))} /><p className="text-xs text-ink-dim">Enter {row.min}–{row.max}. Count a broken weapon that was also lost with a casualty only once.</p></> : <p className="text-sm">{row.total} removed when this report is filed.</p>}
        </div>)}
      </Card></Section> : null}
    </StepBody>
  )
}

/** "No roll needed" with a reason; shown under every warrior's dice. */
function SkipRow({ skip, onSkip }: { skip: string | undefined; onSkip: (reason: string | null) => void }) {
  const on = skip !== undefined
  return (
    <div className="flex flex-col gap-2">
      <label className="flex min-h-9 items-center gap-3 text-sm text-ink">
        <input type="checkbox" className="h-5 w-5 shrink-0 accent-brass" checked={on} onChange={(e) => onSkip(e.target.checked ? '' : null)} />
        <span>
          No injury roll needed <span className="text-ink-dim">(counts as recovered, logged on the report)</span>
        </span>
      </label>
      {on ? <TextField label="Why" value={skip} autoComplete="off" placeholder="e.g. Lucky Charm saved him, house rule" onChange={(e) => onSkip(e.target.value)} error={skip.trim() ? undefined : 'Say why'} /> : null}
    </div>
  )
}

interface HeroInjuryCardProps {
  onSurvival?: (index:number,patch:{survivalDice?:[number|null,number|null];survivalAbsence?:number})=>void
  onEternal?: (index:number,choice:'accept'|'sacrifice',die?:number)=>void
  restartReasonRequired?: boolean
  medicine?: ReactNode
  /** Bitter Enmity target line and, when the record cannot say, the who-caused-it choice (#96). */
  enmity?: ReactNode
  name: string
  type: string
  resolution: HeroInjuryResolution
  skip: string | undefined
  onSkip: (reason: string | null) => void
  onD66: (d66: number, source: 'app' | 'tabletop') => void
  onSubRoll: (rollIndex: number, value: number | null) => void
  onDistrictRoll: (rollIndex: number, value: number | null) => void
  onCount: (value: number | null) => void
  onReset: (reason: string) => void
}

export function HeroInjuryCard({ onSurvival, onEternal, restartReasonRequired = false, medicine, enmity, name, type, resolution, skip, onSkip, onD66, onSubRoll, onDistrictRoll, onCount, onReset }: HeroInjuryCardProps) {
  const [showText, setShowText] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [restartReason, setRestartReason] = useState('')
  const { steps, pending, outcome } = resolution
  const lastApplied = [...steps].reverse().find((s) => !s.rerolled)
  const chartText = lastApplied ? lookupHeroInjury(lastApplied.d66).text : null
  return (
    <Card className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink">{name}</p>
          <p className="text-xs text-ink-dim">{type}</p>
        </div>
        {outcome ? <Tag tone={OUTCOME_TAG[outcome].tone}>{OUTCOME_TAG[outcome].label}</Tag> : <Tag tone="warn">Rolling</Tag>}
      </div>

      {steps.length > 0 ? (
        <ol className="flex flex-col gap-1.5 border-l border-border pl-3 text-sm">
          {steps.map((s, i) => (
            <li key={i} className={s.rerolled ? 'text-ink-dim' : 'text-ink'}>
              <span className={s.rerolled ? 'line-through' : undefined}><span className="tabular-nums">{s.medicineOriginal!==undefined?`${s.medicineOriginal} → `:""}{s.d66}</span>{s.medicineOriginal!==undefined?<span className="text-xs"> (Medicine Chest reroll)</span>:null}
              {s.subRoll !== null ? <span className="tabular-nums text-ink-dim"> / {s.subRoll}</span> : null} · {s.name}</span>
              {s.rerolled ? <span className="text-xs"> (re-rolled)</span> : null}
              {s.effect ? <p className="text-xs text-ink-dim">{s.effect}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {pending.kind === 'd66' && skip === undefined ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-dim">{pending.prompt}.</p>
          <D66Entry onCommit={onD66} />
        </div>
      ) : null}
      {resolution.hero.flags.pitFightOwed && lastApplied?.code==='sold_to_the_pits' ? <div className="rounded-md border border-warn/60 bg-warn/10 p-3 text-sm text-ink">
        <p className="font-medium">A pit fight is required</p>
        <p className="mt-1">{name} must fight a Pit Fighter before rejoining the warband. Finish and file this report first; if GM approval is required, wait for approval. The report will then offer a button to resolve this warrior’s fight.</p>
        <p className="mt-1 text-xs">Win: 50 gc and +2 Experience for a hero, keeping equipment. Dramatis Personae do not gain Experience. Lose: an injury roll restricted to 11–35; a survivor loses weapons and armour.</p>
      </div> : null}
      {medicine}
      {enmity}
      {steps.length === 0 ? <SkipRow skip={skip} onSkip={onSkip} /> : null}
      {pending.kind === 'subRoll' ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-dim">{pending.prompt}.</p>
          <DieField label={pending.die} sides={pending.die === 'D3' ? 3 : 6} value={null} onChange={(v) => onSubRoll(pending.rollIndex, v)} rollable />
        </div>
      ) : null}
      {pending.kind==='survival'?<div className="flex flex-col gap-2"><p>{pending.prompt}</p><div className="flex gap-3">{[0,1].map(i=><DieField key={i} label={`Leadership D6 ${i+1}`} sides={6} rollable value={pending.dice[i]} onChange={value=>onSurvival?.(pending.rollIndex,{survivalDice:i===0?[value,pending.dice[1]]:[pending.dice[0],value],survivalAbsence:undefined})}/>)}</div>{pending.passed?<DieField label="Battles missed (D3)" sides={3} rollable value={pending.absence??null} onChange={value=>{if(value!==null)onSurvival?.(pending.rollIndex,{survivalAbsence:value})}}/>:null}</div>:null}
      {pending.kind==='eternal' && <div className="flex flex-col gap-3">
        <p className="text-sm">{pending.prompt}</p>
        {pending.killed?<DieField label="Eternal Wounds lost (D3)" sides={3} value={null} rollable onChange={die=>{if(die!==null)onEternal?.(pending.rollIndex,'sacrifice',die)}}/>:<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>onEternal?.(pending.rollIndex,'accept')}>Accept injury result</Button><Button onClick={()=>onEternal?.(pending.rollIndex,'sacrifice')}>Sacrifice 1 Wound</Button></div>}
      </div>}
      {pending.kind === 'count' ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-dim">{pending.prompt}.</p>
          <DieField label="D6" sides={6} value={null} onChange={onCount} rollable />
        </div>
      ) : null}
      {pending.kind === 'districtTest' ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-dim">{pending.prompt}.</p>
          <DieField label={`D6 (${pending.needed}+)`} sides={6} value={null} onChange={(v) => onDistrictRoll(pending.rollIndex, v)} rollable />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {chartText ? (
          <button type="button" onClick={() => setShowText((v) => !v)} className="min-h-11 text-xs text-ink-dim underline-offset-4 hover:text-ink hover:underline">
            {showText ? 'Hide chart text' : 'Chart text'}
          </button>
        ) : (
          <span />
        )}
        {steps.length > 0 ? (
          <button type="button" onClick={() => restartReasonRequired ? setRestarting(true) : onReset('')} className="min-h-11 text-xs text-ink-dim underline-offset-4 hover:text-accent-strong hover:underline">
            Start this hero again
          </button>
        ) : null}
      </div>
      {restarting ? <div className="flex flex-col gap-2 rounded-md border border-border p-3">
        <p className="text-xs text-ink-dim">The original dice and your reason will stay in the battle report.</p>
        <TextField label="Reason for replacing the injury rolls" value={restartReason} onChange={e=>setRestartReason(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={!restartReason.trim()} onClick={()=>{onReset(restartReason);setRestarting(false);setRestartReason('')}}>Replace injury rolls</Button>
          <Button variant="secondary" onClick={()=>setRestarting(false)}>Keep current rolls</Button>
        </div>
      </div> : null}
      {showText && chartText ? <Markdown source={chartText} className="text-sm" /> : null}
    </Card>
  )
}
