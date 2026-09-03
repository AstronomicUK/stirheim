// Ranged weapon + creature-attack catalogue — converted from rules/02-weapons-armour-equipment.md
// (mordheimer.net source): "## Missile Weapons" (lines 752-990), "## Blackpowder Weapons"
// (lines 990-1244), and "## Animal Bestiary" (lines 2483-2668).
//
// id reuse: bow, longbow, crossbow, pistol, blunderbuss, handgun, hochland_long_rifle (source
// heading "Hunting Rifle"), throwing_knife (source heading "Throwing Knives/Stars"), sling and
// wardog_bite match ids used by saved characters in browser localStorage.
//
// Range bands: the source gives a single "Range" figure. Per the core shooting rules, missile
// fire suffers -1 to hit beyond half its listed range, so shortRange = maxRange / 2 is the default
// split; weapons whose own rules ignore range penalties ("Thrown Weapon", "Accurate") get
// shortRange = maxRange. Range is informational — the engine uses the "Long range" context toggle.
//
// Mechanical fields (wired into engine/buildAttackInput.ts):
//   saveModifier    — positive = harder for the defender (Elf Bow -1, pistols/handguns -2,
//                     Warplock -3, Swivel Ball -2 / Chain -1); negative = easier (Blowpipe,
//                     Belaying Pins +1, and a 6+ save if none).
//   ignoresArmourSave — Sun Gauntlet, Sunstaff, Sunstaff (Lustria).
//   moveOrFire      — cannot fire in a turn the shooter moved (unless Nimble).
//   multiShotToHitPenalty — -1 on every shot when firing more than once (repeaters).
//   toHitBonus      — Duelling pistols +1 (Accuracy), Nehekharan Javelins +1.
//   noCriticals     — Blowpipe.
//   autoWoundOnNaturalSixToHit — Blowpipe poison.
//   strength "user" — thrown weapons that strike at the user's own Strength (javelins, throwing
//                     knives; Belaying Pins at user -1).
//
// Items that don't fit the Weapon shape at all (auto-hit lines, double barrels, scatter, area
// effects, entangle) are modelled as their single-shot baseline with a TODO — search "TODO".
//
// Animal Bestiary: critCategory is "unarmed" for every entry. strength is "user" wherever the
// source prints the creature's own Strength stat, so a custom stat entry drives the attack; Giant
// Spider's Poisoned Attack fixes its effective Strength at 4 (and explicitly does not apply the
// Strength-4 armour modifier). Mule and Riding/Draft Horse don't fight, so have no entry.

import type { Weapon } from "../../types";

export const RANGED_AND_CREATURE_WEAPONS: Weapon[] = [
  // ---- Missile Weapons ----
  { id: "belaying_pins", name: "Belaying Pins", type: "ranged", strength: "user", strengthBonus: -1, critCategory: "missile", concussion: false, saveModifier: -1, special: ["thrownWeaponNoRangePenalty", "movingPenaltyStillApplies"], rangedProfile: { shortRange: 6, maxRange: 6, shotsPerTurn: 1 } },
  { id: "blowpipe", name: "Blowpipe", type: "ranged", strength: 1, critCategory: "missile", concussion: false, saveModifier: -1, noCriticals: true, autoWoundOnNaturalSixToHit: true, poisoned: true, special: ["stealthyFiringWhileHidden"], rangedProfile: { shortRange: 4, maxRange: 8, shotsPerTurn: 1 } },
  // TODO: Bolas doesn't wound in the normal sense — a hit Entangles the target (-2 WS, cannot move until
  // freed on a 4+), and a natural 1 to hit hits the wielder with a S3 hit instead. Strength is a placeholder.
  { id: "bolas", name: "Bolas", type: "ranged", strength: 3, critCategory: "missile", concussion: false, special: ["entangleInsteadOfWound", "dangerousBackfireS3OnNatural1ToHit", "singleUsePerBattle"], rangedProfile: { shortRange: 8, maxRange: 16, shotsPerTurn: 1 } },
  { id: "bow", name: "Bow", type: "ranged", strength: 3, critCategory: "missile", concussion: false, special: [], rangedProfile: { shortRange: 12, maxRange: 24, shotsPerTurn: 1 } },
  // TODO: Cathayan Candles explode in the thrower's own hand on a natural 1 to hit.
  { id: "cathayan_candles", name: "Cathayan Candles", type: "ranged", strength: 6, critCategory: "missile", concussion: false, special: ["thrownWeaponNoRangeOrMovingPenalty", "volatileExplodesInThrowersHandOnNatural1", "setsTargetOnFireOnD6Of5Plus"], rangedProfile: { shortRange: 6, maxRange: 6, shotsPerTurn: 1 } },
  { id: "crossbow", name: "Crossbow", type: "ranged", strength: 4, critCategory: "missile", concussion: false, moveOrFire: true, special: [], rangedProfile: { shortRange: 15, maxRange: 30, shotsPerTurn: 1 } },
  { id: "crossbow_pistol", name: "Crossbow Pistol", type: "ranged", strength: 4, critCategory: "missile", concussion: false, special: ["usableInFirstRoundOfCloseCombatExtraMinus2ToHit", "canBeUsedAsPistolInMeleeStrength4"], rangedProfile: { shortRange: 5, maxRange: 10, shotsPerTurn: 1 } },
  { id: "elf_bow", name: "Elf Bow", type: "ranged", strength: 3, critCategory: "missile", concussion: false, saveModifier: 1, special: [], rangedProfile: { shortRange: 18, maxRange: 36, shotsPerTurn: 1 } },
  { id: "firepots_miragliano", name: "Firepots Miragliano", type: "ranged", strength: 2, critCategory: "missile", concussion: false, special: ["thrownWeaponNoRangePenalty", "movingPenaltyStillApplies", "smokeForcesInitiativeTestOrCannotChargeOrShootNextTurn"], rangedProfile: { shortRange: 8, maxRange: 8, shotsPerTurn: 1 } },
  { id: "fish_hook_shot", name: "Fish-hook Shot", type: "ranged", strength: 3, critCategory: "missile", concussion: false, special: ["thrownWeaponNoRangeOrMovingPenalty", "canTargetModelsInCloseCombat", "canAttemptToCauseFallInsteadOfWound"], rangedProfile: { shortRange: 3, maxRange: 3, shotsPerTurn: 1 } },
  { id: "harpoon_crossbow", name: "Harpoon Crossbow", type: "ranged", strength: 5, critCategory: "missile", concussion: false, moveOrFire: true, special: ["prepareShotFullTurnBeforeFiring"], rangedProfile: { shortRange: 15, maxRange: 30, shotsPerTurn: 1 } },
  { id: "javelins", name: "Javelins", type: "ranged", strength: "user", critCategory: "missile", concussion: false, special: ["thrownWeaponNoRangeOrMovingPenalty"], rangedProfile: { shortRange: 8, maxRange: 8, shotsPerTurn: 1 } },
  { id: "longbow", name: "Longbow", type: "ranged", strength: 3, critCategory: "missile", concussion: false, special: [], rangedProfile: { shortRange: 15, maxRange: 30, shotsPerTurn: 1 } },
  { id: "nehekharan_javelins", name: "Nehekharan Javelins", type: "ranged", strength: "user", critCategory: "missile", concussion: false, toHitBonus: 1, special: ["thrownWeaponNoRangeOrMovingPenalty"], rangedProfile: { shortRange: 8, maxRange: 8, shotsPerTurn: 1 } },
  { id: "repeater_crossbow", name: "Repeater Crossbow", type: "ranged", strength: 3, critCategory: "missile", concussion: false, multiShotToHitPenalty: 1, special: ["fireTwiceIsOptional"], rangedProfile: { shortRange: 12, maxRange: 24, shotsPerTurn: 2 } },
  { id: "short_bow", name: "Short Bow", type: "ranged", strength: 3, critCategory: "missile", concussion: false, special: [], rangedProfile: { shortRange: 8, maxRange: 16, shotsPerTurn: 1 } },
  // Sling: may fire twice at -1 to hit if it did not move and the target is within half range — modelled as the single-shot baseline.
  { id: "sling", name: "Sling", type: "ranged", strength: 3, critCategory: "missile", concussion: false, special: ["fireTwiceAtMinus1IfStationaryWithinHalfRange"], rangedProfile: { shortRange: 9, maxRange: 18, shotsPerTurn: 1 } },
  { id: "sun_gauntlet", name: "Sun Gauntlet", type: "ranged", strength: 4, critCategory: "missile", concussion: false, ignoresArmourSave: true, special: ["accurateIgnoresLongRangePenalty", "usableInMeleeAtStrength4NoSave"], rangedProfile: { shortRange: 12, maxRange: 12, shotsPerTurn: 1 } },
  { id: "sunstaff", name: "Sunstaff", type: "ranged", strength: 4, critCategory: "missile", concussion: false, ignoresArmourSave: true, special: ["accurateIgnoresLongRangePenalty"], rangedProfile: { shortRange: 24, maxRange: 24, shotsPerTurn: 1 } },
  { id: "sunstaff_lustria", name: "Sunstaff (Lustria)", type: "ranged", strength: 4, critCategory: "missile", concussion: false, ignoresArmourSave: true, special: ["accurateIgnoresLongRangePenalty", "alsoUsableInCloseCombat"], rangedProfile: { shortRange: 12, maxRange: 12, shotsPerTurn: 1 } },
  { id: "throwing_knife", name: "Throwing Knife", type: "ranged", strength: "user", critCategory: "missile", concussion: false, special: ["thrownWeaponNoRangeOrMovingPenalty", "cannotBeUsedInCloseCombat"], rangedProfile: { shortRange: 6, maxRange: 6, shotsPerTurn: 1 } },
  { id: "tufenk", name: "Tufenk", type: "ranged", strength: 2, critCategory: "missile", concussion: false, special: ["setsTargetOnFireOnD6Of4Plus", "prepareShotReloadEveryOtherTurn", "strength3VsDryTargetsLikeMummies"], rangedProfile: { shortRange: 4, maxRange: 8, shotsPerTurn: 1 } },

  // ---- Blackpowder Weapons ----
  // TODO: Blunderbuss doesn't roll to hit — every model in a 16" x 1" line is automatically hit at S3.
  { id: "blunderbuss", name: "Blunderbuss", type: "ranged", strength: 3, critCategory: "missile", concussion: false, special: ["autoHitLine16inLongBy1inWide", "fireOncePerBattle"], rangedProfile: { shortRange: 16, maxRange: 16, shotsPerTurn: 1 } },
  // TODO: same auto-hit line mechanic as Blunderbuss above.
  { id: "chaos_dwarf_blunderbuss", name: "Chaos Dwarf Blunderbuss", type: "ranged", strength: 3, critCategory: "missile", concussion: false, special: ["autoHitLine16inLongBy1inWide", "prepareShotReloadEveryOtherTurn"], rangedProfile: { shortRange: 16, maxRange: 16, shotsPerTurn: 1 } },
  // TODO: Double-barrelled weapons roll to hit once but can resolve two wound rolls when firing both barrels; modelled as the single-barrel baseline.
  { id: "double_barrelled_duelling_pistol", name: "Double-barrelled Duelling Pistol", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, toHitBonus: 1, special: ["prepareShotReloadEveryOtherTurnUnlessBrace", "doubleBarrelledOptionalSecondWoundRollPerHit", "usableInMelee"], rangedProfile: { shortRange: 4, maxRange: 9, shotsPerTurn: 1 } },
  { id: "double_barrelled_handgun", name: "Double-barrelled Handgun", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, moveOrFire: true, special: ["prepareShotReloadEveryOtherTurn", "doubleBarrelledOptionalSecondWoundRollPerHit"], rangedProfile: { shortRange: 12, maxRange: 24, shotsPerTurn: 1 } },
  { id: "double_barrelled_pistol", name: "Double-barrelled Pistol", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, special: ["prepareShotReloadEveryOtherTurnUnlessBrace", "doubleBarrelledOptionalSecondWoundRollPerHit", "usableInMelee"], rangedProfile: { shortRange: 3, maxRange: 6, shotsPerTurn: 1 } },
  { id: "duelling_pistol", name: "Duelling Pistol", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, toHitBonus: 1, special: ["prepareShotReloadEveryOtherTurnUnlessBrace", "usableInMelee"], rangedProfile: { shortRange: 5, maxRange: 10, shotsPerTurn: 1 } },
  // TODO: Hand-held Mortar scatters 2D6" on a miss and hits everything within 1.5" of the landing spot.
  { id: "hand_held_mortar", name: "Hand-held Mortar", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, moveOrFire: true, special: ["prepareShotReloadEveryOtherTurn", "scatter2D6OnMiss", "experimentalBlackpowderRulesAlwaysOn", "explosiveRadius1AndHalfIn"], rangedProfile: { shortRange: 12, maxRange: 24, shotsPerTurn: 1 } },
  { id: "handgun", name: "Handgun", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, moveOrFire: true, special: ["prepareShotReloadEveryOtherTurn"], rangedProfile: { shortRange: 12, maxRange: 24, shotsPerTurn: 1 } },
  // TODO: Pigeon Bombs replace the BS to-hit roll with a flat D6 (5-6 hits, 1 explodes in hand) plus a blast radius.
  { id: "hersten_wenkler_pigeon_bombs", name: "Hersten-Wenkler Pigeon Bombs", type: "ranged", strength: 4, critCategory: "missile", concussion: false, moveOrFire: true, special: ["temperamentalD6ToHitInsteadOfBS", "explosiveRadiusOnLanding", "suppyReplenishesEachGame"], rangedProfile: { shortRange: null, maxRange: null, shotsPerTurn: 1 } },
  { id: "hochland_long_rifle", name: "Hochland Long Rifle", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, moveOrFire: true, special: ["prepareShotReloadEveryOtherTurn", "pickAnyTargetInSight"], rangedProfile: { shortRange: 24, maxRange: 48, shotsPerTurn: 1 } },
  // TODO: double-barrelled mechanic (two S4 hits per successful to-hit roll).
  { id: "ostlander_double_barrelled_hunting_rifle", name: "Ostlander Double-barrelled Hunting Rifle", type: "ranged", strength: 4, critCategory: "missile", concussion: false, moveOrFire: true, special: ["prepareShotReloadEveryOtherTurn", "doubleBarrelledTwoHitsPerSuccessfulShot"], rangedProfile: { shortRange: 24, maxRange: 48, shotsPerTurn: 1 } },
  { id: "ostlander_double_barrelled_pistol", name: "Ostlander Double-barrelled Pistol", type: "ranged", strength: 4, critCategory: "missile", concussion: false, special: ["prepareShotReloadEveryOtherTurnUnlessBrace", "doubleBarrelledTwoHitsPerSuccessfulShot", "usableInMelee"], rangedProfile: { shortRange: 3, maxRange: 6, shotsPerTurn: 1 } },
  { id: "pistol", name: "Pistol", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, special: ["prepareShotReloadEveryOtherTurnUnlessBrace", "usableInMelee"], rangedProfile: { shortRange: 3, maxRange: 6, shotsPerTurn: 1 } },
  { id: "repeater_handgun", name: "Repeater Handgun", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, moveOrFire: true, multiShotToHitPenalty: 1, special: ["fireUpToThriceIsOptional", "experimentalBlackpowderRulesAlwaysOn", "slowReloadFullInactiveTurnToReload"], rangedProfile: { shortRange: 12, maxRange: 24, shotsPerTurn: 3 } },
  { id: "repeater_pistol", name: "Repeater Pistol", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 2, multiShotToHitPenalty: 1, special: ["fireUpToThriceIsOptional", "experimentalBlackpowderRulesAlwaysOn", "quickReloadAlwaysAtLeastOneShot"], rangedProfile: { shortRange: 3, maxRange: 6, shotsPerTurn: 3 } },
  // TODO: the Swivel Gun is one mount with three ammunition profiles; split into three entries. Always under blackpowder misfire rules.
  { id: "swivel_gun_ball_shot", name: "Swivel Gun (Ball Shot)", type: "ranged", strength: 5, critCategory: "missile", concussion: true, saveModifier: 2, moveOrFire: true, special: ["cumbersomeMinus1InitiativeMinus1Movement", "blackpowderMisfireRulesAlwaysOn", "singleUsePerGameAmmunitionType"], rangedProfile: { shortRange: 18, maxRange: 36, shotsPerTurn: 1 } },
  { id: "swivel_gun_chain_shot", name: "Swivel Gun (Chain Shot)", type: "ranged", strength: 4, critCategory: "missile", concussion: false, saveModifier: 1, moveOrFire: true, special: ["allWrappedUpKnocksDownUnwoundedTargetOn4Plus", "cumbersomeMinus1InitiativeMinus1Movement", "blackpowderMisfireRulesAlwaysOn", "singleUsePerGameAmmunitionType"], rangedProfile: { shortRange: 12, maxRange: 24, shotsPerTurn: 1 } },
  { id: "swivel_gun_grape_shot", name: "Swivel Gun (Grape Shot)", type: "ranged", strength: 3, critCategory: "missile", concussion: false, moveOrFire: true, special: ["itsEverywhereD6AdditionalModelsWithin4inHit", "noArmourSaveModifier", "cumbersomeMinus1InitiativeMinus1Movement", "blackpowderMisfireRulesAlwaysOn", "singleUsePerGameAmmunitionType"], rangedProfile: { shortRange: 12, maxRange: 24, shotsPerTurn: 1 } },
  { id: "warplock_pistol", name: "Warplock Pistol", type: "ranged", strength: 5, critCategory: "missile", concussion: false, saveModifier: 3, special: ["prepareShotReloadEveryOtherTurnUnlessBrace", "usableInMelee"], rangedProfile: { shortRange: 4, maxRange: 8, shotsPerTurn: 1 } },

  // ---- Animal Bestiary: creature attacks ----
  { id: "gnoblar_sharp_stuff", name: "Gnoblar Sharp Stuff", type: "ranged", strength: 2, critCategory: "unarmed", concussion: false, special: ["thrownWeapon"], rangedProfile: { shortRange: 8, maxRange: 8, shotsPerTurn: 2 } },
  { id: "wardog_bite", name: "Wardog Bite", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: [], rangedProfile: null },
  { id: "chaos_steed_attack", name: "Chaos Steed Attack", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: [], rangedProfile: null },
  { id: "cold_one_attack", name: "Cold One Attack", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: ["causesFear"], rangedProfile: null },
  { id: "elven_steed_attack", name: "Elven Steed Attack", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: [], rangedProfile: null },
  { id: "giant_spider_bite", name: "Giant Spider Bite", type: "melee", strength: 4, critCategory: "unarmed", concussion: false, special: ["poisonedAttackNoArmourSaveStrengthModifier"], rangedProfile: null },
  { id: "giant_wolf_attack", name: "Giant Wolf Attack", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: [], rangedProfile: null },
  { id: "nightmare_attack", name: "Nightmare Attack", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: ["immuneToPoison", "immuneToPsychology"], rangedProfile: null },
  // TODO: Rhinox also has Thunderous Charge, Skull of Iron and Staggered-but-not-down — only its baseline attack is modelled.
  { id: "rhinox_gore", name: "Rhinox Gore", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: ["causesFear"], rangedProfile: null },
  { id: "temple_dog_attack", name: "Temple Dog Attack", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: ["magical", "causesFear", "ferociousChargePlus1StrengthWhenCharging"], rangedProfile: null },
  { id: "war_boar_attack", name: "War Boar Attack", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: ["ferociousChargePlus2StrengthWhenCharging"], rangedProfile: null },
  { id: "warhorse_attack", name: "Warhorse Attack", type: "melee", strength: "user", critCategory: "unarmed", concussion: false, special: [], rangedProfile: null },
];
