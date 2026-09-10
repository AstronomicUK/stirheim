import type { HoardFind, ScenarioRewardRule } from '../../../rules/data/campaign/scenarioRewardRules'
export interface MuleDraft { role?: 'attacker' | 'defender'; recovered?: number | null; starting?: number | null }
export function muleRewards(state: MuleDraft): { rule: ScenarioRewardRule | null; problems: string[] } {
  const { role, recovered, starting } = state
  if (!['attacker', 'defender'].includes(role ?? '') || !Number.isInteger(starting) || starting! < 3 || starting! > 6 || !Number.isInteger(recovered) || recovered! < 0 || recovered! > starting!) return { rule: null, problems: ['Record your role, the 3–6 starting mules and how many your warband led safely off the table.'] }
  if (recovered === 0) return { rule: { kind: 'none', note: 'No mules led safely off the table; no mule or cargo reward.' }, problems: [] }
  if (role === 'defender') return { rule: { kind: 'hoard', winnerOnly: false, note: `${recovered} mules led safely off: roll 2D6 separately for each.`, finds: Array.from({ length: recovered! }, (_, i) => ({ id: `mule-pay-${i}`, label: `Mule ${i + 1} escort payment`, kind: 'gold' as const, quantity: { count: 2, sides: 6 } })) }, problems: [] }
  const bonus = recovered! - 1
  const find = (id: string, itemName: string, threshold: number, sides?: number): HoardFind => ({ id, label: itemName, itemName, kind: 'item', threshold: Math.max(1, threshold - bonus), quantity: sides ? { count: 1, sides } : 1 })
  return { rule: { kind: 'hoard', winnerOnly: false, note: `${recovered} recovered mules added to the stash; keep or sell them through the usual equipment controls. One combined Slaughtered Warband cargo search: +${bonus} to each discovery D6, already included in the displayed target. Quantity and gold dice are unmodified.`, finds: [
    { id: 'mules', label: 'Recovered mules', itemName: 'Mule', kind: 'item', quantity: recovered! },
    { id: 'cargo-gold', label: 'Cargo gold', kind: 'gold', quantity: { count: 3, sides: 6, multiplier: 5 } },
    { id: 'daggers', label: 'Daggers', itemName: 'Dagger', kind: 'item', quantity: { count: 1, sides: 6 } },
    find('light', 'Light armour', 4, 3), find('heavy', 'Heavy armour', 5), find('map', 'Mordheim Map', 4), find('halberds', 'Halberd', 5, 3), find('swords', 'Sword', 3, 3), find('shields', 'Shield', 2, 3), find('bows', 'Bow', 4, 3), find('helmets', 'Helmet', 2, 3),
  ] }, problems: [] }
}
