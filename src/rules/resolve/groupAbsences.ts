import type {RosterHenchmanGroup,HenchmanCampaignState} from '../types/roster'
/** Identical group members remain on the roster, but unavailable models cannot fight. */
export function absentGroupModels(group:Pick<RosterHenchmanGroup,'size'|'campaignState'>):number {
 return Math.min(group.size,(group.campaignState?.raidAbsences??[]).filter(a=>a.games>0).reduce((n,a)=>n+a.count,0))
}
export function afterAbsenceBattle(state:HenchmanCampaignState):HenchmanCampaignState {
 const next={...state},remaining=(state.raidAbsences??[]).filter(a=>a.games>1).map(a=>({...a,games:a.games-1}))
 if(remaining.length)next.raidAbsences=remaining;else delete next.raidAbsences
 return next
}
