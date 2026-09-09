# Aliases and unresolved names — rules audit (audit #18 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** written under Tom's overnight pre-authorisation; sent to the
Stirheim Developer without his prior review. **Last audit in the series.**
**Sources compared:** `src/rules/data/items/aliases.ts` and every call site that turns a free-text
name into a catalogue entry: warband equipment lists, hired sword and persona kit
(`resolve/recruitment.ts`), exploration rewards (`data/campaign/exploration.ts`) and skill names
inside restriction texts (`resolve/skillRestrictions.ts`).

---

## A. Good news first, including a correction to my own audit #2

**Warband equipment lists now resolve completely: 0 unresolved out of 253 names.** The alias table
carries 59 explicit entries and 6 bundles, backed by a normalising matcher that handles casing,
punctuation, plurals and bracketed qualifiers.

**This makes one of my own earlier findings stale.** `WEAPONS-ARMOUR-RULES-GAPS.md` section C ended
with "34 unresolved list names". That was true on 2026-09-05 and is not true now — it has been fixed
since. That is the second stale item in that document, after A1. **The weapons audit should be read as
a 2026-09-05 snapshot with two sections since overtaken**, not as a current list.

---

## B. The alias table was built for one call site, and three others use it

The resolution logic is good. The problem is that only the warband equipment lists were ever driven to
zero; the other three consumers feed it names it was never taught.

| Call site | Names | Unresolved |
|---|---|---|
| Warband equipment lists | 253 | **0** |
| Hired sword and persona kit | 298 lines | **105 (35%)**, 104 distinct |
| Exploration rewards | 40 | **20 (50%)** |
| Skill names in restrictions | 8 | 4, but see D |

### The hired sword kit, classified

I read all 104. They fall into four groups, and only two are worth work:

1. **Parser failures — a whole sentence kept as one "item".** "Aenur wears Ithilmar Armour",
   "Khar-mel is armed with a Scimitar but wears no armour", "Kislev Ranger is armed with a Bow",
   "Mule Skinner starts with a whip", "Nomad Guide is armed with a Scimitar", "Hillman is armed with
   an Axe", "Bone Goliaths never carry any weapons or armour and suffer no penalties for this."
   The kit sentence was never split down to item names, so a resolvable item is hidden inside prose.
   This is the largest group and the one with real items behind it.
2. **Real catalogue items under a different name — an alias each would fix them.** Brace of pistols,
   Cavalry Spear, Gromril Hammer, Hammer of Sigmar, Holy Relic, Repeating Crossbow, "Scimitar (counts
   as a Sword)", "Dark Cloak (counts as Elven Cloak)", "Ninja Robe (counts as Hardened Leathers)",
   Mining Pick, "Pickaxe (uses rules of a 'axe' for combat)", "Pick (two-handed weapon)", Knives,
   Pair of Swords, Rope, Hook, Hunter's cloak. Note several already say what they count as, in
   brackets, which is exactly the information an alias needs.
3. **Bespoke gear with no catalogue entry, unresolved by design.** Broadsword of Damnation, Axe of the
   Icefang, Eye Pendant, Poison Ring, Black Nomad Robes, Shurikens, Bo, Jaws, Fireworks. The aliases
   file says this is intended, and it is right.
4. **Choice lines deliberately left whole** for the player to settle: "Either two Swords, Axes or
   Clubs (or any mix of them), or a Double-Handed Weapon", "Gaoler can be armed with a heavy chain of
   keys and locks (counts as a flail) or with two Hammers/Clubs". Correct as they are.

### Two outright parse artefacts

- **A kit line of literally `-1M)`.** The Imperial Tactician's kit reads "Two-handed sword, plate
  armour (4+ save, -1M), Helmet, Dagger." The splitter breaks on the comma inside the bracket, so
  "plate armour (4+ save" and "-1M)" become two items. A player sees a piece of equipment called
  "-1M)".
- **`Resilient skills` parsed as kit.** It comes from a Skills sentence — "…Resilient skills. He may
  choose from Strength and Speed skill lists…" — that the kit reader picked up.

Both are single-line fixes (respect brackets when splitting; do not read the Skills field as kit) and
both are visible to a player today.

---

## C. Exploration rewards

20 of 40 reward item names do not resolve, already logged as audit #8 finding 4 with the list. Same
root cause as group 2 above, and the same fix. Worth doing together: several names appear in both
sets, and the gromril and ithilmar variants the catalogue now generates are missing from the alias
table in both places.

---

## D. Skill names in restrictions — the regex, not the table

Of eight skill names the prerequisite pattern extracts from restriction texts, four do not resolve —
but three of those are not skills at all. The pattern is over-matching and producing "leader", "this",
and "ability to cast spells or use prayers may take this" as if they were skill names. Only
**"Black Orc blood"** is a real named ability with no skill entry behind it.

So this is not an alias gap. It is the same over-matching regex behind audit #3 section D, where the
Sorcerous Society caster restrictions and several "only" clauses misfire. Fixing that regex fixes both.

---

## E. Closing note on the series

This is the last of the eighteen audits. Two things I would carry forward:

- **Findings go stale.** Two sections of the weapons audit and one of my hired-swords findings were
  overtaken or already settled while the series was running. Anything more than a few days old should
  be re-verified before it is built, and I have marked the ones I found.
- **The same few root causes produce findings across many areas.** The over-matching restriction
  regex, the alias table's single-consumer design, tags carried without a typed field behind them, and
  traits assigned in one warband but not the rest each surfaced in three or four separate audits under
  different names. Grouping the tracker by root cause rather than by audit would shorten the work
  considerably.
