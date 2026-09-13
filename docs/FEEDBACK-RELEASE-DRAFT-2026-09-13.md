# Feedback, capture and ammunition release — published

Published as version 2026.09.13 on 13 September 2026 after deployment 6aa6baefe0de31122a1ee7f4. Tracker import and AstronomicUK maintainer setup are complete; #230/#231 are implemented and #229 remains working on. The handling steps below are retained as the release checklist.

Tom approved the narrower main release on 13 September; see `MAIN-RELEASE-SCOPE-2026-09-13.md`. Unfinished specialist rules move to the follow-up. The intermediate reload rule now follows Tom’s approved alternating two-barrel/one-barrel cycle.

## Proposed public changelog

### Report problems and follow improvements

Stirheim now has separate bug and improvement boards, with priorities, progress stages and detailed notes. Report something from the board, follow an existing request, and check your private inbox for updates when a followed issue is fixed. The public changelog records what each release changes.

### Agree what happens to captured warriors

Eligible Necromancers receive Awakening opportunities, with an agreed recipient recorded when several warbands qualify. Capture outcomes show both players what will change before applying them, including money, equipment and the returning or recruited warrior. Corrections keep a readable history.

Pirate recruitment and supported specialist capture rules now connect to their battle reports. Slaaneshi Man-Catchers track the particular held model, release and end-of-battle confirmation. The Court can convert a captured Hero or henchman into a Wretch. Engines of Chaos track prisoners, capacity, journeys, keys and confirmed rescues; an escaped named prisoner returns through player agreement, without reclaiming confiscated equipment. Completed rescue history remains available after an empty Engine is retired.

### See which chambers are ready

The battle sheet shows the state of each supported physical firearm, with a compact version in View Rosters. Shots resolve sequentially, and recorded ammunition use can be corrected. Supported printed weapon and skill differences are kept separate. Campaigns can choose no extra skill effect, the approved alternating two-barrel/one-barrel firing cycle, or a full reload during a non-firing Shooting phase. The alternating rule does not require skipping a turn’s shooting.

## Release handling

- Verify the final source checkpoint and outstanding changes before building. Do not sweep unrelated historical tracker/audit modifications into a release commit.
- Apply the verified migrations after the currently deployed 087, in filename order. Local checks currently cover through 130; verify the final list at release time.
- Run the historical feedback import dry run. The reviewed manifest accounts for all 231 previous IDs; excluded internal entries remain excluded. Import only after the backend is ready, using the existing guarded import script.
- Set the existing AstronomicUK account as maintainer through the prepared exact-username setup; do not create or guess a new account.
- Deploy the complete frontend once, then verify sign-in, public boards, mobile battle/roster views and private notifications on the actual release.
- Publish the changelog only after deployment succeeds. Mark #230 and #231 implemented against that release. Keep #229 working on for the unfinished specialist follow-up. Do not send subscribers a notification claiming those umbrella entries are fully fixed.

## Current evidence

Final local candidate: **2,435 application tests across 205 files and 323 backend tests across 56 files pass**. All **124 migration files through 130** install in order in an isolated database. TypeScript and the production build pass. Both mobile battle modes complete the approved 2/1/2/1 firing cycle with persistent miniature counters and no non-firing reload action. Full reload, ordinary reload limits, skill eligibility, misfires and correction checks pass. Existing large-bundle warnings remain.

## Decisions held for Tom

See MORNING-RULINGS-2026-09-13.md. The double-barrel intermediate rule is answered and implemented. Deferred follow-up questions include ambiguous Engine rescue aftermath, full Engine capacity outcomes, Cavalcade Thrall overflow, Ogre meal-income duration, multi-fighter Pit reward allocation and Hired Sword eligibility for Awakening. These are not silently decided by this release draft.
