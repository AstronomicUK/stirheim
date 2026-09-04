import { describe, expect, it } from 'vitest'
import { missingSupabaseEnv, readSupabaseConfig } from './config'

const good = {
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_ANON_KEY: 'eyJ.anon.key',
}

describe('readSupabaseConfig', () => {
  it('parses a complete environment', () => {
    expect(readSupabaseConfig(good)).toEqual({ url: 'http://127.0.0.1:54321', anonKey: 'eyJ.anon.key' })
  })

  it('trims whitespace and a trailing slash on the URL', () => {
    expect(
      readSupabaseConfig({ VITE_SUPABASE_URL: ' https://abc.supabase.co/ ', VITE_SUPABASE_ANON_KEY: ' key ' }),
    ).toEqual({ url: 'https://abc.supabase.co', anonKey: 'key' })
  })

  it('returns null when the key is missing or blank', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: good.VITE_SUPABASE_URL })).toBeNull()
    expect(readSupabaseConfig({ ...good, VITE_SUPABASE_ANON_KEY: '   ' })).toBeNull()
  })

  it('returns null when the URL is not http(s)', () => {
    expect(readSupabaseConfig({ ...good, VITE_SUPABASE_URL: 'supabase.co' })).toBeNull()
    expect(readSupabaseConfig({ ...good, VITE_SUPABASE_URL: 'ftp://x' })).toBeNull()
    expect(readSupabaseConfig({ ...good, VITE_SUPABASE_URL: 42 })).toBeNull()
  })

  it('ignores an entirely empty environment', () => {
    expect(readSupabaseConfig({})).toBeNull()
  })
})

describe('missingSupabaseEnv', () => {
  it('is empty for a complete environment', () => {
    expect(missingSupabaseEnv(good)).toEqual([])
  })

  it('lists each missing variable in a stable order', () => {
    expect(missingSupabaseEnv({})).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'])
    expect(missingSupabaseEnv({ VITE_SUPABASE_URL: 'nope', VITE_SUPABASE_ANON_KEY: 'k' })).toEqual(['VITE_SUPABASE_URL'])
    expect(missingSupabaseEnv({ VITE_SUPABASE_URL: good.VITE_SUPABASE_URL })).toEqual(['VITE_SUPABASE_ANON_KEY'])
  })
})
