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

## Current checkpoint — 10 September, local batch

**Still local; the 20-item batch is not ready to deploy.** Normal reward paths are implemented for **100 of 103 scenarios**. This measures explicit reward paths, not the percentage of implementation effort finished or complete automation of every related campaign rule.

The latest continuation completed Pirate discovery recruitment; casualty kit before replacement recruitment; historical discovery ordering; Hunters Become the Hunted; Brigands in the Pasturelands; Gathering of the Horde; and the Archive Forbidden Square. It also added reviewed corrections for older hired-character equipment, resolved remaining ordinary Persona kit and added checked cross-warband equipment transfer infrastructure. See milestones 28–37 below.

Remaining scenario paths (3): Defend the Oasis; The Thing in the Woods; Rawhide. Raids is verified locally (milestone 43). Assault on the Rock and Stop Thief are now verified locally (milestones 41–42). Encampment Raid now has checked equipment transfer and a recorded camp decision; optional housing effects and treasury interpretation remain explicit limitations (milestone 39).

Other open work: remaining bespoke hired-character equipment/effects and the unresolved Ogre Slaver identity; final combined report/recruitment/battle-start checks and tracker reconciliation. Guardian interception and Medicine Chest injury-reroll consumption are not fully automated. Do not close broader tracker entries based on partial milestones.

Validated checkpoint: **1,568 ordinary tests pass; all 135 local database tests pass; typechecked production build passes.** Lint retains three pre-existing audit-probe warnings; build retains the existing CSS/bundle warnings. Actual mobile checks cover each new scenario path, free outlaw recruitment and reviewed equipment correction; map-control and transfer withdrawal were verified against saved local records. All new test data was disposable.

Migrations through 61 have been applied to the local database only. No push, Netlify deployment or production migration has occurred. Source changes are locally committed; the pre-existing dirty audit/tracker documents remain intact.

Pending scope question: Defend the Oasis relies on Khemri’s wider water/carrying-capacity/exploration/trading system. An asynchronous question asks whether this batch should provide scenario-specific recorded support or expand into the full Khemri campaign system. No response was received at this checkpoint; other scenario work is independent. The original [Town Cryer compilation](https://broheim.net/downloads/campaigns/khemri/Khemri%20Town%20Cryer%20Compilation.pdf), PDF pages 5–7 and 38, confirms that these are campaign systems rather than just a gold reward. Do not silently claim full Khemri support.

The following milestone sections are chronological history; earlier “remaining” lists and test totals describe those earlier checkpoints.

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

### Local milestone 19 — saved Straggler benefit and summoned Zombie groups (#72)

Happy Harpy Hunting Grounds now checks the qualifying nest victory, uses the actual setup shards, and rolls each independent find. Its Straggler is chosen before exploration and either grants the extra die/discard now or persists to the next exploration, surviving skipped exploration. In the Dead of the Night grants the winner’s shards and up to D3+3 summoned Zombies to a successful defender, counting existing and simultaneous exploration recruits against capacity and splitting six recruits into legal groups. Unretained Zombies are logged as wandering away. Mobile reload/filing checks passed for both, including real six-model/two-group persistence. Focused model/discovery tests pass; full combined regression is still required. No deployment.

### Local milestone 20 — selected mounts and earned Guardians (#61/#74/#184)

Freelancer, Highwayman and Roadwarden now offer on-foot or the printed optional mount during recruitment. The Knight of the White Wolf can receive an existing Warhorse from the stash, with no duplicate horse or purchase fee and the printed +5 rating. Mounted Freelancer receives the catalogue’s Ride Warhorse skill. Merchant Guardian advances create a separate equipped bodyguard with stable identity, no XP/upkeep and shared departure; the Merchant’s own abilities are not copied onto the bodyguard. Existing companion cards now avoid offering a second upkeep payment for a shared contract. Mobile recruitment and actual Guardian advancement both persisted the expected equipment through reload. Full ordinary suite: 1,464 passing / 100 DB-dependent skipped. Snake hunting/replacement and remaining batch scope are still in progress. Nothing pushed or deployed.

### Local milestone 21 — Snake Hunter replacement acquisition (#184)

Recruit now offers Snake Hunter after the latest applied report for an eligible surviving Charmer. The database locks the roster, uses strictly less than Initiative, records the one-per-game attempt and prevents concurrent duplication, checks the five-snake cap, and creates a separate no-XP companion on success. Failure requires the danger D6; on 1 the player records the S3 hit’s tabletop dice and lasting outcome. A lost Charmer’s remaining snakes leave. The result is appended to the battle report and roster log, persists through reload, and blocks automatic withdrawal from erasing the later hunt. Migration 48 is local only. Eight local database tests pass (four hunt tests plus four equipment/withdrawal regressions). Mobile creation/logging/reuse prevention passed. No production changes; special upkeep and remaining scenario scope continue.

### Local milestone 22 — Trapmaster per-game supply costs (#123)

The scheduled battle shows each Trapmaster’s one free trap and zero-to-five optional extras. Orders are saved per match; gold is charged at battle start, with an unaffordable order rolling back the entire start. During the battle the owner/GM can mark traps used; concurrent requests cannot exceed the allowance. Supply, cost and usage appear in the post-battle log without charging twice. Source `warbands/grade-1c.md:1643`. Migration 49 is local only. Fourteen local database tests pass, including existing battle/upkeep regression; the mobile order/reload/start/payment/use/reload flow passes. Fanatic supplies and the Pirate surcharge remain outstanding within #123. No deployment.

### Local milestone 23 — individual Fanatic supply and lasting effects (#123)

Battle start consumes one held/stash mushroom dose per Fanatic; unsupplied models sit out. Multi-model groups split into individual records preserving identical equipment and experience; unresolved advances or uneven kit block that split. Surviving supplied Fanatics owe the mandatory post-battle D6 without a used-item checkbox, and permanent Stupidity applies only to that model, appears on its card and carries into combat. The web list retains experience but rerolls promotion; the original list still earns none. Six local database supply/Trapmaster tests, nine kit/report tests and mobile partial-supply/start/reload checks pass. Typecheck passes. Migration 50 is local only; final combined testing remains. No push or deployment.

### Local milestone 24 — Mule Train rewards (#72)

Full scenario source `06-scenarios.md:4748–4792` and Slaughtered Warband table reviewed. Record starting train and actual mules led off; defenders receive separate 2D6 payments even after a loss. Attackers keep the actual mules and receive one combined cargo search, with +1 per additional mule on discovery rolls only. Zero recovered mules grants nothing, and changing role/count clears dependent rolls. Forty reward tests, typecheck and mobile loss/payment/reload/report filing pass. Coverage is now 89 explicit scenario reward paths out of 103; 14 remain. No deployment.

### Local milestone 25 — Down at the Docks cargo (#72)

Full source `06-scenarios.md:3480–3605` reviewed. Each retained crate has its own four dice and dependent finds, item quantities and value dice. Actual participant count enforces seven/two-player or ten/multiplayer crates; the multiplayer defender receives 25 gc per remaining crate, without cargo duplication. Gems may be kept or fenced for 40 gc; medicine is retained as a one-use chest or converted to D6 Herbs. Food garlic count is explicitly recorded, and hidden drugs require the discovery roll. All table results resolve to catalogue items. Worn smuggled gems affect their searching Hero’s rarity roll; hunting bolts affect crossbows only and use the consumable mechanism. Medicine Chest acquisition and source tooltip are implemented; using its later injury reroll remains through the existing explained injury-resolution controls. Eighty-two focused tests and mobile cargo/reset/reload/filing pass; typecheck passes. Coverage: 90/103 explicit scenario reward paths, 13 remaining. No deployment.

### Local milestone 26 — separate Caravan contracts and lasting consequences (#72)

Town Cryer Caravan (`06-scenarios.md:5478–5553`) records base/per-escaped/all-three payments or per-looted payments. Escaped wagons determine victory unless a recorded exception applies. Betrayal gives only loot, records the D6 rare-search penalty and a campaign-specific escort ban, shown at the next Caravan and enforced in its report with the approved explained override. Archive Caravan (`1050–1130`) preserves actual setup cargo, distinguishes merchant payment from held cargo, and enables the 20% price change only for the optional A Friend in the Business variant. Whole-purchase rounding is explicitly agreed because the source does not state it.

Lasting consequences are reconstructed from applied reports; withdrawal removes them, later report amendment cannot renew a discount, and the next actual battle start expires the optional price change. Local mobile filing verifies the saved effects, an actual 10→8 gc sword purchase, expiry back to 10 gc, and a subsequent betrayal report/escort warning. Thirty-nine model/trading tests and typecheck pass. Coverage: 92/103 explicit scenario reward paths, 11 remaining. No production change.

### Local milestone 27 — Pirate mixed-crew upkeep (#123)

Pirates retaining both Elf and Dwarf hired characters after a battle owe one additional 20 gc payment for the warband. A separate phase ledger prevents duplicate payment even when individual contracts have already been paid. Insufficient funds make no partial change; an altered amount requires an explicit reason. Removing all hires of one race waives the shared fee. Starting with it unpaid includes the remaining Elf/Dwarf hires in the existing acknowledged departure warning. A later paid surcharge blocks automatic report withdrawal from erasing that payment. The original source also requires Elf Ranger upkeep 40 gc with Dwarfs and Slayer Pirate upkeep 20 gc with Elves; both individual exceptions now apply in addition to the Pirate rule.

Fifteen local database tests pass across Pirate/ordinary upkeep, Fanatic and Trapmaster starts. The mobile flow files a real report, displays the reminder, pays 20 gc once and checks the saved log and reload state. Full ordinary suite: 1,488 passing / 114 database-dependent skipped; typecheck passes. Migration 51 is local only. No push or deployment.

### Local milestone 28 — Pirate discovery recruitment (#187)

Pirates may replace ordinary Straggler/Prisoner rewards with the printed recruitment attempt (`grade-1b-part2.md:1012–1016`). Each prisoner has two saved Leadership dice; the living Captain’s Leadership is used, with an explained special-rule adjustment available. A successful Straggler becomes a Swabbie; a failure grants none. Prisoner successes join an existing Crew with matching paid equipment and no hiring/veteran fee, or begin a zero-XP Crew with the normal free dagger and later equipment purchases. Failures and unaffordable matching kit become Swabbies. Model/group/Swabbie limits apply, with explicit release available. Ordinary prisoner gold and next-exploration Straggler help are suppressed only for this alternative. Changing discovery dice clears the old recruitment inputs.

All 1,496 ordinary tests pass (114 DB-dependent tests skipped); typecheck passes and lint retains only the existing audit warnings. Mobile browser verification files independent success/failure tests, existing Crew/new Crew/Swabbie destinations, the actual 10 gc matching-kit payment, saved equipment quantities and separate exploration log through reload. Existing report migrations save the new groups and held daggers transactionally; no new migration or deployment. Matching equipment after casualties and the other open batch work still remain.

### Local milestone 29 — casualty equipment before replacement recruitment (#176/#187)

Fixed the existing #176 prerequisite: a dead henchman loses its share of identical equipment, including multiple copies and the final member’s kit. Mixed/uneven equipment or partly used supplies require an explicit lost-copy allocation instead of guessing which models carried them. Changing injury rolls clears that allocation. The report names losses and retained quantities. Free human/Pirate recruits now match the surviving equipment, with no extra hiring/veteran fee and no accidental duplication of the casualty’s kit.

Migration 52 is local only. It permits withdrawal of unchanged new groups with the equipment awarded by the same report, and refuses to overwrite later edits to existing equipment/groups. Mobile verification files a death plus replacement and restores the original roster, gold and kit on withdrawal. Four added database tests cover new-group kit undo, changed stacks, removed rows and later group edits. The whole local database suite passes 118 tests (one unrelated five-second timeout during concurrent browser testing passed on the sequential rerun). No deployment.

### Local milestone 30 — historical exploration ordering (#66)

Discovery history now uses actual battle starts, falling back to filing dates only for legacy matches without them. Amending an old report cannot renew a consumed Straggler or bring future discoveries backwards into that report. A first draft uses its battle start even before a report exists. The signed-in local application API was verified with disposable out-of-order report history, including an amended Straggler and an earlier first draft.

Combined checkpoint: 1,506 ordinary tests pass / 118 DB-dependent skipped; all 118 local database tests pass separately; typechecked build passes; lint/build retain only the existing warnings. These are local commits, not a release. Scenario coverage remains 92/103; the eleven remaining scenario paths and bespoke hired-character cases still require work.

### Local milestone 31 — The Hunters Become the Hunted (#72)

Source `reference/rules/06-scenarios.md:5703–5766` reviewed. Actual Beastmaster starting/retained counters grant shards, separate slain-plant D6 rolls grant gold, and the winner records live/dead Cold Ones, kept mounts and sales. The ambiguous price for two live animals requires a recorded per-animal/per-lot ruling. Winning survivors receive XP per Cold One alive through the normal advancement gates. Plant victims use the scenario D6 injury rule (1 eaten, 2–6 survives), including individual group casualties and equipment loss. Changing the cause clears only that model’s old roll.

Typecheck and 102 focused tests pass. The mobile browser files an actual report with an eaten Captain and lost sword, surviving Champion XP, 127 gc from Cold Ones/plants, retained shards and persisted inputs through reload. No new migration. Coverage: 93/103 explicit scenario reward paths, ten remaining. Local only.

### Local milestone 32 — Brigands in the Pasturelands (#72)

Source `reference/rules/06-scenarios.md:1566–1620` reviewed. Role is required before XP: attackers receive 1 survival/winning-leader XP, defenders 2. Winning attackers enter separate henchman/Hero bounty dice and actual Captured injury bonuses; duplicate Hero names and missing dice block filing. Winning defenders choose one actual still-standing Highwayman, Warlock or Pit Fighter, or decline. Filing grants a named free recruitment entitlement, separate from Returning a Favour. Recruit completes normal equipment/name setup, waives the ordinary warband restriction for that reward and keeps upkeep. Campaign bans/duplicates remain enforced. Borrowed battle-only gear is not added permanently.

Six reward/recruitment/XP tests pass; typecheck passes; all 119 local database tests pass. Mobile browser filing verifies both roles, 69 gc bounty, reload persistence and actual free Warlock recruitment. Migration 53 validates the selected outlaw, records the completed hire in the report and protects a claimed report from withdrawal. The existing unique claim index prevents reuse. Coverage: 94/103 explicit scenario reward paths, nine remaining. Local only; no production migration or deployment.

### Local milestone 33 — explicit older hired-equipment review (#61/#74)

The roster now offers a per-character equipment review. It compares held quantities against the selected published kit, recognises older catalogue aliases, requires choices for alternative equipment and asks for Luthor’s original role where absent. Each missing item is unchecked by default; the user must select additions and explain the correction. Existing or bespoke equipment remains untouched and treasury gold is unchanged. Optional starting mounts can be reviewed for the standard mounted hires; an externally supplied Knight’s Warhorse is not fabricated. A restored Freelancer mount also restores Ride Warhorse.

Three model tests and typecheck pass. Mobile verification restores only a selected missing Warlock staff, verifies unchanged gold and reload, and then reports the expected equipment complete. The prior combined suite passed 1,520 ordinary tests and 119 local database tests. Also corrected the Brigands experience explanation to match its role-specific calculations. Broader bespoke kit/effect work remains; no production changes.

### Local milestone 34 — remaining ordinary Persona equipment (#61/#74)

Reviewed the actual kit output for all 72 Hired Swords and 30 Personae, then checked the remaining ordinary equipment against the scraped entries. Bertha now receives both Sigmarite hammers, Gromril armour, Blessed Water and her Holy Relic. Marianna receives actual throwing knives/crossbow pistol with the conditional garlic coating noted, rather than prose items and a wardrobe. Dijin receives two actual swords with coating notes; the Dark Jester receives the expressly equivalent club and morning star. Added explicit aliases for Cavalry Spear, Dueling Pistols, Double Handed Axe, Holy Relic, a vial of Blessed Water and Lucky Rabbit’s Foot. Existing unique magical kit is retained instead of inventing equivalent ordinary weapons.

Source: `05-dramatis-personae.md` entries for these characters and `04-hired-swords.md:2460–2485` for the cavalry spear. Twelve focused kit tests and all 1,524 ordinary tests pass; 119 DB-dependent tests skip in that run and passed separately at milestone 32. Remaining truly bespoke weapons/armour and their combat effects stay within the broader open entries. These are local changes only.

### Local milestone 35 — checked cross-warband equipment transfers (#72 prerequisite)

Migration 54 adds transactional transfers of existing equipment copies between participants in Stop Thief, Encampment Raid and the Archive Forbidden Square. A source snapshot, quantity and reason are required. The source loses those copies and the recipient receives equivalent stash equipment with the original notes. Stale snapshots, repeated stacks, unrelated scenarios and nonparticipants are rejected. Encampment claims require victory and source stash equipment. Withdrawal restores the original source identity/holder/quantity and removes the awarded recipient copies; later changes on either side block automatic undo.

All 124 local database tests and typecheck pass, including five added transfer/rollback tests. This is shared infrastructure; the scenario-specific forms and remaining reward branches are not yet complete, and scenario coverage remains 94/103. No production migration or deployment.

### Local milestone 36 — Gathering of the Horde control (#72)

Source `06-scenarios.md:3811–4000` reviewed. Reports record whether Dirk/Valnor was taken out or the game ended by routing. Winning reports choose an agreed winning controller of Executioner’s Square; multi-warband hordes require a written agreement because the source does not divide control among allied warbands. The map waits for all reports to be applied, confirms matching endings/controller and replaces prior footholds with that controller. Disagreements remain visible as map notices instead of guessing. A rout uses only ordinary map outcomes. Withdrawal removes the derived reward. Control is applied even if the battle was not assigned a district; report mutations now invalidate cached map data. No additional treasure is invented. Existing explicit scenario XP interpretation/objective controls remain available.

Fifty-eight focused reward/map tests and typecheck pass. Mobile filing preserves the controller through reload; the signed-in map API verifies no premature takeover, actual control after the other report, and removal on withdrawal. Coverage: 95/103 scenario reward paths, eight remaining. No new migration or deployment.

### Local milestone 37 — Archive Forbidden Square (#72)

Source `06-scenarios.md:1139–1227` reviewed. Uses the actual setup counter count with no artificial eight-counter ceiling. Infiltrators gain shards carried through the gate; cultists’ sacrificed counters count for scoring but do not enter their stash. The source does not explicitly settle permanent weapon-counter ownership, so a required table agreement chooses original owners or actual recovered ownership. Only selected existing weapon copies are transferred, with named reasons; placement alone does not delete equipment. The shared transfer picker is reusable by the remaining scenarios.

Migration 55 checks agreement on the setup total and prevents combined applied report scores from exceeding it. Forty-three focused tests and typecheck pass; all 125 local database tests pass. Mobile filing saves 14 starting counters, 11 carried shards and one recovered existing sword through reload, verifies the actual source/recipient quantities, rejects an overclaimed opposing score and restores both inventories on withdrawal. Coverage: 96/103 reward paths, seven remain. No production migration or deployment.


### Local milestone 38 — Imperial Tactician plate armour (#61/#74, not deployed)

The printed `plate armour (4+ save, -1M)` now resolves to a distinct catalogue item with a 4+ save, its own unconditional movement-penalty rule and no ordinary shop availability. Source: `reference/rules/04-hired-swords.md:2487–2503`, Fanatic Online 94. It is not aliased to lamellar armour. New hires receive usable armour; combat also recognises the exact old custom equipment line without rewriting player inventory. The equipment-review matcher recognises the old alias, preventing a duplicate restoration. Unidentified custom armour remains unresolved.

The saved base Movement remains 4; the combat assumptions explicitly instruct the player to reduce Movement by 1 while this armour is worn. This is not a new generic automatic movement-penalty system. Broader bespoke kit/effects remain open.

Validation: 70 focused recruitment/equipment/combat tests pass; the production build and lint pass with the existing warnings. Full ordinary run passed 1,534 tests with one expected catalogue-count failure after adding the new item; after correcting the source-reference whitelist and catalogue counts, all 7 catalogue tests pass. Combined verified coverage is 1,535 ordinary tests; 125 DB tests were skipped in that ordinary run and were not rerun for this catalogue-only change (previous 125-test DB checkpoint stands). No production changes.

Overnight continuation is authorised, including the final single deployment when the complete batch is ready. Automation `finish-stirheim-overnight-batch` continues this task; pause it once deployed and verified. Latest #221–226, reopened #23 and #54 prompt follow-up remain queued for tomorrow, outside this batch. Seven scenario paths still remain; no scenario completion count was advanced for this kit correction.

### Local milestone 39 — Encampment Raid equipment reward (#72, not deployed)

Sources: `reference/rules/06-scenarios.md:3610–3662` and optional encampment introduction `03-campaigns-magic-optional-rules.md:4000–4012`. The report now records attacker/defender, actual camp capture, named defender/camp, and destruction or occupation; occupation requires explicit settlement eligibility. Defending or unsuccessful reports cannot claim loot. The victorious attacker reviews and confirms the complete current equipment stash, including an empty stash. Every existing stack moves in full; carried equipment is excluded. The SQL application checks the whole reviewed inventory, rejects new/omitted/partial stacks, validates current snapshots and prevents a second capture claim in the same battle. Existing ownership-safe withdrawal restores original item IDs, quantities and holders.

The optional housing system is not implemented: camp benefits and the defender’s new Housing-chart roll remain explicitly recorded follow-up, not silently awarded. “Stash” is implemented as equipment stored in the app’s stash; treasury gold/wyrdstone is not transferred by this action. The form and report state this boundary and retain reason-recorded adjustments for a wider table interpretation. Do not equate this reward path with full optional encampment automation or close broader #72 on that basis.

Migration 56 is applied locally only. Four new resolver regressions and two transaction regressions; full validation **1,539 ordinary tests pass / 127 DB tests skipped there; all 127 local DB tests pass separately**. Typechecked build and lint pass with the same existing warnings. Actual mobile report form at 390×844 persists camp/eligibility/stash review across reload, files two existing swords into the attacker stash, and restores the original stack on withdrawal, with no page errors or horizontal overflow. Script: `/tmp/stirheim-encampment-mobile-qa.mjs` (also current `/tmp/stirheim-rules-qa.mjs`). Source changes remain local.

There are now 97 explicit reward paths; the six without an implemented path are Defend the Oasis, Assault on the Rock, The Thing in the Woods, Stop Thief, Raids and Rawhide. Broader optional camp consequences remain a stated limitation of the new Encampment Raid path. Next work should prioritise those remaining scenario paths, including actual source-owned currencies/items for Stop Thief/Rawhide, rather than count incidental kit fixes as scenario completions.


### Local milestone 40 — Assault on the Rock loot foundation (not wired; #72 remains open)

Read the complete TC22 scenario at `reference/rules/06-scenarios.md:3023–3082`. Added `model/rockLoot.ts` and five regressions for its actual room-search table: named recorded searches; 1–2 no reward; 3–4 one Blessed Water; 5 one common **core rulebook** catalogue item, excluding supplement-only/common and rare entries; 6 a Holy Relic, optionally desecrated only by an eligible chaotic/evil warband after its named leader passes an Initiative test (natural 6 fails). Failed searches and desecration dice are logged. Changing the search die ignores old dependent choices. Sisters cannot loot. Holy/unholy variants retain the shared catalogue id and distinct display names. All five tests and typecheck pass.

This helper is deliberately not yet dispatched from `scenarioRewards`: do not expose a partially supported Rock report as complete and do not increase the 97-path count. Next continuation should finish the Rock reward flow around it, rather than re-audit this table. Remaining Rock work: a distinct two-spell tome (ordinary Tome of Magic teaches only one); eligibility excludes Sisters/Witch Hunters/warbands containing a Priest of Morr; retain actual surviving conscripted Sisters and their declared two-hammer or hammer/whip kit within roster limits; Sisters’ 100gc/+2 Matriarch XP; Witch Hunters’ 50gc and +2 XP per Augur/Matriarch OOA; the book-destruction D6 XP allocation across eligible warriors. Keep ordinary +1 tome-carrier objective XP separate to avoid double awards. Source wording on the scope of rewards should be recorded explicitly, not silently conflated with generic winner-only rewards.

Useful existing integration: `deriveXp` accepts `LocationXpAward[]` keyed by participant id and feeds both warrior and group extras; `derive.ts:827` currently combines exploration and Kidnapped awards before `buildApplied`. `scenarioRecruits.ts` provides source-constrained new-group creation with capacity and UUID checks; `ReportApplied.awarded_items` can give each new group its declared gear and is already transaction/withdrawal-tested. `grimoires.ts` only supports one spell and its ordinary Tome flag is unsuitable for calling twice without a deliberate two-spell plan. The new scenario tome must not simply award two ordinary Tome copies or allow two different readers. Broader Rock UI/persistence verification is still outstanding. No migrations or production changes in this milestone.


### Local milestone 41 — Assault on the Rock rewards and safe tome use (#72, not deployed)

The TC22 reward flow now records actual room searches, winner-specific rewards, and surviving conscripted Sisters with their declared equipment. Sisters receive 100gc and eligible Matriarch XP; Witch Hunters receive 50gc and recorded Augur/Matriarch kill XP; eligible book destroyers allocate the actual D6 XP. Ordinary winners receive one distinct tome. Reading teaches two validated spells to one eligible reader in a single saved action and retains the used book, preventing reuse. Ordinary objective XP remains separate. Migration 57 prevents a second winner claiming the book reward in the same battle.

The combined mobile report/read/withdraw test exposed unsafe withdrawal after a stash reward had been used. Migration 58 now snapshots all newly awarded stash items, so later movement, use, sale or changes block withdrawal instead of leaving subsequent benefits behind. Unchanged rewards remain withdrawable. Both migrations are local only.

Validation: all 129 local database tests pass. The latest ordinary suite passed 1,554 tests; build/typecheck and lint passed with the existing warnings. Actual mobile report journeys verify Sister recruitment/equipment and Witch Hunter rewards with successful withdrawal; the ordinary tome journey verifies two learned spells, saved used-book ownership, persistence through reload, and refusal to withdraw after use. No production changes.

Scenario reward coverage is now 98/103. Remaining: Defend the Oasis, The Thing in the Woods, Stop Thief, Raids and Rawhide. Broader optional systems and bespoke hired-sword limitations remain open; this count does not imply complete automation of every scenario rule.

Latest user authorisation: after the complete main batch is pushed, deployed and verified, continue fixing queued #221–226 and #23/#54 follow-ups as a second batch. Keep menu layout proposals available for user review. Avoid intermediate production deployments.


### Local milestone 42 — Stop Thief actual equipment settlement (#72, not deployed)

Fanatic Magazine 7 (`reference/rules/06-scenarios.md:1795–1848`) now has a report form for the agreed setup defender and stolen equipment. The defending winner reviews one actual original copy per attacker, its recorded full value and selection/valuation reason, then sells it for half value rounded down or records an allied return. The sale removes the source copy without creating a retained duplicate. Attacking winners record their actual 2D6 valuables and recovery; recovery awards the participating leader one XP through normal survival/advancement handling. Equipment that remained on its original roster is not manufactured again; copies currently held by the defender can be transferred back. Temporary Halfling Thief services do not create a permanent free hire.

Migration 59 adds equipment sales, source snapshots, duplicate-sale protection and agreement checks. Reports cannot disagree on the defender or record both recovery and sale, in either filing order. Withdrawal restores source ownership/quantity and gold using existing transaction checks. Setup highest rating, portable/magic-item selection and unpriced-item valuation require explicit review of the actual pre-battle agreement; the app does not reconstruct historical setup inventory from current values.

Validation: 1,559 ordinary tests pass; all 132 local database tests pass separately. Typechecked production build and lint pass with existing warnings. Both mobile flows at 390×844 persist through reload and withdraw correctly: defender sells one of two original swords for 5gc on an agreed 11gc valuation, and attacker recovers an unchanged original sword with 7gc and exactly one additional leader XP. No horizontal overflow or page errors. Scripts: `/tmp/stirheim-stop-thief-mobile-qa.mjs` and `/tmp/stirheim-stop-thief-attacker-mobile-qa.mjs`. Migration remains local, no push or deployment.

Scenario reward coverage: 99/103. Remaining paths are Defend the Oasis, The Thing in the Woods, Raids and Rawhide. Pending broader kit/Guardian/Medicine Chest work and final release verification remain as recorded above.


### Local milestone 43 — Raids rewards, pursuit and lasting consequences (#72, not deployed)

Archive Pestilen source `reference/rules/06-scenarios.md:490–622` reviewed. The report records actual jewellery (5gc each), captured Inhabitants/Townsmen (three/one per future resource), burned buildings, covering-tracks D6 and the consequent ambush. Random selections are without replacement from returning surviving henchmen; surrendered models are excluded. Each selection and injury die is logged and applies normal unit-specific henchman injury rules. Casualty equipment is removed through the checked existing group-loss flow. Setup eligibility is confirmed or accompanied by an agreed exception; village searches remain tabletop actions whose actual retained jewellery is entered, not automatically rerolled after battle.

Surrender keeps warriors and their equipment but excludes them from the next two battles. Partial groups retain full roster size and per-model equipment while battle/casualty controls expose only available members. Later report injury losses preserve the absent members. Counters expire after two reports, including hired swords, and withdrawal restores them. Migration 61 prevents absent Fanatics consuming mushrooms or owing their post-battle mushroom roll, and correctly distributes absence cohorts if a legacy multi-model Fanatic group is split.

Migration 60 reconstructs captured resources from applied reports in battle order, forbids spending the current Raid’s award, rejects overspending and historical use of a later award, and blocks withdrawal of already-spent resources. The warband shows the balance; future Exploration offers an explicit one-resource/one-extra-die spend, including when no heroes are available. Use is logged and withdrawal returns the resource. No warrior is recruited for this resource.

Mobile verification exposed a long non-shrinking exploration label that widened a 390px phone layout to 645px and made File report inaccessible. Labels now wrap; the dice explanation sits below its row. Verification compares against the actual 390px device width, not merely an already-expanded layout viewport. Normal taps file the report successfully.

Validation: **1,568 ordinary tests pass; all 135 local database tests pass**. Typechecked build and lint pass with existing warnings. Disposable mobile flows cover the complete Raid (15gc, one resource, one pursuit casualty and one surrendered group member), resource spending/reload/withdrawal dependency, and partial-group availability/timer/kit preservation. All use normal UI actions and check actual saved records. Scripts: `/tmp/stirheim-raids-mobile-qa.mjs`, `/tmp/stirheim-raids-resource-mobile-qa.mjs`, `/tmp/stirheim-raids-absence-mobile-qa.mjs`. The current `/tmp/stirheim-rules-qa.mjs` is the complete Raid flow. No production changes.

Coverage is now **100/103 scenario reward paths**. Remaining: Defend the Oasis, The Thing in the Woods, Rawhide. Broader kit, Guardian, Medicine Chest and final release checks remain as recorded above. Migrations through 61 are applied locally only.


### Local milestone 44 — Rawhide private cargo and transaction foundation (not yet a complete reward path)

Source `reference/rules/06-scenarios.md:633–696` reviewed. Migration 62 stores the merchant’s private pre-battle choice (all current gold/wyrdstone in one of four wagons, or explicitly empty), agreed full valuation and rounding. Only the merchant owner can edit it before battle. Opponents, including an opposing GM, receive only declaration status until battle ends. Starting checks the snapshot and reserves loaded resources against spending; visible treasury balances remain unchanged to avoid exposing the loaded/empty choice. Cancellation releases the reservation. Account-specific query keys and remounting prevent private drafts/cache being reused across sign-ins.

Migration 63 adds report-transaction settlement: escaped cargo is replaced by 130% sale proceeds, captured cargo is deducted from the merchant and transferred once to the capturing participant, and empty wagons award nothing. A second claim or contradictory recipient/outcome is rejected. Withdrawal checks both current treasuries against saved post-settlement snapshots, reverses cargo together with same-report spending, and restores the original reservation. Both migrations are applied locally only. The report-form integration is still outstanding: **do not deploy this foundation alone**, because loaded cargo needs the completed user-facing settlement path. The modern per-warrior/leader XP flow also remains to wire; the legacy 20/5 XP appendix must not become the modern default.

Validation: all **144 local database tests pass**, including nine Rawhide tests for secrecy, stale snapshots, empty wagons, captured/escaped settlement, duplicate claims and withdrawal after spending. Four pure settlement tests pass. Typechecked build and lint pass with existing warnings. Actual 390px mobile declaration saves the wagon/valuation, survives reload, locks at start, preserves visible balances and fits the screen without page errors. Script: `/tmp/stirheim-rawhide-declaration-mobile-qa.mjs` (also current `/tmp/stirheim-rules-qa.mjs`). No production changes.

Related small corrections: Fanatic supplies now show only available models and their accessible doses; wholly absent groups do not contribute held supplies. Generated local API types were refreshed; Snake Hunt omits optional unset arguments so SQL null defaults remain unchanged.

Coverage remains **100/103**, pending the complete Rawhide report form and modern XP, The Thing in the Woods and Defend the Oasis. Other batch limits and final release checks remain open. Next continuation should complete Rawhide integration rather than count this foundation as scenario completion.
