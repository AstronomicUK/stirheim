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

## Current checkpoint — 11 September, local batch

**The agreed Between Battles batch is deployed and served assets are verified.** Released commit `904e2a8` in the single Netlify production deployment `6aa3800220c409a532e3f32e` on 11 September 2026. One Git push and one production deployment were performed; automatic Netlify builds stayed paused.

All **33 migrations (39–71)** applied successfully to production, without reset or seeding. A subsequent linked dry run confirms no pending migrations. Final local verification: **1,672 ordinary tests, 166 database tests**, build/typecheck/lint passing with documented existing warnings. All **98 served HTML/JS/CSS files** match the tested production build byte-for-byte; sign-in/campaigns/battles routes respond successfully. No live player history was changed for testing. Hosted CI run `34561410564` was still running at this checkpoint; its separate result is not claimed green.

There are **102 implemented scenario reward paths**. Tom explicitly deferred the remaining Khemri-dependent Defend the Oasis aftermath and the full Khemri campaign system to very low-priority future upgrade **#227**, including an optional campaign setting that controls available scenarios. Approved overrides, source-ruling choices and intentionally custom equipment remain as described in the release checklist.

The 20 original tracker entries now carry release evidence within their agreed scope. Pre-existing dirty audit/tracker work is preserved. Post-deployment evidence is committed locally only to honour the single-push release; carry these documentation changes with the next batch's eventual push.

**Next authorised work:** check the hosted CI result, then queued #221–226 and reopened #23/#54 follow-ups as a second batch. Menu redesigns need proposals before implementation. Continue using disposable local test records; avoid intermediate Netlify deployments.

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


### Local milestone 45 — Rawhide report settlement (#72, not deployed)

The report form now uses the saved cargo declaration after battle ends. The merchant settles an escaped or explicitly empty wagon; the capturing opponent settles captured cargo. Other participants record where the cargo was settled without claiming it again. Report review includes the actual cargo delta while ordinary treasury deltas exclude it, preventing duplicate payment. Free-recruit affordability includes available cargo proceeds. Migration 64 persists server-calculated display deltas rather than trusting submitted totals; migration 65 prevents completion while reserved cargo remains unsettled. Both are applied locally only.

The existing Experience controls already expose the correct modern named +1 leader/driver/stopping awards. Added regression coverage confirms those four awards and the ordinary survival/leader/kill defaults, with no historical 20/5 XP awards. Corrected the generated objective summary that incorrectly displayed the historical appendix as a wyrdstone objective. Actual tabletop achievements remain selected for the named warrior in Experience. Loaned wagons, mounts and spears never become permanent equipment. Older/imported battles without a declaration retain an explicit reason-recorded manual reconciliation, with no invented cargo or automatic transfer; declared battles cannot use that fallback.

Validation: **1,578 ordinary tests passed**, followed by focused model/aftermath coverage including the added legacy override (combined ordinary coverage 1,579); all **146 local database tests pass**. Typecheck, production build and lint passed with existing warnings. Actual 390px mobile journeys cover declaration, reload, lock at start, escaped sale and captured transfer, report persistence and withdrawal to the original resources. Scripts: `/tmp/stirheim-rawhide-escaped-mobile-qa.mjs` and `/tmp/stirheim-rawhide-captured-mobile-qa.mjs`; current `/tmp/stirheim-rules-qa.mjs` is the captured flow. No production changes.

Coverage is now **101/103 scenario reward paths**. Remaining: The Thing in the Woods and Defend the Oasis. This is reward-path coverage, not full scenario combat automation. Broader bespoke kit, Guardian, Medicine Chest and the final combined release checks remain open. Continue The Thing in the Woods / Medicine Chest while the Oasis scope question remains unanswered; do not infer approval of a full Khemri expansion.


### Local milestone 46 — Medicine Chest injury reroll (#72, not deployed)

Down at the Docks source `06-scenarios.md:3587` reviewed. An existing chest can now replace a Hero/Dramatis Persona Serious Injury result. The original and replacement D66, plus any original follow-up/district test, remain in the saved injury record. Replay applies only the replacement; later dependent rolls are cleared and a replacement cannot be rerolled with another chest. Only available copies are offered, and multiple patients cannot overuse a stack. Ordinary hired-sword D6 and scenario replacement D6 injuries do not offer this Hero-table item.

Captured, Sold to the Pits, robbery, full recovery and unrelated reward/event results are excluded; actual physical/mental injury results (including death, Multiple Injuries and Horrible Scars) are eligible. The source’s “etc” is treated as excluding non-medical events; approved explained injury overrides remain available for table rulings. Multiple Injuries results already subject to its mandatory reroll cannot spend a chest for that reroll. The existing D6 Healing Herbs acquisition alternative remains separate from retaining a chest.

Migration 66 validates the exact reviewed stock and matching consumption patch inside report application. A stale second report cannot reuse a spent copy. Existing checked item withdrawal restores the original stack and refuses to overwrite later consumption. Migration is local only.

Validation: **1,585 ordinary tests and all 149 local database tests pass**. Typecheck, build and lint pass with existing warnings. Actual 390px mobile flow replaces Leg Wound 22 with Full Recovery 41, reloads with both results visible, files one consumed chest without reducing Movement, and withdraws to the original chest/XP. No horizontal overflow or browser errors. Script: `/tmp/stirheim-medicine-chest-mobile-qa.mjs` (also current `/tmp/stirheim-rules-qa.mjs`).

Coverage remains **101/103 scenario reward paths**; no additional scenario was counted for completing this existing Docks consequence. Next: The Thing in the Woods; Defend the Oasis still has the pending scope question. Bespoke hired kit/Guardian and final release checks remain open. No push or production deployment.


### Local milestone 47 — The Thing in the Woods curse foundation (not yet a reward path)

Full source `06-scenarios.md:6501–6575` reviewed. Added `model/lycanthrope.ts`: explicit survival/man-sized/non-mutant eligibility; curse only on D6 6; reviewed healthy profile and injury-condition removals; later transformation return on 2–6 and permanent departure on 1; original equipment disposition without creating replacement weapons. The fixed Balewolf profile keeps A2 plus its separate first jaws attack. Cure preserves unrelated flags (including disease, innate effects and pit/capture obligations), current equipment, XP and skills, and retains an existing curse’s original acquisition battle. Old injury records cannot reliably reconstruct every stat reduction/floor, so the player must review the healthy profile rather than accept guessed characteristic increases.

Added a persisted curse field to warrior flags and a named cursed-member subset to henchman campaign state. The group remains one XP group; do not split it into new recruit groups and accidentally duplicate kit or advancement rolls. The group aftermath helper removes only the named cursed injury casualties or feral departures, checks the remaining subset fits the surviving size, and keeps uncursed members unaffected. Equipment losses return explicit quantities so a single cursed henchman need not delete an entire group stack.

Eight focused curse/cure/equipment/group tests pass; typecheck and lint pass (existing warnings only). **The helpers are not yet wired into reporting or battle UI. Coverage remains 101/103.** No database migration, push or deployment for this foundation.

Next integration: add report draft choices and injury-step controls for actual Balewolf casualties/eligibility/D6, including individual group survivors; apply reviewed Hero/Persona cures before XP/advancement projection; keep named group curse subsets in existing campaign state. For every previously cursed participant in later battles, record actual transformation and the return D6, and review actual worn equipment/dropped weapons with quantity-safe item patches. Apply feral departures before new advances are planned. Provide the Balewolf rule/profile reminder in roster/battle views without claiming automated monster AI or automatic wound-triggered transformation. Fear of the Dark escapees require no Serious Injury roll; preserve the source distinction from actual attack casualties. Generic Experience controls already handle the named extra Thing-OOA award in addition to ordinary enemy-OOA XP; verify it explicitly. Complete model/DB/mobile persistence/withdrawal tests before adding this scenario to the reward coverage count. Defend the Oasis scope question and remaining hired kit/Guardian/release checks are still outstanding.


### Local milestone 48 — The Thing in the Woods report integration (not deployed)

The report now distinguishes Fear of the Dark escapees from attack casualties, records curse eligibility and D6, and applies the reviewed healthy profile on a curse result of 6. Previously cursed warriors record actual later transformations, return rolls and the fate of their original equipment. Named cursed henchmen remain in their original XP group; permanent feral departures remove only that member and their reviewed equipment share. Recovered original weapons return to the stash. Departing heroes cannot explore or receive pending advances. The extra Thing kill XP remains cumulative with ordinary enemy kill XP.

Roster and battle views show the curse profile and rules. Transformation triggers, monster movement and combat remain tabletop decisions; this does not claim automated Balewolf combat. Migration 67 locks and checks the original equipment snapshot before applying losses, so a stale report cannot overwrite changed equipment. It is applied locally only.

Validation: 1,599 ordinary tests and all 152 local database tests passed; the latest focused 79 tests also pass after excluding feral departures from exploration. Typechecked build and lint passed with existing warnings. Disposable 390px mobile checks verify curse acquisition/healthy-profile review through reload and withdrawal, and a later named henchman transformation with one recovered sword, persisted group reduction and complete withdrawal restoration. Scripts: `/tmp/stirheim-lycanthrope-cure-mobile-qa.mjs` and `/tmp/stirheim-lycanthrope-group-mobile-qa.mjs`.

Reward-path coverage is now **102/103**. Defend the Oasis still awaits the recorded scope decision; bespoke hired equipment/effects, Guardian and final combined release checks remain outstanding. No push or production deployment.


### Local milestone 49 — Merchant Guardian interception (#184, not deployed)

Source `reference/rules/04-hired-swords.md:1850–1862`: a Guardian intercepts shooting/charges at its Merchant unless already engaged. Combatant records now link a bodyguard to its own Merchant through the persisted hire contract; missing legacy links are not guessed. Before beginning attacks against a protected Merchant, the player directs the attack at the bodyguard or records why interception does not apply (such as existing engagement or ongoing melee). Engagement and tabletop position are not tracked, so this is an explicit reviewed decision rather than an invented automatic positioning rule. Changing target uses the bodyguard’s actual profile/equipment. Each new attack sequence asks again; out-of-action bodyguards do not trigger the check.

The decision is included both in saved roll attempts (including misses) and in shared damage-event logs. Approved reasoned exceptions remain available. Existing Guardian objective/search/loot restrictions and shared upkeep remain unchanged.

Validation: actual 390px mobile workflow verifies the initial gate, target redirection, required explanation when keeping the Merchant, and persistence of both decisions in completed missed-attack logs. Disposable local fixtures are removed afterward. Script `/tmp/stirheim-guardian-mobile-qa.mjs`. Typecheck passes; combatant mapping tests cover correct and missing contracts. No new migration, push or deployment. Remaining work is Defend the Oasis scope, bespoke hired equipment/effects and source ambiguities, plus final combined release checks.


### Local milestone 50 — Albion protective equipment and casting staff (#61/#74, not deployed)

Source `05-dramatis-personae.md:579–581,821–823`: The Spiral grants an unmodifiable 5+ save, The Triskele an unmodifiable 4+ save, and the Staff of Darkness adds +1 to casting rolls. All three now have unique non-shop catalogue records and operational effects. New recruitment saves those IDs; exact old custom names remain recognised without rewriting equipment. These icons are miscellaneous protective items, so they do not prevent spellcasting as body armour would. Zero-quantity copies grant nothing. The Staff of Light remains the existing halberd with a dispel reminder; its once-per-turn dispel still needs the appropriate shared usage ledger and is not claimed complete here.

Validation: all **1,605 ordinary tests pass** (152 database-dependent tests skipped in this run; last separate DB run passed all 152). Typechecked build and lint pass with existing warnings. Tests exercise high Strength and armour-ignoring attacks retaining both wards, recruitment/non-shop availability, and new/legacy casting equipment. The 390px mobile casting check displays the automatic Staff of Darkness bonus and fits the viewport (`/tmp/stirheim-albion-mobile-qa.mjs`). No migration or production changes.

A fresh executable equipment inventory is saved in `docs/HIRED-KIT-REMAINING-2026-09-11.md`: 27 character/role entries with unmapped equipment. Some are descriptive or tabletop-only; this is not a count of missing combat rules. Review them against source before implementation, and also inspect effects hidden behind ordinary mapped equipment (for example Staff of Light and Luthor’s alternate sword use). This replaces the vague remaining-kit label with an actionable list. The inventory probe was temporary and removed after generating the document.


### Local milestone 51 — Aenur, Ninja weapons and two cloaks (#61/#74, not deployed)

Source reviewed: `05-dramatis-personae.md:184–194` and `04-hired-swords.md:1224–1232,1588–1594,2568–2574`. Ienh-Khain now supplies +1 Strength, parry and natural 5–6 criticals; Aenur’s own Invincible Swordsman rule supplies the fixed 2+ melee hit roll. The Ninja Gnoblar’s Bo adds one attack after Frenzy, parries and occupies both hands. Shurikens use the throwing-knife engine profile with their distinct Stealthy description/reminder. New recruitment saves operational catalogue equipment; old exact sword/Bo/shuriken names remain recognised. Unique items remain outside the ordinary shop.

Thief’s Cloak now applies -1 to enemy missile hit rolls only. Hunter’s Cloak explains its shooting-while-hidden Initiative check in the combat assumptions. Hiding, spotting distances and visibility remain tabletop decisions and are not claimed automated. The source’s doubled spotting-distance wording for the Thief is retained rather than silently corrected. Weapon equipment notes now reach combat assumptions instead of being bypassed by weapon mapping.

Validation: **1,611 ordinary tests pass**, typechecked build and lint pass with existing warnings. Source-to-combat tests cover Aenur’s trait, actual critical faces and Strength/Mighty Blow interaction, Bo attacks after Frenzy and blocked off-hand selection, legacy aliases, missile-only cloak effects and shuriken reminders. A disposable 390px mobile battle exposes the Bo as the selected usable weapon without an off-hand selector or overflow (`/tmp/stirheim-hired-weapons-mobile-qa.mjs`). No migration, push or deployment.

Remaining equipment inventory now lists 23 character/role entries; see `HIRED-KIT-REMAINING-2026-09-11.md`. Staff of Light dispel, other mapped-item special effects, unresolved source identities/maxima, Defend the Oasis scope and final combined release checks remain open.


### Local milestone 52 — Drenok, Abdul and Gwen’s named equipment (#61/#74, not deployed)

Reviewed `05-dramatis-personae.md:497–503,647–659,1160–1170`. The Icefang Axe is now a double-handed +2 Strength weapon with parry and +1 injury, combined correctly with skill modifiers. Sabertooth Tiger Hide gives ordinary 6+ melee / 5+ missile armour. The Eye Pendant gives an unmodifiable 4+ ward; its Undead Leadership prerequisite is explicitly reminded, not automatically rolled. Black Nomad Robes resolve to existing Nomad Robes (weather remains the existing tabletop system). Gwen’s Rolling Pin is a cudgel with +1 Strength and Concussion. Her unspecified plural “Knives” remain custom instead of guessing a throwing profile or quantity. An unrelated custom “rolling pin” does not automatically acquire Gwen’s special bonus; old copies can be reviewed through the existing equipment correction flow.

Integrating Drenok also fixes #59’s Strongman omission in strike-order advice: either combatant’s double-handed strike-last penalty is removed when Strongman is present. Other strike-last weapons remain affected. This does not close #175’s broader selected-defender-weapon and first-strike ambiguity.

Validation: **1,616 ordinary tests pass**, typechecked build and lint pass with existing warnings. Tests cover Strength and injury combinations, phase-specific armour/ward saves, source kit, Strongman on attacker/defender and an unrelated strike-last counterexample. The disposable 390px Icefang mobile check passes (`/tmp/stirheim-icefang-mobile-qa.mjs`). No migration, push or deployment.

The unmapped equipment inventory now has 21 character/role entries. Broader character abilities are not automatically completed by mapping their kit. Continue remaining source/equipment checks, Staff of Light’s usage ledger and final combined release checks while the Oasis scope question remains pending.


### Local milestone 53 — Veskit combat kit and No Pain (#61/#74, not deployed)

Full source `05-dramatis-personae.md:454–468` reviewed. Veskit’s unique claws use fixed Strength 5 and -3 weapon save modifier, without adding another attack to the printed A4. They supply two parry attempts without borrowing Master of Blades’ beat-or-match benefit. Built-in Warplock Pistols shoot every turn. Exact legacy claw-assembly records expose the built-in pistols without duplicating a separately recorded pistol item. New hires save distinct catalogue IDs. The metallic body provides its intrinsic 3+ armour save, subject to ordinary modifiers, independent of carried armour.

Veskit’s No Pain is separate from ordinary Undead No Pain: injury-chart knocked-down and stunned results are ignored; wounds are still lost and OOA still applies. Pure probabilities, multiple-wound injury rolls and the interactive dice flow agree. The manual spell-damage helper also offers this explicit injury rule. Other special effects that knock a model down without an injury-chart roll are not silently suppressed.

The result screen now allows actual wound loss to be logged even when the associated injury is ignored, and does not describe that damage as an earlier miss. The shared event stores wound loss and no OOA, with the No Pain explanation in its rolls. Mobile verification used a disposable 390px battle and checked the actual saved event (`/tmp/stirheim-veskit-mobile-qa.mjs`).

Validation: the full suite passed **1,623 ordinary tests**; a subsequent regression for an earlier miss followed by an ignored injury passes with all 44 roll-through tests. Typechecked build and lint pass with existing warnings. No migration, push or deployment. The remaining unmapped inventory has 20 character/role entries; larger mapped-item effects, source ambiguities, Oasis scope and combined release checks remain outstanding.


### Local milestone 54 — lantern rig and Hillman man-form armour (#61/#74, not deployed)

The Dwarf Treasure Hunter’s Lantern Rig now resolves to a catalogue item with its hands-free +4-inch spotting reminder. The Cursed Hillman’s Heavy Fur Cloak now supplies its printed ordinary 6+ melee / 5+ ranged save in his man-form loadout. Recruitment and exact legacy custom names both resolve correctly; neither item enters the ordinary shop. Source: `04-hired-swords.md:1016–1028,2200–2202` and the normal lantern rule. Visibility distances remain tabletop decisions. This does not implement the Hillman’s separate wolf transformation: the combat reminder explicitly states that all equipment is discarded in wolf form and recovered afterward. Do not treat that broader ability as complete.

Validation: 56 focused equipment/catalogue/combat tests pass; typechecked production build and lint pass with the existing warnings. No database change, push or deployment. Remaining unmapped equipment inventory: 18 character/role entries, plus the separately listed mapped-item abilities and release gates.


### Local milestone 55 — shared Staff of Light dispelling (#61/#74, not deployed)

The Truthsayer now carries an operational Staff of Light (halberd profile), with exact legacy halberd/Staff of Light notes still supported. Opposing dispellers include active hired characters and exclude bearers marked out of action on the supplied shared sheets. The casting flow names the bearer and lets the player select an available dispel source. Blessed by Morr asks the player to confirm its bearer-target/Undead prerequisite. Automatic spells can be opposed by fixed-threshold dispels without inventing a numerical Difficulty for Runestones.

Migration `20260911000068_staff_of_light_dispels.sql` adds a match-wide, readable attempt ledger and a serialized RPC. Both successful and failed staff attempts consume the allowance for that bearer and shared player turn. It checks participating opponents, carried equipment, turn identity, permission and D6 input; concurrent requests cannot double-spend. Exact retries return the original entry even after turn advancement. Records retain bearer, spell, roll and manual/app provenance, and are shown in the shared combat log after reload. The UI waits for persistence before continuing, retries the same result after a save error, and requires shared turn order when an opposing staff is present. Source visibility/target prerequisites remain tabletop confirmations, not guessed geometry. Do not treat this as implementing every other dispel item or spell.

Validation: **1,628 ordinary tests and 156 database integration tests pass**; production build/typecheck and lint pass with existing warnings. The disposable 390px mobile check (`/tmp/stirheim-staff-mobile-qa.mjs`) casts, fails the opposing hired Truthsayer’s dispel, verifies the saved entry and shared log after reload, then switches to another caster and confirms the spent staff is not offered again. No overflow or page errors. Migration 68 has been applied only to local Docker Supabase; no production migration, push or deployment. The local migration ledger has not been reset or blindly advanced.

Remaining: the 18-entry unmapped hired kit inventory and separately identified character abilities/ambiguous sources; Defend the Oasis scope awaits the earlier question; final combined release review and the single production release. Scenario reward coverage remains 102/103 paths. The second feedback batch stays queued until the main release.


### Local milestone 56 — Maximilian’s weapon and Frenzy control (#61/#74, not deployed)

Reviewed `05-dramatis-personae.md:753–763`. Maximilian’s named Holy Weapon now supplies the normal double-handed +2 Strength, occupies both hands, and adds +1 to wound against the listed Undead/Possessed/Carnival/Beastmen opponents. The existing warband groups identify native listed-warband targets; existing Undead/Possessed creature traits also qualify. Unrelated Chaos warbands do not. Criticals still require natural 6 and the weapon does not gain parry or concussion. Strongman is already supplied by starting-skill extraction and removes its strike-last penalty. New recruitment and the exact legacy “double handed Holy Weapon” name resolve to the new item.

Religious Fervour now supplies Maximilian’s Frenzy. A calculator control, shown only for frenzied melee attackers, lets the player state that Frenzy has ended after being knocked down/stunned. It removes doubled Attacks without rewriting printed stats. This is an explicit current-calculation control, not automatic persistent injury/psychology tracking. His wider conditional Hatred, Leadership and nearby Fear-immunity rules remain separate work; this milestone does not close all Maximilian abilities.

Validation: the full ordinary suite passed **1,631 tests**, then all **80 focused combat/recruitment tests** passed after adding the Frenzy-ended regression. Typechecked build and lint pass with existing warnings. The disposable 390px mobile check (`/tmp/stirheim-maximilian-mobile-qa.mjs`) confirms the named weapon, occupied off-hand and usable Frenzy-ended control without overflow or page errors. No migration, push or deployment. Last separate database run remains 156 passing tests. Unmapped equipment inventory now lists 17 character/role entries.


### Local milestone 57 — named staff/hammer and explicit casting exceptions (#61/#74; #179/#180 follow-ups, not deployed)

The Norse Shaman’s Rune Staff and the hired Warrior Priest’s Hammer of Sigmar now have named equipment entries and usable ordinary bludgeoning profiles. The source lists no additional weapon bonus. The Rune Staff uses the app’s existing Staff→Club interpretation; the hammer follows the normal hammer rule. Neither inherits Sigmarite Warhammer bonuses or a permanently active Hammer of Sigmar prayer. Both Norse sword/axe recruitment choices remain intact, and exact legacy names are recognised. Sources: `04-hired-swords.md:1338–1342,1642–1646` and `02-weapons-armour-equipment.md:213–231`.

Reviewing Norse casting also resolves #179’s explicit armour exceptions: Norse Runes and the Skink Priest’s Lizardman lore may be cast while armoured. They remain spell-classified, distinct from Tom’s settled four prayer lores; unrelated known spells still receive ordinary armour restrictions and prayer-only equipment bonuses are not granted. The Norse source explicitly retains protection against spells. Source: `03-campaigns-magic-optional-rules.md:2234` and `04-hired-swords.md:1342`.

#180 follow-up: selected Sigmar prayers now filter out spell-only dispel sources (including Staff of Light and Runestones). This follows the explicit Sigmar rule at `03:2889`; no broader immunity was invented for other lores. Such prayers do not require shared turn order merely because the enemy owns a staff. An explicit future prayer-affecting source can opt in.

Validation: **1,636 ordinary tests pass**; typechecked build and lint pass with existing warnings. The disposable 390px mobile check (`/tmp/stirheim-norse-prayer-mobile-qa.mjs`) recites a Sigmar prayer against an opposing staff without a dispel or turn-order prerequisite, then starts shared round 2 and casts an armoured Norse rune which correctly offers that staff’s dispel. No overflow or page errors. Last database suite remains 156 passing tests; there is no database change in this milestone. No push or deployment. Unmapped equipment inventory now lists 15 character/role entries.


### Local milestone 58 — combined flow recheck and remaining-kit reconciliation (not deployed)

Re-ran `/tmp/stirheim-batch-recruitment-upkeep-qa.mjs` and `/tmp/stirheim-full-batch-qa.mjs` against the current local build and database. They pass Chronicler recruitment/pricing, Personae ↔ rare-item shared search allowance through reload, Luthor role persistence, unpaid-hire preview/cancel and dismissal at battle start, advancement gating/deferred rolled skills, reviewed maxima, Returning a Favour single-use recruitment, Troll sacrifice, and real saved rewards for Wizard Tower, Farm, Monster Hunt artefact, Village, Tomb Raid and Truthsayer. Treasury, XP, stash, source conditions and saved dice were checked. Reward mobile overflow assertions now require the actual 390px viewport, not merely scrollWidth ≤ an accidentally expanded innerWidth. Desktop warning/reward layouts and page-error checks also pass. Fixtures were disposable and cleaned.

A fresh all-entry custom-kit probe is saved at `/tmp/stirheim-remaining-custom-kit.json`; its temporary test file was removed. It confirmed that Barding is already a recognised catalogue item, despite the earlier combat-only inventory mentioning it. Belandysh’s ordinary Chaos Armour was still hidden in the descriptive tail and now resolves in new recruitment and exact legacy combat kit. His Broadsword of Damnation remains separate. Nicodemus’s staff now uses the existing two-handed club/parry weapon profile, with a distinct source-linked item and combat reminder: the off-hand club + active Sword of Rezhebel combination remains a separate unresolved mode, not silently granted. Source: `05-dramatis-personae.md:358–376,853` (Mordheim Annual 2002 for Nicodemus).

**Scope reminder:** original tracker #74 explicitly says bespoke gear with no catalogue entry is intentionally custom and correct as-is. Therefore the raw custom-kit inventory is not itself a count of mandatory parser fixes or release blockers. Its descriptive-only/bespoke entries must be distinguished from ordinary unresolved aliases and #61’s actual starting-skill/fee/maxima requirements. This does not close #61/#74 or erase their separately documented unfinished mechanics. Remaining source/scope decisions and original-scope reconciliation still need completion before release.

Validation for the two mapping fixes: all 58 focused equipment/combat/catalogue tests pass; typechecked build and lint pass with existing warnings. The prior full ordinary run is 1,636 passing; database suite is 156 passing. No migration, push or production deployment. Fourteen custom-equipment character/role entries remain in the mapping inventory; Nicodemus’s alternate spell mode is listed separately.


### Local milestone 59 — original-scope review and displayed gems (not deployed)

The original #66 includes more than the location gold/shard branches: Alchemist’s Notebook permanent Academic access, Training Manual permanent Combat access and +1 racial WS limit, Shrine weapon blessing, Merchant House Haggle choice, and The Pit’s selected-Hero consequence. A fresh consumer search found no implementation of the notebook/manual study actions or the named Shrine/Haggle effects. These are concrete outstanding original-scope work, unlike #74’s intentionally custom bespoke equipment. Verify The Pit’s actual outcome flow before claiming it complete. Earlier broad reward-path counts never implied completion of these exploration consequences.

Equipped Jewelsmith Quartz Stones, Amethyst, Necklace and Ruby now give their actual searching Hero +1 to rare-item rolls. The existing Smuggled Gems benefit uses the same displayed-wealth helper; quantities/multiple stones do not multiply it. Stash, sold/zero-quantity items and custom names do not grant a bonus. The shop names the displayed-gem benefit. Source: `03a-income-page-rescrape.md:319–327`. Permanent study benefits remain open and are not simulated by merely carrying a book.

Ogre Hunting Party recruitment now presents Ogre Slave Master as “Check the restriction” while no Hunter is present, explaining that the source’s “Ogre Slaver” name is not confirmed to identify this catalogue entry. With a Hunter present it remains restricted. This follows the existing player-review policy and does not silently invent a synonym. The published identity question remains unresolved; returning-Hunter departure still applies to hired Ogres.

Validation: all 72 targeted trading/recruitment tests pass; typechecked build and lint pass with existing warnings. No new database migration, push or deployment. Next work is the actual #66 consequences above, then the remaining original-scope/release review; Defend the Oasis still awaits its earlier scope answer.


### Local milestone 60 — lasting exploration-book learning (#66, not deployed)

The warband screen now offers available Alchemist’s Notebooks and Training Manuals for one living native Hero to study. The player chooses the reader; one copy is used for study instead of sale. Academic/Combat table access is saved permanently, and the Training Manual raises only the reader’s racial WS limit by one (normal global maximum 10). It does not immediately increase WS, grant a free skill or spend an advancement. The advancement panel explains the manual’s limit bonus. Study flags survive schema parsing and subsequent equipment changes; another copy cannot stack the same benefit on that Hero. Sources: `03a-income-page-rescrape.md:308–312,405–409`.

Migration `20260911000069_exploration_book_study.sql` serializes readers against the warband and actual stock, checks ownership/GM editing permission and eligible living Heroes, consumes only one copy, preserves other skill tables/flags, and records a readable reason on the item/hero audit changes. A retry of an already completed study consumes nothing. Simultaneous different readers of the last copy cannot both succeed. Hired characters and equipment held by dead Heroes are not silently offered as sources/readers. Applied only to local Docker Supabase; database types refreshed.

Validation: **1,647 ordinary tests and all 159 local database tests pass**; typechecked build and lint pass with existing warnings. Three new transaction tests cover concurrent readers, retry/quantity handling, preserved learning, missing stock, dead readers and unrelated-user denial. `/tmp/stirheim-books-mobile-qa.mjs` verifies both real study actions at 390px, reload persistence, removed used copies, unchanged current WS/skills, and no overflow/page errors; all fixtures cleaned. No production migration, push or deployment.

Next: Shrine selected-weapon blessing, Merchant’s House doubles replacing gold with the Haggle symbol (source says “instead”, not an optional extra), and The Pit’s selected Hero loss. Full source for these three reread at `03a-income-page-rescrape.md:254–262,329–355`; they remain original #66 scope. The pending Defend the Oasis scope question and final original-scope/release reconciliation remain. Keep the second feedback batch queued until the main release.


### Local milestone 61 — Merchant’s House doubles (#66, not deployed)

Merchant’s House now records the two actual D6, rather than accepting an aggregate gold amount that cannot reveal doubles. Every double awards one catalogue Symbol of the Order of Freetraders and zero gold. Non-doubles give five times the total. Changing either die clears previously chosen items/gold; changing the main exploration result clears these dice. Missing/invalid dice block filing, including legacy drafts containing only a gold total. The report records the actual dice and replacement outcome. A maximum-find benefit still needs the branch dice and gives maximum gold only on a non-double; it does not invent two natural sixes. Source: `03a-income-page-rescrape.md:329–333`.

The symbol is found-only and its tooltip carries Haggle’s full source rule: one single-item reduction of 2D6 gc to minimum 1 gc per post-battle sequence (`03-campaigns-magic-optional-rules.md:459–463`). **Its possession-based skill and once-per-sequence trading consumer remain outstanding**, shared with ordinary Haggle; this milestone completes the reward replacement, not all of #66.

The 390px `/tmp/stirheim-merchant-house-mobile-qa.mjs` check passes: missing-dice gate, non-double→double reset, reload, report filing, saved symbol quantity, unchanged gold, readable raw-dice log and no viewport overflow/page errors. Disposable local records cleaned. All 82 focused reward/report-model/catalogue tests pass; typechecked build and lint pass with existing warnings. No migration, production push or deployment. Next remaining #66 work: Haggle trading consumer, Shrine weapon blessing and The Pit’s selected-Hero outcome; Oasis scope remains pending.


### Local milestone 62 — Haggle purchase allowance (#66/#59, not deployed)

The shop now offers Haggle for an eligible living Hero who knows the skill or currently carries a Freetraders symbol. It deducts the recorded 2D6 from a single-item purchase after the existing price rules, to minimum 1 gc. Quantity must be one. A post-battle phase is required; Heroes out of action in its report are excluded. Symbols in the stash or no longer carried grant nothing; the skill is not permanently added to a former bearer. Existing explained price/restriction overrides remain available.

Migration `20260911000070_haggle_trade.sql` wraps the existing trade transaction: checks current phase, actual skill/symbol, Hero status and out-of-action record, serializes treasury/allowance updates, validates the discounted treasury result, saves raw dice/item/price/phase on the Hero and logs the reason. Exact successful retries cannot buy or charge again; changed-detail retries and simultaneous second uses are refused. A failed shared rare-search transaction rolls back the whole purchase and allowance. A newer report opens the next allowance. Paid failed searches/hunts retain their undiscounted price and do not spend Haggle. After reload, the shop names the item on which the Hero already used it.

Validation: **1,652 ordinary tests pass**; typechecked build and lint pass with existing warnings. The disposable 390px `/tmp/stirheim-haggle-mobile-qa.mjs` passes the actual symbol-bearer purchase: incomplete dice gate, 12-point reduction limited to a 1 gc purchase, exactly one Sword, saved dice, spent allowance after reload, ordinary 10 gc price on reopening, no overflow/page errors. All **164 local database tests pass**, including five Haggle transaction tests. No production migration, push or deployment; migration 70 is local only. Remaining original #66 work: Shrine weapon blessing and The Pit’s selected-Hero consequence. Defend the Oasis scope and final batch/release review remain pending.


### Local milestone 63 — The Pit’s chosen expedition (#66, not deployed)

The Pit now requires an explicit choice to leave it alone or send an eligible surviving Hero. Sending names that Hero before the risk D6. A 1 marks only that Hero dead and removes their carried equipment when the report is filed; normal exploration dice/rewards already earned are retained, and pending advances for the lost Hero are removed. It is a later exploration loss, not a fabricated battlefield OOA or a new Serious Injury roll. On 2–6, a separate recorded D6 gives D6+1 shards. Maximum-find benefits grant seven shards after a successful return but never remove the risk. Declining requires no risk roll. Raw dice, named Hero and actual outcome are written into the report notes. Source: `03a-income-page-rescrape.md:349–355`.

Changing the chosen Hero, expedition choice or risk roll clears dependent results; changing exploration dice or their kept selection clears the old expedition. The existing report transaction/snapshot removes the original kit and supports withdrawal, preserving other Heroes and items.

Validation: all 80 focused exploration/report tests pass, typechecked build and lint pass with existing warnings. `/tmp/stirheim-pit-mobile-qa.mjs` verifies actual 390px choice/return/loss gates, reload, filing, one dead Hero and removed Sword, four unaffected Heroes, and withdrawal restoring both the original Hero and Sword. No overflow or page errors; disposable fixtures cleaned. No migration is needed; production remains unchanged. Last full ordinary suite: 1,652 passing; last separate full DB suite: 164 passing, plus this newly verified real report/withdrawal flow. Next: Shrine’s selected weapon blessing, then original-scope/final release reconciliation. Defend the Oasis still has the pending scope question.


### Local milestone 64 — Shrine selected-weapon blessing (#66, not deployed)

Witch Hunters and Sisters now choose between stripping the Shrine and saving its relics. Saving selects one surviving weapon; either choice keeps the existing 3D6 patron/loot calculation. A single copy gains the persistent blessing note. If selected from a stack, only one copy is split and blessed, with the original item notes retained. Lost kit and already blessed copies cannot be selected. Other warbands do not receive the special choice. Source: `03a-income-page-rescrape.md:254–262`.

The combat loadout reads the exact blessing note and wounds targets carrying the existing Undead/Possessed traits on 2+, even when ordinary Strength/Toughness would make wounding impossible. Other opponents retain the original threshold. Weapon identity, Strength, armour modifiers, parry, applicable skills and ordinary critical trigger remain intact. The simulator uses a separate selection key for blessed copies so an ordinary and blessed Sword can be chosen independently, without changing the base weapon ID used by skill rules. Custom items can also be selected when the player identifies them as weapons. Their blessing is recorded, while attacks retain their agreed tabletop weapon rules; no arbitrary custom profile is invented.

Migration `20260911000071_shrine_weapon.sql` validates the selected item’s original identity/holder/quantity/notes before applying the report, and preserves all previous report-application guards (including lycanthrope equipment and Medicine Chest). Changed or missing weapons refuse filing, preventing a stale stack from producing an extra copy. The existing item-change/awarded-item snapshots restore the original stack on withdrawal. Applied only to local Docker; database types refreshed.

Validation: **1,662 ordinary tests pass**; typechecked build and lint pass with existing warnings. The 26 focused scenario-equipment transaction tests pass, including split/withdrawal and stale-weapon rejection. `/tmp/stirheim-shrine-mobile-qa.mjs` verifies choice/selection through reload, one blessed copy from two Swords, 9 gc patron payment, actual simulator selection of ordinary vs blessed Sword, and withdrawal restoring the original two-copy item with original notes. No overflow/page errors; fixtures cleaned. All **166 local database tests pass**. A subsequent custom-item selection regression passes with all 36 focused blessing/loadout/engine tests. Nothing pushed or deployed.

Next: reconcile the original 20 tracker entries against all completed local evidence and explicit manual/custom scope; finish remaining verification/release preparation. The specifically identified #66 book/gem/Haggle/Pit/Shrine gaps are now implemented locally, but do not mark broader tracker entries closed without the final reconciliation. Defend the Oasis still has the pending scope question; production remains unchanged and the second feedback batch stays queued.


### Local milestone 65 — exploration skill and hired-character aids (not deployed)

Original #66 reconciliation explicitly includes Resource Hunter/Seeker; the consumer review found native skills missing despite the existing hired Elf Ranger aid. Added all three printed Dwarf Resource Hunter skill IDs, Wood Elf Seeker, and Survivors of Strigos' native Seer. Learned skills work on hired characters too, including a Dwarf Pathfinder. The Strigany Seer must participate and not be OOA; the other modifier sources retain their printed conditions rather than adding a blanket OOA restriction. Existing participation filtering remains in the report wizard.

The related #61/#66 hired sources now include the Kislev Ranger's Seeker (not OOA) and Tomb Robber's Explorer. Wyrdstone Hunter now grants its one reroll to eligible searching warriors, including the Old Prospector's printed starting ability. Already-learned Prospector skills do not grant a duplicate aid. Legacy saved modifier records are recognised as modifications, so they do not incorrectly spend the same die's single permitted reroll. Multiple characters remain separate aid owners and each allowance can be left unused, preserving player choice.

Sources reread: `reference/rules/warbands/core-and-grade-1a.md:2081`, `grade-1b-part1.md:1517`, `grade-1c.md:290`, `grade-2a-part2.md:1799–1823,2205–2215`; `reference/rules/04-hired-swords.md:474,993,1236,1364,1618`; `reference/rules/03-campaigns-magic-optional-rules.md:471–475`.

Validation: full ordinary suite **1,671 passed**, build/typecheck and lint pass with existing warnings. Final targeted suite **17 passed**, including learned Resource Hunter on a Pathfinder; typecheck repeated after that small coverage adjustment. The previous full database suite remains **166 passed**, with no database changes in this milestone. `/tmp/stirheim-exploration-aids-mobile-qa.mjs` passed on actual 390px touch viewport: Resource Hunter adjustment, Wyrdstone Hunter reroll on the same die, spent allowances after reload, both uses in the filed report, no overflow/page errors, and disposable record cleanup.

Read-only Netlify API release check: Stirheim remains connected to `AstronomicUK/stirheim`, branch `main`, but `build_settings.stop_builds` is **true**. No settings changed and no build triggered. Recheck immediately before release; with builds still paused, a push alone will not publish this batch and one deliberate CLI deployment is needed. Last published production timestamp returned: 2026-09-10T10:04:13.206Z. Keep production migrations and frontend release coordinated; all batch migrations through 71 are still local only.

Defend the Oasis remains the outstanding scope question; a fresh asynchronous question offers scenario-specific recorded water/reward support versus full Khemri campaign automation. No answer yet. Final scope reconciliation/release preparation remains open; do not mark the whole batch ready or deploy while its remaining scenario scope is unresolved.


### Release preparation — original-scope evidence map and remote dry run (not deployed)

`BETWEEN-BATTLES-RELEASE-CHECKLIST.md` now maps all 20 original entries to implementation evidence and their explicit manual/custom boundaries, with a serial release checklist. The outstanding implementation decision is Defend the Oasis; release verification and publishing follow its resolution. No new unrelated bespoke character mechanics have been added to the batch scope.

The linked Supabase **dry run** succeeded and reported the expected 33 pending migrations (39–71), no seeds and no roles. It did not apply SQL or modify player histories. Netlify automatic builds remain paused per the prior read-only API check; one deliberate release will be needed unless that setting changes. No push or deployment occurred.

Independent release preparation is at a useful stop while the Oasis scope question awaits Tom. The overnight heartbeat can pause here rather than repeatedly re-auditing completed paths or silently expanding into full Khemri rules. Resume from the release checklist after the scope reply; the second batch remains authorised only after the main release is verified.


### Final pre-release verification — 11 September

The user resolved the sole remaining scope decision by deferring Khemri-dependent rules to #227. **1,672 ordinary tests and all 166 local database tests now pass.** Production build, typecheck and lint pass with the previously documented warnings. The built app targets the linked production Supabase project, not the disposable local database. Remote main has no divergent commits. Final diff review found only redundant trailing blank lines in eight batch files; these were removed without changing logic or SQL statements. No additional implementation or rules decision remains before release.

Next action is the already-authorised coordinated production migration, single push and single Netlify deployment, followed by served-asset verification. The expected migration set is 39–71; no production reset or seeding.


### Second batch started — 11 September

Tom asked to review last night's issues. The eight workstreams, review findings and next steps are recorded in `SECOND-FEEDBACK-BATCH.md`. #221 is implemented and verified locally; the other seven remain open. Hosted CI's ordinary test job passed, but two browser scenarios failed and three did not run; details and follow-up are in that checkpoint. Main release's served-asset verification remains valid; do not claim hosted CI passed. Continue the second batch locally without intermediate deployment.


### Second batch checkpoint — checklist persistence

#224 now joins #221 as implemented/tested locally. Read `SECOND-FEEDBACK-BATCH.md` for the full checkpoint. Migration 72 is local only. Next independent implementation is #222 scenario-library enable/disable selection; do not re-run the completed first release or push intermediate changes.


### Second batch checkpoint — scenario selection and menu drafts

#221, #224 and #222 are implemented and tested locally. #223/#225 interactive navigation proposals are ready for Tom’s review; read `SECOND-FEEDBACK-BATCH.md`. Next independent work is shared English logs (#23), injury-roll override provenance (#226) and the missing Sold to the Pits prompt. Preserve the local-only batch and migration 72; no further deployment has occurred.


### Second batch checkpoint — readable campaign setting logs

The campaign-settings half of reopened #23 now passes unit and real mobile save/activity checks. The larger warband post-battle dump, #226 override provenance and Pits prompt remain next; read `SECOND-FEEDBACK-BATCH.md`. No new deployment. Navigation proposal still awaits Tom’s choice.


### Second batch checkpoint — independent fixes verified, menu choice pending

#221/#222/#224, the campaign and report logs in #23, injury replacement provenance #226, and the Sold to the Pits follow-up are fixed and verified locally. Amphitheatre automatic wins now apply their report gold/XP and resolved history. The two reported hosted browser-test paths are corrected and checked with disposable mobile fixtures; #201 awaits hosted CI after the final batched push. **1,694 ordinary +169 database tests, build/typecheck and lint pass** (existing warnings). Read `SECOND-FEEDBACK-BATCH.md` for evidence.

Only #223/#225 menu implementation awaits Tom’s A/B layout answer. A fresh concise preference question has been sent; do not assume the answer from elapsed time or deploy the partial batch. Pause the overnight heartbeat while only this input is needed, then resume from navigation on his response. Migration 72 remains local only. The original main release 904e2a8 remains deployed; no second release/push has occurred.


### Corrected #226 scope — advancement roll history

Tom clarified that his fudged roll was an advancement. #226 now correctly covers advancement 2D6 and characteristic follow-up provenance, optional explanation, pick-later/final resolution and saved battle-report/warband history. Verified with a real local mobile report and targeted/full tests; read `SECOND-FEEDBACK-BATCH.md`. The injury-history improvement remains. No deployment. Menu choice A/B is still the only input needed before #223/#225; heartbeat remains paused until that answer.
