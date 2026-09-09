# Experience and advances — rules audit (audit #6 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet pushed to FEEDBACK-TRACKER.md
**Sources compared:** `reference/rules/03-campaigns-magic-optional-rules.md` lines 230-340 (Experience,
earning experience, advances, underdogs, the two Advance tables, new skills, characteristic increase
and the racial maximum profiles), plus lines 1065-1075 (veteran recruits) and the scenario experience
blocks in `reference/rules/06-scenarios.md`, against `src/rules/data/campaign/experience.ts`,
`src/rules/resolve/advances.ts`, `src/rules/resolve/recruitment.ts`, `src/rules/resolve/builder.ts`,
`src/features/advances/model.ts`, `src/features/postBattle/model/xp.ts`,
`src/features/postBattle/wizard/*`, `src/features/roster/view/lookups.ts` and
`src/features/importer/rosterImport.ts`.

**Method.** Read each rule against the code implementing it. Then probed every unit template in all 73
warband templates for starting experience and worked out what the roster would report for each.

---

## What is modelled

This area is built closer to the rulebook than anything else I have audited.

- **Both Advance tables are exact**, band for band, including the sub-rolls on 6, 8 and 9 and the
  wizard's option to generate a spell instead of a skill.
- **All 30 racial maximum profiles** are present with correct numbers, plus two more (Necrarch Vampire,
  Wolfman) added by an earlier audit where the generic row was wrong.
- **Advance boxes** are separated for heroes and henchmen, and the half-rate units in
  `campaignRules` double their thresholds.
- **Henchman rules are right.** The +1-per-characteristic cap is tracked per stat in `statIncreases`,
  racial maxima are checked as well, and when a roll lands on something already increased or maxed the
  app asks for a re-roll in the rulebook's own words rather than quietly substituting.
- **The lad's got talent is faithful.** `promoteHenchman` keeps the henchman's experience and stat
  increases, requires exactly two skill tables and validates them against the warband, emits the
  immediate Heroes-table advance, shrinks the group and tells the remaining members to re-roll,
  re-rolling 10-12. The hero cap is checked and passed in from the feature layer, and units the rules
  say are never promoted (Ungors, Bowmen, Wretches) are re-rolled with their own note.
- **The underdog table** is correct and applied per survivor, with the bonus computed from the two
  ratings and a switch to turn it off.
- **Starting experience grants no advances at warband creation.** `startingLevelUps` records the boxes
  the starting experience has already crossed, so nothing is owed on day one — which is exactly the
  rule. The roster importer does the same.
- **Veteran recruits** are implemented properly: the 2D6 pool, each recruit consuming the group's
  experience from it, and the 2 gc per extra experience point.

---

## A. Bugs

1. **Heroes recruited mid-campaign are credited with advances they never earned.**
   `builder.ts` computes `startingLevelUps` so a new warband's Captain owes nothing for his starting
   experience. `recruitment.ts` — the path used after a battle — sets `levelUps: 0` instead, at both
   `recruitment.ts:145` (heroes) and `:283` (henchman groups). `xpProgress` in
   `features/roster/view/lookups.ts:181` then reports
   `advancesOwed = boxes crossed - levelUps`, so every box the starting experience already crossed
   reads as an advance waiting to be rolled.

   **211 of the hero templates across the 73 warband templates have starting experience**, so this is close to
   universal rather than an edge case. A Mercenary Champion recruited at 8 experience shows four
   advances owed. The worst case I found is the Lustrian Reavers Conqueror at 24 experience, who
   arrives owing nine. The fix is one line each: call `startingLevelUps` the way the builder and the
   importer already do. (No henchman template has starting experience today, so `:283` is latent, but
   it should be fixed at the same time.)

> **RESOLVED 2026-09-08.** Findings 2 and 3 are fixed and verified. Tom confirmed the spec in
> `PLANNING.md` line 745 came from the Developer, not from his own reading of the rules, and ruled
> that the rulebook wins. The Developer implemented it overnight and I tested all three paths:
> one of the pair maxed silently takes the other with a clear reason; both maxed now offers every
> other characteristic that is not at its maximum, Movement included, with a skill still available as
> an alternative; and Movement is correctly withheld once it reaches its own maximum. 54 tests pass
> across both advance suites. **Movement is reachable again.** The original findings are kept below
> as written, for the record.

2. **When a sub-roll's pair is fully maxed, the app takes a skill; the rulebook says take any other
   characteristic.** The rule reads: "If a characteristic is at its maximum, take the other option or
   roll again if you can only increase one characteristic. **If both are already at their racial
   maximum, you may increase any other (that is not already at its racial maximum) by +1 instead.**
   Note that this is the only way to gain the maximum Movement for some races."

   `features/advances/model.ts:741` handles the both-maxed case by routing to a skill with the note
   that both are at the maximum. The any-other-characteristic option is never offered. This affects
   the three sub-roll results: 6 (Strength/Attacks), 8 (Initiative/Leadership) and 9 (Wounds/Toughness).

   The app already implements this fallback correctly one branch above, for the roll of 7
   (`eligibleStatChoices`, with `fallbackToAny`), and offers a skill there only as an alternative. So
   the two halves of the same rule disagree with each other.

3. **Movement can never be increased.** Neither Advance table ever names Movement, so the
   any-other-characteristic fallback in finding 2 is the *only* route to it — which the rulebook says
   in as many words. With that fallback missing from the sub-rolls and available on the roll of 7,
   Movement is reachable only if a hero happens to roll a 7 with both Weapon Skill and Ballistic Skill
   maxed. In practice no warrior in this app will ever gain the Movement his racial maximum allows.

---

## B. Smaller points

4. **The scenario's own experience block is never shown when awarding experience.** The three standard
   awards are applied automatically and correctly: +1 survived, +1 winning leader, +1 per enemy a hero
   put out of action, with henchman groups correctly getting only the survival point. Anything a
   scenario adds is typed in by hand through "Add scenario experience", which is a fair design. But the
   match records which scenario was played (`scenario_rules_id`), and every scenario carries its own
   `experience` text in `scenarioDetails.ts`, and the Experience step reads neither. Showing that block
   at the point of award would stop players missing the bespoke ones. Six scenarios also deviate from
   the standard leader award, two giving +2 and one +5, and nothing flags that.
5. **Hired swords advance on the Hero boxes rather than the Henchman ones.** Carried from audit #4
   finding 6; noted here so it is not logged twice. Still a question for Tom rather than a clear bug.
6. **`promoteHenchman` drops the group's `statIncreases` record.** The promoted hero keeps the stats
   themselves, which is what "with all his characteristic increases intact" asks for, and as a hero he
   is bound by racial maxima rather than the henchman +1 cap, so nothing is wrong today. Worth knowing
   the history is not carried across if the +1 cap ever needs to be reconstructed.

---

## C. Fine as text

The prose around when advances are rolled ("immediately after the game, while both players are
present") is a table convention the wizard's flow already encourages. The recruitment-chart weapon
restriction referenced in the same section belongs with the weapons audit, where it is already logged.
