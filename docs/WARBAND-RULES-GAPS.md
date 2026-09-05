# Warband special rules not yet built into Stirheim

Audit date: 2026-09-05. Compared `reference/rules/warbands/*.md` (mordheimer.net scrape plus the
Restless Dead variant PDF) against the app's data (`src/rules/data/warbandTemplates`) and every
resolver and screen that acts on a roster (`src/rules/resolve`, `src/features/postBattle`,
`src/features/trading`, `src/features/recruitment`, `src/features/advances`, `src/features/roster`).

## How the app models a warband today

Every warband's special rules are stored verbatim as text and shown on the warband page, the builder
and the recruitment screen. Only these parts are mechanically enforced or applied:

- Composition: min/max models, per-unit numeric limits ("0-2", "any", "1+"), one mandatory leader
  (the first hero type with a minimum of one), hero capacity, starting gold from the template.
- Hire cost, starting experience, stat line, skill tables per unit, free dagger where the list says so.
- Equipment lists per unit at creation; the trading post afterwards (rare rolls, half-price armour
  house rule, once-per-phase sale of wyrdstone, one rare search per active hero).
- Rating: 5 per warrior, 20 per unit whose rule name contains "large", plus experience; hired swords
  from their own rating text.
- Post-battle: hero D66 injuries, henchman/hired sword D6 (1-2 dead), experience (+1 survive, +1
  winning leader, +1 per enemy out of action, underdog), exploration dice (one per surviving hero,
  +1 win, cap six) and the Exploration chart, wyrdstone income by warband size, veteran pool.
- Racial maximums by a keyword table (unit name, then a per-warband default, then the race string).
- Fight calculator traits: Hard to Kill, Hard Head, Frenzy, Hatred, No Pain, Immune to Poison,
  Undead Construct, Large Target, Pit Fighter; plus a few warband skills (Master of Blades, Extra Tough,
  Resource Hunter, True Grit, Thick Skull exist as skill ids).

Nothing in the resolvers branches on a warband id. Every rule below is therefore text-only in the
app unless it happens to map onto one of the generic mechanisms above.

## A. Cross-cutting mechanisms that do not exist (affect many warbands)

1. **Exploration bonuses and penalties.** Shards found are the dice total plus location rewards
   only; there is no per-warband modifier and no shard override. Dice count can be overridden
   with a reason, but nothing suggests the right count. Affects: Dwarf Treasure Hunters and
   Dwarf Rangers (Incomparable Miners, +1 shard), Druchii (Fey Acuity, +1 shard), Halfling Thief
   (Cutpurse, +1 shard), Survivors of Strigos (Light Fingers, +1 shard per hero kill), Snotlings
   (Scavengers, +1 die even with no heroes), Tomb Guardians (Home Ground, +1 die), Horned Hunters
   (Pathfinder, +1 die), Hochland Poachers (reroll one die each), Dwarf Slayer Cult (Only in Victory
   removes slayer dice on a loss; Record of Valor +1 die per slayer hero out of action), Ogre
   Hunting Party (Lazy: the Ogre Hunter gives no die while a Gnoblar hero can), Sisters' Augur,
   Maneaters' Mountain Guide and the Cursed Cavalcade Chronicler (roll two dice, keep one),
   Resource Hunter / Seeker skills and the Clan Pestilens Warpstone Amulet (modify or reroll a die),
   Grave Robbers (Grave Goods, +1 gc per enemy out of action), Mazzalupo Squire (steal a shard on 5+).
2. **Income modifiers.** The sale screen always uses active heroes plus henchmen; the resolver's
   size override is not exposed. Affects: Hochland Bandits (Foragers, one band lower), Maneaters and
   Ogre Hunting Party ogres (Gluttony, each counts as two), Snotlings (half size, rounded up),
   Halflings' Cook (5+ one band lower), Night Goblin Snotling mobs and Snotlings (count as one model).
3. **Rating modifiers.** Snotlings halve their rating; Maneaters ogres and the Ogre Hunter are
   rated at 5 not 20 (see section C).
4. **Units that never gain experience.** Every surviving henchman group gets +1; the only escape is
   a manual minus line. Affects every animal, undead henchman, daemon and construct: Giant Rats, Rat
   Ogres, War Hounds, Warhounds, Dire Wolves, Zombies, Skeletons, Scarecrows, Plague Bearers,
   Nurglings, Plague Cart, Trolls, Cave Squigs, Great Squig, Gigantic Spider, Kroxigor, Trained
   Bear, Wolves, Cold One Hounds, Slavehounds, Sabretusks, Giant Bats, Piggies, Wolfhounds,
   Hounds, Black Sheep, Companion Filly, Swabbies, Gutterscum, Raging Peasants, Captured Thralls,
   Snotlings, Wild Beasts, Great Bear, Fighting Ape, Chaos Spawn, Abomination, Tomb Scorpions,
   Fanatics, Runts (partly), Flesh Construct (Ld test first). Also the reverse: Wights and the
   Minotaur do gain experience but the Minotaur may never be promoted.
5. **Half-rate advances.** Ogres (Ostlanders, Pit Fighters, Halflings, Maneaters, Ogre Hunting
   Party) need double experience per advance; thresholds are fixed.
6. **"The lad's got talent" restrictions.** Promotion accepts any two allowed tables and any group.
   Not built: Ungor (never), Orc Goblins (killed), Araby Slaves (executed), Informers, Blackguards,
   Bretonnian Low Caste and Order of the Mare Pilgrims, Lustrian Prospects (reroll), Hobgoblins,
   Wretches (second roll = serious injury), Snotling Mobs, Fanatics, Zombies and Flesh Constructs
   (Masters of Horror), Nuttaz (no Academic), Halfling Scouts (no Strength), Ogres (Combat and
   Strength only), Wights (Combat and Strength, gain Wight Blades, cannot search), Night Goblin
   promoted henchmen (no Strength), Runts (lose Teeny Hands), Sorcerous Untrained (gain Wizard) and
   Grunts (may become Untrained), Chapel Guard Squires (may become Knights Errant), Slayer Stubbles
   and Axe Hurlers (must learn Death Wish instead of the advance roll), Axe Hurlers (may take
   Shooting), Snotlings (auto Mob Rule and Rigors of Leadership), Lustrian Reavers (promotion into a
   dead hero's role with his kit).
7. **Racial maximum profiles.** Own tables that the app maps onto a different row: Snotling heroes
   (BigSnotz, Scouts, Shaman) get Goblin maxima; Ogre Hunting Party Gnoblars (Trappers,
   Sabre-Baiter) get Ogre maxima; Ogre Hunting Party ogres should use their own Ogre row (BS4, I4);
   Druchii use Elf (T4, source T3); Necrarch Vampire uses Vampire (source WS4 BS4 S6 A3);
   Masters of Horror Wolfman uses the Norse Werecreature row (source M6 WS4 BS3 S5 T4 W3 I7 A4 Ld8);
   Restless Dead Wights promoted to heroes fall back to Human (source: Grave Guard). Marauders'
   Chosen of Chaos should switch a hero to the Warriors of Chaos row when taken.
8. **Skill restrictions and prerequisites.** Warband skills carry "Captain only", "Troll Slayers
   only", "requires Black Hunger" etc. as text; learnSkill only checks that the table is available.
   Also Mutant (Marauders) may be taken repeatedly but the app blocks a duplicate skill id.
9. **Hired sword restrictions written on the warband.** Eligibility is read only from the hired
   sword's own "may be hired" text, never from the warband's rules. Not built: Beastmen, Carnival of
   Chaos, Battle Monks, Amazons, Cursed Cavalcade, Snotlings (none or almost none); Ostlanders (Ogres
   only); Orc Mob, Black Dwarfs, Sons of Hashut, Druchii, Marauders of Chaos, Night Goblins, Ogre
   Hunting Party, Lustrian Reavers, Maneaters (fixed lists); Dwarfs of every kind (no Elves);
   Imperial Outriders (mounted only); Shadow Warriors and Wood Elves (nothing chaotic, no
   assassins); Sorcerous Society (no wizards but the High Elf Mage); Grave Robbers, Outlaws,
   Miragleans, Remasens, Pirates, Pit Fighters (named exclusions); Masters of Horror, Survivors of
   Strigos, Necrarchs (as Undead); Protectorate, Dreamwalkers (as Witch Hunters).
10. **Equipment restrictions beyond the list.** The trading post sells any catalogue item to any
    warband: "Dwarfs only" and similar labels are shown, not enforced, and unit bans (no armour, no
    missile weapons, no black powder, no poison, one missile weapon only, must carry a bow, dagger and
    scythe only) are text. Same for one-per-warband items (Swivel Gun, Clan Pestilens Banner, Liber
    Bubonicus once per campaign, Standard of Nagarythe creation only).
11. **Prose roster limits.** Anything not "0-N" parses as unlimited with a note: Goblins two per Orc,
    Cave Squigs no more than Goblins, Shootaz no more than Boyz, Saurus no more than Skinks, Squires
    no more than Knights, Swabbies no more than Crew, Trained Bear / Cold One Hounds / Slavehounds /
    Wolves / Sabretusks only with their handler, Cleric instead of a Champion or Petty Thief,
    Huntsman instead of a Templar, Great Squig or Troll not both, Captured Thralls outside the maximum.
    Hero capacity also over-counts where a slot is shared (Outlaws 6 instead of 5, Protectorate 6
    instead of 5).
12. **Leader succession.** No flow for a dead leader beyond re-templating by hand. Warband-specific
    rules: Black Orcs (a Black Orc must take over and gains Oi Behave), Necrarchs (Thrall, free spell;
    Acolyte to Thrall; disband if both die), Protectorate (most experienced Acolyte becomes Warrior
    Priest), Clan Moulder (Apprentice or disband), Ogre Hunting Party (Gnoblar with highest Ld),
    Pirates (a Mate), Merchant Caravans (new leader gains Merchant rule), Mazzalupo (Commands pass on),
    Dreamwalkers (Priest leads until a genuine Dreamer), Survivors of Strigos (may not replace the
    Strigoi), Battle Monks (must rehire the Emissary before any other purchase), Lizardmen (a game
    without a leader before a new Skink Priest), Order of the Mare (Dame must be replaced first), Court
    of the Profane Pleasures (any hero may lead). Units that may never lead: Flagellants, Ruffians,
    Wulfen, Pilgrims, Companions (Sorcerous Society), Rememberer, Shinobi, Nuttaz, Merchant hirelings,
    Mountain Guide.
13. **Upkeep for henchmen.** Only hired swords have upkeep. Not built: Trolls (15 or 20 gc, or
    sacrifice two Goblins/Squigs, Black Orc option to count as two models), Night Goblin Fanatics
    (Madcap Mushrooms every game or sit out), Pirates (+20 gc with both Dwarfs and Elves hired).
14. **Post-battle injury exceptions.** Heroes always roll D66 and henchmen 1-2 dead. Not built:
    Trolls never roll; Hobgoblins leave on 1-3; Snotling henchmen die on 1-3 and heroes roll twice;
    Runts die on 1-4; Trained Squig dies only on 1; Plague Bearers and Nurglings banished on 1-3
    instead of rolling; Abomination ignores 1-2; Flesh Construct repair for D6x5 gc; Scarecrow
    rerolls; Wheelo's own table; Liche Eternal (-1 Wound instead of a result, -D3 on Killed);
    Conqueror's first Dead becomes Multiple Injuries; Will to Survive Ld test against Dead; Damnable
    Luck (reroll one Death); Extra Tough, Blessed by the Kami, Elixir of Life, Surgeon, Sawbones,
    Surgeon's Journal, Silver Death Mask (rerolls); Bear Tamer and Squig Herder ignoring Sold, Robbed
    and Captured; Rotten Body (no roll when lost to a censer); Mark of Onogal reroll.
15. **Capture flows.** Captured is a status only. Not built: Pirates' Kidnapped and Stragglers/
    Prisoners recruitment, Cursed Cavalcade Capture! and Throne of Worms, Black Dwarfs' Man-catcher and
    Engine of Chaos (Hashut's Reward), Clan Moulder Subjugator, Court of Pleasures Man-Catcher and
    Cruel Fate, Amazons sacrificing as Possessed, Ogres devouring captives, Sons of Hashut Slavers,
    Pit Fighters' In the Pit.
16. **Starting spells, prayers and granted skills.** New wizards start with no spell recorded, and
    skills a unit starts with are not added: Carnival Brutes (Strongman), Cursed Cavalcade Companions
    (Expert Swordsman), Ogre Hunting Party Trappers (one chosen special skill), Clan Moulder Packmaster
    (Ride Wolf Rat plus a handling skill), Chapel Guard Questing Knight and Merchant Knights Vanguard
    (Ride), Mazzalupo Master of Finances (Haggle), Gunnery School Marksmen (Hunter, henchmen).
17. **Recruit-time purchases and upgrades.** Mutations (Possessed, Court, Clan Moulder, Marauders'
    Mutant skill, Beastmen Mutant), Blessings of Nurgle, Sacred Markings, Cursed Masks, Trophies,
    Black Orc Blood (10 gc), Twisted Scholar Wizard or Chronicler (10 gc), Jungle Shadow wizard
    (30 gc), Fighting Ape cymbals, Lord's Boon (half-price warhorse or armour), Kislev Inheritance
    (half-price item, 150% replacement), Order of the Mare horses at half price, Imperial Outriders
    warhorse upgrade (+40 gc), Wolfcloak and Bearcloak Strength test, Snotling Mob replacements at
    10 gc each. None have a purchase flow; the "double cost for the second mutation" rule and "only at
    recruitment" rule are unenforced.
18. **Between-battle actions instead of a rare search.** Banditry, Slick Operator, Master of Poisons /
    Poisoner / Fungus Farmer, Tea Ceremony, Merchant Trade / Connected / Wholesale / Dubious Income,
    Corruption of the Mind and Flesh, Feed Upon Magic, Bone Goliath construction, Eye of the Gods
    (2D6 after every battle), Nurgle's Rot Toughness test before each battle, Alchemist addiction,
    Fanatic Looney damage test, Grave Guards / Ogre Hunter not searching, Gofer (3D6 keep two),
    Rare-roll modifiers (Marienburg +1, Bedouin +1, Norse Reavers +1, Gunnery School +2 black powder,
    Chaos Engineer +3, Trade Wagon Reputation, Ogres -1, Kurgan -1).

## B. Per-warband list

Only campaign-phase rules are listed (things a tracker would apply). Tabletop-only rules (fear,
hatred, animosity, movement, spells in play) are text in the app by design; the fight calculator
covers the few marked in the summary above. "Shared" refers to section A.

### Core
- **Cult of the Possessed**: mutation purchase at recruitment, doubling, Mutants must have one (A17).
- **Mercenaries (Reikland)**: Marksmen +1 BS is not applied to the stat line (section C).
- **Mercenaries (Middenheim)**: Wolfcloak Strength test and free availability at creation; Cathayan
  Silk Clothes ruin roll after the leader goes out of action. Strength 4 is applied.
- **Mercenaries (Marienburg)**: 600 gc starting gold not applied (template 500); +1 rare rolls.
- **Mercenaries (Ostermark)**: Captain's free starting wardog; choice of another city's skill table.
- **Sisters of Sigmar**: Augur Blessed Sight (two exploration dice, keep one).
- **Skaven of Clan Eshin**: Giant Rats and Rat Ogre never gain experience (A4).
- **The Undead**: Dire Wolves and Zombies no experience; Book of the Dead spell gain.
- **Witch Hunters**: War Hounds no experience; Flagellants never lead and never take missile weapons.

### Grade 1a
- **Averlanders**: promoted Halfling Scouts may not take Strength; Bergjaeger-only lines on the shared
  scout list are open to Halfling Scouts.
- **Beastmen Raiders**: no hired swords (A9); Ungor never promoted; Minotaur never a hero; Warhounds
  no experience.
- **Carnival of Chaos**: no hired swords; Blessings of Nurgle purchase; Plague Bearers and Nurglings
  no experience and Daemonic Instability instead of an injury roll; Plague Cart +2 maximum size;
  Nurgle's Rot pre-battle Toughness test with permanent -1 T and death; Brutes' free Strongman.
- **Dwarf Treasure Hunters**: Incomparable Miners +1 shard (the example rule: not built); no Elven
  hired swords; Troll Slayers barred from armour and missiles though they share the list; Slayer
  skill restrictions; Hard to Kill and Hard Head are applied in the fight calculator.
- **Kislevites**: Trained Bear only with a Bear Tamer; Bear no experience; Captain's Inheritance;
  Fiercely Loyal injury exemptions.
- **Orc Mob**: hired sword list; Goblins two per Orc and Squigs no more than Goblins; Goblins killed
  on promotion; Cave Squigs no experience; Troll never rolls injuries, no experience, Always Hungry
  upkeep.
- **Ostlanders**: Ogres only as hired swords; Ruffians never lead and never take missiles; Ogre
  half-rate advances and Combat/Strength only; Animal Friendship wardogs outside the maximum; Priest
  of Taal no heavy armour.

### Grade 1b
- **Amazons (Lustria)**: Amazon hired swords only; Sacrifice captives as Possessed plus free Skins and
  Charms; Elixir of Life injury reroll.
- **Amazons (Mordheim)**: Amazon hired swords only; Sacrifice.
- **Arabian Tomb Raiders**: Bedouin +1 rare roll (once); Slaves executed on promotion.
- **Black Orcs**: Da Boss is Dead succession; Shootaz no more than Boyz; Black Orc Blood upgrade and
  Proven Warrior at 25 xp; Nuttaz no Academic; Troll upkeep 20 gc or count as two models, no injury
  roll unless flaming, no experience.
- **Bretonnian Knights**: Squires no more than Knights; horse eligibility chain; Blessing of the
  Lady pre-battle Leadership test (could be a pre-battle prompt).
- **Dark Elves**: Cold One Hounds need a Beastmaster and leave when he dies; hounds no experience;
  Master of Poisons instead of searching; Powerful Build limit of two; no black powder.
- **Dwarf Rangers**: as Treasure Hunters; Runesmith's random starting rune, learn a rune instead of a
  skill, pre-battle 2D6 inscription (item destroyed on a 2); Apprentice doubles inscriptions.
- **Forest Goblins**: Brave may drop Animosity instead of a skill; Gigantic Spider no experience.
- **Gunnery School of Nuln**: cheaper black powder always and +2 rare rolls for it; never
  non-black-powder ranged weapons; Marksmen have Hunter.
- **Hochland Bandits**: Foragers income band; Know Who To Sell To (half of the random cost element
  when selling); henchmen cannot buy black powder; Banditry; Slick Operator; Looters take a dead
  warrior's kit on 4+; Poachers reroll an exploration die each; Gutterscum no experience.
- **Horned Hunters**: Pathfinder +1 die (one per warband); Warhounds no experience; armour bans.
- **Imperial Outriders**: mounted hired swords only; mount included in hire cost, warhorse upgrade;
  dead horses must be replaced before other spending; unmounted models cannot fight; rider death
  passes the mount on at -40 gc.
- **Lizardmen**: Saurus no more than Skinks; light armour always 50 gc; a game without a leader before
  a replacement Skink Priest; Kroxigor no experience; Saurus no Academic or missiles; Sacred Markings
  only at recruitment; Skink poison prices.
- **Mootlanders**: Moot Elder pistol option; nothing else campaign-side.
- **Norse Explorers**: Wolves need a Wulfen and are unusable without one; Wolves no experience; Wulfen
  never leads.
- **Outlaws of Stirwood Forest**: one missile weapon and a bow each; Cleric shares a slot; named hired
  sword exclusions; Hunting Arrows free of rarity at creation only.
- **Pirates**: Swabbies no more than Crew and only via Kidnapped/Stragglers/Prisoners; Swabbies no
  experience; +20 gc upkeep with Dwarfs and Elves; Mate succession; Swivel Gun gunner must be alone;
  Treasure Map replaces exploration; Hardtack tainted roll (miss a game).
- **Pit Fighters**: fighting-style kits with mixed henchman groups; Elf Ranger excluded; In the Pit
  captive fights (+2 xp, +50 gc, kit); never sell captives; Ogre half-rate and skill limits; Troll
  Slayer leaves if an Elf is hired.
- **Shadow Warriors**: no poison; hired sword filter; Powerful Build limit; Master of Runes Weavers
  only; Standard of Nagarythe creation only.
- **Skaven of Clan Pestilens**: Giant Rats and Rat Ogre no experience; Rotten Body no injury roll;
  Liber Bubonicus once per campaign; Warpstone Amulet exploration reroll; Rat Familiar counts toward
  the maximum and gains experience; skill prerequisites.
- **Tileans (Miragleans)**: no Skaven hired swords.
- **Tileans (Remasens)**: no Dark Elf hired swords. Leadership bonus is applied.
- **Tileans (Trantios)**: extra 100 gc one-off or +20% in a campaign not applied.
- **Tomb Guardians**: Home Ground +1 die; Skeletons and Scorpions no experience; Skeleton Chariot
  purchase and Drive Chariot; Liche Priest no armour.

### Grade 1c
- **Battle Monks of Cathay**: no hired swords; monks never wear armour or use poison; Emissary Decree
  (rehire before anything else, new one leads); Warmonger free Raging Peasants per game above the
  maximum; Raging Peasants no experience; Emissary limited to Warmonger.
- **Black Dwarfs**: Informers are excluded from Hard to Kill and Hard Head but the race traits apply to
  every member in the fight calculator; Informers never heroes; hired sword list; Chaos Engineer +3;
  Chaos Armour rarity per kill, cost minus experience, fused to the wearer; Man-catcher captures and
  Engine of Chaos prisoners with Hashut's Reward.
- **Bretonnian Chapel Guard**: Lord's Boon; Chivalry bans; Knight Errant no helmet; Squire
  Knighthood promotion; Low Caste never heroes; Holy Relic splits a Pilgrim into his own group.
- **Court of the Profane Pleasures**: any hero may lead (the app enforces no leader here, which is
  fine); Corruption ritual (1 wyrdstone, a hero forgoes searching, swap a stat); mutations at
  recruitment; Wretches never heroes and second promotion result is an injury; Cruel Fate captives
  become Wretches; Man-Catcher captures henchmen; Chaos Hounds no experience; Devout's two forms.
- **The Cursed Cavalcade**: treated as Evil for exploration; hired swords barred except the Crow
  Master; Capture! and Throne of Worms; Captured Thralls outside the maximum (13 becomes 18), cannot
  be dismissed, no experience; Cursed Masks free at creation and one of each; Twisted Scholar
  upgrades; animals no experience.
- **Lustrian Reavers**: one of each hero ever; Promotions into a fallen hero's role with his kit;
  hired sword list; War Beasts bought at creation and needing the Beastmaster; Trapmaster's traps at
  5 gc per game; Jungle Shadow wizard for +30 gc; Trophies; Conqueror's Survivor; fixed starting kit
  is not pre-filled; Prospects reroll promotion.
- **Maneaters**: ogres not rated as large (section C); Gluttony (count as two for income, devour
  captives for experience); half-rate advances; -1 rare rolls; Halfling or Ogre Bodyguard hired
  swords only, Dog of War unlocks more; Mountain Guide Ranger dice; Sabretusks need the Guide and gain
  no experience; Claimed Gnoblars with a 1-2 death roll when the owner is out of action.
- **Marauders of Chaos**: Eye of the Gods (Spawn or Mark) after each battle; tribe choice (Norse +1
  rarity and 13+ threshold, Kurgan unlimited Warhounds, bows, -1 rarity, Hung maximum 12 and 40 gc
  warhorses with Ride); Marks of Chaos; hired sword list; Chaos Armour rules; Condemned variable stats
  and Spawn at 90 xp; Mutant may be taken more than once; Chosen of Chaos maximum profile; Spawn and
  Warhounds no experience.
- **Merchant Caravans**: mandatory Trade Wagon is not a unit or item (stash in the wagon, lost if
  destroyed, Reputation +1 rarity per five rare items, abandoned on a rout); Trade, Open for
  Business, Rarity 2 or lower counts as common, Wholesale (D3+1 searches), Connected, Dubious
  Income; hirelings never lead; Blackguards never heroes; Merchant succession. 600 gc is applied.
- **Night Goblins**: Fanatics need Madcap Mushrooms each game, no experience, Looney post-battle
  damage test; Cave Squigs no more than Goblins and no experience; Troll upkeep and injuries; Snotling
  Mob bought as five, replaced at 10 gc, counts as one model everywhere.
- **Night Goblins (web)**: hired sword list; Fungus Farmer; Fanatics reroll promotion; Snotlings
  count as one model for size and income and give half experience; Great Squig or Troll, not both;
  Trained Squig (gains experience, dies only on a 1, protects the Herder); Da Biggest Boss Strength
  skills only for the current leader.
- **The Restless Dead**: Feed Upon Magic; Eternal; Gofer; Grave Guards may not search for rare items
  (the search screen offers every active hero); Summoner +1 maximum; Wights promoted (Combat and
  Strength, Wight Blades, no searches); one Scarecrow per controller; Scarecrow construct rerolls;
  Zombies, Skeletons and Scarecrows no experience.
- **The Sons of Hashut**: Slavers (+1 wyrdstone per working slave, sacrifice for experience);
  Uncommon (1.5x veteran experience cost); Indentured Servants (at least four Hobgoblins: flagged by
  the validator, but hiring is not blocked); hired sword list; Hobgoblins leave on 1-3 and never
  become heroes; Hobgoblins wrongly receive Hard to Kill and Hard Head in the fight calculator via
  the race traits.

### Grade 2a
- **Dreamwalkers, Cult of Morr**: Choosen of Morr ritual at creation and no second Dreamer; hired
  sword filter; skill restrictions as Witch Hunters; Priest of Morr dagger and scythe only, no armour;
  Guiding Dream pre-battle roll.
- **Druchii**: Fey Acuity +1 shard; own maximum profile (T3); hired sword list; Poisoner; Will to
  Survive; Slavehounds need the Beastmaster and gain no experience; Witch Elves' 5 gc Black Lotus.
- **Dwarf Slayer Cult**: Damnable Luck; Only in Victory; Record of Valor and Back-up Records; Song of
  Honor (+1 xp to all when a slayer dies); Rites of Trollslaying and Dragonslaying; no armour, no
  non-thrown missiles, no magic; Skittish promotion rule; Axe Hurlers' Shooting access; Rememberer's
  Pick up the Slack extra searches and never leads; no Elven hired swords.
- **Grave Robbers**: Grave Goods gold; hired sword exclusions; Sawbones; Body Dealer; Surgeon's
  Journal.
- **Halflings**: Cook's income band; Thief's Cutpurse shard; Too Big weapon bans; Piggies no
  experience; Village Ogre half-rate, skill limits, Ogre Bodyguard refuses to join.
- **Masters of Horror**: hired swords as Undead; Zombies and Constructs never promoted; Wolfman
  maximum profile; Surgeon; Alchemist and addiction; Apt Revitalist; Flesh Construct experience test
  and repair; Zombies no experience.
- **Mazzalupo**: Bearcloak test; Commands learned like spells and inherited by a new leader; Master of
  Finances' Haggle; Squire's Petty Thief shard; Black Sheep no experience.
- **Necrarchs**: Death of the Leader; own maximum profile; Abomination Powered (opponent gains a
  shard, one needed to reanimate) and Spare Parts; Skeletons and Zombies no experience.
- **Nipponese Expedition**: Tea Ceremony; Blessed by the Kami; Vim-To Mage vow of poverty; Shinobi
  never leads.
- **Ogre Hunting Party**: Ogre Hunter not rated as large (section C); Gnoblar heroes capped by Ogre
  maxima (section C); half-rate advances; Lazy; Ideas Above Their Station succession; hired sword
  list and Ogre Bodyguard/Slaver exception; Trappers' starting skill; Netter's three free nets; Sharp
  Stuff first free; Sabretusk Cubs no experience.
- **Order of the Mare**: Dame must be replaced before any other recruit (flagged, not blocked);
  half-price horses for Paragon and Gallant; Pilgrims never heroes; Dame's fixed Ancient Armour;
  Filly no experience.
- **Outlaws of Stirwood Forest Redux**: one missile weapon and a bow each; Cleric shares a slot.
- **Protectorate of Sigmar**: Death of a Leader; hired swords as Witch Hunters; Huntsman replaces a
  Templar; Hounds no experience.
- **Skaven of Clan Moulder**: mutations (Twistkin half price, Rat Ogres must buy one at hire); Giant
  Rats, Wolf Rats and Rat Ogres no experience; Rat Ogres never grouped; Heir to Power succession and
  disbanding; Packmaster's starting skills; Subjugator captures.
- **Snotlings**: rating halved; income at half size; Scavengers extra die even with no heroes (the app
  skips exploration entirely then); Not-So-Tough Gits injuries; Runts die on 1-4 and give experience
  only on 5+; Rigors of Leadership (+2 survive xp for heroes); automatic promotion skills; Too Unruly
  hired swords; own maximum profile; Wheelo (Hero advance table, own injury table, no promotion, stats
  once); Mobs never promoted; Small Hands bans.
- **Sorcerous Society**: wizard hired swords barred except the High Elf Mage; Magical Failure results
  that remove or change a hero after the battle (Spawn on a 2, stupidity on a 3); Mages may not out-
  spell the Magus (Wizard's Duel, loser leaves); Untrained become wizards on promotion; Grunts may
  become Untrained; Companions never lead; Magus starts with two spells.
- **Survivors of Strigos**: may not replace a dead Strigoi (the app lets you hire another); hired
  swords as Undead; Light Fingers; Seeker; Giant Bats no experience.
- **Vampire Hunters of Sylvania**: Priest of Morr weapon and armour limits; Pilgrims never lead and
  use bludgeoning weapons only; Wolfhounds no experience; hired swords as mercenaries is fine.
- **Wood Elves of Athel Loren**: Tolerant hired sword filter; Seeker (one hero only); Ithilmar
  bought without a roll at creation only.
- **The Restless Dead (Variant)**: Eternal; Feed Upon Magic (D3 shards for +1 Wound, not after
  searching or going out of action); Gofer; Grave Guards cannot search; Summoner; Bone Goliath
  Construction (Liche loses D3 Wounds, no rare search that turn, needs a Liche, exempt at creation);
  Wights promoted use Grave Guard maxima with no Academic, Speed or Special and no searching; Liche
  may swap a +1 Wound advance for a skill. Traits and both racial maximum rows are in the data.

## C. Data and derivation errors found on the way

- **Reikland Marksmen** stat line is BS3; the warband rule gives +1 BS on recruitment. The template
  note says "apply at roster build time" but nothing does.
- **Marienburg** starting gold is 500 in the template; the rule says 600 in a campaign. Trantios'
  +20% likewise.
- **Large creatures**: `unitIsLarge` keys on a rule *named* "Large". Maneaters' Captain, Mountain
  Guide and Bulls (large by the warband-level rule) and the Ogre Hunter (rule named "Huuuuge") are
  rated at 5 instead of 20. Youngbloods and Half-growns are correctly not large.
- **Racial maxima**: Ogre Hunting Party defaults every hero to Ogre, so Gnoblar Trappers and the
  Sabre-Baiter get Ogre caps; Snotling heroes get Goblin caps; Druchii, Necrarch and Wolfman rows are
  missing from `RACIAL_MAXIMUMS`; Restless Dead Wights promoted resolve to Human.
- **Race traits apply to every member**: Black Dwarfs' Informers and Sons of Hashut's Hobgoblins get
  Hard to Kill and Hard Head in the fight calculator.
- **Merchant Caravans** has no Trade Wagon unit even though a starting warband must include one.
- **Hero capacity** over-counts shared slots (Outlaws, Protectorate) because it sums the upper bounds.
- **Middenheim S4, Remasen Ld+1** are applied correctly; **Merchant 600 gc** is applied correctly.

## D. What is fine as text

Rules that only matter on the tabletop (fear, hatred targets, animosity, stupidity, movement,
infiltration, spell effects, rout-test rerolls, mounted combat) are shown on the roster and are
not the tracker's job. The fight calculator models the injury-chart and to-hit effects listed at the
top, and nothing else.
