# Warband rating and rout tests — rules audit (audit #10 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet sent to the Stirheim Developer
**Sources compared:** `reference/rules/03-campaigns-magic-optional-rules.md` lines 46-53 (warband
rating) and `reference/rules/01-introduction-and-rules.md` lines 1046-1075 (the rout test, voluntary
rout, leaders), plus every warband rule and skill in `reference/rules/warbands/*.md` that touches a
rout test, against `src/rules/resolve/rating.ts`, `src/rules/data/campaign/trading.ts`,
`src/domain/battle.ts`, `src/features/match/battle/sheet.ts`, `routCheckRules.ts`, `RoutCheck.tsx`,
`src/rules/resolve/animals.ts` and `src/rules/data/campaignRules/index.ts`.

**Method.** Checked the rating formula and every exclusion against the rule, then the rout threshold
arithmetic against the rulebook's own worked example, then searched the warband data for every skill
and special rule that changes a rout test and traced each to see whether anything reads it.

---

## What is modelled

- **The rating formula is right**: 5 points per warrior, 20 per large creature, plus every warrior's
  accumulated experience, with a per-warrior breakdown so the number can be audited on screen.
- **The exclusions are thought through and documented**: dead and retired heroes have left; captured
  heroes are held by another warband and do not count until ransomed; each henchman in a group counts
  individually at 5 plus the group's experience, since every member holds it.
- **Hired swords use their own printed rating text** rather than the flat 5 plus experience, parsed
  from four different phrasings, with the rulebook default substituted and a visible note when a
  particular entry cannot be read.
- **The rout threshold is correct.** `Math.ceil(startingModels / 4)` gives the rulebook's own example
  exactly: twelve warriors, test at three. It also handles the case the example does not, a warband of
  ten needing three rather than two.
- **The model count for that threshold is right**: fighting heroes and hired swords plus every
  henchman, plus the animals that count.
- **Animals already have a rout exemption.** `countsForRout` distinguishes a Wardog, which counts,
  from a Gnoblar, which does not, and out-of-action tallies for the exempt ones are subtracted before
  the threshold is checked.
- **The Snotling half rating** is applied through `ratingFactor`.
- **The rout check is offered, never forced**, which is right: the app does not track turns, so it
  surfaces the test once a quarter are down and lets the player roll, record a roll made at the table,
  or declare the rout.

---

## A. Where the app and the rules part company

1. **Hired swords are offered as the Leadership for the rout test.** Already logged from audit #4 and
   repeated here because this is its home topic. The rule: "You may not use the Leadership of any of
   the Hired Swords for Rout tests." `leadershipOptions` includes every fighting hired sword and its
   `mayLead` guard only excludes units flagged `neverLeads`, which a hired sword can never be because
   it has no unit template id. A high-Leadership Ogre Bodyguard sorts to the top and is suggested.
2. **The sheet has no "stunned" state, so half of the leader rule cannot be applied.** The rulebook is
   specific: "If the warband's leader is out of action **or stunned**, then the player may not use his
   Leadership... Instead, use the highest Leadership amongst any remaining fighters who are not
   stunned or out of action." The battle sheet records only out of action per warrior; stunned and
   knocked down exist nowhere except free-text notes. So `suggestedLeadership` will happily suggest a
   stunned leader, and the app cannot warn.

   The current code comments acknowledge this and leave it to the table, which is a defensible call
   for a tracker that does not follow turns. But it is a rule the app silently gets wrong rather than
   one it declines to model, and the fix is small if a stunned toggle is ever added to the sheet.

---

## B. Gaps

3. **Fifteen warband skills re-roll or avoid a failed rout test, and none of them appears on the rout
   check screen.** This is the one screen where they matter, and it shows no sign that the warband has
   one. From the data: Utter Determination (Sisters of Sigmar, and again for the Protectorate), Da
   Cunnin' Plan (Orc Mob and Black Orcs), Bellowing Roar (Beastmen Raiders, Maneaters, Ogre Hunting
   Party), Blood Oath (Ostlanders), Virtue of Discipline (Bretonnian Knights), Tyrant (Black Dwarfs),
   Questing Vow (Bretonnian Chapel Guard), Heart of the Warrior (Marauders of Chaos), Fanatical
   (Dreamwalkers), Songster (Dwarf Slayer Cult) and the Merchant Caravans table. The skills are on the
   hero's roster already; surfacing "this hero may re-roll a failed Rout test" beside the roll would
   be a small change with a real payoff.
4. **Rout-counting exceptions exist for animals but not for warriors.** `countsForRout` lives on
   animal kinds only, so these warband rules have nowhere to go:

   | Rule | Warband | Effect on the rout count |
   |---|---|---|
   | Insignificant | Snotlings | the whole mob counts as **one model**, for rout tests, maximum warband size and income |
   | Just Squigs | Night Goblins | Squigs count as **half a model** |
   | Ignored | Battle Monks (Peasants) | Peasants out of action do not count at all |
   | Ignored | Ogre Hunting Party (Sabretusks) | Sabretusks out of action do not count |
   | Not Orcs | Orc Mob | Goblins and Cave Squigs going down does not unsettle the Orcs |

   Note the income half of the Snotling rule **is** modelled, through `groupIncomeCountsAs: 1`, so the
   shape of the fix already exists — it needs a rout equivalent, plus a maximum-warband-size one.
5. **Merchant Caravans Bribery moves gold and has no flow.** "Whenever the warband has to take a Rout
   test, the Merchant may talk his hirelings into staying a little longer... He may immediately pay
   5 gc per non-Hero." That is a treasury transaction triggered at the rout check, and the rout check
   knows nothing about it.
6. **The Trade Wagon is lost on a failed rout and nothing records it.** "If the warband fails its Rout
   test and no model is driving the Trade Wagon, then it is abandoned. The wagon falls into the
   winning warband's hands." A failed rout in the app sets `routed` and ends the battle; the wagon
   stays on the roster.

---

## C. Smaller points

7. **Two rating functions share a name, and one is dead.** `resolve/rating.ts` exports
   `warbandRating(warband, template)`, which every screen and both API paths use.
   `data/campaign/trading.ts` exports a different `warbandRating(warriors[])` whose only caller is its
   own test. It looks like an earlier version, and it will drift out of step with the resolver
   silently. Worth deleting or marking.
8. **Voluntary rout is available whenever the check is offered**, which matches the rule: a player may
   rout voluntarily only if he was already required to test or a quarter are down, and the check only
   appears at that point. Correct; noted so it is not re-examined.
9. **Nothing exempts psychology-immune warbands from rout tests**, which is right — the rulebook says
   even the Undead must test. Noted for the same reason.

---

## D. Fine as text

The 6" leadership bubble, and the rule that a knocked-down, stunned or fleeing leader cannot confer
it, belong to the table and to a tracker that does not model position. The rout test's consequence,
that the game ends and the survivors retreat, is recorded as an outcome rather than simulated, which
is the right depth.
