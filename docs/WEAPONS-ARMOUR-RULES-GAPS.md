# Weapons, armour and equipment rules not yet modelled in Stirheim

Audit date: 2026-09-05, against the Phase 15 build (commit 3598838). Compared
`reference/rules/02-weapons-armour-equipment.md` (251 entries) with the item catalogue
(`src/rules/data/items`), the fight calculator's weapon and armour model (`src/rules/data/weapons`,
`src/rules/engine`, `src/features/match/fight`), the shop and builder (`src/rules/resolve/trading`,
`builder`, `equipmentCost`, `src/features/trading`), the roster validator and the new campaign rules
data (`src/rules/data/campaignRules`). Companion to `WARBAND-RULES-GAPS.md`.

## How kit is modelled today

**Catalogue.** Every entry in the rules text is in the catalogue with its price, rarity, restriction
text and rule text verbatim, plus generated Gromril and Ithilmar variants of each ordinary hand
weapon. Warband pages' own special equipment is not in the catalogue (see section C).

**Shop and builder.** Rare items need a 2D6 roll against their rarity (plus a per-warband bonus:
Marienburg +1, Maneaters -1), one search per hero per sequence, none for heroes out of action.
Dice-priced items are rolled; the half-price armour house rule applies; anything sells for half its
basic price. The builder prices from the unit's list: first dagger free, braces at the brace price,
"3 x price" lines ask for a figure. A Mordheim Map's grade is rolled at purchase and kept on the item.

**Roster validator.** A new ban list flags kit a unit or warband may not carry (armour, helmets,
missile weapons, thrown-only, black powder, poison, black-powder-only ranged, no equipment) for the
units named in the campaign rules data. Flags only: the shop still sells anything to anyone.

**Fight calculator.** Per attack it applies: the weapon's Strength bonus (Heavy weapons first turn
only, Lance on the charge), armour save modifiers (Cutting Edge, pistols, Gromril, the dagger's +1 to
the enemy save and 6+ save from nothing), no-save weapons, Parry (strict beat, the reroll pairings,
Master of Blades), cannot-be-parried, paired weapons' extra attack, attack caps (Fist, Tilean Pike),
Whipcrack on the charge, poison auto-wound on a 6 (and Immune to Poison), no criticals (Blowpipe),
Concussion (and Hard Head), Move-or-Fire (and Nimble), the multi-shot penalty, to-hit bonuses,
weapon-category critical tables, Expert Swordsman on swords. Armour: light 6+, heavy 5+, gromril-class
4+ (Toughened Leathers as light; Lamellar, Chaos and Masterwork as 4+), shield +1, buckler parry, kite
shield +2 or 5+, pavise as cover and as a shield when charged to the front, helmet 4+ against being
stunned, Enchanted Skins as a 6+ ward. Everything else a warrior carries is listed as "Not modelled"
under the odds or ignored silently (miscellaneous items and animals).

**Post-battle.** Exploration aids from the roster: Mordheim Map by grade, Wyrdstone Pendulum with its
Leadership test, Rabbit's Foot (house rule switch), Tarot Cards when the pre-battle reading passed.

## A. Cross-cutting gaps

1. **Who may buy or carry an item.** The "X only" and "not available to" clauses on 90-odd entries are
   labels, never checks; the shop sells any item to any warband and to henchman groups. Not enforced:
   miscellaneous equipment is Heroes only (Rain Coat and Winter Furs excepted); a brace counts as one
   missile weapon; the two hand weapons plus dagger and two missile weapons cap; Hunting Arrows and Asp
   Arrows need a bow; one Swivel Gun, one Clan Pestilens Banner, one Liber Bubonicus per campaign;
   Standard of Nagarythe only at creation; Obsidian weapons' Blemished races; Bugman's Ale not for
   Elves; Garlic, Blessed Water, Tears of Shallaya and the Halfling Cookbook barred to Undead or
   Possessed; Chaos Armour and the Mechanical Suit fused to the buyer and never moved.
2. **Conditional prices and rarities.** One rarity per item is used. Not built: Blowpipe common for
   Forest Goblins; Black Lotus and Dark Venom Rare 7 or 6 for Skaven, Lizardmen and Dark Elves and
   common at a fixed price for Skink heroes; Holy Relic and Blessed Water easier for priests and
   Sisters; Mad Cap Mushrooms common with Goblins; Healing Herbs common for Amazons (Lustria); Amulet
   of the Moon Rare 11 for Lustrian Amazons; braces of double-barrelled pistols at a higher rarity;
   Chaos Armour +1 rarity per kill and -1 gc per experience point; Rhinox +1 per point of Strength
   plus the Strength test and injury roll; Familiar's cost paid even on a failed roll; Wolfcloak and
   Bearcloak needing a Strength roll (free of the test at creation for Middenheimers); Opulent Coach
   +3 to rare rolls; Trade Wagon Reputation +1 per five rare items stored; Lizardmen light armour at
   50 gc; Gunnery School cheaper black powder.
3. **Consumables.** Nothing is used up or lasts one battle: poisons, Bugman's Ale, Elven Wine, Vodka,
   Garlic, Blessed Water, Fire Arrows, Superior Blackpowder, Caltrops, Flash Powder, Firecrackers,
   Smoke Bomb, Fire Bomb, Cathayan Candles, Tears of Shallaya, Hardtack Biscuits, Torches, Reptile
   Venom, Mad Cap Mushrooms, Crimson Shade, Mandrake Root, Swivel Gun ammunition, Nets (recovered),
   Trapmaster traps, Pigeon Bomb supply, Bolas (recovered).
4. **Pre-battle item effects on the calculator.** No way to say a warrior drank or coated anything, so
   Dark Venom (+1 S), Black Lotus (auto-wound on 6), Spider Spittle, Manticore Spoor, Reptile Venom
   (+1 S missile), the Forest Goblin Poisoned Weapon (+1 injury), Hunting Arrows (+1 injury), Asp
   Arrows and Nehekharan Javelins (+1 to hit: javelins modelled), Superior Blackpowder (+1 S), Mandrake
   Root (+1 T, stunned as knocked down), Crimson Shade (+D3 I, +1 M, +1 S), Mad Cap Mushrooms
   (frenzy), Hardtack (+1 T for a turn) have no effect on the odds.
5. **Post-battle item consequences.** Not applied: Crimson Shade addiction or permanent +1 I; Mandrake
   Root -1 T on 2-3; Mad Cap permanent stupidity on a 1; Cathayan Silk Clothes ruined on 1-3 after the
   leader goes out of action; Hardtack miss-a-game on a 1; Tarot "disaster" is recorded on the sheet
   but the hero is not made to miss the next game; Lamp of the Djinn and Monkey's Paw tables; Treasure
   Map exploration replacement; Map of Cathay; Nehekharan Map (not recognised as a Mordheim Map by the
   aids); Warpstone Amulet exploration reroll; Mordheim Map Fake and Catacomb scenario effects;
   Fanatics' mushroom supply; Sword Breaker and Ladle disarming; Man-catcher, Slaaneshi Man-Catcher
   and Thingcatcher captures; Powder Keg.
6. **Items that grant traits or saves the calculator knows about but never receives from kit.**
   Bear-Claw Necklace and Red Toof Tribal Jewellery (Frenzy), Hammer of Witches (Hatred), Venom Ring
   and Tears of Shallaya (Immune to Poison), Sea Dragon Cloak (5+ melee, 4+ missile), Wolfcloak (+1
   save against shooting), Amulet of the Moon (-1 to be hit and a 5+ save against missiles), Elven
   Cloak and Forest Cloak (-1 to be hit), Lucky Charm (discard the first hit on 4+), Peg Leg (6+ save
   after a failed save), Hook Hand (counts as a dagger), Enchanted Skins' 5+ against magic, Holy Relic,
   Jolly Roger and Banners (all alone), War Horns (+1 Ld), Bugman's Ale and Elven Wine (immune to
   fear), Temple Dog's unmodifiable 5+.
7. **Mounts and mounted combat.** Horses, steeds, boars, spiders, wolves, Cold Ones, Nightmares,
   Rhinoxen and mules are inert items. Not built: the +1 save for being mounted, Barding (+1 save,
   -1 M, killed only on a 1), Bretonnian Barding, Lance needing a warhorse and only counting when
   mounted, the spear and Boss Pole cavalry bonus, the Horseman's Hammer charge bonus, kite shield
   mounted values, mount stat lines and attacks (engine weapons exist but never fight), Whoa Boy and
   loss-of-control rerolls (Battle Schooled), Cold One and Boar save bonuses, mount deaths, Giant
   Spider versus Giant Wolf exclusivity, Rhinox and Temple Dog +20 rating (items give no rating),
   Magic Carpet.
8. **Animals bought as equipment.** Wardogs and Gnoblar Fighters fight as warriors, count towards the
   warband maximum and roll injuries as henchmen, but they are items: no combatant on the battle sheet,
   no count, no injury roll. Claimed Gnoblars' own 1-2 death roll likewise.
9. **Black powder handling.** No reload cadence (fire every other turn, braces every turn, Repeater
   Handgun's dead turn), no Hunter skill interplay, no pistol in hand-to-hand (+1 Attack at S4 with -2
   save, two attacks in the first turn with a brace, the Crossbow Pistol's first-round shot, Sun
   Gauntlet in melee), no optional misfire chart (and the always-Experimental weapons), no
   double-barrelled second wound roll or two-hit Ostlander barrels, no Blunderbuss auto-hit line or
   fire-once, no Hand-held Mortar scatter and blast, no Pigeon Bomb flat D6 or blast, no Swivel Gun at
   all in the calculator (the catalogue entry has no engine weapon; the three ammunition profiles exist
   but nothing links to them), no Grape Shot spread, no Chain Shot knock-down.
10. **Multi-shot approximations.** The Repeater Crossbow always fires twice at -1 and the Repeater
    Handgun and Pistol always three times at -1; the single-shot option is not offered. The Sling is
    always one shot; its double shot at half range is not offered. Quick Shot and Knife-Fighter stack
    on top of the fixed shot counts.
11. **Initiative and strike order.** Not modelled, only noted: Strike First (spear, pikes, boat hook,
    trident, Bec de Corbin), Strike Last (double-handed, Broadsword, Great Axe, Obsidian), the
    Initiative bonuses and penalties of Ithilmar, Quarter Staff, Cathayan Longsword, Hobgoblin daggers,
    Brass Knuckles (-2), Sons of Hashut obsidian (-1), Swivel Gun (-1), Merchant Pike.
12. **Weapon rules carried only as tags.** These weapons look modelled but the engine never reads the
    tag: Cathayan Longsword +1 WS, Chain Sticks +2 Attacks in the first turn, Starblade parry on 4+,
    Sigmarite Warhammer +1 to wound against Undead and Possessed, Ladle no save except shields, Dark Elf
    Blade +1 on the critical chart, Whipcrack when charged (+1 A striking first), Quarter Staff with
    unarmed +1 Attack, Rapier Barrage, Serpent Staff's WS4 S4 attack, Misericordia 2D6 to wound versus
    knocked down, Ball and Chain D3 wounds and -1 to be hit, Censer Fog of Death, Disease Dagger
    Infecting, Brazier Iron fire, Tufenk and Cathayan Candle fire, Firepots smoke, Fish-hook fall,
    Bolas entangle, Iron Shod Boots kick, Sword-Gnoblar attack, Ogre Club parry Strength +1, Barbed
    Whip Enrage, Beastlash fear in animals, Boss Pole and Squig Prodder animosity auras, Fighting Claws
    climbing bonus, Sunstaff (Lustria) in melee.
13. **Selling.** Toughened Leathers cannot be sold; the Sell tab allows it. Pirates' Know Who To Sell
    To (half the random element) is in the warband audit.
14. **Spell and prayer items.** No spell flow exists, so Tome of Magic, Book of the Dead, Liber
    Bubonicus (once per campaign), Holy Tome (+1 to cast), Familiar (reroll, paid on failure, one per
    wizard), Rosary, Elven Runestones, Magic Gubbinz, Scroll of the Rat Familiar (creates a henchman that
    gains experience), Staff of Damnation do nothing.

## B. Per-item status

Status key: **M** modelled in the calculator or resolvers; **P** partly modelled (what is missing
follows); **T** text only.

### Close-combat weapons
- Axe M. Ball and Chain P: no save modelled; D3 wounds, random movement, -1 to be hit, post-battle
  injury roll, Mad Cap requirement not. Barbed Whip P: cannot be parried and charge attack; Enrage and
  the charged-side attack not. Beastlash P: as Barbed Whip; fear in animals not. Bec de Corbin P:
  concussion and +1 S; strike order not; price unlisted (manual). Boat Hook P: S-1; strike first not.
  Boss Pole P: spear rules as Spear; animosity aura, cavalry bonus not. Brass Knuckles P: +1 S, extra
  attack; -2 I not. Brazier Iron P: +1 S; fire not. Broadsword P: +1 S; strike last note only;
  Strongman negation not. Cat o' Nine Tails P: as Steel Whip plus +1 enemy save. Cathayan Longsword P:
  parry and cutting edge; +1 WS and +1 I not. Censer P: +2 S first turn; Fog of Death and the wielder's
  own test not. Chain Sticks P: two-handed only; +2 Attacks first turn not. Claw of the Old Ones M.
  Cleaver M. Club, Mace, Hammer M. Dagger M. Dark Elf Blade P: concussion; +1 crit not; base weapon's
  Parry or dagger save lost; sold as a weapon not an upgrade. Disease Dagger P: dagger save; Infecting
  not. Double-handed Weapon P: +2 S; strike last note. Dragon Sword M. Dwarf Axe M (parry reroll with a
  second parry item). Fighting Claws M (climb bonus not). Fist M. Flail M. Great Axe P: strike last
  note, Strongman not. Halberd M. Hobgoblin Poisoned Daggers P: +1 I not. Horseman's Hammer P: +1 S;
  mounted charge bonus not. Iron Fist M. Katar M. Kitchen Knife M. Ladle P: modelled as a plain club
  with normal saves; no-save-except-shields and disarm not. Lance P: +2 S on any charge; mounted
  requirement not. Main Gauche M. Man-catcher P: two-handed; capture not. Misericordia P: dagger save;
  2D6 versus knocked down not. Morning Star M. Obsidian Weapon P: +1 S; strike last note; race
  restriction not; 4 x price is a manual figure. Ogre Club P: -1 save always; two-handed condition and
  parry Strength not. Pike (Merchant Caravans) P: strike first and +1 I not. Pike (Tileans) P: one
  attack; reach and creature-size limit not. Poison Daggers M. Quarter Staff P: parry; +1 I and
  unarmed combination not. Rapier P: parry and +1 enemy save; Barrage not. Serpent Staff P: parry; the
  staff's own attack not. Shortsword M. Sigmarite Warhammer P: +1 S and concussion; holy +1 to wound
  not; two only for Matriarch and Superiors not. Sons of Hashut Obsidian Weapon P: +1 S; the base
  weapon's own rules and -1 I not. Spear P: unwieldy off-hand; strike first and cavalry bonus not.
  Spiked Gauntlet M. Starblade P: +1 enemy save; 4+ parry not. Starsword M. Steel Whip P: charged-side
  attack not. Sword M. Sword Breaker P: parry; trap blade not. Tenderiser M. Trident P: parry; strike
  first when charged not. Weeping Blades M.

### Missile weapons
- Belaying Pins P: S-1, +1 enemy save; moving penalty applies via the toggle. Blowpipe M (stealthy
  firing not). Bolas P: placeholder S3 that wounds normally; entangle, backfire and once-per-battle
  not. Bow, Longbow, Short Bow M. Cathayan Candles P: S6 shot; volatile and fire not. Crossbow M.
  Crossbow Pistol P: shot only; first-round melee shot and pistol attack not. Elf Bow M. Firepots
  Miragliano P: S2; smoke not; price unlisted. Fish-hook Shot P: S3; targeting models in combat and the
  fall not. Harpoon Crossbow P: move or fire; prepare shot not. Javelins M. Nehekharan Javelins M (+1
  to hit). Repeater Crossbow P: two shots at -1 always. Sling P: one shot only. Sun Gauntlet P: no
  save, accurate; melee use not. Sunstaff M. Sunstaff (Lustria) P: melee use not. Throwing Knives and
  Stars M. Tufenk P: S2; fire, reload and the Mummy rule not.

### Blackpowder weapons
- Blunderbuss P: modelled as a normal S3 shot; auto-hit line and fire-once not. Chaos Dwarf
  Blunderbuss P: as above; reload not. Double-barrelled Duelling Pistol P: single-barrel baseline
  with +1 to hit and -2 save; both barrels, reload tokens, brace, melee not. Double-barrelled Handgun
  P: as above. Double-barrelled Pistol P: as above. Duelling Pistol P: +1 to hit and -2 save; reload,
  brace, melee not. Hand-held Mortar P: single S4 shot; scatter, blast, Experimental not. Handgun P:
  -2 save, move or fire; reload not. Hersten-Wenkler Pigeon Bombs P: uses BS; flat D6, blast, supply
  not. Hunting Rifle P: -2 save, move or fire; pick target and reload not. Ostlander Double-barrelled
  Hunting Rifle P: no -2 save modifier in the engine entry (the source treats it as a normal rifle, so
  -2 should apply); two hits per shot not. Ostlander Double-barrelled Pistol P: likewise missing the
  pistol's -2 save; two hits not. Pistol P: -2 save; reload, brace, melee not. Repeater Handgun P:
  three shots at -1 always; reload and Experimental not. Repeater Pistol P: as above; Not a Club not.
  Swivel Gun T: catalogue entry has no engine weapon; ammunition types, cumbersome, misfire not.
  Warplock Pistol P: -3 save and S5; reload, brace, melee not.

### Armour
- Barding T. Bretonnian Barding T. Buckler M. Chaos Armour P: 4+; fused, spellcasting, rarity and cost
  rules not. Cooking Pot Helmet P: treated as a 4+ helmet; the rule is a 5+ never-modified save and
  Master Chef only. Enchanted Skins P: 6+ ward; 5+ against magic not. Gromril Armour M (movement n/a).
  Heavy Armour M. Helmet M. Ithilmar Armour M. Kite Shield P: on foot only. Lamellar Armour M.
  Light Armour M. Masterwork Heavy Armour P: 4+; -1 M n/a; price unlisted. Mechanical Suit T: no save
  in the data so the calculator ignores it (the source gives none; it is Chaos armour by its rules).
  Pavise P: half movement n/a. Shield M. Toughened Leathers P: as light armour; the no-shield
  combination, unsellable and blocks-spellcasting rules not.

### Miscellaneous equipment
- Modelled: Mordheim Map (grade at purchase, exploration rerolls; Fake and Catacomb scenario effects
  not), Wyrdstone Pendulum, Rabbit's Foot (with house rule), Tarot Cards (reading and exploration
  modifier; the disaster's missed game not), Trade Wagon (as a Merchant unit; storage, Reputation and
  Abandoned not).
- Text only, campaign effect: Halfling Cookbook (+1 maximum), Victuals (income band), Opulent Coach
  (+3 rare rolls), Tome of Magic, Book of the Dead, Liber Bubonicus, Holy Tome, Familiar, Rosary, Elven
  Runestones, Magic Gubbinz, Scroll of the Rat Familiar, Lamp of the Djinn, Monkey's Paw, Map of
  Cathay, Nehekharan Map, Treasure Map, Warpstone Amulet, Cathayan Silk Clothes, Crimson Shade,
  Mandrake Root, Mad Cap Mushrooms, Hardtack Biscuits, Peg Leg, Hook Hand, Poisoned Weapon, Standard of
  Nagarythe, Superior Blackpowder, Magic Gourd, Bota Bag, Nomad Robes, Winter Furs, Rain Coat, Scorpion
  Ring, Snake Charmer's Flute, Venom Ring, Engine of Chaos, Opulent Coach, Rickshaw, boats and wagons,
  Skeleton Chariot, Wheelbarrow, Chest, Powder Keg, ladders.
- Text only, battle effect the calculator could carry: Amulet of the Moon, Elven Cloak, Forest Cloak,
  Sea Dragon Cloak, Wolfcloak, Lucky Charm, Bear-Claw Necklace, Red Toof Tribal Jewellery, Hammer of
  Witches, Tears of Shallaya, Black Lotus, Dark Venom, Spider Spittle, Manticore Spoor, Reptile Venom,
  Hunting Arrows, Asp Arrows, Fire Arrows, Fire Bomb, Blessed Water, Net, Caltrops, Flash Powder,
  Firecrackers, Smoke Bomb, Iron Shod Boots, Sword-Gnoblar, Lookout-Gnoblar (Dodge), Luck-Gnoblar,
  Parrot, Garlic, Bugman's Ale, Elven Wine, Vodka, Holy Relic, Banner, Clan Pestilens Banner, Jolly
  Roger, War Horn, War Horn of Nagarythe, Liturgicus Infecticus, Fog-Enhancing Warpstone Shards, Vial of
  Pestilens, Healing Herbs, Blessed Stag Hide, Lantern, Torch, Telescope, Spy Glass, Rope and Hook,
  Lock Picks, Trip Wire, Squig Prodder, Compass, Conch Shell Horn, Elven Boots.

### Animals
- All fourteen are inert catalogue items. Engine attack profiles exist for every mount and the
  Wardog but nothing fights with them; no rating, no count, no injuries, no mounted rules (section A7).

## C. Data and derivation errors found on the way

- **Swivel Gun** has no engine weapon, so a Gunner's gun is silently dropped from the odds even though
  three ammunition profiles exist in the weapon data.
- **Ostlander double-barrelled rifle and pistol** lack the -2 save modifier of the weapons they copy.
- **Cooking Pot Helmet** is a 5+ unmodified save, not a 4+ helmet; it also wrongly combines with Thick
  Skull in the calculator.
- **Dark Elf Blade** is sold as a standalone 20 gc weapon and its engine entry has neither Parry nor the
  dagger's +1 enemy save; the source is a +20 gc upgrade that keeps the base weapon's rules. Its +1
  critical tag is never applied.
- **Sons of Hashut Obsidian Weapon** drops the base weapon's rules (Personal).
- **Lance** gives +2 on any charge; the rule needs a warhorse and the rider mounted.
- **Ogre Club** always applies -1 to the save; the rule needs both hands.
- **Repeater weapons** always fire the maximum shots at -1; the Sling never fires twice.
- **Tags that are never read** (weapons that appear modelled): Cathayan Longsword +1 WS, Chain Sticks
  +2 Attacks, Starblade 4+ parry, Sigmarite Warhammer holy bonus, Ladle saves, Dark Elf Blade crit +1,
  every "when charged" Whipcrack.
- **Toughened Leathers** may not be combined with a shield; the calculator stacks them.
- **Mechanical Suit** has no save in the data and is ignored.
- **Equipment ban matching**: the thrown-weapon test looks for "throw" or "dart" in the id, so
  Javelins, Belaying Pins, Bolas, Fish-hook Shot and Firepots would be flagged for warriors limited to
  thrown weapons; the heavy-armour test misses Lamellar and Masterwork armour.
- **Tarot Cards**: the "disaster" outcome is stored on the sheet but never makes the hero miss a game.
- **Unresolved equipment-list names**: 34 entries in warband lists have no catalogue item and land on
  rosters as custom items with no rules or price parsing beyond the list line: Bearcloak, Beastwhip,
  Boar Spear, Bone Helmet, Cathayan Quilted Silk Armour, Chest Talon, Darksteel Blade, Draich, Hedonist
  Whip, Horo, Kanabo, Katana, Kusarigama, Pebble, Pry Bar, Sashimono, Scythe, Sharp Stuff, Shield of
  Sigmar, Silver-tip Stake, Slaaneshi Man-Catcher, Slingshot, Staff, Thingcatcher, Whirling Blades,
  Wizard's Staff, the "Shield/Buckler" choice and the six Pit Fighter style bundles. Katana is the
  Dragon Sword by the source's own note and could be aliased; the rest need catalogue and engine
  entries (their rules are in the warband pages).
- **Prices not listed in the source** (Bec de Corbin, Firepots, Masterwork armour, Obsidian "4 x
  price", Fist) fall back to a typed figure, which is right.

## D. Fine as text

Movement penalties (heavy armour and shield, Pavise, Masterwork, Barding, Mechanical Suit),
spotting and hiding distances (Lantern, Torch, Telescope, Spy Glass, cloaks' hidden rules), climbing
(Rope and Hook, Fighting Claws), deployment rerolls (Compass, Conch), weather and water items, vehicles
and ladders, and the tabletop parts of psychology items are the table's business and stay as text.
