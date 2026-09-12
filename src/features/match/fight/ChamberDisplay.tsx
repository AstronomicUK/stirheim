import type { ReactNode } from 'react'
import './chambers.css'
/** Pure display: rules supply the loaded count, availability and allowed barrel selections. */
export function ChamberDisplay({name,copy,capacity,loaded,status,ready,barrels,onBarrels,disabled,children}:{
 name:string;copy?:string;capacity:1|2;loaded:number;status:string;ready:boolean;barrels?:1|2;onBarrels?:(count:1|2)=>void;disabled?:boolean;children?:ReactNode
}){
 const filled=Math.max(0,Math.min(capacity,loaded))
 return <section className="chamber-panel" aria-label={`${name}${copy?` ${copy}`:''} ammunition`}>
  <div className="chamber-heading"><div><h3>{name}</h3>{copy&&<p>{copy}</p>}</div><span className="chamber-count"><strong>{filled}</strong> / {capacity} loaded</span></div>
  <div className="chamber-row"><div className="chamber-bores" aria-hidden="true">{Array.from({length:capacity},(_,index)=><span key={index} className="chamber-rim"><span className="chamber-bore">{index<filled&&<span className="chamber-ball"/>}</span></span>)}</div><p className={`chamber-status ${ready?'chamber-status--ready':''}`}>{status}</p></div>
  {capacity===2&&onBarrels&&<div className="chamber-choice"><span>Fire</span><div role="radiogroup" aria-label={`Barrels to fire from ${name}${copy?` ${copy}`:''}`}>
   {([1,2] as const).map(count=><button key={count} type="button" role="radio" aria-checked={barrels===count} disabled={disabled||count>filled||!ready} className={barrels===count?'selected':''} onClick={()=>onBarrels(count)}>{count===1?'1 barrel':'Both barrels'}</button>)}
  </div></div>}
  {children&&<div className="chamber-actions">{children}</div>}
 </section>
}
