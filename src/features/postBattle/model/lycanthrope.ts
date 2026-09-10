import type {Stats} from '../../../rules/types/common'
import type {RosterHero,RosterHiredSword,WarriorFlags} from '../../../rules/types/roster'
/** TC25 / TC28, The Thing in the Woods. The jaws attack is additional, and always first. */
export const BALEWOLF_PROFILE:Stats={M:5,WS:4,BS:0,S:5,T:5,W:3,I:4,A:2,Ld:7}
export const BALEWOLF_RULES='Large Target; causes fear; 4+ armour save modified by Strength. Two normal attacks plus one first jaws attack, which causes a critical hit on a wound roll of 5 or 6. At the start of its turn, if wounded, D6 5+ restores one Wound. Charge the nearest model, friend or foe, or move towards it at maximum speed; use its own Leadership to try to ignore friendly models.'
export type CurableInjuryFlag='missNextGames'|'oldBattleWound'|'singleHandedWeaponsOnly'|'noRunning'|'blindedInOneEye'|'stupidity'|'frenzy'|'immuneToFear'|'causesFear'|'hates'
const injuryFlags:Record<string,CurableInjuryFlag[]>={
 arm_wound:['singleHandedWeaponsOnly','missNextGames'],smashed_leg:['noRunning','missNextGames'],deep_wound:['missNextGames'],old_battle_wound:['oldBattleWound'],blinded_in_one_eye:['blindedInOneEye'],madness:['stupidity','frenzy'],hardened:['immuneToFear'],horrible_scars:['causesFear'],bitter_enmity:['hates'],
}
export interface HealthyProfileReview {stats:Stats;clearFlags:CurableInjuryFlag[];confirmed:boolean;reason:string}
type Warrior=RosterHero|RosterHiredSword
/** Only conditions supported by injury records are offered. The player chooses what was injury-derived. */
export function curableFlags(warrior:Warrior):CurableInjuryFlag[]{return [...new Set(warrior.injuries.flatMap(i=>injuryFlags[i.injuryCode]??[]))].filter(key=>!!warrior.flags[key])}
export function curseEligibility({survived,manSized,nonMutant}:{survived:boolean;manSized:boolean|undefined;nonMutant:boolean|undefined}){
 if(!survived)return {eligible:false,problem:null}
 if(manSized===undefined||nonMutant===undefined)return {eligible:false,problem:'Confirm whether the casualty is man-sized and a non-mutant before rolling for the curse.'}
 return {eligible:manSized&&nonMutant,problem:null}
}
export function balewolfCurseRoll(eligible:boolean,die:number|null|undefined){
 if(!eligible)return {cursed:false,problem:null}
 if(die==null||!Number.isInteger(die)||die<1||die>6)return {cursed:false,problem:'Roll the surviving eligible casualty’s curse D6.'}
 return {cursed:die===6,problem:null}
}
export function cureLycanthropeInjuries<T extends Warrior>(warrior:T,review:HealthyProfileReview,matchId:string):T {
 if(['dead','left','retired'].includes(warrior.status))throw new Error('Only a surviving casualty can receive the Balewolf curse.')
 if(!review.confirmed||!review.reason.trim())throw new Error('Review the healthy profile and injury-derived conditions before applying the cure.')
 const keys=Object.keys(BALEWOLF_PROFILE) as (keyof Stats)[]
 if(keys.some(k=>!Number.isSafeInteger(review.stats[k])||review.stats[k]<0)||review.stats.W<1||review.stats.S<1||review.stats.T<1)throw new Error('Enter a valid healthy profile for this surviving warrior.')
 const allowed=curableFlags(warrior)
 if(new Set(review.clearFlags).size!==review.clearFlags.length||review.clearFlags.some(key=>!allowed.includes(key)))throw new Error('Only explicitly reviewed injury-derived conditions can be cleared.')
 const flags:WarriorFlags={...warrior.flags,lycanthrope:warrior.flags.lycanthrope??{contractedAfter:matchId}}
 for(const key of review.clearFlags)delete flags[key]
 // Curing injuries cannot recreate stolen/lost equipment, ransom a prisoner, or settle a pit fight.
 return {...warrior,stats:{...review.stats},injuries:[],flags}
}
export function lycanthropeReturn(transformed:boolean|undefined,die:number|null|undefined){
 if(transformed===undefined)return {leaves:false,problem:'Record whether this cursed warrior transformed during the battle.',note:''}
 if(!transformed)return {leaves:false,problem:null,note:'Did not transform this battle; the Balewolf curse remains.'}
 if(die==null||!Number.isInteger(die)||die<1||die>6)return {leaves:false,problem:'Record the actual post-transformation D6.',note:''}
 return {leaves:die===1,problem:null,note:die===1?'Transformation D6 1: the Balewolf takes hold permanently; the warrior leaves the roster for the wilderness.':`Transformation D6 ${die}: returns to normal, still carrying the curse. Destroyed equipment is not restored.`}
}
export interface TransformationItem {id:string;name:string;quantity:number;kind:'weapon'|'armour'|'other'|'custom'}
export interface TransformationItemDecision {itemId:string;fate:'destroyed'|'weapon-lost'|'weapon-recovered'|'not-worn';reason?:string}
/** Accounts for actual held copies. Recovering a dropped weapon keeps that original copy, never awards another. */
export function transformationEquipment(items:readonly TransformationItem[],decisions:readonly TransformationItemDecision[]){
 const problems:string[]=[],losses:{itemId:string;quantity:number}[]=[],notes:string[]=[],seen=new Set<string>()
 for(const d of decisions){
  const item=items.find(i=>i.id===d.itemId)
  if(!item||seen.has(d.itemId)||!Number.isSafeInteger(item.quantity)||item.quantity<1){problems.push('Review each original carried equipment stack once.');continue}
  seen.add(d.itemId)
  if(item.kind==='weapon'&&!['weapon-lost','weapon-recovered'].includes(d.fate)){problems.push(`${item.name}: record whether the dropped weapon was recovered.`);continue}
  if(item.kind!=='weapon'&&item.kind!=='custom'&&['weapon-lost','weapon-recovered'].includes(d.fate)){problems.push(`${item.name}: worn equipment is destroyed; it is not a recoverable weapon.`);continue}
  if((item.kind==='custom'||d.fate==='not-worn')&&!d.reason?.trim()){problems.push(`Explain the actual use or classification of ${item.name}.`);continue}
  if(d.fate==='destroyed'||d.fate==='weapon-lost')losses.push({itemId:item.id,quantity:item.quantity})
  notes.push(`${item.name} ×${item.quantity}: ${d.fate==='destroyed'?'worn equipment destroyed by transformation':d.fate==='weapon-lost'?'dropped weapon not recovered':d.fate==='weapon-recovered'?'original dropped weapon recovered; no extra copy created':'not worn during transformation; retained'}.${d.reason?.trim()?` ${d.reason.trim()}`:''}`)
 }
 for(const item of items)if(!seen.has(item.id))problems.push(`Record what happened to ${item.name} during transformation.`)
 return {losses,notes,problems}
}

export interface CursedGroupMember {id:string;name:string;contractedAfter:string}
export interface CursedGroupReturn {deadIds:string[];transformations:Record<string,{transformed?:boolean;die?:number|null}>;newCurses:CursedGroupMember[]}
/** Keep a named subset inside the existing XP group; do not duplicate kit/advances by splitting it. */
export function cursedGroupAftermath(previous:readonly CursedGroupMember[],beforeSize:number,normalDeaths:number,draft:CursedGroupReturn){
 const problems:string[]=[],notes:string[]=[],members:CursedGroupMember[]=[],dead=new Set(draft.deadIds)
 if(new Set(previous.map(m=>m.id)).size!==previous.length)problems.push('Each existing cursed member needs a distinct record.')
 if(!Number.isInteger(beforeSize)||!Number.isInteger(normalDeaths)||normalDeaths<0||normalDeaths>beforeSize||previous.length>beforeSize)problems.push('Review this group’s original size and actual injury casualties.')
 if(dead.size!==draft.deadIds.length||draft.deadIds.some(id=>!previous.some(m=>m.id===id))||dead.size>normalDeaths)problems.push('Choose only actual cursed members among the normal injury casualties.')
 let feralLosses=0
 for(const member of previous){
  if(dead.has(member.id)){notes.push(`${member.name}: lost to the recorded injury casualty; no further curse roll.`);continue}
  const choice=draft.transformations[member.id]
  const result=lycanthropeReturn(choice?.transformed,choice?.die)
  if(result.problem)problems.push(`${member.name}: ${result.problem}`)
  else {notes.push(`${member.name}: ${result.note}`);if(result.leaves)feralLosses++;else members.push(member)}
 }
 const seen=new Set(previous.map(m=>m.id))
 for(const member of draft.newCurses){if(!member.id||!member.name.trim()||seen.has(member.id)){problems.push('Give each newly cursed member a distinct record and a name.');continue}seen.add(member.id);members.push(member)}
 const size=beforeSize-normalDeaths-feralLosses
 if(members.length>size)problems.push('There are more cursed members than surviving models; identify the actual cursed casualties.')
 return {members,size,feralLosses,notes,problems}
}
