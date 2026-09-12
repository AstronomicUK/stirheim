# Priority 1–5 scope recheck — 12 September 2026

**Conclusion: the entire batch is not yet release-ready.** This supersedes the readiness claim in `CORE-RULEBOOK-RELEASE-2026-09-12.md` and the final reconciliation in Claude’s validation report. No application source was changed during this audit and nothing has been deployed.

## Why the previous reports conflicted

The recovered chat estimate immediately before the long implementation turn was **14–22 combined working hours / 8–14 elapsed hours with both agents**. The next substantive turn lasted about 62 minutes and ended with an unconditional readiness claim. Neither estimate was backed by a completed acceptance matrix. Git confirms real work during that hour (poison UI, pistol shooting, protections, relic controls, Bitter Enmity, paired blades, Sign of Sigmar, Tail Fighting, rifle reload and the migration repair), but passing tests did not prove that every original requirement was complete. The earlier estimate was poorly grounded; the readiness claim also overlooked real gaps. Neither should be defended as reliable forecasting.

## Acceptance matrix

“Implemented / evidence recorded” means the cited code and checkpoint support that clause; it is not a new claim that every screen was rerun during this audit. Supplement remainders are not full tracker closures.

| Priority / tracker IDs | Current assessment | Evidence or actual remaining work |
|---|---|---|
| P1 #28, #29 | Core implementation and native-caster evidence recorded | Empty-spell tests for five core native types; native builder browser checks documented. Existing spell-less roster editor and Eshin browser acceptance still need verification (peer clarified that the earlier editor claim overstated builder evidence). Supplement detection remains outside core scope. |
| P1 #32, #76 | Core target UI implemented | All 30 spell targets and area affected-model selection. Five-lore browser table exists. Full spell-effect automation was never this target-selection requirement. |
| P1 #85, #209 | Implemented / evidence recorded | Responsive caster/target boxes and effective/base Difficulty. |
| P1 #186 and P1 completion check | Implementation tested; browser acceptance incomplete | The five-lore checkpoint explicitly says rerolls were not exercised live. Verify eligible reroll controls, used-die blocking, unused sources on later casts, result recording and reload/turn transition through the application. Success of Daemon Soul protection also lacks a browser example (unit-covered). |
| P2 #59 | Core reconciliation implemented / evidence recorded | Streetwise, Sign of Sigmar and Tail Fighting included; table movement is legitimately table-managed. |
| P2 #70 | Core individual handling exists; persistence acceptance incomplete | The general situation choices are transient React state, including “Frenzy has ended” and failed Fear. Frenzy ending is a battle-long fact; distinguish what resets intentionally at a turn boundary from what must survive reopening. Multi-model positional tests may remain explicit table actions. |
| P2 #73 | Shooting reload implemented; core melee pistol clause remains | Physical handgun/rifle/pistol shooting is covered. Core pistol/brace hand-to-hand attacks and once-per-combat use remain absent. #73 itself explicitly lists this clause; restore it to the remaining core checklist rather than presenting all remaining pistol work as supplementary. The historical reference to tracker #2 is wrong: current #2 is casting roll provenance. #69 also records melee pistol support. |
| P2 #156 | Calculation/advice tests pass; setup persistence gap confirmed | Selected defender weapons feed `kitWithSelectedWeapons`; charge/Strike First/Initiative cases have tests. On a disposable 390px mobile fixture, choose defender Dagger, reload/reopen Melee Attack: selection returns to Sword. Source: `FightTab.tsx` defenderChoice/choice/physicalSelection/toggles are local state. Persist the appropriate choices with physical identity and correct turn/combat lifetime. Full automatic orchestration of both players’ entire combat is not required by the original advice clause. Equal-Initiative ties currently instruct a table roll-off; state that boundary explicitly. |
| P2 #96 | Implemented / evidence recorded | Structured Bitter Enmity, original leader identity, combat reminder, report/withdrawal integration coverage. |
| P2 #161 | Core action implemented; correction coverage needs completing | Relic records first Leadership test and supports explained table-declaration correction. An erroneous Rout/Stupidity relic declaration has no corresponding ledger correction: the only leadershipTests correction helper excludes those kinds. Changing a Stupidity outcome does not restore the first-test ledger. Add an explicit reasoned correction without erasing other valid tests. Banner provenance was traced to Annual 2002, so excluding that supplement from core is justified. |
| P3 #139 | Main core actions implemented / evidence recorded | Physical poison, herbs, water, garlic and addiction stock paths, including stack/last-copy and report withdrawal evidence. This does not close all supplementary devices/ammunition. |
| P3 #140 | Core effects implemented; explicit override missing | `sheet.ts:setItemRoll` refuses replacement after the first roll. Its comment explicitly says a reasoned correction is not built. `FightTab.tsx` displays the stored Shade bonus without a correction control. Add a recorded correction preserving original app roll, changed value/reason and future effect; do not silently rewrite old attacks. |
| P3 #160 | Main core actions implemented / evidence recorded | Water/herbs/garlic and Tail Fighting have local action evidence. Complete cross-cutting saved-choice/correction checks above before describing all P3 acceptance as complete. |
| P4 #167, #193, #195, #200 core | Complete for the agreed core scope | Source chart/roster evidence and approved floors/concurrent recovery; core save sequence inspected. Supplement Ward policy is legitimately separate. No new ruling needed. |
| P5 #24, #30, #41, #46, #53 | Implemented / evidence recorded | Approved dice/layout, independent ranged default, affordability, empty logs and contextual removal. #53 explicitly permits confirmation OR undo; confirmation meets it. |
| P5 #92, #202, #203, #206, #210 | Implemented / evidence recorded | Campaign picker, singular die, wrapping badges, correct warband context and eligibility labels. No new outstanding defect established in this audit. Recorded evidence is predominantly mobile; final acceptance should explicitly check the relevant desktop paths too. |

## Executable audit evidence

- `npx vitest run` for odds, casting resolver and CastTab: **139 passed**, 12 September at approximately 15:45. Those tests pass despite the acceptance gaps above.
- `/tmp/stirheim-scope-reload-audit.mjs`: actual local mobile selection **Sword → Dagger → reload → Sword**, reproduced. Disposable campaign, match and warbands cleaned in `finally`.
- An initial fixture chose the second identical Sword option; the displayed selection stayed at the first Sword. The final reproduction deliberately uses distinct Dagger/Sword profiles, isolating persistence from that duplicate-option behaviour.
- Previous full-suite evidence remains valid for the existing implementation: 2,265 ordinary tests and 216 local database tests, build/typecheck/lint. It is not a substitute for the missing acceptance checks.

## Remaining work and estimate

1. Restore core pistol/brace close-combat profiles and once-per-combat usage to the implementation checklist; verify shared odds/roller, physical copies, correction and combat boundary. **2–4 combined working hours.**
2. Persist relevant weapon/situation choices with correct identity and lifetime; verify reopening, turn changes and both views. **1–2 hours.**
3. Add the explained Crimson Shade correction and close Relic correction verification. **1–2 hours.**
4. Finish live casting reroll/protection acceptance, address any reproduced defects, then rerun affected integration/release checks and reconcile documentation. **1–2 hours.**

Provisional total: **5–10 combined working hours**, not a minimum or a delivery guarantee. Shared combat files limit parallelism; do not automatically halve this into elapsed time. This estimate is grounded in named outstanding tasks, but can change if the missing browser checks reveal additional defects. The earlier 14–22-hour estimate is withdrawn, not magically “completed”.

No user ruling is needed for the known implementation gaps. No production release should be requested until these are closed or the user explicitly chooses a smaller release. Independent peer review received as bus message `18aeba2e`: corroborates the unsaved Frenzy/Fear gap and missing live reroll evidence, and distinguishes native builder evidence from the unverified existing-caster editor path. It also identifies the Bitter Enmity combat note as unit-tested, not browser-verified. Include those two small flows in final acceptance. Claude is now exercising the live reroll cases; do not mark them passed until results arrive.
