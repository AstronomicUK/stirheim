// What kit does on the table (audit A3, A4, A6, A10, A12). Read by the fight calculator's loadout
// mapping (features/match/fight/combatants.ts), the rout check and the post-battle consumable
// bookkeeping. Anything with a real rules effect the engine can carry is here; tabletop-only
// effects (fire, entangling, smoke) stay as notes.

import type { ItemEffect } from "./types";

const UNDEAD_AND_POSSESSED = ["undead", "possessed"];

export const ITEM_EFFECTS: Record<string, ItemEffect> = {
  nicodemus_staff: {note:"Nicodemus’s staff uses its two-handed club/parry mode here. If Sword of Rezhebel is active, resolve the spell combination separately: the off-hand staff is then an ordinary club and neither weapon grants parry."},
  lantern_rig: {note:"Lantern Rig: add 4 inches when spotting hidden enemies on the tabletop; both hands remain free for weapons."},
  hillman_fur_cloak: {ownSave:{melee:6,missile:5},note:"Heavy Fur Cloak: man form only, 6+ armour in melee and 5+ against ranged attacks. Discard all equipment in wolf form; recover it after battle. Wolf transformation must be resolved separately."},
  dark_emissary_spiral: { wardSave: 5, note: "The Spiral: unmodifiable 5+ save." },
  truthsayer_triskele: { wardSave: 4, note: "The Triskele: unmodifiable 4+ save." },
  dark_emissary_staff: { note: "Staff of Darkness: +1 to casting rolls; applied in Cast a Spell." },
  ninja_gnoblar_shurikens: {note:"Stealthy: throwing these shurikens does not reveal the hidden Ninja unless the target passes an Initiative test. Resolve visibility on the tabletop."},
  sabertooth_tiger_hide: {ownSave:{melee:6,missile:5},note:"Sabertooth Tiger Hide: 6+ armour in melee, 5+ against missiles; normal save modifiers apply."},
  abdul_eye_pendant: {wardSave:4,note:"The Eye Pendant: 4+ ward save. Before attacking Abdul, an Undead warrior must pass a Leadership test; resolve that prerequisite on the tabletop."},
  thief_cloak: {toBeHit:{missile:-1},note:"Thief’s Cloak: enemy missiles are -1 to hit; double the distance required to spot the hidden thief on the tabletop."},
  kislev_ranger_cloak: {note:"Hunter’s Cloak: shooting while hidden does not reveal the Ranger unless the target passes an Initiative test. Resolve visibility on the tabletop."},
  // ---- Traits ----
  bear_claw_necklace: { traits: ["frenzy"], note: "Bear-Claw Necklace: subject to Frenzy." },
  red_toof_tribal_jewellery: { traits: ["frenzy"], note: "Red Toof Tribal Jewellery: subject to Frenzy." },
  hammer_of_witches: { traits: ["hatred"], note: "Hammer of Witches: hates Possessed, Skaven, Beastmen, Chaos, Daemons, Dark Elves, Orcs and Goblins and the Sisters of Sigmar." },
  venom_ring: { traits: ["immune_to_poison"], note: "Venom Ring: immune to all poisons." },
  lookout_gnoblar: { skills: ["dodge"], note: "Lookout-Gnoblar: the Ogre has Dodge." },
  luck_gnoblar: { note: "Luck-Gnoblar: one re-roll during the battle." },

  // ---- Saves and being hit ----
  amulet_of_the_moon: { missileWardSave: 5, toBeHit: { missile: -1 }, note: "Amulet of the Moon: -1 to be hit by missiles and a 5+ special save against them." },
  elven_cloak: { toBeHit: { missile: -1 }, note: "Elven Cloak: -1 to be hit by missiles." },
  forest_cloak: { toBeHit: { missile: -1 }, note: "Forest Cloak: -1 to be hit by missiles while beside a tree, bush or hedge (assumed)." },
  sea_dragon_cloak: { ownSave: { melee: 5, missile: 4 }, note: "Sea Dragon Cloak: 5+ save in close combat, 4+ against missiles; taken as the cloak's own save, not added to armour." },
  wolfcloak: { saveBonus: { missile: 1, savesFromNothing: true }, note: "Wolfcloak: +1 to armour saves against shooting." },
  bearcloak: { saveBonus: { missile: 1, savesFromNothing: true }, note: "Bearcloak: +1 to armour saves against shooting." },
  horo: { saveBonus: { missile: 1, savesFromNothing: true, note: "only while mounted" }, note: "Horo: +1 to armour saves against ranged weapons while mounted (6+ from nothing)." },
  cathayan_quilted_silk_armour: { saveBonus: { melee: 1, missile: 1, savesFromNothing: true }, note: "Cathayan Quilted Silk Armour: +1 to armour saves against any attack, combined with any armour." },
  shield_of_sigmar: { missileWardSave: 6, note: "Shield of Sigmar: a 6+ special save against all ranged attacks." },
  peg_leg: { afterSave: 6, note: "Peg Leg: an unmodified 6+ save after any failed save, even when no save is normally allowed." },
  lucky_charm: { firstHitDiscard: 4, note: "Lucky Charm: the first hit of the battle is discarded on a 4+." },
  enchanted_skins: { wardSave: 6, note: "Enchanted Skins: 6+ special save against every wound; unaffected by enemy magic on a 5+." },
  temple_dog: { note: "Temple Dog: unmodifiable 5+ save; fights as a mount (not modelled)." },

  // ---- Extra attacks ----
  hook_hand: { extraWeaponId: "dagger", note: "Hook Hand: counts as a dagger in that hand; no two-handed weapons." },
  sword_gnoblar: { extraWeaponId: "sword_gnoblar_attack", note: "Sword-Gnoblar: one extra Strength 2 attack at the Ogre's Weapon Skill." },
  iron_shod_boots: { extraWeaponId: "iron_shod_boots_kick", note: "Iron Shod Boots: an extra kick attack each turn at -1 to hit." },

  // ---- Leadership (rout check) ----
  holy_unholy_relic: { leadership: { autoPassFirstTest: true, note: "Holy Relic: the first Leadership test of the game is passed automatically (the first Rout test, if the leader carries it and has tested for nothing else)." } },
  war_horn: { leadership: { bonus: 1, note: "War Horn: +1 Leadership for one turn, once per battle; may be sounded just before a Rout test." }, consumable: "use" },
  war_horn_of_nagarythe: { leadership: { bonus: 1, note: "War Horn of Nagarythe: as a War Horn." }, consumable: "use" },
  vodka: { leadership: { bonus: 1, note: "Vodka: +1 Leadership for every warrior this game (maximum 10); each warrior tests Toughness before the game or is at -1 Initiative." }, consumable: "battle" },
  banner: { leadership: { allAloneReroll: true, note: "Banner: friends within 12\" re-roll failed All Alone tests." } },
  clan_pestilens_banner: { leadership: { allAloneReroll: true, note: "Clan Pestilens Banner: friends within 12\" re-roll failed All Alone tests." } },
  jolly_roger: { leadership: { note: "Jolly Roger: Pirates within 12\" never count as all alone." } },
  standard_of_nagarythe: { leadership: { note: "Standard of Nagarythe: Shadow Warriors within 12\" re-roll failed Leadership tests." } },
  sashimono: { leadership: { note: "Sashimono: re-roll non-rout Leadership tests, keeping the second roll." } },
  bugmans_ale: { traits: ["immune_to_fear"], consumable: "battle", preBattle: { label: "Drunk before the battle", appliesTo: "self", traits: ["immune_to_fear"], note: "The whole warband is immune to fear this battle." } },
  elven_wine: { traits: ["immune_to_fear"], consumable: "battle", preBattle: { label: "Drunk before the battle", appliesTo: "self", traits: ["immune_to_fear"], note: "The warband is immune to fear this battle." } },

  // ---- Poisons and coatings (used up per battle) ----
  // Core poisons: "Poison may not be used with blackpowder weapons" (02:1966), so a coating never touches
  // a pistol or handgun. (One vial poisons one weapon — 02:1967 — is still pending a weapon choice on the tick.)
  dark_venom: { consumable: "battle", preBattle: { label: "Weapon coated with Dark Venom", appliesTo: "nonBlackpowder", strengthBonus: 1 } },
  black_lotus: { consumable: "battle", preBattle: { label: "Weapon coated with Black Lotus", appliesTo: "nonBlackpowder", autoWoundOnSixToHit: true } },
  spider_spittle: { consumable: "battle", preBattle: { label: "Weapon laced with Spider Spittle", appliesTo: "allWeapons", note: "A warrior hit must pass a Toughness test or is paralysed (table rule)." } },
  manticore_spoor: { consumable: "battle", preBattle: { label: "Weapon smeared with Manticore Spoor", appliesTo: "allWeapons", note: "A wounded model rolls a D6 each turn: 1 loses a wound, 6 ends the poison (table rule)." } },
  reptile_venom: { consumable: "battle", preBattle: { label: "Reptile Venom on the missile weapon", appliesTo: "ranged", strengthBonus: 1, strengthBonusNoSaveModifier: true } },
  poisoned_weapon: { preBattle: { label: "Forest Goblin poison (permanent)", appliesTo: "allWeapons", injuryRollBonus: 1 }, note: "Poisoned Weapon: +1 to injury rolls with the poisoned weapon." },
  scenario_hunting_bolts: { consumable: "battle", preBattle: { label: "Shooting Hunting Bolts", appliesTo: "crossbows", injuryRollBonus: 1 } },
  hunting_arrows: { preBattle: { label: "Shooting Hunting Arrows", appliesTo: "bows", injuryRollBonus: 1 } },
  asp_arrows: { preBattle: { label: "Shooting Asp Arrows", appliesTo: "bows", toHitBonus: 1 } },
  fire_arrows: { consumable: "battle", preBattle: { label: "Shooting Fire Arrows", appliesTo: "bows", note: "A hit sets the target alight on a 4+ (table rule)." } },
  superior_blackpowder: { consumable: "battle", preBattle: { label: "Loaded with Superior Blackpowder", appliesTo: "blackpowder", strengthBonus: 1 } },

  // ---- Drugs (used up per battle) ----
  mandrake_root: {
    consumable: "battle",
    preBattle: { label: "Took Mandrake Root", appliesTo: "self", toughnessBonus: 1, stunnedBecomesKnockedDown: true, noEffectOn: UNDEAD_AND_POSSESSED, note: "After the battle roll 2D6: on 2-3 the model loses a point of Toughness for good." },
    postBattle: [{ key: "side_effects", label: "Mandrake Root side effects", trigger: "used", dice: "2D6", text: "Mandrake Root is highly poisonous. At the end of the battle, roll 2D6.", outcomes: [{ min: 2, max: 3, text: "The model loses 1 point of Toughness permanently.", effect: { statDelta: { T: -1 } } }, { min: 4, max: 12, text: "No lasting harm." }] }],
  },
  crimson_shade: {
    consumable: "battle",
    preBattle: { label: "Took Crimson Shade", appliesTo: "self", strengthBonus: 1, initiativeBonusDice: 3, noEffectOn: UNDEAD_AND_POSSESSED, note: "+1 Movement as well (table). After the battle roll 2D6: 2-3 addicted, 12 permanent +1 Initiative." },
    postBattle: [{ key: "side_effects", label: "Crimson Shade side effects", trigger: "used", dice: "2D6", text: "After the battle, roll 2D6.", outcomes: [{ min: 2, max: 3, text: "The model becomes addicted: buy him a new batch of Crimson Shade before every battle from now on, or he leaves the warband.", effect: { flag: "addicted" } }, { min: 4, max: 11, text: "No lasting effect." }, { min: 12, max: 12, text: "The model's Initiative is increased permanently by +1.", effect: { statDelta: { I: 1 } } }] }],
  },
  mad_cap_mushrooms: {
    consumable: "battle",
    preBattle: { label: "Ate Mad Cap Mushrooms", appliesTo: "self", traits: ["frenzy"], noEffectOn: UNDEAD_AND_POSSESSED, note: "After the battle roll a D6: on a 1 the model becomes permanently stupid." },
    postBattle: [{ key: "side_effect", label: "Mad Cap Mushrooms side effect", trigger: "used", dice: "D6", text: "After the battle, roll a D6.", outcomes: [{ min: 1, max: 1, text: "The model becomes permanently stupid.", effect: { flag: "stupidity" } }, { min: 2, max: 6, text: "He shakes it off." }] }],
  },
  hardtack_biscuits: {
    consumable: "use",
    preBattle: { label: "Eating Hardtack this turn", appliesTo: "self", toughnessBonus: 1, note: "+1 Toughness for this turn and the enemy's; on a 1 afterwards the pirate misses the next game." },
    postBattle: [{ key: "tainted", label: "Hardtack: were the biscuits tainted?", trigger: "used", dice: "D6", text: "Roll a D6 after the turn the biscuits were eaten.", outcomes: [{ min: 1, max: 1, text: "Tainted and filled with maggots: the pirate misses the next game as he recovers.", effect: { flag: "missNextGame" } }, { min: 2, max: 6, text: "Wholesome enough." }] }],
  },
  cathayan_silk_clothes: {
    note: "Cathayan Silk Clothes: the leader's warband may re-roll its first failed Rout test.",
    postBattle: [{ key: "ruined", label: "Cathayan Silk Clothes: ruined?", trigger: "leaderOutOfAction", dice: "D6", text: "The leader was taken out of action wearing the silk clothes: roll a D6.", outcomes: [{ min: 1, max: 3, text: "The clothes are ruined and must be discarded.", effect: { removeItem: true } }, { min: 4, max: 6, text: "The clothes survive, a little muddied." }] }],
  },
  treasure_map: {
    consumable: "use",
    preBattle: { label: "Following the Treasure Map", appliesTo: "self", note: "Roll a D6 after the game to see where the map leads." },
    postBattle: [
      {
        key: "where",
        label: "Treasure Map: where does it lead?",
        trigger: "used",
        dice: "D6",
        text: "Roll a D6 after the game (gold found is the profit after the crew's shares).",
        outcomes: [
          { min: 1, max: 1, text: "A fake! You trounce the swine who sold it and he pays D6x5 gc to make amends.", effect: { gold: { dice: 1, perPoint: 5 }, removeItem: true } },
          { min: 2, max: 2, text: "A minor stash: a chest with 1 shard of wyrdstone and jewels worth 2D6x10 gc.", effect: { shards: 1, gold: { dice: 2, perPoint: 10 }, removeItem: true } },
          { min: 3, max: 3, text: "Long Drong Slayer's alestash: a barrel of Bugman's XXXX (add Bugman's Ale to the stash by hand) and the rest sold for 2D6x10 gc.", effect: { gold: { dice: 2, perPoint: 10 }, removeItem: true } },
          { min: 4, max: 4, text: "Facio's stash: fine clothes and blackmail notebooks. Next visit, buy any one regular item as Common; the notebooks sell for 2D6x10 gc; +1 Leadership when testing whether captives join.", effect: { gold: { dice: 2, perPoint: 10 }, removeItem: true } },
          { min: 5, max: 5, text: "A booby-trapped chest: a hero passes an Initiative test to claim a Lucky Charm as well, or misses the next game (add the charm or the missed game by hand). 3D6x10 gc either way.", effect: { gold: { dice: 3, perPoint: 10 }, removeItem: true } },
          { min: 6, max: 6, text: "Black-Wyrd the Pirate King's burial spot (see the item text for the full haul; enter the wyrdstone and gold by hand).", effect: { removeItem: true } },
        ],
      },
    ],
  },
  lamp_of_the_djinn: {
    preBattle: { label: "Rubbing the Lamp after the battle", appliesTo: "self", note: "Mark it to roll the three wishes in the report." },
    postBattle: [1, 2, 3].flatMap((n) => [
      {
        key: `wish${n}_light`,
        label: `Lamp of the Djinn: wish ${n} (Light)`,
        trigger: "used" as const,
        dice: "D6" as const,
        optional: true,
        text: "Each wish is a roll on the Light table paired with a roll on the Dark table.",
        outcomes: [
          { min: 1, max: 1, text: "Gain D6 experience points (enter the roll as extra experience).", effect: {} },
          { min: 2, max: 2, text: "Gain one skill from your skill list (add it by hand)." },
          { min: 3, max: 3, text: "Gain D6x10 gc.", effect: { gold: { dice: 1, perPoint: 10 } } },
          { min: 4, max: 4, text: "Gain a random item from the equipment list (add it by hand)." },
          { min: 5, max: 5, text: "Choose an item from the equipment list (add it by hand)." },
          { min: 6, max: 6, text: "Roll twice more on this chart (use the other wishes' rows)." },
        ],
      },
      {
        key: `wish${n}_dark`,
        label: `Lamp of the Djinn: wish ${n} (Dark)`,
        trigger: "used" as const,
        dice: "D6" as const,
        optional: true,
        text: "The Dark roll that goes with the wish.",
        outcomes: [
          { min: 1, max: 2, text: "Nothing happens." },
          { min: 3, max: 3, text: "Lose D6x10 gc.", effect: { gold: { dice: 1, perPoint: -10 } } },
          { min: 4, max: 4, text: "Lose D6 weapons (remove them by hand)." },
          { min: 5, max: 5, text: "Lose the lamp.", effect: { removeItem: true } },
          { min: 6, max: 6, text: "Roll once on the injury chart (roll it in the injuries section by marking the hero out of action, or by hand)." },
        ],
      },
    ]),
  },
  monkeys_paw: {
    postBattle: [
      ...[1, 2, 3].map((n) => ({
        key: `wish${n}`,
        label: `Monkey's Paw: wish ${n} (Light)`,
        trigger: "used" as const,
        dice: "D6" as const,
        optional: true,
        text: "Three wishes on the Light table; the Dark table is rolled once per use.",
        outcomes: [
          { min: 1, max: 1, text: "Gain D6 experience points (enter the roll as extra experience)." },
          { min: 2, max: 2, text: "Gain one skill from your skill list (add it by hand)." },
          { min: 3, max: 3, text: "Gain D6x10 gc.", effect: { gold: { dice: 1, perPoint: 10 } } },
          { min: 4, max: 4, text: "Gain an extra Hero even above your maximum (recruit him by hand)." },
          { min: 5, max: 5, text: "Gain an extra Henchman even above your maximum (recruit him by hand)." },
          { min: 6, max: 6, text: "Roll twice more on this chart." },
        ],
      })),
      {
        key: "dark",
        label: "Monkey's Paw: the Dark side",
        trigger: "used",
        dice: "D6",
        text: "Rolled once each time the paw is used.",
        outcomes: [
          { min: 1, max: 1, text: "Lose D6 experience points (enter it as negative extra experience)." },
          { min: 2, max: 2, text: "Lose one random skill (remove it by hand)." },
          { min: 3, max: 3, text: "Lose D6x10 gc.", effect: { gold: { dice: 1, perPoint: -10 } } },
          { min: 4, max: 4, text: "Lose a Hero (the table decides who; dismiss him by hand)." },
          { min: 5, max: 5, text: "Lose a Henchman (dismiss one by hand)." },
          { min: 6, max: 6, text: "Lose the paw.", effect: { removeItem: true } },
        ],
      },
    ],
    consumable: "use",
    preBattle: { label: "Rubbing the Monkey's Paw after the battle", appliesTo: "self", note: "Mark it to roll the wishes in the report. After the third use it disappears." },
  },
  tears_of_shallaya: { consumable: "battle", preBattle: { label: "Drank the Tears of Shallaya", appliesTo: "self", traits: ["immune_to_poison"] } },
  healing_herbs: { consumable: "use", note: "Healing Herbs: a Hero restores all lost Wounds at the start of recovery, outside hand-to-hand combat. Reusable unless the campaign uses the single-use house rule." },

  // ---- Other consumables ----
  garlic: { consumable: "battle", note: "Garlic: a Vampire must pass a Leadership test to charge the bearer." },
  blessed_water: { consumable: "use", note: "Blessed Water: thrown, one automatic wound on Undead, Daemons or Possessed, no armour save." },
  caltrops: { consumable: "use" },
  flash_powder: { consumable: "use" },
  firecrackers: { consumable: "use" },
  smoke_bomb: { consumable: "use" },
  fire_bomb: { consumable: "use" },
  cathayan_candles: { consumable: "battle" },
  torch: { consumable: "battle" },
  victuals: { consumable: "use" },

  // ---- Fire modes (audit A10) ----
  repeater_crossbow: { altFire: { label: "Single shot", shots: 1, toHitPenalty: 0, hint: "One shot with no penalty instead of two at -1." } },
  repeater_handgun: { altFire: { label: "Single shot", shots: 1, toHitPenalty: 0, hint: "One shot with no penalty instead of three at -1." } },
  repeater_pistol: { altFire: { label: "Single shot", shots: 1, toHitPenalty: 0, hint: "One shot with no penalty instead of three at -1." } },
  sling: { altFire: { label: "Two shots at half range", shots: 2, toHitPenalty: 1, hint: "Standing still and within 9\": fire twice, both at -1 to hit." } },
  slingshot: { altFire: { label: "Two shots at half range", shots: 2, toHitPenalty: 1, hint: "Standing still and within 9\": fire twice, both at -1 to hit." } },

  // ---- Weapon upgrades applied to a base weapon (the base is written on the item's note) ----
  dark_elf_blade: {
    upgrade: { bases: ["sword", "dagger"], apply: { concussion: true, critTableRollModifier: 1 }, namePrefix: "Dark Elf", note: "A Dark Elf Blade is a sword or dagger upgrade: the base weapon keeps its rules, gains Concussion and +1 on the critical chart." },
  },
  darksteel_blade: {
    upgrade: { bases: "anyMelee", apply: { concussion: true, critTableRollModifier: 1 }, namePrefix: "Darksteel", note: "A Darksteel Blade is an upgrade to a hand weapon: the base keeps its rules, gains Concussion and +1 on the critical chart." },
  },
  sons_of_hashut_obsidian_weapon: {
    upgrade: { bases: ["sword", "axe", "hammer"], apply: { strengthBonus: 1, initiativeModifier: -1 }, namePrefix: "Obsidian", note: "Sons of Hashut obsidian: a sword, axe or hammer keeping its own rules, at +1 Strength and -1 Initiative." },
  },

  // ---- Mutations ----
  great_claw: { extraWeaponId: "great_claw", note: "Great Claw: an extra attack at +1 Strength; no weapon in that arm." },
  scorpion_tail: { extraWeaponId: "scorpion_tail", note: "Scorpion Tail: an extra Strength 5 attack each close combat phase (Strength 2 against a target immune to poison)." },
  hideous_mutation: { traits: ["causes_fear"], note: "Hideous: causes Fear." },
  daemon_soul: { note: "Daemon Soul: a 4+ save against spells and prayers." },
  cloven_hoofs: { note: "Cloven Hoofs: +1 Movement (enter it on the profile)." },
  tentacle: { note: "Tentacle: the opponent in close combat loses one attack (minimum 1), the mutant's choice." },
  blackblood: { note: "Blackblood: a Strength 3 hit on everyone in base contact when the model loses a wound in close combat." },
  spines: { note: "Spines: an automatic Strength 1 hit on models in base contact at the start of each close combat phase." },
  extra_arm: { note: "Extra Arm: a single-handed weapon in the extra arm for +1 attack, or a shield or buckler; pick the weapon in the calculator's off-hand." },

  // ---- Blessings of Nurgle ----
  nurgles_rot: { traits: ["immune_to_poison"], note: "Nurgle's Rot: a 6 to wound in close combat infects a living target with the Rot (mark it on their roster); immune to poison." },
  mark_of_nurgle: { traits: ["immune_to_poison"], note: "Mark of Nurgle: immune to poison (+1 Wound on the profile)." },
  cloud_of_flies: { toBeHit: { melee: -1 }, note: "Cloud of Flies: close combat opponents are at -1 to hit." },
  hideous: { traits: ["causes_fear"], note: "Hideous: causes Fear." },
  bloated_foulness: { note: "Bloated Foulness: +1 Wound and +1 Toughness, -1 Movement, on the profile." },
  stream_of_corruption: { extraWeaponId: "stream_of_corruption", note: "Stream of Corruption: a 6\" Strength 3 shooting attack with no armour save." },

  warpstone_amulet: { note: "Warpstone Amulet: one re-roll during the battle, or one exploration die if the owner ended the game standing." },

  wardogs: { note: "Wardog: fights as a warrior on the battle sheet (M6 WS4 S4 T3), counts for rout tests, rolls a henchman's injury die after the game." },
  gnoblar_fighter: { note: "Gnoblar Fighter: fights as a warrior on the battle sheet, never counts for rout tests, rolls a henchman's injury die after the game." },

  // ---- Notes only ----
  swivel_gun: { note: "Swivel Gun: pick the shot type on the calculator; every shot type is a separate one-battle supply." },
};
