import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ANIMAL_ITEMS,
  ARMOUR_ITEMS,
  BLACKPOWDER_ITEMS,
  ITEMS,
  MELEE_ITEMS,
  MISC_ITEMS,
  MISSILE_ITEMS,
  findItem,
  itemsByCategory,
} from "../items";
import { MELEE_WEAPONS } from "../weapons/melee";
import { RANGED_AND_CREATURE_WEAPONS } from "../weapons/ranged-and-creatures";
import { MATERIAL_VARIANT_WEAPONS, isMaterialVariantBase } from "../weapons/materialVariants";
import { WARBAND_SPECIAL_WEAPONS } from "../weapons/warbandSpecial";
import { WARBAND_SPECIAL_ITEMS } from "../items/warbandSpecial";
import { MATERIAL_VARIANT_ITEMS } from "../items/materialVariants";
import { SHOP_ITEMS } from "../items";
import type { ItemCategory } from "../../types/items";

const CATEGORIES: ItemCategory[] = ["melee", "missile", "blackpowder", "armour", "misc", "animal"];

/** Number of "### " item headings in the source Markdown (includes a few sub-section intros). */
function countSourceHeadings(): number {
  const md = readFileSync(join(process.cwd(), "reference/rules/02-weapons-armour-equipment.md"), "utf8");
  return md.split("\n").filter((line) => line.startsWith("### ")).length;
}

describe("item catalogue", () => {
  it("has unique ids and well-formed entries", () => {
    const ids = new Set<string>();
    for (const item of ITEMS) {
      expect(ids.has(item.id), `duplicate item id ${item.id}`).toBe(false);
      ids.add(item.id);
      expect(item.id, `${item.name}: id not snake_case`).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*$/);
      expect(item.name.length, `${item.id}: empty name`).toBeGreaterThan(0);
      // A handful of source entries (e.g. Lantern, Broadsword, Rowboat) have no prose paragraph at
      // all — only SPECIAL RULES bullets — so the description is kept verbatim-empty for those.
      expect(
        item.description.length > 0 || item.specialRules.length > 0,
        `${item.id}: no description and no special rules`,
      ).toBe(true);
      expect(CATEGORIES, `${item.id}: bad category ${item.category}`).toContain(item.category);
      expect(item.price.text.length, `${item.id}: empty price text`).toBeGreaterThan(0);
      expect(item.availability.text.length, `${item.id}: empty availability text`).toBeGreaterThan(0);
      expect(item.source.publication.length, `${item.id}: empty publication`).toBeGreaterThan(0);
      expect(item.source.file, `${item.id}: bad source file ref`).toMatch(/^(02-weapons-armour-equipment|03-campaigns-magic-optional-rules|warbands\/[0-9a-z-]+)\.md:\d+-\d+$/);
      for (const rule of item.specialRules) {
        expect(rule.name.length, `${item.id}: unnamed special rule`).toBeGreaterThan(0);
      }
    }
  });

  it("has the expected number of items per category", () => {
    expect(MELEE_ITEMS.length).toBe(65);
    expect(MISSILE_ITEMS.length).toBe(22);
    expect(BLACKPOWDER_ITEMS.length).toBe(17);
    expect(ARMOUR_ITEMS.length).toBe(18);
    // 116 after #66 added the Jewelsmith's four gems plus the Alchemist's Notebook and Training
    // Manual — exploration-chart treasures that used to land as untyped, unpriced stash lines.
    expect(MISC_ITEMS.length).toBe(116);
    expect(ANIMAL_ITEMS.length).toBe(14);
    // 72 after #44 excluded 14 improvised/ritual objects (a Gromril Ladle and its kin) from the
    // material-variant generator; the floor here is a loose sanity check, not an exact count.
    expect(MATERIAL_VARIANT_ITEMS.length).toBeGreaterThan(65);
    expect(WARBAND_SPECIAL_ITEMS.length).toBe(40);
    expect(ITEMS.length).toBe(252 + WARBAND_SPECIAL_ITEMS.length + MATERIAL_VARIANT_ITEMS.length);
    for (const category of CATEGORIES) {
      for (const item of itemsByCategory(category)) expect(item.category).toBe(category);
    }
    expect(itemsByCategory("armour")).toEqual(ITEMS.filter((i) => i.category === "armour"));
  });

  it("covers at least 90% of the ### headings in the source Markdown", () => {
    const headings = countSourceHeadings();
    expect(headings).toBeGreaterThan(0);
    expect(ITEMS.length / headings).toBeGreaterThanOrEqual(0.9);
  });

  it("spot-checks well-known entries against the source", () => {
    const sword = findItem("sword")!;
    expect(sword.price).toEqual({ base: 10, text: "10 gc" });
    expect(sword.availability.kind).toBe("common");
    expect(sword.weaponId).toBe("sword");

    const lightArmour = findItem("light_armour")!;
    expect(lightArmour.category).toBe("armour");
    expect(lightArmour.price.base).toBe(20);
    expect(lightArmour.availability.kind).toBe("common");
    expect(lightArmour.armourSave).toBe(6);

    const gromril = findItem("gromril_armour")!;
    expect(gromril.price.base).toBe(150);
    expect(gromril.availability).toEqual({ kind: "rare", rarity: 11, text: "Rare 11" });
    expect(gromril.armourSave).toBe(4);

    const dwarfAxe = findItem("dwarf_axe")!;
    expect(dwarfAxe.price.base).toBe(15);
    expect(dwarfAxe.availability).toEqual({ kind: "rare", rarity: 8, restriction: "Dwarfs only", text: "Rare 8 (Dwarfs only)" });
    expect(dwarfAxe.weaponId).toBe("dwarf_axe");

    // Source writes the variable part as "D6 x 10".
    const elvenCloak = findItem("elven_cloak")!;
    expect(elvenCloak.price).toEqual({ base: 100, dice: "D6 x 10", text: "100 + D6 x 10 gc" });

    const dagger = findItem("dagger")!;
    expect(dagger.price.text).toContain("1st free");
    expect(dagger.price.base).toBe(2);

    // Items with no Cost line in the source.
    expect(findItem("fist")!.price).toEqual({ base: null, text: "Not listed" });
    // Material upgrades priced relative to the base weapon.
    expect(findItem("gromril_weapon")!.price).toEqual({ base: null, text: "4 x Price" });
    expect(findItem("gromril_weapon")!.superseded).toBe(true);
    expect(SHOP_ITEMS.some((i) => i.id === "gromril_weapon")).toBe(false);
  });

  it("offers gromril and ithilmar variants of every ordinary hand weapon, priced and linked to the engine", () => {
    const axe = findItem("gromril_axe")!;
    expect(axe).toMatchObject({ name: "Gromril Axe", category: "melee", weaponId: "gromril_axe", availability: { kind: "rare", rarity: 11 } });
    expect(axe.price.base).toBe(5 * 4);
    expect(axe.specialRules.map((r) => r.name)).toEqual(["Cutting Edge", "Gromril"]);
    const sword = findItem("ithilmar_sword")!;
    expect(sword.price.base).toBe(10 * 3);
    expect(sword.availability.rarity).toBe(9);
    // Paired specials, fists and fixed-Strength weapons are not forged in gromril.
    expect(findItem("gromril_fighting_claws")).toBeUndefined();
    expect(findItem("gromril_fist")).toBeUndefined();
    // Nor is a weapon that is itself already a material (#34: a Gromril Obsidian Weapon would be a
    // weapon made of two materials), an upgrade applied to another weapon rather than a weapon in
    // its own right (Dark Elf Blade, +20 gc; Sons of Hashut Obsidian Weapon, "applied to which
    // weapon?"), a "pick one of these" placeholder (Club, Mace or Hammer), the free dagger (its
    // "1st free/2 gc" price text has no sane 4x/3x), or an improvised/ritual object rather than a
    // forged weapon (#44: a Gromril Ladle is legal by the letter of the rule and absurd in practice).
    for (const id of [
      "obsidian_weapon",
      "sons_of_hashut_obsidian_weapon",
      "dark_elf_blade",
      "club_mace_or_hammer",
      "dagger",
      "ladle",
      "kitchen_knife",
      "censer",
      "brazier_iron",
      "boat_hook",
      "cat_o_nine_tails",
      "boss_pole",
    ]) {
      const weapon = MELEE_WEAPONS.find((w) => w.id === id)!;
      expect(isMaterialVariantBase(weapon), `${id} should not be a material-variant base`).toBe(false);
      expect(findItem(`gromril_${id}`), `gromril_${id} should not exist`).toBeUndefined();
      expect(findItem(`ithilmar_${id}`), `ithilmar_${id} should not exist`).toBeUndefined();
    }
    for (const item of MATERIAL_VARIANT_ITEMS) {
      expect(MATERIAL_VARIANT_WEAPONS.some((w) => w.id === item.weaponId), `${item.id}: no engine weapon ${item.weaponId}`).toBe(true);
    }
    // Two "Pike" entries kept distinct.
    expect(findItem("pike_tileans")!.weaponId).toBe("pike_tileans");
    expect(findItem("pike_merchant_caravans")!.weaponId).toBe("pike_merchant_caravans");
    // Range/strength kept verbatim.
    expect(findItem("bow")!.range).toBe('24"');
    expect(findItem("axe")!.strength).toBe("As user");
    expect(findItem("axe")!.specialRules[0].name).toBe("Cutting Edge");
  });

  it("links every weaponId to an entry in the weapons database", () => {
    const weaponIds = new Set(
      [...MELEE_WEAPONS, ...RANGED_AND_CREATURE_WEAPONS, ...MATERIAL_VARIANT_WEAPONS, ...WARBAND_SPECIAL_WEAPONS].map((w) => w.id),
    );
    let linked = 0;
    for (const item of ITEMS) {
      if (item.weaponId === undefined) continue;
      linked++;
      expect(weaponIds.has(item.weaponId), `${item.id}: unknown weaponId ${item.weaponId}`).toBe(true);
    }
    expect(linked).toBeGreaterThan(90);
  });

  it("only sets armourSave on armour, from a stated N+ save", () => {
    for (const item of ITEMS) {
      if (item.armourSave === undefined) continue;
      expect(item.category, `${item.id}: armourSave outside armour`).toBe("armour");
      expect(item.armourSave).toBeGreaterThanOrEqual(2);
      expect(item.armourSave).toBeLessThanOrEqual(6);
    }
    expect(findItem("heavy_armour")!.armourSave).toBe(5);
    expect(findItem("barding")!.armourSave).toBeUndefined(); // "+1 to existing save"
  });
});
