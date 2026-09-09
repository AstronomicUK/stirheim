# Psychology and traits — rules audit (audit #12 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** written under Tom's overnight pre-authorisation; sent to the
Stirheim Developer without his prior review (he reads it on waking)
**Sources compared:** `reference/rules/01-introduction-and-rules.md` lines 1072-1160 (all alone,
fear, frenzy, hatred, stupidity, animosity) and the racial special-rules sections of every warband in
`reference/rules/warbands/*.md`, against `src/rules/data/traits.ts`,
`src/features/match/fight/combatants.ts`, `src/rules/engine/buildAttackInput.ts`,
`src/rules/types/index.ts` (CombatContext) and `src/rules/types/roster.ts` (WarriorFlags).

**Method.** Read each psychology rule against its implementation, then probed every unit template in
all 73 warband templates: for each psychology rule its special rules mention, does the app actually give that
unit the matching trait?

---

## What is modelled

- **Frenzy is correct**, including the subtlety: Attacks are doubled, and the off-hand weapon's own
  +1 is added afterwards rather than doubled with them.
- **Hatred is correct**: re-roll missed to-hit rolls, gated to the first turn of a hand-to-hand combat
  against a hated enemy, with its own context toggle.
- **The traits catalogue is honest.** Each entry carries a `modeled` flag and a description saying
  exactly what is and is not computed, with the source cited. That is the right way to carry a rule
  the tool does not evaluate.
- **Injury-derived psychology flows through properly.** Madness gives stupidity or frenzy, Hardened
  gives immunity to fear, Horrible Scars gives causes-fear, and Bitter Enmity's target becomes the
  hatred flag — all four reach the fight calculator as traits.
- **The Restless Dead (Variant) is done properly**: its units carry explicit `traitIds` for No Pain,
  immune to poison, immune to psychology and causes fear.

---

## A. Gaps

1. **Psychology traits are assigned in exactly one warband out of 73.** `traitIds` on a unit template
   appears **only in `variants.ts`**, which is The Restless Dead (Variant). Every other warband
   depends on `traitsFromRules`, which matches special-rule *names* against a ten-entry table — and
   that table has no psychology entries at all. The result, measured across every unit template:

   | Rule the unit's own text gives it | Unit templates | That get the trait |
   |---|---|---|
   | Causes fear | 60 | 0 |
   | Immune to psychology | 36 | 0 |
   | Stupidity | 17 | 0 |
   | Immune to fear | 2 | 0 |
   | Animosity | 13 | 0 (no trait exists) |

   So the fight calculator never shows a Vampire, a Possessed, a Rat Ogre or a Troll as causing fear,
   and never shows the Undead as immune to psychology, even though the traits for both exist in the
   catalogue and one warband already uses them. The pattern was set correctly once and never followed.
   Extending `TRAIT_BY_RULE_NAME` with the psychology headings would fix most of it in one edit.
2. **Fear's combat effect is not modelled, and it is combat maths.** The rule: a model that fails a
   Fear test "must roll 6s to score hits in that round of combat". That is a to-hit threshold change,
   squarely inside the calculator's remit, and there is no `CombatContext` toggle for it. The
   `causes_fear` trait's own description says it has "no Hit/Wound/Injury math effect for this tool",
   which is not accurate for this clause. A toggle beside the existing charging and hated-enemy
   toggles would cover it.
3. **Animosity has no structure anywhere.** Thirteen unit templates carry it, it is a D6 table with
   three distinct outcomes rolled per Orc or Goblin henchman every turn, and the only trace of it in
   the app is the Boss Pole item's "Ignore Animosity" note and the Forest Goblin Brave's skill that
   removes it (audit #3). There is no trait, no table and nothing for those two to switch off.
4. **All Alone is not modelled and its immunities cannot be recorded.** The test itself is positional
   and belongs at the table. But several warband rules grant immunity to it — Troll Slayers'
   Deathwish, Norse Explorers' Barbarian Courage, Marauders' Heart of the Warrior — and there is no
   flag to hold that, so the sheet cannot tell a player that this warrior never takes the test.
5. **Frenzy does not end when the model is knocked down or stunned.** "If a frenzied model is knocked
   down or stunned, he is no longer frenzied. He continues to fight as normal for the rest of the
   battle." The trait is permanent once set, so a frenzied warrior keeps double Attacks in the
   calculator for the whole battle. Minor, since the player can untick it, but it is a real clause.
6. **Stupidity has no effect even where it could.** A model that fails is unable to fight in
   hand-to-hand that turn, which the calculator could express as zero attacks. It is marked
   `modeled: false` and there is no toggle. Reasonable as scope, noted for completeness.

---

## B. Smaller points

7. **Terror has no representation.** The `immune_to_fear` trait's description mentions Terror being
   treated as Fear, but no unit template's rules text mentions terror and the app has no terror
   concept. The rules reference does mention it a dozen times across warband pages, so this is worth a
   look when someone next touches the warband data rather than a finding in its own right.
8. **`traitsFromRules` matches on the rule name only, never the text**, which is a deliberate and
   sensible choice (matching prose would produce false positives). It does mean a unit whose fear rule
   is titled something colourful will be missed even after finding 1 is fixed, so the fix should be
   checked against the actual rule headings rather than assumed.

---

## C. Fine as text

The movement and positional halves of every psychology rule — fleeing 2D6" toward the table edge,
frenzied models being forced to charge, the shambling and drooling outcomes of failed Stupidity,
Animosity's "I 'Erd Dat!" charge — belong at the table. The traits catalogue already carries them as
descriptions, which is the right depth for a tracker that does not model the board.
