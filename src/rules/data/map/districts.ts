// The Mordheim Campaign Map (Philip Spence, beyondthetabletop.com, illustrated by Nuala Kennedy).
// District overlays follow the printed circles on the served poster (not the building centres):
// public/map/mordheim-campaign-map.jpg (2400 x 1697 pixels). x is percent of image width;
// y is percent of image height. Convert y to SVG units with districtMapY before rendering.
// Rules and connections: reference/map/districts.json (see its README for provenance);
// rules text: reference/map/campaign-rules.md.

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
export const MAP_VIEW_HEIGHT = (1697 / 2400) * 100

/** Convert height-percent data to the width-based units of the aspect-correct SVG. */
export function districtMapY(district: Pick<MapDistrict, 'y'>): number {
  return district.y * MAP_VIEW_HEIGHT / 100
}

export const MAP_DISTRICTS: MapDistrict[] = [
  { id: "artisan-quarter", name: "Artisan Quarters", x: 29.3750, y: 43.9010, scale: 0.98, advantage: "1/2 price Cathayan Silk Clothes, Hunting Arrows, Lantern, Net, Rope & Hook, Superior Blackpowder.", abundance: false, hard: false, gate: false, connections: ["dwarven-district", "west-gate", "memorial-gardens", "count-steinhardts-palace", "executioners-square", "the-gaol"] },
  { id: "count-steinhardts-palace", name: "Count Steinhardt's Palace", x: 38.3333, y: 41.5439, scale: 1.2, advantage: "1/2 price to hire Freelancer. 1/2 price Horse, Warhorse and Wardog.", abundance: true, hard: false, gate: false, connections: ["artisan-quarter", "memorial-gardens", "rich-quarter", "middle-bridge", "executioners-square"] },
  { id: "dwarven-district", name: "Dwarven District", x: 23.7500, y: 39.7761, scale: 1.2, advantage: "1/2 price to hire Dwarf Troll Slayer. 1/2 price Bugman's Ale, Gromril Armour and Gromril Weapons.", abundance: false, hard: false, gate: false, connections: ["west-gate", "artisan-quarter", "the-gaol"] },
  { id: "executioners-square", name: "Executioner's Square", x: 36.4583, y: 51.0312, scale: 1.2, advantage: "Roll one extra dice in the Exploration Procedure.", abundance: true, hard: true, gate: false, connections: ["artisan-quarter", "count-steinhardts-palace", "middle-bridge", "temple-of-morr", "the-cemetery"] },
  { id: "memorial-gardens", name: "Memorial Gardens", x: 32.2917, y: 34.4726, scale: 1.05, advantage: "Roll 3D6 for experience when recruiting for existing, non-human, Henchmen groups.", abundance: false, hard: false, gate: false, connections: ["west-gate", "raven-barracks", "rich-quarter", "count-steinhardts-palace", "artisan-quarter"] },
  { id: "raven-barracks", name: "Raven Barracks", x: 33.7500, y: 22.0978, scale: 1.21, advantage: "1/2 price to hire Ogre Bodyguard. You can resell your weapons and armour at their purchase price.", abundance: false, hard: false, gate: false, connections: ["west-gate", "statue-of-count-gotthard", "rich-quarter", "memorial-gardens"] },
  { id: "rich-quarter", name: "Rich Quarter", x: 39.1667, y: 30.0530, scale: 1.17, advantage: "Always find the maximum amount of gold or equipment at a location on the Exploration Chart.", abundance: true, hard: true, gate: false, connections: ["raven-barracks", "statue-of-count-gotthard", "middle-bridge", "count-steinhardts-palace", "memorial-gardens"] },
  { id: "statue-of-count-gotthard", name: "Statue of Count Gotthard", x: 45.3333, y: 22.3335, scale: 0.97, advantage: "The warband's leader gains +1 Ld.", abundance: false, hard: true, gate: false, connections: ["raven-barracks", "rich-quarter", "middle-bridge", "river-gate"] },
  { id: "temple-of-morr", name: "Temple of Morr", x: 36.0000, y: 63.0524, scale: 0.78, advantage: "If a Hero's injury result is 11-15 Dead on the Heroes' Serious Injures Chart, roll a D6. On a 5+, the result becomes 41-55 Full Recovery instead.", abundance: false, hard: false, gate: false, connections: ["the-cemetery", "executioners-square", "south-gate"] },
  { id: "the-cemetery", name: "The Cemetery", x: 32.0833, y: 62.4632, scale: 0.74, advantage: "Undead warband: Zombies cost 10 gc to hire and Ghouls cost 30 gc to hire. Other warbands: The warband is immune to Fear, and Terror is treated as Fear", abundance: true, hard: true, gate: false, connections: ["the-gaol", "executioners-square", "temple-of-morr"] },
  { id: "the-gaol", name: "The Gaol", x: 26.6667, y: 51.6205, scale: 1.14, advantage: "1/2 price to hire Gaoler. If a Hero's injury result is 61 Captured on the Heroes' Serious Injures Chart, the result becomes 41-55 Full Recovery instead.", abundance: true, hard: true, gate: false, connections: ["dwarven-district", "artisan-quarter", "the-cemetery"] },
  { id: "amphitheatre", name: "Amphitheatre", x: 54.1667, y: 48.6741, scale: 1.15, advantage: "1/2 price to hire Pit Fighter. 1/2 price Net. If a Hero's injury result is 65 Sold To The Pits on the Heroes' Serious Injures Chart, they automatically win the fight.", abundance: false, hard: false, gate: false, connections: ["the-rock", "middle-bridge", "merchants-quarter", "market-square", "the-pit", "poor-quarter", "south-gate"] },
  { id: "city-hall", name: "City Hall", x: 69.5000, y: 39.4814, scale: 0.945, advantage: "During the Exploration Procedure, you may modify one dice by +1 or -1.", abundance: false, hard: true, gate: false, connections: ["market-square", "the-great-library", "temple-of-sigmar", "east-gate", "the-pit"] },
  { id: "clock-tower", name: "Clock Tower", x: 69.3750, y: 60.1061, scale: 1.125, advantage: "Always find the maximum amount of gold or equipment at a location on the Exploration Chart.", abundance: true, hard: true, gate: false, connections: ["poor-quarter", "the-pit", "sages-hall"] },
  { id: "fence-alley", name: "Fence Alley", x: 62.0833, y: 31.5262, scale: 0.97, advantage: "1/2 price Poisons and Drugs.", abundance: false, hard: true, gate: false, connections: ["merchants-quarter", "quayside", "market-square"] },
  { id: "little-moot", name: "Little Moot", x: 76.1667, y: 26.0460, scale: 0.96, advantage: "1/2 price to hire Halfling Scout. 1/2 price Halfling Cookbook.", abundance: false, hard: false, gate: false, connections: ["the-great-library", "temple-of-sigmar"] },
  { id: "merchants-quarter", name: "Merchants' Quarter", x: 53.9583, y: 37.9493, scale: 1.18, advantage: "1/2 price to hire Elf Ranger. 1/2 price Elf Bow, Elven Cloak, Ithilmar Armour and Ithilmar Weapon.", abundance: true, hard: false, gate: false, connections: ["middle-bridge", "quayside", "fence-alley", "market-square", "amphitheatre"] },
  { id: "market-square", name: "Market Square", x: 63.7500, y: 40.6600, scale: 1.18, advantage: "Add +2 on the rare items roll.", abundance: true, hard: true, gate: false, connections: ["merchants-quarter", "fence-alley", "city-hall", "the-pit", "amphitheatre"] },
  { id: "poor-quarter", name: "Poor Quarter", x: 60.4167, y: 62.4632, scale: 1.27, advantage: "Roll one extra dice in the Exploration Procedure.", abundance: false, hard: true, gate: false, connections: ["south-gate", "amphitheatre", "the-pit", "clock-tower"] },
  { id: "quayside", name: "Quayside", x: 54.5833, y: 27.6959, scale: 1.1, advantage: "Roll 3D6 for experience when recruiting for existing human Henchmen groups.", abundance: false, hard: false, gate: false, connections: ["river-gate", "the-great-library", "fence-alley", "merchants-quarter"] },
  { id: "sages-hall", name: "Sage's Hall", x: 73.9583, y: 49.3223, scale: 0.98, advantage: "1/2 price to hire Warlock. 1/2 price Tome of Magic. You may choose a spell rather than randomly generating it.", abundance: false, hard: false, gate: false, connections: ["the-pit", "east-gate", "clock-tower"] },
  { id: "temple-of-sigmar", name: "Temple of Sigmar", x: 76.2500, y: 37.5958, scale: 1.15, advantage: "If a Hero's injury result is 22-35 on the Heroes' Serious Injures Chart, roll a D6. On a 5+, the result becomes 41-55 Full Recovery instead.", abundance: false, hard: false, gate: false, connections: ["city-hall", "the-great-library", "little-moot", "east-gate"] },
  { id: "the-great-library", name: "The Great Library", x: 68.1250, y: 24.2781, scale: 1.33, advantage: "1/2 price Halfling Cookbook, Holy Tome, Mordheim Map and Tome of Magic.", abundance: false, hard: false, gate: false, connections: ["quayside", "river-gate", "little-moot", "temple-of-sigmar", "city-hall"] },
  { id: "the-pit", name: "The Pit", x: 63.5417, y: 51.6205, scale: 1.2, advantage: "During the Exploration Procedure, if a location is found, you may change the result to The Pit instead. However, Heroes are devoured on a roll of 1 or 2. Cult of the Possessed Heroes always return with the maximum amount of wyrdstone shards.", abundance: true, hard: true, gate: false, connections: ["amphitheatre", "market-square", "city-hall", "sages-hall", "clock-tower", "poor-quarter"] },
  { id: "middle-bridge", name: "Middle Bridge", x: 45.0000, y: 40.2475, scale: 0.975, advantage: "The warband that controls the bridge has installed a toll here. They gain 2D6 gc at the end of any game if another warband passes through this location to reach the battle.", abundance: true, hard: true, gate: false, connections: ["count-steinhardts-palace", "rich-quarter", "statue-of-count-gotthard", "merchants-quarter", "amphitheatre", "the-rock", "executioners-square"] },
  { id: "the-rock", name: "The Rock", x: 46.6667, y: 55.7454, scale: 1.17, advantage: "The Sisters of Sigmar wish to hide wyrdstone deep beneath Sigmar's Rock. When selling wyrdstone gain 20% more gold, always rounding down.", abundance: true, hard: false, gate: false, connections: ["middle-bridge", "amphitheatre", "south-gate"] },
  { id: "river-gate", name: "River Gate", x: 55.7083, y: 18.2086, scale: 1.10, advantage: "1/2 price to hire Luthor Wolfenbaum. A hero sent to look for Luthor automatically finds him.", abundance: false, hard: false, gate: true, connections: ["statue-of-count-gotthard", "quayside", "the-great-library"] },
  { id: "east-gate", name: "East Gate", x: 79.4583, y: 47.3188, scale: 0.8, advantage: "1/2 price to hire Luthor Wolfenbaum. A hero sent to look for Luthor automatically finds him.", abundance: false, hard: false, gate: true, connections: ["temple-of-sigmar", "city-hall", "sages-hall"] },
  { id: "south-gate", name: "South Gate", x: 52.0833, y: 64.2310, scale: 1.07, advantage: "1/2 price to hire Luthor Wolfenbaum. A hero sent to look for Luthor automatically finds him.", abundance: false, hard: false, gate: true, connections: ["temple-of-morr", "the-rock", "amphitheatre", "poor-quarter"] },
  { id: "west-gate", name: "West Gate", x: 24.3750, y: 30.7602, scale: 1.02, advantage: "1/2 price to hire Luthor Wolfenbaum. A hero sent to look for Luthor automatically finds him.", abundance: false, hard: false, gate: true, connections: ["raven-barracks", "memorial-gardens", "artisan-quarter", "dwarven-district"] },
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
