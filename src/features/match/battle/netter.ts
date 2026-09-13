import { withRollAttempt, type BattleLiveState } from '../../../domain/battle'
import type { RosterHero } from '../../../rules/types/roster'
export const NETTER = 'ogre_hunting_party_skills_netter'
export function spendNetterNet(state: BattleLiveState, hero: RosterHero, undoReason?: string): BattleLiveState {
  const used = state.netterNetsUsed?.[hero.id] ?? 0
  if (!hero.skillIds.includes(NETTER) || (undoReason ? !undoReason.trim() || used === 0 : used >= 3)) return state
  const next = undoReason ? used - 1 : used + 1
  return withRollAttempt({...state, netterNetsUsed:{...state.netterNetsUsed,[hero.id]:next}}, {id:crypto.randomUUID(),at:new Date().toISOString(),turn:state.turn,kind:'attack',status:'complete',label:`${hero.name}: ${undoReason ? 'corrected Netter use' : 'used a Netter net'}`,rolls:[`${3-next} of 3 free nets remain this battle.${undoReason ? ` Correction: ${undoReason.trim()}` : ' Resolve the net attack at the table.'}`]})
}
