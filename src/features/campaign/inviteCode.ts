// Invite codes are eight characters from a lower-case alphabet, stored as "abcd-efgh". Players
// type or paste them in any shape ("ABCD EFGH", "abcdefgh", "abcd-efgh"); the server compares
// the lower-cased, dash-free form, and so do we.

export const INVITE_CODE_LENGTH = 8

/** Lower-case, without spaces or dashes: the form the server compares. */
export function normaliseInviteCode(raw: string): string {
  return raw.toLowerCase().replace(/[\s-]/g, '')
}

/** "abcd-efgh" for display. A partial code is shown as far as it goes ("abc", "abcd-e"). */
export function formatInviteCode(raw: string): string {
  const code = normaliseInviteCode(raw)
  return code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code
}

export function isCompleteInviteCode(raw: string): boolean {
  return normaliseInviteCode(raw).length === INVITE_CODE_LENGTH
}

/** The link a GM shares; opens the join screen with the code filled in. */
export function joinLink(origin: string, code: string): string {
  return `${origin.replace(/\/$/, '')}/campaigns/join/${formatInviteCode(code)}`
}
