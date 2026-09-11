# Campaign usability and post-battle clarity — second batch

Authorised by Tom before bed and resumed explicitly on 11 September. Keep fixes local and batch the next release to limit Netlify credits. Preserve player overrides. Khemri #227 is very low priority and excluded. Do not modify live player histories to test.

## Work list and review

- **#221 Ban-list search:** fixed locally. Removed the hard 12-result truncation; exact/prefix/name matches lead descriptive matches. Empty searches browse every category. A bounded scrolling list plus Show more exposes all entries and an explicit count. Selecting a ban retains the search. Seven focused tests and typecheck pass; actual mobile (390px) and desktop (1280px) check finds Witch first, reaches all 20 Witch matches, selects it, and browses without search. Disposable campaign cleaned. No deployment.
- **#222 Scenario library:** implemented and verified locally. Full built-in catalogue selection is integrated into the existing settings form and its Save changes action. Choices persist through reload and unrelated settings edits. New-battle picker and random pool consume enabled entries; existing battles keep their scenario. Custom scenario management remains separate. Thirty-five focused settings/library tests and a real mobile enable/save/reload/treasury-edit/picker/disable flow pass. No new migration for this JSON setting.
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


## Scenario selection and navigation proposals

#222: optional `enabledScenarioIds` is stored in the existing campaign settings JSON; absence means the rulebook nine, explicit empty means none. Unknown IDs do not create fake catalogue rows. Settings form serialization and dirty checks preserve the list, including unrelated edits. Main campaign settings now contains the complete searchable catalogue with checkbox controls, counts, Rulebook nine/Enable all/Clear selection and Show more; existing custom management link is relabelled. The legacy custom page links back to this embedded catalogue. New battles use the enabled core/library rows and enabled random pool, and reject a stale selected built-in if it was disabled. Existing battles are untouched. The old 25-row library truncation in the battle picker is removed. Custom scenarios remain separately available.

Validation: 35 focused settings/schema/library tests pass, typechecked build passes. `/tmp/stirheim-scenario-selection-mobile-qa.mjs` passes real 390px controls: enable The Pool, save/reload, edit starting gold without losing scenario choices, find only The Pool in enabled Library, disable/save and confirm it disappears. No overflow/page errors; disposable fixtures cleaned. No production push/deployment.

#223/#225 proposals are prepared at `/Users/tombrookes/.codex/visualizations/2026/09/09/01a085bc-6fb6-7c81-9c27-58b8215fc341/campaign-section-navigation.html`. The interactive draft offers A (desktop tabs / compact mobile section menu, recommended) and B (desktop sidebar / always-visible mobile section buttons). It shows both Settings and Overview, preserving the primary navigation. Settings groups: General, Rules & bans, Scenarios, Players, Management. Overview: Overview, Warbands, Battles, Map, Activity, Rules, with Settings separate. Await Tom’s design preference before changing navigation. Independent #23/#226/Pits work can continue while waiting. Reload the full visualize skill before updating the draft.


## #23 milestone — campaign settings activity (local only)

Campaign setting updates now produce one sentence per actual change. Nested house rules compare individual keys against documented defaults. Ban changes use catalogue names and add/remove verbs; unchanged bans and array reordering do not produce a full-list dump. Known dice, combat and first-spell values use their UI labels, half-price shield/helmet rules have standalone wording, and enabled scenarios use titles and account for the implicit core-nine default. Headlines show up to three actual changes with a count for any remainder; expanded details retain every change. This works on historical audit snapshots without rewriting history.

The actual user examples are covered independently: adding Familiar yields “Banned Familiar (item).”; the quoted before/after payload changes opposed parry, so it yields only that rule change and does not falsely claim Familiar was added. The shared activity component displays these complete sentences instead of wrapping them in “Changed … from … to …”. Other audit record types keep their existing rendering.

Validation: all 27 activity tests pass, typecheck/lint pass with existing warnings. `/tmp/stirheim-campaign-log-mobile-qa.mjs` creates a disposable local campaign, saves a Familiar ban through settings, opens the real campaign activity and expanded details, and verifies the named change without unchanged rule dumps at 390px (no overflow/page errors). No production deployment or migration. #23 remains open for warband/post-battle report payloads; #226 provenance and the Pits prompt also remain open.

Next: add semantic formatting for `match_reports` rows, retaining actual XP/injury/exploration/result information and original/replacement dice where present, instead of the raw `applied` patch, revision and timestamps. Review grouping carefully: events are grouped by actor/warband/reason within three seconds, not a guaranteed database transaction ID, so do not blanket-hide adjacent warrior changes and accidentally suppress an independent action. Menu choice #223/#225 remains pending; continue independent log/Pits work.


## #23 milestone — readable battle-report history (local only)

The shared campaign/warband history now renders match reports as named XP awards, casualties, injury results, exploration dice/rewards, veteran experience, status, notes and recorded adjustments. Injury effects remain in an optional Effect details disclosure. Internal application patches, revision counters and timestamps are omitted. Amendments show removed warrior entries and cleared values; later approval updates do not repeat the complete report. Adjacent warrior audit rows remain intact because time-based grouping is not a reliable transaction boundary.

Validation: 32 activity/report formatter tests and typecheck pass. `/tmp/stirheim-report-log-mobile-qa.mjs` files a real disposable local report, opens its actual warband history, and verifies named XP/exploration without patch dumps at 390px. The first script expected a nonexistent History button; corrected to the existing section, then passed. No production changes. #23 remains open pending the broader batch review; #226 still needs capture of injury reset provenance, which the old reset function deletes.


## #226 milestone — injury-roll replacement history (local only)

Hero/Persona D66 entry now records app versus manually entered tabletop source. Restarting the injury sequence asks for a reason and archives that attempt, including follow-up/count/Medicine Chest details, instead of deleting it. Repeated replacements generate ordered adjustments; a final explicit no-roll decision is also retained. Ordinary manual entry needs no override reason. Missing source on old drafts/records stays unknown; optional fields avoid invalidating existing drafts. This history is included in report review, the saved injury JSON/schema, expanded reports and readable activity. Other uses of the shared injury card retain their existing reset behaviour and do not promise report provenance they do not save.

Validation: 80 focused injury/model/history tests and typecheck pass. `/tmp/stirheim-injury-history-mobile-qa.mjs` uses the real app roller, replaces its result with tabletop D66 65 with a reason, reloads the draft, files/applies the report, reloads/expands the saved report and opens warband history. The database and both displays retain original/source/replacement/reason at 390px; fixtures cleaned. Initial QA selectors expected checkbox instead of switch and an already-expanded report; fixed the script to match the actual controls. No production changes.

Next: make Sold to the Pits follow-up explicit during the injury step and after report filing/approval, linking the actual selected warrior to the existing fight resolution. Verify win/loss and pending/applied boundaries. The older Amphitheatre auto-win gap also remains open. #223/#225 menu design choice is still pending.
