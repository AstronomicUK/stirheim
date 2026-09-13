# Main release — scope approved by Tom

Tom approved separating unfinished specialist capture extensions from the main release on 13 September. Continue the main release to readiness; Claude remains stopped to preserve usage. This scope decision is not itself deployment authorization.

## Finish for this release

- #230: public bug/improvement boards, report submission, readable details, maintainer review, subscriptions, private notifications and public changelog. At release, import the reviewed manifest and configure the verified AstronomicUK account.
- #229 core: ordinary Hero Awakening with agreed recipient, core two-player capture outcomes, exact kit, readable history and correction dependencies. Existing tested specialist flows may ship, but do not describe the whole capture umbrella as complete.
- #231: firearm chamber displays, mini View Rosters display, app/player calculation parity and corrections, plus the requested Hunter/Pistolier double-barrel house-rule choices. Tom approved the screenshot’s alternating 2/1/2/1 firing cycle for the intermediate option.
- Final build, focused regressions for remaining changes, migration-order check at the final source revision, release/import preparation and production verification after authorized deployment.

## Follow-up; no longer blocks the main release

- Sacrificial Ritual: durable shared agreement, consumption, casting integration, D3 XP and dependency-aware correction. Its selection/calculation foundations are not a completed feature.
- Ogre Gluttony and Pit Fighters' bespoke outcomes.
- Ambiguous Engine aftermath, full-capacity fallback, competing ransom/exchange outcomes and destruction's inventory consequences.
- Further Engine temporary-combatant/animal-key/new-capture rescue extensions.
- Cavalcade overflow and Court anonymous exploration conversions requiring source decisions.
- Hired Sword Awakening eligibility: keep the verified ordinary-Hero path unchanged pending a ruling; no implied inclusion or rejection.

These stay visible under #229 and its linked scope/rulings documents. No further specialist implementation in this release unless a regression affects an included flow. No automatic ruling is inferred from approving this split. Keep #229 working on; use the changelog to describe the specific delivered flows.

## Reload implementation checkpoint

Schema/defaults, settings change detection and plain-English campaign activity now support the three requested policy values. Existing campaigns default to `none`; local migration 130 adds that default for new campaigns without editing existing rows. Full reload is connected in both app-calculated and tabletop controls, using the appropriate Hunter/Pistolier skill and the same persistent chamber ledger. Both actual mobile browser journeys pass, including refresh and mini-roster counts. Skill eligibility and bonus chamber/correction checks pass, along with settings round trips.

**Updated after Tom’s screenshot:** The intermediate option now uses the approved 2/1/2/1 firing cycle, with no required non-firing phase. Each actual shot saves the rule snapshot, so refresh and mini-roster counts agree. Normal reload guards remain for ordinary weapons; double-pistol selection now consults chamber availability rather than its old whole-gun timer. The four-turn mobile app-calculated journey passes; remaining release checks are being completed. Specialist questions do not block this release.

## Ready for deployment — local checks complete

- 2,435 application tests / 205 files; 323 backend tests / 56 files pass.
- TypeScript and production build pass; existing large-bundle warnings remain.
- All 124 migrations through 130 replay in order in an isolated database.
- Both actual mobile battle modes complete 2/1/2/1 shots across refresh, with matching mini-roster counters and no non-firing reload record. Full reload checks also pass in both modes.
- The actual mobile campaign form saves and reopens all three policies without overflow or page errors. Older campaigns default to no effect. Reviewed import dry-run accounts for 231 IDs, includes 221 and excludes 10; no remote write.
- Production deployment, verified-account maintainer setup, historical import, release publication and live checks remain release-time actions. No push/deploy performed. Publish #230/#231 completion only after release; #229 stays in progress for its follow-up.

## Production deployment — 13 September

User explicitly approved database migrations 088–130 and deployment. All 43 pending migrations applied successfully; the subsequent remote dry run reports no pending migrations. Source `e115886` pushed to main and deployed once as Netlify `6aa6baefe0de31122a1ee7f4`, with automatic builds paused. Production build uses the live Supabase project.

Live read-only checks pass at 390px and 1280px: sign-in, protected-route redirect, public tracker and changelog load without page errors or horizontal overflow. All five HTML entry assets match the local build bytes. Authenticated gameplay acceptance remains the previously completed disposable local tests; no live player records were changed by smoke tests.

**Setup still pending:** automatic approval review separately rejected production service-role use for the historical import and AstronomicUK maintainer grant, requesting explicit authorization for these privileged mutations. No historical reports were imported, no maintainer grant made, and no release published. Request authorization to complete those actions, publish version 2026.09.13 and mark #230/#231 implemented while keeping #229 working on. Do not redeploy the frontend for this database-only setup.
