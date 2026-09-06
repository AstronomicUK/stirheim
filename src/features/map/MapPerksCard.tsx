// A short card of the map advantages a warband holds, for the trading post and recruitment: the
// districts, then what each does here. Collapsed to one line until tapped.

import { useState } from 'react'
import { Link } from 'react-router'
import { describeMapPerks, type MapPerks } from '../../rules/resolve/mapAdvantages'
import { Card } from '../roster/view/bits'

export function MapPerksCard({ perks, campaignId }: { perks: MapPerks; campaignId: string | undefined }) {
  const [open, setOpen] = useState(false)
  const lines = describeMapPerks(perks)
  if (perks.districts.length === 0) {
    return (
      <p className="text-xs text-ink-dim">
        No map advantages yet: win a battle in a district for a foothold.{campaignId ? (
          <>
            {' '}
            <Link to={`/campaigns/${campaignId}/map`} className="text-brass underline-offset-4 hover:underline">
              Open the map
            </Link>
          </>
        ) : null}
      </p>
    )
  }
  return (
    <Card className="flex flex-col gap-2 px-4 py-3">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-start justify-between gap-3 text-left">
        <span className="text-sm text-ink">
          <span className="font-medium">Map advantages</span> <span className="text-ink-dim">from {perks.districts.map((d) => d.districtName).join(', ')}</span>
        </span>
        <span className="shrink-0 text-xs text-brass">{open ? 'Hide' : `${lines.length} in play`}</span>
      </button>
      {open ? (
        <ul className="flex flex-col gap-1 border-t border-border pt-2 text-sm text-ink-dim">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
          {campaignId ? (
            <li>
              <Link to={`/campaigns/${campaignId}/map`} className="text-brass underline-offset-4 hover:underline">
                Open the map
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </Card>
  )
}
