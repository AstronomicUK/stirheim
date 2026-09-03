// Hired Swords — rules text and the index table from mordheimer.net, as captured in
// reference/rules/03-campaigns-magic-optional-rules.md lines 1097-1215.
//
// IMPORTANT: the scrape only captured the summary index (name / cost / upkeep / grade / source).
// The per-Hired-Sword stat lines, equipment, skill lists and special rules were NOT captured, so
// every entry's `detail` is left undefined rather than guessed. Populate it in a later pass from
// mordheimer.net/docs/hired-swords/<slug>.
//
// Generated from the Markdown source; edit the source and regenerate rather than hand-editing rows.

import type { NamedRule, SourceRef } from "../../types/common";
import type { HiredSwordSummary } from "../../types/campaignContent";

export const HIRED_SWORDS_SOURCE: SourceRef = {
  publication: "mordheimer.net — Campaigns: Hired Swords (https://mordheimer.net/docs/campaigns/hired-swords)",
  file: "03-campaigns-magic-optional-rules.md:1097-1215",
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
  { id: "dwarf_troll_slayer", name: "Dwarf Troll Slayer", hireCost: {"base":25,"text":"25 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "elf_ranger", name: "Elf Ranger", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "freelancer", name: "Freelancer", hireCost: {"base":50,"text":"50 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "halfling_scout", name: "Halfling Scout", hireCost: {"base":15,"text":"15 gc"}, upkeep: {"base":5,"text":"5 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "ogre_bodyguard", name: "Ogre Bodyguard", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "pit_fighter", name: "Pit Fighter", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "warlock", name: "Warlock", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "arabian_merchant", name: "Arabian Merchant", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1a", source: "Town Cryer 22" },
  { id: "beast_hunter", name: "Beast Hunter", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1a", source: "Town Cryer 28" },
  { id: "highwayman", name: "Highwayman", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1a", source: "Town Cryer 26" },
  { id: "imperial_assassin", name: "Imperial Assassin", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1a", source: "Mordheim Annual 2002" },
  { id: "roadwarden", name: "Roadwarden", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1a", source: "Town Cryer 26" },
  { id: "tilean_marksman", name: "Tilean Marksman", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1a", source: "Mordheim Annual 2002" },
  { id: "bard", name: "Bard", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1b", source: "Town Cryer 13" },
  { id: "big_game_hunter", name: "Big Game Hunter", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":18,"text":"18 gc"}, grade: "1b", source: "Town Cryer 13 (Lustria)" },
  { id: "black_orc_overseer", name: "Black Orc Overseer", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":40,"text":"40 gc"}, grade: "1b", source: "Nemesis Crown Supplement" },
  { id: "bounty_hunter", name: "Bounty Hunter", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 13" },
  { id: "chameleon_skink", name: "Chameleon Skink", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":12,"text":"12 gc"}, grade: "1b", source: "Town Cryer 12 (Lustria)" },
  { id: "clan_skryre_rat_ogre", name: "Clan Skryre Rat Ogre", hireCost: {"base":100,"text":"100 gc"}, upkeep: {"base":null,"text":"1 wyrdstone"}, grade: "1b", source: "Town Cryer 25" },
  { id: "dark_elf_assassin", name: "Dark Elf Assassin", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1b", source: "Town Cryer 12 (Lustria)" },
  { id: "duellist", name: "Duellist", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 13" },
  { id: "dwarf_pathfinder", name: "Dwarf Pathfinder", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Nemesis Crown Supplement" },
  { id: "dwarf_treasure_hunter", name: "Dwarf Treasure Hunter", hireCost: {"base":55,"text":"55 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Fanatic Magazine 8" },
  { id: "elf_mage", name: "Elf Mage", hireCost: {"base":45,"text":"45 gc"}, upkeep: null, grade: "1b", source: "Fanatic Magazine 5" },
  { id: "gaoler", name: "Gaoler", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Mordheim Facebook Group" },
  { id: "halfling_thief", name: "Halfling Thief", hireCost: {"base":25,"text":"25 gc"}, upkeep: {"base":15,"text":"15 gc*"}, grade: "1b", source: "Fanatic Magazine 7", notes: "Upkeep is marked with an asterisk in the source index table; the footnote it points to was not captured in the scrape." },
  { id: "human_scout", name: "Human Scout", hireCost: {"base":10,"text":"10 gc"}, upkeep: {"base":5,"text":"5 gc"}, grade: "1b", source: "Nemesis Crown Supplement" },
  { id: "kislev_ranger", name: "Kislev Ranger", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Fanatic Magazine 6" },
  { id: "mule_skinner", name: "Mule Skinner", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 14" },
  { id: "nomad_scout", name: "Nomad Scout", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 19 (Khemri)" },
  { id: "norse_shaman", name: "Norse Shaman", hireCost: {"base":45,"text":"45 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1b", source: "Town Cryer 12 (Lustria), Border Town Burning Supplement" },
  { id: "old_prospector", name: "Old Prospector", hireCost: {"base":null,"text":"2 treasures"}, upkeep: {"base":null,"text":"1 treasure"}, grade: "1b", source: "Nemesis Crown Supplement" },
  { id: "pathfinder", name: "Pathfinder", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 12 (Lustria)" },
  { id: "priest_of_morr", name: "Priest Of Morr", hireCost: {"base":null,"text":"Hero"}, upkeep: null, grade: "1b", source: "Town Cryer 12" },
  { id: "runesmith_journeyman", name: "Runesmith Journeyman", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Nemesis Crown Supplement" },
  { id: "shadow_warrior", name: "Shadow Warrior", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 13 (Lustria)" },
  { id: "snake_charmer", name: "Snake Charmer", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1b", source: "Town Cryer 19 (Khemri)" },
  { id: "thief", name: "Thief", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 19 (Khemri)" },
  { id: "tomb_robber", name: "Tomb Robber", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 19 (Khemri)" },
  { id: "warrior_priest_of_sigmar", name: "Warrior Priest Of Sigmar", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1b", source: "Town Cryer 28" },
  { id: "witch", name: "Witch", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 13" },
  { id: "witch_hunter", name: "Witch Hunter", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Nemesis Crown Supplement" },
  { id: "wolf_priest_of_ulric", name: "Wolf Priest of Ulric", hireCost: {"base":null,"text":"Hero"}, upkeep: null, grade: "1b", source: "Town Cryer 8" },
  { id: "bone_goliath", name: "Bone Goliath", hireCost: {"base":225,"text":"225 gc"}, upkeep: null, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "cathayan_merchant", name: "Cathayan Merchant", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "chaos_centaur", name: "Chaos Centaur", hireCost: {"base":65,"text":"65 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "coachman", name: "Coachman", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "grave_robber", name: "Grave Robber", hireCost: {"base":45,"text":"45 gc"}, upkeep: {"base":18,"text":"18 gc"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "hobgoblin_scout", name: "Hobgoblin Scout", hireCost: {"base":45,"text":"45 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "ninja", name: "Ninja", hireCost: {"base":70,"text":"70 +3D6","dice":"3D6"}, upkeep: null, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "pyromaniac", name: "Pyromaniac", hireCost: {"base":25,"text":"25 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "swordsmith", name: "Swordsmith", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "beggar", name: "Beggar", hireCost: {"base":10,"text":"10 gc"}, upkeep: {"base":5,"text":"5 gc"}, grade: "2a", source: "Fanatic Online 94" },
  { id: "chaos_fury", name: "Chaos Fury", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Mordheim Facebook Group" },
  { id: "cursed_hillman", name: "Cursed Hillman", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "2a", source: "Fanatic Online 49" },
  { id: "dark_mage", name: "Dark Mage", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Letters of the Damned 6" },
  { id: "dwarf_slayer_pirate", name: "Dwarf Slayer Pirate", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Fanatic Online 45" },
  { id: "emissary_of_chaos", name: "Emissary of Chaos", hireCost: {"base":50,"text":"50 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Fanatic Online 94" },
  { id: "estalian_diestro", name: "Estalian Diestro", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Letters of the Damned 2" },
  { id: "the_fallen_sister", name: "The Fallen Sister", hireCost: {"base":55,"text":"55 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Fanatic Online 25" },
  { id: "goblin_lantern_bearer", name: "Goblin Lantern Bearer", hireCost: {"base":15,"text":"15 gc"}, upkeep: {"base":5,"text":"5 gc"}, grade: "2a", source: "Fanatic Online 89" },
  { id: "gravesman", name: "Gravesman", hireCost: {"base":25,"text":"25 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Letters of the Damned 5" },
  { id: "halfling_knight", name: "Halfling Knight", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "2a", source: "Fanatic Online 94" },
  { id: "imperial_tactician", name: "Imperial Tactician", hireCost: {"base":40,"text":"40 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Fanatic Online 94" },
  { id: "knight_of_the_white_wolf", name: "Knight of the White Wolf", hireCost: {"base":55,"text":"55 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Mordheim Facebook Group" },
  { id: "ninja_gnoblar", name: "Ninja Gnoblar", hireCost: {"base":35,"text":"35 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "2a", source: "Mordheimer Information Centre" },
  { id: "ogre_slave_master", name: "Ogre Slave Master", hireCost: {"base":90,"text":"90 gc"}, upkeep: {"base":35,"text":"35 gc"}, grade: "2a", source: "Fanatic Online 89" },
  { id: "slaver", name: "Slaver", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "2a", source: "Fanatic Online 94" },
  { id: "swashbuckler", name: "Swashbuckler", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Fanatic Online 94" },
  { id: "ungor_trapper", name: "Ungor Trapper", hireCost: {"base":20,"text":"20 gc"}, upkeep: {"base":10,"text":"10 gc"}, grade: "2a", source: "Mordheim Facebook Group" },
  { id: "weaponsmith", name: "Weaponsmith", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "2a", source: "Emanuele Intrieri" },
  { id: "wood_elf_hunter", name: "Wood Elf Hunter", hireCost: {"base":50,"text":"50 gc"}, upkeep: {"base":20,"text":"20 gc"}, grade: "2a", source: "Letters of the Damned 2" },
];

/** The "clarification of grades" block, verbatim (source lines 1207-1215). */
export const HIRED_SWORD_GRADE_NOTES: string = "- **Core:** Published in the original Mordheim Rulebook.\n- **Grade 1a:** GW/Fanatic Rules deemed \"official\" in the 2005 Rules Review.\n- **Grade 1b:** Unofficial, but released through GW/Fanatic. Professional quality.\n- **Grade 1c:** Experimental, not released through GW/Fanatic. Approved by people who previously submitted grade 1a/1b material and vouch for it's quality.\n- **Grade 2a:** Reliable, created and tested by fans and gaming groups. Will likely blend well with grade 1 warbands.\n\nFurther grades can be found at broheim.net. Individual Hired Sword rule write-ups live on nested per-grade sub-pages (e.g. Grade 1A Hired Swords) not captured in this pass — only the index table above was in scope.";

export function findHiredSword(id: string): HiredSwordSummary | undefined {
  return HIRED_SWORDS.find((h) => h.id === id);
}
