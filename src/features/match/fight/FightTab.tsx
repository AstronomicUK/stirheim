// The attack calculator: pick one of your warriors and one enemy model, see the exact odds for
// this phase of attacks, then (optionally) walk real dice through it step by step. An out of
// action result can be logged straight to the attacker's "Enemies out" tally.

import { useMemo, useState } from 'react'
import type { BattleSessionView, MatchParticipantView } from '../../../api/matches'
import type { AttackEventPayload, BattleLiveState } from '../../../domain'
import { parryRerollFromItems } from '../../../rules/domain/opponentScenario'
import type { CombatContext, WarbandTemplate, Weapon } from '../../../rules/types'
import type { CampaignHouseRules, RosterWarband } from '../../../rules/types/roster'
import { Button, DieField, Notice, SegmentedControl, SelectField, Spinner, Stepper } from '../../../ui'
import { Card, ItemLines, Section, Tag } from '../../roster/view/bits'
import { combatantLabel, combatantsOf, defaultOffHand, defaultPrimary, loadoutOf, offHandCandidates, type Combatant, type Loadout } from './combatants'
import { combatContextFor, computeOdds, percent, relevantToggles, thresholdText, type FightOdds, type WeaponOdds } from './odds'
import { applyRoll, declineRoll, OUTCOME_LABEL, startPhase, type AttackPlan, type Outcome, type RollState } from './rollThrough'
import { useEnemyRosters } from './useEnemyRosters'

export interface FightTabProps {
  matchId: string
  roster: RosterWarband
  template: WarbandTemplate | undefined
  others: MatchParticipantView[]
  sessions: BattleSessionView[]
  houseRules: CampaignHouseRules
  /** The player's sheet with the shared log laid over it (read only here). */
  sheet: BattleLiveState
  readOnly: boolean
  /** Append a result to the shared combat log; both sheets pick it up. */
  onLogEvent: (payload: AttackEventPayload) => Promise<void>
}

interface WeaponChoice {
  attackerId: string
  primary: number
  /** Index into the melee list, or -1 for none. */
  offHand: number
}

/** What earlier fights this battle established about a target, on this phone (the other player's sheet is read-only). */
interface TargetMemory {
  /** Wounds lost, beyond what their sheet says. */
  woundsLost: number
  /** Turn in which their parry was used. */
  parryUsedTurn: number | null
  /** Worst thing that happened to them this turn, and when. */
  worst: { turn: number; label: string } | null
}

export function FightTab({ matchId, roster, template, others, sessions, houseRules, sheet, readOnly, onLogEvent }: FightTabProps) {
  const enemies = useEnemyRosters(matchId, others)

  const mine = useMemo(() => combatantsOf(roster, template, roster.name, sheet), [roster, template, sheet])
  const targets = useMemo(
    () =>
      enemies.warbands.flatMap((w) => {
        const session = sessions.find((s) => s.warband_id === w.participant.warband_id)
        return combatantsOf(w.roster, w.template, w.participant.warband_name, session?.live_state)
      }),
    [enemies.warbands, sessions],
  )

  const [attackerId, setAttackerId] = useState<string | null>(null)
  const [defenderId, setDefenderId] = useState<string | null>(null)
  const attacker = mine.find((c) => c.id === attackerId) ?? mine.find((c) => !c.out) ?? mine[0]
  const defender = targets.find((c) => c.id === defenderId) ?? targets.find((c) => !c.out) ?? targets[0]
  // Pin the defaults once chosen (state adjusted during render, the React way), so a logged kill that marks
  // the target out of action does not swap the fight under the player.
  if (attackerId === null && attacker) setAttackerId(attacker.id)
  if (defenderId === null && defender) setDefenderId(defender.id)

  const attackerKit = useMemo(() => (attacker ? loadoutOf(attacker.equipment) : null), [attacker])
  const defenderKit = useMemo(() => (defender ? loadoutOf(defender.equipment) : null), [defender])

  // Weapon choice follows the attacker: a new attacker gets sensible defaults.
  const [choice, setChoice] = useState<WeaponChoice | null>(null)
  const weapons: Weapon[] = attackerKit ? [...(attackerKit.melee.length > 0 ? attackerKit.melee : [defaultPrimary([])]), ...attackerKit.ranged] : []
  const melee = attackerKit && attackerKit.melee.length > 0 ? attackerKit.melee : weapons.slice(0, 1)
  const current: WeaponChoice | null = attacker
    ? choice && choice.attackerId === attacker.id && choice.primary < weapons.length
      ? choice
      : (() => {
          const primary = defaultPrimary(melee)
          const primaryIndex = Math.max(0, weapons.indexOf(primary))
          const off = defaultOffHand(melee, primary)
          return { attackerId: attacker.id, primary: primaryIndex, offHand: off ? melee.indexOf(off) : -1 }
        })()
    : null
  const primary = current ? weapons[current.primary] : null
  const offHandOptions = primary && primary.type === 'melee' ? offHandCandidates(melee, primary) : []
  const offHand = current && current.offHand >= 0 && primary?.type === 'melee' ? melee[current.offHand] ?? null : null
  const offHandValid = offHand ? offHandOptions.includes(offHand) : true

  const [toggles, setToggles] = useState<Record<string, boolean>>({})

  // Carry-over between fights: the target's remaining Wounds (their sheet, or what we saw happen here),
  // whether their one parry this turn is spent, and how many of the attacker's attacks go at them.
  const [memory, setMemory] = useState<Record<string, TargetMemory>>({})
  const [woundsOverride, setWoundsOverride] = useState<{ id: string; value: number } | null>(null)
  const [parryOverride, setParryOverride] = useState<{ id: string; turn: number; used: boolean } | null>(null)
  const [attackLimitChoice, setAttackLimitChoice] = useState<{ key: string; value: number } | null>(null)
  const targetMemory = defender ? memory[defender.id] : undefined
  const woundsAlreadyLost = defender
    ? woundsOverride?.id === defender.id
      ? woundsOverride.value
      : Math.min(defender.stats.W, Math.max(defender.woundsLost, targetMemory?.woundsLost ?? 0))
    : 0
  const parryUsed = defender
    ? parryOverride?.id === defender.id && parryOverride.turn === sheet.turn
      ? parryOverride.used
      : targetMemory?.parryUsedTurn === sheet.turn
    : false
  const toggleList = attacker && primary ? relevantToggles(attacker, primary.type, primary, defenderKit ?? undefined) : []
  const active: Partial<CombatContext> = {}
  for (const t of toggleList) (active as Record<string, boolean>)[t.field] = toggles[t.field] ?? Boolean(t.defaultOn)
  const context = combatContextFor(houseRules, active)

  // The engine's exact phase resolution is a few hundred multiplications; cheap enough to run on every render.
  const attackKey = attacker && defender && current ? `${attacker.id}:${defender.id}:${current.primary}:${current.offHand}` : ''
  const attackLimit = attackLimitChoice?.key === attackKey ? attackLimitChoice.value : undefined
  const odds: FightOdds | null =
    attacker && defender && attackerKit && defenderKit && primary
      ? computeOdds({ attacker, attackerKit, defender, defenderKit, primary, offHand: offHandValid ? offHand : null, context, houseRules, woundsAlreadyLost, parryUsed, attackLimit })
      : null

  function rememberFight(state: RollState) {
    if (!defender) return
    const turn = sheet.turn
    const harmful: Outcome[] = ['wounded', 'knockedDown', 'stunned', 'outOfAction']
    setMemory((m) => {
      const prev = m[defender.id]
      const worstLabel = state.worst && harmful.includes(state.worst) ? OUTCOME_LABEL[state.worst] : null
      return {
        ...m,
        [defender.id]: {
          woundsLost: Math.max(prev?.woundsLost ?? 0, state.woundsLost),
          parryUsedTurn: state.parriesLeft < (odds?.parryAttempts ?? 0) ? turn : (prev?.parryUsedTurn ?? null),
          worst: worstLabel ? { turn, label: worstLabel } : prev?.worst?.turn === turn ? prev.worst : null,
        },
      }
    })
    setWoundsOverride(null)
    setParryOverride(null)
  }

  if (mine.length === 0) return <Notice tone="info" title="Nobody to attack with">None of your warriors are fit to fight this game.</Notice>

  return (
    <>
      <Section title="Attacker">
        <SelectField label="Your warrior" hideLabel value={attacker?.id ?? ''} onChange={(e) => setAttackerId(e.target.value)}>
          {mine.map((c) => (
            <option key={c.id} value={c.id}>
              {combatantLabel(c)}
              {c.out ? ' (out of action)' : ''}
            </option>
          ))}
        </SelectField>
        {attacker && attackerKit ? <CombatantLine c={attacker} kit={attackerKit} /> : null}
      </Section>

      <Section title="Target">
        {enemies.isPending && targets.length === 0 ? (
          <div className="flex justify-center py-4">
            <Spinner label="Loading the enemy rosters" />
          </div>
        ) : null}
        {enemies.error ? <Notice tone="error">{enemies.error}</Notice> : null}
        {!enemies.isPending && targets.length === 0 ? <p className="text-sm text-ink-dim">No enemy models to pick from.</p> : null}
        {targets.length > 0 ? (
          <SelectField label="Enemy model" hideLabel value={defender?.id ?? ''} onChange={(e) => setDefenderId(e.target.value)}>
            {enemies.warbands.map((w) => (
              <optgroup key={w.participant.warband_id} label={w.participant.warband_name}>
                {targets
                  .filter((c) => c.warbandId === w.roster.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {combatantLabel(c)}
                      {c.out ? ' (out of action)' : ''}
                    </option>
                  ))}
              </optgroup>
            ))}
          </SelectField>
        ) : null}
        {defender && defenderKit ? <CombatantLine c={defender} kit={defenderKit} defending /> : null}
        {defender && (defender.stats.W > 1 || odds?.parryAttempts || parryUsed || targetMemory?.worst?.turn === sheet.turn) ? (
          <Card className="flex flex-col gap-3 px-4 py-3">
            {defender.stats.W > 1 ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-ink-dim">Wounds already lost</span>
                  <span className="text-xs text-ink-dim">
                    {defender.stats.W - woundsAlreadyLost} of {defender.stats.W} left
                    {defender.woundsLost > 0 ? ' · from their sheet' : targetMemory && targetMemory.woundsLost > 0 ? ' · from earlier fights here' : ''}
                  </span>
                </div>
                <Stepper value={woundsAlreadyLost} onChange={(v) => setWoundsOverride({ id: defender.id, value: v })} label={`wounds already lost by ${defender.name}`} max={defender.stats.W} />
              </div>
            ) : null}
            {odds?.parryAttempts || parryUsed ? (
              <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
                <input type="checkbox" className="h-5 w-5 shrink-0 accent-brass" checked={parryUsed} onChange={(e) => setParryOverride({ id: defender.id, turn: sheet.turn, used: e.target.checked })} />
                <span>
                  Parry already used this turn
                  <span className="block text-xs text-ink-dim">One parry per turn, whoever attacks. Resets when the turn counter moves.</span>
                </span>
              </label>
            ) : null}
            {targetMemory?.worst && targetMemory.worst.turn === sheet.turn ? (
              <p className="text-xs text-ink-dim">
                Earlier this turn: {targetMemory.worst.label.toLowerCase()}. If this fight ends worse, the worse result stands.
              </p>
            ) : null}
          </Card>
        ) : null}
      </Section>

      {attacker && current && primary ? (
        <Section title="Weapon">
          <SegmentedControl
            label="Weapon"
            options={weapons.map((_, i) => ({ value: String(i), label: weaponLabel(weapons, i) }))}
            value={String(current.primary)}
            onChange={(v) => {
              const index = Number(v)
              const next = weapons[index]
              const off = next.type === 'melee' ? defaultOffHand(melee, next) : null
              setChoice({ attackerId: attacker.id, primary: index, offHand: off ? melee.indexOf(off) : -1 })
            }}
          />
          {primary.type === 'melee' && offHandOptions.length > 0 ? (
            <SelectField
              label="Other hand"
              value={offHandValid && offHand ? String(melee.indexOf(offHand)) : '-1'}
              onChange={(e) => setChoice({ ...current, offHand: Number(e.target.value) })}
              hint="A second hand weapon gives one extra attack."
            >
              <option value="-1">Nothing (one weapon)</option>
              {offHandOptions.map((w) => (
                <option key={melee.indexOf(w)} value={String(melee.indexOf(w))}>
                  {w.name}
                </option>
              ))}
            </SelectField>
          ) : null}
          {odds && odds.fullAttacks > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink-dim">Attacks at this target</span>
                <span className="text-xs text-ink-dim">Fighting more than one enemy? Split the {odds.fullAttacks} attacks as you like.</span>
              </div>
              <Stepper value={odds.attacks} onChange={(v) => setAttackLimitChoice({ key: attackKey, value: v })} label={`attacks at ${defender?.name ?? 'the target'}`} min={1} max={odds.fullAttacks} />
            </div>
          ) : null}
          {toggleList.length > 0 ? (
            <fieldset className="flex min-w-0 flex-col gap-1">
              <legend className="mb-1 text-sm font-medium text-ink-dim">Situation</legend>
              {toggleList.map((t) => (
                <label key={t.field} className="flex min-h-11 items-start gap-3 py-1 text-sm text-ink">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brass" checked={toggles[t.field] ?? Boolean(t.defaultOn)} onChange={(e) => setToggles((s) => ({ ...s, [t.field]: e.target.checked }))} />
                  <span>
                    {t.label}
                    {t.hint ? <span className="block text-xs text-ink-dim">{t.hint}</span> : null}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
        </Section>
      ) : null}

      {odds && attacker && defender ? (
        <>
          <OddsSection odds={odds} attacker={attacker} defender={defender} />
          <RollSection
            key={`${attackKey}:${JSON.stringify(context)}`}
            odds={odds}
            attacker={attacker}
            defender={defender}
            defenderKit={defenderKit!}
            readOnly={readOnly}
            onLog={(state) =>
              onLogEvent({
                attacker_warband_id: attacker.warbandId,
                attacker_id: attacker.id,
                attacker_kind: attacker.kind === 'henchman' ? 'group' : 'hero',
                attacker_name: attacker.name,
                target_warband_id: defender.warbandId,
                target_id: defender.id,
                target_kind: defender.kind === 'henchman' ? 'group' : 'hero',
                target_name: defender.name,
                target_size: defender.groupSize ?? 1,
                wounds_lost: Math.max(0, state.woundsLost - odds.woundsAlreadyLost),
                out_of_action: state.worst === 'outOfAction',
                kill: state.worst === 'outOfAction' && attacker.kind !== 'henchman',
                outcome: state.worst ? OUTCOME_LABEL[state.worst] : 'No effect',
                turn: sheet.turn,
              })
            }
            onFinished={rememberFight}
          />
        </>
      ) : null}
    </>
  )
}

function weaponLabel(weapons: Weapon[], index: number): string {
  const w = weapons[index]
  const same = weapons.filter((x) => x.id === w.id)
  if (same.length === 1) return w.name
  const n = weapons.slice(0, index + 1).filter((x) => x.id === w.id).length
  return `${w.name} (${n})`
}

function armourText(kit: Loadout): string {
  const parts: string[] = []
  if (kit.armour.type !== 'none') parts.push(`${kit.armour.type} armour`)
  if (kit.armour.shield) parts.push('shield')
  if (kit.armour.kiteShield) parts.push('kite shield')
  if (kit.armour.pavise) parts.push('pavise')
  if (kit.armour.buckler) parts.push('buckler')
  if (kit.helmet) parts.push('helmet')
  return parts.length > 0 ? parts.join(', ') : 'no armour'
}

function CombatantLine({ c, kit, defending = false }: { c: Combatant; kit: Loadout; defending?: boolean }) {
  const s = c.stats
  const line = defending ? `WS ${s.WS} · T ${s.T} · W ${s.W}` : `WS ${s.WS} · BS ${s.BS} · S ${s.S} · A ${s.A}`
  return (
    <Card className="flex flex-col gap-1 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-sm text-ink">{c.typeName}</span>
        <span className="text-sm tabular-nums text-ink">{line}</span>
      </div>
      <ItemLines items={c.equipment} emptyText="No equipment" />
      <p className="text-xs text-ink-dim">{armourText(kit)}</p>
      {c.traitIds.length > 0 || c.skillIds.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {c.traitIds.map((t) => (
            <Tag key={t} tone="neutral">
              {t.replace(/_/g, ' ').replace('5plus', '5+')}
            </Tag>
          ))}
        </div>
      ) : null}
    </Card>
  )
}

// ---------------------------------------------------------------------------------------------
// Odds
// ---------------------------------------------------------------------------------------------

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-md bg-surface-low px-2 py-2 text-center">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className="text-lg tabular-nums text-ink">{value}</span>
      {sub ? <span className="text-xs tabular-nums text-ink-dim">{sub}</span> : null}
    </div>
  )
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 shrink-0 text-ink-dim">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-low" aria-hidden>
        <div className="h-full rounded-full bg-brass" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right tabular-nums text-ink">{percent(value)}</span>
    </div>
  )
}

function WeaponRow({ w, phase }: { w: WeaponOdds; phase: FightOdds['phase'] }) {
  const save = w.input.armourThreshold
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink">
        <span className="font-medium">{w.weapon.name}</span>
        <span className="text-ink-dim">
          {' '}
          · {w.attacks === 1 ? '1 attack' : `${w.attacks} attacks`} · {phase === 'melee' ? `WS ${w.ws}, ` : ''}S {w.strength}
        </span>
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        <Tile label="To hit" value={thresholdText(w.input.hitThreshold, '—')} sub={percent(w.pHit)} />
        <Tile label="To wound" value={thresholdText(w.input.woundThreshold, '—')} sub={w.input.woundThreshold === null ? 'cannot' : percent(w.pWound / Math.max(w.pHit, 1e-9))} />
        <Tile label="Their save" value={thresholdText(save, 'none')} sub={save === null ? '' : `${percent(1 - w.pThroughSaves)} saved`} />
      </div>
    </div>
  )
}

function OddsSection({ odds, attacker, defender }: { odds: FightOdds; attacker: Combatant; defender: Combatant }) {
  const injury = odds.weapons[0]?.injury
  return (
    <Section title="Odds" aside={`${odds.attacks === 1 ? '1 attack' : `${odds.attacks} attacks`} this phase`}>
      <Card className="flex flex-col gap-4 px-4 py-4">
        {odds.weapons.map((w, i) => (
          <WeaponRow key={`${w.weapon.id}-${i}`} w={w} phase={odds.phase} />
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
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">
            {attacker.name} against {defender.name}, whole phase
          </p>
          <Bar label="At least one hit" value={odds.chain.anyHit} />
          <Bar label="A wound gets through" value={odds.chain.anyWound} />
          <Bar label="Knocked down or worse" value={odds.chain.knockedDownOrWorse} />
          <Bar label="Stunned or worse" value={odds.chain.stunnedOrWorse} />
          <Bar label="Out of action" value={odds.chain.outOfAction} />
        </div>
        <ul className="flex flex-col gap-1 border-t border-border pt-3 text-xs text-ink-dim">
          {odds.chain.anyCrit > 0 ? (
            <li>
              Critical hit {percent(odds.chain.anyCrit)} ({odds.weapons[0]?.input.critTable} table); out of action given a critical {percent(odds.chain.ooaGivenCrit)}.
            </li>
          ) : (
            <li>No critical hits are possible against this target.</li>
          )}
          {odds.parryAttempts > 0 ? <li>{defender.name} may parry {odds.parryAttempts === 1 ? 'one hit' : `${odds.parryAttempts} hits`} this phase; that is already in the numbers.</li> : null}
          {odds.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}

// ---------------------------------------------------------------------------------------------
// Roll it through
// ---------------------------------------------------------------------------------------------

interface RollSectionProps {
  odds: FightOdds
  attacker: Combatant
  defender: Combatant
  defenderKit: Loadout
  readOnly: boolean
  /** Write the finished fight to the shared combat log. */
  onLog: (state: RollState) => Promise<void>
  /** Called once when the last roll lands, so the tab can carry Wounds and the parry into the next fight. */
  onFinished: (state: RollState) => void
}

function RollSection({ odds, attacker, defender, defenderKit, readOnly, onLog, onFinished }: RollSectionProps) {
  const [state, setState] = useState<RollState | null>(null)
  const [logged, setLogged] = useState<'no' | 'saving' | 'yes' | 'failed'>('no')
  const [logError, setLogError] = useState<string | null>(null)

  function start() {
    const plans: AttackPlan[] = odds.weapons.flatMap((w) =>
      Array.from({ length: w.attacks }, () => ({
        weaponName: w.weapon.name,
        input: w.input,
        parry: { beatsOrMatches: defender.skillIds.includes('master_of_blades'), reroll: defenderKitReroll(defenderKit) },
      })),
    )
    setLogged('no')
    setLogError(null)
    setState(startPhase(plans, defender.stats.W, odds.parryAttempts, odds.woundsAlreadyLost))
  }

  async function log() {
    if (!state) return
    setLogged('saving')
    setLogError(null)
    try {
      await onLog(state)
      setLogged('yes')
    } catch (e) {
      setLogged('failed')
      setLogError(e instanceof Error ? e.message : 'Could not write to the log.')
    }
  }

  function advance(step: (s: RollState) => RollState) {
    setState((s) => {
      if (!s) return s
      const next = step(s)
      if (next.done && !s.done) queueMicrotask(() => onFinished(next))
      return next
    })
  }

  const canRoll = odds.attacks > 0
  return (
    <Section title="Roll it through" aside={state ? `${state.outcomes.length} of ${state.plans.length} rolled` : undefined}>
      {!state ? (
        <Card className="flex flex-col gap-3 px-4 py-4">
          <p className="text-sm text-ink-dim">
            Roll your dice (or tap Roll) one step at a time: to hit, parry, to wound, criticals, saves and injury. The result can be logged to your tally.
          </p>
          <Button variant="secondary" block disabled={!canRoll} onClick={start}>
            Start rolling
          </Button>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3 px-4 py-4">
          {state.pending ? (
            <div className="flex flex-col gap-2 rounded-md border border-brass/50 bg-surface-low px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{state.pending.label}</p>
                  <p className="text-xs text-ink-dim">{state.pending.detail}</p>
                </div>
                <Tag tone={state.pending.who === 'attacker' ? 'brass' : 'neutral'}>{state.pending.who === 'attacker' ? attacker.name : defender.name}</Tag>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <DieField key={state.log.length} label={state.pending.label} sides={6} value={null} onChange={(v) => v !== null && advance((s) => applyRoll(s, v))} rollable hideLabel />
                {state.pending.optional ? (
                  <Button variant="ghost" onClick={() => advance(declineRoll)}>
                    No parry
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {state.log.length > 0 ? (
            <ol className="flex flex-col gap-1 text-sm" aria-label="Dice log">
              {state.log.map((line, i) => (
                <li key={i} className={line.tone === 'good' ? 'text-ink' : line.tone === 'bad' ? 'text-ink-dim' : 'text-ink-dim'}>
                  {line.text}
                </li>
              ))}
            </ol>
          ) : null}

          {state.done ? (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p role="status" className="text-sm text-ink">
                <span className="font-medium">Result: {state.worst ? OUTCOME_LABEL[state.worst] : 'Nothing happened'}.</span>{' '}
                <span className="text-ink-dim">
                  {state.worst === 'outOfAction'
                    ? `${defender.name} is out of action.`
                    : state.worst === 'stunned' || state.worst === 'knockedDown'
                      ? `${defender.name} is ${OUTCOME_LABEL[state.worst].toLowerCase()}.`
                      : state.worst === 'wounded'
                        ? `${defender.name} is down to ${Math.max(0, defender.stats.W - state.woundsLost)} of ${defender.stats.W} Wounds but still standing.`
                        : `${defender.name} is unharmed.`}
                </span>
              </p>
              {state.worst && ['wounded', 'knockedDown', 'stunned', 'outOfAction'].includes(state.worst) && !readOnly ? (
                <Button variant="primary" block disabled={logged === 'yes'} pending={logged === 'saving'} onClick={() => void log()}>
                  {logged === 'yes' ? 'Logged to both sheets' : 'Log to both sheets'}
                </Button>
              ) : null}
              {logError ? <Notice tone="error">{logError}</Notice> : null}
              {state.worst === 'outOfAction' && attacker.kind === 'henchman' ? <p className="text-xs text-ink-dim">Henchmen earn no experience for kills; the log still marks the casualty for the other side.</p> : null}
              {state.worst && ['wounded', 'knockedDown', 'stunned', 'outOfAction'].includes(state.worst) ? (
                <p className="text-xs text-ink-dim">Logging puts the {state.worst === 'outOfAction' ? 'kill and the casualty' : 'Wounds lost'} on both sheets at once, and can be reverted from the Log tab.</p>
              ) : null}
            </div>
          ) : null}

          <Button variant="ghost" block onClick={() => setState(null)}>
            {state.done ? 'Start again' : 'Abandon these rolls'}
          </Button>
        </Card>
      )}
    </Section>
  )
}

/** Mirrors the engine's parry reroll rule (buckler + sword, Dwarf axes, fighting claws, iron fists). */
function defenderKitReroll(kit: Loadout): boolean {
  return parryRerollFromItems(kit.melee, kit.armour)
}
