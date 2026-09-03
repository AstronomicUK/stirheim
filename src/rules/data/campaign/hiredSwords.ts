// Hired Swords — rules text and the index table from mordheimer.net, as captured in
// reference/rules/03-campaigns-magic-optional-rules.md lines 1097-1215.
//
// Each row's `detail` is the full write-up from the per-grade sub-pages, rescraped into
// reference/rules/04-hired-swords.md (Grade 1A/1B/1C/2A pages). Text is verbatim from that file
// with only the scraper's "❓"/"✏️" review markers stripped; `detail.sourceFile` gives the line range.
//
// Generated from the Markdown source; edit the source and regenerate rather than hand-editing rows.

import type { NamedRule, SourceRef } from "../../types/common";
import type { HiredSwordSummary } from "../../types/campaignContent";

export const HIRED_SWORDS_SOURCE: SourceRef = {
  publication: "mordheimer.net — Campaigns: Hired Swords (https://mordheimer.net/docs/campaigns/hired-swords)",
  file: "03-campaigns-magic-optional-rules.md:1097-1215",
};

/** Where the per-entry `detail` write-ups come from (the four per-grade sub-pages). */
export const HIRED_SWORD_DETAILS_SOURCE: SourceRef = {
  publication: "mordheimer.net — Hired Swords, Grade 1A/1B/1C/2A pages (https://mordheimer.net/docs/campaigns/hired-swords/grade-1a etc.)",
  file: "04-hired-swords.md:283-2763",
};

/** General Hired Sword rules, verbatim (source lines 1101-1126). */
export const HIRED_SWORD_RULES: NamedRule[] = [
  {
    name: "Recruiting Hired Swords",
    text: "This section introduces Hired Swords – professional mercenaries – to Mordheim campaign games. Taverns in the settlements and shanty towns around Mordheim are good recruitment centres for warriors who do not belong to any particular warband or retinue, but instead hire out their services to the highest bidder.\n\nA player can recruit Hired Swords when he creates his warband, or during the campaign phase after a game.\n\nHired Swords do not count towards the maximum number of warriors or Heroes a warband may have on its roster and don't affect your income from selling wyrdstone. However, Hired Swords do count as part of the warband for purposes of Rout tests, etc whilst in battle. A player cannot buy extra weapons or equipment for a Hired Sword, and he cannot sell the Hired Sword's weapons or equipment. To reflect their rarity, you can only have one of each type of Hired Sword in your warband. You may not use the Leadership of any of the Hired Swords for Rout tests.",
  },
  {
    name: "Hire Fee",
    text: "When a warband recruits a Hired Sword, you must must pay his hire fee. Subsequently, after each battle he fights, including the first, you must pay his upkeep fee if you want him to remain with the warband. If the Hired Sword is killed, or you no longer require his services, you don't have to pay any upkeep! These costs are indicated in the entries for each Hired Sword.\n\nThe money paid to Hired Swords comes from the warband's treasury in the same way as buying new weapons or recruiting new warriors. If you don't have enough gold to pay for the Hired Sword, or want to spend it on other things, he leaves the warband. Any experience he has gained will be lost, even if you hire a new Henchman of the same type.",
  },
  {
    name: "Injuries",
    text: "If a Hired Sword goes out of action during the game, roll for his injuries as you would roll for a Henchman after a battle (i.e, 1-2 = Lost; 3-6 = Survives).",
  },
  {
    name: "Hired Swords and Experience",
    text: "Hired Swords gain experience in exactly the same way as Henchmen. Refer to the scenarios to find out how much experience Hired Swords gain after each game.\n\nWrite the name and profile of a Hired Sword on your roster sheet in one of the Henchman group slots.\n\nOnce the Hired Sword gains enough experience for an advance, roll on the Heroes Advancement table (as opposed to Henchmen) to determine which advance he gains. Skills available to the Hired Swords are listed under their entries.",
  },
];

/** Every row of the "list of hired swords" index table (source lines 1129-1205). */
export const HIRED_SWORDS: HiredSwordSummary[] = [
  {
    id: "dwarf_troll_slayer", name: "Dwarf Troll Slayer", hireCost: {"base":25,"text":"25 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=8))",
      "hireLine": "25 gold crowns to hire +10 gold crowns upkeep",
      "flavour": "Troll Slayers are members of the morbid Dwarf cult whose followers are obsessed with seeking an honourable death in combat. Having committed some unforgivable crime or been dishonoured in an irredeemable way, a Dwarf will forsake his home and wander off to die fighting the enemies of Dwarfkind.\n\nTroll Slayers are insanely dangerous individuals, psychopathic and violent. However, there are few better fighters, so they are much sought after when warriors are needed.\n\nKnown as ‘Hired Axes’, Troll Slayers who come to Mordheim find plenty of opportunity to indulge their deathwish.",
      "mayBeHired": "Mercenaries and Witch Hunters may hire a Dwarf Troll Slayer. Warbands that include Elves may hire Slayers, but must pay 20 gold crowns after each battle instead of 10 gold crowns. Dwarfs won’t put up with weak pointy-eared folk unless they have to, or are adequately compensated for their sufferance.",
      "rating": "A Dwarf Troll Slayer increases the warband’s rating by 12 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Troll Slayer",
          "stats": {
            "M": 3,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 4,
            "W": 1,
            "I": 2,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "Two Axes or a Double-Handed Axe (the hiring player may choose).",
      "skills": "A Troll Slayer may choose from Combat and Strength skills when he gains a new skill. In addition, there are several skills unique to Dwarf Troll Slayers which he can have instead of normal skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Deathwish",
          "text": "Troll Slayers seek an honourable death in combat. They are completely immune to all psychology and will never need to test if they are fighting alone."
        },
        {
          "name": "Hard to Kill",
          "text": "Troll Slayers are tough, resilient individuals who can only be taken out of action on a D6 roll of 6 instead of 5-6 when rolling on the Injury chart. Treat a roll of 5 as stunned."
        },
        {
          "name": "Hard Head",
          "text": "Troll Slayers ignore the special rules for maces, clubs etc. They are not very easy individuals to knock out!"
        }
      ],
      "uniqueSkills": {
        "tableName": "TROLL SLAYER SKILLS",
        "skills": [
          {
            "name": "Ferocious Charge",
            "text": "The Dwarf may double his attacks on the turn in which he charges. He will suffer a -1 to hit penalty on that turn."
          },
          {
            "name": "Monster Slayer",
            "text": "The Troll Slayer always wounds any opponent on a D6 roll of 4+, regardless of Toughness, unless his own Strength (with weapon modifiers) would mean that a lower result than this is needed."
          },
          {
            "name": "Berserker",
            "text": "The Dwarf may add +1 to his to hit rolls during the turn in which he charges."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:408-446"
    },
  },
  {
    id: "elf_ranger", name: "Elf Ranger", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=7))",
      "hireLine": "40 gold crowns to hire +20 gold crowns upkeep",
      "flavour": "Elves are a wondrous race: lithe, tall, beautiful, longlived and magical. For the most part they are feared and distrusted by humans, though some live in the cities amongst men and offer their services as minstrels and archers in return for a high fee.\n\nThough Elves become rarer in the Old World each year, there are still some roaming on the trackless paths of the Drakwald Forest and the Forest of Shadows.\n\nElves sensibly tend to avoid the ruins of Mordheim, for in the City of the Damned there is little to attract that fey and strange race, but sometimes they are hired by treasure hunters, for few can match their skill with a bow, or their inhuman quickness and agility. The senses of an Elf are much keener than any human’s, and they make excellent scouts.",
      "mayBeHired": "Mercenaries and Witch Hunters may hire Elf Rangers. Warbands which include Dwarfs may hire Elf Rangers, but must pay 40 gold crowns after each battle instead of 20.",
      "rating": "An Elf Ranger increases the warband’s rating by 12 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Elf Ranger",
          "stats": {
            "M": 5,
            "WS": 4,
            "BS": 5,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 6,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Elf Bow, Sword and Elven Cloak.",
      "skills": "An Elf Ranger may choose from Shooting and Speed skills when he gains a new skill. In addition, there are several skills unique to Elf Rangers as detailed below, which he can choose instead of normal skills. Note that these special skills can only be acquired through experience. They are not possessed by a new recruit.",
      "specialRules": [
        {
          "name": "Seeker",
          "text": "When rolling on the Exploration chart, the Elf Ranger allows you to modify one dice roll by -1/+1."
        },
        {
          "name": "Excellent Sight",
          "text": "Elves have eyesight unmatched by mere humans. The Elf Ranger spots Hidden enemies from two times as far away as other warriors (ie, twice his Initiative value in inches)."
        }
      ],
      "uniqueSkills": {
        "tableName": "Elven Skills",
        "skills": [
          {
            "name": "Fey",
            "text": "Hostile magic spells will not affect the Elf on a D6 roll of 4+."
          },
          {
            "name": "Luck",
            "text": "The Elf Ranger is blessed by Lileath, the Elven goddess of luck. Once per game he may re-roll any dice roll he makes (but not one made by other members of the warband)."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:448-482"
    },
  },
  {
    id: "freelancer", name: "Freelancer", hireCost: {"base":50,"text":"50 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=7))",
      "hireLine": "50 gold crowns to hire +20 gold crowns upkeep",
      "flavour": "Just as warriors of the lower social orders can become mercenaries, squires or nobles may offer their skills for hire by becoming a Freelancer or ‘robber knight’. Freelancers are often the younger sons of nobles, who have inherited little but their weapons, horse and armour. Having become disillusioned with their lot in life they have taken the only road available to them: that of a Hired Sword.\n\nFinancial considerations take precedence over the dictates of honour and chivalry. Many Freelancers have drifted to the shanty towns surrounding Mordheim, and offer their considerable strength to the highest bidders.",
      "mayBeHired": "Mercenaries and Witch Hunters may hire Freelancers.",
      "rating": "A Freelancer increases the warband’s rating by +21 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Freelancer",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        },
        {
          "name": "Warhorse",
          "stats": {
            "M": 8,
            "WS": 3,
            "BS": 0,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 5
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Heavy Armour, Shield, Lance and Sword. If you are using the optional rules for mounted models, a Freelancer rides a Warhorse (and has the Ride Warhorse skill from the [Blazing Saddles article](/docs/optional-rules/mounted-combat/blazing-saddles)). When mounted, the Freelancer has an armour saving throw of 3+. On foot his save is 4+.",
      "skills": "A Freelancer may choose from Combat and Strength skills when he gains a new skill.",
      "specialRules": [],
      "sourceFile": "04-hired-swords.md:484-505"
    },
  },
  {
    id: "halfling_scout", name: "Halfling Scout", hireCost: {"base":15,"text":"15 gc"}, upkeep: {"base":5,"text":"5 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=6))",
      "hireLine": "15 gold crowns to hire +5 gold crowns upkeep",
      "flavour": "Halflings are diminutive creatures, generally more concerned with the timing of their next meal (or two) than with military pursuits. They range from three to four feet tall, and are neither very strong nor tough, but are naturally good shots and steadfast in the face of danger. Some Halflings are more adventurous than others, however, and these bold spirits are much sought after by mercenary bands, for they are splendid archers, and excellent cooks to boot.",
      "mayBeHired": "Any warband except Skaven, Undead and the Possessed may hire a Halfling Scout.",
      "rating": "A Halfling Scout increases the warband’s rating by +5 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Halfling",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 4,
            "S": 2,
            "T": 2,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Bow, Dagger and a cooking pot (counts as a Helmet).",
      "skills": "A Halfling may choose from Speed and Shooting skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Cook",
          "text": "Halflings are renowned for their cooking skills. A warband with a Halfling Scout may increase its maximum size by +1, as warriors from all around are attracted by the smell of great food! Note that this does not increase the maximum number of Heroes you may have."
        }
      ],
      "sourceFile": "04-hired-swords.md:507-529"
    },
  },
  {
    id: "ogre_bodyguard", name: "Ogre Bodyguard", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=5))",
      "hireLine": "80 gold crowns to hire +30 gold crowns upkeep",
      "flavour": "Ogres are large, brutish creatures, standing some ten feet tall, and all of it bone and muscle. For this reason they are much in demand as bodyguards and mercenaries, despite their lack of brains. A warband backed up by an Ogre makes a fearsome enemy, since Ogres are extremely dangerous fighters and a terrifying sight to behold when enraged. They happily accept any employer, as they are notoriously unbothered about who they fight for.",
      "mayBeHired": "Any warband except Skaven may hire an Ogre Bodyguard.",
      "rating": "An Ogre Bodyguard increases the warband’s rating by +25 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Ogre",
          "stats": {
            "M": 6,
            "WS": 3,
            "BS": 2,
            "S": 4,
            "T": 4,
            "W": 3,
            "I": 3,
            "A": 2,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Either two Swords, Axes or Clubs (or any mix of them), or a Double-Handed Weapon (you may choose which). Ogres wear Light Armour.",
      "skills": "An Ogre may choose from Combat and Strength skills when he gains new skills.",
      "specialRules": [
        {
          "name": "Fear",
          "text": "Ogres are large, threatening creatures that cause fear."
        },
        {
          "name": "Large Target",
          "text": "Ogres are Large Targets as defined in the shooting rules."
        }
      ],
      "sourceFile": "04-hired-swords.md:592-616"
    },
  },
  {
    id: "pit_fighter", name: "Pit Fighter", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=5))",
      "hireLine": "30 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "Pit Fighters are dangerous men who make their living in the illegal fighting pits of the Empire. Many of them are slaves and prisoners but some are free men who earn their living from savage pit fights in settlements like Cutthroat’s Haven or Black Pit. Even though pit fights are banned in many provinces, they are very popular and a great deal of money is wagered on the outcome. Thus many authorities turn a blind eye to these bloodsports.\n\nWhen not in the pits, Pit Fighters offer their services to the highest bidders, and they readily find employment in warbands intent on exploring the ruins of Mordheim. Pit Fighters are powerful and dangerous fighters, and their unique weaponry gives them an advantage against almost any opponent.",
      "mayBeHired": "Any warband apart from Undead and Skaven may hire a Pit Fighter.",
      "rating": "A Pit Fighter increases the warband’s rating by +22 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Pit Fighter",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 1,
            "I": 4,
            "A": 2,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Morning star, spiked gauntlet and Helmet. The spiked gauntlet counts as an additional hand weapon and a buckler. And no, your Heroes cannot learn to use it!",
      "skills": "A Pit Fighter may choose from Combat, Speed and Strength skills when he gains a new skill.",
      "specialRules": [],
      "sourceFile": "04-hired-swords.md:618-638"
    },
  },
  {
    id: "warlock", name: "Warlock", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=6))",
      "hireLine": "30 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "Wizards, shamans, mystics, all these and more are associated with men who can wield the power of magic. All magic is potentially dangerous and originates from Chaos, so those blessed (or cursed) with the power of sorcery are hated and feared.\n\nStill, it is not difficult to find employment if you are a wizard, for many are willing to take the risk of persecution. But hiring a Warlock does not only mean that you lose your gold – if the teachings of the Cult of Sigmar are to be believed, your soul is at risk as well...",
      "mayBeHired": "Any warband except Witch Hunters and Sisters of Sigmar may hire a Warlock.",
      "rating": "A Warlock increases the warband’s rating by +16 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Warlock",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "A Warlock carries a Staff.",
      "skills": "Warlocks may choose skills from the Academic skills list, or they may randomly determine a new spell from the [Lesser Magic](/docs/magic/lesser-magic) spell list",
      "specialRules": [
        {
          "name": "Wizard",
          "text": "Warlocks are magicians and have two spells generated at random from the [Lesser Magic](/docs/magic/lesser-magic) list. See the Magic section for details."
        }
      ],
      "sourceFile": "04-hired-swords.md:695-719"
    },
  },
  {
    id: "arabian_merchant", name: "Arabian Merchant", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1a", source: "Town Cryer 22",
    detail: {
      "sourceLine": "Source: Town Cryer 22 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=17))",
      "hireLine": "20 gold crowns to hire +10 gold crowns upkeep",
      "flavour": "From the lands of eternal desert they come, crossing the sea to reach the Empire, in search of the city spoken of in frightened whispers and imagined in childhood nightmares; Mordheim – City of the Damned.\n\nNot all hirelings are warriors and the merchants of Araby are not known for their martial prowess. Rather they are advisers, treasure seekers and collectors of the arcane. Found within the shady bazaars of seldom trodden streets and darkened taverns, they have an uncanny knack of finding the best equipment for the best price, tapping into the vein-like underworld network of black markets and foreign traders providing for any would-be adventurers.\n\nExperts in treasure and antiques, they seek their own fortune in the forgotten artefacts buried deep beneath the city but require a warband’s protection. Reciprocal then is this relationship. Although keen to avoid conflict, their employers’ keep them close at hand, as a smooth talking merchant is not to be trusted when treasure and glory is at stake…",
      "mayBeHired": "Any good aligned warbands may hire an Arabian Merchant (ie, Mercenaries, Dwarfs, Witch Hunters, Tomb Raiders, etc).",
      "rating": "An Arabian Merchant increases the warband's rating by +10 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Arabian Merchant",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        },
        {
          "name": "Bodyguard",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 2,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Scimitar (counts as a Sword).",
      "skills": "A Merchant may choose from Academic skills when he gains a new skill (he also has his own special skill that he can choose – see below).",
      "specialRules": [
        {
          "name": "Haggle",
          "text": "A Merchant has the Haggle skill."
        },
        {
          "name": "Pawnbroker",
          "text": "The Merchant is skilled in finding the best price for sold items and as such gains an extra 2D6 gold per item that the warband sells (up to its full value) if he was not taken out of action in the battle."
        },
        {
          "name": "Marketeer",
          "text": "The Merchant has many useful contacts in the black market underworld and foreign traders to locate many special items. After each battle (if he wasn’t taken out of action) the Merchant can visit one of three markets: the [Black Market](/docs/campaigns/hired-swords/grade-1a#black-market), [Foreign Wares](/docs/campaigns/hired-swords/grade-1a#foreign-wares) and the [Fencer](/docs/campaigns/hired-swords/grade-1a#fencer), in search of items for the warband. Roll a D6 on the relevant table to see what items are on offer."
        },
        {
          "name": "Black Market",
          "text": "A den of thieves and underworld brigands the black markets of Mordheim sell and procure all manner of illicit substances and are regularly frequented by the infamous members of the Assassins guild…\n\n| D6 | Items | Cost |\n| --- | --- | --- |\n| 1 | Nothing available. | \\- |\n| 2 | Dark Venom or Black Lotus (D3 doses) | 30 gc / 10 gc |\n| 3 | Crimson Shade (D3 doses) | 35 gc |\n| 4 | Mandrake Root or Madcap Mushrooms (D3 doses) | 25 gc / 30 gc |\n| 5 | Stiletto Blade (need Weapons Training to use) +1 attack per turn at -1 strength. | 20 gc |\n| 6 | Blowpipe (need Weapons Training to use) | 25 gc |"
        },
        {
          "name": "Foreign Wares",
          "text": "Traders from across the seas can be found in the shady taverns and street corners on the outskirts of Mordheim. They have many exotic and wondrous items for sale, but at a hefty price…\n\n| D6 | Items | Cost |\n| --- | --- | --- |\n| 1 | Nothing available. | \\- |\n| 2 | Venom Ring | 20 gc |\n| 3 | Lamp of the Djinn or Monkey’s Paw | 50 gc / 50 gc |\n| 4 | Magic Carpet or Tufenk | 50 gc / 15 gc |\n| 5 | Elven Cloak | 100 gc |\n| 6 | Cathayan Silks | 50 gc |"
        },
        {
          "name": "Fencer",
          "text": "Fencers have an eclectic range of items ‘procured’ from sources best left unspoken. Offered at incredible prices, traders should be wary for their word is not their bond and such items are often ‘flawed’…\n\n| D6 | Items | Cost |\n| --- | --- | --- |\n| 1 | Halfling Cook Book | ~30 gc~ 15 gc |\n| 2 | Ithilmar Weapon | ~3 x Price~ 1.5 x Price |\n| 3 | Gromril Weapon | ~4 x Price~ 2 x Price |\n| 4 | Tome of Magic | ~200 gc~ 100 gc |\n| 5 | Hunting Rifle or Elven Bow | ~200 gc~ 100 gc / ~35 gc~ 18 gc |\n| 6 | Brace of Duelling Pistols | ~60 gc~ 30 gc |\n\nAll the items purchased through the Merchant’s market contacts are at their base price (i.e., do not add the random gold modifier for items). All items bought from the Fencer are also at half price but after the item is used once roll a D6. On a roll of 1, the item breaks and is useless – an elaborate fake!"
        }
      ],
      "uniqueSkills": {
        "tableName": "Merchant Skills",
        "skills": [
          {
            "name": "Stone Cutter",
            "text": "The Merchant has the skill to refine wyrdstone shards to increase their value. Whenever a warband sells its wyrdstone the Merchant may try to refine the source. Roll a D6 to discover how much additional gold the wyrdstone is worth.\n\n|  D6  | Gold |\n| --- | --- |\n| 1-2 | Lose 2D6 gold crowns. |\n| 3-5 | Gain 2D6 gold crowns. |\n| 6 | Gain 3D6 gold crowns. |"
          },
          {
            "name": "Guardian",
            "text": "The Merchant has ‘acquired’ a bodyguard to protecting from harm in the coming battles. The bodyguard will only protect the Merchant and cannot fulfil warband objectives or search, loot or any function other than protecting the Merchant and as such will remain within 1\" of the Merchant at all times. The bodyguard doesn’t gain experience and isn’t paid (it is assumed he has been ‘gifted’ to the Merchant as a favour from one of his contacts).\n\n**Equipment:** Sword, Light Armour, Shield and Helmet."
          }
        ]
      },
      "otherSections": [
        {
          "name": "Special Rules (Merchant Skills)",
          "text": "**Intercept:** the bodyguard will intercept any model shooting at or charging the Merchant. Any attacks will be directed at him and if charged place the bodyguard in front of the Merchant to protect him. The bodyguard will not charge unless the Merchant also charges and cannot intercept an attack if already engaged in combat."
        }
      ],
      "sourceFile": "04-hired-swords.md:285-378"
    },
  },
  {
    id: "beast_hunter", name: "Beast Hunter", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1a", source: "Town Cryer 28",
    detail: {
      "sourceLine": "Source: Town Cryer 28 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=10))",
      "hireLine": "35 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "The Beast Hunter is a dark wanderer, full of mystery and self-loathing. His is a woeful tale. Kith and kin slaughtered by the foul Beastmen of the wild. He is one of many such men who have been driven to the very edge by their experiences, yearning only now for unquenchable revenge against those that destroyed their once normal lives. They bedeck themselves in the skins of their foes and take on a truly frightening aspect. It is a stout captain indeed who hires such 'wild men' of the forest but their hunter's skills are without equal and their raw strength in combat is too awesome to ignore. Dangerous and ferocious, ideal qualities for survival in the dark, unbridled wilds.",
      "mayBeHired": "Any warband other than Skaven, Beastmen, Undead, Orcs & Goblins, Possessed and Carnival of Chaos may hire a Beast Hunter.",
      "rating": "A Beast Hunter increases the warband’s rating by 18 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Beast Hunter",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 4,
            "W": 1,
            "I": 4,
            "A": 2,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Two Axes, Throwing Axe (counts as a Throwing Knife with +1 Strength), Light Armour.",
      "skills": "A Beast Hunter may choose from Combat and Strength skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Beastmen Vengeance",
          "text": "The Beast Hunter hates all Beastmen (this includes Gors, Ungors, Centigors and Minotaurs) and will fight for no upkeep cost in battles against Beastmen."
        },
        {
          "name": "Skull Rack",
          "text": "The Beast Hunter wears a grisly skull rack bedecked with bestial skulls. He causes fear for in all Beastmen."
        },
        {
          "name": "Predator",
          "text": "The Beast Hunter is a predator of all fell creatures but most especially Beastmen. In any battle that is set in the wilderness (ie. not within Mordheim) that involves Beastmen, the Beast Hunter may be set up after both warbands have deployed. He may be set up anywhere on the board that is hidden and outside of the enemy deployment zone."
        }
      ],
      "sourceFile": "04-hired-swords.md:380-406"
    },
  },
  {
    id: "highwayman", name: "Highwayman", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1a", source: "Town Cryer 26",
    detail: {
      "sourceLine": "Source: Town Cryer 26 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=12))",
      "hireLine": "35 gold crowns to hire +20 gold crowns upkeep",
      "flavour": "Roaming the woods and secluded byways of the Empire, highwaymen prey on the many coaches and wagons foolish or desperate enough to travel there. These are dark and dangerous men, often employed for their knowledge of cargo charters and skill at ambush. Oft they appear to the naked eye, bereft of their blackened garb, as foppish, charming characters, but that ruse is a genteel masquerade as their cruelty and viciousness will testify. Deadly pistoliers and expert riders, they are an asset to any warband but watch your back, for they are untrustworthy, selfserving men.",
      "mayBeHired": "Any warband, except Sisters of Sigmar, Witch Hunters and any good-aligned Elves may hire a Highwayman. A Highwayman will never join a warband that also contains a Roadwarden.",
      "rating": "A Highwayman increases a warband's rating by 20 points plus 1 point for each Experience point the Highwayman has.",
      "profiles": [
        {
          "name": "Highwayman",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 7
          }
        },
        {
          "name": "Horse",
          "stats": {
            "M": 8,
            "WS": 0,
            "BS": 0,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 0,
            "Ld": 5
          }
        }
      ],
      "weaponsArmour": "Dagger, Brace of pistols, Rapier and a cloak (acts as a Buckler in close combat). If you are using the optional rules for mounted models then the Highwayman also rides a Horse. When the Highwayman is mounted, he has a save of 6+, on foot he has no Armour save.",
      "skills": "The Highwayman may choose from Combat, Shooting, Speed and Cavalry when he gains a new skill.",
      "specialRules": [
        {
          "name": "Expert Pistolier",
          "text": "A Highwayman’s skill with a brace of pistols is unrivalled and as such he combines the effects of the skills Pistolier and Trick Shooter."
        },
        {
          "name": "Expert Rider",
          "text": "A Highwayman is a superb rider and as such while he is mounted he counts as being stationary for the purposes of shooting (i.e.. no -1 modifier to hit) and he also benefits from the skill as he can reload quickly whilst on horseback."
        },
        {
          "name": "Unscrupulous",
          "text": "A Highwayman, despite all his skill and bravado, is not to be trusted. At the end of each battle roll a D6, on a roll of a 1 the warband receives 1 less piece of Treasure than they would normally as the Highwayman has stolen it for himself (this Treasure is not spent on the Highwayman, it is lost!). Obviously, if this keeps happening it will be up to warband leader to keep the Highwayman in his employ or not…"
        }
      ],
      "sourceFile": "04-hired-swords.md:531-558"
    },
  },
  {
    id: "imperial_assassin", name: "Imperial Assassin", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1a", source: "Mordheim Annual 2002",
    detail: {
      "sourceLine": "Source: Mordheim Annual 2002 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=13))",
      "hireLine": "40 gold crowns to hire +20 gold crowns upkeep",
      "flavour": "Politics is a dangerous game and not all dangers are found on the battlefield. The Assassin specializes in removing ‘obstacles’ with discretion. He will hire himself out to the highest bidder and satisfaction is guaranteed. The Assassin calmly dispatches his rather distasteful duties with fastidiousness and finesse. In between jobs, such a man will often join a wandering warband in order to hone his skills; assassination is not a profession for the slow or dullwitted!",
      "mayBeHired": "Any warband except Witch Hunters, Sister of Sigmar, Orcs & Goblins or Skaven may hire the Assassin.",
      "rating": "An Imperial Assassin increases a warband's rating by 22 points plus 1 point for each Experience point the Imperial Assassin has.",
      "profiles": [
        {
          "name": "Imperial Assassin",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 5,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Sword, Dagger, Throwing Daggers and a Crossbow Pistol.",
      "skills": "The Imperial Assassin may choose from Combat, Shooting Speed and Unstoppable Charge from the Strength skills when he gains a new skill. In addition, the Imperial Assassin may choose from the Assassin Special Skill list.",
      "specialRules": [
        {
          "name": "Poisoner",
          "text": "Assassins specialize in the use of poisons. The Assassin starts each game with his weapons poisoned with either Black Lotus or Dark Venom. The controlling player decides which poison the Assassin is armed with before the game starts, and this poison does not need to be traded for. And no, the Assassin cannot poison other warband members’ weapons, nor will he loan his out!"
        },
        {
          "name": "Weapons Master",
          "text": "The Assassin is a master of weapons and may use any weapon he finds. You may purchase weapons for the Assassin just as you would for any other member of your warband. However, unlike other members of your warband, any weapon you give an Assassin is his to keep – he will not give it to another warband member later. In addition, although he knows how to use them, an Assassin will never use a blackpowder weapon as such devices are far too conspicuous in their use for someone in his profession."
        }
      ],
      "uniqueSkills": {
        "tableName": "Assassin skills",
        "skills": [
          {
            "name": "Backstabber",
            "text": "The Assassin specializes in attacking his targets when their back is turned. The Assassin may charge an opponent he cannot see (he knows you’re there!) as long as the target model is within his charge reach. If he does this, he surprises his opponent and receives a +1 to hit him with all attacks and any rolls on the Injury chart are at +1. This bonus lasts for the first round of combat only, as his opponent will swiftly recover his wits if he survives the initial assault"
          },
          {
            "name": "Hide in Shadows",
            "text": "The Assassin can blend into the shadows so that his opponents will not see him. As long as he is within 1\" of a wall or other linear obstacle (hedge, fence, well, etc), opposing models must pass an Initiative test in order to charge or shoot at him."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:560-590"
    },
  },
  {
    id: "roadwarden", name: "Roadwarden", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1a", source: "Town Cryer 26",
    detail: {
      "sourceLine": "Source: Town Cryer 26 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=11))",
      "hireLine": "40 gold crowns to hire +20 gold crowns upkeep",
      "flavour": "Patrolling the fraught and dangerous highways of the Empire, Road wardens are dour men of the sternest courage. Solitary figures, they range far and wide, often with little food and in all weathers. They are hardened and brutal fighters, uncompromising and without any martial code, they give no quarter as they expect none to be given in return. Their skill lies with the crossbow, with which they are excellent hunters and deadly marksmen. Highwaymen, deviants and bandits are their common quarry, safety of the roadways their charge and they execute both with deliberate and unswerving severity.",
      "mayBeHired": "Any good-aligned warband may hire a Roadwarden such as Witch Hunters, Sisters of Sigmar, Dwarfs and Human Mercenaries. A Roadwarden will never join a warband that also contains a Highwayman.",
      "rating": "A Road warden increases a warband's rating by 22 points plus 1 point for each Experience point the Road warden has.",
      "profiles": [
        {
          "name": "Road Warden",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 8
          }
        },
        {
          "name": "Horse",
          "stats": {
            "M": 8,
            "WS": 0,
            "BS": 0,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 0,
            "Ld": 5
          }
        }
      ],
      "weaponsArmour": "Crossbow, Horseman’s Hammer, Dagger, Heavy Armour and three Torches. If you are using the optional rules for mounted models then the Road warden also rides a Horse. The Road warden’s save is 4+ whilst mounted and 5+ whilst on foot.",
      "skills": "The Road warden may choose from Combat, Shooting, Strength and Cavalry when he gains a new skill.",
      "specialRules": [
        {
          "name": "Expert Rider",
          "text": "A highly skilled horseman, a Road warden counts as having the Nimble skill whilst on horseback and suffers no modifiers for moving and shooting."
        },
        {
          "name": "Lethal Marksman",
          "text": "A master with the crossbow, a Road warden combines the skills of Trick Shooter and Eagle Eyes."
        },
        {
          "name": "Stern",
          "text": "Working alone and in the dark for the majority of his profession the Road warden is made of strong stuff indeed. He may re-roll any failed Leadership test for fear, and is immune to the rules for being all alone ."
        }
      ],
      "sourceFile": "04-hired-swords.md:640-667"
    },
  },
  {
    id: "tilean_marksman", name: "Tilean Marksman", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1a", source: "Mordheim Annual 2002",
    detail: {
      "sourceLine": "Source: Mordheim Annual 2002 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=14))",
      "hireLine": "30 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "The Empire is not the only place that breeds mercenaries. The constant warring among the city-state sof Tilea provides many opportunities for a man who knows how to use a weapon. Still, sometimes the fighting does down in Tilea and many of these mercenaries are forces to seek employment in other lands. Many of these temporarily unemployed mercenaries have heard of the trouble brewing in Mordheim and have come seeking a new patron.",
      "mayBeHired": "Any warband except Skaven, Orcs or Undead may hire a Tilean Marksman.",
      "rating": "A Tilean Marksman increases a warband's rating by 16 points plus 1 point for each Experience point the Tilean Marksman has.",
      "profiles": [
        {
          "name": "Tilean Marksman",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Light Armour, Sword, Dagger and Crossbow.",
      "skills": "A Tilean Marksman may choose from Shooting skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Steady Hands",
          "text": "The Tilean Marksman's aim never wavers. He ignores 'to hit' modifiers for long range when shooting the crossbow."
        },
        {
          "name": "Dead Eye Shot",
          "text": "The Marksman has the eyes of an eagle and can hit the smallest target. He ignores 'to hit' modifiers for cover when shooting his crossbow."
        }
      ],
      "sourceFile": "04-hired-swords.md:669-693"
    },
  },
  {
    id: "bard", name: "Bard", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1b", source: "Town Cryer 13",
    detail: {
      "sourceLine": "Source: Town Cryer 13 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=9))",
      "hireLine": "20 gold crowns to hire + 10 gold crowns upkeep",
      "flavour": "In the dark and depressing streets of Mordheim a rousing tune foretelling the warbands victory can lift even the lowliest of spirits. A Bard may seem out of place in the City of the Damned but there are those who are willing to sing out their battle chorus for the highest bidder. These men are often warriors too, for only the bravest of songsters would consider looking for an audience in Mordheim.",
      "mayBeHired": "Mercenaries, Sisters of Sigmar and Witch Hunters may hire Bards.",
      "rating": "A Bard increases a warband's rating by 8 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Bard",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Sword, Dagger and Light Armour.",
      "skills": "A Bard may choose from Academic and Speed skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Songster",
          "text": "A Bard's rousing war songs steel the hearts of all those around him. Any friendly model within 6” of a Bard may re-roll any failed Leadership test with a +1 to Leadership. This includes rout tests."
        }
      ],
      "sourceFile": "04-hired-swords.md:728-750"
    },
  },
  {
    id: "big_game_hunter", name: "Big Game Hunter", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":18,"text":"18 gc"}, grade: "1b", source: "Town Cryer 13 (Lustria)",
    detail: {
      "sourceLine": "Source: Town Cryer 13, Lustria ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=22))",
      "hireLine": "40 gold crowns to hire +18 gold crowns upkeep",
      "flavour": "There are many reasons why adventurers risk life and limb exploring the mysterious continent of Lustria. The lure of riches and arcane knowledge brings a steady flow of greedy individuals but some are drawn in search of legendary creatures rumoured to inhabit the lush jungle. Expert game hunters are paid vast sums of money by flamboyant Old World nobles in order to bring back these exotic creatures. These rare beasts are displayed in the private zoos and gardens of nobles or can be found hanging from the walls of their palaces. Game hunters are skilled trackers and hunters having spent most of their lives hunting game in the forests of the Old World. They are well equipped and not inexpensive to hire.",
      "mayBeHired": "The Big Game Hunter can be hired by any human Warband.",
      "rating": "A Big Game Hunter increases the warband’s rating by +16 points plus 1 point per Experience point he has.",
      "profiles": [
        {
          "name": "Big Game Hunter",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Sword, Dagger, Net, Light Armour, Hunting Rifle (same as a Hochland Long Rifle).",
      "skills": "The Big Game Hunter can choose from Shooting or Academic skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Set Traps",
          "text": "The Hunter may place up to six counters to represent these traps on the board immediately after the Hunter model is placed. They must be placed at ground level with at least 6\" between them. Any model (except the Hunter) that moves within 3\" of a trap counter must roll a D6. On a 1-3, nothing happens. On a 4-6, the model takes a single hit automatically at the strength shown on the dice. The trap counter is then removed. A single model can only set off one trap at a time. If an animal of any sort is put Out of Action by a trap, it is automatically captured after the game to be sent to the Old World."
        }
      ],
      "sourceFile": "04-hired-swords.md:752-774"
    },
  },
  {
    id: "black_orc_overseer", name: "Black Orc Overseer", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":40,"text":"40 gc"}, grade: "1b", source: "Nemesis Crown Supplement",
    detail: {
      "sourceLine": "Source: Nemesis Crown Supplement ([PDF](https://broheim.net/downloads/campaigns/nemesiscrown/Hired%20Swords%20&%20Dramatis%20Personae.pdf))",
      "hireLine": "60 gold crowns to hire + 40 gold crowns upkeep",
      "flavour": "Hand-picked from a cadre of his finest guards, these elite Orcs have been ordered by none other than Grimgor Ironhide to infiltrate the Great Forest and so keep an eye on the progress of his roving gangs.",
      "mayBeHired": "Any greenskin warband may hire a Black Orc Bodyguard.",
      "rating": "A Black Orc Bodyguard increases the warband’s rating by +15 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Overseer",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 1,
            "I": 2,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "The Black Orc Bodyguard wears Heavy Armour and a Helmet. He may choose between two Axes or a Double handed Weapon.",
      "skills": "The Black Orc Overseer may choose skills from Combat, Shooting, Strength, and Speed skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "I said 'shut it'",
          "text": "Whilst the Boss has this ferocious warrior in the warband the greenskins are reluctant to make trouble. Any orcs or goblins within 6\" of the Black Orc do not suffer from the effects of Animosity. The rest of the warband tests as normal."
        },
        {
          "name": "Who'se Da Man!",
          "text": "If any Goblin leader is taken Out of Action during the battle, the Black Orc Hired Sword steps up to replace him. For the duration of the battle he gains the \"Leader\" ability. If the Goblin leader gets the \"Killed\" result after the battle, then the Black Orc decides to fill the new vacant position permanently. The Black Orc becomes the new warband leader, but he keeps his upkeep cost (hey, a Black Orc can't live on mushrooms and fungus alone). The Black Orc does not count towards the warband size when selling treasure.\n\nSkills\n\nIn the original publication there was no mention on what skills may be chosen by the Black Orc Overseer. It is recommended to follow the Black Orcs:"
        }
      ],
      "sourceFile": "04-hired-swords.md:776-804"
    },
  },
  {
    id: "bounty_hunter", name: "Bounty Hunter", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 13",
    detail: {
      "sourceLine": "Source: Town Cryer 13 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=0))",
      "hireLine": "40 gold crowns + 15 gold crowns upkeep",
      "flavour": "Villains and outlaws are rife in the Old World. In Mordheim they are as ubiquitous as the ruins that litter the streets. It is the false perception of some outlaws that the depravity and chaos within the city's walls can offer some anonymity from those men who would seek to bring them to justice and claim the price on their heads. Not so, for Bounty Hunters are determined and resourceful men who will often hire themselves out as mercenaries to roaming warbands in the hope of getting closer to their mark. Their mission is to capture at all costs and a little thing like a cursed city isn't even going to slow their stride...",
      "mayBeHired": "Any warband except Possessed, Undead, Skaven and Orcs may hire the Bounty Hunter.",
      "rating": "A Bounty Hunter increases the warband's rating by +20 points, plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Bounty Hunter",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Sword, Dagger, Pistol, Crossbow, Heavy Armour, Helmet, Rope & hook, and Lantern.",
      "skills": "A Bounty Hunter may choose from Combat, Shooting, Strength and Speed skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Capture",
          "text": "The Bounty Hunter will always be on the lookout for the outlaw he is pursuing. Such contracts are numerous, especially in Mordheim so at the start of each battle nominate one of your opponent's heroes as the Bounty Hunter’s mark. The Bounty Hunter gets a +1 to hit this model and must always move towards them (if he can see them), unless he can shoot (in which case choose). If the Bounty Hunter successfully takes the hero out of action' he gains the hero's gold value as payment (of which he gives the warband half) +D3 experience if he survives the game and the Bounty Hunter's side wins. After the battle do not roll on the serious injury table for the hero, he simply counts as captured."
        }
      ],
      "sourceFile": "04-hired-swords.md:806-828"
    },
  },
  {
    id: "chameleon_skink", name: "Chameleon Skink", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":12,"text":"12 gc"}, grade: "1b", source: "Town Cryer 12 (Lustria)",
    detail: {
      "sourceLine": "Source: Town Cryer 12, Lustria ([PDF](https://broheim.net/downloads/towncryer/TownCryer12.pdf#page=18))",
      "hireLine": "70 gcs to hire 12 gcs upkeep",
      "flavour": "Chameleon Skinks are an incredibly rare breed of Skink that can change the colour of their skins at will to blend in with their environment. Needless to say Chameleon Skinks are very stealthy and difficult to detect indeed.\n\n_Equipment:_ The Chameleon Skink comes equipped with a Dagger, Blowpipe with poison darts and a Buckler.",
      "mayBeHired": "Lizardmen warbands only.",
      "rating": "The Chameleon Skink raises the rating of the warband by 16 points, plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Chameleon Skink",
          "stats": {
            "M": 6,
            "WS": 4,
            "BS": 4,
            "S": 4,
            "T": 2,
            "W": 1,
            "I": 5,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "",
      "skills": "The Chameleon Skink may choose from Shooting, Speed and [Lizardmen special](/docs/warbands/grade-1b-warbands/lizardmen#skinks-only) skills.",
      "specialRules": [
        {
          "name": "SPECIAL RULES",
          "text": "All of the Lizardmen [Special](/docs/warbands/grade-1b-warbands/lizardmen#special-rules) skills for Skinks: Scaly Skin, Cold Blooded, Aquatic and jungle born."
        },
        {
          "name": "Chameleon Skin",
          "text": "Because of the Chameleon Skink's unique camouflage he is very difficult to detect, therefore foes halve their Initiative when trying to detect him when Hidden. In addition Chameleon Skinks are at -2 to hit with missile fire."
        },
        {
          "name": "Infiltrator",
          "text": "The Chameleon Skink is a master of disguise and deployment. You may place him anywhere on the board out of line of sight and at least 12\" from any enemy model."
        }
      ],
      "sourceFile": "04-hired-swords.md:830-856"
    },
  },
  {
    id: "clan_skryre_rat_ogre", name: "Clan Skryre Rat Ogre", hireCost: {"base":100,"text":"100 gc"}, upkeep: {"base":null,"text":"1 wyrdstone"}, grade: "1b", source: "Town Cryer 25",
    detail: {
      "sourceLine": "Source: Town Cryer 25 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=45))",
      "hireLine": "100 gold crowns, 1 piece of Wyrdstone upkeep.",
      "flavour": "The warlock engineers of Clan Skryre are renowned for their fiendish inventions which utilise a blend of foul magic and arcane machinery. The Clan Skryre Rat Ogre is the pinnacle of their devilish engineering, utilising the corpse of a Rat Ogre combined with a mechanical exoskeleton and powered by refined wyrdstone. The Clan hires out the handful that it has made to further test them in combat. In battle it is a terrifying if somewhat unreliable beast.",
      "mayBeHired": "Only Skaven warbands may hire the Clan Skryre Rat Ogre.",
      "rating": "The Clan Skryre Rat Ogre increases the warband’s rating by +25 points.",
      "profiles": [
        {
          "name": "Rat Ogre",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 5,
            "T": 5,
            "W": 3,
            "I": 1,
            "A": 3,
            "Ld": 10
          }
        }
      ],
      "weaponsArmour": "Jaws and claws! In addition the Rat Ogre is armed with a small Warpfire Thrower on its mechanical left arm. The part-mechanical body of the Rat Ogre is very hardy and confers a 4+ armour save.",
      "skills": "The Clan Skryre Rat Ogre is a nightmarish bio-mechanoid creation that is solely driven by the dark sorcery of the Clan Skryre Warlocks and so gains no experience.",
      "specialRules": [
        {
          "name": "Large",
          "text": "The Clan Skryre Rat Ogre is a huge creature that towers above the heads of its fellow Skaven and men alike. Any warrior may shoot at a Rat Ogre, even if it is not the closet target."
        },
        {
          "name": "Fear",
          "text": "The Clan Skryre Rat Ogre is a fearsome, monstrous beast that causes Fear."
        },
        {
          "name": "Bio Machinery",
          "text": "The Clan Skryre Rat Ogre is not alive as such, being a monstrous combination of dead flesh, arcane Skaven technology and dark sorcery. The Clan Skryre Rat Ogre is immune to psychology and never leaves combat."
        },
        {
          "name": "Wyrdstone Powered",
          "text": "The Clan Skryre Rat Ogre is a mindless automaton and does not require any pay - it does - however, require Wyrdstone shards to power it. It requires a single piece of Wyrdstone before each game to be ‘powered-up’."
        },
        {
          "name": "May not run",
          "text": "The Clan Skryre Rat Ogre is a huge lumbering monster-machine that lacks the sheer animal speed of a living Rat Ogre. It may not run."
        },
        {
          "name": "Immune to Poison",
          "text": "The Clan Skryre Rat Ogre is not affected by any poisons."
        }
      ],
      "otherSections": [
        {
          "name": "Warpfire Thrower",
          "text": "The Clan Skryre Rat Ogre has a smaller version of the dreaded warpfire thrower built into one of its arms.\n\n**Range:** 6\"  \n**Strength:** 4 **Save Modifier:** -1"
        },
        {
          "name": "Special Rules (Warpfire Thrower)",
          "text": "**Jet of Flame:** Draw a line 6” long and 2\" wide. All models in its path are hit on a 4 + with no modifiers. In addition, the warpfire thrower causes fire damage (see the rules for the Brazier Iron).\n\n**Unreliable:** The technology of biomechanics is still pretty much in its infancy and as with most Clan Skryre experiments is neither safe nor entirely reliable! At the beginning of each turn, the Skaven player should roll a D6 to activate and work the Rat Ogre. On a roll of 2-6 everything is fine and the Rat Ogre may be moved normally. On the roll of a 1, something has gone drastically wrong - roll again on the Malfunction table below:\n\n| D6 | Result |\n| --- | --- |\n| 1 | **Explodes:** Something has gone horribly wrong with the Rat Ogre's warpstone generator and it has overloaded, exploding in a bright green flash! All models within 6\" of the Rat Ogre receive a single Strength 5 hit. The Rat Ogre is completely destroyed. Do not roll for injuries after the game. |\n| 2 | **Goes berserk!** From now until the end of the game, the Rat Ogre is out of control. At the start of each of the Skaven player's turns, the Rat Ogre will move randomly (use the Artillery Scatter dice from Warhammer to determine the distance and direction moved) - if there are any warriors within charge range (of either side) it will charge them, otherwise it will move at full pace towards the nearest warrior. |\n| 3 | **Shuts Down:** The warpstone generator tizzies out and the Rat Ogre comes to a halt for the rest of the battle. It is hit automatically if engaged in close combat. |\n| 4 | **Temporary Loss of Control:** The Rat Ogre moves in a random direction and if it comes into contact with any warriors (of either side) it attacks and counts as charging. If it does not move into contact with any warriors but there are warriors within range of its warpfire thrower, it will fire this at them instead. |\n| 5-6 | **Freezes:** The Rat Ogre just freezes on the spot for this turn, it is hit automatically if engaged in close combat. |"
        }
      ],
      "sourceFile": "04-hired-swords.md:858-911"
    },
  },
  {
    id: "dark_elf_assassin", name: "Dark Elf Assassin", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1b", source: "Town Cryer 12 (Lustria)",
    detail: {
      "sourceLine": "Source: Town Cryer 12, Lustria ([PDF](https://broheim.net/downloads/towncryer/TownCryer12.pdf#page=18))",
      "hireLine": "70 gs to hire + 25 gs upkeep",
      "flavour": "Few are better than the silent, black garbed killers of the Dark Elves, even the Skaven Clan Eshin quail at their expertise. It is not unusual for young apprentice assassins, when learning their dark trade, to be sent off to far away places to further hone their skills by selling their unique abilities.",
      "mayBeHired": "Any evil warband may hire a Dark Elf Assassin.",
      "rating": "A Dark Elf Assassin increases the warband's rating by +25 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Dark Elf Assassin",
          "stats": {
            "M": 5,
            "WS": 5,
            "BS": 5,
            "S": 4,
            "T": 4,
            "W": 1,
            "I": 7,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Dark Elf Blade, Dagger, Repeating Crossbow, Dark Venom, Light Armour and Dark Cloak (counts as Elven Cloak).",
      "skills": "An Assassin may choose from Combat, Shooting, and Speed skills when he gains a new skill. In addition, the Assassin may use any unique [Dark Elf](/docs/warbands/grade-1b-warbands/dark-elves#dark-elf-special-skills) skills.",
      "specialRules": [
        {
          "name": "Perfect Killer",
          "text": "All attacks made by the Assassin, whether in shooting or close combat, have an extra -1 save modifier to represent his skill in striking at unarmoured spots."
        },
        {
          "name": "Kindred Hatred",
          "text": "All Dark Elves suffer hatred towards their High Elven kin."
        }
      ],
      "sourceFile": "04-hired-swords.md:913-937"
    },
  },
  {
    id: "duellist", name: "Duellist", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 13",
    detail: {
      "sourceLine": "Source: Town Cryer 13 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=15))",
      "hireLine": "35 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Duelists are men of the shadows, their reputations dark and bloodthirsty. They> are men of iron nerve who stare unflinchingly into the face of death every time they draw their pistols. As well as expert pisto/iers, duelists are master swordsmen, their close quarter fighting deadly and brief for their opponents. Those who seek the services of a duelist must frequent dark avenues and taverns to locate them, for they are enigmatic and elusive figures. However any warband who secures their skills will reap great benefit.",
      "mayBeHired": "Any warband except Skaven and Undead may hire a Duelist.",
      "rating": "A Duelist increases the warband’s rating by +18 points, plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Duellist",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 2,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Duelling Pistol, Sword, Dagger and cloak. The cloak counts as a Buckler.",
      "skills": "A Duelist may choose from Combat and Shooting skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Darting Steel",
          "text": "A Duelist is like a blur in hand-to-hand combat, turning blades aside with seemingly little effort or concern. The Duelist may parry using his sword and buckler if he can roll under his weapon skill and not more than his opponent's highest hit roll as per the normal rules."
        }
      ],
      "sourceFile": "04-hired-swords.md:939-961"
    },
  },
  {
    id: "dwarf_pathfinder", name: "Dwarf Pathfinder", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Nemesis Crown Supplement",
    detail: {
      "sourceLine": "Source: Nemesis Crown Supplement ([PDF](https://broheim.net/downloads/campaigns/nemesiscrown/Hired%20Swords%20&%20Dramatis%20Personae.pdf))",
      "hireLine": "35 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Not all Dwarfs enjoy being shut up beneath the ground all of their lives; some enjoy an occasional trip into the open air. Usually these Dwarfs are younger, and not quite as set in their ways. After a few trips aboveground, many Dwarfs learn something of the surrounding terrain and the skills required to survive in the open air. Such Dwarfs are called Dwarf Pathfinders, and they fulfill a special role in Dwarf society, as representatives to (and the first line of defense against) the outside world.",
      "mayBeHired": "Any Dwarf or Human warband (excluding followers of chaos) may hire the Dwarf Pathfinder.",
      "rating": "A Dwarf Pathfinder increases the warband’s rating by +12 points, plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Pathfinder",
          "stats": {
            "M": 3,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 4,
            "W": 1,
            "I": 2,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "The Dwarf Pathfinder carries an Axe, Dagger, and Crossbow. He wears Light Armour.",
      "skills": "A Dwarf Pathfinder may choose from Combat, Shooting, or [Dwarf](/docs/warbands/grade-1b-warbands/dwarf-rangers#dwarf-special-skills) (see ‘Dwarf Special Skills’ in the rules for the Dwarf Runic Ranger Warband) skill lists when he gains a new skill. Alternatively, he may choose the new Dwarf Pathfinder skill, below.",
      "specialRules": [
        {
          "name": "Explorer",
          "text": "Dwarf Pathfinders are experts at foraging and living off whatever they can find in the wild. A warband with a Dwarf Pathfinder may roll one more dice than normal in the Exploration Phase, and discard one die of the player’s choice."
        },
        {
          "name": "Hard to Kill",
          "text": "Dwarfs are tough, resilient individuals who can only be taken out of action on a D6 roll of 6 instead of 5-6 when rolling on the Injury Chart. Treat a roll of 5 as stunned."
        },
        {
          "name": "Hard Head",
          "text": "Dwarfs ignore the concussion special rule. They are not easy to knock out! Hate Orcs and Goblins: All Dwarfs hate Orcs and Goblins. See the psychology section of the Mordheim rules for details on the effects of hatred."
        },
        {
          "name": "Elf Grudge",
          "text": "Any warband wishing to hire a Dwarf that also contains an Elf must pay an additional 5 gold crowns upkeep. Dwarfs won’t put up with weak pointy-eared folk unless they have to, or are adequately compensated for their sufferance."
        },
        {
          "name": "Magic",
          "text": "Note that Dwarfs may never take the Arcane Lore skill. It is not possible for a dwarf to learn how to cast spells."
        }
      ],
      "uniqueSkills": {
        "tableName": "Dwarf Pathfinder Skills",
        "skills": [
          {
            "name": "Pathfinder",
            "text": "Dwarf Pathfinders also learn how to find hidden paths in the forest. A Dwarf Pathfinder is able to Infiltrate (as the Skaven skill of the same name —see the Skaven warband rules in the Mordheim rulebook)."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:963-997"
    },
  },
  {
    id: "dwarf_treasure_hunter", name: "Dwarf Treasure Hunter", hireCost: {"base":55,"text":"55 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Fanatic Magazine 8",
    detail: {
      "sourceLine": "Source: Fanatic Magazine 8 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=26))",
      "hireLine": "55 gold crowns to hire +30 gold crowns upkeep",
      "flavour": "Dwarfs are famed for their love of gold, ale, and adventure, not necessarily in that order. Since the disaster at Mordheim they have come to the ruins in ever-increasing numbers, some seeking riches, but many just after a good fight. They’re well known as tough warriors and are very much sought after as hired muscle by other warbands, but the Treasure Hunters have other benefits too. Dwarf Treasure Hunters are specialists in finding riches that other people have tried to hide and, as such, can add considerably to a warband’s purse.",
      "mayBeHired": "Mercenaries and Witch Hunters may hire a Dwarf Treasure Hunter. Warbands of Dwarf Treasure Hunters are considered rivals to these individual prospectors and so may not hire them. Warbands that include Elves may hire Dwarf Treasure Hunters, but must pay double the normal upkeep after each battle. Dwarfs won’t put up with pointy-eared folk unless they have to, or are adequately compensated for their sufferance.",
      "rating": "A Dwarf Treasure Hunter increases the warband’s rating by +24 points plus one point for each Experience Point he has.",
      "profiles": [
        {
          "name": "Dwarf Treasure Hunter",
          "stats": {
            "M": 3,
            "WS": 5,
            "BS": 4,
            "S": 3,
            "T": 4,
            "W": 1,
            "I": 2,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "Gromril Armour, Helmet, Mining Pick, Dagger, Hammer, treasure maps and lantern rig (see below).",
      "skills": "A Dwarf Treasure Hunter may choose from Combat or Strength skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Hard to Kill",
          "text": "Dwarfs are tough, resilient individuals who are only taken out of action on a roll of 6 instead of 5-6 when rolling on the Injury chart. Treat a roll of 1-2 as knocked down, 3-5 as stunned, and 6 as Out Of Action."
        },
        {
          "name": "Hard Head",
          "text": "Dwarfs ignore the special rules for maces, clubs, etc. They are not easy to knock out."
        },
        {
          "name": "Hates Orcs & Goblins",
          "text": "See the Psychology section of the rules for details on the effects of hatred."
        },
        {
          "name": "Mining Pick",
          "text": "This is a two-handed weapon and uses the same rules as a double-handed axe, hammer, etc."
        },
        {
          "name": "Lantern Rig",
          "text": "The lantern rig allows the Treasure Hunter to use the lantern and still keep both hands free for weapons. Otherwise it follows the normal rules for lanterns."
        },
        {
          "name": "Treasure Maps",
          "text": "Over his time in the ruins, the Treasure Hunter has acquired a number of treasure maps. Call it greed if you must, professional interest if you're more polite. Some of these are obvious fakes, but there are many that seem promising. At least, on first glance. Each battle the Dwarf Treasure Hunter will choose one map and see where it leads.\n\nRoll a D6 at the end of each battle which the Dwarf Treasure Hunter survives without going out of action.\n\n| D6 | Result |\n| --- | --- |\n| 1 | **Ambush!:** The Dwarf Treasure Hunter is ambushed by D3 brigands who planted the fake map to lure the unwary to their doom. Immediately fight a close combat between the brigands and the Treasure Hunter with the brigands going first and counting as charging. The Brigands have the stats of a Human Mercenary Warrior and are armed with a club and dagger. |\n| 2 | **Poor Fake:** It quickly becomes obvious that this is a feeble forgery and is utterly worthless. The Treasure Hunter uses it to light his pipe. |\n| 3 | **Looted Hoard:** It was a good map, but someone beat you to it! Mind you, there's enough left to add +1 to the number of shards collected by your warband this game. |\n| 4 | **Cellar:** When Dwarfs say “treasure”, they don't always mean gold. This map leads to a forgotten cellar of a ruined pub and contains a small barrel of Bugman's finest ale – treasure indeed! This works like the one in the rules, but there's only enough to give to D6 warriors. Decide when you want them to drink it and roll to see how many it'll go round. The first warrior to drink from the barrel must be the Dwarf Treasure Hunter himself. The barrel cannot be sold, and if the Treasure Hunter is not retained he'll manage to take this with him when he goes. |\n| 5 | **Real Treasure Map:** Roll one extra Exploration dice. |\n| 6 | **Jackpot!:** You get one extra Exploration dice. However, do not roll this along with the rest of them. Instead, roll the Exploration dice you'd normally be entitled to first. Then choose the result of the extra dice instead of rolling it (potentially making doubles into triples, etc). Once you've done this, resolve the results of the exploration as normal. Note that these results are not cumulative. The Treasure Hunter consults a different map each battle, and so the results only apply to that battle (or, more accurately, to the actions between that battle and the next). |\n\nNote that none of these are cumulative. The Treasure Hunter consults a different map each battle, and so the results only apply to that battle (or, more accurately, to the actions between that battle and the next)."
        }
      ],
      "sourceFile": "04-hired-swords.md:999-1044"
    },
  },
  {
    id: "elf_mage", name: "Elf Mage", hireCost: {"base":45,"text":"45 gc"}, upkeep: null, grade: "1b", source: "Fanatic Magazine 5",
    detail: {
      "sourceLine": "Source: Fanatic Magazine 5 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=43))",
      "hireLine": "45 gold crowns to hire",
      "flavour": "Unlike the staid and traditionally insular archmages of the Tower of Saphery, devotees of the smaller Djed’hi temple are wanderers. After a brief few decades study at the temple on Ulthuan, they leave to seek enlightenment in the true ways of magic by studying the ways of the world. There is no single path to this enlightenment, indeed there are said to be more paths than there are those that tread them.\n\nThe Djed’hi are not merely students of the academic arts. Their wanderings are perilous and inevitably lead them into dangerous lands where they must defend themselves. Thus, most of their magics are means to enable them to survive to explore the world another day.\n\nFew of the Djed’hi own much in the way of possessions, and this saves them from some of the less savoury folk they encounter. However, although robbing them is generally not worth the effort, the mere fact that they are Elves is enough to attract bigots and small-minded fools to attack them. All this just underlines the natural feelings of superiority of the wanderers, which in turn makes their enlightenment all the more distant.",
      "mayBeHired": "Human Mercenaries may hire Elf Mages.",
      "rating": "An Elf Mage increases a warband's rating by 23 points.",
      "profiles": [
        {
          "name": "Elf Mage",
          "stats": {
            "M": 5,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 2,
            "I": 6,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Staff, Elven Cloak.",
      "skills": "An Elf Mage is a wanderer and will not stay long enough with a warband to learn new skills.",
      "specialRules": [
        {
          "name": "Fey",
          "text": "Hostile magic spells will not affect the Elf on a D6 roll of a 4+."
        },
        {
          "name": "Sorcery",
          "text": "The Elf Mage Counts as having the skill Sorcery."
        },
        {
          "name": "Wanderer",
          "text": "An Elf Mage is a wanderer, and will only stay with a warband for the duration of a single battle. A warband who used an Elf Mage in their last battle may not seek out another until they have fought at least one battle without one."
        },
        {
          "name": "Wizard",
          "text": "Elf Mages are magicians and have three spells generated at random from the [Spells of the Djed’hi](/docs/magic/spells-of-the-djedhi) list."
        }
      ],
      "sourceFile": "04-hired-swords.md:1046-1078"
    },
  },
  {
    id: "gaoler", name: "Gaoler", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Mordheim Facebook Group",
    detail: {
      "sourceLine": "Source: Mordheim Facebook Group, by Tuomas Pirinen ([PDF](https://broheim.net/downloads/hiredswords/facebook/Gaoler.pdf))",
      "hireLine": "30 Gold Crowns to Hire +15 Gold Crowns upkeep",
      "flavour": "Servants of the Church, the Gaolers have the duty of extracting confessions from witches, heretics, soothsayers, Chaos worshippers, idolators, fornicators and blasphemous poets in the cells under the great temples of Sigmar. Forbidden by the scriptures to spill blood, the gaoler instead is a master of inflicting terrible pain with fire, iron rods, and ingenious devices of persuasion that break bones and internal organs of those put to question. They are taught how to inflict excruciating pain with just their own massive bodies. Gaolers are recruited as children and brought up with absolute loyalty to the Church and firm faith that their terrible methods of interrogation are for the greater good. Massive men (and it is rumoured, even a few women) are selected for their size and strength in youth, and they are an imposing, forbidding sight. By decree of the Grand Theogonist, they are fed from the kitchens of the church and encouraged to gain massive bulk and strength, which is useful for their grim work. Gaolers’ faces are hidden by hoods or bay forbidding masks, as the Holy Law decrees that the justice facing the heretics must be faceless and impartial.\n\nIn Mordheim, the services of Gaolers are much in demand by the grim order of the Witch Hunters, who have many heretics to try and interrogate. Few have survived the terrible embrace of the Gaoler and lived to tell the tale.",
      "mayBeHired": "The Witch Hunters can hire a Gaoler.",
      "rating": "Gaoler increases the warband’s rating by 18 points, plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Gaoler",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 2,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 3,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Gaoler can be armed with a heavy chain of keys and locks (counts as a flail) or with two Hammers/Clubs. Gaoler wears no armour.",
      "skills": "A Gaoler may choose from the Combat and Strength skills when he gains an advancement.",
      "specialRules": [
        {
          "name": "Torturer’s grapple",
          "text": "Gaolers are experts at inflicting pain and restraining heretics. Instead of using his normal attacks the Gaoler can make one grapple attack that deals no direct damage in melee. Instead, if the attack hits, the target must roll under his or her strength (with -1 penalty) or become immobile and writhing in indescribable agony, unable to do anything at all (fight in melee, use items, cast spells or shoot) until in the beginning of the next melee phase provided he rolls under his strength with -1 penalty again to see if escape is possible. If successful, the model can act as normal (though it still counts as being in melee with the Gaoler).\n\nOther models in Gaoler’s warband can attack the grappled enemy as normal, but the Gaoler cannot do anything else except hold the target. Enemies not alive and/or immune to pain (such as Undead or Daemons) are not affected by this attack, and neither are any Large models who are too big to grapple."
        },
        {
          "name": "Devout",
          "text": "As long as there is a Sigmarite Priest in a warband, the Gaoler will not leave it even if he is not paid his upkeep cost, though he will not fight in the next battle until he is paid, as he has to pass on a tithe to the Church of Sigmar."
        },
        {
          "name": "Inured to pain",
          "text": "The infernal heat of the torture chamber, devout self-mutilation and the massive bulk of the Gaolers give them a degree of resistance to pain. All Injury rolls against the Gaoler suffer -1 penalty. Ignore Injury results of 0 as if no damage was done at all."
        },
        {
          "name": "Hatred",
          "text": "fired by the sermons of the senior priests of the Cult of Sigmar, the Gaolers hate all the members of Skaven, Possessed, Beastsman, Carnival of Chaos and Undead war bands."
        }
      ],
      "sourceFile": "04-hired-swords.md:1080-1112"
    },
  },
  {
    id: "halfling_thief", name: "Halfling Thief", hireCost: {"base":25,"text":"25 gc"}, upkeep: {"base":15,"text":"15 gc*"}, grade: "1b", source: "Fanatic Magazine 7", notes: "Upkeep is marked with an asterisk in the source index table; the footnote it points to was not captured in the scrape.",
    detail: {
      "sourceLine": "Source: Fanatic Magazine 7 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=23))",
      "hireLine": "25gc to hire/Special Upkeep (see below)",
      "flavour": "Halflings are well known for their nimble feet and even nimbler fingers. While many follow their fathers and turn their dextrous skills to works of craft such as basket making, cobbling and cookery (in fact a lot of cookery) many also find themselves drawn towards the danger and excitement of stealing. Of course, Halflings never take anything too valuable (except by accident) as that would not be nice to the person who previously owned the item. Nonetheless, it is surprising the number of things that go ‘missing’ when a Halfling is about. The poor little chaps don’t know the re doing it half the time, they just seem to acquire rings, boxes of matches and small pets as they go about their normal business.\n\nIn fact, Halflings have a very relaxed attitude towards property in general, and casually swap items with one another all of the time (mostly without realising they’re actually swapping). Halfling birthdays are a celebration of this attitude and many gifts are freely given away by the Halfling whose birthday it is (usually, as a consequence of inviting another twelve Halflings to your house and then falling asleep after dinner).\n\nMany Halflings find that the skills which were taught to them as part of their natural childhood and adolescence are frowned upon by people outside of the Moot. They also find themselves very popular with certain organisations,such as the Thieves Guild and the local watch patrol.\n\nAs can be expected, the speed and agility of Halfling Thieves has been noted by many of those who seek their fortune delving into the ruins of Mordheim, Halflings make excellent bait for monster traps and are usually quick and lucky enough to escape once the monster has fallen for the trap. Their diminutive size allows them to be pushed through sewers, under badly fitting gates and into rat-infested nooks and crannies. As you might tell, a Halfling is considered by some to be the most essential piece of adventuring equipment you could get.\n\nDespite this rough treatment, most Halfling “Treasure and Property Removal Experts\" don’t mind the odd trek into the ruins. With a few of big, burly trained bullies and perhaps a sneaky looking wizard to back you up, your enemies don't come calling at your doorso often! Besides, where else can you find so many gifts, pretty gems, silver plates, swords of Mystical and Magical Significance. Not only all that, someone actually listens to what you’re saying, even if they do decide to ignore you completely when you finished giving your advice.\n\nFamous Halfling Thieves from the history books include: Nikkit Kwik (also known as the Burglar of Brionne), Bumblebean Lightfoot, Niftlet ‘Statue Stealer’ Stumbly, and the Halfling who once managed to steal the Great bell out of the Temple of Sigmar in Nuln, ‘Two-feet-tall’ Telworth Buttercup. The ‘King of Thieves’ the renowned Ned Neddley, responsible for stealing almost anything that wasn’t nailed down (and if he had a claw hammer with him, he'd steal the nails too).\n\nHalflings excel at making themselves inconspicuous. This probably has something to do with their small stature, unassuming manner and predilection for walking around barefooted. Whatever the reason, there are still differences in individual Halfling abilities in this area. The Halfling Thief is a master at sneakiness, sticky-fingers, and feigned innocence. Adding one to your warband is always a dicey situation at best, as you’re always certain that the other warriors are going to come up a few crowns light by the end of the adventure.",
      "mayBeHired": "The Halfling Thief may be hired by the following warbands: Human Mercenaries, Kislevites, and any Wood Elf, or Dwarf warband.",
      "rating": "A Halfling Thief increases the warband s rating by +14 points, plus 1 point for each Experience Point he has.",
      "profiles": [
        {
          "name": "Halfling",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 4,
            "S": 2,
            "T": 2,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "A Halfling Thief is equipped with a Sword, Dagger, and Throwing Daggers. He carries a Rope and Grapple as well.",
      "skills": "A Halfling Thief may choose from Speed and Shooting skills. He may also choose from the special Halfling Thief skills below.",
      "specialRules": [
        {
          "name": "Infiltrator",
          "text": "The Thief is an expert at sneaking close to the enemy without being detected. He may always be placed on the battlefield after the opposing warband(s), and can be placed anywhere on the table as long as it is out of sight of the opposing warband and more than 12\" away from any enemy model. If both players have models which infiltrate in this way, roll off to see which player places his infiltrators first."
        },
        {
          "name": "Pick Locks",
          "text": "A Thief knows how to open doors that others find impossible, using special tools of the trade and heavily guarded techniques, a good Thief can pretty much go anywhere he pleases. When testing to open a locked door, the Thief just needs to make an Initiative test in order to be successful."
        },
        {
          "name": "Cutpurse",
          "text": "A Thief makes his profession by finding’ things others have ‘lost’. To represent this, at the end of the game when the warband rolls to find Treasures, they receive one additional Treasure as long as the Thief took part in the game (ie, he was actually in the battle), and wasn’t taken Out of Action."
        },
        {
          "name": "Uneasy Ally",
          "text": "At the end of each game (whether or not the Halfling Thief actually took part), roll a D6 and consult the chart following:\n\n|  D6  | Result |\n| --- | --- |\n| 1 | **Stop Thief!:** Obviously unimpressed with his employment, the Halfling Thief has absconded with all the warband’s valuables! Remove the Halfling Thief from your roster, along with all Treasures and valuables remaining in your stash from previous games. Do not add any additional Treasures for having the Thief in your warband this game. |\n| 2-5 | **Tax Time:** The Halfling Thief seems satisfied with his time with the warband thus far, and just charges “his normal fee” of a 15gc upkeep. |\n| 6 | **Ignorance is Bliss:** The Halfling Thief seems very satisfied with the take so far (in fact maybe TOO satisfied, as he keeps rubbing his hands together and muttering to himself... ), and forgoes any upkeep charges on your warband this time. On the bright side, whatever it is he's filched you never knew you had... |"
        }
      ],
      "uniqueSkills": {
        "tableName": "Halfling Thief Skills",
        "skills": [
          {
            "name": "wily thief",
            "text": "The Thief is an expert at quickly finding the valuables on a victim before moving on. To reflect this, if the Thief takes out any members of the enemy warband during a game (and he was not taken Out of Action himself), the Halfling Thief’s warband receives one additional Treasure (this does not affect the opposing warband’s number of Treasures... just assume this is one they WOULD have found and leave it at that). This is, of course, in addition to the normal +1 Treasure he already adds through his ‘Cutpurse’ special rule."
          },
          {
            "name": "stealthy",
            "text": "The Halfling Thief can hide even after running, and can run while within 8\" of enemy models if he starts and ends his move hidden."
          }
        ],
        "intro": "If the Halfling Thief rolls a skill as an advance, he may choose to take one of the following skills instead of his normal skill selections:"
      },
      "sourceFile": "04-hired-swords.md:1114-1172"
    },
  },
  {
    id: "human_scout", name: "Human Scout", hireCost: {"base":10,"text":"10 gc"}, upkeep: {"base":5,"text":"5 gc"}, grade: "1b", source: "Nemesis Crown Supplement",
    detail: {
      "sourceLine": "Source: Nemesis Crown Supplement ([PDF](https://broheim.net/downloads/campaigns/nemesiscrown/Hired%20Swords%20&%20Dramatis%20Personae.pdf))",
      "hireLine": "10 gold crowns to hire + 5 gold crowns upkeep",
      "flavour": "Not all men are comfortable living in cities among their peers. Some prefer a solitary life in the wilderness, only returning to civilization to trade for things they cannot make themselves. Such men are naturally hard for most others to understand and get along with, but their skills in the wild can prove invaluable to a band of warriors seeking adventure in unfamiliar territory. A warband traveling through the Great Forest will often hire such an individual to guide them to the remote parts of the forest and back.",
      "mayBeHired": "Any warband except Orcs, Goblins, Beastmen or Possessed may hire the Human Scout.",
      "rating": "A Human Scout increases the warband’s rating by +9 points, plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Human Scout",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 6
          }
        }
      ],
      "weaponsArmour": "The Human Scout carries a Bow, Sword and Dagger.",
      "skills": "A Human Scout may choose from Combat Skills, Speed skills or Quick Shot, Eagle Eyes, or Trick Shooter from the Shooting skills list when he gains a new skill. Alternatively, he may choose one of the new Human Scout skills, below.",
      "specialRules": [
        {
          "name": "Not a Fighter",
          "text": "If a Human Scout is taken Out of Action during a game, he decides to leave on a 1-3, instead of the normal 1-2 when rolling for injury at the end of the game."
        }
      ],
      "uniqueSkills": {
        "tableName": "HUMAN SCOUT SKILLS",
        "skills": [
          {
            "name": "Expert Hunter",
            "text": "A Human Scout that has been declared as Hidden may only be detected by models within half their Initiative value in inches, not their Initiative value as normal. In addition, a Human Scout may fire his Bow without giving away his position (he may fire and remain Hidden)."
          },
          {
            "name": "Sit in Wait",
            "text": "A Human Scout is able to Infiltrate."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:1174-1202"
    },
  },
  {
    id: "kislev_ranger", name: "Kislev Ranger", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Fanatic Magazine 6",
    detail: {
      "sourceLine": "Source: Fanatic Magazine 6 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=27))",
      "hireLine": "30 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "Kislev is a wild and untamed land; a place of endless horizons, rocky steppes, and icy tundra, its plains stretch as far as the eye can see. It is here that the rangers are in their element. Capable of great endurance, traveling on foot for days at a time, they negotiate this hostile land, patrolling its borders, ever watchful for dark forces.\n\nAs Mordheim, the City of the Damned, draws sell-swords and fortune-hunters from across the Old World it is no surprise to find Kislevite Rangers there too. Adept at exploring through the ruins, finding forgotten loot or lending their deadly aim to a captain’s ambition, warbands frequently hire these wild warriors.\n\nPerhaps most peculiar of all is that most of the rangers are women. The men folk of the northern lands are committed to its protection from the ravaging armies of the Kurgan marauder hordes and the other servants of Chaos. It is the women then, often those shunned by their families or banished for some misdeed, that range out from their homes, perhaps hoping to redeem themselves or even make their own fortunes in the perilous lands beyond.",
      "mayBeHired": "Mercenaries, Witch Hunters and Dwarfs may hire Kislev Rangers.",
      "rating": "The Kislev Ranger increases a warband's rating by 15 points plus 1 point for each Experience point the Kislev Ranger has.",
      "profiles": [
        {
          "name": "Kislev Ranger",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "The Kislev Ranger is armed with a Bow, a Sword, and a Hunter’s cloak.",
      "skills": "The Kislev Ranger may choose from Combat, Shooting, Academic, Strength, and Speed when she gains a new skill. In addition, the Kislev Ranger may choose from the Kislev Ranger Special Skill list.",
      "specialRules": [
        {
          "name": "Heart Strike",
          "text": "Kislev Rangers often battle against large monsters that roam their native borders. They have grown particularly adept at felling such beasts with a single, deadly arrow strike. When shooting at a large monster (this includes large animals such as bears too), if the Kislev Ranger rolls a 6 to hit, followed by a wound roll of 5+, the beast is shot in some vital spot and is killed instantly, regardless of wounds, with no save whatsoever."
        },
        {
          "name": "Hunter’s Cloak",
          "text": "This cloak is fashioned by Kislevites and is only worn by their rangers. A hidden ranger will not reveal her position by shooting. The target model can take an initiative test in order to try and spot the firing ranger. If the test is successful, the ranger is no longer hidden."
        },
        {
          "name": "Loner",
          "text": "Ranger’s are immune to all alone tests."
        },
        {
          "name": "Seeker",
          "text": "If the Ranger did not go out of action, she may modify one Exploration die by +/-1."
        }
      ],
      "uniqueSkills": {
        "tableName": "Kislev Ranger Skills",
        "skills": [
          {
            "name": "Animal Call",
            "text": "If hidden, the Ranger may use animal calls to confound the enemies. Any enemy model that is within 18” of the Ranger and does not declare a charge in its movement phase must take a Leadership test (determine which models these are after charges are declared but before they are moved). Those that fail the Ranger may move in any direction she wishes instead of their normal move."
          },
          {
            "name": "Herb Lore",
            "text": "The Ranger has learned basic herb lore to cure injuries. Any friendly model in base-to-base contact with her may have 1 wound restored on a roll of 4+ in the recovery phase. The ranger may also heal herself. If any healing is successful, the ranger may not move this turn, but may shoot as normal. The ranger may not heal if she is in close combat."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:1204-1242"
    },
  },
  {
    id: "mule_skinner", name: "Mule Skinner", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 14",
    detail: {
      "sourceLine": "Source: Town Cryer 14 ([PDF](https://broheim.net/downloads/towncryer/TownCryer14.pdf#page=11))",
      "hireLine": "35 gold crowns to hire + 15 gc upkeep",
      "flavour": "Mule Skinners are quite common wherever teams of animal are used. They are experienced warriors, accustomed to handling teams of draft and pack animals such as horses and (strangely enough) mules as well as more exotic animals such as Cold Ones. Most are freelance, offering their services in the marketplace alongside traditional traders. They are widely travelled and have contacts in most major cities, especially among the animal merchants.",
      "mayBeHired": "Any warband, except Possessed Skaven, or any Undead warband, may hire a mule skinner.",
      "rating": "A Mule Skinner increases the warband's rating by 20 points, plus 1 point foe each Experience point he has.",
      "profiles": [
        {
          "name": "Mule Skinner",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "The Mule Skinner starts with a whip and a Dagger.",
      "skills": "A Mule Skinner may choose from Combat and Strength skills. In addition he may learn Streetwise and Haggle (both academic skills).",
      "specialRules": [
        {
          "name": "Animal Handler",
          "text": "A Mule Skinner starts with one Animal Handling skill (player's choice of which animal).\n\nThe following are based on the Adventurer's Whip Rules by Jo-Herman Haugholt from the Mordheim Khemri Discussion Group (used with permission)."
        }
      ],
      "uniqueSkills": {
        "tableName": "NEW SKILL",
        "skills": [
          {
            "name": "Whip Master",
            "text": "The hero is so skilled with his whip that he may re-coll all to-hit rolls when using the whip. Only one re-roll is allowed per attempt and you must accept the second roll, even if it is worse."
          }
        ]
      },
      "otherSections": [
        {
          "name": "NEW EQUIPMENT",
          "text": "###### Whip\n\n\nCost: 15 Gold Crowns  \n**Weapon:** Whip  \n**Range:** 4\"  \n**Strength:** As user -1  \n**Special Rules:** Cannot be parried, _reach_, disarm, + 1 armour save.\n\n**Disarm:** Instead of striking to injure, a warrior with a Whip may try to strike his opponent's weapon making him drop it. Roll to hit as normal, but instead of rolling to wound, the opponent gets a single Parry attempt; if the Parry attempt is failed, he has dropped his weapon. He must now fight with whatever back-up weapon he has in his equipment for the rest of this combat (or fight unarmed if he has no other weapons). At the end of the combat, the model is assumed to retrieve the dropped weapon, as long as he is not put out of action. Disarmed opponents put out of action lose the weapon permanently.\n\n**Note:** The Parry attempt represents the model trying to hold on to the weapon; he is always allowed one (and only one) Parry, irrespective of the equipment he is carrying.\n\nReach\n\nSisters of Sigmar had \"reach\" replaced with \"Whipcrack\" through later errata, it is recommended to do the same for this whip:\n\n**Whipcrack:** When the wielder charges they gain +1A for that turn. This bonus attack is added after any other modifications. When the wielder is charged they gain +1A that they may only use against the charger. This additional attack will ‘strike first’. If the wielder is simultaneously charged by two or more opponents they will still only receive a total of +1A. If the wielder is using two whips at the same time then they get +1A for the additional hand weapon, but only the first whip gets the whipcrack +1A."
        }
      ],
      "sourceFile": "04-hired-swords.md:1244-1292"
    },
  },
  {
    id: "nomad_scout", name: "Nomad Scout", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 19 (Khemri)",
    detail: {
      "sourceLine": "Source: Town Cryer 19 ([PDF](https://broheim.net/downloads/towncryer/TownCryer19.pdf#page=22))",
      "hireLine": "30 gold crowns to hire + 15 gold crowns upkeep.",
      "flavour": "The guides of the nomad tribes are at best uncouth and uncivilised. However they are good warriors, living a life of almost constant battle within the deserts they call their home. An Old World warband is well advised to hire a guide if they are to survive the ravages of the desert.",
      "mayBeHired": "The Nomad Guide may be hired by any warband that can afford him.",
      "rating": "A Nomad Guide increases the warband's rating by +12 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Nomad Scout",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "The Nomad Guide is armed with a Scimitar and a Bow.",
      "skills": "The Nomad Guide may choose from Shooting and Speed skill when he gains a new skill.",
      "specialRules": [
        {
          "name": "Son of the Desert",
          "text": "The Nomad Guide is adept at finding sources of water. The warband can modify the result on the Supply Source table by + /-1."
        }
      ],
      "sourceFile": "04-hired-swords.md:1294-1316"
    },
  },
  {
    id: "norse_shaman", name: "Norse Shaman", hireCost: {"base":45,"text":"45 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1b", source: "Town Cryer 12 (Lustria), Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Town Cryer 12, Lustria; Border Town Burning Supplement",
      "hireLine": "45 gcs to hire +25 gcs upkeep",
      "flavour": "Even mighty warriors fear the seers of the great Norse tribes. It is said that these seers are mighty soothsayers and can tell when a warrior will meet his death in combat, a knowledge that any warrior dreads to know.\n\nThere is a tradition amongst the tribes of the north, where a man who possesses the sight of the crow can hold back the power of death or unleash it in ways undreamt of. Unlike the swifter prowess of sorcerers who are blessed by a union with the Ruinous Powers, these seers find their powers in the dark places, where death, murder and war have cursed the lands. For here the winds of Dhar congeal, contaminating everything around and here dwell those among the Norse with the witch sight.",
      "mayBeHired": "Human, Norse and Marauders of Chaos warbands may hire the Norse Shaman.",
      "rating": "The Norse Shaman increases the warband's rating by +25 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Norse Shaman",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "The Shaman carries a Rune Staff and either a Sword or an Axe.",
      "skills": "The Shaman may choose from the Combat and Academic skill charts, in lieu of a skill, they may roll for an additional Rune (see below). Rolling a duplicate lowers the difficulty as normal for magic spells.",
      "specialRules": [
        {
          "name": "Special Rules",
          "text": "The Norse Shaman starts with two 'Runes' from the [Norse Runes chart](/docs/magic/norse-runes). These are treated in the same way as Sigmarite Prayers and can be cast whilst wearing armour. Abilities that give saves against spells, give saves against runes."
        }
      ],
      "sourceFile": "04-hired-swords.md:1318-1342"
    },
  },
  {
    id: "old_prospector", name: "Old Prospector", hireCost: {"base":null,"text":"2 treasures"}, upkeep: {"base":null,"text":"1 treasure"}, grade: "1b", source: "Nemesis Crown Supplement",
    detail: {
      "sourceLine": "Source: Nemesis Crown Supplement ([PDF](https://broheim.net/downloads/campaigns/nemesiscrown/Hired%20Swords%20&%20Dramatis%20Personae.pdf))",
      "hireLine": "2 treasure to hire, +1 treasure upkeep",
      "hireFee": "A Prospector may be hired for two Treasures (most likely a gemstone or a nugget of precious metal). His upkeep fee is a single Treasure (he figures he can resale it better than some fresh-faced youngster).",
      "flavour": "The Great Forest is full of old mines, long since exhausted and abandoned by the Dwarfs. Despite this, there are grizzled old men who still spend their lives surveying the land, looking for the big payoff.",
      "mayBeHired": "Any warband may hire a Prospector (\"I duzzent care if'n ye looks a mite strange... as long as yer pay in stone\") except Dwarfs, who regard him as an amateur.",
      "rating": "A Prospector increases the warband's rating by 15 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Prospector",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "Blunderbuss, Pick (two-handed weapon).\n\nSkills: An Old Prospector has the Wyrdstone Hunter and Resilient skills. He may choose from Strength and Speed skill lists when he gains a new skill.",
      "skills": "",
      "specialRules": [
        {
          "name": "Hardened",
          "text": "Prospectors have seen many strange things in their battered lives and are immune to the effects of Fear."
        },
        {
          "name": "Finders Keepers",
          "text": "In any scenario where extra Treasures/Wyrdstone are involved, the Prospector will keep any that he somehow gets his hands on. This will not count as his upkeep, as he will deny that he found any (\"You 'cusin me of _claim-jumpin'_ sonny?\"). For the purpose of _Chance Encounter_ he will keep the Wyrdstone of any enemy heroes that he takes out action - neither warband will gain that shard. He has no effect on _Defend the Find_ as the claim has already been staked."
        },
        {
          "name": "Old Coot",
          "text": "Prospectors are prone to wander off, either because they've heard of a better strike or because they have fallen out with their fellows. At the end of each game roll a D6. On a result of \"1\" the Prospector has pulled up his pegs and left the warband."
        }
      ],
      "sourceFile": "04-hired-swords.md:1344-1372"
    },
  },
  {
    id: "pathfinder", name: "Pathfinder", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 12 (Lustria)",
    detail: {
      "sourceLine": "Source: Town Cryer 12, Lustria ([PDF](https://broheim.net/downloads/towncryer/TownCryer12.pdf#page=18))",
      "hireLine": "60 gs to hire, + 15 gs upkeep",
      "flavour": "As treacherous as the Lustrian wilderness can be, it is very often a wise choice to hire an experienced guide for a warband's expeditionary trek into the teeming jungles. Pathfinders, as they are called, are the very experts one would seek. They are well adapted to the unique landscape and hazards of the Lustrian continent; and more often than not, adventurous enough to live up to the challenge of the greatest fortunes and glory!",
      "mayBeHired": "Any warband.",
      "rating": "A Pathfinder increases the warband's rating + 25 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Pathfinder",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Sword, Dagger, Longbow, Rope & Hook, and Healing Herbs.",
      "skills": "A Pathfinder may choose from Combat, Shooting, and Speed skills when he gains a new skill. In addition, there are a few skills unique to Pathfinders as detailed below, which he can choose instead of normal skills.",
      "specialRules": [
        {
          "name": "Lay of the Land",
          "text": "Even the densely packed growth of the primordial Lustrian jungles cannot bar the Pathfinder from his goal. The Pathfinder is unaffected by terrain modifiers and is able to circumvent even impassable obstacles."
        },
        {
          "name": "Knowledge of Myths and Legends",
          "text": "Pathfinder has spent most of their lives tracking down numerous rumours and cryptic clues in search of the ultimate prize. During the exploration phase, if the Pathfinder was not taken out-of-action, you may re-roll one die, keeping the second result even if it is worse."
        }
      ],
      "uniqueSkills": {
        "tableName": "Pathfinder Special Skills",
        "skills": [
          {
            "name": "Lookout!",
            "text": "Having traversed much of the land himself the Pathfinder is quick to recognise traps laid by enemies or natural hazards of the terrain. Once per game a Pathfinder may cancel the effects of one trap or hazard on a roll of 4+."
          },
          {
            "name": "This Way!",
            "text": "Surviving years in the deadly wilds of Lustria has prepared the Pathfinder for nearly any circumstance. Any model in base contact with the Pathfinder at the start of his turn may traverse impassable terrain just as if possessing the same skill. If, however, contact is lost before reaching safety, the other model is considered out-of-action for the remainder of the game."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:1374-1404"
    },
  },
  {
    id: "priest_of_morr", name: "Priest Of Morr", hireCost: {"base":null,"text":"Hero"}, upkeep: null, grade: "1b", source: "Town Cryer 12",
    detail: {
      "sourceLine": "Source: Town Cryer 12 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=35))",
      "hireLine": "35 gold crowns to hire",
      "flavour": "\"Although we offer blessings upon a departing soul, that Morr may allow it passage through the realm of death, the soul is not our concern. The soul belongs to Morr. Our concern is the body. Our rituals insure that the body remains just as it is; that it is properly sealed and sanctified, lest something enter into the cadaver's shell and corrupt it... or worse.\"\n\nThere are many religions in the Old World and many gods worshiped. Morr, the god of Death, is no exception. Most people within the Empire fear a priest of Morr - for most people fear the unknown. Death, no matter how religious the individual, is an unknown fate that none can escape and the priests of Morr remind everyone of their own mortality. A reminder that most would sooner not have. However, despite this prejudice, the priests of Morr are indispensable in the services they render. Loved ones must be cared for properly when they die and even those who are unloved are still properly taken care of. Everyone acknowledges the importance of funeral rituals. For, more times than anyone cares to remember the dead, the uncared for dead, risen have up to terrorise the living. And, though sword and hammer will curtail them, Undead only a priest of Morr can put them to rest for good.\n\nSo, it is no wonder that the Temple of Morr has sent missionaries to the City of the Damned. Accompanied with both mercenary parties or armed guards and nobles, the priests of Morr come. The Judgement of Sigmar has taken many, many lives and, so the stories go, many more are being lost each day. For the priest of Morr this means their presence is urgently needed.\n\nDressed in the plain black robes of their faith, the priests of Morr have come to Mordheim to insure the souls of those who have died safe passage and, more importantly, that the dead remain as such.",
      "mayBeHired": "",
      "rating": "",
      "profiles": [
        {
          "name": "Priest of Morr",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "As priests of Morr seldom engage in martial activities, they may only be armed with a Dagger and a Scythe as a weapon. Priests of Morr may never wear armour.",
      "skills": "",
      "specialRules": [
        {
          "name": "Loner",
          "text": "Few people care to spend any length of time in the company of a priest of Morr - even when it is their duty to do so. As such, a priest of Morr is used to being alone and probably prefers it that way. Priests of Morr do not suffer from the all alone rules."
        },
        {
          "name": "Funerary Rites",
          "text": "Priests of Morr are not wizards by any means, however, they do have numerous [Funerary Rites](/docs/magic/funerary-rites), which they may perform. As such, priests of Morr may choose a Funerary Rite, using the [rules for Magic](/docs/magic)."
        }
      ],
      "otherSections": [
        {
          "name": "Mercenary Hero",
          "text": "The priest of Morr is a new Hero that can be used by mercenary warbands and in doing so he replaces one of that warband's heroes. It is unlikely that Witch Hunters and Sisters of Sigmar will have a priest of Morr accompanying them, so neither of these two warbands may take one."
        },
        {
          "name": "Skills And Experience",
          "text": "Priests of Morr start with 8 Experience\n\nPriests of Morr use Academic and Speed skills."
        },
        {
          "name": "New Weapon: Scythe",
          "text": "**Range:** Close Combat  \n**Strength:** As user +1  \n**Special Rules:** Difficult to use, Two Handed\n\nScythes are normally implements used in the fields by farmers. It is rare to see them wielded as weapons of warfare. However, the scythe also carries with it an image of death. It is the symbol of the Grim Reaper, the representation of famine and starvation and disease through the lack of harvested food. Priests of Morr, when they need to, may carry a Scythe as a weapon. This is of heavier manufacture, and designed to reap warriors rather than wheat. Because the Scythe is unwieldy, it must be used with two-hands and cannot be used with another weapon, shield or buckler."
        }
      ],
      "sourceFile": "04-hired-swords.md:1406-1450"
    },
  },
  {
    id: "runesmith_journeyman", name: "Runesmith Journeyman", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Nemesis Crown Supplement",
    detail: {
      "sourceLine": "Source: Nemesis Crown Supplement ([PDF](https://broheim.net/downloads/campaigns/nemesiscrown/Hired%20Swords%20&%20Dramatis%20Personae.pdf))",
      "hireLine": "30 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "Having finished his apprenticeship it is usual for a Runesmith to spend several years seeking to increase his knowledge of the art. For some this may mean moving to another forge or hold and working with a different master. Some however are fired to discover things lost in the past and travel to old holds, looking for secrets that have passed out of knowledge. Recovery of ancient Runes is seen by most as a worthy exercise, unlike the pursuit of new knowledge. For this reason a journeyman will accompany parties seeking to right grudges and maintain their equipment in return for protection on his expedition.",
      "mayBeHired": "Mercenaries and Witch Hunters may hire a Journeyman. Warbands that include Elves may hire them, but must pay 30 gold crowns after each battle instead of 15 gold crowns. Dwarfs won’t put up with weak pointy-eared folk unless they have to, or are adequately compensated for their sufferance.",
      "rating": "A Runesmith increases the warband’s rating by +15 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Runesmith",
          "stats": {
            "M": 3,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 4,
            "W": 1,
            "I": 2,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "A Runesmith is equipped with a Gromril Hammer and Heavy Armour.",
      "skills": "A Runesmith may choose from Combat and Strength skills when he gains a new skill. In addition, there is a unique _Rune use_ skill, which he can have instead of a normal skill when he gains a new skill.",
      "specialRules": [
        {
          "name": "Runesmith",
          "text": "A Runesmith may inscribe runes as detailed below."
        },
        {
          "name": "Armourer",
          "text": "A Runesmith can repair and make weapons and armour. The warband may purchase one item per post game trading session from the following: axes, hammers, swords, two handed weapons, helmets, shields, light and heavy armour at a 2d6 gc discount to a minimum price of 1 gc. This applies only if the Runesmith did not go OOA."
        },
        {
          "name": "Armour",
          "text": "Dwarfs never suffer movement penalties for wearing armour."
        },
        {
          "name": "Hate Orcs and Goblins",
          "text": "All Dwarfs hate Orcs and Goblins. See the psychology section of the Mordheim rules for details on the effects of hatred."
        },
        {
          "name": "Hard to Kill",
          "text": "Dwarfs are tough, resilient individuals who can only be taken out of action on a D6 roll of 6 instead of 5-6 when rolling on the Injury chart. Treat a roll of 5 as stunned."
        },
        {
          "name": "Hard Head",
          "text": "Dwarfs ignore the special rules for maces, clubs etc. They are not very easy individuals to knock out."
        }
      ],
      "otherSections": [
        {
          "name": "Rune Use",
          "text": "A Runesmith may inscribe Runes before a battle; they start knowing one Rune but may learn more as spellcasters learn spells. These Runes are only temporary due to the haste of the Runesmith but may not be dispelled during the game. Runes may be inscribed on axes, hammers, swords, two handed weapons, helmets, shields, light and heavy armour.\n\nThe runes are:\n\n| Rune | Effect | Effective on | Difficulty |\n| --- | --- | --- | --- |\n| Iron | 6+ ward | Armour | 6 |\n| Stone | +1 armour save | Armour | 6 |\n| Fury | +1 A | Weapon | 7 |\n| Striking | +1 WS | Weapon | 6 |\n| Speed | +1 I | Weapon | 5 |\n| Cleaving | +1 S | Weapon | 8 |\n\nBefore the battle the Runesmith may attempt to inscribe every Rune he knows, but once only. No Rune may be inscribed on an item with a Rune already on it. If he passes the difficulty roll he has succeeded and the Rune will affect the weapon/armour for the coming battle.\n\nIf he rolls a natural 2 the process has highlighted shoddy (and hence nondwarf) manufacturing and the item being inscribed on is broken, remove it from your roster.\n\nA gromril item (including dwarf axes) may reroll a result of 2 but a second 2 stands. If he rolls a natural 12 the rune is “durable” and will last beyond one battle else it fades after the game.\n\n**Durable:** If a Rune becomes durable roll a d6 after each battle, but not the first, on a roll of 1 or 2 it fades and ceases to be effective, otherwise it will be effective in the next battle."
        }
      ],
      "sourceFile": "04-hired-swords.md:1452-1507"
    },
  },
  {
    id: "shadow_warrior", name: "Shadow Warrior", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 13 (Lustria)",
    detail: {
      "sourceLine": "Source: Town Cryer 13, Lustria ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=22))",
      "hireLine": "35 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "Shadow Warriors are High Elves from the desolate war-ravaged land of Nagarythe, where the Witch King once held court. This leads their kin to mistrust and ostracise them. These angry lost souls are often used as scouts and skirmishers for High Elf forces, as well as wandering sell-swords looking to quench their bitter hatred of the Dark Elves. Though not as skilled a scout as the Ranger, the Shadow Warrior is as deadly with his bow and sword as any Elf.",
      "mayBeHired": "The Shadow Warrior may be hired by High Elf and all Human warbands, but may not be hired by a warband that is evil (eg Possessed) or one that includes an evil Hired Sword (eg Dark Elf Assassin).",
      "rating": "A Shadow Warrior increases the warband’s rating by +12 points plus 1 point per Experience point he has.",
      "profiles": [
        {
          "name": "Shadow Warrior",
          "stats": {
            "M": 5,
            "WS": 4,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 6,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "A Shadow Warrior carries a Sword, Longbow, Dagger, Shield and wears Light Armour.",
      "skills": "A Shadow Warrior may choose from Combat or Shooting skills when he gains a new skill, In addition he may choose his skill from the [Shadow Warriors](/docs/warbands/grade-1b-warbands/shadow-warriors#shadow-warrior-special-skills) Special Skill list in Town Cryer 10.",
      "specialRules": [
        {
          "name": "Hates Dark Elves",
          "text": "Shadow Warriors seethe with bitterness when facing Dark Elves and follow the rules for hatred in the Mordheim rulebook."
        },
        {
          "name": "Excellent Sight",
          "text": "Elves have eyesight unmatched by mere humans. The Shadow Warrior spots Hidden enemies from twice his Initiative value in inches away."
        },
        {
          "name": "Bitter Enemies",
          "text": "If the last fight was against Dark Elves or a warband containing a Dark Elf Hired Sword, the upkeep cost is waived for that game."
        },
        {
          "name": "Infiltration",
          "text": "A Shadow Warrior can infiltrate."
        }
      ],
      "sourceFile": "04-hired-swords.md:1509-1537"
    },
  },
  {
    id: "snake_charmer", name: "Snake Charmer", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1b", source: "Town Cryer 19 (Khemri)",
    detail: {
      "sourceLine": "Source: Town Cryer 19 ([PDF](https://broheim.net/downloads/towncryer/TownCryer19.pdf#page=22))",
      "hireLine": "40 gold crowns to hire + 10 gold crowns (+5 gold crowns per snake) upkeep.",
      "flavour": "In the bazaars and markets of Araby crowds often gather around a mystic Arabian sitting playing a flute. Mesmerised by the music or some say by his rhythmic swaying is a deadly venomous snake. Snake charmers generally survive on the money they can make as entertainers but often some offer their services and that of their snakes as warriors.\n\nEquipment: The Snake Charmer is equipped with a Dagger and a Scimitar. The Snake Charmer starts with three snakes.",
      "mayBeHired": "Any good warband (human, Elf, Dwarf, etc.) may hire a Snake Charmer.",
      "rating": "A Snake Charmer increases the warband rating by 5 points, + 1 point for each Experience point he has and + 5 points for each snake.",
      "profiles": [
        {
          "name": "Snake Charmer",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        },
        {
          "name": "Snake",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 0,
            "S": 1,
            "T": 2,
            "W": 1,
            "I": 5,
            "A": 1,
            "Ld": 5
          },
          "rawStats": [
            "4",
            "3",
            "0",
            "1*",
            "2",
            "1",
            "5",
            "1",
            "5"
          ]
        }
      ],
      "weaponsArmour": "",
      "skills": "A Snake Charmer may choose from Academic and Speed when he gains a new skill.",
      "specialRules": [
        {
          "name": "Snake Charmer",
          "text": "The Snake Charmer can control up to five snakes provided that they remain within 6\" of him. If a snake is not within 6\" of the Snake Charmer in the Movement phase, they will move 1D6\" in a random direction. If that takes them into contact with a model, either friend or foe, it will attack as if charging."
        },
        {
          "name": "Immune to poison",
          "text": "The Snake Charmer has been bitten so many times that he is immune to poisons."
        },
        {
          "name": "Venomous",
          "text": "The snakes are venomous and count as attacking using Black Lotus."
        },
        {
          "name": "Animals",
          "text": "Snakes are animals and do not gain Experience."
        },
        {
          "name": "Snake hunter",
          "text": "After each game the Snake Charmer may attempt to catch another snake, provided that he did not go out of action. The Snake Charmer makes this roll in the Recruitment and Trading phase and must roll under his initiative to successfully catch a snake. The Snake Charmer may only attempt to catch one snake after each game. If he fails to catch the snake there is a chance that he is attacked. Roll a D6. On a roll of 1 the Snake Charmer suffers a S3 hit."
        }
      ],
      "sourceFile": "04-hired-swords.md:1539-1570"
    },
  },
  {
    id: "thief", name: "Thief", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 19 (Khemri)",
    detail: {
      "sourceLine": "Source: Town Cryer 19, Khemri ([PDF](https://broheim.net/downloads/towncryer/TownCryer19.pdf#page=23))",
      "hireLine": "30 gc to hire, +15gc upkeep",
      "flavour": "The Thieves guilds of the Old World aren't a patch on the brutally efficient and highly organised guilds of Araby. So skilled are the thieves of Araby it is said that they can steal the treasures of the gods themselves.",
      "mayBeHired": "Any warband except Undead may hire a Thief.",
      "rating": "An Araby Thief increases the warband's rating by +22 points, plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Thief",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Two Daggers, Thief's cloak.",
      "skills": "A Thief may choose from Combat & Speed skills.",
      "specialRules": [
        {
          "name": "Thief's Cloak",
          "text": "Thieves wear cloaks that help them blend in with their surroundings and can disguise them very well in both the desert and the towns. A warrior firing a missile weapon at a warrior wearing a Thief's cloak suffers -1 on his roll to hit. Also the distance required to spot a thief when Hidden is doubled."
        },
        {
          "name": "Tea-Leaf!",
          "text": "Naturally thieves are most adept at stealing items! A Thief may attempt to steal one item during the Trading phase. Choose any item, if it is a common item the Thief successfully steals it on a 2+ on a D6. A Rare item is successfully stolen by rolling higher than the availability number on 2D6. Any items stolen may be used exactly the same way as one that was bought. If the Thief fails to steal the item roll a D6. On a score of 1-5 the thief is chased out of the trading post and escapes. On a score of a 6 the Thief is captured by whatever authorities there may be and is hung (remove him from the warband roster)."
        }
      ],
      "sourceFile": "04-hired-swords.md:1572-1596"
    },
  },
  {
    id: "tomb_robber", name: "Tomb Robber", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 19 (Khemri)",
    detail: {
      "sourceLine": "Source: Town Cryer 19 ([PDF](https://broheim.net/downloads/towncryer/TownCryer19.pdf#page=23))",
      "hireLine": "30 gold crowns to hire + 15 gold crowns upkeep.",
      "flavour": "While the sinister ruined tombs of Nehekhara have claimed the lives of many would-be robbers, a few have survived using their wit and lightning reflexes. Many of these expert robbers are drawn from the nomadic tribesmen of the vast desert and knowledge of the necropolises is second nature to them. Some, though, are Old Worlders lured by the temptation of riches who have amassed a wealth of knowledge in archaeology and ancient traps.",
      "mayBeHired": "The Tomb Robber may be hired by any good warband (human, Elf, Dwarf, etc.) that can afford him.",
      "rating": "A Tomb Robber increases the warband's rating by +20 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Tomb Robber",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 5,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "The Tomb Robber is armed with a Sword and Crossbow Pistol. In addition he carries a Rope & Hook.",
      "skills": "The Tomb Robber may choose from Combat, Shooting or Speed skills when be gains a new skill.",
      "specialRules": [
        {
          "name": "Explorer",
          "text": "The Tomb Robber allows your warband to modify a single dice roll on the Exploration chart by -1/+ 1."
        },
        {
          "name": "Traps",
          "text": "The Tomb Robber has the Trap Expert skill, for more details see the TC17."
        },
        {
          "name": "Excellent Reflexes",
          "text": "The Tomb Robber has a special save of 5+ against any attack made against him, be it shooting, close combat, traps or spells. If the Tomb Robber gains the Dodge skill this save increases to a 4+ special save."
        }
      ],
      "sourceFile": "04-hired-swords.md:1598-1624"
    },
  },
  {
    id: "warrior_priest_of_sigmar", name: "Warrior Priest Of Sigmar", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1b", source: "Town Cryer 28",
    detail: {
      "sourceLine": "Source: Town Cryer 28 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=31))",
      "hireLine": "40 gc to hire, 20 gc upkeep",
      "flavour": "In the centre of Sigmarhaven is a wooden Temple of Sigmar and this attracts many fledgling warrior priests. To test their mettle against the horrors of the Cursed City, the priesthood hire out their acolytes and make careful observance of their faith, resilience and fervour.",
      "mayBeHired": "Any warband may hire a Warrior Priest of Sigmar except Witch Hunters (they already have the warband choice!), Middenheim mercenaries, Possessed, Orcs & Goblins, Skaven and any other suitably ‘evil' warbands.",
      "rating": "A Warrior Priest of Sigmar increases the warband rating by + 16 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Priest",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Hammer of Sigmar, Light Armour and Shield.",
      "skills": "Warrior-Priests may choose skills from the Academic skills list, or they may randomly determine a new Prayer from the [Prayers of Sigmar](/docs/magic/prayers-of-sigmar) list.",
      "specialRules": [
        {
          "name": "SPECIAL RULES",
          "text": "**Prayers:** A Warrior-Priest is a servant of Sigmar and may use the [Prayers of Sigmar](/docs/magic/prayers-of-sigmar) as detailed in the Magic section."
        }
      ],
      "sourceFile": "04-hired-swords.md:1626-1648"
    },
  },
  {
    id: "witch", name: "Witch", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 13",
    detail: {
      "sourceLine": "Source: Town Cryer 13 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=40))",
      "hireLine": "30 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "There are those practitioners of magic that dwell permanently within the depraved ruins of Mordheim. They are unable to find a place in society and live as hermits, conjuring their magicks in utter solitude. These creatures are witches and are often seen in the broken down houses and ruined shacks that litter the City of the Damned, stooped over bubbling cauldrons, sheltering from the rain. They are ancient and individual practitioners of magic, using many old spells, and methods that are older still. It is a lucky warband that can find and employ the services of a witch for they are reclusive and solitary individuals but can be swayed when the price or purpose suits them.",
      "mayBeHired": "Any warband except Witch Hunters and Sisters of Sigmar.",
      "rating": "A Witch increases the warband's rating by +14 points, plus 1 point for each experience point she has.",
      "profiles": [
        {
          "name": "Witch",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 2,
            "S": 2,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Staff.",
      "skills": "Witches may choose skills from the Academic skills list, or they may randomly determine a new spell from the Charms & Hexes spell list",
      "specialRules": [
        {
          "name": "Wizard",
          "text": "The Witch has the ability to use magic and casts spells like any other wizard. She has two spells generated at random from the [Charms & Hexes list](/docs/magic/charms-and-hexes)."
        },
        {
          "name": "Recluse",
          "text": "Witches are very reclusive individuals and therefore difficult to employ Even when they are found they may be reluctant to aid the warband no matter how much gold they offer. When attempting to hire a Witch the warband leader must roll a D6. If he or she can score a 4+ the Witch can be hired, otherwise the Witch shuns them and they will have to try again after their next battle."
        },
        {
          "name": "Potions",
          "text": "The Witch is an expert as brewing all manner of curious concoctions. A single hero in the warband who have hired the Witch may partake of such a potion before the battle. Roll a D6 to discover the draught’s effect.\n\n|  D6  | Result |\n| --- | --- |\n| 1 | **Debilitating:** The potion is simply too potent for the hero and weakens them. They are at -1 Toughness for the whole of the next battle until they can roll a 6 on a D6 in the recovery phase to shrug off the ill effects. |\n| 2-3 | **Strength:** The hero is infused with strength as he quaffs the potion. He is at +1 Strength until he rolls a 1 on a D6 in the recovery phase. |\n| 4-5 | **Resilience:** An inner resilience passes through the hero. He is at +1 to Toughness until he rolls a 1 on a D6 in the recovery phase. |\n| 6 | **Fortitude:** The hero's constitution is increased and he feels ready to take anyone on. He gains an extra wound for the whole battle. However, once lost the wound cannot be restored. |"
        },
        {
          "name": "Reluctant",
          "text": "Whilst she is happy to use her magic to aid the warband, the Witch is reluctant to enter the fray herself. As such the Witch will never charge (although if charged she will defend herself) and will always try to stay at least 8\" away from enemy models and must move away if she finds herself within this distance.\n\nSkills\n\nIn the original publication there was no mention on what skills may be chosen by the witch. It is recommended to follow similar logic to the Warlock:"
        }
      ],
      "sourceFile": "04-hired-swords.md:1650-1689"
    },
  },
  {
    id: "witch_hunter", name: "Witch Hunter", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Nemesis Crown Supplement",
    detail: {
      "sourceLine": "Source: Nemesis Crown Supplement ([PDF](https://broheim.net/downloads/campaigns/nemesiscrown/Hired%20Swords%20&%20Dramatis%20Personae.pdf))",
      "hireLine": "30 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Witch Hunters are driven men who make it their job to free the Empire of the taint of chaos. Although these troubled times have often meant witch hunters operating in small groups or by requisitioning support from local authorities many still prefer to work alone. Some of course have other reasons, their excessive zeal can lead to other hunters shunning them or even their expulsion from the order, in a few cases they themselves have darker secrets they don’t want their brothers in arms investigating. These solitary witch hunters are not above joining roving bands if it suits their aims, providing they are reimbursed for the skills they bring. They care little for the morals of such groups providing that they are a human band and not tainted in any way by chaos. The threat of chaos is so great that they have even put aside their prejudices against followers of Ulric to better fight chaos.",
      "mayBeHired": "Any non-chaos human warband may hire a Witch Hunter, he has his own reasons, but will not stay with a Witch Hunter band for more than one battle. See also the Burn the witch rule below.",
      "rating": "A Witch Hunter increases the warband's rating by 15 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Witch Hunter",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Dueling or Crossbow Pistol, Sword and Dagger. He starts every game with a vial of Holy water and a Garlic.",
      "skills": "A Witch Hunter may choose from Combat, Speed, Shooting, Academic and Strength skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Burn the Witch",
          "text": "The Witch hunter hates all enemy spellcasters. He will not work for a band with a spellcaster, unless it is a priest of Sigmar, Ulric, Taal or Morr."
        },
        {
          "name": "In Sigmar’s name",
          "text": "The Witch hunter can call on his faith in Sigmar, he is allowed to reroll all failed fear tests."
        },
        {
          "name": "Sigmar’s reward",
          "text": "Doing Sigmar’s work is reward enough at times. If the band take the leader of a chaos or undead band out of action the Witch Hunter waives part of his fee, at the end of the battle he only charges 5gc upkeep. Chaotic bands only includes bands truly chaotic, not merely nonhuman, eg not skaven, dark elves etc."
        }
      ],
      "sourceFile": "04-hired-swords.md:1691-1717"
    },
  },
  {
    id: "wolf_priest_of_ulric", name: "Wolf Priest of Ulric", hireCost: {"base":null,"text":"Hero"}, upkeep: null, grade: "1b", source: "Town Cryer 8",
    detail: {
      "sourceLine": "Source: Town Cryer 8 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=37))",
      "hireLine": "60 gold crowns to hire",
      "flavour": "The Wolf Priests of Ulric hail from Middenheim, the city of the White Wolf, built on a plateau that according to legend was created by a mighty blow from Ulric's fist. Ulric, the White Wolf, is the god of winter and a violent god, and his priests see the hammer-like blow of the comet on Mordheim as Ulric’s judgment on the decadent Sigmarites.\n\nWolf Priests may only join a Middenheim Mercenary warband and will replace one of the Champions. They see Witch Hunters and Sisters of Sigmar as heretics and worse due to the intense rivalry between the cults of Ulric and Sigmar.",
      "mayBeHired": "",
      "rating": "",
      "profiles": [
        {
          "name": "Wolf Priests",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 8
          }
        },
        {
          "name": "Wolf",
          "stats": {
            "M": 6,
            "WS": 4,
            "BS": 0,
            "S": 4,
            "T": 4,
            "W": 1,
            "I": 4,
            "A": 2,
            "Ld": 5
          }
        }
      ],
      "weaponsArmour": "Wolf Priests may not use any armour, trusting only in Ulric's protection. The only exception is that every Wolf Priest is garbed in a cloak made from the pelt of a white wolf: 6+ save. The cost of the cloak is included in the cost of the priest.\n\nWolf Priests prefer the use of blunt weapons to those with edges, and thus may only use Hammers, Maces, Clubs, Flails, Morning Stars, and the Two-Handed version of any of these. The exception to this is the ubiquitous Dagger that most models carry.",
      "skills": "Wolf Priests may chose from the Combat, Academic, Strength and Speed lists.",
      "spells": "A Wolf Priest is a servant of Ulric and may use the [Prayers of Ulric](/docs/magic/prayers-of-ulric) as detailed in the Magic section.",
      "specialRules": [
        {
          "name": "Hatred",
          "text": "Wolf Priests see Witch Hunters (Templars of Sigmar), Warrior-Priests, Sigmarite Matriarchs and Sisters Superior as agents of an opposing cult, and thus they hate these models. That atred does not extend to other models in those warbands, as the Wolf Priests see them simply as misguided followers of an errant cult."
        },
        {
          "name": "Wolf Companion",
          "text": "Wolf Priests may be accompanied by a huge wolf. (See Wolf Companion entry following Wolf Priest rules.)"
        }
      ],
      "otherSections": [
        {
          "name": "Wolf Companion",
          "text": "Henchman, 25 gc to hire\n\nWarbands may only purchase a wolf companion if they have a Wolf Priest of Ulric in their midst. The priest may choose to be accompanied by a huge wild wolf, which often scouts ahead to warn the priest of danger.\n\n| Profile | M | WS | BS | S | T | W | I | A | Ld |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Wolf | 6 | 4 | 0 | 4 | 4 | 1 | 4 | 2 | 5 |\n\n**Weapons and Armour:** The wolf uses its fangs to attack its prey and cannot use any other weapon. Their thick coat of fur counts as a wolf cloak for protection: 6+ save."
        },
        {
          "name": "Special Rules (Wolf Companion)",
          "text": "**Animals:** Wolf companions are animals and thus do not gain any experience."
        }
      ],
      "sourceFile": "04-hired-swords.md:1719-1763"
    },
  },
  {
    id: "bone_goliath", name: "Bone Goliath", hireCost: {"base":225,"text":"225 gc"}, upkeep: null, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf#page=6))",
      "hireLine": "225 gold crowns to build",
      "flavour": "It takes a vast amount of time, and more importantly, energy for a Liche to construct a giant made of bone. For those who face a Bone Goliath, they see a terrifying giant made of the bones of a hundred fallen, standing twice the height of a man!",
      "mayBeHired": "Only the Restless Dead may build a Bone Goliath.",
      "rating": "A Bone Goliath increases the warband’s rating by +50 points.",
      "profiles": [
        {
          "name": "Bone Goliath",
          "stats": {
            "M": 5,
            "WS": 3,
            "BS": 0,
            "S": 5,
            "T": 5,
            "W": 3,
            "I": 2,
            "A": 3,
            "Ld": 6
          }
        }
      ],
      "weaponsArmour": "Bone Goliaths never carry any weapons or armour and suffer no penalties for this.",
      "skills": "",
      "specialRules": [
        {
          "name": "Cause Fear",
          "text": "Bone Goliaths are gargantuan undead constructs and therefore cause fear."
        },
        {
          "name": "May not run",
          "text": "Bone Goliaths are slow undead creatures and may not run (but may charge normally)."
        },
        {
          "name": "Immune to Psychology",
          "text": "A Bone Goliath is not affected by psychology and never leaves combat."
        },
        {
          "name": "Immune to Poison",
          "text": "A Bone Goliath is not affected by poison."
        },
        {
          "name": "Undead Construct",
          "text": "Bone Goliaths ignore any injury rolled on the Injury chart on the roll of a 4+ and continue fighting, so a Bone Goliath has the possibility of taking much more damage than their 3 wounds suggest. This is not an armour save and so it is not modified by the Strength of the attack. This rule is ignored for wounds caused by magic or magic weapons."
        },
        {
          "name": "Assembly",
          "text": "Bone Goliaths are not hired or found, they are instead constructed at great expense to their masters. Constructing a Bone Goliath will cause the Liche to reduce their starting Wound total by D3 wounds to a minimum of 1, in addition to the cost in gold crowns. A warband constructing a Bone Giant may not look for any rare items. A warband that has no Liche to lead it may not construct a Bone Goliath, but if the Liche dies after its construction, the Bone Goliath is unaffected. Warbands starting with a Bone Goliath can ignore this rule, unless of course they make one to replace a fallen Goliath."
        },
        {
          "name": "Large",
          "text": "Bone Goliaths are huge creatures. They count as large targets for missile weapons."
        },
        {
          "name": "No Pain",
          "text": "Bone Goliaths treat stunned results on the injury chart as knocked down."
        },
        {
          "name": "Mindless",
          "text": "Bone Goliaths never gain experience."
        }
      ],
      "sourceFile": "04-hired-swords.md:1772-1808"
    },
  },
  {
    id: "cathayan_merchant", name: "Cathayan Merchant", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf#page=4))",
      "hireLine": "20 gold crowns to hire + 10 gold crowns upkeep",
      "flavour": "Part guide, part interpreter, the Cathayan merchants of the small villages and rest stops along the Silver Road will join a caravan heading to Shang-Yang, offering their advice about where to get the best prices for imports and where to find the finest merchandise to export. They will offer to help with any negotiations or possible bureaucratic interference. What the Old Worlders do not realise is that these merchants are employed by or own the business they recommend, thus giving themselves a monopoly on goods and wealth without their Old World business partners realising it. For the Cathayans that is the price of business.",
      "mayBeHired": "Any warband which includes Humans or Dwarfs may hire a Cathayan Merchant, including Battle Monks of Cathay.",
      "rating": "A Cathayan Merchant increases the warband's rating by +10 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Merchant",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        },
        {
          "name": "Bodyguard",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 2,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Sword.",
      "skills": "A Merchant may choose from Academic skills when he gains a new skill (he also has his own special skills that he can choose – see below).",
      "specialRules": [
        {
          "name": "Haggle",
          "text": "The Merchant knows all the tricks of bargaining and haggling. He may deduct 2D6 gold crowns from the price of any single item (to a minimum cost of 1gc) once per post battle sequence."
        },
        {
          "name": "Pawnbroker",
          "text": "The Merchant is skilled in finding the best price for sold items and as such gains an extra 2D6 gold per item that the warband sells (up to its full value) if he was not taken out of action in the battle."
        },
        {
          "name": "Marketeer",
          "text": "The Merchant has many useful contacts in the black market underworld and foreign traders to locate many special items. After each battle (if he wasn’t taken out of action) the Merchant can visit one of two markets: the Black Market and Exotic Wares, in search of items for the warband. Roll a D6 on the relevant table to see what items are on offer.\n\nAll the items purchased through the Merchant’s market contacts are at their base price so ignore the random gold modifiers attached on all items."
        }
      ],
      "uniqueSkills": {
        "tableName": "MERCHANT SKILLS",
        "skills": [
          {
            "name": "Stone Cutter",
            "text": "The Merchant has the skill to refine wyrdstone shards to increase their value. Whenever a warband sells its wyrdstone the Merchant may try to refine the source. Roll a D6 to discover how much additional gold the wyrdstone is worth.\n\n| D6 | Gold |\n| --- | --- |\n| 1-2 | Lose 2D6 gold crowns. |\n| 3-5 | Gain 2D6 gold crowns. |\n| 6 | Gain 3D6 gold crowns. |"
          },
          {
            "name": "Guardian",
            "text": "The Merchant has ‘acquired’ a bodyguard to protecting from harm in the coming battles. The bodyguard will only protect the Merchant and cannot fulfil warband objectives or search, loot or any function other than protecting the Merchant and as such will remain within 1\" of the Merchant at all times. The bodyguard doesn’t gain experience and isn’t paid (it is assumed he has been ‘gifted’ to the Merchant as a favour from one of his contacts).\n\n**Weapons/Armour:** Sword, Light Armour, Shield and Helmet."
          }
        ]
      },
      "otherSections": [
        {
          "name": "Special Rules (MERCHANT SKILLS)",
          "text": "**Intercept:** The bodyguard will intercept any model shooting at or charging the Merchant. Any attacks will be directed at him and if charged place the bodyguard in front of the Merchant to protect him. The bodyguard will not charge unless the Merchant also charges and cannot intercept an attack if already engaged in combat."
        },
        {
          "name": "Black Market",
          "text": "_Crooks and brigands supply the black market, where denizens of the Cathayan underworld sell and procure all manner of illicit substances. They are regularly frequented by assassins, merchants, and less professional scumbags._\n\n| D6 | Items | Price |\n| --- | --- | --- |\n| 1 | Nothing available | \\- |\n| 2 | Spider spittle (D3 doses) | 30 gc |\n| 3 | Fire bomb | 35 gc |\n| 4 | Fighting claws | 35 gc per pair |\n| 5 | Cathayan longsword | 75 gc |\n| 6 | [Lesser artefact](/docs/campaigns/campaign-settings/border-town-burning/lesser-artefacts): For 75 + D6 x 10 gold crowns the warband may purchase an artefact, determined at random from the Lesser Artefacts table. | 75 + D6 x 10 gc |"
        },
        {
          "name": "Exotic Wares",
          "text": "_Traders from across the seas can be found in the shady taverns and street corners on the outskirts of the border town. They have many exotic and wondrous foreign items for sale at steep prices…_\n\n| D6 | Items | Price |\n| --- | --- | --- |\n| 1 | Nothing available | \\- |\n| 2 | Gromril armour | 150 gc |\n| 3 | Elf bow | 35 gc |\n| 4 | Ithilmar armour | 90 gc |\n| 5 | Tome of magic | 200 gc |\n| 6 | Elven Cloak | 100 gc |"
        }
      ],
      "sourceFile": "04-hired-swords.md:1810-1886"
    },
  },
  {
    id: "chaos_centaur", name: "Chaos Centaur", hireCost: {"base":65,"text":"65 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf))",
      "hireLine": "65 gold crowns to hire +25 gold crown upkeep",
      "flavour": "Shamed by their unsightly appearance, centauroid mutants isolate themselves within the darkest recesses of the forests in Norsca and the Wastes, periodically collaborating with northern tribes raiding on the Steppes. Of mutations, Centaurs have been plagued with a kind that cannot be concealed. Afflicted or born with the torso of human or elf married to the body of an animal. These creatures neither man or beast nor both, prey on lonesome travellers and the meek.",
      "mayBeHired": "Beastmen, Marauders of Chaos, Ogres and Norse warbands may hire a Chaos Centaur.",
      "rating": "A Chaos Centaur increases the warband's rating by +20 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Chaos Centaur",
          "stats": {
            "M": 8,
            "WS": 4,
            "BS": 3,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 7
          },
          "rawStats": [
            "8",
            "4",
            "3",
            "4",
            "3",
            "1",
            "3",
            "1(2)",
            "7"
          ]
        }
      ],
      "weaponsArmour": "Throwing Axes (counts as throwing knives), Shield, plus a Sword or Spear. Treat the spear as you would for the use of a Cavalry bonus (+1 Strength when charging).",
      "skills": "A Chaos Centaur may choose from Combat and strength skills when he gains new skills, or may buy one new [mutation](/docs/warbands/grade-1a-warbands/cult-of-the-possessed#mutations).",
      "specialRules": [
        {
          "name": "Drunken",
          "text": "Chaos Centaurs are renowned among the northern tribes for their habitual need to consume alcohol by the barrel, working themselves up into a drunken frenzy. Roll 1D6 at the start of each turn. On a roll of 1, they must test for stupidity that turn. On a roll of 2-5 nothing happens and on the roll of a 6 they become subject to frenzy for that turn. While subject to both stupidity and frenzy they are immune to all other forms of psychology."
        },
        {
          "name": "Woodland Dwelling",
          "text": "For most of their lives centauroid mutants prowl the murky depths of forests. They suffer no movement penalties for other moving through wooded areas."
        },
        {
          "name": "Trample",
          "text": "As well as their weapons, Centaurs use their hooves and sheer size to crush their enemies. This counts as an additional attack, which does not benefit from weapon bonuses or penalties."
        }
      ],
      "sourceFile": "04-hired-swords.md:1888-1914"
    },
  },
  {
    id: "coachman", name: "Coachman", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf))",
      "hireLine": "20 gold crowns to hire +10 gold crowns upkeep",
      "flavour": "Wagons, coaches and similar carts are very popular among the wealthy mercenary captains as they are both a practical means of transport for carrying the warband’s riches and a status symbol. Wagons are also necessary for the great caravans of the merchants that travel the dangerous Silk Road. Capable wagon drivers are much sought-after aids to ensure a secure passage and only few dare to accept the risk. Those who do, charge a fair fee in gold for their services.",
      "mayBeHired": "Any warband except Skaven, Beastmen, and Orcs & Goblins warbands may hire a Coachman.",
      "rating": "A Coachman increases the warband’s rating by +8 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Coachman",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Whip, Sword, light Armour.",
      "skills": "A Coachman may choose from Speed skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Driver",
          "text": "A wagon driven by the Coachman may re-roll results on the Out of Control chart once. Note that the second result must be accepted even if it is worse."
        },
        {
          "name": "Handyman",
          "text": "The Coachman is skilled in fixing minor damage on the wagon. If the wagon is stationary (ie, it has not moved the last turn) and the driver is in contact with the wagon, he may repair one previously damaged wheel. The driver may do nothing else that turn and the wagon may not be moved. He can even set in a new wheel if it flew off. Note that if there are any enemy models in contact with the wagon, it cannot be repaired that turn as the situation is way too dangerous to focus on the cart."
        }
      ],
      "sourceFile": "04-hired-swords.md:1916-1940"
    },
  },
  {
    id: "grave_robber", name: "Grave Robber", hireCost: {"base":45,"text":"45 gc"}, upkeep: {"base":18,"text":"18 gc"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf#page=3))",
      "hireLine": "45 gold crowns to hire +18 gold crowns upkeep",
      "flavour": "Among thieves, the most despicable are those who loot the graves of the Old World. Some make quite a living robbing tombs and hiding out on the fringes of towns. Although detested by their fellow man, but the grave robber finds a certain favour among the practitioners of black magic who often benefit from the services of these shifty professionals.",
      "mayBeHired": "Any warband which includes a Vampire, Necromancer or Liche may hire a Grave Robber.",
      "rating": "A Grave Robber increases the warband’s rating by +15 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Grave Robber",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 6
          }
        }
      ],
      "weaponsArmour": "Pickaxe (uses rules of a 'axe' for combat), Dagger, Lantern, Toughened Leathers.",
      "skills": "A Grave Robber may choose from Combat and Speed skills when he gains new skills.",
      "specialRules": [
        {
          "name": "Hatred",
          "text": "All goodly men despise a Grave Robber, but any model that can use Prayers of Sigmar will hate the Grave Robber."
        },
        {
          "name": "Grave Robbing",
          "text": "During the exploration phase, a Grave Robber can loot a local cemetery if he wasn’t taken out of action. Roll 2D6 and consult the following chart:\n\n| 2D6 | Result |\n| --- | --- |\n| 2 | **Discovered!** The Grave Robber is discovered and is driven from the cemetery by angry villagers or ghouls or any number of nasty things. Remove the Grave Robber from your warband roster. |\n| 3-4 | **Nothing:** Pauper's graves. No significant finds. |\n| 5-7 | **Trinket:** A corpse is found wearing a trinket of moderate value. You get D6+3 gold crowns. |\n| 8-9 | **Treasure:** A corpse has a copious amount of treasure within its grave. You get D6+8 gold crowns. |\n| 10-11 | **Corpse:** No treasure, but you may add a Zombie to your roster provided you have room in your warband. This Zombie is free. The corpse can be sold for D6+2 gold crowns if the player does not wish to keep it as a Zombie. |\n| 12 | **Artefact:** A Hero’s tomb. Contains a magical artefact, immediately roll on the [Lesser artefact](/docs/campaigns/campaign-settings/border-town-burning/lesser-artefacts) chart. |"
        }
      ],
      "sourceFile": "04-hired-swords.md:1942-1975"
    },
  },
  {
    id: "hobgoblin_scout", name: "Hobgoblin Scout", hireCost: {"base":45,"text":"45 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf#page=5))",
      "hireLine": "45 gold crowns to hire +20 gold crowns upkeep",
      "flavour": "The Eastern Steppe is home to the tribes of nomadic Hobgoblins. Ruled by the Khans, these Hobgoblins travel the Steppes on wolf back, looking for good pillaging. Related to the Hobgoblins of the Chaos Dwarf towers, these nomads are sometimes hired by the diminutive Chaos Dwarfs to act as scouts for their raids, spying out the land, and locating prime spots to ambush. After the Hobgoblins turned traitor on their fellow greenskins at the tower of Zharr Naggrund, they have enjoyed the favour in those parched lands, the only thing that has kept them safe from the vengeance of Orc tribes.",
      "mayBeHired": "Chaos Dwarfs and Ogre warbands may hire a Hobgoblin Scout.",
      "rating": "A Hobgoblin Scout increases the warband's rating by +19 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Hobgoblin",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 2,
            "A": 1,
            "Ld": 6
          }
        },
        {
          "name": "Giant Wolf",
          "stats": {
            "M": 9,
            "WS": 3,
            "BS": 0,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 4
          }
        }
      ],
      "weaponsArmour": "Dagger, Shortbow, Shield. A Hobgoblin Scout rides a Giant Wolf.",
      "skills": "A Hobgoblin Scout may choose from Shooting and Riding skills when he gains a new skill. In addition, there are a couple of skills unique to a Hobgoblin Scout as detailed below, which he can choose instead of normal skills.",
      "specialRules": [
        {
          "name": "Ride",
          "text": "A Hobgoblin Scout has the Ride Giant Wolf skill."
        },
        {
          "name": "Loner",
          "text": "The Scout has become so used to being alone on the Steppes that it has become accustomed to its own company. The Scout may never use the warband leaders Ld for any tests. In addition, the Scout never counts as all alone and may operate independently throughout the game."
        },
        {
          "name": "Traitor",
          "text": "Due to the treacherous treatment the Hobgoblins have shown towards their greenskin cousins, the Hobgoblin is subject to the hatred of all greenskin races (Orcs & Goblins and Black Orcs) and a warband that hires the Scout may never take any other greenskin Hired Swords."
        }
      ],
      "uniqueSkills": {
        "tableName": "HOBGOBLIN SKILLS",
        "skills": [
          {
            "name": "Spy",
            "text": "Before the battle commences but after deployment, the player controlling the Hobgoblin Scout may re-deploy D3 models (not including the Scout), using the normal deployment rules. If the player chooses not to do this, then the Scout may be set up anywhere on the board that is not within 18\" of any enemy model."
          },
          {
            "name": "Potshot",
            "text": "Living in the saddle teaches a Scout to hunt by drawing his shortbow while moving at full pelt. The Scout may fire a bow when running with a -2 to hit modifier."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:1977-2010"
    },
  },
  {
    id: "ninja", name: "Ninja", hireCost: {"base":70,"text":"70 +3D6","dice":"3D6"}, upkeep: null, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf#page=2))",
      "hireLine": "70 +3D6 gold crowns to hire",
      "flavour": "Deadly assassins, known as ninjas are perfectly trained bravoes and thieves. Hailing from a distant empire called Nippon they are the ultimate hired killers.",
      "mayBeHired": "Battle Monks of Cathay and any warband except Skaven, Orcs & Goblins, Beastmen, Marauders of Chaos, Norse and Chaos Dwarfs may hire a Ninja.",
      "rating": "A Ninja increases the warband's rating by +45 points.",
      "profiles": [
        {
          "name": "Ninja",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 5,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Pair of Swords, Throwing Stars, Rope & Hook and one Smoke Bomb.",
      "skills": "Expert Swordsman, Knife-Fighter, Scale Sheer Surfaces and [Art of Silent Death](/docs/warbands/grade-1c-warbands/battle-monks-of-cathay#special-rules-2). He also has the [Lighning Speed](/docs/warbands/grade-1c-warbands/battle-monks-of-cathay#lightning-speed) and [Leap of Faith](/docs/warbands/grade-1c-warbands/battle-monks-of-cathay#leap-of-faith) skills from the Battle Monks special skills.",
      "specialRules": [
        {
          "name": "Strictly Business",
          "text": "The Ninja is hired for one specific job only. Therefore the Ninja has no upkeep cost and automatically leaves the warband after the battle for which he was hired. This means that he cannot gain Experience either, of course."
        },
        {
          "name": "Secrecy",
          "text": "The Ninja is a maverick and does not accompany the warband into battle side by side. He does not count as part of the warband for purposes of Rout tests."
        }
      ],
      "sourceFile": "04-hired-swords.md:2012-2036"
    },
  },
  {
    id: "pyromaniac", name: "Pyromaniac", hireCost: {"base":25,"text":"25 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf#page=2))",
      "hireLine": "25 gold crowns to hire +10 gold crowns upkeep",
      "flavour": "Cathay is well known for its spectacular fireworks. Beware of those who have the knowledge but not the mind to master these mesmerising displays of fire for visual effects alone.",
      "mayBeHired": "Merchant Caravans, Battle Monks of Cathay and Mercenaries may hire a Pyromaniac.",
      "rating": "A Pyromaniac increases the warband’s rating by +9 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Pyromaniac",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Fireworks, Firecrackers (unlimited).",
      "skills": "The Pyromaniac must choose from his special skills when he gains a new skill – see below.",
      "specialRules": [
        {
          "name": "Crazed Firestarter",
          "text": "The Pyromaniac loves nothing more than the lights and sparks of his fireworks. Each turn he either starts one of his rockets or throws some of his firecrackers at hostile animals. Therefore he will move but never run or charge. If he is attacked he will fight back normally."
        },
        {
          "name": "Rockets",
          "text": "In every shooting phase the Pyromaniac starts one rocket. Use the artillery dice to determine how far the rocket flies. The initial direction can be controlled by the Pyromaniac. Unless an object is hit on the way, place a marker there. From then on, in every shooting phase each rocket will keep on flying a distance determined with the artillery dice and in a direction randomly determined with the scatter dice until it hits an object.\n\nAnything hit by a rocket suffers an automatic Strength 4 hit. In addition, objects hit by a rocket are set on fire on a roll of 4+.\n\nWhenever the artillery die scores a misfire, the rocket detonates immediately. Roll on the following table to determine the effect of the fireworks.\n\n| D6 | Result |\n| --- | --- |\n| 1 | **Nothing.** The rocket falls to the ground without any further effect. |\n| 2-3 | **Zishh!** Re-roll the artillery dice and move the rocket with twice the scored number. |\n| 4-5 | **Spectacle:** The rocket explodes with colourful lights. All models within 2D6\" must pass a Ld test or are distracted for the turn. Distracted models are automatically hit in close combat and cannot attack back. |\n| 6 | **Explosion:** The rocket explodes causing an automatic S4 hit to all models within D6\". |"
        }
      ],
      "uniqueSkills": {
        "tableName": "PYROMANIAC SKILLS",
        "skills": [
          {
            "name": "Rocket Science",
            "text": "The Pyromaniac has brought the detonation of fireworks to perfection and may modify the roll on the fireworks table by +1/–1."
          },
          {
            "name": "Display Artist",
            "text": "Instead of rolling the artillery die the Pyromaniac may make an Initiative test to have the rocket detonate immediately. Otherwise roll the artillery die as usual."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:2038-2079"
    },
  },
  {
    id: "swordsmith", name: "Swordsmith", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/hiredswords/btb/btb%20Soldiers%20Of%20Fortune.pdf#page=3))",
      "hireLine": "60 gold crowns to hire +15 gold crowns upkeep",
      "flavour": "Little is known of the mysterious techniques passed from one generation of swordsmith to the next or of the individuals who keep them secret. The two constants are the guarded skills of their smithery and the astounding beauty of their daughters.",
      "mayBeHired": "Merchant Caravans, Battle Monks of Cathay, Witch Hunters, Sisters of Sigmar and Mercenary warbands may hire a Swordsmith.",
      "rating": "A Swordsmith increases the warband’s rating by +10 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Smith",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Hammer, Toughened Leathers.",
      "skills": "A Swordsmith may choose from Academic and Strength skills when he gains a new skill. In addition, there is a skill unique to Swordsmiths as detailed below, which he can choose instead of normal skills.",
      "specialRules": [
        {
          "name": "Master Craftsman",
          "text": "When Heroes from your warband search for Cathayan longswords and Dragon Swords the rarity of these items is decreased by –1 for every two Experience points the Swordsmith has."
        }
      ],
      "uniqueSkills": {
        "tableName": "SWORDSMITH SKILL",
        "skills": [
          {
            "name": "Honing",
            "text": "If the Swordsmith wasn’t taken out of action during a battle he may hone the blades of up to three swords, including similar bladed weapons such as Dragon Swords, giving them the Cutting Edge special rule for the next battle."
          },
          {
            "name": "Farrier",
            "text": "Between each battle the Swordsmith freshly shoes all equine beasts in the warband. Newly shod equines are much less likely to suffer a fatal fall during battle! Whenever a Horse, Mule, Warhorse, Elven Steed or a Chaos Centaur is taken out of action, remove the creature from the warband roster on a 1 instead of a 1 or 2."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:2081-2109"
    },
  },
  {
    id: "beggar", name: "Beggar", hireCost: {"base":10,"text":"10 gc"}, upkeep: {"base":5,"text":"5 gc"}, grade: "2a", source: "Fanatic Online 94",
    detail: {
      "sourceLine": "Source: Fanatic Online 94 ([PDF](https://broheim.net/downloads/fo/94NewHiredSwords.pdf))",
      "hireLine": "10 gold crowns to hire + 5 gold crowns upkeep",
      "flavour": "The streets of Mordheim crawl with the poor and destitute. They scratch an existence by digging through the wreckage of this black city for any meager supply of food. As such, these poor humans will do just about anything for gold.",
      "mayBeHired": "Such is their desperation, a Beggar will hire itself out to any warband. Though evil warbands will have to pay 15 gold crowns for their initial hire, as the Beggar knows he may not survive the company long.",
      "rating": "A Beggar increases a warband's rating by +8 points, plus 1 point for each Experience point the has.",
      "profiles": [
        {
          "name": "Beggar",
          "stats": {
            "M": 4,
            "WS": 1,
            "BS": 1,
            "S": 2,
            "T": 2,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 5
          }
        }
      ],
      "weaponsArmour": "Club",
      "skills": "A Beggar may choose from Speed skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Scrounge",
          "text": "Such is the Beggar's skill at scrounging through the ruins of Mordheim, at the end of each battle that the Beggar was not put out of action, he adds an extra die of exploration to your pool."
        },
        {
          "name": "Not a Threat",
          "text": "as a Beggar proves hardly a threat to any true warrior, warbands may ignore Beggar for purposes of shooting at the nearest target and charging another enemy within 2” of the Beggar."
        }
      ],
      "sourceFile": "04-hired-swords.md:2118-2142"
    },
  },
  {
    id: "chaos_fury", name: "Chaos Fury", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Mordheim Facebook Group",
    detail: {
      "sourceLine": "Source: Mordheim Facebook Group ([PDF](https://broheim.net/downloads/hiredswords/facebook/Chaos%20Fury.pdf))",
      "hireLine": "30 gold crowns to hire + 20 gold crowns upkeep",
      "flavour": "Known as the Crows of Chaos, Furies are Lesser Daemons made from the accretion of magical energy that has been corrupted by raw emotion. They are fierce creatures with leathery wings, bestial horns, and inhumanly feral faces. Though more than a match for most mortals, Furies are amongst the lowliest denizens of the Realms of Chaos and are not bound to any particular Dark Power. Because they make their home right on the edge of reality, Furies are among the first Daemons to enter the material world when the winds of magic blow.\n\nFuries are rumored to haunt forlorn ruins, and tales are told of small caravans and lone travellers being ambushed by murderous flocks of these Lesser Daemons all across the mountains of the Empire. Several of these beasts seem to be drawn to the profane contamination of the City of the Damned, where the veil between worlds is thin. As they have no patron and are among the weakest of their kin, Furies are often summoned by Daemonologists who are seeking a more compliant minion.",
      "mayBeHired": "All warbands devoted to Chaos (such as the Cult of Possessed and Beastmen Raiders) may attempt to hire a Fury once after each game by having a spell-caster in the warband attempt a summoning ritual. The Chaos Fury cannot be hired by any other means. The spell-caster must pay the hiring fee\\* and pass a Leadership test. These dark rituals are not without risk and on a roll of 2 or 12 the ritual automatically fails and the spell-caster is plagued by horrific visions of the Empyrean and must pass a Toughness test or miss the next game.  \n\\* _The hiring fee represents the ingredients for performing the summoning ritual and are consumed regardless of the success of the ritual._",
      "rating": "The Fury increases the warband's rating by +25 points.",
      "profiles": [
        {
          "name": "Chaos Fury",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 2,
            "Ld": 10
          }
        }
      ],
      "weaponsArmour": "A Fury has razor-sharp claws with which it tears at its prey and is made from raw magic itself. It has no need for weapons or armour.",
      "skills": "",
      "specialRules": [
        {
          "name": "Fear",
          "text": "Lesser Daemons are horrifying supernatural creatures that cause fear in all who gaze upon them."
        },
        {
          "name": "Daemonic Flesh",
          "text": "Due to their intangible nature, Daemons have a base armour save of 5+. This save is never modified but is completely negated by blessed or magic weapons and spells. The Daemon's attacks also count as magical."
        },
        {
          "name": "Daemonic Mind",
          "text": "Daemons do not have the same fears and ambitions as mortals, for they are emotions and mortal passions made manifest. A Chaos Fury is completely immune to all psychology and never gains experience."
        },
        {
          "name": "Daemonic Instability",
          "text": "Daemons are bound to the world by dark sorcery that is highly volatile and unstable. If taken out of action, a Chaos Fury is banished and effectively destroyed on a D6 roll of 1-3 (do not roll for injury). If the spell-caster that summoned the Daemon is killed or leaves the warband, the Daemon is banished from whence it came."
        },
        {
          "name": "Fly",
          "text": "Instead of moving normally (unless knocked down or stunned), a Chaos Fury may choose to:\n\n-   Move anywhere within 12\" including into base contact with an enemy (in which case it counts as charging).\n-   Move vertically without needing to climb.\n-   Jump from any height without falling."
        },
        {
          "name": "Malicious",
          "text": "If a Chaos Fury takes an enemy model out of action, the Daemon spends its next movement phase stationary while it continues to torture and torment its victim. This effect immediately ends if an enemy model is within 8\", or if the Chaos Fury is the target of missile weapons and/or enemy spells."
        }
      ],
      "sourceFile": "04-hired-swords.md:2144-2181"
    },
  },
  {
    id: "cursed_hillman", name: "Cursed Hillman", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "2a", source: "Fanatic Online 49",
    detail: {
      "sourceLine": "Source: Fanatic Online 49 ([PDF](https://broheim.net/downloads/fo/49CursedHillman.pdf))",
      "hireLine": "60 gold crowns to hire + 25 gold crowns upkeep",
      "flavour": "Cursed by lycanthrope, a man will never find a home within any civilized domain. Should his presence be discovered, he will be hunted relentlessly, pushed out by those strong enough to fend him off. They learn to live a life of solitude, existing in the deep darkness of the dreaded woods within the Empire. Of course, living side by side with hoards of beastmen, terrifying undead and roving bands of Cultists is never easy. However some of these damned individuals find themselves able to hire-on with an unscrupulous band through feats of strength or skill. Whether they hope to earn enough to pay for a hopeful cure, or simply enjoy the twisted carnal delights available to them whilst in the company of chaos, they continue to serve with their purchased loyalty.",
      "mayBeHired": "A Cursed Hillman can be hired by the Undead, Beastmen or Possessed warbands.",
      "rating": "A Cursed Hillman increases the warbands rating by +20 points, plus 1 point for every experience he has.",
      "profiles": [
        {
          "name": "Man",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 8
          },
          "rawStats": [
            "4",
            "3",
            "4",
            "3",
            "3*",
            "1",
            "3",
            "1",
            "8"
          ]
        },
        {
          "name": "Wolf",
          "stats": {
            "M": 7,
            "WS": 4,
            "BS": 0,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 5,
            "A": 2,
            "Ld": 6
          },
          "rawStats": [
            "7",
            "4",
            "0",
            "4",
            "4",
            "2",
            "5",
            "2(3)",
            "6"
          ]
        }
      ],
      "weaponsArmour": "While in man-form, the Hillman is armed with an Axe, a Dagger, and a Longbow. He wears a heavy fur cloak which offers him an AS of 5+ versus ranged attacks, and 6+ in close combat.\n\nWhen in wolf-form, all garments and weapons are discarded. These are collected after the battle. The werewolf uses only its teeth and claws in close combat, and suffers no penalties for doing so.",
      "skills": "A Cursed Hillman can choose from Shooting and Speed skills, as well as those listed below.",
      "specialRules": [
        {
          "name": "Hunter",
          "text": "The Cursed Hillman has had to learn to survive in the bleak wilderness of the Empire. As such, he is incredibly skilled with his bow. He may move at half-rate, and still fire his bow without penalty."
        },
        {
          "name": "Thin Flesh",
          "text": "Due to his constant changing into lupine form and back, his flesh has weakened to ease the transformation. As such, he counts as having -1T in hand to hand combat."
        },
        {
          "name": "Lycanthrope",
          "text": "The Cursed Hillman is a werewolf. Any time he loses a wound, he must roll a D6. On a roll of 4+, the beast within escapes and he transforms into a werewolf. Ignore any injury table rolls. Should he not transform, roll on the injury table at -1 (thus knocked down is 2-3, stunned is 4-5, and OOA is on a 6 only). While in wolf-form, he has a bonus Bite attack. This is resolved at -1S."
        }
      ],
      "uniqueSkills": {
        "tableName": "SPECIAL SKILLS",
        "skills": [
          {
            "name": "Control",
            "text": "So long has he been cursed that the Hillman can attempt to call upon the beast within at will. The Hillman can transform into the Werewolf during the shooting phase on a D6 roll of 2+. Should this roll fail, the Hillman must remain static as the excruciating transformation takes longer than anticipated. He counts as being knocked down, and will be completely transformed by the beginning of his controller’s next turn."
          },
          {
            "name": "Rage",
            "text": "The Hillman calls upon his curse to imbue himself with supernatural powers. He gains +1WS, +1S, +1I and an extra attack as his off-hand has transformed into a claw. This skill can only be taken if the Control skill is already chosen."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:2183-2218"
    },
  },
  {
    id: "dark_mage", name: "Dark Mage", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Letters of the Damned 6",
    detail: {
      "sourceLine": "Source: Letters of the Damned 6 ([PDF](https://broheim.net/downloads/lod/LOD6.pdf#page=4))",
      "hireLine": "35 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Hedge Wizard, Warlock, Witch; all of these are used to describe those who are touched with the gift. The Dark Mage treads a different path than those typically associated with these titles, however. Bent on the destruction of Necromancy, the Dark Mage practices the true dark arts, and treats them with the respect they deserve.",
      "mayBeHired": "Human Mercs, “Good” aligned warbands. May not be hired by any Undead, Sisters of Sigmar or Witch Hunters.",
      "rating": "A Dark Mage increases the warband's rating by 18 points, plus 1 point for each experience accumulated.",
      "profiles": [
        {
          "name": "Dark Mage",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Staff",
      "skills": "The Dark Mage may select skills from the Academic skill list, as well as further spells as described above.",
      "specialRules": [
        {
          "name": "Wizard",
          "text": "The Dark Mage is a wizard, and may randomly generate a spell from the Dark Magic list, and may gain more spells from that or from the [Lesser Magic](/docs/magic/lesser-magic) list found in the Core Rulebook."
        },
        {
          "name": "Despise Despoilers",
          "text": "A Dark Mage Hates Necromancers, and anyone who casts spells from the Necromancy or the Dreaded Scrolls of Nagash."
        },
        {
          "name": "Self Assured",
          "text": "Dark Mages are immune to the effects of All Alone tests and will never flee as a result."
        }
      ],
      "otherSections": [
        {
          "name": "Dark Magic",
          "text": "**1 - Banishment Difficulty 8**  \n_Pulling the energies of death to him, the Dark Mage dispels the power of the undead._  \nAll Undead within 4” of the Dark Mage must take an unmodified Leadership Test or suffer a S4 hit.\n\n**2 - Soul Render Difficulty 8**  \n_For the most brief of moments, the Mage centers dark energies upon an unlucky foe._  \nSoul Render is a magic missile spell, with a range of 18 inches. If successfully cast, the spell causes D3 S3 hits.\n\n**3 - Shade Mount Difficulty 8**  \n_Darkness forms about the caster, carrying him aloft on wings of shadow._  \nThis spell may be cast on the wizard himself, or a hero within 8 inches of him. Upon a successful casting, the model may immediately fly up to 12 inches. Should this movement bring the model into Base to Base contact with an enemy model, consider it a charge.\n\n**4 - Jozun’s Decay Difficulty 9**  \n_Ashes and dust. Focusing the dark energies, the wizard forces the very life from his opponent._  \nThis spell has a range of 12 inches. Upon a successful casting, the target must pass a Leadership Test, or suffer a one point reduction to its Toughness attribute. Each recovery phase the model must attempt to pass a Leadership Test, reducing its Toughness a further point for each failure. Should a model be reduced to 0 Toughness, it is removed from the game irrespective of how many wounds it has left. Should a Leadership Test be passed, the model must play the remainder of the game at its modified Toughness score. A model may not be targeted more than once per game.\n\n**5 - Cowel of Pain Difficulty 6**  \n_Nothing compares to the pain of the dark. Wrapping it about him like a cloak, the caster strengthens himself._  \nThe mage cannot be Stunned until his next magic phase. Treat 3-4 results as Knocked Down instead.\n\n**6 - Doom & Dark Difficulty 7**  \n_Dark energies coalesce about the mage, chilling the air and driving dread into all those around him._  \nAny model within 2” of the Dark Mage must take an immediate All Alone Test, even if in close combat. Should a model flee from Close Combat, free strikes occur as normal, assuming that there are combatants who have not failed their test."
        }
      ],
      "sourceFile": "04-hired-swords.md:2220-2272"
    },
  },
  {
    id: "dwarf_slayer_pirate", name: "Dwarf Slayer Pirate", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Fanatic Online 45",
    detail: {
      "sourceLine": "Source: Fanatic Online 45 ([PDF](https://broheim.net/downloads/fo/45DwarfSlayerPirate.pdf))",
      "hireLine": "30 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "In the ancient Dwarf stronghold of Barak-Varr is a great trade center, and many Dwarf merchant ships make port in its harbors. The crew of these ships are some of the most cunning and skilled sailors in the old world. It is their charge not only to man the ships but also to protect the precious cargo of those ships, often rare Dwarven ales and treasures.\n\nShould one of these shipments be lost, whether captured, wrecked, or lost to the depths of the sea, a great dishonor is placed on both captain and crew of the ship. This shame is often too much to bear, and occasionally such a Dwarf seaman will undertake the Slayer Oath, but will retain his old habits and combat preferences to those of the traditional troll slayers.\n\nThe Slayer Pirate “hired guns” will often turn to the city of the damned to seek out an honorable death in combat.",
      "mayBeHired": "A Dwarf Slayer Pirate may be hired by Mercenaries, Averlanders, Ostlanders, Kislevites, Witch Hunters, Tileans, Dwarf Treasure Hunters, Bandits, and Pirates. Any warband wishing to hire a Slayer Pirate that also contains an elf must pay 20gc upkeep instead of 15gc as the Dwarf will require compensation for putting up with the Elf.",
      "rating": "A Dwarf Slayer Pirate increases the warband's rating by 14 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Dwarf",
          "stats": {
            "M": 3,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 4,
            "W": 1,
            "I": 2,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "A Sword, Superior Black Powder, and many many Pistols.",
      "skills": "A Dwarf Slayer Pirate may choose from Combat and Shooting skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Deathwish",
          "text": "It is the goal of the Slayer Pirates to die in combat and they are therefore immune to psychology and will never need to test if fighting alone."
        },
        {
          "name": "Hard to Kill",
          "text": "Dwarfs are tough, resilient individuals who are only taken out of action on an injury roll of 6. Treat a roll of 5 as stunned instead."
        },
        {
          "name": "Hard Head",
          "text": "Dwarf Slayer Pirates ignore the concussion special rule, they are not easy to knock out!"
        },
        {
          "name": "Festooned with Pistols",
          "text": "Dwarf Slayer Pirates carry so many pistols into battle that they never have to reload, they always have a new pistol primed and ready to fire. The only exception is hand-to-hand combat. The Slayer Pirate will not have time to draw a new pistol every round of hand-to-hand combat, he may only use pistols in the first round. In subsequent rounds of hand-to-hand combat the pistol should be counted as a club. He may draw another pistol once he is out of combat or all of his opponents are knocked down or stunned."
        },
        {
          "name": "Raging Drunk",
          "text": "The combination of being a Dwarf and spending the better part of life on the sea means Slayer Pirates usually know where to acquire some fine Dwarven Ale. A warband including a Slayer Pirate treats Bugman's Ale as Rare 6, but must pay an extra 2d6 gold crowns to compensate for the copious amounts of ale that the Slayer Pirate will consume."
        }
      ],
      "sourceFile": "04-hired-swords.md:2274-2308"
    },
  },
  {
    id: "emissary_of_chaos", name: "Emissary of Chaos", hireCost: {"base":50,"text":"50 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Fanatic Online 94",
    detail: {
      "sourceLine": "Source: Fanatic Online 94 ([PDF](https://broheim.net/downloads/fo/94NewHiredSwords.pdf#page=3))",
      "hireLine": "50 gold crowns to hire + 20 gold crowns upkeep",
      "flavour": "From the northern wastes they come, the mortal voices of the gods of chaos. They flock to Mordheim, for here Chaos rules. Their mission is to aid all those who would further their ends, and the ends of their masters. The Emissaries of Chaos are powerful warriors, their sole purpose in life to bring death and suffering.",
      "mayBeHired": "Dark Elves, Possessed, Carnival of Chaos, Norse, and Beastmen may hire an Emissary of Chaos.",
      "rating": "An Emissary of Chaos increases a warband's rating by +25 points, plus 1 point for each point of Experience.",
      "profiles": [
        {
          "name": "Emissary of Chaos",
          "stats": {
            "M": 4,
            "WS": 5,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "Chaos Armour (4+ save), Helmet, Shield, Sword.",
      "skills": "An Emissary of Chaos may choose from the Combat and Strength skills, as well as the Academic skill (if an Emissary of Tzeentch) when he gains an advancement.",
      "specialRules": [
        {
          "name": "Special Skills",
          "text": "An Emissary of Chaos's special skills depend on which god he serves.\n\n-   **Khorne:** Frenzy, +1A\n-   **Tzeentch:** Gains 1 spell from the Chaos Rituals (may cast spells while wearing armour)\n-   **Nurgle:** All attacks are poisoned (as black lotus), cause fear\n-   **Slaanesh:** All enemies must pass a Leadership test to charge Emissary. Those that do engage the Emissary in close combat suffer a -1 to their to hit rolls."
        }
      ],
      "sourceFile": "04-hired-swords.md:2310-2337"
    },
  },
  {
    id: "estalian_diestro", name: "Estalian Diestro", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Letters of the Damned 2",
    detail: {
      "sourceLine": "Source: Letters of the Damned 2 ([PDF](https://broheim.net/downloads/lod/LOD2.pdf#page=6))",
      "hireLine": "35 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Having left their home, the Diestro converge upon Mordheim to make their fortune. It is not often that the skilled of Estalia venture this far into the Empire, however Mordheim has proven too ripe an opportunity to resist. Masters of their art, the Diestro hire themselves out to those who can afford their skills, taking every chance to illustrate their superior training.",
      "mayBeHired": "Anyone save for Chaotic (Possessed, Carnival, Beastmen, Skaven), Undead (of any kind), Tilean or Osterlander warbands may hire the Diestro.",
      "rating": "A Diestro increases the warband's rating by 18 points, plus 1 point for each experience accumulated.",
      "profiles": [
        {
          "name": "Diestro",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Rapier, Main Gauche, Light Armour.",
      "skills": "A Diestro may choose from the Combat or Speed skill lists.",
      "specialRules": [
        {
          "name": "Rapier",
          "text": "The Rapier is a long thin blade commonly used by duelists. It is a deadly, sharp weapon capable of delivering multitude of blows."
        },
        {
          "name": "Range",
          "text": "Close Combat  \n**Strength:** As User  \n**Special Rules:** Parry, Barrage\n\n-   **Parry:** Like all swords, you may use a rapier to parry hand-to-hand combat.\n-   **Barrage:** A warrior armed with a rapier rolls to hit and to wound as normal. However, if you manage to hit your opponent but fail to wound you may attack again just as if you had another attack but at –1 to hit (down to a maximum of needing a ‘6’ to hit). Any additional attacks gained in this fashion also benefit from the Barrage special rule."
        },
        {
          "name": "Main Gauche",
          "text": "Slender but of good steel, the Main Gauche is often employed by professional fighters out of Estalia. Perfectly balanced, they spin about in their wielder's hand, striking and parrying blows alike."
        },
        {
          "name": "Range",
          "text": "Close Combat  \n**Strength:** As User  \n**Special Rules:** Main Gauche\n\n-   **Main Gauche:** The main gauche is a special dagger, which Diestros use with their offhand (which is in most cases the left hand, hence the name). Any Estalian Diestro has the option to either use this weapon as a dagger, thus gaining an additional attack, OR to parry a blow with it as if it was a sword. In the latter case, they gain NO additional attack. The player may choose each turn in which way the fighter will use the main gauche."
        }
      ],
      "sourceFile": "04-hired-swords.md:2339-2376"
    },
  },
  {
    id: "the_fallen_sister", name: "The Fallen Sister", hireCost: {"base":55,"text":"55 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Fanatic Online 25",
    detail: {
      "sourceLine": "Source: Fanatic Online 25 ([PDF](https://broheim.net/downloads/fo/25FallenSister.pdf)",
      "hireLine": "55 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Wizards have little to say in whether the world of magic touches them or not. Even those who have devoted their life to Sigmar are subject to the bane that is chaos. When one who has trained within the Abbey upon the Rock for many years discovers that she possesses the very skills they are trained to stamp out, some offer themselves up as heretics and are purged. Other more desperate women flee into the hell that is Mordheim, hoping to live their cursed lives out as a Fallen of Sigmar.",
      "mayBeHired": "Any warband except Skaven, Undead, Witch Hunters or Sisters of Sigmar may hire a Fallen Sister.",
      "rating": "A Fallen Sister increases the warband's rating by +22 points, plus 1 point for each experience she has.",
      "profiles": [
        {
          "name": "Fallen Sister",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Steel Whip, Sigmarite Warhammer, Dagger, Sling, Light Armour.",
      "skills": "A Fallen Sister may choose from Combat, Strength and Speed skill lists when she gains a new level, or she may randomly choose a new spell from the [Lesser Magic](/docs/magic/lesser-magic) list.",
      "specialRules": [
        {
          "name": "Wizard",
          "text": "A Fallen Sister has been cursed with the ability to use magic. She has one spell generated at random from the Lesser Magic list."
        },
        {
          "name": "Warrior Wizard",
          "text": "A Fallen Sister has learned to cast her spells whilst wearing her customary armour and garb."
        },
        {
          "name": "Ashamed and Afraid",
          "text": "A Fallen Sister has risked much in her attempts to escape the Abbey and the notice of her former sisters. She must make a Leadership test in order to charge any member of a Sisters of Sigmar warband, or a Warrior-Priest from a Witch Hunters warband."
        }
      ],
      "sourceFile": "04-hired-swords.md:2378-2404"
    },
  },
  {
    id: "goblin_lantern_bearer", name: "Goblin Lantern Bearer", hireCost: {"base":15,"text":"15 gc"}, upkeep: {"base":5,"text":"5 gc"}, grade: "2a", source: "Fanatic Online 89",
    detail: {
      "sourceLine": "Source: Fanatic Online 89 ([PDF](https://broheim.net/downloads/fo/89RunnersUp.pdf#page=2))",
      "hireLine": "15 gold crowns to hire + 5 gold crowns upkeep",
      "flavour": "It's tough being a goblin, especially if you feel you have talent. The orcs don't take you seriously, the other goblins are always starting fights, and there is the continual threat of being fed to the trolls. Occasionally, a smart goblin will go off and try to earn a living. If he is lucky, he might actually survive for a while. Freelance goblins have found many jobs around Mordheim. Of most use to the many warbands of Mordheim are goblin lantern bearers. For a very small fee, the hired goblin will carry a lantern around the ruins of Mordheim and try to find those pesky hidden enemies.",
      "mayBeHired": "?",
      "rating": "A Goblin Lantern Bearer increases the warband's rating by +5 points plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Goblin Lantern Bearer",
          "stats": {
            "M": 4,
            "WS": 2,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 5
          }
        }
      ],
      "weaponsArmour": "Lantern, Dagger.",
      "skills": "A Goblin Lantern Bearer may choose skills from the Speed list.",
      "specialRules": [
        {
          "name": "Smart (for a Goblin)",
          "text": "The Goblin Lantern Bearer has survived partially on his brains. Being one of the smarter from the litter, he does not suffer from animosity as most goblins do."
        },
        {
          "name": "Very Lucky",
          "text": "The Goblin Lantern Bearer has survived for some time by his luck. If the goblin is taken out of action during the game, roll for his injuries with the following results:  \n1 – Lost  \n2-6 – Survives."
        },
        {
          "name": "Small Size",
          "text": "Due to their small size, Goblin Lantern Bearers can fit into very small spaces. If the goblin is not taken out of action during the fight, then they can help in the search for wyrdstone. When rolling for wyrdstone, roll dice as normal for the warband. The Goblin Lantern Bearer adds +3 to the total dice roll when determining the number of shards found (i.e. if the dice total is 15, then add +3 for a total of 18, and thus 4 shards found instead of 3)."
        }
      ],
      "sourceFile": "04-hired-swords.md:2406-2434"
    },
  },
  {
    id: "gravesman", name: "Gravesman", hireCost: {"base":25,"text":"25 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Letters of the Damned 5",
    detail: {
      "sourceLine": "Source: Letters of the Damned 5 ([PDF](https://broheim.net/downloads/lod/LOD5.pdf#page=4))",
      "hireLine": "25 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Welcome to Crazy Grom's. Nowhere else in Mordheim will you find a better assortment of hirelings. If you don't find what you're looking for, then you're not going to find it anywhere! There is never a shortage of bodies in Mordheim, and thus there is never a shortage of work for the gravesmen. Disease and pestilence run rampant in the city-proper, but along the outer skirts of Mordheim where the temporary settlements and encampments of those daring or foolish lie, a certain level of order must be maintained.",
      "mayBeHired": "Anyone save for Undead (of any kind), or Carnival of Chaos warbands may hire the Gravesman.",
      "rating": "A Gravesman increases the warband's rating by 15 points, plus 1 point for each experience accumulated.",
      "profiles": [
        {
          "name": "Diestro",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Shovel (Halberd), [Pry bar](/docs/warbands/grade-2a-warbands/grave-robbers#pry-bar) & dagger.",
      "skills": "A Gravesman may choose from the Combat or Strength skill lists.",
      "specialRules": [
        {
          "name": "He’s o’er dere",
          "text": "A Gravesman knows what’s worth saving. Should a Hero die (rolls 11-15 on the Serious Injuries Chart post-game) you may retain his equipment on a D6 roll of 4+ thanks to the Gravesman’s instinctive greed. This occurs only if you pay the Gravesman’s upkeep; if you do not, he keeps what he has found."
        }
      ],
      "sourceFile": "04-hired-swords.md:2436-2458"
    },
  },
  {
    id: "halfling_knight", name: "Halfling Knight", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "2a", source: "Fanatic Online 94",
    detail: {
      "sourceLine": "Source: Fanatic Online 94 ([PDF](https://broheim.net/downloads/fo/94NewHiredSwords.pdf))",
      "hireLine": "20 gold crowns to hire + 10 gold crowns upkeep",
      "flavour": "While few and far between as they are, it is not unheard of for a halfling to strive for a little more renown than their common ilk are bred for. Those that hear the call for glory rise up as knights among these little folk, venturing forth to fight evil wherever it may be. As such, many Halfling Knights find themselves led to Mordheim, city of the damned.\n\n/\\*reduced movement due to barding",
      "mayBeHired": "Any good aligned warband may hire a Halfling Knight.",
      "rating": "A Halfling Knight increases a warband's rating by +12 points, plus 1 point for each Experience point the has.",
      "profiles": [
        {
          "name": "Knight",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 2,
            "T": 2,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 9
          }
        },
        {
          "name": "Hound",
          "stats": {
            "M": 5,
            "WS": 4,
            "BS": 0,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 5
          },
          "rawStats": [
            "5*",
            "4",
            "0",
            "4",
            "3",
            "1",
            "4",
            "1",
            "5"
          ]
        }
      ],
      "weaponsArmour": "Cavalry Spear, Sword, Heavy Armour, Helmet, Shield, Hound, Barding.",
      "skills": "A Halfling Knight may choose from Combat and Speed skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Slay Large Creature",
          "text": "A Halfling Knight, when charging a Large sized creature, gains +1S (this is in addition to the +1S he gains simply for charging with a cavalry spear)."
        }
      ],
      "sourceFile": "04-hired-swords.md:2460-2485"
    },
  },
  {
    id: "imperial_tactician", name: "Imperial Tactician", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Fanatic Online 94",
    detail: {
      "sourceLine": "Source: Fanatic Online 94 ([PDF](https://broheim.net/downloads/fo/94NewHiredSwords.pdf))",
      "hireLine": "40 gold crowns to hire + 20 gold crowns upkeep",
      "flavour": "The Empire is famed for its superior generals and expert field commanders. When not in war, these same tacticians can be found all across the Empire, honing their skill through skirmish, border patrols, and even leading, or aiding warbands in the ruins of Mordheim.",
      "mayBeHired": "Any human warband may hire an Imperial Tactician.",
      "rating": "An Imperial Tactician increases a warband's rating by +16 points, plus 1 point for each point of Experience.",
      "profiles": [
        {
          "name": "Tactician",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 5,
            "A": 1,
            "Ld": 9
          },
          "rawStats": [
            "4(3)",
            "4",
            "3",
            "3",
            "3",
            "1",
            "5",
            "1",
            "9"
          ]
        }
      ],
      "weaponsArmour": "Two-handed sword, plate armour (4+ save, -1M), Helmet, Dagger.",
      "skills": "An Imperial Tactician may choose from Combat and Strength skills when he gains an advance. Furthermore, an Imperial Tactician may also choose from the following skills:\n\n-   **Organized Search Party:** The warband may re-roll one exploration die.\n-   **Send False Signals:** By misleading the opposing warband(s), an Imperial Tactician can make them deploy their forces in a way beneficial to his own warband. Thus, after all warbands have deployed (but before the hiring player has used the Expert Tactician ability), the player controlling the Imperial Tactician may move 1 member from each opposing warband D6” in any direction. This move may not move a warband member off the board, nor may it place a member of the warband in direct harm (you can't force a warrior to jump off a building!).",
      "specialRules": [
        {
          "name": "Expert Tactician",
          "text": "At the start of the game, after all warbands have been deployed, the Imperial Tactician may then recommend up to D3+1 changes to your deployment (IE, you may change the starting position of up to D3+1 of your warriors)."
        },
        {
          "name": "Read the Battle",
          "text": "As the Imperial Tactician has an eye for reading how any battle is going, he knows when a cause is lost or not. As long as the Imperial Tactician is not out of action, the hiring warband automatically passes the first rout test they are required to make."
        }
      ],
      "sourceFile": "04-hired-swords.md:2487-2514"
    },
  },
  {
    id: "knight_of_the_white_wolf", name: "Knight of the White Wolf", hireCost: {"base":55,"text":"55 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Mordheim Facebook Group",
    detail: {
      "sourceLine": "Source: Mordheim Facebook Group ([PDF](https://broheim.net/downloads/hiredswords/facebook/Knight%20of%20the%20White%20Wolf.pdf))",
      "hireLine": "55 gold crowns to hire + 20 gold crowns upkeep",
      "flavour": "The oldest of the Templar Orders in the Empire, Knights of the White Wolf are known for their strict military discipline and ferocious fighting style. Hailing from Middenland, they are commonly adorned in gleaming armour with cloaks made of wolf-pelts, accompanied by wild hair and great beards.\n\nAlso known as White Wolves, the order dutifully serves Ar-Ulric, leader of the Cult of Ulric who collectively worships Ulric; God of Battle, Wolves, and Winter. Ulric’s religious following is one of the largest in the Empire, second only to the Cult of Sigmar.\n\nKnights of the White Wolf are typically mounted, armed with large cavalry hammers that they swing wildly over their heads during charges. However, some are often seen on foot wielding even greater two-handed warhammers, bellowing terrifying howls at their enemies as they pledge oaths to Ulric, praying he grant them strength in battle.",
      "mayBeHired": "Any Human Mercenary warband may hire a Knight of the White Wolf. However, he will never join or stay with a warband which includes a Warrior Priest, as they are an agent of an opposing cult.",
      "rating": "A Knight of the White Wolf increases the warband’s rating by +18 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Knight",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "The Knight wears Heavy Armour and a Wolfcloak. He wields a great ornate two-handed hammer which counts as a Horseman’s Hammer.",
      "skills": "Knights of the White Wolf start with the Unstoppable Charge and Ride Warhorse skills, and may choose from Combat, Strength, or Cavalry skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Pride of Ar-Ulric",
          "text": "Infamous throughout the Empire, the White Wolves’ courage and martial prowess is nothing short of inspiring to your average warrior. Knights of the White Wolf may act as a Leader to their comrades, allowing them to use his Leadership characteristic as their own when taking Leadership tests. However, his Leadership value cannot be used for the purposes of rout tests."
        },
        {
          "name": "Cavalryman",
          "text": "The knight has left his mount behind before venturing into the city of the damned, but will use another if the warband wishes. Knights of the White Wolf may be given a Warhorse to ride (and no lesser steed) if the warband possesses one. This will grant him the usual Warhorse bonuses and increase the warband’s rating +5 per the normal Warhorse rules."
        },
        {
          "name": "Among Wolves",
          "text": "The Knight’s upkeep cost is halved if he is hired by a Middenheim warband, as he is obliged to work with his kin."
        }
      ],
      "sourceFile": "04-hired-swords.md:2516-2546"
    },
  },
  {
    id: "ninja_gnoblar", name: "Ninja Gnoblar", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "2a", source: "Mordheimer Information Centre",
    detail: {
      "sourceLine": "Source: Mordheimer Information Centre ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=25))",
      "hireLine": "35 gold crowns to hire + 10 gold crowns upkeep",
      "flavour": "Gnoblars or Hill Goblins are the goblinoid smaller \"cousins\" of normal goblins and orcs. Their range in size is about halfway between goblins and Snotlings. Their coloration is slightly darker skin than other goblinoids. They do not, however, live in the orc-goblin-snotling societies, but instead they spend their lives as pets of ogres of the Ogre Kingdoms.\n\nThough for the most part glad to be the slaves of Ogres, some Gnoblars eventually find their lives too hard in the east and mass together in massive armies that travel into the known world. Gnoblars have many sub-species, commonly known by their attributes, such as Wyrdstone Gnoblar, Lookout Gnoblar, Luck Gnoblar, Gnoblar-Blood-Gnoblars, Boglars, Toad-Gnoblars among others.\n\nMost people simply ignore gnoblars because they have bigger problems in their hands (the least not being the Ogres!), but this little git is not to be sneered at. Having spent some time spying the Celestial Dragon Monks of far east, this Gnoblar has some muscle to add in a fight!",
      "mayBeHired": "Except the Ogres, any warband that doesn't include any fear causing creatures may hire the Ninja Gnoblar. If the warband gains a model that causes fear, the Ninja Gnoblar will leave immediately - he may be skilled but he is still scared.",
      "rating": "A Ninja Gnoblar increases the warband’s rating by 8 points plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Ninja Gnoblar",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 6
          }
        }
      ],
      "weaponsArmour": "Ninja Robe (counts as Hardened Leathers), Shurikens (Throwing stars with Stealthy special rule) and Bo (gives an additional attack, may parry and requires both hands).",
      "skills": "A Ninja Gnoblar may choose from Shooting and Speed skills when he gains a new skill. In addition he can be given a unique special skill only available to him, noted below.",
      "specialRules": [
        {
          "name": "Stealthy",
          "text": "The Ninja Gnoblar can throw his shurikens while hidden without revealing his position to the enemy. The target model can take an Initiative test in order to try to spot the throwing Ninja. If the test is successful, the Gnoblar no longer counts as hidden."
        },
        {
          "name": "Rooftop to Rooftop",
          "text": "The Ninja Gnoblar is skilled in jumping over streets and gaps. He doesn't deduct the distance jumped from his movement. This means he can run 8\" and still jump the 3\"."
        },
        {
          "name": "Expert Rooftop Jumper",
          "text": "The Ninja is even more skilled in jumping on the roofs. He may jump up to 4\" and may re-roll a failed Initiative test when jumping or making a diving charge."
        }
      ],
      "sourceFile": "04-hired-swords.md:2548-2578"
    },
  },
  {
    id: "ogre_slave_master", name: "Ogre Slave Master", hireCost: {"base":90,"text":"90 gc"}, upkeep: {"base":35,"text":"35 gc"}, grade: "2a", source: "Fanatic Online 89",
    detail: {
      "sourceLine": "Source: Fanatic Online 89 ([PDF](https://broheim.net/downloads/fo/89OgreSlaveMaster.pdf))",
      "hireLine": "90 gold crowns to hire + 35 gold crowns upkeep",
      "flavour": "As of men, Ogre's too have fallen to the dark and corrupt ways of evil. Certain ruthless Ogre's have been recruited by the darker, sinister warbands lurking around Mordheim. They have one purpose, to capture others and force them to fight in their warbands. It's a cheaper alternative to forking out the hard earned gold coins for a low life hireling, and with scarce volunteers joining up with the evil warbands, who wouldn't hire a Ogre Slave Master?",
      "mayBeHired": "Possessed, Carnival of Chaos and Beastmen.",
      "rating": "The Slave Master increases your warband rating by +40 points, plus 1 point for each experience point he has.",
      "profiles": [
        {
          "name": "Ogre Slave Master",
          "stats": {
            "M": 6,
            "WS": 3,
            "BS": 2,
            "S": 4,
            "T": 4,
            "W": 3,
            "I": 4,
            "A": 2,
            "Ld": 7
          },
          "save": "6+"
        }
      ],
      "weaponsArmour": "Axe, Club, Light Armour.",
      "skills": "Can be taken from Combat and Strength Skills.",
      "specialRules": [
        {
          "name": "Slave Master",
          "text": "Slave Master works much the same as the Bounty Hunter, except that the \"mark\" becomes owned by the Slave Master at the end of a battle. (No reward money is earnt, as you would from the Bounty Hunter Skill, you just now own the \"mark\"), but gets the D3 experience if he survives and the warband has won as normal.\n\nThus the \"mark\" now works for the Slave Master's warband and will always be within 8\" of him (thanks to a mighty big chain shackled to the \"mark\" and held by the Slave Master). If the Slave Master is holding the shackles he can only use one weapon. The \"mark's\" weapons can be kept or sold depending on what the Slave Master warband player wants to do.\n\nIf the Slave Master is taken OOA in a battle and none of the Slave Master's warband members are within 8\" of the \"mark\", then the \"mark\" will automatically run for the nearest safe area (whether that's off the board, in which case it disappears forever, or towards its original warband). If the mark ever comes within 8\" of its original warband, then it automatically is controlled by the original owner of the \"mark\".\n\nIf the Slave Master is taken OOA in a battle and the mark is within 8\" of another figure from the Slave Master's warband, the \"mark\" will charge this closest model of that warband automatically in rage (treat as having hatred)."
        },
        {
          "name": "Fear",
          "text": "Ogres are large, threatening creatures that cause fear."
        },
        {
          "name": "Large Target",
          "text": "Ogres are Large Targets as defined in the shooting rules."
        }
      ],
      "sourceFile": "04-hired-swords.md:2580-2612"
    },
  },
  {
    id: "slaver", name: "Slaver", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "2a", source: "Fanatic Online 94",
    detail: {
      "sourceLine": "Source: Fanatic Online 94 ([PDF](https://broheim.net/downloads/fo/94NewHiredSwords.pdf#page=2))",
      "hireLine": "20 gold crowns to hire + 10 gold crowns upkeep",
      "flavour": "While many adventurers come to Mordheim for its lost treasures and the valuable Wyrdstone, there are those who come for a different currency altogether: slaves. The slaver is a warrior who asks little from the warband who hires him, save a pick of the freshest bodies.",
      "mayBeHired": "Any evil warband may hire a Slaver.",
      "rating": "A Slaver increases a warband's rating by +12 points, plus 1 point for each point of Experience.",
      "profiles": [
        {
          "name": "Slaver",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Spear, Net, Light Armour, Helmet, Dagger.",
      "skills": "A Slaver may choose from the Combat and Strength skills when he gains an advance.",
      "specialRules": [
        {
          "name": "Slaver",
          "text": "Any hero or henchman put out of action by the Slaver will automatically be Captured (as per roll 61 of the Heroes Serious Injuries Chart in the Mordheim Rulebook). Note that any hero or henchman captured must be sold. Heroes sell for D6 x10 gold crowns and Henchmen sell for D6 x3 gold crowns. If a warband cannot pay this price, then that particular hero or henchman is sold into slavery and removed from the roster."
        }
      ],
      "sourceFile": "04-hired-swords.md:2614-2636"
    },
  },
  {
    id: "swashbuckler", name: "Swashbuckler", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Fanatic Online 94",
    detail: {
      "sourceLine": "Source: Fanatic Online 94 ([PDF](https://broheim.net/downloads/fo/94NewHiredSwords.pdf#page=2))",
      "hireLine": "30 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Swashbucklers live for adventure. The more risky the quest, the better. While gold is a definite bonus, a true Swashbuckler joins a warband for the glory.",
      "mayBeHired": "Any non-evil warband may hire a Swashbuckler.",
      "rating": "A Swashbuckler increases a warband's rating by +16 points, plus 1 point for each point of Experience.",
      "profiles": [
        {
          "name": "Swash",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 5,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Rapier, Dagger, Light Armour, Duelling Pistol.",
      "skills": "A Swashbuckler may choose from the Speed, Shooting, and Combat skills when he gains an advance. If a Swashbuckler takes the Scale Sheer Surfaces skill, not only does he benefit from not needing to make an Initiative test to climb, he also gains a further D3” worth of charge or run movement when doing so.",
      "specialRules": [
        {
          "name": "Acrobatic",
          "text": "As a Swashbuckler relies on their dexterity, they have extremely good balance. As such, a Swashbuckler need not make an Initiative test when he is wounded and within 1” of a building edge."
        },
        {
          "name": "Nimble",
          "text": "A Swashbuckler is used to climbing in and out of windows, as well as running along rooftops. To reflect this, a Swashbuckler may run or charge while climbing."
        },
        {
          "name": "Charismatic",
          "text": "Because of the Swashbuckler's sheer attractiveness, any opponent from the opposite sex (Sisters of Sigmar, Amazons), must make a Leadership test if they wish to charge him."
        }
      ],
      "sourceFile": "04-hired-swords.md:2638-2664"
    },
  },
  {
    id: "ungor_trapper", name: "Ungor Trapper", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "2a", source: "Mordheim Facebook Group",
    detail: {
      "sourceLine": "Source: Mordheim Facebook Group ([PDF](https://broheim.net/downloads/hiredswords/facebook/Ungor%20Trapper.pdf))",
      "hireLine": "20 gold crowns to hire + 10 gold crowns upkeep",
      "flavour": "In the twisted forests this lonely Ungor has kept himself alive by not only hunting the animals he has tracked down, but also the unsuspecting humans with his traps and outstanding archery skills.",
      "mayBeHired": "Beastmen, Cult of the Possessed, Norse, Marauders of Chaos.",
      "rating": "An Ungor Trapper increases the warband’s rating by +12 points, plus 1 point for each Experience Point he has.",
      "profiles": [
        {
          "name": "Ungor Trapper",
          "stats": {
            "M": 5,
            "WS": 3,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 6
          }
        }
      ],
      "weaponsArmour": "Bow, Dagger, Club, Rope and Hook.",
      "skills": "An Ungor Trapper may choose from Speed and Shooting skills when he gains a new skill. In addition, there are several skills unique to Ungor Trappers as detailed below, which he can choose instead of normal skills. Note that these special skills can only be acquired through experience — they are not possessed by a new recruit.",
      "specialRules": [
        {
          "name": "Set Traps",
          "text": "A Ungor Trapper may set a trap if he spends a turn doing nothing else (he may not set traps if he’s just recovered from being Knocked Down). Place a marker in base contact with the Ungor Trapper. When a model, friend or foe, moves within 2\" of the marker he risks setting off the trap – roll a D6. On a score of 3+ he has triggered the trap and suffers a S4 hit (note that the Ungor Trapper won’t trigger his own traps). If the trap did not wound the model or it didn’t trigger, the ‘victim’ may finish his move; otherwise he is placed Knocked Down or Stunned 2\" from the marker. Regardless of whether the trap was triggered or not, the marker is removed."
        },
        {
          "name": "Hunter’s Eye",
          "text": "The Ungor Trapper’s keen eyesight and mastery of the bow allow him to pinpoint weak points on an opponent’s body when shooting, conferring a +1 on injury rolls after a successful wound caused by shooting."
        },
        {
          "name": "Excellent Sight",
          "text": "The Ungor Trapper spots Hidden enemies from twice as far as other warriors (i.e., twice his Initiative value in inches)."
        },
        {
          "name": "Just a Twit",
          "text": "While the Ungor’s not as fearless as his bigger conspecifics, an Ungor Trapper who has been taken Out of Action will leave the warband on a 1-3 and take 10gc upkeep with him. You may discard this rule with the Fearless skill."
        }
      ],
      "uniqueSkills": {
        "tableName": "UNGOR TRAPPER SKILLS",
        "skills": [
          {
            "name": "Mutant",
            "text": "The Ungor may buy one mutation. See Mutants section on special rules."
          },
          {
            "name": "Fearless",
            "text": "Immune to fear and all alone tests."
          },
          {
            "name": "Manhater",
            "text": "Will be affected by the rules of hatred when fighting any Human warbands."
          }
        ]
      },
      "sourceFile": "04-hired-swords.md:2666-2702"
    },
  },
  {
    id: "weaponsmith", name: "Weaponsmith", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Emanuele Intrieri",
    detail: {
      "sourceLine": "Source: Emanuele Intrieri ([PDF](https://drive.google.com/file/d/1oA6YkLBXSQffqVGPjN4TuqPUXXX5t4_f/view))",
      "hireLine": "30 gold crowns to hire + 15 gold crowns upkeep",
      "flavour": "Armourers, blacksmiths, and ironmongers are useful elements for any warband venturing into the ruins of Mordheim; they are needed to keep armours in good condition, sharpen swords, and keep bolts sharp. Or to pick the lock of a cage.",
      "mayBeHired": "Any warband other than Possessed, Undead, Skaven, Carnival of Chaos, Orcs & Goblins, Beastmen, and any other “evil” warband may hire a Weaponsmith.",
      "rating": "A Weaponsmith increases the warband’s rating by +16 points, plus 1 point for each Experience point he has.",
      "profiles": [
        {
          "name": "Weaponsmith",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Hammer, Crossbow, Buckler, Light Armour, Helmet.",
      "skills": "A Weaponsmith may choose from Strength and Speed skills when he gains a new skill.",
      "specialRules": [
        {
          "name": "Maintenance",
          "text": "Every now and then, the Weaponsmith manages to get his hands on tools and spare parts with which he can make improvements to certain types of equipment, as long as they are equipped by members of your warband or are stored in your warband’s treasure.\n\nBefore each game, roll 1D6 and apply the result to the equipment of your Heroes and the Weaponsmith, accepting the first result even if no model is equipped with the relevant equipment:\n\n**1:** The Weaponsmith hammers a few nails, polishes a few blades, but nothing more.  \n**2:** Heavy armours provide a saving throw of 4+, light armours of 5+.  \n**3:** Helmets give a saving throw of +1 in addition to their normal effect.  \n**4:** Bucklers give a saving throw of +1 in addition to their normal effect.  \n**5:** Shields allow parrying like bucklers in addition to their normal effect.  \n**6:** Short bows, bows, crossbows, and handguns have their range increased by 6\", pistols and duelling pistols by 3\". This increase does not stack with other bonuses from additional skills or special rules (the highest bonus applies)."
        }
      ],
      "sourceFile": "04-hired-swords.md:2704-2735"
    },
  },
  {
    id: "wood_elf_hunter", name: "Wood Elf Hunter", hireCost: {"base":50,"text":"50 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Letters of the Damned 2",
    detail: {
      "sourceLine": "Source: Letters of the Damned 2 ([PDF](https://broheim.net/downloads/lod/LOD2.pdf#page=7))",
      "hireLine": "50 gold crowns to hire + 20 gold crowns upkeep",
      "flavour": "While reclusive and wary of outsiders, it is not unheard of for one of the younger woodland elves to venture into the Empire in search of adventure and gold. Such is the Wood Elf Hunter, for their skills are prized in both the wilderness and the ruins of Mordheim.",
      "mayBeHired": "Any good warband may hire a Wood Elf Hunter.",
      "rating": "A Wood Elf Hunter increases a warband’s rating by +22 points, plus 1 point for each point of Experience.",
      "profiles": [
        {
          "name": "Hunter",
          "stats": {
            "M": 5,
            "WS": 4,
            "BS": 5,
            "S": 3,
            "T": 3,
            "W": 1,
            "I": 6,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Elf Bow, Sword, Light Armour, Hunting Arrows.",
      "skills": "A Wood Elf Hunter may choose from the Speed and Shooting skills when he gains an advancement.",
      "specialRules": [
        {
          "name": "Stalk",
          "text": "Such is the skill with which a Wood Elf Hunter shoots that he may remain hidden after shooting his bow on a roll of 4+."
        },
        {
          "name": "Hunted",
          "text": "At the start of each game, the Wood Elf Hunter may choose 1 enemy to be his prey. All attacks against that enemy, be it missile or close combat, are made at +1 on the “To Hit” roll."
        },
        {
          "name": "Keen Eyed",
          "text": "An elf can see far better than the common man. As such he can spot hidden enemies at twice his Initiative value."
        }
      ],
      "sourceFile": "04-hired-swords.md:2737-2763"
    },
  },
];

/** The "clarification of grades" block, verbatim (source lines 1207-1215). */
export const HIRED_SWORD_GRADE_NOTES: string = "- **Core:** Published in the original Mordheim Rulebook.\n- **Grade 1a:** GW/Fanatic Rules deemed \"official\" in the 2005 Rules Review.\n- **Grade 1b:** Unofficial, but released through GW/Fanatic. Professional quality.\n- **Grade 1c:** Experimental, not released through GW/Fanatic. Approved by people who previously submitted grade 1a/1b material and vouch for it's quality.\n- **Grade 2a:** Reliable, created and tested by fans and gaming groups. Will likely blend well with grade 1 warbands.\n\nFurther grades can be found at broheim.net. Individual Hired Sword rule write-ups live on nested per-grade sub-pages (e.g. Grade 1A Hired Swords) not captured in this pass — only the index table above was in scope.";

export function findHiredSword(id: string): HiredSwordSummary | undefined {
  return HIRED_SWORDS.find((h) => h.id === id);
}
