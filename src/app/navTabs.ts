import type { IconName } from '../ui/icons'

export interface NavTab {
  to: string
  label: string
  icon: IconName
  end: boolean
}

/** The five destinations, shared by the phone tab bar and the desktop rail. */
export const NAV_TABS: NavTab[] = [
  { to: '/', label: 'Warbands', icon: 'warbands', end: true },
  { to: '/campaigns', label: 'Campaigns', icon: 'campaigns', end: false },
  { to: '/battles', label: 'Battles', icon: 'battle', end: false },
  { to: '/simulator', label: 'Simulator', icon: 'simulator', end: false },
  { to: '/account', label: 'Account', icon: 'account', end: false },
]
