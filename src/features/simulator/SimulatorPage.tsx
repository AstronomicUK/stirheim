import { weaponChoiceKey } from '../../rules/resolve/shrineBlessing'
// The simulator: exact combat odds between any two warriors, and the two analysers (what each +1
// characteristic or each skill would do to the numbers). Sides come from the user's warbands, from
// another roster in one of their campaigns, or from any published unit type with kit picked from
// its list. No dice, nothing saved: a thinking tool.

import { useEffect, useMemo, useState } from 'react'
import { useCampaign, useMyCampaigns } from '../../api/campaigns'
import { useMyWarbands, useWarband } from '../../api/warbands'
import { useSession } from '../../app/session'
import { SKILLS } from '../../rules/data/skills'
import { WARBAND_TEMPLATES, findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'
import type { CombatContext, WeaponKind } from '../../rules/types'
import type { CampaignHouseRules } from '../../rules/types/roster'
import { Notice, PageHeader, SelectField, Spinner, TextField } from '../../ui'
import { Card, Section, Tag } from '../roster/view/bits'
import { combatantLabel, combatantsOf, defaultOffHand, defaultPrimary, loadoutFor, offHandCandidates, type Combatant } from '../match/fight/combatants'
import { combatContextFor, computeOdds, percent, relevantToggles, thresholdText, type FightOdds } from '../match/fight/odds'
import { combatantFromTemplate, defaultKitFor, defaultTemplateSide, kitOptionsFor, pts, unitsOf, type SideSource, type TemplateSide } from './model'
import { usePageTitle } from '../onboarding/usePageTitle'

import { StatisticsView, SimulatorTabs } from './StatisticsView'
import { referenceOpponent } from './statistics'

type Mode = 'statistics' | 'simulation'

interface SideState {
  source: SideSource
  warbandId: string
  combatantId: string
  campaignId: string
  template: TemplateSide
}

function initialSide(): SideState {
  return { source: 'mine', warbandId: '', combatantId: '', campaignId: '', template: defaultTemplateSide('mercenaries_reikland') }
}

/** What the player has chosen about the fight itself, kept above the panel so a reload of either side leaves it alone. */
interface FightChoices {
  /** Weapon ids rather than list positions: the list changes when the warrior does. */
  primaryId: string | null
  offHandId: string | null | 'none'
  toggles: Record<string, boolean>
}

const NO_CHOICES: FightChoices = { primaryId: null, offHandId: null, toggles: {} }

export function SimulatorPage() {
  usePageTitle('Simulator')
  const [mode, setMode] = useState<Mode>('statistics')
  const [choices, setChoices] = useState<FightChoices>(NO_CHOICES)
  const [defenderChoices, setDefenderChoices] = useState<FightChoices>(NO_CHOICES)
  const [attacker, setAttacker] = useState<SideState>(initialSide)
  const [defender, setDefender] = useState<SideState>(() => ({ ...initialSide(), source: 'template', template: defaultTemplateSide('skaven_of_clan_eshin') }))
  const [rulesCampaignId, setRulesCampaignId] = useState('')
  const user = useSession((s) => s.user)
  const campaigns = useMyCampaigns(user?.id)
  const rulesCampaign = useCampaign(rulesCampaignId || undefined)
  const houseRules = useMemo(() => applyHouseRuleDefaults(rulesCampaign.data?.campaign.settings.houseRules), [rulesCampaign.data])

  const a = useResolvedSide(attacker)
  const d = useResolvedSide(defender)

  return (
    <>
      <PageHeader eyebrow="Ledger" title="Simulator" description="Exact odds for any fight, and what each characteristic or skill would add. Nothing here is rolled or saved." />
      <div className="flex min-w-0 flex-col gap-5">
        <SimulatorTabs label="Simulator mode" value={mode} onChange={setMode} options={[{ value: 'statistics', label: 'Statistics' }, { value: 'simulation', label: 'Simulation' }]} />
        <div className={mode === 'simulation' ? 'grid min-w-0 grid-cols-2 items-start gap-2 sm:gap-4 [&>section]:min-w-0' : 'min-w-0'}>
          <SidePicker title={mode === 'simulation' ? 'Model one' : 'Your warrior'} side={attacker} onChange={setAttacker} resolved={a} choices={choices} setChoices={setChoices} campaigns={(campaigns.data ?? []).map((c) => ({ id: c.id, name: c.name }))} />
          {mode === 'simulation' && <SidePicker title="Model two" side={defender} onChange={setDefender} resolved={d} choices={defenderChoices} setChoices={setDefenderChoices} campaigns={(campaigns.data ?? []).map((c) => ({ id: c.id, name: c.name }))} />}
        </div>
        {campaigns.data && campaigns.data.length > 0 && <details className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm text-ink-dim">House rules</summary>
          <SelectField label="House rules from" value={rulesCampaignId} onChange={(e) => setRulesCampaignId(e.target.value)}>
            <option value="">Group defaults</option>{campaigns.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        </details>}
        {a.combatant && (mode === 'statistics' || d.combatant) ?
          <Fight defenderChoices={defenderChoices} mode={mode} attacker={a.combatant} defender={mode === 'statistics' ? referenceOpponent(a.combatant) : d.combatant!} houseRules={houseRules} choices={choices} setChoices={setChoices} />
          : a.pending || d.pending ? <Spinner label="Loading the warband" /> : <Notice tone="info">Choose {mode === 'statistics' ? 'a warrior' : 'a warrior on each side'} to see the numbers.</Notice>}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------------------------
// Sides
// ---------------------------------------------------------------------------------------------

interface ResolvedSide {
  combatant: Combatant | null
  /** Everyone on the chosen roster, for the dropdown. */
  options: Combatant[]
  pending: boolean
  error: string | null
}

function useResolvedSide(side: SideState): ResolvedSide {
  const warband = useWarband(side.source !== 'template' && side.warbandId ? side.warbandId : undefined)
  const options = useMemo(() => {
    if (side.source === 'template' || !warband.data) return []
    const roster = warband.data.roster
    return combatantsOf(roster, findWarbandTemplate(roster.warbandTemplateId), roster.name, undefined)
  }, [side.source, warband.data])
  if (side.source === 'template') {
    return { combatant: combatantFromTemplate(side.template), options: [], pending: false, error: null }
  }
  const combatant = options.find((c) => c.id === side.combatantId) ?? options[0] ?? null
  return { combatant, options, pending: Boolean(side.warbandId) && warband.isPending, error: warband.error?.message ?? null }
}

function SidePicker({ title, side, onChange, resolved, campaigns, choices, setChoices }: { choices: FightChoices; setChoices: (next: FightChoices) => void; title: string; side: SideState; onChange: (s: SideState) => void; resolved: ResolvedSide; campaigns: { id: string; name: string }[] }) {
  const user = useSession((s) => s.user)
  const mine = useMyWarbands(side.source === 'mine' ? user?.id : undefined)
  const campaign = useCampaign(side.source === 'campaign' && side.campaignId ? side.campaignId : undefined)
  const warbandChoices = side.source === 'mine' ? (mine.data ?? []).filter((w) => !w.archived).map((w) => ({ id: w.id, name: w.name })) : (campaign.data?.members ?? []).map((m) => ({ id: m.warband.id, name: `${m.warband.name} (${m.display_name})` }))

  // The first warband of a source is picked for the player so the page is never blank.
  useEffect(() => {
    if (side.source !== 'template' && !side.warbandId && warbandChoices.length > 0) onChange({ ...side, warbandId: warbandChoices[0].id, combatantId: '' })
    if (side.source === 'campaign' && !side.campaignId && campaigns.length > 0) onChange({ ...side, campaignId: campaigns[0].id, warbandId: '', combatantId: '' })
  }, [side, warbandChoices, campaigns, onChange])

  const template = findWarbandTemplate(side.template.templateId)
  const kit = useMemo(() => kitOptionsFor(side.template), [side.template])
  const unit = template ? unitsOf(template).find((u) => u.unit.id === side.template.unitId)?.unit : undefined

  return (
    <Section title={title}>
      <Card className="flex min-w-0 flex-col gap-3 px-2 py-3 sm:px-4">
        <SelectField label={`${title}: source`} value={side.source} onChange={(e) => onChange({ ...side, source: e.target.value as SideSource, warbandId: '', combatantId: '' })}>
          <option value="mine">My Warbands</option><option value="campaign">My Campaigns</option><option value="template">Custom Unit</option>
        </SelectField>
        {side.source === 'campaign' ? (
          <SelectField label="Campaign" value={side.campaignId} onChange={(e) => onChange({ ...side, campaignId: e.target.value, warbandId: '', combatantId: '' })}>
            <option value="">Choose a campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        ) : null}
        {side.source !== 'template' ? (
          <>
            <SelectField label="Warband" value={side.warbandId} onChange={(e) => onChange({ ...side, warbandId: e.target.value, combatantId: '' })}>
              <option value="">Choose a warband</option>
              {warbandChoices.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </SelectField>
            {resolved.pending ? <Spinner label="Loading the roster" /> : null}
            {resolved.error ? <Notice tone="error">{resolved.error}</Notice> : null}
            {resolved.options.length > 0 ? (
              <SelectField label="Warrior" value={resolved.combatant?.id ?? ''} onChange={(e) => onChange({ ...side, combatantId: e.target.value })}>
                {resolved.options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {combatantLabel(c)}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </>
        ) : (
          <>
            <SelectField
              label="Warband list"
              value={side.template.templateId}
              onChange={(e) => onChange({ ...side, template: defaultTemplateSide(e.target.value) })}
            >
              {WARBAND_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
            {template ? (
              <SelectField
                label="Warrior type"
                value={side.template.unitId}
                onChange={(e) => {
                  const next = unitsOf(template).find((u) => u.unit.id === e.target.value)?.unit
                  onChange({ ...side, template: { ...side.template, unitId: e.target.value, itemIds: next ? defaultKitFor(template, next) : [] } })
                }}
              >
                {unitsOf(template).map(({ unit: u, role }) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({role})
                  </option>
                ))}
              </SelectField>
            ) : null}
            <details><summary className="cursor-pointer text-sm text-ink-dim">Equipment and skills</summary>
            {kit.length > 0 ? (
              <fieldset className="flex flex-col gap-1">
                <legend className="text-sm font-medium text-ink-dim">Kit from the list</legend>
                <div className="flex flex-wrap gap-1.5">
                  {kit.map((o) => {
                    const id = o.item!.id
                    const on = side.template.itemIds.includes(id)
                    return (
                      <button
                        key={`${o.section}:${o.name}`}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange({ ...side, template: { ...side.template, itemIds: on ? side.template.itemIds.filter((x) => x !== id) : [...side.template.itemIds, id] } })}
                        className={`rounded-full border px-3 py-1 text-xs ${on ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:border-ink-dim'}`}
                      >
                        {o.item!.name}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ) : null}
            {unit ? <SkillsPicker unit={unit} side={side} onChange={onChange} /> : null}
            </details>
          </>
        )}
        {resolved.combatant ? <><WeaponPicker combatant={resolved.combatant} choices={choices} setChoices={setChoices} /><details><summary className="cursor-pointer text-sm text-ink-dim">Warrior details</summary><CombatantSummary c={resolved.combatant} /></details></> : null}
      </Card>
    </Section>
  )
}

function SkillsPicker({ unit, side, onChange }: { unit: { skillTableIds: string[] }; side: SideState; onChange: (s: SideState) => void }) {
  const [query, setQuery] = useState('')
  const pool = SKILLS.filter((s) => s.modeled && (unit.skillTableIds.length === 0 || unit.skillTableIds.includes(s.category)))
  const q = query.trim().toLowerCase()
  const shown = q ? pool.filter((s) => s.name.toLowerCase().includes(q)) : pool.filter((s) => side.template.skillIds.includes(s.id))
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium text-ink-dim">Skills</legend>
      <TextField label="Add a skill" value={query} autoComplete="off" placeholder="Type to search the lists this warrior may use" onChange={(e) => setQuery(e.target.value)} />
      <div className="flex flex-wrap gap-1.5">
        {shown.map((s) => {
          const on = side.template.skillIds.includes(s.id)
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              title={s.description}
              onClick={() => onChange({ ...side, template: { ...side.template, skillIds: on ? side.template.skillIds.filter((x) => x !== s.id) : [...side.template.skillIds, s.id] } })}
              className={`rounded-full border px-3 py-1 text-xs ${on ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:border-ink-dim'}`}
            >
              {s.name}
            </button>
          )
        })}
        {shown.length === 0 && q ? <span className="text-xs text-ink-dim">No modelled skill matches.</span> : null}
      </div>
    </fieldset>
  )
}

function CombatantSummary({ c }: { c: Combatant }) {
  const s = c.stats
  return (
    <div className="flex flex-col gap-1 border-t border-border pt-2 text-xs text-ink-dim">
      <p className="text-sm text-ink">
        {c.name} <span className="text-ink-dim">· {c.typeName}</span>
      </p>
      <p className="tabular-nums">
        M{s.M} WS{s.WS} BS{s.BS} S{s.S} T{s.T} W{s.W} I{s.I} A{s.A} Ld{s.Ld}
      </p>
      {c.traitIds.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {c.traitIds.map((t) => (
            <Tag key={t} tone="neutral">
              {t.replace(/_/g, ' ')}
            </Tag>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// The fight
// ---------------------------------------------------------------------------------------------

function selectedWeapons(combatant: Combatant, choices: FightChoices) {
  const kit = loadoutFor(combatant)
  const melee = kit.melee.length ? kit.melee : [defaultPrimary([])]
  const weapons = [...melee, ...kit.ranged]
  const primary = weapons.find((w) => weaponChoiceKey(w) === choices.primaryId) ?? defaultPrimary(melee)
  const offHandOptions = primary.type === 'melee' ? offHandCandidates(melee, primary) : []
  const preferred = choices.offHandId === 'none' ? null : melee.find((w) => weaponChoiceKey(w) === choices.offHandId) ?? defaultOffHand(melee, primary)
  const offHand = preferred && offHandOptions.includes(preferred) ? preferred : null
  return { kit, weapons, primary, offHand, offHandOptions }
}

function WeaponPicker({ combatant, choices, setChoices }: { combatant: Combatant; choices: FightChoices; setChoices: (next: FightChoices) => void }) {
  const { weapons, primary, offHand, offHandOptions } = selectedWeapons(combatant, choices)
  return <div className="flex min-w-0 flex-col gap-3 border-t border-border pt-3">
    <SelectField label="Attack weapon" value={weaponChoiceKey(primary)} onChange={(e) => setChoices({ ...choices, primaryId: e.target.value, offHandId: null })}>
      {weapons.map((w, i) => <option key={`${w.id}-${i}`} value={weaponChoiceKey(w)}>{w.name} ({w.type === 'melee' ? 'melee' : 'shooting'})</option>)}
    </SelectField>
    {offHandOptions.length > 0 && <SelectField label="Other hand" value={offHand ? weaponChoiceKey(offHand) : 'none'} onChange={(e) => setChoices({ ...choices, offHandId: e.target.value })}>
      <option value="none">Nothing (one weapon)</option>{offHandOptions.map((w,i) => <option key={`${weaponChoiceKey(w)}-${i}`} value={weaponChoiceKey(w)}>{w.name}</option>)}
    </SelectField>}
  </div>
}

function Fight({
  defenderChoices,
  mode,
  attacker,
  defender,
  houseRules,
  choices,
  setChoices,
}: {
  mode: Mode
  defenderChoices: FightChoices
  attacker: Combatant
  defender: Combatant
  houseRules: CampaignHouseRules
  choices: FightChoices
  setChoices: (next: FightChoices) => void
}) {
  const { kit: attackerKit, primary, offHand } = selectedWeapons(attacker, choices)
  const otherWeapons = selectedWeapons(defender, defenderChoices)
  const defenderKit = otherWeapons.kit
  const phase: WeaponKind = primary.type
  const chargingMatters = [primary, ...(offHand ? [offHand] : [])].some((w) => w.strengthBonusFirstTurnOnly || w.strengthBonusMountedChargeOnly || w.chargeBonusAttacks || w.firstTurnBonusAttacks || w.special.includes('mountedChargeStrengthBonus')) || SKILLS.some((s) => attacker.skillIds.includes(s.id) && s.conditionField === 'charging')
  const toggleList = relevantToggles(attacker, phase, primary, defenderKit, offHand).filter((t) => t.field !== 'charging' || chargingMatters)
  const active: Partial<CombatContext> = {}
  for (const t of toggleList) (active as Record<string, boolean>)[t.field] = choices.toggles[t.field] ?? Boolean(t.defaultOn)
  const context = combatContextFor(houseRules, active)
  const fightSetup = { attacker, attackerKit, defender, defenderKit, primary, offHand, context, houseRules, woundsAlreadyLost: defender.woundsLost }
  const odds: FightOdds = computeOdds(fightSetup)
  const reverse = { ...fightSetup, attacker: defender, attackerKit: defenderKit, defender: attacker, defenderKit: attackerKit, primary: otherWeapons.primary, offHand: otherWeapons.offHand, context: combatContextFor(houseRules, defenderChoices.toggles), woundsAlreadyLost: attacker.woundsLost }

  return (
    <>
      {toggleList.length > 0 && <Section title="Situation">
        <Card className="flex flex-col gap-3 px-4 py-3">
          {toggleList.length > 0 ? (
            <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
              <legend className="mb-1 text-sm font-medium text-ink-dim">Situation</legend>
              {toggleList.map((t) => (
                <label key={t.field} className="flex min-h-9 items-center gap-2 text-sm text-ink" title={t.hint}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brass"
                    checked={choices.toggles[t.field] ?? Boolean(t.defaultOn)}
                    onChange={(e) => setChoices({ ...choices, toggles: { ...choices.toggles, [t.field]: e.target.checked } })}
                  />
                  <span>{t.label}{t.field === 'longRange' && t.hint ? <span className="mt-0.5 block text-xs text-ink-dim">{t.hint}</span> : null}</span>
                </label>
              ))}
            </fieldset>
          ) : null}
        </Card>
      </Section>}

      {mode === 'simulation' && <OddsView odds={odds} attacker={attacker} defender={defender} />}
      <StatisticsView setup={fightSetup} reverse={reverse} simulation={mode === 'simulation'} />
    </>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-md bg-surface-low px-2 py-2 text-center">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className="text-lg tabular-nums text-ink">{value}</span>
      {sub ? <span className="text-xs tabular-nums text-ink-dim">{sub}</span> : null}
    </div>
  )
}

function Bar({ label, value, signed = false }: { label: string; value: number; signed?: boolean }) {
  const width = Math.max(0, Math.min(100, Math.abs(value) * 100))
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-ink-dim" title={label}>
        {label}
      </span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-low" aria-hidden>
        <div className={`h-full rounded-full ${signed && value < 0 ? 'bg-accent' : 'bg-brass'}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-14 shrink-0 text-right tabular-nums text-ink">{signed ? `${pts(value)} pts` : percent(value)}</span>
    </div>
  )
}

function OddsView({ odds, attacker, defender }: { odds: FightOdds; attacker: Combatant; defender: Combatant }) {
  const injury = odds.weapons[0]?.injury
  return (
    <Section title="Odds" aside={`${odds.attacks === 1 ? '1 attack' : `${odds.attacks} attacks`} this phase`}>
      <Card className="flex flex-col gap-4 px-4 py-4">
        {odds.weapons.map((w, i) => (
          <div key={`${w.weapon.id}-${i}`} className="flex flex-col gap-2">
            <p className="text-sm text-ink">
              <span className="font-medium">{w.weapon.name}</span>
              <span className="text-ink-dim">
                {' '}
                · {w.attacks === 1 ? '1 attack' : `${w.attacks} attacks`} · {odds.phase === 'melee' ? `WS ${w.ws}, ` : ''}S {w.strength}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <Tile label="To hit" value={w.pHit === 1 ? 'Automatic' : thresholdText(w.input.hitThreshold, '—')} sub={percent(w.pHit)} />
              <Tile label="To wound" value={thresholdText(w.input.woundThreshold, '—')} sub={w.input.woundThreshold === null ? 'cannot' : percent(w.pWound / Math.max(w.pHit, 1e-9))} />
              <Tile label="Their save" value={thresholdText(w.input.armourThreshold, 'none')} sub={w.input.armourThreshold === null ? '' : `${percent(1 - w.pThroughSaves)} saved`} />
            </div>
          </div>
        ))}
        {injury ? (
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-dim">A wound that gets through</p>
            <div className="grid grid-cols-3 gap-1.5">
              <Tile label="Knocked down" value={percent(injury.knockedDown / Math.max(1e-9, 1 - injury.none))} />
              <Tile label="Stunned" value={percent(injury.stunned / Math.max(1e-9, 1 - injury.none))} />
              <Tile label="Out of action" value={percent(injury.outOfAction / Math.max(1e-9, 1 - injury.none))} />
            </div>
          </div>
        ) : null}
        {odds.phase === 'melee' ? (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-dim">Who strikes first</p>
            <p className="text-sm text-ink">{odds.strikeOrder}</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">
            {attacker.name} against {defender.name}, whole phase
          </p>
          <Bar label="At least one hit" value={odds.chain.anyHit} />
          <Bar label="A wound gets through" value={odds.chain.anyWound} />
          <Bar label="Knocked down or worse" value={odds.chain.knockedDownOrWorse} />
          <Bar label="Stunned or worse" value={odds.chain.stunnedOrWorse} />
          <Bar label="Out of action" value={odds.chain.outOfAction} />
          <Bar label="A critical hit" value={odds.chain.anyCrit} />
        </div>
        {odds.notes.length > 0 ? (
          <ul className="flex flex-col gap-1 border-t border-border pt-3 text-xs text-ink-dim">
            {odds.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        ) : null}
      </Card>
    </Section>
  )
}
