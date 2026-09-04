// Pure state for the onboarding pieces: which version of the home screen a user should see, the
// GM's first-steps checklist and where its "dismissed" flag lives, and the payload handed to the
// Web Share API for an invite. No React and no DOM here so it can be unit-tested in node.

/** What the home screen leads with. */
export type HomeStage = 'loading' | 'new_user' | 'no_campaign' | 'settled'

export interface HomeCounts {
  /** Active (not archived) warbands, or null while loading. */
  warbands: number | null
  /** Active (not archived) campaigns, or null while loading or unavailable. */
  campaigns: number | null
}

/**
 * A brand-new user gets the getting-started checklist; someone with warbands but no campaign gets a
 * nudge to join one; everyone else sees the plain list. Campaigns still loading count as "settled" so
 * the list never flashes a nudge that then disappears.
 */
export function homeStage({ warbands, campaigns }: HomeCounts): HomeStage {
  if (warbands === null) return 'loading'
  if (warbands === 0) return 'new_user'
  if (campaigns === 0) return 'no_campaign'
  return 'settled'
}

export type GmChecklistStepId = 'invite' | 'house_rules' | 'members' | 'first_match' | 'import'

export interface GmChecklistStep {
  id: GmChecklistStepId
  label: string
  /** Relative path inside the app, or null when the step is done on this very page. */
  to: string | null
  /** Known to be complete from campaign data; undefined when the app cannot tell. */
  done?: boolean
}

export interface GmChecklistInput {
  campaignId: string
  memberCount: number
  matchCount: number
}

export function gmChecklistSteps({ campaignId, memberCount, matchCount }: GmChecklistInput): GmChecklistStep[] {
  const base = `/campaigns/${campaignId}`
  return [
    { id: 'invite', label: 'Share the invite code or link with your players', to: null },
    { id: 'house_rules', label: 'Check the house rules and starting gold', to: `${base}/settings` },
    { id: 'members', label: 'Players join with their warbands', to: null, done: memberCount > 0 },
    { id: 'first_match', label: 'Schedule the first battle', to: `${base}/matches/new`, done: matchCount > 0 },
    { id: 'import', label: 'Bringing history from Relic & Ruin? Import the battle records', to: `${base}/import` },
  ]
}

export const GM_CHECKLIST_KEY_PREFIX = 'stirheim.gmChecklist.'

export function gmChecklistKey(campaignId: string): string {
  return `${GM_CHECKLIST_KEY_PREFIX}${campaignId}`
}

/** The subset of Storage the checklist needs, so tests can pass a Map-backed stand-in. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function isGmChecklistDismissed(store: KeyValueStore | null | undefined, campaignId: string): boolean {
  try {
    return store?.getItem(gmChecklistKey(campaignId)) === '1'
  } catch {
    return false
  }
}

export function setGmChecklistDismissed(store: KeyValueStore | null | undefined, campaignId: string, dismissed: boolean): void {
  try {
    if (dismissed) store?.setItem(gmChecklistKey(campaignId), '1')
    else store?.removeItem(gmChecklistKey(campaignId))
  } catch {
    // Private mode or a full quota: the checklist simply shows again next time.
  }
}

export interface InviteShareData {
  title: string
  text: string
  url: string
}

/** The payload for navigator.share; the text repeats the code so it survives apps that drop the URL. */
export function inviteShareData(code: string, link: string, campaignName?: string | null): InviteShareData {
  const name = campaignName?.trim()
  return {
    title: name ? `Join ${name} on Stirheim` : 'Join my Stirheim campaign',
    text: `Invite code ${code}. Open the link, sign in and pick the warband you are bringing.`,
    url: link,
  }
}
