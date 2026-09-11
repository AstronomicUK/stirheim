# Campaign usability and post-battle clarity — second batch

Authorised by Tom before bed and resumed explicitly on 11 September. Keep fixes local and batch the next release to limit Netlify credits. Preserve player overrides. Khemri #227 is very low priority and excluded. Do not modify live player histories to test.

## Work list and review

- **#221 Ban-list search:** fixed locally. Removed the hard 12-result truncation; exact/prefix/name matches lead descriptive matches. Empty searches browse every category. A bounded scrolling list plus Show more exposes all entries and an explicit count. Selecting a ban retains the search. Seven focused tests and typecheck pass; actual mobile (390px) and desktop (1280px) check finds Witch first, reaches all 20 Witch matches, selects it, and browses without search. Disposable campaign cleaned. No deployment.
- **#222 Scenario library:** confirmed management page currently lists custom scenarios only; its separate Browse library link does not enable core-library entries for the campaign. Add persisted enable/disable selection integrated with settings. Keep custom writing separate and preserve #227's future setting idea without implementing it now.
- **#223 Campaign Settings navigation:** requires proposals. Existing form includes treasury, campaign rules, bans and management actions in one long page. Preserve primary navigation. Propose the secondary groupings and mobile/desktop presentation before implementing.
- **#224 GM Checklist:** implemented and verified locally. Account-and-campaign database state persists steps, hidden/complete status and reopening. Explicit Finish checklist action, manually checked steps and optional import. Existing campaign-data completion remains automatic. Save errors retain previous state and offer a retry. Three database tests pass, including another user/replacement GM isolation; real mobile touch/reload flow passes. Migration 72 is local only.
- **#225 Campaign overview navigation:** requires proposals consistent with #223, while retaining the primary menu. Overview and Settings remain distinct screens.
- **#23 readable campaign and warband histories:** current generic field renderer flattens only one level of flags/settings; nested house rules and whole report payloads still become dumps. Implement semantic changes and names, suppress technical duplicate report application details, retain useful before/after information. Tom's quoted Familiar example actually changed opposed-parry WS; do not invent a ban change from that payload.
- **#226 injury override provenance:** distinguish manual tabletop entry from replacing an app roll; preserve original/replacement and supplied reason in the filed and reloaded report. Never fabricate original values for historical data.
- **#54/#218/#177 Sold to the Pits follow-up:** current WarbandPage mounts PitFightCard for active warriors with pitFightOwed, but that is not an in-wizard prompt. Investigate the pending/applied report boundary; verify the actual chosen injury produces a clear next step and the correct fight consequence. Do not mark complete merely because a later warband card exists.

Recommended implementation order: #221, #224, #222; then shared English history formatting with #226 and the Pits prompt. Prepare #223/#225 design proposals while the independent fixes proceed.

## Additional release verification follow-up

Hosted CI run 34561410564: ordinary test job passed; browser suite had 11 passed, 2 failed, 3 not run. Failures are battle-sheet die selector at `e2e/04-match.spec.ts:74` and imported roster Transfer warband button at `e2e/06-roster-import.spec.ts:25`. The latter is already tracked as #201. Investigate actual screens before classifying either as only selector drift. Do not claim hosted CI is green. Detailed logs are `/tmp/stirheim-release-ci-failed.log`; no new production release is needed merely to correct test selectors.

## Local #221 evidence

`src/features/campaign/bans.test.ts`: 7 passing tests. Typecheck passed. `/tmp/stirheim-ban-search-mobile-qa.mjs` passes real local settings interaction and viewport checks. An initial QA expectation incorrectly assumed at least 24 Witch matches; the actual catalogue has 20. Corrected the expectation; no application change was needed.


## Checklist milestone — #224

Added `gm_checklists` keyed by campaign/user with GM-and-owner RLS; no shared completion or noisy campaign audit events. API cache keys include both identities. UI waits for the saved state on load, offers per-step checkboxes, Dismiss, Finish checklist, Show checklist and Review checklist. Failed saves leave the prior persisted state intact and display the failure. Existing anonymous campaign-only localStorage flags are not assigned to an arbitrary account.

Migration `20260911000072_gm_checklist.sql` applied only to the local Docker database; types regenerated. Three focused database tests and typecheck/lint pass (existing warnings only). `/tmp/stirheim-checklist-mobile-qa.mjs` verifies tick, reload, dismissal/reload/reopen, completion/reload/review and removal of legacy localStorage keys, at 390px with no overflow or page errors. Its initial synchronous Playwright check assertion raced the async save; the actual touch interaction with awaited saved state passes. No production migration/push/deployment.

Next: #222. Current settings schema/form has no enabled-scenario selection; NewMatchPage uses global CORE/LIBRARY arrays and its random pool only includes core/custom. Add a persisted built-in scenario selection to the existing settings form, preserve it through ordinary settings edits, and consume it in both picker and random pool. Keep legacy existing matches intact, custom-scenario management separate, and Khemri #227 deferred. Menu redesigns remain proposals pending review.
