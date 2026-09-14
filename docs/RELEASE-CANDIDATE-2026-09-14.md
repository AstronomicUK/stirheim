# Release candidate 2026.09.14.1

**Deployed on 14 September 2026 with Tom’s explicit approval.** Implementation stopped at ten completed items.

Application source: `c0381aa38790fea0a31d78d3c8b2fd84ff0477f4`.

Completed tracker scope: **#15, #181, #191, #70, #161, #76, #29, #142, #136, #138**. #15 is a verified scope closure; the other fixes and their acceptance evidence are described in `OVERNIGHT-PRIORITY-BUGS-2026-09-13.md`. The remaining ten umbrella tickets stay open, including those with completed component fixes in this release.

## Validation

- 2,683 application tests passed; the 364 database-gated tests were run separately and all passed.
- Production build and TypeScript passed. Lint has no errors; nine documented warnings remain.
- All 135 migration files through migration 141 replayed in filename order in a separate empty database. The temporary database was removed.
- Full database sweep passed after correcting the undeployed tribe UPDATE scope and preserving campaign-GM withdrawal permissions.
- Mobile end-to-end Leadership and Eye/Fate reports verified at 390px, including refresh, app dice edits, saved Mark and Spawn roster outcome. Earlier checkpoint evidence covers the remaining batch. Disposable records/tabs removed.
- Release build has 119 files, version 2026.09.14.1 and the configured production database URL; no local database URL. SHA-256 manifest: `/tmp/stirheim-ten-release-manifest.json`.
- Application and migration changes are committed. Historical mixed audit/tracker/design edits remain unstaged intentionally.

## On deployment approval

1. Recheck the linked production migration history and deployment configuration read-only. Last verified production baseline was migration 136 and app release 2026.09.13.2.
2. Apply only pending migrations 137–141 in order. Do not replay local migration history into production or use a reset. Local manual function repairs are incorporated in the committed migrations; they are not separate production steps.
3. Preserve the credit-saving release process: verify automatic builds are paused, push the completed commits once, and publish one already-built production artifact. Rebuild only if source/configuration has changed since the manifest.
4. Verify the deployed files and representative live flows before publishing the release and changing the ten public issues to Implemented. Use `RELEASE-2026-09-14.1.json` for the prepared release copy and IDs; preserve user reports, notes, subscriptions and attribution. Do not mark the other ten complete.
5. Record the deployment ID, source revision, migration verification and live checks here. Public confirmation remains distinct from local implementation.

## Deployment completed — 14 September 2026

- Pushed release source `58879987e65971e74dc46605b3fdb4aec4ce1737` to main.
- One prebuilt Netlify production deployment: `6aa7befc0524c12ca47fe12a`; https://stirheim.com. Automatic builds remain paused.
- Applied migrations 137–141; subsequent linked dry run reports the remote database up to date.
- All 119 live files match the tested SHA-256 manifest. Public tracker and changelog load successfully in a fresh browser tab; no authenticated production gameplay records were changed for testing.
- Published release `d439dcb2-4f4d-4799-ae9a-83efd80ae745`, version 2026.09.14.1. Verified the public changelog displays its notes and all ten linked reports. Ten reports are Implemented; the other ten remain open.
