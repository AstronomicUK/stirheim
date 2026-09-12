# Priority 1–5 scope recheck — 12 September 2026

**Current conclusion: the agreed core batch is now ready locally for one release (source 6f47572), not deployed.** All gaps found by this audit have subsequent implementation and acceptance evidence recorded below. Earlier sections retain the audit history; the final dated acceptance supersedes their open statuses. See `CORE-RULEBOOK-RELEASE-2026-09-12.md` for current coverage and release steps.

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


### Follow-up: Crimson Shade correction and live casting rerolls

Crimson Shade now offers **Correct Crimson Shade Initiative** alongside its saved bonus. It requires a new D3 value and a reason, preserves the original result/provenance separately, and logs each old/new correction without changing stock or earlier attacks. Stale or invalid corrections are rejected; untick/re-tick still does not reroll. Mobile fixture `/tmp/stirheim-shade-correction-qa.mjs` passed reason-required, saved old/new/original and reload checks. The fixture started with an existing app-roll record; this does not claim a new original die was rolled by the browser script. All disposable fixtures cleaned. 124 focused sheet/odds/correction tests, TypeScript and lint passed (only the three pre-existing audit warnings).

Claude’s live reroll evidence is saved in `docs/audits/2026-09-12-casting-rerolls/rerolls-live.txt`: pair and one-die sources, second-reroll refusal, per-turn reset, unused-source retention and saved casts after reload passed. Gated/per-game source variants remain unit-only; native editor, hatred-note and desktop verification are assigned separately. These two gaps are now addressed locally; **the full batch remains incomplete** (core melee pistols, battle setup/Fear/Frenzy persistence and Relic corrections). No push or deployment.


### Follow-up: saved weapon choices and Fear/Frenzy

Weapon profiles now save by catalogue ID, and physical-copy choices by inventory copy key; attacker melee/ranged choices are separate. Defender choices survive reload, with an opponent’s saved choice used when there is no local override. Switching quick-action mode refreshes the suitable attacker default. Situation settings persist for the selected individual/opponent and combat phase; Fear expires at the next phase, while a player-declared ended Frenzy persists for the battle. Clearing recorded Fear/Frenzy requires a reason and writes a log without rewriting old attacks. Multi-model groups are explicitly table-managed per model, not assigned a whole-group psychology flag. Consumable-granted Frenzy now exposes the relevant control as well.

Actual mobile verification: `/tmp/stirheim-weapon-selection-qa.mjs` retains Dagger after reload; `/tmp/stirheim-psychology-persistence-qa.mjs` retains Fear and ended Frenzy after reload, advances the fixture’s saved turn to show Fear expiring/Frenzy persisting, and records an explained restoration. These fixtures are cleaned. 114 focused schema/situation/odds/weapon-loss tests and TypeScript pass; lint has only known audit warnings. Shared-turn and quick-action desktop integration remain part of the final check, not claimed newly browser-verified here.

Claude’s additional desktop/native-editor/hatred-note evidence is in `docs/audits/2026-09-12-p5-desktop/acceptance-live.txt`; handed over in e213a2cc. Claude now owns Relic correction files; domain leadershipTests gained optional turnKey for that linkage. Core melee pistol work remains with Codex. No deployment.


### Core pistol calculation/use foundation; original-source correction

Original core PDF checked: https://www.broheim.net/downloads/rules/Mordheim%20Core%20Rules%20Printable.pdf (p29 crossbow pistol; pp30–32 normal/duelling/warplock). The crossbow pistol has a BS opening shot at −2 before melee blows; the scraped additional WS-based pistol paragraph is not on that page and must not drive implementation. Standard and duelling pistols use fixed S4/−2 armour, Warplock S5/−3; a single bonus and brace attacks are not multiplied by the warrior’s Attacks/Frenzy.

Added core combat-profile helpers and typed fixed-attack support, plus saved per-model combat IDs and physical pistol use. Changing turn/target does not refresh an already-used pistol; declaring a new combat requires a recorded explanation and does not bypass firearm reload. Brace and crossbow modes are restricted to their declared opening phase. Corrections retain history and restore linked firing availability without undoing old results. 82 focused profile/ledger/reload/roller tests and TypeScript pass; initial fixture UUID/holder-type errors were fixed before the clean rerun. **Foundation only: not yet connected to the battle UI.** Do not close #73/#69 on these helpers. Next: actual single/brace/BS-opener controls, eligible physical model/copy selection, sequential roll-through consumption and corrections, mobile/reload/opponent verification.

The same original PDF p36 and existing local reference 02:1510 identify **Bugman’s Ale as core**, not supplementary. Earlier equipment-checkpoint exclusion was incorrect. Whole-warband use, non-Elf eligibility and one-barrel consumption/correction are restored to P3 and assigned to Claude (443f20de/e94d81aa); request a shared state interface before edits to Codex-owned domain/FightTab files. Thus the remaining core checklist includes Bugman’s Ale as well as pistol UI/integration and final acceptance.

Claude’s Relic correction b58097a (with turnKey from 3771f00) passed hero Rout and single-model Rat Ogre Stupidity actual mobile correction/reload checks. His earlier claim that the group control was absent was incorrect: it was already rendered by 98f733e. Evidence is in docs/audits/2026-09-12-relic-correction; note 5fa4f673 supersedes the limitation claim. Nothing deployed.


### Core pistol UI and Bugman’s Ale — 12 September, local acceptance

Core #73/#69 pistol combat is now connected to the Battle Sheet: one bonus pistol attack alongside the ordinary weapon, a two-attack brace, and the separate BS crossbow-pistol opening shot. The physical inventory copy and confirmed combat are retained; starting another turn/choosing another opponent does not refresh use. An explained new combat does not bypass reload. An explained correction restores availability without rewriting earlier attacks. Brace attacks are sequential, and the unused second pistol can be resolved separately during the same opening round. The ordinary attack count is not replaced by a single pistol’s bonus. Crossbow-pistol tooltip/data no longer repeat the scraped normal-pistol WS paragraph absent from original core p29.

Actual disposable 390px browser checks passed: two distinct brace copies (including misses), saved use after reload and explained corrections; A3 normal weapon followed by one pistol (no premature pistol use); the BS opener at 6+ for BS3 and no blackpowder consumption; split brace across separate roller openings. Scripts are archived under `docs/audits/2026-09-12-core-pistol-combat/`. 84 focused profile/ledger/roller/physical-copy tests passed. The first browser pass exposed duplicate saved profile identity, which was fixed before rerunning. Initial script selector failures are not product failures; final runs cleaned all their disposable fixtures.

Bugman’s Ale is completed by Claude 85fb7a6 plus shared integration 141d13f: a declared barrel grants battle-long fear immunity to the warband except Elves, including a stash barrel; carrying an undrunk barrel does nothing. Exact inventory-row consumption, withdrawal, stale stock validation and duplicate legacy-tick suppression pass 21 focused tests. Claude’s mobile declaration/reload/correction acceptance passed 11 checks. This closes the erroneously excluded core clause, not every supplementary consumable in #139.

The shared combat boundary and positional ordering remain player-confirmed. Group use is per selected model with physical copies; uneven kit is explicitly blocked rather than assigned arbitrarily. All work remains local; no push or deployment.


### Final Priority 1–5 acceptance — 12 September 2026, source 6f47572

**The agreed core batch is ready for a single release, locally committed and not deployed.** This supersedes earlier incomplete/readiness statements above. All named core acceptance gaps in the scope recheck are closed; umbrella supplement clauses remain partial.

Final evidence: 2,307 ordinary tests pass; Claude’s 216 local database tests pass; build/TypeScript pass; lint has only three pre-existing audit warnings. Claude’s final actual shared-turn check passes 9/9: start turns, set Fear/Frenzy, reload, finish both players’ turns, then reload in round 2 — Fear expires while ended Frenzy remains. Evidence: `docs/audits/2026-09-12-fear-lifetime/acceptance-live.txt`. This closes the last UI verification gap; no further rules decision is needed from Tom.

Latest source checkpoints: 6f47572 core pistol UI/crossbow source correction, 141d13f Bugman integration, 85fb7a6 barrel use/settlement, b58097a Relic corrections, 3771f00 saved choices/psychology, a3bc2a8 Shade correction. Release procedure and exact coverage are in `docs/CORE-RULEBOOK-RELEASE-2026-09-12.md`. Production remains at the preceding release. Apply pending migration 087 before publishing this new frontend when authorised; no per-fix pushes or duplicate deployments.
