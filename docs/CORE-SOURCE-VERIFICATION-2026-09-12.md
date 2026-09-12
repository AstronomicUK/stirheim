# Core source verification — 12 September 2026

**Author:** Claude (Stirheim Developer session), on Codex's Priority 4 handoff (bus 6c9ab2db).
**Scope:** tracker #167, #195, #193, #200 only. Evidence and open decisions; **no resolver, data or
test was changed** for this document. Supplement completeness is out of scope.

## What "the source" is, and what I could and could not read

- The repository's rules text (`reference/rules/*.md`) is a scrape of **mordheimer.net**, a fan
  compilation (not official Games Workshop material), converted by `scripts/scrape/convert.mjs`.
  The official rulebook PDF and roster sheet are **not** in the repository.
- Where mordheimer.net publishes a chart as an **image**, the scrape's markdown table is a *hand
  transcription* of that image — `convert.mjs` cannot OCR a picture. Those images are the closest
  thing to an original this project can cite, so for this pass I fetched them from the live site
  (politely, one request a second, with the User-Agent the scrape README prescribes) and read them.
- Where the live page is text only, I quote the text. Where neither text nor image settles the
  question, I say so and put the decision to Tom rather than infer a rule from generic wording.
- Live pages were fetched on 2026-09-12; the two chart images are saved beside this document in
  `docs/audits/2026-09-12-source-verification/` so the citation does not depend on the site.

| Item | Outcome | Needs Tom? |
|---|---|---|
| #167 S2 vs T5 | **Resolved.** Both original chart images read 6+. The scrape's dash is a transcription slip; the engine is right. | No — housekeeping only |
| #195 XP thresholds | **Resolved.** The official 1999 roster sheet (GW PDF, via Broheim) has thick-bordered boxes at exactly the 21 hero and 4 henchman values in the code. | No |
| #193 injury floors / overlapping recovery | **Resolved by Tom:** retain current characteristic-specific floors and concurrent recovery. Official sources are silent; this remains an explicit app policy. Existing floor checks and the new recovery-order regression pass. | No |
| #200 special-save stacking / injury-remap precedence | **Core does order its own saves** (Dodge → Lucky Charm → wound → armour → Step Aside → injury → helmet), confirmed by the official 2005 errata; the engine follows it. Wards are supplement-only; remap precedence never arises in core. | One non-blocking default (supplement wards); no core change |

Also recorded for #161 at Codex's request: the **Holy Relic** is core rulebook equipment; the **Banner**
is Opulent Goods, Mordheim Annual 2002 (`02-weapons-armour-equipment.md:1464`), so it belongs to the
supplement remainder, not the core-first closure.

**PDF provenance for this pass** (downloaded with Tom's permission on 2026-09-12 from broheim.net, a
long-running community archive of the free Games Workshop PDFs; read, cited, then deleted):
`Official Roster Sheet.pdf` (sha256 d1824af3…, 2 pages, "Copyright © Games Workshop Ltd., 1999.
Permission granted to photocopy for personal use only."; page 2 notes "Modified by Honza Skýpala for
6 heroes roster" — a layout change to fit six heroes, the experience boxes themselves untouched);
`Errata.pdf` = *The Mordheim Rules Review* by Jake Thornton, Ian Davies, Mark Dewis, Mark Havener,
Nick Kyme & Terry Maltman (sha256 7ed58b76…, 8 pages — the official 2005 errata/FAQ);
`Ultimate FAQ.pdf` (sha256 e10bd059…, 32 pages — a community compilation that labels each answer
official or "recommended").

---

## #167 — Strength 2 against Toughness 5: "6+" or "cannot wound"?

**Question.** The scraped shooting and close-combat wound charts both show a dash (cannot wound) at
S2/T5 (`reference/rules/01-introduction-and-rules.md:691` and `:865`); `src/rules/engine/toWound.ts`
returns 6+. Which is the transcription error?

**Evidence — the original chart images, as published by the source site.**

- Shooting: https://mordheimer.net/assets/images/wound-chart-a92e853211e30e1a862a83aff0d1dd94.jpg
  (embedded on https://mordheimer.net/docs/rules/shooting; 1151×649). Saved copy:
  `docs/audits/2026-09-12-source-verification/wound-chart-shooting.jpg`.
- Close combat: https://mordheimer.net/assets/images/wound-chart-cc-c27d2faead1a331884236ca22271562f.jpg
  (embedded on https://mordheimer.net/docs/rules/close-combat; 1116×645). Saved copy:
  `docs/audits/2026-09-12-source-verification/wound-chart-cc.jpg`.

Both images are the rulebook's chart artwork ("Wound chart · target's Toughness" across the top,
"weapon's Strength" / "attacker's Strength" down the side). Read cell by cell, the **Strength 2 row is
`3 4 5 6 6 – – – – –`**: Toughness 5 is a **6**, and the first dash is at Toughness 6. Every row
follows the same diagonal — a 6 at Toughness = Strength + 2 and again at Strength + 3, a dash from
Strength + 4 — which the Strength 1 row (`4 5 6 6 –`) and Strength 3 row (`2 3 4 5 6 6 –`) in the
scrape already show. The scrape's S2 row alone breaks that pattern, which is exactly the shape of a
copying slip.

**Full comparison.** Reading all 100 cells of each image against `TO_WOUND` in `toWound.ts`: every
cell matches, including the S8–S10 rows that the 2026-09-01 correction note in that file describes.
The two images are identical to each other. So against the original artwork the engine is 100/100
and the scrape is 98/100 (the same cell wrong in two copies of the chart).

**Conclusion.** The engine is correct; the scrape is wrong at S2/T5. The 2026-09-09 sweep's "two
discrepant cells" finding was a faithful comparison against a mis-transcribed table, not a bug.

**Recommended housekeeping (for Codex to schedule; none of it changes behaviour):**

1. Correct the two markdown cells (`01:691`, `01:865`) from `–` to `6` and add a one-line note that
   the table is transcribed from the site's chart image, verified 2026-09-12. The scrape README's
   "do not hand-edit" rule protects the automatic conversion; these tables were hand-made in the
   first place, so a corrected transcription is the right fix (re-running the scrape would not
   regenerate them).
2. Pin the whole chart in a test — `toWoundThreshold(2, 5) === 6` plus the 100 image-derived cells —
   so a future "fix to match the scrape" cannot reintroduce the slip.
3. Annotate the sweep probe (`docs/audits/2026-09-09-sweep/core-charts-probe.json`) and close #167.

**Decision for Tom:** none. This is settled by the source artwork.

**Done (local commit, same day):** the two scrape cells corrected with a transcription note beside
each table; `src/rules/engine/__tests__/toWoundChart.test.ts` pins S2/T5 = 6, the three rows the
images show, and the diagonal rule for all 100 cells (the existing `engine.test.ts` only spot-checked
two cells). Tracker #167 can close once Codex takes the commit into the batch.

---

## #195 — Hero and Henchman advancement thresholds

**Question.** `src/rules/data/campaign/experience.ts` hard-codes 21 Hero thresholds
(`2, 4, 6, 8, 11, 14, 17, 20, 24, 28, 32, 36, 41, 46, 51, 57, 63, 69, 76, 83, 90`) and four
Henchman thresholds (`2, 5, 9, 14`), attributing them to "the thick-bordered boxes on the official
roster sheet". Can that be verified against the original?

**Evidence.**

- The scraped experience text says only: *"The warband roster sheet shows how much experience a Hero
  or a Henchman group must accumulate before making a further roll. When the accumulated experience
  reaches a box that has thick borders, the warrior may make an Advance roll."*
  (`03-campaigns-magic-optional-rules.md:250`).
- The live page https://mordheimer.net/docs/campaigns/experience (fetched 2026-09-12) carries the
  same sentence and **no chart, list or image of the boxes** — the only images on the page are the
  site logo. mordheimer.net does not publish the roster sheet.
- Nothing else in `reference/rules/` states the thresholds. The numbers in the code therefore have
  no citable source inside this repository; they were typed in from the printed roster sheet by
  whoever wrote the file (the comment says as much).

**Evidence — the official roster sheet itself** (Codex asked that this be found rather than put to
Tom, so it was). `Official Roster Sheet.pdf` from broheim.net is Games Workshop's 1999 roster sheet
(copyright line on both pages). Rendered at 4800px with macOS PDFKit and cropped; the crops are saved
as `docs/audits/2026-09-12-source-verification/roster-sheet-hero-experience-boxes.png` and
`roster-sheet-henchman-experience-boxes.png`, with the full pages beside them.

- **Heroes:** 90 boxes in three rows of 30. Counted both by eye and programmatically (a column-scan
  that separates each box and measures its border weight: thin boxes ≈0.16–0.20 dark, thick ≈0.54).
  Thick borders at **2, 4, 6, 8, 11, 14, 17, 20, 24, 28 · 32, 36, 41, 46, 51, 57 · 63, 69, 76, 83, 90**
  — 21 boxes.
- **Henchmen:** 14 boxes; thick at **2, 5, 9, 14** (thin ≈0.15, thick ≈0.41).

Both sequences are **identical to `HERO_XP_THRESHOLDS` and `HENCHMAN_XP_THRESHOLDS`** in
`experience.ts`. The sheet's page 2 carries a fan note ("Modified by Honza Skýpala for 6 heroes
roster"): the layout was widened to six hero blocks, but every block shows the same 90-box strip with
the same thick borders, and the henchman page is unmodified, so the modification does not touch the
evidence.

**Conclusion.** Verified against the original roster sheet; no change to code or data. #60 (Hired
Swords use Henchman progression with Hero advance results) is unaffected.

**Decision for Tom:** none.

---

## #193 — Injury stat floors and overlapping recovery periods

**Question.** `src/rules/resolve/injuries.ts` applies stat floors and treats several "miss the next
game(s)" results as concurrent. Does the source define either?

**Evidence — the Heroes' Serious Injuries chart** (`03-campaigns-magic-optional-rules.md:105-180`;
identical on https://mordheimer.net/docs/campaigns/serious-injuries, fetched 2026-09-12):

- Penalties are stated flat, with no minimum: *22 Leg Wound* "−1 Movement … from now on"; *26 Chest
  Wound* "Toughness is reduced by −1"; *31 Blinded in One Eye* "Ballistic Skill reduced by −1";
  *33 Nervous Condition* "Initiative is permanently reduced by −1"; *34 Hand Injury* "Weapon Skill is
  permanently reduced by −1". Nowhere in the injuries, experience or characteristics text does the
  scrape say a characteristic cannot fall below 1 (the only "minimum of 1" phrases in the whole
  scrape belong to specific supplement spells and mutations, e.g. `03:2750`, `03:6294`).
- *16–21 Multiple Injuries*: "Roll D6 times on this table. Re-roll any 'Dead', 'Captured' and
  further 'Multiple Injuries' results." Nothing says how two "miss the next game" results combine.
- Recovery wording: *23 Arm Wound (2–6)* "must miss the next game"; *25 Smashed Leg (2–6)* "misses
  the next game"; *35 Deep Wound* "must miss the next D3 games while he is recovering. He may do
  nothing at all while recovering."

**What the engine does today** (`injuries.ts`, header comment and code):

- Floors: `STAT_FLOORS = { M: 1, WS: 1, BS: 0, S: 1, T: 1, W: 1, I: 1, A: 1, Ld: 2 }`; a negative
  delta stops at the floor and reports "(already at minimum, unchanged)". BS may reach 0 because BS 0
  profiles exist and a blinded BS 1 shooter genuinely cannot shoot.
- Overlap: `missNextGames = max(existing, new)` — the warrior sits out the *longest* recovery, the
  recoveries running concurrently. (The code and its comment agree; the effect text still lists
  each result's own count.)

**Evidence — official errata and FAQ, checked before declaring silence** (Codex's request):

- *The Mordheim Rules Review* (the official 2005 errata, `Errata.pdf`, 8 pages): its characteristic
  entries concern maxima only (p.121 Characteristic Increase — reroll an already-increased or maxed
  characteristic; Ogre and Halfling maxima; p.71 Maximum Characteristics). Its FAQ has one serious-injury
  question (a Merchant's bodyguard rolls as a Henchman). **Nothing on a minimum, nothing on combining
  recovery periods.**
- *Ultimate Mordheim FAQ & Errata* (community compilation, `Ultimate FAQ.pdf`), §1.2 "Zero level
  characteristics": *"Being unlucky my leader suffered several Nervous injury – my leader should have
  Initiative of –1. Is this right?"* Answer, marked **[Rinku, recommended]** — i.e. a community answer,
  not Games Workshop's: *"Zero level characteristics are certainly possible — all animals have BS0, and
  the Characteristics chapter addresses WS0 … I would say that characteristics cannot be reduced below
  Zero"*, with the consequences: M0 cannot move; S0 cannot wound (weapon bonuses still apply); T0
  automatically wounded; W0 dead; A0 no hand-to-hand attacks; Ld 1 or less always fails.
  Nothing in either document on recovery periods adding together.
- The source site's own FAQ page (https://mordheimer.net/docs/faqs, Annual 2002 FAQ / 2005 Rules Review
  / Tuomas Pirinen answers): the only Wounds question is about multi-Wound models regaining Wounds
  after a battle. Nothing on floors or overlapping recovery.

**Conclusion.** The rulebook and the official errata are silent on both points. The only ruling on
record for floors is a community-recommended one — *0 is the floor, and 0 has effects* — which the
engine's floor-at-1 policy does **not** follow. Overlapping recovery has no ruling anywhere we can
reach; the engine's "concurrent" reading is a project choice.

**Tom's rulings (via Codex, 2026-09-12 10:45): 1 — keep the current floors (nothing below 1; BS may
reach 0; Ld never below 2). 2 — keep recoveries concurrent (overlapping 1-game and 3-game absences
mean 3 games missed, not 4).** Both match current engine behaviour; `injuries.test.ts:115-117` already
pins the floors. Codex added an explicit concurrent-recovery regression after handover: Arm Wound then Deep Wound, and the reverse order, both retain a three-game absence and both injury records. All 25 injury resolver tests pass. This resolves the policy-verification work without changing the current engine behaviour.

The options as they were put:

1. **Stat floors.** *(A)* keep the engine's current policy — nothing below 1 (BS may reach 0, Ld never
   below 2), a repeated Nervous Condition on an I1 warrior changes nothing; or *(B)* adopt the FAQ's
   recommended reading — floor at **0**, with the listed effects (M0 cannot move, S0 cannot wound, T0
   auto-wounded, W0 dead, A0 no attacks, Ld ≤1 always fails). (B) is the only documented ruling; (A)
   is gentler and what the app does now.
2. **Overlapping recoveries.** *(A)* concurrent — miss the longest, current behaviour, fits "while he
   is recovering"; or *(B)* additive — Arm Wound + Deep Wound = 1 + D3 games missed. Arises only from
   a Multiple Injuries roll, or a sickness/Old Battle Wound landing on a warrior already recovering.

Whichever way Tom rules, the work is a policy test in `resolve/__tests__` and, if changed, a small
edit in `injuries.ts`; nothing in the UI reads the policy directly.

---

## #200 — Special-save stacking and injury-remap precedence

**Question.** The compilation's generic Ward text is imported from Warhammer 6th edition; do core
Mordheim items actually permit or forbid stacking special saves, and is there a source order when
several injury-chart remaps could apply?

**Evidence — saves.**

- The compiler's own caveat (`01:764`, repeated `01:931`): *"The above is copied from the 6th edition
  Warhammer Fantasy rulebook. Mordheim was released during 5th edition and did not include ward saves
  but instead referred to them as 'special saves'."* So the "armour first, then Ward; never more than
  one Ward save per wound" paragraph (`01:762`) is **not core Mordheim text**.
- **Every core save-like mechanic**, with its own wording (Tom rightly pointed out the first draft
  listed only the items — the two skills matter more, since any warband can take them):
  - **Armour save** (`01:725-752`): armour and shield/buckler, modified by the attack's Strength; a
    save that would need 7+ is no save.
  - **Dodge** (Speed skill, `03:553`, core): "He can avoid any hits from a missile weapon on a D6 roll
    of 5+. Note that this roll is taken against missiles as soon as a hit is scored … **before rolling
    to wound, and before any effects from other skills or equipment (such as lucky charms)**." That
    last sentence is the official 2005 errata wording (Rules Review, "Page 123, Dodge").
  - **Lucky Charm** (`02:1834`, core, 10 gc; official errata "Page 53, Lucky Charm"): "The first time a
    model with a Lucky Charm is hit in a battle they roll a D6. On a 4+ the hit is discarded and no
    damage is suffered. Owning two or more Charms does not confer any extra benefits."
  - **Step Aside** (Combat skill, `03:383`, core): "Each time he suffers a wound in close combat he may
    make an additional saving throw of 5+. This save is never modified and is **taken after all other
    armour saves**."
  - **Helmet** (`02:1339`, core): "a special 4+ save on a D6 against being stunned. If the save is
    made, treat the stunned result as knocked down instead. This save is not modified by the
    opponent's Strength." (The official errata for the Halfling Cookbook confirms a helmet save turns
    stunned into knocked down rather than removing the result.)
  - **Armour of Righteousness** (Prayer of Sigmar, `03:2941`, core): "an armour save of 2+ which
    replaces his normal armour save" — a replacement armour save, not an extra one. **Shield of Faith**
    (`03:2925`) is immunity to spells, not a save.
  - **Parry** (`01`, close combat) negates a hit rather than saving a wound; it is sequenced before
    wounding and is outside this item.
  - **Warband-specific rules in the six core lists** (Tom's second prompt — checked line by line in
    `warbands/core-and-grade-1a.md:7-1298`):
    - **Daemon Soul** (Cult of the Possessed mutation, `:201`): "a 4+ save against the effects of
      spells or prayers." App: `effects.ts:232` carries it as a note only — **no dispel/save consumer**.
    - **Protection of Sigmar** (Sisters of Sigmar skill, `:523`): "Any spell which would affect her is
      nullified on a D6 roll of 4+ … it will not affect any other models either." App: text only —
      whereas the *supplement* analogue Blessed by Morr **is** wired into `casting.ts:222`'s dispel
      list. A core skill is behind a supplement one here.
    - **Tail Fighting** (Skaven skill, `:691`): "an extra attack … or a +1 bonus to its armour save"
      with a shield. App: text only; the +1 save is not offered.
    - **Sign of Sigmar** (`:521`, first-attack reduction against Possessed/Undead) and **Resilient**
      (core Strength skill, −1 S to hits in close combat, `03:501`): the latter is modelled
      (`skills.ts:165`), the former is text.
    - **Immune to Poison** (Vampire, Dire Wolves, Zombies, `:965/1034/1053`): modelled
      (`buildAttackInput.ts:338`). **Jump Up** ignoring knocked down: modelled (`:420`).
    - Skaven **Perfect Killer** (`:772`, −1 to enemy armour saves) is a save *modifier*, listed for
      completeness.
    None of these is a Ward; the two spell saves (Daemon Soul, Protection of Sigmar) sit in the
    casting flow, not the wound sequence, so they do not change the order above — but they are core
    gaps and are handed to Codex with the casting work.
  - Otherwise no core unit grants a Ward or general special save; every "ward save", "unmodified save"
    or "special save of N+" in the scrape belongs to a supplement (Skins and Charms `02:1307`, Cooking Pot
    Helmet `02:1299`, Amulet of the Moon `02:1453`, Bretonnian/Lizardmen/Shadow Weaver spells `03:2137`,
    `03:2273`, `03:3236`, `03:3336`, etc.).

**So the core does specify an order**, read straight from those clauses:
hit scored → **Dodge** (missiles; before anything else) → **Lucky Charm** (first hit not dodged) →
roll to wound → **armour save** (or Armour of Righteousness in its place) → **Step Aside** (melee;
after all armour saves) → injury roll → **Helmet** (stunned → knocked down). Each applies once to the
hit or wound it names; the text never says one blocks another, so a warrior with Step Aside in armour
gets both, exactly as written. The compilation's own house-rules essay (`03:3666`) even warns that
these "extra" saves stack strongly — a design observation, not a rule against it.

**What the engine does today** (`engine/resolveAttack.ts`, `engine/buildAttackInput.ts`,
`fight/rollThrough.ts`): Dodge is taken as soon as a missile hit is scored, before to-wound and
explicitly before the Lucky Charm ("Dodge explicitly precedes equipment, including the first-hit Lucky
Charm", `rollThrough.ts:328`); the Lucky Charm is offered once on the first hit not dodged; Step Aside
is an extra 5+ after the armour save, once per wound, melee only; the helmet is a stun-avoidance step
after the injury roll (Thick Skull and the supplement Cooking Pot Helmet replace it rather than add to
it). A supplement `wardSaveThreshold` is attempted after the armour save and Step Aside, once per
wound, never modified by Strength, and still allowed when a critical ignores armour; a missile-only
special save (Amulet of the Moon, Shield of Sigmar) is the *better* of it and any Ward. **The core
sequence matches the source clause for clause, including the errata's Dodge-before-charm rule.** The
only step the source does not place is the supplement Ward.

**Evidence — injury-chart remaps.**

- **Concussion** (`02:220`, core): "When using a hammer, club or mace, a roll of 2–4 is treated as
  stunned when rolling to see the extent of a model's injuries."
- **Hard to Kill** and **True Grit** belong to Dwarfs: Dwarf Treasure Hunters are **Grade 1a**, not core
  (`warbands/core-and-grade-1a.md:2027-2085`), and the Dwarf hired swords (`04:436`, `04:985`, `04:1021`,
  `04:1482`) are supplements too. Every Dwarf also has **Hard Head** ("ignore the special rules for
  maces, clubs, etc." — `core-and-grade-1a.md:2039`, `04:438`, `04:987`), which removes Concussion
  before any precedence question can arise.
- No passage in the scrape orders one remap against another. The engine's order (Concussion → True
  Grit → Hard to Kill → standard, `engine/injury.ts:44-56`) is labelled a documented assumption, and
  its own comment notes Hard Head makes the first branch unreachable for a correctly built Dwarf.

**Conclusion.** For the **core** rulebook there is nothing to reconcile: the core saves (armour,
Dodge, Lucky Charm, Step Aside, Helmet, Armour of Righteousness) each carry their own sequencing words
and the engine follows them in that order; no core Ward saves exist; and the only remap in core
(Concussion) never meets a competing remap. The open questions are supplement questions, and the
engine already refuses to let a generic rule override an explicit item clause (missile save best-of;
helmet replaced by Thick Skull; Hard Head cancelling Concussion).

**Decision for Tom (one, and it can wait):** whether the imported 6th-edition ordering — armour save
first, then at most one special/Ward save per wound — should stand as the campaign's **default** for
supplement wards where the item's own text is silent. That is what the engine does now; confirming it
turns an assumption into a house ruling. No core change follows either way. #172 and #175 keep their
separate, concrete sequencing defects.

---

## What this pass did not do

- Did not change `injuries.ts`, `injury.ts` or any data file. The only code change is the #167
  chart-invariant test (`toWoundChart.test.ts`) and the two scrape cells, committed locally as
  `cd5fd68`.
- Did not read the full rulebook PDF (Parts 1–3 on Broheim): the roster sheet, errata and FAQ answered
  what the handoff asked; the wound charts came from the source site's own images.
- Did not review supplement items' save wording individually (out of scope by the handoff).

## Suggested next steps for Codex

1. Take `cd5fd68` (#167) into the batch and close #167 and #195 citing the saved images.
2. Relay the two #193 rulings to Tom (floors A/B; recovery A/B) — the only decisions this pass leaves
   open for core. The #200 supplement-ward default can ride along as a non-blocking "confirm current
   behaviour" line.
3. Once ruled, #193 becomes a policy test plus, if (B) is chosen for either, a small `injuries.ts`
   change; #200's core half can close on this evidence.
