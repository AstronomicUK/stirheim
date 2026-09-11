// The bottom sheet that resolves one pending advance: roll 2D6, make whatever choice the table
// asks for (sub-roll, characteristic, skill or spell, promotion), review the sentence, confirm.
// The draft lives in ./store so a refresh keeps the dice; the rules live in ./model.

import { useMemo, useState } from 'react'
import { useRecordAdvanceRoll, useResolveAdvance, type PendingAdvanceRow } from '../../api/advances'
import type { WarbandDetail } from '../../api/warbands'
import { diffRoster } from '../../domain'
import type { CampaignBans, CampaignHouseRules } from '../../rules/types/roster'
import type { PerkSource } from '../../rules/resolve/mapAdvantages'
import type { WarbandTemplate } from '../../rules/types'
import { Button, Notice, Sheet } from '../../ui'
import { skillTableName } from '../roster/view/lookups'
import { AdvanceBody } from './AdvanceBody'
import { defaultPromotedName, draftFromRolled, effectiveStep, emptyDraft, planGroup, planHero, rolledFromDraft, setStep, subjectName, type AdvanceContext, type AdvanceDraft, type AdvanceSubject } from './model'
import { advanceStore, forgetAdvanceStore, useAdvanceStore } from './store'

export interface ResolveSheetProps {
  advance: PendingAdvanceRow
  subject: AdvanceSubject
  detail: WarbandDetail
  template: WarbandTemplate | undefined
  /** The campaign's bans, when the warband is in one. */
  bans?: CampaignBans
  /** Map campaigns: the district that lets a new spell be chosen (Sage's Hall). */
  chooseSpell?: PerkSource | null
  /** The campaign's house rules (Rewards of the Shadowlord). */
  houseRules?: CampaignHouseRules | null
  onClose: () => void
}

export function ResolveSheet({ advance, subject, detail, template, bans, chooseSpell = null, houseRules = null, onClose }: ResolveSheetProps) {
  // The sheet is mounted with key={advance.id}, so this runs once per advance. The seed is a no-op
  // when a persisted draft already exists (a refresh mid-roll).
  const [store] = useState(() => {
    const s = advanceStore(advance.id)
    if (!s.getState().draft) {
      const name = subject.kind === 'group' ? defaultPromotedName(subject.group, detail.roster) : ''
      const id = crypto.randomUUID()
      // "Pick later" rows carry their dice: start at the choice instead of the roll.
      s.getState().seed(draftFromRolled(advance.rolled, id, name) ?? emptyDraft(id, name))
    }
    return s
  })
  const draft = useAdvanceStore(store, (s) => s.draft)
  const resolve = useResolveAdvance(detail.warband.id)
  const record = useRecordAdvanceRoll(detail.warband.id)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const ctx: AdvanceContext = useMemo(() => ({ roster: detail.roster, template, thresholdXp: advance.threshold_xp, promotionReroll: advance.promotion_reroll ?? false, bans, houseRules }), [detail.roster, template, advance.threshold_xp, advance.promotion_reroll, bans, houseRules])
  const plan = useMemo(() => {
    if (!draft) return null
    return subject.kind === 'group' ? planGroup(draft, subject.group, ctx, skillTableName) : planHero(draft, subject, ctx)
  }, [draft, subject, ctx])

  if (!draft || !plan) return null

  const update = (edit: (d: AdvanceDraft) => AdvanceDraft) => store.getState().update(edit)
  const step = effectiveStep(draft, plan)
  const name = subjectName(subject)
  const roleLabel = subject.kind === 'group' ? `Henchman group · ${subject.group.size} ${subject.group.size === 1 ? 'model' : 'models'}` : subject.kind === 'hiredSword' ? 'Hired sword' : 'Hero'
  // A henchman fixed increase has nothing to choose, so Back from the review returns to the dice.
  const hasChoice = !plan.result?.resolution.chosenInsteadOfRoll && (subject.kind !== 'group' || (plan.roll?.kind !== 'statIncrease' && plan.result?.resolution.outcome !== 'casualty'))

  async function confirm() {
    if (!plan?.result) return
    setSubmitError(null)
    try {
      const { warband, heroes, groups, items } = detail
      const changes = diffRoster({ warband, heroes, groups, items }, plan.result.next)
      await resolve.mutateAsync({ advanceId: advance.id, resolution: { ...plan.result.resolution }, changes })
      forgetAdvanceStore(advance.id)
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'The advance could not be saved.')
    }
  }

  /** The roll is made and the table asks for a skill or spell: the pick can wait. */
  const canPickLater = subject.kind !== 'group' && plan.need === 'skill' && plan.total !== null && plan.roll !== null

  async function pickLater() {
    if (!plan?.roll) return
    const rolled = rolledFromDraft(draft as AdvanceDraft, plan.roll.text)
    if (!rolled) return
    setSubmitError(null)
    try {
      await record.mutateAsync({ advanceId: advance.id, rolled: { ...rolled } })
      forgetAdvanceStore(advance.id)
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'The roll could not be saved.')
    }
  }

  const footer = (() => {
    if (step === 'roll') {
      const canContinue = (plan.total !== null || Boolean(plan.result)) && plan.need !== 'reroll' && plan.error === null
      return (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Later
          </Button>
          <Button className="flex-1" disabled={!canContinue} onClick={() => update((d) => setStep(d, plan.result && (!hasChoice || plan.result.resolution.chosenInsteadOfRoll) ? 'review' : 'choose'))}>
            Continue
          </Button>
        </div>
      )
    }
    if (step === 'choose') {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => update((d) => setStep(d, 'roll'))}>
              Back
            </Button>
            <Button className="flex-1" disabled={!plan.result} onClick={() => update((d) => setStep(d, 'review'))}>
              Continue
            </Button>
          </div>
          {canPickLater ? (
            <Button variant="ghost" block pending={record.isPending} onClick={() => void pickLater()}>
              Pick the skill later
            </Button>
          ) : null}
        </div>
      )
    }
    return (
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" disabled={resolve.isPending} onClick={() => update((d) => setStep(d, hasChoice ? 'choose' : 'roll'))}>
          Back
        </Button>
        <Button className="flex-1" disabled={!plan.result} pending={resolve.isPending} onClick={confirm}>
          Confirm
        </Button>
      </div>
    )
  })()

  return (
    <Sheet open onClose={onClose} title={name} description={`${roleLabel} · ${subject.kind === 'hero' && subject.hero.flags.lustrianReplacementOf && advance.threshold_xp === 1 ? 'immediate replacement advance' : `advance earned at ${advance.threshold_xp} xp`}`} footer={footer}>
      <div className="flex flex-col gap-4 py-2">
        {advance.rolled && step === 'choose' ? <p className="text-xs text-ink-dim">Rolled earlier; only the choice is left.</p> : null}
        <AdvanceBody draft={draft} plan={plan} subject={subject} step={step} update={update} chooseSpell={chooseSpell} />
        {submitError ? (
          <Notice tone="error" title="Could not save the advance">
            {submitError}
          </Notice>
        ) : null}
      </div>
    </Sheet>
  )
}

