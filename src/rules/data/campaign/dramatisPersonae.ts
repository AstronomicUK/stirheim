// Dramatis Personae — rules text and the index table from mordheimer.net, as captured in
// reference/rules/03-campaigns-magic-optional-rules.md lines 1216-1288.
//
// Each row's `detail` is the full write-up from the per-grade sub-pages, rescraped into
// reference/rules/05-dramatis-personae.md (Grade 1A/1B/1C/2A pages). Text is verbatim from that
// file with only the scraper's "❓"/"✏️" review markers stripped; `detail.sourceFile` gives the line range.
//
// Generated from the Markdown source; edit the source and regenerate rather than hand-editing rows.

import type { NamedRule, SourceRef } from "../../types/common";
import type { DramatisPersonaSummary } from "../../types/campaignContent";

export const DRAMATIS_PERSONAE_SOURCE: SourceRef = {
  publication: "mordheimer.net — Campaigns: Dramatis Personae (https://mordheimer.net/docs/campaigns/dramatis-personae)",
  file: "03-campaigns-magic-optional-rules.md:1216-1288",
};

/** Where the per-entry `detail` write-ups come from (the four per-grade sub-pages). */
export const DRAMATIS_PERSONAE_DETAILS_SOURCE: SourceRef = {
  publication: "mordheimer.net — Dramatis Personae, Grade 1A/1B/1C/2A pages (https://mordheimer.net/docs/campaigns/dramatis-personae/grade-1a etc.)",
  file: "05-dramatis-personae.md:156-1372",
};

/** General special-character rules, verbatim (source lines 1220-1245). The un-headed intro is filed as "Dramatis Personae". */
export const DRAMATIS_PERSONAE_RULES: NamedRule[] = [
  {
    name: "Dramatis Personae",
    text: "This section details some of the strangest and most famous (or infamous) characters to be found in Mordheim and the outlying settlements. Occasionally, these warriors join forces with a warband (usually demanding wyrdstone or a bag of gold in payment).\n\nThe following characters (known as 'special characters') are hard to find and expensive to hire – you must be lucky and wealthy to attract their attention.\n\nThis list does not, by any means, include all the famous warriors and cold-hearted killers you could encounter in Mordheim. There are famous Dwarf gold hunters, Burgomeisters of the Merchants' Guild, Theodor, the marksman of Hochland, and many others. In fact we hope that the characters detailed here will inspire players to invent special characters of their own.\n\nYou can only ever have one of a particular special character in your warband. A warband may employ as many special characters as it likes – if it can afford them!",
  },
  {
    name: "Looking for Special Characters",
    text: "After a battle, you can send any number of your Heroes to look for a special character. Only Heroes can look (Henchmen are rarely trustworthy enough). Heroes who went out of action in the last battle are unable to join the search because they are recovering from their wounds.\n\nHeroes who are looking for a special character cannot look for rare items. Decide which special character you are seeking, and how many Heroes have been sent to look for him. Roll a D6 for each searcher. If any of the searchers rolls under his Initiative he has located the special character. You can, of course, only find one of a particular special character, no matter how many searchers roll under their Initiative.",
  },
  {
    name: "Hire Fee",
    text: "The warband must pay the hire fee for the special character when he is recruited, and after each battle he fights, including the first, you must pay an upkeep fee. These fees are indicated in the entries. This money comes from the warband's treasury in the same way as buying new weapons or recruiting new warriors. If you don't have enough gold to pay for the special character he leaves the warband.",
  },
  {
    name: "Experience, Injuries and Equipment",
    text: "Special characters have their own equipment. Only they may use this equipment; it can't be given to other warriors. Furthermore, you cannot buy extra weapons or equipment for a special character.\n\nSpecial characters do not earn Experience points, although they suffer serious injuries, just like Heroes, if they are taken out of action.\n\nEach special character's description tells you how much to add to your warband's rating for including them (taking into account their experience and abilities).",
  },
];

/** Every row of the "list of dramatis personae" index table (source lines 1248-1281). */
export const DRAMATIS_PERSONAE: DramatisPersonaSummary[] = [
  {
    id: "aenur_the_sword_of_twilight", name: "Aenur, the sword of twilight", hireCost: {"base":150,"text":"150 gc"}, upkeep: null, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=52))",
      "hireLine": "150 gold crowns to hire.",
      "flavour": "Many famous swordsmen have come to Mordheim to make their fortune, but few can match the terrifying reputation of the Elf swordsman Aenur. This mighty warrior was responsible for slaying the entire Possessed warband of Karl Zimmeran, and single-handedly cleansed the Rat Hole, a settlement that had been overrun by Beastmen.\n\nRumours about Aenur’s origin abound. Elves usually avoid human settlements, and Mordheim in particular, but for some reason the tall, pale swordsman has stayed in the proximity of the ruined city for months.\n\nSome say Aenur comes from beyond the Great Ocean, from the fabled Elven kingdoms, and that he is the captain of the legendary Order of Swordmasters. Others claim that he is a Wood Elf prince in exile. Aenur himself says little about his past and those who are wise do not question him.\n\nWhenever a warband prepares an expedition to explore the inner city, there is a chance they may hear a sharp rap at the gate of their encampment – their unexpected visitor will be Aenur, offering his services to their leader.\n\nIf, indeed, Aenur seeks something in the grim ruins of Mordheim, no-one knows what this might be. Some say that he wishes to explore the Pit itself, and slay the enigmatic Shadow Lord, though such a task must surely be above even this mighty warrior.\n\nAenur is tall even for an Elf, and beneath his finely woven Elven cloak he wears armour of gleaming ithilmar. He carries a sword of immense size which is rumoured to have arcane properties. Certainly no one who has been struck by it has ever lived to tell the tale.",
      "mayBeHired": "Any warband except Skaven, Undead and the Possessed may hire Aenur.",
      "rating": "Aenur increases the warband’s rating by +100 points.",
      "profiles": [
        {
          "name": "Aenur",
          "stats": {
            "M": 5,
            "WS": 8,
            "BS": 4,
            "S": 4,
            "T": 3,
            "W": 2,
            "I": 7,
            "A": 3,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Aenur wears Ithilmar Armour, an Elven Cloak and carries an enormous sword known as Ienh-Khain.",
      "skills": "Aenur has the following skills: Strike to Injure, Expert Swordsman, Step Aside, Sprint, Lightning Reflexes, Dodge and Mighty Blow.",
      "specialRules": [
        {
          "name": "Invincible Swordsman",
          "text": "Aenur always hits his opponents on a roll of 2+ in hand-to-hand combat."
        },
        {
          "name": "Wanderer",
          "text": "Aenur only ever stays with a warband for the duration of the battle. A warband who used Aenur in their last battle may not seek him out until they have fought at least one battle without him."
        },
        {
          "name": "Ienh-Khain (the Hand of Khaine)",
          "text": "Ienh-Khain is an incredibly long single-edged sword, which Aenur uses with consummate skill. This sword allows Aenur to parry, adds +1 to his Strength and causes a critical hit on a roll of 5-6 when rolling to wound."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:158-194"
    },
  },
  {
    id: "bertha_bestraufrung_high_matriarch_of_the_sisterhood", name: "Bertha Bestraufrung, high matriarch of the sisterhood", hireCost: null, upkeep: null, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=54))",
      "hireLine": "",
      "hireFee": "None. Bertha will come to the aid of any Sisters of Sigmar warband if they send one or more of their Heroines to look for her in the normal manner, rolling under their Initiative (representing their efforts to gain audience with the High Matriarch). If she does grant an audience, she might decide that her personal help is needed in the forthcoming battle. She will only come to the aid of a Sisters of Sigmar warband if their enemy has a higher warband rating. Consult the table below, and roll a D6 to see whether Bertha will aid the warband. A request for Bertha to aid the warband must be made for each battle you wish her to help the warband.\n\n| Difference in Warband Rating | Dice roll required |\n| --- | --- |\n| 0-49 | Nil |\n| 50-99 | 6+ |\n| 100-149 | 5+ |\n| 150-199 | 4+ |\n| 200+ | 3+ |",
      "flavour": "Years ago, Bertha sought refuge in the strict discipline and devotions of the Sisters of Sigmar. Only the warrior god of the Empire was worthy of her esteem. Only He was constant and faithful. And had not holy Sigmar, in truth, chosen her to be one of his handmaidens?\n\nThe pure blood of the Unberogens runs in Bertha’s veins, as evinced by her long golden plaits and fierce blue eyes, which can freeze a Goblin at twenty paces with an icy glare. Even her voice commands authority, turning strong, hairy-thewed men into trembling wretches.\n\nThe Sisters look up to Bertha as an example of holy womanhood. She rose rapidly through the ranks of the Sisterhood, and on her deathbed the revered Matriarch Cassandra named Bertha her successor, new High Matriarch, and Abedissa of Sigmar’s Rock.\n\nSometimes, as Bertha straps on her Gromril armour in the light of dawn, she reflects on the lost innocence of her youth. Then, angrily, she tightens the studded leather straps tightly over her iron-hard limbs and strides outside to spend hours practising with her great warhammers, preparing herself, as a bride of Sigmar should, for the day of battle.\n\nExtract from the Tome of Heroes",
      "mayBeHired": "Bertha Bestraufrung will only join Sisters of Sigmar warbands.",
      "rating": "Bertha increases a warband’s rating by +105 points.",
      "profiles": [
        {
          "name": "Bertha",
          "stats": {
            "M": 4,
            "WS": 5,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 4,
            "A": 3,
            "Ld": 10
          }
        }
      ],
      "weaponsArmour": "Bertha is armed with two Sigmarite Warhammers, wears Gromril Armour, and carries a vial of Blessed Water and a Holy Relic.",
      "skills": "Bertha has the following skills: Mighty Blow, Unstoppable Charge and [Righteous Fury](/docs/warbands/grade-1a-warbands/sisters-of-sigmar#righteous-fury).",
      "spells": "Bertha knows all six [Prayers of Sigmar](/docs/magic/prayers-of-sigmar).",
      "specialRules": [
        {
          "name": "High Matriarch",
          "text": "As the High Matriarch of the Sisters of Sigmar’s Mercy, Bertha will automatically be the leader of any warband she joins."
        },
        {
          "name": "Sigmar’s Handmaiden",
          "text": "Bertha is favoured above all other Sisters in the eyes of Sigmar. She gains +2 to all her rolls to see whether her Prayers of Sigmar are granted."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:196-242"
    },
  },
  {
    id: "johann_the_knife", name: "Johann the knife", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=51))",
      "hireLine": "70 gold crowns to hire; +30 gold crowns upkeep cost. Johann is addicted to Crimson Shade, so you may hire him for one portion of Crimson Shade if you wish.",
      "flavour": "> _“Get your hands off me, brute! Let go of me, and I’ll tell you what I know. So, you seek Johann the Knife! Take my advice, friend, do not speak his name out loud. He does not like people talking about him in the street. What do you seek him for >anyway? So, you’ve got a job for him! Well, why didn’t you say so before? I cannot say where you might find him, because I do not know myself. Who does? Anyway, no matter. When he hears word, he will find you soon enough! Ha! ha! It will cost you >though, for he likes gold, does Johann. He knows this city – what’s left of it – like the back of his hand. If he can’t find someone, no-one can. He is like a shadow, he can go in and out of anywhere, unseen. He can also fight his way out of anywhere. >no one can catch him. As quick as lightning with a knife, he is! No traces, all very neat and tidy. All I need from you is the gold, and the name. Johann will do the rest.”_\n> \n> \\-Conversation overheard in Mordheim-\n\nOf the many cutthroats and assassins for hire that infest the settlements around Mordheim, Johann the Knife is the most famous. He exhibits his vocation as hired knife-fighter and assassin extraordinaire by the various lethal-looking daggers hanging from his belt, and the mean glint of his eyes. Johann wears dark leather gear, slightly out of fashion, which has never been washed (or so the barmaids say). His long face bears the scars of many a fight, and his unkempt hair is lank and greasy.\n\nJohann’s purse is always heavy with gold, and he takes no trouble to hide it, since only a fool would try to steal it from him. Many have tried, and all have died… very quickly. The craftsmanship and quality of Johann’s daggers is beyond compare, as he has taken them from the bodies of the many wealthy, but unskillful, opponents he has despatched in vicious duels.",
      "mayBeHired": "Any warband except Skaven, Undead and the Possessed may hire Johann.",
      "rating": "Johann the Knife increases a warband’s rating by +60 points.",
      "profiles": [
        {
          "name": "Johann",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 6,
            "S": 4,
            "T": 3,
            "W": 2,
            "I": 6,
            "A": 1,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Johann is armed with countless Throwing Knives and several long daggers (he always counts as having two Swords in close combat). His weapons are always coated with Black Lotus and he may take Crimson Shade before a battle if you want him to.",
      "skills": "Johann has the following skills: Dodge, Scale Sheer Surfaces, Quick Shot, Eagle Eyes and Knife Fighter.",
      "specialRules": [
        {
          "name": "Knife Fighter Extraordinaire",
          "text": "Johann has a deserved reputation for being the greatest knifefighter in whole of the Empire. Unlike normal warriors, he can combine the Knife Fighter and Quick Shot skills (yes, he can throw six throwing knives in one turn if he does not move!)."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:296-326"
    },
  },
  {
    id: "veskit_high_executioner_of_clan_eshin", name: "Veskit, high executioner of clan eshin", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":35,"text":"35 gc"}, grade: "core", source: "Mordheim Rulebook",
    detail: {
      "sourceLine": "Source: Mordheim Rulebook ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=53))",
      "hireLine": "80 gold crowns to hire; +35 gold crowns upkeep cost.",
      "flavour": "> _“It killed us all! We couldn’t stop it, our weapons broke against its body... It was black, like a shadow, and it was moving so fast, cutting men to shreds left and right. We fought, yes we fought hard, and old Marcus even tried his trick with the oil >flask. It was engulfed by flames and for a moment we thought we’d stopped it. No way, it came out of the fire, still ablaze. It was as if it didn’t care! That was too much and those left of us ran for it. Still it followed us, on and on, relentless and >merciless. There was no escaping, no hiding, its red eye could always spot you. Oh that eye... that eye...”_\n> \n> Last words of Fritz Huber at the Inn of the Red Moon,\n\nVeskit was already a talented clan Eshin Assassin when he was entrusted with his most difficult mission. He was hired by Clan Skryre to free one of their oldest and most experienced Warlocks who was being held hostage by a rival clan.\n\nVeskit managed to take the prisoner back, fighting his way through the guards, but at a very high cost. He suffered terrible wounds and would have certainly died, but the Nightmaster of Clan Eshin made a pact with the Warlock Engineers. The Skaven scientist-sorcerers replaced various parts of Veskit’s body with their part technological, part magical implants and made him into a walking arsenal of deadly weapons. Veskit is now more a machine than a living thing, and his thirst for killing has become almost uncontrollable.\n\nWhen news of the wyrdstone came to the hidden fortress of Clan Eshin, the Nightmaster sent Veskit to Mordheim to deter the man-things from exploring the city, which rightfully belonged to the Skaven. From that day on, many adventurers have met their end in the dark allies of Mordheim. Veskit’s unblinking eye misses nothing, and those he hunts on the streets of Mordheim never return to the Gargoyle Gate.",
      "mayBeHired": "Veskit may only be hired by Skaven warbands.",
      "rating": "Veskit increases the warband’s rating by +70 points.",
      "profiles": [
        {
          "name": "Veskit",
          "stats": {
            "M": 5,
            "WS": 5,
            "BS": 4,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 5,
            "A": 4,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Eshin Fighting Claws (the extra attack is included in his profile). Each Fighting Claw incorporates an in-built Warplock Pistol, so Veskit can shoot in every turn, and he fights in close combat with Strength 5 and a save modifier of -3 (note that he can still parry twice with his claws!).",
      "skills": "",
      "specialRules": [
        {
          "name": "Unfeeling",
          "text": "Veskit is a cold, calculating killing machine, and feels few of the emotions that living things do. He is therefore immune to all psychology."
        },
        {
          "name": "No Pain",
          "text": "Veskit ignores knocked down and stunned results on the Injury chart. He must lose his last wound and be taken out of action before he is removed from battle."
        },
        {
          "name": "Unblinking Eye",
          "text": "Thanks to the sorcerous devices built by the Warlock Engineers of Clan Skryre, Veskit can spot hidden enemies within twice his Initiative value in inches."
        },
        {
          "name": "Metallic Body",
          "text": "These give Veskit his high Toughness and a 3+ armour save.\n\n![](/assets/images/shadowlord-7a1572055e058726c38956acc4a85ae8.jpg)"
        }
      ],
      "sourceFile": "05-dramatis-personae.md:434-470"
    },
  },
  {
    id: "countess_marianna_chevaux_vampire_assassin", name: "Countess Marianna Chevaux, Vampire Assassin", hireCost: {"base":150,"text":"150 gc"}, upkeep: {"base":75,"text":"75 gc*"}, grade: "1a", source: "Town Cryer 22", notes: "Upkeep is marked with an asterisk in the source index table; the footnote it points to was not captured in the scrape.",
    detail: {
      "sourceLine": "Source: Town Cryer 22 ([PDF](https://broheim.net/downloads/towncryer/TownCryer22.pdf#page=13))",
      "hireLine": "150 gold crowns to hire; 75 gold crowns upkeep (varies see below).",
      "flavour": "Once an assassin-thief, Marianna’s ambitions outreached her. In a daring expedition to Araby, she came into contact with the ancient Vampiress Serutat. Marianna succeeded in her mission, stealing the gem, the Noctu, from Serutat’s crypt but the Vampiress caught up with her, tainting her with the curse of Vampirism before the resourceful assassin could escape.\n\nIn a moment Marianna had become a thing of the night and yet she was not completely damned, a half-vampire. Sating her bloodlust on the numerous courtesans, captains and suitors that came her way, Marianna fled the bitter vengeance of the Lahmian Vampire, Serutat, to Mordheim. With the City of the Damned her relative anonymity would be assured.\n\nMarianna is a pragmatist, neutral in her persona, serving only her own means, hiring her skills out as an assassin, taking care to conceal her secret. Wary of witch hunters and the other devout servants of Sigmar, Marianna is a creature of the shadows, her vampiric powers enhancing her abilities immeasurably. And yet the flight to Mordheim serves an ulterior motive. Vampire turned Vampire Hunter and as such an exile in the dark Undead underworld, Marianna tracks the night-stalkers of Mordheim, torturing them for information; the whereabouts of Serutat and the true nature of the Noctu, the black jewel stolen from her crypt. Marianna’s efforts have borne dark fruit, a word of power and the stone will create a veil of shadow to cloak the bearer, drifting like a black ether. Marianna means to seek out Serutat in her lair when she is vulnerable, exacting her own vengeance for damning her to darkness, her ‘interrogations’ warning her that the Vampire has travelled to the Empire to settle the score and retrieve the Noctu. A plethora of aliases have kept Marianna hidden so far but occasionally, during a battle in the deepest recesses of the city, minions of Serutat will appear out of the night to exact their mistress’s vengeance, much to the surprise of the vying warbands. Marianna walks a dagger-thin line but thus far she has yet to slip…",
      "mayBeHired": "Any Warband except Witch Hunters, Sisters of Sigmar, Undead, Elves and other Sigmar devoted warbands may hire Marianna (note, mercenaries are men of lax faith and do not count here).",
      "rating": "Marianna increases the warband’s rating by +90 points.",
      "profiles": [
        {
          "name": "Marianna",
          "stats": {
            "M": 6,
            "WS": 6,
            "BS": 6,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 9,
            "A": 3,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "Marianna carries a Rapier, Dagger and has a set of Throwing Knives and a Crossbow Pistol concealed about her person. Her crossbow bolts and rapier are coated in essence of garlic, which acts as Black Lotus when used against Vampires. She also has quite an extensive wardrobe of very expensive Bretonnian silk dresses!",
      "skills": "Marianna has the following skills: Combat Master, Step Aside, Leap, Acrobat, Lightning Reflexes, Dodge, Jump Up and Scale Sheer Surfaces.",
      "specialRules": [
        {
          "name": "Immune to Psychology",
          "text": "As a Vampire, Marianna is completely immune to the effects of psychology and will never leave combat."
        },
        {
          "name": "Immune to Poison",
          "text": "As a Vampire, Marianna is completely immune to the effects of poison."
        },
        {
          "name": "No Pain",
          "text": "Marianna treats a stunned result on the Injury chart as knocked down instead (note that with her Jump Up ability Marianna cannot be knocked down either so the only way to stop her is to take her out of action!)."
        },
        {
          "name": "Cause fear",
          "text": "Marianna is a terrifying creature, although more through reputation than her being a Vampire as she is contriving to keep her identity a secret."
        },
        {
          "name": "‘You can never escape your past…’",
          "text": "On the last turn of the game in which Marianna is still standing or as soon as a warband routs, ending the game, roll a D6:\n\n|   D6   | Result |\n| --- | --- |\n| 1-3 | Marianna has discovered that Serutat is getting close and will leave the warband’s service after the game. |\n| 4-5 | Marianna has discovered a useful lead that she must pursue in this area and will stay for another game if the warband can afford her upkeep. |\n| 6 | A group of Serutat’s minions have caught up with her! Fight D3 more turns as if the losing warband hadn’t routed (in the confusion the balance is reset). A randomly determined group of minions ‘appear’ within 2D6\" of Marianna, the opposing player chooses where. Marianna takes the first turn and then the minions, after which the turn sequence returns to normal with the minions counted as a an extra player. The minions only attack Marianna and must move towards her as fast as possible but will attack anyone else in their way. If her warband fight to help her (by taking at least one minion out of action) and she survives, Marianna will fight the next battle for free, otherwise she will leave. |\n\n|   D6   | Minions |\n| --- | --- |\n| 1-2 | D3+1 Zombies |\n| 3-4 | D3+1 Ghouls |\n| 5-6 | Vampire (Sword & light armour) +2 Ghouls |"
        },
        {
          "name": "Fighting Undead",
          "text": "Due to her vocation as a Vampire Assassin turned Vampire Hunter, all Vampires hate Marianna."
        },
        {
          "name": "The Noctu",
          "text": "The gemstone stolen from Serutat’s lair has powerful cloaking properties. The veil of shadow it creates reduces all shooting to hit rolls against Marianna by -1."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:244-294"
    },
  },
  {
    id: "nicodemus_the_cursed_pilgrim", name: "Nicodemus, the cursed pilgrim", hireCost: {"base":null,"text":"1 wyrdstone"}, upkeep: {"base":null,"text":"1 wyrdstone"}, grade: "1a", source: "Mordheim Annual 2002",
    detail: {
      "sourceLine": "Source: Mordheim Annual 2002 ([PDF](https://broheim.net/downloads/resources/Hired%20Sword%20Compendium.pdf#page=66))",
      "hireLine": "",
      "hireFee": "See Special Rules.",
      "flavour": "Nicodemus was a promising apprentice to the mighty wizard Ganthrandir. During one of his master's many absences, Nicodemus felt an irresistible call from one of the ancient artifacts stored in the wizard's laboratory: an exotic magic lantern. Created when the world was but young, this mighty artifact imprisoned the essence of a powerful Daemon. Many times Nicodemus' master had warned him not to touch the dangerous lantern, but the voice in the young wizard's mind was more convincing than even his mentor's: Free me\" it was saying \"and I will grant you your heart's desire - anything you want will be yours! Mine is the power to make it so! Free me... ” Nicodemus knew something of dealing with these denizens from the Realm of Chaos and immediately asked: \"Do you swear it on the name of the Power you serve?\" After a moment of silence, the voice answered: ‘I swear it in the name of my Master!\" So the ambitious but naive young wizard was hooked and proceeded to break the runic seals of the lantern.\n\n\"Free at last!\" boomed the voice of the Daemon as it emerged from its prison in a billowing, many-hued cloud. The smoke then seemed to coalesce into the vague shape of a huge humanoid creature, with a bird-like head atop a long thin neck and vast wings seemingly made of iridescent light. The Daemon looked down on the human, and Nicodemus, controlling his fear, shouted: \"The wish! You must grant me the wish as you swore it!\" The mighty Chaos being smiled enigmatically and asked: \"What is your wish then. manling?\"\n\nF\\_ighting hard against all the instincts telling him to flee as far as he could from this unearthly abomination, Nicodemus revealed his wish: \"I want to become the greatest wizard known to Mankind!\"\n\nA few long heartbeats later the fiery gaze of the Daemon left the wizard: \"Granted!\" whispered the Daemon and with one last evil chuckle disappeared back to the netherworld from whence it came.\n\nNicodemus did not perceive any immediate change and wondered how long it would take for the wish to come true. Only one thing was clear, he could not stay there anymore, because his master would certainly not be pleased by his actions. So Nicodemus picked up his things and fled, beginning his wanderings across the Old World.\n\nOnly a few weeks after that fateful day did Nicodemus realise the Daemon's trickery. His body was growing abnormally quickly - he was now an inch taller than the previous week and his body was getting proportionally bigger. The greatest wizard! The cunning Daemon had taken his wish loo literally! Nicodemus had been taught to be extremely careful with the wording of anything related to wish-magic, but the sheer terror generated by the Daemon had overcome his training. .. Now he was doomed to live with his mistake.\n\nFrom that day on the life of Nicodemus has been an uninterrupted quest, a desperate search for a way to negate the curse of unstoppable growth. The only remedy he has stumbled upon is a powerful potion concocted by a wise hermit he met in the World's Edge Mountains. The potion's ability to delay the effects of the Daemon's powers has become a lifeline for the sizeable wizard. Unfortunately for Nicodemus he requires regular infusions of wyrdstone for the potion to take effect. Thus Nicodemus has been drawn to the greatest concentration of this wondrous mineral - Mordheim, City of the Damned.\n\nNicodemus's skills have greatly developed during his time in the dark streets of Mordheim and he is now something of a legend among the many warbands vying for supremacy in the city. Who knows where he will appear next and who will he join in his never ending search for the precious magic stones...",
      "mayBeHired": "Any warband except Skaven, Undead, the Possessed and Witch Hunters may hire Nicodemus.",
      "rating": "Nicodemus increases a warband’s rating by +85 points.",
      "profiles": [
        {
          "name": "Nicodemus",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 3,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Nicodemus carries an enormous Wizard's staff (see Special Rules).",
      "skills": "Nicodemus has the following skills: Sorcery and Fearsome.",
      "spells": "Nicodemus knows all six [Lesser Magic](/docs/magic/lesser-magic) spells.",
      "specialRules": [
        {
          "name": "Cursed",
          "text": "Nicodemus is not interested in money, he desperately needs fragments of wyrdstone to delay his abnormal growth. When he joins the warband and after each battle he fights, including the first, you must pay him with a wyrdstone shard. If you don’t have a shard or if you don’t want to give it to Nicodemus and prefer to sell it. the cursed pilgrim will leave the warband, never to return."
        },
        {
          "name": "Wizard's Staff",
          "text": "Nicodemus can use his staff in close combat in two different ways: he can use the staff with both hands, in which case the staff counts as a Club, but also allows Nicodemus to [parry](/docs/rules/close-combat#parry) as if he was armed with a buckler; alternatively Nicodemus can use the staff in his left hand as a normal club while he's wielding the Sword of Rezhebel (see [Lesser Magic](/docs/magic/lesser-magic) spells) in his right hand.\n\nNote: the Sword of Rezhebel is a spell and not a normal sword, therefore it cannot be used to parry."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:328-374"
    },
  },
  {
    id: "ulli_and_marquand", name: "Ulli & Marquand", hireCost: {"base":30,"text":"30 gc"}, upkeep: null, grade: "1a", source: "Town Cryer 13",
    detail: {
      "sourceLine": "Source: Town Cryer 13 ([PDF](https://broheim.net/downloads/towncryer/TownCryer13.pdf#page=5))",
      "hireLine": "30 gold crowns to hire as a pair.",
      "flavour": "Never in the history of the Empire have there been such a villainous pair of rogues as Marquand Volker and Ulli Leitpold. Once brigands in a mercenary regiment responsible for a long list of crimes, they were caught by bounty hunters and enlisted into the slave army of the Count of Stirland. The pair escaped their captors on the outskirts of Mordheim, City of the Damned, a ruinous place where death and glory could be found in equal measure. The infamous bandits instantly recognised it as home.\n\nUlli and Marquand quickly developed a strong rapport with the scum of Mordheim, a place Inhabited by the corrupt and immoral outcasts of society. Their martial prowess and ruthless guile soon earned the nefarious partners in crime a high degree of notoriety. As a result, the less noble traders and prospectors of the accursed city eagerly sought out the services of these talented scoundrels.\n\nBut their assistance did not come without a high price. Whilst the pair would consider any task thrown their way for a mere handful of gold coin, their loyalty was as fickle as the winds of Chaos. They built up a reputation of betraying employers and stabbing them in the back for the sake of a single crown. They were certainly not beyond using foul and despicable tricks to save their own worthless hides or line their own pockets.\n\nWhat became of the despicable pair, none can say but legends of their deeds can to this day be heard in taverns throughout the Old World. Each story is more outlandish than the next but few ever doubt the truth behind these fantastic tales.",
      "mayBeHired": "Any Warband except Sisters of Sigmar and Witch Hunters may hire these rogues.",
      "rating": "Ulli & Marquand increase the warband’s rating by +60 points.",
      "profiles": [
        {
          "name": "Marquand",
          "stats": {
            "M": 4,
            "WS": 5,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 2,
            "I": 5,
            "A": 2,
            "Ld": 8
          }
        },
        {
          "name": "Ulli",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 4,
            "S": 4,
            "T": 3,
            "W": 2,
            "I": 4,
            "A": 2,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "",
      "skills": "",
      "specialRules": [
        {
          "name": "Special Rules",
          "text": "These special rules apply to both Ulli and Marquand."
        },
        {
          "name": "Wanderers",
          "text": "Ulli and Marquand only ever stay with a warband for the duration of the battle. A warband who used Ulli and Marquand in their last battle may not seek him out until they have fought at least one battle without him."
        },
        {
          "name": "A Fistful of Crowns",
          "text": "These guys will do literally anything for money / Wyrdstone and have been known to change sides and stab their former employers in the back for just a few crowns. To represent this, opposing player(s) may attempt to bribe the pair into betraying their employers and changing sides. At the start of the game, any player(s) wishing to do this must secretly write down how much he is willing to bribe them by (this must of course be more than the pair’s starting hire fee!). The controlling/employing player is advised to secretly write down a counter bid at the start of the game also. The bribing player may then choose at the start of any of his turns to attempt to bribe them (even if they are in close combat!). If he does so he must reveal the amount he has written down and if this is more than the hire fee plus the amount the controlling player has for his counter-bid, then he gains control of the pair until the end of the game. Only the player who has control of the pair is forced to pay the additional amount so that if the original controlling player loses control of them through a bribe he doesn’t have to pay the counter-bid.\n\nThis bribing business can of course get quite interesting in multi-player games with different players attempting to bribe at different times.\n\nWhichever player succeeds in bribing, or if the controlling player maintains control, they must pay this extra amount."
        },
        {
          "name": "Where’s the Money?",
          "text": "These guys are not likely to accept any poor excuses if a warband cannot afford their extra pay. In the event that a player cannot pay the extra either in crowns or Wyrdstone (The warband should sell any Wyrdstone necessary in order to pay the hire or bribe) the pair will deprive the warband of an equal amount in equipment (based on market price). Failing this, they will take out their anger on the warband leader – immediately play a close combat with the pair versus the warband leader on his own and to the death!"
        },
        {
          "name": "Inseparable",
          "text": "These guys are like brothers and are totally inseparable. They must be hired as a pair and must remain within 4\" of each other. In the event that one is taken _Out of Action_, the other will attempt to drag him off of the battlefield and to safety."
        }
      ],
      "otherSections": [
        {
          "name": "Marquand Volker",
          "text": "_Reputedly the son of wealthy Marienburg merchants, what made Marquand embark on a career as a gambler and then a mercenary and assassin is unknown. What is known about this apparent ‘fop’ is that his appearance belies his true nature for he is quite deadly and entirely devoid of any morals. Marquand personifies Mordheim ‘The City of the Damned’ for he is corrupt and rotten to the core – just like that place he calls his ‘home’. An expert swordsman and master of the throwing knife, there are few who have crossed him and lived. In the darkened corners of taverns, tales are told in nervous whispers about this cold-hearted killer’s reputation: that he killed his first victim before he was ten; that he cut the heart out of the Duke of Suddenland while the Duke’s wife slept on beside him. His deadliest foe is the Witch Hunter captain Gottlieb, ‘The Flayer’, whose face Marquand horribly disfigured whilst the erstwhile servant of Sigmar was attempting to redeem Marquand of his sins._\n\n| Profile | M | WS | BS | S | T | W | I | A | Ld |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Marquand | 4 | 5 | 4 | 3 | 3 | 2 | 5 | 2 | 8 |\n\n**Weapons/Armour:** Sword, Light armour, Throwing Knives.\n\n**Skills:** Step aside, Knife Fighter, Lightning Reflexes."
        },
        {
          "name": "Ulli Leitpold",
          "text": "_Marquand’s sidekick and partner in crime. Little is known about this huge framed Middenheimer, apart from it is unwise to be caught anywhere near the business end of his massive warhammer! The tales tell that Ulli Leitpold started out as a mercenary soldier, often in the service of the armies of the Count of Stirland, and that he was present at the slaughter that ensued at the third siege of Nuln. Life as a mercenary is presumably where he derives his unthinking greed and cold nature, no doubt. Ulli spent some time as a bandit and thief and teamed up with Marquand when they were captured by bounty hunters and sentenced to live out their days in the penal battalions of the Count of Stirland. Neither as subtle or as flash as his Marienburg colleague, Ulli prefers to use a combination of brute force and low cunning to achieve his goals._\n\n| Profile | M | WS | BS | S | T | W | I | A | Ld |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Ulli | 4 | 4 | 4 | 4 | 3 | 2 | 4 | 2 | 7 |\n\n**Weapons/Armour:** Two-handed warhammer, Light armour.\n\n**Skills:** Strongman, Unstoppable charge, Combat master."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:376-432"
    },
  },
  {
    id: "abdul_alhazred_the_mad_sorcerer", name: "Abdul Alhazred, the Mad Sorcerer", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Town Cryer 21, Khemri",
    detail: {
      "sourceLine": "Source: Town Cryer 21, Khemri ([PDF](https://broheim.net/downloads/towncryer/TownCryer21.pdf#page=18))",
      "hireLine": "70 gold crowns to hire + 30 gold crowns upkeep.",
      "flavour": "Abdul Alhazred is renowned as the mad sorcerer from the Arabian town of Sanaa. Born to wealthy merchants he was educated with the sons of the local Caliph and it was in the Caliph's private library that be first learnt about the land of the Dead from tomes he had been expressly forbidden to read. It was then that he developed an obsessional desire for knowledge of the long dead civilisation of Nehekhara and some say it was the dread reputation of this ancient land that drew him on to rash acts. Others say it was the calling of the legendary Nagash none know...\n\nIt is said that he left immediately, stealing enough money to fund his wanderings along with an artefact of such antiquity it was believed to have come from Nehekhara. He has visited the ruins of Khemri, Zandri, Numas and Quatar and over long years plundered them of their secrets. His discoveries rival those of Abdul Ben Raschid, whose works he has voraciously studied and it is these that have sent him spiralling into insanity. Referred to as 'The Mad Sorcerer' he is shunned by all except those foolish enough to want to learn the secrets of the Land of the Dead.",
      "mayBeHired": "All warbands, except Witch Hunters and Sisters of Sigmar, may hire the Mad Sorcerer.",
      "rating": "Abdul Afhazred increases the warband's rating by +30 points.",
      "profiles": [
        {
          "name": "Abdul",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 2,
            "S": 3,
            "T": 3,
            "W": 2,
            "I": 4,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Black Nomad Robes, Dagger, The Eye Pendant.",
      "skills": "Sorcery.",
      "specialRules": [
        {
          "name": "The Eye Pendant",
          "text": "The Eye Pendant is an ancient artefact stolen by Abdul from the Caliph of Sanai. Only after much painstaking research did Abdul discover its secrets and he has used its arcane powers to protect himself from the wrath of the Tomb Kings and their servants. Any Undead warrior wishing to attack Abdul must first pass a Ld test. In addition, the pendant gives Abdul a 4+ Ward save against all damage."
        },
        {
          "name": "Psychology",
          "text": "Abdul Alhazred has witnessed some of the foulest monstrosities of the Land of the Dead and is quite mad! He is immune to all Psychology-tests."
        },
        {
          "name": "Djinn Master",
          "text": "Abdul Afhazred has spoken to many of the mystical Djinn in his time and despite his unsteady state of mind knows how to see through their lies and bend them to his will. If the warband he is with acquires a Lamp of the Djinn he may assist a Hero using it with a +1/-1 modifier on the Light and Dark tables respectively."
        },
        {
          "name": "Master Wizard",
          "text": "The Mad Arab is one of the most learned and powerful wizards in Araby. He knows all the spells in the [Elemental](/docs/magic/arabian-elemental-magic) and [Necromancy](/docs/magic/necromancy) lists. Because he is mad, however, he must roll at the beginning of each Shooting phase to see which spell he remembers.\n\nRoll a D6: 1-3 Elemental, 4-6 Necromancy\n\nThen roll a D6 to see which spell be remembers."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:479-513"
    },
  },
  {
    id: "crow_master_the", name: "Crow Master, The", hireCost: {"base":65,"text":"65 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 25",
    detail: {
      "sourceLine": "Source: Town Cryer 25 ([PDF](https://broheim.net/downloads/towncryer/TownCryer25.pdf#page=6))",
      "hireLine": "65 gold crowns, 15 gold crowns upkeep.",
      "flavour": "The Saga of Simius Gantt\n\nProminent surgeon and devoted scientist of the Empire, Simius Gantt thrust mind, body and soul into the furthering of his knowledge of the universe and the physical betterment of others. When hearing of the blight that had struck the city of Mordheim his was the first voice that spoke of a 'duty to tend to the ailing'. He undertook a great journey from the lofty towers of Altdorf and set up a modest but well-equipped surgery on the outskirts of the City of the Damned.\n\nAll and sundry came to him, desperate for aid and he would turn none from his door save the daemonic creations that had made their home in the bowels of that cursed place. But Mordheim is dangerous, worse many times over than the most violent battlefield, for it harbours enemies unseen, those that corrupt from within yet without the host's knowledge. As more and more died upon his table, Simius questioned his ability and his calling, developing a morbid fascination with the dead. Unbeknownst to Simius a darker power was at work within him, the shards of the meteorite that blasted Mordheim, the wyrdstone he had been inextricably exposed to was at work within him, changing him...\n\nA day of reckoning came at last, a wandering warlock, grievously wounded, happened upon the surgery. Despite his best efforts Simius could not save him such were his injuries. As the warlock grew cold upon the slab a subconscious urge drove Simius's hand to rummage through the man's belongings for a fee. He was bereft of possessions save for a leather bound book, etched in dried blood.\n\nThe tome contained many scriptures and instruction pertaining to the dead, even detailing arcane rites of resurrection. The warlock was in fact a necromancer and Simius continued his work, devoting each night to the studying of the creature's tome. As time wore on, Simius changed, as did his practice. The lone and badly wounded were fair game to him now and he used his scalpel to snip their life's thread. He would then practice his new found 'art' on the corpses, reciting the ancient resurrection passages in earnest. Simius's skills developed and his transformation from genius to madman was soon complete. Shedding the clothes from the decaying Necromancer and donning them himself he wandered from the surgery and his old life and descended into Mordheim and utter damnation.\n\nAll that remains of the surgery now is a scorched patch of earth, Simius having razed it to ash. Voices whisper his name now, in the shadows and darkness. They call him Crow Master, such is the palpable aura of death that exudes from his very skin, a vicious murder of fell birds accompanying him wherever he goes, harbingers of pain and torture. His services can still be garnered at a price, yet the price is only known at Simius's whim, and is oft not gold nor wyrdstone...",
      "mayBeHired": "Any warband except Dwarfs, Elves, Sisters of Sigmar and Witch Hunters may hire Simius.",
      "rating": "Simius increases the warband's rating by +85 points.",
      "profiles": [
        {
          "name": "Simius",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 4,
            "W": 3,
            "I": 5,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Simius wears the Mantle of Crows, carries a Staff and has a Needle and Thread.",
      "skills": "Simius has the following skills: Sorcery and Dodge.",
      "spells": "Simius knows all of the [Necromancy](/docs/magic/necromancy) spells and also knows an additional spell, specific to him, Decay of Ages.",
      "specialRules": [
        {
          "name": "Mantle of Crows",
          "text": "The mantle in appearance is a simple shabby cloak but has a hidden malign power. It attracts a murder of crows that circle around Simius distracting his adversaries. Any enemy model in base-to-base contact with Simius at the start of the Hand-to-hand Combat phase suffers a single automatic Strength 2 bit before any blows are struck."
        },
        {
          "name": "Needle and Thread",
          "text": "A throwback to his surgeon's days, Simius carries a needle and thread. If Simius stuns an opponent in Hand-to-Hand combat and he has no other enemies standing in base-to-base contact, he sews up the mouth of his enemy. Leaders cannot then use their 'leader' ability and spell casters are unable to cast spells for the remainder of the battle."
        },
        {
          "name": "Payment in blood",
          "text": "Simius is a zealous scientist and his propensity to experiment is seldom slaked. If the warband who hires him loses the battle he may decide to 'abduct' a hapless warrior co experiment on. Roll a D6. lf you roll a 1, Simius abducts the Hero or Henchman with the lowest experience (not hired swords) and that warrior must be struck off the warband roster and for all intents and purposes is slain. Simius disappears without trace after he has collected his fee of course..."
        }
      ],
      "otherSections": [
        {
          "name": "Decay of Ages",
          "text": "**Difficulty: 9**\n\n_Gesturing to his hapless victim with a bony outstretched finger Simius invokes the Decay of ages. Skin withers and cracks, muscles atrophy, bones become brittle as the victim ages horrifically in seconds._\n\nThis spell affects a single warrior within 6\" of Simius Gantt. The warrior must pass an immediate toughness test on a D6 or they will lose -1 from all of their characteristics with the exception of Attacks and Wounds. In each subsequent Recovery phase they must pass a Toughness test or will lose a further -1. As soon as they pass the test all characteristics are returned to normal. If any characteristic reaches O the model is taken out of action. Simius cannot cast this spell on more than one model at a time. If he decides to cast it again the effects on the previous victim are undone."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:515-561"
    },
  },
  {
    id: "dark_emissary", name: "Dark Emissary", hireCost: null, upkeep: null, grade: "1b", source: "Town Cryer 15, Albion",
    detail: {
      "sourceLine": "Source: Town Cryer 15, Albion ([PDF](https://broheim.net/downloads/towncryer/TownCryer15.pdf#page=10))",
      "hireLine": "",
      "flavour": "Of all the mysteries of Albion perhaps the greatest is the purpose of the enigmatic figures known as Dark Emissaries and Truthsayers. These ancient wizards are erstwhile enemies and their secret battle hints at a greater struggle yet to pass. Dark Emissaries, servants of the Dark Master, a powerful and enigmatic figure are potentates of evil. They ally themselves with evil forces and seek to harness the power of the Ogham Stones for all manner of unknown and nefarious practices. Truthsayers, the druidic warrior-wizards, the benevolent protectors of the Ogham magic grant their aid and wisdom to the followers of Sigmar and his allies, their only purpose to thwart the Dark Master and his lackeys.\n\nDark Emissaries and Truthsayers feature in the scenario_ [The Ogham Stones](/docs/campaigns/scenarios/town-cryer/the-ogham-stones) (See TC 15) _but if players wish they may be sought out for each battle in Albion in the same manner as Dramatis Persona. There is no hire fee for either character as they have their own agenda for joining the battle.\n\nHowever, wherever there is one the other will surely follow. If a warband successfully finds either a Dark Emissary or Truthsayer and the other warband does not then roil a D6 at the start of that warband's turn, on a roil of 4+ the opposing character appears to fight alongside the warband and is deployed at a random table edge (see 'Surprise Attack' for details). If the opposing warbands are both of 'evil' or 'good' alignment then the Dark Emissary or Truthsayer may not be sought out for the battle.",
      "mayBeHired": "",
      "rating": "",
      "profiles": [
        {
          "name": "Dark Emissary",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 2,
            "I": 3,
            "A": 1,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "skills": "",
      "specialRules": [
        {
          "name": "Staff of Darkness",
          "text": "+ 1 to his casting roll."
        },
        {
          "name": "The Spiral",
          "text": "A symbol of the Dark Master. It is a potent icon that protects the wearer from harm. It grants the Dark Emissary a 5+ save that cannot be reduced by anything."
        },
        {
          "name": "Wizard",
          "text": "The Dark Emissary is a powerful spell caster and knows four randomly determined spells of the [Lore of Darkness](/docs/magic/lore-of-darkness)."
        },
        {
          "name": "Alignment",
          "text": "Dark Emissaries are evil wizards and as such will only fight alongside Possessed, Undead, Skaven and other evilly aligned warbands."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:563-585"
    },
  },
  {
    id: "dijin_katal_the_renegade_assassin", name: "Dijin Katal, The Renegade Assassin", hireCost: {"base":85,"text":"85 gc"}, upkeep: null, grade: "1b", source: "Town Cryer 15, Lustria",
    detail: {
      "sourceLine": "Source: Town Cryer 15, Lustria ([PDF](https://broheim.net/downloads/towncryer/TownCryer15.pdf#page=27))",
      "hireLine": "85 gold crowns",
      "flavour": "How many years have I walked the earth? How many plains have I seen that stretch to the horizon? How many cities are there that are crammed with the filth and dregs of this world? And how many dark places have been my refuges? Yet I still miss that dreaded place Clar Karond... my home. I wonder what is happening amongst my kin what devious politics abound. Oh, how I miss the intrigue of a true civilisation. These are strange times. I never desired to travel to this hot insect-infested land of Lustria but now I am here it has a strange hold on me. I have delivered many to the grace of Khaine within this jungle. This jungle seems to cry out for blood. Although my murderous instincts have grown the animal inside is now in sated. What has become of me?\n\nStill, my blades run with the blood of my enemies the only thing that brings me comfort. I have the murderous instinct, which my people have practised for thousands of years and the addiction is strong. That night when I saw the broken bodies of my own kin on the floor in the carnival of horrors I knew that killing was my sole purpose. I also knew that it didn't matter who would be my prey - friend or foe it makes no difference to the unquenchable thirst within. And now my comrades hunt me. Although my thirst for another murder is great in good time soon it shall be quenched. My life is for Khaine.\n\nMy goal? To find some meaning to this mundane existence...\n\nKnown as 'The Hunter in the Shadows', 'The Thrice Cursed Renegade', 'He who Thirsts' and 'Kinslayer', among other things, Dijin Katal as greatly feared and loathed and that's just by his own people. The covens of the Druchii have a price on Katal's head and demand that he be captured alive for the Hag Queen's pleasure. Few know this Druchii's chequered past when they hire him in fact most are not even aware that he is Druchii, such is their ignorance.",
      "mayBeHired": "Any warband except for Amazons, Shadow Warriors, Dark Elves (obviously) and any warband that includes and type of Elven hired sword may hire Dijin Katal.",
      "rating": "Dijin Katal increases the warbands rating by 70 points.",
      "profiles": [
        {
          "name": "Dijin Katal",
          "stats": {
            "M": 5,
            "WS": 7,
            "BS": 5,
            "S": 4,
            "T": 3,
            "W": 2,
            "I": 7,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Dijin Katal wears a Druchii Assassin's Cloak and wields two Swords coated with Dark Venom and a Repeater Crossbow.",
      "skills": "Dijin Katal has the following skills: Strike to Injure, Quick Shot, Dodge, Lightning Reflexes and Trick Shooter.",
      "specialRules": [
        {
          "name": "Kindred Hatred",
          "text": "The Dark Elves have been fighting the High Elves for many centuries. The wars between the two races have been very long and bloody affairs. The Dark Elves are very bitter since they have been exiled from Ulthuan and thus they hate any High Elf warriors including High Elf Hired Swords."
        },
        {
          "name": "Excellent Sight",
          "text": "There are numerous legends detailing the excellent eyesight of the Elves, both Druchii and Ulthuan kin. Elves can spot hidden enemies from twice as far away than normal warriors (i.e. twice their Initiative value in inches)."
        },
        {
          "name": "Shadows Embrace",
          "text": "The Dark Elf has mastered the art of making the best use of shadows to hide, this is the legendary ability of the Dark Elf Scouts and the Assassins. If the Dark Elf is in cover and a model attempts to charge him, he can only charge the Elf using a charge move equal to his initiative in inches. In addition, missile weapons suffer an additional -1 penalty to hit on top of the penalty for cover."
        },
        {
          "name": "Perfect Killer",
          "text": "All attacks made by the Assassin, whether in shooting or close combat, have an extra -1 save modifier to represent his skill In striking at unarmoured spots."
        },
        {
          "name": "Renegade",
          "text": "Dijin is a kinslayer and therefore a renegade in Druchii eyes. Any Dark Elves that Dijin is fighting against will suffer Hatred towards him."
        },
        {
          "name": "Wanderer",
          "text": "Dijin Katal only ever stays with a warband for the duration of the battle. A warband who used Dijin Katal in their last battle may not seek him out until they have fought at least one battle without him."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:587-627"
    },
  },
  {
    id: "drenok_johansen_wielder_of_the_great_axe", name: "Drenok Johansen, Wielder Of The Great Axe", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Town Cryer 15, Lustria",
    detail: {
      "sourceLine": "Source: Town Cryer 15, Lustria ([PDF](https://broheim.net/downloads/towncryer/TownCryer15.pdf#page=29))",
      "hireLine": "70 gold crowns to hire: + 30 gold crowns upkeep.",
      "flavour": "The great sagas of the Norse tribes tell of a mighty warrior known as the Wielder of the Great Axe. Long ago in the icy, inhospitable tundra of the Norse land a young clansman with fire in his eyes and passion in his heart left his clan in search of his father's fate. His father was Johan warrior-prime, Chieftain of the Clan Icefang, possessed by a demon of Khorne. His father had disappeared rumoured to have travelled across the seas. Leaving the clan in a self-imposed exile he was never seen again in the lands of his birth.\n\nAfter many a long year within the realms of the Old World Drenok took ship to the New World in search of his father. Weeks dragged on into months and months into years until finally the day came when the two mortals finally crossed paths. Only then did Drenok truly know fear. For when Drenok looked into the face of his father he saw the Daemon within. A titanic struggle ensued between father and son. The battle was fierce and long, lasting for many hours. With each wound Drenok inflicted upon this demon, his father, anguish and rage consumed his soul. Finally his father fell and the battle was won. But this was no true victory, this was a day of mourning. For Drenok had now lost a part of his soul he could never reclaim. He gazed upon the great axe, which lay at the feet of his father's corpse and realised it to be the legendary axe of the Icefang, his clan. Lifting the mighty axe above his head, his hair braids blowing in the wind he roared in defiance of world. His quest would be to bring honour to the death of his father.",
      "mayBeHired": "Norse and human warbands may hire Drenok.",
      "rating": "Drenok increases the warbands rating by 70 points.",
      "profiles": [
        {
          "name": "Drenok Johansen",
          "stats": {
            "M": 4,
            "WS": 6,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 4,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Drenok wields the great Axe of the Icefang and he wears Sabertooth Tiger Hide.",
      "skills": "Fearsome, Strongman, Combat master and Step aside.",
      "specialRules": [
        {
          "name": "Berserker",
          "text": "If Drenok is reduced to zero wounds roll 1D6. On a score of 4+ he stands fighting until the end of the tum. You must roll every turn or he will be Out of Action."
        },
        {
          "name": "Icefang Axe",
          "text": "A massive double-handed axe, this weapon has been handed down through the ancestors of Ice fang throughout the generations. It is said that a revered ancestor used the axe and slew a great White Dragon many centuries ago. The axe is the same as a double-handed weapon but it can also Parry and has a +1 modifier to injury rolls."
        },
        {
          "name": "Sabertooth Tiger Hide",
          "text": "Gives Drenok a 6 save in close combat and 5+ against missile fire."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:629-659"
    },
  },
  {
    id: "heinrich_altdorf_schmidt", name: "Heinrich 'Altdorf' Schmidt", hireCost: {"base":75,"text":"75 gc"}, upkeep: {"base":null,"text":"1 treasure"}, grade: "1b", source: "Town Cryer 21",
    detail: {
      "sourceLine": "Source: Town Cryer 21 ([PDF](https://broheim.net/downloads/towncryer/TownCryer21.pdf#page=20))",
      "hireLine": "75 gold crowns to hire; + 1 treasure upkeep",
      "flavour": "Dr. Heinrich Schmidt is renowned at the University of Altdorf. However, most of this renown is not out of his scholarly works, but rather the priceless artifacts he sends home from his journeys. Thanks to him, artifacts from Kislev or Norsca, as well as far off places­ such as Cathay and Lustria have found their way home to Altdorf. Since all his findings are shipped back to Altdorf, this has earned him the nickname 'Altdorf' Schmidt. His main arena for relic hunting however, has come to be in Araby and Khemri, with its grand tombs and priceless treasures. The acquisition of the relics is not often discussed, as most of the scholars agree that they are more capable of appreciating them than the inhabitants of the lands from which they came.",
      "mayBeHired": "Any Human warband may hire Altdorf Schmidt.",
      "rating": "'Altdorf' Schmidt increases warband rating by + 75 points.",
      "profiles": [
        {
          "name": "'Altdorf' Schmidt",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 4,
            "S": 3,
            "T": 3,
            "W": 2,
            "I": 6,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "[Whip](/docs/campaigns/hired-swords/grade-1b#mule-skinner), Sword, Duelling Pistol, Light armour, Lantern, Rope & Hook.",
      "skills": "Tomb Explorer, Lightning Reflexes, [Whip Master](/docs/campaigns/hired-swords/grade-1b#mule-skinner), Step Aside, Streetwise, Dodge, Luck (re-roll any one dice during the game). (Rules for Whip & Whip Master can be found in the [Mule Skinner listing](/docs/campaigns/hired-swords/grade-1b#mule-skinner)).",
      "specialRules": [
        {
          "name": "Oh no, not Snakes!",
          "text": "'Altdorf' fears all snakes and serpents."
        },
        {
          "name": "Whip Swing",
          "text": "'Altdorf' Schmidt has developed a technique to use his whip as a rope to swing over gaps. To represent this, 'Altdorf' Schmidt can jump a gap (up to a maximum of 4'), without deducting the distance jumped from his normal Movement allowance. You must, however, still make an Initiative test not fall down. In addition, he may use his whip to jump to a lower level, even through windows. However, there must always be something on a higher level to attach the whip to in order of swing with it (just use common sense here - sewers, dungeons, tunnels, etc, always count as having something to attach the whip to). If 'Altdorf' Schmidt falls into a pit trap, he may try to use his whip to save himself from falling down by passing an Initiative test."
        },
        {
          "name": "No time for you",
          "text": "'Altorf' Schmidt is notorious for bejng a man in a hurry. If his charge path toward a hero, treasure or some other important target is obstructed by an enemy henchman who would prevent his charge, 'Altdorf' Schmidt may attempt a single shot with his Duelling Pistol before charging (assuming he didn't fire it last round of course). If this shot knocks down, stuns or takes the henchman out of action, 'Altdorf' Schmidt may charge as if the henchman wasn't there. If the enchman is unharmed, it counts as a failed charge as normal."
        },
        {
          "name": "I'll Take That!",
          "text": "Rather than being paid in gold, 'Altorf' collects relics and artifacts from the places he visits. His upkeep cost is taken as a piece of treasure."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:661-689"
    },
  },
  {
    id: "khar_mel_the_djinn", name: "Khar-mel The Djinn", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Town Cryer 21",
    detail: {
      "sourceLine": "Source: Town Cryer 21 ([PDF](https://broheim.net/downloads/towncryer/TownCryer21.pdf#page=19))",
      "hireLine": "80 gold crowns to hire + 30 gold crowns upkeep.",
      "flavour": "Djinn are magical elemental spirits akin to Daemons, that reside in the deep deserts of Araby and the Land of the Dead. They may be summoned by a complicated ritual involving dark pacts and unholy promises. Djinn are creatures born of the elements and may assume many different forms such as horses made of sand, pillars of fire or mighty Arabic warriors comprised of swirling air. As with all Daemons, anyone learning a Djinn's true name will receive great power over it. Djinn are ancient spirits and know many long forgotten secrets, especially from the early days of Nehekhara and for this reason many sorcerers and priests attempt to summon them to learn such forbidden knowledge. Sultan Jaffar was known to have been in prolonged contact with some of the mightiest Djinn, although many surmise that their lies led to his downfall.\n\nKhar-mel is one of the few known Djinn of Araby. She has oft been encountered in the western desert over the centuries. Despite being centuries old, she normally appears as a beautiful arabian woman of about 30 years of age, although she has been known to appear as a swirling cloud of dust or a pillar of fire on occasion.\n\nLike all Djinn, Khar-mel knows many secrets forgotten by mortal man and many sorcerers and priests have tried to summon her to answer their questions. If she does have one weakness it is her thirst for knowledge. A warband who claims that they are undertaking a quest in search of ancient lore may well secure Khar-mel's services.",
      "mayBeHired": "Any warband may hire Khar-mel. However in order to summon her, a Wizard (or other spell caster, including a Priest) must pass a test on his own Leadership. This Wizard may be a Hired Sword, but must have been with the warband for at least one battle prior to attempting to summon Khar-mel. If the Wizard that summoned Khar-mel is killed or leaves the warband, Khar-mel will leave as well.",
      "rating": "Khar-mel increases the warband's rating by +45 points.",
      "profiles": [
        {
          "name": "Khar-mel",
          "stats": {
            "M": 6,
            "WS": 4,
            "BS": 4,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 3,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Khar-mel is armed with a Scimitar but wears no armour.",
      "skills": "All Djinn have magical powers due to their spiritual and elemental nature. Khar-mel has mastered each of these in her time but she may only use one at a time. During her Recovery phase she may declare that she is using one of her powers. It will last until her next Recovery phase. She may not use the same power for two consecutive turns.\n\n**Whirlwind:** Khar-mel has the power to turn into a whirlwind. This can take many forms: a sandstorm, a pillar of fire or a hazy shimmer in the air. She can run at triple her movement but may not charge or be charged. She cannot make any attacks or cast spells while using this power, but is at -1 to hit with missile weapons.\n\n**Djinn's Curse:** Djinn are incredibly ancient creatures, prophets of fate and doom to many. This interferes with all of the Djinn's enemies within 4\", incurring a -1 penalty to their to-hit rolls (both with missiles and with close combat weapons) and all saves.\n\n**Djinn's Luck:** Djinn have been around for centuries and due to their prophetic powers are very good at avoiding trouble. This power confers a 4+ Ward save. If no save normally applies (eg, against magic weapons) then she gains a 6+ save.",
      "specialRules": [
        {
          "name": "Fear",
          "text": "The Djinn naturally radiate an aura of power and cause fear."
        },
        {
          "name": "Ethereal",
          "text": "Khar-mel has only a semi-solid form and has a 5+ save that is never be modified due to high Strength or anything else. The save is not effective against magical weapons."
        },
        {
          "name": "Elemental Magic",
          "text": "Khar-mel knows D3 spells chosen from the [Elemental Magic](/docs/magic/arabian-elemental-magic) list. Roll randomly on the Elemental magic list to determine the spells she may use."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:691-729"
    },
  },
  {
    id: "maximilian_the_mad", name: "Maximilian The Mad", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Nemesis Crown Supplement",
    detail: {
      "sourceLine": "Source: Nemesis Crown Supplement ([PDF](https://broheim.net/downloads/campaigns/nemesiscrown/Hired%20Swords%20&%20Dramatis%20Personae.pdf#page=5))",
      "hireLine": "80 gold crowns hire tithe, plus 30 gold crowns upkeep tithes.",
      "flavour": "Maximillian the Mad was a once-respected Warrior Priest and envoy in the thrall of the Grand Theogonist. Roaming the Great Forest with his bands of Flagellants, he acted as the eyes and ears of the Sigmaritic faith, looking for signs of corruption as he marched from town to town. Any that were found were ruthlessly and systematically purged.\n\nThat was until he was commissioned by his overseers to investigate rumours of blasphemy deep within the heart of the Great Forest. What Maximillian discovered there is unrecorded but is said to have driven him beyond the brink of sanity.\n\nNow largely a loner, he continues to rove the paths of the Great Forest, but the religious fervour within his soul combined with the hatred and intolerance of his passion threatens to destroy him and all he encounters.\n\nMaximillian the Mad will readily take up arms to assist those who fight the enemies of Sigmar, although he will demand a tithe to Sigmar for his services.",
      "mayBeHired": "Dwarfs and all human warbands except The Cult of the Possessed, Sisters of Sigmar, Carnival of Chaos, Horned Hunters and Middenheimers.",
      "rating": "Increases warband rating by 25 points.",
      "profiles": [
        {
          "name": "Maximilian",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 3,
            "T": 4,
            "W": 2,
            "I": 3,
            "A": 2,
            "Ld": 10
          }
        }
      ],
      "weaponsArmour": "Mad Max is armed with a double handed Holy Weapon. This grants +2 Strength as per the rulebook and being a holy weapon, it gives +1 to rolls to wound on Undead, Possessed, Carnival of Chaos, Beastmen.",
      "skills": "",
      "specialRules": [
        {
          "name": "Fanatical",
          "text": "Max will automatically pass al Leadership-based tests he is required to take. Mad Max follows the rules for hatred when encountering the following warbands: Orcs and Goblins, Black Orcs, Forest Goblins, Horned Hunters, Sisters of Sigmar, Middenheimers, Skaven, Undead, Beastmen, Possessed, Carnival of Chaos."
        },
        {
          "name": "Religious Fervour",
          "text": "Mad Max follows the rules for frenzy as per the rulebook. (Note, he must always charge, even if this requires a diving charge!) Also, he must always end his turn closer to the enemy than at the start as his desire to fight the enemies of Sigmar is so strong."
        },
        {
          "name": "Fear",
          "text": "His reputation is such that he causes fear as per the rulebook. Any models from the warband hiring him that are within 3” of him are also immune to fear. Note: models wishing to charge a fear causing enemy outside 3” still need to pass a fear test as normal."
        },
        {
          "name": "Strongman",
          "text": "As the skill of the same name."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:731-763"
    },
  },
  {
    id: "penthesilea_mark_of_the_serpent", name: "Penthesilea, Mark Of The Serpent", hireCost: null, upkeep: null, grade: "1b", source: "Town Cryer 15, Lustria",
    detail: {
      "sourceLine": "Source: Town Cryer 15, Lustria ([PDF](https://broheim.net/downloads/towncryer/TownCryer15.pdf#page=28))",
      "hireLine": "",
      "hireFee": "None. Penthesilea will come to the aid of any Amazon warband if they send one or more of their Heroines to look for her in the normal manner, rolling under their Initiative. If she does grant an audience, she might decide that her personal help is needed in the forthcoming battle. She will only come to the aid of a Amazon warband if their enemy has a higher warband rating. Consult the table below, and roll a D6 to see whether Penthesilea will aid the warband. A request for Penthesilea to aid the warband must be made for each battle you wish her to help the warband.\n\n| Difference in Warband Rating | Dice roll required |\n| --- | --- |\n| 0-49 | Nil |\n| 50-99 | 6+ |\n| 100-149 | 5+ |\n| 150-199 | 4+ |\n| 200+ | 3+ |",
      "flavour": "'I am the hunter and you are my prey.'\n\nPenthesilea is known as one of the greatest Amazon warriors and is a legend amongst her people. The Amazons were outraged by the oafish menfolk of the Norse settlement of Skeggi when they captured some Amazons in a raid planning to keep them as slaves. Penthesilea led a warband on a night raid against the timber halls of the Norse settlement. Her silent warriors slew the guards and they liberated their captured sisters. Before she could make good her escape, however, Penthesilea was set upon by the Norse Jarl Sigursen the Impaler, he who had led the raid to enslave her sisters. She slew this giant of a man in single combat and held his severed head high causing the rest of the Norse to flee. To further quench her thirst for revenge she kidnapped Sigursen's entire family to be used as slaves and sacrifices to the Serpent God. The battle of Skeggi was a milestone battle for the Amazons. None had accomplished what Penthesilea had. For it was her and her small band of Amazon warriors that had taken the fight straight to the supposedly invulnerable Norse stronghold and rescued their sisters slaying many men in the process. It was her brilliant guerrilla tactics and her ruthlessness that won the day. Since then, the men of the New World settlements live in fear and shudder at the mention of her name. Tales have it that no man has survived an encounter with her and many a mighty warrior's head hangs from her belt its mouth sewn shut as a sign of obedience.",
      "mayBeHired": "Penthesilea will only join Amazon Warbands.",
      "rating": "70 points.",
      "profiles": [
        {
          "name": "Penthesilea",
          "stats": {
            "M": 5,
            "WS": 5,
            "BS": 4,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 5,
            "A": 2,
            "Ld": 8
          },
          "rawStats": [
            "5*",
            "5",
            "4",
            "4",
            "4",
            "2",
            "5*",
            "2",
            "8"
          ]
        }
      ],
      "weaponsArmour": "Starsword, Starblade, Amulet of the Moon and wears Enchanted Skins (see Amazon equipment).",
      "skills": "Mesmerising dance, Savage Fury, Elixir of life, Weapon Master, Concealment.",
      "specialRules": [
        {
          "name": "Amazon",
          "text": "She is an Amazon and therefore all of the [Amazon special rules](/docs/warbands/grade-1b-warbands/amazons-lustria#special-rules) apply."
        },
        {
          "name": "Mark of the Serpent",
          "text": "The High Serpentine Priestesses have blessed the warrior prime with the greatest gift any warrior can bear in the name and glory of their race. The mark of the serpent. This magical tattoo is only given co the worthiest of Amazons warriors. Penthesilea gains +1 to her movement and Initiative (as marked by\\* on her profile)."
        },
        {
          "name": "Man-Hater",
          "text": "Having seen so many of her sisters captured or killed by raiders who are predominantly men she has developed a loathing for these uncouth, primitive creatures. Penthesilea is subject to Hatred of all human males (I'm sure we can work out which figures are male here!) and has many of their heads hanging from her belt."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:765-803"
    },
  },
  {
    id: "truthsayer", name: "Truthsayer", hireCost: null, upkeep: null, grade: "1b", source: "Town Cryer 15, Albion",
    detail: {
      "sourceLine": "Source: Town Cryer 15, Albion ([PDF](https://broheim.net/downloads/towncryer/TownCryer15.pdf#page=10))",
      "hireLine": "",
      "flavour": "Of all the mysteries of Albion perhaps the greatest is the purpose of the enigmatic figures known as Dark Emissaries and Truthsayers. These ancient wizards are erstwhile enemies and their secret battle hints at a greater struggle yet to pass. Dark Emissaries, servants of the Dark Master, a powerful and enigmatic figure are potentates of evil. They ally themselves with evil forces and seek to harness the power of the Ogham Stones for all manner of unknown and nefarious practices. Truthsayers, the druidic warrior-wizards, the benevolent protectors of the Ogham magic grant their aid and wisdom to the followers of Sigmar and his allies, their only purpose to thwart the Dark Master and his lackeys.\n\nDark Emissaries and Truthsayers feature in the scenario_ [The Ogham Stones](/docs/campaigns/scenarios/town-cryer/the-ogham-stones) (See TC 15) _but if players wish they may be sought out for each battle in Albion in the same manner as Dramatis Persona. There is no hire fee for either character as they have their own agenda for joining the battle.\n\nHowever, wherever there is one the other will surely follow. If a warband successfully finds either a Dark Emissary or Truthsayer and the other warband does not then roil a D6 at the start of that warband's turn, on a roil of 4+ the opposing character appears to fight alongside the warband and is deployed at a random table edge (see 'Surprise Attack' for details). If the opposing warbands are both of 'evil' or 'good' alignment then the Dark Emissary or Truthsayer may not be sought out for the battle.",
      "mayBeHired": "",
      "rating": "",
      "profiles": [
        {
          "name": "Truthsayer",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 4,
            "A": 2,
            "Ld": 9
          }
        }
      ],
      "weaponsArmour": "",
      "skills": "",
      "specialRules": [
        {
          "name": "Staff of Light",
          "text": "The staff can dispel a single enemy spell spell per turn on a roll of 4+. The staff also counts as a Halberd."
        },
        {
          "name": "The Triskele",
          "text": "The symbol of the Truthsayer's office, this icon protects them from harm with its benevolent energies granting the Truthsayer a 4+ save, which cannot be reduced by anything."
        },
        {
          "name": "Wizard",
          "text": "Truthsayers are powerful wizards and know three randomly determined spells of the [Lore of Light](/docs/magic/lore-of-light)."
        },
        {
          "name": "Alignment",
          "text": "Truthsayers are benevolent wizards and as such they will only aid Sisters of Sigmar, Witch Hunters, Mercenaries and any other 'good' aligned warbands."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:805-827"
    },
  },
  {
    id: "belandysh_condemned_champion_of_chen", name: "Belandysh, Condemned Champion Of Chen", hireCost: {"base":90,"text":"90 gc and 5 campaign points"}, upkeep: {"base":30,"text":"30 gc and 1 campaign point"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/dramatispersonae/btb/btb%20Dramatis%20Personae.pdf#page=4))",
      "hireLine": "90 gold crowns and 5 campaign points to hire, +30 gold crowns and +1 campaign point upkeep cost.",
      "flavour": "Belandysh was once a powerful Chaos Champion and Chieftain to the Tribe of the Rising Eagle, notable for their devotion to Chen, as Tchar is known amongst the Hung. When he turned from Chen’s paths, the Lord of Change blessed Belandysh in punishment, mutating the champion into a living symbol of constant change, gifting Belandysh a powerful blade that would deform his enemies into Chaos Spawn. Now he perfectly represents his former patron and can never be free, save in death. Perhaps that is the way the Master of Transfiguration meant for Belandysh to be after all.",
      "mayBeHired": "Marauders of Chaos, Beastmen, Norse and Possessed may hire Belandysh.",
      "rating": "Belandysh increases the warband’s rating by +130 points.",
      "profiles": [
        {
          "name": "Belandysh",
          "stats": {
            "M": 4,
            "WS": 0,
            "BS": 0,
            "S": 0,
            "T": 0,
            "W": 3,
            "I": 0,
            "A": 0,
            "Ld": 10
          },
          "rawStats": [
            "4",
            "D6",
            "0",
            "D6",
            "D6",
            "3",
            "D6",
            "D3",
            "10"
          ]
        },
        {
          "name": "Tol'Agath",
          "stats": {
            "M": 8,
            "WS": 3,
            "BS": 0,
            "S": 0,
            "T": 0,
            "W": 1,
            "I": 3,
            "A": 1,
            "Ld": 5
          },
          "rawStats": [
            "8",
            "3",
            "0",
            "D6",
            "D6",
            "1",
            "3",
            "1",
            "5"
          ]
        }
      ],
      "weaponsArmour": "Belandysh is armed with the [Broadsword of Damnation](/docs/campaigns/campaign-settings/border-town-burning/chaos-artefacts#broadsword-of-damnation) (see Chaos Artefacts). He wears a Helmet and a Chaos Armour that hardly hold his body together.",
      "skills": "Belandysh has the following skills: Fearsome, Strongman, and Ride Tol’Agath.",
      "specialRules": [
        {
          "name": "Immune to psychology",
          "text": "Belandysh is immune to psychology and automatically passes all Leadership tests."
        },
        {
          "name": "Inconsistency",
          "text": "Belandysh's body is mutating permanently. His variable attributes are determined whenever needed, once every turn."
        },
        {
          "name": "Regeneration",
          "text": "Whenever an enemy successfully inflicts a wound on Belandysh, roll a D6, on a result of 4 or more the wound is ignored and Belandysh unhurt. However, note that he may not regenerate wounds caused by fire or fire-based magic."
        },
        {
          "name": "Tol'Agath",
          "text": "Belandysh used to ride a normal Battle Horse when he was still a Marauder Chieftain. When turned into a Chaos spawn, Tol'Agath, his steed, was hardly spared and mutated as well. Tol'Agath acts as a Warhorse (including the Battle Schooled rule). In addition, it is subject to the Inconsistency special rule."
        },
        {
          "name": "Wrath of Tchar",
          "text": "If a battle ends with Belandysh being out of action and someone having picked up the Broadsword of Damnation, Belandysh is pulled into the Realm of Chaos and never seen again. He then cannot be hired again for the remainder of the campaign."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:836-869"
    },
  },
  {
    id: "grand_master_ippan_shu", name: "Grand Master Ippan Shu", hireCost: {"base":75,"text":"75 gc and 3 campaign points"}, upkeep: {"base":null,"text":"2 campaign points"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/dramatispersonae/btb/btb%20Dramatis%20Personae.pdf#page=2))",
      "hireLine": "75 gold crowns and 3 campaign points to hire, +2 campaign points upkeep cost",
      "flavour": "Although the populace of Sen’Quoi knows the name Ippan Shu, very few of them have ever seen him. Rumoured to be both a hundred years of age and a grand Master of the martial arts, he is also given supernatural aspects, such as the abilities of flight and the spitting of fire on those he calls foe.\n\nHis legend says that a former disciple, Xiao Lin, once tried to assassinate him as Ippan Shu lay sleeping. Still asleep, he fought his student, only awakening when a knife sliced of half his left moustache (a grave outrage, for a Cathayan elder’s beard represents his wisdom and experience). Angered, Shu immediately killed Xiao Lin, yet still he keeps his moustache trimmed short; The better to remind him that even the best can be found wanting and caught off-guard, that no matter how good you become, you can always be better.\n\nA loner, Ippan Shu can be found wandering the Borderlands, meditating or fighting the different opponents that dwell therein, be they terrible creatures of Chaos or the ferocious hobgoblin wolf riders; he sees them all as a way of bettering his arts. Some whisper that Shu seeks to face an opponent who will prove a better fighter than he and, until that day, will continue his wanderings, whether he lives another hundred years or achieves the highest reaches of enlightenment.",
      "mayBeHired": "Any warband which includes Humans or Elves, including Battle Monks, may hire Ippan Shu, not including Dark Elves, Outlaws and Bandits.",
      "rating": "Ippan Shu increases the warband’s rating by +110 points.",
      "profiles": [
        {
          "name": "Grand Master",
          "stats": {
            "M": 4,
            "WS": 7,
            "BS": 7,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 6,
            "A": 4,
            "Ld": 10
          }
        }
      ],
      "weaponsArmour": "Ippan Shu wields an iron fan in one of his hands. His other hand is fighting unarmed.",
      "skills": "Ippan Shu has the following skills: Art of Silent Death, Strike to Injure, Step Aside, Mighty Blow, all Speed and [Battle Monk](/docs/warbands/grade-1c-warbands/battle-monks-of-cathay#battle-monks-special-skills) special skills except Warmonger.",
      "specialRules": [
        {
          "name": "Bare-handed Fighting",
          "text": "Ippan Shu can fight without weapons and suffers no penalties when doing so. In fact, he then counts as having a second close combat weapon and gets +1 attack."
        },
        {
          "name": "Iron Fan",
          "text": "Ippan Shu’s iron fan can flick deadly force with the grace of a dance. The weapon grants him +1 Initiative and allows him to parry not only enemy blows but also missile shots (see below). Note that the Art of Silent Death skill applies to Lin’s fan attacks as well."
        },
        {
          "name": "Parry Missiles",
          "text": "Ippan Shu may use his iron fan to parry missiles. For each hit by a missile weapon he parries the shot if he beats the 'to hit' roll. Note that Ippan Shu also has the Dodge skill."
        },
        {
          "name": "Immune to Psychology",
          "text": "Ippan Shu is in total control of his emotions and therefore immune to psychology and automatically passes all Leadership-based tests."
        },
        {
          "name": "With the Elegance of a Feather",
          "text": "Ippan Shu’s moves appear supernatural to his enemies, as if he was flying. When running or charging he may move up to half his total movement rate (ie, 6” – see Lightning Speed skill) in any direction, not only on the ground. This can be combined with the _leap_ skill, thus allowing Ippan Shu to move up to 6+D6” in any direction. Note that he still must always finish his Movement on solid ground."
        },
        {
          "name": "Way of the Dragon",
          "text": "Being one of the most perfectly trained mystic Dragon Monks, Ippan Shu spits fire upon his enemies in the shooting phase. Use the flame template to determine which models suffer an automatic Strength 4 hit. In addition, hit models are set on fire on a roll of 4+ (see “Fire Rules” section). Note that Ippan Shu can use his breath attack even when he is engaged in close combat."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:871-909"
    },
  },
  {
    id: "innominatus_the_tilean_gladiator", name: "Innominatus, the Tilean Gladiator", hireCost: {"base":120,"text":"120 gc"}, upkeep: {"base":40,"text":"40 gc*"}, grade: "1c", source: "Mordheim Facebook Group", notes: "Upkeep is marked with an asterisk in the source index table; the footnote it points to was not captured in the scrape.",
    detail: {
      "sourceLine": "Source: Mordheim Facebook Group ([PDF](https://broheim.net/downloads/dramatispersonae/facebook/Innominatus%2C%20the%20Tilean%20Gladiator.pdf))",
      "hireLine": "120 gold crowns to hire, +40 gc or +20gc if Innominatus manages to fight a challenge upkeep",
      "flavour": "\"You ask for my name? Many has asked and none who have done so have lived. Come and ask with your blade, and let us find out!\"\n\nInnominatus, the Cursed Gladiator. The Unnamed. The Scourge of the Red Sands. This hulking Tilean pit fighter is known by many names, and his origin is shrouded in mystery and whispered legends. His face is hidden by an ancient helmet which he never removes, though those who claim that they have fought him and survived tell tales of hideous scars and unblinking eyes beneath the steel faceplate. He is festooned with countless weapons and pieces of armour -trophies of his countless victories, further adding to his fearsome reputation.\n\nMinstrels tell many conflicting stories of his origin: some say he once drank from the Well of Eternal Youth, but was cursed by gods for his hubris, doomed to an eternal life of bloodshed. Others say he once killed an evil necromancer in a duel who cursed him to walk the earth until he meets a warrior who can match his prowess in arms. None dare to ask Innominatus whether these tales have any truth to them.\n\nThe war-cries of innominatus still echo the creed of the ancient arenas of Tilea, using an accent not heard in a millennia. In the oldest of ruins of the ancient Tilean coliseums engravings show pictures of a gladiator Innominatus who once rose to fame when emperors still ruled Luccini. If he is indeed the same gladiator who once ruled the bloodied sands of Remas, he is must surely be a product of some ancient curse.\n\nIn these days of strife, the violence and the thrill of the kill has attracted Innominatus to Mordheim, where can be found in the squalid Fighting Pits, eternally looking for someone who could match him in single combat. To this end, he relentlessly seeks a duel with Aenur, the Sword of Twilight, but the Elf bladesman shows no interest in bloodsports. Thus Innominatus is willing to hire his services to warbands striking into the depths of Mordheim itself, hoping to find the Elf warrior and finally founding out once and for all who of them is the true Lord of War.\n\nMany a famed warrior has met their end by suddenly running into Innominatus amongst the ruins of the Cursed City, compelled into a duel only to become yet another bloody epitaph in the legend of Innominatus.",
      "mayBeHired": "Any warband except Skaven and Dark Elves may hire Innominatus.",
      "rating": "Innominatus increase the warband rating +90 points.",
      "profiles": [
        {
          "name": "Innominatus",
          "stats": {
            "M": 4,
            "WS": 5,
            "BS": 3,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 4,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Dark Elf Blade, Javelins, Dwarf Axe, Helmet, Light Armour, Shield.",
      "skills": "Innominatus has the following skills: Pit Fighter (+1WS, +1A when fighting in ruins, buildings and the Pit), Grizzled Veteran (Immune to psychology), Death without a face (Causes fear).",
      "specialRules": [
        {
          "name": "Pit Master",
          "text": "To survive in the pit you need to think fast and act even faster! Innominatus to survive so many fights as gained an incredible ability and speed to avoid enemy strikes and shots: He can avoid any hit from close combat and missile weapons on a D6 roll of 4+. Note that this roll is taken as soon as a hit is scored (shooting and close combat) to see whether the Innominatus dodges it or not, before rolling to wound, and before any effects from other skills or equipment (such as lucky charms)."
        },
        {
          "name": "Who is the hero?",
          "text": "Once per battle Innominatus can challenge any opponent hero, hired sword or Dramatis Personae on the battlefield to engage in a mortal duel (yes, including the leader and even if not in sight or hidden! Innominatus starts roaming across the streets shouting out the hero’s name with all sorts of wares!). If the opponent player refuses the duel the challenged hero, hired sword or Dramatis Personae is removed immediately from the battlefield. The challenged character is so scared to fight against Innominatus he prefers to run away and to hide so far away he will also miss the next game. If he accepts the challenge resolve the fight immediately. Roll to see which side charges and fight the battle as normal. Innominatus will benefit from the Pit Fighter skill. If Innominatus wins, see Thumbs Up/Thumbs Down rule. If the opponent wins remove Innominatus immediately from the battlefield, roll for injuries as usual and place the winning hero in his previous position. The hero or hired sword gains also 3XP for winning against a such great opponent."
        },
        {
          "name": "Thumbs Up/Thumbs Down",
          "text": "If Innominatus wins the fight, the looser is not immediately removed as out of action, the loosing player has the chance to decide if his hero will live or die!\n\n-   **Thumbs Up:** The life of the looser is saved but Innominatus will take as a trophy all the hero’s equipment, leaving him naked and shaking in the middle of the arena. Place the looser in his previous position but he is so shocked he will be subject to stupidity for the rest of the game (unless it is immune to psychology).\n-   **Thumbs Down:** Mercy is rare in the arena, Innominatus takes his blood tribute and the looser is slain. Remove the looser immediately from the battlefield and from the warband roster. All the heroes of the looser’s warband gain 1XP (having seen Innominatus in action has been a great lesson!) and the loosing player retains all the equipment of the dead model."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:911-952"
    },
  },
  {
    id: "luthor_wolfenbaum", name: "Luthor Wolfenbaum", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1c", source: "Mordheim Facebook Group",
    detail: {
      "sourceLine": "Source: Mordheim Facebook Group ([PDF](https://broheim.net/downloads/dramatispersonae/unsorted/Luthor%20Wolfenbaum%20v3.pdf))",
      "hireLine": "60 Gold Crowns to Hire and 25 Gold Crowns Upkeep cost\\*",
      "hireFee": "Luthor as a Dramatis Persona costs 60 Gold Crowns to Hire and 25 Gold Crowns Upkeep cost. In addition, after each battle roll a D6. On a roll of 1, Luthor has “misplaced” one of your Wyrdstone pieces if your Warband has any.",
      "flavour": "Luthor Wolfenbaum is known by many illustrious names, all invented by himself to enhance his reputation. He offers his services to anyone and everyone, and dons one of his many and varied garbs to best match the needs of a warband looking for help, and often uses an eyepatch on either of his eyes to enhance his disguises. He alternately claims to be the greatest swordsman in all of the Empire, an invincible bowman, or a great dark wizard when a less savoury warband is looking to bolster their ranks. In reality Luthor is none of these things, but he usually finds a way to hoodwink the Warband long enough with a combination of backstabbing, cunning, ruthlessness and sleight of hand to claim his pouch of gold before disappearing into the shadows, looking for a new Warband to gullible enough to pay for his services.",
      "mayBeHired": "",
      "rating": "Luthor increases a Warband’s rating by 35 points.",
      "profiles": [
        {
          "name": "Luthor",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 4,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 4,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "skills": "Step Aside, Dodge, Expert Swordsman, Sprint, Quick Shot (used with the Longbow and the Clay Orbs).",
      "specialRules": [
        {
          "name": "Evil Eye",
          "text": "Luthor is immune to any and all Eye Injuries. Ignore the [result 31](/docs/campaigns#31-blinded-in-one-eye) on the Permanent Injury roll table when rolling for Luthor."
        },
        {
          "name": "I am Everywhere",
          "text": "Two Warbands fighting against each other may each use Luthor. How this is possible is one of the enduring mysteries of Mordheim. In addition to the above, depending on which role he assumes, Luthor will be affected by the following Special Rules. Choose ones set:"
        }
      ],
      "otherSections": [
        {
          "name": "Luthor, the Crimson Blade of Reikland",
          "text": "_Most commonly, Luthor approaches new Warbands and claims to be the Crimson Blade of Reikland, the most fearsome swordsman between the sea and the World’s Edge Mountains, extorting a hefty price of gold for his services._\n\n**Equipment:** Armed with a custom Sword (can be wielded two-handed with +1S bonus, or in one hand with normal Strength), a Dagger, a suit of Heavy Armour and a Helmet.\n\n**May be Hired:** All human Warbands except Middenheimers (who’d never seek help from a Reiklander!) May hire Luthor as a Crimson Blade of Reikland."
        },
        {
          "name": "Special Rules (Luthor, the Crimson Blade of Reikland)",
          "text": "**The Crimson Blade:** Luthor is an expert at backstabbing enemies already engaged in combat. When attacking enemies engaged in melee against another opponent, Luthor gains +1 to hit, +1 to wound and +1 to Injury rolls.\n\n**Disengage:** Luthor knows that discretion is the better part of valour, and thus he is an expert at disengaging from combat. During his own movement phase, he can move away from any melee without his enemy having a chance of making any attacks. He can even charge another enemy this way."
        },
        {
          "name": "Luthor, the Dark Wizard Extraordinaire",
          "text": "_When Luthor hears that a Warband is looking for a master of the mystic arts, he grabs his “magical” staff decorated with a nailed fish, and starts ranting in a mixture of Tilean, Estalian, Norse and Bretonnian with Reikspiel swear words thrown in, claiming that these are “magic spells”. In this alter ego Luthor can offer his services even to the more unsavoury warbands such as the Undead who are looking for magical help in the dark corners of the settlements like Cutthroat’s Haven or the Dragon’s Demise. In battle the Dark Wizard Luthor fights with clay orbs filled with Tilean Fire. Luthor throws these missiles with great accuracy and claims that they are fireballs conjured with his mystic powers._\n\n**Equipment:** Luthor is armed with a Staff, wears Heavy Armour concealed under his garments, and has a Lucky Charm, Garlic, and a flask that he claims is a magic potion but is in reality Bugman’s Beer which makes him immune to Fear. Luthor uses clay orbs containing the alchemical mixture known as Tilean Fire.\n\n**May be Hired:** Luthor, the Dark Wizard Extraordinaire may be hired by any warband except Witch Hunters, Reiklanders or Sisters of Sigmar."
        },
        {
          "name": "Special Rules (Luthor, the Dark Wizard Extraordinaire)",
          "text": "**Fireballs:** Luthor can throw his clay orbs of Tilean Fire in the missile phase, even when engaged in melee combat (in melee choose any enemy in base contact). They have a range of 8”, and suffer no hit penalties for long range. If the orb hits, the target suffers 1 S2 hit from the bursting flames, and in addition the model needs to roll under the Initiative at the start of its next turn in order to see through the smoke. If the model fails, it cannot charge or shoot until the beginning of its next turn, though can otherwise move or act normally, and fight in hand-to-hand combat. Only one check is needed even if the target is hit by multiple Orbs due the Quick Shot skill.\n\n**Fish-slapping Dance:** The fish nailed to Luthor’s staff was actually cursed by the Witch living in the ruins of Sylvania. When used in close combat, on a roll to hit of 6, resolve the hit by the staff at double Strength (i.e. 8 instead of 4). Many a warrior has been felled by the fearsome slap of the fish!"
        },
        {
          "name": "Luthor, the Master Archer of Drakwald",
          "text": "_Luthor is a decent marksman, and he is especially good at boasting of his achievements as an archer, and equally good at claiming that any of his misses are due to freak gusts of wind, a curse of a witch, or the Halfling pie he ate last week. Luthor is also an expert at threatening his opponents, telling them that he once emasculated a Snotling at a thousand paces. Surprisingly many hardened warriors take Luthor’s threats seriously._\n\n**Equipment:** Armed with a Longbow, a Dagger, Hunting Arrows and a suit of Heavy Armour. Luthor uses Dark Venom in his arrows.\n\n**May be Hired:** Luthor, the Master Archer of Drakwald may be hired by any human, Elf or Dwarf Warband except Reiklanders - Luthor is too well known there as the Crimson Blade."
        },
        {
          "name": "Special Rules (Luthor, the Master Archer of Drakwald)",
          "text": "**Boast:** Before taking one of his shots in the Shooting Phase, Luthor may boast how he knows he is going to hit the target. If he hits the target with his missile attack, roll a D6: the result is a bonus that can be used as a bonus for any single to hit roll with a melee or missile attack or Leadership test (including Rout rolls). You can use the bonus AFTER making the roll. The bonus must be used before the beginning of Luthor’s next Shooting phase or the bonus is lost. If he misses, the entire Warband on Luthor’s side suffers -1 Ld cumulative penalty until Luthor hits another target. So if Luthor Boasts twice and misses twice, the whole Warband operates at -2 Ld.\n\n**Do you feel lucky, lad?** Luthor flamboyantly aims at one of his opponents and swears he will shoot him dead with a single arrow. The warrior is understandably unnerved and suffer -1 penalty to his WS and BS as he constantly has to check whether Luthor is going to shoot him. Pick a target for Luthor’s threats in the beginning of each of Luthor’s Missile phases - this can be any model in the opposing Warband, not just the nearest one. Luthor can only do this if he is not engaged in melee combat and not Stunned/Knocked down. Undead models, Daemons, animals and warriors immune to psychology such as Flagellants are immune to this ability."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:954-1018"
    },
  },
  {
    id: "luthor_the_looter", name: "Luthor the Looter", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1c", source: "Tuomas Pirinen, Mordheim Facebook Group, Mordheim 25th anniversary Celebrations",
    detail: {
      "sourceLine": "Source: Tuomas Pirinen, Mordheim Facebook Group, Mordheim 25th anniversary Celebrations ([PDF](https://broheim.net/downloads/dramatispersonae/unsorted/Luthor%20The%20Looter.pdf))",
      "hireLine": "60 Gold Crowns to Hire and 25 Gold Crowns Upkeep cost\\*",
      "hireFee": "Luthor as a Dramatis Persona costs 60 Gold Crowns to Hire and 25 Gold Crowns Upkeep cost. In addition, after each battle roll a D6. On a roll of 1, Luthor has “misplaced” one of your Wyrdstone pieces if your Warband has any.",
      "flavour": "Luthor has ever found one true love in his entire life: his love for gold and luxuries that would put even a Dwarf King to shame. He has an amazing knack of finding the Warbands who are exploring the areas of Mordheim where plenty of loot still abounds. He readily offers his services to such, always looking for a way to grab the riches for himself. In battle, he uses every dirty trick and underhanded ploy to wriggle free from any combat in order to focus on what really matters -looting every last inch of the City of the Damned!",
      "mayBeHired": "Luthor can be hired by any warband with no exceptions.",
      "rating": "Luthor increases a Warband’s rating by 35 points.",
      "profiles": [
        {
          "name": "Luthor",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 4,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 4,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "Sword, Heavy Armour, Pistol.",
      "skills": "Step Aside, Dodge, Expert Swordsman, Sprint, Pistolier. In addition, he has the Jump Up Skill - so eager he is to get to the treasure!",
      "specialRules": [
        {
          "name": "I Ain't Got Time For You!",
          "text": "Luthor is on a mission and has no time for frivolities such as melee combat. Luthor always succeeds when checking if he can escape from combat."
        },
        {
          "name": "Looter",
          "text": "Whenever Luthor enters a new building (as long as he is not Down or engaged in combat), he finds D6 Gold Crowns worth of loot -this can be done only once per building.\n\nAdd this to a running tally. If at the end of the battle, the leader of the Warband has to take a Leadership check. If successful, the warband gains half of the gold Luthor found. If the check fails, Luthor keeps all the looted gold!"
        },
        {
          "name": "Mordheim Guide",
          "text": "Luthor knows Mordheim better than almost any man alive. When rolling on Exploration chart, you may consult Luthor. If you do so, you may add +1 Dice to the total of Exploration dice rolled, and once you have rolled all the dice, you can change one dice to match any other result rolled.\n\nIf you use this ability ( +1 Dice and the adjustment), the leader of your warband has to take a Leadership check. If you fail, then ignore the result on the Exploration Chart as Luthor finds the location alone and takes everything for himself! You still gain standard income and Wyrdstone as normal."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1020-1054"
    },
  },
  {
    id: "maglah_khan_s_horde", name: "Maglah Khan's Horde", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1c", source: "Border Town Burning Supplement",
    detail: {
      "sourceLine": "Source: Border Town Burning Supplement ([PDF](https://broheim.net/downloads/dramatispersonae/btb/btb%20Dramatis%20Personae.pdf#page=3))",
      "hireLine": "80 gold crowns to hire, +25 gold crowns upkeep cost.",
      "flavour": "Hobgobla Khan rules the Great Steppes, keeping his hordes in alliance with the Chaos Dwarfs through cunning and strength, but also with the loyalty of tribal leaders amongst the hobgoblins. Such loyalty can be trusted only so far, as any individual khan may attempt to usurp the current Hobgobla, usually by gaining respect from the other chieftains and thus rising to take the position for themselves, before assassinating the previous incumbent.\n\nSuch was the way for Maglah Khan, who had planned for months and accumulated enough followers to make his play, yet perhaps it was the duplicitous nature of the hobgoblins or simply bad timing, but Maglah and the surviving members of his tribe were forced to flee after the Hobgola ordered their deaths.\n\nTaking to the Steppes and staying at least two steps ahead of any pursuers, Maglah Khan is now mercenary and guide to any who would need both and seek his aid. Astride Denglesh, his wolf steed, Maglah performs these roles easily, the few survivors from his tribe riding point and rear, but woe betide any who forget the basic nature of a hobgoblin, for Maglah and his men are as likely to run at the first sign of trouble as they are at the merest hint of incoming hobgoblins. More so if you pay them beforehand.",
      "mayBeHired": "Orcs & Goblins, Ogres, Chaos Dwarfs, Marauders of Chaos, Norse, Beastmen, Possessed and Mercenaries may hire Maglah Khan’s Horde.",
      "rating": "Maglah Khan increases the warband’s rating by +60 points.",
      "profiles": [
        {
          "name": "Maglah Khan",
          "stats": {
            "M": 4,
            "WS": 5,
            "BS": 5,
            "S": 3,
            "T": 3,
            "W": 2,
            "I": 4,
            "A": 2,
            "Ld": 7
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
      "weaponsArmour": "Spear, Sword, Bow, Shield, Heavy Armour and Helmet. Maglah rides a Giant Wolf.",
      "skills": "Maglah Khan has the following skills: Quick Shot, Eagle Eyes, Trick Shooter, Ride Giant Wolf and Horse Archer (treat as Giant Wolf Archer).",
      "specialRules": [
        {
          "name": "Maglah's Boyz",
          "text": "Maglah is always accompanied by some of his loyal Hobgoblin Wolfboyz. Therefore a warband cannot hire Maglah alone but must hire some of his retinue as well. A warband with Maglah Khan must hire multiple [Hobgoblin Scout Hired Swords](/docs/campaigns/hired-swords/grade-1c#hobgoblin-scout) as long as he stays in the warband. The minimum is always two and up to a maximum of five Hobgoblin Scouts may be taken. When Maglah leaves the warband all Hobgoblin Scouts except for one will also leave."
        },
        {
          "name": "Hobgoblin leader",
          "text": "Maglah Khan is the leader of all Hobgoblin Scouts in the warband. Any Hobgoblin Scout within 6“ of him may use his Leadership when taking Ld tests. They may not use the warband’s leader Leadership."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1056-1087"
    },
  },
  {
    id: "aksho_akhash_the_vile_dreadwing_lord_of_the_carrion_throne", name: "Aksho'akhash the Vile Dreadwing, Lord of the Carrion Throne", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "2a", source: "Mordheim Facebook Group",
    detail: {
      "sourceLine": "Source: Mordheim Facebook Group ([PDF](https://broheim.net/downloads/dramatispersonae/facebook/Aksho%27akhash.pdf#page=4))",
      "hireLine": "30 gold crowns to hire\\* + 30 gold crowns upkeep.",
      "hireFee": "\\* The hiring fee represents the ingredients for performing the summoning ritual and are consumed regardless of the success of the ritual.",
      "flavour": "Upon completing an intricate summoning ritual involving one dead goat, two pinches of wyrdstone powder, and a grisly book of Chaos Magic most foul, the air takes an odour of sulfur and from an explosion of fresh goat blood a horrifying visage appears, though not the one that was expected.\n\nThe obscure tales of this “Daemon Lord” seem to have been greatly exaggerated; Aksho'akhash the “Vile Dreadwing” and “Lord of the Carrion Throne” appears to be nothing but a typical Chaos Fury that is somewhat more cunning than others of its kind and has a kleptomaniacal obsession for hoarding bits of garbage that only an insane Daemon could see the value of.\n\nIt is quickly apparent that any “immense treasure hoard of legend” that this Lesser Daemon might possess would not contain anything useful to a mortal, but perhaps one could put this interdimensional scavenger’s skills to good use in exploring the ruins of the City of the Damned.",
      "mayBeHired": "All warbands devoted to Chaos (such as the Cult of Possessed and Beastmen Raiders) may attempt to hire Aksho'akhash by having a spell-caster in the warband attempt a summoning ritual once after each game.\n\nThe spell-caster must possess the Macabre Tome from the ‘Flurry of Furies’ scenario (see the previous page), pay the hiring fee\\*, and pass a Leadership test. If the ritual is successful, the Macabre Tome is destroyed and the Daemon is summoned.",
      "rating": "Aksho'akhash increases the warband's rating by +35 points.",
      "profiles": [
        {
          "name": "Aksho'akhash the Vile Dreadwing, Lord of the Carrion Throne",
          "stats": {
            "M": 4,
            "WS": 5,
            "BS": 3,
            "S": 4,
            "T": 3,
            "W": 3,
            "I": 5,
            "A": 2,
            "Ld": 10
          }
        }
      ],
      "weaponsArmour": "Aksho'akhash has razor-sharp claws with which it tears at its prey and is made from raw magic itself. It has no need for weapons or armour.",
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
          "name": "Daemonic Instability",
          "text": "Daemons are bound to the world by dark sorcery that is highly volatile and unstable. If taken out of action, Aksho'akhash is banished and effectively destroyed on a D6 roll of 1-3 (do not roll for injury). If the spell-caster that summoned the Daemon is killed or leaves the warband, the Daemon is banished from whence it came."
        },
        {
          "name": "Coward King",
          "text": "One does not grow to become ruler of a rubbish heap without a healthy respect for the integrity of one’s corporeal form. Unlike other Daemons of its ilk, Aksho'akhash is not immune to any psychology. Additionally, unlike other warriors that cause fear, Aksho'akhash itself is not immune to fear tests caused by other warriors."
        },
        {
          "name": "Fly",
          "text": "Instead of moving normally (unless knocked down or stunned), Aksho'akhash may choose to:\n\n-   Move anywhere within 12\" including into base contact with an enemy (in which case it counts as charging).\n-   Move vertically without needing to climb.\n-   Jump from any height without falling."
        },
        {
          "name": "Aethereal Hoarder",
          "text": "Aksho'akhash has spent millennia picking through debris across the cosmos. While no mortal mind could comprehend exactly why such objects compel his attention, his skills for finding a diamond in the rough are valuable indeed.\n\nAfter each game, so long as Aksho'akhash was not taken out of action, it may perform one of the following tasks:\n\n-   Reroll one exploration dice.\n-   Search for a rare item as if it was a Hero; add 1 to the roll.\n-   Find trinkets amongst the ruins worth 2D6 gold crowns."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1096-1144"
    },
  },
  {
    id: "busty_gwen", name: "\"Busty\" Gwen", hireCost: {"base":null,"text":"See special rules."}, upkeep: null, grade: "2a", source: "Fanatic Online 89",
    detail: {
      "sourceLine": "Source: Fanatic Online 89 ([PDF](https://broheim.net/downloads/fo/89RunnersUp.pdf))",
      "hireLine": "",
      "hireFee": "See special rules.",
      "flavour": "Gwendalyn Brumsfield or “Busty” Gwen as her regulars know her; is the lone proprietor and sole employee of the “Stoat and Pitcher”. Dealing with pickpockets, thieves, and even lower rabble every day, Gwen has become a characteristically hard woman. In addition, having little or no help through the years has resulted in her building muscles that would shame even some marauders of the north. Still, she enjoys her trade, and is jovial and kind to those who treat her and “The Stoat” with respect.\n\nA central hub for warbands, bone pickers, and other such treasure seeking masses; the Stoat and Pitcher has become a well respected (for the areas around Mordheim anyways) establishment, where many warbands have begun, and dissipated.",
      "mayBeHired": "See below.",
      "rating": "“Busty” Gwen increases your warband rating by +40 points, plus 1 point for each experience point she has.",
      "profiles": [
        {
          "name": "“Busty” Gwen",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 1,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 3,
            "A": 2,
            "Ld": 8
          }
        }
      ],
      "weaponsArmour": "",
      "equipment": "Knives and rolling pin.",
      "skills": "Step Aside, Mighty Blow, Strike to Injure.",
      "specialRules": [
        {
          "name": "Rolling Pin",
          "text": "Gwen uses her trusty rolling pin to keep surly customers in line. As such, treat the rolling pin as a cudgel in close combat. In addition, it was hand made by Gwen herself, with a reinforced iron center; add +1 S to any attacks she makes with this monstrosity."
        },
        {
          "name": "Massively Built",
          "text": "As any visitor can tell you, Gwen is a massive woman. During the shooting phase, if she is not in close combat, and hasn't run, she may “show her stuff” to any visible male target within 12”. The target model must make a Ld check or lose his entire next turn as he stands dumbfounded by her impressive bulk.\n\nNaturally, females, skaven, orcs, and other non-human races are immune to this. While most undead are immune, Vampires, and Necromancers are not. Elves and Dwarves are affected, though not necessarily gaping in awe as much as disgust. _(Optional)_ Any Slaaneshi cult members who fail their leadership check must take a further -1 Ld penalty for the remainder of the game."
        },
        {
          "name": "Not Hired Muscle",
          "text": "Gwen knows all too well the corruption the City of the Damned spawns, and steers well clear. This does not however, stop her from turning a pretty profit. Gwendalyn runs a risky business operating outside of Mordheim and must be very careful to not become prey to the ravenous bands of treasure seekers. She also has an incredible number of connections with the scummier folk whom make their homes in and around the city ruins.\n\nA gang must send someone to look for Gwen as per normal rules. However once sent she is always found automatically. _(No need to roll under initiative)_ This will set up the initial bargain. The warband will then need to fight the scenario listed below using Gwen as a Hired Sword. The game may be played with an Arbitrator, or a second gang may opt to fight in the Arbitrator’s place. In a campaign this game still counts against the maximum games playable.\n\nIf the warband wins, they may choose any single, usable Personae Dramatis or Hired Sword and will gain their services free of charge for their next game only. If they lose, they must pay Gwen 2D6×5gc to pay for repairs to the Stoat. Either way, the warband may still look for treasure and wyrdstone following all the normal restrictions.\n\nIn a one-off game, treat Gwen as a normal Dramatis Personae with a cost of 85gc whom adds +65 to the warband's overall rating."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1146-1182"
    },
  },
  {
    id: "the_dark_jester_in_mordheim", name: "The Dark Jester in Mordheim", hireCost: {"base":75,"text":"75 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "2a", source: "Fanatic Online 17",
    detail: {
      "sourceLine": "Source: Fanatic Online 17 ([PDF](https://broheim.net/downloads/fo/17LetTheDaemonHaveTheLastLaugh.pdf#page=2))",
      "hireLine": "75 gold crowns to hire; +30 gold crowns upkeep cost.",
      "flavour": "",
      "mayBeHired": "Only Carnival of Chaos and Possessed warbands may hire the Dark Jester — anybody else just doesn’t have the right sense of humour!",
      "rating": "The Dark Jester increases a warband’s rating by +55 points.",
      "profiles": [
        {
          "name": "The Dark Jester in Mordheim",
          "stats": {
            "M": 4,
            "WS": 3,
            "BS": 3,
            "S": 3,
            "T": 3,
            "W": 2,
            "I": 6,
            "A": 2,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "The Dark Jester has a skeleton ‘hobby horse’ (counts as a club) and a sack of spikes (counts as a morning star) which he wields in humorous fashion in combat.",
      "skills": "The Dark Jester has the following skills: Leap, Acrobat, Lightning Reflexes, Jump Up, and Dodge.",
      "specialRules": [
        {
          "name": "Loner",
          "text": "The Dark Jester is used to walking the lone path, content with the schizophrenic comforts of the daemon he harbours. As such he never has to test for being All-alone."
        },
        {
          "name": "Confound and Confuse",
          "text": "In combat the Dark Jester uses a series of distraction and confounding ‘tricks’ to gain the upper hand on his hapless adversaries. At the start of each combat turn (his and his opponents) he may select one of the ‘tricks’ below to use in that round.\n\n-   **Sidestepper:** The Dark Jester weaves and bobs in combat as if he were a puppet hung from preternatural, prescient strings. In hand-to-hand combat the Dark Jester has a special dodge save of 4+ that cannot be modified by the strength of the attack.\n-   **Babbling Banter:** The Dark Jester babbles inanely and taunts his opponents, distracting them and opening up their defences as they recklessly try to silence him. All enemy models in base-to-base contact with the Dark Jester are at -1 to hit in hand-to-hand combat and their opponents are at +1 to hit those affected.\n-   **Trip:** The Dark Jester lures his opponent toward him with a few cutting taunts and then deftly steps aside their fatal swipe to upend them into the dirt. The Dark Jester may forgo rolling to ‘wound’ after a single attack and may instead elect to ‘trip’ his opponent. The Dark Jester rolls a D6. On a roll of 2+ his opponent is tripped and counts as ‘knocked down’."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1184-1210"
    },
  },
  {
    id: "the_headless_horseman", name: "The Headless Horseman", hireCost: {"base":100,"text":"100 gc"}, upkeep: null, grade: "2a", source: "Sylvania Supplement",
    detail: {
      "sourceLine": "Source: Sylvania Supplement ([PDF](https://broheim.net/downloads/dramatispersonae/sylvania/The%20Headless%20Horseman.pdf))",
      "hireLine": "100 gold crowns to hire.",
      "flavour": "Although most mindless creatures usually have no wish for money, the Headless Horseman seems compelled to continue his life of banditry by whatever mysterious force keeps his lifeless body moving.",
      "mayBeHired": "Warbands who are not of good alignment may hire the Headless Horseman.",
      "rating": "The Headless Horseman increases a warband’s rating by +80 points.",
      "profiles": [
        {
          "name": "Horseman",
          "stats": {
            "M": 0,
            "WS": 4,
            "BS": 5,
            "S": 4,
            "T": 4,
            "W": 2,
            "I": 6,
            "A": 2,
            "Ld": 8
          },
          "rawStats": [
            "\\-",
            "4",
            "5",
            "4",
            "4",
            "2",
            "6",
            "2",
            "8"
          ]
        },
        {
          "name": "Steed",
          "stats": {
            "M": 8,
            "WS": 2,
            "BS": 0,
            "S": 3,
            "T": 4,
            "W": 2,
            "I": 2,
            "A": 1,
            "Ld": 5
          }
        }
      ],
      "weaponsArmour": "Head or no head, this horseman still knows how to kill things! The Headless Horseman is armed with a brace of Dueling Pistols, a Double Handed Axe, a dagger, and wears Light Armour. He also has superior black powder and a lantern. Note that combined, the Light Armour and the Nightmare Steed give the Headless Horseman a save of 5+.",
      "skills": "The Headless Horseman has the following skills: Horse Archer, Pistolier, Eagle Eyes, Trick Shooter, and Strongman.",
      "specialRules": [
        {
          "name": "Causes Fear",
          "text": "The Headless Horseman is a harrowing sight to behold and therefore causes fear."
        },
        {
          "name": "Immune to Psychology",
          "text": "The Headless Horseman and his steed are never affected by psychology and they never leave combat. However, if the Headless Horseman suffers a wound, he must roll on the Whoa Boy! table as normal."
        },
        {
          "name": "Immune to Poison",
          "text": "The Headless Horseman and his steed are unaffected by all poisons."
        },
        {
          "name": "Faithful Steed",
          "text": "The same dark magics that animate the Headless Horseman also keep his loyal steed at his side. As a result, he may never dismount."
        },
        {
          "name": "Undead",
          "text": "Both the Headless Horseman and his steed count as undead for the purposes of Blessed Water, etc."
        },
        {
          "name": "Expert Rider",
          "text": "The Headless Horseman is a superb rider and as such he counts as being stationary even if he has moved that turn (i.e., no -1 modifier to hit)."
        },
        {
          "name": "Rapid Reload",
          "text": "The Headless Horseman’s speed at reloading is legendary and he can reload both of his pistols in the blink of an eye! Because of this he can fire with both (the skill Pistolier) of his dueling pistols every Shooting Phase."
        },
        {
          "name": "Head Hewer",
          "text": "Ever since the loss of his own head, the Headless Horseman has started his own morbid collection with the very same axe which caused his own grizzly demise. When the Headless Horseman charges, all attacks with his double handed axe cause +1 to all injury rolls and he causes a critical hit on a roll of 5-6. Note this only counts for the turn in which the Headless Horseman has charged, and not subsequent turns in which he is still engaged in hand-to-hand combat."
        },
        {
          "name": "Wanderer",
          "text": "The Headless Horseman only stays with a warband for the duration of one battle. A warband who used the Headless Horseman in their last battle may not seek him out until they have fought at least one battle without him."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1212-1253"
    },
  },
  {
    id: "the_foole", name: "The Foole", hireCost: {"base":40,"text":"40 gc"}, upkeep: null, grade: "2a", source: "Fanatic Online 89",
    detail: {
      "sourceLine": "Source: Fanatic Online 89 ([PDF](https://broheim.net/downloads/fo/89RunnersUp.pdf))",
      "hireLine": "40 gold crowns to hire.",
      "flavour": "",
      "mayBeHired": "The Foole may only be hired by non-good warbands or Mercenaries. Witch Hunters, Sisters of Sigmar, and Bretonnians automatically hate Schleige.",
      "rating": "The Foole increases the warband's rating by +30 points.",
      "profiles": [
        {
          "name": "Foole",
          "stats": {
            "M": 4,
            "WS": 4,
            "BS": 4,
            "S": 4,
            "T": 3,
            "W": 1,
            "I": 4,
            "A": 1,
            "Ld": 7
          },
          "save": "None"
        }
      ],
      "weaponsArmour": "",
      "equipment": "Sword, dagger, Poison Ring (See Special Rules).",
      "skills": "Schleige has the following skills: Acrobat, Lightning Reflexes.",
      "specialRules": [
        {
          "name": "Unhinged",
          "text": "Schleige is totally and irrevocably insane. As such, he is totally immune to all Psychology and All Alone tests."
        },
        {
          "name": "“Bored now…”",
          "text": "The mind of the Foole is like quicksilver, ever wandering and searching for new atrocities and stimulation. As such, he tires of routine and will never work for a single warband consecutively. A warband who used Schleige in their last battle may not seek him out until they have fought at least one battle without him. As unhinged and depraved as he is, most warbands would not seek him out again quickly as it is…"
        },
        {
          "name": "Poison Ring",
          "text": "Schleige wears a ring of his own devising that hides within it a poison he calls Giggle Juice. The poison causes the victim's muscles to cramp and contract severely, often strongly enough to cause the chest muscles to splinter the victim's ribs and crush his lung. Facial muscles twist and distort the victim's expression into a ghastly, grinning rictus. Once per battle, Schleige may, instead of making a normal attack, choose to spray a single opponent in hand-to-hand combat with a high power spray of Giggle Juice. This is an automatic STR 2 hit, and the poison adds a +1 to Injury Rolls. If taken out of action by the poison, during the post battle sequence if the warrior rolls any result except for Dead or Full Recovery, he gains the serious injury Nervous Condition (in addition to the regularly rolled result)."
        },
        {
          "name": "Sadist",
          "text": "Schleige takes supreme pleasure in the slow and inventive suffering of others. If an opposing warband member is Captured, Schleige will step up and demand he be given the warrior for his 'tastes'. The warrior is considered dead, and his weaponry, etc, may be kept by the capturing warband."
        },
        {
          "name": "Master Craftsman",
          "text": "A wondrous toymaker in his former life, Schleige retains his skills with devices and invention, though now his warped mind turns this talent to the darker arts. After the battle, a single warrior from the hiring warband may approach the Foole and ask him to improve a single weapon. Schleige, however, is not known for being a rational creature; roll on the chart below."
        },
        {
          "name": "D6 Result",
          "text": "1 — Schleige merely stares at the warrior, giggling and babbling inanities.  \n2-5 — Schleige takes the offered weapon and shuffles off, bent low over it and muttering. The next morning, the weapon will be found outside the warrior's tent, more often than not garishly painted or adorned with bits of children's toys (or less savory trophies). To determine how the weapon has been modified, roll an additional D6:\n\n-   1-2 — The weapon now has +1 STR.\n-   3-4 — The weapon now adds +1 to the wielder's Initiative.\n-   5-6 — Next to the weapon sits a vial of Giggle Juice, which may be used to coat the weapon. Giggle Juice adds a +1 STR to the weapon as well as a +1 to the Injury roll. There is enough poison in the vial for two battles.\n\n6 — Schleige takes the offered weapon, laughs wickedly, then attacks! Treat the encounter as a single combat. The defending warrior must fight without the weapon he has just foolishly handed to a madman; Schleige may use either his own sword or the weapon he has just been given. After combat, Schleige will discard the new weapon and scamper off into the ruins, giggling madly."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1255-1295"
    },
  },
  {
    id: "sigmund_spindle_the_harvester_of_flesh", name: "Sigmund Spindle, the Harvester of Flesh", hireCost: {"base":70,"text":"70 gold crowns to hire; Sigmund Sprandle may also be hired in the payment of one body part. If you wish to do this then a chosen Hero suffers one Severe Arm Wound and may only use one single handed weapon from now on."}, upkeep: {"base":35,"text":"35 gc"}, grade: "2a", source: "Sylvania Supplement",
    detail: {
      "sourceLine": "Source: Sylvania Supplement ([PDF](https://broheim.net/downloads/dramatispersonae/sylvania/Sigmund%20Spindle.pdf))",
      "hireLine": "70 gold crowns to hire, +35 gold crowns upkeep cost. Sigmund Sprandle may also be hired in the payment of one body part. If you wish to do this then a chosen Hero suffers one Severe Arm Wound and may only use one single handed weapon from now on.",
      "flavour": "_No one knows what happened the day that Sigmund Sprandle left with that man, but what is for certain is that what returned the following evening was no longer a humble farm worker._ Sigmund carries a long scythe that he once used for harvesting, and a large sack once used to hold grain. He is known to sell his services to groups of men willing to help him harvest more flesh for who knows what purpose.",
      "mayBeHired": "Sigmund may be hired by any evil or chaotically aligned warband.",
      "rating": "Sigmund increases a warband’s rating by +65 points.",
      "profiles": [
        {
          "name": "Sigmund",
          "stats": {
            "M": 6,
            "WS": 5,
            "BS": 2,
            "S": 5,
            "T": 4,
            "W": 2,
            "I": 7,
            "A": 3,
            "Ld": 7
          }
        }
      ],
      "weaponsArmour": "Sigmund carries a scythe and that is all!",
      "skills": "Sigmund Spindle has the following skills: Sprint, Scale Sheer Surfaces, Dodge, Lightning Reflexes, Step Aside, Unstoppable Charge.",
      "specialRules": [
        {
          "name": "Maddened",
          "text": "Although Sigmund is no longer living his terribly scarred mind survives in some areas. Sigmund is therefore subject to Frenzy."
        },
        {
          "name": "Causes Fear",
          "text": "Sigmund is a terrifying foe in combat and therefore causes fear."
        },
        {
          "name": "Immune To Poison",
          "text": "Sigmund is unaffected by all poisons."
        },
        {
          "name": "No Pain",
          "text": "Sigmund ignores all knocked down and stunned results on the Injury chart. He must lose his last wound and be taken out of action before he is removed from battle."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1297-1327"
    },
  },
  {
    id: "william_schakestange_master_bard", name: "William Schäke­stange, Master Bard", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "2a", source: "Letters of the Damned 4",
    detail: {
      "sourceLine": "Source: Letters of the Damned 4 ([PDF](https://broheim.net/downloads/lod/LOD4.pdf#page=5))",
      "hireLine": "70 gold crowns to hire; +30 gold crowns upkeep cost.",
      "flavour": "Inside and outside of Mordheim, William’s fame as a bard is well known. Having lost his horse shortly upon his arrival to the shadowy city, William replaced his mount with the next cheapest beast of burden: actors. Traveling far on his pantomime horse, William seeks out the underdogs, the dark horses, and further discouraged men of virtue. To him, they are fodder for his greatest play yet, a constant web of excitement and woe. The relationship is not completely one-sided, though, as William is a stirring ally.\n\nUnlike other bards, William does not sing, but his recitations and speeches can turn spines from jelly to steel. And he can do more than support morale. Despite his flowery words and graying temples, the writer is a surprisingly spry fighter. He can duck and weave as fast as any Skaven, and his rapier has seen more than staged fights. But his best asset to any warband is his Pages of Couragio, a tally of daring acts and good luck. Warriors have turned from kittens to lion in hopes of making William’s famous account.",
      "mayBeHired": "Any Mercenaries, Sisters of Sigmar and Witch Hunters may hire William. Furthermore, any good-aligned warband may hire William on a roll of 4+.",
      "rating": "William increases a warband’s rating by +60 points. You may also field him with his Pantomime Horse for an extra +6 rating. (There is no additional gold cost.)",
      "profiles": [
        {
          "name": "William",
          "stats": {
            "M": 4,
            "WS": 5,
            "BS": 3,
            "S": 4,
            "T": 3,
            "W": 2,
            "I": 5,
            "A": 2,
            "Ld": 8
          }
        },
        {
          "name": "Pant. Horse",
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
      "weaponsArmour": "Rapier, dagger and light armour. He also carries a Lucky Rabbit’s foot (superstitious actors…).",
      "skills": "William has the following skills: Jump Up, Dodge, and Lightning Reflexes. He also has the mounted skill Ride Pantomime Horse and the skill Swashbuckler from the Pirate Warband list (and yes, he may use the skill even on horseback!).",
      "specialRules": [
        {
          "name": "Songster",
          "text": "A Bard's rousing war songs steel the hearts of all those around him. Any friendly model within 6\" of William may re-roll any failed Leadership test with a +1 to Leadership. This includes rout tests."
        },
        {
          "name": "Pantomime Horse",
          "text": "A pair of brave, loyal actors in a very tattered costume. The Pantomime Horse is treated as a Warhorse with all the normal rules that apply. The exception is that the Pantomime Horse will never bolt. If you desire, William can play any game unmounted."
        },
        {
          "name": "Pages of Couragio",
          "text": "During any match in which you are NOT the highest ranking warband, you may use William’s ‘Pages of Couragio’ ability:\n\nKeep track of any Hero or Henchmen group member in your warband who performs one of the following acts. That warrior is rewarded a Couragio Point (with Henchmen, the group gets the point):\n\n-   Intercepts a charge.\n-   Takes an enemy warrior Out of Action who was NOT Knocked Down or Stunned.\n-   Successfully passes a Fear test to charge an opponent.\n-   Successfully makes a Diving Charge.\n-   Survives a Combat Phase, during which he is outnumbered at least two to one.\n\nAt the end of the game, randomly choose a Hero or Henchmen group that earned at least one Couragio point. If the chosen person was a Hero, that Hero gains an extra D3 experience this game. If instead you choose a Henchmen group, the entire group earns 1 extra experience for the game.\n\nCouragio Points do not carry over from one game to the next. Non-experience-gaining warriors cannot gain Couragio points."
        }
      ],
      "sourceFile": "05-dramatis-personae.md:1329-1372"
    },
  },
];

/** The "clarification of grades" block, verbatim (source lines 1284-1288). */
export const DRAMATIS_PERSONAE_GRADE_NOTES: string = "Core: Published in the original Mordheim Rulebook. Grade 1a: GW/Fanatic Rules deemed \"official\" in the 2005 Rules Review. Grade 1b: Unofficial, but released through GW/Fanatic, professional quality. Grade 1c: Experimental, not released through GW/Fanatic, approved by people who previously submitted grade 1a/1b material and vouch for its quality. Grade 2a: Reliable, created and tested by fans and gaming groups, will likely blend well with grade 1 warbands.\n\nFurther grades can be found at broheim.net. Individual Dramatis Personae rule write-ups live on nested per-grade sub-pages not captured in this pass — only the index table above was in scope.";

export function findPersona(id: string): DramatisPersonaSummary | undefined {
  return DRAMATIS_PERSONAE.find((p) => p.id === id);
}
