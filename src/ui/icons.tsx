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
