# Between Battles — approved 20-item project

Tom approved this project on 10 September 2026. Develop and test locally, with local commit checkpoints. No intermediate pushes or production deployments. At the end, one push and one production release; check whether GitHub already triggers deployment to avoid a duplicate manual deployment. This supersedes the earlier per-fix deployment agreement.

## Scope

- Hired characters: #61, #74, #119, #184.
- Recruitment/upkeep: #123, #219, #220.
- Scenario/treasure rewards: #72, #187, #188, #190.
- Exploration abilities: #66, #104, #105, #106, #107, #108, #109, #110.
- Advancement completion: #87.

Keep existing approved player overrides. #72 removes arbitrary treasure from the normal reward flow, not the separately identified, reason-recorded override. #219 keeps the inline reminder, warns before battle, and dismisses unpaid characters only when starting, not when scheduling/joining. Preserve shared hero searches when moving Personae into Recruit.

## Delivery and evidence

Implement cohesive local milestones, documenting source rules and meaningful tests. Keep tracker entries open until their complete scope is verified. Review mobile layouts and the full saved post-battle/recruitment/start-battle journey with disposable local data. Do not alter existing live player histories or the CoC–Dwarves battle for testing.

## Progress

- Baseline: production commit 2f7c750, verification commit 20037d4; 1,365 unit tests pass. Existing uncommitted audit documents predate this project and must be preserved.
- Initial milestone: close the unrolled-advancement loophole (#87), then connect recruitment/search and pre-battle upkeep (#220/#219).

### Local milestone 1 (not deployed)

#87 now rejects untouched advances and legacy whole-advance deferrals; rolled skill choices remain deferrable. #220 moves Personae to Recruit while retaining the persisted trading-phase search ledger and leaving unrelated between-battle actions in Trading Post. Full suite: 1,366 passing, 78 local integration tests skipped. Typechecked build passes with existing CSS/bundle warnings. Browser and database integration verification remain required before marking these entries complete.

### Local milestone 2 (not deployed)

#219 adds a named unpaid-character warning at battle start. The database recomputes the affected set under roster locks, requires acknowledgement of that set and applies departures in the same transaction as starting the battle. Shared companions leave; paid characters remain; histories and gold are preserved. Payment after a preview is rechecked. Read-only preview is restricted to participants/GM. Local migration 20260910000039 is applied **only locally**. Four new local integration tests and six existing battle lifecycle tests pass. Remaining release checks: browser/mobile flow, search-allocation integration, and companion edge cases in #184. One final production migration/release will be required; do not push or deploy this checkpoint.

### Local milestone 3 (not deployed)

#104: Mountain Guide two-dice choice, explicitly not a reroll. #106: one Trailblazers reroll per remaining Poacher, using post-injury group sizes and participating units. #108/#109: Cutpurse and capped Light Fingers awards applied to roster totals and named in the report log. #188: numeric item quantities respected, dice quantities require a valid result, and quantity/outcome changes reset dependent inputs. #66 progress: prevent rerolling the same exploration die through another aid; record two-dice choices distinctly from rerolls. Rolled keep-either results are now shown before choosing rather than immediately applied by “Roll for me”.

Validation: 1,373 unit tests pass; 82 DB tests skipped in the ordinary suite. Separately, 10 local battle/upkeep integration tests passed. All milestones remain local and require final browser/release verification. #66's broader scope remains open. #105/#107/#110 and source-conditioned scenario/location rewards are still outstanding, as are the remaining hired-character/henchman/artefact workstreams.

### Local milestone 4 (not deployed)

- #105: Twisted Scholar training is an explicit ordinary Scholar / Wizard (+10 gc) / Chronicler (+10 gc) choice in creation and recruitment. Saves the Chronicler flag, prices the upgrade, prevents combining Chronicler and starting spells, and grants one keep-either exploration reroll. Both results are logged. Source: `reference/rules/warbands/grade-1c.md:1295–1297`.
- #107: Only in Victory gates Slayer exploration after losses/routes, preserving the Rememberer exception and allowing a declared alliance with the winner. Record of Valor names a participating Rememberer/Bard witness for each qualifying enemy-caused Slayer hero casualty; one die per casualty, no stacking, removed if the casualty is no longer recorded. Witnessed casualty dice remain available with no standing hero. Source: `reference/rules/warbands/grade-2a-part1.md:680–686`.
- #66: Elf Ranger Seeker now grants its +1/−1 exploration modifier. Aids use participating rosters after injury resolution so dead holders cannot supply them. Permanent Catacombs and the outstanding location consequences remain open.
- #187 progress: Tavern pass/failure branches award 4D6/D6 respectively, with automatic passes for the named core warbands. Shop Lucky Charm requires its gold D6 to be 1. Armourer finds require Shield/Buckler choices, including mixed quantities. Maximum-find quantity fields cannot be rerolled. Other conditional location rewards are still outstanding.

Local browser evidence: `/tmp/stirheim-rules-qa.mjs` created and cleaned disposable warbands/campaign/match. At 390px mobile width, Chronicler recruitment persisted the flag and deducted 35 gc; Personae tab opened; upkeep preview/cancel kept the match scheduled and hire active; confirmation started the battle and marked the hire left without changing gold. Desktop warning also rendered. No page errors. Screenshots: `/tmp/between-chronicler-mobile.png`, `/tmp/between-upkeep-mobile.png`, `/tmp/between-upkeep-desktop.png`.

### Local milestone 5 — campaign artefacts (not deployed)

#190 now has a campaign discovery ledger, an exploration artefact D6/description/past-discovery interface, report and stash records, and an explained duplicate override. The database serializes simultaneous discoveries; only one unoverridden report succeeds. The first discovery survives deletion of its original report or warband. Re-filing that same report is accepted. Exact named artefacts in historical report stash rewards seed the ledger without modifying items or histories. This does not infer ambiguous old free-text artefact names or import unlogged manual inventory changes; those need explicit review.

Migration `20260910000040_campaign_artefacts.sql` is applied **only locally**. Four disposable local DB tests pass: simultaneous claims, retained discovery, explained duplicate, re-filing/authentication. Unit coverage checks the report/stash record, duplicate block, override, same-report amendment, and missing-ledger guard. Full browser filing of an artefact and combined batch end-to-end verification remain required.

### Remaining project work

Do not treat local implementations as a completed release. Outstanding: #61/#74/#119/#184 remaining hired-character data/role/permission/retinue cases; #123 special henchman upkeep and supplies; #72 all-scenario bespoke rewards and normal-flow arbitrary-loot removal; #187/#66 remaining conditional location effects; #110 Petty Thief's actual cross-warband transfer. Also verify #220 shared rare-item/persona search allowance in both directions through reload, and #87 the browser's complete filing gate. Review the full saved mobile/desktop journey and deployment trigger before the single final push/release.

A preliminary inventory of all 103 scenario pages is at `/tmp/between-scenario-reward-inventory.json`; it identifies candidate reward sections, **not** a completed source audit. No assumption that a page without a matching heading has no reward is valid.

Latest checkpoint validation: **1,384 unit tests pass**, 86 DB-dependent tests skipped in the ordinary suite. Separately, 10 battle/upkeep and 4 artefact integration tests passed locally. Typechecked production build passes with existing CSS/bundle warnings; lint reports only the three pre-existing unused imports in the audit probe. Nothing pushed or deployed.

### Local milestone 6 — Personae search verification and Luthor (#220/#61)

The actual mobile browser flow now verifies both directions of the persisted allowance: a Persona search consumes the Scholar's search, Trading Post after reload offers only the other hero, recording that hero's failed rare search leaves zero Persona searchers after navigation/reload. A successful Luthor search/hire also saves the selected role. All fixtures are disposable and cleaned afterwards.

Fixed the found Persona hire path which previously omitted Luthor's mandatory role option (and therefore threw instead of recruiting him). Both hire paths persist `luthorRole`; the unit sheet shows the selected role's source rules; the false Wizard gains his Beer fear immunity but no spells. Equipment is still role-specific. Existing Luthors without a saved role are not guessed or rewritten. Wider #61/#119 work remains open.

Latest full validation: **1,385 unit tests pass / 86 DB tests skipped** in the ordinary suite, with the 14 previously mentioned local DB tests separately passing. Build and lint pass with the same existing warnings. Local browser recruitment/upkeep plus shared-search/Luthor flows pass without page errors. No push or deploy.
