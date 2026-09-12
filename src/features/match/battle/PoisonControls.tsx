import { useState } from 'react'
import type { ItemRow, BattleEventRow, BattleLiveState } from '../../../domain'
import { withRollAttempt } from '../../../domain/battle'
import { Button, Notice, SelectField, TextField } from '../../../ui'
import { isBlackpowderWeapon } from '../../../rules/resolve/ladyBlessing'
import { physicalWeaponChoices } from '../fight/weaponLoss'
import type { Combatant, Loadout } from '../fight/combatants'
import { applyPoisonToWeapon, correctPoisonApplication, poisonVialsRemaining } from './poisonUses'
import { setItemUsed } from './sheet'

export function PoisonControls({ warrior, kit, items, events, sheet, readOnly, edit }: {
  warrior: Combatant; kit: Loadout; items: readonly ItemRow[]; events: readonly BattleEventRow[];
  sheet: BattleLiveState; readOnly: boolean; edit: (fn: (state: BattleLiveState) => BattleLiveState) => void;
}) {
  const [vialId, setVialId] = useState('')
  const [weaponKey, setWeaponKey] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const vials = items.filter(item => item.warband_id === warrior.warbandId && (item.holder_id === warrior.id || item.holder_type === 'stash') && (item.item_rules_id === 'black_lotus' || item.item_rules_id === 'dark_venom'))
  const applications = sheet.poisonApplications.filter(use => use.warriorId === warrior.id && !use.correction)
  const legacy = (sheet.itemsUsed[warrior.id] ?? []).filter(id => id === 'black_lotus' || id === 'dark_venom')
  const weapons = [...new Map([...kit.melee, ...kit.ranged, ...(kit.tailWeapon ? [kit.tailWeapon] : [])].filter(weapon => !isBlackpowderWeapon(weapon)).map(weapon => [weapon.id, weapon])).values()]
  const choices = weapons.flatMap(weapon => physicalWeaponChoices(items, events, warrior.warbandId, warrior.id, weapon.id).flatMap(choice => (weapon.paired ? [0, 1] as const : [undefined]).map(bladeIndex => ({ ...choice, key: `${choice.key}${bladeIndex === undefined ? '' : `:blade:${bladeIndex}`}`, physicalKey: choice.key, bladeIndex, label: `${choice.label}${bladeIndex === undefined ? '' : bladeIndex === 0 ? ' · main blade (main-hand attacks)' : ' · off-hand blade (one extra attack)'}`, weaponId: weapon.id }))))
  const vial = vials.find(item => item.id === vialId) ?? vials.find(item => poisonVialsRemaining(sheet, item) > 0) ?? vials[0]
  const weapon = choices.find(choice => choice.key === weaponKey) ?? choices[0]
  if (!vials.length && !applications.length && !legacy.length) return null
  const name = (id: string) => id === 'black_lotus' ? 'Black Lotus' : 'Dark Venom'
  function change(fn: (state: BattleLiveState) => BattleLiveState) {
    try { fn(sheet); edit(state => { try { return fn(state) } catch { return state } }); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update poison application.') }
  }
  return <div className="flex min-w-0 flex-col gap-2 rounded-md border border-border p-3">
    <p className="text-sm font-semibold">Poison a weapon</p>
    <p className="text-xs text-ink-dim">One vial coats one physical weapon for this battle. Choose the same copy when attacking. Blackpowder weapons cannot be poisoned.</p>
    {legacy.length ? <Notice tone="warn">An earlier poison tick has no weapon recorded. Apply that poison to a weapon below, or correct the old tick. Its bonus is paused until a weapon is selected.</Notice> : null}
    {vials.length ? <SelectField label="Poison vial" value={vial?.id ?? ''} onChange={event => setVialId(event.target.value)}>{vials.map(item => <option key={item.id} value={item.id}>{name(item.item_rules_id!)} · {poisonVialsRemaining(sheet,item)} available · {item.holder_type === 'stash' ? 'stash' : 'carried'}</option>)}</SelectField> : null}
    {choices.length ? <SelectField label="Weapon to poison" value={weapon?.key ?? ''} onChange={event => setWeaponKey(event.target.value)}>{choices.map(choice => <option key={`${choice.key}:${choice.weaponId}`} value={choice.key}>{choice.label}</option>)}</SelectField> : <p className="text-xs text-ink-dim">No eligible intact weapon is carried.</p>}
    <Button variant="secondary" disabled={readOnly || !vial || !weapon || poisonVialsRemaining(sheet,vial)<1} onClick={() => {
      if (!vial || !weapon) return
      const id=crypto.randomUUID()
      change(state => setItemUsed(applyPoisonToWeapon(state,warrior,vial,items,events,weapon.weaponId,weapon.physicalKey,id,weapon.bladeIndex),warrior.id,vial.item_rules_id!,false))
    }}>Apply one vial</Button>
    {applications.map(use => <p key={use.id} className="text-xs">{name(use.itemRulesId)}: {use.weapon.name}, copy {use.weapon.copyIndex+1}</p>)}
    {applications.length || legacy.length ? <details className="text-xs"><summary className="cursor-pointer">Correct a poison application</summary>
      <TextField label="Reason for poison correction" value={reason} onChange={event=>setReason(event.target.value)} />
      <p>Earlier attack results are unchanged. Correct affected attacks separately in the combat log.</p>
      {applications.map(use=><Button key={use.id} variant="ghost" disabled={readOnly || !reason.trim()} onClick={()=>change(state=>correctPoisonApplication(state,use.id,reason))}>Undo {name(use.itemRulesId)} on {use.weapon.name}, copy {use.weapon.copyIndex+1}</Button>)}
      {legacy.map(itemId=><Button key={itemId} variant="ghost" disabled={readOnly || !reason.trim()} onClick={()=>change(state=>withRollAttempt(setItemUsed(state,warrior.id,itemId,false),{id:crypto.randomUUID(),at:new Date().toISOString(),turn:state.turn,kind:'attack',status:'complete',label:`${warrior.name}: old ${name(itemId)} tick corrected`,rolls:[reason.trim()]}))}>Clear old {name(itemId)} tick</Button>)}
    </details> : null}
    {error ? <Notice tone="error">{error}</Notice> : null}
  </div>
}
