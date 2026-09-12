import type { WarbandDetail } from './warbands'
import type { CaptiveCase } from './captives'
import { buildForcedCaptiveProposal } from './forcedCaptives'
import { buildCompanionCaptiveProposal } from './companionCaptives'
import { resolveCaptive } from '../rules/resolve/captives'
import type { RosterWarband } from '../rules/types/roster'

/**
 * Captive-for-captive exchange between two open cases held the other way round (migration 095).
 * Each side gets its own captive back by that captive's release rules; nothing else moves.
 * `owner` is case A's victim (who also holds case B's captive); `captor` is case A's captor.
 */
export interface ExchangeInput {
  caseA: CaptiveCase
  caseB: CaptiveCase
  owner: WarbandDetail
  captor: WarbandDetail
  /** Fallback ids/holders for a returning model whose group or handler is gone. */
  groupId?: string
  holderId?: string | null
  otherGroupId?: string
  otherHolderId?: string | null
}

function returned(item: CaptiveCase, victim: WarbandDetail, holder: WarbandDetail, groupId: string | undefined, holderId: string | null | undefined): { roster: RosterWarband; text: string } {
  if (item.subject_kind === 'henchman') {
    const built = buildForcedCaptiveProposal({ item, owner: victim, captor: holder, choice: { kind: 'release', groupId }, newGroupId: groupId ?? crypto.randomUUID() })
    return { roster: built.nextOwner, text: built.message }
  }
  if (item.subject_kind === 'companion') {
    const built = buildCompanionCaptiveProposal({ item, owner: victim, captor: holder, choice: { kind: 'release', holderId } })
    return { roster: built.nextOwner, text: built.message }
  }
  const preview = resolveCaptive(victim.roster, holder.roster, item.hero_id, { kind: 'ransom', gold: 0 })
  return { roster: preview.owner, text: `${item.hero_name} returns to ${victim.warband.name} with all equipment.` }
}

export function buildExchangeProposal(input: ExchangeInput): { choice: Record<string, unknown>; nextOwner: RosterWarband; nextCaptor: RosterWarband; message: string } {
  const { caseA, caseB, owner, captor } = input
  if (caseB.victim_warband_id !== caseA.captor_warband_id || caseB.captor_warband_id !== caseA.victim_warband_id) throw new Error('An exchange needs a captive held the other way round.')
  const groupId = input.groupId ?? crypto.randomUUID(), otherGroupId = input.otherGroupId ?? crypto.randomUUID()
  const a = returned(caseA, owner, captor, groupId, input.holderId)
  const b = returned(caseB, captor, owner, otherGroupId, input.otherHolderId)
  return {
    choice: { kind: 'exchange', otherCaseId: caseB.id, groupId, holderId: input.holderId ?? null, otherGroupId, otherHolderId: input.otherHolderId ?? null },
    nextOwner: a.roster, nextCaptor: b.roster,
    message: `Exchange: ${a.text} In return: ${b.text}`,
  }
}
