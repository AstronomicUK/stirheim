# Magic and prayers — rules audit (audit #5 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet pushed to FEEDBACK-TRACKER.md
**Sources compared:** `reference/rules/03-campaigns-magic-optional-rules.md` — the core Magic section
(lines 1447-1514: casting, damage, allocated spells and the 41-row Wizard table) and the 30 lore
sections that follow (1515-3501) — against `src/rules/data/campaign/magic.ts`,
`src/rules/resolve/casting.ts`, `src/features/match/battle/casters.ts` and `CastTab.tsx`,
`src/features/advances/model.ts` and `AdvanceBody.tsx`, `src/features/roster/builder/HeroCard.tsx`
and `FirstSpellCard.tsx`, `src/rules/resolve/grimoires.ts` and `src/domain/roster.ts`.

**Method.** Read the core rules clause by clause against the code that implements each. Then probed
the data: every lore against its Wizard-table row, every wizard-looking hero unit in all 73 warband templates
against `loreForUnit`, and a live hire-and-render test of the battle page's caster list.

---

## What is modelled

The magic content and the casting screen are the strongest part of the app I have audited so far.

- **All 34 lores are present**: the 30 from the site, with every spell's name, D6 row, difficulty and
  verbatim text, plus the four Sorcerous Society Elemental Lores taken from that warband's own page.
  Spells the source marks "Auto" carry a null difficulty rather than a fake number, and the six of
  them are handled as needing no roll.
- **The casting roll is properly built.** `casterProfile` assembles the 2D6 target with every
  modifier, re-roll and dispel the warrior's kit and skills provide: Sorcery, Holy Tome, Scribe's
  scroll, Dark Ritual, Forbidden Rite, Familiar, Rosary, Magic Gubbinz, Rat Familiar, Mind Focus,
  Elven Runestones and Blessed by Morr. Each carries its own scope and limit (per turn, per game,
  one die or the pair) rather than being flattened into a number.
- **The armour prohibition is implemented**, with the sensible exclusions: helmets are not armour for
  this rule, Chaos Armour is fused to the body, barding belongs to a mount.
- **Prayers are separated from sorcery** and take their own kit (Holy Tome and Rosary rather than
  Familiar).
- **Magical Aptitude's second spell** is carried on the profile with the Toughness test it needs.
- **Two lores can be held at once.** A Tome of Magic or Book of the Dead leaves a warrior holding
  spells from two lores and `casterProfile` lists all of them, which is exactly right.
- **The first spell at creation** is a random D6 roll on the lore table, with the two house rules
  (choose freely, roll twice and keep one) wired to a campaign setting.
- **Reminders the sheet cannot check** are surfaced rather than silently dropped: one spell per turn,
  no missile weapons in a turn you cast, the Rosary's conditions, the Rat Familiar's range.

---

## A. Bugs

1. **The battle page throws as soon as the warband has any hired sword.** `castersOf` builds its list
   as `[...roster.heroes, ...(roster.hiredSwords as unknown as RosterHero[])]`, but `RosterHiredSword`
   has no `spellIds` field — not in the type, not from `hireHiredSword`, and not from
   `toRosterHiredSword` when a roster is loaded from the database. `loreForCaster` then reads
   `hero.spellIds.length` and throws `TypeError: Cannot read properties of undefined (reading
   'length')`. I confirmed it live: hiring a plain Pit Fighter, who casts nothing, is enough.
   `BattlePage.tsx:286` calls `castersOf` in an unguarded `useMemo` to decide whether to show the Cast
   tab, and `CastTab.tsx:36` calls it again. Adding `spellIds` to the hired sword type and both
   builders fixes it and unblocks finding 2. **This is the most serious thing in this audit and is not
   really a magic gap at all — it breaks the battle page for any warband with a hired sword.**
2. **No hired sword or Dramatis Persona can hold a spell.** Same missing field. Seven entries the
   Wizard table names as casters are hired swords or personae: Warlock (Lesser Magic), Witch (Charms &
   Hexes), Elf Mage (Spells of the Djed'hi), Norse Shaman (Norse Runes), Wolf Priest of Ulric (Prayers
   of Ulric), Dark Emissary (Lore of Darkness), Truthsayer (Lore of Light), plus Khar-mel the Djinn
   (Arabian Elemental Magic) and the Priest of Morr (Funerary Rites). None can be given their spell,
   so none can ever cast. The Warlock and the Witch exist only to cast.
3. **19 wizard units get no starting spell and are never prompted.** `loreForUnit` matches the Wizard
   table by exact label, trying `"<warband name> <unit name>"` and `"<unit name>"`. The warband
   builder renders its First spell card only `{lore ? … : null}`, so where the label misses, the card
   silently does not appear and the wizard starts the campaign with nothing. Four of these are core or
   Grade 1a warbands, among the most played in the game:

   | Warband :: unit | Wizard-table row | Why it misses |
   |---|---|---|
   | The Sisters of Sigmar :: Sigmarite Matriarch | "Sisters of Sigmar Sigmarite Matriarch" | template name carries a leading "The" |
   | The Undead :: Necromancer | "Undead Necromancer" | same leading "The" |
   | Skaven of Clan Eshin :: Eshin Sorcerer | "Skaven Sorcerer" | neither label shape matches |
   | Orc Mob :: Orc Shaman | "Orc Mob Shaman" | unit is "Orc Shaman", not "Shaman" |
   | Ostlander Mercenaries :: Priest of Taal | "Ostlanders Priest of Taal" | warband is "Ostlander Mercenaries" |
   | Skaven of Clan Pestilens :: Plague Priest, Pestilens Sorcerer | "Skaven of Clan Pestilens Sorcerer" | unit names differ |
   | Marauders of Chaos :: Seer | four rows, each "… Seer (with the Mark of X)" | the Mark is part of the label |

   That table covers eight units. Nine more have no Wizard-table row at all, because the row list
   stops at the site's own table: Court of the Profane Pleasures Slaaneshi Priest of Obscene, Druchii
   Sorceress, Nipponese Vim-To Mage, Protectorate of Sigmar Warrior Priest, Snotlings Snotling Shaman,
   Survivors of Strigos Seer, Wood Elves of Athel Loren Forest Mage, and both the Liche and the
   Necromancer of the Restless Dead (Variant). The last two are the Sorcerous Society Magus and Mages,
   who have rows but with a null `loreId`, because they choose one of the four Elemental Lores — that
   choice has no UI, so those four lores are unreachable too.

   At battle time `loreForCaster` recovers if the hero already has spells, since it looks the lore up
   from the spells he knows. So the damage is done at creation and on advances, not on the Cast tab.
4. **The Marauders of Chaos Seer needs his Mark to pick a lore.** The four rows are the only case
   where one unit maps to four different lores depending on a choice made at creation. Nothing on the
   roster records a Seer's Mark, so even fixing the label match leaves this one needing a real choice.

---

## B. Rules not modelled

5. **A duplicate spell cannot be recorded at its reduced difficulty.** The rule is "If you get the same
   spell twice, roll again or lower the spell's difficulty by 1." The advance screen tells the player
   exactly this ("roll again, or lower its difficulty by 1 by hand"), but there is nowhere to put the
   result: no per-hero spell difficulty modifier on the roster, so the casting screen always shows the
   printed number. Rolling again is fully supported; the other half of the rule is advice only.
6. **Warrior Wizard does not lift the armour ban.** The Academic skill lets its holder cast in armour.
   `casting.ts` has no exception for it. Carried over from the skills audit, where it is section A1.
7. **The armour exception is applied to four prayer lores, where the rulebook names one.** The text is
   "The only exception is the Prayers of Sigmar. Sisters of Sigmar and Warrior Priests may wear armour
   and use their prayers." `PRAYER_LORE_IDS` also exempts Prayers of Taal, Prayers of Ulric and the
   Lady's Prayers. That is the reading most groups use and is probably what Tom wants, but it is a
   choice the rulebook does not make, and it is applied inconsistently: Funerary Rites (Priest of Morr)
   and Mortuary Cult Scrolls (Liche Priest) read as prayers too and are **not** exempt, so those two
   are blocked by armour while a Priest of Taal is not. Worth settling one way or the other.
8. **`prayers_of_myrmidia` is a dead id.** It sits in `PRAYER_LORE_IDS` but no such lore exists in the
   data or anywhere in the rules reference. Harmless, but it means the list was written from memory
   rather than from the lore table, which is how finding 7's inconsistency crept in.
9. **Spell damage is not modelled.** "Spells do not cause critical hits. Models always receive armour
   saves against wounds caused by spells unless noted otherwise." The fight calculator has no spell
   path at all — it models melee and missile duels — so neither clause is expressed. Reasonable as
   scope, but it means a direct-damage spell cannot be evaluated the way a bow shot can.
10. **Nothing enforces one spell per turn or the missile-weapon prohibition.** Both are reminders on
    the caster profile, which is the right call for a tracker. Noted so nobody logs them twice.

---

## C. Smaller points

11. **Lore of a hero with two lores' spells is resolved by whichever lore matches first.**
    `findLoreOfSpell` returns the first lore in `SPELL_LORES` order containing any known spell, so a
    warrior carrying a Tome of Magic may have his "home" lore reported as the borrowed one. The spell
    list itself is correct either way; only the heading is affected.
12. **The Sorcerous Society Elemental Lores have no picker.** Four complete lores, 24 spells, with no
    route to them. Same shape as the orphaned skill tables in audits #3 and #4 — a pattern worth
    naming: content is scraped in faithfully, then nothing wires it to a unit.
13. **Grimoires are handled outside `casting.ts`.** `grimoires.ts` gates the Tome of Magic and Book of
    the Dead on Arcane Lore and the Plague Priest's Liber Bubonicus on Magical Aptitude, which is
    right; just noting the split so a fix to one does not miss the other.

---

## D. Fine as text

The spell effects themselves — templates, ranges, movement, the board-facing half of every lore — are
carried verbatim on each spell and belong at the table, not in the tracker. The two dispel sources are
presented as options for the player to roll rather than resolved automatically, which is correct given
the app never sees the opposing warband.
