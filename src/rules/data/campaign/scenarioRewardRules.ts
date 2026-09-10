/** Explicitly audited reward paths, from the matching scraped scenario sections.
 * Absence from this map means not yet implemented, never “no rewards”.
 */
export interface HoardFind {
  id: string
  label: string
  kind: 'gold' | 'shards' | 'item' | 'artefact'
  itemName?: string
  threshold?: number
  discoveryDice?: number
  quantityIsValue?: boolean
  unclaimedBeforeBattle?: boolean
  quantity: number | { count: number; sides: number; bonus?: number; multiplier?: number }
}
export type ScenarioRewardRule =
  | { kind: 'none'; note: string }
  | { kind: 'bounty'; note: string; label: string; goldEach: number; winnerOnly?: boolean; condition?: { id: string; question: string }; baseDice?: { count: number; multiplier: number } }
  | { kind: 'repeated'; note: string; label: string; max?: number; table: { min: number; max: number; goldDice?: number; shards?: number; label: string }[] }
  | { kind: 'counters'; max?: number; label?: string; note: string }
  | { kind: 'building'; note: string }
  | { kind: 'encounter'; note: string }
  | { kind: 'hoard'; note: string; needsRescue?: boolean; winnerOnly?: boolean; condition?: { id: string; question: string }; finds: HoardFind[]; onceFinds?: HoardFind[]; repeatPerStandingHero?: boolean }
const none: ScenarioRewardRule = { kind: 'none', note: 'This scenario has no additional treasure reward. Experience and normal exploration are resolved in their own steps.' }
const gems: HoardFind = { id: 'gems', label: 'Gems worth 10 gc each', kind: 'item', itemName: 'Gem (worth 10 gc)', threshold: 5, quantity: { count: 1, sides: 3 } }
const mansionExtras: HoardFind[] = [
  { id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 5, sides: 6 } }, gems,
  { id: 'tome', label: 'Tome of Magic', kind: 'item', itemName: 'Tome of Magic', threshold: 4, quantity: 1 },
  { id: 'gromril', label: 'Gromril Sword', kind: 'item', itemName: 'Gromril Sword', threshold: 5, quantity: 1 },
  { id: 'athame', label: 'Athame', kind: 'item', itemName: 'Athame (first attack each game: dagger; later attacks: fist; trade value 10 gc)', threshold: 4, quantity: 1 },
  { id: 'herbs', label: 'Healing Herbs doses', kind: 'item', itemName: 'Healing Herbs', threshold: 4, quantity: { count: 1, sides: 3 } },
  { id: 'scroll', label: 'Dispel Scroll', kind: 'item', itemName: 'Dispel Scroll (one use: cancel a successfully cast spell on 4+; trade value 25+2D6 gc)', threshold: 5, quantity: 1 },
]
const initialBooty = (id: string, label: string, dice = false): HoardFind => ({ id, label, kind: 'item', itemName: label, quantity: dice ? { count: 1, sides: 3 } : 1, unclaimedBeforeBattle: true })
export const SCENARIO_REWARD_RULES: Record<string, ScenarioRewardRule> = {
  monster_hunt: { kind: 'hoard', winnerOnly: false, condition: { id: 'lair', question: 'Did your warband control the monster’s lair at the end?' }, note: 'The warband controlling the lair searches every row separately, including both light-armour finds. The magical artefact uses the campaign’s unique-artefact record.', finds: [
    { id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 5, sides: 6 } },
    { id: 'artefact', label: 'Magical artefact', kind: 'artefact', threshold: 6, quantity: 1 },
    { id: 'shards', label: 'Wyrdstone shards', kind: 'shards', threshold: 4, quantity: { count: 1, sides: 3, bonus: 1 } },
    { id: 'axe', label: 'Gromril Axe', kind: 'item', itemName: 'Gromril Axe', threshold: 5, quantity: 1 },
    { id: 'heavy', label: 'Heavy armour', kind: 'item', itemName: 'Heavy armour', threshold: 5, quantity: 1 },
    { id: 'light-one', label: 'First light armour', kind: 'item', itemName: 'Light armour', threshold: 4, quantity: 1 },
    { id: 'light-two', label: 'Second light armour', kind: 'item', itemName: 'Light armour', threshold: 4, quantity: 1 },
    { id: 'shield', label: 'Shield', kind: 'item', itemName: 'Shield', threshold: 4, quantity: 1 },
    { id: 'helmet', label: 'Helmet', kind: 'item', itemName: 'Helmet', threshold: 4, quantity: 1 },
    { id: 'swords', label: 'Swords', kind: 'item', itemName: 'Sword', threshold: 4, quantity: { count: 1, sides: 3 } }, gems,
    { id: 'jewellery', label: 'Jewellery worth D6×10 gc', kind: 'item', itemName: 'Jewellery (worth {amount} gc)', threshold: 5, quantity: { count: 1, sides: 6, multiplier: 10 }, quantityIsValue: true },
  ] },
  the_wizard_s_mansion: { kind: 'hoard', note: 'The winner gains the initial treasures not already found before the battle, then rolls independently for additional finds. Do not add equipment already issued to the defender again. The Wooden Man never leaves the mansion.', finds: [initialBooty('initial-mandrake', 'Mandrake Root', true), initialBooty('initial-shade', 'Crimson Shade', true), initialBooty('initial-charm', 'Lucky Charm'), initialBooty('initial-relic', 'Holy Relic'), initialBooty('initial-silk', 'Cathayan Silk Cloak'), ...mansionExtras] },
  lost_temple_of_the_slann: { kind: 'hoard', repeatPerStandingHero: true, note: 'The winner gains initial booty not already found before the battle, once. Then each participating Hero not taken out of action searches the complete hoard table, up to six Heroes. The Temple Stone Guard never leaves the temple.', onceFinds: [initialBooty('initial-venom', 'Dark Venom', true), initialBooty('initial-shade', 'Crimson Shade', true), initialBooty('initial-relic', 'Holy Relic'), initialBooty('initial-charm', 'Lucky Charm'), initialBooty('initial-armour', 'Heavy armour')], finds: mansionExtras.map(f => f.id === 'gold' ? { ...f, quantity: { count: 3, sides: 6 } } : f.id === 'athame' ? { id: 'cloak', label: 'Cloak of Mists', kind: 'item', itemName: 'Cloak of Mists (Hero only; enemy attacks −1 to hit; enemy Initiative −1 to spot the hidden wearer)', threshold: 5, quantity: 1 } : f) },
  wolf_hunt: { kind: 'bounty', note: 'Each slain wolf earns 10 gc, whether you won or lost. Bears earn no bounty. The accompanying Ranger is free only for this battle; retaining one requires normal recruitment.', label: 'Wolves slain by your warband', goldEach: 10 },
  the_rat_s_lair: { kind: 'bounty', note: 'Each vermin your warband takes out of action earns 5 gc. Winning is not required.', label: 'Vermin taken out of action by your warband', goldEach: 5 },
  river_watch: { kind: 'bounty', winnerOnly: true, condition: { id: 'defender', question: 'Was your warband the defender?' }, note: 'A victorious defender earns D6×20 gc plus 5 gc per enemy taken out of action. Attackers receive no scenario payment.', label: 'Enemies taken out of action by your warband', goldEach: 5, baseDice: { count: 1, multiplier: 20 } },
  the_ogham_stones: { kind: 'hoard', note: 'The winner receives gems and jewels worth 5D6 gc. Their rolled value is recorded on the stash item.', finds: [{ id: 'jewels', label: 'Gems and jewels worth 5D6 gc', kind: 'item', itemName: 'Ogham gems and jewels (worth {amount} gc)', quantity: { count: 5, sides: 6 }, quantityIsValue: true }] },
  dem_s_my_gubbinz: { kind: 'repeated', note: 'Each non-sacred Gubbin still held earns its own 2D6 gc. Exclude the Sacred Gubbin. There are five non-sacred counters in total.', label: 'Non-sacred Gubbin', max: 5, table: [{ min: 1, max: 6, goldDice: 2, label: 'Gubbin valuables' }] },
  battle_for_the_farm: { kind: 'repeated', note: 'Record each building your warband looted, using the D6 rolled during the battle. Each building may only be looted once: 1 nothing, 2–5 valuables worth 2D6 gc, 6 one shard. Winning is not required.', label: 'Looted building', table: [{ min: 1, max: 1, label: 'Empty building' }, { min: 2, max: 5, goldDice: 2, label: 'Valuables' }, { min: 6, max: 6, shards: 1, label: 'Wyrdstone' }] },
  death_in_the_mists: none,
  blood_hunt: { kind: 'none', note: 'The printed reward is experience, with no additional treasure. The free Dramatis Persona serves only for this scenario; this does not grant permanent recruitment.' },
  lost_in_the_bogs: none,
  a_stroll_in_the_garden: { kind: 'none', note: 'There is no separate treasure table. The scenario’s extra exploration die and optional whole-pool reroll are handled in Exploration.' },
  the_lair_of_the_snake: none,
  the_script_of_sigmar: { kind: 'none', note: 'These linked missions specify experience awards but no priced treasure reward for recovering the Script. Any agreed replacement objective (gold or wyrdstone) must be recorded as a scenario adjustment.' },
  that_s_all_mine: none,
  jungle_skirmish_the_fog_of_war: none,
  island_hopping: none,
  the_night_of_the_headless_one: { kind: 'hoard', winnerOnly: false, condition: { id: 'skull', question: 'Did your warrior carry the Skull off the opposite table edge?' }, note: 'Capturing the Skull by carrying it off the table awards the campaign relic. Merely winning by a rout does not. Future summoning must be resolved using the relic’s rules.', finds: [{ id: 'skull', label: 'Skull of the Headless One', kind: 'item', itemName: 'Skull of the Headless One (before each game D6: 1 lost; 2–5 ignored; 6 summon Headless One for that game, +125 rating; nominate a carrier who can lose the Skull)', quantity: 1 }] },
  rat_attack: none,
  surrounded: none,
  scourge_and_purge: none,
  the_pool: { kind: 'counters', max: 6, note: 'Keep the wyrdstone counters your warriors hold at the end. The pool contains D3+3 shards in total; a defeated carrier drops their counters.' },
  ambush: { kind: 'counters', label: 'Shards carried off or still held by Heroes', note: 'Keep the shards your Heroes carried off the board or still held when the game ended. Each defending Hero began with D3 shards; dropped shards belong only to the warrior who recovered them.' },
  forbidden_square: { kind: 'counters', max: 8, label: 'Shards stolen through the gate', note: 'Record only shards stolen through the gate. Shards offered at the totem vanish and are not added to your treasury. The battle starts with D6+2 shards.' },
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
