// Casting, at the table. Pick the wizard, pick the spell, switch on whatever he is spending, and
// walk the dice: 2D6 against the Difficulty, a re-roll if he has one to spend, then the enemy's
// chance to dispel. Every roll is shown as dice rather than described, and the result of each step
// is confirmed before the next is asked for.

import { useMemo, useRef, useState } from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {useBattleTurns} from '../../../api/battleTurns'
import {useBattleDispels,recordStaffDispel,dispelKey,type StaffDispelInput} from '../../../api/battleDispels'
import type { BattleLiveState } from '../../../domain'
import { castsThisTurn, rerollsSpent, withCast, withRollAttempt } from '../../../domain'
import {
  applyCastRoll,
  availableRerolls,
  CAST_OUTCOME_LABEL,
  declineCastStep,
  describeCast,
  dispelsFor,
  selectDispelSource,
  spendReroll,
  startCast,
  profileForSpell,
  type CasterProfile,
  type CastState,
} from '../../../rules/resolve/casting'
import { castersOf } from './casters'
import { SpellDamage } from './SpellDamage'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband, RosterHero } from '../../../rules/types/roster'
import type { Spell } from '../../../rules/types/magic'
import { Button, DicePicker, HoverCard, Icon, Notice, RollResult, SelectField, Sheet } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { FightBox } from './cards'
import {isHeroOut} from './sheet'
import type { BattleSessionView, MatchParticipantView } from '../../../api/matches'
import { useEnemyRosters } from '../fight/useEnemyRosters'

export interface CastTabProps {
  matchId: string
  roster: RosterWarband
  template: WarbandTemplate | undefined
  others: MatchParticipantView[]
  sessions?: BattleSessionView[]
  sheet: BattleLiveState
  readOnly: boolean
  edit?: (fn: (state: BattleLiveState) => BattleLiveState) => void
}

export function CastTab({ matchId, roster, template, others, sessions=[], sheet, readOnly, edit }: CastTabProps) {
  const turns=useBattleTurns(matchId)
  const dispels=useBattleDispels(matchId)
  const queryClient=useQueryClient()
  const [savingDispel,setSavingDispel]=useState(false)
  const [hasPendingDispel,setHasPendingDispel]=useState(false)
  const [dispelError,setDispelError]=useState<string|null>(null)
  const pendingDispel=useRef<{next:CastState;input:StaffDispelInput}|null>(null)
  const savingRef=useRef(false)
  const casters = useMemo(() => castersOf(roster, template), [roster, template])
  const enemies = useEnemyRosters(matchId, others)
  // Include hired bearers and exclude warriors marked out on the shared battle sheets.
  const enemyDispel = useMemo(
    () => enemies.warbands.flatMap((w) => [...w.roster.heroes,...w.roster.hiredSwords].filter(h=>h.status==='active' && !sessions.some(session=>session.warband_id===w.roster.id && isHeroOut(session.live_state,h.id))).flatMap(h=>dispelsFor(h as RosterHero)).filter(source=>source.limit!=='perTurn' || (!!turns.data && !turns.data.finished && !!dispels.data && !dispels.data.some(d=>d.source_hero_id===source.ownerId && d.round===turns.data!.round && d.active_warband_id===turns.data!.turn_order[turns.data!.active_index])))),
    [enemies.warbands,turns.data,dispels.data,sessions],
  )
  const needsSharedTurns=!turns.data && casters.some(c=>c.spells.some(s=>profileForSpell(c,s.spell.id).lore.id!=='prayers_of_sigmar')) && enemies.warbands.some(w=>[...w.roster.heroes,...w.roster.hiredSwords].some(h=>h.status==='active' && dispelsFor(h as RosterHero).some(source=>source.id==='staff_of_light')))
  const [casterId, setCasterId] = useState<string | null>(casters[0]?.heroId ?? null)
  const caster = casters.find((c) => c.heroId === casterId) ?? casters[0]
  const [state, setState] = useState<CastState | null>(null)
  const [castingPulse, setCastingPulse] = useState(0)
  const [spent, setSpent] = useState<Record<string, number>>({})
  // Most spells target the enemy off-app; some need a friendly named instead (a heal, a blessing).
  const [targetId, setTargetId] = useState<string | null>(null)
  const targets = useMemo(
    () => [
      ...roster.heroes.filter((h) => h.status === 'active').map((h) => ({ id: h.id, name: h.name })),
      ...roster.hiredSwords.filter((s) => s.status === 'active').map((s) => ({ id: s.id, name: s.name })),
      ...roster.henchmenGroups.filter((g) => g.size > 0).map((g) => ({ id: g.id, name: g.name })),
    ],
    [roster],
  )
  // The attempt is written to the sheet exactly once, whatever order the renders come in.
  const recorded = useRef<string | null>(null)
  const stateRef = useRef<CastState | null>(null)
  const castTurn=useRef(turns.data)
  const attempt = useRef({ id: crypto.randomUUID(), at: new Date().toISOString(), turn: sheet.turn })

  if (casters.length === 0) {
    return (
      <Section title="Cast">
        <Card className="px-4 py-4">
          <p className="text-sm text-ink-dim">Nobody in {roster.name} casts spells or recites prayers.</p>
        </Card>
      </Section>
    )
  }
  if (!caster) return null

  const already = castsThisTurn(sheet, caster.heroId, sheet.turn)
  const spentIds = rerollsSpent(sheet, caster.heroId, sheet.turn)
  const usedUp = [...new Set([...spentIds.game.filter((id) => caster.rerolls.find((r) => r.id === id)?.limit === 'perGame'), ...spentIds.turn])]

  function begin(spell: Spell) {
    castTurn.current=turns.data
    attempt.current = { id: crypto.randomUUID(), at: new Date().toISOString(), turn: sheet.turn }
    const started = startCast(caster!, spell, {
      modifiers: Object.entries(spent).map(([id, amount]) => ({ id, amount })),
      alreadyUsed: usedUp,
      enemyDispel,
    })
    setCastingPulse(0)
    recorded.current = null
    stateRef.current = started
    setState(started)
    recordDice(started)
    // A spell that needs no roll is finished the moment it starts.
    if (started.done) record(started)
  }

  // Celebrate only the final outcome, once the covering sheet has gone. A keyed decoration
  // replays without remounting the panel's controls or depending on animation-end events.
  function closeCast() {
    if(pendingDispel.current || savingRef.current) return;
    const finished = stateRef.current
    if (finished?.done && (finished.outcome === 'cast' || finished.outcome === 'automatic')) {
      setCastingPulse((pulse) => pulse + 1)
    }
    stateRef.current = null
    setState(null)
    setTargetId(null)
  }

  function record(finished: CastState) {
    const token = `${finished.profile.heroId}:${finished.spell.id}:${finished.log.length}`
    if (readOnly || !edit || recorded.current === token) return
    recorded.current = token
    const turn = attempt.current.turn
    edit((s) =>
      withCast(s, {
        heroId: finished.profile.heroId,
        heroName: finished.profile.name,
        spellId: finished.spell.id,
        spellName: finished.spell.name,
        turn,
        outcome: finished.outcome ?? 'failed',
        total: finished.dice ? finished.dice[0] + finished.dice[1] + finished.bonus : null,
        difficulty: finished.difficulty,
        used: finished.used.filter((id) => !usedUp.includes(id)),
        targetName: targetId ? (targets.find((t) => t.id === targetId)?.name ?? null) : null,
      }),
    )
  }

  function recordDice(next: CastState) {
    if (readOnly || !edit || next.log.length === 0) return
    const identity = { ...attempt.current }
    edit(s => withRollAttempt(s, { ...identity, kind: 'spell',
      label: `${next.profile.name}: ${next.spell.name}${targetId ? ` → ${targets.find(t => t.id === targetId)?.name ?? 'target'}` : ''}`,
      status: next.done ? 'complete' : 'incomplete', rolls: next.log.map(line => line.text) }))
  }

  function accept(next:CastState) {
    const current=stateRef.current
    stateRef.current=next
    setState(next)
    recordDice(next)
    if(next.done && !current?.done) record(next)
  }
  async function saveDispel() {
    if(savingRef.current || !pendingDispel.current) return
    savingRef.current=true;setSavingDispel(true);setDispelError(null)
    const pending=pendingDispel.current
    try {
      await recordStaffDispel(pending.input)
      pendingDispel.current=null;setHasPendingDispel(false)
      accept(pending.next)
      void queryClient.invalidateQueries({queryKey:dispelKey(matchId)})
    } catch(error) {
      setDispelError(error instanceof Error?error.message:'Unable to save the dispel.')
    } finally {savingRef.current=false;setSavingDispel(false)}
  }
  function advance(step: (s: CastState) => CastState) {
    const current=stateRef.current
    if(!current || pendingDispel.current || savingRef.current) return
    const next=step(current)
    const rolled=next.dispelRolled
    if(rolled && !current.dispelRolled && rolled.source.id==='staff_of_light') {
      const turn=castTurn.current
      if(!turn || !rolled.source.ownerId) {setDispelError('Set the shared turn order before using the Staff of Light.');return}
      pendingDispel.current={next,input:{p_id:crypto.randomUUID(),p_match_id:matchId,p_caster_warband_id:roster.id,p_source_hero_id:rolled.source.ownerId,p_round:turn.round,p_active_warband_id:turn.turn_order[turn.active_index],p_spell_name:next.spell.name,p_roll:rolled.roll,p_manual:rolled.manual}}
      setHasPendingDispel(true)
      void saveDispel()
      return
    }
    accept(next)
  }

  return (
    <>
      {enemies.error || turns.isError || dispels.isError ? <Notice tone="warn" title="Battle details unavailable">Refresh the battle before casting so opposing dispels can be checked.</Notice> : null}
      {needsSharedTurns ? <Notice tone="warn" title="Set the turn order first">An opposing Staff of Light needs the shared turn tracker to track its once-per-turn dispel. Set the turn order above before casting.</Notice> : null}
      {/* Spellcaster and target face each other, the same layout Melee/Ranged Attack use. */}
      <div className="grid grid-cols-2 items-stretch gap-3 lg:gap-8">
        <FightBox icon="cast" title="Spellcaster" tone="brass" castingPulse={castingPulse}>
          {casters.length > 1 ? (
            <div role="radiogroup" aria-label="Which caster" className="flex flex-wrap gap-1.5">
              {casters.map((c) => (
                <button
                  key={c.heroId}
                  type="button"
                  role="radio"
                  aria-checked={c.heroId === caster.heroId}
                  onClick={() => {
                    setCastingPulse(0)
                    setCasterId(c.heroId)
                    stateRef.current = null
                    setState(null)
                    setSpent({})
                    setTargetId(null)
                  }}
                  className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${c.heroId === caster.heroId ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:text-ink'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-ink">{caster.name}</p>
          )}
          <p className="text-xs text-ink-dim">Known spells and prayers</p>
          {already.length > 0 ? (
            <Notice tone="warn" title="Already cast this turn">
              {already.map((c) => `${c.spellName}${c.targetName ? ` on ${c.targetName}` : ''} — ${CAST_OUTCOME_LABEL[c.outcome].toLowerCase()}`).join('. ')}.
              {caster.secondSpell ? ' Magical Aptitude allows a second attempt after a Toughness test.' : ' A wizard may cast one spell per turn.'}
            </Notice>
          ) : null}

          <div className="flex flex-col gap-2">
            {caster.spells.map(({ spell, difficulty }) => {
              const selected = profileForSpell(caster, spell.id)
              return (
              <Card key={spell.id} className="flex flex-col gap-2 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <HoverCard title={spell.name} label={<span className="text-sm font-semibold text-ink">{spell.name}</span>}>
                      <p>{difficulty === null ? 'Cast automatically' : `Difficulty: ${difficulty}${difficulty !== spell.difficulty ? ` (Base difficulty ${spell.difficulty})` : ''}`}</p>
                      {spell.text}
                    </HoverCard>
                    <p className="text-xs text-ink-dim">{selected.lore.name} · {difficulty === null ? 'Cast automatically' : `Difficulty ${difficulty}+`}</p>
                  </div>
                  <Button variant="secondary" disabled={selected.blocks.length > 0 || (needsSharedTurns && selected.lore.id!=='prayers_of_sigmar') || enemies.isPending || turns.isPending || dispels.isPending || !!enemies.error || turns.isError || dispels.isError} onClick={() => begin(spell)}>
                    {selected.kind === 'prayer' ? 'Recite' : 'Cast'}
                  </Button>
                </div>
                {selected.blocks.length > 0 ? <p className="text-xs text-danger">{selected.blocks.join(' ')}</p> : null}
                {selected.modifiers.length > 0 ? <ModifierBar caster={selected} spent={spent} setSpent={setSpent} /> : null}
              </Card>
            )})}
          </div>

          {caster.reminders.length > 0 ? (
            <ul className="flex flex-col gap-1 text-xs leading-relaxed text-ink-dim">
              {caster.reminders.map((line) => (
                <li key={line} className="flex gap-1.5">
                  <span aria-hidden>·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </FightBox>

        <FightBox icon="shield" title="Target" tone="accent">
          {targets.length > 0 ? (
            <SelectField label="Target (if this spell needs one)" hideLabel value={targetId ?? ''} onChange={(e) => setTargetId(e.target.value || null)}>
              <option value="">Off the sheet — no target on this warband</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
          ) : (
            <p className="text-xs text-ink-dim">No target needed on this warband — most spells are aimed at the enemy off-app.</p>
          )}
        </FightBox>
      </div>

      <Sheet
        open={state !== null}
        onClose={closeCast}
        size="full"
        title={state ? `${caster.name} ${state.profile.kind === 'prayer' ? 'recites' : 'casts'} ${state.spell.name}` : ''}
        description="Roll your dice one step at a time, or tap Roll."
        footer={
          <Button
            variant="secondary"
            block
            onClick={closeCast}
          >
            Close
          </Button>
        }
      >
        {dispelError ? <Notice tone="warn" title="Dispel not saved">{dispelError}</Notice> : null}
        {hasPendingDispel ? <div className="space-y-2"><p className="text-sm">{savingDispel?'Saving the dispel…':'The rolled result is retained. Retry saving it before continuing.'}</p><Button disabled={savingDispel} onClick={()=>void saveDispel()}>Retry saving dispel</Button></div> : state ? <CastRun state={state} advance={advance} usedUp={usedUp} /> : null}
      </Sheet>
    </>
  )
}

function ModifierBar({ caster, spent, setSpent }: { caster: CasterProfile; spent: Record<string, number>; setSpent: (next: Record<string, number>) => void }) {
  const optional = caster.modifiers.filter((m) => m.optional)
  const always = caster.modifiers.filter((m) => !m.optional)
  return (
    <Card className="flex flex-col gap-3 px-3 py-3">
      {always.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-ink-dim">
          <span>Always applies:</span>
          {always.map((m) => (
            <Tag key={m.id} tone="brass">{`${m.name} +${m.amount}`}</Tag>
          ))}
        </p>
      ) : null}
      {optional.map((m) => {
        const on = spent[m.id] !== undefined
        return (
          <div key={m.id} className="flex flex-col gap-1.5">
            <label className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => {
                  const next = { ...spent }
                  if (e.target.checked) next[m.id] = m.amount || 1
                  else delete next[m.id]
                  setSpent(next)
                }}
                className="mt-1 size-4 accent-[var(--color-brass)]"
              />
              <span className="min-w-0">
                <span className="font-medium">
                  {m.name} {m.amount > 0 ? `+${m.amount}` : ''}
                </span>
                {m.note ? <span className="block text-xs leading-relaxed text-ink-dim">{m.note}</span> : null}
              </span>
            </label>
            {on && m.amount === 0 ? (
              <div className="pl-6">
                <label className="text-[10px] uppercase tracking-wide text-ink-dim" htmlFor={`amt-${m.id}`}>
                  How much
                </label>
                <input
                  id={`amt-${m.id}`}
                  type="number"
                  min={1}
                  max={12}
                  value={spent[m.id] || 1}
                  onChange={(e) => setSpent({ ...spent, [m.id]: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
                  className="ml-2 min-h-9 w-16 rounded-md border border-border bg-surface-low px-2 text-center text-sm tabular-nums text-ink focus:border-brass focus:outline-none"
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </Card>
  )
}

function CastRun({ state, advance, usedUp }: { state: CastState; advance: (step: (s: CastState) => CastState) => void; usedUp: string[] }) {
  const [restrictionConfirmed,setRestrictionConfirmed]=useState(false)
  const step = state.pending
  const last = state.log.at(-1)
  const dice = state.dice
  const target = state.difficulty
  const score = dice ? dice[0] + dice[1] + state.bonus : null

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{state.spell.name}</p>
            <p className="text-xs text-ink-dim">
              {state.difficulty === null ? 'No roll needed' : `Difficulty ${state.difficulty}+`}
              {state.bonus !== 0 ? ` · ${state.bonus > 0 ? '+' : ''}${state.bonus} from ${state.applied.map((m) => m.name).join(', ')}` : ''}
            </p>
          </div>
          <Tag tone="brass">{state.profile.name}</Tag>
        </div>

        {dice && score !== null && target !== null ? (
          <RollResult
            dice={dice}
            headline={`${score} against ${target}+`}
            detail={last?.text}
            tone={score >= target ? 'good' : 'bad'}
            manual={state.diceManual}
          />
        ) : null}

        {step ? (
          <div className="flex flex-col gap-2 rounded-md border border-brass/50 bg-surface-low px-3 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{step.label}</p>
              <p className="text-xs leading-relaxed text-ink-dim">{step.detail}</p>
            </div>

            {step.kind==='dispel' ? <>
              <SelectField label="Dispel with" value={state.enemyDispel.findIndex(source=>source===step.dispelSource)} onChange={e=>{setRestrictionConfirmed(false);advance(s=>selectDispelSource(s,Number(e.target.value)))}}>
                {state.enemyDispel.map((source,i)=><option key={`${source.ownerId}:${source.id}:${i}`} value={i}>{source.ownerName??'Warrior'} — {source.name}</option>)}
              </SelectField>
              {step.dispelSource?.id==='blessed_by_morr' ? <label className="flex gap-2 text-sm"><input type="checkbox" checked={restrictionConfirmed} onChange={e=>setRestrictionConfirmed(e.target.checked)}/>This spell targets this bearer and they are fighting the Undead.</label> : null}
            </> : null}
            {step.kind === 'chooseReroll' ? (
              <div className="flex flex-wrap gap-2">
                {availableRerolls(state).map((r) => (
                  <Button key={r.id} variant="secondary" onClick={() => advance((s) => spendReroll(s, r.id))}>
                    {r.name}
                  </Button>
                ))}
                <Button variant="ghost" onClick={() => advance(declineCastStep)}>
                  No re-roll
                </Button>
              </div>
            ) : step.kind === 'rerollOneDie' ? (
              <OneDieReroll state={state} advance={advance} />
            ) : (
              <>
                {step.dispelSource?.id!=='blessed_by_morr' || restrictionConfirmed ? <DicePicker
                  key={`${state.log.length}-${step.kind}-${step.dispelSource?.ownerId}-${step.dispelSource?.id}`}
                  count={step.dice}
                  label={step.label}
                  resetKey={`${state.log.length}-${step.kind}`}
                  onComplete={(values, manual) => advance((s) => applyCastRoll(s, values, manual))}
                /> : null}
                {step.optional ? (
                  <div>
                    {/* The dispel decline is the only control at this step, so it needs to read as
                        a button on its own — ghost's plain-link styling works for "Skip"/"Stop
                        here" because they sit next to other visible buttons, but not here. */}
                    <Button variant={step.kind === 'dispel' ? 'secondary' : 'ghost'} onClick={() => advance(declineCastStep)}>
                      {step.kind === 'dispel' ? 'No dispel' : step.kind === 'toughness' ? 'Stop here' : 'Skip'}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {state.log.length > 0 ? (
          <ol className="flex flex-col gap-1 text-xs leading-relaxed text-ink-dim" aria-label="Casting log">
            {state.log.map((line, i) => (
              <li key={i} className={line.tone === 'good' ? 'text-ink' : ''}>
                {line.text}
              </li>
            ))}
          </ol>
        ) : null}

        {state.done ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <p role="status" className="flex items-center gap-2 text-sm text-ink">
              <Icon name="cast" size={18} className={state.outcome === 'failed' || state.outcome === 'dispelled' ? 'text-accent' : 'text-ok'} />
              <span className="font-medium">{state.outcome ? CAST_OUTCOME_LABEL[state.outcome] : 'Done'}.</span>
              <span className="text-ink-dim">{describeCast(state)}</span>
            </p>
            {usedUp.length > 0 || state.used.length > 0 ? <p className="text-xs text-ink-dim">Spent so far: {[...new Set([...usedUp, ...state.used])].join(', ') || 'nothing'}.</p> : null}
            {state.outcome === 'cast' || state.outcome === 'automatic' ? <SpellDamage spellName={state.spell.name} onLog={lines => advance(s => ({ ...s, log: [...s.log, ...lines] }))} /> : null}
          </div>
        ) : null}
      </Card>
    </div>
  )
}

/** Mind Focus: choose which of the two dice to throw again, then throw it. */
function OneDieReroll({ state, advance }: { state: CastState; advance: (step: (s: CastState) => CastState) => void }) {
  const [which, setWhich] = useState<1 | 2 | null>(null)
  const dice = state.dice ?? [0, 0]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {([1, 2] as const).map((n) => (
          <Button key={n} variant={which === n ? 'primary' : 'secondary'} onClick={() => setWhich(n)}>
            Re-roll the {n === 1 ? 'first' : 'second'} ({dice[n - 1]})
          </Button>
        ))}
      </div>
      {which ? (
        <DicePicker count={1} label={`New face for die ${which}`} resetKey={which} onComplete={(values, manual) => advance((s) => applyCastRoll(s, [which, values[0]], manual))} />
      ) : null}
    </div>
  )
}
