// Display names for the wizard: the type line under a warrior or group.

import { hiredSwordName } from '../../roster/view/lookups'
import { unitTypeName } from '../../roster/shared/names'
import type { ReportContext } from '../model'

/** Type line under a warrior's name: "Reikland Captain", "Ogre Bodyguard". */
export function warriorTypeLabel(ctx: ReportContext, subject: { unitTemplateId?: string; hiredSwordId?: string }): string {
  if (subject.hiredSwordId) return hiredSwordName(subject.hiredSwordId)
  return unitTypeName(ctx.roster.warbandTemplateId, subject.unitTemplateId ?? '')
}
