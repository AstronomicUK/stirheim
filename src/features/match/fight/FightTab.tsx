// The attack calculator: pick one of your warriors and one enemy model, see the exact odds for
// this phase of attacks, then (optionally) walk real dice through it step by step. An out of
// action result can be logged straight to the attacker's "Enemies out" tally.

import { useMemo, useState } from 'react'
import type { BattleSessionView, MatchParticipantView } from '../../../api/matches'
import type { BattleLiveState } from '../../../domain'
import { parryRerollFromItems } from '../../../rules/domain/opponentScenario'
import type { CombatContext, WarbandTemplate, Weapon } from '../../../rules/types'
import type { CampaignHouseRules, RosterWarband } from '../../../rules/types/roster'
import { Button, DieField, Notice, SegmentedControl, SelectField, Spinner } from '../../../ui'
import { equipmentSummary } from '../../roster/shared/names'
import { Card, Section, Tag } from '../../roster/view/bits'
import { addEnemyOut } from '../battle/sheet'
import { combatantLabel, combatantsOf, defaultOffHand, defaultPrimary, loadoutOf, offHandCandidates, type Combatant, type Loadout } from './combatants'
import { combatContextFor, computeOdds, percent, relevantToggles, thresholdText, type FightOdds, type WeaponOdds } from './odds'
import { applyRoll, declineRoll, OUTCOME_LABEL, startPhase, type AttackPlan, type RollState } from './rollThrough'
import { useEnemyRosters } from './useEnemyRosters'

export interface FightTabProps {
  matchId: string
  roster: RosterWarband
  template: WarbandTemplate | undefined
  others: MatchParticipantView[]
  sessions: BattleSessionView[]
  houseRules: CampaignHouseRules
  sheet: BattleLiveState
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void
  readOnly: boolean
}

interface WeaponChoice {
  attackerId: string
  primary: number
  /** Index into the melee list, or -1 for none. */
  offHand: number
}

export function FightTab({ matchId, roster, template, others, sessions, houseRules, sheet, edit, readOnly }: FightTabProps) {
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
  const toggleList = attacker && primary ? relevantToggles(attacker, primary.type, primary) : []
  const active: Partial<CombatContext> = {}
  for (const t of toggleList) if (toggles[t.field]) (active as Record<string, boolean>)[t.field] = true
  const context = combatContextFor(houseRules, active)

  // The engine's exact phase resolution is a few hundred multiplications; cheap enough to run on every render.
  const odds: FightOdds | null =
    attacker && defender && attackerKit && defenderKit && primary
      ? computeOdds({ attacker, attackerKit, defender, defenderKit, primary, offHand: offHandValid ? offHand : null, context, houseRules })
      : null

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
          {toggleList.length > 0 ? (
            <fieldset className="flex min-w-0 flex-col gap-1">
              <legend className="mb-1 text-sm font-medium text-ink-dim">Situation</legend>
              {toggleList.map((t) => (
                <label key={t.field} className="flex min-h-11 items-start gap-3 py-1 text-sm text-ink">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brass" checked={Boolean(toggles[t.field])} onChange={(e) => setToggles((s) => ({ ...s, [t.field]: e.target.checked }))} />
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
            key={`${attacker.id}:${defender.id}:${current?.primary}:${current?.offHand}:${JSON.stringify(context)}`}
            odds={odds}
            attacker={attacker}
            defender={defender}
            defenderKit={defenderKit!}
            readOnly={readOnly}
            onLogKill={() => edit((s) => addEnemyOut(s, attacker.id, 1))}
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
        <span className="font-mono text-sm tabular-nums text-ink">{line}</span>
      </div>
      <p className="text-xs text-ink-dim">
        {equipmentSummary(c.equipment)} · {armourText(kit)}
      </p>
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
      <span className="font-mono text-lg tabular-nums text-ink">{value}</span>
      {sub ? <span className="font-mono text-xs tabular-nums text-ink-dim">{sub}</span> : null}
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
      <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">{percent(value)}</span>
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
  onLogKill: () => void
}

function RollSection({ odds, attacker, defender, defenderKit, readOnly, onLogKill }: RollSectionProps) {
  const [state, setState] = useState<RollState | null>(null)
  const [logged, setLogged] = useState(false)

  function start() {
    const plans: AttackPlan[] = odds.weapons.flatMap((w) =>
      Array.from({ length: w.attacks }, () => ({
        weaponName: w.weapon.name,
        input: w.input,
        parry: { beatsOrMatches: defender.skillIds.includes('master_of_blades'), reroll: defenderKitReroll(defenderKit) },
      })),
    )
    setLogged(false)
    setState(startPhase(plans, defender.stats.W, odds.parryAttempts))
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
                <DieField key={state.log.length} label={state.pending.label} sides={6} value={null} onChange={(v) => v !== null && setState((s) => (s ? applyRoll(s, v) : s))} rollable hideLabel />
                {state.pending.optional ? (
                  <Button variant="ghost" onClick={() => setState((s) => (s ? declineRoll(s) : s))}>
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
                        ? `${defender.name} lost ${state.woundsLost === 1 ? 'a Wound' : `${state.woundsLost} Wounds`} but is still standing.`
                        : `${defender.name} is unharmed.`}
                </span>
              </p>
              {state.worst === 'outOfAction' && attacker.kind !== 'henchman' && !readOnly ? (
                <Button
                  variant="primary"
                  block
                  disabled={logged}
                  onClick={() => {
                    onLogKill()
                    setLogged(true)
                  }}
                >
                  {logged ? `Logged: +1 enemy out for ${attacker.name}` : `Log +1 enemy out for ${attacker.name}`}
                </Button>
              ) : null}
              {state.worst === 'outOfAction' && attacker.kind === 'henchman' ? <p className="text-xs text-ink-dim">Henchmen earn no experience for kills, so there is nothing to log.</p> : null}
              {state.worst === 'outOfAction' && attacker.kind !== 'henchman' ? <p className="text-xs text-ink-dim">The other player marks their own casualty on their sheet.</p> : null}
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
