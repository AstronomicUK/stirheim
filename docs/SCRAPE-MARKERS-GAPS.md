# Scrape uncertainty markers — rules audit (audit #17 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** written under Tom's overnight pre-authorisation; sent to the
Stirheim Developer without his prior review
**Sources compared:** every ❓ and ✏️ marker across `reference/rules/*.md` and
`reference/rules/warbands/*.md` against the app data generated from those files.

**What the markers are.** 83 marked lines, carrying 53 ❓ and 41 ✏️ (some lines carry both). The data
files describe them as "the scraper's review markers", and reading them in place they sit on rules
whose wording was uncertain or needed a clarifying note when the pages were captured. Three data files
record that the markers were **stripped** when the data was generated.

**Why this turned out to be worth doing.** I expected an inventory of transcription doubts. What the
markers actually are is a **map of the contentious rules** — and they cluster, hard, on exactly the
mechanics the earlier audits found unmodelled. That correlation is the finding.

---

## A. The clusters, and what the app does with each

### 1. "Takes a complete turn to reload" — 15 marked lines, the largest cluster by far

Every black powder weapon carries it: Tufenk, blunderbuss, superior blunderbuss, handgun (×3
entries), pistol (×4), duelling pistol (×3), hand-held mortar, Hochland long rifle. The site flagged
the wording each time.

The app tags these weapons `prepareShotReloadEveryOtherTurn` (7 weapons) and
`prepareShotReloadEveryOtherTurnUnlessBrace` (6). **Neither tag is read anywhere** — confirmed again
here. So the single most-flagged rule in the entire reference is carried as a label and never applied.
The brace exception matters too: a brace of pistols fires both barrels before reloading, which is the
whole reason to buy one.

Logged in audit #11 as part of the unread-tag sweep; raising it here because the marker density says
this is the rule the source itself was least sure about, which makes it the one most worth getting
explicitly right rather than leaving implicit.

### 2. Pistols in hand-to-hand — 6 marked lines

"A model armed with a pistol and another close combat weapon gains +1 Attack, which is resolved at
Strength 4. This bonus attack can be used only once per combat." Tagged `usableInMelee` on 7 weapons,
read nowhere. Already logged in audits #2 and #11.

### 3. Exploration die modifiers — 3 marked lines

The Elf Ranger's Seeker, the Kislev Ranger's Seeker and the Tomb Robber's Explorer all modify one
exploration die by ±1, and all three are flagged. None is granted — audit #8 finding 6.

### 4. Flagged and correctly modelled

Worth recording so nobody re-opens them: gromril's extra -1 save modifier and ithilmar's +1
Initiative (both carried as typed fields by the material-variant generator), the Sigmarite Warhammer's
+1 to wound against Undead and Possessed (`vsTraits`), the spear's Unwieldy clause restricting the
other hand (`unwieldyOffHandOnly`, enforced in `takesOffHand`), the whipcrack bonus applying only to
the first whip (falls out of only the primary weapon contributing its bonus), the Lucky Charm and the
Wyrdstone Pendulum. Six flagged rules, all handled.

---

## B. A finding the markers surfaced that no earlier audit reached

**Warband maximum size modifiers have no hook.** Two marked lines carry them:

- the Halfling Scout's Cook rule — "a warband with a Halfling Scout may increase its maximum size by
  +1", flagged ❓;
- a miscellaneous item whose note reads "the maximum number of warriors allowed in your warband is
  increased by +1", with its own exclusions for Undead and Carnival of Chaos warbands.

The roster validator compares the model count against a fixed `composition.maxModels`, with only an
`outsideMaxModels` exclusion for certain unit types. There is no "+1 to the maximum" mechanism, so
both rules are text a player has to remember and apply by hand. A related third marked line —
"Wardogs count towards the maximum number of warriors allowed in your warband" — is handled, since
animals are counted in `warbandModelCount`.

This also connects to audit #10 B4: the Snotlings' Insignificant rule says the mob counts as one model
for maximum warband size as well as for rout tests, and neither half has anywhere to live.

---

## C. The process point

**The markers were stripped when the data was generated, and the uncertainty went with them.** Three
data file headers say so plainly, which is honest. But the consequence is that the app's copy of, say,
the pistol reload rule carries no sign that the source itself flagged the wording — so a developer
reading the item text has no way to know this is a rule the site was unsure about.

Two cheap options, either of which would have saved me this audit: keep the markers in the generated
text, or carry a boolean on the entry saying the source flagged it. The second is tidier, since the
markers are ugly in a UI.

---

## D. What I am not claiming

I have not resolved any of the flagged wordings against a physical rulebook — I only have the scrape.
Where a marker sits on a rule the app models, I checked the app matches the scraped text, not that the
scraped text is right. The reload cluster in particular may be flagged because the site's own editors
disagreed about the wording, and settling that needs a source I do not have.
