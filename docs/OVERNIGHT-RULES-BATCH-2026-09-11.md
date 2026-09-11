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
