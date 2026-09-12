import { availableFreeHires } from '../../rules/resolve/explorationDiscoveries'
import { SnakeHunt } from './SnakeHunt'
import { OPTIONAL_HIRED_MOUNTS, sharedUpkeepOwner } from '../../rules/resolve/recruitment'
import { GroupUpkeepSheet } from './GroupUpkeepSheet'
import { RetainedScout } from '../roster/view/RetainedScout'
import { isDramatisPersona } from '../../rules/data/campaign/hiredSwords'
import { HIRED_EQUIPMENT_CHOICES } from '../../rules/resolve/hiredEquipmentChoices'
import { halfPriceHireSource, halved, type PerkSource } from '../../rules/resolve/mapAdvantages'
import { useMemo, useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { overrideNote, overrideReady, reasonWith, type Override } from '../../domain/override'
import { dismissWarrior, henchmanUpkeepDue, hireHiredSword, hiredSwordEquipment, hiredSwordStartingEquipment, payUpkeep, type HenchmanUpkeepLine } from '../../rules/resolve/recruitment'
import type { HiredSwordSummary } from '../../rules/types/campaignContent'
import type { RosterHiredSword } from '../../rules/types/roster'
import { Button, DieField, Markdown, Notice, NumberField, Sheet, TextField, OverrideField, SelectField } from '../../ui'
import { StatHeader, StatLine } from '../roster/shared/StatLine'
import { Card, ItemLines, KeyValue, RuleList, Section, Tag } from '../roster/view/bits'
import {
  findHiredSwordEntry,
  gradeLabel,
  hiredSwordOptions,
  upkeepText,
  type Eligibility,
  type HiredSwordOption,
} from './helpers'
import type { CampaignBans } from '../../rules/types/roster'
import type { RecruitTabProps } from './HeroesTab'
import { outcomeFrom, useCommit, type Outcome } from './useCommit'

export interface HiredSwordsTabProps extends Omit<RecruitTabProps, 'template'> {
  template: RecruitTabProps['template'] | undefined
  bans?: CampaignBans
}

/** Pay or dismiss the swords already hired, then browse the catalogue for another. */
export function HiredSwordsTab({ detail, template, canEdit, onDone, bans, perks }: HiredSwordsTabProps) {
  const active = detail.roster.hiredSwords.filter((s) => s.status === 'active')
  const options = useMemo(() => hiredSwordOptions(detail.roster, template, bans), [detail.roster, template, bans])
  const [search, setSearch] = useState('')
  const [show, setShow] = useState<'all' | 'available' | 'check' | 'unavailable'>('all')
  const shownOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return options.filter((o) => {
      if (q && !o.entry.name.toLowerCase().includes(q) && !(o.eligibility.reason ?? '').toLowerCase().includes(q)) return false
      if (show === 'available' && !(o.eligibility.kind === 'ok' || o.eligibility.kind === 'allowed')) return false
      if (show === 'check' && !(o.eligibility.kind === 'check' || o.eligibility.kind === 'restricted')) return false
      if (show === 'unavailable' && o.eligibility.kind !== 'blocked') return false
      return true
    })
  }, [options, search, show])
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
          <>
            <StatHeader className="px-4" />
            <ul className="flex flex-col gap-3">
              {active.map((hs) => {
                const entry = findHiredSwordEntry(hs.hiredSwordId)
                const shared = sharedUpkeepOwner(detail.roster, hs)
                const noOwnUpkeep = !!hs.flags.hireCompanion && (hs.hiredSwordId !== 'ulli_and_marquand' || !!shared)
                return (
                  <li key={hs.id}>
                    <Card className="flex flex-col gap-3 px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base text-ink">{hs.name}</p>
                          <p className="text-xs text-ink-dim">{hs.flags.merchantGuardian ? 'Guardian bodyguard' : hs.hiredSwordId === 'snake_charmer' && hs.flags.hireCompanion ? 'Snake' : entry?.name ?? hs.hiredSwordId}</p>
                        </div>
                        <span className="shrink-0 text-right text-xs text-ink-dim">
                          Upkeep <span className="text-sm text-ink">{noOwnUpkeep ? hs.flags.merchantGuardian ? 'None' : 'Shared contract' : upkeepText(entry)}</span>
                        </span>
                      </div>
                      {hs.hiredSwordId === 'snake_charmer' && !hs.flags.hireCompanion && canEdit ? <SnakeHunt detail={detail} charmer={hs} /> : null}
                      {hs.hiredSwordId==='maglah_khan_s_horde'&&canEdit?<RetainedScout detail={detail} hire={hs}/>:null}
                      <StatLine stats={hs.stats} compact className="text-xs" />
                      {canEdit ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="secondary" disabled={noOwnUpkeep} onClick={() => setPaying(hs)}>
                            {noOwnUpkeep ? 'No separate upkeep' : 'Pay upkeep'}
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
          </>
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <TextField label="Search hired swords" value={search} autoComplete="off" placeholder="Search by name" onChange={(e) => setSearch(e.target.value)} />
          </div>
          <SelectField label="Show" hideLabel value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="check">Needs a check</option>
            <option value="unavailable">Unavailable</option>
          </SelectField>
        </div>
        {shownOptions.length === 0 ? <p className="text-sm text-ink-dim">Nothing matches.</p> : null}
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
          {shownOptions.map((option) => {
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
                    {/* ml-auto keeps the tag on the right even when a long upkeep line wraps it onto its own row (#210). */}
                    <span className="ml-auto">
                      <EligibilityTag eligibility={eligibility} />
                    </span>
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
      {hiring ? <HireSheet key={hiring.entry.id} detail={detail} option={hiring} halfFrom={halfPriceHireSource(perks, hiring.entry.id)} onClose={() => setHiring(null)} onDone={finish} /> : null}
    </>
  )
}

/** Only the entries that need a second look carry a tag (#210): a hired sword the rules plainly allow
 * is simply available, the same as one with no restriction at all, so it says nothing. */
function EligibilityTag({ eligibility }: { eligibility: Eligibility }) {
  switch (eligibility.kind) {
    case 'restricted':
      return <Tag tone="warn">Not for this warband</Tag>
    case 'check':
      return <Tag>Check the rules</Tag>
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
  let preview: ReturnType<typeof payUpkeep> | null = null
  let paymentError = ''
  try { preview = payUpkeep(roster, hs.id, overrideInvalid || override === null ? {} : {amountOverride:override}) }
  catch(e) { paymentError = e instanceof Error ? e.message : 'Review the contract on the warband screen.' }
  const due = preview ? roster.gold - preview.value.warband.gold : 0
  const shards = preview ? roster.wyrdstone - preview.value.warband.wyrdstone : 0
  const willLeave = preview !== null && !preview.value.paid

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
        <Button block variant={willLeave ? 'danger' : 'primary'} pending={pending} disabled={overrideInvalid || reasonMissing || !preview} onClick={() => void confirm()}>
          {willLeave ? 'Cannot pay: let him go' : shards > 0 ? `Pay ${shards} wyrdstone / treasure` : due > 0 ? `Pay ${due} gc` : 'Record no upkeep due'}
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
        <Notice tone={willLeave ? 'warn' : 'info'}>{paymentError || preview?.events.map(e=>e.message).join(' ')}</Notice>
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
  /** Map campaigns: the district that makes this sword half fee, if any. */
  halfFrom: PerkSource | null
  onClose: () => void
  onDone: (outcome: Outcome) => void
}

function HireSheet({ detail, option, halfFrom, onClose, onDone }: HireSheetProps) {
  const { roster } = detail
  const { entry, eligibility } = option
  const freeHires = isDramatisPersona(entry.id) ? [] : availableFreeHires(roster, entry.id)
  const [rewardId, setRewardId] = useState('')
  const reward = freeHires.find(r=>r.id===rewardId) ?? freeHires[0]
  const availableFavour = reward?.id
  const [mounted, setMounted] = useState(false)
  const optionalMount = OPTIONAL_HIRED_MOUNTS[entry.id]
  const [useFavour, setUseFavour] = useState(!!freeHires.find(r=>r.id.endsWith(':brigands')))
  const [name, setName] = useState('')
  const equipmentChoices = HIRED_EQUIPMENT_CHOICES[entry.id]
  const [equipmentChoice, setEquipmentChoice] = useState(equipmentChoices?.[0]?.id)
  const [luthorRole,setLuthorRole]=useState<'crimson'|'wizard'|'archer'>('crimson')
  const { commit, error, pending } = useCommit(detail)
  const existingScouts = roster.hiredSwords.filter(s => s.hiredSwordId === 'hobgoblin_scout' && s.status === 'active').length
  const [scouts, setScouts] = useState(Math.max(2, existingScouts))
  const scoutCost = entry.id === 'maglah_khan_s_horde' ? Math.max(0, scouts - existingScouts) * 45 : 0
  const [feeDice, setFeeDice] = useState<(number | null)[]>([null, null, null])
  const randomFee = entry.id === 'ninja'
  const fullFee = (entry.hireCost.base ?? 0) + (randomFee ? feeDice.reduce<number>((sum, value) => sum + (value ?? 0), 0) : 0)
  const listedFee = halfFrom ? halved(fullFee) : fullFee
  const [feeOverride, setFeeOverride] = useState<Override | null>(null)
  const cost = useFavour ? 0 : (overrideReady(feeOverride) ? feeOverride.amount : listedFee) + scoutCost
  const feeBlocks = !useFavour && ((feeOverride !== null && !overrideReady(feeOverride)) || (randomFee && feeDice.some(v => v === null) && !overrideReady(feeOverride)))
  const shownEligibility = useFavour && availableFavour?.endsWith(':brigands') ? eligibility : option.ordinaryEligibility ?? eligibility
  const restricted = shownEligibility.kind === 'restricted'
  const needsConditions = ['bertha_bestraufrung_high_matriarch_of_the_sisterhood', 'dark_emissary', 'truthsayer', 'khar_mel_the_djinn'].includes(entry.id)
  const [conditionsMet, setConditionsMet] = useState(false)
  const shardCost = entry.id === 'nicodemus_the_cursed_pilgrim' ? 1 : Number(entry.hireCost.text.match(/^(\d+)\s+(?:wyrdstone|treasures?)/i)?.[1] ?? 0)
  const shardFee = shardCost > 0

  async function confirm() {
    const id = crypto.randomUUID()
    const trimmed = name.trim()
    const note = useFavour ? `${reward?.label}: one free Hired Sword; ordinary upkeep afterwards.` : overrideReady(feeOverride) ? overrideNote('Hire fee', `${listedFee} gc`, `${feeOverride.amount} gc`, feeOverride.reason) : randomFee ? `Ninja hire fee: 70 + 3D6 (${feeDice.join(' + ')}) = ${fullFee} gc.` : null
    const result = await commit(
      () => hireHiredSword(roster, entry.id, id, { scouts, luthorRole, equipmentChoice, mounted, ...(useFavour ? { returningFavourReportId: availableFavour } : {}), ...(trimmed ? { name: trimmed } : {}), ...(overrideReady(feeOverride) ? { feeOverride: feeOverride.amount } : halfFrom || randomFee ? { feeOverride: listedFee } : {}) }),
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
        <Button block variant={restricted ? 'danger' : 'primary'} pending={pending} disabled={feeBlocks || (needsConditions && !conditionsMet) || (shardFee && !useFavour && roster.wyrdstone < shardCost)} onClick={() => void confirm()}>
          {shardFee && !useFavour ? `Hire for ${shardCost} wyrdstone shards` : restricted ? `Hire anyway for ${cost} gc` : `Hire for ${cost} gc`}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <RestrictionNotice entry={entry} eligibility={shownEligibility} />
        {availableFavour ? <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={useFavour} onChange={e=>setUseFavour(e.target.checked)} />Use {reward?.label}: hire free, normal upkeep afterwards</label> : null}
        {freeHires.length>1 ? <SelectField label="Free recruitment reward" value={availableFavour??''} onChange={e=>setRewardId(e.target.value)}>{freeHires.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</SelectField>:null}
        {needsConditions ? <label className="flex gap-2 text-sm"><input type="checkbox" checked={conditionsMet} onChange={e => setConditionsMet(e.target.checked)} />The required audience, search or summoning conditions in this character’s rules have been met.</label> : null}
        {shardFee && !useFavour ? <Notice tone="info">{entry.name} requires {shardCost} wyrdstone/treasure to hire. Treasury: {roster.wyrdstone} shards.</Notice> : null}
        {entry.id === 'luthor_wolfenbaum' ? <SelectField label="Luthor’s role — check the role’s hiring restrictions below" value={luthorRole} onChange={e=>setLuthorRole(e.target.value as typeof luthorRole)}><option value="crimson">Crimson Blade of Reikland</option><option value="wizard">Dark Wizard Extraordinaire</option><option value="archer">Master Archer of Drakwald</option></SelectField> : null}
        {entry.id === 'maglah_khan_s_horde'  ? <SelectField label="Hobgoblin Scouts (45 gc each to hire, 20 gc upkeep each)" value={String(scouts)} onChange={e => setScouts(Number(e.target.value))}>{[2,3,4,5].filter(n => n >= existingScouts).map(n => <option key={n} value={n}>{n} Scouts</option>)}</SelectField> : null}
        {randomFee && !useFavour ? <div className="flex flex-wrap gap-2">{feeDice.map((die,index) => <DieField key={index} label={`Hire fee die ${index + 1}`} sides={6} value={die} onChange={v => setFeeDice(previous => previous.map((value,i) => i === index ? v : value))} rollable />)}</div> : null}
        {optionalMount ? <SelectField label="Starting mount" value={mounted ? 'mounted' : 'foot'} onChange={e => setMounted(e.target.value === 'mounted')}><option value="foot">On foot</option><option value="mounted" disabled={optionalMount.fromStash && !roster.stash.some(i => i.itemId === optionalMount.itemId && i.quantity > 0)}>{optionalMount.label}</option></SelectField> : null}
        {equipmentChoices ? <SelectField label="Starting equipment" value={equipmentChoice} onChange={e => setEquipmentChoice(e.target.value)}>{equipmentChoices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</SelectField> : null}
        <TextField label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder={entry.name} autoComplete="off" />
        <div className="grid grid-cols-3 gap-3">
          <KeyValue label="Hire fee" value={`${cost} gc`} />
          {halfFrom ? <p className="col-span-full text-xs text-ink-dim">{halfFrom.districtName}: half the listed {fullFee} gc (map advantage).</p> : null}
          <span className="col-span-2">
            <OverrideField what="the hire fee" suggested={listedFee} value={feeOverride} onChange={setFeeOverride} />
          </span>
          <KeyValue label="Upkeep" value={upkeepText(entry)} />
          <KeyValue label="Treasury after" value={`${roster.gold - cost} gc`} />
        </div>
        <HiredSwordDetail detail={entry.detail} equipment={hiredSwordStartingEquipment(entry.id, entry.detail, luthorRole, equipmentChoice, mounted)} />
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
        {eligibility.reason || text}
      </Notice>
    )
  }
  if (eligibility.kind === 'check') {
    return (
      <Notice tone="info" title="Check the restriction">
        {eligibility.reason || text}
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

/** Stats, equipment, skills, special rules and background — shared with the Dramatis Personae preview, since a persona's write-up is the same shape as a Hired Sword's. */
export function HiredSwordDetail({ detail, equipment }: { detail: HiredSwordSummary['detail']; equipment?: ReturnType<typeof hiredSwordEquipment> }) {
  if (!detail) return <p className="text-sm text-ink-dim">No write-up in the rules data.</p>
  const profile = detail.profiles[0]
  const kit = equipment ?? hiredSwordEquipment(detail)
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
        <ItemLines items={kit} emptyText="No equipment listed" ownerRules={detail.specialRules} />
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
