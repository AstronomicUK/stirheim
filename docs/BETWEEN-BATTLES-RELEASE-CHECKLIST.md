# Between Battles — release checklist

Local review at checkpoint `18ee565`, 11 September 2026. **Not released.** This is an original-scope evidence map, not a declaration that every wider Mordheim campaign system or bespoke character power is automated. Detailed source citations, executable tests and disposable browser evidence are recorded in `BETWEEN-BATTLES-PROJECT.md` under the milestone numbers below.

## Original 20 items

| Item | Local implementation and evidence | Remaining boundary |
|---|---|---|
| #61 | Starting skills/tables, cavalry skills, ordinary kit, fees, legacy review, role/equipment choices; milestones 6, 14, 20, 33–34, 38, 50–59, 65; recruitment, kit, lifecycle and advance tests; mobile combined journey 58. | Chaos Centaur/Hillman maxima require a recorded table ruling, using approved overrides. No guessed racial profile. Bespoke custom-only gear is documented separately. |
| #74 | Parser/ordinary aliases and prerequisite parsing; named kit and saved legacy review; same kit milestones and focused tests. | Original ticket explicitly accepts bespoke uncatalogued equipment as custom. Mixed Pit Fighter styles are a distinct warband feature, not proof that the hired-kit parser is incomplete. |
| #119 | Conditional lists, marks, wizard/mount restrictions, Dog of War access/departure, Hunter/Ogre departure; milestones 12–13, 59; recruitment helpers and lifecycle tests. | Source says Ogre Slaver, catalogue says Ogre Slave Master: explicit table review, no invented identity. Black Orc/Terry Maltman list ambiguities checked against originals. |
| #184 | Separate paired fighters/snakes, shared fees and departures, retained Scout, mounts, Snake Hunter, earned Guardian and interception; 12, 20–21, 49; lifecycle, transaction and browser tests. | Companions and optional benefits appear only when selected/earned. |
| #123 | Troll alternatives, individual Fanatic supplies/Looney, Trapmaster costs, Pirate mixed crew; 13, 22–23, 27; upkeep/report integration and mobile sacrifice checks. | Uses the printed unit-specific alternatives. |
| #219 | Named warning, locked recomputation and atomic unpaid departure at actual battle start; 2, 4, 58; database and real mobile/desktop start/cancel checks. | Scheduling/joining does not dismiss characters. |
| #220 | Personae under Recruit; shared rare-item/persona search allowance persists; 1, 6, 58; transaction and mobile checks. | Existing search limitations preserved. |
| #72 | 102/103 scenario reward paths, source-specific XP/items/currencies and logged override distinction; scenario audit and reward/report test suites, combined mobile checks and later transactional scenarios. | Tom deferred Khemri-dependent Defend the Oasis aftermath on 11 September to very low-priority #227; no longer a batch implementation blocker. |
| #187 | Independent exploration conditions, warband branches, actual recruits and equipment consequences; 4, 9–10, 28–30, 60–64; report-model, transaction and real mobile filing/withdrawal checks. | Choice-dependent outcomes require their actual inputs. |
| #188 | Fixed/dice quantities retained and unresolved rolls gate progression; 3–4; report-model and reward tests. | Approved explained corrections remain available. |
| #190 | Persistent campaign artefact ledger, serialized claims, duplicate explanations and discovery retention; 5, 15; artefact integration tests. | Ambiguous historical free text is not silently converted into discoveries. |
| #66 | Keep-six procedure, permanent discoveries, native/hired aids, source-conditioned locations, gems, books, Haggle, Pit and Shrine; 3–4, 9–10, 30, 59–65; rules/report/database tests plus actual mobile flows. | Does not claim unrelated full campaign-system automation. |
| #104 | Participating standing Mountain Guide rolls two and keeps one; 3 and exploration-aid tests. | This is a choice, not an extra reroll. |
| #105 | Paid Chronicler recruitment/creation, non-Wizard restriction, keep-either aid; 4, 58; rules and mobile saved recruitment. | No combined Wizard/Chronicler grant. |
| #106 | One reroll per participating surviving Poacher; 3 and aid tests. | Post-injury model count, not one per group. |
| #107 | Only in Victory, Rememberer exception, named qualifying casualty witnesses and no stacked observers; 4; Slayer exploration tests. | Player records the actual qualifying battlefield circumstances. |
| #108 | Participating surviving Halfling Thief Cutpurse reward; 3; reward tests. | Native unit, not every hired thief. |
| #109 | Selected Light Fingers skill and qualifying enemy OOA, capped once per Hero/game; 3; reward tests. | Not one shard per kill. |
| #110 | Named Petty Thief roll, actual opponent transfer and reversible locked settlement; 11; report transaction tests. | Opponent resources are validated at application. |
| #87 | Unrolled advances block filing; rolled skill choice may be deferred; 1, 8, 14, 58; advancement/report tests and actual mobile gates. | Approved skill-choice deferral retained. |

## Verification checkpoint

- Full ordinary suite at milestone 65: 1,671 passed. Subsequent focused exploration-aid suite: 17 passed, including the added Pathfinder case. Typecheck passes after that final change.
- Last separate local database suite: 166 passed across 31 files. No database changes after that run.
- Typechecked production build and lint pass, with the documented existing warnings.
- Combined recruitment/rewards/start-battle browser verification passed at 58; later affected paths have their own actual 390px mobile filing/reload/withdrawal checks through 65. No live player histories were used.
- Tests validate the implemented paths; the 102/103 measure is reward-path coverage, not complete combat/campaign automation for every source.

## Production preflight already checked

A **read-only linked Supabase dry run** succeeded on 11 September. It reports exactly **33 pending migrations**, `20260910000039` through `20260911000071`, and no seed/role changes. Nothing was applied. The production migration history matches the expected pre-batch baseline; the dry run is a migration plan, not execution validation of SQL against production.

Netlify API reports the linked `AstronomicUK/stirheim` repository on `main`, with `build_settings.stop_builds: true`. No setting was changed. Thus a push alone currently will not publish; one deliberate production deployment is required. Recheck the setting before release to avoid a duplicate build if it changes.

## Release gates, in order

1. **Resolved by Tom:** defer all rules depending on the full Khemri campaign system to #227 (very low priority), including Defend the Oasis aftermath. A setting-based scenario library is a future proposal. Do not implement a partial water system for this release.
2. Run the final checks appropriate to those changes; ensure the final build and database types match the migrations. Review the final changes and migration plan. Preserve pre-existing dirty audit work; selectively stage only intended tracker changes.
3. Coordinate the 33 pending database migrations with the new frontend. Apply the linked migrations only as part of the authorised release; do not reset or seed production. Confirm the final migration history before publishing the frontend.
4. Make the single final push. Recheck Netlify's automatic-build state: if paused, make one deliberate production deployment; if enabled and the push triggers one, use that build instead of starting another.
5. Confirm the served application assets match the tested release and perform read-only live smoke checks. Do not mutate the existing CoC–Dwarves battle or other player histories for QA. Record deployment evidence before marking release completion.
6. Only after the main release is verified, start queued #221–226 and #23/#54 follow-ups. Menu redesigns require proposals, as recorded in the user request.

No additional production approval is required: Tom explicitly authorised the completed batch's overnight deployment. The Khemri scope question is resolved by explicit deferral.
