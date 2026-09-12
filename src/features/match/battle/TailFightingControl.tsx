import type { BattleLiveState, BattleEventRow, ItemRow } from '../../../domain'
import { withRollAttempt } from '../../../domain/battle'
import { SelectField } from '../../../ui'
import { loadoutOf, type Combatant } from '../fight/combatants'
import { physicalWeaponChoices } from '../fight/weaponLoss'

export function TailFightingControl({ warrior, items, events, sheet, readOnly, edit }: {
  warrior: Combatant; items: readonly ItemRow[]; events: readonly BattleEventRow[]; sheet: BattleLiveState; readOnly: boolean;
  edit: (fn: (state: BattleLiveState) => BattleLiveState) => void;
}) {
  if (!warrior.skillIds.includes('skaven_of_clan_eshin_skills_tail_fighting')) return null
  const kit = loadoutOf(warrior.equipment)
  const shield = Boolean(kit.armour.shield || kit.armour.kiteShield)
  const profiles = [...new Map(kit.melee.filter(weapon => !weapon.paired && (weapon.id === 'dagger' || weapon.isSword)).map(weapon => [weapon.id, weapon])).values()]
  const choices = profiles.flatMap(weapon => physicalWeaponChoices(items, events, warrior.warbandId, warrior.id, weapon.id).map(choice => ({ ...choice, weaponId: weapon.id })))
  const selected = sheet.tailChoices[warrior.id]
  const value = selected?.mode === 'weapon' ? choices.some(choice => choice.key === selected.weaponKey) ? selected.weaponKey : 'none' : selected?.mode ?? (shield ? 'shield' : 'none')
  return <div className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
    <SelectField label="Tail Fighting" value={value ?? 'none'} disabled={readOnly} onChange={event => {
      const value = event.target.value
      const weapon = choices.find(choice => choice.key === value)
      const choice: BattleLiveState['tailChoices'][string] = weapon ? { mode: 'weapon', weaponId: weapon.weaponId, weaponKey: weapon.key } : { mode: value === 'shield' && shield ? 'shield' : 'none' }
      const description = weapon ? `${weapon.label} — one extra attack` : choice.mode === 'shield' ? 'shield — its normal +1 save, with both hands free' : 'nothing'
      const id = crypto.randomUUID()
      edit(state => withRollAttempt({ ...state, tailChoices: { ...state.tailChoices, [warrior.id]: choice } }, { id, at: new Date().toISOString(), turn: state.turn, kind: 'attack', status: 'complete', label: `${warrior.name}: Tail Fighting choice`, rolls: [`Tail holds ${description}. Earlier attack results are unchanged.`] }))
    }}>
      <option value="none">Nothing in the tail</option>
      {shield ? <option value="shield">Shield · +1 save, hands free</option> : null}
      {choices.map(choice => <option key={choice.key} value={choice.key}>{choice.label} · one extra attack</option>)}
    </SelectField>
    <p className="text-xs text-ink-dim">The selected weapon is reserved for the tail. Select different physical copies for the hands. A shield gives its normal save bonus once.</p>
  </div>
}
