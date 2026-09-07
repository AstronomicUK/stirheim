// The Mordheim Campaign Map (Philip Spence, beyondthetabletop.com, illustrated by Nuala Kennedy):
// thirty districts, their advantages and which border which. Coordinates are percentages of the
// map image (centre of each circle); the image is 4000 x 2829, so the overlay's viewBox is
// 100 x 70.725. Data from reference/map/districts.json (see the README there for provenance and
// the one correction made to the source). Rules text: reference/map/campaign-rules.md.
//
// The source's y coordinates were measured against mordheim-map.com's own version of the map
// image, not Philip Spence's poster (the file this app actually displays); four southern districts
// (temple-of-morr, the-cemetery, poor-quarter, south-gate) came out below the bottom edge of our
// image as a result — visible as a connecting line ending on nothing. Shifted all four up by 7.5
// (uniformly, so their spacing relative to each other is unchanged) to sit fully on the image;
// revisit if the source is ever re-measured against this exact poster.

export interface MapDistrict {
  id: string
  name: string
  /** Percent of the image width. */
  x: number
  /** Percent of the image height. */
  y: number
  /** Circle size relative to the default. */
  scale: number
  /** What a warband with a foothold gains (only the controller in a Hard Fought district). */
  advantage: string
  /** Twin-tailed comet: the winner of a battle here gains D3 extra wyrdstone shards. */
  abundance: boolean
  /** Dead fish: only the controlling warband gains the advantage. */
  hard: boolean
  /** One of the four entrances to the city. */
  gate: boolean
  /** Ids of bordering districts (always two-way). */
  connections: string[]
}

/** Aspect of the map image: height as a percentage of width. */
export const MAP_VIEW_HEIGHT = 70.725

export const MAP_DISTRICTS: MapDistrict[] = [
  { id: "artisan-quarter", name: "Artisan Quarters", x: 21.9, y: 48.6, scale: 0.98, advantage: "1/2 price Cathayan Silk Clothes, Hunting Arrows, Lantern, Net, Rope & Hook, Superior Blackpowder.", abundance: false, hard: false, gate: false, connections: ["dwarven-district", "west-gate", "memorial-gardens", "count-steinhardts-palace", "executioners-square", "the-gaol"] },
  { id: "count-steinhardts-palace", name: "Count Steinhardt's Palace", x: 33.2, y: 45.6, scale: 1.2, advantage: "1/2 price to hire Freelancer. 1/2 price Horse, Warhorse and Wardog.", abundance: true, hard: false, gate: false, connections: ["artisan-quarter", "memorial-gardens", "rich-quarter", "middle-bridge", "executioners-square"] },
  { id: "dwarven-district", name: "Dwarven District", x: 15, y: 44.8, scale: 1.2, advantage: "1/2 price to hire Dwarf Troll Slayer. 1/2 price Bugman's Ale, Gromril Armour and Gromril Weapons.", abundance: false, hard: false, gate: false, connections: ["west-gate", "artisan-quarter", "the-gaol"] },
  { id: "executioners-square", name: "Executioner's Square", x: 30.2, y: 58.3, scale: 1.2, advantage: "Roll one extra dice in the Exploration Procedure.", abundance: true, hard: true, gate: false, connections: ["artisan-quarter", "count-steinhardts-palace", "middle-bridge", "temple-of-morr", "the-cemetery"] },
  { id: "memorial-gardens", name: "Memorial Gardens", x: 25.3, y: 38.4, scale: 1.05, advantage: "Roll 3D6 for experience when recruiting for existing, non-human, Henchmen groups.", abundance: false, hard: false, gate: false, connections: ["west-gate", "raven-barracks", "rich-quarter", "count-steinhardts-palace", "artisan-quarter"] },
  { id: "raven-barracks", name: "Raven Barracks", x: 27.35, y: 21, scale: 1.21, advantage: "1/2 price to hire Ogre Bodyguard. You can resell your weapons and armour at their purchase price.", abundance: false, hard: false, gate: false, connections: ["west-gate", "statue-of-count-gotthard", "rich-quarter", "memorial-gardens"] },
  { id: "rich-quarter", name: "Rich Quarter", x: 33.45, y: 31.55, scale: 1.17, advantage: "Always find the maximum amount of gold or equipment at a location on the Exploration Chart.", abundance: true, hard: true, gate: false, connections: ["raven-barracks", "statue-of-count-gotthard", "middle-bridge", "count-steinhardts-palace", "memorial-gardens"] },
  { id: "statue-of-count-gotthard", name: "Statue of Count Gotthard", x: 40.7, y: 22.4, scale: 0.97, advantage: "The warband's leader gains +1 Ld.", abundance: false, hard: true, gate: false, connections: ["raven-barracks", "rich-quarter", "middle-bridge", "river-gate"] },
  { id: "temple-of-morr", name: "Temple of Morr", x: 29.95, y: 65.05, scale: 0.78, advantage: "If a Hero's injury result is 11-15 Dead on the Heroes' Serious Injures Chart, roll a D6. On a 5+, the result becomes 41-55 Full Recovery instead.", abundance: false, hard: false, gate: false, connections: ["the-cemetery", "executioners-square", "south-gate"] },
  { id: "the-cemetery", name: "The Cemetery", x: 25.5, y: 63.65, scale: 0.74, advantage: "Undead warband: Zombies cost 10 gc to hire and Ghouls cost 30 gc to hire. Other warbands: The warband is immune to Fear, and Terror is treated as Fear", abundance: true, hard: true, gate: false, connections: ["the-gaol", "executioners-square", "temple-of-morr"] },
  { id: "the-gaol", name: "The Gaol", x: 18.55, y: 59.6, scale: 1.14, advantage: "1/2 price to hire Gaoler. If a Hero's injury result is 61 Captured on the Heroes' Serious Injures Chart, the result becomes 41-55 Full Recovery instead.", abundance: true, hard: true, gate: false, connections: ["dwarven-district", "artisan-quarter", "the-cemetery"] },
  { id: "amphitheatre", name: "Amphitheatre", x: 51.3, y: 55.3, scale: 1.15, advantage: "1/2 price to hire Pit Fighter. 1/2 price Net. If a Hero's injury result is 65 Sold To The Pits on the Heroes' Serious Injures Chart, they automatically win the fight.", abundance: false, hard: false, gate: false, connections: ["the-rock", "middle-bridge", "merchants-quarter", "market-square", "the-pit", "poor-quarter", "south-gate"] },
  { id: "city-hall", name: "City Hall", x: 69.55, y: 43.3, scale: 0.945, advantage: "During the Exploration Procedure, you may modify one dice by +1 or -1.", abundance: false, hard: true, gate: false, connections: ["market-square", "the-great-library", "temple-of-sigmar", "east-gate", "the-pit"] },
  { id: "clock-tower", name: "Clock Tower", x: 68.2, y: 69.1, scale: 1.125, advantage: "Always find the maximum amount of gold or equipment at a location on the Exploration Chart.", abundance: true, hard: true, gate: false, connections: ["poor-quarter", "the-pit", "sages-hall"] },
  { id: "fence-alley", name: "Fence Alley", x: 60.5, y: 32.9, scale: 0.97, advantage: "1/2 price Poisons and Drugs.", abundance: false, hard: true, gate: false, connections: ["merchants-quarter", "quayside", "market-square"] },
  { id: "little-moot", name: "Little Moot", x: 76.83, y: 26.42, scale: 0.96, advantage: "1/2 price to hire Halfling Scout. 1/2 price Halfling Cookbook.", abundance: false, hard: false, gate: false, connections: ["the-great-library", "temple-of-sigmar"] },
  { id: "merchants-quarter", name: "Merchants' Quarter", x: 50.5, y: 41.18, scale: 1.18, advantage: "1/2 price to hire Elf Ranger. 1/2 price Elf Bow, Elven Cloak, Ithilmar Armour and Ithilmar Weapon.", abundance: true, hard: false, gate: false, connections: ["middle-bridge", "quayside", "fence-alley", "market-square", "amphitheatre"] },
  { id: "market-square", name: "Market Square", x: 62.2, y: 44.4, scale: 1.18, advantage: "Add +2 on the rare items roll.", abundance: true, hard: true, gate: false, connections: ["merchants-quarter", "fence-alley", "city-hall", "the-pit", "amphitheatre"] },
  { id: "poor-quarter", name: "Poor Quarter", x: 58.1, y: 63.8, scale: 1.27, advantage: "Roll one extra dice in the Exploration Procedure.", abundance: false, hard: true, gate: false, connections: ["south-gate", "amphitheatre", "the-pit", "clock-tower"] },
  { id: "quayside", name: "Quayside", x: 50.9, y: 28.9, scale: 1.1, advantage: "Roll 3D6 for experience when recruiting for existing human Henchmen groups.", abundance: false, hard: false, gate: false, connections: ["river-gate", "the-great-library", "fence-alley", "merchants-quarter"] },
  { id: "sages-hall", name: "Sage's Hall", x: 74.58, y: 55.35, scale: 0.98, advantage: "1/2 price to hire Warlock. 1/2 price Tome of Magic. You may choose a spell rather than randomly generating it.", abundance: false, hard: false, gate: false, connections: ["the-pit", "east-gate", "clock-tower"] },
  { id: "temple-of-sigmar", name: "Temple of Sigmar", x: 77, y: 40.1, scale: 1.15, advantage: "If a Hero's injury result is 22-35 on the Heroes' Serious Injures Chart, roll a D6. On a 5+, the result becomes 41-55 Full Recovery instead.", abundance: false, hard: false, gate: false, connections: ["city-hall", "the-great-library", "little-moot", "east-gate"] },
  { id: "the-great-library", name: "The Great Library", x: 67.35, y: 24.7, scale: 1.33, advantage: "1/2 price Halfling Cookbook, Holy Tome, Mordheim Map and Tome of Magic.", abundance: false, hard: false, gate: false, connections: ["quayside", "river-gate", "little-moot", "temple-of-sigmar", "city-hall"] },
  { id: "the-pit", name: "The Pit", x: 61.9, y: 59.3, scale: 1.2, advantage: "During the Exploration Procedure, if a location is found, you may change the result to The Pit instead. However, Heroes are devoured on a roll of 1 or 2. Cult of the Possessed Heroes always return with the maximum amount of wyrdstone shards.", abundance: true, hard: true, gate: false, connections: ["amphitheatre", "market-square", "city-hall", "sages-hall", "clock-tower", "poor-quarter"] },
  { id: "middle-bridge", name: "Middle Bridge", x: 41, y: 44.2, scale: 0.975, advantage: "The warband that controls the bridge has installed a toll here. They gain 2D6 gc at the end of any game if another warband passes through this location to reach the battle.", abundance: true, hard: true, gate: false, connections: ["count-steinhardts-palace", "rich-quarter", "statue-of-count-gotthard", "merchants-quarter", "amphitheatre", "the-rock", "executioners-square"] },
  { id: "the-rock", name: "The Rock", x: 42.2, y: 63.87, scale: 1.17, advantage: "The Sisters of Sigmar wish to hide wyrdstone deep beneath Sigmar's Rock. When selling wyrdstone gain 20% more gold, always rounding down.", abundance: true, hard: false, gate: false, connections: ["middle-bridge", "amphitheatre", "south-gate"] },
  { id: "river-gate", name: "River Gate", x: 53.22, y: 16.9, scale: 1.15, advantage: "1/2 price to hire Luthor Wolfenbaum. A hero sent to look for Luthor automatically finds him.", abundance: false, hard: false, gate: true, connections: ["statue-of-count-gotthard", "quayside", "the-great-library"] },
  { id: "east-gate", name: "East Gate", x: 80.65, y: 53.5, scale: 0.8, advantage: "1/2 price to hire Luthor Wolfenbaum. A hero sent to look for Luthor automatically finds him.", abundance: false, hard: false, gate: true, connections: ["temple-of-sigmar", "city-hall", "sages-hall"] },
  { id: "south-gate", name: "South Gate", x: 48.3, y: 66.7, scale: 1.07, advantage: "1/2 price to hire Luthor Wolfenbaum. A hero sent to look for Luthor automatically finds him.", abundance: false, hard: false, gate: true, connections: ["temple-of-morr", "the-rock", "amphitheatre", "poor-quarter"] },
  { id: "west-gate", name: "West Gate", x: 16.25, y: 32.21, scale: 1.02, advantage: "1/2 price to hire Luthor Wolfenbaum. A hero sent to look for Luthor automatically finds him.", abundance: false, hard: false, gate: true, connections: ["raven-barracks", "memorial-gardens", "artisan-quarter", "dwarven-district"] },
]

const BY_ID = new Map(MAP_DISTRICTS.map((d) => [d.id, d]))

export function findDistrict(id: string | null | undefined): MapDistrict | undefined {
  return id ? BY_ID.get(id) : undefined
}

export const MAP_GATE_IDS = MAP_DISTRICTS.filter((d) => d.gate).map((d) => d.id)

/** Every link once, as [a, b] with a < b. */
export const MAP_LINKS: [string, string][] = MAP_DISTRICTS.flatMap((d) => d.connections.filter((c) => d.id < c).map((c) => [d.id, c] as [string, string]))

/** Gate toll paid by a warband without a foothold at the gate it enters through. */
export const GATE_TOLL_GC = 5
/** Extra shards for winning in an Abundance of Wyrdstone district. */
export const ABUNDANCE_SHARDS = 'D3'
