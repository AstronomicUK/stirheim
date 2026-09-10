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

### Local milestone 7 — scenario rewards continued (#72/#189, not deployed)

The Wizard’s Tower now resolves each recovered chest through its actual D6 table: 1–2 nothing, 3–5 3D6 gc, 6 6D6 gc. Both players can claim recovered chests. Raw treasure/gold dice are saved in the draft, incomplete rolls block filing, totals are derived once, and each chest is described in the report log. Extra loot is a collapsed, reason-required agreed adjustment. Removing a chest removes its reward; changing the result clears the old gold dice. This completes one scenario’s normal reward path, not the all-scenario #72 audit.

Corrected two source-rule exploration errors: Wizard’s Tower has no exploration; Mordheim’s Burning removes the winner’s bonus die. **Corrected during milestone 16 source reread:** only the winner may explore (the earlier local implementation incorrectly allowed losing warbands). Both retain explained exploration adjustments. Review now shows the actual skip reason instead of always claiming no surviving hero. Sources: local scraped scenario pages, Treasures and Exploration sections respectively.

Validation: 1,387 tests pass, 86 DB-dependent tests skipped; typechecked build passes with existing warnings. New report tests cover lost-warband chest rewards, illusions, both gold tiers, incomplete rolls, removal, explained adjustments, and scenario exploration counts. Browser verification of the new chest form remains outstanding. Nothing pushed or deployed. All other remaining work listed above stays open.

### Local milestone 8 — source-conditioned scenario rewards and saved browser flow (#72/#87)

Added 17 explicit scenario reward paths, alongside the preceding Wizard’s Tower implementation. Core counters/building/Chance Encounter calculations, Hidden Treasure and Lost Prince independent finds, plus Mummy, Beujuntae, Bar Room Brawl, graveyard and ransom rewards. Source-specific caps, gates, flat bonuses, two-dice discovery, separate duplicated armour rows, and valued stash items are enforced. No-reward scenarios show that plainly. Supported scenarios put arbitrary extras behind a separate reason-required adjustment. Unsupported scenarios remain open; do not close #72.

Full source/evidence matrix: `docs/SCENARIO-REWARDS-AUDIT-2026-09-10.md`. The Mummy’s jewellery D6 sets its value, not its item count. Beujuntae’s explicit 2D6 instruction overrides the misleading table heading. Custom special items keep their source effects in their stash names; this does not implement new combat-engine handling for those items.

Actual mobile browser and local database verification now passes for Hidden Treasure: discovery/quantity changes, reload persistence, incomplete filing gate, gold/shards/items and log persistence. Desktop screenshot also inspected. Wizard’s Tower’s full chest and report flow also passes. #87’s outstanding browser gate check is now done: a participating Hero’s unrolled advancement blocks progress through reload, a rolled skill can be deferred, and the final report applies the correct XP and treasure. Disposable local data was cleaned, with no browser errors.

Latest validation: **1,397 tests pass / 86 DB-dependent tests skipped** in the ordinary suite; build passes, lint has only the three existing audit-probe warnings. This turn’s browser tests exercise real local report filing in addition to the earlier 14 local integration tests. Nothing pushed or deployed; wider Between Battles items remain open as recorded above.

### Local milestone 9 — saved exploration benefits (#66/#187)

Shattered Building now keeps its D3 shards even after the wardog Leadership failure, and adds an actual wardog item on success. Unfinished location rewards are no longer labelled resolved.

Applied report history now supplies the permanent Entrance to the Catacombs reroll (one maximum), next-exploration Straggler extra die/discard, next-battle tunnel reminder and Returning a Favour recruitment reward. Straggler keeps the original number of dice even when fewer than six; skipped exploration preserves it. The warband sheet records these benefits. Returning a Favour offers an explicit free-hire choice, retains the source report on the hire, waives its fee, and keeps ordinary upkeep after the next battle. A local unique index prevents concurrent duplicate claims and retains the claim after departure. Only newly recorded, explicit Straggler grants are inferred; old text-only Straggler reports are not guessed at.

Migration 20260910000041 applied locally only. Its database concurrency test passes. Browser checks pass for zero-cost hiring, saved source claim, prevention of reuse through reload, plus the existing report/reward/advancement checks. Full ordinary suite at this checkpoint: 1,403 passing; build passes; lint unchanged. Remaining conditional location resources/XP/recruits and other batch work continue; no push or deploy.

### Local milestone 10 — location experience and recruits (not deployed)

Straggler and Prisoners now use their Skaven/Possessed/Undead branches. Witch Hunters and Sisters receive the Graveyard experience reward instead of looted gold. Allocated experience enters the normal XP log, updates named living Heroes (including those who sat out), and triggers the required advancement gate.

Human Prisoners can join an existing human henchman group without a hire or veteran-XP fee, with identical paid equipment; variable/custom kit requires a recorded agreed price. Undead rewards add the rolled Zombies to an eligible group or create a new one. Group and roster limits apply. These rewards are part of the report transaction, and withdrawal removes newly created groups only if they have not subsequently changed or acquired equipment/advances. Migration 20260910000042 applied only locally; two new database tests pass for apply/withdraw/refile and protected later changes. Focused report/location/XP tests and typecheck pass. Full browser and combined batch regression remain outstanding; other remaining project scope above is unchanged.

### Local milestone 11 — Petty Thief (#110)

The participating Mazzalupo Squire now owes the printed D6 if not taken out of action. Failure logs no reward; success records a random opposing-warband selection. Applying the report transfers one existing shard from that opponent, with zero gained from an empty reserve. The actual transfer is saved in the report and both treasury histories. Withdrawal restores the opponent’s shard and removes the report’s gain; it refuses if the required shards have since been spent. Concurrent thefts of the last shard cannot duplicate it, and a target outside the match is rejected. Migration 43 is local only; three transfer tests and two recruit transaction regressions pass. Unit suite: 1,409 passing / 92 DB-dependent skipped; typechecked build passes with existing warnings. Browser verification of this flow remains pending.

When amending a historical report, saved exploration benefits are now read only from reports submitted before that report, rather than granting discoveries from future battles. No production changes.

### Local milestone 12 — conditional hiring and retained Scouts (#119/#184)

Added Orc Mob and Druchii named lists, Chaos Dwarf cross-list permissions with Elf exclusions, the web Night Goblin list’s explicit exceptions, mounted Outrider checks, the Society’s Wizard ability exclusion, Marauder Mark of Arkhar checks, Wood Elf alignment review, and the Ogre Hunting Party’s no-Hunter exception. Maneaters gain Mercenary access from a living Dog of War bearer; the bearer’s death removes hired swords through the report. Recruiting an Ogre Hunter warns about and applies hired-Ogre departures. Approved reason-recorded restriction overrides remain available.

Do not copy the web Night Goblin rule to Terry Maltman’s separate list: that restriction is absent from the latter’s scraped text. Black Orc hiring restrictions are also not present in their scraped special rules; the original supplement still needs checking. The Ogre Hunter source names an Ogre Slaver, while the catalogue contains Ogre Slave Master; recruitment does not silently equate these names. Those source ambiguities and remaining companion acquisition/kit work stay open.

Maglah’s retained Scout is selectable and saved on the recruitment and upkeep cards. Death in the report requires a valid surviving Scout choice when more than one remains. Dismissal, unpaid upkeep and battle-start removal all honour the selected Scout. Migration 44 applied locally only. The focused hiring/report/lifecycle suite passes 91 tests; the local battle/upkeep suite passes 11, including selected-Scout retention. Browser review and remaining #184 mounts/bodyguards/snake replacement are still required. No push or deployment.

### Local milestone 13 — henchman upkeep ledger and Troll alternatives (#123)

New reports mark surviving upkeep-bearing groups as owing upkeep. The warband screen and recruitment page offer the same settlement flow; the saved battle marker prevents duplicate payment and removes the reminder through reload. Historical payments are not guessed or retroactively charged. Orc/Night Goblin Trolls can consume exactly two eligible Goblins/Cave Squigs per Troll when normal food is unaffordable, removing the models and their proportional kit. Black Orc Trolls instead offer the printed 5 gc option when 20 gc is unaffordable; the Troll counts twice for both income and the roster limit until fed normally again.

Migration 45 adds persisted group campaign state and carries it through roster updates, report apply and undo. A withdrawal cannot erase a later upkeep settlement; that payment must first be reversed. Six local report-transaction tests pass, including state serialization and protected withdrawal. The mobile browser sacrifice flow passed with saved model/item counts and settlement through reload; existing scenario/advancement/free-hire browser flows also still pass. Full suite: 1,418 passing / 94 DB-dependent skipped. Build passes, lint retains only the three pre-existing audit-probe warnings. No deployment. Fanatic supplies/Looney, Pirate surcharge and Trapmaster purchases remain within #123 and are next.

The broader data-integrity check also caught the source’s Shade Scout reference missing from the catalogue; removed its nonexistent ID from the executable Druchii list and retained the source note rather than fabricating an entry.

Source clarification for #119: Terry Maltman’s original [Night Goblins v3.21 PDF](https://www.broheim.net/downloads/warbands/experimental/Night%20Goblins.pdf), page 1 revision history, explicitly records removal of the hired-sword list in v3.1. Its absence in the scrape is therefore intentional, not missing implementation. The [original Black Orcs PDF](https://broheim.net/downloads/warbands/supplement/nemesiscrown/Black%20Orcs.pdf) also contains no additional hired-sword whitelist; retain individual hired-sword eligibility instead of borrowing Orc Mob’s whitelist. Page 5 confirms the Black Orc Troll’s 5 gc/two-member alternative. These two source questions no longer block #119.

### Local milestone 14 — unresolved hired-sword characteristic limits (#61/#74)

Chaos Centaur and Cursed Hillman no longer silently receive Human maximum characteristics. A characteristic advance requires a recorded table ruling, starting from an editable published profile. The ruling is saved on the hire and in the advancement resolution; deferred skill choices preserve it. Ordinary new-skill results need no unnecessary ruling. This uses Tom’s approved player-override approach while the printed racial profile remains unconfirmed.

Thirty focused advancement tests and typecheck pass. The real mobile flow also passed: missing ruling blocks progression, agreed values and reason persist, and the characteristic increase saves correctly. Existing scenario, advancement-gate, Returning a Favour and Troll-upkeep browser checks still pass. No push or deployment.

### Local milestone 15 — scenario rewards and shared artefacts (#72/#190)

Added bounty, per-building/per-counter loot, initial-booty history, repeated Hero temple searches, and Monster Hunt artefacts. Reviewed more full scenario pages, including objective-only scenarios, and added explicit normal reward paths. See the expanded scenario source matrix. In particular, pre-battle equipment is not awarded twice, sacrificed shards do not enter the treasury, and the Skull requires actual capture rather than a rout win.

Eighteen focused reward tests pass. Mobile browser checks file Farm rewards after a loss and a Monster Hunt artefact, with reload persistence, dependent-reset gates and saved logs. Six local artefact database tests pass, including cross-source concurrency and duplicate-in-one-report rollback. Migration 46 applied locally only. The whole 103-scenario audit remains open, along with the other outstanding batch scope; no push or deployment.

Milestone 15 full regression: **1,428 tests pass / 96 database-dependent tests skipped** in the ordinary suite; six artefact transaction tests passed separately. Production build passes with existing warnings; lint retains only the three existing audit-probe warnings.

### Local milestone 16 — more outcome and table-driven scenario rewards (#72)

Expanded the source matrix and normal reward paths: rescued relics, Prince outcomes, Haunted Treasure’s explicit multiplier ruling, captured horses/routing loss, Swag/Village tables, separate Giant containers, the Reuvers Ambush calculation, Truthsayer 2D6 gifts and Tomb Raid variable finds. Reviewed further full pages with no additional treasure instead of inferring from headings. Twenty-eight focused reward tests pass. Mobile Village filing and previous browser regression pass. Typecheck/build and further table UI checks continue before the next checkpoint; the batch is not yet ready to deploy.

Milestone 16 checked locally: **1,441 tests passing / 96 database-dependent skipped**, typechecked build passing and only the existing lint warnings. Tomb Raid and Truthsayer mobile reports file with correct item quantities/values and saved catalogue identity. Mobile QA also fixed oversized review rows and action-bar/navigation overlap. Special scenario items now have short names and separate source-linked tooltip rules, with no ordinary-shop listing. Hunt the Heretic and Item Lost role/outcome rewards added. Source reread corrected Mordheim’s Burning to winner-only exploration. No push, production migration or deployment. The remaining scenario audit and other outstanding project scope remain in progress.

### Local milestone 17 — combined treasure and shared payments (#72)

Defend the Tomb, Hornsby’s Ferry, Bodyguards, Bounty Hunting and The Recipe now have source-specific reward paths. Mobile report filing verifies the first four; quantity changes clear gem values, role changes clear dependent rewards, actual participants determine bandit counts, and each ally records only its named agreed share. Full suite 1,448 passing / 96 DB-dependent skipped; typechecked build passes. The source matrix now has 82 explicit scenario paths, with 21 still outstanding. Remaining upkeep/companion/gear scope is unchanged. No push or deployment.

### Local milestone 18 — individual scenario rewards and fixed-income rulings (#72)

Stake-Out requires a recorded exploration interpretation because its printed fixed income does not resolve that question; both readings preserve the stated D6/D6+1 income. Stagecoach Ambush has no extra quantified treasure and does not permanently award its loaned kit. Sword of the Herald records actual splinters and sword disposition, including rewards in its optional non-campaign mode and an explicit exception for a warband outside the printed retention list.

Kidnapped now allocates the victim XP to named living Heroes, adds the 50 gc rescue reward, and permits the scenario’s optional Shadowlord rolls for up to two Heroes without spending advances. Changed skills, spells, stats and equipment are carried through the report and subsequent advancement planning. Original kit moves rather than duplicates; Wrath removes the warrior and carried kit. Migration 47 applies owned equipment and hero changes transactionally and protects later edits during withdrawal. Seven local database tests passed (four direct-equipment and three existing recruit regressions), 93 focused model/rules tests passed before the final additional reward validation test, and mobile Stake-Out, non-campaign Herald and Kidnapped reports saved successfully through reload with real local treasury/XP/equipment checks. No push, production migration or deployment; remaining scenario and hired-character scope continues.
