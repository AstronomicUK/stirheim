// Experience lines for the report (core rulebook, "Experience" and the scenario "experience"
// blocks that every core scenario repeats):
//   "+1 Survives. If a Hero or a Henchman group survives the battle they gain +1 Experience."
//   "+1 Winning Leader. The leader of the winning warband gains +1 Experience."
//   "+1 Per Enemy Out of Action. A Hero earns +1 Experience for each enemy he puts out of action."
//   "warriors always earn +1 Experience point for surviving a battle. They earn this even if they
//    are injured – so long as they live to fight again!"
//   Underdogs: "When a warband fights against an enemy warband with a higher rating, its warriors
//    earn extra Experience points as shown on the table."
//
// Judgements:
// - "Survives" is awarded after the injury step: a hero whose injury roll came up Dead, or who
//   had to retire, does not "live to fight again" and gets nothing. Captured heroes may be ransomed
//   back, so they keep their experience.
// - Hired swords earn as heroes (docs/PLANNING.md, Phase 7): survive, enemies out of action and
//   the underdog bonus; their advances use the Heroes table, so hero thresholds apply.
// - The underdog bonus goes to every surviving warrior and group ("its warriors"), once, using the
//   highest-rated opponent when there were several.
// - Scenario-specific awards are entered by the player as extra lines with a reason.

import type { XpLine } from '../../../domain'
import { underdogBonus } from '../../../rules/data/campaign/experience'
import { pendingAdvances } from '../../../rules/resolve/advances'
import type { CharacterRole } from '../../../rules/types'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword } from '../../../rules/types/roster'
import type { XpExtra } from './state'

export interface XpContext {
  won: boolean
  leaderId: string | null
  /** Extra experience per surviving warrior (0 when not the underdog or the toggle is off). */
  underdogBonus: number
  enemiesOut: Record<string, number>
  extras: Record<string, XpExtra[]>
}

/** The underdog bonus that applies, from both ratings. */
export function underdogBonusFor(myRating: number, opponentRating: number | null): number {
  if (opponentRating === null) return 0
  return underdogBonus(opponentRating - myRating)
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n)
}

interface Award {
  amount: number
  reason: string
}

function toLine(
  subjectType: XpLine['subjectType'],
  subject: { id: string; name: string; xp: number },
  role: CharacterRole,
  awards: Award[],
): XpLine | null {
  const kept = awards.filter((a) => a.amount !== 0)
  if (kept.length === 0) return null
  const amount = kept.reduce((n, a) => n + a.amount, 0)
  const xpBefore = subject.xp
  const xpAfter = Math.max(0, xpBefore + amount)
  return {
    subjectType,
    subjectId: subject.id,
    subjectName: subject.name,
    amount: xpAfter - xpBefore,
    reasons: kept.map((a) => `${signed(a.amount)} ${a.reason}`),
    xpBefore,
    xpAfter,
    advancesEarned: pendingAdvances(role, xpBefore, xpAfter),
  }
}

/**
 * A hero's or hired sword's line. `after` is the warrior with injuries applied (Survives Against
 * The Odds adds experience there); `alive` is false for Dead and retired results, who earn nothing.
 */
export function warriorXpLine(
  subjectType: 'hero' | 'hiredSword',
  before: RosterHero | RosterHiredSword,
  after: RosterHero | RosterHiredSword,
  alive: boolean,
  ctx: XpContext,
): XpLine | null {
  if (!alive) return null
  const awards: Award[] = [{ amount: 1, reason: 'survived the battle' }]
  if (ctx.won && ctx.leaderId === before.id) awards.push({ amount: 1, reason: 'winning leader' })
  const enemies = ctx.enemiesOut[before.id] ?? 0
  if (enemies > 0) awards.push({ amount: enemies, reason: `${enemies === 1 ? 'enemy' : 'enemies'} out of action` })
  if (ctx.underdogBonus > 0) awards.push({ amount: ctx.underdogBonus, reason: 'underdog bonus' })
  const injuryXp = after.xp - before.xp
  if (injuryXp !== 0) awards.push({ amount: injuryXp, reason: 'from the Serious Injuries chart' })
  for (const extra of ctx.extras[before.id] ?? []) awards.push({ amount: extra.amount, reason: extra.reason })
  return toLine(subjectType, before, 'hero', awards)
}

/** A henchman group's line: +1 for surviving as long as a model remains, plus underdog and extras. */
export function groupXpLine(before: RosterHenchmanGroup, after: RosterHenchmanGroup, ctx: XpContext): XpLine | null {
  if (after.size <= 0) return null
  const awards: Award[] = [{ amount: 1, reason: 'survived the battle' }]
  if (ctx.underdogBonus > 0) awards.push({ amount: ctx.underdogBonus, reason: 'underdog bonus' })
  for (const extra of ctx.extras[before.id] ?? []) awards.push({ amount: extra.amount, reason: extra.reason })
  return toLine('group', before, 'henchman', awards)
}
