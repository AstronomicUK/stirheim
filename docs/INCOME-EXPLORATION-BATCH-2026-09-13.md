# Small income and exploration batch — #102, #103, #157

Scope approved by Tom after the public tracker release. Prepare one batch for deployment; no production changes or deployment performed for this batch.

## Changes

- **#102 Foragers:** Hochland Bandits sell using the next smaller warband-size band, clamped at 1–3. The printed 15-warrior/four-shard example pays 65 gc; quote, settlement and explanation agree.
- **#103 Master Chef:** an active Halfling Cook requires a saved D6 before selling. Only 5–6 grants the smaller band. The approved dice control supports app rolls and tabletop entry. The result survives refresh and has one record per sequence, including before the first battle. Explicit corrections require a reason, preserve the original roll in history and cannot change an already-used result. A new post-battle sequence permits a new roll. Sale checks reject stale treasury, stale phase and stale Cook eligibility/roll revision; simultaneous submissions cannot credit the same sale twice.
- **#157 Pathfinder:** Horned Hunters receive the extra die only when an eligible surviving Hero actually has `horned_hunters_skills_pathfinder`. No bonus for an unlearned skill, captured/dead/out-of-action bearer, or absent bearer passed through the existing exclusion list. Multiple bearers never stack; the keep-six rule and other bonuses are unchanged.
- Sale and Master Chef activity use plain English. Original app/tabletop rolls and corrections remain distinguishable. Internal ledger revisions/request IDs and the sold flag do not clutter the history.

## Source evidence

- `reference/rules/warbands/grade-1b-part1.md`: Foragers at line 2294; Pathfinder in the Horned Hunters skill list at line 2638.
- `reference/rules/warbands/grade-2a-part1.md`: Halfling Cook's Master Chef at line 1386.
- Existing tracker #102/#103/#157 and preserved warband audit. No new rules ruling was needed.

## Verification

- Focused tests cover all six Cook faces, missing/invalid dice, active Cook eligibility, income band bounds, map/scenario bonus order and explicit size overrides.
- Pathfinder tests cover learned/unlearned, unavailable bearers, duplicate bearers and rolling more than six while keeping six.
- Database tests use disposable local data: first roll, exact retry, explained correction, original result retention, concurrent correction, duplicate sale, stale revision/phase/treasury, absent Cook, permissions, pre-battle persistence and next-sequence reset.
- Actual 390px mobile browser: no sale before the roll; entered 4, refresh, corrected to 6 with a reason, quote 65 gc, sale, refresh and treasury still 165 gc / zero shards. Desktop history exposes the correction and sale. Also tested the real app roll animation, persisted app provenance, subsequent player override and next-sequence reset. No page errors or horizontal overflow.
- All 125 migration files through **131** install in filename order in a separate disposable database. Shared local DB was not reset; only new migration 131 was applied there.
- Final complete runs: **2,441 application tests across 206 files** and **328 backend tests across 57 files** pass. Production build (including TypeScript) passes; lint has only eight existing warnings in old audit/design files. Existing bundle-size warnings remain.
- One final backend run exposed an unordered audit-query assertion in the new test. Added explicit ID ordering; the complete rerun passed. Browser harness selectors were corrected to the existing tab and disclosure roles; these were test errors, not hidden app failures.

## Release procedure

This batch needs **migration 20260913000131_master_chef.sql** before the frontend. Production was through 130 after the previous release. Verify that baseline before applying only the new migration. The migration adds the Cook ledger and two RPCs; it does not rewrite existing player rosters or treasury balances. Existing clients retain the old trading endpoint until the frontend is replaced.

Make one production frontend deployment after approval, retaining the paused automatic-build arrangement to avoid duplicate Netlify builds. Then mark #102/#103/#157 implemented against a new published release and verify the new board notes. Until then they are locally ready, not live fixes.
