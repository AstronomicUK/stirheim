// Pure parsing of the two Vite environment variables the Supabase client needs. Kept free of
// `import.meta` so it can be unit-tested and so the "not connected" screen can explain what is
// missing without touching the client.

export const SUPABASE_URL_VAR = 'VITE_SUPABASE_URL'
export const SUPABASE_ANON_KEY_VAR = 'VITE_SUPABASE_ANON_KEY'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

type Env = Record<string, unknown>

function readString(env: Env, key: string): string {
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** Names of the variables that are missing or unusable, in a stable order. Empty when all good. */
export function missingSupabaseEnv(env: Env): string[] {
  const missing: string[] = []
  if (!isHttpUrl(readString(env, SUPABASE_URL_VAR))) missing.push(SUPABASE_URL_VAR)
  if (readString(env, SUPABASE_ANON_KEY_VAR) === '') missing.push(SUPABASE_ANON_KEY_VAR)
  return missing
}

/** The parsed config, or null when either variable is absent or malformed. */
export function readSupabaseConfig(env: Env): SupabaseConfig | null {
  if (missingSupabaseEnv(env).length > 0) return null
  return {
    url: readString(env, SUPABASE_URL_VAR).replace(/\/+$/, ''),
    anonKey: readString(env, SUPABASE_ANON_KEY_VAR),
  }
}
