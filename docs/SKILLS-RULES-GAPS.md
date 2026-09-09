# Skills — rules audit (audit #3 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet pushed to FEEDBACK-TRACKER.md
**Sources compared:** `reference/rules/03-campaigns-magic-optional-rules.md` (core skill lists, lines 339-565) and
`reference/rules/warbands/*.md` (warband skill tables and special skill lists) against `src/rules/data/skills.ts`,
`src/rules/data/campaign/warbandSkills.ts`, the `skillTableIds` on every hero template, `src/rules/resolve/advances.ts`,
`src/rules/resolve/skillRestrictions.ts`, `src/rules/resolve/casting.ts`, `src/rules/resolve/grimoires.ts`,
`src/rules/engine/buildAttackInput.ts` and `src/features/advances/*`.

**Method.** (1) Script-compared every warband skill access table in the markdown against each hero's `skillTableIds`
(73 warband templates, 8 checked by hand where the table headings did not parse). (2) Script-compared every warband special skill
list by name and count against `WARBAND_SKILL_TABLES` (56 tables). (3) Read the core skill catalogue and grepped the
resolve/engine/feature layers for every core skill id. (4) Probed `skillRestrictionBlock` with every data restriction
against every hero template of its warband to see who it actually blocks.

---

## What is modelled

- **Advance flow.** `availableSkills` lists the hero's tables (core + the warband's own tables via `warband-unique`),
  hides skills already known and campaign-banned skills, and annotates restricted picks with `blocked`. `learnSkill`
  refuses a skill from a table the hero does not have (`SKILL_TABLE_NOT_AVAILABLE`) and refuses duplicates.
  Wizards may learn a spell instead. Restricted picks are **soft**: the UI shows a "Restricted" tag and the reason,
  and the pick goes on the record ("outside its restriction").
- **Fight calculator.** 19 core skills have an engine effect (see table B): Strike to Injure, Combat Master, Web of
  Steel, Expert Swordsman, Step Aside, Quick Shot (bow/crossbow list), Pistolier, Eagle Eyes, Nimble, Trick Shooter,
  Knife-Fighter, Mighty Blow, Pit Fighter, Resilient, Unstoppable Charge, Dodge, plus Master of Blades, Thick Skull,
  True Grit. `skillSensitivity.ts` scores which skill would help most. The Lookout-Gnoblar grants Dodge in the fight
  adapter.
- **Campaign hooks.** Sorcery is a casting skill (`CASTING_SKILL_IDS`) and adds its +1 to the casting roll; Arcane
  Lore gates Tome of Magic / Book of the Dead in `grimoires.ts`; two units get skills at recruitment via `startingSkillIds` (Carnival Brutes → Strongman,
  Cursed Cavalcade Companions → Expert Swordsman). Rewards of the Shadowlord has a house-rule route.
- **Warband skill data.** All 38 warbands that publish a special skill list in the markdown have a table in data, and
  every list's skill names match by name (the only count differences are headings my parser counted, or Troll Slayer
  sub-lists that data correctly folds into the parent warband). 75 restriction strings are carried verbatim.

---

## A. Cross-cutting gaps

1. **18 skills have no effect anywhere in the app** (`modeled: false` and no code reads the id):
   Weapons Training, Weapons Expert, Hunter, Fearsome, Strongman, Leap, Sprint, Acrobat, Scale Sheer Surfaces,
   Lightning Reflexes, Jump Up, Battle Tongue, Streetwise, Haggle, Wyrdstone Hunter, Warrior Wizard, plus the
   warband-unique Extra Tough and Resource Hunter. (Of the 20 skills flagged `modeled: false`, only Sorcery and
   Arcane Lore are read by campaign code.) Several of these are **campaign-side** rules the tracker could
   apply mechanically, not just tabletop effects:
   - **Streetwise** (+2 to rare-item availability rolls) — the trading resolver has `rareRollBonus` for warband rules
     but never checks hero skills.
   - **Haggle** (2D6 gc off one purchase per trading sequence, min 1 gc) — nothing in trading reads it.
   - **Wyrdstone Hunter** (re-roll one exploration die) — `explorationAids.ts` handles items, not this skill.
   - **Weapons Training / Weapons Expert** (may use any hand-to-hand / missile weapon) — `equipmentBans` and the
     equipment-list checks never consult the hero's skills, so a Skaven with Weapons Training is still told a
     halberd is off-list.
   - **Strongman** (double-handed weapons lose "strike last") — engine has no `strikesLast` toggle for it.
   - **Warrior Wizard** (cast in armour) — `casting.ts` blocks casting in armour and has no exception for this skill.
   - **Fearsome** (causes Fear) — traits layer never adds Fear from a skill.
2. **Core skills carry no restrictions in data.** The `Skill` type has no `restriction` field, so none of these
   are annotated in the picker: Quick Shot (bows/crossbows only, and Nimble / Knife-Fighter cannot be combined with
   it); Battle Tongue (leader only; not Undead); Sorcery (spellcasters only; not Sisters of Sigmar or Warrior
   Priests); Arcane Lore (not Witch Hunters, Sisters or Warrior Priests); Warrior Wizard (wizards only). A Sister of
   Sigmar can take Sorcery without a note.
3. **Restrictions are soft everywhere.** By design the picker only warns. Worth confirming Tom wants "on the record"
   rather than a hard block for the unambiguous cases (leader-only, prerequisite skill).
4. **Skills granted at recruitment are mostly missing.** `startingSkillIds` exists but is populated for 2 units.
   The rules give skills to: all six Pit Fighters hero/henchman types (Pit Fighter skill); Imperial Outriders
   Knight/Outrider/Scout/Chasseur/Horseman/Groom (Ride; Horsemen also Combat Riding; Grooms also Animal Handling);
   Marauders of Chaos heroes (Ride Warhorse, including promoted henchmen); Bretonnian Chapel Guard Questing Knight
   (Ride Warhorse); Nipponese Hatamoto and Retainers (Ride); Cursed Cavalcade Fighting Apes (Scale Sheer Surfaces,
   Acrobat, Dodge); Mazzalupo Master of Finances (Haggle); Order of the Mare knights (Ride, optional Blazing Saddles).
5. **No cavalry skills exist in the catalogue.** Ride, Ride Warhorse, Combat Riding, Trick Riding, Horse Archer,
   Cavalry Commander, Evade, Running Dismount, Athletic Mount, Mounted Combat Master, Beast Handler (Blazing Saddles,
   `03-campaigns-magic-optional-rules.md` ~4548) are absent, so Imperial Outriders' "Cavalry" column and the Knights
   of the White Wolf hired sword point at nothing.
6. **Skills that change what a hero may learn are not wired.** Powerful Build (Dark Elves, Shadow Warriors: opens the
   Strength table), Proven Warrior (Black Orc Young'un becomes a Black Orc with its skill lists), Big Bully
   (BigSnotz immediately learns one Strength skill), Renowned Virtue (Chapel Guard: learn one Virtue from the
   Bretonnian list), Forest Goblin Brave (may remove Animosity instead of taking a skill). Nothing edits
   `skillTableIds` or grants a follow-on pick after a skill is learned.
7. **Skills with post-battle effects are text only** (belongs with audits #8/#9 but noted here): Song of Honor
   (+1 XP to all if a Slayer died), Seeker / Wyrdstone Hunter (exploration die), Fungus Farmer, Resource Hunter,
   Body Dealer, Chaos Engineer, Bribery, Haggle, Streetwise.
8. **Eagle Eyes is approximated** as +6" range on all ranged weapons via `rangeExtension`. That matches the text.
   No issue, just flagging that the engine's long-range threshold shifts with it.
9. **Hired sword and Dramatis Personae skills** (starting skills, table access from the "Skills" prose) are out of
   scope here; audit #4 covers them.

---

## B. Core skill status

| Table | Modelled in fight calc | Text only (no effect anywhere) |
|---|---|---|
| Combat | Strike to Injure, Combat Master, Web of Steel, Expert Swordsman, Step Aside | Weapons Training |
| Shooting | Quick Shot, Pistolier, Eagle Eyes, Nimble, Trick Shooter, Knife-Fighter | Weapons Expert, Hunter |
| Academic | Sorcery (+1 to cast) and Arcane Lore (grimoires) via campaign code, not the fight calc | Battle Tongue, Streetwise, Haggle, Wyrdstone Hunter, Warrior Wizard |
| Strength | Mighty Blow, Pit Fighter, Resilient, Unstoppable Charge | Fearsome, Strongman |
| Speed | Dodge | Leap, Sprint, Acrobat, Lightning Reflexes, Jump Up, Scale Sheer Surfaces |
| Extras in data (`warband-unique` category) | Master of Blades, Thick Skull, True Grit | Extra Tough, Resource Hunter |

All 34 core skills printed in the rulebook are present in `skills.ts` (6 Combat, 8 Shooting, 7 Academic, 6
Strength, 7 Speed, checked heading by heading); the five extras are Dwarf skills that data also
lists inside the Dwarf warband tables, so they appear twice under different ids (`thick_skull` and
`dwarf_treasure_hunters_thick_skull`).

---

## C. Warband skill tables and access

**Access tables.** Every hero `skillTableIds` matches the printed table, including Middenheim, Marienburg, the
three Tilean towns, Stirwood original and redux, Night Goblins, Masters of Horror, Protectorate and the Restless
Dead variant. Exceptions:

1. **Ostermark Mercenaries** — the rules say the player picks one of the other Mercenary tables; data hard-codes
   Reikland's (Champions combat/shooting/strength, Youngbloods combat/shooting/speed) with no choice.
2. **Court of the Profane Pleasures** — every hero has `skillTableIds: []` (the rules admit no table was published),
   so a Court hero rolling "New Skill" gets an empty picker. Needs a house-rule fallback or at least a note.
3. **Forest Goblins Brave** — given `warband-unique` but the warband has no skill table; the printed asterisk is
   "may remove Animosity instead of a skill", which is an action, not a table.
4. **Imperial Outriders** Knight/Outrider/Scout — `warband-unique` stands for the "Cavalry" column, but no cavalry
   table exists (A5).
5. **Protectorate of Sigmar** — data gives all four heroes `warband-unique`; the printed table has no Special column
   but the text says "Heroes with access to Special Skills may use the following list". Ambiguous in the source;
   data's reading is the generous one. Flagging, not calling it wrong.

**Orphaned tables (unreachable from any hero).**

6. `tomb_guardians_additional_skills` (Drive Chariot, printed as an *Academic* skill) — no Tomb Guardian hero has
   `warband-unique`, and the resolver only reaches warband tables through that token, so nobody can learn it.
7. `sorcerous_society_additional_academic_skills` (Scribe, Mind Focus, Magical Aptitude) — same problem; Magus and
   Mages have Academic only. These three are also casting skills the app already understands (`CASTING_SKILL_IDS`),
   so this blocks a modelled feature.

**Skill lists.** All names match. Minor: Dwarf Slayer Cult's printed Deathwish restriction reads
"[Stubbles and Axe Hurlers Only] … Slayers Only"; data keeps "Slayers Only" (reasonable).

---

## D. Restriction resolver — concrete misfires (`skillRestrictions.ts`)

Probed each data restriction against each hero of its warband with an empty skill list and no roster.
Prerequisite-skill blocks (Censer Bearer, Contagious, Ignore Pain, Sweeping Blow) correctly block everyone in that
probe, so they are not listed. 54 of 75 restrictions behave. These do not:

| # | Warband :: skill | Restriction text | What happens | Why |
|---|---|---|---|---|
| 1 | Dwarf Treasure Hunters & Dwarf Rangers :: Ferocious Charge, Monster Slayer, Berserker | "Troll Slayers only" | **blocks the warband's own Troll Slayer** | `SUBJECT_UNITS["troll slayers"]` lists only Slayer Cult unit ids |
| 2 | Night Goblins :: Sneaky Git | "Night Goblin Big Boss only" | blocks the Big Boss | name match needs every word; "night", "goblin" are not in "Big Boss" |
| 3 | Halflings :: Stealthy | "halfling thieves only" | blocks the Halfling Thief | `SUBJECT_UNITS["halfling thieves"]` lists only the Mootlanders id |
| 4 | Snotlings :: Worm | "Scout and Promoted Runts only" | blocks Snotling Scouts | "promoted", "runt" not in the unit name |
| 5 | Wood Elves :: Seeker | "Only one Elven Hero may possess this skill!" | blocks every hero | the "only X may" regex captures "one elven hero" as a unit type; the one-per-warband limit is checked earlier but does not stop the later check |
| 6 | Dark Elves :: Powerful Build | "The Sorceress may never take this skill and no more than two…" | Sorceress is never blocked | exclusion regex captures "this skill" as the subject, so the `^the X may never take` fallback never runs |
| 7 | Horned Hunters :: Pathfinder | "A warband may only contain one pathfinder" | never enforced | limit regex needs "warriors/heroes/models" |
| 8 | Norse Explorers :: Battle Tongue | "Only a hero with the leader skill may gain this skill" | never enforced | the leader check deliberately skips text containing "leader skill" |
| 9 | Dreamwalkers :: Inspiring Presence, Fanatical | "Only for Dreamer" | never enforced | "only" regex requires " may" or " can" after the subject |
| 10 | Maneaters :: Maneater | "may be taken only once" | once-only not enforced (Guide exclusion works) | no pattern for "only once" |
| 11 | Sorcerous Society :: Scribe, Magical Aptitude | "warrior capable of casting spells" | Companions (non-casters) allowed | intentional `return null` for caster subjects; could use `canCast` from casting.ts |

Same-shape data present but not probed against rosters: Shadow Warriors Powerful Build "never more than two Elves",
Dark Elves "no more than two warriors" — these hit the limit regex and should work when a roster is passed.

---

## E. Data errors

1. `dwarf_treasure_hunters` and `dwarf_rangers` Troll Slayer skills are blocked for Troll Slayers (D1) — fix in
   `SUBJECT_UNITS` or drop the id list for that key so the name match runs.
2. `SUBJECT_UNITS["halfling thieves"]` should include the Halflings warband's thief unit id (D3).
3. Ostermark hero `skillTableIds` should be a player choice, not Reikland's copy (C1).
4. Court of the Profane Pleasures heroes have no skill tables (C2).
5. `tomb_guardians_additional_skills` and `sorcerous_society_additional_academic_skills` are unreachable (C6-7);
   either give the heroes `warband-unique` or let Academic-tagged warband skills ride on the Academic table.
6. Forest Goblin Brave and Imperial Outriders heroes carry `warband-unique` with no table behind it (C3-4).
7. `startingSkillIds` missing for the units in A4.
8. Bretonnian Chapel Guard :: Renowned Virtue has no `restriction` although the text says "may only be taken once".
9. Core skills have no restriction text (A2) — needs a `restriction?: string` on `Skill` and data for the six.
10. Duplicate Dwarf skills under two ids (B) — harmless unless a hero could take both `thick_skull` and
    `dwarf_rangers_thick_skull`, which nothing prevents.

---

## F. Fine as text

Tabletop-only effects the tracker does not need to compute: Leap, Sprint, Acrobat, Jump Up, Lightning Reflexes,
Scale Sheer Surfaces, Hunter, Battle Tongue's 12" bubble, Fearsome (unless the fight calculator gains a Fear
model), and the bulk of warband special skills (Infiltration, Netter, Sand Worm, Hide in Shadows, etc.). The
`modeled: false` flag already keeps them visible in the picker with their text.
