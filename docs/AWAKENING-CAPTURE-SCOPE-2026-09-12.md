# Awakening and capture recruitment — source and implementation audit (#229)

**Author:** Claude, 12 September 2026 evening, on Codex's request (bus db196ade). **Read-only:** no
application code, migration or data was changed; this file is the only edit. **Scope:** the core
*Spell of Awakening* and every rule by which one warband gains a warrior from another warband's death
or capture — core first, Pirates as Tom named them, other supplements listed for completeness.
Tracker umbrella: #229, merging #95 (capture flows) and the post-battle half of #137.

Method: rule text from `reference/rules/` → exact trigger → who acts, on which roster, when → what the
app does today (file references) → gap → correction constraints. "Out of action" is never a death: every
trigger below fires from a *filed post-battle report* (serious injury roll) or an exploration result.

## Current review checkpoint (Codex, 12 September evening; local only)

The original audit below records the starting position and is not a current completion report. Since it was written:

- Core Awakening has migrations 089/094, owner notifications/cards, retained profile/kit, report safeguards and nine database tests. Tom chose an **agreed recipient**, recorded by the fallen Hero’s player or GM; the three-owner mobile journey passed. Hired-sword eligibility remains a separate source question.
- Core Captured, Pirates, forced henchmen and companions now have durable cases, two-player consent, exact equipment, independent dice/provenance, report dependencies and reversal. Mixed captive exchange is connected to the UI and passed a mobile Hero/companion exchange. Claude’s three-warband cross-flow test also exercises competing exchange acceptance and newest-first reversal.
- Mobile companion capture/return and Pirate mixed-kit allocation passed. The latest ordinary suite passed 2,364 tests and the production build passed. This does not close broader #229: remaining special capture triggers and supplement workflows still need implementation or review.
- Section 1.3 originally misreported already-implemented exploration rewards. The current consumers are `features/postbattle/model/exploration.ts`, `locationXp.ts`, `locationRecruits.ts`, `derive.ts`, `wizard/LocationExperience.tsx`, and `rules/resolve/explorationDiscoveries.ts`. Core Straggler grants Skaven **2D6 gc**, Possessed leader **+1 XP**, Undead one Zombie, or the saved extra exploration die. Prisoners grants Possessed **D3 allocated Hero XP**, Undead **D3 Zombies**, Skaven **3D6 gc**, or others **2D6 gc plus an equipped human group recruit**. These amounts match the scraped core source at Straggler/Prisoners (lines 697–709 and 754–764). Do not recreate these features based on the old “text only” labels.

See FEEDBACK-BATCH-2026-09-12.md for the evolving implementation/verification record. No changes from this batch are deployed.

## 1. The rules, one by one

### 1.1 Spell of Awakening — core Necromancy, roll 1 (`03-campaigns-magic-optional-rules.md:2564`)

> *Difficulty: Auto.* If an enemy Hero is killed (i.e. your opponent rolls 11-15 on the serious injury
> chart after the battle), then the sorcerer may raise him to fight as a Zombie in his servitude. The dead
> Hero retains his characteristics and all his weapons and armour but may not use any equipment or
> skills. He may no longer run, counts as a Henchmen group on his own and does not gain additional
> experience.

The Restless Dead variant lore repeats it as roll 6 for "the Necromancer or Liche"
(`03:2679`, `warbands/restless-dead-variant.md:487`). Catalogue ids: `spell_of_awakening` in both lores
(`src/rules/data/campaign/magic.ts:1419`, `:1548`), `difficulty: null` (auto), used by Undead
Necromancer and Restless Dead Necromancer/Liche.

| Element | Exact reading |
|---|---|
| Trigger | The *enemy* player's filed report rolls **11–15 Dead** for a **Hero** (not a henchman, not a hired sword — the text says Hero; hired swords are Heroes for injury purposes but the rule is silent; a ruling is needed, see §5). |
| Eligible recipient | A Necromancer/Liche **who knows the spell** (`spellIds` includes `spell_of_awakening`) **and fought in that battle** ("your opponent" — the same match). Nothing requires him to have cast anything or to be alive at the end, but a dead or captured caster obviously cannot act; treat "active after his own report" as the practical condition. |
| Timing | After both reports: the victim's (to establish Dead) and the caster's own (so the caster's status is known). No dice. |
| Effect on the caster's roster | A **new henchman group of one** with the dead Hero's **characteristics** (all nine stats as they stood, including advances), his **weapons and armour** (as items on the group), no skills usable, no equipment usable, cannot run, gains **no experience** (so never advances), no upkeep, rating counts as a henchman. Name: the rule does not say; keeping "<Hero name> (Zombie)" is the obvious record. |
| Effect on the victim's roster | The Hero is dead regardless; the core Dead result says his equipment is *lost* — Awakening overrides that for weapons and armour only (they go to the zombie); other equipment (potions, tomes, lucky charms…) stays lost. |
| Limits | One raise per dead Hero. The rule says nothing about how many Heroes one sorcerer may raise per battle — read as unlimited, each requiring a dead enemy Hero. Ambiguous in three-plus-player battles when two enemy casters know the spell (§5). |

**Today:** catalogue text only. No consumer in `src/features`, `src/domain`, `src/api` or migrations
(confirmed by grep for `awakening` — only the importer, casting tests and catalogue). The victim's report
marks the hero `dead` and puts his item rows in `remove_item_ids` (`derive.ts:49`, `:849`); the enemy is
never told, nothing is offered, nothing can be accepted, and the kit is gone once the report is applied.
**Gap: the whole flow.**

### 1.2 Captured — core serious injury 61 (`03:196`)

> He may be ransomed at a price set by the captor or exchanged for one of their warband who is being held
> captive. Captives may be sold to slavers at a price of D6×5 gc. Undead may kill their captive and gain a
> new Zombie. The Possessed may sacrifice the prisoner; the leader gains +1 Experience. Ransomed or
> exchanged captives retain all weapons, armour and equipment; sold, killed or zombified captives leave
> their weaponry with their captors.

| Element | Exact reading |
|---|---|
| Trigger | The victim's filed report rolls **61 Captured** for a Hero (hired swords included by injury rules). |
| Captor | "the other warband" — unambiguous in a two-warband battle; in a multi-warband battle the rules do not say (the app's `takenOutBy` attribution is the natural default, overridable). |
| Actors | Both owners: the captor sets the ransom or chooses sell/kill/sacrifice; the victim's owner pays or accepts an exchange. |
| Effects | Gold moves (ransom, or D6×5 from slavers to the captor); an exchange swaps two captives; Undead gain a **standard Zombie** henchman (unlike Awakening, no stats carry over); Possessed leader +1 XP; equipment per the last sentence. |

**Today (implemented, #95, migration 037 `resolve_captive_rosters`):** `src/rules/resolve/captives.ts`
(`resolveCaptive`, `captiveOutcomes`) and `features/roster/view/CaptiveCard.tsx` implement ransom, exchange,
sell (D6), Undead zombie (via `recruitHenchmen(... 'undead_zombies' ... costOverride 0)`), Possessed and
Amazon sacrifice (+1 XP with pending-advance insertion), plus supplement variants (Hashut sacrifice/slave
work, Cavalcade Throne of Worms, Court Wretch). The RPC changes both rosters atomically with stale-snapshot
checks. Verified in the earlier capture work, not re-run today.

**Gaps against #229's acceptance list:**
- **Who initiates.** The card lives on the *victim's* roster page and requires "the owner of both warbands
  or the GM" to record it. The captor — whose choice it is — cannot open it from his own roster, and a
  normal two-player campaign (different owners) can only be resolved by the GM. There is no notification
  to either side that a captive is waiting.
- **Captor identity** is chosen from a dropdown "agreed at the table"; the report's `takenOutBy` record is
  not used to pre-fill or check it.
- **No pending state.** A captured hero simply sits at status `captured` with no due action, no reminder,
  no expiry.
- **No undo** of a resolved outcome (the RPC has no reverse; the audit log names the reason). Withdrawing
  the victim's report after a resolution is not blocked.
- **Pirates' Kidnapped! alternative** is absent (`captiveOutcomes` has no `pirates` branch) — §1.4.

### 1.3 Core exploration finds that hand over people (`exploration.ts:122`, `:263`; source `03:739–764`)

| Result | Warband | Rule | Today |
|---|---|---|---|
| **44 Straggler** | Skaven | sell to Clan Eshin, +2D6 gc | text only |
| | Possessed | sacrifice, leader +1 XP | text only |
| | Undead | kill and gain **one Zombie** free | **implemented** (`locationRecruits.ts`: zombie recruit, choose group or new) |
| | anyone else | interrogate: one extra exploration die next battle | text/notes placeholder (`ExplorationStep.tsx:356`) |
| **333 Prisoners** | Possessed | sacrifice, **D3 XP** among Heroes | text only |
| | Undead | **D3 Zombies** free | **implemented** (`locationRecruits.ts`, D3 die) |
| | Skaven | sell, +D6×5 gc | text only |
| | anyone else | one free **human** henchman for an existing group | **implemented** (`locationRecruits.ts`, human profile match) |

These are single-roster (no other player involved) — they belong to the report wizard, not to a
cross-player flow. Listed because #229's report mentions them next to capture and because the Possessed and
Skaven halves are still text.

### 1.4 Pirates — Town Cryer #9 (`warbands/grade-1b-part2.md:1002–1016`, `:1348`)

| Rule | Exact reading | Today |
|---|---|---|
| **Kidnapped! (Hero)** | An enemy **human** Hero who rolled **61 Captured** may, *instead of* ransom/exchange/sale, be offered the crew: both players roll 2D6, Pirate adds the **Captain's Ld**, the other adds the **captive's Ld**, the battle's **winner adds +1**. Pirate higher → the Hero joins a **Crew** group (new, or one with ≤ 4 models): his skills and stats become a starting Crewman's (or match the group he joins), his equipment is **sold off in an even swap** for Crew kit. Otherwise he becomes a **Swabbie**: keeps stats and skills, **stripped of all equipment** (the Pirates keep it), re-armed only from the Swabbie list. | **Not implemented** — `captiveOutcomes` has no Pirates branch; no contest, no Crew/Swabbie transformation. |
| **Kidnapped! (Henchmen)** | Enemy **human henchmen** taken out of action **and lost for good (1–2 on the henchman survival roll)** — only if the **Pirates won** — roll D6 each: on **4+** the Pirates carry the body off; then the same Ld contest (Pirate always +1). Join Crew or Swabbie as above. | **Not implemented.** Also needs the *victim's* group survival dice per model, which the report records only as a count (`line.rolls`, `dead`), not per named model. |
| Never | Hired Swords and Dramatis Personae. | n/a |
| **Stragglers / Prisoners** | Instead of the ordinary result: Straggler → Captain's Ld test → Swabbie. Prisoners → D3 rescued, a Ld test *each* → Crew (new or ≤ 4 group; pay to arm, else Swabbie) or Swabbie. | **Implemented** (`pirateRecruits.ts`, `PirateRecruits.tsx`, tests). |

The Pirates faction id in code is `pirates` (`locationRecruits.ts:16`).

### 1.5 Other supplement rules that move warriors between rosters (from the #95 reconciliation)

Not audited clause-by-clause today; status from the tracker and `captiveOutcomes`:
implemented — Hashut sacrifice/slave work, Cavalcade Capture!/Throne of Worms, Court Cruel Fate (Wretch),
Amazon sacrifice; **still open** — Black Dwarf Man-catcher/Engine of Chaos/Hashut's Reward captives, Clan
Moulder Subjugator, Ogre devouring for XP, Pit Fighters "In the Pit" (+2 XP, +50 gc; may never sell
captives), capture weapons (Man-catcher, Slaaneshi Man-Catcher, Thingcatcher). #137's post-battle
transformations (Call of Ulric etc.) are single-roster and separate.

## 2. What the app already has that a cross-player flow can stand on

- **Reports are readable by everyone in the campaign** (`match_reports_select` uses `can_read_campaign`,
  `rls.sql:425`). So the enemy's Dead/Captured results are visible in principle; `postBattleLog.ts` already
  renders "X: rolled … — Dead" lines on the match page for all participants. Nothing turns that into an
  offer.
- **`takenOutBy` / `takenOutByDetail`** on the report context (`derive.ts:125–127`): who took each model out,
  with warband and model ids — a ready default for "which warband captured him".
- **Two-roster atomic RPC** `resolve_captive_rosters` (migration 037): stale-snapshot checks, both halves via
  `update_roster`, pending advances inserted — reusable for Awakening's roster change.
- **Realtime pattern**: `battle_prompts` (migration 026, `api/matches.ts:343`) is a durable, per-match,
  attacker→target question with `state: waiting | answered | withdrawn` and a realtime channel; `battle_turns`,
  `battle_dispels`, `battle_bribes` use the same `postgres_changes` subscription. There is **no** post-battle
  or campaign-level notification table.
- **`pending_advances`** is the one existing "durable action owed to a player" table; the Advancements
  nav glow is its UI pattern.
- **Report withdrawal** (`withdraw_battle_report`, latest body in migration 071) restores the rows a report
  changed — today's Bitter Enmity integration test relied on it restoring hero flags. It knows nothing about
  a second roster that acted on the report's results.
- **`new_groups` in `ReportApplied`** (`report.ts:138`) lets a report create a henchman group with custom
  stats — the shape an Awakening zombie needs (stats copied, not the template's).

## 3. Gap matrix against #229's acceptance list

| Acceptance point | Awakening | Captured (core) | Pirates Kidnapped! |
|---|---|---|---|
| Qualifying final death/capture recognised | ✗ nothing reads Dead results | ✓ status `captured` set by the report | ✗ (Hero ✓ via `captured`; henchmen: per-model loss not recorded) |
| Eligible recipient identified | ✗ | ✗ captor typed in by hand | ✗ |
| Notification to both owners | ✗ | ✗ | ✗ |
| Accept / decline with record | ✗ | partial — outcome recorded, no decline record, GM-only in practice | ✗ |
| Exact transformed profile / equipment / limits | ✗ | ✓ for the five core outcomes (standard Zombie) | ✗ |
| Durable pending action | ✗ | ✗ (status only) | ✗ |
| Duplicate prevention | ✗ | partial (status flips on resolve) | ✗ |
| Report correction / withdrawal safe | ✗ | ✗ no reverse; withdrawal not blocked | ✗ |

## 4. Correction constraints (what any design must respect)

1. **A death is only final when the report is final.** The victim can withdraw or have the GM return a
   report. An accepted Awakening must either be withdrawn with it (delete the zombie group and its items,
   with an audit line) or **block** the withdrawal until the zombie's owner or the GM removes it with a
   reason. The same applies to a Kidnapped Crewman/Swabbie.
2. **Snapshot at filing.** The Dead result deletes the hero's item rows; the zombie needs stats and
   weapons/armour *as they were*. The offer must carry a snapshot (name, stats, equipment rows by id and
   rules id) taken when the report is filed — not read later from a roster that no longer has them.
3. **One recipient per subject.** Unique (report id, hero id, rule) offer; accepting one closes the others
   (multi-caster battles).
4. **Reasoned overrides survive.** A player may decline, or the GM may record a table exception (e.g. the
   zombie keeps a lucky charm) — record the reason, never silently.
5. **No silent roster edits across owners.** Every cross-roster change goes through a security-definer or
   dual-`can_edit_warband` RPC with the same stale-snapshot discipline as `resolve_captive_rosters`, and
   both audit logs name the match and the other warband.
6. **Do not rebuild what exists.** Ransom/exchange/sell/zombie/sacrifice and the Pirates' exploration
   recruitment stay as they are; the new layer is *offer → notify → accept/decline → apply*, with the
   captive card gaining a captor-side entry point and a pre-filled captor.

## 5. Rulings needed from Tom (concise)

1. **Hired swords as Awakening targets?** The spell says "Hero"; hired swords roll on the Hero injury
   chart. Recommend: yes, they count (simplest, and the injury rules treat them as Heroes) — unless Tom
   prefers RAW-narrow.
2. **Several eligible casters in one battle** (three or more warbands): first to accept, or the one whose
   warband took the Hero out (`takenOutBy`), or GM decides? Recommend: offer to all eligible, first accept
   wins, others closed — with the GM able to reassign.
3. **Zombie name and kit detail:** keep the Hero's name with "(Zombie)"; weapons and armour move, everything
   else is lost with the corpse. Confirm.
4. **Kidnapped! contest dice:** both players roll — a shared prompt (like `battle_prompts`) or the Pirate
   enters both results with the victim's confirmation? Recommend the latter with a confirmation step; the
   former is more work for little gain.

## 6. Suggested build shape (for Codex to size, not a claim on files)

- **Schema:** `cross_roster_offers` (id, campaign_id, match_id, source_report_id, kind
  `awakening | kidnap_hero | kidnap_henchman | captive`, from_warband_id, to_warband_id, subject jsonb
  snapshot, state `offered | accepted | declined | withdrawn`, resolved_by, reason, created_at, resolved_at;
  unique (source_report_id, subject id, kind)). RLS: readable by both owners and the GM.
- **Creation:** in `submit_battle_report` (server side, so it cannot be skipped): for each Dead Hero, one
  `awakening` offer per other participant whose active roster has a caster knowing `spell_of_awakening`;
  for each Captured Hero, one `captive` offer to the `takenOutBy` warband (overridable); Pirates offers when
  a `pirates` participant qualifies. `withdraw_battle_report` marks the report's offers `withdrawn` and
  refuses when one is `accepted` unless the GM passes a reason.
- **Notification:** a campaign-level "Offers" card on the dashboard and the roster page for the
  recipient (badge like the Advancements glow), realtime via `postgres_changes` on the table; the victim
  sees "awaiting <warband>" on the captured/dead hero's line.
- **Accept:** an RPC per kind that applies both halves atomically: Awakening → `new_groups` entry with
  the snapshot stats, items copied from the snapshot to the group, flags `{ noRun: true, noExperience: true,
  equipmentUnusable: true }`, template `undead_zombies` (or the Restless Dead zombie) for rules text; Captured →
  reuse `resolveCaptive`; Kidnapped → contest inputs then Crew/Swabbie transformation.
- **Tests:** resolver unit tests per kind; integration test on the local stack for offer creation on
  submit, withdrawal blocking, and accept atomicity; a headless walk-through with two owners (GM + player
  seeded accounts) proving the notification and both rosters updating.
- **Order:** core Awakening → captor-side captive entry and notifications → Pirates Kidnapped! (hero, then
  henchmen, which also needs per-model group loss recording in the report) → supplements from §1.5.
