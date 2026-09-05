// Re-rolls and modifiers the roster offers for the exploration dice, each applied to one die at a
// time with the record kept for the report. Suggested, never forced: an aid can go unused.

import { useState } from 'react'
import { rollDie } from '../../../rules/resolve/dice'
import { aidUsesLeft, explorationAids, leadershipTest, validateAidUse, type AidUse, type ExplorationAid } from '../../../rules/resolve/explorationAids'
import { defaultCampaignHouseRules } from '../../../rules/types/roster'
import { Button, DieField, Notice } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import { heroOoaIds } from '../model/derive'
import { applyExplorationAid } from '../model/state'
import type { StepProps } from './bits'

export function ExplorationAidsCard({ draft, ctx, update, rolls }: Pick<StepProps, 'draft' | 'ctx' | 'update'> & { rolls: (number | null)[] }) {
  const spent = draft.exploration.aids ?? []
  const aids = explorationAids(ctx.roster, {
    houseRules: ctx.houseRules ?? defaultCampaignHouseRules(),
    heroesOutOfAction: [...heroOoaIds(draft)],
    preBattle: ctx.preBattle ?? {},
  })
  if (aids.length === 0) return null
  return (
    <Section title="Re-rolls and modifiers" aside={`${aids.length}`}>
      {aids.map((aid) => (
        <AidRow key={aid.key} aid={aid} left={aidUsesLeft(aid, spent)} rolls={rolls} onUse={(use) => update((d) => applyExplorationAid(d, use))} />
      ))}
      {spent.length > 0 ? (
        <ul className="flex flex-col gap-0.5 text-xs text-ink-dim">
          {spent.map((u, i) => (
            <li key={i}>
              Die {u.dieIndex + 1}: {u.from} → {u.to} with {u.label}
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  )
}

function AidRow({ aid, left, rolls, onUse }: { aid: ExplorationAid; left: number; rolls: (number | null)[]; onUse: (use: AidUse) => void }) {
  const [dieIndex, setDieIndex] = useState<number | null>(null)
  const [next, setNext] = useState<number | null>(null)
  const [test, setTest] = useState<[number | null, number | null]>([null, null])
  const [error, setError] = useState<string | null>(null)
  const from = dieIndex !== null ? rolls[dieIndex] : null
  const testDone = test[0] !== null && test[1] !== null
  const testPassed = aid.requiresTest && testDone ? leadershipTest([test[0]!, test[1]!], aid.requiresTest.value) : null
  const testBlocks = Boolean(aid.requiresTest) && testPassed !== true
  const exhausted = left <= 0

  function apply(value: number) {
    if (dieIndex === null || from === null) return
    const use: AidUse = {
      aidKey: aid.key,
      label: aid.label,
      dieIndex,
      from,
      to: value,
      ...(aid.requiresTest && testDone ? { test: { rolls: [test[0]!, test[1]!] as [number, number], passed: testPassed === true } } : {}),
    }
    try {
      validateAidUse(aid, use)
      setError(null)
      onUse(use)
      setDieIndex(null)
      setNext(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Card className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{aid.label}</p>
          <p className="text-xs text-ink-dim">{aid.note}</p>
        </div>
        <Tag tone={exhausted ? 'neutral' : 'brass'}>{exhausted ? 'Used' : `${left} ${left === 1 ? 'use' : 'uses'}`}</Tag>
      </div>
      {!exhausted ? (
        <>
          {aid.requiresTest ? (
            <div className="flex flex-wrap items-end gap-3">
              <DieField label="Ld test die 1" sides={6} value={test[0]} onChange={(v) => setTest([v, test[1]])} rollable disabled={testPassed === true} />
              <DieField label="Ld test die 2" sides={6} value={test[1]} onChange={(v) => setTest([test[0], v])} rollable disabled={testPassed === true} />
              {testDone ? (
                <p className="pb-2 text-sm">
                  {test[0]! + test[1]!} against Ld {aid.requiresTest.value}: <span className={testPassed ? 'text-ok' : 'text-accent'}>{testPassed ? 'passed' : 'failed'}</span>
                </p>
              ) : null}
            </div>
          ) : null}
          {!testBlocks ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-ink-dim">Die:</span>
                {rolls.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={v === null}
                    onClick={() => {
                      setDieIndex(i)
                      setNext(null)
                    }}
                    className={`min-h-9 min-w-9 rounded border px-2 text-sm tabular-nums ${dieIndex === i ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:text-ink'} disabled:opacity-40`}
                  >
                    {i + 1}: {v ?? '–'}
                  </button>
                ))}
              </div>
              {dieIndex !== null && from !== null ? (
                aid.kind === 'modify' ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={from <= 1} onClick={() => apply(from - 1)}>
                      {from} → {from - 1}
                    </Button>
                    <Button variant="secondary" disabled={from >= 6} onClick={() => apply(from + 1)}>
                      {from} → {from + 1}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end gap-3">
                    <DieField label="New roll" sides={6} value={next} onChange={setNext} />
                    <Button variant="secondary" onClick={() => apply(rollDie(6))}>
                      Roll for me
                    </Button>
                    <Button disabled={next === null} onClick={() => next !== null && apply(next)}>
                      {aid.kind === 'rerollKeepEither' ? 'Keep the new roll' : 'Apply'}
                    </Button>
                    {aid.kind === 'rerollKeepEither' ? (
                      <Button variant="ghost" onClick={() => next !== null && apply(from)}>
                        Keep {from}
                      </Button>
                    ) : null}
                  </div>
                )
              ) : (
                <p className="text-xs text-ink-dim">Pick the die to change.</p>
              )}
            </div>
          ) : null}
          {error ? <Notice tone="error">{error}</Notice> : null}
        </>
      ) : null}
    </Card>
  )
}
