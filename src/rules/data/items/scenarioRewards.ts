// Unique scenario equipment: keep names short and rules in the tooltip.
import type { Item } from "../../types/items"

export const SCENARIO_REWARD_ITEMS: Item[] = [
  {
    "id": "scenario_athame",
    "name": "Athame",
    "category": "melee",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "**Athame:** An Athame is a special silver dagger used in magical rituals. If used in combat, it will not hold its edge. For the first attack in a game, it will count as a normal dagger. However, for the rest of the game it will count as a fist attack. The Athame is worth 10 gold crowns if traded.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:6809-6809"
    }
  },
  {
    "id": "scenario_dispel_scroll",
    "name": "Dispel Scroll",
    "category": "misc",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "**Dispel Scroll:** This scroll contains a powerful counterspell. It may be read aloud immediately after an opponent has successfully cast a spell (but before results have been determined) to negate its effects. When used roll a D6. The enemy spell is cancelled on a roll of 4 or more. After one use, the scroll will disintergrate and is useless. It may be traded for 25+2D6.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:6811-6811"
    }
  },
  {
    "id": "scenario_wand_of_phyrros",
    "name": "Wand of Phyrros",
    "category": "misc",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "#### the wand of phyrros\n\nThis wand is a slender stick of dark wood, roughly 10\" long. It seems rather ordinary, but it allows the wielder to use the spell Fires of U’Zhul once per game. The spell is automatically successful, and the wielder of the wand does not have to be a spell caster to use it (though he does have to be a Hero). The wand may be sold for 100 gc.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:5794-5796"
    }
  },
  {
    "id": "scenario_totem_of_light",
    "name": "Totem of Light",
    "category": "misc",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "The artefact is an enchanted Totem of Light, which renders its bearer immune to psychology and all alone tests. If given to the warband’s leader it improves his leadership by +1.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:4053-4053"
    }
  },
  {
    "id": "scenario_silver_sickle",
    "name": "Silver Sickle",
    "category": "melee",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "The artefact is a Silver Sickle, which acts like a normal sword but increases Weapon Skill by +1 and adds +1 to the user’s Strength vs Daemons, Possessed and Undead.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:4054-4054"
    }
  },
  {
    "id": "scenario_talisman_of_light",
    "name": "Talisman of Light",
    "category": "misc",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "The artefact is a Talisman of Light bearing the mystical Triskele symbol. It wards hostile magic and will nullify any harmful spell cast at the wearer on a roll of 4+",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:4055-4055"
    }
  },
  {
    "id": "scenario_tome_of_the_truthsayers",
    "name": "Tome of the Truthsayers",
    "category": "misc",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "The artefact is a Tome of the Truthsayers, a book of magic. It enables the user to cast a single randomly determined spell of the Lore of Light once per battle without the need to roll for difficulty.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:4056-4056"
    }
  },
  {
    "id": "scenario_vambrace_of_silver",
    "name": "Vambrace of Silver",
    "category": "misc",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "The artefact is a Vambrace of Silver, which has the power to deflect missiles. Any ranged weapon that hits the wearer will be deflected away harmlessly on a roll of 5+.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:4057-4057"
    }
  },
  {
    "id": "scenario_cloak_of_mists",
    "name": "Cloak of Mists",
    "category": "misc",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "**Cloak Of Mists:** Only a Hero can have this item. There is an additional -1 penalty to hit for any attacks against the wearer (close combat or missile fire). There is also a -1 penalty to Initiative when trying to spot the wearer if he is _Hidden_.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:4547-4547"
    }
  },
  {
    "id": "scenario_skull_of_the_headless_one",
    "name": "Skull of the Headless One",
    "category": "misc",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "If playing in a campaign, a warband that captures the Skull of the Headless One (by moving it off the table) may keep it and attempt to use it to summon the Headless One at the start of any subsequent game. Roll a D6 on the following table:\n\n| D6 | Result |\n| --- | --- |\n| 1 | The Skull of the Headless One has been misplaced, the warband looses the skull and may no longer attempt to summon the Headless One unless they find the Skull by replaying this scenario. |\n| 2-5 | Ignored. The Headless One does not appear |\n| 6 | The Headless One appears increasing the warbands rating by +125 points. He may fight with the warband for the duration of the game. The player controlling the Headless must appoint one of his Heroes or Henchmen to carry the skull to battle, which is risky because an enemy model may capture the skull as described earlier. |",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:6098-6104"
    }
  },
  {
    "id": "scenario_magic_sickle",
    "name": "Magic Sickle",
    "category": "melee",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "Magic Sickle raises WS of bearer +1.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:6387-6387"
    }
  },
  {
    "id": "scenario_ancient_bone_armour",
    "name": "Ancient Bone Armour",
    "category": "armour",
    "price": {
      "base": null,
      "text": "Scenario reward only"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "Ancient Bone Armour confers 4+ save and in all other respects acts like light armour",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Scenario treasure rules",
      "file": "06-scenarios.md:6389-6389"
    },
    "armourSave": 4
  },
  {
    "id": "scenario_sword_of_the_herald",
    "name": "Sword of the Herald",
    "category": "melee",
    "price": {
      "base": null,
      "text": "Scenario reward; hand over for 100 gc"
    },
    "availability": {
      "kind": "special",
      "text": "Scenario reward only"
    },
    "description": "\n#### What does the big green sword do?\n\nThe Sword of the Herald counts as a chaos weapon and it adds +1 S and +1 to all rolls to hit (you still must roll a critical hit as normal). Additionally the warrior holding it must make a leadership test in each recovery phase. The warrior must use his own leadership. If the warrior carrying the sword fails the test he has become possessed by the Daemon in the sword and may do nothing during that turn. The referee will move a warrior that failed the test during the Wyrdstone zombie turn. The referee may use the possessed warrior in any way he (or she) sees fit including charging any warrior on the table. While the warrior is possessed by the sword, the warrior will shout that he (or she) is the Herald of the Shadowlord and will prove it through trial by combat. The referee should make it very clear to all the players that there is a raving madman in fog. If the possessed warrior passes the leadership test in a successive turn, then control of the warrior is returned to the player controlling the warriors' warband.\n\n#### After the game what can I do with it?\n\nThat depends on your warband. But the choices are either to equip a hero with it or pass it up the hierarchy that the warband belongs to.\n\n#### If you want to equip it.\n\nPossessed, Undead, Beastmen and Skaven warbands may equip it on any hero. Once the Sword is equipped, the warrior will never surrender the blade to any other members of the warband. Additionally, if a warrior equipped with the Sword of the Herald ever suffers an Out Of Action result through play, the warrior is removed from the table as normal, but the sword token should be placed on the table where the warrior fell. The blade can then be retrieved by any other warrior. The above Warbands may trade it off, as described below if they so choose.\n\n#### If you want to pass it to your betters...\n\nAll other Warbands will try to get rid of such a weapon steeped in evil and will attempt to trade it off or pass it to their holy representatives such as priests of Sigmar to destroy it. For this the Warband will receive 100 gc's.",
    "specialRules": [],
    "scenarioRewardOnly": true,
    "source": {
      "publication": "Town Cryer #13",
      "file": "06-scenarios.md:6470-6485"
    }
  }
]
