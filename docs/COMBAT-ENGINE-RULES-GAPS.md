# Core combat engine — rules audit (audit #11 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet sent to the Stirheim Developer
**Sources compared:** `reference/rules/01-introduction-and-rules.md` — shooting (lines 621-812: who
can shoot, hitting, hit modifiers, wounding, criticals, ward saves, injuries) and close combat (813-1020:
hitting, parry, wounding, weapon modifiers, criticals, armour, armour save modifiers, ward saves,
injuries, attacking stunned and knocked-down warriors) — plus the weapon special rules in
`reference/rules/02-weapons-armour-equipment.md`, against everything in `src/rules/engine/`
(`toHit`, `toWound`, `armourSave`, `crit`, `injury`, `resolveAttack`, `turnAggregate`,
`buildAttackInput`), `src/rules/data/weapons/*` and `src/features/match/fight/*`.

**Method.** Compared both charts cell by cell, then each rule clause against its implementation.
Then took every `special` tag on all 138 base weapons (123 distinct) and checked which are read
anywhere outside the data, and for the unread ones whether a typed field carries the mechanic instead.

---

## What is modelled

This is the strongest part of the codebase. Both charts match the source **cell for cell**, and the
`toWound` file records a correction made against the rulebook scan where the original project brief
had the S8-S10 rows wrong — that is exactly the right way to handle a source disagreement.

Rules I checked individually and found correct:

- **To Hit**, melee (opposed Weapon Skill) and ranged (flat Ballistic Skill, including the 0 and
  negative thresholds for BS 7+ with the natural-1-always-fails convention).
- **All four shooting modifiers**: cover, long range, moving and shooting, large target — plus a
  pavise counting as cover, and skills that ignore a specific modifier.
- **To Wound**, with impossible combinations held as a real "cannot wound" value rather than a 7.
- **Armour saves**: 6+/5+/4+ by armour type, shield +1, kite shield +2, a shield alone giving 6+, a
  save that would need 7+ treated as no save, and the Strength erosion chart behind a house-rule
  toggle that is off by default per Tom's ruling.
- **Ward saves** in the right order: after the armour save, once per wound, still allowed when a crit
  ignores armour entirely, and the better of two wards taken.
- **Criticals**: only on a natural 6 to wound, **not** when the attacker needed a 6 anyway, one per
  warrior per phase, the standard three-band chart, and the optional per-category charts with their
  own effects (ignoring helmet saves, separate saves per wound, automatic out-of-action, knock-down).
- **Parry**, in full and with real care: strictly beating the attacker's to-hit die so a 6 can never
  be parried, one attempt per phase, buckler-and-sword re-rolling a failed parry while two swords do
  not, Master of Blades getting a second attempt and beating-or-matching, and — the clause I expected
  to be missing — **a model may not parry an attack of twice or more his own Strength**, implemented
  as `parryStrength < 2 * defender.S`, with the Ogre Club counting one Strength higher two-handed.
- **Injury**: the 1-2 / 3-4 / 5-6 bands with Concussion, True Grit and Hard to Kill remaps, helmet and
  Thick Skull stun-avoidance saves, and a documented precedence when several remaps could apply.
- **Attacking stunned and knocked-down warriors**: automatic hits against knocked down, automatic
  out-of-action against stunned, melee only.
- **Phase aggregation** is done as an exact probability walk over (parries used, crit consumed, wounds
  taken, worst severity) rather than by approximation.

I could not find a mistake in any chart or in any core rule.

---

## A. Gaps

1. **No weapon can cause more than one wound.** The `Weapon` type has no wounds field, so a weapon
   whose own rule inflicts multiple wounds is treated as inflicting one. The Ball and Chain's
   Incredible Force — "any hit that successfully wounds will do 1D3 wounds instead of 1" — is tagged
   in the data as `multipleWoundsD3OnHit` and read nowhere. This also makes the rulebook's tie-break
   inexpressible: "If a critical hit causes more than 1 wound, and the weapon normally causes several
   wounds, use the one that causes the most damage." The crit path has `woundsCaused`, so the shape
   exists; the weapon side does not.
2. **A handful of weapon rules are tagged in the data and read nowhere.** These are mechanics with no
   typed field behind them, so they change nothing in the calculator:

   | Weapon | Rule not applied |
   |---|---|
   | Ball and Chain | D3 wounds per wounding hit (above) |
   | Censer | Toughness test or the hit wounds automatically |
   | Ostlander Double-barrelled Hunting Rifle | two hits per successful shot |
   | Double-barrelled pistols | the optional second wound roll per hit |
   | Slingshot | fire twice at -1 if stationary and within half range |
   | Swivel Gun shot types | each ammunition type is single use per game |
   | Pebble, Throwing Knife | cannot be used in close combat |
   | Pistols and the Sun Gauntlet | usable in melee (already logged in audit #2) |

3. **The tag list needs a sweep, but it is not as bad as the raw count suggests.** Of 123 distinct
   `special` tags across 138 base weapons, only 13 are read outside the data. That number badly
   overstates the problem: most unread tags are **labels sitting beside a typed field that the engine
   does read**. `cuttingEdge` accompanies `saveModifier: 1`; `whipcrackBonusAttack` accompanies
   `chargeBonusAttacks: 1`; `permanentPoison` accompanies `poisoned: true` and
   `autoWoundOnNaturalSixToHit: true`; the gromril and ithilmar tags accompany the `saveModifier` and
   `initiativeModifier` the variant generator sets. Those are harmless.

   The list in finding 2 is what I verified as genuinely unbacked. The remaining unread tags are
   mostly tabletop-only (random movement, reach in inches, mounted-only, area templates) and belong
   as text. But nobody has walked the list systematically, so **a one-pass sweep asking "does a typed
   field carry this?" is worth doing** — that is how I found the eight above, and I did not check all
   110.

---

## B. Out of scope here

4. Psychology — fear, frenzy, hatred, all alone, stupidity — is audit #12 and is deliberately not
   covered above, though the engine already reads several trait ids.
5. Positional rules (who can shoot, shooting into combat, the closest-target rule, charging,
   breaking from combat) are properly out of a calculator's reach and read correctly as text.

---

## C. Fine as text

The narrative weapon rules, the movement effects of cumbersome weapons, and the board-facing halves
of the black powder rules belong at the table. The engine's habit of citing the source line beside
each rule (`01:836-848`, `03:4221-4276`) makes this file unusually easy to audit, and is worth
keeping up in whatever gets built from these findings.
