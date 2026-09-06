# Mordheim Campaign Map rules (as published on mordheim-map.com)

Source: https://mordheim-map.com/campaign-rules, captured 2026-09-06. The interactive site is an
unofficial fan project by the Warhammer Fantasy Online Rules Index Project, based on the Mordheim
Campaign Map by Philip Spence (beyondthetabletop.com) with help from Roland Wenskus, Daniel
Särnblom, Giuseppe Chiafele, Maxine Howells, Benoît Dumeaux, Hernan Garcia, Dennis Biegel, Alexander
Bai, Kateryna Ruban, Olena Panova and Tuomas Pirinen; based on the campaign by Chrismish (2010); map
illustrated by Nuala Kennedy. Mordheim is © Games Workshop Limited. Kept here as a reference for
building the map-campaign features; wording condensed, rules preserved. Per-district advantages,
flags and connections are in `districts.json`.

## Setup

Warbands start at 500 gold crowns per the rulebook. The campaign begins just after the comet falls:
every district is unexplored.

## Exploring the districts

- Each battle takes place in one district (the circles on the map). Warbands enter Mordheim through
  one of the four Gates.
- A player's first game must be fought at a gate, chosen by the new player (roll off if both are
  new).
- Later battles can only be fought in a district at least one of the warbands can reach: a path
  from any gate to the district through districts that warband has already explored.
- Opponents agree the district; if they cannot, each proposes a reachable district and they roll
  off. The location can be settled ahead of time so terrain can be arranged.
- A warband that has fought in a district has explored it and can now reach its neighbours. Mark
  who has explored what.

## Footholds and control

- The winner of a battle in a district gains a foothold there; the loser loses its foothold if it
  had one. While only one warband has a foothold in a district it also controls it.
- A warband with a foothold gains the district's advantages (see the legend), except in Hard Fought
  districts, where only the controlling warband does. Half-price bonuses round down; rare items
  still need their availability roll.
- Fighting in a district one participant controls: play scenario 9 Surprise Attack, the controller
  defends. If the defender wins, its leader gains +1 Ld for all battles in that district.
- Fighting in a district where both warbands have a foothold: play scenario 1 Defend the Find. The
  winner's leader, a Hero or a Henchman group gains +1 extra Experience.

## Winning

Agree the objective, length and optional rules before starting: a fixed number of months or games,
or a set objective (warband rating, number of districts controlled, wyrdstone collected).

## Points of interest

- **Abundance of Wyrdstone** (twin-tailed comet): the winner of a battle there gains 1D3 extra
  wyrdstone shards.
- **Hard Fought District** (dead fish): only the controlling warband gains its benefits. Does not
  affect Abundance of Wyrdstone.
- **The Gates of Mordheim** (skull): a player without a foothold at a gate who wants to reach
  another district via that gate pays 5 gc before the game.

## District advantages

| District | Advantage | Flags |
| --- | --- | --- |
| Artisan Quarters | 1/2 price Cathayan Silk Clothes, Hunting Arrows, Lantern, Net, Rope & Hook, Superior Blackpowder | |
| Count Steinhardt's Palace | 1/2 price to hire Freelancer; 1/2 price Horse, Warhorse, Wardog | Wyrdstone |
| Dwarven District | 1/2 price to hire Dwarf Troll Slayer; 1/2 price Bugman's Ale, Gromril Armour, Gromril Weapons | |
| Executioner's Square | Roll one extra dice in the Exploration Procedure | Hard Fought, Wyrdstone |
| Memorial Gardens | Roll 3D6 for experience when recruiting for existing non-human Henchmen groups | |
| Raven Barracks | 1/2 price to hire Ogre Bodyguard; resell weapons and armour at purchase price | |
| Rich Quarter | Always find the maximum gold or equipment at an Exploration Chart location | Hard Fought, Wyrdstone |
| Statue of Count Gotthard | Leader gains +1 Ld | Hard Fought |
| Temple of Morr | Hero result 11-15 Dead: D6, on 5+ becomes 41-55 Full Recovery | |
| The Cemetery | Undead: Zombies 10 gc, Ghouls 30 gc. Others: immune to Fear, Terror counts as Fear | Hard Fought, Wyrdstone |
| The Gaol | 1/2 price to hire Gaoler; Hero result 61 Captured becomes 41-55 Full Recovery | Hard Fought, Wyrdstone |
| Amphitheatre | 1/2 price to hire Pit Fighter; 1/2 price Net; Hero result 65 Sold to the Pits: automatically wins the fight | |
| City Hall | Modify one Exploration dice by +1 or -1 | Hard Fought |
| Clock Tower | Always find the maximum gold or equipment at an Exploration Chart location | Hard Fought, Wyrdstone |
| Fence Alley | 1/2 price Poisons and Drugs | Hard Fought |
| Little Moot | 1/2 price to hire Halfling Scout; 1/2 price Halfling Cookbook | |
| Merchants' Quarter | 1/2 price to hire Elf Ranger; 1/2 price Elf Bow, Elven Cloak, Ithilmar Armour, Ithilmar Weapon | Wyrdstone |
| Market Square | +2 on the rare items roll | Hard Fought, Wyrdstone |
| Poor Quarter | Roll one extra dice in the Exploration Procedure | Hard Fought |
| Quayside | Roll 3D6 for experience when recruiting for existing human Henchmen groups | |
| Sage's Hall | 1/2 price to hire Warlock; 1/2 price Tome of Magic; choose a spell instead of rolling | |
| Temple of Sigmar | Hero result 22-35: D6, on 5+ becomes 41-55 Full Recovery | |
| The Great Library | 1/2 price Halfling Cookbook, Holy Tome, Mordheim Map, Tome of Magic | |
| The Pit | May change a found Exploration location to The Pit (Heroes devoured on 1-2); Possessed Heroes always return with maximum shards | Hard Fought, Wyrdstone |
| Middle Bridge | Toll: controller gains 2D6 gc at the end of any game where another warband passed through it to reach the battle | Hard Fought, Wyrdstone |
| The Rock | Sell wyrdstone for 20% more gold, rounding down | Wyrdstone |
| River Gate, East Gate, South Gate, West Gate | 1/2 price to hire Luthor Wolfenbaum; a hero sent to look for him finds him automatically | Gate |

## Connections

30 districts, 63 links, all two-way. Listed in `districts.json`. One correction to the site's data:
the Statue of Count Gotthard links to Raven Barracks, Rich Quarter, Middle Bridge and River Gate
(read from the red lines on the map image); the site repeats Count Steinhardt's Palace's list for
it.
