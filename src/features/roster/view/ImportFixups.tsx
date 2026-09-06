// Imported rosters carry what the importer could not place at the time: "Skills/spells to check"
// in a hero's notes, or a "roll again" injury recorded as the chart text. When the owner opens the
// roster, the matchers run once more against today's rules data and the result is saved as one
// logged edit. Nothing to tap; a one-line note says what happened.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import { Notice } from '../../../ui'
import { describeFixup, fixupChanges, planHeroFixup, type HeroFixup } from '../../importer/fixups'

export function ImportFixups({ detail, canEdit }: { detail: WarbandDetail; canEdit: boolean }) {
  const update = useUpdateRoster(detail.warband.id)
  const fixups = useMemo(() => detail.heroes.map(planHeroFixup).filter((f): f is HeroFixup => f !== null), [detail.heroes])
  const ran = useRef(false)
  const [applied, setApplied] = useState<string[] | null>(null)

  useEffect(() => {
    if (!canEdit || ran.current || fixups.length === 0) return
    ran.current = true
    const lines = fixups.map(describeFixup)
    update
      .mutateAsync({ reason: 'import_fixup', changes: fixupChanges(fixups, detail.heroes) })
      .then(() => setApplied(lines))
      .catch(() => {
        // Left as it was; the notes still list the names, and the next visit tries again.
        ran.current = false
      })
  }, [canEdit, fixups, detail.heroes, update])

  if (!applied) return null
  return (
    <Notice tone="success" title="Imported skills, spells and injuries brought up to date">
      <ul className="flex flex-col gap-0.5 text-sm">
        {applied.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </Notice>
  )
}
