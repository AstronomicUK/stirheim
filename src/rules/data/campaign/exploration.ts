// Exploration — the post-battle "rolling multiples" locations, the Magical Artefacts table and
// the faction income notes. Extracted verbatim from reference/rules/03-campaigns-magic-optional-rules.md
// (mordheimer.net's copy of the core rulebook Income chapter), lines 575-582 (multiples rule),
// 612-668 (exploration chart), 669-972 (the 30 location entries), 973-1022 (magical artefacts)
// and 1023-1034 (Sisters of Sigmar / Skaven and Undead income notes).
//
// Every location keeps its full source text in `flavour` (the opening scene-setting paragraph)
// and `rules` (everything after it, including any Markdown table). The structured fields are a
// convenience layer on top of that text and were checked entry by entry:
//   subRoll  — set where the source says "roll a D6" and resolves it with a D6 table (Corpse,
//              Overturned Cart, Smithy, Fletcher, Gunsmith, Armourer, Jewelsmith, Dwarf Smithy),
//              plus The Pit and Noble's Villa, whose D6 is written out in prose but is just as
//              unambiguous. Hidden Treasure and Slaughtered Warband roll per ITEM ("D6 result
//              needed"), which is a different shape, so they are left as prose.
//   test     — Well (D6 <= Toughness of a chosen Hero), Tavern and Shattered Building (leader's
//              Leadership test).
//   rewards  — unconditional or near-unconditional rewards stated in the text; the `text` field
//              records any condition. Warband-dependent entries (Straggler, Prisoners) carry no
//              structured rewards — read `rules`.
// Nothing here is mechanically wired yet; the UI shows the text and the structured fields are for
// a future exploration roller.

import type { NamedRule } from "../../types";
import type { ExplorationLocation, MagicalArtefact, MultipleKind } from "../../types/exploration";

const PUBLICATION = "Mordheim Rulebook (core), via mordheimer.net/docs/campaigns/income";

/** The "rolling multiples" paragraphs, verbatim (reference/rules/03-campaigns-magic-optional-rules.md:576-580). */
export const MULTIPLES_RULE: string =
  "As well as finding shards of wyrdstone, the warband can come across unusual places or encounter inhabitants of the ruined city. If you roll two or more of the same number while searching, you have found an unusual building or encountered something out of ordinary. Consult the chart and refer to the appropriate entry in the Exploration results.\n\nFor example, you might roll two 3's or three 5's, in which case you should refer to the chart. Choose the most numerous multiples if you score more than one set of multiples. So, if you rolled a double 3 and a triple 5, only look up the triple 5 on the Exploration chart. In the case of two doubles or triples look up the highest result. For example, if you rolled double 1 and double 3, look up the double 3 result.\n\nAny money or loot you find in these locations is added straight to the warband's treasury. Any shards of wyrdstone you find can be sold as normal.";

export const EXPLORATION_LOCATIONS: ExplorationLocation[] = [
  {
    id: "well",
    kind: "doubles",
    value: 1,
    name: "Well",
    flavour:
      "The public wells, of which there were several in Mordheim, were covered by rooves raised up on pillars and adorned with carvings and fountains. The city was proud of its water system. Unfortunately, like all the other wells, this one is in a parlous state and undoubtedly polluted with wyrdstone.",
    rules:
      "Choose one of your Heroes and roll a D6. If the result is equal to or lower than his Toughness, he finds one shard of wyrdstone at the bottom of the well. If he fails, the Hero swallows tainted water and must miss the next game through sickness.",
    test: { stat: "T", prompt: "Choose one of your Heroes and roll a D6. If the result is equal to or lower than his Toughness, he finds one shard of wyrdstone at the bottom of the well. If he fails, the Hero swallows tainted water and must miss the next game through sickness." },
    rewards: [
      { kind: "wyrdstone", amount: 1, text: "one shard of wyrdstone at the bottom of the well (only if the Toughness test is passed)" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:671-675" },
  },
  {
    id: "shop",
    kind: "doubles",
    value: 2,
    name: "Shop",
    flavour:
      "The Merchants Guild shop has been thoroughly ransacked. Even so, there are still items scattered around the single, long room, mingled in with the rubble. Some are useful, such as cast iron pots and pans and rolls of fine cloth. All manner of smaller items are lying about – the sort of frippery which no longer has a use in a devastated city with few inhabitants.",
    rules:
      "After a thorough search you find loot worth D6 gc. If you roll a 1 you will also find a Lucky Charm.",
    rewards: [
      { kind: "gold", amount: "D6", text: "loot worth D6 gc" },
      { kind: "item", itemName: "Lucky Charm", text: "If you roll a 1 you will also find a Lucky Charm." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:677-681" },
  },
  {
    id: "corpse",
    kind: "doubles",
    value: 3,
    name: "Corpse",
    flavour:
      "You find a still-warm corpse. A chipped dagger sticks out of his back. Surprisingly, his possessions have not been looted.",
    rules:
      "To see what you find when you search the corpse, roll a D6:\n\n| D6 | Result |\n|---|---|\n| 1-2 | D6 gc |\n| 3 | Dagger |\n| 4 | Axe |\n| 5 | Sword |\n| 6 | Suit of light armour |",
    subRoll: {
      die: "D6",
      prompt: "To see what you find when you search the corpse, roll a D6:",
      outcomes: [
        {
          band: { min: 1, max: 2 },
          text: "D6 gc",
          rewards: [
            { kind: "gold", amount: "D6", text: "D6 gc" },
          ],
        },
        {
          band: { min: 3, max: 3 },
          text: "Dagger",
          rewards: [
            { kind: "item", itemName: "Dagger", text: "Dagger" },
          ],
        },
        {
          band: { min: 4, max: 4 },
          text: "Axe",
          rewards: [
            { kind: "item", itemName: "Axe", text: "Axe" },
          ],
        },
        {
          band: { min: 5, max: 5 },
          text: "Sword",
          rewards: [
            { kind: "item", itemName: "Sword", text: "Sword" },
          ],
        },
        {
          band: { min: 6, max: 6 },
          text: "Suit of light armour",
          rewards: [
            { kind: "item", itemName: "Suit of light armour", text: "Suit of light armour" },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:683-695" },
  },
  {
    id: "straggler",
    kind: "doubles",
    value: 4,
    name: "Straggler",
    flavour:
      "Your warband encounters one of the survivors of Mordheim, who has lost his sanity along with all his worldly possessions.",
    rules:
      "Skaven warbands can sell the straggler to agents of Clan Eshin (who will use the man for food or slavery) and gain 2D6 gc.\n\nPossessed warbands can sacrifice the unfortunate individual for the glory of the Chaos gods. The leader of the warband will gain +1 Experience.\n\nUndead warbands can kill the man and gain a Zombie for no cost.\n\nAny other warband can interrogate the man and gain insight into the city. Next time you roll on the Exploration chart, roll one dice more than is usually allowed, and discard any one dice. (For example, if you have three Heroes, roll four dice and pick any three).",
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:697-707" },
  },
  {
    id: "overturned_cart",
    kind: "doubles",
    value: 5,
    name: "Overturned Cart",
    flavour:
      "Stuck in a ruined gateway is an overturned wagon – the covered type that nobles travel in from the city to their estates in the country. Since anyone important fled a long time ago, what is it doing here? The horses have broken their traces, or did someone cut them free?",
    rules:
      "Roll a D6 to see what you find:\n\n| D6 | Result |\n|---|---|\n| 1-2 | Mordheim Map (see Equipment) |\n| 3-4 | A purse with 2D6 gc |\n| 5-6 | Jewelled sword and dagger. These can be kept or sold at twice the value of a normal sword and dagger, but note that the normal selling price is half the actual cost (see the Trading section for rules on selling items), so the jewelled sword will sell for 10gc, for instance. |",
    subRoll: {
      die: "D6",
      prompt: "Roll a D6 to see what you find:",
      outcomes: [
        {
          band: { min: 1, max: 2 },
          text: "Mordheim Map (see Equipment)",
          rewards: [
            { kind: "item", itemName: "Mordheim Map", text: "Mordheim Map (see Equipment)" },
          ],
        },
        {
          band: { min: 3, max: 4 },
          text: "A purse with 2D6 gc",
          rewards: [
            { kind: "gold", amount: "2D6", text: "A purse with 2D6 gc" },
          ],
        },
        {
          band: { min: 5, max: 6 },
          text: "Jewelled sword and dagger. These can be kept or sold at twice the value of a normal sword and dagger, but note that the normal selling price is half the actual cost (see the Trading section for rules on selling items), so the jewelled sword will sell for 10gc, for instance.",
          rewards: [
            { kind: "item", itemName: "Jewelled sword and dagger", text: "Jewelled sword and dagger. These can be kept or sold at twice the value of a normal sword and dagger, but note that the normal selling price is half the actual cost (see the Trading section for rules on selling items), so the jewelled sword will sell for 10gc, for instance." },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:709-719" },
  },
  {
    id: "ruined_hovels",
    kind: "doubles",
    value: 6,
    name: "Ruined Hovels",
    flavour:
      "The street consists of ruined hovels, which are leaning over at alarming angles. Not much worth looting here.",
    rules:
      "You find loot worth D6 gc amidst the ruins.",
    rewards: [
      { kind: "gold", amount: "D6", text: "loot worth D6 gc amidst the ruins" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:721-725" },
  },
  {
    id: "tavern",
    kind: "triples",
    value: 1,
    name: "Tavern",
    flavour:
      "The ruin of a tavern is recognisable by its sign still hanging on the wall. The upper part of the building is ruined, but the cellars are cut into rock and are still full of barrels. There are broken flagons and tankards everywhere.",
    rules:
      "You could easily sell the barrels for a good price. Unfortunately your men are also interested in the contents! The warband's leader must take a Leadership test. If he passes, the warband gains 4D6 gc worth of wines and ales which can be sold immediately.\n\nIf he fails, the men drink most of the alcohol despite their leader's threats and curses. You have D6 gc worth of alcohol left when the warband reaches their encampment.\n\nUndead, Witch Hunter and Sisters of Sigmar warbands automatically pass this test, as they are not tempted by such worldly things as alcohol.",
    test: { stat: "Ld", prompt: "The warband's leader must take a Leadership test. If he passes, the warband gains 4D6 gc worth of wines and ales which can be sold immediately. If he fails, the men drink most of the alcohol despite their leader's threats and curses. You have D6 gc worth of alcohol left when the warband reaches their encampment. Undead, Witch Hunter and Sisters of Sigmar warbands automatically pass this test." },
    rewards: [
      { kind: "gold", amount: "4D6", text: "4D6 gc worth of wines and ales which can be sold immediately (if the Leadership test is passed)" },
      { kind: "gold", amount: "D6", text: "D6 gc worth of alcohol left when the warband reaches their encampment (if the Leadership test is failed)" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:729-737" },
  },
  {
    id: "smithy",
    kind: "triples",
    value: 2,
    name: "Smithy",
    flavour:
      "The furnace and toppled anvil make it obvious what work was done here. Most of the iron and the tools have been looted long ago. Coal and slag litter the floor but there may still be weapons to be found among the debris.",
    rules:
      "Roll a D6 to determine what you find inside:\n\n| D6 | Result |\n|---|---|\n| 1 | Sword |\n| 2 | Double-handed weapon |\n| 3 | Flail |\n| 4 | D3 Halberds |\n| 5 | Lance |\n| 6 | 2D6 gc worth of metal (add the value to your treasury). |",
    subRoll: {
      die: "D6",
      prompt: "Roll a D6 to determine what you find inside:",
      outcomes: [
        {
          band: { min: 1, max: 1 },
          text: "Sword",
          rewards: [
            { kind: "item", itemName: "Sword", text: "Sword" },
          ],
        },
        {
          band: { min: 2, max: 2 },
          text: "Double-handed weapon",
          rewards: [
            { kind: "item", itemName: "Double-handed weapon", text: "Double-handed weapon" },
          ],
        },
        {
          band: { min: 3, max: 3 },
          text: "Flail",
          rewards: [
            { kind: "item", itemName: "Flail", text: "Flail" },
          ],
        },
        {
          band: { min: 4, max: 4 },
          text: "D3 Halberds",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Halberds", text: "D3 Halberds" },
          ],
        },
        {
          band: { min: 5, max: 5 },
          text: "Lance",
          rewards: [
            { kind: "item", itemName: "Lance", text: "Lance" },
          ],
        },
        {
          band: { min: 6, max: 6 },
          text: "2D6 gc worth of metal (add the value to your treasury).",
          rewards: [
            { kind: "gold", amount: "2D6", text: "2D6 gc worth of metal (add the value to your treasury)." },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:739-752" },
  },
  {
    id: "prisoners",
    kind: "triples",
    value: 3,
    name: "Prisoners",
    flavour:
      "A muffled sound comes from one of the buildings. Inside you find a group of finely dressed people who have been locked in a cellar. Perhaps they are prisoners taken by cultists, ready to be sacrificed during Geheimnisnacht.",
    rules:
      "Possessed warbands can sacrifice the victims (undoubtedly finishing the job of the captors). They gain D3 Experience which is distributed amongst the Heroes of the warband.\n\nUndead warbands can callously kill the prisoners and gain D3 Zombies at no cost.\n\nSkaven can sell the prisoners into slavery for 3D6 gc.\n\nOther warbands can escort the prisoners out of the city. For their trouble, they are rewarded with 2D6 gc. In addition, one of the prisoners decides he wishes to join the warband. If you can afford to equip the new recruit with weapons and armour, you may add a new Henchman to any of your human Henchman groups (with the same stats as the rest of the group, even if they have already accumulated experience).",
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:754-764" },
  },
  {
    id: "fletcher",
    kind: "triples",
    value: 4,
    name: "Fletcher",
    flavour:
      "This hovel was once the workshop of a fletcher – a maker of bows and arrows. There are bundles of yew staves and willow rods everywhere.",
    rules:
      "Roll a D6 to see what you find:\n\n| D6 | Result |\n|---|---|\n| 1-2 | D3 Short Bows |\n| 3 | D3 Bows |\n| 4 | D3 Long Bows |\n| 5 | Quiver of Hunting Arrows |\n| 6 | D3 Crossbows |",
    subRoll: {
      die: "D6",
      prompt: "Roll a D6 to see what you find:",
      outcomes: [
        {
          band: { min: 1, max: 2 },
          text: "D3 Short Bows",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Short Bows", text: "D3 Short Bows" },
          ],
        },
        {
          band: { min: 3, max: 3 },
          text: "D3 Bows",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Bows", text: "D3 Bows" },
          ],
        },
        {
          band: { min: 4, max: 4 },
          text: "D3 Long Bows",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Long Bows", text: "D3 Long Bows" },
          ],
        },
        {
          band: { min: 5, max: 5 },
          text: "Quiver of Hunting Arrows",
          rewards: [
            { kind: "item", itemName: "Quiver of Hunting Arrows", text: "Quiver of Hunting Arrows" },
          ],
        },
        {
          band: { min: 6, max: 6 },
          text: "D3 Crossbows",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Crossbows", text: "D3 Crossbows" },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:766-778" },
  },
  {
    id: "market_hall",
    kind: "triples",
    value: 5,
    name: "Market Hall",
    flavour:
      "The market hall was raised up on pillars, with the timbered corn exchange above the open market place. The upper storey has been badly damaged, but the covered market still offers a good deal of shelter. The remains of the last market day are still lying around on the cobbles. Most of this is broken pottery and iron pots.",
    rules:
      "You find several items worth 2D6 gc in total.",
    rewards: [
      { kind: "gold", amount: "2D6", text: "several items worth 2D6 gc in total" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:780-784" },
  },
  {
    id: "returning_a_favour",
    kind: "triples",
    value: 6,
    name: "Returning a Favour",
    flavour:
      "As you are returning to your encampment, you meet one of your old acquaintances. He has come to repay an old favour or debt.",
    rules:
      "You gain the services of any one Hired Sword (choose from those available to your warband) for the duration of the next battle, free of charge. After the battle he will depart, or you may continue to pay for his upkeep as normal. See the Hired Swords section.",
    rewards: [
      { kind: "text", text: "You gain the services of any one Hired Sword (choose from those available to your warband) for the duration of the next battle, free of charge." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:786-790" },
  },
  {
    id: "gunsmith",
    kind: "fourOfAKind",
    value: 1,
    name: "Gunsmith",
    flavour:
      "You find the workshop of a Dwarf gunsmith. Its doors have been broken down and the rooms raided, but some of the iron strongboxes have survived intact.",
    rules:
      "Roll a D6 to see what you find:\n\n| D6 | Result |\n|---|---|\n| 1 | Blunderbuss |\n| 2 | Brace of Pistols |\n| 3 | Brace of Duelling Pistols |\n| 4 | D3 Handguns |\n| 5 | D3 Flasks of Superior Blackpowder |\n| 6 | Hochland Long Rifle |",
    subRoll: {
      die: "D6",
      prompt: "Roll a D6 to see what you find:",
      outcomes: [
        {
          band: { min: 1, max: 1 },
          text: "Blunderbuss",
          rewards: [
            { kind: "item", itemName: "Blunderbuss", text: "Blunderbuss" },
          ],
        },
        {
          band: { min: 2, max: 2 },
          text: "Brace of Pistols",
          rewards: [
            { kind: "item", itemName: "Brace of Pistols", text: "Brace of Pistols" },
          ],
        },
        {
          band: { min: 3, max: 3 },
          text: "Brace of Duelling Pistols",
          rewards: [
            { kind: "item", itemName: "Brace of Duelling Pistols", text: "Brace of Duelling Pistols" },
          ],
        },
        {
          band: { min: 4, max: 4 },
          text: "D3 Handguns",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Handguns", text: "D3 Handguns" },
          ],
        },
        {
          band: { min: 5, max: 5 },
          text: "D3 Flasks of Superior Blackpowder",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Flasks of Superior Blackpowder", text: "D3 Flasks of Superior Blackpowder" },
          ],
        },
        {
          band: { min: 6, max: 6 },
          text: "Hochland Long Rifle",
          rewards: [
            { kind: "item", itemName: "Hochland Long Rifle", text: "Hochland Long Rifle" },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:794-807" },
  },
  {
    id: "shrine",
    kind: "fourOfAKind",
    value: 2,
    name: "Shrine",
    flavour:
      "Your warband stumbles across a ruined shrine, which is so badly damaged that it is difficult to tell which god was once worshipped within its walls. A few images remain on the painted plaster walls but they have been defaced by heretics. Fragments of smashed statues lie among the ruins. Some items appear to be covered in gold leaf, most of which has been torn off.",
    rules:
      "Your warband may strip the shrine and gain 3D6 gc worth of loot.\n\nSisters of Sigmar or Witch Hunter warbands may save some of the shrine's holy relics. They will gain 3D6 gc from their patrons, and a blessing from the gods. One of their weapons (chosen by the player) will now be blessed and will always wound any Undead or Possessed model on a to wound roll of 2+.",
    rewards: [
      { kind: "gold", amount: "3D6", text: "3D6 gc worth of loot (strip the shrine)" },
      { kind: "text", text: "Sisters of Sigmar or Witch Hunter warbands may save some of the shrine's holy relics instead: 3D6 gc from their patrons, and one weapon (chosen by the player) is blessed and will always wound any Undead or Possessed model on a to wound roll of 2+." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:809-815" },
  },
  {
    id: "townhouse",
    kind: "fourOfAKind",
    value: 3,
    name: "Townhouse",
    flavour:
      "This three-storey house was once part of a tenement block overlooking a narrow alleyway. The street is now in ruins, but this house remains largely intact. Exploring it you find that the garret leans over so far that you can step out of the window into the attic of the house opposite.",
    rules:
      "Your warband finds 3D6 gc worth of loot.",
    rewards: [
      { kind: "gold", amount: "3D6", text: "3D6 gc worth of loot" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:817-821" },
  },
  {
    id: "armourer",
    kind: "fourOfAKind",
    value: 4,
    name: "Armourer",
    flavour:
      "A breastplate hanging from a pole drew your attention to this place, obviously too high up to be easily looted. The workshop is ruined and the forge has been smashed. Rooting about in the soot, you find various half-finished items of armour.",
    rules:
      "Roll a D6 to see what you find:\n\n| D6 | Result |\n|---|---|\n| 1-2 | D3 Shields or Bucklers (choose which) |\n| 3 | D3 Helmets |\n| 4 | D3 Suits of Light Armour |\n| 5 | D3 Suits of Heavy Armour |\n| 6 | Suit of Ithilmar Armour |",
    subRoll: {
      die: "D6",
      prompt: "Roll a D6 to see what you find:",
      outcomes: [
        {
          band: { min: 1, max: 2 },
          text: "D3 Shields or Bucklers (choose which)",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Shields or Bucklers (choose which)", text: "D3 Shields or Bucklers (choose which)" },
          ],
        },
        {
          band: { min: 3, max: 3 },
          text: "D3 Helmets",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Helmets", text: "D3 Helmets" },
          ],
        },
        {
          band: { min: 4, max: 4 },
          text: "D3 Suits of Light Armour",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Suits of Light Armour", text: "D3 Suits of Light Armour" },
          ],
        },
        {
          band: { min: 5, max: 5 },
          text: "D3 Suits of Heavy Armour",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Suits of Heavy Armour", text: "D3 Suits of Heavy Armour" },
          ],
        },
        {
          band: { min: 6, max: 6 },
          text: "Suit of Ithilmar Armour",
          rewards: [
            { kind: "item", itemName: "Suit of Ithilmar Armour", text: "Suit of Ithilmar Armour" },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:823-835" },
  },
  {
    id: "graveyard",
    kind: "fourOfAKind",
    value: 5,
    name: "Graveyard",
    flavour:
      "You find an old graveyard, crammed with sepulchres that are overgrown with ivy. The monuments to the dead are grotesque and decorated with sculpted gargoyles. The ironwork has been ripped from some of the tombs, and stones have toppled off. It looks as if some of the crypts have already been broken into by tomb robbers.",
    rules:
      "Any warband apart from Witch Hunters and Sisters of Sigmar may loot the crypts and graves and gains D6x10 gc worth of loot.\n\nIf you loot the graveyard, the next time you play against Sisters of Sigmar or Witch Hunters, the entire enemy warband will hate all the models in your warband. Make a note of this on your warband roster sheet.\n\nWitch Hunters and Sisters of Sigmar may seal the graves. They will be rewarded for their piety by D6 Experience points distributed amongst the Heroes of the warband.",
    rewards: [
      { kind: "gold", amount: "D6x10", text: "D6x10 gc worth of loot (any warband apart from Witch Hunters and Sisters of Sigmar; looting earns the hatred of the next Sisters of Sigmar or Witch Hunter warband you face)" },
      { kind: "text", text: "Witch Hunters and Sisters of Sigmar may seal the graves instead: D6 Experience points distributed amongst the Heroes of the warband." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:837-845" },
  },
  {
    id: "catacombs",
    kind: "fourOfAKind",
    value: 6,
    name: "Catacombs",
    flavour:
      "You find an entrance to the catacombs and tunnels below Mordheim.",
    rules:
      "You can use the new tunnels you found in the next battle you play. Position up to three fighters (not Rat Ogres or the Possessed) anywhere on the battlefield at ground level. They are set up at the end of the player's first turn and cannot be placed within 8\" of any enemy models.\n\nThis represents the warriors making their way through the tunnels, infiltrating enemy lines and emerging suddenly from below ground.",
    rewards: [
      { kind: "text", text: "You can use the new tunnels you found in the next battle you play: position up to three fighters (not Rat Ogres or the Possessed) anywhere on the battlefield at ground level at the end of the player's first turn, not within 8\" of any enemy models." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:847-853" },
  },
  {
    id: "moneylenders_house",
    kind: "fiveOfAKind",
    value: 1,
    name: "Moneylender's House",
    flavour:
      "A grand mansion, that is strongly built from stone, has survived the cataclysm remarkably well. A carved coat of arms adorns the lintel above the doorway although it has been defaced by raiders and the symbols are now unrecognisable. The door itself, has been smashed open with axes and hangs open on its hinges.",
    rules:
      "Inside, hidden amongst the debris, you find D6x10 gc to add to your treasury.",
    rewards: [
      { kind: "gold", amount: "D6x10", text: "D6x10 gc to add to your treasury" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:857-861" },
  },
  {
    id: "alchemists_laboratory",
    kind: "fiveOfAKind",
    value: 2,
    name: "Alchemist's Laboratory",
    flavour:
      "A narrow stairway leads down into a crypt-like dwelling which was once an alchemist's workshop. The sign still hangs from one hinge above the entrance. It looks as if this was a very old building which has remained in use for centuries although it did not survive the comet's destruction too well. The stone floor has strange symbols on it and there are charts and astrological symbols painted onto the walls.",
    rules:
      "In the ruins you find loot worth 3D6 gc and a battered old notebook. One of your Heroes may study the Alchemist's notebook, and the extra wisdom he gains will enable him to choose from Academic skills whenever he gains a new skill in addition to those skills normally available to him.",
    rewards: [
      { kind: "gold", amount: "3D6", text: "loot worth 3D6 gc" },
      { kind: "item", itemName: "Alchemist's notebook", text: "A battered old notebook. One of your Heroes may study the Alchemist's notebook, and the extra wisdom he gains will enable him to choose from Academic skills whenever he gains a new skill in addition to those skills normally available to him." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:863-867" },
  },
  {
    id: "jewelsmith",
    kind: "fiveOfAKind",
    value: 3,
    name: "Jewelsmith",
    flavour:
      "The houses in the jewellers' quarter have all been well and truly looted long ago. Even the rubble has been picked over many times for fragments of gold and gems. But still, some small but valuable items may have been overlooked.",
    rules:
      "Roll a D6 to see what you find:\n\n| D6 | Result |\n|---|---|\n| 1-2 | Quartz stones worth D6x5 gc |\n| 3-4 | Amethyst worth 20 gc |\n| 5 | Necklace worth 50 gc |\n| 6 | A ruby worth D6x15 gc |\n\nIf your warband does not sell the gems, one of your Heroes may keep them and displays them proudly. He will gain +1 to the rolls for locating rare items as merchants flock to such an obviously wealthy warrior.",
    subRoll: {
      die: "D6",
      prompt: "Roll a D6 to see what you find:",
      outcomes: [
        {
          band: { min: 1, max: 2 },
          text: "Quartz stones worth D6x5 gc",
          rewards: [
            { kind: "item", itemName: "Quartz stones", text: "Quartz stones worth D6x5 gc" },
          ],
        },
        {
          band: { min: 3, max: 4 },
          text: "Amethyst worth 20 gc",
          rewards: [
            { kind: "item", itemName: "Amethyst", text: "Amethyst worth 20 gc" },
          ],
        },
        {
          band: { min: 5, max: 5 },
          text: "Necklace worth 50 gc",
          rewards: [
            { kind: "item", itemName: "Necklace", text: "Necklace worth 50 gc" },
          ],
        },
        {
          band: { min: 6, max: 6 },
          text: "A ruby worth D6x15 gc",
          rewards: [
            { kind: "item", itemName: "Ruby", text: "A ruby worth D6x15 gc" },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:869-882" },
  },
  {
    id: "merchants_house",
    kind: "fiveOfAKind",
    value: 4,
    name: "Merchant's House",
    flavour:
      "The merchant's house stands by the waterfront. It has a vaulted stone undercroft which is still stacked with barrels and bales of cloth. The foodstuffs have been looted or eaten long ago and huge rats infest the rotting bales. Up the stairs are the dwelling quarters, solidly built of timber, although badly damaged you think you can still get up to them but you'll need to tread with care!",
    rules:
      "Inside you find several valuable objects which can be sold for 2D6x5 gc. If you roll a double, instead of finding money you find the symbol of the Order of Freetraders. A Hero in possession of this gains the Haggle skill.",
    rewards: [
      { kind: "gold", amount: "2D6x5", text: "several valuable objects which can be sold for 2D6x5 gc" },
      { kind: "text", text: "If you roll a double, instead of finding money you find the symbol of the Order of Freetraders. A Hero in possession of this gains the Haggle skill." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:884-888" },
  },
  {
    id: "shattered_building",
    kind: "fiveOfAKind",
    value: 5,
    name: "Shattered Building",
    flavour:
      "The comet destroyed this building almost completely, making it unsafe for all but the most daring to explore. But places such as this are the best for searching for wyrdstone shards.",
    rules:
      "You find D3 shards of wyrdstone amongst the ruins. In addition take a Leadership test against the warband leader's Leadership value. If passed a wardog that was guarding the building joins the warband.",
    test: { stat: "Ld", prompt: "Take a Leadership test against the warband leader's Leadership value. If passed a wardog that was guarding the building joins the warband." },
    rewards: [
      { kind: "wyrdstone", amount: "D3", text: "D3 shards of wyrdstone amongst the ruins" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:890-894" },
  },
  {
    id: "entrance_to_the_catacombs",
    kind: "fiveOfAKind",
    value: 6,
    name: "Entrance to the Catacombs",
    flavour:
      "You find a well-hidden entrance to the dark catacombs which extend for miles beneath the city of Mordheim. Although the entrance looks foreboding the tunnels will take hours off your searches of the city.",
    rules:
      "You can use these tunnels to explore Mordheim more efficiently. From now on, you may re-roll one dice when you roll on the Exploration chart. Make a note of this in your warband's roster sheet. Second and subsequent catacomb entrances you find do not grant you any additional re-rolls, although you may find further re-rolls from other sources.",
    rewards: [
      { kind: "text", text: "From now on, you may re-roll one dice when you roll on the Exploration chart. Second and subsequent catacomb entrances you find do not grant you any additional re-rolls." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:896-900" },
  },
  {
    id: "the_pit",
    kind: "sixOfAKind",
    value: 1,
    name: "The Pit",
    flavour:
      "You have come within sight of the Pit, the huge crater created by the comet. A black cloud still rises from it but you can see glowing wyrdstone everywhere. This is the domain of the Shadow Lord, the lord of the Possessed, and no-one is welcome here – even his own followers!",
    rules:
      "If you wish, you can send one of your Heroes to search for any wyrdstone hidden here. Roll a D6. On a roll of 1 the Hero is devoured by the guardians of the Pit and never seen again. On a roll of 2 or more he returns with D6+1 shards of wyrdstone.",
    subRoll: {
      die: "D6",
      prompt: "If you wish, you can send one of your Heroes to search for any wyrdstone hidden here. Roll a D6.",
      outcomes: [
        {
          band: { min: 1, max: 1 },
          text: "The Hero is devoured by the guardians of the Pit and never seen again.",
          rewards: [],
        },
        {
          band: { min: 2, max: 6 },
          text: "He returns with D6+1 shards of wyrdstone.",
          rewards: [
            { kind: "wyrdstone", amount: "D6+1", text: "D6+1 shards of wyrdstone" },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:904-908" },
  },
  {
    id: "hidden_treasure",
    kind: "sixOfAKind",
    value: 2,
    name: "Hidden Treasure",
    flavour:
      "In the depths of Mordheim, you come across a hidden chest, bearing the coat-of-arms of one of the noble families of the town.",
    rules:
      "When you open the chest you find the following items. Roll for every item on the list separately (apart from the gold crowns) to see whether you have found it. For example, on a roll of a 4+ you find the wyrdstone.\n\n| Items | D6 Result Needed |\n|---|---|\n| D3 Pieces of wyrdstone | 4+ |\n| 5D6x5 gc | Auto |\n| Holy Relic | 5+ |\n| Suit of Heavy Armour | 5+ |\n| D3 Gems worth 10 gc each | 4+ |\n| Elven Cloak | 5+ |\n| Holy Tome | 5+ |\n| Magical Artefact | 5+ |",
    rewards: [
      { kind: "gold", amount: "5D6x5", text: "5D6x5 gc (Auto)" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:910-925" },
  },
  {
    id: "dwarf_smithy",
    kind: "sixOfAKind",
    value: 3,
    name: "Dwarf Smithy",
    flavour:
      "You find a solidly built stone workshop. A runic inscription indicates that this may have been a Dwarf smithy.",
    rules:
      "Roll a D6 to see what you find:\n\n| D6 | Result |\n|---|---|\n| 1 | D3 Double-handed axes |\n| 2 | D3 Suits of Heavy Armour |\n| 3 | Gromril Axe |\n| 4 | Gromril Hammer |\n| 5 | Double-handed Gromril Axe |\n| 6 | Gromril Armour |",
    subRoll: {
      die: "D6",
      prompt: "Roll a D6 to see what you find:",
      outcomes: [
        {
          band: { min: 1, max: 1 },
          text: "D3 Double-handed axes",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Double-handed axes", text: "D3 Double-handed axes" },
          ],
        },
        {
          band: { min: 2, max: 2 },
          text: "D3 Suits of Heavy Armour",
          rewards: [
            { kind: "item", amount: "D3", itemName: "Suits of Heavy Armour", text: "D3 Suits of Heavy Armour" },
          ],
        },
        {
          band: { min: 3, max: 3 },
          text: "Gromril Axe",
          rewards: [
            { kind: "item", itemName: "Gromril Axe", text: "Gromril Axe" },
          ],
        },
        {
          band: { min: 4, max: 4 },
          text: "Gromril Hammer",
          rewards: [
            { kind: "item", itemName: "Gromril Hammer", text: "Gromril Hammer" },
          ],
        },
        {
          band: { min: 5, max: 5 },
          text: "Double-handed Gromril Axe",
          rewards: [
            { kind: "item", itemName: "Double-handed Gromril Axe", text: "Double-handed Gromril Axe" },
          ],
        },
        {
          band: { min: 6, max: 6 },
          text: "Gromril Armour",
          rewards: [
            { kind: "item", itemName: "Gromril Armour", text: "Gromril Armour" },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:927-940" },
  },
  {
    id: "slaughtered_warband",
    kind: "sixOfAKind",
    value: 4,
    name: "Slaughtered Warband",
    flavour:
      "You find the remains of an entire warband. Broken bodies lay scattered among the ruins, torn apart by some monstrous creature. You see a huge shape, which looks like an immense Possessed creature, shambling away.",
    rules:
      "After giving the dead their final rites (Sisters of Sigmar or Witch Hunters), eating them (Skaven or Undead) or looting them (anyone else!) you find the following items. Roll for every item separately (apart from the gold coins and daggers) to see if you find it. For example, on a roll of 4+ you will find the suits of light armour.\n\n| Item | D6 Result Needed |\n|---|---|\n| 3D6x5 gc | Auto |\n| D3 Suits of Light Armour | 4+ |\n| Suit of Heavy Armour | 5+ |\n| D6 Daggers | Auto |\n| Mordheim Map | 4+ |\n| D3 Halberds | 5+ |\n| D3 Swords | 3+ |\n| D3 Shields | 2+ |\n| D3 Bows | 4+ |\n| D3 Helmets | 2+ |",
    rewards: [
      { kind: "gold", amount: "3D6x5", text: "3D6x5 gc (Auto)" },
      { kind: "item", amount: "D6", itemName: "Daggers", text: "D6 Daggers (Auto)" },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:942-959" },
  },
  {
    id: "fighting_arena",
    kind: "sixOfAKind",
    value: 5,
    name: "Fighting Arena",
    flavour:
      "During better times, Mordheim was famous for its duellists and pit fighters. You have found one of the areas used to train these warriors. The place is filled with training equipment and practice weapons.",
    rules:
      "You find a training manual, which you can either sell for 100 gc or let one of your Heroes read. The extra knowledge your Hero gleans from reading the manual entitles him to choose from Combat skills whenever he gains a new skill, and his WS may now be increased by an extra point above his normal racial maximum (for example, a Human who has the book would now have a maximum Weapon Skill of 7).",
    rewards: [
      { kind: "item", itemName: "Training manual", text: "A training manual, which you can either sell for 100 gc or let one of your Heroes read. The Hero may then choose from Combat skills whenever he gains a new skill, and his WS may be increased by an extra point above his normal racial maximum." },
    ],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:961-965" },
  },
  {
    id: "nobles_villa",
    kind: "sixOfAKind",
    value: 6,
    name: "Noble's Villa",
    flavour:
      "You find a fine house which is partially ruined. It has been thoroughly ransacked and all the furniture has been stripped of its fine fabrics. Shards of broken pottery of the finest quality are scattered over the floor.",
    rules:
      "Roll a D6. If you roll 1-2, you find D6x10 gc worth of items and money to add to your treasury. On a roll of 3-4, you find D6 vials of Crimson Shade. On a roll of 5-6 you find a hidden magical artefact carefully concealed in a hidden cellar or behind a secret door. Roll on the Magical Artefacts table.",
    subRoll: {
      die: "D6",
      prompt: "Roll a D6.",
      outcomes: [
        {
          band: { min: 1, max: 2 },
          text: "You find D6x10 gc worth of items and money to add to your treasury.",
          rewards: [
            { kind: "gold", amount: "D6x10", text: "D6x10 gc worth of items and money" },
          ],
        },
        {
          band: { min: 3, max: 4 },
          text: "You find D6 vials of Crimson Shade.",
          rewards: [
            { kind: "item", amount: "D6", itemName: "Crimson Shade", text: "D6 vials of Crimson Shade" },
          ],
        },
        {
          band: { min: 5, max: 6 },
          text: "You find a hidden magical artefact carefully concealed in a hidden cellar or behind a secret door. Roll on the Magical Artefacts table.",
          rewards: [
            { kind: "text", text: "A magical artefact — roll on the Magical Artefacts table." },
          ],
        },
      ],
    },
    rewards: [],
    source: { publication: PUBLICATION, file: "reference/rules/03-campaigns-magic-optional-rules.md:967-971" },
  },
];

export function findLocation(kind: MultipleKind, value: number): ExplorationLocation | undefined {
  return EXPLORATION_LOCATIONS.find((l) => l.kind === kind && l.value === value);
}

/** Header text of the Magical Artefacts table, verbatim (reference/rules/03-campaigns-magic-optional-rules.md:975). Roll a D6. */
export const MAGICAL_ARTEFACTS_RULE: string =
  "Roll a D6 and use this table to determine which item you find when a result in the Exploration chart indicates that you have found a magical artefact. In a campaign none of these items can appear more than once, so if you find a magic item which is already in someone else's possession roll again – even if the warrior carrying it has been killed.\n\n#### 1 The Boots and Rope of Pieter";

/** reference/rules/03-campaigns-magic-optional-rules.md:977-1021. `text` is the artefact's full entry (background paragraph plus rules). */
export const MAGICAL_ARTEFACTS: MagicalArtefact[] = [
  {
    band: { min: 1, max: 1 },
    name: "The Boots and Rope of Pieter",
    text:
      "Pieter, the master thief of the Guild of Shadows, was the most famous of all the cat burglars of Mordheim. He earned the nickname 'Spider' for his daring robberies. The secret of his success was a pair of enchanted boots and a magical rope which he had acquired from far-off Araby.\n\nA model wearing these boots may move normally (including running, charging, etc) on any kind of terrain, including vertical surfaces. When moving the model, simply adds the distances moved horizontally to that moved vertically, with no Initiative test needed (except to jump across gaps).",
  },
  {
    band: { min: 2, max: 2 },
    name: "The Count of Ventimiglia's Misericordia",
    text:
      "This dagger was used by the notorious Tilean gentleman-pirate known as the 'Black Corsair'. It is claimed that he found it in ancient Elven ruins and legend also has it that the dagger's blade cannot be damaged in any way.\n\nThe dagger is treated as a sword. Opponents wounded by it are stunned on a result of 1-3 (Undead are knocked down as normal) and put out of action on a 4-6.",
  },
  {
    band: { min: 3, max: 3 },
    name: "Att'la's Plate Mail",
    text:
      "This armour was given as a present by the Dwarf Lord Kurgan to the warlord Att'la in the time of Sigmar Heldenhammer.\n\nAtt'la's Plate Mail is a suit of Gromril Armour with the following three runes inscribed on it:\n\n- **Rune of Spell Eating:** The Hero wearing this armour is immune to all spells.\n- **Rune of Passage:** The Hero can move through solid objects, like walls (this does not mean that he can see through them).\n- **Rune of Fortitude:** The Hero has an extra wound. Note that this may take his total Wounds above his race's maximum.",
  },
  {
    band: { min: 4, max: 4 },
    name: "Bow of Seeking",
    text:
      "This bow was a gift to Count Steinhardt from the Elf lords of the Forest of Shadows.\n\nAny arrow shot using this magic bow will pursue the target and hit it even if the target is behind cover. Treat this as an Elven Bow that always hits on a 2+, regardless of any to hit modifier. Such is its deadly precision that all the arrows shot with this weapon count as Hunting Arrows (+1 on all Injury rolls).\n\nPick any enemy model in range, not just the closest, but the shooter must be able to see the target (even the tip of a target's weapon is enough – as long as the shooter is aware of the presence and position of the target, he can shoot). In addition, if any Dwarf is an eligible target, the arrows will always deviate from their intended target and try to hit the Dwarf instead. For obvious reasons this bow cannot be used to shoot at Elves.",
  },
  {
    band: { min: 5, max: 5 },
    name: "Executioner's Hood",
    text:
      "Recovered from a shipwrecked Dark Elf vessel, this hood carries evil glowing runes which fill the wearer with unreasoning rage.\n\nA warrior wearing this becomes subject to and always will be frenzied even if he is knocked down or stunned. He also adds +1 to his Strength in close combat, such is the power of his fury. The wearer never leaves combat under any circumstances, and will always attack opponents in base contact until they are taken out of action.\n\nIf there are any stunned or knocked down models within the wearer's charge range at the beginning of his turn, he will charge and attack the closest one, even if they are members of his own warband! Fight the hand-to-hand combat until one of the warriors is taken out of action.",
  },
  {
    band: { min: 6, max: 6 },
    name: "All-Seeing Eye of Numas",
    text:
      "This jewel was recovered from the ruins of Numas far in the south. It gives its wielder horrific nightmares that predict his future.\n\nThe bearer of the All-seeing Eye can see all models on the table top, even if they are hidden or out of sight. He can guide his fellow warband members through the ruins (this allows you to roll two dice for the bearer after battle when rolling on the Exploration chart). The bearer also has an additional 6+ save (which is not modified by Strength or weapon modifiers) against all shooting attacks and strikes in close combat, as he can sense the attacks before they are made.\n\nAll animals (such as wardogs, horses, etc) will be affected by frenzy when fighting against the bearer of the All-seeing Eye.",
  },
];

/** Faction income notes, verbatim (reference/rules/03-campaigns-magic-optional-rules.md:1023-1033). */
export const INCOME_NOTES: NamedRule[] = [
  {
    name: "Sisters of Sigmar and Income",
    text:
      "Worldly possessions mean little to the Sisters, but their holy mission to purify Mordheim of the influence of Chaos requires supplies and weaponry, and these are much in demand. Thus the warbands of the Sisterhood compete with each other to gain the best weapons and equipment from the temple's armoury.\n\nTo measure their success, the more wyrdstone the Sisters bring to be kept under lock and key in the Vault of Vindication in the temple at Sigmar's Rock, the more aid they will receive from the temple.\n\nThus all gold crowns in the possession of a Sisters of Sigmar warband represent the resources that the High Matriarch will put at their disposal. It does not represent money in a literal sense, so you may like to think of it as faith, piety, dedication, etc.",
  },
  {
    name: "Skaven and Undead",
    text:
      "Neither of these warbands puts much value on gold, but they send all the wyrdstone they find to their superiors and receive aid and resources in return. Skaven use their own currency for trading, while the Undead are somewhat beyond petty concepts of wealth. For Skaven, the gold crowns in the warband's treasury represent the warp tokens which the Skaven use for currency, while for the Undead it represents the favour they enjoy in the eyes of their master, Vlad von Carstein of Sylvania.",
  },
];
