import { Link } from 'react-router'

export interface WordmarkProps {
  /** Large form for the sign-in screens; compact for the app header. */
  size?: 'lg' | 'sm'
  to?: string
}

export function Wordmark({ size = 'sm', to = '/' }: WordmarkProps) {
  const large = size === 'lg'
  return (
    <Link to={to} className="inline-flex flex-col no-underline">
      <span className={`uppercase tracking-[0.3em] text-ink-dim ${large ? 'text-xs' : 'text-[0.6rem]'}`}>Campaign Ledger</span>
      <span className={`font-headline font-bold leading-none text-ink ${large ? 'text-4xl' : 'text-xl'}`}>Stirheim</span>
    </Link>
  )
}
