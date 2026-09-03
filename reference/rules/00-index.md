# Mordheim Rules Reference — Index

A full-text Markdown reference compiled from [mordheimer.net](https://mordheimer.net), a
fan-maintained community compilation of Mordheim rules — not official Games Workshop material.
Scraped 2026-09-01 for use by the [Combat Probability Simulator](../README.md) and any other tool
that needs the rules. Covers everything the site hosts: the core rulebook, all optional rules, and
every warband from Core through Grade 2a (grade 2b/3 warbands live on a different site,
broheim.net, and aren't included here).

Each file below preserves rule text verbatim (not summarized) with a `**Source:**` link back to
the live page it came from, so anything here can be checked against the original.

## Files

| File | Covers |
|---|---|
| [01-introduction-and-rules.md](01-introduction-and-rules.md) | Setting/lore, and the core rulebook: characteristics, the turn sequence, movement, shooting, close combat, wounds & injuries, leadership & psychology |
| [02-weapons-armour-equipment.md](02-weapons-armour-equipment.md) | Every close-combat weapon, missile weapon, blackpowder weapon, armour type, piece of miscellaneous equipment, and bestiary animal — 251 items in full, each with cost/availability/special rules |
| [03-campaigns-magic-optional-rules.md](03-campaigns-magic-optional-rules.md) | Campaign structure, Experience, the universal Skills catalogue, Serious Injuries, Income, Trading, Hired Swords, Dramatis Personae, Scenarios, all 29 Lores of Magic/Prayer lists, all Optional Rules (mounted combat, encampments, etc.), and the Trading Post price lists |
| [warbands/core-and-grade-1a.md](warbands/core-and-grade-1a.md) | The 6 Core warbands (Possessed, Mercenaries, Sisters of Sigmar, Skaven, Undead, Witch Hunters) + 7 Grade 1a warbands |
| [warbands/grade-1b-part1.md](warbands/grade-1b-part1.md) | 11 Grade 1b warbands (Amazons through Horned Hunters) |
| [warbands/grade-1b-part2.md](warbands/grade-1b-part2.md) | 11 Grade 1b warbands (Imperial Outriders through Tomb Guardians) |
| [warbands/grade-1c.md](warbands/grade-1c.md) | 13 Grade 1c warbands |
| [warbands/grade-2a-part1.md](warbands/grade-2a-part1.md) | 10 Grade 2a warbands (Dreamwalkers through Ogre Hunting Party) |
| [warbands/grade-2a-part2.md](warbands/grade-2a-part2.md) | 9 Grade 2a warbands (Order of the Mare through Wood Elves of Athel Loren) |
| [warbands/restless-dead-variant.md](warbands/restless-dead-variant.md) | The Restless Dead (Variant) — Chris de la Rosa's Liche-led list, from a PDF supplied by Tom (not from mordheimer.net) |

**67 warband pages**, two of which each bundle several named sub-variants: Mercenaries covers
Reikland/Middenheim/Marienburg/Ostermark, and Tileans covers Miragleans/Remasens/Trantios — so
~72 named warbands in total. ~28,700 lines / ~2MB across all 9 files.

## Verified against the simulator's engine

Spot-checked the core combat charts here against `src/engine/*.ts`:

- **To Hit (melee, WS vs WS)** — matches exactly.
- **Critical Hit chart (standard)** — matches exactly.
- **Injury chart (1-2 KD / 3-4 Stunned / 5-6 OOA)** — matches exactly.
- **Armour Save chart + Strength-erosion table** — matches exactly (erosion is disabled by house rule, per the app's existing `applyStrengthArmourPiercing` flag).
- **Parry** (Sword/Buckler: "roll a D6, if higher than the number your opponent rolled to hit, parried... impossible to parry a blow which scored a 6") — matches the app's implementation exactly.
- **To Wound chart, Strength 8-10** — **found and fixed a real bug.** The original project brief's chart plateaued early at S8-S10 (e.g. held at "2" through Toughness 7); the verbatim rulebook scan here shows the same continuous diagonal pattern every other row follows. `src/engine/toWound.ts` has been corrected to match this verbatim source — see its file comment for the exact before/after.

## Known gaps (not yet in the simulator, found while cross-checking)

- **Bucklers** are a distinct item from Shields per the rulebook (buckler = Parry, no save bonus; shield = save bonus, presumably no Parry) — the app currently only has a generic `shield: boolean` flag conflating the two. `data/weapons.ts` / `types/index.ts` would need a small extension to model both correctly.
- **Ward saves** (magical/divine protection some creatures and heroes have, separate from armour saves and never reduced by Strength) aren't modeled at all — not in the original brief, found here.
- The image-transcribed charts noted in `01-introduction-and-rules.md` (a few tables on mordheimer.net are scanned images, not HTML) were reconstructed by the scraping agent reading the images directly, including one via pixel-darkness sampling for a status-effects grid — cross-checked the ones that matter most to the simulator (above) and they check out, but treat any *other* image-derived table in that file with a little more scrutiny than the HTML-sourced ones.

## Not included (out of scope for this pass)

- Grade 2b/3 warbands (hosted at broheim.net, a different site).
- Individual narrative scenario write-ups nested under `campaign-settings/` (e.g. the Procession of Morr mini-campaign) — only the general Scenarios rules/index page was captured.
- The Nemesis Crown campaign-settings subtree.
