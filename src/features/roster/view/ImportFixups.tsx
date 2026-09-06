// A notice on the roster page when an imported hero still carries "Skills/spells to check" notes or
// an injury recorded as chart text: one tap re-runs the matchers against today's rules data and
// saves the result as a logged edit.

import { useMemo, useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import { Button, Notice } from '../../../ui'
import { describeFixup, fixupChanges, planHeroFixup, type HeroFixup } from '../../importer/fixups'

export function ImportFixups({ detail, canEdit }: { detail: WarbandDetail; canEdit: boolean }) {
  const update = useUpdateRoster(detail.warband.id)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const fixups = useMemo(() => detail.heroes.map(planHeroFixup).filter((f): f is HeroFixup => f !== null), [detail.heroes])
  if (!canEdit) return null
  if (done) return <Notice tone="success">Imported skills, spells and injuries brought up to date.</Notice>
  if (fixups.length === 0) return null

  async function apply() {
    setError(null)
    try {
      await update.mutateAsync({ reason: 'import_fixup', changes: fixupChanges(fixups, detail.heroes) })
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply the fix-ups.')
    }
  }

  return (
    <Notice tone="info" title="Imported roster: skills, spells or injuries to bring up to date">
      <p className="text-sm leading-relaxed">The rules data has grown since this roster was imported. Matching again would add:</p>
      <ul className="mt-1 flex flex-col gap-0.5 text-sm">
        {fixups.map((f) => (
          <li key={f.heroId}>{describeFixup(f)}</li>
        ))}
      </ul>
      {error ? <p className="mt-1 text-sm text-accent-strong">{error}</p> : null}
      <div className="mt-2">
        <Button variant="secondary" pending={update.isPending} onClick={() => void apply()}>
          Match them now
        </Button>
      </div>
    </Notice>
  )
}
