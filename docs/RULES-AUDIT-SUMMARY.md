# Rules audit — the whole series in one place

**Written 2026-09-07 overnight. All 18 audits in `RULES-AUDIT-PLAN.md` are complete.**

Audits 1-10 were read by Tom before they went to the Stirheim Developer. Audits 11-18 were written
under his overnight pre-authorisation and have **not** been reviewed by him. Every handoff says which
it is.

---

## The four root causes worth fixing first

The eighteen documents contain far fewer real problems than they contain findings, because a handful
of causes surface repeatedly under different names. If the tracker is grouped this way the work gets
much shorter.

**1. One over-matching regex in `skillRestrictions.ts`.** It blocks the very heroes each restriction
is meant to permit — Dwarf Troll Slayers refused their own Slayer skills, the Night Goblin Big Boss
refused Sneaky Git, the Halfling Thief refused Stealthy, every Wood Elf refused Seeker — while five
other restrictions never fire at all. The same regex also invents skill names that do not exist
("leader", "this"). *Audits 3 (section D) and 18 (section D).*

**2. Traits are assigned in one warband out of 73.** `traitIds` appears only in `variants.ts`.
Everywhere else traits come from a ten-entry name table with no psychology in it, so 60 unit templates
that cause fear, 36 immune to psychology and 17 stupid receive nothing. The pattern was set correctly
once and never followed. *Audit 12.*

**3. Tags carried without a typed field behind them.** A weapon rule written into the data as a label
and read nowhere: the Ball and Chain's D3 wounds, the black powder reload cycle (the single
most-flagged rule in the whole reference), pistols in melee, two hits per shot. Most unread tags are
harmless labels beside real fields — the list in audit 11 finding 2 is what I verified as genuinely
unbacked. *Audits 11, 13 and 17.*

**4. The alias table was driven to zero for one consumer and three others use it untaught.** Warband
equipment lists resolve completely; hired sword kit is 35% unresolved, exploration rewards 50%.
*Audits 8, 18.*

---

## The things I would fix regardless of grouping

- **The battle page crash** for any warband holding a hired sword. Already fixed and shipped by the
  Developer. *Audit 5.*
- **Heroes recruited mid-campaign owe advances they never earned** — 211 hero templates affected.
  *Audit 6.*
- ~~**No warrior can ever gain Movement**~~ **— FIXED AND VERIFIED 2026-09-08.** The rulebook's only
  route to a Movement increase was closed. Tom has confirmed the conflicting spec in `PLANNING.md`
  was the Developer's decision rather than his own reading, and ruled that the rulebook wins; the
  Developer had already implemented it and I verified all three paths. *Audits 6 and 16.*
- **Dramatis Personae are administered as ordinary hired swords**: they earn experience the rules say
  they never earn, and take the henchman injury die instead of the Heroes' chart. *Audit 4.*
- **19 wizards get no starting spell and are never prompted**, four of them in core warbands, because
  a lore lookup matches names exactly and two warbands begin with "The". *Audit 5.*
- **Hired swords are offered as the Leadership for Rout tests**, which the rules forbid. *Audits 4, 10.*
- **Upkeep is never prompted** after a battle although it is due after every one. *Audit 4.*
- **Sold To The Pits and Captured both stop at a flag** — no pit fight, no ransom, no sale, no Zombie.
  A map district even promises to win a pit fight that cannot be played. *Audits 7, 13.*
- **The six-dice exploration cap is applied to the wrong half of the sentence**, so warbands entitled
  to extra dice are quietly short-changed. *Audit 8.*
- **The shop never checks the warband's own equipment list**, and the category bans it does know about
  never reach the buy screen. *Audit 9.*

---

## What is in good shape, and should not be re-audited

Worth saying plainly, because eighteen gap documents give a misleading impression:

- **The combat engine.** Both charts match the source cell for cell. Parry is complete, including the
  twice-Strength clause I expected to be missing. Criticals, ward saves, injury bands and the
  phase-level probability walk are all correct. I could not find a mistake in any chart or core rule.
- **The serious injuries chart.** All 20 D66 bands, all four sub-tables, Multiple Injuries genuinely
  enforcing its re-rolls, the second blinding retiring the warrior.
- **Magic content.** All 34 lores with verbatim spell text, correct rows and difficulties, and a
  casting screen that assembles every modifier and re-roll with its own scope and limit.
- **Experience and advances.** Both advance tables exact, all 30 racial maximum profiles correct, the
  henchman cap and its re-roll prompts faithful, and "The lad's got talent" done properly.
- **Scenario and hired sword content.** 101 scenarios, 103 detail pages, 72 hired swords, 30 personae,
  all with verbatim text and honest handling of what could not be parsed.
- **The income chart, rare availability and veteran recruits.**

---

## Corrections I made to my own findings

Recorded because they matter more than the findings themselves:

- **Withdrawn.** Hired swords advancing on Hero experience boxes (audit 4) was already settled by Tom
  in `PLANNING.md`. Asked the Developer to un-log it.
- **Stale, now marked.** Two sections of the weapons audit: item purchase restrictions were built by
  Phase 16, and the 34 unresolved equipment names are now zero.
- **Wrong count, now fixed.** Five audits said "49 warbands"; the data holds 73. Per-unit numbers were
  always computed over all templates and are unaffected.
- **Withdrawn before sending.** A claim that scenario settings were captured but unused — the library
  filter and the picker both use them, and the random roll is correctly limited to the core table.

---

## The one process suggestion

Three places hold the group's decisions: `PLANNING.md`, code file headers, and the campaign settings
screen. That is why I raised something Tom had already answered. A single list of "decisions that
differ from the rulebook, and why" would have prevented it, and would prevent the next person making
the same mistake.
