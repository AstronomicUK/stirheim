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
