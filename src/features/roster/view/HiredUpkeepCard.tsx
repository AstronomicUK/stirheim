import { RetainedScout } from './RetainedScout'
import { useState } from 'react'
import { type WarbandDetail } from '../../../api/warbands'
import { useRosterEvent } from '../../../api/rosterEvents'
import { findHiredSword } from '../../../rules/data/campaign/hiredSwords'
import { dismissWarrior, payUpkeep } from '../../../rules/resolve/recruitment'
import { Button, Notice, DieField, SelectField } from '../../../ui'
import { Card, Section } from './bits'
export function HiredUpkeepCard({detail,canEdit}:{detail:WarbandDetail;canEdit:boolean}) {
 const save=useRosterEvent(detail),[error,setError]=useState('')
 const [rolls,setRolls]=useState<Record<string,number|null>>({}),[helped,setHelped]=useState<Record<string,boolean|undefined>>({})
 const options=(id:string)=>({contractRoll:rolls[id]??undefined,mariannaHelpedAndSurvived:helped[id]})
 const owed=detail.roster.hiredSwords.filter(s=>s.status==='active'&&s.flags.upkeepOwedAfter)
 if(!canEdit||!owed.length)return null
 async function settle(id:string,leave:boolean){try {
  const sword=detail.roster.hiredSwords.find(s=>s.id===id)!
  const result=leave?{value:{warband:dismissWarrior(detail.roster,id).value},events:[{message:`${sword.name} dismissed instead of paying upkeep.`}]}:payUpkeep(detail.roster,id,options(id))
  if (!leave && 'paid' in result.value && !result.value.paid) throw new Error('Not enough funds. Sell resources first or choose Dismiss instead.')
  const next={...result.value.warband,hiredSwords:result.value.warband.hiredSwords.map(s=>{if(s.id!==id)return s;const{upkeepOwedAfter:_,contractCheckOwed:_contract,...flags}=s.flags;return {...s,flags}})}
  await save.mutateAsync({reason:result.events.map(e=>e.message).join(' '),next});setError('')
 }catch(e){setError(e instanceof Error?e.message:'Could not record upkeep.')}}
 return <Section title="Hired swords: upkeep due">
  <p className="text-sm text-ink-dim">Pay after the battle, including their first. Sell wyrdstone at the Trading Post first if needed.</p>
  {owed.map(s => {
   const entry = findHiredSword(s.hiredSwordId)
   let payment: ReturnType<typeof payUpkeep> | undefined
   let paymentError = ''
   try { payment = payUpkeep(detail.roster, s.id, options(s.id)) } catch(e) { paymentError = e instanceof Error ? e.message : 'Review the contract before paying.' }
   const gold = payment ? detail.roster.gold - payment.value.warband.gold : 0
   const shards = payment ? detail.roster.wyrdstone - payment.value.warband.wyrdstone : 0
   return <Card key={s.id} className="flex flex-col gap-2 p-4">
    <p className="font-semibold">{s.name}</p>
    {s.hiredSwordId==='maglah_khan_s_horde'?<RetainedScout detail={detail} hire={s}/>:null}
    {s.flags.contractCheckOwed ? <>
      <DieField label={s.hiredSwordId === 'old_prospector' ? 'Old Coot — leaves on 1' : 'You can never escape your past…'} sides={6} value={rolls[s.id]??null} onChange={v=>setRolls(r=>({...r,[s.id]:v}))} rollable/>
      {s.hiredSwordId === 'countess_marianna_chevaux_vampire_assassin' && rolls[s.id] === 6 ? <>
        <p className="text-sm">Play D3 extra turns against Serutat’s minions, following Marianna’s rules, before recording this outcome.</p>
        <SelectField label="Did the warband take a minion out of action and Marianna survive?" value={helped[s.id] === undefined ? '' : String(helped[s.id])} onChange={e=>setHelped(h=>({...h,[s.id]:e.target.value===''?undefined:e.target.value==='true'}))}><option value="">Choose the encounter outcome</option><option value="true">Yes — next battle free</option><option value="false">No — Marianna leaves</option></SelectField>
      </> : null}
    </> : null}
    {payment?.events.map((e,i)=><p key={i} className="text-sm text-ink-dim">{e.message}</p>)}
    <p className="text-sm">{payment?.value.paid ? shards ? `${shards} wyrdstone / treasure` : `${gold} gc` : entry?.upkeep?.text ?? 'Review upkeep rules'}</p>
    {paymentError ? <p className="text-sm text-ink-dim">{paymentError}</p> : null}
    {payment && !payment.value.paid ? <p className="text-sm text-ink-dim">Not enough funds. Sell resources first, or dismiss this hire.</p> : null}
    <Button disabled={!payment?.value.paid} pending={save.isPending} onClick={()=>void settle(s.id,false)}>{payment?.value.warband.hiredSwords.find(h=>h.id===s.id)?.status === 'left' ? 'Record departure' : 'Record payment'}</Button>
    <Button variant="secondary" disabled={save.isPending} onClick={()=>void settle(s.id,true)}>Dismiss instead</Button>
   </Card>
  })}
  {error ? <Notice tone="error" title="Upkeep not recorded">{error}</Notice> : null}
 </Section>
}
