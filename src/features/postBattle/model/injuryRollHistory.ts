import type {HeroInjuryFlow} from './state'

/** Describes only known provenance; historical rolls never acquire an invented source. */
export function describeInjuryAttempt(flow: Pick<HeroInjuryFlow, 'rolls' | 'countRoll'>): string {
  return flow.rolls.map((roll,i) => [
    `D66 ${roll.d66}${roll.source==='app'?' (app roll)':roll.source==='tabletop'?' (entered from tabletop dice)':''}`,
    ...(roll.medicine ? [`Medicine Chest reroll: ${roll.medicine.d66}${roll.medicine.originalSubRoll!==null?`; original follow-up ${roll.medicine.originalSubRoll}`:''}${roll.medicine.originalDistrictRoll!==null?`; original district die ${roll.medicine.originalDistrictRoll}`:''}`] : []),
    ...(roll.subRoll!==null ? [`follow-up ${roll.subRoll}`] : []),
    ...(roll.districtRoll!=null ? [`district die ${roll.districtRoll}`] : []),
    ...(i===0 && flow.countRoll!==null ? [`Multiple Injuries count die ${flow.countRoll}`] : []),
  ].join('; ')).join(' → ')
}

export function injuryRollHistory(flow: HeroInjuryFlow): string[] {
  const history=(flow.previousAttempts??[]).flatMap((attempt,i)=>[
    `Attempt ${i+1}: ${describeInjuryAttempt(attempt)}.`,
    `Replaced this attempt. Reason: ${attempt.reason}`,
  ])
  if(flow.rolls.length && (history.length || flow.rolls.some(r=>r.source)))history.push(`Used: ${describeInjuryAttempt(flow)}.`)
  return history
}
