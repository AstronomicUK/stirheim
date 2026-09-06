// Line icons drawn on a 24-unit grid, stroked in the current colour. Kept deliberately few: one per
// navigation tab and one per between-battles action, so the set stays recognisable at a glance.

import type { SVGProps } from 'react'

export type IconName =
  | 'warbands'
  | 'campaigns'
  | 'scenarios'
  | 'account'
  | 'advances'
  | 'trade'
  | 'recruit'
  | 'print'
  | 'edit'
  | 'battle'
  | 'records'
  | 'more'
  | 'template'
  | 'import'
  | 'simulator'
  | 'gold'
  | 'wyrdstone'
  | 'rating'
  | 'models'
  | 'heroes'
  | 'henchmen'
  | 'hired'
  | 'buy'
  | 'sell'
  | 'stash'
  | 'characters'
  | 'history'
  | 'join'
  | 'settings'
  | 'map'

const PATHS: Record<IconName, string> = {
  warbands: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  campaigns: 'M5 3v18M5 4h13l-3 4 3 4H5',
  scenarios: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  account: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  advances: 'M12 2l2.5 5.5L20 8l-4 4 1 6-5-2.7L7 18l1-6-4-4 5.5-.5z',
  trade: 'M3 9h18l-1.5 11H4.5zM8 9V6a4 4 0 018 0v3',
  recruit: 'M9 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6',
  print: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h6',
  edit: 'M4 20h4l11-11-4-4L4 16zM13 7l4 4',
  battle: 'M4 4l16 16M20 4L4 20M4 4l5 1M4 4l1 5M20 4l-5 1M20 4l-1 5',
  records: 'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  template: 'M4 4h16v16H4zM4 10h16M10 10v10',
  import: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  simulator: 'M4 17l4-8 4 5 3-3 5 6M4 21h16M4 3v18',
  gold: 'M12 8c3.9 0 7-1.3 7-3s-3.1-3-7-3-7 1.3-7 3 3.1 3 7 3zM5 5v4c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 9v4c0 1.7 3.1 3 7 3s7-1.3 7-3V9M5 13v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4',
  wyrdstone: 'M12 2l5.5 6.5L12 22 6.5 8.5zM6.5 8.5h11M12 2v20M9 8.5l3 13.5M15 8.5l-3 13.5',
  rating: 'M12 14a5 5 0 100-10 5 5 0 000 10zM9.5 13.5L7 21l5-2.5 5 2.5-2.5-7.5',
  models: 'M8 11a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6zM2 20c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5M13 15c1-.4 2-.5 3-.5 3.5 0 6 2 6 5.5h-8',
  heroes: 'M5 13a7 7 0 0114 0v6H5zM5 16h14M12 6v13M8.5 12.5h7',
  henchmen: 'M9 9a3 3 0 100-6 3 3 0 000 6zM3 20c0-4 2.5-6 6-6s6 2 6 6M17 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM16 14.5c3 .3 5 2.3 5 5.5h-3.5',
  hired: 'M4 20l7-7M9 8l7 7M14 4l6 6-3 3-6-6zM3 21l3-1-2-2z',
  buy: 'M3 9h18l-2 11H5zM8 9l4-6 4 6M9 13v4M15 13v4',
  sell: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v10M8.5 10.5L12 7l3.5 3.5',
  stash: 'M3 10h18v10H3zM3 10l2-5h14l2 5M12 10v10M10 14h4',
  characters: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6M15 4.5l3-2.5M9 4.5L6 2',
  history: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  join: 'M10 17l5-5-5-5M15 12H3M13 3h6v18h-6',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4',
  map: 'M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 12a2 2 0 100-4 2 2 0 000 4z',
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  /** Pixel size; defaults to 20. */
  size?: number
}

export function Icon({ name, size = 20, className = '', ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
