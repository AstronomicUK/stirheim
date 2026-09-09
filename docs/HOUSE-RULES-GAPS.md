# House rules — planning notes versus the settings screen and the rulebook (audit #16)

**Date:** 2026-09-07  **Status:** written under Tom's overnight pre-authorisation; sent to the
Stirheim Developer without his prior review
**Sources compared:** `docs/PLANNING.md` (the group's recorded decisions and per-phase rulings)
against `src/features/campaign/settingsForm.ts` and `SettingsFields.tsx`,
`src/rules/types/roster.ts` (`CampaignHouseRules`), the resolvers that read those switches, and the
rulebook clauses each ruling touches.

**Why this audit exists in the series:** the other fifteen ask "does the app match the rules?". This
one asks the two questions that only make sense once those are answered — has the group's own
decision been implemented, and where a decision differs from the rulebook, was that on purpose?

**It also corrects two of my own earlier findings.** Both are below, first, because a wrong finding
costs the Developer more than a missing one.

---

## A. Corrections to my earlier audits

1. **Withdrawn: audit #4 finding 6, hired swords advancing on the Hero experience boxes.** I raised
   it as "a question for Tom rather than a clear bug". It is neither — it was already settled.
   `PLANNING.md` line 361 records, under "Confirmed as-is": *"hired swords roll D6 injuries and earn
   xp as heroes"*. The app does exactly what Tom decided. **Please drop this from the tracker if it
   was logged.** My apologies: the decision was in the repository the whole time and I did not look
   before raising it.
> **RESOLVED 2026-09-08.** Tom's answer: the spec at `PLANNING.md` line 745 was the Developer's
> decision, not his — he assumed he was misremembering the rules and let it stand. He has ruled that
> it must match the rulebook. The Developer had already fixed it overnight; I verified the behaviour
> and it is correct. This is the clearest possible illustration of section D below: a decision
> recorded in the planning document read as Tom's ruling when nobody had actually checked it against
> the book.

2. **Reframed: audit #6 findings A2 and A3, the both-maxed characteristic case.** These are not
   simply "the app is wrong". `PLANNING.md` line 745 carries Tom's own specification, dated
   2026-09-05:

   > a sub-rolled result (6, 8 or 9 on the hero table) whose characteristic is already at its maximum
   > should offer the other characteristic of the pair first ("take the other option"); only when both
   > are maxed does the player re-roll or take a skill. Today the wizard jumps straight to a skill.

   The first half was built and works — the app now offers the other of the pair. So the picture is:

   | Case | Rulebook | Tom's spec | The app today |
   |---|---|---|---|
   | One of the pair maxed | take the other option | take the other option | **take the other option** ✓ |
   | Both maxed | *"you may increase any other (that is not already at its racial maximum) by +1 instead"* | re-roll or take a skill | **takes a skill**, no re-roll offered |

   Two things follow. **Tom's spec differs from the rulebook** for the both-maxed case, and since the
   same note shows he was correcting the pair-first behaviour, it looks like the "any other
   characteristic" clause was simply not in view rather than deliberately overruled — worth asking
   him. And **the app does not do what his spec says either**: the spec offers a re-roll as well as a
   skill, and the hero path never offers one, though the henchman path does. My audit #6 point still
   stands that this closes the only route to a Movement increase in the game, whichever way it is
   resolved.

---

## B. Planning notes versus what shipped

The recorded requirement (`PLANNING.md` line 78) was: *"Strength armour-save erosion off; optional
critical hit tables; half-price armour (excluding shields and helmets), rounding down. Plus a
free-text house-rules document."*

All of it shipped, and more:

| Switch | Planned | Present | Note |
|---|---|---|---|
| `strengthArmourPiercing` | yes | yes | default off, as decided |
| `optionalCriticalTables` | yes | yes | default on |
| `halfPriceArmour` | yes | yes | rounds down; Tom re-confirmed the rounding 2026-09-07 |
| `halfPriceShields` / `halfPriceHelmets` | implied by "excluding" | yes, as separate switches | finer than planned |
| Free-text house-rules document | yes | yes | "Rules and notes", markdown, readable by every member |
| `rabbitsFootBattleOnly` | not planned | yes | added later, default on |
| `rewardsOfTheShadowlord` | not planned | yes | a rulebook optional rule offered as a switch |
| `firstSpellRule` | not planned | yes | three options: random (RAW), choose freely, roll twice pick one |
| `bans` | not planned | yes | items, spells, hired swords, characters, skills |

Nothing planned is missing. This is the cleanest planning-to-shipped comparison in the series.

---

## C. Rulings the code makes that nothing records as a ruling

These are decisions where the source is silent or ambiguous and the code picked an answer. Most are
documented in a file header, which is good practice — the gap is that none is visible to a player or
a GM, and none is a switch.

| Ruling | Where | Documented? |
|---|---|---|
| Several "miss the next game" results run concurrently, not cumulatively | `resolve/injuries.ts` | yes, file header |
| Injury stat penalties floor at 1, or 0 for Ballistic Skill | `resolve/injuries.ts` | yes, file header |
| Sale prices round down | `data/campaign/trading.ts` | yes, and Tom confirmed |
| Precedence when several injury remaps could apply | `resolve/injuries.ts` | yes, file header |
| The armour-casting exception covers four prayer lores, where the rulebook names one | `resolve/casting.ts` | **no** — raised in audit #5 B7 |
| Hired swords advance on Hero experience boxes | `postBattle/model/xp.ts` | yes, in PLANNING.md — see A1 |

Only one is undocumented, and it is already logged. Worth considering whether the documented ones
belong in the "Rules and notes" document as well, since that is the thing a player actually reads.

---

## D. A note on where rulings live

Three different places hold the group's decisions: `PLANNING.md`, code file headers, and the campaign
settings screen. That worked here, but it is why I raised a finding Tom had already settled. If
anything comes of this audit, a single list of "decisions that differ from the rulebook, and why"
would have saved me that mistake and will save the next person the same one.
