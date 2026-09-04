import { describe, expect, it } from "vitest";
import { findItem } from "../../data/items";
import {
  EQUIPMENT_ALIASES,
  equipmentListNames,
  resolveEquipmentName,
  unresolvedEquipmentNames,
} from "../../data/items/aliases";

/**
 * Equipment-list names with no catalogue item. These are warband-specific weapons and bundles that
 * data/items does not (yet) describe; the builder keeps them as customName items at the list price.
 * If you add a catalogue entry or an alias, remove the name here.
 */
const KNOWN_UNRESOLVED = [
  "Bearcloak",
  "Beastwhip (Packmaster or Apprentices only)",
  "Boar Spear (Aristocrat only)",
  "Bone Helmet",
  "Bone Helmet (Skink Priest only)",
  "Cathayan Quilted Silk Armour",
  "Chaos Style — Helmet; Dagger; Flail; Shield; Light armour",
  "Chest Talon",
  "Darksteel blade",
  "Draich",
  "Empire Style — Helmet; Dagger; Double-handed Weapon; Light armour",
  "Hedonist Whip (Heroes only)",
  "Horo",
  "Kanabo",
  "Katana",
  "Kusarigama",
  "Orc Style — Helmet; Dagger; Axe; Shield",
  "Pebble",
  "Pebble (fixed, x1, included)",
  "Pry Bar",
  "Sashimono",
  "Scythe",
  "Sharp Stuff",
  "Shield of Sigmar (Heroes only)",
  "Shield/Buckler",
  "Silver-tip Stake",
  "Skink Style — Helmet; Dagger; Trident or Javelins; Net or Buckler",
  "Slaaneshi Man-Catcher (Whipmaster only)",
  "Slingshot",
  "Staff",
  "Thingcatcher (Packmaster or Apprentices only)",
  "Undead Style — Helmet; Dagger; Spiked Gauntlet; Sword",
  "Whirling Blades",
  "Witch Elf Style — Helmet; Dagger; 2 x Sword or Spear & Net",
  "Wizard's Staff",
];

describe("resolveEquipmentName", () => {
  it("matches catalogue names exactly, ignoring case", () => {
    expect(resolveEquipmentName("Sword")?.id).toBe("sword");
    expect(resolveEquipmentName("light armour")?.id).toBe("light_armour");
    expect(resolveEquipmentName("  Double-handed weapon ")?.id).toBe("double_handed_weapon");
    // An exact name wins even when a bracket-stripped form would find a different entry.
    expect(resolveEquipmentName("Sunstaff (Lustria)")?.name).toBe("Sunstaff (Lustria)");
    expect(resolveEquipmentName("Sunstaff")?.name).toBe("Sunstaff");
  });

  it("normalises spacing, punctuation, plurals and bracketed restrictions", () => {
    expect(resolveEquipmentName("Long bow")?.id).toBe("longbow");
    expect(resolveEquipmentName("Shortbow")?.id).toBe("short_bow");
    expect(resolveEquipmentName("Blow Pipe")?.id).toBe("blowpipe");
    expect(resolveEquipmentName("Ball & Chain")?.id).toBe("ball_and_chain");
    expect(resolveEquipmentName("Belaying Pin")?.id).toBe("belaying_pins");
    expect(resolveEquipmentName("Pistols")?.id).toBe("pistol");
    expect(resolveEquipmentName("Javelin")?.id).toBe("javelins");
    expect(resolveEquipmentName("Superior Black Powder")?.id).toBe("superior_blackpowder");
    expect(resolveEquipmentName("Sea Dragon Cloak (Heroes and Corsairs only)")?.id).toBe("sea_dragon_cloak");
    expect(resolveEquipmentName("Bow [may not be used by Halfling Warriors]")?.id).toBe("bow");
    expect(resolveEquipmentName("Nehekharan Javelin (Tomb Lords only)")?.id).toBe("nehekharan_javelins");
    expect(resolveEquipmentName("Cat O' Nine Tails (Heroes only)")?.id).toBe("cat_o_nine_tails");
    expect(resolveEquipmentName("Swivel Gun (Rare 8; one per Warband)")?.id).toBe("swivel_gun");
  });

  it("uses the alias table for renamed items", () => {
    expect(resolveEquipmentName("Cutlass (Sword)")?.id).toBe("sword");
    expect(resolveEquipmentName("cutlass (sword)")?.id).toBe("sword");
    expect(resolveEquipmentName("Two-handed weapon")?.id).toBe("double_handed_weapon");
    expect(resolveEquipmentName("Hochland Long Rifle")?.id).toBe("hunting_rifle");
    expect(resolveEquipmentName("Mace/Hammer")?.id).toBe("club_mace_or_hammer");
    expect(resolveEquipmentName("Choppa (Counts as a Morning star)")?.id).toBe("morning_star");
    expect(resolveEquipmentName("Cleaver (counts as axe)")?.id).toBe("axe");
    expect(resolveEquipmentName("Throwing Knives")?.id).toBe("throwing_knives_stars");
    expect(resolveEquipmentName("Throwing Axes (same as Throwing Knives)")?.id).toBe("throwing_knives_stars");
    expect(resolveEquipmentName("Pike")?.id).toBe("pike_tileans");
    expect(resolveEquipmentName("Pike (Sell-swords only)")?.id).toBe("pike_merchant_caravans");
    expect(resolveEquipmentName("Horse")?.id).toBe("riding_draft_horse");
  });

  it("returns undefined for blanks and warband-specific gear", () => {
    expect(resolveEquipmentName("")).toBeUndefined();
    expect(resolveEquipmentName("   ")).toBeUndefined();
    expect(resolveEquipmentName("Katana")).toBeUndefined();
    expect(resolveEquipmentName("Pry Bar")).toBeUndefined();
  });

  it("every alias points at a real catalogue item", () => {
    for (const [name, id] of Object.entries(EQUIPMENT_ALIASES)) {
      expect(findItem(id), `${name} -> ${id}`).toBeDefined();
    }
  });
});

describe("equipment-list coverage", () => {
  it("collects every distinct name across the templates", () => {
    const names = equipmentListNames();
    expect(names.length).toBeGreaterThan(200);
    expect(names).toContain("Dagger");
    expect(names).toContain("Long bow");
    expect(new Set(names).size).toBe(names.length);
  });

  it("leaves only the known warband-specific names unresolved", () => {
    const unresolved = unresolvedEquipmentNames();
    expect(unresolved.length).toBeLessThanOrEqual(KNOWN_UNRESOLVED.length);
    expect(unresolved).toEqual(KNOWN_UNRESOLVED.filter((n) => unresolved.includes(n)));
    const surprises = unresolved.filter((n) => !KNOWN_UNRESOLVED.includes(n));
    expect(surprises).toEqual([]);
  });

  it("resolves at least 85% of equipment-list names", () => {
    const total = equipmentListNames().length;
    const resolved = total - unresolvedEquipmentNames().length;
    expect(resolved / total).toBeGreaterThanOrEqual(0.85);
  });
});
