// The campaign house rules the builder prices under (half-price armour and its switches), provided
// once by the page so every card and row reads the same rules without prop threading.

import { createContext, useContext } from 'react'
import { defaultCampaignHouseRules, type CampaignHouseRules } from '../../../rules/types/roster'

export const BuilderRulesContext = createContext<CampaignHouseRules>(defaultCampaignHouseRules())

export function useBuilderRules(): CampaignHouseRules {
  return useContext(BuilderRulesContext)
}
