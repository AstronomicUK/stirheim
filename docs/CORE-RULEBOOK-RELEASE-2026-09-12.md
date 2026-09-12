# Core rulebook Priority 1–5: release-ready batch

**Readiness correction:** the full batch is not yet ready. See [the acceptance recheck](CORE-RULEBOOK-SCOPE-RECHECK-2026-09-12.md) for confirmed remaining core work and verification gaps. Earlier readiness statements below are historical and superseded.

12 September 2026. Application source verified through `91089bb`. All changes are local; this batch has not been pushed or deployed.

## Completed scope

| Priority | Completed core scope |
|---|---|
| 1 — Magic and prayers | Core caster/lore setup, all 30 core spell target definitions, area target selection, casting reroll limits, personal protection, difficulty tooltips and mobile layout. |
| 2 — Combat and psychology | Core skill reconciliation, Streetwise, structured Bitter Enmity, Holy Relic first-test handling, physical handgun/rifle/pistol reload tracking, Sign of Sigmar and selected-weapon/strike-order advice. |
| 3 — Equipment and consumables | Per-vial and per-blade poison, Healing Herbs with the approved single-use house rule, Blessed Water, garlic expiry, addiction supply, and physical Tail Fighting equipment selection. Saved state, stock changes and report withdrawal are covered. |
| 4 — Source decisions | Core chart/source corrections and save-order verification; approved current characteristic limits and concurrent recovery retained. |
| 5 — Usability | Approved dice design and rolling interface, valid ranged defaults, recruitment affordability, clear empty battle logs, contextual hero-removal confirmation, campaign joining, singular die labels, wrapping tags, correct warband selection and hired-sword eligibility labels. |

## Final verification

- Ordinary suite: **2,265 tests passed**. The 216 database tests are excluded/skipped in that ordinary run and verified separately.
- Local database integration suite: **216 tests passed across 38 files** after restoring the Trapmaster and Fanatic supply hooks in migration 087.
- Production build and TypeScript passed. Lint passed with three existing audit-script unused-import warnings. Existing CSS marker and bundle-size warnings remain.
- Disposable mobile fixtures exercised poison copies and paired blades, report consumption and withdrawal, pistol/Pistolier and handgun/rifle reloads, relic declaration/correction, Sign of Sigmar and Tail Fighting.
- Addiction supply was exercised through battle start, combat state, an actual submitted report and withdrawal: the battle-start dose is charged once and is not refunded by withdrawing a report.
- Core-lore browser coverage includes spell selection, outcomes, turn changes and reload. Reroll eligibility is covered by unit and serialization tests; this is not a claim that every reroll source was exercised in the browser.

See `CODEX-TAKEOVER-2026-09-12.md`, `CLAUDE-FINAL-VALIDATION-2026-09-12.md`, and the source/equipment/magic checkpoints for detailed evidence. Temporary QA scripts are local supporting evidence, not production dependencies.

## Explicit remaining boundaries

Umbrella tracker entries remain partial where they include supplementary lores, skills, items or wards. Table-managed movement, distances and multi-model positional cases remain table decisions. Full automatic interleaving of both players’ combat is not part of the selected-weapon/strike-order advice acceptance. Separate melee pistol profile work (#2/#69) is not closed by the shooting reload changes. Hero-removal confirmation satisfies #53: the brief allows confirmation or undo, so no further ruling is needed.

## One release, after the next release instruction

The project brief states that the previous deployment authorisation applied to the earlier live batch. This batch is prepared for the user’s next release instruction; no further implementation answer is required.

1. Recheck production migration state and Netlify automatic-build setting. The verified live baseline is source `f74c8731e0d644e61c8e977211b8a6646cdaad96`, deploy `6aa4fdf7018fd66a64a404c2`, with migrations through 086.
2. Apply **087 only** before publishing the frontend. The new client requires the four-argument `start_match`; the fourth argument defaults for older clients. The migration preserves trap and Fanatic supply preparation.
3. Publish one frontend release, avoiding a duplicate automatic/manual build.
4. Verify served production assets, migration state and a suitable live smoke check, then record deployment evidence.

The release owner can execute these technical steps once authorised; the user does not need to run the migration themselves. Do not reset or blindly replay the local migration history.
