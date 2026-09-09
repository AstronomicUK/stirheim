# Hired Swords and Dramatis Personae — rules audit (audit #4 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet pushed to FEEDBACK-TRACKER.md
**Sources compared:** `reference/rules/04-hired-swords.md` (general rules plus 72 entries),
`reference/rules/05-dramatis-personae.md` and the Dramatis Personae section of
`reference/rules/03-campaigns-magic-optional-rules.md` (lines 1216-1246) against
`src/rules/data/campaign/hiredSwords.ts` and `dramatisPersonae.ts`, `src/rules/resolve/recruitment.ts`
(hire, upkeep, kit parsing), `rating.ts`, `injuries.ts`, `dramatis.ts`, `src/features/advances/model.ts`,
`src/features/postBattle/model/xp.ts`, `src/features/match/battle/routCheckRules.ts` and `sheet.ts`,
`src/features/recruitment/HiredSwordsTab.tsx` and `helpers.ts`, and the trading tabs.

**Method.** Read the general rules line by line against the code path for each. Then probed all 102
entries (72 hired swords, 30 personae) in a throwaway test: hire fee and upkeep parsing, stat profile
presence, rating parsing, kit parsing, skill-table derivation and racial-maxima resolution.

---

## What is modelled

The administrative frame is in good shape and several of the fiddliest general rules are right:

- **Hire and dismissal.** `hireHiredSword` pays the fee, refuses a second of the same type, refuses an
  entry with no stat profile or no plain gold fee, and builds the roster entry from the printed
  profile and kit. `dismissWarrior` and `payUpkeep` handle leaving; failing to afford upkeep sets the
  entry to "left" with the "any experience he gained is lost" wording in the event.
- **Eligibility.** `readRestriction` parses each entry's "May be hired" paragraph against the
  warband's descriptors and returns allowed / restricted / ok / check, and `warbandRestriction`
  applies the warband list's own hiring rule (allow lists, deny lists, deny keywords) on top.
  Campaign bans hide banned entries. This is a genuinely hard piece of text parsing done properly.
- **They do not count as warriors.** `warbandModelCount` and `warbandHeroCount` exclude hired swords,
  so they do not eat roster slots or hero capacity. The income chart excludes them and the Sell
  Wyrdstone tab says so on screen.
- **They count on the table.** The battle sheet counts fighting hired swords in the model total that
  the rout threshold is taken from.
- **No shopping for them.** The Buy tab's holder can only be a hero, a henchman group or the stash,
  and `sellListing` omits hired sword kit, so their equipment can be neither bought nor sold. The
  rules ask for exactly this.
- **Rating.** Each entry's printed "increases the warband's rating by +N points" is parsed and used,
  including the handful that add experience on top; unparsed entries fall back with a note.
- **Advances.** Hired swords are folded into the hero advance flow via `hiredSwordAsHero`, so they
  roll on the Heroes Advancement table as the rules require.
- **Finding a persona.** `resolveCharacterSearch` implements the search properly: any number of
  heroes who did not go out of action, a D6 each, a roll under Initiative finds them, one find is
  enough however many succeed, and searchers are recorded so they cannot also look for rare items.

---

## A. Rules the app currently contradicts

1. **Hired swords are offered as the Leadership for Rout tests.** The rules are explicit: "You may not
   use the Leadership of any of the Hired Swords for Rout tests." `leadershipOptions` in
   `routCheckRules.ts` builds its list from every fighting hero **and hired sword**, and `mayLead` is
   only false for units flagged `neverLeads` — a hired sword has no `unitTemplateId`, so the guard
   always passes. An Ogre Bodyguard on Ld 7 in a Ld 6 warband will be sorted to the top and suggested.
   Fix is one clause: exclude hired swords from `leadershipOptions`, or set `mayLead: false` for them.
2. **Dramatis Personae earn experience.** The rules say plainly: "Special characters do not earn
   Experience points, although they suffer serious injuries, just like Heroes." `warriorXpLine` gates
   on `unitGainsExperience(unitId)`, and a hired sword's `unitTemplateId` is null, which resolves to
   "gains experience". Every persona therefore banks XP and earns advances they should never get.
3. **Dramatis Personae roll the henchman injury die.** Same sentence: they suffer injuries "just like
   Heroes", meaning the full D66 Serious Injuries chart. `applyHiredSwordInjury` applies
   `HENCHMAN_INJURY` (1-2 dead, 3-6 recovers) to every hired sword, personae included. Ordinary hired
   swords are correct; the 30 personae are not.
4. **Nothing tells a persona from a hired sword at runtime.** `findHiredSword` deliberately merges the
   two lists, and there is no `isDramatisPersona(id)` in the rules layer. Findings 2 and 3 cannot be
   fixed until one exists. That is the single most useful change in this audit.
5. **Upkeep is never prompted after a battle.** The rule is "after each battle he fights, including the
   first, you must pay his upkeep if you want him to remain". The post-battle wizard has seven steps
   and none of them mentions upkeep; the word does not appear anywhere in `src/features/postBattle`.
   Paying is a manual action buried in the Recruitment page's Hired Swords tab. A player who forgets
   keeps the hired sword for free, and the app never notices.
6. **Hired swords advance on the Heroes experience boxes.** `warriorXpLine` passes role `'hero'`, so a
   hired sword's advances fall on the Hero thresholds rather than the Henchman ones (2, 5, 9, 14). The
   rules say they "gain experience in exactly the same way as Henchmen" and are written "in one of the
   Henchman group slots", but then roll on the Heroes Advancement table — so the boxes should be the
   Henchman ones and only the table is the Hero one. This is a long-standing community ambiguity, so
   flag it as a question for Tom rather than a certain bug, but the current reading is the rarer one.

---

## B. Entry data the app cannot read

Probe results across all 102 entries.

7. **35 entries are given all five core skill tables by default.** `hiredSwordSkillTables` scans the
   entry's "Skills" prose for the words combat / shooting / academic / strength / speed and grants
   whatever it finds, falling back to **all five** when it finds nothing. But most personae entries do
   not describe tables at all: they list the skills the character already has ("Johann has the
   following skills: Dodge, Scale Sheer Surfaces…"). So Johann the Knife, Aenur, Veskit, Bertha, the
   Dark Jester and 30 others can pick freely from every skill table in the game. Combined with A2 they
   also get advances to spend on that. Affected: 9 hired swords (Clan Skryre Rat Ogre, Elf Mage,
   Kislev Ranger, Old Prospector, Priest of Morr, Witch Hunter, Bone Goliath, Pyromaniac, Chaos Fury)
   and 26 personae.
8. **20 entries name skills the character starts with, and none are granted.** `hireHiredSword` always
   sets `skillIds: []`. So the Knight of the White Wolf does not start with Unstoppable Charge and
   Ride Warhorse, the Ninja does not start with Expert Swordsman, Knife-Fighter and Scale Sheer
   Surfaces, and every persona arrives with none of their listed skills. Their profiles are right;
   their abilities are missing.
9. **16 entries have a unique skill table in the data that nothing reads.** `HiredSwordDetail.uniqueSkills`
   is populated (Troll Slayer Skills, Elven Skills, Merchant Skills, Assassin Skills, Halfling Thief
   Skills, Human Scout Skills, Kislev Ranger Skills, Pathfinder Special Skills, Hobgoblin Skills,
   Pyromaniac Skills, Swordsmith Skill, Ungor Trapper Skills and others) but no code path surfaces it,
   so those skills are unreachable. Same shape as the two orphaned warband tables in audit #3.
10. **3 entries point at a Cavalry skill table that does not exist**: Highwayman, Roadwarden and Knight
    of the White Wolf. No cavalry skills exist in the catalogue at all — this is the same hole as
    section A5 of the skills audit.
11. **81 of 102 fall back to Human racial maxima.** Most are genuinely human, and the keyword match
    works whenever the race is in the name (Dwarf Troll Slayer, Elf Ranger, Ogre Bodyguard, Halfling
    Scout all resolve). The clear misses are where the race is not in the name: **Runesmith Journeyman**
    (Dwarf), **Shadow Warrior** (Elf), **Aenur** (Elf), **Veskit** (Skaven), **Ulli & Marquand** (Ulli
    is a Dwarf), **Chaos Centaur**, **Ninja Gnoblar**, **Chaos Fury**, **Bone Goliath**, **Cursed
    Hillman** and **Khar-mel the Djinn**. Each is capped at human maximums on advances.
12. **60 entries have kit the parser could not resolve to catalogue items**, kept as custom lines so
    nothing is lost. Many are genuinely prose ("Two Axes or a Double-Handed Axe (the hiring player may
    choose)") and correctly left for the player. The ones worth fixing are plain items the catalogue
    should know or alias: Two Axes, three Torches, cloak, Gromril Hammer, Hammer of Sigmar, Whip,
    Pickaxe, Mining Pick, Scimitar, Repeating Crossbow, Cavalry Spear, Rope, Hook, Two Daggers. Six
    entries parse no kit at all: Chameleon Skink, Snake Charmer, Ulli & Marquand, Dark Emissary,
    Truthsayer and Luthor Wolfenbaum.
13. **12 entries have a fee or upkeep that is not a plain number.** Nine cannot be hired at all through
    the app, which disables the button with an honest message: Old Prospector (2 treasures, 1 treasure
    upkeep), Priest of Morr and Wolf Priest of Ulric (fee "Hero"), Busty Gwen ("See special rules"),
    and the four personae with no listed fee (Bertha, Dark Emissary, Penthesilea, Truthsayer), plus
    Nicodemus (1 wyrdstone each way). Three more hire fine but their upkeep cannot be charged: Clan
    Skryre Rat Ogre (1 wyrdstone), Heinrich Schmidt (1 treasure) and Ippan Shu (2 campaign points).
    Wyrdstone is already tracked on the roster, so the four wyrdstone and treasure cases could be paid
    properly rather than blocked. Separately, 15 entries have no upkeep at all, which is what their
    entries say and is handled correctly.

---

## C. Smaller points

14. **`hireHiredSword` does not check eligibility.** The "may be hired" reading and the warband's own
    hiring rule live in the feature layer (`hiredSwordEligibility`), not the resolver, so the rules
    layer will hire a Dwarf Troll Slayer into an Elf warband without comment. Consistent with how the
    app handles restrictions elsewhere (warn, allow, record), but worth knowing the resolver is silent.
15. **The Ninja's fee is "70 +3D6" and the app charges a flat 70.** The dice half of the fee is
    dropped silently. `feeOverride` is the right hook for it, and the map-advantage half-price perks
    already use that hook, so this is a small fix.
16. **Rating for personae counts their experience** where the entry says to, but since personae should
    have no experience (A2) the two interact. Fixing A2 makes this moot.
17. **Grade filtering.** The rules note that some groups gate hired swords by grade ("Grade 1A may be
    hired at warband creation"; some personae only after the first match). Grade is on every entry but
    nothing filters by it. That belongs with campaign settings rather than the rules layer.

---

## D. Fine as text

The per-entry special rules (Wolf Companion, Dark Magic, the Bard's songs, Sneaky Git variants and so
on) read as tabletop effects and are already carried verbatim on the entry, which is the right place
for them. The flavour, source lines and profiles are all present and correct across every entry I
sampled.
