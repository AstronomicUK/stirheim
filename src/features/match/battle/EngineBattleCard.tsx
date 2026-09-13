import { Button } from '../../../ui'

export interface BattlePrisonerView {
  id: string
  name: string
  origin: string
  state: 'held' | 'freed' | 'escaped'
  large: boolean
}

/** Saved battle facts only: a key holder or an escape is never inferred from proximity. */
export function EngineBattleCard({ name, warbandName, prisoners, keyHolders, destroyed, onManage }: {
  name: string
  warbandName: string
  prisoners: BattlePrisonerView[]
  keyHolders: string[]
  destroyed: boolean
  onManage?: () => void
}) {
  const held = prisoners.filter(p => p.state === 'held').length
  const freed = prisoners.filter(p => p.state === 'freed').length
  const escaped = prisoners.filter(p => p.state === 'escaped').length
  return <article aria-label={`${name}, prisoners in this battle`} className="overflow-hidden rounded-lg border border-border bg-surface-low shadow-[0_5px_16px_#49351608]">
    <header className="flex items-start gap-3 border-b border-border px-4 py-4">
      <svg aria-hidden viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-10 w-10 shrink-0 rounded-md border border-brass/25 bg-brass/5 p-2 text-brass"><path d="M7 24V9a9 9 0 0 1 18 0v15M5 24h22M10 24V9m6 15V6m6 18V9M7 12h18M7 19h18"/><circle cx="10" cy="27" r="2"/><circle cx="23" cy="27" r="2"/></svg>
      <div className="min-w-0 flex-1"><h3 className="break-words font-headline text-lg leading-tight">{name}</h3><p className="mt-1 text-xs text-ink-dim">{warbandName}</p></div>
      {destroyed ? <span className="rounded border border-accent-strong/30 px-2 py-1 text-[10px] uppercase tracking-wide text-accent-strong">Destroyed</span> : null}
    </header>
    <dl className="grid grid-cols-3 divide-x divide-border border-b border-border bg-surface/60 py-3 text-center">
      {[['Held',held],['Freed',freed],['Escaped',escaped]].map(([label,count]) => <div key={label}><dd className="font-headline text-xl tabular-nums">{count}</dd><dt className="mt-1 text-[10px] uppercase tracking-wider text-ink-dim">{label}</dt></div>)}
    </dl>
    <div className="px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-brass">Prison keys</p>
      <p className="mt-1 text-sm">{keyHolders.length ? keyHolders.join(', ') : 'No key holder recorded'}</p>
    </div>
    {prisoners.length ? <ul className="mx-4 divide-y divide-border border-y border-border">{prisoners.map(p => <li key={p.id} className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0"><p className="break-words text-sm font-semibold">{p.name}</p><p className="mt-1 text-xs text-ink-dim">{p.origin}{p.large ? ' · Large' : ''}</p></div>
      <span className={`shrink-0 rounded border px-2 py-1 text-[10px] ${p.state === 'held' ? 'border-border text-ink-dim' : 'border-brass/40 bg-brass/10 text-brass'}`}>{p.state === 'held' ? 'In prison' : p.state === 'freed' ? 'Heading for edge' : 'Escaped'}</span>
    </li>)}</ul> : <p className="px-4 pb-3 text-sm text-ink-dim">No captives in this engine.</p>}
    <footer className="flex flex-col gap-3 px-4 py-4">
      <p className="text-xs leading-relaxed text-ink-dim">{freed ? 'Freed captives must move towards the closest table edge. Record their escape when it happens.' : 'A model carrying the keys can free captives in base contact. Destroying the engine also frees them.'}</p>
      {onManage ? <Button variant="secondary" block onClick={onManage}>Prisoners and rescue</Button> : null}
    </footer>
  </article>
}
