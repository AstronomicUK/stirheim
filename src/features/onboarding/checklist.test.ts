import { describe, expect, it } from 'vitest'
import {
  gmChecklistKey,
  gmChecklistSteps,
  homeStage,
  inviteShareData,
  isGmChecklistDismissed,
  setGmChecklistDismissed,
  type KeyValueStore,
} from './checklist'
import { pageTitle } from './usePageTitle'

function memoryStore(): KeyValueStore & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

describe('homeStage', () => {
  it('waits for the warbands before deciding', () => {
    expect(homeStage({ warbands: null, campaigns: null })).toBe('loading')
    expect(homeStage({ warbands: null, campaigns: 2 })).toBe('loading')
  })

  it('shows the getting-started checklist to someone with no warbands', () => {
    expect(homeStage({ warbands: 0, campaigns: 0 })).toBe('new_user')
    expect(homeStage({ warbands: 0, campaigns: 1 })).toBe('new_user')
  })

  it('nudges a player with warbands but no campaign', () => {
    expect(homeStage({ warbands: 2, campaigns: 0 })).toBe('no_campaign')
  })

  it('settles once a campaign exists, and while campaigns are still loading', () => {
    expect(homeStage({ warbands: 1, campaigns: 1 })).toBe('settled')
    expect(homeStage({ warbands: 1, campaigns: null })).toBe('settled')
  })
})

describe('gmChecklistSteps', () => {
  it('links every step into the right campaign', () => {
    const steps = gmChecklistSteps({ campaignId: 'c1', memberCount: 0, matchCount: 0 })
    expect(steps.map((s) => s.id)).toEqual(['invite', 'house_rules', 'members', 'first_match', 'import'])
    expect(steps.find((s) => s.id === 'house_rules')?.to).toBe('/campaigns/c1/settings')
    expect(steps.find((s) => s.id === 'first_match')?.to).toBe('/campaigns/c1/matches/new')
    expect(steps.find((s) => s.id === 'import')?.to).toBe('/campaigns/c1/import')
  })

  it('ticks off members and the first match from campaign data', () => {
    const fresh = gmChecklistSteps({ campaignId: 'c1', memberCount: 0, matchCount: 0 })
    expect(fresh.find((s) => s.id === 'members')?.done).toBe(false)
    expect(fresh.find((s) => s.id === 'first_match')?.done).toBe(false)
    const busy = gmChecklistSteps({ campaignId: 'c1', memberCount: 3, matchCount: 1 })
    expect(busy.find((s) => s.id === 'members')?.done).toBe(true)
    expect(busy.find((s) => s.id === 'first_match')?.done).toBe(true)
    expect(busy.find((s) => s.id === 'invite')?.done).toBeUndefined()
  })
})

describe('GM checklist dismissal', () => {
  it('is stored per campaign under the documented key', () => {
    const store = memoryStore()
    expect(isGmChecklistDismissed(store, 'abc')).toBe(false)
    setGmChecklistDismissed(store, 'abc', true)
    expect(store.map.get('stirheim.gmChecklist.abc')).toBe('1')
    expect(gmChecklistKey('abc')).toBe('stirheim.gmChecklist.abc')
    expect(isGmChecklistDismissed(store, 'abc')).toBe(true)
    expect(isGmChecklistDismissed(store, 'other')).toBe(false)
    setGmChecklistDismissed(store, 'abc', false)
    expect(isGmChecklistDismissed(store, 'abc')).toBe(false)
  })

  it('tolerates a missing or throwing store', () => {
    expect(isGmChecklistDismissed(null, 'abc')).toBe(false)
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(() => setGmChecklistDismissed(broken, 'abc', true)).not.toThrow()
    expect(isGmChecklistDismissed(broken, 'abc')).toBe(false)
  })
})

describe('inviteShareData', () => {
  it('names the campaign when it is known and repeats the code in the text', () => {
    const data = inviteShareData('abcd-efgh', 'https://stirheim.app/campaigns/join/abcd-efgh', 'Ashes of Mordheim')
    expect(data.title).toBe('Join Ashes of Mordheim on Stirheim')
    expect(data.text).toContain('abcd-efgh')
    expect(data.url).toBe('https://stirheim.app/campaigns/join/abcd-efgh')
  })

  it('falls back to a generic title', () => {
    expect(inviteShareData('abcd-efgh', 'https://x/campaigns/join/abcd-efgh').title).toBe('Join my Stirheim campaign')
    expect(inviteShareData('abcd-efgh', 'https://x/campaigns/join/abcd-efgh', '   ').title).toBe('Join my Stirheim campaign')
  })
})

describe('pageTitle', () => {
  it('suffixes the app name and copes with blanks', () => {
    expect(pageTitle('Your warbands')).toBe('Your warbands · Stirheim')
    expect(pageTitle('  ')).toBe('Stirheim')
    expect(pageTitle(null)).toBe('Stirheim')
  })
})
