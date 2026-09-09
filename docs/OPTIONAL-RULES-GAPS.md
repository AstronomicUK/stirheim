# Optional rules — rules audit (audit #13 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** written under Tom's overnight pre-authorisation; sent to the
Stirheim Developer without his prior review
**Sources compared:** `reference/rules/03-campaigns-magic-optional-rules.md` lines 3502-7130 — the
Optional Rules index and all 26 rulesets it lists — against the whole of `src/`.

**Method.** Took the index's own list of rulesets, searched the codebase for each, and separated real
implementations from incidental mentions in scraped text (a phrase appearing in a scenario's flavour
or a hired sword's write-up is not an implementation).

**Framing.** These rules are optional by definition, so "not implemented" is usually a scope decision
rather than a defect. This audit is therefore an inventory, and it flags two things worth acting on:
the rules the app **half-promises** (it shows the player something that depends on a ruleset it does
not have), and the handful that would sit naturally on data the app already keeps.

---

## A. Implemented

| Ruleset | Where | Notes |
|---|---|---|
| Advanced Critical Hit Charts | `engine/crit.ts`, `optionalCriticalTables` house rule | Complete: all five per-category charts with their own effects. Verified in audit #11. |
| Rewards of the Shadowlord | `resolve/rewards.ts`, `rewardsOfTheShadowlord` house rule | Wired into the advance flow for eligible Possessed heroes. |

That is two of the twenty-six. The app also carries five further house-rule switches
(`strengthArmourPiercing`, the three half-price armour toggles, `rabbitsFootBattleOnly`) which are the
group's own rulings rather than rulesets from this section.

---

## B. Half-promised — the app shows something that needs a ruleset it lacks

These are the ones I would act on, because a player can currently see a promise the app cannot keep.

1. **Pit Fights.** The Serious Injuries chart's "Sold To The Pits" sets a flag and emits a `pitFight`
   event that nothing consumes, and the Amphitheatre map district prints "A hero Sold to the Pits wins
   the fight" for a fight that cannot be played. Already logged in audit #7; repeated because its home
   is this ruleset.
2. **Blackpowder Misfires.** Three weapons carry `blackpowderMisfireRulesAlwaysOn` and three more
   `experimentalBlackpowderRulesAlwaysOn`, and the NEMO house rules in the reference assume the
   advanced black powder rules are in play. There is no misfire table anywhere in the app. The table
   is small — six D6 results, one of which destroys the weapon and one of which wounds the shooter —
   and two of those results change the roster (weapon destroyed, weapon jammed for the battle), so it
   is squarely tracker business rather than table business.
3. **Mounted Warriors and Blazing Saddles.** Already logged twice: no cavalry skills exist
   (audit #3 A5), and Imperial Outriders' "Cavalry" skill column, the Knight of the White Wolf's
   starting skills and several units' Ride rules all point at nothing (audit #4 B10). The reference
   carries both the rulebook mounted rules and the full Blazing Saddles skill list, so the content is
   available to build from.

---

## C. Not implemented, and would fit the data the app already keeps

Offered as candidates rather than defects, roughly in order of how well they fit:

4. **Sawbones** (Town Cryer #8). Medical tables that heal or worsen Serious Injuries between battles.
   The app already stores every injury as a structured record with flags, so this is the optional rule
   that fits its existing data best. Nothing in the app references it.
5. **Power in the Stones** (Town Cryer #15). Spending wyrdstone shards for effects rather than selling
   them. The roster already tracks a wyrdstone count and the trading tab already spends it, so the
   hook exists.
6. **Lords of the Night** and **Aristocracy of the Night**. Two vampire skill lists. The app has a
   complete warband skill table system (56 tables covering 49 of the 73 warbands), so these are data entry into an
   existing shape rather than new mechanics.
7. **Subplots** and **Random Happenings**. Campaign-level random event tables, the same shape as the
   exploration chart the app already resolves.
8. **Encampments** (including Brigandsburg, Cutthroat's Den and Sigmarhaven) and the **settlement
   events table**. A between-battles layer with its own economy. Larger than the others, and it would
   overlap the campaign map feature that already exists.

---

## D. Not implemented, and properly out of scope

Table-facing rules a tracker has no business computing, listed so the inventory is complete and
nobody re-audits them: Escaping From Combat, Fighting Individual Battles, Wilderness Rules,
Multiplayer (Chaos on the Streets), Sewer Rats, At the Mouth of Madness, Let the Damned Burn,
Dark Rituals of the Chaos Gods, For Whom the Bell Tolls, Vehicles of the Empire and Boats, and the
three third-party house-rule sets (the House Rules essay, Hull, NEMO).

Two caveats on that list. **Dark Rituals** grants daemon summoning and god-specific spells, so it
would touch the magic data if ever wanted. **Vehicles** matters slightly today, because the Trade
Wagon is already a roster item and the rule that it is lost on a failed rout has nowhere to live
(audit #10 B6).

---

## E. Note on the index itself

The reference's own index lists 26 rulesets; the document contains 29 `## Optional Rules —` headings,
because the three encampment settlements each got their own section and the index counts them as one
entry. No content is missing — flagging it only so a future count against the index does not read as
a discrepancy.
