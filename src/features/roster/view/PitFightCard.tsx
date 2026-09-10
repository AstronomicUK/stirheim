import { useState } from 'react'
import { type WarbandDetail } from '../../../api/warbands'
import { useRosterEvent } from '../../../api/rosterEvents'
import { rollD66InRange } from '../../../rules/resolve/dice'
import { PIT_FIGHT_LOSS_ROLL_RANGE, PIT_FIGHT_WIN_GOLD, PIT_FIGHT_WIN_XP, pitFightsOwed, pitFightHero, finishPitFightLoss, resolvePitFightWin } from '../../../rules/resolve/pitFight'
import { Button, Icon, Sheet } from '../../../ui'
import { resolveHeroInjuryFlow } from '../../postBattle/model/injuries'
import type { HeroInjuryFlow } from '../../postBattle/model/state'
import { HeroInjuryCard } from '../../postBattle/wizard/InjuriesStep'
import { Card, Section } from './bits'

export interface PitFightCardProps {
  detail: WarbandDetail
  canEdit: boolean
  onError: (message: string | null) => void
}

export function PitFightCard({ detail, canEdit, onError }: PitFightCardProps) {
  const update = useRosterEvent(detail)
  const owed = pitFightsOwed(detail.roster)
  const [heroId, setHeroId] = useState<string | null>(null)

  if (!canEdit || owed.length === 0) return null
  const selectedId = owed.some(o => o.heroId === heroId) ? heroId : null

  async function apply(next: typeof detail.roster) {
    onError(null)
    try {
      await update.mutateAsync({ reason: 'Pit fight resolved: injury, equipment and winnings recorded.', next })
      setHeroId(null)
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
            <Button variant="secondary" onClick={() => setHeroId(o.heroId)}>
              Resolve it
            </Button>
          </Card>
        ))}
      </div>

      <PitFightSheet key={selectedId} heroId={selectedId} open={selectedId !== null} detail={detail} pending={update.isPending} onClose={() => setHeroId(null)} onApply={apply} />
    </Section>
  )
}

function PitFightSheet({
  heroId,
  open,
  detail,
  pending,
  onClose,
  onApply,
}: {
  heroId: string | null
  open: boolean
  detail: WarbandDetail
  pending: boolean
  onClose: () => void
  onApply: (next: typeof detail.roster) => Promise<void>
}) {
  const [flow, setFlow] = useState<HeroInjuryFlow>({rolls: [], countRoll: null})
  function reset() { setFlow({rolls: [], countRoll: null}) }
  const hero = heroId ? pitFightHero(detail.roster, heroId) : null
  const loss = hero && flow.rolls.length ? resolveHeroInjuryFlow(hero, flow) : null
  const lossReady = loss?.pending.kind === 'done'

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
          <Button className="flex-1" pending={pending} onClick={() => void onApply(resolvePitFightWin(detail.roster, heroId ?? undefined).value)}>
            He won
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => setFlow({rolls: [{d66: rollD66InRange(PIT_FIGHT_LOSS_ROLL_RANGE.min, PIT_FIGHT_LOSS_ROLL_RANGE.max), subRoll: null}], countRoll: null})}>
            He lost — roll it
          </Button>
        </div>

        {loss && hero ? <>
          <HeroInjuryCard name={hero.name} type="Pit fight injury" resolution={loss} skip={undefined}
            onSkip={()=>{}} onDistrictRoll={()=>{}} onReset={reset}
            onD66={d66=>setFlow(f=>({...f,rolls:[...f.rolls,{d66,subRoll:null}]}))}
            onSubRoll={(index,value)=>setFlow(f=>({...f,rolls:f.rolls.map((r,i)=>i===index?{...r,subRoll:value}:r)}))}
            onCount={countRoll=>setFlow(f=>({...f,countRoll}))}/>
          {lossReady ? <Button block pending={pending} onClick={()=>void onApply(finishPitFightLoss(detail.roster,loss.hero))}>Record injuries and equipment loss</Button> : null}
        </> : null}
      </div>
    </Sheet>
  )
}
