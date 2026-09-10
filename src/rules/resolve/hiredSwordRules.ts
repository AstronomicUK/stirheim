import { SKILLS } from '../data/skills'
import { WARBAND_SKILL_TABLES } from '../data/campaign/warbandSkills'
import { findHiredSword, isDramatisPersona } from '../data/campaign/hiredSwords'
/** Source-specific exceptions to the Henchman XP rule (04-hired-swords.md). */
export function hiredSwordGainsExperience(id: string): boolean {
 return !isDramatisPersona(id) && !['clan_skryre_rat_ogre','bone_goliath','ninja','chaos_fury'].includes(id)
}

export const ONE_BATTLE_HIRES = ['elf_mage','aenur_the_sword_of_twilight','ulli_and_marquand','dijin_katal_the_renegade_assassin','the_headless_horseman','the_foole','ninja']
export function requiresBattleGap(id: string): boolean { return ONE_BATTLE_HIRES.includes(id) && id !== 'ninja' }


/** Named starting skills, not tables which the hire may choose on future advances. */
export function hiredSwordStartingSkills(id: string): string[] {
 if(id==='ulli_and_marquand')return ['step_aside','knife_fighter','lightning_reflexes']
 const entry=findHiredSword(id)
 if(!entry?.detail)return []
 const detail=entry.detail
 let text=detail.skills.split(/(?:may (?:choose|learn)|when (?:he|they) gain)/i)[0].replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').toLowerCase().replace(/[-‑–]/g, ' ')
 const known=[...SKILLS,...WARBAND_SKILL_TABLES.flatMap(t=>t.skills)].sort((a,b)=>b.name.length-a.name.length)
 const result:string[]=[]
 for(const skill of known) {
  const name=skill.name.toLowerCase().replace(/[-‑–]/g, ' ')
  const index=text.indexOf(name)
  if(index>=0 && !/[a-z]/.test(text[index-1]??'') && !/[a-z]/.test(text[index+name.length]??'')) {
   result.push(skill.id);text=text.slice(0,index)+' '.repeat(name.length)+text.slice(index+name.length)
  }
 }
 for(const rule of detail.specialRules){const match=SKILLS.find(s=>s.name.toLowerCase()===rule.name.toLowerCase());if(match)result.push(match.id)}
 return [...new Set(result)]
}

/** Departures explicitly required by the warband source, rather than generic eligibility warnings. */
export function conditionalHireDepartures(before:import('../types/roster').RosterWarband,after:import('../types/roster').RosterWarband):{id:string;name:string;reason:string}[] {
 const hunterReturns=before.warbandTemplateId==='ogre_hunting_party'&&!before.heroes.some(h=>h.status==='active'&&h.unitTemplateId==='ogre_hunting_party_ogre_hunter')&&after.heroes.some(h=>h.status==='active'&&h.unitTemplateId==='ogre_hunting_party_ogre_hunter')
 const dogOfWarDied=before.warbandTemplateId==='maneaters'&&before.heroes.some(h=>h.status==='active'&&h.skillIds.includes('maneaters_skills_dog_of_war')&&after.heroes.some(a=>a.id===h.id&&a.status==='dead'))
 return before.hiredSwords.filter(s=>s.status==='active'&&(dogOfWarDied||(hunterReturns&&['ogre_bodyguard','ogre_slave_master'].includes(s.hiredSwordId)))).map(s=>({id:s.id,name:s.name,reason:dogOfWarDied?'Dog of War: all hired swords leave when the leader dies.':'Distasteful Company: hired Ogres leave when an Ogre Hunter rejoins.'}))
}
