import { existsSync, readFileSync } from 'node:fs'
import { GM, PASSWORD, resetDb } from './fixtures'

// Defaults match `supabase status` for a local stack; .env.local overrides them when present.
const DEFAULT_URL = 'http://127.0.0.1:54321'
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

function readEnvLocal(): Record<string, string> {
  if (!existsSync('.env.local')) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

/**
 * `supabase db reset` restarts the auth service; for a few seconds afterwards sign-in fails with
 * "The server is having trouble". Wait until a real password grant for the seed GM succeeds.
 */
async function waitForAuth(url: string, anonKey: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastError = 'no attempt made'
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: GM.email, password: PASSWORD }),
      })
      if (res.ok) return
      lastError = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Supabase auth did not come back after the reset: ${lastError}`)
}

/** Runs once before the whole e2e run: drop, migrate and re-seed the local database, then wait for auth. */
export default async function globalSetup() {
  const env = readEnvLocal()
  const url = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? DEFAULT_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? DEFAULT_ANON_KEY

  if (process.env.E2E_SKIP_RESET) {
    console.log('[e2e] E2E_SKIP_RESET set; keeping the current database')
  } else {
    console.log('[e2e] resetting the local Supabase database (npm run db:reset)')
    const started = Date.now()
    resetDb()
    console.log(`[e2e] database reset in ${((Date.now() - started) / 1000).toFixed(1)}s`)
  }

  const started = Date.now()
  await waitForAuth(url, anonKey)
  console.log(`[e2e] auth ready at ${url} after ${((Date.now() - started) / 1000).toFixed(1)}s`)
}
