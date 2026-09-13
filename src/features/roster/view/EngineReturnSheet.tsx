import { useState } from 'react'
import { buildHashutReturn, useReturnEngine, type EngineJourneyStatus } from '../../../api/engineJourneys'
import type { RosterWarband } from '../../../rules/types/roster'
import { hashutRewardPlan } from '../../../rules/resolve/engineOfChaos'
import { Button, DicePicker, DieField, Notice, NumberField, Sheet } from '../../../ui'

export function EngineReturnSheet({ status, roster, onClose }: { status: EngineJourneyStatus; roster: RosterWarband; onClose: () => void }) {
  const { journey } = status
  const plan = hashutRewardPlan(Array.from({length:journey.captive_count},(_,i) => ({id:String(i),large:false})))
  const returned = useReturnEngine()
  const [dice, setDice] = useState<(number|null)[]>(Array.from({length:plan.d3Count},() => null)), [appDice, setAppDice] = useState<number[]|null|undefined>()
  const [goldDie, setGoldDie] = useState<number|null>(null), [appGoldDie, setAppGoldDie] = useState<number|null|undefined>()
  const [allocations, setAllocations] = useState<Record<string,number>>({})
  const heroes = roster.heroes.filter(h => h.status === 'active')
  const leader = heroes.find(h => h.id === status.leader_id)
  const diceReady = dice.every(d => d !== null && d >= 1 && d <= 3) && (!plan.d6GoldCount || goldDie !== null)
  const xp = plan.fixedXp + dice.reduce<number>((sum,d) => sum+(d ?? 0),0)
  const selected = plan.xpRecipient === 'leader' ? leader ? [{heroId:leader.id,xp:1}] : [] : heroes.filter(h => (allocations[h.id] ?? 0)>0).map(h => ({heroId:h.id,xp:allocations[h.id]}))
  const invalidAllocation = heroes.some(h => !Number.isInteger(allocations[h.id] ?? 0) || (allocations[h.id] ?? 0) < 0 || (allocations[h.id] ?? 0) > xp)
  const allocated = selected.reduce((sum,a) => sum+a.xp,0)
  let payload: ReturnType<typeof buildHashutReturn> | undefined, previewError = ''
  if (diceReady && allocated === xp && !invalidAllocation) {
    try { payload = buildHashutReturn({journey,roster,d3:dice as number[],appD3:appDice,d6:goldDie,appD6:appGoldDie,allocations:selected,leaderId:status.leader_id}) }
    catch (e) { previewError = e instanceof Error ? e.message : 'Review the reward.' }
  }
  return <Sheet open title="Record the engine’s return" description={`${journey.escort_name} · ${journey.captive_count} captives sent`} onClose={onClose}
    footer={<Button block disabled={!status.ready_to_return || !payload} pending={returned.isPending} onClick={() => { if (payload) returned.mutate({journeyId:journey.id,payload},{onSuccess:onClose}) }}>Record return and reward</Button>}>
    <div className="flex flex-col gap-5 pt-3">
      <p className="text-sm text-ink-dim">{status.missed_match_label ? `Missed battle: ${status.missed_match_label}. ` : ''}The engine and escort return to the warband. This reward is applied once.</p>
      {!status.ready_to_return ? <Notice tone="warn">The next battle must be completed before the engine can return.</Notice> : null}
      {plan.d3Count ? <section><h3 className="mb-2 text-sm font-semibold">Experience reward · {plan.d3Count === 1 ? 'D3' : '2D3'}</h3>
        {appDice === undefined ? <DicePicker count={plan.d3Count} sides={3} label="Hashut’s experience reward" onComplete={(values,manual) => {setDice(values);setAppDice(manual?null:values)}}/> : <>
          <div className="flex flex-wrap gap-3">{dice.map((die,i) => <DieField key={i} label={`Experience D3 ${i+1}`} sides={3} value={die} onChange={value => setDice(old => old.map((d,j) => i===j?value:d))}/>)}</div>
          <p className="mt-2 text-xs text-ink-dim">{appDice ? `App rolled ${appDice.join(' + ')}${appDice.some((d,i) => d!==dice[i]) ? `; changed to ${dice.map(d => d??'?').join(' + ')}` : ''}. Both stay in the record.` : 'Tabletop dice entered. These results stay in the record.'}</p>
        </>}
      </section> : null}
      {plan.d6GoldCount ? <section><h3 className="mb-2 text-sm font-semibold">Gold reward · D6 × 5 gc</h3>
        {appGoldDie === undefined ? <DicePicker count={1} sides={6} label="Hashut’s gold reward" onComplete={(values,manual) => {setGoldDie(values[0]);setAppGoldDie(manual?null:values[0])}}/> : <><DieField label="Gold D6" sides={6} value={goldDie} onChange={setGoldDie}/><p className="mt-2 text-xs text-ink-dim">{appGoldDie === null ? 'Tabletop result' : `App rolled ${appGoldDie}`}{appGoldDie !== goldDie ? `; current result ${goldDie??'?'}` : ''}. {goldDie === null ? '' : `${goldDie*5} gc.`}</p></>}
      </section> : null}
      {plan.xpRecipient === 'leader' ? leader ? <Notice tone="info">{leader.name}, the warband leader, gains +1 Experience.</Notice> : <Notice tone="warn">Record the current warband leader before claiming this reward.</Notice> : diceReady ? <section><h3 className="text-sm font-semibold">Share {xp} Experience among Heroes</h3><p className="mb-3 mt-1 text-xs text-ink-dim">{allocated} of {xp} allocated. Any earned advances are queued automatically.</p><div className="flex flex-col gap-3">{heroes.map(h => <NumberField key={h.id} label={h.name} value={allocations[h.id]??0} hint={`0–${xp} Experience`} error={!Number.isInteger(allocations[h.id] ?? 0) || (allocations[h.id] ?? 0)<0 || (allocations[h.id] ?? 0)>xp ? `Enter a whole number from 0 to ${xp}.` : undefined} onChange={value => setAllocations(old => ({...old,[h.id]:value ?? 0}))}/>)}</div></section> : null}
      {previewError || returned.error ? <Notice tone="error">{previewError || returned.error?.message}</Notice> : null}
    </div>
  </Sheet>
}
