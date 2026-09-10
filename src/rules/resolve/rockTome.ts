import { findLore, loreForUnit } from '../data/campaign/magic'
import { PRAYER_LORE_IDS, loreForCaster } from './casting'
import type { WarbandTemplate } from '../types'
import type { RosterHero, RosterItem, RosterWarband } from '../types/roster'
export const ROCK_TOME = 'scenario_rock_tome'
export const READ_ROCK_TOME = 'scenario_rock_tome_read'
export interface RockLesson { loreId?: string; roll?: number | null; spellId?: string; lowerDifficulty?: boolean }
export function rockTomeBlocked(roster: RosterWarband): boolean {
  return ['sisters_of_sigmar','witch_hunters'].includes(roster.warbandTemplateId) || [...roster.heroes,...roster.hiredSwords].some(h=>h.status!=='dead'&&h.status!=='left'&&/priest.*morr|morr.*priest/i.test('unitTemplateId' in h?h.unitTemplateId:h.hiredSwordId))
}
export function rockTomeSources(hero: RosterHero, template?: WarbandTemplate) {
  if (hero.status!=='active') return []
  const own=(hero.flags.magicLoreId?findLore(hero.flags.magicLoreId):null)??(template?loreForUnit(hero.unitTemplateId,template):null)??loreForCaster(hero,template?.name,undefined)
  const wizard=own&&!PRAYER_LORE_IDS.includes(own.id as typeof PRAYER_LORE_IDS[number])
  if (!wizard&&!hero.skillIds.includes('arcane_lore')) return []
  const ids=new Set([...(wizard?[own.id]:[]),'lesser_magic'])
  return [...ids].flatMap(id=>findLore(id)??[])
}
/** Resolve both lessons before changing any saved spells or binding a copy to its reader. */
export function planRockTome(roster: RosterWarband, readerId: string, lessons: RockLesson[], template?: WarbandTemplate) {
  const out={problems:[] as string[],notes:[] as string[],next:null as RosterWarband|null}
  const reader=roster.heroes.find(h=>h.id===readerId)
  if(rockTomeBlocked(roster)){out.problems.push('This warband cannot use the tome from the Rock.');return out}
  if(!reader){out.problems.push('Choose a living reader.');return out}
  const sources=rockTomeSources(reader,template)
  if(!sources.length){out.problems.push('The reader must be a wizard or have Arcane Lore.');return out}
  const owned=[...roster.stash,...roster.heroes.filter(h=>h.status==='active').flatMap(h=>h.equipment),...roster.hiredSwords.filter(h=>h.status==='active').flatMap(h=>h.equipment)].some(i=>i.itemId===ROCK_TOME&&i.quantity>0)
  if(!owned){out.problems.push('There is no unread copy of the tome.');return out}
  if(lessons.length!==2){out.problems.push('Record both spells from the tome before applying it.');return out}
  const nextReader={...reader,spellIds:[...reader.spellIds],flags:{...reader.flags,spellDifficultyReductions:{...reader.flags.spellDifficultyReductions}}}
  for(const [i,lesson] of lessons.entries()) {
    const lore=sources.find(l=>l.id===lesson.loreId)
    if(!lore){out.problems.push(`Spell ${i+1}: choose the reader’s own list or Lesser Magic.`);continue}
    if(lesson.roll==null||!Number.isInteger(lesson.roll)||lesson.roll<1||lesson.roll>6){out.problems.push(`Spell ${i+1}: enter its D6.`);continue}
    const matches=lore.spells.filter(s=>lesson.roll!>=s.roll.min&&lesson.roll!<=s.roll.max)
    const spell=lesson.spellId?matches.find(s=>s.id===lesson.spellId):matches.length===1?matches[0]:undefined
    if(!spell){out.problems.push(`Spell ${i+1}: select the spell matching this table result.`);continue}
    if(nextReader.spellIds.includes(spell.id)) {
      if(!lesson.lowerDifficulty){out.problems.push(`Spell ${i+1}: ${reader.name} already knows ${spell.name}; reroll or choose the normal duplicate-spell difficulty reduction.`);continue}
      if(spell.difficulty===null){out.problems.push(`${spell.name} has no difficulty to reduce; reroll.`);continue}
      nextReader.flags.spellDifficultyReductions[spell.id]=(nextReader.flags.spellDifficultyReductions[spell.id]??0)+1
      out.notes.push(`Tome from the Rock, spell ${i+1}: ${lore.name} D6 ${lesson.roll}, ${spell.name}; duplicate lowers difficulty by 1.`)
    } else {
      nextReader.spellIds.push(spell.id)
      out.notes.push(`Tome from the Rock, spell ${i+1}: ${lore.name} D6 ${lesson.roll}, learned ${spell.name}.`)
    }
  }
  if(out.problems.length)return out
  // Preserve a readable physical book, bound to this reader; it cannot teach another two spells.
  let removed=false
  const take=(items:RosterItem[])=>items.flatMap(i=>{
    if(removed||i.itemId!==ROCK_TOME||i.quantity<1)return [i]
    removed=true;return i.quantity===1?[]:[{...i,quantity:i.quantity-1}]
  })
  const stash=take(roster.stash)
  const heroes=roster.heroes.map(h=>({...h,equipment:h.status==='active'?take(h.equipment):h.equipment}))
  const hiredSwords=roster.hiredSwords.map(h=>({...h,equipment:h.status==='active'?take(h.equipment):h.equipment}))
  const holder=heroes.find(h=>h.id===readerId)!
  nextReader.equipment=[...holder.equipment,{itemId:READ_ROCK_TOME,quantity:1,notes:`Bound to ${reader.name}. ${out.notes.join(' ')}`}]
  nextReader.notes=[reader.notes,...out.notes].filter(Boolean).join('\n')
  out.next={...roster,stash,heroes:heroes.map(h=>h.id===readerId?nextReader:h),hiredSwords}
  return out
}
