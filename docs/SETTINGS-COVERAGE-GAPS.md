# Campaign settings not yet scraped — coverage audit (audit #15 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** written under Tom's overnight pre-authorisation; sent to the
Stirheim Developer without his prior review
**Question this audit answers:** the plan entry says "decide whether to scrape first". This is that
decision, with the evidence behind it.
**Sources compared:** `reference/rules/00-index.md` (its own "Not included" and "Not yet rescraped"
notes) against what the app's data already holds, measured by source citation.

---

## The short answer

**No further scraping is needed for the rules-fidelity work in this audit series, and I would not
schedule any.** The setting-derived *content* is already in the app; what was not scraped is the
setting *narrative subtrees*, which are mini-campaign structures rather than rules the tracker
computes.

---

## What the index says is missing

From `00-index.md`:

- Campaign-setting scenario sets: Border Town Burning, Nemesis Crown, Procession of Morr, Empire in
  Flames, Albion, Khemri, Lustria.
- The campaign-setting hired sword pages.
- The Nemesis Crown campaign-settings subtree.
- Individual narrative scenario write-ups nested under `campaign-settings/`, e.g. the Procession of
  Morr mini-campaign.
- Grade 2b/3 warbands, which live on broheim.net, a different site.

---

## What the app already has from those settings

Measured by each entry's own source citation:

| Setting | Hired swords | Dramatis Personae | Scenarios (by setting field) |
|---|---|---|---|
| Border Town Burning | 10 | 3 | — |
| Nemesis Crown | 6 | 1 | — |
| Lustria | 5 | 3 | 5 |
| Khemri | 4 | 1 | 4 |
| Albion | — | 2 | 3 |
| Empire in Flames | — | — | 21 (as "The Empire") |

Plus warband skill tables, weapons, armour and miscellaneous items citing Border Town Burning (110
mentions across 14 data files), Lustria (125 across 19), Khemri (59 across 11), Nemesis Crown (51
across 8), Empire in Flames (39 across 6) and Albion (20 across 3).

The reason is straightforward: the *general* index pages for hired swords, personae, scenarios,
warbands and equipment list setting-specific entries alongside the rest, and those pages were
scraped. The Grade 1c hired swords are almost all Border Town Burning; the Lustrian and Khemrian
scenarios are in the scenario catalogue with their setting recorded on each row.

## What is genuinely absent, and whether it matters

1. **Mini-campaign structures** (Procession of Morr and similar). These are narrative frameworks —
   play these scenarios in this order, with these between-battle events. Nothing in the app models a
   campaign *arc*, and nothing references one. **No impact.** Zero mentions of "Procession of Morr"
   anywhere in the data, which is the useful signal: nothing is dangling.
2. **Setting-specific scenario sets.** The scenario catalogue holds 101 scenarios including the
   Lustria, Khemri and Albion ones. What is missing is any additional scenarios that appear only on a
   setting subtree page. **Unknown but low impact**, and it would be additive content rather than a
   correctness problem — no existing feature points at a scenario that is not there.
3. **Setting hired sword pages.** Same shape. The app has 72 hired swords from the main index, and I
   found no reference anywhere in the data to a hired sword that does not exist in the catalogue.
4. **Grade 2b/3 warbands.** Out of scope by the project's own decision, on a different site, and
   nothing references them.

I checked specifically for dangling references — data that names a hired sword, persona or scenario
the catalogue lacks — and found none. That is the test that matters: an incomplete scrape hurts when
something in the app points at the missing piece, and nothing does.

---

## Recommendation

**Do not scrape before continuing.** The remaining audits (#16 house rules, #17 scrape markers,
#18 aliases) are all about content already in the repository, and none of the eleven audits completed
so far was blocked or weakened by a setting gap.

If setting content is ever wanted, the order I would suggest, by value per effort:

1. **Nothing** until a player asks for a specific setting campaign. The app is a tracker, not a
   campaign book.
2. If asked: the setting's **scenario set** first, because scenarios slot into an existing catalogue
   with an existing setting field and a working picker.
3. **Mini-campaign structures last**, because there is no feature to hold them and building one is a
   product decision rather than a rules-fidelity one.

---

## A claim I checked and had to withdraw

While writing this I assumed the scenario `setting` field was captured but unused, and was about to
recommend filtering by it. That is wrong on both counts, and the app is already right here:

- The Scenario Library page has a setting filter, built from the settings actually present in the
  catalogue rather than a hardcoded list.
- The New Match picker shows a scenario's setting as its subtitle whenever it is not Mordheim.
- Roll-for-a-scenario draws from `CORE_RULEBOOK_SCENARIO_IDS` — the nine core rulebook scenarios —
  plus anything the group has written, **not** the whole 101-scenario catalogue. So a Mordheim
  campaign cannot accidentally roll a Lustria jungle scenario, which was the risk I thought I had
  found.

Recording it because a withdrawn finding is worth as much as a kept one to whoever reads this next,
and because it is the second time in this series that a "missing feature" turned out to be present
under a different name.

---

## Bottom line

Nothing to scrape, nothing to build, no dangling references. This is the one audit in the series with
no findings, and that is the correct answer rather than a thin one.
