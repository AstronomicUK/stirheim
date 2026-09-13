# Slaaneshi Man-Catcher — remaining #229 extension

The source at reference/rules/warbands/grade-1c.md:915–917 gives an ongoing hold, not an immediate OOA capture. `src/rules/resolve/slaaneshiLock.ts` is a tested lifecycle foundation only. It is not connected to combat, recovery or reports yet. Do not mark the rule complete.

## Required complete integration

- Actual Man-Catcher unsaved wound: knock down rather than roll injury; exclude Large targets and steeds. Apply the same consequence to both the calculator and probability engine. Do not confuse a mounted rider with the steed itself.
- Store the source event and the particular target model, including a henchman group member. Existing ordinary condition maps use group IDs; treating one captured member as the entire group would be wrong.
- The hold blocks normal recovery and moving away. Magic may release it; the wielder can drag only while not engaged with any other model. These position/contact facts need explicit table confirmation.
- Weapon switch, the melee ending, or removal of either participant ends the hold; releasing it does not stand the victim up immediately. Recovery remains normal after release. Preserve correction history and reversals.
- Before finishing, confirm every remaining hold or record its release. A confirmed hold becomes Captured 61 even for a henchman. It is not an OOA kill and awards no kill XP.
- Reuse two-player captive consent, exact model kit allocation, source report dependencies and reversal guards. A source hold cannot be corrected after an applied capture without reversing/withdrawing the dependent result.
- Include app-calculated and table-calculated paths and a clear live condition display for both players. Do not expose only a combat flag that lacks these later stages.

This is independent of the Engine of Chaos/ordinary Man-catcher extension delegated to Claude; the two weapons have different rules.

## 13 September work in progress

The shared attack input now supports an explicit `slaaneshiLock` flag. The probability engine turns an unsaved wound into Knocked Down at any remaining Wounds, without injury/OOA outcomes; the live roller waits for every save and then stops so the particular held model can be recorded before further combat. Six focused tests pass, plus the existing 79 roller tests. An initial insertion in the armour-save branch was caught by tests and moved to the final unsaved-wound boundary. The weapon builder now enables this flag locally. Migrations 116/117 connect persisted holds, per-model recovery, explicit release, battle-end confirmation and the report capture bridge. The actual mobile roller-to-henchman-capture flow passes, including exact equipment and no OOA/kill XP. This remains unfinished integration: companion animals, further correction cases and full regression still need completion.

### 13 September: connected local flow

The actual mobile attack selects a particular henchman (model 2), records an unsaved wound as a hold, confirms the hold at battle end, and shows the report without injury dice or an out-of-action tally. Submission creates exactly one captive with that model’s allocated equipment. The disposable browser fixture passes and cleans up. Weapon switching now requires explicit release before another attack. A separate tabletop hold form is under verification; it can avoid adding wounds already entered on the sheet. No production deployment.
