// The simulator: exact combat odds between any two warriors, and the two analysers (what each +1
// characteristic or each skill would do to the numbers). Sides come from the user's warbands, from
// another roster in one of their campaigns, or from any published unit type with kit picked from
// its list. No dice, nothing saved: a thinking tool.

import { useEffect, useMemo, useState } from 'react'
import { useCampaign, useMyCampaigns } from '../../api/campaigns'
import { useMyWarbands, useWarband } from '../../api/warbands'
import { useSession } from '../../app/session'
import { CHAIN_METRICS, type ChainMetric } from '../../rules/engine/chain'
import { SKILLS } from '../../rules/data/skills'
import { WARBAND_TEMPLATES, findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { findWeapon } from '../../rules/data/weapons'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'
import type { CombatContext, Weapon, WeaponKind } from '../../rules/types'
import type { CampaignHouseRules } from '../../rules/types/roster'
import { Notice, PageHeader, SegmentedControl, SelectField, Spinner, TextField, TwoColumn } from '../../ui'
import { Card, Section, Tag } from '../roster/view/bits'
import { combatantLabel, combatantsOf, defaultOffHand, defaultPrimary, loadoutFor, offHandCandidates, type Combatant } from '../match/fight/combatants'
import { combatContextFor, computeOdds, percent, relevantToggles, thresholdText, type FightOdds } from '../match/fight/odds'
import { combatantFromTemplate, defaultKitFor, defaultTemplateSide, kitOptionsFor, pts, skillGains, statGains, unitsOf, type AnalyserInput, type SideSource, type TemplateSide } from './model'

type Tab = 'odds' | 'stats' | 'skills'

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

export function SimulatorPage() {
  const [tab, setTab] = useState<Tab>('odds')
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
      <TwoColumn
        rail={
          <div className="flex flex-col gap-4">
            <SidePicker title="Your warrior" side={attacker} onChange={setAttacker} resolved={a} campaigns={(campaigns.data ?? []).map((c) => ({ id: c.id, name: c.name }))} />
            <SidePicker title="Their warrior" side={defender} onChange={setDefender} resolved={d} campaigns={(campaigns.data ?? []).map((c) => ({ id: c.id, name: c.name }))} />
            {campaigns.data && campaigns.data.length > 0 ? (
              <SelectField label="House rules from" value={rulesCampaignId} onChange={(e) => setRulesCampaignId(e.target.value)} hint="Armour erosion and the critical tables follow the campaign picked; otherwise the group defaults.">
                <option value="">Group defaults</option>
                {campaigns.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
        }
        railFirst
      >
        <SegmentedControl
          label="What to look at"
          value={tab}
          options={[
            { value: 'odds', label: 'Odds' },
            { value: 'stats', label: 'Stat gains' },
            { value: 'skills', label: 'Skill gains' },
          ]}
          onChange={setTab}
        />
        {a.combatant && d.combatant ? (
          <Fight tab={tab} attacker={a.combatant} defender={d.combatant} houseRules={houseRules} />
        ) : (
          <Notice tone="info">Pick a warrior on each side to see the numbers.</Notice>
        )}
      </TwoColumn>
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

function SidePicker({ title, side, onChange, resolved, campaigns }: { title: string; side: SideState; onChange: (s: SideState) => void; resolved: ResolvedSide; campaigns: { id: string; name: string }[] }) {
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
      <Card className="flex flex-col gap-3 px-4 py-3">
        <SegmentedControl
          label={`${title}: source`}
          value={side.source}
          options={[
            { value: 'mine', label: 'My warbands' },
            { value: 'campaign', label: 'A campaign' },
            { value: 'template', label: 'Any warrior' },
          ]}
          onChange={(source) => onChange({ ...side, source, warbandId: '', combatantId: '' })}
        />
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
          </>
        )}
        {resolved.combatant ? <CombatantSummary c={resolved.combatant} /> : null}
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

function Fight({ tab, attacker, defender, houseRules }: { tab: Tab; attacker: Combatant; defender: Combatant; houseRules: CampaignHouseRules }) {
  const attackerKit = useMemo(() => loadoutFor(attacker), [attacker])
  const defenderKit = useMemo(() => loadoutFor(defender), [defender])
  const weapons: Weapon[] = [...(attackerKit.melee.length > 0 ? attackerKit.melee : [defaultPrimary([])]), ...attackerKit.ranged]
  const melee = attackerKit.melee.length > 0 ? attackerKit.melee : weapons.slice(0, 1)
  const [primaryIndex, setPrimaryIndex] = useState<number | null>(null)
  const [offHandIndex, setOffHandIndex] = useState<number | null>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [metric, setMetric] = useState<ChainMetric>('outOfAction')
  const [role, setRole] = useState<'offensive' | 'defensive'>('offensive')
  const [respectTables, setRespectTables] = useState(true)

  const primary = (primaryIndex !== null && weapons[primaryIndex]) || defaultPrimary(melee)
  const offHandOptions = primary.type === 'melee' ? offHandCandidates(melee, primary) : []
  const offHandDefault = defaultOffHand(melee, primary)
  const offHand = primary.type === 'melee' ? (offHandIndex === null ? offHandDefault : offHandIndex >= 0 ? (melee[offHandIndex] ?? null) : null) : null
  const offHandValid = offHand ? offHandOptions.includes(offHand) : true
  const phase: WeaponKind = primary.type
  const toggleList = relevantToggles(attacker, phase, primary, defenderKit, offHandValid ? offHand : null)
  const active: Partial<CombatContext> = {}
  for (const t of toggleList) (active as Record<string, boolean>)[t.field] = toggles[t.field] ?? Boolean(t.defaultOn)
  const context = combatContextFor(houseRules, active)
  const odds: FightOdds = computeOdds({ attacker, attackerKit, defender, defenderKit, primary, offHand: offHandValid ? offHand : null, context, houseRules })
  const phaseWeapons = offHand && offHandValid && phase === 'melee' ? [primary, offHand] : [primary]
  const input: AnalyserInput = { attacker, attackerKit, defender, defenderKit, phase, weapons: phaseWeapons, context, houseRules }
  const fallback = findWeapon(phase === 'melee' ? 'sword' : 'bow')!

  return (
    <>
      <Section title="The fight">
        <Card className="flex flex-col gap-3 px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label={`${attacker.name} attacks with`} value={String(weapons.indexOf(primary))} onChange={(e) => { setPrimaryIndex(Number(e.target.value)); setOffHandIndex(null) }}>
              {weapons.map((w, i) => (
                <option key={`${w.id}-${i}`} value={i}>
                  {w.name} ({w.type === 'melee' ? 'hand-to-hand' : 'shooting'})
                </option>
              ))}
            </SelectField>
            {primary.type === 'melee' && offHandOptions.length > 0 ? (
              <SelectField label="Other hand" value={offHand && offHandValid ? String(melee.indexOf(offHand)) : '-1'} onChange={(e) => setOffHandIndex(Number(e.target.value))}>
                <option value="-1">Nothing (one weapon)</option>
                {offHandOptions.map((w) => (
                  <option key={melee.indexOf(w)} value={String(melee.indexOf(w))}>
                    {w.name}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
          {toggleList.length > 0 ? (
            <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
              <legend className="mb-1 text-sm font-medium text-ink-dim">Situation</legend>
              {toggleList.map((t) => (
                <label key={t.field} className="flex min-h-9 items-center gap-2 text-sm text-ink" title={t.hint}>
                  <input type="checkbox" className="h-4 w-4 accent-brass" checked={toggles[t.field] ?? Boolean(t.defaultOn)} onChange={(e) => setToggles((s) => ({ ...s, [t.field]: e.target.checked }))} />
                  {t.label}
                </label>
              ))}
            </fieldset>
          ) : null}
        </Card>
      </Section>

      {tab === 'odds' ? <OddsView odds={odds} attacker={attacker} defender={defender} /> : null}
      {tab === 'stats' ? <StatGainsView input={input} metric={metric} setMetric={setMetric} fallback={fallback} /> : null}
      {tab === 'skills' ? <SkillGainsView input={input} metric={metric} setMetric={setMetric} role={role} setRole={setRole} respectTables={respectTables} setRespectTables={setRespectTables} fallback={fallback} /> : null}
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
              <Tile label="To hit" value={thresholdText(w.input.hitThreshold, '—')} sub={percent(w.pHit)} />
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

function MetricSelect({ metric, setMetric }: { metric: ChainMetric; setMetric: (m: ChainMetric) => void }) {
  return <SegmentedControl label="Rank by" value={metric} options={CHAIN_METRICS.map((m) => ({ value: m.id, label: m.label }))} onChange={setMetric} />
}

function StatGainsView({ input, metric, setMetric, fallback }: { input: AnalyserInput; metric: ChainMetric; setMetric: (m: ChainMetric) => void; fallback: Weapon }) {
  const result = useMemo(() => statGains(input, metric, fallback), [input, metric, fallback])
  const label = CHAIN_METRICS.find((m) => m.id === metric)!.label.toLowerCase()
  return (
    <Section title="What +1 to each characteristic would do">
      <Card className="flex flex-col gap-4 px-4 py-4">
        <p className="text-sm leading-relaxed text-ink-dim">
          Each row adds one to a characteristic and re-runs the whole phase both ways: {input.attacker.name} attacking {input.defender.name} with the weapons chosen above, and {input.defender.name} hitting back with {input.defenderKit.melee[0]?.name ?? input.defenderKit.ranged[0]?.name ?? fallback.name}. The figures are the change in {label}, in percentage points.
        </p>
        <MetricSelect metric={metric} setMetric={setMetric} />
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">Attacking · now {percent(result.breakdown.baselineAttack[metric])}</p>
          {result.rows.map((r) => (
            <Bar key={`a-${r.stat}`} label={`+1 ${r.stat}${!r.modeled ? ' (not modelled)' : !r.relevant.offensive ? ' (no effect attacking)' : ''}`} value={r.relevant.offensive && r.modeled ? r.attackGain : 0} signed />
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">Defending · they take {input.attacker.name} out of action {percent(result.breakdown.baselineDefend[metric])} now</p>
          {result.rows.map((r) => (
            <Bar key={`d-${r.stat}`} label={`+1 ${r.stat}${!r.modeled ? ' (not modelled)' : !r.relevant.defensive ? ' (no effect defending)' : ''}`} value={r.relevant.defensive && r.modeled ? r.defendGain : 0} signed />
          ))}
          <p className="text-xs text-ink-dim">Defending figures are improvements: how much less often {input.attacker.name} goes down.</p>
        </div>
      </Card>
    </Section>
  )
}

function SkillGainsView({ input, metric, setMetric, role, setRole, respectTables, setRespectTables, fallback }: { input: AnalyserInput; metric: ChainMetric; setMetric: (m: ChainMetric) => void; role: 'offensive' | 'defensive'; setRole: (r: 'offensive' | 'defensive') => void; respectTables: boolean; setRespectTables: (v: boolean) => void; fallback: Weapon }) {
  const result = useMemo(() => skillGains(input, role, fallback, respectTables), [input, role, fallback, respectTables])
  const gain = (chain: FightOdds['chain']) => (role === 'defensive' ? result.baseline[metric] - chain[metric] : chain[metric] - result.baseline[metric])
  const rows = [...result.rows].sort((x, y) => gain(y.chain) - gain(x.chain))
  const hasTables = Boolean(input.attacker.skillTableIds && input.attacker.skillTableIds.length > 0)
  return (
    <Section title="What each skill would do">
      <Card className="flex flex-col gap-4 px-4 py-4">
        <p className="text-sm leading-relaxed text-ink-dim">
          Every modelled skill {input.attacker.name} could still take, added on its own and the phase re-run. Conditional skills only count when their situation is ticked above.
        </p>
        <SegmentedControl
          label="Role"
          value={role}
          options={[
            { value: 'offensive', label: `Attacking` },
            { value: 'defensive', label: `Defending` },
          ]}
          onChange={setRole}
        />
        <MetricSelect metric={metric} setMetric={setMetric} />
        <label className="flex min-h-9 items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="h-4 w-4 accent-brass" checked={respectTables} onChange={(e) => setRespectTables(e.target.checked)} />
          Only skills on {input.attacker.name}'s lists{!hasTables ? ' (no lists known: showing all)' : ''}
        </label>
        <p className="text-[10px] uppercase tracking-wider text-ink-dim">
          Now: {percent(result.baseline[metric])} · {CHAIN_METRICS.find((m) => m.id === metric)!.label.toLowerCase()}
        </p>
        {rows.length === 0 ? <p className="text-sm text-ink-dim">No modelled skill left to take for this role and phase.</p> : null}
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.skill.id} title={r.skill.description}>
              <Bar label={r.skill.name} value={gain(r.chain)} signed />
            </div>
          ))}
        </div>
      </Card>
    </Section>
  )
}
