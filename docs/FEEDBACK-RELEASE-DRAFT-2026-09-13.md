# Next feedback, capture and ammunition release — draft

Not deployed or published. This document prepares one coherent release; it does not authorise a push or mark the whole capture/reloading scope complete.

## Proposed public changelog

### Report problems and follow improvements

Stirheim now has separate bug and improvement boards, with priorities, progress stages and detailed notes. Report something from the board, follow an existing request, and check your private inbox for updates when a followed issue is fixed. The public changelog records what each release changes.

### Agree what happens to captured warriors

Eligible Necromancers receive Awakening opportunities, with an agreed recipient recorded when several warbands qualify. Capture outcomes show both players what will change before applying them, including money, equipment and the returning or recruited warrior. Corrections keep a readable history.

Pirate recruitment and supported specialist capture rules now connect to their battle reports. Slaaneshi Man-Catchers track the particular held model, release and end-of-battle confirmation. The Court can convert a captured Hero or henchman into a Wretch. Engines of Chaos track prisoners, capacity, journeys, keys and confirmed rescues; an escaped named prisoner returns through player agreement, without reclaiming confiscated equipment. Completed rescue history remains available after an empty Engine is retired.

### See which chambers are ready

The battle sheet shows the state of each supported physical firearm, with a compact version in View Rosters. Shots resolve sequentially, and recorded ammunition use can be corrected. Supported printed weapon and skill differences are kept separate. Additional Hunter/Pistolier double-barrel house-rule choices are still being discussed.

## Release handling

- Verify the final source checkpoint and outstanding changes before building. Do not sweep unrelated historical tracker/audit modifications into a release commit.
- Apply the verified migrations after the currently deployed 087, in filename order. Local checks currently cover through 127; verify the final list at release time.
- Run the historical feedback import dry run. The reviewed manifest accounts for all 231 previous IDs; excluded internal entries remain excluded. Import only after the backend is ready, using the existing guarded import script.
- Set the existing AstronomicUK account as maintainer through the prepared exact-username setup; do not create or guess a new account.
- Deploy the complete frontend once, then verify sign-in, public boards, mobile battle/roster views and private notifications on the actual release.
- Publish the changelog only after deployment succeeds. Mark #230 implemented against that release. Keep #229 and #231 working on while the listed specialist rules and deferred house rules remain open. Do not send subscribers a notification claiming those umbrella entries are fully fixed.

## Current evidence

2,421 ordinary tests pass across 204 files. The complete API run through 127 passes all 322 checks across 56 files. All 121 migration files install in order in an isolated database. TypeScript and the production build pass. Mobile capture/conversion, shared Engine rescue, agreed return, reversal and retired-history checks pass. Large-bundle warnings remain; invalid repeated list-marker CSS has been corrected.

## Decisions held for Tom

See MORNING-RULINGS-2026-09-13.md. In particular: double-barrel Hunter/Pistolier house rules, ambiguous Engine rescue aftermath, full Engine capacity outcomes, Cavalcade Thrall overflow, Ogre meal-income duration, multi-fighter Pit reward allocation and Hired Sword eligibility for Awakening. These are not silently decided by this release draft.
