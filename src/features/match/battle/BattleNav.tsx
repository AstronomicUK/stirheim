// Getting around the battle sheet. The five pills the sheet used to carry were doing three
// unrelated jobs, so they are now three groups: a slider that swaps between the two rosters, the
// quick actions a player reaches for mid-turn, and the record of what has happened.

import { Icon, type IconName } from '../../../ui'

export type BattleTab = 'mine' | 'enemy' | 'fight' | 'cast' | 'log' | 'notes'

export interface BattleNavProps {
  tab: BattleTab
  setTab: (tab: BattleTab) => void
  /** The Attack panels only exist when the match is being fought in the app. */
  inApp: boolean
  /** Somebody on the roster can cast a spell or recite a prayer. */
  canCast: boolean
  /** Which quick action opened the fight tab, so only that tile lights up rather than both. */
  attackStartWith: 'melee' | 'ranged'
  /** Opens the Attack tab already leaning towards a melee or a ranged weapon (the picker still offers both). */
  onAttack: (kind: 'melee' | 'ranged') => void
}

/** Two halves that light up, so which roster you are looking at reads from across the table. */
function WarbandSlider({ tab, setTab }: Pick<BattleNavProps, 'tab' | 'setTab'>) {
  const onEnemy = tab === 'enemy'
  const showing = tab === 'mine' || tab === 'enemy'
  return (
    <div role="radiogroup" aria-label="Which warband" className="grid grid-cols-2 gap-0 overflow-hidden rounded-full border border-border bg-surface-low p-1">
      {(
        [
          { value: 'mine', label: 'My warband', icon: 'warbands', active: showing && !onEnemy, tone: 'bg-brass text-surface-low' },
          { value: 'enemy', label: 'Enemy warband', icon: 'enemy', active: showing && onEnemy, tone: 'bg-accent text-surface-low' },
        ] as const
      ).map((side) => (
        <button
          key={side.value}
          type="button"
          role="radio"
          aria-checked={side.active}
          onClick={() => setTab(side.value)}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors ${
            side.active ? side.tone : 'text-ink-dim hover:text-ink'
          }`}
        >
          <Icon name={side.icon} size={18} />
          <span className="truncate">{side.label}</span>
        </button>
      ))}
    </div>
  )
}

function NavTile({ icon, label, detail, active, tone, onClick, castCircle = false }: { icon: IconName; label: string; detail?: string; active: boolean; tone: 'accent' | 'brass'; onClick: () => void; castCircle?: boolean }) {
  const ring = active ? (tone === 'accent' ? 'border-accent bg-accent/10' : 'border-brass bg-brass/10') : 'border-border bg-surface-low hover:bg-surface-high'
  const ink = active ? (tone === 'accent' ? 'text-accent' : 'text-brass') : 'text-brass'
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-16 flex-1 flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-colors ${ring} ${castCircle ? 'stirheim-cast-magic' : ''}`}>
      {castCircle ? (
        <>
          <span className="stirheim-cast-aura" aria-hidden="true" />
          <span className="stirheim-cast-trail" aria-hidden="true" />
        </>
      ) : null}
      <Icon name={icon} size={20} className={castCircle ? 'stirheim-cast-comet' : ink} />
      <span className="text-sm font-semibold leading-tight text-ink">{label}</span>
      {detail ? <span className="text-xs leading-snug text-ink-dim">{detail}</span> : null}
    </button>
  )
}

export function BattleNav({ tab, setTab, inApp, canCast, attackStartWith, onAttack }: BattleNavProps) {
  return (
    <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-[0.2em] text-ink-dim">Quick actions</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <NavTile icon="warbands" label="View Rosters" detail="Your warband and opponents" active={tab === 'mine' || tab === 'enemy'} tone="brass" onClick={() => setTab('mine')} />
            {inApp ? <NavTile icon="battle" label="Melee Attack" detail="Odds and dice, step by step" active={tab === 'fight' && attackStartWith === 'melee'} tone="accent" onClick={() => onAttack('melee')} /> : null}
            {inApp ? <NavTile icon="shooting" label="Ranged Attack" detail="Odds and dice, step by step" active={tab === 'fight' && attackStartWith === 'ranged'} tone="accent" onClick={() => onAttack('ranged')} /> : null}
            <NavTile castCircle={canCast} icon="cast" label="Cast a Spell" detail="Spells and prayers" active={tab === 'cast'} tone="brass" onClick={() => setTab('cast')} />

        <NavTile icon="log" label="Log" detail="Battle history and payments" active={tab === 'log'} tone="brass" onClick={() => setTab('log')} />
        <NavTile icon="notes" label="Notes" detail="Objectives and scribbles" active={tab === 'notes'} tone="brass" onClick={() => setTab('notes')} />

          </div>
        </section>

      {tab === 'mine' || tab === 'enemy' ? <WarbandSlider tab={tab} setTab={setTab} /> : null}
    </div>
  )
}
