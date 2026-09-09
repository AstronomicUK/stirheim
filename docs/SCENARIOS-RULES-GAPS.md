# Scenarios — rules audit (audit #14 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** written under Tom's overnight pre-authorisation; sent to the
Stirheim Developer without his prior review
**Sources compared:** `reference/rules/06-scenarios.md` (6,811 lines, 107 scenario pages) against
`src/rules/data/campaign/scenarios.ts`, `scenarioDetails.ts`, `scenarioObjectives.ts`,
`src/rules/types/scenarioDetail.ts`, `src/features/scenarios/ScenarioPage.tsx`,
`src/features/match/NewMatchPage.tsx` and `src/features/match/battle/NotesTab.tsx`.

**Method.** Compared the index against the details, probed all 101 scenarios for structured
objectives and experience text, then checked each captured field against the source page it came from.

---

## What is modelled

- **Coverage is essentially complete**: 101 index rows, 103 full detail pages, and every index row has
  a detail. Each detail carries the page's verbatim intro and every section in page order, plus the
  whole page as markdown, browsable on the Scenario page.
- **The two "orphan" details are deliberate**, not a data fault: `defend_the_tomb` and
  `dem_s_my_gubbinz` are pages with no index row, and the data file's own header says so and explains
  how they were keyed.
- **A structured slice reaches the battle sheet.** `scenarioObjectives` gives the Notes tab the
  scenario's own wyrdstone rule verbatim and a flag for whether it places treasure counters.
- **The KNOWN/unknown distinction is a genuinely good piece of design.** The catalogue lists every
  scenario it carries, so a scenario that yields nothing (a plain Skirmish) is told apart from one the
  app has never heard of (one the group wrote). The first hides its wyrdstone and loot fields; the
  second shows both, because the app cannot know. That is the right way to handle absent data.
- **Rolling for a scenario works**, drawing from the core rulebook table plus anything the group has
  added, and custom scenarios are supported on the match record.

---

## A. Gaps

1. **Scenario experience awards are never applied or even shown.** The post-battle wizard applies the
   three standard awards and offers a free-text "Add scenario experience" line, but it never reads the
   scenario that was played — even though the match record holds `scenario_rules_id` and every detail
   carries an `experience` field. Six scenarios deviate from the standard leader award (two give +2,
   one gives +5) and many add bespoke deeds. First raised in audit #6 B4; this is its home topic.
2. **The `experience` field is unreliable, which blocks fixing finding 1 cleanly.** Nine of the 103
   details have a null `experience`, and **five of those nine have an Experience section in the
   source**: The Script of Sigmar (`#### experience`), Encampment Raid (`### experience`),
   Romero's Pride (`### Experience`), Scripts of Sigmar (`#### Experience`) and The Battle At
   Koleshire Keep (`### Experience`). The heading level and casing vary across pages and the extractor
   evidently matched only some of them. The other four genuinely have no such section. So the
   extraction should be re-run before anything is built on this field, or those five scenarios will
   show a blank where the rules have text.
3. **Scenario rewards other than wyrdstone are not structured.** The objectives slice covers wyrdstone
   during the battle and whether treasure counters are placed, but scenarios also hand out gold and
   items — "gain D6x15 gold crowns", "gains 4D6 + 20 gc", "gain 100gc" and so on, with 61 gold
   mentions across the file. None of it is structured, so a scenario that pays the winner is settled
   by the player reading the page and typing the number into the post-battle wizard.
4. **Scenario eligibility is not recorded.** Four scenarios in the source restrict who may play them,
   and `ScenarioSummary` has no field for it, so the scenario picker and the roll-for-a-scenario
   feature will offer a warband a scenario its own rules exclude it from.

---

## B. Fine as text

Deployment, terrain setup, starting the game, ending the game and victory conditions are all held
verbatim and belong to the table — a tracker that does not model the board should not try to compute
them. The same goes for each scenario's special rules. The design decision to keep the whole page as
markdown alongside the parsed sections means nothing from the source is lost even where the parser
missed a heading, which is what makes finding 2 recoverable rather than a rescrape.

---

## C. Note for whoever picks this up

Findings 1, 2 and 3 are one piece of work rather than three: the wizard should show the played
scenario's experience and reward text at the step where the player awards them, and that needs the
extraction fixed first. Doing 1 alone would surface blanks for five scenarios; doing 2 alone changes
nothing a player sees.
