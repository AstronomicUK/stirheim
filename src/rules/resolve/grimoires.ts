// The three books that teach a spell: the Tome of Magic, the Book of the Dead and the Liber
// Bubonicus. All three work the same way — a warrior who qualifies rolls on a spell table and keeps
// what he gets, permanently — and all three differ in who may read them and which table they open.
//
// Rulebook: "Each wizard starts with one randomly determined spell, but may gain more. Roll a D6 and
// consult the appropriate chart. If you get the same spell twice, roll again or lower the spell's
// difficulty by 1." (03-campaigns-magic-optional-rules.md:1447-1514.)
//
// Pure. `grimoireUses` says what a roster can do with the books it owns; `planGrimoire` applies one.

import { findItem } from "../data/items";
import { findLore } from "../data/campaign/magic";
import type { Spell, SpellLore } from "../types/magic";
import type { ResolutionEvent, RosterHero, RosterWarband } from "../types/roster";
import { loreForCaster } from "./casting";

export const GRIMOIRE_IDS = ["tome_of_magic", "book_of_the_dead", "liber_bubonicus"] as const;
export type GrimoireId = (typeof GRIMOIRE_IDS)[number];

/** Flag set on a hero who has read a Tome of Magic, so a second tome cannot benefit him twice. */
export const READ_FLAG: Record<GrimoireId, "readTomeOfMagic" | "readBookOfTheDead" | "readLiberBubonicus"> = {
  tome_of_magic: "readTomeOfMagic",
  book_of_the_dead: "readBookOfTheDead",
  liber_bubonicus: "readLiberBubonicus",
};

export interface GrimoireSource {
  loreId: string;
  loreName: string;
  /** The die the lore's table is rolled on, as written ("D6"). */
  die: string;
}

export interface GrimoireUse {
  itemId: GrimoireId;
  itemName: string;
  heroId: string;
  heroName: string;
  /** Tables this hero may roll on with this book. */
  sources: GrimoireSource[];
  /** Why he cannot use it; empty when he can. */
  blocks: string[];
  /** The book is used up (Liber Bubonicus) rather than bound to the reader. */
  consumed: boolean;
  /** Reading it makes a non-caster into one. */
  becomesCaster: boolean;
  note: string;
}

interface Owner {
  hero: RosterHero;
  /** Where the book sits: on this hero, on another warrior, or in the stash. */
  where: "carried" | "warband";
}

function heroFlag(hero: RosterHero, key: keyof RosterHero["flags"]): boolean {
  return Boolean(hero.flags[key]);
}

function isVampire(hero: RosterHero, unitName: string | undefined): boolean {
  return /vampire/i.test(`${hero.unitTemplateId} ${unitName ?? ""}`);
}

function isNecromancer(hero: RosterHero, unitName: string | undefined): boolean {
  return /necromancer/i.test(`${hero.unitTemplateId} ${unitName ?? ""}`);
}

function isPlagueOrPestilens(hero: RosterHero, unitName: string | undefined): { sorcerer: boolean; priest: boolean } {
  const haystack = `${hero.unitTemplateId} ${unitName ?? ""}`.toLowerCase();
  return { sorcerer: /pestilens.*sorcerer|sorcerer.*pestilens/.test(haystack), priest: /plague priest|plague_priest/.test(haystack) };
}

export interface GrimoireInput {
  roster: RosterWarband;
  warbandName?: string;
  /** Display name for a hero's unit, used to spot Vampires, Necromancers and Plague Priests. */
  unitNameFor?: (hero: RosterHero) => string | undefined;
  /** Books already used up in this campaign, by catalogue id (the Liber Bubonicus is once only). */
  spentInCampaign?: string[];
}

/** Every book the warband holds, matched against every hero who could read it. */
export function grimoireUses(input: GrimoireInput): GrimoireUse[] {
  const { roster } = input;
  const spent = new Set(input.spentInCampaign ?? []);
  const held = new Map<GrimoireId, Owner[]>();
  for (const id of GRIMOIRE_IDS) held.set(id, []);

  const inStash = new Set(roster.stash.map((s) => s.itemId).filter((x): x is string => typeof x === "string"));
  for (const hero of roster.heroes) {
    for (const entry of hero.equipment) {
      if (entry.itemId && (GRIMOIRE_IDS as readonly string[]).includes(entry.itemId)) held.get(entry.itemId as GrimoireId)!.push({ hero, where: "carried" });
    }
  }
  const owned = new Set<GrimoireId>([...held.entries()].filter(([, v]) => v.length > 0).map(([k]) => k));
  for (const id of GRIMOIRE_IDS) if (inStash.has(id)) owned.add(id);

  const out: GrimoireUse[] = [];
  for (const itemId of GRIMOIRE_IDS) {
    if (!owned.has(itemId)) continue;
    const itemName = findItem(itemId)?.name ?? itemId;
    for (const hero of roster.heroes) {
      const unitName = input.unitNameFor?.(hero);
      const use = readingFor(itemId, itemName, hero, unitName, input.warbandName, spent.has(itemId));
      if (use) out.push(use);
    }
  }
  return out;
}

function readingFor(itemId: GrimoireId, itemName: string, hero: RosterHero, unitName: string | undefined, warbandName: string | undefined, spentInCampaign: boolean): GrimoireUse | null {
  const lore = loreForCaster(hero, warbandName, unitName);
  const blocks: string[] = [];
  if (hero.status !== "active") blocks.push(`${hero.name} is ${hero.status}.`);
  if (heroFlag(hero, READ_FLAG[itemId])) blocks.push(`${hero.name} has already read a ${itemName}; each one benefits only one model.`);

  const base = { itemId, itemName, heroId: hero.id, heroName: hero.name, blocks, consumed: false, becomesCaster: false };

  switch (itemId) {
    case "tome_of_magic": {
      const lesser = findLore("lesser_magic");
      const arcane = hero.skillIds.includes("arcane_lore");
      if (!lore && !arcane) return null;
      const sources: GrimoireSource[] = [];
      if (lore) sources.push(source(lore));
      if (lesser && lesser.id !== lore?.id) sources.push(source(lesser));
      return {
        ...base,
        sources,
        becomesCaster: !lore,
        note: lore
          ? "A wizard gains one extra spell, permanently, rolled from his own list or from Lesser Magic."
          : "With the Arcane Lore skill, a warrior who is no wizard learns Lesser Magic from the tome.",
      };
    }
    case "book_of_the_dead": {
      const vampire = isVampire(hero, unitName);
      const necromancer = isNecromancer(hero, unitName);
      if (!vampire && !necromancer) return null;
      const necromancy = findLore("necromancy");
      if (!necromancy) return null;
      if (vampire && !hero.skillIds.includes("arcane_lore")) blocks.push("A Vampire needs the Arcane Lore skill to learn Necromantic magic from the book.");
      return {
        ...base,
        sources: [source(necromancy)],
        becomesCaster: vampire && !lore,
        note: vampire ? "A Vampire with Arcane Lore learns Necromantic magic from the book." : "A Necromancer gains a new spell, permanently.",
      };
    }
    case "liber_bubonicus": {
      const { sorcerer, priest } = isPlagueOrPestilens(hero, unitName);
      if (!sorcerer && !priest) return null;
      const horned = findLore("magic_of_the_horned_rat");
      if (!horned) return null;
      if (spentInCampaign) blocks.push("The Liber Bubonicus may be used once only, and a warband may not use more than one in a campaign.");
      if (priest && !hero.skillIds.includes("sorcerous_society_additional_academic_skills_magical_aptitude")) {
        blocks.push("A Plague Priest needs the Magical Aptitude skill to learn the magic of the Horned Rat.");
      }
      return {
        ...base,
        sources: [source(horned)],
        consumed: true,
        becomesCaster: priest,
        note: priest
          ? "A Plague Priest with Magical Aptitude becomes a spellcaster and learns one Horned Rat spell at random."
          : "A Pestilens Sorcerer permanently learns one extra spell, chosen at random from the Horned Rat list.",
      };
    }
  }
}

function source(lore: SpellLore): GrimoireSource {
  return { loreId: lore.id, loreName: lore.name, die: lore.die };
}

// ---------------------------------------------------------------------------------------------
// Reading one
// ---------------------------------------------------------------------------------------------

/** "If you get the same spell twice, roll again or lower the spell's difficulty by 1." */
export type DuplicateChoice = "rollAgain" | "lowerDifficulty";

export interface GrimoirePlan {
  /** The spell the die landed on, before any duplicate handling. */
  spell: Spell | null;
  /** He knows it already: the player has to choose between rolling again and lowering its difficulty. */
  duplicate: boolean;
  /** What is still needed before this can be applied. */
  need: "lore" | "roll" | "duplicate" | null;
  result: GrimoireResult | null;
}

export interface GrimoireResult {
  hero: RosterHero;
  roster: RosterWarband;
  events: ResolutionEvent[];
  summary: string;
}

export interface GrimoireChoices {
  loreId: string | null;
  /** The face rolled on the lore's table. */
  roll: number | null;
  duplicate: DuplicateChoice | null;
}

export function emptyGrimoireChoices(): GrimoireChoices {
  return { loreId: null, roll: null, duplicate: null };
}

/** The spell a face on a lore's table gives; a band can cover two spells, and then the first is taken. */
export function spellForRoll(lore: SpellLore, roll: number): Spell | undefined {
  return lore.spells.find((s) => roll >= s.roll.min && roll <= s.roll.max);
}

/** Work out what reading `use` does, or what is still needed. */
export function planGrimoire(roster: RosterWarband, use: GrimoireUse, choices: GrimoireChoices): GrimoirePlan {
  const empty: GrimoirePlan = { spell: null, duplicate: false, need: null, result: null };
  const hero = roster.heroes.find((h) => h.id === use.heroId);
  if (!hero || use.blocks.length > 0) return { ...empty, need: null };

  const loreId = choices.loreId ?? (use.sources.length === 1 ? use.sources[0].loreId : null);
  if (!loreId) return { ...empty, need: "lore" };
  const lore = findLore(loreId);
  if (!lore) return { ...empty, need: "lore" };
  if (choices.roll === null || choices.roll < 1) return { ...empty, need: "roll" };

  const spell = spellForRoll(lore, choices.roll);
  if (!spell) return { ...empty, need: "roll" };
  const duplicate = hero.spellIds.includes(spell.id);
  if (duplicate && choices.duplicate === null) return { spell, duplicate, need: "duplicate", result: null };
  if (duplicate && choices.duplicate === "rollAgain") return { spell, duplicate, need: "roll", result: null };

  const lowered = duplicate && choices.duplicate === "lowerDifficulty";
  const notes = [
    hero.notes,
    lowered
      ? `${spell.name} rolled a second time from the ${use.itemName}: its Difficulty is lowered by 1.`
      : `${spell.name} learned from the ${use.itemName}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const nextHero: RosterHero = {
    ...hero,
    spellIds: lowered ? hero.spellIds : [...hero.spellIds, spell.id],
    flags: { ...hero.flags, [READ_FLAG[use.itemId]]: true },
    notes,
    // The Liber Bubonicus is used up; the other two stay on the roster, bound to their reader.
    equipment: use.consumed ? removeOne(hero.equipment, use.itemId) : hero.equipment,
  };

  // Only one copy is spent, wherever it sits: the reader first, then another warrior, then the stash.
  let spentElsewhere = use.consumed && nextHero.equipment.length === hero.equipment.length && !hero.equipment.some((e) => e.itemId === use.itemId);
  const heroes = roster.heroes.map((h) => {
    if (h.id === nextHero.id) return nextHero;
    if (!spentElsewhere) return h;
    const stripped = removeOne(h.equipment, use.itemId);
    if (stripped === h.equipment) return h;
    spentElsewhere = false;
    return { ...h, equipment: stripped };
  });
  const nextRoster: RosterWarband = { ...roster, heroes, stash: spentElsewhere ? removeOne(roster.stash, use.itemId) : roster.stash };

  const events: ResolutionEvent[] = [
    {
      kind: "spellGained",
      subjectId: hero.id,
      message: lowered
        ? `${hero.name} reads the ${use.itemName} and finds ${spell.name} again: its Difficulty drops by 1.`
        : `${hero.name} learns ${spell.name} (${lore.name}) from the ${use.itemName}.`,
      data: { spellId: spell.id, loreId: lore.id },
    },
  ];
  if (use.becomesCaster) events.push({ kind: "note", subjectId: hero.id, message: `${hero.name} is now a spellcaster and may cast from ${lore.name}.` });
  if (use.consumed) events.push({ kind: "itemLost", subjectId: hero.id, message: `The ${use.itemName} is spent and may not be used again this campaign.`, data: { itemId: use.itemId } });

  return {
    spell,
    duplicate,
    need: null,
    result: {
      hero: nextHero,
      roster: nextRoster,
      events,
      summary: lowered ? `${spell.name} rolled again: Difficulty lowered by 1.` : `${hero.name} learns ${spell.name}.`,
    },
  };
}

function removeOne<T extends { itemId: string | null; quantity: number }>(list: T[], itemId: string): T[] {
  const idx = list.findIndex((i) => i.itemId === itemId);
  if (idx === -1) return list;
  const entry = list[idx];
  if (entry.quantity > 1) return list.map((i, n) => (n === idx ? { ...i, quantity: i.quantity - 1 } : i));
  return list.filter((_, n) => n !== idx);
}

/** Lores a warband could open with the books it holds, for the help text. */
export function describeGrimoires(uses: GrimoireUse[]): string {
  const names = [...new Set(uses.map((u) => u.itemName))];
  if (names.length === 0) return "";
  return names.length === 1 ? `The ${names[0]} is unread.` : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are unread.`;
}
