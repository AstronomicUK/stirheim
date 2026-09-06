// Which warriors on a roster the rules make casters. Its own module so the battle page can ask
// without pulling in the casting screen.

import { casterProfile, type CasterProfile } from '../../../rules/resolve/casting'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterHero, RosterWarband } from '../../../rules/types/roster'

/** Every hero and hired sword on the roster the rules make a caster. */
export function castersOf(roster: RosterWarband, template: WarbandTemplate | undefined): CasterProfile[] {
  const heroes: RosterHero[] = [...roster.heroes, ...(roster.hiredSwords as unknown as RosterHero[])]
  const out: CasterProfile[] = []
  for (const hero of heroes) {
    const unit = template ? findUnitTemplate(template, hero.unitTemplateId) : undefined
    const profile = casterProfile({ hero, warbandName: template?.name, unitName: unit?.name })
    if (profile && profile.spells.length > 0) out.push(profile)
  }
  return out
}
