import { SUPABASE_ANON_KEY_VAR, SUPABASE_URL_VAR, missingSupabaseEnv } from '../api/config'

/** Shown instead of the app when the build has no Supabase env. The live site shows this until the hosted project exists. */
export function NotConfigured() {
  const missing = missingSupabaseEnv(import.meta.env)
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-12">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-dim">Campaign Ledger</p>
        <h1 className="font-headline text-4xl font-bold text-ink">Stirheim</h1>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="font-headline text-2xl font-semibold text-ink">Not connected to a database yet</h2>
        <p className="leading-relaxed text-ink-dim">
          The ledger needs a Supabase project to keep warbands and campaigns in. This build was made without one, so
          there is nothing to sign in to.
        </p>
        <p className="leading-relaxed text-ink-dim">Two environment variables switch it on at build time:</p>
        <ul className="flex flex-col gap-2">
          {[SUPABASE_URL_VAR, SUPABASE_ANON_KEY_VAR].map((name) => (
            <li key={name} className="flex items-baseline justify-between gap-3 rounded-md border border-border bg-surface-low px-4 py-3">
              <code className="text-sm text-ink">{name}</code>
              <span className={`text-xs uppercase tracking-wider ${missing.includes(name) ? 'text-warn' : 'text-ok'}`}>
                {missing.includes(name) ? 'missing' : 'set'}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-ink-dim">
          Locally: copy <code className="text-ink">.env.example</code> to <code className="text-ink">.env.local</code> and
          paste the values from <code className="text-ink">supabase status</code>. On Netlify: Site configuration, Environment
          variables, then redeploy.
        </p>
      </section>
    </main>
  )
}
