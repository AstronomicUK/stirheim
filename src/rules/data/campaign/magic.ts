// GENERATED from reference/rules/03-campaigns-magic-optional-rules.md lines 1447-3501 (mordheimer.net Magic section).
// Text is verbatim from the source. Do not hand-edit spell text; fix the reference file and regenerate.

import type { NamedRule } from "../../types";
import type { SpellLore, WizardAllocation } from "../../types/magic";

/** General magic rules: casting, damage, and the allocated-spells preamble (03-campaigns-magic-optional-rules.md:1447-1514). */
export const MAGIC_RULES: NamedRule[] = [
  { name: "Casting spells", text: `Spells are cast in the shooting phase, and can be used even if the caster is in hand-to-hand combat. To use a spell, the wizard must roll equal to or greater than the spell's Difficulty score on 2D6. If he fails, he may not cast a spell that turn. If the test is passed the spell may be used as described overleaf. A wizard may cast one spell per turn and may not use missile weapons if he wants to cast a spell. He can however run!

A wizard may not use magic if he is wearing armour or has a shield or buckler. The only exception is the Prayers of Sigmar. Sisters of Sigmar and Warrior Priests may wear armour and use their prayers.` },
  { name: "Damage", text: `Some spells cause direct damage, and are resolved the same way as damage from shooting or blows in hand-to-hand combat. Spells do not cause critical hits. Models always receive armour saves against wounds caused by spells unless noted otherwise.` },
  { name: "Allocated spells", text: `The chart below summarises the different kinds of magic and explains who can use what spells.

Each wizard starts with one randomly determined spell, but may gain more. Roll a D6 and consult the appropriate chart. If you get the same spell twice, roll again or lower the spell's difficulty by 1.` },
];

/** Every row of the Wizard -> Type of Magic table. `loreId` is null where the name doesn't match a lore below. */
export const WIZARD_ALLOCATIONS: WizardAllocation[] = [
  { wizard: "Amazons (Lustria) Serpent Priestess", loreName: "Amazon Rituals", loreId: "amazon_rituals" },
  { wizard: "Amazons (Mordheim) Priestess", loreName: "Amazon Rituals", loreId: "amazon_rituals" },
  { wizard: "Arabian Tomb Raiders Mystic", loreName: "Arabian Elemental Magic", loreId: "arabian_elemental_magic" },
  { wizard: "Beastmen Raiders Beastmen Shaman", loreName: "Chaos Rituals", loreId: "chaos_rituals" },
  { wizard: "Black Dwarfs Sorcerer", loreName: "Rituals of Hashut", loreId: "rituals_of_hashut" },
  { wizard: "Bretonnian Chapel Guard Damsel", loreName: "Lady's Prayers", loreId: "ladys_prayers" },
  { wizard: "Carnival of Chaos Carnival Master", loreName: "Nurgle Rituals", loreId: "nurgle_rituals" },
  { wizard: "Cult of the Possessed Magister", loreName: "Chaos Rituals", loreId: "chaos_rituals" },
  { wizard: "Dark Elves Dark Elf Sorceress", loreName: "Dark Elf Magic", loreId: "dark_elf_magic" },
  { wizard: "Dark Emissary", loreName: "Lore of Darkness", loreId: "lore_of_darkness" },
  { wizard: "Elf Mage", loreName: "Spells of the Djed'hi", loreId: "spells_of_the_djedhi" },
  { wizard: "Forest Goblins Shaman", loreName: "Forest Goblin Magic", loreId: "forest_goblin_magic" },
  { wizard: "Horned Hunters Priest of Taal", loreName: "Prayers of Taal", loreId: "prayers_of_taal" },
  { wizard: "Khar-mel The Djinn", loreName: "Arabian Elemental Magic", loreId: "arabian_elemental_magic" },
  { wizard: "Lizardmen Skink Priest", loreName: "Lizardman Magic", loreId: "lizardman_magic" },
  { wizard: "Marauders of Chaos Seer (with the Mark of Chaos Undivided)", loreName: "Chaos Rituals", loreId: "chaos_rituals" },
  { wizard: "Marauders of Chaos Seer (with the Mark of Onogal the Crow)", loreName: "Onogal Rituals", loreId: "onogal_rituals" },
  { wizard: "Marauders of Chaos Seer (with the Mark of Shornaal the Serpent)", loreName: "Shornaal Rituals", loreId: "shornaal_rituals" },
  { wizard: "Marauders of Chaos Seer (with the Mark of Tchar the Eagle)", loreName: "Tchar Rituals", loreId: "tchar_rituals" },
  { wizard: "Night Goblins (Web) Shaman", loreName: "Goblin Magic", loreId: "goblin_magic" },
  { wizard: "Night Goblins Shaman", loreName: "Waaaagh! Magic", loreId: "waaaagh_magic" },
  { wizard: "Norse Shaman", loreName: "Norse Runes", loreId: "norse_runes" },
  { wizard: "Orc Mob Shaman", loreName: "Waaaagh! Magic", loreId: "waaaagh_magic" },
  { wizard: "Ostlanders Priest of Taal", loreName: "Prayers of Taal", loreId: "prayers_of_taal" },
  { wizard: "Priest Of Morr", loreName: "Funerary Rites", loreId: "funerary_rites" },
  { wizard: "Shadow Warriors Shadow Weaver", loreName: "Shadow Warrior Magic", loreId: "shadow_warrior_magic" },
  { wizard: "Sisters of Sigmar Sigmarite Matriarch", loreName: "Prayers of Sigmar", loreId: "prayers_of_sigmar" },
  { wizard: "Skaven of Clan Pestilens Sorcerer", loreName: "Magic of the Horned Rat", loreId: "magic_of_the_horned_rat" },
  { wizard: "Skaven Sorcerer", loreName: "Magic of the Horned Rat", loreId: "magic_of_the_horned_rat" },
  { wizard: "The Restless Dead Liche", loreName: "Necromancy (The Restless Dead)", loreId: "necromancy_the_restless_dead" },
  { wizard: "The Restless Dead Necromancer", loreName: "Necromancy (The Restless Dead)", loreId: "necromancy_the_restless_dead" },
  { wizard: "The Sons of Hashut Apprentice Sorcerer", loreName: "Chaos Dwarfs Magic", loreId: "chaos_dwarfs_magic" },
  { wizard: "Tomb Guardians Liche Priest", loreName: "Mortuary Cult Scrolls", loreId: "mortuary_cult_scrolls" },
  { wizard: "Truthsayer", loreName: "Lore of Light", loreId: "lore_of_light" },
  { wizard: "Undead Necromancer", loreName: "Necromancy", loreId: "necromancy" },
  { wizard: "Warlock", loreName: "Lesser Magic", loreId: "lesser_magic" },
  { wizard: "Witch", loreName: "Charms & Hexes", loreId: "charms_and_hexes" },
  { wizard: "Witch Hunters Warrior-Priest", loreName: "Prayers of Sigmar", loreId: "prayers_of_sigmar" },
  { wizard: "Wolf Priest of Ulric", loreName: "Prayers of Ulric", loreId: "prayers_of_ulric" },
];

export const SPELL_LORES: SpellLore[] = [
  {
    id: "amazon_rituals",
    name: "Amazon Rituals",
    sourceUrl: "https://mordheimer.net/docs/magic/amazon-rituals",
    intro: `Little is known about Amazon magic beyond their island home. It is said that the immortal Amazons learn their magic from the very gods themselves.

Amazon Rituals are used by the Amazons (Lustria) Serpent Priestess, and the Amazons (Mordheim) Priestess.`,
    usedBy: ["Amazons (Lustria) Serpent Priestess", "Amazons (Mordheim) Priestess"],
    die: "D6",
    spells: [
      {
        id: "singing_wind",
        name: "Singing Wind",
        roll: { min: 1, max: 1 },
        difficulty: 8,
        text: `The priestess calls upon the power of Shaekal the Wind Goddess to enter the battlefield.

The goddess appears in the form of singing motes and dancing lights that will entrance and 'hold' any model within 10" until the start of the Amazon player's next turn. The model cannot move, shoot, or cast spells, but may defend itself in hand-to-hand combat. Models affected by this ritual automatically go last in combat.`,
      },
      {
        id: "serpents_strength",
        name: "Serpent's Strength",
        roll: { min: 2, max: 2 },
        difficulty: 9,
        text: `The priestess begins the ritual by dancing wildly and screaming in an ancient tongue.

All friendly models close to the Priestess will be charged with a frantic energy until the end of their next turn. During this time any model within 8" of the Priestess (including herself) will add +1 to their Strength. The ritual cannot be cast if the Priestess is in close combat during her Shooting phase. The effects will continue after the ritual is cast if the Priestess enters combat.`,
      },
      {
        id: "wendalas_maelstrom",
        name: "Wendala's Maelstrom",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The priestess summons harsh tropical winds to protect the Amazons from enemy ranged attacks.

The storm extends out from the Priestess 18". All attempts to shoot missile weapons by the enemy will be at -1 to hit. The ritual lasts up until the start of the Amazon player's next turn.`,
      },
      {
        id: "shield_of_thorns",
        name: "Shield of Thorns",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `Moving her arms about in a weaving motion, the priestess calls upon the plants to protect her.

The ritual produces a cocoon of thorns all about the Priestess, making her immune to ranged or magical attacks. Any models wishing to charge the Priestess can do so but the thorns negate any strikes by the Priestess and her enemies in the first round of combat. The Priestess cannot cast this ritual while in hand-to-hand combat.`,
      },
      {
        id: "the_living_jungle",
        name: "The Living Jungle",
        roll: { min: 5, max: 5 },
        difficulty: 6,
        text: `Drawing upon her will, the Priestess reaches out to the denizens of the jungle, seeking their aid.

Pick one model within 12". The model is suddenly swarmed by a savage mix of snakes, spiders and insects, most of them poisonous. The afflicted model takes 1D6 Strength 2 hits with no armour saves allowed apart from Ward saves. You cannot use a dodge save against a swarm.`,
      },
      {
        id: "sirens_dreams",
        name: "Siren's Dreams",
        roll: { min: 6, max: 6 },
        difficulty: 7,
        text: `The priestess starts to sing with a wondrous voice and all the Amazons join in with her.

The song is so beautiful and mesmerising that it momentarily distracts the Amazon's enemies within 12" such that all Ld tests for the opposing warband are made at -1 until the end of the opposing player's next turn. Lizardmen and Undead are immune to the effects of this ritual.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Amazon Rituals (https://mordheimer.net/docs/magic/amazon-rituals)", file: "03-campaigns-magic-optional-rules.md:1515-1579" },
  },
  {
    id: "arabian_elemental_magic",
    name: "Arabian Elemental Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/arabian-elemental-magic",
    intro: `The magic of the Djinn is a rare, almost lost, art among men. It is the preserve of the Djinn of the deep desert and of those Djinn unfortunate enough to be captured.

Arabian Elemental Magic is used by Arabian Mystics, and Khar-mel The Djinn.`,
    usedBy: ["Arabian Tomb Raiders Mystic", "Khar-mel The Djinn"],
    die: "D6",
    spells: [
      {
        id: "riding_the_wind",
        name: "Riding the Wind",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `Invoking the Element of the Air, the caster rises up on a warm breeze, only to set down again on another part of the battlefield.

This spell is cast at the beginning of the caster's Movement phase. The caster may move up to 12+D6" anywhere on the battlefield, ignoring any intervening terrain; this counts as the caster's movement for that turn. This spell may not be used to move the caster into base contact with an enemy warrior, but the caster may shoot as normal (with a -1 penalty for having moved).`,
      },
      {
        id: "skin_of_stone",
        name: "Skin of Stone",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `Calling upon the Element of the Earth, the caster is able to make a warrior's skin become as hard as stone.

This spell may be cast on any friendly warrior within 6". The target gains +2 to his armour save but suffers a -1 penalty to Initiative. The spell may be maintained each turn, providing the affected warrior remains within 6" of the caster and the caster can pass a Difficulty test. If the caster is more than 6" away from the affected warrior in the Recovery phase, the spell cannot be maintained and wears off. Only one warrior may be affected by a Stone Skin spell at any one time, although the caster is free to cast other spells while maintaining the Stone Skin.`,
      },
      {
        id: "burning_hand",
        name: "Burning Hand",
        roll: { min: 3, max: 3 },
        difficulty: 8,
        text: `By invoking the Element of Fire, one of the caster's hands becomes a burning bolt which he can use to smite his enemies.

This spell is cast at the beginning of the Combat phase. The caster may sacrifice all of his normal attacks to make one hand-to-hand attack at Strength 5, causing 2 wounds. If the enemy warrior is successfully hit, he is set on fire on a roll of 4+. This spell lasts for one round only.`,
      },
      {
        id: "quicksand",
        name: "Quicksand",
        roll: { min: 4, max: 4 },
        difficulty: 6,
        text: `By invoking the Element of Water, water rises from the very rocks and sand and turns the ground to quicksand.

This spell is cast at any warrior within 6". The water floods the area for 3" around the targeted warrior. The effect lasts until the beginning of the caster's next Recovery phase. All warriors within the quicksand must pass a Strength test or be unable to move. Warriors in combat cannot attack but may defend themselves.`,
      },
      {
        id: "storm_of_magic",
        name: "Storm of Magic",
        roll: { min: 5, max: 5 },
        difficulty: 9,
        text: `By breaching the very fabric of reality, the caster is able to summon a bolt of pure magical energy.

The caster may target any warrior within 12". If the spell is successfully cast, the target is struck by a bolt of energy and takes one S5 hit. Armour saves may be taken as normal.`,
      },
      {
        id: "blessing_of_the_elements",
        name: "Blessing of the Elements",
        roll: { min: 6, max: 6 },
        difficulty: 6,
        text: `The caster calls on the elements of the desert and draws upon the fortune they can bestow.

In the post-battle sequence, the player may re-roll any one dice or modify one dice by +1/-1. If the caster was taken out of action, this spell may not be cast.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Arabian Elemental Magic (https://mordheimer.net/docs/magic/arabian-elemental-magic)", file: "03-campaigns-magic-optional-rules.md:1580-1644" },
  },
  {
    id: "chaos_dwarfs_magic",
    name: "Chaos Dwarfs Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/chaos-dwarfs-magic",
    intro: `Chaos rituals employ the raw power of the darkest magic, and are therefore supremely useful in bringing pain and suffering, as well as change and mutation.

Chaos Dwarfs Magic is used by the The Sons of Hashut Apprentice Sorcerer.`,
    usedBy: ["The Sons of Hashut Apprentice Sorcerer"],
    die: "D6",
    spells: [
      {
        id: "spectre_of_hashut",
        name: "Spectre of Hashut",
        roll: { min: 1, max: 1 },
        difficulty: 9,
        text: `A spectral apparition of the god Hashut hits the miniature closest to the sorcerer.

Designate the enemy miniature closest to the wizard's miniature within 10". That miniature is automatically stunned.`,
      },
      {
        id: "stone_statue",
        name: "Stone Statue",
        roll: { min: 2, max: 2 },
        difficulty: 9,
        text: `By using illusory magic, the sorcerer turns his closest enemy into a stone statue.

Choose an enemy miniature that is within 12" of you and is in your line of sight. For the rest of the turn and the following turn, the miniature will not be able to do anything. If attacked in melee, the miniature will suffer an automatic hit. If it is shot, the miniature that shoots at it will get a +1 bonus on hit.`,
      },
      {
        id: "fireball",
        name: "Fireball",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The wizard summons a ball of flames that he casts on his enemies.

This spell has a range of 16" and requires line of sight. The target receives an automatic hit of strength 4.`,
      },
      {
        id: "vanish",
        name: "Vanish",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `The sorcerer vanishes in front of the enemy's eyes only to reappear elsewhere on the battlefield.

The wizard may immediately make a move of up to 6" in any direction and may enter or leave combat without penalty. If he enters combat, he is considered to be making a charge move.`,
      },
      {
        id: "eruption",
        name: "Eruption",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `After emitting a scream, the sorcerer turns into a red incandescent ball while a torrent of lava and stones gushes from his mouth and skin.

All miniatures within a distance of up to 4" (friend or foe) suffer an automatic hit of Strength 4. After resolving the effects of this hit, the sorcerer will not be able to cast any more spells until the next turn and will suffer a -1 to his Toughness attribute.`,
      },
      {
        id: "eye_of_hashut",
        name: "Eye of Hashut",
        roll: { min: 6, max: 6 },
        difficulty: 6,
        text: `The wizard opens his arms while summoning the mighty Hashut to help his children and give them strength.

Choose a friendly miniature within 12" and roll 1D6. Hobgoblins always subtract 1 from the result.

You may use the Eye of Hashut successfully only once per battle.

| 1D6 | Result |
|---|---|
| 1 | Hashut does not trust you. The miniature is immediately out of action, although it will not roll on the serious injury table during the post-battle sequence. |
| 2-5 | Hashut trusts you. The miniature adds +1 to one of its attributes for the rest of the game. |
| 6 | Hashut favors you. The miniature adds +1 to all attributes for the rest of the game. |`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Chaos Dwarfs Magic (https://mordheimer.net/docs/magic/chaos-dwarfs-magic)", file: "03-campaigns-magic-optional-rules.md:1645-1717" },
  },
  {
    id: "chaos_rituals",
    name: "Chaos Rituals",
    sourceUrl: "https://mordheimer.net/docs/magic/chaos-rituals",
    intro: `Chaos rituals employ the raw power of the darkest magic, and are therefore supremely useful in bringing pain and suffering, as well as change and mutation.

Chaos rituals are used by Magisters of the Cult of the Possessed, Daemons, Beastmen, and by the Marauders of Chaos seer with the Mark of Chaos Undivided.`,
    usedBy: ["Beastmen Raiders Beastmen Shaman", "Cult of the Possessed Magister", "Marauders of Chaos Seer (with the Mark of Chaos Undivided)"],
    die: "D6",
    spells: [
      {
        id: "vision_of_torment",
        name: "Vision of Torment",
        roll: { min: 1, max: 1 },
        difficulty: 10,
        text: `The Chaos Mage summons horrible visions of the realm of Chaos, causing his enemy to recoil in utter horror.

This spell has a range of 6" and must be cast on the closest enemy model. If the Chaos Mage is in hand-to-hand combat, he must choose his target from those in base contact with him. The affected model is immediately stunned. If the model cannot be stunned it is knocked down instead.`,
      },
      {
        id: "eye_of_god",
        name: "Eye of God",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `The Chaos Mage implores the Dark gods to grant a boon to their servant.

You may use the Eye of God successfully only once per battle. Choose any single model within 6", friend or foe. Roll a D6 to see what happens to the affected model.

| D6 | Result |
|---|---|
| 1 | The wrath of the gods descends upon the target. The model is taken out of action immediately. He does not have to roll on the Serious Injury chart after the battle though. |
| 2-5 | The model gains +1 to any one of his characteristics during this battle (chosen by the player who cast the spell). |
| 6 | The model gains +1 to all of its characteristics for the duration of the battle. |`,
      },
      {
        id: "dark_blood",
        name: "Dark Blood",
        roll: { min: 3, max: 3 },
        difficulty: 8,
        text: `The Chaos Mage cuts his palm and his blood spurts out, burning flesh and armour.

This attack has a range of 8" and causes D3 S5 hits. It hits the first model in its path. After using this spell the Chaos Mage must roll on the Injury table for himself to see how dangerous the wound is, though treat the out of action result as stunned instead.`,
      },
      {
        id: "lure_of_chaos",
        name: "Lure of Chaos",
        roll: { min: 4, max: 4 },
        difficulty: 9,
        text: `The Chaos Mage calls upon the taint of chaos which exists in the inner soul of all living beings.

The spell has a range of 12" and must be cast on the closest enemy model. Roll a D6 and add the Chaos Mage's Leadership to the score. Then roll a D6 and add the target's Leadership to the score. If the Chaos Mage beats his opponent's score he gains control of the model until the model passes a Leadership test in his own recovery phase. The model may not commit suicide, but can attack models on his own side, and will not fight warriors from the Chaos Mage's warband. If he was engaged in hand-to-hand combat with any warriors of the Chaos Mage's warband, they will immediately move 1" apart.`,
      },
      {
        id: "wings_of_darkness",
        name: "Wings of Darkness",
        roll: { min: 5, max: 5 },
        difficulty: 7,
        text: `The Chaos Mage is lifted from the ground by two shadowy Daemons and carried wherever he wants to go.

The Chaos Mage may immediately move anywhere within 12", including into base contact with an enemy, in which case he counts as charging. If he engages a fleeing enemy, in the close combat phase he will score one automatic hit and then his opponent will flee again (if he survives).`,
      },
      {
        id: "word_of_pain",
        name: "Word of Pain",
        roll: { min: 6, max: 6 },
        difficulty: 7,
        text: `Speaking the forbidden name of his dark god, the Chaos Mage causes indescribable pain to all who hear it.

All models within 3" of the Chaos Mage, friend or foe, suffer one S3 hit. No armour saves are allowed.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Chaos Rituals (https://mordheimer.net/docs/magic/chaos-rituals)", file: "03-campaigns-magic-optional-rules.md:1718-1788" },
  },
  {
    id: "charms_and_hexes",
    name: "Charms & Hexes",
    sourceUrl: "https://mordheimer.net/docs/magic/charms-and-hexes",
    intro: `Charms and Hexes are the magic of Witches. They involve copious amounts of spell ingredients and painstaking incantations but they can be devastating, reducing enemies to pitiful wrecks and infusing comrades with almost incomprehensible luck.

Charms and Hexes are used by Witches.`,
    usedBy: ["Witch"],
    die: "D6",
    spells: [
      {
        id: "scry",
        name: "Scry",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `The Witch uses ancient diving crystals to foretell the future and influence the actions of her comrades.

For the duration of the turn one hero or henchman may re-roll D3 dice rolls and add +1 or -1 to the result.`,
      },
      {
        id: "curse",
        name: "Curse",
        roll: { min: 2, max: 2 },
        difficulty: 6,
        text: `The Witch bestows a powerful curse on one of her enemies that saps their confidence and resolve.

One enemy model within 12" of the Witch must re-roll all successful dice rolls for the duration of this and their next turn.`,
      },
      {
        id: "dust_of_the_blind",
        name: "Dust of the Blind",
        roll: { min: 3, max: 3 },
        difficulty: 9,
        text: `Casting a handful of dust into the air, the Witch blows it around her, blinding her enemies.

One enemy model within 16" of the Witch is struck instantly blind. They may not shoot, charge or run, are at half Weapon Skill and will move in a random direction at the start of their turn. The Blindness lasts until the Witch casts another spell or moves.`,
      },
      {
        id: "age_of_stone",
        name: "Age of Stone",
        roll: { min: 4, max: 4 },
        difficulty: 8,
        text: `Whispering words of ancient power, the Witch causes an enemy to age rapidly before their very eyes, making them weak and feeble!

One enemy model within 12" of the Witch will be severely debilitated and all of their characteristics are reduced by -1 for the duration of this and their next turn.`,
      },
      {
        id: "warriors_bane",
        name: "Warrior's Bane",
        roll: { min: 5, max: 5 },
        difficulty: 7,
        text: `Muttering a dark and malicious incantation, the Witch causes a warrior's grip to loosen, making it almost impossible for them to attack.

One enemy model within 18" of the Witch will be unable to use any of their weapons as they perpetually slip from their grasp. They will be unable to shoot and count as fighting with fists in Hand-to-Hand combat. The enchantment lasts for the duration of this and their next turn.`,
      },
      {
        id: "cure",
        name: "Cure",
        roll: { min: 6, max: 6 },
        difficulty: 6,
        text: `A faint aura extends from the Witch's body. All who are touched by it feel warmth and vitality flowing through their veins.

All friendly models within 6" of the Witch have a single wound healed. In addition any stunned or knocked down models may immediately stand up.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Charms & Hexes (https://mordheimer.net/docs/magic/charms-and-hexes)", file: "03-campaigns-magic-optional-rules.md:1789-1853" },
  },
  {
    id: "dark_elf_magic",
    name: "Dark Elf Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/dark-elf-magic",
    intro: `The Dark Elves are as accomplished practitioners of magic as their arch enemies the High Elves but whereas the High Elves essentially use magic defensively and for the power of good, the Dark Elves utilise the evil powers of Dark Magic a very destructive force indeed.

Dark Elf Magic is used by Dark Elf Sorceresses.`,
    usedBy: ["Dark Elves Dark Elf Sorceress"],
    die: "D6",
    spells: [
      {
        id: "doombolt",
        name: "Doombolt",
        roll: { min: 1, max: 1 },
        difficulty: 9,
        text: `Whispering an ancient incantation the Sorceress conjures a bolt of pure dark energy and unleashes it from her outstretched hand.

The bolt of doom may be targeted at any enemy model in line of sight. The Doombolt has an 18" range and causes a Strength 5 hit. If the target model is wounded, then the next closest model within 6" is also hit on a 4+, at -1 Strength than the previous hit. The bolt will keep leaping until there are no more targets within range or until its Strength drops to a one. Each model can only be hit by a bolt once per turn. Take armour saves as normal.`,
      },
      {
        id: "word_of_pain",
        name: "Word of Pain",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `The Sorceress calls the curse of the Witch King down on his enemy reducing their willingness to fight.

The spell may be cast at an enemy model within 12". The victim must re-roll all successful hand to hand or missile attacks and all to wound rolls. If the victim wishes to charge, he must pass a successful Leadership test first. Lasts until the beginning of the next Dark Elf turn.`,
      },
      {
        id: "soul_stealer",
        name: "Soul Stealer",
        roll: { min: 3, max: 3 },
        difficulty: 9,
        text: `At the Sorceress's touch, the essence of life is drained from her enemy and absorbed into her body giving him renewed strength and vigour.

Once successfully cast, the Sorceress has to make a to hit roll against a model in base contact. If the attack is successful and her opponent is struck, he suffers a wound with no armour save possible. The Sorceress feeds on this life-force and adds one wound to her profile. Note: the Sorceress can never have more then one extra wound from the use of this spell and the extra wound is lost at the end of the battle.`,
      },
      {
        id: "flamesword",
        name: "Flamesword",
        roll: { min: 4, max: 4 },
        difficulty: 8,
        text: `Summoning Dark Magic the Sorceress engulfs a weapon in twisted black flames.

The Sorceress may choose the hand-to-hand combat weapon of a member of her warband within 6" to be engulfed in flames. A weapon with these flames acts as a normal weapon of its type, but also adds a +2 bonus to the users Strength. Hits inflicted from the weapon ignore armour saves. Lasts until the Sorceress' next shooting phase.`,
      },
      {
        id: "deathspasm",
        name: "Deathspasm",
        roll: { min: 5, max: 5 },
        difficulty: 10,
        text: `The Sorceress channels Dark Magic into her enemy, causing him to writhe in excruciating pain.

The Deathspasm has a range of 6" and must be cast on the closest enemy model. The affected model must roll on the injury chart. If successfully cast, the casting Sorceress is immediately knocked down.`,
      },
      {
        id: "witch_flight",
        name: "Witch Flight",
        roll: { min: 6, max: 6 },
        difficulty: 7,
        text: `The Sorceress bends the winds of magic to her will and flies through the air.

The Sorceress may immediately move anywhere within 12", and may count as charging. If she engages a fleeing enemy in the close combat phase she will score 1 automatic hit and then the opponent will flee again.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Dark Elf Magic (https://mordheimer.net/docs/magic/dark-elf-magic)", file: "03-campaigns-magic-optional-rules.md:1854-1918" },
  },
  {
    id: "forest_goblin_magic",
    name: "Forest Goblin Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/forest-goblin-magic",
    intro: `Forest Goblin Magic is used by the Forest Goblin Shaman.`,
    usedBy: ["Forest Goblins Shaman"],
    die: "D6",
    spells: [
      {
        id: "wind_of_gork",
        name: "Wind of Gork",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `A blast of foul flatulence signals G'rrk's Wrath.

A blast of foul flatulence signals Gork's wrath. Range: 12". The first model in its path must roll under its Toughness or take a S2 hit and be knocked down automatically.`,
      },
      {
        id: "gaze_of_mork",
        name: "Gaze of Mork",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `The Shaman invokes the presence of the God Mork to smite his foes with lightning.

Range 12". D3 S3 hits strike the first model in their path.`,
      },
      {
        id: "eadbanger",
        name: "'Eadbanger",
        roll: { min: 3, max: 3 },
        difficulty: 8,
        text: `The Shaman channels pure Waaagh! energy through his body and vomits it toward the enemy.

Range 6". Fire bolts equal to the number of the Shaman's Attacks. Resolve with Strength equal to the Shaman's Toughness at the first model in their path. After the bolts effects are resolved, roll a die. On a 1 the Shaman has drawn upon too much power. The Shaman collapses and goes out of action.`,
      },
      {
        id: "leap_of_waaagh",
        name: "Leap of Waaagh!",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `The Shaman summons a giant green hand to lift any Goblin and carry him into the fray.

The Shaman or any other Goblin within 3" may be moved up to 12". If this move brings them into close combat, they count as charging in the close combat phase.`,
      },
      {
        id: "idol_of_gork",
        name: "Idol of Gork",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `Swirling energy crackles around the Shaman, giving him the appearance of a huge orc hero.

The Shaman gains +1 WS, +1 S, and +1 A. This enhancement lasts until the Shaman takes a wound.`,
      },
      {
        id: "ere_we_go",
        name: "'Ere we go",
        roll: { min: 6, max: 6 },
        difficulty: 8,
        text: `The Shaman and nearby Goblins become filled with the essence of the Waaagh!

All friendly models within 6" of the Shaman treat stunned results on the injury table as knocked down instead. The effects last until the Shaman takes a wound.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Forest Goblin Magic (https://mordheimer.net/docs/magic/forest-goblin-magic)", file: "03-campaigns-magic-optional-rules.md:1919-1981" },
  },
  {
    id: "funerary_rites",
    name: "Funerary Rites",
    sourceUrl: "https://mordheimer.net/docs/magic/funerary-rites",
    intro: `Priests of Morr use Funerary rites to insure that the dead remain dead, that their body is sanctified and sealed and their soul safely passed into Morr's keeping.

Funerary Rites are used by the Priest Of Morr.`,
    usedBy: ["Priest Of Morr"],
    die: "D6",
    spells: [
      {
        id: "morrs_protection",
        name: "Morr's Protection",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `The Priest of Morr calls out to his god when confronted by an abomination and asks that he be shielded from the corrupted magic of the tainted.

Any Magical attacks made by a Necromancer, a Magister or Daemons, which would be considered a direct attack on the priest, will be negated if this rite is successful.`,
      },
      {
        id: "death_holds_no_fear",
        name: "Death Holds No Fear",
        roll: { min: 2, max: 2 },
        difficulty: null,
        text: `Priests of Morr must be steadfast in their resolution and as such must, above all else, have no fear of death.

The priest of Morr is now Fearless for the remainder of the game.`,
      },
      {
        id: "sanctity_of_the_fallen",
        name: "Sanctity of the Fallen",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `Those who fall shall be sanctified and their soul freed, in the name of Morr, god of death.

The priest of Morr may attempt to perform the Rite of Sanctity on a model (friend or foe) who has been taken Out of Action. The priest of Morr must be within 6" of the model in question. If successful, the model may not be raised up by a Necromancer.`,
      },
      {
        id: "hand_of_morr",
        name: "Hand of Morr",
        roll: { min: 4, max: 4 },
        difficulty: 9,
        text: `'By his the hand of Morr, the Undead shall become as dust and ashes'

The priest of Morr must be in base-to-base contact with an Undead model. Before Hand-to-Hand combat occurs, the priest of Morr may attempt to use the Hand of Morr rite. If successful the foe immediately goes out of action (this affects Zombies, Dire Wolves and Vampires). Ghouls and Possessed affected by this rite will immediately flee their full Move away from the priest of Morr.`,
      },
      {
        id: "do_you_know_who_i_am",
        name: "Do You Know Who I Am?",
        roll: { min: 5, max: 5 },
        difficulty: 7,
        text: `'Gaze upon me, abomination, for I am a priest of Morr'.

This rite has a range of 6" and must be directed at the closest Undead model first, or if no Undead are within range, at the next closest human servant of the Undead (Dregs, Ghouls, Necromancers), or finally at any model. If successful, that model is immediately Stunned. If the model cannot be Stunned, then it is Knocked Down instead.`,
      },
      {
        id: "i_am_death",
        name: "I Am Death!",
        roll: { min: 6, max: 6 },
        difficulty: 8,
        text: `'I am a priest of Morr, god of death!' It is a well-known fact that the priests of Morr are not martially inclined. Their divine duties involved the dead, not the taking of life. However, there are times when a priest of Morr will he called to engage in combat and who would be more feared than a representative of the god of Death?

This spell gives the priest of Morr a 6+ armour save and increases their WS by either +1 or makes it 4, whichever is greater.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Funerary Rites (https://mordheimer.net/docs/magic/funerary-rites)", file: "03-campaigns-magic-optional-rules.md:1982-2046" },
  },
  {
    id: "goblin_magic",
    name: "Goblin Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/goblin-magic",
    intro: `Goblin Magic is used by the Night Goblins (web) Shaman.`,
    usedBy: ["Night Goblins (Web) Shaman"],
    die: "D6",
    spells: [
      {
        id: "wind_of_gork",
        name: "Wind of Gork",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `A blast of foul flatulence signals G'rrk's Wrath.

Range: 12". The first model in its path must roll under its Toughness or take a Strength 2 hit and be knocked down automatically.`,
      },
      {
        id: "gaze_of_mork",
        name: "Gaze of Mork",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `The Shaman invokes the presence of the God Mork to smite their foes with lightning.

Range: 12". D3 Strength 3 hits strike the first model in their path.`,
      },
      {
        id: "eadbanger",
        name: "'Eadbanger",
        roll: { min: 3, max: 3 },
        difficulty: 8,
        text: `The Shaman channels pure Waaagh! energy through their body and vomits it toward the enemy.

Range: 6". Fire bolts equal to the number of the Shaman's Base Attacks. Resolve with Strength equal to the Shaman's Toughness at the first model in their path. After the bolts effects are resolved, roll a die. On a 1 the Shaman has drawn upon too much power, they collapse and goes Out of Action.`,
      },
      {
        id: "leap_of_waaagh",
        name: "Leap of Waaagh!",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `The Shaman summons a giant green hand to lift any Goblin and carry them into the fray.

The Shaman or any other Goblin within 3" may be moved up to 12", ignoring terrain. If this move brings them into close combat, they count as charging in the close combat phase.`,
      },
      {
        id: "idol_of_gork",
        name: "Idol of Gork",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `Swirling energy crackles around the Shaman, giving them the appearance of a huge Orc hero.

The Shaman gains +1 WS, +1 S, and +1 A. This enhancement lasts until the Shaman takes a wound.`,
      },
      {
        id: "ere_we_go",
        name: "'Ere we go!",
        roll: { min: 6, max: 6 },
        difficulty: 8,
        text: `The Shaman and nearby allies become filled with the essence of the Waaagh!

All friendly models within 6" of the Shaman treat stunned results on the Injury Table as knocked down instead. The effects last until the Shaman takes a wound.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Goblin Magic (https://mordheimer.net/docs/magic/goblin-magic)", file: "03-campaigns-magic-optional-rules.md:2047-2109" },
  },
  {
    id: "ladys_prayers",
    name: "Lady's Prayers",
    sourceUrl: "https://mordheimer.net/docs/magic/ladys-prayers",
    intro: `Lady's Prayers are used by the Bretonnian Chapel Guard Damsel.

Prayers are not regarded as spells, so any special protection against spells does not affect them.`,
    usedBy: ["Bretonnian Chapel Guard Damsel"],
    die: "D6",
    spells: [
      {
        id: "ladys_favors",
        name: "Lady's Favors",
        roll: { min: 1, max: 1 },
        difficulty: null,
        text: `All your heroes count as having Lucky Charms for this battle and ignore the first hit against them on a D6 roll of 4+. If they already own Lucky Charms, they may reroll a failed Lucky Charm save, accepting the second result.`,
      },
      {
        id: "blessed_protection",
        name: "Blessed Protection",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `The Damsel and any Bretonnians within 6" of her gain an unmodified ward save of 4+ against the effects of spells or prayers. Test each shooting phase: on a roll of 1 or 2, the spell dissipates.`,
      },
      {
        id: "swiftstride",
        name: "Swiftstride",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The damsel may pick a friendly hero or henchman (including herself) within 12" that charged or failed a charge this turn. That warrior gains +1 to hit on all attacks they make until the end of the turn. In addition, if they are not in combat, they may make an additional move of 1D6" towards an enemy (if they move into base contact with an enemy, this counts as a charge).`,
      },
      {
        id: "ladys_scorn",
        name: "Lady's Scorn",
        roll: { min: 4, max: 4 },
        difficulty: 5,
        text: `Anyone attempting to shoot at the Damsel must first pass a Leadership test, or else they are unable to fire this turn. This includes Silver Arrows, Crossbow Pistols, Hand-to-Hand Pistols, and Template shot weapons that she is within the path of (like Blunderbusses.) This spell lasts until the end of the game.`,
      },
      {
        id: "elixir_of_life",
        name: "Elixir of Life",
        roll: { min: 5, max: 5 },
        difficulty: 7,
        text: `Any one model within 4" of the Damsel (including herself) may be healed. The warrior is restored to his full quota of Wounds. In addition, if any friendly models within 4" are stunned or knocked down, they immediately come to their senses, stand up, and continue fighting as normal.`,
      },
      {
        id: "guiding_vision",
        name: "Guiding Vision",
        roll: { min: 6, max: 6 },
        difficulty: 6,
        text: `The Damsel picks a friendly hero or henchman within 8". Until the start of your next shooting phase, that warrior may re-roll one die roll they make and add +1 or -1 to the result.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Lady's Prayers (https://mordheimer.net/docs/magic/ladys-prayers)", file: "03-campaigns-magic-optional-rules.md:2110-2162" },
  },
  {
    id: "lesser_magic",
    name: "Lesser Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/lesser-magic",
    intro: `Those who have not been schooled in the ways of magic can cast only relatively simple spells. Many human wizards, lacking the tradition of sorcery and the grimoires of Necromancers and Chaos Mages, have to rely on their own natural aptitude and experimentation.

Lesser Magic (or hedge magic) is used by human warlocks. It may not be as awesome as the mighty spells of Necromancers and Chaos Mages, but it is still dangerous.`,
    usedBy: ["Warlock"],
    die: "D6",
    spells: [
      {
        id: "fires_of_uzhul",
        name: "Fires of U'Zhul",
        roll: { min: 1, max: 1 },
        difficulty: 7,
        text: `The wizard summons a fiery ball of flames and hurls it upon his enemies.

The fireball has a range of 18" and causes one Strength 4 hit. It strikes the first model in its path. Armour saves are taken as normal (ie, with -1 modifier).`,
      },
      {
        id: "flight_of_zimmeran",
        name: "Flight of Zimmeran",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `Calling upon the power of the winds of magic, the wizard walks on air.

The wizard may immediately move anywhere within 12", including into base contact with an enemy, in which case he counts as charging. If he engages a fleeing enemy in the close combat phase he will score 1 automatic hit and then his opponent will flee again (if he survives).`,
      },
      {
        id: "dread_of_aramar",
        name: "Dread of Aramar",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The wizard places a sense of mind-numbing fear into the minds of his opponents.

A single model within 12" of the wizard must pass a Leadership test or flee 2D6" directly away from him. If he flees, he must test at the start of each of his own movement phases and will continue to flee until he passes a test. Note that this spell does not affect Undead or any model immune to fear.`,
      },
      {
        id: "silver_arrows_of_arha",
        name: "Silver Arrows of Arha",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `Silvery arrows appear from thin air and circle around the wizard, shooting out to strike his foes.

Unlike other spells, this cannot be cast whilst in hand-to-hand combat. The spell summons D6+2 arrows which the wizard can use to shoot against one enemy model. The arrows have a range of 24". Use the wizard's own Ballistic Skill to determine whether he hits or not, but ignore movement, range and cover penalties. The arrows cause one S3 hit each.`,
      },
      {
        id: "luck_of_shemtek",
        name: "Luck of Shemtek",
        roll: { min: 5, max: 5 },
        difficulty: 6,
        text: `The wizard summons the fickle power of magic to manipulate chance.

The wizard may re-roll all his failed dice rolls, though the second results stand. The effect lasts until the beginning of his own next turn.`,
      },
      {
        id: "sword_of_rezhebel",
        name: "Sword of Rezhebel",
        roll: { min: 6, max: 6 },
        difficulty: 8,
        text: `A flaming sword appears in the hand of the wizard, promising red ruin to all who stand in his way.

The sword gives the wizard +1 Attack, +2 Strength and +2 Weapon Skill. Take a Leadership test at the beginning of each of the wizard's own turns. If the test fails, the sword disappears.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Lesser Magic (https://mordheimer.net/docs/magic/lesser-magic)", file: "03-campaigns-magic-optional-rules.md:2163-2227" },
  },
  {
    id: "lizardman_magic",
    name: "Lizardman Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/lizardmen-magic",
    intro: `Lizardmen Magic is used by the Lizardmen Skink Priest.

Lizardmen Spells work like the Prayers of Sigmar and may be used even if the Skink Priest is wearing armour.`,
    usedBy: ["Lizardmen Skink Priest"],
    die: "D6",
    spells: [
      {
        id: "chotecs_wrath",
        name: "Chotec's Wrath",
        roll: { min: 1, max: 1 },
        difficulty: 8,
        text: `A lightning bolt shoots from the sky above and strikes the closest enemy model within 10" of the Skink Priest, causing a single Strength 5 hit. However add +1 to the Strength and +1 to the roll on the injury table if the model is wearing armour like light armour, heavy armour, Ithilmar armour or Gromril armour.`,
      },
      {
        id: "sotecs_blessing",
        name: "Sotec's Blessing",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `This spell may be cast on a single model within 6" of the Skink Priest or on himself. Roll a D6 to determine the blessing. The effects remain in play until the Priest or the model is Stunned or taken Out of Action. Only a single model may be affected by the blessing at any given time.

| D6 | Effect |
|---|---|
| 1-2 | +1 BS or +1 to hit in close combat. |
| 3-4 | Toughness +1. |
| 5-6 | Movement and Initiative +1. |`,
      },
      {
        id: "huanchis_stealth",
        name: "Huanchi's Stealth",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The spell affects all Skinks within 6" of the Skink Priest, including himself, and allows any model that is in cover to immediately to go into hiding. A model may go into hiding even if they ran in the movement phase or has already shot with a missile weapon.`,
      },
      {
        id: "the_old_ones_protection",
        name: "The Old Ones' Protection",
        roll: { min: 4, max: 4 },
        difficulty: 6,
        text: `The Skink Priest and any Lizardmen within 4" of him gain a save of 4+ against the effects of spells or prayers. This spell remains in play until the Skink Priest is taken Out of Action.`,
      },
      {
        id: "tincis_rage",
        name: "Tinci's Rage",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `A single Lizardman within 6" of the Skink Priest or himself, is overtaken by rage and follows the rules for Frenzy, in addition he gains +1 Strength. This spell remains in play until the Skink Priest or the model is Stunned or is taken Out of Action. At the beginning of the turn the Skink priest must pass a Leadership roll in order to keep the spell going. Only a single model may be affected by the blessing at any given time, but the Skink Priest can choose to release the spell at the beginning of his turn if he wish to attempt to recast it on another model later in the shooting phase.`,
      },
      {
        id: "itzls_speed",
        name: "Itzl's Speed",
        roll: { min: 6, max: 6 },
        difficulty: 7,
        text: `A single Lizardman model within 6" of the Skink Priest or himself, may make an additional sprint of movement and move up to 4". This counts, as running and a model may not move if he has already fired with a missile weapon. He may not charge with this extra move.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Lizardman Magic (https://mordheimer.net/docs/magic/lizardmen-magic)", file: "03-campaigns-magic-optional-rules.md:2228-2286" },
  },
  {
    id: "lore_of_darkness",
    name: "Lore of Darkness",
    sourceUrl: "https://mordheimer.net/docs/magic/lore-of-darkness",
    intro: `It is whispered amongst the wise that the Dark Master taught the Lore Of Darkness to his disciples in order to spread corruption throughout the world.

Lore of Darkness is used by the Dark Emissary.`,
    usedBy: ["Dark Emissary"],
    die: "D6",
    spells: [
      {
        id: "bolt_of_dark_light",
        name: "Bolt of Dark Light",
        roll: { min: 1, max: 1 },
        difficulty: 7,
        text: `The Dark Emissary conjures a bolt of malign power to smite his enemies.

The bolt has a range of 12" and causes a single Strength 5 hit against the first model in its path.`,
      },
      {
        id: "betrayal_in_death",
        name: "Betrayal in Death",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `Summoning all the curses of the Dark Master, the Emissary instils the vigour of the undead into a slain enemy forcing them to attack their comrades.

This spell will affect all enemy models slain in the shooting phase or close combat and lasts until the start of the caster's next turn. The enemies will reanimate as they are killed and attack their comrades. If not in combat the model will shoot if able, or charge if it has no missile weapons. If in combat the enemy will only make a single attack. After attacking the enemy will fall once more, dead.`,
      },
      {
        id: "nightmare",
        name: "Nightmare",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `A vision of a warrior's worst nightmares manifests before him instilling inner feelings of dread.

This spell may be cast upon an enemy model within 18" of the caster. The model must take an immediate fear test as if charged by a fear-causing enemy. If failed the model flees 2D6" away from the Dark Emissary.`,
      },
      {
        id: "curse_of_the_dark_master",
        name: "Curse of the Dark Master",
        roll: { min: 4, max: 4 },
        difficulty: 8,
        text: `The Dark Emissary bas the power to enfeeble his enemies, loosening their grip on their swords and debilitating their will through the cold touch of fear.

This spell can be cast upon a single model within 24" of the caster. All that model's rolls to hit for both shooting and combat are reduced by -1 until the start of the caster' next turn.`,
      },
      {
        id: "fog_of_death",
        name: "Fog of Death",
        roll: { min: 5, max: 5 },
        difficulty: 10,
        text: `A deep and impenetrable fog cloaks the entire battlefield, filled with the vicious embodiments of nightmares. Chaos and fear ensue.

This spell affects every model on the board except the Dark Emissary. Enemy models are affected on a roll of 4+, while friendly models are only affected on a 6+. All models attacked by the nightmare creatures suffer a strength 2 hit. The fog lasts until the start of the caster's next turn and reduces line of sight to 3D6" for all warriors present which will affect shooting, charging etc.`,
      },
      {
        id: "coils_of_the_serpent",
        name: "Coils of the Serpent",
        roll: { min: 6, max: 6 },
        difficulty: 10,
        text: `The Emissary conjures a dark serpent of pure malign energy to ensnare and crush an unwitting adversary in its coils.

This spell may be cast upon a single enemy model within 6" of the caster. The model must take an immediate toughness test to fight off the deadly serpent. If failed the model is crushed to death and out of action. No saves of any kind will protect against this magic.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Lore of Darkness (https://mordheimer.net/docs/magic/lore-of-darkness)", file: "03-campaigns-magic-optional-rules.md:2287-2351" },
  },
  {
    id: "lore_of_light",
    name: "Lore of Light",
    sourceUrl: "https://mordheimer.net/docs/magic/lore-of-light",
    intro: `Only the Truthsayers know of the strange and powerful rituals of the Lore of Light and they pass this knowledge on to a few.

Lore of Light is used by the Truthsayer.`,
    usedBy: ["Truthsayer"],
    die: "D6",
    spells: [
      {
        id: "wings_of_fate",
        name: "Wings of Fate",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `Using the powers of life itself, the Truthsayer conjures a flock of birds to sweep down and attack his enemies.

The flock has a range of 18" and may attack any model within this range of the Truthsayer. The enemy model suffers D3 Strength 2 hits.`,
      },
      {
        id: "light_of_battle",
        name: "Light of Battle",
        roll: { min: 2, max: 2 },
        difficulty: 6,
        text: `The power of light infuses one of the Truthsayer's allies, encasing them in a protective barrier of pure light.

This spell may be cast upon a friendly model within 12" of the caster. That model has an additional save of 5+ that can be reduced in any way against all attacks until the start of the Truthsayer's next turn.`,
      },
      {
        id: "gift_of_life",
        name: "Gift of Life",
        roll: { min: 3, max: 3 },
        difficulty: 9,
        text: `Life is at the essence of the Truthsayer's magic. Harnessing all of his power the Truthsayer restores a fallen comrade miraculously back to life!

This spell may be cast upon a friendly model slain in the previous enemy turn. The model is immediately restored back to 1 wound remaining and should be placed as accurately as possible where they fell.`,
      },
      {
        id: "blessing_of_valour",
        name: "Blessing of Valour",
        roll: { min: 4, max: 4 },
        difficulty: 8,
        text: `The Truthsayer evokes a powerful blessing, which instils an ally with the courage and strength of the immortal hunter gods.

This spell may be cast upon a single friendly model within 24". The model is infused with strength and courage, gaining +1 to all hit rolls in close combat for the duration of the turn.`,
      },
      {
        id: "boon_of_courage",
        name: "Boon of Courage",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `A corona of reassuring energy surrounds the Truthsayer and envelops an ally with its power, instilling resolve and unshakable determination.

This spell affects all friendly models within 12". The models are completely immune to the effects of psychology and all alone tests until the end of the Truthsayer's next turn.`,
      },
      {
        id: "voice_of_command",
        name: "Voice of Command",
        roll: { min: 6, max: 6 },
        difficulty: 9,
        text: `The booming resonance of the voice of the Truthsayer echoes across the fens and enemies quake with indecision and doubt.

This spell affects one model within 24" of the Truthsayer. That model may do nothing in its next turn other than defend itself in combat. It may not move, shoot, attack or perform any other action.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Lore of Light (https://mordheimer.net/docs/magic/lore-of-light)", file: "03-campaigns-magic-optional-rules.md:2352-2416" },
  },
  {
    id: "magic_of_the_horned_rat",
    name: "Magic of the Horned Rat",
    sourceUrl: "https://mordheimer.net/docs/magic/magic-of-the-horned-rat",
    intro: `This brand of sorcery is used by the Skaven. It is a sinister form of magic which calls upon the Skaven deity, a loathsome daemonic god known as the Horned Rat.

Magic of the Horned Rat is used by the Skaven of Clan Eshin Sorcerer, and the Skaven of Clan Pestilens Sorcerer.`,
    usedBy: ["Skaven of Clan Pestilens Sorcerer", "Skaven Sorcerer"],
    die: "D6",
    spells: [
      {
        id: "warpfire",
        name: "Warpfire",
        roll: { min: 1, max: 1 },
        difficulty: 8,
        text: `A green flame leaps from the outstretched paw of the Sorcerer and burns its victims with indescribable agony.

The spell has a range of 8", hitting the first model in its path. The spell causes D3 Strength 4 hits on its target, and one Strength 3 hit on each model within 2" of the target.`,
      },
      {
        id: "children_of_the_horned_rat",
        name: "Children of the Horned Rat",
        roll: { min: 2, max: 2 },
        difficulty: null,
        text: `The Sorcerer raises his paws and calls upon the Father of the Skaven to send forth his servants.

This spell must be used before the game, and may only be used once. When cast, the spell summons D3 Giant Rats, which are placed within 6" of the Sorcerer. The Sorcerer may cast this spell successfully only once per battle, and the rats disappear after the battle. They do not count towards the maximum size of the Skaven warband.`,
      },
      {
        id: "gnawdoom",
        name: "Gnawdoom",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The target is attacked by rats and soon is covered from head to foot in small, bleeding wounds.

The Gnawdoom causes 2D6 Strength 1 hits on a single model within 8" of the caster.`,
      },
      {
        id: "black_fury",
        name: "Black Fury",
        roll: { min: 4, max: 4 },
        difficulty: 8,
        text: `With a chittering incantation the Sorcerer turns into a monstrous rat-like creature, which attacks with an insane fury.

The Sorcerer may immediately charge any enemy model within 12" (ignoring any terrain and interposing models) and gains 2 extra Attacks and +1 Strength during this turn's hand-to-hand combat phase only.`,
      },
      {
        id: "eye_of_the_warp",
        name: "Eye of the Warp",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `Gaze into the eye of the warp and despair!

All standing models in base contact with the Sorcerer must take an immediate Leadership test. If they fail, they each suffer a Strength 3 hit and must run 2D6" directly away from the Sorcerer, exactly as if they had lost their nerve when fighting against more than one opponent.`,
      },
      {
        id: "sorcerers_curse",
        name: "Sorcerer's Curse",
        roll: { min: 6, max: 6 },
        difficulty: 6,
        text: `The Sorcerer points a claw towards one of his enemies and curses him in the name of the Horned One.

The spell has a range of 12" and affects a single model within range. The target must re-roll any successful armour saves and to hit rolls during the Skaven hand-to-hand phase and his own next shooting and hand-to-hand combat phases.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Magic of the Horned Rat (https://mordheimer.net/docs/magic/magic-of-the-horned-rat)", file: "03-campaigns-magic-optional-rules.md:2417-2481" },
  },
  {
    id: "mortuary_cult_scrolls",
    name: "Mortuary Cult Scrolls",
    sourceUrl: "https://mordheimer.net/docs/magic/mortuary-cult-scrolls",
    intro: `The Liche Priest's magic is preserved in magical scrolls that date back to Nagash's time as High Priest of the early Nehekharan civilisation.

Mortuary Cult Scrolls are used by the Tomb Guardians Liche Priest.`,
    usedBy: ["Tomb Guardians Liche Priest"],
    die: "D6",
    spells: [
      {
        id: "menkares_scroll_of_urgency",
        name: "Menkare's Scroll of Urgency",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `The Liche Priest reaches out to urge an Undead warrior forward.

A single Skeleton Soldier within 6" may immediately move again up to its maximum Movement distance, ie, 4". If this takes the model into base contact with an enemy model, it counts as charging.`,
      },
      {
        id: "horrebes_curse_of_the_mummy",
        name: "Horrebe's Curse of the Mummy",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `The Liche Priest amplifies the curse that all mummies bear, and focuses it against a single enemy model.

The target must be in base-to-base contact with a Mummy and within 18" of the Liche Priest. if the spell is cast successfully, the enemy model has a -1 penalty on all to hit and to wound rolls, and on all armour saves. This lasts until the stare of the next Tomb Guardian Shooting phase.`,
      },
      {
        id: "tawosrets_scroll_of_tomb_dust",
        name: "Tawosret's Scroll of Tomb Dust",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The Liche Priest can command the sand around him to assault a single warrior within 12".

The warrior is automatically knocked down as he chokes on the sand. This spell only affects a living model.`,
      },
      {
        id: "neferres_scroll_of_quaking_horror",
        name: "Neferre's Scroll of Quaking Horror",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `The Liche Priest selects a warrior within 12" who is beset by terrible, haunting visions of his own death.

The model must pass a Leadership test or flee 2D6" directly away from the Liche Priest. The warrior will continue to flee in each Movement phase until he makes a successful Rally test in the Recovery phase. This spell has no effect on Undead models or models that are immune to psychology.`,
      },
      {
        id: "merneptahs_scroll_of_the_scarab_song",
        name: "Merneptah's Scroll of the Scarab Song",
        roll: { min: 5, max: 5 },
        difficulty: 7,
        text: `With a short, rasping chant, the Liche Priest summons a swarm of scarabs, which burrow up through the ground, and all over an enemy warrior.

A single model within 8" of the Liche Priest suffers 2D6 Strength 1 hits. In addition, that model may not be shot at for the rest of the Tomb Guards Shooting phase, nor may he fight or be fought in hand-to-hand combat. If the model is already in hand-to-hand combat, move him 1" away from the combat as he staggers about in agony. Unless he suffers an actual injury the warrior counts as having just stood up in the next turn.`,
      },
      {
        id: "djedres_summonation_of_the_vengeful_dead",
        name: "Djedre's Summonation of the Vengeful Dead",
        roll: { min: 6, max: 6 },
        difficulty: 5,
        text: `The Liche Priest may re-animate a Skeleton Soldier that went out of action during the last turn. Place the model anywhere within 6" of the Liche Priest, but not straight into hand-to-hand combat with an enemy model.`,
      },
    ],
    notes: `**MUMMY:** In the original source material for Khemri, instead of Acolytes there was a hero type called "Mummy Warriors" with a very different profile and cost. Additionally, the Tomb Lord was called "Mummy Prince". There is still a remnant mention in the original Town Cryers calling the Tomb lord "Mummy" in the skill table and profile.`,
    source: { publication: "mordheimer.net — Magic: Mortuary Cult Scrolls (https://mordheimer.net/docs/magic/mortuary-cult-scrolls)", file: "03-campaigns-magic-optional-rules.md:2482-2546" },
  },
  {
    id: "necromancy_the_restless_dead",
    name: "Necromancy (The Restless Dead)",
    sourceUrl: "https://mordheimer.net/docs/magic/necromancy-restless-dead",
    intro: `Necromancy is the magic of the dead. It grants Necromancers the power to raise the dead and command spirits, but also destroy the vitality of the living. This list is slightly revised for use in a Restless Dead Warband.

While they are similar, this spell list has differences to the original Necromancy list, and should only be used by The Restless Dead Liche and Necromancer.`,
    usedBy: ["The Restless Dead Liche", "The Restless Dead Necromancer"],
    die: "D6",
    spells: [
      {
        id: "spell_of_awakening",
        name: "Spell of Awakening",
        roll: { min: 1, max: 1 },
        difficulty: null,
        text: `The Sorcerer summons calls the soul of a slain Hero back to his body and enslaves him with corrupt magic.

If an enemy Hero is killed (i.e. your opponent rolls 11-15 on the serious injury chart after the battle), then the sorcerer may raise him to fight as a Zombie in his servitude.

The dead Hero retains his characteristics and all his weapons and armour but may not use any equipment or skills. He may no longer run, counts as a Henchmen group on his own and does not gain additional experience.`,
      },
      {
        id: "lifestealer",
        name: "Lifestealer",
        roll: { min: 2, max: 2 },
        difficulty: 10,
        text: `The Sorcerer sucks out the very essence of life from his victim, stealing its vigour for himself.

Choose a single model within 6". The target suffers a wound, (no saves allowed) and the sorcerer gains an extra wound for the duration of the battle. This may take the Wounds of a Necromancer above their original maximum value, but a Liche may only restore lost wounds. This spell will not affect the Possessed or any Undead models.`,
      },
      {
        id: "reanimation",
        name: "Reanimation",
        roll: { min: 3, max: 3 },
        difficulty: 5,
        text: `At the spoken command of the Sorcerer, the dead rise to fight again.

One Zombie that went out of action during the last hand to hand combat phase immediately returns to battle. Place the model within 6" of the sorcerer. The model cannot be placed straight into hand to hand combat with an enemy model. This spell can be used on Grave Guards and Wights to restore 1 lost wound (should they have more than one). This cannot be used to bring Scarecrows, Grave Guards, Wights and Skeletons back to life if they are taken out of action the way Zombies can.`,
      },
      {
        id: "spell_of_doom",
        name: "Spell of Doom",
        roll: { min: 4, max: 4 },
        difficulty: 9,
        text: `The Sorcerer whispers to the sleeping dead to rise up from the ground and seize his enemies.

Chose one enemy model within 12". The model must immediately roll equal to or less than his Strength on a D6 or the dead emerging from the earth will rend him with supernatural power. If he fails, you may roll on the Injury table to see what happens to the unfortunate warrior.`,
      },
      {
        id: "call_of_vanhel",
        name: "Call of Vanhel",
        roll: { min: 5, max: 5 },
        difficulty: 6,
        text: `The Sorcerer summons the world of the dead to invigorate his Undead servants.

A single Zombie, Skeleton, Wight or Grave Guard within 6" of the caster may immediately move again up to its maximum movement distance. If this moves them into base contact with an enemy model then it counts as charging. The targeted Zombie, Skeleton, Wight or Grave Guard will automatically pass Initiative tests needed to be made during this extra movement.`,
      },
      {
        id: "deathly_visage_necromancers_only",
        name: "Deathly Visage (Necromancers only)",
        roll: { min: 6, max: 6 },
        difficulty: 6,
        text: `The Sorcerer calls upon the power of Necromancy to reveal the moment of his enemies' death.

The Necromancer causes fear in his enemies for the duration of the battle and is likewise immune to fear. This spell is the one exception to the Apprentice rule that Necromancers must usually follow when in a Liche warband. A Necromancer may choose this spell if the Liche has the spell Horror.`,
      },
      {
        id: "living_horror_liche_only",
        name: "Living Horror (Liche only)",
        roll: { min: 6, max: 6 },
        difficulty: 8,
        text: `The ghostlights around the Liche intensify as he torments the mind of his enemy forcing him to experience the sensation during the very moment of his death over and over.

You may choose one model within 8" of the Liche and roll D6+3. If this score is equal to or greater than the Leadership of the target model, then that model suffers a Wound, no armour saves allowed. If this wounds the target and they still have Wounds remaining, then that target may not move, shoot or cast spells during their next turn unless they pass a Leadership test. This spell will not affect the Possessed, Undead, or any model that is immune to fear.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Necromancy (The Restless Dead) (https://mordheimer.net/docs/magic/necromancy-restless-dead)", file: "03-campaigns-magic-optional-rules.md:2547-2621" },
  },
  {
    id: "necromancy",
    name: "Necromancy",
    sourceUrl: "https://mordheimer.net/docs/magic/necromancy",
    intro: `Necromancy is the magic of the dead. It grants Necromancers the power to raise the dead and command spirits, but also to destroy the vitality of the living.

Necromancy is used by The Undead Necromancer.`,
    usedBy: ["Undead Necromancer"],
    die: "D6",
    spells: [
      {
        id: "lifestealer",
        name: "Lifestealer",
        roll: { min: 1, max: 1 },
        difficulty: 10,
        text: `The Necromancer sucks out the very essence of life from his victim, stealing its vigour for himself.

You may choose a single model within 6". The target suffers a wound (no save allowed) and the Necromancer gains an extra wound for the duration of the battle. This may take the Necromancer's Wounds above his original maximum value. This spell will not affect the Possessed or any Undead models.`,
      },
      {
        id: "re_animation",
        name: "Re-Animation",
        roll: { min: 2, max: 2 },
        difficulty: 5,
        text: `At the spoken command of the Necromancer, the dead rise to fight again.

One Zombie that went out of action during the last hand-to-hand combat or Shooting phase immediately returns to the battle. Place the model within 6" of the Necromancer. The model cannot be placed straight into hand-to-hand combat with an enemy model.`,
      },
      {
        id: "death_vision",
        name: "Death Vision",
        roll: { min: 3, max: 3 },
        difficulty: 6,
        text: `The Necromancer calls on the power of Necromancy to reveal the moment of his enemies' death.

The Necromancer causes fear in his enemies for the duration of the battle.`,
      },
      {
        id: "spell_of_doom",
        name: "Spell of Doom",
        roll: { min: 4, max: 4 },
        difficulty: 9,
        text: `The Necromancer whispers to the sleeping dead to rise up from the ground and seize his enemies.

Choose one enemy model within 12". The model must immediately roll equal to or less than his Strength on a D6 or the dead emerging from the earth will rend him with supernatural power. If he fails, you may roll on the Injury table to see what happens to the unfortunate warrior.`,
      },
      {
        id: "call_of_vanhel",
        name: "Call of Vanhel",
        roll: { min: 5, max: 5 },
        difficulty: 6,
        text: `The Necromancer summons the world of the dead to invigorate his Undead servants.

A single Zombie or Dire Wolf within 6" of the Necromancer may immediately move again up to its maximum Movement distance (ie, 9" in the case of Dire Wolves). If this moves them into base contact with an enemy model, they count as charging.`,
      },
      {
        id: "spell_of_awakening",
        name: "Spell of Awakening",
        roll: { min: 6, max: 6 },
        difficulty: null,
        text: `The Necromancer calls the soul of a slain Hero back to his body and enslaves him with corrupt magic.

If an enemy Hero is killed (ie, your opponent rolls 11-15 on the Serious Injury chart after the battle) then the Necromancer may raise him to fight as a Zombie in his servitude.

The dead Hero retains his characteristics and all his weapons and armour but may not use any other equipment or skills. He may no longer run, counts as a Henchman group on his own, and may not gain additional experience. This spell always succeeds (rules for Henchmen and experience are described later). The new Zombie follows all the normal Zombie rules (immune to poison, causes fear) except for retaining his profile, weapons and armour.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Necromancy (https://mordheimer.net/docs/magic/necromancy)", file: "03-campaigns-magic-optional-rules.md:2622-2688" },
  },
  {
    id: "norse_runes",
    name: "Norse Runes",
    sourceUrl: "https://mordheimer.net/docs/magic/norse-runes",
    intro: `The Norse Runes are used by the Norse Shamans.`,
    usedBy: ["Norse Shaman"],
    die: "D6",
    spells: [
      {
        id: "howl_of_the_north",
        name: "Howl of the North",
        roll: { min: 1, max: 1 },
        difficulty: 9,
        text: `Icy winds sweep before the Shaman knocking missiles from their path.

The Shaman is immune to all missile fire. Roll a dice during the Shaman's recovery phase. On a roll of 1 or 2 the winds dissipate.`,
      },
      {
        id: "angvars_fury",
        name: "Angvar's Fury",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `The Shaman's howls rouses the anger of the warriors around him to a fever pitch.

All warriors within 8" of the Shaman gain a +1 to hit in hand-to-hand combat against the opposing warband. The spell lasts till the start of the Norse players next turn.`,
      },
      {
        id: "elveks_cold_spear",
        name: "Elvek's Cold Spear",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `A razor sharp icicle flies at the Shaman's foe.

The icicle has a range of 18" and causes one S4 hit. It strikes the first model in its path. Normal armour saves apply.`,
      },
      {
        id: "gift_of_the_fates",
        name: "Gift of the Fates",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `The Shaman calls on the three Wyrd Sisters of Norse legend for a glimpse of the future.

The Shaman may adjust one die roll by +1/–1 between a successful casting of this rune and his next recovery phase. A 'to wound' roll adjusted to or from 6 will not cause a critical.`,
      },
      {
        id: "kiss_of_frost",
        name: "Kiss of Frost",
        roll: { min: 5, max: 5 },
        difficulty: 6,
        text: `The Shaman covers ground of his choosing with slick ice.

A single model within 12" of the Shaman must pass an Initiative test or be knocked down.`,
      },
      {
        id: "bears_might",
        name: "Bear's Might",
        roll: { min: 6, max: 6 },
        difficulty: 9,
        text: `The Shaman calls upon the spirits of the great Ice Bears of the North to aid him.

The Shaman gains +1 Attack, +2 Strength, +2 Toughness and loses -2 Initiative (to a minimum of 1). Take a Leadership test at the beginning of each turn (both yours and your opponent's). If the test fails, Bear's Might drains away. Bear's Might can only be cast successfully once per game.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Norse Runes (https://mordheimer.net/docs/magic/norse-runes)", file: "03-campaigns-magic-optional-rules.md:2689-2751" },
  },
  {
    id: "nurgle_rituals",
    name: "Nurgle Rituals",
    sourceUrl: "https://mordheimer.net/docs/magic/nurgle-rituals",
    intro: `The Carnival Master uses the rituals of Nurgle to pervert and corrupt nature, inflicting hideous diseases for which there are no known cures.

Nurgle Rituals are used by the Carnival of Chaos Carnival Master.`,
    usedBy: ["Carnival of Chaos Carnival Master"],
    die: "D6",
    spells: [
      {
        id: "daemonic_vigour",
        name: "Daemonic Vigour",
        roll: { min: 1, max: 1 },
        difficulty: 8,
        text: `The Master imbues his Daemonic minions with supernatural power.

Any Plague Bearers or Nurglings within 8" of the Master increase their Daemonic Aura save from 5+ to 4+ until the beginning of their next turn.`,
      },
      {
        id: "buboes",
        name: "Buboes",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `The Master bestows the gift of pus-filled buboes upon his enemies.

This spell has a range of 8" and affects a single enemy warrior. The warrior must pass a Toughness test or lose a Wound. No Armour saves are allowed.`,
      },
      {
        id: "stench_of_nurgle",
        name: "Stench of Nurgle",
        roll: { min: 3, max: 3 },
        difficulty: 8,
        text: `The Master spews forth a foul, stinking mist that chokes his foes.

This spell has a range of 6" and affects all living creatures – friend or foe. Each enemy warrior in range must pass a Toughness test or lose an Attack until their next turn.`,
      },
      {
        id: "pestilence",
        name: "Pestilence",
        roll: { min: 4, max: 4 },
        difficulty: 10,
        text: `The Master inflicts horrible diseases upon the unbelievers.

All enemy models within 12" of the Master suffer a Strength 3 hit. No Armour saves are allowed.`,
      },
      {
        id: "scabrous_hide",
        name: "Scabrous Hide",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `The Master's skin becomes tough and leathery like that of his patron god.

The Master has an armour save of 2+ which replaces any normal Armour save. The Scabrous Hide lasts until the beginning of his next Shooting phase.`,
      },
      {
        id: "nurgles_rot",
        name: "Nurgle's Rot",
        roll: { min: 6, max: 6 },
        difficulty: 9,
        text: `The Master bestows the blessing of the Plague God upon his foe.

All enemy models in base contact with the Master must immediately test against their Toughness or contract Nurgle's Rot.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Nurgle Rituals (https://mordheimer.net/docs/magic/nurgle-rituals)", file: "03-campaigns-magic-optional-rules.md:2752-2816" },
  },
  {
    id: "onogal_rituals",
    name: "Onogal Rituals",
    sourceUrl: "https://mordheimer.net/docs/magic/onogal-rituals",
    intro: `These modified Nurgle Rituals are used by Seers with the Mark of Onogal the Crow.

Onogal Rituals are used by the Marauders of Chaos seer with the Mark of Onogal the Crow.`,
    usedBy: ["Marauders of Chaos Seer (with the Mark of Onogal the Crow)"],
    die: "D6",
    spells: [
      {
        id: "touch_of_onogal",
        name: "Touch of Onogal",
        roll: { min: 1, max: 1 },
        difficulty: 10,
        text: `The Seer's body is covered with smallpox and blisters. His touch can transmit devastating diseases.

This spell can be used against one of the Seer's close combat opponents. If he takes the model out of action in the following hand-to-hand combat phase, that player rolls for Serious Injuries immediately. If the model dies permanently, replace it with a Nurgle Plague Bearer (see Bestiary for rules) for the rest of the game under the Seer's control. If the Seer is stunned or taken out of action the Plague Bearer disappears into the Realm of Chaos. Note that only one Plague Bearer can be created at a time.`,
      },
      {
        id: "buboes",
        name: "Buboes",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `The Master bestows the gift of pus-filled buboes upon his enemies.

This spell has a range of 8" and affects a single enemy warrior. The warrior must pass a Toughness test or lose a Wound. No Armour saves are allowed.`,
      },
      {
        id: "stench_of_nurgle",
        name: "Stench of Nurgle",
        roll: { min: 3, max: 3 },
        difficulty: 8,
        text: `The Master spews forth a foul, stinking mist that chokes his foes.

This spell has a range of 6" and affects all living creatures – friend or foe. Each enemy warrior in range must pass a Toughness test or lose an Attack until their next turn.`,
      },
      {
        id: "pestilence",
        name: "Pestilence",
        roll: { min: 4, max: 4 },
        difficulty: 10,
        text: `The Master inflicts horrible diseases upon the unbelievers.

All enemy models within 12" of the Master suffer a Strength 3 hit. No Armour saves are allowed.`,
      },
      {
        id: "scabrous_hide",
        name: "Scabrous Hide",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `The Master's skin becomes tough and leathery like that of his patron god.

The Master has an armour save of 2+ which replaces any normal Armour save. The Scabrous Hide lasts until the beginning of his next Shooting phase.`,
      },
      {
        id: "nurgles_rot",
        name: "Nurgle's Rot",
        roll: { min: 6, max: 6 },
        difficulty: 9,
        text: `The Master bestows the blessing of the Plague God upon his foe.

All enemy models in base contact with the Master must immediately test against their Toughness or contract Nurgle's Rot (see Nurgle's Rot).`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Onogal Rituals (https://mordheimer.net/docs/magic/onogal-rituals)", file: "03-campaigns-magic-optional-rules.md:2817-2881" },
  },
  {
    id: "prayers_of_sigmar",
    name: "Prayers of Sigmar",
    sourceUrl: "https://mordheimer.net/docs/magic/prayers-of-sigmar",
    intro: `Those with great faith in the gods can call upon their divine power. The priests of Sigmar can pray for many miracles: healing of wounds, strengthening the resolve of their comrades or the banishment of Daemonic creatures and the Undead.

Prayers of Sigmar are used by The Sisters of Sigmar Matriarch, and the Witch Hunters Warrior Priest.

The Prayers of Sigmar can be used by Witch Hunter Warrior Priests and Sigmarite Matriarchs. A warrior may use the divine power of Sigmar while wearing armour. Prayers of Sigmar are not regarded as spells, so any special protection against spells does not affect them.`,
    usedBy: ["Sisters of Sigmar Sigmarite Matriarch", "Witch Hunters Warrior-Priest"],
    die: "D6",
    spells: [
      {
        id: "the_hammer_of_sigmar",
        name: "The Hammer of Sigmar",
        roll: { min: 1, max: 1 },
        difficulty: 7,
        text: `This weapon of the faithful glows with a golden light, imbued as it is with the righteous power of Sigmar.

The wielder gains +2 Strength in hand-to-hand combat and all hits he inflicts cause double damage (eg, 2 wounds instead of 1). The Priest must test each shooting phase he wants to use the Hammer.`,
      },
      {
        id: "hearts_of_steel",
        name: "Hearts of Steel",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `As the three words of power are spoken, waves of glory surround the servant of Sigmar. The faithful are heartened by the warrior god's presence.

Any allied warriors within 8" of the warrior become immune to fear and all alone tests. In addition, the whole warband gains +1 to any Rout tests they have to make. The effects of this spell last until the caster is knocked down, stunned or put out of action. If cast again the effects are not cumulative, ie, the maximum bonus to Rout tests remains +1.`,
      },
      {
        id: "soulfire",
        name: "Soulfire",
        roll: { min: 3, max: 3 },
        difficulty: 9,
        text: `The wrath of Sigmar comes to earth. Purifying flames surround the Priest and wipe out those who resist the righteous fury of the God-Emperor!

All enemy models within 4" of the servant of Sigmar suffer a Strength 3 hit. No armour saves are allowed. The servants of darkness and Chaos are especially susceptible to Sigmar's holy power. Undead and Possessed models in range suffer a Strength 5 hit instead.`,
      },
      {
        id: "shield_of_faith",
        name: "Shield of Faith",
        roll: { min: 4, max: 4 },
        difficulty: 6,
        text: `A shield of pure white light appears in front of the Priest. As long as his faith remains strong the shield will protect him.

The Priest is immune to all spells. Roll at the beginning of each turn in the recovery phase. On a roll of 1 or 2 the shield disappears.`,
      },
      {
        id: "healing_hand",
        name: "Healing Hand",
        roll: { min: 5, max: 5 },
        difficulty: 5,
        text: `Laying hands upon a wounded comrade, the servant of Sigmar calls upon his Lord to heal the warrior's wounds.

Any one model within 2" of the Priest (including himself) may be healed. The warrior is restored to his full quota of Wounds. In addition, if any friendly models within 2" are stunned or knocked down, they immediately come to their senses, stand up, and continue fighting as normal.`,
      },
      {
        id: "armour_of_righteousness",
        name: "Armour of Righteousness",
        roll: { min: 6, max: 6 },
        difficulty: 9,
        text: `Impenetrable armour covers the Priest and the fiery image of a twin-tailed comet burns above his head.

The Priest has an armour save of 2+ which replaces his normal armour save. In addition, he causes fear in his enemies and is therefore immune to fear himself.

The power of the Armour of Righteousness lasts until the beginning of the Priest's next Shooting phase.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Prayers of Sigmar (https://mordheimer.net/docs/magic/prayers-of-sigmar)", file: "03-campaigns-magic-optional-rules.md:2882-2950" },
  },
  {
    id: "prayers_of_taal",
    name: "Prayers of Taal",
    sourceUrl: "https://mordheimer.net/docs/magic/prayers-of-taal",
    intro: `Taal is the God of Nature and demands the respect of all those who enter the wild regions of the Empire. He is portrayed as a tall, broad-shouldered man with long wild and thick beard. He wears a stag skull as a helm and is clothed in bison and bear skins. He is often called the Lord of Beasts. His followers include rangers, trappers and those who live in the wilds of the Empire.

Prayers of Taal are used by the Ostlander Mercenaries Priest of Taal, and the Horned Hunters Priest of Taal.

Prayers of Taal work like Prayers of Sigmar although the Taal Priest never wears armour.

**ARMOUR:** Though the above states the priest doesn't wear "armour", the unit entry for the Priest clarifies this only applies to Heavy Armour, so they can wear Light Armour, Helmets, and Shields as portrayed in their lore above.`,
    usedBy: ["Horned Hunters Priest of Taal", "Ostlanders Priest of Taal"],
    die: "D6",
    spells: [
      {
        id: "stags_leap",
        name: "Stag's Leap",
        roll: { min: 1, max: 1 },
        difficulty: 7,
        text: `Many of Taal's priests wear a stag skull as a symbol of their devotion and the Forest Lord's power can be used to emulate the speed and beauty of this magnificent beast.

The Priest of Taal may immediately move anywhere within 9" including into base contact with the enemy, in which case he counts as charging and gains a +1 Strength to his first round of attacks. If he engages a fleeing enemy, in the close combat phase he will score one automatic hit at +1 Strength and then his opponent will flee again (if he survives).`,
      },
      {
        id: "blessed_ale",
        name: "Blessed Ale",
        roll: { min: 2, max: 2 },
        difficulty: 5,
        text: `Like his brother Ulric, Taal has a great appetite for the strong ales of the Northern Empire. During the summer Equinox, each village in Ostland opens one keg of ale (at least!) in Taal's honour.

Drinking a flask of Taal-blessed ale (the priest is assumed to carry as many flasks as are needed) may heal any one model within 2" of the Priest (including himself). The warrior is restored to his full quota of Wounds. In addition, any living enemy models (not Undead or Possessed) within 2" of the Priest will lose 1 Attack during the next round of combat due to the potent fumes of the ale.`,
      },
      {
        id: "bears_paw",
        name: "Bear's Paw",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `Many an armoured knight has been knocked to the ground by the surprising Strength of the followers of Taal. Although traditionally called 'Bear's Paw' this spell is sometimes referred to as 'Moose's Breath' by those Ostlander's who have felt its power.

The Priest invokes the blessing of Taal on himself or a single friendly model within 6". The target receives a bonus of +2 to his Strength until the Priest's next turn.`,
      },
      {
        id: "earthshudder",
        name: "Earthshudder",
        roll: { min: 4, max: 4 },
        difficulty: 9,
        text: `Taal's domain includes both the earth and the skies and his power can reach out even into the dark streets of Mordheim. When his name is invoked three times and the blood of an eagle is poured on the ground, the Lord of the Wild will cause thunder to rumble and the earth to shake.

The spell is cast on a single building within 4". Any enemy models touching the building will suffer a single S3 hit. In addition the building will collapse and any models on it will count as having fallen to the ground (for example a model falling 5" to the tabletop must pass two Initiative tests to avoid taking D3 S5 hits.) Remove the terrain feature from the board for the rest of the game.`,
      },
      {
        id: "tanglefoot",
        name: "Tanglefoot",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `It is said that when Taal walked the earth, living things would spring up behind him as he passed. A portion of his power can be summoned by his followers to help regrow forests and aid in the return of the land to its natural state.

Plants, vines and even small trees burst forth from the earth, hindering all those who attempt to move through them. All models (friend as well as foe) with the exception of Ostlander Jaeger, and friendly Horned Hunter Zealots within 12" of the Priest can only move at 1/2 speed until the next shooting phase.`,
      },
      {
        id: "summon_squirrels",
        name: "Summon Squirrels",
        roll: { min: 6, max: 6 },
        difficulty: 7,
        text: `Taal is the master of all beasts both great and small. Those who anger him may be mauled by a mountain lion or drowned in a flood caused by an angry beaver.

With this spell the Priest invokes the wrath of the Lord of Beasts, summoning forth dozens upon dozens of enraged squirrels. The furious rodents assault one enemy within 12" of the Priest, crawling inside the warrior's clothing and armour, pelting him with nuts and causing numerous tiny bites and welts. The target suffers 2D6 Strength 1 hits. No armour saves allowed.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Prayers of Taal (https://mordheimer.net/docs/magic/prayers-of-taal)", file: "03-campaigns-magic-optional-rules.md:2951-3019" },
  },
  {
    id: "prayers_of_ulric",
    name: "Prayers of Ulric",
    sourceUrl: "https://mordheimer.net/docs/magic/prayers-of-ulric",
    intro: `In a similar way to Sigmarite Sisters and Warrior-Priests and their prayers to Sigmar, Wolf Priests call upon their god for assistance in times of battle.

Prayers of Ulric are used by the Wolf Priest of Ulric.

Wolf Priests may use a wolf cloak and still chant these prayers. They are prayers, not spells, and thus any special protection against spells does not affect them.`,
    usedBy: ["Wolf Priest of Ulric"],
    die: "D6",
    spells: [
      {
        id: "snow_squall",
        name: "Snow Squall",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `Ulric extends his protection to the Wolf Priest in the form of a localised snow squall that engulfs the model.

All enemy models in Hand-to-Hand combat with the priest are at -1 to hit due to the swirling snow and winds. The spell lasts for the duration of the Hand-to-Hand combat.`,
      },
      {
        id: "hammerschlag",
        name: "Hammerschlag",
        roll: { min: 2, max: 2 },
        difficulty: 10,
        text: `The Wolf Priest calls down a hammer blow from Ulric on any model within 6".

That model suffers a S4 attack from an enormous ethereal hammer, including the concussion special rule.`,
      },
      {
        id: "bloodlust",
        name: "Bloodlust",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The Wolf Priest is infused with a lust for battle and attacks wildly.

All attacks are at S + 2, and he scores a critical hit on a 5-6. The Wolf Priest must test, by rolling the prayer's difficulty or greater on 2d6, each turn to see if the prayer remains in effect.`,
      },
      {
        id: "wolfs_hunger",
        name: "Wolf's Hunger",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `One member of the warband (priest's choice) is thrown into a Frenzy.`,
      },
      {
        id: "ulrics_howl",
        name: "Ulric's Howl",
        roll: { min: 5, max: 5 },
        difficulty: 10,
        text: `The Wolf Priest's prayer is answered as an ear-shattering inhuman howl roars from his throat.

For the duration of the battle, all members of the priest's warband are immune to Fear and all alone tests as they feel the presence of their god. Additionally, all Rout tests are at +1.`,
      },
      {
        id: "call_of_ulric",
        name: "Call of Ulric",
        roll: { min: 6, max: 6 },
        difficulty: 10,
        text: `The Wolf Priest lets out a cry of agony as his body re-shapes itself into that of a huge, slavering wolf with the following profile:

| Profile | M | WS | BS | S | T | W | I | A | Ld |
|---|---|---|---|---|---|---|---|---|---|
| Wolf | 6 | 4 | 0 | 4 | 4 | 1 | 5 | 2 | 6 |

During the time that the priest is in the form of a wolf, he may do nothing but attack as a wolf: no spell-casting or weapons use. He still hates Sigmar's minions though.

In each shooting phase, the priest may choose to make a Leadership test (using the Wolf's Ld 6) to regain his human form. If he is still in wolf form at the end of the battle, he gets one last chance to return to human form. If he does not, then he remains a wolf forever! He is still a hero, and thus entitled to XP gains and attribute increases. He may only choose skills from the Speed Table, with the exception of Scale Sheer Surfaces.`,
      },
    ],
    notes: `**MAXIMUM CHARACTERISTICS**

| Profile | M | WS | BS | S | T | W | I | A | Ld |
|---|---|---|---|---|---|---|---|---|---|
| Wolf | 7 | 6 | 0 | 4 | 4 | 3 | 7 | 3 | 7 |`,
    source: { publication: "mordheimer.net — Magic: Prayers of Ulric (https://mordheimer.net/docs/magic/prayers-of-ulric)", file: "03-campaigns-magic-optional-rules.md:3020-3096" },
  },
  {
    id: "rituals_of_hashut",
    name: "Rituals of Hashut",
    sourceUrl: "https://mordheimer.net/docs/magic/rituals-of-hashut",
    intro: `This is dark sorcery of fire and ash used by wicked Sorcerers among the Chaos Dwarfs. They are Priests and magicians who have carefully mastered the teachings of a daemonic god known as the Father of Darkness.

Rituals of Hashut are used by the Black Dwarfs Sorcerer.`,
    usedBy: ["Black Dwarfs Sorcerer"],
    die: "D6",
    spells: [
      {
        id: "sacrificial_ritual",
        name: "Sacrificial Ritual",
        roll: { min: 0, max: 0 },
        difficulty: 10,
        text: `The Chaos Dwarf Sorcerer sacrifices the captives in a bloody ritual, thus carrying out his assignments as a High Priest of Hashut.

The Chaos Dwarf Sorcerer must be in contact with an Engine of Chaos in order to successfully cast this spell. As the ritual requires the sacrifice of a mortal, remove one captive model from the Engine of Chaos and its starting warband's roster. The Sorcerer may sacrifice additional captives to lower the spell's difficulty by –1 per sacrifice. These models must be sacrificed before rolling for Difficulty. The Chaos Dwarf Sorcerer gains +D3 Experience.`,
      },
      {
        id: "spirit_of_hashut",
        name: "Spirit of Hashut",
        roll: { min: 1, max: 1 },
        difficulty: 9,
        text: `The air around the Sorcerer thickens to form a billowing avatar of the great Bull-God. In defiance this unholy likeness to the Father of Darkness rolls forward, trampling all before it.

The player draws a line 18" from the Sorcerer. All models crossed by the line, suffer one S4 hit.`,
      },
      {
        id: "bellow_of_doom",
        name: "Bellow of Doom",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `Crackling with arcane energy, the Sorcerer's features contort into the horned visage of the mighty Hashut. Smoke and flame spills from his maw, as he lets loose a deafening sound that none may escape.

All models engaged in base contact with the sorcerer must make an immediate Ld test or break from combat and run.`,
      },
      {
        id: "fumes_of_azgorh",
        name: "Fumes of Azgorh",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `The Sorcerer's mouth glows. Clouds of black gas are slowly emitted until with an almighty belch, a wave of corrosive smoke erupts from his gaping jaws.

The spell has a range of 8'', hitting all models in its path on a D6 score of 4+. Any model hit suffers a S4 hit, roll to wound as normal. No armour saves allowed.`,
      },
      {
        id: "flickering_hide",
        name: "Flickering Hide",
        roll: { min: 4, max: 4 },
        difficulty: 10,
        text: `With eldritch power the target begins to burn from within. His skin spits and sparks wherever a blow is struck as if like molten iron.

The Sorcerer may cast this spell upon himself or any one model within 6". The flaming hide will negate any one wound suffered on a D6 roll of 4+. In hand-to-hand combat, any model which hits the flaming hide will suffer one S3 hit for each hit scored. The Flaming Hide lasts until the beginning of the Sorcerer's next shooting phase.`,
      },
      {
        id: "lava_flow",
        name: "Lava Flow",
        roll: { min: 5, max: 5 },
        difficulty: 7,
        text: `The Sorcerer melts into molten magma, burning itself into the earth. The Sorcerer then reappears after seeping unnaturally through the ground.

The Sorcerer may move 12" in any direction, even into combat, counting as a charge. However, due to the nature of this spell the Sorcerer may only reappear on or below the ground.`,
      },
      {
        id: "earthquake",
        name: "Earthquake",
        roll: { min: 6, max: 6 },
        difficulty: 9,
        text: `Arms raised, the Sorcerer brings his staff crashing to the ground. The earth ripples outwards from the blow, and splits asunder.

All models within 3" of the Sorcerer, friend or foe alike, must roll equal to or under their Initiative or suffer D3 S4 hits.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Rituals of Hashut (https://mordheimer.net/docs/magic/rituals-of-hashut)", file: "03-campaigns-magic-optional-rules.md:3097-3170" },
  },
  {
    id: "shadow_warrior_magic",
    name: "Shadow Warrior Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/shadow-warrior-magic",
    intro: `Shadow Weavers use a strange blend of magic that differs in many ways to the traditional High Magic of their cousins of the Tower of Hoeth.

Shadow Warrior Magic is used by the Shadow Warriors Shadow Weaver.

*Author's note: Several of the following spells mention that the target must be within a certain distance of 'a wall'. This is not literally restricted to walls, but may include any piece of terrain that could be expected to cast a man-sized shadow.*`,
    usedBy: ["Shadow Warriors Shadow Weaver"],
    die: "D6",
    spells: [
      {
        id: "pool_of_shadow",
        name: "Pool of Shadow",
        roll: { min: 1, max: 1 },
        difficulty: 7,
        text: `The area immediately surrounding the mage is suddenly filled with twisting shadows that make it nearly impossible to see anything inside.

This spell allows the mage and all allies within 6" to Hide, exactly as if there were a wall or other obstruction between them and their enemies. They may Hide even after marching. This Hiding is disrupted if any enemy enters the area of affect. In addition, all affected count as being in cover against enemy shooting. This spell lasts until the start of the Shadow Weaver's next turn.`,
      },
      {
        id: "the_living_shadows",
        name: "The Living Shadows",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `Shadows around the target suddenly writhe as if alive and move to strike the victim.

The Shadow Weaver may cast this spell at any enemy model within 12" of him and within 2" of a wall. The target suffers a single Strength 4 hit with no armour saves.`,
      },
      {
        id: "wings_of_night",
        name: "Wings of Night",
        roll: { min: 3, max: 3 },
        difficulty: 6,
        text: `Wings of darkness unfurl from the Shadow Weaver's back and engulf him. He disappears, only to reappear in nearby shadow.

This spell may only be cast if the Shadow Weaver is within 2" of a wall. He is instantly moved up to 12" to a place that is also within 2" of a wall. If moved into contact with an enemy model, the Shadow Weaver counts as charging in the first round.`,
      },
      {
        id: "cloak_of_darkness",
        name: "Cloak of Darkness",
        roll: { min: 4, max: 4 },
        difficulty: 7,
        text: `The Shadow Weaver appears to be swallowed by shadows that even the sharpest senses cannot pierce.

The Shadow Weaver is effectively concealed from enemy sight. As long as he does not attack (cast spells, shoot, or engage in close combat) any enemy models, he may not be attacked. He may intercept as normal if the player controlling him wishes, but he does not have to do so (and if he does not, enemy warriors may charge past him of course). The spell lasts until the Shadow Weaver attacks an enemy model. Note that a model engaged in close combat with an enemy warrior may never choose to not attack.`,
      },
      {
        id: "shadowbind",
        name: "Shadowbind",
        roll: { min: 5, max: 5 },
        difficulty: 9,
        text: `Tendrils of darkness rise from the shadows to engulf an enemy warrior, rendering him helpless to the whims of the Shadow Weaver.

The Shadow Weaver may cast this spell at any enemy model within 24" of him and 2" of a wall. The target may not move unless it first passes a Strength test on 1D6+1 at the start of his turn (before the Recovery Phase). This spell lasts until the Shadow Weaver suffers a Wound or attempts to cast another spell. If attacked while affected by this spell, treat the target exactly as if he were Stunned.`,
      },
      {
        id: "shield_of_shadow",
        name: "Shield of Shadow",
        roll: { min: 6, max: 6 },
        difficulty: 7,
        text: `Shadows congeal and become a solid barrier in front of the Shadow Weaver or one of his comrades, protecting the target from enemy attacks.

The Shadow Weaver may cast this spell on himself or a member of his warband within 12". The target receives an armour save of 5+ that is not modified by the attacker's Strength. The spell lasts until the start of the Shadow Weaver's next turn.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Shadow Warrior Magic (https://mordheimer.net/docs/magic/shadow-warrior-magic)", file: "03-campaigns-magic-optional-rules.md:3171-3237" },
  },
  {
    id: "shornaal_rituals",
    name: "Shornaal Rituals",
    sourceUrl: "https://mordheimer.net/docs/magic/shornaal-rituals",
    intro: `The Shornaal Rituals are used by the Seers who worship the Great Serpent. They use their power to show unlucky victims the horrible pleasures of their patron.

Shornaal Rituals are used by the Marauders of Chaos seer with the Mark of Shornaal the Serpent.`,
    usedBy: ["Marauders of Chaos Seer (with the Mark of Shornaal the Serpent)"],
    die: "D6",
    spells: [
      {
        id: "delicious_suffering",
        name: "Delicious Suffering",
        roll: { min: 1, max: 1 },
        difficulty: 8,
        text: `The Seer summons great suffering to overwhelm his enemies.

All models (friend and foe, except for the Seer) within 3" must pass a Ld test or are knocked down.`,
      },
      {
        id: "dance_of_the_serpent",
        name: "Dance of the Serpent",
        roll: { min: 2, max: 2 },
        difficulty: 8,
        text: `The Seer's sight is so incredibly fascinating that his opponents cannot help starring stupidly while he draws his sword.

All enemy models that are not immune to psychology suffer a –1 'to hit' against him in close combat.

The Dance lasts until the beginning of the Seer's next shooting phase.`,
      },
      {
        id: "endless_torment",
        name: "Endless Torment",
        roll: { min: 3, max: 3 },
        difficulty: 9,
        text: `The Seer falls into ecstasy torturing his helpless victim and watching it die slowly.

Choose one enemy model within 8". From now on the model must roll for injury –1 after it's Recovery phase. For the duration of the Torment the Seer can do nothing else but end the spell at the beginning of his turn and if attacked in close combat, he is hit automatically and the spell breaks.`,
      },
      {
        id: "mystify",
        name: "Mystify",
        roll: { min: 4, max: 4 },
        difficulty: 8,
        text: `"Pain, beautiful Pain!" – last words of Snaghel, Exalted Seer of the Tribe of the Snake

Target enemy model within 8" will have their Initiative value reduced to 1 and will always strike last in close combat, even if they charge an opponent or are armed with a spear or pike and are charged themselves. This spell lasts until the target passes a Ld test during the recovery phase.`,
      },
      {
        id: "a_thousand_voices",
        name: "A Thousand Voices",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `A thousand voices manifest within the head of the unlucky victim driving him insane by mocking at his secret desires and dreams.

Choose one enemy model within 12". For the duration of the spell the model reduces it's Ld by D3 +1 (to a minimum of 2) if it is not immune to psychology.

The model must pass a Ld test at the beginning of it's turn to end the spell. The spell breaks also when the Seer loses a wound. A thousand Voices can only enchant one model at a time.`,
      },
      {
        id: "shornaals_temptation",
        name: "Shornaal's Temptation",
        roll: { min: 6, max: 6 },
        difficulty: 7,
        text: `The Serpent has chosen to deliver a certain warrior from his miserable existence by promoting him to one of his Daemonic servants.

Choose one enemy model within 8" that is not immune to psychology. The model must pass a Ld test. If the model fails, then the Seer gains control over the model. The player may attempt to regain control at the beginning of his turn by passing a Ld test. Shornaal's Temptation can only enchant one model at a time. If the Seer is hit whether by a missile or in close combat he must pass a Ld test or the spell ends.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Shornaal Rituals (https://mordheimer.net/docs/magic/shornaal-rituals)", file: "03-campaigns-magic-optional-rules.md:3238-3306" },
  },
  {
    id: "spells_of_the_djedhi",
    name: "Spells of the Djed'hi",
    sourceUrl: "https://mordheimer.net/docs/magic/spells-of-the-djedhi",
    intro: `Spells of the Djed'hi are used by the Elf Mage.`,
    usedBy: ["Elf Mage"],
    die: "D6",
    spells: [
      {
        id: "divination_of_shirath",
        name: "Divination of Shirath",
        roll: { min: 1, max: 1 },
        difficulty: 6,
        text: `Looking into the mists of the future, the Mage divines his best move.

The Mage may re-roll all his failed dice rolls, though the second result stands. The effect lasts until the beginning of the Mage's next turn.`,
      },
      {
        id: "shimmering_shield",
        name: "Shimmering Shield",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `The Mage is surrounded by a pale glow.

This spell acts as a shield to protect the Mage. It gives him an additional unmodified 5+ save against all attacks. The effect lasts until the beginning of the Mage's next turn.`,
      },
      {
        id: "statue_of_light",
        name: "Statue of Light",
        roll: { min: 3, max: 3 },
        difficulty: 7,
        text: `A pillar of light transfixes the Mage as another stabs down from the heavens to pin his target.

The Mage chooses a single enemy model he can see. That model may not move as long as the Mage remains both static and alive. The Mage and the target may cast spells normally, but fight in close combat at -2 WS (minimum of 1).`,
      },
      {
        id: "fleeting_shadows",
        name: "Fleeting Shadows",
        roll: { min: 4, max: 4 },
        difficulty: 8,
        text: `The Mage slips between worlds, shimmering in and out of existence and becoming hard to pinpoint exactly.

The first time the Mage is hit in close combat or shooting, the spell protects him and the hit is ignored. Move the Mage 2" from his current position in a random direction (but not off a cliff, etc). This is where he really was all along. The spell remains in play until it saves the Mage from a hit, whereupon it is dispelled. It may not be cast again whilst it is in play.`,
      },
      {
        id: "hunters_fury",
        name: "Hunter's Fury",
        roll: { min: 5, max: 5 },
        difficulty: 9,
        text: `The Mage gestures at the target, and glowing arrows shoot from his fingertips to fly at the foe.

The spell summons D3+1 arrows which the Mage can use to shoot against one enemy model following the rules for normal shooting. The arrows have a range of 36". Use the Mage's own Ballistic Skill to determine whether he hits or not, but ignore movement, range and cover penalties. Each arrow causes one S3 hit.`,
      },
      {
        id: "silent_guardian",
        name: "Silent Guardian",
        roll: { min: 6, max: 6 },
        difficulty: 9,
        text: `Glowing swords appear by the Mage, leaping to his defence if he is attacked in close combat.

This spell acts as an invisible guardian that will defend the Mage. If the Mage is attacked in close combat then the guardian will fight first with WS5, S3. The guardian will make 1 attack per turn against each enemy that attacks the Mage. The guardian will not leave the Mage's side, and will only fight if the Mage himself is being attacked. The Guardian cannot be attacked in return and will only be dispelled if the Mage casts another spell or dies.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Spells of the Djed'hi (https://mordheimer.net/docs/magic/spells-of-the-djedhi)", file: "03-campaigns-magic-optional-rules.md:3307-3369" },
  },
  {
    id: "tchar_rituals",
    name: "Tchar Rituals",
    sourceUrl: "https://mordheimer.net/docs/magic/tchar-rituals",
    intro: `The Tchar Rituals are used by the Seers who worship the Great Eagle. For Tchar is the Lord over destiny and fate, respecting wisdom and subtlety his servants are amongst the mightiest of spell-casters and his magic is especially effective against the dumb and inexperienced.

Tchar Rituals are used by the Marauders of Chaos seer with the Mark of Tchar the Eagle.`,
    usedBy: ["Marauders of Chaos Seer (with the Mark of Tchar the Eagle)"],
    die: "D6",
    spells: [
      {
        id: "tchars_blessing",
        name: "Tchar's Blessing",
        roll: { min: 1, max: 1 },
        difficulty: null,
        text: `The Seer prays to his god to fill him with wisdom and thus triumph over his enemies.

This spell must be used before the game and may only be used once. The Seer may not cast spells in the following battle. After the game he gains D3 Experience points if he wasn't taken out of action.`,
      },
      {
        id: "dispel_magic",
        name: "Dispel Magic",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `The winds of magic are bound to the will of Tchar and no so-called wizard may use them against his favoured.

The Seer ends all effects of currently active spells.`,
      },
      {
        id: "foresight",
        name: "Foresight",
        roll: { min: 3, max: 3 },
        difficulty: 10,
        text: `The Changer of the Ways pulls the strings of destiny to protect his servants.

This spell must be used before the game and may only be used once. Choose a warband. One randomly determined Hero of that warband must miss the following game. Models that are capable of casting spells or prayers are immune to this effect.`,
      },
      {
        id: "wrath_of_the_great_eagle",
        name: "Wrath of the Great Eagle",
        roll: { min: 4, max: 4 },
        difficulty: 9,
        text: `The Seer calls Tchar to punish the ignorant and stupid for their delusion.

Choose one enemy model within 12". The model is hit with a Strength equal to the difference of the Seer's Experience points and the model's Experience (to a maximum of 10). Armour saves are taken as normal. If the victim has more Experience points than the Seer, the latter is hit instead.`,
      },
      {
        id: "tchars_reward",
        name: "Tchar's Reward",
        roll: { min: 5, max: 5 },
        difficulty: 8,
        text: `The Seer is rewarded for his great power.

The Seer gets +1 on any one stat per 10 Experience points he has. Each stat may be increased only once through this spell.

The power of Tchar's Reward lasts until the end of the Seer's next shooting phase and can be re-cast in that phase.`,
      },
      {
        id: "slave_to_chaos",
        name: "Slave to Chaos",
        roll: { min: 6, max: 6 },
        difficulty: 9,
        text: `From the Seer's trembling fingers a blazing pink and blue ray streams towards an enemy causing him to mutate terribly until a new recruit queues in the ranks of the Great Eagle's followers.

This spell has a range of 12" and causes one Strength 2 hit with no armour save. If the model is taken out of action roll for Serious Injuries immediately. If they die replace the killed warrior with a Horror of Tzeentch (see Bestiary for rules) until the end of the game. If the Seer is stunned or taken out of action the Horror disappears into the Realm of Chaos.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Tchar Rituals (https://mordheimer.net/docs/magic/tchar-rituals)", file: "03-campaigns-magic-optional-rules.md:3370-3436" },
  },
  {
    id: "waaaagh_magic",
    name: "Waaaagh! Magic",
    sourceUrl: "https://mordheimer.net/docs/magic/waaaagh",
    intro: `Waaagh! spells are used by Orc Shamans. They are rituals of a sort, howling prayers to the boisterous Orc gods Gork and Mork.

Waaaagh! Magic is used by the Orc Mob Shaman, and the Night Goblins Shaman.`,
    usedBy: ["Night Goblins Shaman", "Orc Mob Shaman"],
    die: "D6",
    spells: [
      {
        id: "ledz_go",
        name: "Led'z Go",
        roll: { min: 1, max: 1 },
        difficulty: 9,
        text: `The Shaman's howling invigorates the ladz to fight even harder for Gork and Mork.

Any Orc or Goblin within 4" of the Shaman will automatically strike first in hand-to-hand combat regardless of other circumstances. The spell only lasts until the caster is knocked down, stunned or taken out of action.`,
      },
      {
        id: "oi_gerroff",
        name: "Oi! Gerroff!",
        roll: { min: 2, max: 2 },
        difficulty: 7,
        text: `A huge, green ectoplasmic hand pushes an enemy away.

Range 8". Moves any enemy model within range D6" directly away from the Shaman. If the target collides with another model or a building, both suffer 1 S3 hit. Note: Very handy for dropping people from high buildings with. May not be cast on models in hand-to-hand combat.`,
      },
      {
        id: "zzap",
        name: "Zzap!",
        roll: { min: 3, max: 3 },
        difficulty: 9,
        text: `A crackling green bolt of WAAAGH! energy erupts from the Shaman's forehead to strike the skull of the closest foe. This energy easily overloads the brain of a weak-willed opponent.

Range 12". Causes D3 S4 hits on the closest enemy target, with no armour saves allowed.`,
      },
      {
        id: "fooled_ya",
        name: "Fooled Ya!",
        roll: { min: 4, max: 4 },
        difficulty: 6,
        text: `The Shaman disappears in a green mist, confusing his enemies.

No enemy may charge the Shaman during their next turn. If the Shaman is engaged in hand-to-hand combat he may immediately move 4" away.`,
      },
      {
        id: "clubba",
        name: "Clubba",
        roll: { min: 5, max: 5 },
        difficulty: 7,
        text: `A huge, green club appears in the hand of the Shaman.

The ectoplasmic club counts as a normal club with +2 Strength bonus and gives the Shaman +1 attack as well. This spell lasts until the Shaman suffers a wound.`,
      },
      {
        id: "fire_of_gork",
        name: "Fire of Gork",
        roll: { min: 6, max: 6 },
        difficulty: 8,
        text: `Twin bolts of green flame shoot from the Shaman's nose to strike the nearest enemy model.

Range 12". Each of the two bolts causes D3 S3 hits; the bolts can either be fired both at the closest enemy target or split between the two closest enemy targets.`,
      },
    ],
    source: { publication: "mordheimer.net — Magic: Waaaagh! Magic (https://mordheimer.net/docs/magic/waaaagh)", file: "03-campaigns-magic-optional-rules.md:3437-3501" },
  },
];

export function findLore(id: string): SpellLore | undefined {
  return SPELL_LORES.find((l) => l.id === id);
}

export function findSpell(loreId: string, spellId: string) {
  return findLore(loreId)?.spells.find((s) => s.id === spellId);
}
