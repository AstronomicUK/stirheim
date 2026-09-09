// Sold to the Pits (#54): a hero owed a fight in the pits gets a card here to record how it went.
// Winning and a direct-resolving loss apply in one step; a loss whose injury needs a follow-up die
// (Arm Wound, Madness, Smashed Leg, Deep Wound) or another D66 (Multiple Injuries) is not fully
// supported inline here — flagged plainly so it can be finished by hand rather than silently wrong.

import { useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import { diffRoster } from '../../../domain/rosterDiff'
import { rollD66InRange } from '../../../rules/resolve/dice'
import { PIT_FIGHT_LOSS_ROLL_RANGE, PIT_FIGHT_WIN_GOLD, PIT_FIGHT_WIN_XP, pitFightsOwed, resolvePitFightLoss, resolvePitFightWin } from '../../../rules/resolve/pitFight'
import { Button, DieField, Icon, Notice, Sheet } from '../../../ui'
import { Card, Section } from './bits'

export interface PitFightCardProps {
  detail: WarbandDetail
  canEdit: boolean
  onError: (message: string | null) => void
}

export function PitFightCard({ detail, canEdit, onError }: PitFightCardProps) {
  const update = useUpdateRoster(detail.warband.id)
  const owed = pitFightsOwed(detail.roster)
  const [open, setOpen] = useState(false)

  if (!canEdit || owed.length === 0) return null

  async function apply(next: typeof detail.roster) {
    onError(null)
    try {
      await update.mutateAsync({ reason: 'pitFight', changes: diffRoster(detail, next) })
      setOpen(false)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not record the pit fight.')
    }
  }

  return (
    <Section title="Owed a pit fight">
      <div className="flex flex-col gap-3">
        {owed.map((o) => (
          <Card key={o.heroId} className="flex flex-col gap-3 px-4 py-3">
            <div className="flex items-start gap-2">
              <Icon name="battle" size={20} className="mt-0.5 shrink-0 text-brass" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{o.heroName}</p>
                <p className="text-xs leading-relaxed text-ink-dim">Sold to the fighting pits of Cutthroat&rsquo;s Haven — record whether he won or lost before he can fight again.</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Resolve it
            </Button>
          </Card>
        ))}
      </div>

      <PitFightSheet open={open} detail={detail} pending={update.isPending} onClose={() => setOpen(false)} onApply={apply} />
    </Section>
  )
}

function PitFightSheet({
  open,
  detail,
  pending,
  onClose,
  onApply,
}: {
  open: boolean
  detail: WarbandDetail
  pending: boolean
  onClose: () => void
  onApply: (next: typeof detail.roster) => Promise<void>
}) {
  const [d66, setD66] = useState<number | null>(null)
  const [subRoll, setSubRoll] = useState<number | null>(null)

  function reset() {
    setD66(null)
    setSubRoll(null)
  }

  const lossPreview = d66 !== null ? resolvePitFightLoss(detail.roster, d66, subRoll ?? undefined) : null
  const needsSubRoll = lossPreview?.value.needsSubRoll
  const needsMoreRolls = lossPreview?.value.needsMoreRolls
  const lossReady = lossPreview !== null && !needsSubRoll && !needsMoreRolls

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Resolve the pit fight"
      description={`Win: +${PIT_FIGHT_WIN_XP} Experience, ${PIT_FIGHT_WIN_GOLD} gc for the warband, keeps his kit. Lose: a Serious Injury roll (${PIT_FIGHT_LOSS_ROLL_RANGE.min}-${PIT_FIGHT_LOSS_ROLL_RANGE.max}), and if he survives it he rejoins without his weapons or armour.`}
      footer={
        <Button
          variant="secondary"
          block
          onClick={() => {
            reset()
            onClose()
          }}
          disabled={pending}
        >
          Not yet
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Button className="flex-1" pending={pending} onClick={() => void onApply(resolvePitFightWin(detail.roster).value)}>
            He won
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => setD66(rollD66InRange(PIT_FIGHT_LOSS_ROLL_RANGE.min, PIT_FIGHT_LOSS_ROLL_RANGE.max))}>
            He lost — roll it
          </Button>
        </div>

        {d66 !== null ? (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <p className="text-sm text-ink-dim">
              Rolled <span className="font-semibold text-ink">{d66}</span> on the Serious Injuries chart.
            </p>
            {needsSubRoll ? (
              <>
                <p className="text-sm text-ink-dim">{needsSubRoll.prompt}.</p>
                <DieField label={`${needsSubRoll.die} roll`} sides={needsSubRoll.die === 'D3' ? 3 : 6} value={subRoll} onChange={setSubRoll} rollable />
              </>
            ) : null}
            {needsMoreRolls ? (
              <Notice tone="warn" title="Needs more than this card can do">
                {needsMoreRolls.note} This card only resolves a single roll — finish the rest of the Multiple Injuries chain by hand on his card, then come back and record the final result here if it changes anything further.
              </Notice>
            ) : null}
            {lossReady ? (
              <Notice tone="info" title="What this does">
                <ul className="flex flex-col gap-1">
                  {lossPreview!.events.map((event, i) => (
                    <li key={i}>{event.message}</li>
                  ))}
                </ul>
              </Notice>
            ) : null}
            {lossReady ? (
              <Button block pending={pending} onClick={() => void onApply(lossPreview!.value.warband)}>
                Record it
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Sheet>
  )
}
