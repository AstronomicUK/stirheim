// Shop entries for gromril and ithilmar weapons, one per ordinary hand-to-hand weapon, generated
// from the melee catalogue and the engine's material variants (data/weapons/materialVariants.ts).
// The rulebook prices them at 4x / 3x the base weapon and rates them Rare 11 / Rare 9; the text of
// the generic "Gromril Weapon" / "Ithilmar Weapon" entries is carried over as a special rule.

import type { Item } from "../../types/items";
import { MELEE_WEAPONS } from "../weapons/melee";
import { isMaterialVariantBase } from "../weapons/materialVariants";
import { MELEE_ITEMS } from "./melee";

interface Material {
  prefix: "gromril" | "ithilmar";
  label: string;
  factor: number;
  rarity: number;
  rule: { name: string; text: string };
  source: Item["source"];
}

const MATERIALS: Material[] = [
  {
    prefix: "gromril",
    label: "Gromril",
    factor: 4,
    rarity: 11,
    rule: { name: "Gromril", text: "A gromril weapon has an extra -1 save modifier, and costs four times the price of a normal weapon of its kind." },
    source: { publication: "Mordheim Rulebook (core)", file: "02-weapons-armour-equipment.md:347-353" },
  },
  {
    prefix: "ithilmar",
    label: "Ithilmar",
    factor: 3,
    rarity: 9,
    rule: { name: "Ithilmar", text: "An ithilmar weapon gives its user +1 Initiative in hand-to-hand combat, and costs three times the price of a normal weapon of its kind." },
    source: { publication: "Mordheim Rulebook (core)", file: "02-weapons-armour-equipment.md:411-417" },
  },
];

const BASE_WEAPON_IDS = new Set(MELEE_WEAPONS.filter(isMaterialVariantBase).map((w) => w.id));

/** Melee catalogue entries that can be forged in gromril or ithilmar: a priced item whose weapon is an ordinary hand weapon. */
export function materialVariantBaseItems(): Item[] {
  return MELEE_ITEMS.filter((item) => item.weaponId !== undefined && BASE_WEAPON_IDS.has(item.weaponId) && item.price.base !== null && !item.price.dice && !item.superseded);
}

export function materialVariantItem(base: Item, material: Material): Item {
  const price = (base.price.base ?? 0) * material.factor;
  return {
    id: `${material.prefix}_${base.id}`,
    name: `${material.label} ${base.name}`,
    category: "melee",
    price: { base: price, text: `${price} gc (${material.factor} x ${base.price.text})` },
    availability: { kind: "rare", rarity: material.rarity, text: `Rare ${material.rarity}` },
    description: base.description,
    range: base.range,
    strength: base.strength,
    specialRules: [...base.specialRules, material.rule],
    weaponId: `${material.prefix}_${base.weaponId}`,
    source: material.source,
  };
}

export const MATERIAL_VARIANT_ITEMS: Item[] = MATERIALS.flatMap((material) => materialVariantBaseItems().map((base) => materialVariantItem(base, material)));
