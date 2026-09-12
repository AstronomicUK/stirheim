# Engine of Chaos capture extension — #229 / #95

This is the next specialist extension, not a completed feature or a release claim. Core Awakening, Captured, Pirates and Subjugator work is recorded in FEEDBACK-BATCH-2026-09-12.md. Codex owns visual design and integration; Claude may implement a bounded backend task after the 00:30 Europe/London usage reset.

## Source and established requirements

Read `reference/rules/02-weapons-armour-equipment.md:481` (Man-catcher) and `:2284` (Engine of Chaos), repeated in `reference/rules/warbands/grade-1c.md:443`.

- Man-catcher OOA replaces injury with capture only while the warband has an available Engine. Large targets and animals are excluded. This differs from Subjugator, which permits animals and does not require the Thingcatcher to cause the blow.
- Each Engine holds at most six places. A Large captive uses two places. The reward table counts captives, not occupied places: three Large captives use six places but are still three captives.
- A Chaos Dwarf drives the Engine. Only the driver and prisoners ride it.
- Captured-result and Man-catcher prisoners lose their equipment to the Chaos Dwarf warband. Return/rescue must not duplicate that confiscated equipment.
- Exploration creates prisoners from core Straggler (one), Prisoners (D3), and the listed Empire in Flames locations. These anonymous prisoners are temporary campaign records, never a new permanent player warband.
- Destroying an Engine or using the prison keys can free prisoners. Keys come from taking a Gaoler OOA and may pass again if the holder falls. Physical contact, routing before rescue and escape to the table edge require explicit table facts; do not infer positions the app does not track.
- Dispatch to the Dark Lands removes chosen captives permanently. The Engine and one escort Hero miss the next battle. Other available Engines still permit capture.
- Roll the reward only after the escort returns: 1–3 captives gives the leader +1 XP; 4–5 gives D3 XP allocated among Heroes; 6 gives 2D3 XP among Heroes plus D6 × 5 gc. Record app rolls and later edits separately, and queue advances normally.

## Existing parts to reuse

`captive_cases`/`captive_proposals` provide owner notifications, two-player consent, exact equipment snapshots, atomic roster changes, stale-state checks and reversal. `trade_wagon_captures` is a useful report-dependency reference, but it is Merchant-specific and must not be repurposed as an Engine. `engine_of_chaos` already exists in the item catalogue. No general persistent Engine inventory or prison ledger currently exists.

`src/rules/resolve/engineOfChaos.ts` now defines capture eligibility, capacity and reward calculations. It is a tested rule foundation only; it is not yet connected to inventory, reports or screens.

## First bounded backend task after reset

Propose and implement the persistent identity/custody layer with integration tests before adding capture writers:

1. Represent each physical Engine distinctly, including multiple copies bought in one item row. Prevent selling/removing an occupied or travelling Engine without resolving that state. Do not silently reuse an occupied Engine identity when an item quantity changes.
2. Link a named prisoner to an existing captive case and source report, or an anonymous prisoner to its exploration report. Preserve the victim owner, profile, original item rows, Large status and confiscation record.
3. Track custody separately from a final captive outcome. Imprisonment is not release, and must not make a still-held Hero reappear in the legacy Captured form. A report cannot be withdrawn after its prisoner or equipment affects another roster without reversing those consequences.
4. Design one atomic placement/kit-confiscation operation under existing consent conventions, with six-place capacity checked under lock. Do not leave half-transferred equipment or allow two concurrent placements to exceed capacity.
5. Keep rescue, dispatch/return/reward and combat/exploration writers as explicit follow-on tasks. Send the exact client contract before Codex builds the UI. Do not change shared UI or broaden the trade-wagon implementation.

## Do not invent these answers

The source does not spell out the fallback when every Engine is full, nor explicitly settle whether an Engine prisoner may also use ordinary ransom/exchange/sale. Preserve these as questions for Tom rather than silently selecting a rule. Existing approved player overrides must remain possible with a reason. These uncertainties do not prevent building inventory identity, capacity, immutable snapshots and dependency protection.

UI direction: an Engine card on the warband screen, compact occupancy indication, named prisoner rows and clearly separated present/away states. Use the established parchment/brass design. Codex will produce any visual overhaul; Claude can do basic form plumbing after agreeing ownership.
