# Combined release 2026.09.13.2

Deployed to https://stirheim.com on 13 September 2026 with Tom's explicit approval.

- Application source: `50b5013b8e52842247a8fd0e5176b70a409f3ffa`.
- Netlify deployment: `6aa6fa66423cb616075b5536`.
- Four local application commits pushed together; one manual no-build deployment. Automatic Netlify builds remain paused.
- Production migrations 131–136 applied successfully. Linked dry run reports no pending migrations.
- All 118 served files match the verified production build byte-for-byte. Build points to production Supabase, not localhost.
- Public version `2026.09.13.2` published, with fourteen newly implemented tracker entries: #102, #103, #120, #124, #126, #127, #129, #131, #133, #134, #145, #157, #158, #159.
- #132 remains working on; notes describe its completed Restless Dead clauses. #176 was already implemented and its verification note was added without claiming another new fix.
- Public changelog verified in the live browser.
- Local validation: 2,500 app tests, 349 database tests, build and mobile saved-outcome checks passed. All 130 migration files replayed in an isolated database.

The previous local-only notes in the four batch records describe historical checkpoints; these batches are now deployed. Unrelated dirty audit/design documents were preserved.

Hosted CI exposed pre-existing eager app-client initialisation in two skipped integration suites. Test-only client isolation is included in the release-record commit, without changing application code or requiring another Netlify deployment. The affected 15 integration cases remain enabled for local database runs.
