import { useState } from 'react'
import { useCampaign } from '../../api/campaigns'
import { useSession } from '../../app/session'
import { Link } from 'react-router'
import { useAwakeningOffers, useResolveAwakening, type AwakeningOffer } from '../../api/aftermath'
import { Button, Notice, TextArea } from '../../ui'
import { findItem } from '../../rules/data/items'

function Opportunity({offer,warbandId,mayEdit}:{offer:AwakeningOffer;warbandId:string;mayEdit:boolean}){
 const receiving=offer.to_warband_id===warbandId
 const [reason,setReason]=useState(''),[confirm,setConfirm]=useState<'accept'|'decline'|'reverse'|null>(null)
 const save=useResolveAwakening()
 const snapshot=offer.snapshot&&typeof offer.snapshot==='object'&&!Array.isArray(offer.snapshot)?offer.snapshot:{}
 const kit=Array.isArray(snapshot.items)?snapshot.items.flatMap(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item))return []
  const catalogue=typeof item.item_rules_id==='string'?findItem(item.item_rules_id):undefined
  if(!catalogue||!['melee','missile','blackpowder','armour'].includes(catalogue.category))return []
  return [`${typeof item.quantity==='number'&&item.quantity>1?`${item.quantity} × `:''}${catalogue.name}`]
 }):[]
 const subject=offer.hero_name
 return <article className="flex flex-col gap-3 rounded-md border border-border bg-surface-low p-4">
  <div><p className="text-xs uppercase tracking-wider text-ink-dim">{offer.state==='accepted'?'Awakening recorded':'Spell of Awakening'}</p><h3 className="mt-1 font-headline text-xl">{subject}</h3></div>
  <p className="text-sm leading-relaxed">{offer.state==='accepted'?`${offer.recipient?.name??'The opposing warband'} raised this Hero as a Zombie. The result is recorded in both battle reports.`:receiving?`This Hero from ${offer.source?.name??'the opposing warband'} died after your battle. A surviving spellcaster who knows Spell of Awakening can raise them as a Zombie.`:`${offer.recipient?.name??'The opposing warband'} can raise this Hero as a Zombie. Their player has been notified.`}</p>
  {receiving&&offer.state==='offered'&&<><p className="text-sm text-ink-dim">The Zombie keeps the Hero’s characteristics, weapons and armour, forms a group of one, and gains no experience. It cannot run or use the former Hero’s skills or miscellaneous equipment.</p>{kit.length>0&&<p className="text-sm"><strong>Retained kit:</strong> {kit.join(', ')}.</p>}<p className="text-sm text-ink-dim">Both warbands must file their post-battle reports first. An accepted Awakening must be reversed before either report can be withdrawn.</p></>}
  <Link to={`/matches/${offer.match_id}`} className="text-sm">View battle reports</Link>
  {receiving&&mayEdit&&<>
   {confirm?<div className="flex flex-col gap-3 border-t border-border pt-3"><p className="text-sm">{confirm==='accept'?`Raise ${subject} and add them to this warband now?`:confirm==='decline'?'Decline this opportunity to raise the Hero?':'Reverse the Awakening and remove the raised Zombie and its retained kit? If they have changed since being raised, the GM must reconcile them first.'}</p><TextArea label={confirm==='reverse'?'Reason for reversal':'Table ruling or correction notes (if needed)'} value={reason} onChange={e=>setReason(e.target.value)} rows={2} maxLength={2000}/><div className="flex flex-wrap gap-3"><Button pending={save.isPending} disabled={confirm==='reverse'&&reason.trim().length<5} onClick={()=>save.mutate({id:offer.id,action:confirm,reason},{onSuccess:()=>setConfirm(null)})}>{confirm==='accept'?'Raise as a Zombie':confirm==='decline'?'Confirm decline':'Reverse Awakening'}</Button><Button variant="secondary" disabled={save.isPending} onClick={()=>setConfirm(null)}>Cancel</Button></div></div>:<div className="flex flex-wrap gap-3">{offer.state==='offered'?<><Button onClick={()=>setConfirm('accept')}>Raise as a Zombie</Button><Button variant="secondary" onClick={()=>setConfirm('decline')}>Decline</Button></>:<Button variant="secondary" onClick={()=>setConfirm('reverse')}>Correct this Awakening</Button>}</div>}
   {save.error&&<Notice tone="error">{save.error.message}</Notice>}
  </>}
 </article>
}
export function AwakeningCard({warbandId,mayEdit,campaignId}:{warbandId:string;mayEdit:boolean;campaignId?:string}){
 const user=useSession(s=>s.user)
 const campaign=useCampaign(campaignId)
 const allowed=mayEdit||campaign.data?.campaign.gm_id===user?.id
 const offers=useAwakeningOffers(warbandId)
 if(offers.isError)return <Notice tone="error">Resurrection opportunities couldn’t load. <button onClick={()=>void offers.refetch()}>Try again</button></Notice>
 if(!offers.data?.length)return null
 return <section className="flex flex-col gap-3" aria-label="Resurrection opportunities"><h2 className="font-headline text-2xl">After the battle</h2>{offers.data.map(offer=><Opportunity key={offer.id} offer={offer} warbandId={warbandId} mayEdit={allowed}/>)}</section>
}
