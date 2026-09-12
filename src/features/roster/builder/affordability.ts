// Whether the builder can afford one more of an equipment option (#41). Rather than re-deriving a
// line's price here — group size, half-price house rules and catalogue discounts all bear on it —
// we add the item to a copy of the draft and let draftCosts, the one pricing authority, say what
// is left. Unpriced options (enter the price once taken) never count as unaffordable.

import { addDraftEquipment, draftCosts, type DraftSubject, type EquipmentOption, type WarbandDraft } from '../../../rules/resolve/builder'
import type { WarbandTemplate } from '../../../rules/types'
import type { CampaignHouseRules } from '../../../rules/types/roster'

export function canAffordAnother(
  draft: WarbandDraft,
  subject: DraftSubject,
  option: EquipmentOption,
  template: WarbandTemplate,
  houseRules?: CampaignHouseRules | null,
): boolean {
  const before = draftCosts(draft, template, houseRules).remaining
  const after = draftCosts(addDraftEquipment(draft, subject, option, 1), template, houseRules).remaining
  // Only the copy that would tip (or push further) below zero is refused; a free line, or an
  // already-overspent draft buying nothing dearer, is left alone.
  return !(after < 0 && after < before)
}
