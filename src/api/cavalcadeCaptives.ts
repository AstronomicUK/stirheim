import {useQuery} from '@tanstack/react-query'
import {supabase} from './supabase'
import type {CaptiveCase} from './captives'
import type {WarbandDetail} from './warbands'
import {forcedCaptureSnapshot,snapshotKit} from './forcedCaptives'
import {cavalcadeThroneReward} from '../rules/resolve/cavalcadeCapture'
import type {CaptiveChoice} from '../rules/resolve/captives'

export function buildHenchmanThrone(input:{item:CaptiveCase;owner:WarbandDetail;captor:WarbandDetail;choice:Extract<CaptiveChoice,{kind:'throne'}>}) {
 const {item,owner,captor,choice}=input
 const snap=forcedCaptureSnapshot(item)
 if(!snap||item.subject_kind!=='henchman'||item.victim_warband_id!==owner.warband.id||item.captor_warband_id!==captor.warband.id)throw new Error('Reload this captured henchman and both warbands before proposing the Throne outcome.')
 if(choice.originalD6!=null&&(!Number.isInteger(choice.originalD6)||choice.originalD6<1||choice.originalD6>6))throw new Error('The original app D6 must be from 1 to 6.')
 const reward=cavalcadeThroneReward(captor.roster,{name:item.hero_name},{d6:choice.d6,groupId:choice.groupId,heroId:choice.leaderId})
 const dice=choice.originalD6==null?`tabletop result ${choice.d6}`:`app rolled ${choice.originalD6}${choice.originalD6!==choice.d6?`; player changed this to ${choice.d6}`:''}`
 return {choice,nextOwner:owner.roster,nextCaptor:{...reward.captor,stash:[...reward.captor.stash,...snapshotKit(snap)]},message:`D6: ${dice}. ${reward.message} The captor retains the recorded equipment.`}
}

export interface CavalcadeCaptureFacts {attackerIsHero:boolean;targetIsEnemyHumanHenchman:boolean;capturedThralls:number;capturedThisBattle:number;eligible:boolean}
export async function fetchCavalcadeCaptureFacts(matchId:string,captorId:string,attackerId:string,targetId:string):Promise<CavalcadeCaptureFacts>{
 const rpc=supabase.rpc as unknown as (name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:{message:string}|null}>
 const result=await rpc('cavalcade_capture_facts',{p_match_id:matchId,p_captor_id:captorId,p_attacker_id:attackerId,p_target_id:targetId})
 if(result.error)throw new Error(result.error.message)
 return result.data as CavalcadeCaptureFacts
}
export function useCavalcadeCaptureFacts(matchId:string,captorId:string,attackerId:string|undefined,targetId:string|undefined,revision:string,enabled:boolean){
 return useQuery({queryKey:['cavalcadeCaptureFacts',matchId,captorId,attackerId,targetId,revision],enabled:enabled&&!!attackerId&&!!targetId,refetchInterval:15000,queryFn:()=>fetchCavalcadeCaptureFacts(matchId,captorId,attackerId!,targetId!)})
}
