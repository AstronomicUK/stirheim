// Dramatis Personae — rules text and the index table from mordheimer.net, as captured in
// reference/rules/03-campaigns-magic-optional-rules.md lines 1216-1288.
//
// IMPORTANT: the scrape only captured the summary index (name / cost / upkeep / grade / source).
// Each character's profile, equipment, special rules and rating were NOT captured, so every
// entry's `detail` is left undefined rather than guessed.
//
// Generated from the Markdown source; edit the source and regenerate rather than hand-editing rows.

import type { NamedRule, SourceRef } from "../../types/common";
import type { DramatisPersonaSummary } from "../../types/campaignContent";

export const DRAMATIS_PERSONAE_SOURCE: SourceRef = {
  publication: "mordheimer.net — Campaigns: Dramatis Personae (https://mordheimer.net/docs/campaigns/dramatis-personae)",
  file: "03-campaigns-magic-optional-rules.md:1216-1288",
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
  { id: "aenur_the_sword_of_twilight", name: "Aenur, the sword of twilight", hireCost: {"base":150,"text":"150 gc"}, upkeep: null, grade: "core", source: "Mordheim Rulebook" },
  { id: "bertha_bestraufrung_high_matriarch_of_the_sisterhood", name: "Bertha Bestraufrung, high matriarch of the sisterhood", hireCost: null, upkeep: null, grade: "core", source: "Mordheim Rulebook" },
  { id: "johann_the_knife", name: "Johann the knife", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "veskit_high_executioner_of_clan_eshin", name: "Veskit, high executioner of clan eshin", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":35,"text":"35 gc"}, grade: "core", source: "Mordheim Rulebook" },
  { id: "countess_marianna_chevaux_vampire_assassin", name: "Countess Marianna Chevaux, Vampire Assassin", hireCost: {"base":150,"text":"150 gc"}, upkeep: {"base":75,"text":"75 gc*"}, grade: "1a", source: "Town Cryer 22", notes: "Upkeep is marked with an asterisk in the source index table; the footnote it points to was not captured in the scrape." },
  { id: "nicodemus_the_cursed_pilgrim", name: "Nicodemus, the cursed pilgrim", hireCost: {"base":null,"text":"1 wyrdstone"}, upkeep: {"base":null,"text":"1 wyrdstone"}, grade: "1a", source: "Mordheim Annual 2002" },
  { id: "ulli_and_marquand", name: "Ulli & Marquand", hireCost: {"base":30,"text":"30 gc"}, upkeep: null, grade: "1a", source: "Town Cryer 13" },
  { id: "abdul_alhazred_the_mad_sorcerer", name: "Abdul Alhazred, the Mad Sorcerer", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Town Cryer 21, Khemri" },
  { id: "crow_master_the", name: "Crow Master, The", hireCost: {"base":65,"text":"65 gc"}, upkeep: {"base":15,"text":"15 gc"}, grade: "1b", source: "Town Cryer 25" },
  { id: "dark_emissary", name: "Dark Emissary", hireCost: null, upkeep: null, grade: "1b", source: "Town Cryer 15, Albion" },
  { id: "dijin_katal_the_renegade_assassin", name: "Dijin Katal, The Renegade Assassin", hireCost: {"base":85,"text":"85 gc"}, upkeep: null, grade: "1b", source: "Town Cryer 15, Lustria" },
  { id: "drenok_johansen_wielder_of_the_great_axe", name: "Drenok Johansen, Wielder Of The Great Axe", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Town Cryer 15, Lustria" },
  { id: "heinrich_altdorf_schmidt", name: "Heinrich 'Altdorf' Schmidt", hireCost: {"base":75,"text":"75 gc"}, upkeep: {"base":null,"text":"1 treasure"}, grade: "1b", source: "Town Cryer 21" },
  { id: "khar_mel_the_djinn", name: "Khar-mel The Djinn", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Town Cryer 21" },
  { id: "maximilian_the_mad", name: "Maximilian The Mad", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "1b", source: "Nemesis Crown Supplement" },
  { id: "penthesilea_mark_of_the_serpent", name: "Penthesilea, Mark Of The Serpent", hireCost: null, upkeep: null, grade: "1b", source: "Town Cryer 15, Lustria" },
  { id: "truthsayer", name: "Truthsayer", hireCost: null, upkeep: null, grade: "1b", source: "Town Cryer 15, Albion" },
  { id: "belandysh_condemned_champion_of_chen", name: "Belandysh, Condemned Champion Of Chen", hireCost: {"base":90,"text":"90 gc and 5 campaign points"}, upkeep: {"base":30,"text":"30 gc and 1 campaign point"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "grand_master_ippan_shu", name: "Grand Master Ippan Shu", hireCost: {"base":75,"text":"75 gc and 3 campaign points"}, upkeep: {"base":null,"text":"2 campaign points"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "innominatus_the_tilean_gladiator", name: "Innominatus, the Tilean Gladiator", hireCost: {"base":120,"text":"120 gc"}, upkeep: {"base":40,"text":"40 gc*"}, grade: "1c", source: "Mordheim Facebook Group", notes: "Upkeep is marked with an asterisk in the source index table; the footnote it points to was not captured in the scrape." },
  { id: "luthor_wolfenbaum", name: "Luthor Wolfenbaum", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1c", source: "Mordheim Facebook Group" },
  { id: "luthor_the_looter", name: "Luthor the Looter", hireCost: {"base":60,"text":"60 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1c", source: "Tuomas Pirinen, Mordheim Facebook Group, Mordheim 25th anniversary Celebrations" },
  { id: "maglah_khan_s_horde", name: "Maglah Khan's Horde", hireCost: {"base":80,"text":"80 gc"}, upkeep: {"base":25,"text":"25 gc"}, grade: "1c", source: "Border Town Burning Supplement" },
  { id: "aksho_akhash_the_vile_dreadwing_lord_of_the_carrion_throne", name: "Aksho'akhash the Vile Dreadwing, Lord of the Carrion Throne", hireCost: {"base":30,"text":"30 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "2a", source: "Mordheim Facebook Group" },
  { id: "busty_gwen", name: "\"Busty\" Gwen", hireCost: {"base":null,"text":"See special rules."}, upkeep: null, grade: "2a", source: "Fanatic Online 89" },
  { id: "the_dark_jester_in_mordheim", name: "The Dark Jester in Mordheim", hireCost: {"base":75,"text":"75 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "2a", source: "Fanatic Online 17" },
  { id: "the_headless_horseman", name: "The Headless Horseman", hireCost: {"base":100,"text":"100 gc"}, upkeep: null, grade: "2a", source: "Sylvania Supplement" },
  { id: "the_foole", name: "The Foole", hireCost: {"base":40,"text":"40 gc"}, upkeep: null, grade: "2a", source: "Fanatic Online 89" },
  { id: "sigmund_spindle_the_harvester_of_flesh", name: "Sigmund Spindle, the Harvester of Flesh", hireCost: {"base":70,"text":"70 gold crowns to hire; Sigmund Sprandle may also be hired in the payment of one body part. If you wish to do this then a chosen Hero suffers one Severe Arm Wound and may only use one single handed weapon from now on."}, upkeep: {"base":35,"text":"35 gc"}, grade: "2a", source: "Sylvania Supplement" },
  { id: "william_schakestange_master_bard", name: "William Schäke­stange, Master Bard", hireCost: {"base":70,"text":"70 gc"}, upkeep: {"base":30,"text":"30 gc"}, grade: "2a", source: "Letters of the Damned 4" },
];

/** The "clarification of grades" block, verbatim (source lines 1284-1288). */
export const DRAMATIS_PERSONAE_GRADE_NOTES: string = "Core: Published in the original Mordheim Rulebook. Grade 1a: GW/Fanatic Rules deemed \"official\" in the 2005 Rules Review. Grade 1b: Unofficial, but released through GW/Fanatic, professional quality. Grade 1c: Experimental, not released through GW/Fanatic, approved by people who previously submitted grade 1a/1b material and vouch for its quality. Grade 2a: Reliable, created and tested by fans and gaming groups, will likely blend well with grade 1 warbands.\n\nFurther grades can be found at broheim.net. Individual Dramatis Personae rule write-ups live on nested per-grade sub-pages not captured in this pass — only the index table above was in scope.";

export function findPersona(id: string): DramatisPersonaSummary | undefined {
  return DRAMATIS_PERSONAE.find((p) => p.id === id);
}
