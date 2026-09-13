# Sacrificial Ritual — integration checkpoint

Part of #229, discovered in Claude's final handover. Not complete or deployed.

Source: `reference/rules/03-campaigns-magic-optional-rules.md:3117–3123`.

## Implemented foundations

- `planSacrificialRitual` keeps the first captive separate from extras, validates Engine custody, contact and mortal eligibility confirmations, identifies each affected warband and produces a readable agreement preview. It changes no roster or custody record.
- Large captives occupy two Engine places but count as one sacrifice and one Difficulty reduction.
- Casting accepts a validated count of additional sacrifices for this spell only. It lowers actual Difficulty (including difficulty-based dispels), keeps Sorcery separate, and records why the Difficulty changed. No UI supplies this value until a durable custody transaction confirms consumption.
- Selection, stale/foreign custody, duplicate selection, affected-player agreement and casting/dispels have regression coverage.

## Decision pending

Tom has been asked whether the first captive is consumed before the roll even on failure, or only on successful casting. Additional sacrifices explicitly happen before rolling. Do not wire automatic permanent removal until answered.

## Remaining implementation

1. Durable ritual ID tied to match, own turn, caster and one present Engine. Confirm caster eligibility/contact and review selected named captives; anonymous captives require the holder's agreement only. Notify affected owners through their existing private inbox. Require all affected player agreements before the cast can proceed.
2. Acquire match lock before stable roster/custody locks, matching rescue writers. Revalidate held state and pending proposals, reject rescue/dispatch conflicts, and preserve original source/kit snapshots. The first-captive timing follows Tom's ruling; additional sacrifices precede the roll.
3. Apply named roster removal once, with existing captive guards and case history; henchmen/companions already removed by their capture report must not be removed a second time. Confiscated kit stays put. Record anonymous consumption and pin its exploration report.
4. Connect CastTab to the durable ritual. Do not treat the ordinary `sacrifice` outcome (+1 leader XP) or an Engine journey as this spell. Preserve normal casting-roll provenance, rerolls, dispels and turn restrictions.
5. Record the source-defined D3 Sorcerer XP with original/edited dice and exact advancement thresholds. Verify the appropriate award point against the chosen timing, without multiplying XP by captive count or Large places.
6. Dependency-aware correction: undo dependent XP/advances and casting consequences before restoring selected captives. Restoration must not create duplicate roster models, exceed custody capacity or silently overwrite later roster edits. Keep all agreements, consumption and corrections in readable history.
7. Verify competing rescue/dispatch, repeated acceptance, failed/dispelled casts, remote owners, anonymous and named mixed selections, Large captives, rerolls, refresh mid-flow, report withdrawal and mobile casting.

The batch cannot claim full Sacrificial Ritual support from the foundations above.
