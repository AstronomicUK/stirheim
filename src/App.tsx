import { WARBAND_TEMPLATES } from './rules/data/warbandTemplates'

export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-10">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-dim">Campaign Ledger</p>
        <h1 className="font-headline text-4xl font-bold text-ink">Stirheim</h1>
      </header>
      <p className="text-ink-dim">
        Phase 0 scaffold. Rules data loaded: {WARBAND_TEMPLATES.length} warband templates.
      </p>
    </main>
  )
}
