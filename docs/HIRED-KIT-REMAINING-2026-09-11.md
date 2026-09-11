# Remaining hired equipment review

Generated from current starting equipment and combat loadout mapping. These are unmapped combat entries, not all necessarily combat rules: identify mundane prose, consumables and tabletop-only effects before implementing. Does not cover effects on items already mapped to ordinary weapons.

| Character | Unmapped entries |
|---|---|
| Clan Skryre Rat Ogre | Jaws; claws; small Warpfire Thrower on its mechanical left arm |
| Mule Skinner | whip |
| Coachman | Whip |
| Pyromaniac | Fireworks |
| Dwarf Slayer Pirate | many many Pistols |
| Halfling Knight | Hound; Barding |
| Nicodemus, the cursed pilgrim | enormous Wizard's staff (see Special Rules) |
| Crow Master, The | Mantle of Crows; Needle & Thread |
| Dijin Katal, The Renegade Assassin | Druchii Assassin’s Cloak |
| Heinrich 'Altdorf' Schmidt | Whip |
| Belandysh, Condemned Champion Of Chen | Broadsword of Damnation (see Chaos Artefacts); Chaos Armour that hardly hold his body together |
| Grand Master Ippan Shu | iron fan in one of his hands |
| Luthor Wolfenbaum (wizard) | Fish-slapping staff; Bugman’s Beer; Clay orbs of Tilean Fire |
| "Busty" Gwen | Knives (profile/count not stated; Rolling Pin now operational) |
| The Foole | Poison Ring (See Special Rules) |

Completed at milestone 51: Aenur/Ienh-Khain; Ninja Gnoblar Bo and shurikens; Thief’s Cloak; Hunter’s Cloak (visibility remains a tabletop rule, now explicitly shown). 23 listed character/role entries remain.

Milestone 52 maps Drenok’s axe/hide and Abdul’s robes/pendant; 21 listed character/role entries remain. Gwen’s rolling pin is mapped but her unspecified knives remain explicit. The Eye Pendant Leadership prerequisite is a tabletop reminder, and wider special abilities such as Drenok’s Berserker still require review separately from equipment.

Milestone 53 completes Veskit’s combat kit and distinct No Pain handling. 20 listed entries remain. Whip source review: Mule Skinner/Heinrich explicitly reference S-1, +1 enemy save, un-parryable attacks and disarm; Reach-to-Whipcrack is a recommendation, not an unqualified mandatory rewrite. Norse Rune Staff has no separate weapon profile in the scraped entry. Nicodemus explicitly uses a two-handed club/parry mode or an off-hand club with Sword of Rezhebel; preserve that distinction.

Milestone 54 maps Lantern Rig and the Hillman’s man-form Heavy Fur Cloak. 18 unmapped entries remain. The Hillman’s wolf transformation and temporary equipment removal are separate, still outstanding abilities; the new armour mapping does not close them.

Staff of Light implementation notes: `CastTab.tsx` currently gathers dispel sources only from opposing `roster.heroes`; hired characters are omitted. `casting.ts:succeed` offers only the first source, and `DispelSource` has no owner or usage limit. Complete this as one coherent change: include active hires, choose an eligible named source, record both successful and failed attempts with owner identity in shared match state, and enforce/reset the per-turn allowance across different casters and reloads. Do not add a component-local spent flag or treat a declined attempt as spent. Also preserve source-specific restrictions (for example Blessed by Morr applies only to its bearer against Undead).

Milestone 55 completes the Staff of Light’s shared per-player-turn allowance, named source selection and persisted roll log; the implementation notes above are now historical. Other dispel items are not automatically implemented by this change. Remaining kit inventory is still 18 entries.

Milestone 56 maps Maximilian’s Holy Weapon and Religious Fervour/Frenzy, with an explicit calculator control for Frenzy ending. Seventeen unmapped character/role entries remain. His other conditional psychology/aura abilities are still separate open work.

Milestone 57 resolves Rune Staff and Hammer of Sigmar as named ordinary bludgeoning equipment; no additional magical weapon profile is specified in their entries. Fifteen unmapped character/role entries remain. The Norse armour exception and selected Sigmar prayer dispel protection are also fixed independently of the agreed prayer-lore classification.
