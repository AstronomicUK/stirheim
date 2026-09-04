import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'
import type { Database } from './database.types'

export type Client = SupabaseClient<Database>

const config = readSupabaseConfig(import.meta.env)

/** True when both VITE_SUPABASE_* variables were present at build time. */
export function isSupabaseConfigured(): boolean {
  return config !== null
}

let instance: Client | null = null

/** The one client for the app, created on first use. Throws if the env is not configured. */
export function getSupabase(): Client {
  if (instance) return instance
  if (!config) {
    throw new Error('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  instance = createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  })
  return instance
}

/**
 * Lazily created singleton. Property access (`supabase.auth`, `supabase.from(...)`) resolves to
 * the real client on first touch, so importing this module never creates a client or throws
 * when the env is unset (the "not connected" screen relies on that).
 */
export const supabase: Client = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getSupabase()
    const value = Reflect.get(client, prop, client) as unknown
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})
