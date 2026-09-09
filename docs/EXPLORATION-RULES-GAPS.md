# Exploration chart — rules audit (audit #8 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet sent to the Stirheim Developer
**Sources compared:** `reference/rules/03-campaigns-magic-optional-rules.md` lines 575-1000 — rolling
multiples, the exploration procedure, the shards table, the exploration chart and all 30 location
entries, plus the Magical Artefacts table — against `src/rules/data/campaign/exploration.ts`,
`src/rules/data/campaign/income.ts`, `src/rules/resolve/exploration.ts`,
`src/rules/resolve/explorationAids.ts`, `src/rules/resolve/dice.ts`,
`src/features/postBattle/model/exploration.ts` and `src/features/postBattle/wizard/ExplorationStep.tsx`.

**Method.** Compared the chart and procedure clause by clause, then probed all 30 locations for
structured rewards, sub-rolls and tests, and ran every reward item name through the catalogue's own
alias resolver to see what actually lands on the roster.

---

## What is modelled

- **All 30 locations are present**, six each for doubles through six-of-a-kind, with verbatim flavour
  and rules text, and the great majority carry structured rewards rather than prose: 11 sub-roll
  tables with their own bands, 3 characteristic tests, and gold and wyrdstone amounts held as dice
  expressions ("3D6", "D6x10", "5D6x5") rather than flattened to numbers.
- **The multiples tie-break is correct.** `multiplesIn` sorts by count and then by value, which gives
  the rulebook's "choose the most numerous multiples, and of two equal sets the highest".
- **The shards table is exact** and applied from the kept dice total.
- **Dice allowance is right**: one per surviving active hero, plus one for a win, plus extras, with
  units that give no die and warband rules that give more both honoured, and a readable reason line.
- **Aids are well built.** The Mordheim Map by the grade rolled when it was bought, the Wyrdstone
  Pendulum with its Leadership test, the Rabbit's Foot with its house-rule switch, Tarot Cards read
  from the battle sheet, and a map district that modifies a die. The app suggests and the player
  chooses, which is the right division of labour.
- **Warband exploration rules** feed in properly: extra dice, extra shards for the Dwarf miners, gold
  per enemy out of action for Grave Goods.
- **Gains are applied** to treasury, wyrdstone and stash, with every change narrated.

---

## A. A misread rule

1. **The six-dice cap is applied to the wrong half of the sentence.** The procedure reads: "you must
   pick a maximum of six dice out of all the dice you roll, **even if you are allowed to roll seven
   dice or more**." So a warband entitled to seven dice rolls all seven and keeps the best six.

   The app caps the number rolled: `explorationDiceAllowed` returns `Math.min(raw, 6)`,
   `resolveExploration` throws on more than six, and the wizard tells the player "The rulebook caps
   the roll at six." Rolling seven and keeping six is materially better than rolling six — both for
   the total and for the chance of a multiple — so warbands entitled to extra dice are quietly
   short-changed.

   This also makes two other rules inexpressible:
   - the Straggler's reward for most warbands is "roll one dice more than is usually allowed, and
     discard any one dice", which is precisely the roll-more-keep-fewer shape;
   - the Elf Ranger and other aids are described in the procedure as modifying dice you have already
     rolled, which presumes a pool larger than the keep count.

   The resolver already separates "dice allowed" from "rolls kept", so the fix is mostly to let the
   allowance exceed six and have the keep step choose six.

---

## B. Gaps

2. **Entrance to the Catacombs grants a permanent re-roll that is never recorded.** The five-of-a-kind
   6 entry says: "From now on, you may re-roll one dice when you roll on the Exploration chart. Make a
   note of this in your warband's roster sheet. Second and subsequent catacomb entrances you find do
   not grant an extra re-roll." Nothing in `explorationAids` comes from a found location — every aid
   it knows is an item, a house rule or a map district — so the warband gets the note in the event log
   and nothing else. The no-stacking clause has nothing to enforce either. This is the aid the
   rulebook's own worked example uses, so it is a conspicuous one to miss.
3. **Five locations are warband-conditional and land as text only.** Each has branches the app cannot
   apply, and several of them move real resources:

   | Location | Branches not modelled |
   |---|---|
   | Straggler (4 4) | Skaven sell him for 2D6 gc; Possessed sacrifice him for +1 experience to the leader; Undead gain a free Zombie; everyone else gets the extra-die-and-discard bonus next exploration |
   | Prisoners (3 3 3) | Possessed gain D3 experience shared among the Heroes; Undead gain D3 free Zombies; Skaven sell them for 3D6 gc; everyone else gets 2D6 gc **and a free new recruit** who joins if you can equip him |
   | Returning a Favour (6 6 6) | A free Hired Sword of your choice for the next battle, no hire fee, then he leaves or you start paying upkeep |
   | Catacombs (4 4 4 4) | Deploy up to three fighters anywhere at ground level in the next battle (not Rat Ogres or the Possessed) |
   | Entrance to the Catacombs (5 5 5 5 5) | The permanent re-roll, as above |

   Returning a Favour is the easiest win: the hire flow already takes a `feeOverride`, so a free hire
   for one battle is close at hand. The Zombie and free-recruit branches need a recruit path that
   costs nothing, and the Possessed experience branches need a way to hand experience to a leader or
   split D3 across the Heroes.
4. **Half the reward items do not resolve to catalogue entries.** Of 40 distinct item names in the
   chart, 20 fail the alias resolver and enter the stash as untyped custom lines, which cannot be
   equipped, priced or sold through the shop. Several are plainly in the catalogue under another
   spelling and only need aliases: Suit of light armour, Suits of Light Armour, Suits of Heavy Armour,
   Brace of Pistols, Brace of Duelling Pistols, Double-handed axes, Quiver of Hunting Arrows, Shields
   or Bucklers (choose which), Flasks of Superior Blackpowder. Four more are the gromril and ithilmar
   variants the catalogue now generates and the alias table has not caught up with: Gromril Axe,
   Gromril Hammer, Double-handed Gromril Axe, Suit of Ithilmar Armour. The remainder are genuinely not
   equipment (see next).
5. **The Jewelsmith's gems arrive worthless.** The entry gives Quartz stones worth D6x5, an Amethyst
   worth 20, a Necklace worth 50 and a Ruby worth D6x15 — and then offers a real choice: sell them, or
   let a Hero keep them for **+1 to rolls for locating rare items**. In the app they become custom
   stash lines with no price, so they cannot be sold for their stated value, and the +1 alternative is
   not offered at all despite `rareRollBonus` already existing in the campaign rules data. The same
   applies to the Alchemist's notebook and the Training manual, which are rewards with effects rather
   than objects.
6. **The Elf Ranger's exploration modifier is not granted.** Step 2 of the procedure names it: "If
   your warband includes an Elf Ranger, you may modify one dice by +1 or -1." `explorationAids` has
   exactly the right shape for this — a "modify" aid kind — but only a map district ever produces one.
   Hired swords on the roster are never consulted, so the Elf Ranger's headline campaign ability does
   nothing. Related to the hired-sword gaps in audit #4.

---

## C. Fine as text

The Catacombs deployment advantage, the Pit's wyrdstone-versus-danger choice and the narrative colour
of each entry belong at the table. The Magical Artefacts table is carried verbatim with its D6 bands,
which is the right depth for a table whose results are mostly one-off magic items.
