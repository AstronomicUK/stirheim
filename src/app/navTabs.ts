import type { IconName } from '../ui/icons'

export interface NavTab {
  to: string
  label: string
  icon: IconName
  end: boolean
}

/** The four destinations, shared by the phone tab bar and the desktop rail. */
export const NAV_TABS: NavTab[] = [
  { to: '/', label: 'Warbands', icon: 'warbands', end: true },
  { to: '/campaigns', label: 'Campaigns', icon: 'campaigns', end: false },
  { to: '/scenarios', label: 'Scenarios', icon: 'scenarios', end: false },
  { to: '/account', label: 'Account', icon: 'account', end: false },
]
