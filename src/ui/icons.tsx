// Line icons drawn on a 24-unit grid, stroked in the current colour. Kept deliberately few: one per
// navigation tab and one per between-battles action, so the set stays recognisable at a glance.
//
// The three head-counts are one system, and have to be told apart at 14px: `heroes` is a single
// figure filled solid, `henchmen` is two figures outlined, `models` is three. Count, not costume.

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
  | 'cast'
  | 'log'
  | 'notes'
  | 'enemy'
  | 'dice'
  | 'book'
  | 'shooting'
  | 'academic'
  | 'strength'
  | 'speed'
  | 'back'
  | 'shield'

/**
 * An icon is one stroked path, or — where the drawing needs both — a stroked part and a filled one.
 * The three head-counts are one figure used three ways: `heroes` fills it, `henchmen` outlines the
 * same shape, and `models` sets a filled one between two outlined, so it reads as a hero and two
 * henchmen rather than as another anonymous crowd.
 */
type IconArt = string | { stroke?: string; fill?: string }

const PATHS: Record<IconName, IconArt> = {
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
  models: { fill: 'M12 10.8a2.8 2.8 0 100-5.6 2.8 2.8 0 000 5.6zM12 12.1c-3.3 0-5.5 2-5.5 5 0 .5.4.9.9.9h9.2c.5 0 .9-.4.9-.9 0-3-2.2-5-5.5-5z', stroke: 'M4.7 12.3a2 2 0 100-4 2 2 0 000 4zM4.7 13.6c-2 0-3.3 1.3-3.3 3.3 0 .3.2.5.5.5h2.2M19.3 12.3a2 2 0 100-4 2 2 0 000 4zM19.3 13.6c2 0 3.3 1.3 3.3 3.3 0 .3-.2.5-.5.5h-2.2' },
  heroes: { fill: 'M12 11.7a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM12 13.2c-4.2 0-7 2.5-7 6.3 0 .6.4 1 1 1h12c.6 0 1-.4 1-1 0-3.8-2.8-6.3-7-6.3z' },
  henchmen: 'M12 11.7a3.6 3.6 0 100-7.2 3.6 3.6 0 000 7.2zM12 13.2c-4.2 0-7 2.5-7 6.3 0 .6.4 1 1 1h12c.6 0 1-.4 1-1 0-3.8-2.8-6.3-7-6.3z',
  hired: 'M4 20l7-7M9 8l7 7M14 4l6 6-3 3-6-6zM3 21l3-1-2-2z',
  buy: 'M3 9h18l-2 11H5zM8 9l4-6 4 6M9 13v4M15 13v4',
  sell: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v10M8.5 10.5L12 7l3.5 3.5',
  stash: 'M3 10h18v10H3zM3 10l2-5h14l2 5M12 10v10M10 14h4',
  characters: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6M15 4.5l3-2.5M9 4.5L6 2',
  history: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  join: 'M10 17l5-5-5-5M15 12H3M13 3h6v18h-6',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4',
  map: 'M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 12a2 2 0 100-4 2 2 0 000 4z',
  cast: 'M4 20l9-9M17 2l1.3 4.7L23 8l-4.7 1.3L17 14l-1.3-4.7L11 8l4.7-1.3z',
  log: 'M4 5h16M4 10h16M4 15h11M4 20h7',
  notes: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h4',
  enemy: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 10l6 6M15 10l-6 6',
  dice: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  book: 'M4 4h6a3 3 0 013 3v13a2.5 2.5 0 00-2.5-2.5H4zM20 4h-6a3 3 0 00-3 3v13a2.5 2.5 0 012.5-2.5H20z',
  shooting: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2zM12 1v3M12 20v3M1 12h3M20 12h3',
  academic: 'M12 4l9 4-9 4-9-4zM6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5M21 8v6',
  strength: 'M6.5 9v6M17.5 9v6M4 10.5v3M20 10.5v3M6.5 12h11',
  speed: 'M13 2L5 14h6l-1 8 8-12h-6z',
  back: 'M15 19l-7-7 7-7',
  shield: 'M12 21c-4-1.2-7-4-7-8.5V6l7-2.5L19 6v6.5c0 4.5-3 7.3-7 8.5z',
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  /** Pixel size; defaults to 20. */
  size?: number
}

export function Icon({ name, size = 20, className = '', ...rest }: IconProps) {
  const art = PATHS[name]
  const stroke = typeof art === 'string' ? art : art.stroke
  const fill = typeof art === 'string' ? undefined : art.fill
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
      {stroke ? <path d={stroke} /> : null}
      {fill ? <path d={fill} fill="currentColor" stroke="none" /> : null}
    </svg>
  )
}
