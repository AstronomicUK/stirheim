/** Explicitly audited reward paths, from the matching scraped scenario sections.
 * Absence from this map means not yet implemented, never “no rewards”.
 */
export interface HoardFind {
  id: string
  label: string
  kind: 'gold' | 'shards' | 'item'
  itemName?: string
  threshold?: number
  discoveryDice?: number
  quantityIsValue?: boolean
  quantity: number | { count: number; sides: number; bonus?: number; multiplier?: number }
}
export type ScenarioRewardRule =
  | { kind: 'none'; note: string }
  | { kind: 'counters'; max?: number; note: string }
  | { kind: 'building'; note: string }
  | { kind: 'encounter'; note: string }
  | { kind: 'hoard'; note: string; needsRescue?: boolean; winnerOnly?: boolean; condition?: { id: string; question: string }; finds: HoardFind[] }
const none: ScenarioRewardRule = { kind: 'none', note: 'This scenario has no additional treasure reward. Experience and normal exploration are resolved in their own steps.' }
const gems: HoardFind = { id: 'gems', label: 'Gems worth 10 gc each', kind: 'item', itemName: 'Gem (worth 10 gc)', threshold: 5, quantity: { count: 1, sides: 3 } }
export const SCENARIO_REWARD_RULES: Record<string, ScenarioRewardRule> = {
  skirmish: none,
  breakthrough: none,
  street_fight: none,
  surprise_attack: none,
  occupy: none,
  defend_the_find: { kind: 'building', note: 'One shard for each of your Heroes inside the objective building at the end, up to three shards. Either warband may earn this reward.' },
  wyrdstone_hunt: { kind: 'counters', max: 4, note: 'One shard per counter still held by your warriors at the end. The scenario starts with D3+1 counters in total.' },
  treasure_hunt: { kind: 'counters', note: 'One shard per counter still held at the end. The battle starts with D3 counters per participating warband.' },
  finders_keepers: { kind: 'counters', max: 3, note: 'One shard per counter still held at the end. The stash starts with D3 counters.' },
  chance_encounter: { kind: 'encounter', note: 'Keep your starting D3 shards, less one per own Hero taken out of action (minimum zero). Gain one per enemy Hero taken out of action, capped at their starting D3 shards.' },
  hidden_treasure: { kind: 'hoard', note: 'The victorious warband recovers the chest. Gold is automatic; roll separately for each other find.', finds: [
    { id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 3, sides: 6 } },
    { id: 'shards', label: 'Wyrdstone shards', kind: 'shards', threshold: 5, quantity: { count: 1, sides: 3 } },
    { id: 'armour', label: 'Light armour', kind: 'item', itemName: 'Light armour', threshold: 4, quantity: 1 },
    { id: 'sword', label: 'Sword', kind: 'item', itemName: 'Sword', threshold: 3, quantity: 1 },
    gems,
  ] },
  one_man_s_rescue_is_another_man_s_kidnap: { kind: 'hoard', note: 'The winning warband receives 5D6+10 gc as ransom or reward.', finds: [
    { id: 'ransom', label: 'Ransom or reward', kind: 'gold', quantity: { count: 5, sides: 6, bonus: 10 } },
  ] },
  bar_room_brawl: { kind: 'hoard', note: 'The winning warband receives the cash register and Bugman’s Ale only if Sam was out of action.', condition: { id: 'sam', question: 'Was Sam the Bartender taken out of action?' }, finds: [
    { id: 'register', label: 'Cash register', kind: 'gold', quantity: { count: 3, sides: 6 } },
    { id: 'ale', label: 'Bugman’s Ale supply', kind: 'item', itemName: "Bugman's Ale", quantity: 1 },
  ] },
  a_night_in_the_graveyard: { kind: 'hoard', winnerOnly: false, note: 'A warrior close enough to loot Erasmus’s mausoleum gains 4D6+20 gc after Erasmus is taken out of action or driven off. Winning is not required.', condition: { id: 'erasmus', question: 'Was Erasmus defeated or driven off, and did your warrior loot his mausoleum?' }, finds: [
    { id: 'grave', label: 'Erasmus’s grave', kind: 'gold', quantity: { count: 4, sides: 6, bonus: 20 } },
  ] },
  the_secrets_of_beujuntae: { kind: 'hoard', note: 'The winner opens the tomb. Roll 2D6 separately for each possible item, as stated above the source table; gold is automatic.', finds: [
    { id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 2, sides: 6, bonus: 5 } },
    { id: 'sickle', label: 'Magic Sickle (+1 WS)', kind: 'item', itemName: 'Magic Sickle (+1 WS)', threshold: 6, discoveryDice: 2, quantity: 1 },
    { ...gems, threshold: 7, discoveryDice: 2, quantity: { count: 1, sides: 6 } },
    { id: 'bone', label: 'Ancient Bone Armour (4+ save; otherwise light armour)', kind: 'item', itemName: 'Ancient Bone Armour (4+ save; otherwise light armour)', threshold: 8, discoveryDice: 2, quantity: 1 },
  ] },
  the_mummy: { kind: 'hoard', winnerOnly: false, note: 'Once Ka-Hotep is vanquished, the warriors can loot his hoard. Roll separately for every row, including the two distinct light-armour finds.', condition: { id: 'mummy', question: 'Was Ka-Hotep vanquished, and did your warband secure his hoard?' }, finds: [
    { id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 5, sides: 6 } },
    { id: 'charm', label: 'Lucky Charm', kind: 'item', itemName: 'Lucky Charm', quantity: 1 },
    { id: 'gromril', label: 'Gromril Sword', kind: 'item', itemName: 'Gromril Sword', threshold: 4, quantity: 1 },
    { id: 'heavy', label: 'Heavy armour', kind: 'item', itemName: 'Heavy armour', threshold: 5, quantity: 1 },
    { id: 'light-five', label: 'First light armour', kind: 'item', itemName: 'Light armour', threshold: 5, quantity: 1 },
    { id: 'light-four', label: 'Second light armour', kind: 'item', itemName: 'Light armour', threshold: 4, quantity: 1 },
    { id: 'shield', label: 'Shield', kind: 'item', itemName: 'Shield', threshold: 4, quantity: 1 },
    { id: 'helmet', label: 'Helmet', kind: 'item', itemName: 'Helmet', threshold: 4, quantity: 1 },
    { id: 'swords', label: 'Swords', kind: 'item', itemName: 'Sword', threshold: 4, quantity: { count: 1, sides: 3 } },
    { ...gems, threshold: 4 },
    { id: 'jewellery', label: 'Jewellery worth D6×10 gc', kind: 'item', itemName: 'Jewellery (worth {amount} gc)', threshold: 5, quantity: { count: 1, sides: 6, multiplier: 10 }, quantityIsValue: true },
    { id: 'telescope', label: 'Telescope', kind: 'item', itemName: 'Telescope', threshold: 5, quantity: 1 },
    { id: 'scroll', label: 'Dispel Scroll', kind: 'item', itemName: 'Dispel Scroll', threshold: 5, quantity: 1 },
    { id: 'ale', label: "Bugman's Ale", kind: 'item', itemName: "Bugman's Ale", threshold: 5, quantity: 1 },
    { id: 'tome', label: 'Tome of Magik', kind: 'item', itemName: 'Tome of Magic', threshold: 4, quantity: 1 },
  ] },

  the_lost_prince: { kind: 'hoard', needsRescue: true, note: 'The father rewards the winning warband only if his son survived. Gold is automatic; roll separately for each other find.', finds: [
    { id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 5, sides: 6 } },
    { id: 'swords', label: 'Swords', kind: 'item', itemName: 'Sword', threshold: 4, quantity: { count: 1, sides: 3 } },
    { id: 'heavy', label: 'Heavy armour', kind: 'item', itemName: 'Heavy armour', threshold: 5, quantity: 1 },
    { id: 'light', label: 'Light armour', kind: 'item', itemName: 'Light armour', threshold: 4, quantity: 1 },
    { id: 'shield', label: 'Shield', kind: 'item', itemName: 'Shield', threshold: 4, quantity: 1 },
    { id: 'helmet', label: 'Helmet', kind: 'item', itemName: 'Helmet', threshold: 4, quantity: 1 },
    gems,
  ] },
}
export function scenarioRewardRule(id?: string | null) { return id ? SCENARIO_REWARD_RULES[id] : undefined }
