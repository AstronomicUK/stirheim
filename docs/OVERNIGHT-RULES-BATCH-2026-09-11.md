# Overnight rules batch — 11–12 September 2026

## Authorisation and order

Tom explicitly requested: finish #114 and #122; deploy all finished fixes for #114/#122/#163/#112 together; then continue the outstanding tracker fixes. Skip anything requiring his input and collect questions for morning rather than interrupting him overnight. Full Khemri is deferred and the Pit Fighter mini-battle is low priority. Preserve unrestricted player overrides and unrelated audit edits. Use disposable local data for QA.

Heartbeat `finish-stirheim-overnight-batch` is ACTIVE every five minutes in this task. It reads this checkpoint. Subsequent fixes after the authorised combined deployment stay local for batching. Present any collected questions after 08:00 Europe/London on 12 September or when Tom asks. Do not stop merely because one rule needs a decision.

## Starting state

Production source `14849b6`, Netlify `6aa44c4cc2d4c6528e354c1c`, migrations through 74. Hosted CI green; previous source batch deployed and verified. Netlify automatic builds were paused (`build_settings.stop_builds=true`); verify before pushing so there is only one deployment.

Local commit `b8fd008` completes #163 baseline natural profiles and #112 special enemy XP. See NATURAL-ATTACKS-AND-KILL-XP-2026-09-11.md. 1,969 ordinary tests and16 isolated browser regressions passed; build/typecheck/lint and dedicated mobile checks passed. No migration in that commit. `ae319a3` is an earlier local documentation checkpoint. Neither has been pushed in this batch.

Unrelated large dirty FEEDBACK-TRACKER audit material must be preserved. Stage only new checkpoint notes against HEAD, never the whole tracker. All current source edits at the start of this batch are committed. Local Supabase migration history is inconsistent for older migrations: do not blindly reset or migrate it; apply new SQL deliberately and test. Production history is clean through74.

## #114 remaining work

Already shipped: Slave execution; Slayer Deathwish substitution; Wight rules; promoted Snotling display/Teeny Hands; ordinary promotion and repeated-promotion reroll; optional hero dismissal. Preserve these.

Remaining: Orc Goblin execution; Wretch second TLGT serious injury; Sorcerous Untrained wizard/optional spell and Grunt role transition; Chapel Squire choice of remaining Squire or Knight Errant; Lustrian fallen-role replacement and equipment inheritance; verify explicit WEB Fanatic/Prospect restrictions.

Sources checked: core-and-grade-1a.md:2695 (Orc Goblin killed); grade-1c.md:1045 (Wretch cannot become Hero: repeat TLGT causes immediate Hero Serious Injury), :775 (Squire choice; Knight rules/no immediate advance/no missiles and equipment switch), :1402,:1659 (Lustrian replacement/Prospect restrictions); grade-2a-part2.md:1519,:1533 (Untrained/Grunt).

## #122 remaining work

Already shipped: ordinary Ld/XP/tie succession; Ogre Hunting Party temporary Gnoblar identity/replacement; Merchant skill-table access; Battle Monk temporary leader and compulsory Emissary purchase priority.

Remaining: Black Orc Oi Behave and species; Necrarch free spell/Acolyte chain; Protectorate prayer option on next advance; inherited Merchant rule/Mazzalupo Commands; delayed/prohibited leader recruitment; Undead/Lizardmen/Dreamwalkers/Order of Mare temporary leadership and actual disband/replacement prompts. Reconcile source before editing old notes. Protectorate source grade-2a-part2:456 explicitly gives NO immediate prayer, with a choice on the next advancement.

## Current checkpoint

#114 additional local implementation completed: Orc Goblin execution via existing casualty transaction; explicit Lustrian Prospect prohibition (WEB Fanatic already present); Chapel Squire choice of Squire/Knighthood with retained earned profile, Knight equipment return to stash, special table and no immediate Hero roll; Sorcerous Untrained Wizard/lore choice and optional random spell replacing immediate advance; Grunt mundane Hero versus single Untrained henchman transition, later Talent eligible for Wizard. No new SQL in these changes.

74 focused tests pass; TypeScript build check passes; lint only the three old audit warnings. Mobile UI + database checks passed for Orc size3 and last-member death, both Squire paths, both Untrained paths and both Grunt paths. Original rolls/manual edits retained; confirmation atomic; expected hero advances and remaining-group promotion_reroll persisted. Logs /tmp/stirheim-114-{orc,paths,grunt}-browser.log. A first paths QA run hit transient local JWT future-time error; rerun passed all four cases. Disposable fixtures removed. Full ordinary suite: 1,976 pass, 176 integration tests skipped in ordinary mode. Build passes after fixing a missing template field in a test fixture. Logs /tmp/stirheim-114-checkpoint-{tests,build}.log. Source checkpoint committed locally as b489265; no release yet.

Next #114: Wretch repeated-result injury and Lustrian replacement-role/kit inheritance. Lustrian source grade1c1402: death gear already remains held by dead hero in applyHeroInjury; dismissWarrior currently stashes it and needs special handling. recruitmentBlock currently counts active Heroes only; block ever rebuying a Lustrian type using historical heroes. A replacement card can use resolve_roster_event (migration38) for snapshot-checked atomic roster + advancement changes; however new Prospect XP0 requires resolving its current positive-threshold/XP check so an immediate Hero advance can be queued. Do not create a non-atomic two-request promotion. src/api/rosterEvents.ts useRosterEvent calls this RPC with eventAdvances; eventAdvances currently skips brand-new Heroes. Captive disposal normally gives kit to the captor, which conflicts with Lustrian broad retain-all-kit wording: source reconciliation needed before deciding that specific ownership case. Replacement must consume the vacancy/kit exactly once and retain the promoted Prospect’s stats/XP/2chosen tables while adopting the lost role; its old gear goes to stash. Wretch needs individual serious injury persistence, not a prose note; HenchmanCampaignState currently lacks full injury flags.

#122 source follow-up inspected (not yet edited): grade-2a-part1:2071 Necrarch Thrall succeeds, gains random Necromancy spell, cannot buy another Necrarch, may turn existing Acolyte into Thrall retaining stats and gaining undead rules; both Necrarch/Thrall lost means disband. Mage lore override currently absent for Necrarch. grade-1b-part1:709 Black Orc preferred before other species, not exclusive; existing metadata candidate only is too strict, but simply retemplating ordinary Orc to Black Orc Boss would alter species. Need persistent permanent-successor identity/ability inheritance, not temporaryLeader alone (which permits replacement purchase). Mazzalupo Commands successor gains random Command; spells catalogue currently has no Commands lore, so avoid turning it into Wizard magic. Complete these source-specific flows after #114. After completing both, release once with b8fd008 (#163/#112) and verify hosted output. No deployment or push yet.

## Second overnight checkpoint — local inheritance flows

Lustrian replacement is implemented for known lost/retired Heroes and currently retained kit. New `lustrianPromotion` resolver/card preserves Prospect stats/XP/skill choices, adopts lost role, transfers kit exactly once and stashes Prospect kit. Persistent `lustrianReplacementOf` consumes historical vacancy even if a successor later dies. Dismissal keeps kit bound for this replacement; historical roles cannot be re-bought. Captured Heroes are not treated as permanently lost. Zero-XP replacement queues an immediate Hero advance atomically through `resolve_roster_event`; UI labels it as immediate replacement, not falsely earned at1XP. Migration75 changes that existing RPC; applied deliberately to LOCAL DB only, not recorded in old local migration history. PRODUCTION STILL THROUGH74. Do not reset/migrate local blindly. Need apply75 to production during combined release.

Necrarch Acolyte -> Thrall follow-up implemented, same warrior/stats/XP/kit and source undead unit benefits. Requires original Necrarch dead, active successor, empty Thrall slot; then hides consumed opportunity. No replacement Necrarch/Thrall may be purchased after original leader death. Generic `appointLeader` now rejects non-candidates at resolver boundary. Necrarch free spell remains pending source ruling below, other #122 work still outstanding.

Validation: 1,981 ordinary tests pass, all177 local database tests pass (including zero-XP transaction and stale replay), build passes, lint only3old audit warnings. Mobile + DB tests for Lustrian replacement and Acolyte/Thrall pass, disposable fixtures removed. Logs /tmp/stirheim-{lustrian,necrarch}-browser.log; /tmp/stirheim-lustrian-integration.log; /tmp/stirheim-inheritance-{all-tests,build}.log. Source checkpoint to commit now. No push/deploy.

Next: continue unambiguous #122 work (Protectorate next-advance prayer, Black Orc species/Oi Behave, temporary/delayed leader replacement, disband prompts). Wretch full injury flow needs individual serious-injury persistence and follow-up handling; do not label it fixed by a generic note. Preserve player overrides. Collect below rulings in morning; don't interrupt overnight.

## Third overnight checkpoint — Protectorate and Black Orc succession

Protectorate implemented: appointing an Acolyte marks `protectoratePrayerChoice` without granting a prayer/advance. The next pending advance offers a prayer from the list or normal 2D6; either completed path consumes the flag. Prayer choice stores null dice/total and an honest chosen-instead-of-roll narrative, not a fabricated roll. Works both in the roster sheet and post-battle wizard; deferred normal-roll skill choice preserves its mode when resumed. Source grade2a-part2:456 says take a prayer from the list. Separate units and ordinary priest advancement unaffected.

Black Orc implemented: actual Black Orcs and proven-warrior Young’uns take priority, otherwise another Hero may succeed. Permanent `leaderRoleId` retains the original unit/profile/armour while inheriting Leader and Oi Behave (visible on roster and battle sheet). Current leader/rout/leader-only skills recognise the role; roster limits count the Boss slot rather than the old role, and purchasing another Boss is blocked. No accidental Black Orc natural armour granted to normal Orc. SuccessionCard now uses the existing snapshot-checked roster-event transaction to reject stale competing appointments.

Validation:1,986 ordinary tests pass; build passes; lint only3old audit warnings. Dedicated mobile+DB checks passed for Protectorate appointment (no free prayer), both next-advance paths and saved honest history, plus Black Orc permanent role/profile/Oi Behave/reload. Retested after snapshot save change. Logs /tmp/stirheim-{protectorate,black-orc}-browser.log and /tmp/stirheim-succession-checkpoint-{tests,build,lint}.log. No new migration beyond pending75. No push/deployment. Previous177 DB regression tests passed with75; no SQL changed this checkpoint.

Next continue #122 delayed/temporary leader replacement (Undead/Lizardmen/Dreamwalkers/Order of Mare), inherited Mazzalupo Commands and actual disband prompts. Generic SuccessionCard currently displays prose for `view.disbands` but no retirement action; WarbandPage already has toggleArchive (reversible archive preserves history), which can be offered for source-confirmed Necrarch/Moulder disband cases. Do not indiscriminately retire Survivors of Strigos: current metadata itself says they may carry on without Vampire but sets disbandsWithout true, so reconcile source first. #114 Wretch/captive ownership and Necrarch spell-list questions stay in morning queue below. Continue independent work, then release the finished batch once unambiguous required work is complete; remain explicit about deferred clauses.

## Questions for Tom in the morning

1. Lustrian retained-kit rule says a lost Hero’s equipment stays with their warband, but Captured disposal says the captor keeps it. For a Reaver who is sold/sacrificed/killed in captivity, should the replacement inherit that kit or should the captor keep it? Normal death/dismissal replacement is implemented; this ownership conflict is not changed.
2. Necrarch source says starting Wizard spell comes from Necromancy, but the same warband publishes its own Dreaded Scrolls of Nagash list and succession says “the spell list”. Which list should starting/successor spells use? Source grade-2a-part1:2220 versus2350. Free successor spell is held pending this ruling; Acolyte/Thrall chain is implemented.
3. Wretch’s repeated Talent result triggers a self-inflicted Hero Serious Injury outside a battle. If that roll gives Captured, who is the captor (choose a warband, previous opponent, or another ruling)? No automatic opponent should be invented.

## After the combined release

Continue source-verified work in existing priority order: combat/psychology (#68–70,#152–153,#156), remaining skills/equipment (#59/#67), exploration, advancement/succession, captives/injuries. Reconcile each old label against deployed evidence before touching it. Record exact finished scope and tests after each bounded change.


## Fourth overnight checkpoint — waiting games and collapse notices

#122 local: Undead Necromancer temporary succession and Undead/Lizardmen replacement leader waiting game enforced. Death report records leaderLostInMatch; only a later distinct match report clears waiting via leaderReplacementReadyAfter. Refiling death report cannot satisfy wait. Other ordinary slain leaders cannot be re-bought, with explicit existing replacement exceptions preserved. Warband screen shows waiting/readiness independently of temporary appointment. Source-confirmed Undead/Necrarch/Moulder collapse offers reversible retirement preserving history, and blocks recruiting past collapse. Captured living heirs are not silently declared dead. Activity descriptions hide internal match/vacancy IDs and describe the actual leadership change.

Validation: 1,990 ordinary tests pass plus new activity privacy test (28 activity tests pass); typecheck/build pass. Mobile local QA confirms waiting notice after appointment/reload, recruitment link after readiness, retirement archives without deletion. Disposable fixtures cleaned. Logs /tmp/stirheim-wait-{all-tests,build,browser,activity-tests,lint}.log. No new SQL; migration75 remains production-pending. Not pushed or deployed.

Next source-confirmed #122 clause: reference/rules/03-campaigns-magic-optional-rules.md death-of-leader gives Sisters/Possessed/Carnival successor optional prayer/spell instead of rolling first eligible advance. Reuse Protectorate choice machinery but distinguish spell/prayer UI and avoid granting free immediate magic. Remaining Dreamwalker certification/permanent leader ban, Order of Mare compulsory Dame replacement (source grade2a-part2:31–32), Mazzalupo Commands; reconcile Strigos before retirement. Lizardmen source confirms one game without Priest; existing Great Crest preference needs separate source check, don't claim fresh validation. Morning questions unchanged. Continue working toward combined release.


## Fifth overnight checkpoint — core successor magic and Dame priority

Implemented Sisters/Possessed/Carnival first eligible advance choice from core death-of-leader source: new leader gets leaderMagicChoice, no immediate spell. Reuses existing compatible protectorateChoice draft fields while rendering prayer/spell labels appropriately. Completion via chosen spell/prayer or normal roll clears choice; no fictional roll stored. Existing Protectorate saved drafts remain compatible. New flag accepted by domain and activity renders plain English. Three faction tests exercise appointment, optional magic, normal roll and consumed flag. Mobile Carnival both paths saved correctly (initial local JWT clock transient, retry passed); original Protectorate QA script label updated.

Order of Mare: after Dame removed, other warriors blocked until new Dame recruited. Captured living Dame is not declared removed. Regression checks replacement lifts block.

Dreamwalkers: source says Dreamer leads when present, otherwise Priest leads; fixed currentLeader to prioritize genuine Dreamer over mandatory Priest (generic leaderTemplate picks Priest). Priest retains original unit automatically on Dreamer death; explicit permanent dead-Dreamer recruitment ban. Metadata no longer offers arbitrary other Heroes. Test verifies priority, fallback and ban. Initial certification D6 and next-battle retry gate still outstanding; do not claim entire Dreamwalker system complete. Generic leaderTemplate remains Priest for structural mandatory slot; next work must account for this rather than assume Dreamer is mandatory leader.

Validation:1,996 ordinary tests pass, build/typecheck pass, lint only3old audit warnings. Mobile Carnival spell and normal advance paths saved with honest history, no immediate magic. Logs /tmp/stirheim-core-successor-{all-tests,build,browser,lint}.log. No SQL beyond pending75. No push/deployment.

Next: Dreamwalker initial certification/retry needs persistence and recruitment UI; Mazzalupo Commands require distinct non-Wizard ability (source grade2a-part1:1924,2018 onward, six commands). Strigos source needs reconciliation. Existing source confirms commands use Magic rules but are NOT spells and bearer NOT wizard. Remaining #114 morning questions unchanged. Finish independent scope then single release with pending migration75, full177integration +16isolated browser tests and production verification. Latest local source commits include d71f4f4 waiting-games and this new checkpoint to commit. Preserve unrelated dirty audit docs.


## Sixth overnight checkpoint — Strigos and Mazzalupo inheritance

Strigos source grade2a-part2:1626 explicitly says warband does not disband when Strigoi killed and cannot hire new one. Replaced false disband metadata with ordinary eligible-Hero succession. Retains human unit/profile using permanent leaderRoleId and inherits Leader only, no Vampire rules. Regression passes.

Mazzalupo successor inherits Leader/Commands through permanent role preserving original unit (no incidental Riding etc). Appointment queues successorCommandPending; new card rolls D6 and records the learned commandIds separately from spellIds. Known Commands displayed on warrior sheet with source text/difficulty. Rules resolver validates die/pending and refuses replay; useRosterEvent saves snapshot atomically. Card logs every valid app roll/player entry in reason, including edited values. All6command outcomes tested; loreForHero remains null. This implements successor's initial random Command, not a full automated Commands combat engine or later Command advancement system. Source grade2a-part1:1924 and2018. Existing template already had all6command texts; mazzalupoCommands derives names/order from those, no duplicated source prose.

Validation:1,998 ordinary tests, build/typecheck pass. Mobile local successor Squire appointment, edited D6=2->6, saved separate Command/profile/spell-empty and reload/no repeat grant pass. Logs /tmp/stirheim-command-{all-tests,build,browser,tests,types}.log. No push/deployment. Migration75 still pending production. Check lint before release (previous only3audit warnings).

Remaining independent #122: Dreamwalker initial certification/retry. This is a creation/recruitment boundary: builder lives src/rules/resolve/builder.ts (WarbandDraft line72, draftToRosterWarband505, validateDraft563, draftToCreatePayload673), BuilderPage.tsx onCreate uses createWarband then spell patch. RecruitmentPage can show dedicated certification card and useRosterEvent to persist priest flags. Need ensure failure gates retry until later distinct completed game, no free/repeated attempts; preserve app/player edit log. Current Dreamwalker leaderTemplate is mandatory Priest, while currentLeader explicit prefers Dreamer. Initial builder currently starts mandatory Priest. Existing historical imported Dreamers shouldn't be silently invalidated. Do not blindly enforce new certification against imported records or rebuild live data. #114 Wretch/captive kit and Necrarch spell source questions stay morning queue.

After finishing independent scope, release combined batch once: verify auto builds paused, apply migration75 to production deliberately, full177 DB and16isolated browser regressions, push once/manualNetlify once, verify served assets. User authorises skipping decision-dependent clauses; leave #114/#122 honestly partial for those questions. No live QA.


## Seventh overnight checkpoint — certification and release-ready checks

Dreamwalker certification implemented in builder and Recruit screen. Builder must record initial D6; failed initial result blocks Dreamer in draft and saves on Priest atomically via new migration76 create_warband optional flags. Recruitment requires active Priest/certification4+, otherwise no Dreamer. Failed saved attempt records current latest report match ID and blocks repeat attempt until a different latest battle report; successful certification stays available at normal hire cost. App rolls/player edits retained in history and readable activity. Existing active/captured Dreamer isn't retroactively invalidated, historical dead Dreamer still bans replacement. Pure source tests cover initial validation, payload, fail/same-game gate, subsequent fail/pass and permanent ban. Mobile builder failure persists across reload; saved failure blocks immediate retry; success persists via snapshot transaction.

Migration76 applied to LOCAL DB deliberately; production still through74. Both75/76 pending verified by linked dry-run, no other SQL pending. 2,001 ordinary tests, all178local DB tests (including creation flags/legacy payload and atomic rollback), build/typecheck,16isolatedmobile browser regressions, and dedicated certification mobile tests pass. Lint only3old audit warnings. Logs /tmp/stirheim-{certification-release-tests,dream-cert-build,dream-cert-browser,dream-cert-lint,overnight-migration-preview}.log, /tmp/stirheim-lustrian-integration.log, /tmp/stirheim-isolated-e2e.log. Fixtures cleaned. Netlify stop_builds=true verified, publisheddeploy remains6aa44c4cc2d4c6528e354c1c.

READY TO RELEASE tested finished scope now. User authorised skipping decision-dependent clauses: Wretch injury captor, Lustrian captive-kit conflict, Necrarch spell list remain questions, #114/#122 not falsely fully closed. Additional source ambiguity recorded: Lizardmen Priest text says play a game “without the leader”; existing Great Crest stand-in preference comes from flavour, not explicit rule. Waiting-game restriction implemented, preserve existing stand-in behaviour pending Tom's ruling on no Leader ability versus ordinary temporary succession. Do not silently introduce a new ruling during release.

Next sequential actions: commit source/migration76/tracker checkpoint; apply tested75/76 to linkedproduction; verify clean migration dry-run; push commits once (autobuild paused); one manual Netlify production deploy dist; read build/deploy ID and verify every referenced served asset matches dist. Then append exact release proof in local checkpoint, inspect hosted CI, continue next outstanding priority in local batches. No live player QA. Do not repeat deploy if one already succeeded.


## RELEASE COMPLETED — do not deploy this batch again

Production source d17cb00e89ad66d9b063230b5605f2ae0852b4c9 pushed once. Netlify production deploy6aa4750b9e2cb9a410a0a9d0 at https://stirheim.com (single manual --no-build deploy; automatic builds remained paused). All110served files match local dist SHA256; /tmp/stirheim-overnight-served-verification.json has zero mismatches. Production migrations75 and76 applied successfully; linked dry-run reports upToDate=true, no pending migrations. Logs /tmp/stirheim-overnight-{deploy.json,migrations-applied.log,migrations-confirm.log}. #163/#112 and completed clauses of #114/#122 deployed together. Do not mark question-dependent clauses closed.

Hosted CI34650406164 is in progress for full SHA above; check its eventual result, no need to redeploy on success. Local pre-release tests:2,001ordinary,178DB,16isolatedbrowser plusdedicatedmobile/build. Release confirmation delivered to Tom. Subsequent work MUST stay in local commits for batching, no additional deployment until authorised next batch.

Next: inspect newest tail notes for combat/psychology #68–70,#152–153,#156 and equipment #59/#67, reconcile old descriptions against alreadydeployedfixes. The recent tracker notes begin around5853; source entries around1956/1983/2006/4174/4192/4246. Preserve unrelated dirty audit work. Morning questions unchanged plus Lizardmen stand-in ambiguity listed above. Do not ask overnight. Continue independent outstanding fixes now.


## Next local batch checkpoint — #152 Fish-hook Caused Fall

Hosted CI34650406164 completed SUCCESS for deployed d17cb00. Production remains Netlify6aa4750b9e2cb9a410a0a9d0/migrations76. Do not deploy again; all new work stays local.

Fish-hook Shot now offers Cause a fall instead of damage in shared Battle Sheet/simulator relevant controls. A hit proceeds through existing Dodge/Lucky Charm then attacker Strength test; raw6fails, large target adds1 to test (equivalently reduces allowed raw die), success knocks down without wounds/critical/save/injury. Ordinary damage mode unchanged; stale toggle on another weapon ignored. Uses effective wielder Strength rather than fixed S3 weapon damage. Explicit no-close-combat and mounted-rider Whoa Boy3–4 table constraints remain visible; no automatic map distances or rider-fall damage claim. Knockdown-immune targets retain immunity (unlike Chain Shot's explicit override). Probability engine reports proper knock-down chance with0wound/OOA and accounts for Dodge and permission branches.

2,005ordinary tests/build/typecheck pass, lint3old warnings. Dedicated mobile isolated battle QA selected fall, rolled hit+Strength, logged to both sheets; saved battle_events confirms Knocked down, wounds_lost0, out_of_actionfalse andactualtestdice. Fixturecleaned. Logs /tmp/stirheim-fishhook-{all-tests,build,lint,browser}.log. New fishHook.test.ts checks hit/miss/Dodge, raw6 failure,3Wtarget, immunity and probabilities. No SQL or deployment. Source02:851–859; core characteristic tests01:449–453.

Next independent work: #152 Barbed Whip Enrage aura (+1A to Chaos Warhounds within4in while wielder notincombat) remains straightforward explicit table-confirmed situation; source02:55–65. #68 Merchant Wagon abandonment needs complete winner/cargo/ransom/rare-search atomic cross-roster flow, don't trivialise. #153 Ladle duration/recovery isn't specified in local short rule; Sword Breaker4+ onparry breaks selected weapon, needs sourcebound ownership/weapon lifecycle. #69CenserFog targetT/wielder6 tests need separate wound/selfharmflow with undead/possessed immunity. Avoid adding new ambiguous rulings overnight. Continue local batching and maintain existing morningquestions.


## Next local batch — #152 Barbed Whip Enrage

Implemented explicit Chaos Warhound identity (marauders_warhounds_of_chaos, beastmen_warhounds_of_chaos) and player-confirmed nearby whip aura. Shared melee attack counting adds1 only to primary attacks of those units; off-hand/ranged/ordinary dogs and stale toggles don't gain it. UI wording requires friendly Hero with Barbed Whip within4in and notincombat, distances checked at table. No proximity inference or permanent stat edit. Simulator catalogue combatants now preserve unitTemplateId/isAnimal into engine, enabling same rule with template units. Roll-through logs the declared aura before dice, so shared result and own history explain extra attack.

2,008ordinary tests/build/typecheck pass; final63odds tests additionally assert stale/ranged cases; lint3old warnings. Mobile fixture had actual1memberChaosHoundgroup andfriendlywhiphero, confirmed1->2attacks and two actual rolls, saved shared battle_events includes Enrage declaration. Browser QA initially expected shared button for harmless misses (only own Dice history offered) then used wrong Injury label; fixed test to real injury-control name and confirmed finalsavedoutcome. No app defect from those testselectors. All fixturescleaned. Logs /tmp/stirheim-enrage-{all-tests,build,lint,browser,final-tests}.log. No migration/push/deploy; source20bb5f7Fishhook plus thisstep held fornextbatch. Production d17cb00/Netlify6aa4750b9e2cb9a410a0a9d0/SQL76 unchanged.

Next possible clear #152 task: Firepots Miragliano smoke source02:840–849. Hit causesS2normally plus target must roll UNDER Initiative atstartofnextownturn; failure stopscharge/shootuntilfollowingownturn, melee/movementotherwiseallowed. Existing domain/battleEvent andBolasRecovery.tsx, StupidityTests.tsx provide sharedhit + ownturntest patterns; distinguish groupmembers and preserve appdice/edits. No source ambiguity aboutrollunderstrictly (6 corefails). CenserFog target/wielder timing and Ladledroppedweaponrecovery mayneedsourceclarification, don'tinvent. MerchantWagon abandonment stillrequiresfullcargo/ownership/ransom/rare-searchflow. Continueindependentworklocally.


## Next local batch — #152 Firepot smoke lifecycle

Firepots now retain smoke after a successful hit even if no wound is caused, after existing Dodge/Charm prevention. Shared attack records schedule the smoke test for the target's next own turn. The Battle Sheet offers the strict roll-under-Initiative test (6 fails), preserves the original app roll across reload, and records player changes/corrections. Failure blocks shooting and charging for that own turn while leaving melee and normal movement available; it persists through the enemy turn and expires on the following own turn. Reverted hits stop enforcing the restriction. Multi-member groups remain table-managed rather than applying one member's smoke to every model. Manually resolved/table-only hits are not newly auto-detected.

Validation: 2,012 ordinary tests pass, build/typecheck pass, lint only the three existing audit warnings. Dedicated disposable mobile QA verified a non-wounding hit, next-own-turn scheduling, saved pending roll/reload, strict failure, disabled shooting/charging, unaffected melee, enemy-turn persistence and next-own-turn expiry. Fixtures cleaned. Logs /tmp/stirheim-smoke-{all-tests,build,lint,browser}.log; focused tests cover original app roll versus edited result, replacement reasons, natural6, reverted events and group rejection. Source reference/rules/02-weapons-armour-equipment.md:840–849 and core characteristic tests. No SQL, push or deployment. Production remains d17cb00 / Netlify6aa4750b9e2cb9a410a0a9d0 / migration76. #152 remains partial for other outstanding equipment clauses.

Next: inspect independent remaining equipment/combat clauses; preserve the morning question queue and avoid inventing rulings. Keep this and Fish-hook/Enrage fixes in the next local batch.


## Next local batch — #59/#156 Lightning Reflexes strike-order advice

Found the listed skill was still ignored by strike-order advice. A charged defender with learned or kit-granted Lightning Reflexes now compares effective Initiative with the charger, rolling off on ties. The explanation distinguishes shared Strike First priority from the actual winner. No effect in later rounds or when the unit lacks the skill; Strike Last remains effective unless Strongman removes the double-handed penalty. Source reference/rules/03-campaigns-magic-optional-rules.md:541–545. Focused odds suite passes (including faster/slower/tied defenders, kit grants, no-charge/no-skill, Strike Last and Strongman), build/typecheck passes. Logs /tmp/stirheim-reflexes-{tests,build}.log. This is advice only; no automatic two-sided attack sequencing or new charged-attacker context claimed. No browser/DB change or migration. Held locally with Firepot/Fish-hook/Enrage; production unchanged.

Disarm research: Sword Breaker source02:706–716 clearly breaks the weapon used on a successful parry then4+, but needs individual item ownership, shared-event reversal and permanent post-battle loss. Do not mark complete with a text-only result. Ladle02:439–447 says drop weapon without recovery timing; keep that clause pending clarification rather than invent permanent destruction. Next independent work can build Sword Breaker lifecycle using existing blackpowder destruction patterns; full opposing sequencing remains separate. Morning question queue unchanged.


## Next local batch — #59 Jump Up injury handling

Jump Up now ignores ordinary rolled Knocked Down injuries in both shared probability engine and battle dice walkthrough. The wound is still lost and the shared log names Jump Up. Helmet-save and No Pain conversions from Stunned remain Knocked Down; unrelated direct knock-down effects such as Fish-hook/Chain Shot are not silently immunised. Input derives from actual learned/kit skill IDs. Probability handling preserves none/KD/stun/OOA totals, modifiers, multiple wounds and Veskit compatibility. Source reference/rules/03-campaigns-magic-optional-rules.md:546–550.

Validation: 2,018 ordinary tests pass (178 DB tests skipped, no SQL changes); build/typecheck pass; lint only three old audit warnings. Disposable 390px mobile battle rolled hit/wound/injury, confirmed Jump Up ignored knock-down, and persisted one wound, no OOA, Injury ignored plus explicit skill explanation to shared battle_events. Fixtures cleaned. Logs /tmp/stirheim-jumpup-{tests,all-tests,build,lint,browser}.log. No migration, push or deployment. Production unchanged; held in next batch with Fish-hook, Enrage, Firepot smoke and Lightning Reflexes.

Sword Breaker investigation found blackpowder destruction currently blocks battle use but itself still says resolve roster removal, so it is not a complete reusable permanent-loss transaction. Full selected physical weapon lifecycle remains needed (#69/#153); do not claim it implemented. Can continue independent #59 skills / other tracker clauses while planning that larger flow. Morning questions and no-live-QA constraints unchanged.


## Next local batch — #59 Extra Tough and legacy Resource Hunter

Added a learned Extra Tough option for the initial Hero Serious Injury D66. Player decides before any dependent sub-roll/district/count dice. Replacement becomes the actual result even if worse, preserves original/app-or-tabletop provenance in previousAttempts/report rollHistory, and survives reload. A flow flag prevents repeat skill use and Medicine Chest reroll of that replacement. A reasoned manual restart retains the used flag and previous history; approved overrides remain available. Normal Multiple Injuries follow-ups still follow their printed mandatory reroll rules. The app does not offer retrospective rerolls after dependent dice have already been resolved or automate ordinary hired-sword D6 injuries via this Hero-table skill. Sources: warbandSkills.ts exact Extra Tough text for Dwarf Treasure Hunters/Rangers/Black Dwarfs and Sons of Hashut; accepts their IDs and existing generic extra_tough. Resource Hunter now also accepts existing generic resource_hunter, alongside already-supported faction IDs, without adding a duplicate use.

Validation: 2,022 ordinary tests pass, build/typecheck pass, lint only3old audit warnings. Disposable mobile post-battle QA chose injury22 then Extra Tough41, reloaded, confirmed skill and Medicine Chest rerolls unavailable for replacement, filed report and verified both dice/reason in rollHistory, unchanged chest quantity and recovered stats. Withdrew report and confirmed XP restored. Fixtures cleaned. Tests additionally cover worse/death replacement, preserved equipment after replacing death, new follow-ups, missing skill, all known IDs, no reroll of chest/skill result, used flag across reasoned restart. Logs /tmp/stirheim-extratough-{tests,all-tests,build,lint,browser}.log. No migration, push or deployment; production unchanged.

Next: continue independent outstanding tracker work. #59 remains partial, with movement-only skills needing table-aware design and remaining restriction clauses needing reconciliation. Sword Breaker/blackpowder permanent item-loss lifecycle is still outstanding; don't mistake blackpowder's in-battle block for roster removal. Keep morning source questions and local batching policy.


## Next local batch — #59 skill-eligibility warnings

Fixed SUBJECT_UNITS for WEB Squig Herders: Gassy Squigs, Threaten and Trainin’ now permit night_goblins_web_squig_herder and warn the Boss/other units. Added caster-capability check for printed spellcaster-only restrictions, including Sorcerous Society Magical Aptitude: actual known spell lore, chosen non-prayer lore or native Wizard rule qualify; prayer-only/non-casters do not. Native Mages and promoted Untrained with chosen lore pass. Added missing core restriction annotations for Sorcery, Warrior Wizard, Arcane Lore and Battle Tongue, including explicit Sisters/Warrior-Priest exclusions, Witch Hunter Arcane Lore warning, current-leader and undead-leader checks. Human Necromancer successors are not treated as Undead creatures solely because of their warband. Proven Warrior now warns below25XP; its purchased Black Orc Blood record and transformation/equipment lifecycle remain open, not falsely completed. Printed core clauses reference03:440–481; WEB source template grade1c and warbandSkills restrictions, Proven Warrior source grade1b.

Warnings remain selectable and recorded, never hard blocks. Disposable mobile advancement QA selected Sorcery on a non-caster despite warning, confirmed it, and verified learned skill plus explicit outside-restriction reason in saved pending_advances resolution. Fixtures cleaned. Four new restriction regressions cover actual herder identity, native/promoted/non-casters, core exclusions/leader exceptions and25XP; 2,026 ordinary tests pass, build and final typecheck pass, lint only3old audit warnings. Logs /tmp/stirheim-skill-eligibility-{tests,all-tests,build,types,lint,browser}.log. No SQL/push/deployment. #59 remains partial for other skill mechanics and remaining prerequisites; player overrides preserved.

Next possible independent scope: implement purchased Black Orc Blood at creation/recruitment/upgrade and Proven Warrior’s full role-preserving stat/skill/equipment effect using source10gc/oneYoungun/25XP. This is implementation work, not a user ruling. Alternatively continue permanent weapon-loss lifecycle #69/#153. Do not redo deployed release. Morning question queue unchanged.


### Validation follow-up
Final lint identified the pure Extra Tough helper name useExtraTough as a React-hook naming violation when called from its event callback. Renamed it applyExtraToughReroll (no behaviour change); focused Extra Tough tests and lint now pass with only the3existing audit warnings. Final skill-eligibility typecheck output was clean. Earlier lint-only wording did not account for this naming error; this follow-up records its correction. No production change.


## Next local batch — Black Orc Blood purchase (#59 prerequisite)

Added Recruit-screen purchase for one active Young’un in Black Orcs, cost10gc, saved as warrior.flags.blackOrcBlood through existing snapshot-checked resolve_roster_event. A captured holder still occupies the place; a dead/retired holder does not. Existing Proven Warriors occupy the place without being silently billed again. Purchase grants no stat, armour, skill or extra advance; source grade1b:870 only unlocks later Proven Warrior at25XP. Updated skill warning to require a recorded purchase while preserving override. Human-readable activity label added. Recruitment after creating a warband supports the purchase before its first battle; no builder checkbox added yet.

Validation:2,029ordinary tests pass; build/typecheck and lint pass (3oldwarnings). Mobile disposable two-Young’un warband verified10gc deduction, persistedflag, unchangedstats/skills/levelups and no repeat/second purchase afterreload. Unit tests cover insufficientgold,wrongunit, captured/deadholder, persistedflagschema and25XPpluspurchase eligibility. Fixturescleaned. Logs /tmp/stirheim-blackblood-{tests,all-tests,build,lint,browser}.log. NoSQL/push/deploy. #59/Proven Warrior stillpartial until later effects complete; production unchanged.

Next concrete Proven Warrior work (do not restart investigation): source grade1b:752 retains Young’un title, grants Black Orc rules/list/skilltables, not starting-profile stat jumps. learnSkill in rules/resolve/advances.ts currently only appends skill; heroMayUseTable and availableSkills use saved skillTableIds. Add effective table helper for already-learned legacy Proven Warriors plus persist union when learned (derive Black Orc template tables). Natural6+armour appears missing for native Black Orcs too: combatants traitsFromRules lacks exact Black Orc heading, Armour type/armourSave.ts no innate save. Could add an innate armour bonus to Armour, applied before Strength erosion, and clear it for Ladle shield-only; toDefender derive from native exact Black Orc trait or Proven Warrior skill. Test stacking, S erosion house rule, shield-only, ignorearmour and noYoung’ungrant justfromBlood. Native Black Orcs cannot ride (grade1b:707); broader equipment legality #67 remains open, currently StashTab explicitly leaves equipment list decisions to players. Don’t claim generic equipment validation implemented. Preserve unit identity/history and player overrides. Next batch only, no productionrelease.


## Next local batch — Proven Warrior skill access and Black Orc natural armour

Learning Proven Warrior now persists the Black Orc skill-table union while retaining the Young’un unit ID, name, existing stats, XP and equipment; consumes exactly one advance. Already-learned legacy Proven Warriors receive effective table access in availableSkills/learnSkill without mass rewriting records. Existing succession priority already recognises the skill. Recruit card distinguishes Blood purchase from learned Proven Warrior.

Native Black Orc rule headings now supply the named Black Orc trait; both it and learned Proven Warrior supply a natural6+armour save that stacks with equipment. Armour naturalSaveBonus is applied before optional Strength erosion; final save conversion retains the normal natural1 failure. Tested Gromril+Kite+natural bonus againstS4 aswellasordinaryarmour/shield. Ladle shield-only clears naturalarmour and attacks ignoringarmour bypassit. Blood purchase alone grantsnothing. Engine and Battle/simulator adapters use max1 rather than addingtwice. Clear no-mount note remains table guidance, preservingoverrides. Source grade1b:707,752,839–843. This closes natural-armour omission for native Black Orcs too, not every racial armour rule.

Validation:2,032ordinary tests pass; build/typecheck/lint pass (3oldwarnings), final191focusedtests and finaltypecheck also pass after the direct engine trait wiring. Mobile disposable Bloodpurchase→ProvenWarrior advance saved skilltables, oneadvance, unchangedidentity/stats and learnedcardafterreload. Fixturescleaned. Logs /tmp/stirheim-proven-{tests,all-tests,build,types,lint,browser,final-tests}.log. NoSQL/push/deployment. Equipment-list/mount legality remains part of open #67: current StashTab explicitly leaves list decisions to players, and no general equipment-list validation is claimed. Source skilltooltip states Black Orc list entitlement. Builder Bloodcheckbox remains optional UI gap; purchase works fromRecruit beforefirstbattle.

Next: continue #67 equipment-list warning work or full weapon-loss lifecycle #69/#153. For #67, search correctly: equipmentListId consumers outside data currently only builder.ts/freeDagger.ts; StashTab explicitly leaves eligibility toplayers. Preserve override/warn/record policy. New naturalSaveBonus is derived, not written towarriorstats. Production remains releasedd17cb00/Netlify6aa4750b9e2cb9a410a0a9d0/SQL76; all subsequentcommits heldlocal.


## Next local batch — #67 equipment-list checks and stash exceptions

Purchases and roster warnings now check the actual warrior equipment list. Weapons Training/Expert permit their respective weapon categories without bypassing existing racial/category bans. Current leaders retain their list and gain leader-list access; Proven Warriors gain Black Orc list access. Material melee variants use the underlying weapon type. Unknown custom units and rare Gromril/Ithilmar armour are not assigned invented list prerequisites. List-line unit qualifiers and further faction-specific restrictions remain open; #67 is partial.

Stash moves check the proposed destination inventory, show restrictions and require a recorded exception reason while preserving approved player overrides. Legally held creation-only items are not treated as new purchases. Mobile disposable QA verified both off-list purchase and stash move, gold/quantity updates and both reasons in history, then cleaned fixtures. The source permits Eshin Hero Halberds, so the regression uses an off-list Axe rather than repeating the old audit example.

Validation: 2,036 ordinary tests pass (178 DB tests skipped; no SQL changes), build/typecheck pass, lint has only three existing audit warnings. Logs /tmp/stirheim-equipment-{tests,all-tests,build,types,lint,browser}.log. No push or deployment; production remains d17cb00 with migrations75/76. Next: precise equipment-list qualifiers or full weapon-loss lifecycle. Morning questions remain queued until08:00 Europe/London unless requested sooner.


## Next local batch — #67 explicit equipment-list unit qualifiers

Added structured onlyUnitTemplateIds to list entries and applied it to source-confirmed Averlander Scout longbows (Bergjaeger only), Black Orc Henchmen crossbows (Shootaz only), and double-handed weapons (Boyz/Nuttaz only). Original printed labels/costs remain. Other list grants and weapon skills still work; Proven Warrior gains the unrestricted Black Orc list. Promoted warriors keep their original unit eligibility. Sources reference/rules/warbands/core-and-grade-1a.md:1365 and grade-1b-part1.md:807–814. No broad prose parser or inferred racial ban. Other list qualifiers, miscellaneous Hunting Arrows restriction and faction-specific clauses remain open under #67.

Validation:2,038 ordinary tests pass, build/typecheck pass, lint only3existing audit warnings. Tests cover each permitted/excluded unit, Hero and henchman holders, Weapons Expert and Proven Warrior. Existing purchase/stash browser verification covers unchanged warning/override UI; no new browser session or DB changes for these pure data/resolver clauses. Logs /tmp/stirheim-list-qualifiers-{all-tests,build,lint}.log. Local only; no push/deploy. Continue independent tracker clauses; morning questions unchanged.


## Next local batch — #67 Horned Hunter Strictures and Hochland powder

Horned Hunter Priests of Taal now warn against heavy armour; Initiates warn against armour, shields and helmets. Existing category-ban resolver is reused so weapon skills do not bypass religious restrictions. Hochland Powder's Expensive! is checked against actual henchman holder status, allowing promoted Heroes and stash storage rather than imposing a permanent unit ban. Purchase, stash and roster checks share these warnings and recorded exceptions remain available. Sources grade-1b-part1.md:2292,2756,2774.

Validation:25focused and2,040ordinary tests pass; build/typecheck pass; lint3existing auditwarnings. Tests cover light/heavyarmour, shields/helmet, skills, henchmen/promotedHeroes/stash andunrelatedwarbands. Pure resolver/data additions, unchanged previously verified purchase/stash UI; no new DB or browser QA claimed. Logs /tmp/stirheim-faction-equipment-{tests,all-tests,build,lint}.log. Local only, no deployment. #67 remains partial for remaining named unit/list and miscellaneous equipment clauses. Next independent options: Snotling Small Hands (source grade-2a-part2.md:970 explicitly excludes Shoota Teams), other source-backed equipment clauses, or weapon-loss lifecycle. Morning questions unchanged.


## Next local batch — #67 Snotling Small Hands

Small Hands now warns for the Bullied Goblin, BigSnotz, Scouts, Shaman, Runts and Mobs using longbows, Elf bows, handguns, long rifles and blunderbusses, including catalogue variants of those types. Weapons Expert does not bypass this explicit rule. Shoota Teams are exempt; pistols, ordinary/short bows and crossbows are not banned by Small Hands. Other lists' Snotlings are not silently assigned this faction rule. Wheelo has no ordinary equipment list; no extra crew/equipment system added. Source grade-2a-part2.md:970. Existing purchase/stash override reasons remain available.

Validation:9focused and2,041ordinary tests pass, build/typecheck pass, lint3old auditwarnings. Covers named units, forbidden weapon variants, smaller weapons, learned Weapons Expert, promoted Shoota Team and unrelated Snotling list. No UI/DB change; no new browser QA claimed. Logs /tmp/stirheim-smallhands-{tests,all-tests,build,lint}.log. Local commit only, no deployment. #67 remains partial; next independent work may extend other explicit list qualifiers (typed onlyUnitTemplateIds already available) or full Sword Breaker/weapon-loss lifecycle. Morning questions unchanged.


## Next local batch — #67 Hero-only list entries and Skink Bone Helmets

Structured list-entry heroesOnly now uses current roster holder status, so promoted henchmen qualify without rewriting their unit type. Applied to Skink swords, Pirate Cat O' Nine Tails and Outlaws Redux longbows. Skink Bone Helmets use exact Skink Priest unit qualifier; normal Saurus list remains independent. Sources grade-1b-part2.md:298,317,1080 and grade-2a-part2.md:345. Existing weapon skills/list unions and category bans retain their respective behavior.

Validation:11focused and2,043ordinary tests pass, build/typecheck pass, lint3oldwarnings. Tests compare henchmen versus promoted Heroes for all3entries and Skink Priest versusGreatCrest/Brave evenwithweaponskills. Puredata/resolverchanges, previously verified sharedwarning/overrideUI unchanged; no new browser/DBQA. Logs /tmp/stirheim-hero-equipment-{tests,all-tests,build,lint}.log. NoSQL/push/deploy. #67 stillpartial for other equipmentclauses. Next: other typed list qualifiers or fullweaponloss lifecycle. Morningquestionsunchanged.


## Next local batch — #67 bundle and alternative equipment membership correction

Review caught a regression risk in the new list check: single-item resolution misses Pit Fighter style bundles. equipmentListOptions now returns bundle components plus every explicit alternative in Skink/Witch Elf styles and shield/buckler choices. Eligibility uses this helper; builder bundle defaults and prices are unchanged. Source grade-1b-part2.md:1435–1447. This checks membership only, not complete-style composition or purchase pricing.

Validation:20focused and2,044ordinary tests pass; build/typecheck pass; lint3oldwarnings. Regression covers PitKing complete catalogue components, Pursuer trident/javelins and net/buckler alternatives, sword/spear option, unrelated off-list gear, shieldchoices and unchangedbuilderdefaults. No DB/UI changes, no new browserQA. Logs /tmp/stirheim-equipment-bundles-{tests,all-tests,build,lint}.log. NoSQL/push/deploy.

Next independent #67 leads already source-confirmed but NOT implemented: Order of Mare footman list Pilgrim-only spear/halberd/bow, Knight-only lance/heavyarmour, archer Esquiresses-only spear (grade-2a-part2.md:71–129); Moulder Beastwhip/Thingcatcher Packmaster/Apprentices only (:766); PitFighter Ogre/Slayer shared-list qualifiers. Need actual templateIDs and retained role/succession checks. Do not reintroduce bundle falsewarnings. Morningquestions unchanged.


## Next local batch — #67 Moulder and Ogre/Slayer list qualifiers

Moulder Beastwhip/Thingcatcher entries now identify Packmaster/Apprentices; Stormvermin need ordinary weapon-training access or an agreed exception. Pit Fighter shared Ogre/Slayer list now identifies Trollslayer Dwarf Axe and Ogre light armour/helmet entries, alongside existing Slayer category bans. Sources grade-2a-part2.md:746–766 and grade-1b-part2.md:1457–1475. Did not infer new restrictions on all later-purchased Gromril variants from the starting-list Gromril line.

Validation:14focused and2,046ordinary tests pass; build/typecheck pass; lint3oldwarnings. Tests distinguish eachallowed/excludedunit, WeaponsTraining andindependentSlayerarmourban. Puredata additions using existing verifiedwarningUI; no new browser/DBQA. Logs /tmp/stirheim-specialist-equipment-{tests,all-tests,build,lint}.log. NoSQL/push/deploy; nextbatchlocal.

OrderMare next: exactunitIDs paragon/gallant/redeemed_knights are Knights; pilgrims footman; esquiresses archer. BUT Paragon has VowofPoverty forbiddingLance evenwithaccess; source/data explicitlysaysso. Need thatspecificwarning alongside listqualifiers, preservingweaponoverrides. Also noticed PitFighter source grade1bpart2:1479 says access to specialTrident fromTradingPost outsidestartinglist; currentnewgenericlistcheckcouldflagordinaryPitKingTrident. Checkpreciselybeforeadding blanketpermission. Keep#67partial. Morningquestionsunchanged.


## Next local batch — #67 Order of the Mare equipment distinctions

Footman entries now distinguish Pilgrim spear/halberd/bow from Knight lance/heavy armour; Archer spear identifies Esquiresses. Knights are the printed Paragon, Gallant and Redeemed Knight types. Paragon separately warns against lances under Vow of Poverty, including with Weapons Training. Existing exceptions remain selectable and logged. Sources grade-2a-part2.md:71–108,156. This does not claim mount pricing/access or every Order rule complete.

Validation:15 focused and2,047 ordinary tests pass; build/typecheck pass; lint only3oldwarnings. Regression checks permitted/excluded types, different shared lists, Paragon vow and Gallant lance permission. No UI/DB changes or new browserQA. Logs /tmp/stirheim-mare-equipment-{tests,all-tests,build,lint}.log. Local only; noSQL/push/deploy. #67 remains partial. Next independent work: remaining item restrictions/creation-only exceptions or full SwordBreaker lifecycle. PitFighter specialTrident tradeaccess source remains a follow-up to review. Morning questions unchanged.


## Next local batch — #67 Priest of Morr weapons and Pit Fighter trade exception

Both Dreamwalker and Vampire Hunter Priests of Morr now warn for any weapon other than dagger/scythe, independently of Weapons Training/Expert. Vampire Hunter Priest now also has the printed armour/helmet bans; miscellaneous tools are unaffected. Sources grade-2a-part1.md:187 and grade-2a-part2.md:2078.

Pit Fighter trident access explicitly granted outside starting lists at Trading Post is now recognised after creation; starting-list checks retain ordinary membership, while Pursuer style already permits trident at creation. RestrictionOptions.atCreation is passed through the list helper. Source grade-1b-part2.md:1479. No blanketpermissionforotherwarbands; categorybans remain separate.

Validation:17focused and2,049ordinary tests pass, build/typecheck pass, lint3oldwarnings. Checks cover bothPriests, weaponskills, armour, tools, creationversustrading andPursuer/unrelatedwarband. NoUI/DBchange ornewbrowserQA. Logs /tmp/stirheim-morr-trident-{tests,all-tests,build,lint}.log. NoSQL/push/deploy. #67 remains partial: VampireHunterPilgrimbludgeons (source grade2apart2:2124), NipponMagevow, HalflingTooBig, Outlawmandatorybow/one-missile andcreation-onlyequipment clauses remain; avoid treating all#67asclosed. Morningquestionsunchanged.


## Next local batch — #67 Vim-To vow, Pilgrim Blunt and ordinary blunt aliases

Vim-To Mage warns for equipment beyond its walking staff (club) and dagger, including armour and miscellaneous tools; its explicit permitted choices are recognised despite the template pointing at the broader Nippon Warrior list. Dark Shroud Pilgrim Blunt warns for bladed/ranged weapons, preserves ordinary maces/hammers/staff and silver-tip stake exception, and remains effective after Weapons Training/Expert. Known hammer/staff catalogue types pass this category check but still require their own list/racial permission. Sources grade-2a-part1.md:2674, grade-2a-part2.md:2124. Builder display still uses broad Nippon list; this change checks eligibility/overrides, not a dedicated builder list redesign.

Ordinary club/mace/hammer aliases now compare as one rulebook weapon type for list membership, including material variants. This prevents false warnings where the printed list names only one synonym.

Validation:19focused and2,051ordinary tests pass; build/typecheck pass; lint3oldwarnings. Tests cover learned skills, tools/armour, allowed Mage choices withoutskill, Pilgrim stakeexception andbluntaliases. No UI/DB change ornewbrowserQA; prior sharedwarning/overrideUIverification applies. Logs /tmp/stirheim-vows-equipment-{tests,all-tests,build,lint}.log. NoSQL/push/deploy. Next#67: HalflingTooBig, Outlawbow/one-missile, creation-onlyHuntingArrows/Ithilmar, remainingSlayerclauses. Keep#67partial. Morningquestionsunchanged.


## Next local batch — #67 Halfling Too Big

Too Big uses the same oversized weapon family as Snotling Small Hands, with the correct named rule. Applied only to Halfling Elder/Cook/Thief/Youths/Scouts/Warriors, not Village Ogre or Piggies. Learned Weapons Expert does not bypass it; smaller weapons unaffected. Source grade-2a-part1.md:1211. Also corrected the Dreamwalker test fixture's warband ID to dreamwalkers_cult_of_morr.

Validation:20focused and2,052ordinary tests pass; build/typecheck pass; lint3oldwarnings. Tests cover all6Halflingtypes, weapontraining andVillageOgre exception. No UI/DB change or new browserQA. Logs /tmp/stirheim-halfling-equipment-{tests,all-tests,build,lint}.log. Localonly, noSQL/push/deploy.

Next#67 Outlaws (both original andRedux): source grade1bpart2:835 / grade2apart2:286 says one missile weapon per warrior; mandatorybow exceptCleric; no additional ballisticweapon despite learnedskill. Implement roster warning for missingbows includinggroupquantity, cap1initemRestrictionWarnings, preservehiredkit andClericoptionalbow. Stashcurrentlychecks destinationonly; removinglastbow shouldatleastshowrosterwarning, avoidclaiming pre-move sourcewarningwithoutimplementingit. BowIDs short_bow/bow/longbow/elf_bow; HuntingArrows notmissileweapon. ExactClericIDs outlaws_cleric and cleric. Creation-onlyHuntingArrows/Ithilmar andremainingSlayer clauses stillopen. Morningquestionsunchanged.


## Next local batch — #67 Outlaw bow requirement and missile cap

Original and Redux Outlaws now warn against non-bow missile equipment for ordinary warriors even with Weapons Expert, cap missile inventory at one per model, and show missing-bow roster warnings even for empty inventories. Group bows must cover every model. Cleric bow remains optional; no new non-bow ban is imposed specifically on Clerics beyond existing list access. Hired-sword kit/stash unaffected. Source grade1bpart2:835 and grade2apart2:286. Changes remain warning/recorded-override policy.

Validation:21focused and2,053ordinary tests pass; build/typecheck pass; lint3oldwarnings. Covers both lists, missing/adequate bows, group quantities, extra weapons, weapon skills, Cleric and hired-kit exceptions. No UI/DB changes or newbrowserQA. Logs /tmp/stirheim-outlaw-equipment-{tests,all-tests,build,lint}.log. NoSQL/push/deploy.

Remaining: stash moves currently check destination restrictions; removing the last mandatory bow shows a roster warning afterward, but no pre-move source warning is claimed. requiredEquipmentWarnings(warband,holder) is exported for that follow-up. Creation-only Hunting Arrows/Ithilmar and remaining Slayer clauses still open under#67. Morningquestions unchanged.


## Next local batch — #67 required-kit source warning before stash moves

Stash moves now check whether the source warrior/group loses its mandatory bow, in addition to destination restrictions. Source warning uses shared requiredEquipmentWarnings and requests a recorded reason before moving. Unrelated moves do not flag pre-existing shortages; moving a spare bow is allowed if every model keeps one. Clerics and stash sources remain exempt. Label now says Reason for moving anyway.

Validation:22focused and2,054ordinary tests pass; build/typecheck pass; lint3oldwarnings. Disposable390px mobile QA moved an Outlaw's lastbow to stash, verified disabledbutton untilreason, savedwarning/reason inhistory, then movedbow back withnoreasonneeded. Verified quantities, unchanged100gc, nooverflow/pageerrors andcleanedfixtures. InitialQA-script typo andlocalJWTfutureclockerror were corrected/retried; finalpass /tmp/stirheim-required-kit-move-browser.log. Otherlogs /tmp/stirheim-required-kit-move-{tests,all-tests,build,lint}.log. NoSQL/push/deploy.

Remaining#67 creation-only Hunting Arrows/Ithilmar and Slayer clauses. Item sales can still remove mandatorykit with roster warning afterward; pre-sale sourcewarning is a potential follow-up, not claimed complete. Allchangeslocal; production unchanged. Morningquestions unchanged.


## Next local batch — #67 initial Outlaw Hero Hunting Arrows

Builder now offers Hunting Arrows at30gc to Heroes of both Outlaw lists, in a new Miscellaneous equipment section. Published source: original grade1bpart2:902–907 specifically waives rarity at initialHero recruitment; Redux grade2apart2:353–360 lists Heroes-only miscellaneous startingequipment. LaterTradingPost catalogue rarity remainsunchanged. New options pass existing campaignbanfilter. Henchmen are not granted this initialHero exception.

Validation:57focused and2,056ordinary tests pass; build/typecheck pass; lint3oldwarnings. Tests verify realtemplateHerooptions,30gcdraftcost, saveditemstack, nohenchmanoffer, unchangedrareavailability andmiscsectiongrouping. NoDBchange orbrowserQA claimedforthisbuilderextension. Logs /tmp/stirheim-initial-arrows-{tests,all-tests,types,build,lint}.log. NoSQL/push/deploy.

Stillopen: initialHero recruitment after warbandcreation is a separateflow and has not gained this exemption; originalOutlawMarksmen's laterarrowpermission merits source-specific check (table permits Heroes/Marksmen, raritywaiver Heroesonly). WoodElfIthilmar source grade2apart2:2285 means cheaperinitialprices/noinitialrarity, NOT a permanentbanonlaterpurchases; existingbuildermaterialoptions use listmultipliers, TradingPost usescatalogueprice/rarity. Need verifyHero-onlyinitialdiscount andavoidextendingdiscountaftercreation. #67 remains partial. Morningquestionsunchanged.


## Next local batch — #67 Wood Elf initial Ithilmar benefit

Verified existing builder prices already use20gc Ithilmar sword /60gc armour, while later Trading Post catalogue uses30gc/90gc and normalrarity (before anyapprovedarmourhouse-rule). Added missing starting-benefit warning for non-Hero recipients atcreation. It remains an overrideable warning, consistent with Tom's policy; no new permanentban on later purchases or on legallyheldgear. Source grade2apart2:2285.

Validation:58focused and2,058ordinary tests pass; build/typecheck pass; lint3oldwarnings. Realtemplate tests pin initialcost versuslatercost/rarity andHero/henchman/held-item distinctions. NoUI/DBchanges ornewbrowserQA. Logs /tmp/stirheim-ithilmar-{tests,all-tests,build,lint}.log. NoSQL/push/deploy. #67 stillpartial for Slayerclauses andOutlawinitialHero recruitment-aftercreation exception; pre-sale mandatorykitwarning optionalfollow-up. Morningquestions unchanged.


## Next local batch — #67/#59 Slayer rules and Rememberer exception

Split core Troll Slayer equipment bans (Treasure Hunters/Rangers/Pit Fighters: all missiles forbidden) from Slayer Cult rules (thrown missiles allowed). Cult Giant Slayer/Doomseeker/Troll Slayers/Axe Hurlers/Stubbles now share armour/helmet/non-thrown bans and constant-save cloak warnings. Lucky Charms and cloaks that only modify being hit are not assigned a save-cloak ban. Removed incorrect warband-wide armour ban so the explicitly non-Slayer Rememberer can use his printed armour/shield/buckler/pistol/crossbow list. Sources core1a:2193,grade1bpart1:1649,grade1bpart2:1521,grade2apart1:680,783–815 andRememberer Not a Slayer.

Added noMagic data for the5CultSlayer unit types; Arcane Lore/Sorcery/Warrior Wizard picks now show the source rule warning, including through availableSkills. Rememberer exempt. Approved overrides/imported spells remain; no destructive spell removal or hard block. This does not claim every possible manual magic-entry path is restricted.

Validation:41equipment/campaignfocused and12skillfocused tests pass;2,060ordinarytests pass; build/typecheckpass; lint3oldwarnings. TestscovercorevsCultthrownweapons, all5Culttypes, savecloaks/LuckyCharm, actualRemembererlist andskillpickerannotation. NoUI/DBchanges ornewbrowserQA. Logs /tmp/stirheim-slayer-equipment-tests.log,/tmp/stirheim-slayer-magic-tests.log,/tmp/stirheim-slayer-rules-{all-tests,build,lint}.log. NoSQL/push/deploy.

Next#67 remaining: OutlawinitialHero recruitmentaftercreation arrowoption; originalOutlawMarksmen laterarrowpermission; possibly pre-sale mandatorykitwarning. Main#67 entry has historic text nowstale (listmembership saysnotbuilt); consolidate ownlocalprogress underentry withoutlosingunrelatedauditdiff, leavepartialwithspecificremainingclauses. Allchanges remain nextlocalbatch; morningquestions unchanged.


## Next local batch — #67 later Outlaw Hero recruitment and Marksman arrows

Original Outlaw Hero recruitment now offers optional30gc Hunting Arrows with no rarity roll, including afterwarbandcreation. Resolver validateseligibility/campaignban, checkscombinedfunds, adds exactlyonebundle andchargeswithinone rosterupdate. Hirecostoverride doesnotdiscountarrowcost. UIshows combinedprice andrecords clearreason/history; originalOutlawMarksmen nowhave their explicit hunting-arrow permission, whileReduxhenchmen remainexcluded. Source grade1bpart2:902–907. Redux later-recruit exemption notinvented from its startingequipmenttable.

Validation:58focused and2,062ordinarytests pass; build/typecheck pass; lint3oldwarnings. Disposable390px mobileQA createdoriginalOutlaw, recruited60gcLeader plus30gcarrows, verified110gc remainingfrom200, hero/itemownership, reasonhistory,reload/nooverflow/pageerrors andcleanup. Unitchecks covernooption, insufficientfunds, hirecostoverride, bans, wrongwarband, MarksmanvsRedux. Logs /tmp/stirheim-recruit-arrows-{tests,types,all-tests,build,lint,browser}.log. NoSQL/push/deploy.

Main#67 now has a currentlocal-progress summary above historicnotes. Remaining follow-up: pre-sale required-bowwarning (moving alreadycovered), then finalreview beforemarkingwholeitemclosed. Allsourcechangesheldlocal. Morningquestions unchanged.


## Local follow-up — #67 required equipment sales
Selling a warrior’s last required Outlaw bow now warns before confirmation and requires a saved player exception reason. The existing rule also covers a group falling below one bow per model; Clerics and spare bows remain exempt. Approved overrides remain available. Mobile QA on a disposable local warband verified the disabled confirmation, saved explanation, removed item and correct 5gc payment, with no page errors or overflow. All 25 equipment-list tests and the production build pass. No migration, push or deployment. Broad #67 remains pending final review.


## #67 final local review
Reviewed original scope and named reconciliation clauses against the accumulated equipment changes. Required-bow sale warning is complete; rare quantity caps and brace exception still gate purchases. Marked #67 fixed locally, explicitly awaiting batched deployment. Full ordinary suite 2,062 passed/178 database tests skipped; production build/typecheck passed in preceding sale check; lint three existing audit warnings only. No new SQL/push/deployment. Next independent priority: special weapon consequences (#152/#153); keep Sword Breaker physical weapon loss and reversal as a full lifecycle task, not a text-only checkbox.


## Local #152 follow-up — Tilean pike table constraints
Combat odds now explicitly explain Tilean Pike’s man-sized-or-larger restriction (including named exclusions) and 3-inch reach without entering melee, and state that distance is checked at the table. Its existing one-attack/two-handed maths remain. Merchant Caravans Pike does not inherit those source-specific clauses. Source reference/rules/02-weapons-armour-equipment.md:550–561. All69 odds tests and typecheck pass; no UI-layout, DB or deployment changes. #152 remains partial: Disease Dagger extra wound and other named effects remain outstanding.

Disease Dagger investigation: natural6 hit triggers a target Toughness test; failed test causes an additional wound, not an ordinary replacement wound, and Undead/Possessed are immune. Existing roll-through aggregates saves/injuries around a single wound packet, so preserve separate dagger/infection consequences when implementing; do not silently combine infection with dagger critical wounds or imply current odds include it. Source02:262. Continue this independent implementation or full Sword Breaker loss lifecycle next.
