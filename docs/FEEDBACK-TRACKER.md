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

**Status:** ✅ Fixed
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "the Map is buggy if you open it in the Map Campaign; it has nodes to tap on that don't exist, almost all selections don't work (they don't show you what the node is when you click or mouse over)"

**Notes:** Investigated (see original writeup below), then fixed — all three sub-issues live in `src/features/map/MapCanvas.tsx` and `src/rules/data/map/districts.ts`:

1. **"Nodes that don't exist" — likely explained by four districts sitting below the bottom edge of the map image.** The SVG viewBox is `0 0 100 70.725` (`MAP_VIEW_HEIGHT`), matching the image's exact aspect ratio, but four of the thirty districts have a `y` coordinate greater than 70.725: `temple-of-morr` (72.55), `the-cemetery` (71.15), `poor-quarter` (71.3), and worst, `south-gate` (74.2, a gate district with several connections). Their circles sit past the visible image, so they render clipped or invisible at the very bottom edge, while the connecting lines to them (`MAP_LINKS`) still draw normally, ending at a spot with no visible circle — which would read exactly as "a node to tap on that isn't there." Every id, connection reference and coordinate range was checked by script; these four `y` values are the only anomaly (ids are all unique, no connection points at a missing id, no districts sit on top of each other). **Fix:** the source coordinates were measured against a different website's version of the map image, not the poster this app actually displays (see the comment block above `MAP_DISTRICTS` in `districts.ts`); shifted all four `y` values up by 7.5 uniformly (so their spacing relative to each other is unchanged) — confirmed each now sits with a safe margin inside the visible canvas.
2. **Selection mostly not registering — most likely a pointer-capture bug.** `onPointerDown` unconditionally calls `frame.current?.setPointerCapture(e.pointerId)` on the outer map frame, for every pointer-down including one that starts right on a district circle. Once an element has pointer capture, the browser retargets subsequent pointer events (and, in most browsers, the derived `click`) to the *capturing* element rather than whatever is visually underneath. `onPointerUp`'s own fallback-deselect check — `if (!moved && (e.target as Element).tagName !== 'circle') onSelect(null)` — is written assuming `e.target` can still be a `circle`, but under capture it's almost always the captured frame `<div>` instead, so that condition is true for nearly every simple tap and immediately deselects, racing against (or outright suppressing) the circle's own `onClick`. This would explain "almost all selections don't work" precisely — panning/zooming (which only need the frame, not per-circle clicks) still works fine, which fits what was reported. **Fix:** stopped trusting `e.target` entirely. Added a `districtAt(px, py)` helper that converts the pointer's frame-local pixel position into map/SVG coordinates (undoing the current pan/zoom transform) and finds whichever district circle actually contains that point; `onPointerUp` now uses that to select/deselect/toggle instead of the broken tag check, and the circles' now-dead `onClick` handler (it never fired once capture retargeted the click) was removed. Verified live on local dev: tapping a district reliably selects it and shows its real borders in the side panel, tapping it again deselects, and pan/zoom both still work unaffected.
3. **No hover tooltip exists at all, so "mouse over doesn't show what the node is" is accurate as a description of current behaviour, not a regression.** Each district circle only carries an `aria-label` (screen-reader only, nothing visible) — there's no `title`, tooltip or on-hover label anywhere in `MapCanvas.tsx`. The only place a district's name and details show at all is the `DistrictPanel` in the sidebar once a *click* successfully selects it (which is broken per #2), so right now there's no way to identify a district without that click path working. **Fix:** added a small visible tooltip that follows the pointer, driven by the same `districtAt()` hit-test on `onPointerMove` whenever no pointer button is down — shows the district's name plus its controller when one exists. Verified live: hovering a circle shows the tooltip immediately, e.g. "Executioner's Square".

Verification: `tsc -b`, `oxlint`, and the full `vitest run` suite (1161 passed) all clean; live-tested on local dev against the "Ruins of the Stir" campaign map.

### 8. Parrying may not be working properly in roll-it-out; wants the same hand-off armour saves get

**Status:** ⛔ Blocked — Tom will test it himself and report back what he actually sees
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "I'm not sure parrying is working properly in roll it out. it should probably work similar to armour saves (where you can roll the parry yourself or ask the defender to roll and it sends it to their app), but obviously only when the defender has a weapon that they can parry with."

**Notes:** Traced the whole path and, as written today, it looks structurally correct — worth flagging as inconclusive rather than confirmed, since Tom's own report is uncertain ("I'm not sure") rather than a specific broken step:

- **Hand-off already exists for parry, same as armour saves.** In `FightTab.tsx`, the "Ask {defender}'s player to roll it" button is shown whenever `state.pending.who === 'defender'` — true for `save` (armour) and equally true for `parry`/`parryReroll` — there's no extra condition that excludes parry.
- **The eligibility check Tom asked for already exists.** `buildAttackInput.ts:321`: `parryEligible = weapon.type === "melee" && !weapon.cannotBeParried && defender.parryWeaponCount > 0 && parryStrength < 2 * defender.S` — a parry is only ever offered when the defender's own `parryWeaponCount` is above zero (i.e. they actually carry something that parries), matching "obviously only when the defender has a weapon that they can parry with."
- **The question sent to the defender's phone carries the real numbers.** `useHandOff`'s `ask()` sends `step.label`/`step.detail` verbatim (e.g. "Must beat the 6 rolled to hit"), which is exactly what `parryDetail()` builds and what showed correctly in this session's own live test of the roll-through UI.

Nothing found here reproduces a defect from static reading alone. Recommend asking Tom for the specific thing he saw go wrong (a screenshot, or "I clicked X and expected Y but got Z") before touching this — that would pin down whether the issue is real and where, versus this being general unease rather than an observed bug.

### 9. Better visual representation of multiple attacks — pick attack count up front, label "First attack" / "Second attack"; likely to merge with upcoming items about stunned/knocked-down targets

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "then another one is better visual representation of multiple attacks. when you open the popup, it should give the option to select how many attacks, detailing the maximum for that character. then you should have "first attack", "second attack" etc. there are more bugs to come that link to this, so you might need to merge some. particularly related to attacking stunned or knocked down foes"

**Notes:** Tom has flagged this as likely to need merging with further related reports about attacking a target that's already stunned or knocked down — holding off on investigation/fix until those arrive so the whole picture is in one place rather than half-solved here and revised later.

## Batch — 2026-09-07 (large dump)

### 10. Attacking a stunned or knocked-down target doesn't apply the rulebook's automatic outcomes

**Status:** ✅ Fixed
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "If you attack a stunned unit, it should immediately OOA. And if you attack a knocked down unit, it auto hits and I think the unit goes OOA if it wounds. At the moment the battle sheet doesn't do either of these."

**Notes:** Related to #9 (multi-attack UI) — Tom flagged that item as likely needing to merge with reports "particularly related to attacking stunned or knocked down foes," and this is that report. Consider both together when this is picked up.

Confirmed against the rulebook (`reference/rules/01-introduction-and-rules.md:947-959`, "attacking stunned and knocked down warriors in hand-to-hand combat"), quoted exactly:
- "All attacks against a warrior who is knocked down hit automatically. If any of the attacks wound the knocked down model and he fails his armour save, he is automatically taken out of action... A knocked down model may not parry." — note this is auto-**hit**, not auto-wound: the wound roll and armour save still apply normally; Tom's "goes OOA if it wounds" slightly overstates it (a save can still stop it), worth confirming that reading with him rather than assuming.
- "A stunned warrior... is automatically taken out of action if an enemy can attack him in hand-to-hand combat." — this one really is unconditional, matching Tom's report exactly.
- Important nuance the rule states explicitly: "a model with multiple attacks may not stun/knock down and then automatically take a warrior out of action during the same hand-to-hand combat phase. The only way you can achieve this is to have more than one of your models attacking the same enemy." — i.e. a model's own earlier hit *this same phase* doesn't unlock the auto-hit/auto-OOA bonus for its own next attack; only a status the target already had *before this phase started* (an earlier turn, or a different attacker earlier in the same turn) counts. Also: "he cannot attack any other models that are stunned or knocked down" while still fighting an active enemy, and the section only covers hand-to-hand — nothing here says shooting at a downed model works any differently, so ranged is presumably unaffected (worth double-checking with Tom rather than assuming, since the rulebook text is silent rather than explicit).
- Neither is implemented anywhere today: a grep across `resolveAttack.ts`/`buildAttackInput.ts`/`rollThrough.ts` finds `knockedDown`/`stunned` used only as *outcomes* of an injury roll, never as an input that changes how a fresh attack against an already-downed target resolves.

Good news for the fix: the data needed already exists and is already computed, just not wired to combat. `conditionsFor(events, warbandId, turn)` in `src/features/match/battle/sheet.ts:332` reads the shared battle-event log and returns exactly "who on this warband is currently knocked-down or stunned this turn" — but it's only ever consumed by `EnemyView.tsx:34` to show a status badge, never passed into `FightTab.tsx`/`computeOdds`/`rollThrough.ts` to affect resolution. Reading it once when a phase starts (not per-attack within the phase) and feeding it into `startPhase`/`computeOdds` would naturally satisfy the "not the same phase's own earlier hit" nuance above for free, since a target's condition only updates once an attack is actually logged.

Also ties into #11 (the new turns feature and its "Recover Units" button) since recovery is what clears a model's knocked-down/stunned status between turns, and into #9 (multi-attack UI) as Tom flagged.

**Tom confirmed (2026-09-07):** "yes the rulebook reading is correct" — auto-hit (not auto-wound) for knocked down, unconditional auto-OOA for stunned, as quoted above. Ready to implement as read.

**Fix:** Implemented exactly as scoped above — read from the shared log automatically, not a manual toggle, so this can't be forgotten:

- `FightTab.tsx` now takes the shared `events` log and calls the existing `conditionsFor(events, defender.warbandId, sheet.turn)` for the currently-selected defender, same as `EnemyView` already did for its status badge. When that comes back "Knocked down" or "Stunned", the combat context is set accordingly for the whole phase — a fresh snapshot taken once per fight, never re-read mid-roll, which is exactly what makes the "same phase, same attacker" nuance fall out for free: a target this same attacker just knocked down moments ago in this same roll-through doesn't retroactively unlock the bonus for that attacker's own next attack, only for a *different* attacker's fight afterwards (or this same one, next phase, once logged).
- `buildAttackInput.ts`: for melee weapons only (the rule is hand-to-hand-only, confirmed with Tom), a knocked-down target sets `autoHitKnockedDown` (skips the to-hit roll; wound and armour save still apply normally) and also disables `parryEligible` ("a knocked down model may not parry"). A stunned target sets `autoOutOfActionStunned`.
- `resolveAttack.ts`/`turnAggregate.ts`: `resolveSingleAttack` short-circuits entirely for a stunned target into a new `guaranteedOutOfAction` result (100% out of action, independent of the target's remaining Wounds — stunned isn't a wound-tracking effect, so it doesn't fit the normal wound/injury event model and needed its own path), and `turnAggregate.ts`'s DP aggregation was taught to recognise that flag and move all probability mass straight to Out of Action for that attack. This keeps the pre-roll Odds panel numbers honest (100% to hit / to wound / out of action for a stunned target, 100% to hit only for a knocked-down one), not just the interactive roller.
- `rollThrough.ts`: `beginAttack` checks the new flags first — a stunned target ends the attack immediately with no dice at all ("the target is stunned — automatically out of action"); a knocked-down target skips straight past the to-hit roll and the parry offer to the wound roll ("automatic hit — the target is knocked down"), continuing completely normally from there (wound, save, injury).
- The Misericordia's existing "Target is knocked down" manual checkbox (added for its 2D6-to-wound rule) is gone — it read the identical `targetKnockedDown` context field, so it's now automatic too, and having a manual override next to an automatic one would just invite the exact bug being fixed here.

Verified live end-to-end on local dev (fresh Reikland Watch vs Argent Hammer skirmish): knocked Siegmund the Hammer down, logged it, re-opened the attack against him with a fresh fight — Odds panel showed 100% to hit for both weapons and the note "Siegmund the Hammer is already knocked down: attacks hit automatically and it cannot parry"; the roll-through skipped straight from weapon selection to the wound roll ("Sword: automatic hit — the target is knocked down"). Rolled him to Stunned instead, logged it, attacked again with a different model — the Odds panel showed 100% out of action with no roll rows at all, and "Roll it through" resolved instantly to "Result: Out of action" without a single die. `tsc -b`, `oxlint` and the full `vitest run` suite (1169 passed, including 8 new tests added for this rule in `engine.test.ts` and `rollThrough.test.ts`) all clean.

### 11. New "turns" feature for App Calculates games: a turn popup and a Recover Units button

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "We will also need to build in a turns feature into the game for "App Calculates" games. This will mean that turn limit games can be accurately tracked, and when you are finished with your turn, the opponent gets a popup saying "Your turn!" With a "Recover Units" button, which turns friendly stunned units to knocked down, and knocked down to no status"

**Notes:** This is a genuinely new feature rather than a bug fix, so this is a scoping note rather than a root-cause finding. Pieces that already exist and would likely be reused:
- The shared turn counter itself already exists (`TopStrip.tsx`'s stepper, `setTurn(s, turn)` on the battle sheet) but it's a single shared number either player can bump — there's no concept of "whose turn it is" or a per-scenario turn limit anywhere in the scenario data (`src/rules/data/campaign/scenarios.ts` has no turn-limit field at all).
- The "opponent gets a popup" half maps naturally onto the existing hand-off infrastructure built for parries/saves — `battle_prompts` (migration `20260906000026_battle_prompts.sql`) already delivers a targeted prompt to a specific warband's screen in near-real-time via Realtime; a "Your turn!" notification could plausibly ride the same mechanism rather than needing a new one.
- "Recover Units" (stunned → knocked down → no status) is the natural companion to #10: once attacking a stunned/knocked-down target actually reads and updates status (via `conditionsFor()` in `sheet.ts`, currently display-only per #10's notes), a "Recover" action would need to write the *opposite* transition back onto the shared log/sheet. Worth designing #10 and this together rather than separately, since they're two directions of the same status-tracking gap.

Given the size (new turn-ownership model, a new prompt type, and status-recovery logic all together), this is a multi-part build rather than a single contained fix — recommend confirming scope/order with Tom before starting rather than assuming the whole thing should land in one pass.

### 12. Crit table animation is still too fast to read; the settled (red) row and the spinning (yellow) row don't show the same information

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The Crit Table animations are still too fast. You can't read it. It's so fast I couldn't check but it looked like the table with the selection (with the red row) had something in lower case that the table still calculating (with the yellow row rotating through the options) doesn't."

**Notes:** `src/features/match/fight/CritWheel.tsx`. The speed complaint is confirmed by the numbers: `spin()` (lines 49-75) paces each tick by `eased = TICK_START + (TICK_END - TICK_START) * (i / (steps - 1)) ** 2.4` with `TICK_START = 55`, `TICK_END = 300`. Because the exponent is 2.4, that curve stays near the 55ms floor for most of the sequence and only climbs toward 300ms in the last handful of ticks — for a 6-row table doing 2 full spins plus landing (`steps = rows.length * SPINS + target + 1`, i.e. ~13-18 ticks), the great majority of rows flash by at roughly 55-100ms each, genuinely too fast to read, only slowing down right at the very end.

The content-mismatch half is very likely a perception effect **of** that speed, not a real asymmetry — checked the row markup (lines 90-107) and every row renders the same `row.result.label` (bold) plus `describeCrit(row.result)` (the lowercase description line) regardless of whether it's the currently-spinning (yellow, `bg-brass/25`) row or the settled (red/accent, `stirheim-land-row`) one — both show identical content, just different background colour. The one thing that's genuinely only shown after settling is a separate summary panel below the table (lines 109-118, with a `DieFace` and the same label/description repeated) — that's an intentional post-roll confirmation panel, not a hidden "lower case" line on the settled row itself. Recommend slowing the animation as the main fix; the reported content difference should resolve itself once the row can actually be read mid-spin, but worth confirming with Tom once it's slower in case something else is really there.

### 13. "Pick the skill later" in the post-battle report lands on a skill list, which is confusing given the point is to defer the choice

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "Pick the skill later" in a post battle report takes you to a list of skills which is a bit strange; the whole point is that you want to leave it to later. It should instead take you to a page that says something like, "Done! Click the advancements button on the warband page to pick this skill before your next battle.""

**Notes:** Confirmed. There are two different "later" mechanisms in `AdvancesStep.tsx` that are easy to conflate: the whole-advance "Roll later" (`mode === 'later'`) correctly shows a plain "Left pending. Roll it from the roster page under Advancements." line and nothing else. But "Pick the skill later" — offered once an advance has already been rolled and turned out to be a skill choice (`canPickLater` at line 65: `subject.kind !== 'group' && plan.need === 'skill' && plan.roll !== null`) — sets `mode = 'pickLater'`, which does *not* match the `'later'` branch, so it falls into the `else` branch and renders `<AdvanceBody ... step={mode === 'pickLater' ? 'choose' : item.step} .../>` (line 83) — `step` is forced to `'choose'`, the full skill-selection list (`AdvanceBody.tsx`'s `choose` branch → `SkillPicker`). A small "Skill to be picked later" banner with a "Pick it now" button is added underneath it (lines 84-90), but the list itself stays visible and interactive underneath, which is exactly the confusing behaviour reported. Fix is contained to `AdvancesStep.tsx`: swap what renders for `mode === 'pickLater'` for a confirmation message like the plain `'later'` case, instead of forcing `AdvanceBody` into its choose step.

### 14. Warband units — possibly Sons of Hashut specifically, possibly wider — start at 1 XP instead of 0

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "I don't know if it's a problem across the board or just with the Sons of Hashut War band but they seem to have a lot of units starting at 1 XP. I believe most units, especially henchmen, start at 0 XP but I could be wrong."

**Notes:** Investigated but **not reproduced from the rules data or creation code** — worth flagging rather than assuming fixed. Starting XP always comes from `UnitTemplate.startingExperience` (a required field, `src/rules/types/index.ts:233`), read at creation in `builder.ts:503/524/663/678` as `unit?.startingExperience ?? 0`, and the DB side (`create_warband` in `supabase/migrations/20260904000004_roster_functions.sql`) defaults to `0`, never `1`, if a value is missing. Checked Sons of Hashut's own data (`src/rules/data/warbandTemplates/grade-1c.ts`, warband at line 3113): all three henchmen types (Chaos Dwarf Warriors, Blunderbuss Chaos Dwarfs, Hobgoblins) are explicitly `startingExperience: 0`, structurally identical to Reikland Mercenaries' henchmen in `core-and-grade-1a.ts`, which Tom isn't reporting a problem with. No hardcoded `1` exists anywhere in the template data or creation path; no "0-1" unit-limit string is anywhere near the XP field.

Given the data says this shouldn't be happening, the most likely explanations are outside what static reading can confirm: either the specific warband in question wasn't created through the normal builder (e.g. it came in through the CSV/tracker importer, which has its own, separately-coded XP handling — not checked here), or units gained XP after creation (a post-battle award, an import fix-up) that looks like "starting at 1" but isn't. Recommend checking the actual live warband's rows/history (or asking Tom exactly how that warband was created) before writing any fix, since there's currently no code path that would produce this on its own.

**Tom asked (2026-09-07):** "Are you saying that the rules you have access to show that the Sons of Hashut should start on 1 xp? what about other henchmen from other warbands?" — no, the opposite: to answer this precisely, every `henchmanTemplates` entry across every warband data file was scanned by script (not just spot-checked) for its `startingExperience` value. **Result: 113 henchman template entries across every warband in the game, zero exceptions — all 113 are `startingExperience: 0`, including all three of Sons of Hashut's.** So the rules data is unambiguous and matches what Tom expected (henchmen start at 0 everywhere), and the builder code reads that value correctly for both heroes and henchman groups (`builder.ts:507` and `:524`, same `unit?.startingExperience ?? 0` pattern, no divergent code path for henchmen). This makes it more certain, not less, that something outside the normal rules-data-driven creation path produced the 1 XP Tom saw — the importer or a post-creation edit are the remaining candidates, not the rules data or the builder.

### 15. The Well exploration outcome doesn't ask which model missed the next game (and other outcomes probably have the same gap)

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "The Well outcome in the exploration phase doesn't ask you to pick a unit, so it won't know who misses the next game if they fail. There are probably other exploration phase outcomes like this, where you have to select a unit. It also asks what treasure is found which is strange because the game already knows that they find 1 wyrdstone, so I'm unsure why the user is prompted to input additional treasure."

**Notes:** Reported alongside #16 in the same paragraph — both quoted here in full since they came from the same report; see #16 for the treasure-prompt half.

Confirmed, and it's wider than just Well. The Well's rule text (`src/rules/data/campaign/exploration.ts:41-42`) is: "Choose one of your Heroes and roll a D6. If the result is equal to or lower than his Toughness, he finds one shard of wyrdstone... If he fails, the Hero swallows tainted water and must miss the next game through sickness." That file's own header comment says plainly: "Nothing here is mechanically wired yet; the UI shows the text and the structured fields are for a future exploration roller." `ExplorationStep.tsx` (269 lines, read in full) has no hero/model picker anywhere — its only inputs are a dice-count stepper, per-die fields, a generic pass/fail toggle for `needsTest` (shared by Well's Toughness test and other Leadership tests), gold/shard number fields, a freeform items list and a notes box. A failed test only appends a **plain text note** (`exploration.ts` model, "`${stat} test failed: ${prompt}`") — no hero id is ever recorded, so nothing marks anyone as missing next game. The `missNextGames` mechanism this needs already exists and is used correctly elsewhere (Casualties/Injuries steps); it's just never invoked from here. The wizard also already has the *pattern* for per-subject selection — `ExperienceStep.tsx` keys XP-award cards by `subjectId` — it just isn't reused in this step.

Other exploration outcomes with the same gap (all from `exploration.ts`, all currently resolved by the same generic pass/fail UI with no model picker):
- **The Pit** (line 648) — a chosen Hero can be devoured (permanently removed) on a 1, or bring back D6+1 shards.
- **Alchemist's Laboratory** (543) — a chosen Hero unlocks Academic skills.
- **Jewelsmith** (558) — a chosen Hero gets +1 on rare-item rolls, permanently.
- **Fighting Arena** (767) — a chosen Hero unlocks Combat skills and may raise WS by one.
- **Merchant's House** (604) — on a double, a chosen Hero gains the Haggle skill.
- **Straggler**, Possessed variant (124) — names the warband's leader specifically for +1 XP.

Given the number and variety of these (a permanent stat/skill change, a permanent death, a recurring bonus, not just a missed game), this is a real structural gap rather than a one-off, and any fix should probably generalise to "this outcome affects a specific model" rather than patching Well alone.

### 16. The Well exploration outcome asks the user to input treasure found, when the app should already know the amount

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The Well outcome in the exploration phase doesn't ask you to pick a unit, so it won't know who misses the next game if they fail. There are probably other exploration phase outcomes like this, where you have to select a unit. It also asks what treasure is found which is strange because the game already knows that they find 1 wyrdstone, so I'm unsure why the user is prompted to input additional treasure."

**Notes:** Same report as #15 — see that entry for the missing-unit-picker half.

Confirmed, and Well genuinely is the only outcome with this exact problem. Every gold/wyrdstone reward across `exploration.ts` is a dice expression ("D6", "2D6", "D6x10", "D6+1", etc.) except the Well's, which is a plain fixed `amount: 1` — the only such case in the whole file, so a manual-entry field is correctly used everywhere else. The model layer already treats it as known (`exploration.ts` model's `diceAmount()`: a reward with no dice expressions just becomes `value = fixed` automatically), but `ExplorationStep.tsx` (lines ~173-189) still renders the "Shards at the location" `NumberField` whenever `fixed > 0` — it's `disabled` (greyed out) rather than hidden or shown as plain text, so it still visually reads as "please enter this," pre-filled with the right answer. Small, contained fix: when there are no dice expressions at all, show the fixed amount as plain text instead of a disabled input.

### 17. Filing a report briefly flashes an "already filed" page before redirecting

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "When you file a report, for a brief second it comes up with a page that says something like "A report for this battle is already in,'" before redirecting to the main battle report page."

**Notes:** Confirmed as a genuine render race, not a display bug — the "Already filed" check itself is correct, it's just seeing a true fact slightly before the page moves away. `PostBattlePage.tsx`'s `file()` (lines ~233-249): `await submit.mutateAsync(...)` (238) resolves once the RPC succeeds *and* its own `onSuccess: invalidate` (`useSubmitBattleReport` in `src/api/reports.ts`, which invalidates `matchKeys.all`) has run — that invalidation kicks off a background refetch of the still-mounted `useMatch(id, ...)` query that drives this same page's `filed` check. Execution then continues past that line into `closing.current = true` and `await applyWizardAdvances(...)` (242) — a further async step (rolling/applying each pending advance) that takes real time. If the match refetch from the invalidation resolves during that gap, the outer `PostBattlePage()` function — which owns the `useMatch` call and the "Already filed" check, and renders it *instead of* `<Guarded>`/`<Wizard>` when `filed` is true — re-renders with `reported_warband_ids` now including this warband, so the guard briefly takes over and the `Wizard` (mid-`applyWizardAdvances`) gets unmounted under it, until `file()` finishes and `navigate(...)` moves the page on anyway. `closing.current` already exists for a related purpose but lives inside `Wizard`, one level below where the guard is checked — it can't gate the guard as-is. A fix needs some "a submission for this warband is in flight" signal visible to the *outer* component (lifted state, a ref shared via context, or a transient flag in the report draft store) rather than a one-line change to the existing ref.

### 18. Advancements' skill picker needs a skill-type filter, defaulting to "All Skills"

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "When you select a skill in Advancements, the heading options of being able to select the skill type, with the default being "All Skills""

**Notes:** Wording as sent — read as: add a skill-type filter/heading to the skill picker in Advancements, defaulting to "All Skills". Confirmed there's no such filter today: `SkillPicker` in `src/features/advances/AdvanceBody.tsx` (~lines 500-545) takes `tables: AvailableSkillTable[]` (one per skill table the hero is entitled to — Combat/Shooting/Strength/Speed/Academic/Warband-unique, from `availableSkills()` in `src/rules/resolve/advances.ts`) and just stacks every table as its own heading + list, one after another. The only narrowing control is a free-text search box, and it only appears once the combined skill count exceeds 12 — there's no "All Skills / Combat / Shooting / ..." selector at all. This `SkillPicker` is shared by both the post-battle wizard's Advances step and the standalone Advancements screen, so a filter added here covers both places at once.

### 19. Skill toggles: the toggle wording belongs to the engine not the skill text, and toggles should only appear for a model that actually has the relevant skill

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "There are a lot of skills that require toggles. Firstly, the toggle text shouldn't be in the skill itself: that's a message for the engine itself. Secondly, why don't we have the toggles hidden (including the charging one that's currently in), and the toggle appears when you select a model that has a relevant skill? So if they have Pit Fighter, for example, the only toggle that will show is "Inside Building?""

**Notes:** First half confirmed exactly — found it. Four skills in `src/rules/data/skills.ts` have a literal "(toggle: ...)" annotation baked into their player-facing `description` text:
- `pit_fighter` (line 162): "+1 Weapon Skill and +1 Attack when fighting inside buildings or ruins **(toggle: inside buildings)**."
- line 30: "+1 Attack when fighting two or more enemies **(toggle: fighting 2+ enemies)**."
- line 58: "Reroll missed to-hit rolls in the turn he charges **(toggle: charging)**, with a normal sword or Weeping Blades only..."
- line 199: "+1 WS on the charge **(toggle: charging)**."

That parenthetical clearly reads as a leftover engine/dev note rather than rules text, and shows up wherever the skill's description is displayed (roster skill lists, hover cards, etc.) — a clean, contained fix: strip the "(toggle: ...)" clause from these four descriptions.

Second half is more nuanced than it first looks — **most of what's being asked already exists**. `relevantToggles()` (`src/features/match/fight/odds.ts`) already computes the Situation toggles per attacker: "Fighting two or more enemies" only appears if the attacker has a skill with `conditionField: 'fightingMultiple'`, "Inside a building or ruin" only if they have `conditionField: 'insideBuildings'` (Pit Fighter) or the `pit_fighter` trait, "Hated enemy" only with the `hatred` trait, and so on — so for Pit Fighter specifically, today's behaviour already matches "the only toggle that will show is Inside Building?" *for the skill-gated toggles*. The one toggle that's genuinely unconditional is "Charging" itself — always offered for any melee attacker regardless of skills or weapon.

**Tom confirmed (2026-09-07):** "it's a universal rule but it doesn't affect combat rolls unless they have a relevant skill (it only reflects the order, which players will do themselves)" — so Charging should get the same treatment: hidden unless something actually reacts to it. Traced every place `context.charging` reaches the engine to find what "reacts to it" means precisely: it feeds `isFirstTurnOfCombat()` (`buildAttackInput.ts:60-62`, "charging is always the first turn of a combat"), which in turn matters when (a) the attacker has a skill whose `conditionField` is `'charging'` (the two "(toggle: charging)" skills from above), or (b) the selected weapon has `strengthBonusFirstTurnOnly`, `firstTurnBonusAttacks`, or `chargeBonusAttacks` set — the exact same weapon fields `relevantToggles()` already checks to decide whether to show the *separate* "First turn of this combat" toggle (`firstTurnMatters`, in the melee branch). So the fix is to reuse that same `firstTurnMatters` condition (plus the skill check) to gate "Charging" too, rather than pushing it unconditionally — no new engine logic needed, just wiring the existing check to one more toggle.

### 20. Tapping a dice-roll button more than once should log every result, not just the last one, to stop re-rolling out of sight

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "When you tap on a dice roll button more than once, this should show in the dice log along with each result. This prevents people cheating the system such as when they roll an advance and don't like the first outcome, they can quickly tap again before their friends see it."

**Notes:** Confirmed as a real, structural gap, and it's actually wider than just "tap the roll button twice" — three distinct places currently discard a roll with zero trace once a later one replaces it:

- **`DieField`** (`src/ui/DieField.tsx`), the numeric-keypad/Roll widget used throughout the post-battle wizard including Advances' D6 fields — Tom's own example. It's a bare controlled input: `roll()` calls `rollDie(sides)` and overwrites the field's value with no history kept anywhere. Tap "Roll," see a result you don't like, tap it again — the first result never existed as far as the app's concerned.
- **`DicePicker`** (`src/ui/Dice.tsx`) with more than one die (e.g. a 2D6 roll) — `set(index, value)` updates one die's value immediately without calling `onComplete` until every die is filled, so a player can keep re-tapping one die's face as many times as they like before the second die locks the roll in; only the last face tapped is ever recorded.
- **A full "Start again"** in the Fight tab's roll-through popup (`FightTab.tsx`) — `state.log` (every roll of the current attack) lives only in local component state until "Log to both sheets" is pressed. Hitting "Start again" resets `state` to `null` and re-runs the whole attack from scratch, discarding the entire previous sequence's rolls with no record at all — arguably the more consequential version of the same worry, since it can rewrite a whole attack's outcome (to hit, to wound, injury), not just one die.

Any fix needs to decide where the retained history is meant to live (kept only for the current session so a GM can see it live, vs. actually persisted to the record) and whether "Start again" should still be allowed unrestricted once dice have been rolled — that's a product question worth settling with Tom before writing code here, since it changes how disruptive/costly the fix is.

### 21. Can't submit the second warband's post-battle report after submitting the first, when one player controls both sides of a match

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "I ran a test battle between two warbands that I control and then I submitted the battle report on one of the warbands. When I went to the second one, I was no longer able to submit their battle report. This seems like a bug as then they can't benefit from any of the XP or advancement rolls in the post-game sequence."

**Notes:** Read through the whole path first — `submit_battle_report`'s SQL (uniqueness is per `(match_id, warband_id)`, `complete_match_if_reported` counts per participant row not per user, `can_edit_warband` checks ownership not "did someone else on this account already file today"), `PostBattlePage.tsx`'s "already filed" guard (keyed correctly per `participant.warband_id`), and `useMatchRoster`'s query key (includes `warbandId`, so no shared-cache collision between the two warbands) — nothing there should behave differently just because both warbands share an owner.

Then reproduced it live end to end on the local dev stack to be sure: joined Tom (GM)'s own second warband ("The Argent Hammer") into the same campaign as his first ("Reikland Watch"), scheduled and started a battle between the two, ended it, filed Reikland Watch's report fully through all 8 steps, then opened The Argent Hammer's report — **it loaded and filed cleanly, both reports ended up "2 of 2" and the match completed.** Could not reproduce the block under the most literal reading of the report.

Given it didn't reproduce under a plain same-campaign, no-map, GM-owns-both-warbands test, the difference is probably something about Tom's actual live setup that this local repro didn't have — worth checking, roughly in order of likelihood:
- **Map campaign settings.** `PostBattlePage.tsx`'s `Wizard` calls `useMapPerks(...)` whenever `settings.mapCampaign` is on; this wasn't exercised at all in the repro (the test campaign isn't on the map). If that hook throws or misbehaves for a specific warband/district combination, it could plausibly block the whole wizard for just one side without an obvious server-side cause.
- **GM approval house rule**, combined with whether Tom was actually the GM of the campaign he tested in (if not, `reportApproval` could route his second filing to "pending" rather than "applied" — that wouldn't fully block submission, but might look like it if the UI's handling of a pending state isn't clear).
- **Timing/order** — the repro was done slowly and sequentially (each step awaited); if the real attempt involved two tabs open at once, or clicking through very fast right after the first mutation, a query-cache race is still possible even if not found in the static read.

Given it's not reproducible from the description alone, the most useful next step is probably to have it happen again and capture exactly what the page showed (an error banner, a disabled button, a redirect) rather than guessing further — recommend downgrading from "definitely a bug" to "reproduce and capture the exact symptom" before writing a fix.

### 22. Move "Transfer Warband to Another Player" and "Move to another Campaign" under the warband page's "More" button

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "I think the "Transfer Warband to Another Player" and "Move to another Campaign" options can be moved to being under the "More" button at the bottom of the warband page"

**Notes:** Straightforward. Both currently render as their own always-visible header links in `WarbandPage.tsx` (`HandOver` component, lines 465-524, trigger at 484-488 "Transfer warband to another player"; `MoveCampaign` component, lines 415-462, trigger at 432-437 "Move to another campaign" / "Join a campaign"), inside a `<div className="flex flex-wrap gap-x-4 gap-y-1">` at lines 138-141 — not inside any menu today. The "More" button Tom means already exists on this exact page: `menuOpen` state (line 63), a desktop trigger at 171-173 and a mobile sticky-bar trigger at 268-270, both opening the same `Sheet` at lines 274-312 (titled "Warband"), which currently holds Archive/Unarchive, Save as template, and Delete warband. Moving the two options in means adding two more entries to that Sheet that open `HandOver`/`MoveCampaign`'s own sheets — both components currently manage their `open` state internally, so that state would need lifting up (or a shared open-trigger prop added) rather than just relocating the trigger buttons.

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

**Notes:** Confirmed — `src/ui/icons.tsx:96`, the `dice` icon is a completely static square outline with 5 fixed pips (a plain "rolled a 5" face), no motion at all, used on the "Roll it through" button in `FightTab.tsx`. There's already an established pattern for small looping/ambient icon animation to follow: `.stirheim-glow` (`src/index.css`) pulses an icon's drop-shadow continuously, already used for the "Advancements" tile when advances are due, complete with a `prefers-reduced-motion` fallback. A rotating-die version (spinning the icon, or cycling between a couple of pip layouts) could reuse the same CSS-keyframe-plus-reduced-motion-guard structure rather than inventing a new animation approach.

### 26. Trading post icons/names: "Characters" should be "Dramatis Personae"; stash should look like a treasure chest; Buy/Sell icons should read as a matched pair

**Status:** 🔲 Open
**Priority:** 🟡 Low
**Reported:** 2026-09-07

> "The characters icon in the trading post is weird. It should also be called Dramatis Personae, not characters. Also can we make the stash icon a treasure chest, and make the Buy and Sell icons go well together like brother and sister icons?"

**Notes:** The "Characters" label is the `IconTab` at `TradingPage.tsx` lines 25-33 (`{ value: 'characters', label: 'Characters', icon: 'characters' }`), plus a second "Characters" section title inside `CharactersTab.tsx:49`. Renaming the label is a one-line change per site; whether to also rename the `IconName`/tab value itself (`'characters'` → something like `'dramatisPersonae'`) is a slightly bigger but still mechanical rename across `icons.tsx` and both usages.

Checked the actual SVG path data in `src/ui/icons.tsx`: `characters` (line 87) is a head-and-shoulders person shape with two extra diagonal strokes flaring off the top of the head — reads as stray antenna lines, which is probably the "weird" look. `stash` (line 86) is a plain rectangular crate (body, sloped lid, centre seam, short handle) with none of the rounded-lid/clasp details that would read as a treasure chest. `buy` (line 84) is a sack/bag with a triangular peak and strap lines; `sell` (line 85) is an unrelated circle-with-up-arrow glyph — confirmed they don't currently share any visual language (different frame, different motif), so "brother and sister icons" is an accurate complaint, not a preference call. The file's own header comment says the icon set is meant to be "kept deliberately few" and consistent, so redesigning buy/sell as a matched pair fits the file's stated intent rather than fighting it.

### 27. Dramatis Personae list is inconsistent (some full descriptions, some just cost); wants a tap-to-read pop-up and a persistent bottom "Search" button

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The Dramatis Personae list is inconsistent. Some have full descriptions and others just have cost. You should be able to tap on one to read more about them in a pop-up (their stats etc). Then there should be a "Search" button that is persistently at the bottom (in case of scrolled descriptions) and when you click Search, the current screen of "Who goes searching" appears."

**Notes:** This is the trading post's "Characters" tab, `src/features/trading/CharactersTab.tsx` — its own header comment already calls the feature "Dramatis Personae," confirming this is the same list as #26.

Root cause of the inconsistency: every row's second line falls back through `persona.hireCost?.text ?? persona.detail?.hireFee ?? 'No plain fee'` (line ~66). Most personas have a short `hireCost.text` ("150 gc"), but four (Bertha Bestraufrung, Dark Emissary, Penthesilea, Truthsayer — `src/rules/data/campaign/dramatisPersonae.ts` lines 90, 485, 768, 823) have `hireCost: null`, and two of those fall through to a `hireFee` that is full multi-paragraph rules text (Bertha's and Penthesilea's each run into an embedded dice-roll table) — which then renders inline in the compact list row. That's exactly "some have full descriptions and others just have cost."

Tapping a row today calls `setPicked(persona)` (line 56), which goes straight into the `SearchSheet` — there's no intermediate "read more" popup. All 30 personas do have a `detail` object with flavour text and a rating, but it only appears at the bottom of the already-open `SearchSheet` (lines 214-219), not as a preview before committing to search. The "who goes searching" screen exists inside that same sheet, headed "Who goes looking?" (line 176, close to but not exactly Tom's phrasing) with the usual checkbox-and-die-roll list; there's no persistent bottom "Search" button anywhere today — tapping a persona row is the only entry point.

Two existing patterns could serve the "tap to read more" request: `src/ui/HoverCard.tsx` (already used for spell descriptions in `CastTab.tsx` and elsewhere) for a lightweight popover, or `HiredSwordsTab.tsx`'s `HiredSwordDetail` (lines 362-403, stats + equipment + skills + a collapsible flavour block) as the model for a fuller "stats etc." popup, which is closer to what Tom described.

### 28. Creating a warband with a spellcaster never prompts a spell roll or pick — also needs a house rule for how the first spell is chosen

**Status:** 🔲 Open
**Priority:** 🔴 High
**Reported:** 2026-09-07

> "Making a warband with a spellcaster in doesn't prompt you to roll or pick a spell at all. This also needs a house rule setting, as the RAW is that the first spell is picked randomly, but two house rules that are played are:
> 1. First spell taken can be picked, not rolled
> 2. Roll twice, pick 1 of them"

**Notes:** Confirmed — the builder has no concept of spellcasters at all. `draftToRosterWarband()` in `src/rules/resolve/builder.ts:507` hard-codes `spellIds: []` for every hero unconditionally (same for henchmen hired later, `recruitment.ts:148`); there's no lookup of `WIZARD_ALLOCATIONS`/any lore anywhere in the builder, and a repo-wide check of `src/features/roster/builder/*` for "spell", "wizard", "caster" or "lore" turns up nothing.

The pieces to build this from already exist and just aren't wired to warband creation:
- `GrimoireCard.tsx`'s `ReadingSheet` (lines 169-200) is the existing "roll on the lore table" UI (resolves the hero's lore, shows a `DicePicker`, lists the lore's spells with the rolled one highlighted).
- More directly relevant: `AdvanceBody.tsx`'s `SpellPicker` (~lines 547-600) already supports *both* rolling and choosing freely for a spell gained via advancement, gated by an optional `chooseFrom` prop tied to a map-campaign perk (Sage's Hall) — proof the roll-vs-pick UI already exists, just gated on the wrong condition for this use.
- The lore-scoping logic itself is `loreForHero(hero, template)` + `unknownSpells(lore, hero, bans)` in `src/features/advances/model.ts:202-215`, currently only called from the advancement flow.

For the house rule: `CampaignHouseRules` (`src/rules/types/roster.ts:170-191`) currently has seven fields, all plain booleans, surfaced via `HOUSE_RULE_SWITCHES` in `settingsForm.ts` as `ToggleRow` switches — there's no existing 3-way/enum house rule to copy. However `dicePolicy` (a sibling `SettingsForm` field, not inside `CampaignHouseRules`) IS a 3-option setting rendered with `SegmentedControl` (`settingsForm.ts:13`, `SettingsFields.tsx:22,70-77`) — that's the template to follow for a "RAW random / pick freely / roll twice, pick one" setting.

Ties into #29 (spell-edit scoping) and #32 (spell targeting) — all three touch the same spell/lore data model and the Cast/Edit/Builder spell-picking surfaces.

### 29. Editing a spellcaster's spells lets you pick any spell in the game, not just ones from that unit's own lore/tree

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "Adding a spell to a spellcaster in "Edit" allows you to pick any spell, not just spell trees that that unit can learn from."

**Notes:** Confirmed. `HeroEditor.tsx`'s "Spells" field (lines 161-180) lists `allSpellOptions()` — every spell and prayer in the whole game (`lookups.ts:137-139`, `[...SPELL_INDEX.values()]`) — grouped into `<optgroup>`s by lore name for display only, with no filter against the hero's own lore at all. The asymmetry: the same component's *skills* field correctly calls `skillOptionsFor(skillTableIds, warbandTemplateId)`, which scopes to the hero's own assigned skill tables — spells just never got the equivalent treatment.

The fix would reuse `loreForHero(hero, template)` + `unknownSpells(lore, hero, bans)` (`src/features/advances/model.ts:202-215`, same helpers noted under #28), but `HeroEditor`'s props currently only pass `warbandTemplateId: string`, not the resolved `WarbandTemplate` object `loreForHero` needs — so the fix also needs the full template threaded down, not just its id.

### 30. Melee Attack and Ranged Attack quick actions share one highlight state and don't cleanly default to their own weapon type

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "The ranged attack and melee attack quick actions are both on the same screen so they are both highlighted when you select either of them. What should really happen is the melee attack should default to melee weapons and the ranged attack should default to a ranged weapon and they should be separate quick actions."

**Notes:** Confirmed, and the fix is small. `BattleNav.tsx` lines 87-88: both `NavTile`s compute `active={tab === 'fight'}` — since a single `BattleTab` value ('fight') backs both quick actions, tapping either one always lights up both. `BattlePage.tsx` already tracks `attackStartWith: 'melee' | 'ranged'` (set by `onAttack`) precisely to know which one was tapped — that state just isn't threaded back down into `BattleNav`'s `active` check yet. Fix: pass `attackStartWith` (or equivalent) into `BattleNav` and compute each tile's `active` as `tab === 'fight' && attackStartWith === 'melee'` / `'ranged'` respectively.

The weapon-defaulting half (melee tile → melee weapon, ranged tile → ranged weapon) was verified working correctly earlier this session (tested live: a Marksman defaults to Bow under Ranged Attack, Dagger under Melee Attack) — so this report is specifically about the shared highlight, not the defaulting itself, unless something has changed since. Worth confirming with Tom whether the defaulting is now also misbehaving for him or whether it's purely the highlight.

### 31. "Cast a Spell" looks nothing like Melee/Ranged Attack — should reuse the same layout with "Spellcaster"/"Target" instead of "Attacker"/"Defender"

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "Additionally when you click "Cast a Spell," the visual is very different to the others. What it should be is that it should look like the melee attack and ranged attack but instead of "Attacker" it should say "Spellcaster" and instead of "Defender" it should say "Target.""

**Notes:** Confirmed — `CastTab.tsx` is a single `<Section>` with everything (caster picker, the Target `<SelectField>` added earlier this session, the spell list) stacked in one column, nothing like `FightTab.tsx`'s two-box `FightBox` grid (`icon="battle" title="Attacker"` / `icon="shield" title="Defender"` side by side with the floating roll button between them). A faithful match would restyle Cast a Spell into the same two-`FightBox` grid, headed "Spellcaster" and "Target," with the spell picker/roll happening in a popup the same way the attack roll does — which would also naturally fold in the Target select from #32 rather than leaving it as a plain dropdown above the spell list. Worth doing together with #32 and #30 as one pass over the whole quick-actions/roll-it-out area, since they touch the same components.

### 32. Spell targeting should offer only friendly, only enemy, or both lists (grouped under headings) depending on what the spell allows

**Status:** 🔲 Open
**Priority:** 🟠 Medium
**Reported:** 2026-09-07

> "If the spell should be cast on friendly units, it should only give the option of friendly units. If it should be cast on enemy units, it should cast on enemy units. If it can be cast on both, it should have both lists, with "Friendly Units" as a heading and "Enemy Units" as a heading."

**Notes:** Extends the friendly-only Target picker added to `CastTab.tsx` earlier this session (currently always friendly-only, no enemy option, no per-spell targeting rule). Confirmed two things needed for this: (1) per-spell data — `Spell`/`SpellLore` (`src/rules/types/magic.ts`) has no target field at all today ("nothing here is mechanically modeled by the engine yet," per the file's own header), so every spell in the catalogue would need a `target: 'friendly' | 'enemy' | 'both' | 'none'`-style field added, likely by hand against each spell's rules text; (2) enemy roster access — `CastTab` currently only ever receives the caster's own `roster` (`BattlePage.tsx:344`: `<CastTab roster={roster} template={template} sheet={shown} .../>`, no `others`/`sessions`), unlike `FightTab` which already gets both sides. Wiring in an enemy-targeting option means threading the same `others`/`sessions` props `FightTab` already has into `CastTab` too. Related to #28, #29 and #31 — all touch the same spell data model and Cast tab surface, worth tackling as one body of work rather than four separate passes.

<!-- New batches go below this line, most recent last. Copy the entry template for each item. -->

<!--
### N. Short title

**Status:** 🔲 Open
**Priority:** 🔴 High / 🟠 Medium / 🟡 Low
**Reported:** YYYY-MM-DD

> Verbatim text of what Tom said about this item.

**Notes:** (investigation, fix approach, commit link — filled in as work happens)
-->
