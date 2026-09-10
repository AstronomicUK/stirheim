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
  unitValueMultiplier?: number
  quantityIsValue?: boolean
  unclaimedBeforeBattle?: boolean
  multiplierRuling?: string
  itemOptions?: string[]
  chooseUpTo?: number
  quantity: number | { count: number; sides: number; bonus?: number; multiplier?: number }
}
export type ScenarioRewardRule =
  | { kind: 'choice'; note: string; question: string; options: { id: string; label: string; rule: ScenarioRewardRule }[] }
  | { kind: 'none'; note: string }
  | { kind: 'rock'; note: string }
  | { kind: 'raids'; note: string }
  | { kind: 'stop-thief'; note: string }
  | { kind: 'encampment'; note: string }
  | { kind: 'forbidden-square'; note: string }
  | { kind: 'gathering'; note: string }
  | { kind: 'brigands'; note: string }
  | { kind: 'hunters'; note: string }
  | { kind: 'caravan'; note: string }
  | { kind: 'docks'; note: string }
  | { kind: 'mule-train'; note: string }
  | { kind: 'kidnapped'; note: string }
  | { kind: 'herald'; note: string }
  | { kind: 'stake-out'; note: string }
  | { kind: 'recipe'; note: string }
  | { kind: 'ferry'; note: string }
  | { kind: 'horses'; note: string }
  | { kind: 'ambush'; note: string }
  | { kind: 'bounty'; note: string; label: string; goldEach: number; winnerOnly?: boolean; condition?: { id: string; question: string }; baseDice?: { count: number; multiplier: number } }
  | { kind: 'repeated'; bonusFinds?: HoardFind[]; note: string; label: string; max?: number; requiredCount?: number; extraPerWarband?: number; countSides?: number; tableDice?: number; condition?: { id: string; question: string }; winnerOnly?: boolean; attackerBonus?: number; table: { min: number; max: number; goldDice?: number; goldBonus?: number; shardDice?: number; shards?: number; itemName?: string; itemOptions?: string[]; itemQuantity?: HoardFind['quantity']; quantityIsValue?: boolean; label: string }[] }
  | { kind: 'counters'; max?: number; label?: string; note: string }
  | { kind: 'building'; note: string }
  | { kind: 'encounter'; note: string }
  | { kind: 'hoard'; note: string; needsRescue?: boolean; winnerOnly?: boolean; condition?: { id: string; question: string }; finds: HoardFind[]; containers?: { id: string; label: string; finds: HoardFind[] }[]; branches?: { question: string; options: { id: string; label: string; finds: HoardFind[] }[] }; onceFinds?: HoardFind[]; repeatPerStandingHero?: boolean }
const none: ScenarioRewardRule = { kind: 'none', note: 'This scenario has no additional treasure reward. Experience and normal exploration are resolved in their own steps.' }
const gems: HoardFind = { id: 'gems', label: 'Gems worth 10 gc each', kind: 'item', itemName: 'Gem (worth 10 gc)', threshold: 5, quantity: { count: 1, sides: 3 } }
const mansionExtras: HoardFind[] = [
  { id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 5, sides: 6 } }, gems,
  { id: 'tome', label: 'Tome of Magic', kind: 'item', itemName: 'Tome of Magic', threshold: 4, quantity: 1 },
  { id: 'gromril', label: 'Gromril Sword', kind: 'item', itemName: 'Gromril Sword', threshold: 5, quantity: 1 },
  { id: 'athame', label: 'Athame', kind: 'item', itemName: 'Athame', threshold: 4, quantity: 1 },
  { id: 'herbs', label: 'Healing Herbs doses', kind: 'item', itemName: 'Healing Herbs', threshold: 4, quantity: { count: 1, sides: 3 } },
  { id: 'scroll', label: 'Dispel Scroll', kind: 'item', itemName: 'Dispel Scroll', threshold: 5, quantity: 1 },
]
const initialBooty = (id: string, label: string, dice = false): HoardFind => ({ id, label, kind: 'item', itemName: label, quantity: dice ? { count: 1, sides: 3 } : 1, unclaimedBeforeBattle: true })
const hauntedFinds: HoardFind[] = [
  { id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 5, sides: 6, multiplier: 5 } },
  { id: 'shards', label: 'Wyrdstone shards', kind: 'shards', threshold: 4, quantity: { count: 1, sides: 3 } },
  { id: 'relic', label: 'Holy Relic', kind: 'item', itemName: 'Holy Relic', threshold: 5, quantity: 1 },
  { id: 'armour', label: 'Heavy armour', kind: 'item', itemName: 'Heavy armour', threshold: 5, quantity: 1 }, { ...gems, threshold: 4 },
  { id: 'cloak', label: 'Elven Cloak', kind: 'item', itemName: 'Elven Cloak', threshold: 5, quantity: 1 },
  { id: 'tome', label: 'Holy Tome', kind: 'item', itemName: 'Holy Tome', threshold: 5, quantity: 1 },
  { id: 'artefact', label: 'Magical artefact', kind: 'artefact', threshold: 5, quantity: 1 },
]
const TOMB_TREASURE_TABLE: Extract<ScenarioRewardRule, { kind: 'repeated' }>['table'] = [
    { min: 1, max: 1, label: 'Heavy armour', itemName: 'Heavy armour' },
    { min: 2, max: 2, label: 'Scimitars', itemName: 'Scimitar', itemQuantity: { count: 1, sides: 3 } },
    { min: 3, max: 3, label: 'Jambyias', itemName: 'Dagger', itemQuantity: { count: 1, sides: 6 } },
    { min: 4, max: 4, label: 'Gem-encrusted helmet', itemName: 'Gem-encrusted helmet (worth {amount} gc)', itemQuantity: { count: 1, sides: 6, multiplier: 10 }, quantityIsValue: true },
    { min: 5, max: 5, label: 'Shield', itemName: 'Shield' },
    { min: 6, max: 6, label: 'Monkey’s Paw', itemName: "Monkey's Paw" },
  ]
export const SCENARIO_REWARD_RULES: Record<string, ScenarioRewardRule> = {
  assault_on_the_rock: {kind:'rock',note:'Record actual room searches and conscripted Sisters. The winning warband resolves the recovered tome according to its faction. Record the ordinary tome-carrier XP separately under scenario objectives.'},
  raids:{kind:'raids',note:'Record actual jewellery, captured townsfolk, surrender and the post-raid pursuit. Captured resources can be spent in future exploration.'},
  stop_thief: {kind:'stop-thief',note:'Recover the actual stolen equipment or record the defending winner’s sale at half value; attacking winners roll 2D6 valuables.'},
  encampment_raid: {kind:'encampment',note:'The victorious attacker claims the defender’s existing equipment stash and records whether the camp is destroyed or occupied. Optional settlement housing consequences are recorded separately.'},
  the_forbidden_square: {kind:'forbidden-square',note:'Archive scenario: record actual placed/scored counters and the agreed ownership of recovered weapon counters.'},
  gathering_of_the_horde: {kind:'gathering',note:'Control of Executioner’s Square follows the defeat of Dirk or Valnor. Record the agreed controller of a victorious allied horde.'},
  brigands_in_the_pasturelands: {kind:'brigands',note:'Attackers claim per-casualty bounties; winning defenders may recruit one still-standing outlaw free, with normal upkeep.'},
  the_hunters_become_the_hunted: {kind:'hunters',note:'Record actual Beastmaster counters, plant-kill loot and captured Cold Ones. Only the winning warband receives the Cold One reward; its surviving units gain experience for each Cold One alive.'},
  happy_harpy_hunting_grounds: { kind: 'hoard', winnerOnly: true, note: 'Only the winning warband receives the nest, and only if all three Harpies were taken out before the others routed. Use the setup shards and Straggler choice recorded on Outcome. Roll separately for each remaining find.', finds: [
    { id: 'gold', label: 'Nest gold', kind: 'gold', threshold: 5, quantity: { count: 2, sides: 6 } },
    { id: 'dagger', label: 'Jeweled Dagger', kind: 'item', itemName: 'Jeweled Dagger', threshold: 3, quantity: 1 },
    { id: 'armour', label: 'Heavy Armour', kind: 'item', itemName: 'Heavy Armour', threshold: 5, quantity: 1 },
    { id: 'ithilmar', label: 'Ithilmar Sword', kind: 'item', itemName: 'Ithilmar Sword', threshold: 6, quantity: 1 },
    { id: 'gems', label: 'Gems worth 30 gc', kind: 'item', itemName: 'Gems (worth 30 gc)', threshold: 3, quantity: 1 },
    { id: 'cloak', label: 'Wolfcloak', kind: 'item', itemName: 'Wolfcloak', threshold: 6, quantity: 1 },
    { id: 'charm', label: 'Lucky Charm', kind: 'item', itemName: 'Lucky Charm', threshold: 3, quantity: 1 },
    { id: 'shields', label: 'Shields', kind: 'item', itemName: 'Shield', threshold: 4, quantity: { count: 1, sides: 3 } },
    { id: 'helmets', label: 'Helmets', kind: 'item', itemName: 'Helmet', threshold: 5, quantity: { count: 1, sides: 3 } },
    { id: 'swords', label: 'Swords', kind: 'item', itemName: 'Sword', threshold: 6, quantity: { count: 1, sides: 3 } },
  ] },
  in_the_dead_of_the_night: { kind: 'hoard', winnerOnly: true, note: 'The winner recovers D3 ritual shards. A defending warband that completed the ritual may also retain D3+3 summoned Zombies, within its warband limit; excess Zombies wander away.', finds: [{ id: 'ritual-shards', label: 'Ritual wyrdstone', kind: 'shards', quantity: { count: 1, sides: 3 } }] },
  kidnapped: { kind: 'kidnapped', note: 'Resolve the victim’s fate on the Experience step: holding the living victim grants 1 XP; rescuing grants D6 XP and 50 gc; sacrificing grants D6 XP and optional Shadowlord rewards for up to two Heroes.' },
  the_sword_of_the_herald: { kind: 'herald', note: 'Each Star Stone splinter carried off is worth three wyrdstone. The recovered sword may be kept by Possessed, Undead, Beastmen or Skaven, or handed over for 100 gc. These rewards also apply in the referee’s non-campaign mode.' },
  stagecoash_ambush: { kind: 'none', note: 'No extra gold or treasure reward is specified. Loaned mounts, the stage driver and one-off hired swords are for this battle only; do not add them as permanent rewards.' },
  stake_out: { kind: 'stake-out', note: 'Printed income: D6 wyrdstone for the loser, D6+1 for the winner. Use the exploration interpretation agreed at the start of this report. The source gives no draw income; an agreed draw award uses the explained adjustment.' },
  the_recipe: { kind: 'recipe', note: 'The nominated winning warband turns Geefer in for 5D6 gc. Unspoiled pies are worth 1 gc each to a losing warband or half their number, rounded up, to a winner. Winners also collect pies left in the cart; routed warbands keep the pies they carried away.' },
  bounty_hunting: { kind: 'repeated', winnerOnly: true, requiredCount: 6, extraPerWarband: 1, label: 'Bandit bounty', note: 'Six bandits plus one per warband involved. Each head has its own D6+5 gc bounty. The winner also captures six crossbows, D3 swords and 2D6 daggers; the rations have no value.', table: [{ min: 1, max: 6, label: 'Bandit surrendered to the authorities', goldDice: 1, goldBonus: 5 }], bonusFinds: [
    { id: 'crossbows', label: 'Captured crossbows', kind: 'item', itemName: 'Crossbow', quantity: 6 },
    { id: 'swords', label: 'Captured swords', kind: 'item', itemName: 'Sword', quantity: { count: 1, sides: 3 } },
    { id: 'daggers', label: 'Captured daggers', kind: 'item', itemName: 'Dagger', quantity: { count: 2, sides: 6 } },
  ] },

  the_bodyguards: { kind: 'choice', question: 'Which reward is your warband claiming?', note: 'Record the qualifying outcome, not just who won. The defender is paid if the merchant survives; an attacker is paid for returning the merchant or his head to the overlord.', options: [
    { id: 'none', label: 'No qualifying reward', rule: { kind: 'none', note: 'No merchant payment or equipment reward claimed.' } },
    { id: 'defender', label: 'Defender — merchant survived', rule: { kind: 'repeated', requiredCount: 1, max: 1, tableDice: 2, label: 'Merchant gift', note: 'The surviving merchant pays 7D6+20 gc and one gift from his own table.', bonusFinds: [{ id: 'payment', label: 'Merchant payment', kind: 'gold', quantity: { count: 7, sides: 6, bonus: 20 } }], table: [
      { min: 2, max: 2, label: 'Holy or Unholy Relic', itemOptions: ['Holy Relic', 'Unholy Relic'] },
      { min: 3, max: 5, label: 'Cathayan Silk Clothes', itemName: 'Cathayan Silks' },
      { min: 6, max: 8, label: 'Ithilmar Armour', itemName: 'Ithilmar Armour' },
      { min: 9, max: 10, label: 'Elven Cloak', itemName: 'Elven Cloak' },
      { min: 11, max: 12, label: 'Gromril Armour', itemName: 'Gromril Armour' },
    ] } },
    { id: 'attacker', label: 'Attacker — returned merchant or head', rule: { kind: 'repeated', requiredCount: 1, max: 1, tableDice: 2, label: 'Overlord gift', note: 'The warband returning the merchant or his head receives 4D6+15 gc and one gift.', bonusFinds: [{ id: 'payment', label: 'Overlord payment', kind: 'gold', quantity: { count: 4, sides: 6, bonus: 15 } }], table: [
      { min: 2, max: 2, label: 'Throwing Knives', itemName: 'Throwing Knives' },
      { min: 3, max: 5, label: 'Crossbow Pistol', itemName: 'Crossbow Pistol' },
      { min: 6, max: 8, label: 'Hunting Arrows', itemName: 'Hunting Arrows' },
      { min: 9, max: 10, label: 'Repeater Crossbow', itemName: 'Repeater Crossbow' },
      { min: 11, max: 12, label: 'Hunting Rifle', itemName: 'Hunting Rifle' },
    ] } },
  ] },

  protect_hornsby_s_ferry: { kind: 'ferry', note: 'Attacker victory: 3D6 gc each. Helping rough up the Hornsbys: 2D6 gc even after a loss. Successful defence with an unharmed family: 5D6 gc, less 2D6 patrol fees if the turn limit ended the battle; allied defenders agree their shares.' },
  defend_the_tomb: { kind: 'repeated', winnerOnly: true, requiredCount: 3, max: 3, label: 'Tomb treasure', table: TOMB_TREASURE_TABLE, note: 'The winner receives D6×10 gc, D3 gems valued at D6×5 gc each, and exactly three treasure-table rolls.', bonusFinds: [
    { id: 'gold', label: 'Tomb gold', kind: 'gold', quantity: { count: 1, sides: 6, multiplier: 10 } },
    { id: 'gems', label: 'Tomb gems', kind: 'item', itemName: 'Gem (worth {amount} gc)', quantity: { count: 1, sides: 3 }, unitValueMultiplier: 5 },
  ] },

  mordheim_s_burning: { kind: 'none', note: 'Only the winner explores, without the winner’s bonus die. Wyrdstone sales yield triple gold; the experience and injury steps use this scenario’s special rules. There is no separate treasure table.' },
  the_item_lost: { kind: 'hoard', winnerOnly: false, condition: { id: 'retrieved', question: 'Did your warband successfully retrieve the wand?' }, finds: [], branches: { question: 'How is the recovered wand resolved?', options: [
    { id: 'nicodemus', label: 'Working for Nicodemus — return the wand', finds: [{ id: 'payment', label: 'Nicodemus’s payment', kind: 'shards', quantity: 2 }] },
    { id: 'keep', label: 'Another warband — keep the wand', finds: [{ id: 'wand', label: 'Wand of Phyrros', kind: 'item', itemName: 'Wand of Phyrros', quantity: 1 }] },
    { id: 'sell', label: 'Another warband — sell the wand', finds: [{ id: 'sale', label: 'Wand sale', kind: 'gold', quantity: 100 }] },
  ] }, note: 'Nicodemus’s employers return the recovered wand for two shards. Other warbands may keep it or sell it for 100 gc. Winning by a rout does not itself establish possession; Nicodemus joins only for this battle.' },

  hunt_the_heretic: { kind: 'hoard', finds: [], branches: { question: 'Whom did your warband support?', options: [
    { id: 'witch-hunter', label: 'The Witch Hunter', finds: [
      { id: 'gold', label: 'Witch Hunter payment', kind: 'gold', quantity: { count: 1, sides: 6, multiplier: 15 } },
      { id: 'water', label: 'Blessed Water vials', kind: 'item', itemName: 'Blessed Water', quantity: { count: 1, sides: 3 } },
    ] },
    { id: 'warlock', label: 'The Warlock', finds: [
      { id: 'doses', label: 'Poison or drug doses', kind: 'item', itemOptions: ['Black Lotus', 'Crimson Shade', 'Dark Venom', 'Healing Herbs', 'Mad Cap Mushrooms', 'Mandrake Root', 'Manticore Spoor', 'Reptile Venom', 'Spider Spittle'], quantity: { count: 1, sides: 3 } },
    ] },
  ] }, note: 'Only the winning side receives payment. Choose each of the Warlock’s rolled doses separately; these are supplies, not permanent characteristic improvements. An agreed supplement-only substance can be recorded through the explained adjustment.' },

  the_gauntlet: { kind: 'counters', max: 3, label: 'Loose wyrdstone counters recovered', note: 'The central chamber contains D3 loose counters. The Great Treasure is explicitly chosen by the players before the game: record that agreed prize in the explained reward adjustment, separate from these loose shards.' },
  gift_of_the_truthsayers: { kind: 'repeated', requiredCount: 1, max: 1, tableDice: 2, condition: { id: 'artefact', question: 'Did your warband possess the artefact at the end?' }, label: 'Truthsayer gift', note: 'The holder rolls 2D6 on this scenario’s own table. These gifts are distinct from the core campaign’s six magical artefacts.', table: [
    { min: 2, max: 4, label: 'Valuable artefact', itemName: 'Truthsayer artefact (worth {amount} gc)', itemQuantity: { count: 5, sides: 6 }, quantityIsValue: true },
    { min: 5, max: 6, label: 'Totem of Light', itemName: 'Totem of Light' },
    { min: 7, max: 8, label: 'Silver Sickle', itemName: 'Silver Sickle' },
    { min: 9, max: 9, label: 'Talisman of Light', itemName: 'Talisman of Light' },
    { min: 10, max: 11, label: 'Tome of the Truthsayers', itemName: 'Tome of the Truthsayers' },
    { min: 12, max: 12, label: 'Vambrace of Silver', itemName: 'Vambrace of Silver' },
  ] },
  tomb_raid: { kind: 'repeated', countSides: 3, max: 3, winnerOnly: true, label: 'Tomb treasure', note: 'The winner rolls D3 for the number of finds, then a separate D6 for each treasure. Further dice determine the quantity or jewellery value.', table: TOMB_TREASURE_TABLE },
  scripts_of_sigmar: { kind: 'none', note: 'Neither linked mission specifies a priced treasure reward. Experience uses the selected mission; an agreed replacement for the Script is recorded as a scenario adjustment.' },
  the_battle_at_koleshire_keep: { kind: 'none', note: 'The source gives no post-battle treasure payment. Jarsyn’s 80 gc and Skaggle’s 90 gc are starting recruitment costs, not rewards.' },
  the_restless_dead: { kind: 'none', note: 'This wandering-undead encounter adds no separate treasure table. Any reward from an agreed underlying scenario must be recorded as an explained adjustment.' },
  the_square_of_the_snake: none,
  it_s_all_mine: none,
  raid: none,
  rescue: { kind: 'none', note: 'There is no additional treasure payment. Resolve the rescued warrior through the existing captive record; do not recruit a duplicate warrior.' },
  scourge_and_purge_archive_pestilen: none,
  romero_s_pride: { kind: 'none', note: 'This zombie incursion overlays a scenario chosen by the players and provides no separate treasure table. Record rewards from the agreed underlying scenario as an explained adjustment.' },
  street_brawl: none,
  ambush_archive_pestilen: none,
  breakthrough_archive_pestilen: none,
  grudge_match: none,
  ambush_archive_pestilen_michael_reuvers: { kind: 'ambush', note: 'The defender starts with D6 shards, capped at their number of Heroes. They keep that amount minus their Hero casualties; the attacker gains one per enemy Hero taken out of action, capped at the same starting amount.' },
  don_t_wake_the_giant: { kind: 'hoard', winnerOnly: false, note: 'Select only the two chests and/or the bag carried to safety. Each recovered container has its own treasure rolls; no winner requirement.', finds: [], containers: [
    ...[1, 2].map(n => ({ id: `chest-${n}`, label: `Treasure chest ${n}`, finds: [
      { id: 'gold', label: 'Gold crowns', kind: 'gold' as const, quantity: { count: 3, sides: 6 } },
      { id: 'shards', label: 'Wyrdstone shards', kind: 'shards' as const, threshold: 5, quantity: { count: 1, sides: 3 } }, gems,
      { id: 'map', label: 'Mordheim Map', kind: 'item' as const, itemName: 'Mordheim Map', threshold: 4, quantity: 1 },
      { id: 'armour', label: 'Light armour', kind: 'item' as const, itemName: 'Light armour', threshold: 4, quantity: 1 },
      { id: 'charm', label: 'Lucky Charm', kind: 'item' as const, itemName: 'Lucky Charm', threshold: 3, quantity: 1 },
    ] })),
    { id: 'bag', label: 'Bag of gold', finds: [{ id: 'gold', label: 'Gold crowns', kind: 'gold', quantity: { count: 1, sides: 6, multiplier: 10 } }, gems] },
  ] },
  defend_the_village: { kind: 'repeated', label: 'Village reward', max: 1, requiredCount: 1, winnerOnly: true, attackerBonus: 1, note: 'The winner rolls D6, adding +1 if they were the attacker: 1–2 nothing, 3–4 2D6 gc, 5–7 D3 shards.', table: [{ min: 1, max: 2, label: 'No payment' }, { min: 3, max: 4, goldDice: 2, label: 'Food, possessions and tools' }, { min: 5, max: 7, shardDice: 1, label: 'Wyrdstone' }] },
  the_watchers: { kind: 'repeated', label: 'Swag counter', note: 'Roll once for each Swag counter still held at the end. Each result awards one item from the printed table, even if your warband lost.', table: ['Lucky Charm', 'Tears of Shallya', 'Crimson Shade', 'Dark Venom', 'Cathayan Silks', 'Tome of Magic'].map((name, i) => ({ min: i + 1, max: i + 1, itemName: name, label: name })) },
  blood_on_the_pasturelands: { kind: 'horses', note: 'Add the horses successfully stolen, including those held by the winning warband when its opponent routed (six horses in total). If your warband routed, lose D3−1 of its stolen horses first.' },
  the_frenzied_mob: { kind: 'none', note: 'The printed looted-building reward is experience; no additional gold or items are specified.' },
  upon_the_eerie_downs: none,
  through_black_fire_pass: none,
  the_watchtower: { kind: 'none', note: 'There is no additional treasure reward. The defender’s arsenal weapons are loaned for this battle only.' },
  night_of_the_dead: { kind: 'counters', label: 'Wyrdstone successfully brought to safety', note: 'Record the shards actually recovered. The source offers alternative victory conditions; do not add the optional D6+2 victory target as a second treasure award.' },
  round_up_at_the_mordheim_corral: { kind: 'counters', note: 'Record the wyrdstone counters still held at the end, including any recovered after being dropped. Each successfully searched or tamed boar yields its D3 shards during the battle; do not roll or add them twice.' },
  haunted_treasure_archive_pestilen: { kind: 'hoard', winnerOnly: false, condition: { id: 'chest', question: 'Did your warband recover the chest to safety?' }, note: 'The recovered chest gives 5D6×5 gc automatically. Roll separately for each other find, and check any magical artefact against the campaign record.', finds: hauntedFinds },
  haunted_treasure: { kind: 'hoard', winnerOnly: false, condition: { id: 'chest', question: 'Did your warband recover the chest to safety?' }, note: 'Roll independently for each find. The Town Cryer gold line omits its multiplier; record the agreed ruling. The Archive Pestilen version explicitly uses ×5.', finds: hauntedFinds.map(f => f.id === 'gold' ? { ...f, multiplierRuling: 'The Town Cryer table prints “5D6× gc” without a multiplier. Record the value agreed at your table (the Archive Pestilen version uses ×5).' } : f) },
  protect_the_prince: { kind: 'hoard', note: 'The successful protector gains 4D6 gc; the winning attackers after the Prince’s death gain 2D6 gc and jewellery equivalent to two treasure pieces.', finds: [], branches: { question: 'How did your warband win?', options: [
    { id: 'escaped', label: 'Protected the Prince to safety', finds: [{ id: 'purse', label: 'Prince’s payment', kind: 'gold', quantity: { count: 4, sides: 6 } }] },
    { id: 'killed', label: 'Killed the Prince', finds: [{ id: 'purse', label: 'Prince’s purse', kind: 'gold', quantity: { count: 2, sides: 6 } }, { id: 'jewellery', label: 'Jewellery (two treasure pieces)', kind: 'shards', quantity: 2 }] },
  ] } },
  burn_the_witches: { kind: 'hoard', winnerOnly: false, note: 'Defenders keep whichever relics they rescued (each named relic exists once). Attackers instead pilfer D3+1 shards, even if they lost.', finds: [], branches: { question: 'Which side did your warband play?', options: [
    { id: 'defender', label: 'Defender — rescued relics', finds: [{ id: 'relics', label: 'Rescued relics', kind: 'item', itemOptions: ['Holy Tome', 'Holy Relic', 'Blessed Water'], chooseUpTo: 3, quantity: 0 }] },
    { id: 'attacker', label: 'Attacker — pilfered wyrdstone', finds: [{ id: 'shards', label: 'Pilfered wyrdstone', kind: 'shards', quantity: { count: 1, sides: 3, bonus: 1 } }] },
  ] } },
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
  lost_temple_of_the_slann: { kind: 'hoard', repeatPerStandingHero: true, note: 'The winner gains initial booty not already found before the battle, once. Then each participating Hero not taken out of action searches the complete hoard table, up to six Heroes. The Temple Stone Guard never leaves the temple.', onceFinds: [initialBooty('initial-venom', 'Dark Venom', true), initialBooty('initial-shade', 'Crimson Shade', true), initialBooty('initial-relic', 'Holy Relic'), initialBooty('initial-charm', 'Lucky Charm'), initialBooty('initial-armour', 'Heavy armour')], finds: mansionExtras.map(f => f.id === 'gold' ? { ...f, quantity: { count: 3, sides: 6 } } : f.id === 'athame' ? { id: 'cloak', label: 'Cloak of Mists', kind: 'item', itemName: 'Cloak of Mists', threshold: 5, quantity: 1 } : f) },
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
  the_night_of_the_headless_one: { kind: 'hoard', winnerOnly: false, condition: { id: 'skull', question: 'Did your warrior carry the Skull off the opposite table edge?' }, note: 'Capturing the Skull by carrying it off the table awards the campaign relic. Merely winning by a rout does not. Future summoning must be resolved using the relic’s rules.', finds: [{ id: 'skull', label: 'Skull of the Headless One', kind: 'item', itemName: 'Skull of the Headless One', quantity: 1 }] },
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
    { id: 'sickle', label: 'Magic Sickle (+1 WS)', kind: 'item', itemName: 'Magic Sickle', threshold: 6, discoveryDice: 2, quantity: 1 },
    { ...gems, threshold: 7, discoveryDice: 2, quantity: { count: 1, sides: 6 } },
    { id: 'bone', label: 'Ancient Bone Armour (4+ save; otherwise light armour)', kind: 'item', itemName: 'Ancient Bone Armour', threshold: 8, discoveryDice: 2, quantity: 1 },
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

  the_caravan: { kind: 'caravan', note: 'Record escaped and looted wagons. At least two escaped wagons means a defender victory unless the defender betrayed the caravan.' },
  the_caravan_archive_pestilen: { kind: 'caravan', note: 'Use the actual cargo from setup. A Friend in the Business affects trading only when that optional variant was used.' },
  down_at_the_docks: { kind: 'docks', note: 'Raiders roll separately for each retained crate. Exclude goods lost while routing. In multiplayer, the defending warband instead earns 25 gc per crate remaining on the battlefield.' },
  mule_train: { kind: 'mule-train', note: 'Only count mules led safely off the table. Routing abandons mules still in play. Defenders earn 2D6 gc per escaped mule; attackers keep recovered mules and roll once for the combined cargo, adding +1 per mule beyond the first to discovery rolls.' },
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
