import type { RosterHero, RosterWarband } from '../types/roster'
import { findWarbandTemplate } from '../data/warbandTemplates'
import { leaderTemplate } from './roster'
import { recruitHenchmen } from './recruitment'
import { RulesError } from './errors'
export type CaptiveChoice = { kind: 'ransom'; gold: number } | { kind: 'exchange'; otherHeroId: string } | { kind: 'sell'; d6: number } | { kind: 'zombie'; groupId: string } | { kind: 'sacrifice'; leaderId: string } | { kind: 'wretch'; groupId: string } | { kind: 'throne'; d6: number; groupId: string; leaderId: string } | { kind: 'slaveWork'; d6: number; xp: number }
function captive(roster: RosterWarband, id: string): RosterHero {
 const raw=roster.heroes.find(h=>h.id===id) ?? roster.hiredSwords.find(h=>h.id===id)
 const hero: RosterHero | undefined = raw ? ('unitTemplateId' in raw ? raw : { ...raw, unitTemplateId: `hired_sword:${raw.hiredSwordId}`, skillTableIds: [], status: raw.status === 'left' ? 'retired' : raw.status }) : undefined
 if (!hero || hero.status!=='captured') throw new RulesError('capture.notCaptured','This warrior is no longer held captive.')
 return hero
}
function returned(hero: RosterHero, effect: string): RosterHero {
 const {captured: _captured,...flags}=hero.flags
 const last=hero.injuries.findLastIndex(i=>i.injuryCode==='captured')
 return {...hero,status:'active',flags,injuries:hero.injuries.map((i,n)=>n===last?{...i,effect}:i)}
}
function replaceCaptive(roster: RosterWarband, hero: RosterHero): RosterWarband {
 return {...roster,heroes:roster.heroes.map(h=>h.id===hero.id?hero:h),hiredSwords:roster.hiredSwords.map(h=>h.id===hero.id?{...h,xp:hero.xp,status:hero.status,flags:hero.flags,injuries:hero.injuries,equipment:hero.equipment}:h)}
}
export function resolveCaptive(owner: RosterWarband, captor: RosterWarband, heroId: string, choice: CaptiveChoice) {
 if(owner.id===captor.id) throw new RulesError('capture.sameWarband','Choose the enemy warband holding this warrior.')
 const hero=captive(owner,heroId)
 const faction=captor.warbandTemplateId
 if(faction==='the_sons_of_hashut' && !['sacrifice','slaveWork'].includes(choice.kind)) throw new RulesError('capture.slavers','Slaves cannot be freed or sold: sacrifice them or put them to work.')
 if(faction==='the_cursed_cavalcade' && choice.kind!=='throne') throw new RulesError('capture.throne','The Throne of Worms replaces the normal Captured outcomes.')
 if(faction==='pit_fighters' && choice.kind==='sell') throw new RulesError('capture.noSale','Pit Fighters cannot sell captives.')
 let nextOwner=owner, nextCaptor=captor, nextHero=hero, message=''
 if(choice.kind==='ransom') {
  if(!Number.isInteger(choice.gold)||choice.gold<0||choice.gold>owner.gold) throw new RulesError('capture.ransom','Enter an affordable, non-negative ransom.')
  message=`${hero.name} ransomed for ${choice.gold} gc; returned with all equipment.`
  nextOwner={...owner,gold:owner.gold-choice.gold};nextCaptor={...captor,gold:captor.gold+choice.gold};nextHero=returned(hero,message)
 } else if(choice.kind==='exchange') {
  const other=captive(captor,choice.otherHeroId)
  message=`${hero.name} exchanged for ${other.name}; both returned with all equipment.`
  nextHero=returned(hero,message);nextCaptor=replaceCaptive(captor,returned(other,message))
 } else if(choice.kind==='slaveWork') {
  if(faction!=='the_sons_of_hashut'||!Number.isInteger(choice.d6)||choice.d6<1||choice.d6>6) throw new RulesError('capture.slavers','Enter the Sons of Hashut slave-work D6 result.')
  if(choice.d6===1 && (!Number.isInteger(choice.xp)||choice.xp<1||choice.xp>3)) throw new RulesError('capture.escapeXp','Roll D3 for the escaping hero’s experience.')
  message=choice.d6===1?`${hero.name} escaped slave work with equipment and +${choice.xp} XP; ${captor.name} gains 1 wyrdstone.`:`${hero.name} died during slave work; ${captor.name} gains 1 wyrdstone and retains the equipment.`
  nextCaptor={...captor,wyrdstone:captor.wyrdstone+1,stash:choice.d6===1?captor.stash:[...captor.stash,...hero.equipment]}
  nextHero=choice.d6===1?{...returned(hero,message),xp:hero.xp+choice.xp}:{...returned(hero,message),status:'dead',equipment:[]}
 } else {
  if(choice.kind==='wretch'||choice.kind==='throne') {
   const template=findWarbandTemplate(faction)
   if(!template || (choice.kind==='wretch' && faction!=='court_of_the_profane_pleasures') || (choice.kind==='throne' && faction!=='the_cursed_cavalcade')) throw new RulesError('capture.conversion','This warband does not have that capture rule.')
   if(choice.kind==='throne' && (!Number.isInteger(choice.d6)||choice.d6<1||choice.d6>6)) throw new RulesError('capture.die','Enter a D6 result.')
   if(choice.kind==='wretch'||(choice.d6>=3&&choice.d6<=5)) {nextCaptor=recruitHenchmen(captor,template,choice.kind==='wretch'?'court_of_pleasures_wretches':'cursed_cavalcade_captured_thrall',hero.name,1,choice.groupId,{costOverride:0}).value.warband;message=`${hero.name} became ${choice.kind==='wretch'?'a Wretch':'a Captured Thrall'}; removed from the original warband.`}
   else if(choice.d6===6) { const chosen=captor.heroes.find(h=>h.id===choice.leaderId&&h.status==='active');if(!chosen)throw new RulesError('capture.randomHero','Randomly select a surviving hero for the +1 XP.');nextCaptor={...captor,heroes:captor.heroes.map(h=>h.id===chosen.id?{...h,xp:h.xp+1}:h)};message=`${hero.name} sacrificed to the Throne; randomly selected ${chosen.name} gains +1 XP.` }
   else message=`${hero.name} swallowed by the Throne of Worms.`
  } else if(choice.kind==='sell') {
   if(!Number.isInteger(choice.d6)||choice.d6<1||choice.d6>6) throw new RulesError('capture.die','Enter a D6 result from 1 to 6.')
   nextCaptor={...captor,gold:captor.gold+choice.d6*5};message=`${hero.name} sold to slavers for ${choice.d6*5} gc (D6 ${choice.d6}); equipment retained by ${captor.name}.`
  } else if(choice.kind==='zombie') {
   const template=findWarbandTemplate(captor.warbandTemplateId)
   if(template?.id!=='the_undead') throw new RulesError('capture.zombie','This core outcome is for an Undead warband.')
   nextCaptor=recruitHenchmen(captor,template,'undead_zombies',`${hero.name} (Zombie)`,1,choice.groupId,{costOverride:0}).value.warband
   message=`${hero.name} killed and raised as a Zombie; equipment retained by ${captor.name}.`
  } else {
   if(!['cult_of_the_possessed','amazons_lustria','amazons_mordheim','the_sons_of_hashut'].includes(faction)) throw new RulesError('capture.sacrifice','This core outcome is for the Cult of the Possessed.')
   const leader=captor.heroes.find(h=>h.id===choice.leaderId&&h.status==='active')
   const template=findWarbandTemplate(faction)
   if(!leader || !template || leader.unitTemplateId!==leaderTemplate(template)?.id) throw new RulesError('capture.leader','Choose the surviving warband leader.')
   nextCaptor={...captor,heroes:captor.heroes.map(h=>h.id===leader.id?{...h,xp:h.xp+1}:h)}
   message=`${hero.name} sacrificed; ${leader.name} gains +1 Experience; equipment retained by ${captor.name}.`
   if(faction==='amazons_lustria' && /lizard/i.test(findWarbandTemplate(owner.warbandTemplateId)?.race ?? '')) {
    nextCaptor={...nextCaptor,stash:[...nextCaptor.stash,{itemId:'enchanted_skins',quantity:1}]};
    message+=' The Lizardman sacrifice also provides free Skins and Charms (Enchanted Skins).';
   }
  }
  nextCaptor={...nextCaptor,stash:[...nextCaptor.stash,...hero.equipment]}
  nextHero={...returned(hero,message),equipment:[],status:choice.kind==='sell'?'retired':'dead'}
 }
 nextOwner=replaceCaptive(nextOwner,nextHero)
 return {owner:nextOwner,captor:nextCaptor,message}
}

export function captiveOutcomes(faction: string): {kind: CaptiveChoice['kind']; label: string}[] {
 const common: {kind: CaptiveChoice['kind']; label: string}[] = [
  {kind:'ransom',label:'Ransom — return with equipment'},
  {kind:'exchange',label:'Exchange captives — both keep equipment'},
  {kind:'sell',label:'Sell to slavers — D6 × 5 gc'},
 ];
 if(faction==='the_sons_of_hashut') return [{kind:'sacrifice',label:'Sacrifice — apprentice sorcerer gains +1 XP'},{kind:'slaveWork',label:'Put the slave to work'}];
 if(faction==='the_cursed_cavalcade') return [{kind:'throne',label:'Throne of Worms'}];
 if(faction==='pit_fighters') return common.filter(o=>o.kind!=='sell');
 if(faction==='the_undead') common.push({kind:'zombie',label:'Kill and raise a Zombie'});
 if(['cult_of_the_possessed','amazons_lustria','amazons_mordheim'].includes(faction)) common.push({kind:'sacrifice',label:'Sacrifice — leader gains +1 XP'});
 if(faction==='court_of_the_profane_pleasures') common.push({kind:'wretch',label:'Cruel Fate — turn into a Wretch'});
 return common;
}
