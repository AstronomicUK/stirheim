import {useState} from 'react'
import type {TakenOutBy} from '../../../domain'
import {useCavalcadeCaptureFacts} from '../../../api/cavalcadeCaptives'
import {Button,DicePicker,DieField,Notice} from '../../../ui'

/** The victim records the table's actual weapon and capture die; no extra OOA is added. */
export function CavalcadeCasualtyChoice({matchId,targetId,by,weaponId,pending,onPick}:{matchId:string;targetId:string;by:TakenOutBy;weaponId:NonNullable<TakenOutBy['captureWeapon']>;pending:boolean;onPick:(by:TakenOutBy)=>void}){
 const facts=useCavalcadeCaptureFacts(matchId,by.warbandId!,by.modelId!,targetId,'manual',true)
 const [die,setDie]=useState<number|null>(null),[original,setOriginal]=useState<number|null>(null)
 if(facts.isPending)return <p className="text-sm text-ink-dim">Checking Capture! eligibility…</p>
 if(facts.error)return <Notice tone="error" title="Could not check Capture!">{facts.error.message}<Button variant="secondary" onClick={()=>void facts.refetch()}>Try again</Button></Notice>
 if(!facts.data.eligible)return <div className="flex flex-col gap-3"><p className="text-sm text-ink-dim">{!facts.data.attackerIsHero?'This warrior is no longer an eligible Cavalcade Hero.':!facts.data.targetIsEnemyHumanHenchman?'Capture! only applies to enemy human henchmen.':facts.data.capturedThralls>=5?'The Cavalcade already has five Captured Thralls.':'The Cavalcade has already captured two models this battle.'} Record an ordinary casualty and resolve their injury after the battle.</p><Button disabled={pending} onClick={()=>onPick({...by,captureWeapon:weaponId})}>Record ordinary casualty</Button></div>
 return <div className="flex flex-col gap-3">
  <p className="font-semibold">Capture!</p>
  <p className="text-sm text-ink-dim">The Misericordia took this human henchman out of action. On a 5+ they are captured for the Throne of Worms; otherwise resolve normal survival after the battle.</p>
  <DicePicker label="Capture! D6" onComplete={(values,manual)=>{setDie(values[0]);if(!manual)setOriginal(values[0])}}/>
  <DieField label="Capture! D6 result" sides={6} value={die} onChange={setDie}/>
  {original!==null?<p className="text-xs text-ink-dim">App rolled {original}{die!==original?`; changed to ${die??'—'}`:''}. Both stay in the combat log.</p>:null}
  {die!==null?<p className="text-sm">{die>=5?'Captured — no normal injury roll.':'Not captured — resolve normal henchman survival.'}</p>:null}
  <Button disabled={die===null||pending} onClick={()=>{if(die!==null)onPick({...by,captureWeapon:weaponId,cavalcadeCapture:{roll:die,originalRoll:original,captured:die>=5}})}}>Record Capture! result</Button>
 </div>
}
