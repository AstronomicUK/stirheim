# Next five priorities — local combined batch

Implemented locally on 13 September 2026. **Do not push or deploy**: Tom requested a larger combined release. Previous local batch is commit `78bb683` (#102/#103/#157, migration 131). This batch adds migrations 132–133. Production has not been changed.

| Tracker | Completed scope |
| --- | --- |
| #126 | Flesh Constructs survive a 1–2 injury result with a recorded D6×5 gc repair debt. Unpaid models sit out. The roster offers payment, abandonment and a logged undo. Payment is atomic and retry-safe; a later advancement/report prevents stale undo. Report withdrawal is blocked after payment until that payment is undone. |
| #127 | Both Restless Dead Liche variants can accept a non-fatal serious injury or sacrifice one permanent Wound when above W1. Killed uses D3 Wounds and kills at zero. Choices, profile changes and dice history survive refresh and appear in the report. Synthetic scenario deaths/captures do not incorrectly trigger Eternal. |
| #129 | Shared mutation/Blessing choices at creation and later hero/henchman hire. Mandatory Mutant/Tainted choices; one mutation per individually recruited Moulder Rat Ogre; Court maximum one; repeated mutations and first/subsequent prices; profile changes and gold applied together. Twistkin and Marauder/Beastman Mutant advances require the associated purchase; Marauder Mutant remains repeatable. Starting skills, spells, flags and controller choices now save in the creation transaction. |
| #120 | Cleric/Champion/Thief and Huntsman/Templar shared slots; unique Scarecrow controllers and absence handling; creation War Beast slots and handler checks; individual Rat Ogres; Swivel Gunner and Relic bearer group splitting without lost XP/duplicated kit; Thrall dismissal prohibition; one-ever Reaver hero purchases; Warmonger skill restriction and temporary Peasants; Night Goblin five-model initial Mob and ten-gold replacements, counting once for capacity. |
| #131 | Reaver fixed equipment, included Outrider mounts, first Sharp Stuff, optional paid Ostermark Wardog and Dame Ancient Armour. Netter has three battle-only nets, a remaining counter and a reasoned correction. Included kit is free once; additional copies cost gold. Ancient Armour cannot be sold/transferred, survives robbery, permits casting and grants its 5+ save against non-magical attacks. |

## Sources and boundaries

Sources are the preserved local scrape in `reference/rules/warbands`: core-and-grade-1a (Possessed/Carnival), grade-1c (Court, Reavers, Marauders, Battle Monks, Night Goblins and original Restless Dead), restless-dead-variant, grade-2a-part1 (Flesh Construct), grade-2a-part2 (Moulder, Order of the Mare), and the imported Outrider/Ostermark template clauses. The older audit wording is not treated as overriding the printed source.

- Ostermark says the Captain **may** have a Wardog; it does not grant a free dog. The option costs the listed 25 gc.
- Twistkin half-price purchases round fractional gold up, consistent with the app's purchase convention.
- Existing mandatory bow and equipment exclusion warnings remain in place; deliberate table overrides remain available.
- Starting skill selections such as the Trapper's option remain under #59. Other upgrade choices (Jungle Shadow wizard, Outrider warhorse, tribe/Mark choices, etc.) remain under #130. The fixed kit helper supports the Shadow's armour exception when that future wizard choice is supplied.
- Net attacks are resolved at the table; the Netter control records expenditure and corrections. It does not turn free battle-only nets into tradable inventory.
- Warmonger creates battle-sheet Peasants only, never permanent roster rows. The saved battle restores them; a fresh battle does not inherit them.
- Existing warriors are not automatically given retrospective gifts or equipment; these grants occur only on creation/hire. Existing Scarecrows can have their controller assigned in the group editor.
- No full audit of every mutation's combat text is implied by #129: this closes purchase, eligibility, cost and permanent profile application.

## Verification

- Full ordinary suite: **2,468 passed**, with 334 API tests skipped in that invocation.
- Full local database suite: **334 passed across 60 files**, including new creation transactions, repair race/retry/undo and report withdrawal dependencies.
- Subsequent targeted post-battle and battle-entitlement run: **337 passed** after checking mixed injury handling and moving the Netter helper.
- Additional Ancient Armour engine test passed for ordinary versus magical attacks.
- Production build and TypeScript passed. Lint: no errors; eight pre-existing warnings outside this batch.
- All **127 migration files**, through 133, replayed in filename order against a separate disposable database. The shared local database was not reset. Local ledger records 132–133.
- Authenticated Playwright verification at 390px: repair/pay/refresh/undo and exact treasury values; Eternal selection persisted after refresh; repeated Cloven Hoofs hire charged 145 gc and saved M6. Desktop roster verified. No page errors or horizontal mobile overflow. Harness: `docs/audits/2026-09-13-roster/browser.mjs`; disposable fixtures removed in `finally`.

## Eventual release

Apply migrations 131, 132 and 133 in order with the combined release. Update public tracker/release notes only when releasing; do not publish an implemented/confirmed claim for features users cannot access yet. Retain all unrelated historical audit edits in the workspace.
