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
