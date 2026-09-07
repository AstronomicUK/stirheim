# Feedback Tracker

Every bug and improvement Tom sends, logged as its own entry in his own words. Nothing here is
paraphrased or trimmed when it's added — the point of this file is that no detail from a report
gets lost between "Tom said it" and "it's fixed," however small the item looks at a glance.

## How this works

1. When Tom sends a new list (or a message that bundles several issues together), each distinct
   item is broken out and logged below as its own numbered entry under a new dated batch. The
   "Reported" block is a **verbatim quote** of what he wrote for that specific item — not a
   summary — even when it was one sentence inside a longer combined message.
2. Every entry gets a **priority** when it's logged (see below). Tom's own wording sometimes makes
   this obvious; where it doesn't, a reasonable priority is assigned and can be corrected.
3. New entries start **Open**. Within a batch, items are worked highest priority first, then top to
   bottom; an item that can't be finished (needs a decision, a screenshot, more information) is
   marked **Blocked** with why, and work moves on to the next one rather than stalling the batch.
4. An entry moves to **Fixed** once it's implemented and verified (tested, or checked live in the
   browser where that applies), then **Deployed** once that fix has actually shipped to Netlify —
   with a one-line note on what changed and the commit it landed in.
5. Nothing is deleted. A fixed batch stays in the file as the record of what was reported and how
   it was resolved; new batches are added below the older ones.

## Status key

| | |
|---|---|
| 🔲 Open | Logged, not started yet |
| 🔧 In progress | Being worked on right now |
| ✅ Fixed | Implemented and verified, not yet deployed |
| 🚀 Deployed | Live on stirheim.com |
| ⛔ Blocked | Needs something from Tom before it can move — noted inline |

## Priority key

| | |
|---|---|
| 🔴 High | Broken, wrong, or blocking play at the table |
| 🟠 Medium | Works, but the gap is worth closing reasonably soon |
| 🟡 Low | Polish, nice-to-have, or a small loose end |

---

## Batch — 2026-09-07 (outstanding work logged retroactively)

Nothing below was reported as a fresh bug on this date — these are loose ends already known from
earlier work, logged here so they don't get forgotten now that the tracker exists.

### 1. Dice rolls in the persisted combat log don't say app-rolled vs entered by hand

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-06 (part of a larger list)

> "All dice rolls should show app-rolled vs manually-entered; scenario selection should say '(randomly chosen)' when applicable."

**Notes:** Done for the live Fight tab UI (`RollResult` tags "Rolled by the app" / "Entered by hand") and for `DieField`s in the post-battle wizard, and the scenario half is fully done. Not done: the *persisted* attack narrative written to the combat log (`rollThrough.ts`'s `log()` calls, ~30 call sites) still always says "rolled X", regardless of which way that particular die actually came in. Threading it through would mean passing a `manual` flag into `applyRoll`/`declineRoll` and rewording every log line — judged out of scope for that pass since the live UI already shows it at the moment it matters.

### 2. Cast a Spell rolls have no app-rolled / entered-by-hand tag

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-06 (part of the same list as #1)

**Notes:** Same request as #1, but for `CastTab.tsx`. Its `RollResult` reads `CastState.dice` directly rather than going through the `shown`-bucket pattern `FightTab.tsx` uses, so the same fix doesn't drop in without touching `casting.ts`'s state shape too.

### 3. Confirm the Cast tab's new friendly-target picker against a real spellcaster

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** n/a — self-identified gap, not something Tom flagged

**Notes:** Added an optional "Target (if this spell needs one)" field to `CastTab.tsx` so a spell that needs a friendly target (a heal, a blessing) has somewhere to record one, per Tom's "spell casting sometimes needs friendly-only targeting." Implemented, typechecked and covered by the full test suite, but never exercised live — none of the seeded test warbands (`gm@stirheim.test` / `player@stirheim.test`) have a spellcaster. Worth a real check next time a warband with a wizard or priest is in play.

### 4. Simulator's out-of-action grid only shows the attacking direction

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** n/a — scope note from building item below

**Notes:** The old `mordheim-simulator` project's sensitivity grid had an Attacking/Defending toggle (attacker hits the opponent, or the opponent hits back). The new "Against a range of opponents" section on Stirheim's Simulator → Odds tab only ported the attacking direction, matching how the rest of that tab already works one-directionally. Adding the reverse toggle is a reasonably contained follow-up if it turns out to matter.

### 5. The injury-enforcement audit only covered two injuries

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-06 (part of the same list as #1)

> "Injury audit: are things like Old Battle Wound actually enforced?"

**Notes:** Old Battle Wound (pre-battle D6, benches on a 1) and Severe Arm Wound (no second weapon/shield/buckler) are now enforced — those were the two gaps identified at the time. The question was broader than those two by its own wording ("things *like*"); nobody has since gone through every other injury outcome in `rules/data/injuries` checking each one actually changes app behaviour rather than just sitting on the sheet as text. Worth a proper full pass rather than assuming the two found so far were the only ones.

### 6. Two large rules-completeness audits already exist and are still open

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** n/a — pointer to pre-existing docs, not a new report

**Notes:** [`docs/WARBAND-RULES-GAPS.md`](WARBAND-RULES-GAPS.md) and [`docs/WEAPONS-ARMOUR-RULES-GAPS.md`](WEAPONS-ARMOUR-RULES-GAPS.md) are dated 2026-09-05 audits of warband special rules and weapon/armour rules that are documented but not mechanically enforced (dozens of specific items each, e.g. per-warband exploration bonuses, income modifiers, units that never gain experience). Left as their own documents rather than duplicated in here item-by-item — this entry exists only so the tracker doesn't quietly forget they're there. Say the word if these should be folded into this tracker as individual entries instead.

## Batch — 2026-09-07

### 7. The map is buggy in a Map Campaign: phantom nodes, selection mostly doesn't work

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "the Map is buggy if you open it in the Map Campaign; it has nodes to tap on that don't exist, almost all selections don't work (they don't show you what the node is when you click or mouse over)"

**Notes:** Investigated, not yet fixed. Three separate things going on, all in `src/features/map/MapCanvas.tsx` and `src/rules/data/map/districts.ts`:

1. **"Nodes that don't exist" — likely explained by four districts sitting below the bottom edge of the map image.** The SVG viewBox is `0 0 100 70.725` (`MAP_VIEW_HEIGHT`), matching the image's exact aspect ratio, but four of the thirty districts have a `y` coordinate greater than 70.725: `temple-of-morr` (72.55), `the-cemetery` (71.15), `poor-quarter` (71.3), and worst, `south-gate` (74.2, a gate district with several connections). Their circles sit past the visible image, so they render clipped or invisible at the very bottom edge, while the connecting lines to them (`MAP_LINKS`) still draw normally, ending at a spot with no visible circle — which would read exactly as "a node to tap on that isn't there." Every id, connection reference and coordinate range was checked by script; these four `y` values are the only anomaly (ids are all unique, no connection points at a missing id, no districts sit on top of each other).
2. **Selection mostly not registering — most likely a pointer-capture bug.** `onPointerDown` unconditionally calls `frame.current?.setPointerCapture(e.pointerId)` on the outer map frame, for every pointer-down including one that starts right on a district circle. Once an element has pointer capture, the browser retargets subsequent pointer events (and, in most browsers, the derived `click`) to the *capturing* element rather than whatever is visually underneath. `onPointerUp`'s own fallback-deselect check — `if (!moved && (e.target as Element).tagName !== 'circle') onSelect(null)` — is written assuming `e.target` can still be a `circle`, but under capture it's almost always the captured frame `<div>` instead, so that condition is true for nearly every simple tap and immediately deselects, racing against (or outright suppressing) the circle's own `onClick`. This would explain "almost all selections don't work" precisely — panning/zooming (which only need the frame, not per-circle clicks) still works fine, which fits what was reported.
3. **No hover tooltip exists at all, so "mouse over doesn't show what the node is" is accurate as a description of current behaviour, not a regression.** Each district circle only carries an `aria-label` (screen-reader only, nothing visible) — there's no `title`, tooltip or on-hover label anywhere in `MapCanvas.tsx`. The only place a district's name and details show at all is the `DistrictPanel` in the sidebar once a *click* successfully selects it (which is broken per #2), so right now there's no way to identify a district without that click path working. A hover affordance would need to be built new, not repaired.

Given all three sit in the same small file, a fix would likely address them together rather than one at a time. Left as Open per instruction — investigation only for now.

### 8. Parrying may not be working properly in roll-it-out; wants the same hand-off armour saves get

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "I'm not sure parrying is working properly in roll it out. it should probably work similar to armour saves (where you can roll the parry yourself or ask the defender to roll and it sends it to their app), but obviously only when the defender has a weapon that they can parry with."

**Notes:**

### 9. Better visual representation of multiple attacks — pick attack count up front, label "First attack" / "Second attack"; likely to merge with upcoming items about stunned/knocked-down targets

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "then another one is better visual representation of multiple attacks. when you open the popup, it should give the option to select how many attacks, detailing the maximum for that character. then you should have "first attack", "second attack" etc. there are more bugs to come that link to this, so you might need to merge some. particularly related to attacking stunned or knocked down foes"

**Notes:** Tom has flagged this as likely to need merging with further related reports about attacking a target that's already stunned or knocked down — holding off on investigation/fix until those arrive so the whole picture is in one place rather than half-solved here and revised later.

## Batch — 2026-09-07 (large dump)

### 10. Attacking a stunned or knocked-down target doesn't apply the rulebook's automatic outcomes

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "If you attack a stunned unit, it should immediately OOA. And if you attack a knocked down unit, it auto hits and I think the unit goes OOA if it wounds. At the moment the battle sheet doesn't do either of these."

**Notes:** Related to #9 (multi-attack UI) — Tom flagged that item as likely needing to merge with reports "particularly related to attacking stunned or knocked down foes," and this is that report. Consider both together when this is picked up.

### 11. New "turns" feature for App Calculates games: a turn popup and a Recover Units button

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "We will also need to build in a turns feature into the game for "App Calculates" games. This will mean that turn limit games can be accurately tracked, and when you are finished with your turn, the opponent gets a popup saying "Your turn!" With a "Recover Units" button, which turns friendly stunned units to knocked down, and knocked down to no status"

**Notes:**

### 12. Crit table animation is still too fast to read; the settled (red) row and the spinning (yellow) row don't show the same information

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The Crit Table animations are still too fast. You can't read it. It's so fast I couldn't check but it looked like the table with the selection (with the red row) had something in lower case that the table still calculating (with the yellow row rotating through the options) doesn't."

**Notes:**

### 13. "Pick the skill later" in the post-battle report lands on a skill list, which is confusing given the point is to defer the choice

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "Pick the skill later" in a post battle report takes you to a list of skills which is a bit strange; the whole point is that you want to leave it to later. It should instead take you to a page that says something like, "Done! Click the advancements button on the warband page to pick this skill before your next battle.""

**Notes:**

### 14. Warband units — possibly Sons of Hashut specifically, possibly wider — start at 1 XP instead of 0

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "I don't know if it's a problem across the board or just with the Sons of Hashut War band but they seem to have a lot of units starting at 1 XP. I believe most units, especially henchmen, start at 0 XP but I could be wrong."

**Notes:**

### 15. The Well exploration outcome doesn't ask which model missed the next game (and other outcomes probably have the same gap)

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "The Well outcome in the exploration phase doesn't ask you to pick a unit, so it won't know who misses the next game if they fail. There are probably other exploration phase outcomes like this, where you have to select a unit. It also asks what treasure is found which is strange because the game already knows that they find 1 wyrdstone, so I'm unsure why the user is prompted to input additional treasure."

**Notes:** Reported alongside #16 in the same paragraph — both quoted here in full since they came from the same report; see #16 for the treasure-prompt half.

### 16. The Well exploration outcome asks the user to input treasure found, when the app should already know the amount

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The Well outcome in the exploration phase doesn't ask you to pick a unit, so it won't know who misses the next game if they fail. There are probably other exploration phase outcomes like this, where you have to select a unit. It also asks what treasure is found which is strange because the game already knows that they find 1 wyrdstone, so I'm unsure why the user is prompted to input additional treasure."

**Notes:** Same report as #15 — see that entry for the missing-unit-picker half.

### 17. Filing a report briefly flashes an "already filed" page before redirecting

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "When you file a report, for a brief second it comes up with a page that says something like "A report for this battle is already in,'" before redirecting to the main battle report page."

**Notes:**

### 18. Advancements' skill picker needs a skill-type filter, defaulting to "All Skills"

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "When you select a skill in Advancements, the heading options of being able to select the skill type, with the default being "All Skills""

**Notes:** Wording as sent — read as: add a skill-type filter/heading to the skill picker in Advancements, defaulting to "All Skills".

### 19. Skill toggles: the toggle wording belongs to the engine not the skill text, and toggles should only appear for a model that actually has the relevant skill

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "There are a lot of skills that require toggles. Firstly, the toggle text shouldn't be in the skill itself: that's a message for the engine itself. Secondly, why don't we have the toggles hidden (including the charging one that's currently in), and the toggle appears when you select a model that has a relevant skill? So if they have Pit Fighter, for example, the only toggle that will show is "Inside Building?""

**Notes:**

### 20. Tapping a dice-roll button more than once should log every result, not just the last one, to stop re-rolling out of sight

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "When you tap on a dice roll button more than once, this should show in the dice log along with each result. This prevents people cheating the system such as when they roll an advance and don't like the first outcome, they can quickly tap again before their friends see it."

**Notes:**

### 21. Can't submit the second warband's post-battle report after submitting the first, when one player controls both sides of a match

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "I ran a test battle between two warbands that I control and then I submitted the battle report on one of the warbands. When I went to the second one, I was no longer able to submit their battle report. This seems like a bug as then they can't benefit from any of the XP or advancement rolls in the post-game sequence."

**Notes:**

### 22. Move "Transfer Warband to Another Player" and "Move to another Campaign" under the warband page's "More" button

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "I think the "Transfer Warband to Another Player" and "Move to another Campaign" options can be moved to being under the "More" button at the bottom of the warband page"

**Notes:**

### 23. The audit log's "Details" expander reads like raw data (field names, ids) instead of English, and wants tooltips

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The new "details" expander in the log is not user friendly: it has loads of unrelevant data and is written like it's something a computer should read, not a human. It seems like it shows field names rather than what we see Client-Side. Loads of fields are redundant to us as the user, like showing an assignment of a User ID, but more useful ones look awful, like in Call of the Grave:
>
> "Tom edited Kel'thuzad (The Call of the Grave) by hand
> 20 h ago
> Hide
> skills:
> the_restless_dead_skills_forbidden_rite
> →
> the_restless_dead_variant_undead_special_skills_dark_ritual"
>
> It should be in English, like "Changed the skill Forbidden Rite to the skill Dark Ritual". Both of these should have tooltips enabled."

**Notes:** This is the expandable audit-diff feature built earlier this session (`activityFieldChanges` in `src/features/campaign/activity.ts`) — it was designed to be generic across every table rather than name specific fields nicely, which is exactly what's landed wrong here.

### 24. Roll-it-out popup is full-screen with nothing filling the space; text should be bigger and more exciting; the weapon/toggle boxes should move into the popup itself (a previously-made point that wasn't acted on)

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "In the Roll it Out, you've made the popup full screen unnecessarily because you've done nothing to fill the space so it's just full of blank space. the text should be bigger and more engaging. Rolling dice should be exciting!but you've probably still made the popup too big: just make it as big as it needs to add the extra visualization.
>
> additionally you ignored my points about moving the weapon and toggle boxes. I think the best place for those is actually in the popup itself once you click on the dice."

**Notes:** The "ignored my points about moving the weapon and toggle boxes" likely traces back to the original roll-it-out request's "(centre the item-selection/charging box above the dice icon...)" line, which was read at the time as a pure layout/alignment instruction (equal-height boxes, centred dice button) rather than "move the weapon-select and situation-toggle controls into the roll popup." Worth re-reading in that light when this is picked up.

### 25. The roll-it-out dice icon needs a cooler animation (e.g. a rotating die)

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "The dice icon for roll it out is crappy and needs something way cooler. Like a rotating dice animation or something like that?"

**Notes:**

### 26. Trading post icons/names: "Characters" should be "Dramatis Personae"; stash should look like a treasure chest; Buy/Sell icons should read as a matched pair

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "The characters icon in the trading post is weird. It should also be called Dramatis Personae, not characters. Also can we make the stash icon a treasure chest, and make the Buy and Sell icons go well together like brother and sister icons?"

**Notes:**

### 27. Dramatis Personae list is inconsistent (some full descriptions, some just cost); wants a tap-to-read pop-up and a persistent bottom "Search" button

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The Dramatis Personae list is inconsistent. Some have full descriptions and others just have cost. You should be able to tap on one to read more about them in a pop-up (their stats etc). Then there should be a "Search" button that is persistently at the bottom (in case of scrolled descriptions) and when you click Search, the current screen of "Who goes searching" appears."

**Notes:**

### 28. Creating a warband with a spellcaster never prompts a spell roll or pick — also needs a house rule for how the first spell is chosen

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "Making a warband with a spellcaster in doesn't prompt you to roll or pick a spell at all. This also needs a house rule setting, as the RAW is that the first spell is picked randomly, but two house rules that are played are:
> 1. First spell taken can be picked, not rolled
> 2. Roll twice, pick 1 of them"

**Notes:**

### 29. Editing a spellcaster's spells lets you pick any spell in the game, not just ones from that unit's own lore/tree

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "Adding a spell to a spellcaster in "Edit" allows you to pick any spell, not just spell trees that that unit can learn from."

**Notes:**

### 30. Melee Attack and Ranged Attack quick actions share one highlight state and don't cleanly default to their own weapon type

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The ranged attack and melee attack quick actions are both on the same screen so they are both highlighted when you select either of them. What should really happen is the melee attack should default to melee weapons and the ranged attack should default to a ranged weapon and they should be separate quick actions."

**Notes:** The "both highlighted" part is a real bug in this session's own work: both `NavTile`s in `BattleNav.tsx` compute `active={tab === 'fight'}`, so whichever quick action is tapped, both light up since they share the same underlying tab value. The weapon-defaulting half was intentionally built (`FightTab`'s `startWith` prop) — worth checking whether it's not behaving as expected, or whether this report is purely about the shared highlight.

### 31. "Cast a Spell" looks nothing like Melee/Ranged Attack — should reuse the same layout with "Spellcaster"/"Target" instead of "Attacker"/"Defender"

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "Additionally when you click "Cast a Spell," the visual is very different to the others. What it should be is that it should look like the melee attack and ranged attack but instead of "Attacker" it should say "Spellcaster" and instead of "Defender" it should say "Target.""

**Notes:**

### 32. Spell targeting should offer only friendly, only enemy, or both lists (grouped under headings) depending on what the spell allows

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "If the spell should be cast on friendly units, it should only give the option of friendly units. If it should be cast on enemy units, it should cast on enemy units. If it can be cast on both, it should have both lists, with "Friendly Units" as a heading and "Enemy Units" as a heading."

**Notes:** Extends the friendly-only Target picker added to `CastTab.tsx` earlier this session (currently always friendly-only, no enemy option, no per-spell targeting rule). Related to #29 and #31 — all three touch the Cast tab and the spell data model, and none of the spell data (`src/rules/types/magic.ts`) currently records who a spell can target, so this needs new per-spell data as well as UI work.

<!-- New batches go below this line, most recent last. Copy the entry template for each item. -->

<!--
### N. Short title

**Status:** 🔲 Open
**Priority:** 🔴 High / 🟠 Medium / 🟡 Low
**Reported:** YYYY-MM-DD

> Verbatim text of what Tom said about this item.

**Notes:** (investigation, fix approach, commit link — filled in as work happens)
-->
