// What the roster view knows about the campaign it sits in: the house rules, so item text can say
// when a rule is switched off (the Rabbit's Foot outside battle). Provided by the warband page;
// every other caller gets the defaults.

import { createContext, useContext } from 'react'
import type { CampaignHouseRules } from '../../../rules/types/roster'

export interface RosterViewContextValue {
  houseRules: CampaignHouseRules | null
}

export const RosterViewContext = createContext<RosterViewContextValue>({ houseRules: null })

export function useRosterView(): RosterViewContextValue {
  return useContext(RosterViewContext)
}
