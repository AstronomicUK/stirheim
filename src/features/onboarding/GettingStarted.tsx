// First-run pieces for the home screen: a three-step "getting started" list for a brand-new
// account, and the slimmer "join a campaign" nudge for someone who has warbands but no campaign.

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card, Section } from '../roster/view/bits'
import { PrimaryLink } from './bits'

export function GettingStartedChecklist() {
  return (
    <Section title="Getting started">
      <Card className="flex flex-col gap-4 px-4 py-4">
        <p className="text-sm leading-relaxed text-ink-dim">
          Three short steps and your group is playing. Everything here can be changed later.
        </p>
        <ol className="flex flex-col gap-4">
          <Step n={1} title="Build your first warband">
            Pick a warband type, spend the starting gold and the ledger keeps the roster from here on.
            <div className="pt-3">
              <PrimaryLink to="/warbands/new">New warband</PrimaryLink>
            </div>
          </Step>
          <Step n={2} title="Join your group's campaign">
            Enter the invite code your GM shared with the warband you just built. Running the group yourself? Start the campaign and hand out the code.
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <InlineLink to="/campaigns/join">Join with a code</InlineLink>
              <InlineLink to="/campaigns/new">Start one as GM</InlineLink>
            </div>
          </Step>
          <Step n={3} title="Moving from another tracker?">
            Paste each roster into the importer, or rebuild it with the builder and set experience, injuries, gold and kit in the manual editor. The GM imports the battle records afterwards.
            <div className="pt-1">
              <InlineLink to="/help#moving-over">How to move a campaign over</InlineLink>
            </div>
          </Step>
        </ol>
      </Card>
    </Section>
  )
}

/** One card, one line of copy, two links: for players with a warband and nowhere to take it. */
export function JoinCampaignNudge() {
  return (
    <Card className="flex flex-col gap-2 px-4 py-3">
      <p className="text-sm leading-relaxed text-ink">Your warbands are not in a campaign yet.</p>
      <p className="text-sm leading-relaxed text-ink-dim">Join your group's with the invite code from the GM, or start one and run it yourself.</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <InlineLink to="/campaigns/join">Join with a code</InlineLink>
        <InlineLink to="/campaigns/new">Start a campaign</InlineLink>
      </div>
    </Card>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brass/60 font-mono text-xs text-brass"
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="font-headline text-lg leading-tight text-ink">{title}</h3>
        <div className="text-sm leading-relaxed text-ink-dim">{children}</div>
      </div>
    </li>
  )
}

function InlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center text-sm text-brass underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}
