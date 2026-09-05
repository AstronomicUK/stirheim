import { useMemo, useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { overrideNote, overrideReady, reasonWith, type Override } from '../../domain/override'
import { dismissWarrior, henchmanUpkeepDue, hireHiredSword, hiredSwordEquipment, payHenchmanUpkeep, payUpkeep, type HenchmanUpkeepLine } from '../../rules/resolve/recruitment'
import type { HiredSwordSummary } from '../../rules/types/campaignContent'
import type { RosterHiredSword } from '../../rules/types/roster'
import { Button, Markdown, Notice, NumberField, Sheet, TextField, OverrideField } from '../../ui'
import { StatLine } from '../roster/shared/StatLine'
import { Card, ItemLines, KeyValue, RuleList, Section, Tag } from '../roster/view/bits'
import {
  findHiredSwordEntry,
  gradeLabel,
  hiredSwordOptions,
  upkeepDue,
  upkeepSummary,
  upkeepText,
  type Eligibility,
  type HiredSwordOption,
} from './helpers'
import type { RecruitTabProps } from './HeroesTab'
import { outcomeFrom, useCommit, type Outcome } from './useCommit'

export interface HiredSwordsTabProps extends Omit<RecruitTabProps, 'template'> {
  template: RecruitTabProps['template'] | undefined
}

/** Pay or dismiss the swords already hired, then browse the catalogue for another. */
export function HiredSwordsTab({ detail, template, canEdit, onDone }: HiredSwordsTabProps) {
  const active = detail.roster.hiredSwords.filter((s) => s.status === 'active')
  const options = useMemo(() => hiredSwordOptions(detail.roster, template), [detail.roster, template])
  const [paying, setPaying] = useState<RosterHiredSword | null>(null)
  const [dismissing, setDismissing] = useState<RosterHiredSword | null>(null)
  const [hiring, setHiring] = useState<HiredSwordOption | null>(null)
  const [feeding, setFeeding] = useState<HenchmanUpkeepLine | null>(null)
  const groupUpkeep = useMemo(() => henchmanUpkeepDue(detail.roster), [detail.roster])

  function finish(outcome: Outcome) {
    setPaying(null)
    setDismissing(null)
    setHiring(null)
    setFeeding(null)
    onDone(outcome)
  }

  return (
    <>
      <Section title="Currently hired" aside={active.length ? `${active.length} active` : undefined}>
        {active.length === 0 ? (
          <p className="text-sm text-ink-dim">No hired swords at the moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {active.map((hs) => {
              const entry = findHiredSwordEntry(hs.hiredSwordId)
              return (
                <li key={hs.id}>
                  <Card className="flex flex-col gap-3 px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base text-ink">{hs.name}</p>
                        <p className="text-xs text-ink-dim">{entry?.name ?? hs.hiredSwordId}</p>
                      </div>
                      <span className="shrink-0 text-right text-xs text-ink-dim">
                        Upkeep <span className="text-sm text-ink">{upkeepText(entry)}</span>
                      </span>
                    </div>
                    <StatLine stats={hs.stats} compact className="text-xs" />
                    {canEdit ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="secondary" onClick={() => setPaying(hs)}>
                          Pay upkeep
                        </Button>
                        <Button variant="danger" onClick={() => setDismissing(hs)}>
                          Dismiss
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      {groupUpkeep.length > 0 ? (
        <Section title="Henchmen with upkeep" aside={`${groupUpkeep.length}`}>
          <ul className="flex flex-col gap-3">
            {groupUpkeep.map((line) => (
              <li key={line.groupId}>
                <Card className="flex flex-col gap-3 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base text-ink">{line.name}</p>
                      <p className="text-xs text-ink-dim">{line.note}</p>
                    </div>
                    <span className="shrink-0 text-right text-xs text-ink-dim">
                      Upkeep <span className="text-sm text-ink">{line.gold} gc</span>
                    </span>
                  </div>
                  {canEdit ? (
                    <Button variant="secondary" onClick={() => setFeeding(line)}>
                      Pay upkeep
                    </Button>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Hire" aside={`${options.length} in the rules`}>
        <p className="text-sm text-ink-dim">
          Hired swords do not count against the warband&apos;s size or hero limit, keep their own equipment and want their upkeep after every
          battle. One of each type only.
        </p>
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
          {options.map((option) => {
            const { entry, eligibility } = option
            const blocked = !canEdit || eligibility.kind === 'blocked'
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => setHiring(option)}
                  className={`flex w-full flex-col gap-1.5 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 hover:bg-surface-high ${
                    eligibility.kind === 'restricted' ? 'opacity-70' : ''
                  }`}
                >
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span className="text-base text-ink">{entry.name}</span>
                    <span className="shrink-0 text-sm tabular-nums text-ink-dim">{entry.hireCost.text}</span>
                  </span>
                  <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-ink-dim">
                    <span>
                      Upkeep {upkeepText(entry)} · {gradeLabel(entry.grade)}
                    </span>
                    <EligibilityTag eligibility={eligibility} />
                  </span>
                  {eligibility.kind === 'blocked' && eligibility.reason ? <span className="text-xs text-warn">{eligibility.reason}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </Section>

      {paying ? <UpkeepSheet key={paying.id} detail={detail} hiredSword={paying} onClose={() => setPaying(null)} onDone={finish} /> : null}
      {feeding ? <GroupUpkeepSheet key={feeding.groupId} detail={detail} line={feeding} onClose={() => setFeeding(null)} onDone={finish} /> : null}
      {dismissing ? (
        <DismissHiredSwordSheet key={dismissing.id} detail={detail} hiredSword={dismissing} onClose={() => setDismissing(null)} onDone={finish} />
      ) : null}
      {hiring ? <HireSheet key={hiring.entry.id} detail={detail} option={hiring} onClose={() => setHiring(null)} onDone={finish} /> : null}
    </>
  )
}

function EligibilityTag({ eligibility }: { eligibility: Eligibility }) {
  switch (eligibility.kind) {
    case 'allowed':
      return <Tag tone="brass">Named in the rules</Tag>
    case 'restricted':
      return <Tag tone="warn">Rules exclude this warband</Tag>
    case 'check':
      return <Tag>Check restriction</Tag>
    case 'blocked':
      return <Tag tone="danger">Unavailable</Tag>
    default:
      return null
  }
}

interface SwordSheetProps {
  detail: WarbandDetail
  hiredSword: RosterHiredSword
  onClose: () => void
  onDone: (outcome: Outcome) => void
}

function UpkeepSheet({ detail, hiredSword: hs, onClose, onDone }: SwordSheetProps) {
  const { roster } = detail
  const entry = findHiredSwordEntry(hs.hiredSwordId)
  const [override, setOverride] = useState<number | null>(null)
  const { commit, error, pending } = useCommit(detail)
  const overrideInvalid = override !== null && (Number.isNaN(override) || override < 0)
  const due = upkeepDue(entry, overrideInvalid ? null : override)
  const willLeave = due > 0 && roster.gold < due

  const [overrideReason, setOverrideReason] = useState('')
  const reasonMissing = override !== null && !overrideInvalid && overrideReason.trim() === ''

  async function confirm() {
    const note = override !== null && !overrideInvalid ? overrideNote('Upkeep', upkeepText(entry), `${override} gc`, overrideReason) : null
    const result = await commit(
      () => payUpkeep(roster, hs.id, overrideInvalid || override === null ? {} : { amountOverride: override }),
      (v) => v.warband,
      reasonWith('recruitment', note),
    )
    if (!result) return
    onDone(
      result.value.paid
        ? outcomeFrom(`${hs.name} paid`, result.events)
        : outcomeFrom(`${hs.name} has left the warband`, result.events, { tone: 'warn' }),
    )
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Pay upkeep"
      description={`${hs.name} · ${entry?.name ?? hs.hiredSwordId}`}
      footer={
        <Button block variant={willLeave ? 'danger' : 'primary'} pending={pending} disabled={overrideInvalid || reasonMissing} onClick={() => void confirm()}>
          {willLeave ? 'Cannot pay: let him go' : due > 0 ? `Pay ${due} gc` : 'Record no upkeep due'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <KeyValue label="Listed upkeep" value={upkeepText(entry)} />
          <KeyValue label="Treasury" value={`${roster.gold} gc`} />
        </div>
        <NumberField
          label="Pay a different amount"
          value={override}
          onChange={setOverride}
          allowEmpty
          hint="Leave blank for the listed fee. Use this for conditional fees, e.g. a Troll Slayer in a warband with Elves pays 20 gc."
          error={overrideInvalid ? 'Enter a whole number of gold crowns' : undefined}
        />
        {override !== null ? <TextField label="Why a different amount" value={overrideReason} autoComplete="off" onChange={(e) => setOverrideReason(e.target.value)} error={reasonMissing ? 'Say why; it goes in the log' : undefined} /> : null}
        <Notice tone={willLeave ? 'warn' : 'info'}>{upkeepSummary(hs, entry, roster.gold, overrideInvalid ? null : override)}</Notice>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Sheet>
  )
}

function DismissHiredSwordSheet({ detail, hiredSword: hs, onClose, onDone }: SwordSheetProps) {
  const { commit, error, pending } = useCommit(detail)

  async function confirm() {
    const result = await commit(() => dismissWarrior(detail.roster, hs.id), (w) => w)
    if (result) onDone(outcomeFrom(`${hs.name} released`, result.events, { tone: 'warn' }))
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Dismiss ${hs.name}?`}
      footer={
        <Button block variant="danger" pending={pending} onClick={() => void confirm()}>
          Dismiss
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-sm text-ink-dim">
          He leaves the warband and takes his own weapons and equipment with him; you cannot sell a hired sword&apos;s kit. Any experience he
          gained is lost, and no more upkeep is due.
        </p>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Sheet>
  )
}

interface HireSheetProps {
  detail: WarbandDetail
  option: HiredSwordOption
  onClose: () => void
  onDone: (outcome: Outcome) => void
}

function HireSheet({ detail, option, onClose, onDone }: HireSheetProps) {
  const { roster } = detail
  const { entry, eligibility } = option
  const [name, setName] = useState('')
  const { commit, error, pending } = useCommit(detail)
  const listedFee = entry.hireCost.base ?? 0
  const [feeOverride, setFeeOverride] = useState<Override | null>(null)
  const cost = overrideReady(feeOverride) ? feeOverride.amount : listedFee
  const feeBlocks = feeOverride !== null && !overrideReady(feeOverride)
  const restricted = eligibility.kind === 'restricted'

  async function confirm() {
    const id = crypto.randomUUID()
    const trimmed = name.trim()
    const note = overrideReady(feeOverride) ? overrideNote('Hire fee', `${listedFee} gc`, `${feeOverride.amount} gc`, feeOverride.reason) : null
    const result = await commit(
      () => hireHiredSword(roster, entry.id, id, { ...(trimmed ? { name: trimmed } : {}), ...(overrideReady(feeOverride) ? { feeOverride: feeOverride.amount } : {}) }),
      (w) => w,
      reasonWith('recruitment', note),
    )
    if (result) onDone(outcomeFrom(`${trimmed || entry.name} hired`, result.events))
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={entry.name}
      description={`${entry.hireCost.text} to hire · upkeep ${upkeepText(entry)} · ${entry.source}`}
      footer={
        <Button block variant={restricted ? 'danger' : 'primary'} pending={pending} disabled={feeBlocks} onClick={() => void confirm()}>
          {restricted ? `Hire anyway for ${cost} gc` : `Hire for ${cost} gc`}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <RestrictionNotice entry={entry} eligibility={eligibility} />
        <TextField label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder={entry.name} autoComplete="off" />
        <div className="grid grid-cols-3 gap-3">
          <KeyValue label="Hire fee" value={`${cost} gc`} />
          <span className="col-span-2">
            <OverrideField what="the hire fee" suggested={listedFee} value={feeOverride} onChange={setFeeOverride} />
          </span>
          <KeyValue label="Upkeep" value={upkeepText(entry)} />
          <KeyValue label="Treasury after" value={`${roster.gold - cost} gc`} />
        </div>
        <HiredSwordDetail entry={entry} />
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Sheet>
  )
}

function RestrictionNotice({ entry, eligibility }: { entry: HiredSwordSummary; eligibility: Eligibility }) {
  const text = entry.detail?.mayBeHired?.trim()
  if (eligibility.kind === 'restricted') {
    return (
      <Notice tone="warn" title="The rules read as excluding this warband">
        {text}
      </Notice>
    )
  }
  if (eligibility.kind === 'check') {
    return (
      <Notice tone="info" title="Check the restriction">
        {text || eligibility.reason}
      </Notice>
    )
  }
  return text ? (
    <p className="text-sm text-ink-dim">
      <span className="text-ink">May be hired: </span>
      {text}
    </p>
  ) : null
}

function HiredSwordDetail({ entry }: { entry: HiredSwordSummary }) {
  const detail = entry.detail
  if (!detail) return <p className="text-sm text-ink-dim">No write-up in the rules data.</p>
  const profile = detail.profiles[0]
  const kit = hiredSwordEquipment(detail)
  return (
    <div className="flex flex-col gap-4">
      {profile ? (
        <div className="flex flex-col gap-1">
          <StatLine stats={profile.stats} />
          {profile.rawStats ? <p className="text-xs text-ink-dim">As printed: {profile.rawStats.join(' ')}</p> : null}
          {detail.profiles.length > 1 ? (
            <p className="text-xs text-ink-dim">Only the first profile ({profile.name}) is stored on the roster.</p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 className="text-xs uppercase tracking-[0.25em] text-ink-dim">Equipment</h3>
        <ItemLines items={kit} emptyText="No equipment listed" />
      </div>
      {detail.skills ? (
        <div className="flex flex-col gap-1 text-sm">
          <h3 className="text-xs uppercase tracking-[0.25em] text-ink-dim">Skills</h3>
          <Markdown source={detail.skills} className="text-sm" />
        </div>
      ) : null}
      {detail.specialRules.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-[0.25em] text-ink-dim">Special rules</h3>
          <RuleList rules={detail.specialRules} />
        </div>
      ) : null}
      {detail.rating ? <p className="text-xs text-ink-dim">{detail.rating}</p> : null}
      {detail.flavour ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-ink-dim">Background</summary>
          <Markdown source={detail.flavour} className="mt-2 text-sm" />
        </details>
      ) : null}
    </div>
  )
}

function GroupUpkeepSheet({ detail, line, onClose, onDone }: { detail: WarbandDetail; line: HenchmanUpkeepLine; onClose: () => void; onDone: (outcome: Outcome) => void }) {
  const { roster } = detail
  const { commit, error, pending } = useCommit(detail)
  const willLeave = roster.gold < line.gold

  async function confirm() {
    const result = await commit(() => payHenchmanUpkeep(roster, line.groupId), (v) => v.warband, reasonWith('recruitment', null))
    if (!result) return
    onDone(result.value.paid ? outcomeFrom(`${line.name} fed`, result.events) : outcomeFrom(`${line.name} have left the warband`, result.events, { tone: 'warn' }))
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Pay upkeep"
      description={line.name}
      footer={
        <Button block variant={willLeave ? 'danger' : 'primary'} pending={pending} onClick={() => void confirm()}>
          {willLeave ? 'Cannot pay: they leave' : `Pay ${line.gold} gc`}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <KeyValue label="Upkeep due" value={`${line.gold} gc`} />
          <KeyValue label="Treasury" value={`${roster.gold} gc`} />
        </div>
        <Notice tone={willLeave ? 'warn' : 'info'}>{line.note}</Notice>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Sheet>
  )
}

