import {enginePrisonLoad,type EnginePrisoner} from '../../../rules/resolve/engineOfChaos'
import {Button,Notice} from '../../../ui'

export interface EnginePrisonerView extends EnginePrisoner {name:string;origin:string}
export interface EngineJourneyView {
 escortName:string
 captiveCount:number
 rewardLabel:string
 /** Confirmed by the saved journey/battle record, never by elapsed calendar time. */
 readyToReturn:boolean
 missedBattleName?:string
}
export interface EnginePrisonView {
 id:string
 name:string
 number:number
 prisoners:EnginePrisonerView[]
 journey?:EngineJourneyView
}

/** Presentational custody card. It does not create prisoners or infer journey completion. */
export function EnginePrisonCard({engine,onPrisoner,onHistory,onDispatch,onJourney,onReturn,pending=false}:{
 engine:EnginePrisonView
 onPrisoner?:(id:string)=>void
 onHistory?:()=>void
 onDispatch?:()=>void
 onJourney?:()=>void
 onReturn?:()=>void
 pending?:boolean
}){
 const load=enginePrisonLoad(engine.prisoners)
 const journey=engine.journey
 return <article className="overflow-hidden rounded-lg border border-border bg-surface-low shadow-[0_6px_18px_#49351607]" aria-label={`${engine.name}, Engine of Chaos ${engine.number}`}>
  <header className="flex items-center gap-3 px-4 pb-4 pt-5 sm:px-5">
   <EngineIcon/>
   <div className="min-w-0"><h3 className="break-words font-headline text-2xl">{engine.name}</h3><p className="text-xs text-ink-dim">Engine of Chaos · {engine.number}</p></div>
   <span className="ml-auto self-start whitespace-nowrap rounded-full border border-border px-2 py-1 text-[9px] uppercase tracking-wider text-brass">{journey?journey.readyToReturn?'Return due':'Away':'Present'}</span>
  </header>
  {journey?<div className="px-4 pb-5 sm:px-5">
   <div className="rounded-md border border-border bg-surface p-4">
    <p className="text-xs text-ink-dim">Escorted by <strong className="ml-1 font-semibold text-ink">{journey.escortName}</strong></p>
    <div className="mt-4 flex items-center gap-1.5" aria-hidden><span className="h-2 w-2 rounded-full bg-brass"/><span className="h-px flex-1 bg-border"/><span className="h-2 w-2 rounded-full bg-brass"/><span className="h-px flex-1 bg-border"/><span className={`h-2 w-2 rounded-full border border-brass ${journey.readyToReturn?'bg-brass':'bg-surface-low'}`}/></div>
    <div className="mt-1.5 flex justify-between gap-2 text-[10px] text-ink-dim"><span>Dispatched</span><span>Misses next battle</span><span>Returns</span></div>
   </div>
   <p className="mt-4 text-sm font-semibold">{journey.captiveCount} {journey.captiveCount===1?'captive sent':'captives sent'} to the Dark Lands.</p>
   <p className="mt-2 text-xs leading-relaxed text-ink-dim">{journey.readyToReturn?'The missed battle is complete. Record the escort’s return and the reward.':'This engine and its escort are away and cannot take part in the next battle.'}{journey.missedBattleName?` Battle: ${journey.missedBattleName}.`:''}</p>
   <p className="mt-2 text-xs text-ink-dim">On return: {journey.rewardLabel}.</p>
  </div>:<>
   <div className="px-4 pb-5 sm:px-5">
    <div className="mb-3 flex items-baseline justify-between gap-3 text-xs text-ink-dim"><span><strong className="text-xl font-medium text-ink">{load.used}</strong> / 6 places occupied</span><span>{load.models} {load.models===1?'captive':'captives'}</span></div>
    <div className="grid grid-cols-6 gap-1.5" role="img" aria-label={`${load.used} of 6 places occupied. Large captives use two places.`}>
     {engine.prisoners.map((prisoner,index)=>{const start=1+engine.prisoners.slice(0,index).reduce((total,p)=>total+(p.large?2:1),0);const end=start+(prisoner.large?1:0);return <span key={prisoner.id} className={`flex h-10 items-center justify-center rounded border text-xs text-[#efdfbb] shadow-[inset_0_1px_0_#bca67a55] ${prisoner.large?'col-span-2 border-[#715832] bg-linear-to-br from-[#8e7443] to-[#66502e]':'border-[#463d30] bg-linear-to-br from-[#62584b] to-[#443e35]'}`}>{prisoner.large?`${start}–${end}`:start}</span>})}
     {Array.from({length:load.free},(_,i)=><span key={`free-${i}`} className="flex h-10 items-center justify-center rounded border border-border bg-surface-high text-xs text-ink-dim/70">{load.used+i+1}</span>)}
    </div>
    <p className="mt-2 text-[11px] text-ink-dim">{load.free?`${load.free===1?'One place':`${load.free} places`} available.`:'No places available.'} Large captives count as two.</p>
    {load.overCapacity?<div className="mt-3"><Notice tone="warn">This record exceeds the engine’s six places. Review the custody records before adding or dispatching prisoners.</Notice></div>:null}
   </div>
   {engine.prisoners.length?<ul className="mx-4 border-t border-border sm:mx-5">{engine.prisoners.map(prisoner=><li key={prisoner.id} className="border-b border-border/60 last:border-0">
    <button type="button" className="flex min-h-17 w-full items-center gap-3 py-3 text-left disabled:cursor-default" onClick={()=>onPrisoner?.(prisoner.id)} disabled={!onPrisoner||pending}>
     <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border font-headline text-base text-brass">{prisoner.name.slice(0,1)}</span>
     <span className="min-w-0"><span className="block break-words text-sm font-semibold">{prisoner.name}</span><span className="mt-0.5 block break-words text-xs text-ink-dim">{prisoner.origin}</span></span>
     <span className="ml-auto whitespace-nowrap text-[11px] text-ink-dim">{prisoner.large?'2 places':'1 place'}</span>{onPrisoner?<span aria-hidden className="text-lg text-brass">›</span>:null}
    </button>
   </li>)}</ul>:<p className="px-4 pb-5 text-xs text-ink-dim sm:px-5">No prisoners aboard this engine.</p>}
  </>}
  {(onHistory||onDispatch||onJourney||onReturn)?<footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-5">
   {journey?(onJourney?<Button variant="ghost" onClick={onJourney} disabled={pending}>View journey</Button>:null):(onHistory?<Button variant="ghost" onClick={onHistory} disabled={pending}>View history</Button>:null)}
   {journey?.readyToReturn&&onReturn?<Button variant="secondary" onClick={onReturn} pending={pending}>Record return</Button>:!journey&&onDispatch?<Button variant="secondary" onClick={onDispatch} disabled={pending||!load.models||load.overCapacity}>Prepare a journey</Button>:journey?<span className="text-xs text-ink-dim">{journey.readyToReturn?'Return due':'Return pending'}</span>:null}
  </footer>:null}
 </article>
}

function EngineIcon(){
 return <svg className="h-12 w-12 shrink-0 rounded-lg border border-border bg-linear-to-br from-[#eee3c9] to-[#e0d1af] p-2 text-[#776041] shadow-[inset_0_1px_#fff9]" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
  <path d="M5 24V12h23v12M4 24h28M8 12V8h17v4M12 12v11m6-11v11m6-11v11M28 18h4v6M29 18V7h3v11"/><circle cx="10" cy="28" r="4"/><circle cx="26" cy="28" r="4"/><path d="M10 26v4m-2-2h4m14-2v4m-2-2h4"/>
 </svg>
}
