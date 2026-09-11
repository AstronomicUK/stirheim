import type { DreamerCertification, Resolution, RosterWarband } from '../types/roster'
import { RulesError } from './errors'
export const DREAMWALKERS = 'dreamwalkers_cult_of_morr'
export function latestDreamerCertification(warband: RosterWarband): DreamerCertification | undefined {
  return warband.heroes.map(h=>h.flags.dreamerCertification).filter((c):c is DreamerCertification=>Boolean(c)).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt))[0]
}
export function dreamerRecruitmentBlock(warband: RosterWarband): string | undefined {
  if(warband.warbandTemplateId!==DREAMWALKERS)return
  if(warband.heroes.some(h=>h.unitTemplateId==='dreamwalkers_dreamer'&&h.status==='dead'))return 'A genuine Dreamer has died. This warband may never hire another Dreamer; the Priest of Morr leads instead.'
  if(!warband.heroes.some(h=>h.unitTemplateId==='dreamwalkers_priest_of_morr'&&h.status==='active'))return 'An active Priest of Morr must certify the Dreamer first.'
  if((latestDreamerCertification(warband)?.die ?? 0)<4)return 'The Priest of Morr must certify a genuine Dreamer with a D6 roll of 4+ before recruitment.'
}
export function certificationAttemptBlock(warband: RosterWarband, latestMatchId: string | null): string | undefined {
  if(warband.warbandTemplateId!==DREAMWALKERS)return 'This ritual is for Dreamwalkers.'
  if(warband.heroes.some(h=>h.unitTemplateId==='dreamwalkers_dreamer'&&['active','captured','dead'].includes(h.status)))return 'This warband already found its genuine Dreamer.'
  if(!warband.heroes.some(h=>h.unitTemplateId==='dreamwalkers_priest_of_morr'&&h.status==='active'))return 'An active Priest of Morr must perform the ritual.'
  const previous=latestDreamerCertification(warband)
  if(previous?.die && previous.die>=4)return 'A genuine Dreamer is already certified and may be recruited at the normal cost.'
  if(previous && previous.afterMatch===latestMatchId)return 'Play and file the report for the next battle before attempting another certification.'
}
export function certifyDreamer(warband: RosterWarband, certification: DreamerCertification): Resolution<RosterWarband> {
  const block=certificationAttemptBlock(warband,certification.afterMatch)
  if(block)throw new RulesError('dreamer.certification',block)
  if(!Number.isInteger(certification.die)||certification.die<1||certification.die>6)throw new RulesError('dreamer.die','Roll a D6 for certification.')
  const priest=warband.heroes.find(h=>h.unitTemplateId==='dreamwalkers_priest_of_morr'&&h.status==='active')!
  return {value:{...warband,heroes:warband.heroes.map(h=>h.id===priest.id?{...h,flags:{...h.flags,dreamerCertification:certification}}:h)},events:[{kind:'leader.succession',subjectId:priest.id,message:`${priest.name} ${certification.die>=4?'certified a genuine Dreamer; recruit at the normal cost':'rejected the Dreamer; retry after the next battle'} (D6: ${certification.die}). ${certification.history.join('; ')}`} ]}
}
