# Serious injuries — rules audit (audit #7 of RULES-AUDIT-PLAN.md)

**Date:** 2026-09-07  **Status:** findings awaiting Tom's review; not yet sent to the Stirheim Developer
**Sources compared:** `reference/rules/03-campaigns-magic-optional-rules.md` lines 91-230 (serious
injuries, the henchman rule, the heroes' D66 chart and all 20 of its entries) plus lines 1115-1120
(hired swords) and 1238 (Dramatis Personae), against `src/rules/data/campaign/injuries.ts`,
`src/rules/resolve/injuries.ts`, `src/features/postBattle/model/injuries.ts`,
`src/features/postBattle/wizard/InjuriesStep.tsx`, `src/rules/resolve/mapAdvantages.ts`,
`src/features/match/battle/preBattlePrompts.ts` and `sheet.ts`.

**Method.** Compared every band of the D66 chart against the data, then traced each effect from the
data through the resolver to the post-battle wizard and on to whatever reads the resulting flag.

---

## What is modelled

This is the most complete area in the app. Every one of the 20 chart entries is present with the
right band, verbatim text and a structured effect, and the resolver applies them rather than just
displaying them.

- **The chart is exact**: Dead 11-15, Multiple Injuries 16-21, the singles from 22 to 36, Full
  Recovery 41-55, Bitter Enmity 56, Captured 61, Hardened 62-63, Horrible Scars 64, Sold To The Pits
  65, Survives Against The Odds 66. All four sub-tables (Arm Wound, Madness, Smashed Leg, Bitter
  Enmity) are modelled as sub-rolls with their own bands.
- **Multiple Injuries is properly enforced.** The wizard asks for the D6, then walks that many further
  rolls, and a Dead, Captured or further Multiple Injuries result during the sequence is discarded and
  re-rolled without consuming one of the rolls.
- **The second blinding retires the warrior**, checked against the existing flag, exactly as the entry
  requires.
- **Old Battle Wound has a full loop**: the flag drives a pre-battle prompt, and a rolled 1 benches
  that warrior for the game through `benchedByOldWound`.
- **Stat penalties apply with sensible floors** (documented in the resolver header): nothing falls
  below 1, except Ballistic Skill which floors at 0 because BS 0 profiles exist.
- **Survives Against The Odds** feeds its +1 experience into the post-battle experience lines.
- **Captured removes the hero from play and from the warband rating** until his status changes.
- **Per-unit injury exceptions** are data-driven: nine units have their own rule, including the
  daemons who are banished on a 1-3 rather than rolling.
- **Map districts can rewrite a result** (Temple of Morr on a 5+, the Gaol always) and the wizard
  handles the extra district roll inline.
- **Hired swords take the henchman D6**, which is right. Note the resolver's own header comment says
  "the rulebook itself has hired swords roll on the Heroes' chart" — that is not what the source says.
  `04-hired-swords.md` reads: "roll for his injuries as you would roll for a Henchman after a battle
  (i.e, 1-2 = Lost; 3-6 = Survives)." The code is correct and the comment is wrong; worth fixing the
  comment before it invites someone to "correct" working behaviour.

---

## A. Gaps

1. **Sold To The Pits stops at the flag.** The resolver records the injury and emits a `pitFight`
   event saying the hero must fight a Pit Fighter, and **nothing in the app consumes that event** —
   I grepped the whole feature layer for it. So none of the entry's outcomes happen:
   - win: 50 gold crowns, +2 experience, rejoins with all his equipment;
   - lose: a further roll restricted to D66 11-35 to see whether he is dead or merely injured, and if
     he lives he rejoins **without his armour and weapons**.

   The warrior is simply left flagged. There is no way to record either outcome short of editing the
   roster by hand, and no support anywhere for a D66 restricted to the 11-35 range.
2. **A map advantage exists for a fight that cannot be played.** The Amphitheatre district grants
   `pitFightAutoWin`, and the perks summary prints "A hero Sold to the Pits wins the fight". Nothing
   reads that flag, because there is no pit fight to win. The perk is inert until finding 1 is built.
3. **The captive has no flow.** Captured sets the status and stops there. None of the entry's five
   outcomes is supported:
   - ransom at a price the captor sets;
   - exchange for one of the captor's own captives;
   - sale to slavers for D6x5 gold crowns;
   - Undead killing the captive to gain a Zombie;
   - the Possessed sacrificing him, with **+1 experience to the warband leader**.

   The only route back is changing the status by hand in the roster editor, which moves no gold, adds
   no Zombie and awards no experience. Equipment handling is unimplemented too, and the rule is
   specific: ransomed or exchanged captives keep their kit, while sold, killed or zombified ones leave
   it with their captors. This was flagged as a gap in audit #1 (WARBAND-RULES-GAPS.md, "capture
   flows") and is still open.
4. **Bitter Enmity records the hatred as text only.** The flag is set and the D6 sub-roll picks which
   of the four targets it is, but the target is stored as prose, so nothing can act on it later. That
   is defensible for a tracker, since hatred applies on the table, but it means the sheet cannot tell
   the player "this warrior hates the warband you are about to fight" — which is the one place a
   tracker could genuinely help.

---

## B. Interpretations worth confirming

5. **Concurrent recovery.** Where Multiple Injuries produces several "miss the next game" results, the
   resolver has the warrior sit out the longest recovery rather than the sum. The rulebook does not
   say either way. Documented in the resolver header; flagging it because it is a real ruling that a
   group might make differently.
6. **Stat floors are the app's invention.** The chart says "-1 Toughness" without a floor. The
   resolver stops at 1 (0 for Ballistic Skill). Sensible, and it prevents nonsense profiles, but it is
   not in the source.
7. **Robbed keeps no persistent flag**, only the equipment loss in the injury record. Fine, since the
   effect is entirely in the past tense.

---

## C. Fine as text

Stupidity, frenzy, immunity to fear and causing fear are all set as flags and explained in plain
words on the sheet, which is the right depth: they are psychology rules resolved on the table. The
resolver's `CONDITION_TEXT` map is a nice touch — it spells out what each condition does rather than
leaving a reader with just the chart's name for it a month later.
