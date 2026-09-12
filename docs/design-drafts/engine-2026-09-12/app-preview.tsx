import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import '../../../src/index.css'
import {EnginePrisonCard,type EnginePrisonView} from '../../../src/features/roster/view/EnginePrisonCard'
import {EnginePlacementSheet} from '../../../src/features/roster/view/EnginePlacementSheet'
import {Sheet} from '../../../src/ui'
import {EnginePrisonerSheet} from '../../../src/features/roster/view/EnginePrisonerSheet'
const present:EnginePrisonView={id:'engine-1',name:'The Iron Maw',number:1,prisoners:[{id:'a',name:'Siegfried',origin:'The Black Company · Hero',large:false},{id:'b',name:'Grukk',origin:'The Red Knives · Ogre',large:true},{id:'c',name:'A lost traveller',origin:'Found during exploration',large:false}]}
function Preview(){
 const [ready,setReady]=useState(false),[detail,setDetail]=useState(''),[placement,setPlacement]=useState(false),[prisonerId,setPrisonerId]=useState('')
 const prisoner=present.prisoners.find(p=>p.id===prisonerId)
 const away:EnginePrisonView={id:'engine-2',name:'Ashbound',number:2,prisoners:[],journey:{escortName:'Drazh',captiveCount:4,rewardLabel:'D3 experience to share among Heroes',readyToReturn:ready}}
 return <main className="mx-auto max-w-5xl px-5 py-8"><p className="text-[10px] uppercase tracking-[.22em] text-ink-dim">Black Dwarfs · Warband ledger</p><h1 className="mt-2 font-headline text-3xl">Engines &amp; captives</h1><p className="mb-6 mt-3 max-w-xl text-sm text-ink-dim">Each engine has its own prisoners and journey. A Large captive needs two places.</p>
  <button className="mb-4 rounded border border-border px-3 py-2 text-sm" onClick={()=>setPlacement(true)}>Preview imprisonment proposal</button>
  <div className="grid items-start gap-5 md:grid-cols-2"><EnginePrisonCard engine={present} onPrisoner={setPrisonerId} onHistory={()=>setDetail('History')} onDispatch={()=>setDetail('Prepare a journey')}/><EnginePrisonCard engine={away} onJourney={()=>setDetail('Journey')} onReturn={()=>setDetail('Record return')}/></div>
  <label className="mt-6 flex items-center gap-2 text-xs text-ink-dim"><input type="checkbox" checked={ready} onChange={e=>setReady(e.target.checked)}/>Preview the recorded return becoming due</label><p className="mt-4 text-xs text-ink-dim">Component draft. Sample data only; no campaign records are changed.</p>
  {placement?<EnginePlacementSheet engines={[{id:present.id,name:present.name,state:'present',prisoners:present.prisoners},{id:away.id,name:away.name,state:'away',prisoners:[]},{id:'full',name:'The Last Chain',state:'present',prisoners:Array.from({length:5},(_,i)=>({id:String(i),large:false}))}]} victim={{name:'Kurgan',warbandName:'The Red Knives',large:true,equipment:[{id:'kit1',name:'Great Weapon',quantity:1,notes:'A chipped family heirloom'},{id:'kit2',name:'Light Armour',quantity:1}]}} captorName="The Iron Covenant" pending={false} onClose={()=>setPlacement(false)} onPropose={id=>{setPlacement(false);setDetail(`Proposal preview: ${id}`)}}/>:null}
  {prisoner?<EnginePrisonerSheet prisoner={{...prisoner,engineName:present.name,state:'held',placedAt:'2026-09-12T20:00:00Z',equipmentKnown:true,equipment:prisoner.id==='c'?[]:[{id:'sword',name:'Sword',quantity:1,notes:'A chipped family heirloom'},{id:'armour',name:'Light Armour',quantity:1}],history:[{at:'2026-09-12T20:00:00Z',text:`Imprisoned in ${present.name} after both players agreed the equipment transfer.`}]}} onClose={()=>setPrisonerId('')}/>:null}
  <Sheet open={!!detail} onClose={()=>setDetail('')} title={detail}><p className="text-sm">This preview demonstrates the layout. The saved custody and journey actions will be connected after the backend contract is agreed.</p></Sheet>
 </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Preview/></React.StrictMode>)
