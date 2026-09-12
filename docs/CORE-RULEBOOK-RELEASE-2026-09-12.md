# Core rulebook Priority 1–5 — ready for one release

12 September 2026. Application source through `6f47572`, committed locally. **Not pushed or deployed.** This replaces the earlier premature release summary; the dated scope recheck retains that history.

## Implemented core scope

| Priority | Verified local changes |
|---|---|
| 1 — Magic and prayers | Native empty-spell roster setup/editing for all five core caster types; all 30 core spell target definitions; area targets; one-die and pair rerolls with use limits; Daemon Soul protection; difficulty and responsive layout. |
| 2 — Combat and psychology | Core skills, Streetwise, Bitter Enmity, Holy Relic first-test use and explained Rout/Stupidity correction; physical firearm reload; single/brace melee pistols and separate crossbow-pistol opening shot; saved weapon/Fear/Frenzy choices; Sign of Sigmar and conditional strike-order advice. |
| 3 — Equipment and consumables | Exact poison vial/blade binding; Healing Herbs and the approved single-use house rule; Blessed Water; garlic expiry; addiction supply; Tail Fighting; explained Crimson Shade correction; declared Bugman’s Ale for the warband except Elves with exact barrel settlement. |
| 4 — Source decisions | Core chart/source and save-order checks; approved characteristic limits and concurrent recovery retained. |
| 5 — Usability | Approved dice/rolling visuals, correct ranged defaults, recruitment affordability, empty logs, contextual removal confirmation, campaign joining, singular die labels, readable tags, warband context and hired-sword eligibility. |

## Verification

- Final ordinary suite: **2,307 passed**, 186 files. The **216 database tests** are skipped in this command and tested separately.
- Claude’s current database run: **216 passed**, 38 files, after migration 087’s Trapmaster/Fanatic regression repair. No database changes followed this run.
- Production build and TypeScript pass. Lint has only the three existing unused-import warnings in the old reconciliation probe. Existing CSS marker and large-bundle warnings remain.
- One initial full-run test exceeded its five-second timeout while running concurrently. A complete rerun with two workers passed; no timeout was hidden by marking a test skipped. The crossbow source-reference format test then caught an invalid explanatory suffix; moved that explanation into a comment and reran the full suite successfully.
- Actual mobile checks cover physical pistol shooting/reload and new single/brace/crossbow combat, including split brace, misses, corrections and reload; poison/stock/report withdrawal; relic Rout and single-model Stupidity corrections; saved weapon/Fear/Frenzy; Crimson Shade; and Bugman’s Ale declaration/reload/correction.
- Actual casting checks cover pair/one-die rerolls, blocking second rerolls, unused sources, turn reset, saved outcomes and Daemon Soul save. Gated/per-game supplement reroll variants remain unit-only, not claimed browser-tested.
- Desktop native editor, P5 flows, Bitter Enmity note and melee-to-ranged attacker reset pass Claude’s checks.

**Final shared-turn acceptance: passed 9/9.** Start turns and advance both players through the actual controls; same-turn reload retains both declarations, while round 2 and its reload clear failed Fear and retain ended Frenzy. Evidence: `docs/audits/2026-09-12-fear-lifetime/acceptance-live.txt`. No remaining core acceptance gap is known.

Evidence: `CORE-RULEBOOK-SCOPE-RECHECK-2026-09-12.md`, `CODEX-TAKEOVER-2026-09-12.md`, Claude’s validation/checkpoint documents, and the dated audit folders for core pistol combat, Bugman’s Ale, casting rerolls, Relic correction and P5 desktop.

## Scope boundaries

Umbrella tracker entries stay partial where they include supplementary lores, skills, items, regional banners, model-count exceptions or wards. Movement, distances and multi-model positional cases remain table-managed. The player confirms a separate combat and the crossbow opener’s ordering; changing target or turn does not automatically reset pistol use. Full interleaving of both players’ attacks is outside selected-weapon/strike-order advice acceptance. Equal-Initiative roll-offs remain table decisions. Hero-removal confirmation meets #53’s confirmation-or-undo requirement.

## One release after authorisation

The project brief reserves this new batch for the next release instruction; prior authorisation applied to the earlier live batch. No user rules answer remains outstanding.

1. Recheck production migration state and Netlify automatic-build setting. Last verified live source: `f74c8731e0d644e61c8e977211b8a6646cdaad96`; deploy `6aa4fdf7018fd66a64a404c2`; migrations through 086.
2. Apply **087 only** before the frontend. The new client uses four-argument `start_match`; its fourth argument defaults for older clients. Trapmaster and Fanatic preparation are retained.
3. Publish one frontend release without duplicate automatic/manual builds.
4. Verify served assets, database state and a suitable live smoke check, then record the deployment.

Codex handles those steps once authorised. Do not reset or blindly replay the local migration history. Unrelated historical audit edits remain preserved in the working tree and are not part of this source checkpoint.
