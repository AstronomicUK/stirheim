// Warband builder — the pure model behind the "create a warband" screen. A WarbandDraft is the
// player's work in progress: a template, a name, heroes, henchman groups and the starting equipment
// bought for each from that unit's equipment list. It converts to a RosterWarband for validation and
// rating, and to a snake_case CreateWarbandPayload for the create_warband SQL function.
//
// Rule judgements:
//   - Starting gold is the template's composition.startingGold, defaulting to the rulebook's 500.
//   - The mandatory leader (first hero template with a minimum of 1 — see roster.leaderTemplate) is
//     added on creation with the unit name as a placeholder name.
//   - Hire costs are UnitTemplate.cost (null = 0: warband-supplied units such as Snotling Wheelos).
//   - Henchman group equipment is one member's kit; every model carries the same, so the group pays
//     size x the per-model line and each model gets its own free dagger where the list says
//     "1st free". The roster and payload carry the group total (quantity x size).
//   - Equipment stacks of the same item merge (the same catalogue item, or the same custom name), so
//     "1st free" only ever applies once per warrior per item.
//   - A DraftItem's `unitCost` starts as the parsed list price and can be overridden by the player
//     (setDraftEquipmentCost) — needed for "3 times the cost" / "2 x price" lines, which have no
//     price of their own. A line with a null cost is a `builder.unknownCost` problem, not a crash.
//   - Roster limits are *not* enforced while editing (players add and remove freely); validateDraft
//     reports every problem via validateRoster(atCreation) plus the builder's own checks.
//   - isLarge comes from the unit's special rules: any rule named "Large", "Large Target" or "Large
//     Monster" (case-insensitive "large") marks the warrior as a large creature for rating.

import type { Stats, UnitTemplate, WarbandTemplate } from "../types";
import type { Item } from "../types/items";
import type { RosterHenchmanGroup, RosterHero, RosterItem, RosterWarband } from "../types/roster";
import { findItem } from "../data/items";
import { resolveEquipmentName } from "../data/items/aliases";
import { findEquipmentList, findUnitTemplate } from "../data/warbandTemplates";
import { equipmentLineCost, parseEquipmentCost, type EquipmentCost } from "./equipmentCost";
import { advancesEarned } from "../data/campaign/experience";
import { RulesError } from "./errors";
import { leaderTemplate, validateRoster, type RosterProblem } from "./roster";

// ---- Draft model ----

export interface DraftItem {
  itemId: string | null;
  /** The equipment-list name when the item has no catalogue entry. */
  customName?: string;
  quantity: number;
  /** Price of one copy as the builder understands it; null until the player supplies one. */
  unitCost: number | null;
  /** The equipment list's cost string, verbatim, so pricing rules (first free, brace) still apply. */
  costText: string;
}

export interface DraftHero {
  id: string;
  name: string;
  unitTemplateId: string;
  equipment: DraftItem[];
}

export interface DraftGroup {
  id: string;
  name: string;
  unitTemplateId: string;
  size: number;
  /** Per model — every member of the group carries the same kit. */
  equipment: DraftItem[];
}

export interface WarbandDraft {
  name: string;
  warbandTemplateId: string;
  startingGold: number;
  heroes: DraftHero[];
  groups: DraftGroup[];
  notes: string;
}

export type DraftSubject = { kind: "hero" | "group"; id: string };

export interface EquipmentOption {
  /** The name as written in the equipment list. */
  name: string;
  cost: EquipmentCost;
  /** The catalogue item, when the name resolves to one. */
  item: Item | undefined;
  section: "melee" | "missile" | "armour";
}

/** The rulebook default when a template does not state its starting treasury. */
export const DEFAULT_STARTING_GOLD = 500;

/** Default id for the leader hero created by newWarbandDraft. */
export const DEFAULT_LEADER_ID = "leader";

// ---- Units ----

function requireUnit(template: WarbandTemplate, unitTemplateId: string): UnitTemplate {
  const unit = findUnitTemplate(template, unitTemplateId);
  if (!unit) throw new RulesError("builder.unknownUnit", `"${unitTemplateId}" is not a unit type in ${template.name}`);
  return unit;
}

function requireHero(draft: WarbandDraft, id: string): DraftHero {
  const hero = draft.heroes.find((h) => h.id === id);
  if (!hero) throw new RulesError("builder.unknownHero", `No hero with id "${id}" in the draft`);
  return hero;
}

function requireGroup(draft: WarbandDraft, id: string): DraftGroup {
  const group = draft.groups.find((g) => g.id === id);
  if (!group) throw new RulesError("builder.unknownGroup", `No henchman group with id "${id}" in the draft`);
  return group;
}

function assertNewId(draft: WarbandDraft, id: string): void {
  if (draft.heroes.some((h) => h.id === id) || draft.groups.some((g) => g.id === id)) {
    throw new RulesError("builder.duplicateId", `A warrior or group with id "${id}" already exists in the draft`);
  }
}

function assertSize(size: number): void {
  if (!Number.isInteger(size) || size < 1) {
    throw new RulesError("builder.invalidSize", `A henchman group needs at least one member (got ${size})`);
  }
}

/** Start a draft for `template`: starting gold from the template (or 500) and the mandatory leader. */
export function newWarbandDraft(template: WarbandTemplate, name: string, leaderId = DEFAULT_LEADER_ID): WarbandDraft {
  const leader = leaderTemplate(template);
  const draft: WarbandDraft = {
    name,
    warbandTemplateId: template.id,
    startingGold: template.composition?.startingGold ?? DEFAULT_STARTING_GOLD,
    heroes: [],
    groups: [],
    notes: "",
  };
  return leader ? addDraftHero(draft, template, leader.id, leaderId) : draft;
}

/** Add a hero of `unitTemplateId`; the name defaults to the unit name. Limits are checked by validateDraft, not here. */
export function addDraftHero(
  draft: WarbandDraft,
  template: WarbandTemplate,
  unitTemplateId: string,
  id: string,
  name?: string,
): WarbandDraft {
  const unit = requireUnit(template, unitTemplateId);
  if (unit.role !== "hero") throw new RulesError("builder.notAHero", `${unit.name} are henchmen; use addDraftGroup`);
  assertNewId(draft, id);
  const hero: DraftHero = { id, name: name ?? unit.name, unitTemplateId: unit.id, equipment: [] };
  return { ...draft, heroes: [...draft.heroes, hero] };
}

export function removeDraftHero(draft: WarbandDraft, id: string): WarbandDraft {
  requireHero(draft, id);
  return { ...draft, heroes: draft.heroes.filter((h) => h.id !== id) };
}

export function renameDraftHero(draft: WarbandDraft, id: string, name: string): WarbandDraft {
  requireHero(draft, id);
  return { ...draft, heroes: draft.heroes.map((h) => (h.id === id ? { ...h, name } : h)) };
}

/** Add a henchman group of `size` models of `unitTemplateId`; the name defaults to the unit name. */
export function addDraftGroup(
  draft: WarbandDraft,
  template: WarbandTemplate,
  unitTemplateId: string,
  id: string,
  size: number,
  name?: string,
): WarbandDraft {
  const unit = requireUnit(template, unitTemplateId);
  if (unit.role !== "henchman") throw new RulesError("builder.notAHenchman", `${unit.name} is a hero; use addDraftHero`);
  assertNewId(draft, id);
  assertSize(size);
  const group: DraftGroup = { id, name: name ?? unit.name, unitTemplateId: unit.id, size, equipment: [] };
  return { ...draft, groups: [...draft.groups, group] };
}

export function setDraftGroupSize(draft: WarbandDraft, id: string, size: number): WarbandDraft {
  requireGroup(draft, id);
  assertSize(size);
  return { ...draft, groups: draft.groups.map((g) => (g.id === id ? { ...g, size } : g)) };
}

/**
 * Give a just-added unit the dagger its equipment list offers free ("Dagger ... 1st free"). Does
 * nothing when the list has no such line or the unit already carries something, so calling it
 * twice, or on a unit the player has already kitted out, changes nothing.
 */
export function withFreeDagger(draft: WarbandDraft, template: WarbandTemplate, subject: DraftSubject): WarbandDraft {
  const unitTemplateId = subject.kind === "hero" ? requireHero(draft, subject.id).unitTemplateId : requireGroup(draft, subject.id).unitTemplateId;
  if (readEquipment(draft, subject).length > 0) return draft;
  const option = equipmentOptionsFor(template, unitTemplateId).find(
    (candidate) => candidate.cost.kind === "firstFree" && (candidate.item?.id === "dagger" || /^dagger$/i.test(candidate.name)),
  );
  return option ? addDraftEquipment(draft, subject, option, 1) : draft;
}

export function removeDraftGroup(draft: WarbandDraft, id: string): WarbandDraft {
  requireGroup(draft, id);
  return { ...draft, groups: draft.groups.filter((g) => g.id !== id) };
}

export function renameDraftGroup(draft: WarbandDraft, id: string, name: string): WarbandDraft {
  requireGroup(draft, id);
  return { ...draft, groups: draft.groups.map((g) => (g.id === id ? { ...g, name } : g)) };
}

// ---- Equipment ----

/** What a unit may buy at creation: its equipment list, priced and resolved against the catalogue. */
export function equipmentOptionsFor(template: WarbandTemplate, unitTemplateId: string): EquipmentOption[] {
  const unit = requireUnit(template, unitTemplateId);
  const list = findEquipmentList(template, unit.equipmentListId);
  if (!list) return [];
  const section = (entries: { name: string; cost: string }[], kind: EquipmentOption["section"]) =>
    entries.map((entry) => ({
      name: entry.name,
      cost: parseEquipmentCost(entry.cost),
      item: resolveEquipmentName(entry.name),
      section: kind,
    }));
  const melee = section(list.meleeWeapons, "melee");
  return [
    ...melee.flatMap((option) => (option.item?.superseded ? materialVariantOptions(option, melee) : [option])),
    ...section(list.missileWeapons, "missile"),
    ...section(list.armour, "armour"),
  ];
}

/**
 * "Gromril weapon ... 4 x price" on a list means: any hand weapon on this list, forged in gromril.
 * Offer one option per such weapon (Gromril Axe, Gromril Sword...), priced from the list's own
 * figure for the base weapon. A list entry whose base has no fixed price stays unpriced.
 */
function materialVariantOptions(generic: EquipmentOption, melee: EquipmentOption[]): EquipmentOption[] {
  const prefix = generic.item?.id === "ithilmar_weapon" ? "ithilmar" : "gromril";
  const factor = generic.cost.multiplier ?? (prefix === "ithilmar" ? 3 : 4);
  const out: EquipmentOption[] = [];
  for (const base of melee) {
    if (!base.item || base.item.superseded) continue;
    const variant = findItem(`${prefix}_${base.item.id}`);
    if (!variant) continue;
    const amount = base.cost.kind === "fixed" || base.cost.kind === "firstFree" ? base.cost.amount : null;
    out.push({
      name: variant.name,
      cost: amount === null ? { ...generic.cost, kind: "unknown" } : { kind: "fixed", amount: amount * factor, currency: base.cost.currency, text: `${amount * factor} gc (${factor} x ${base.cost.text})` },
      item: variant,
      section: "melee",
    });
  }
  return out.length > 0 ? out : [generic];
}

/** The per-copy price the builder can read off a list cost; null for multiplier/unknown kinds. */
function unitCostOf(cost: EquipmentCost): number | null {
  switch (cost.kind) {
    case "free":
    case "included":
      return 0;
    case "fixed":
    case "firstFree":
      return cost.amount;
    case "multiplier":
    case "unknown":
      return null;
  }
}

function draftItemFromOption(option: EquipmentOption, quantity: number): DraftItem {
  return {
    itemId: option.item?.id ?? null,
    customName: option.item ? undefined : option.name,
    quantity,
    unitCost: unitCostOf(option.cost),
    costText: option.cost.text,
  };
}

function sameStack(a: DraftItem, b: { itemId: string | null; customName?: string }): boolean {
  if (a.itemId !== null || b.itemId !== null) return a.itemId === b.itemId;
  return (a.customName ?? "") === (b.customName ?? "");
}

function readEquipment(draft: WarbandDraft, subject: DraftSubject): DraftItem[] {
  return subject.kind === "hero" ? requireHero(draft, subject.id).equipment : requireGroup(draft, subject.id).equipment;
}

function writeEquipment(draft: WarbandDraft, subject: DraftSubject, equipment: DraftItem[]): WarbandDraft {
  if (subject.kind === "hero") {
    return { ...draft, heroes: draft.heroes.map((h) => (h.id === subject.id ? { ...h, equipment } : h)) };
  }
  return { ...draft, groups: draft.groups.map((g) => (g.id === subject.id ? { ...g, equipment } : g)) };
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RulesError("builder.invalidQuantity", `Quantity must be a whole number of at least 1 (got ${quantity})`);
  }
}

/** Buy `quantity` of an option for a hero (each) or a group (per model). Same-item stacks merge. */
export function addDraftEquipment(
  draft: WarbandDraft,
  subject: DraftSubject,
  option: EquipmentOption,
  quantity = 1,
): WarbandDraft {
  assertQuantity(quantity);
  const current = readEquipment(draft, subject);
  const incoming = draftItemFromOption(option, quantity);
  const idx = current.findIndex((stack) => sameStack(stack, incoming));
  const next =
    idx === -1
      ? [...current, incoming]
      : current.map((stack, n) => (n === idx ? { ...stack, quantity: stack.quantity + quantity } : stack));
  return writeEquipment(draft, subject, next);
}

/** Put back `quantity` of an option (default 1); a stack that reaches zero is removed. */
export function removeDraftEquipment(
  draft: WarbandDraft,
  subject: DraftSubject,
  option: EquipmentOption,
  quantity = 1,
): WarbandDraft {
  assertQuantity(quantity);
  const current = readEquipment(draft, subject);
  const key = draftItemFromOption(option, quantity);
  const idx = current.findIndex((stack) => sameStack(stack, key));
  if (idx === -1) {
    throw new RulesError("builder.notEquipped", `${subjectLabel(draft, subject)} has no ${option.name} to remove`);
  }
  const next = current
    .map((stack, n) => (n === idx ? { ...stack, quantity: stack.quantity - quantity } : stack))
    .filter((stack) => stack.quantity > 0);
  return writeEquipment(draft, subject, next);
}

/** Record the price the player agreed for a line whose list cost is unknown ("3 times the cost"), or override a listed one. */
export function setDraftEquipmentCost(
  draft: WarbandDraft,
  subject: DraftSubject,
  option: EquipmentOption,
  unitCost: number | null,
): WarbandDraft {
  if (unitCost !== null && (!Number.isInteger(unitCost) || unitCost < 0)) {
    throw new RulesError("builder.invalidPrice", `Price must be a whole number of at least 0 (got ${unitCost})`);
  }
  const current = readEquipment(draft, subject);
  const key = draftItemFromOption(option, 1);
  if (!current.some((stack) => sameStack(stack, key))) {
    throw new RulesError("builder.notEquipped", `${subjectLabel(draft, subject)} has no ${option.name} to price`);
  }
  return writeEquipment(
    draft,
    subject,
    current.map((stack) => (sameStack(stack, key) ? { ...stack, unitCost } : stack)),
  );
}

function subjectLabel(draft: WarbandDraft, subject: DraftSubject): string {
  const found =
    subject.kind === "hero" ? draft.heroes.find((h) => h.id === subject.id) : draft.groups.find((g) => g.id === subject.id);
  return found?.name || subject.id;
}

function itemLabel(item: DraftItem): string {
  return item.customName ?? item.itemId ?? "item";
}

// ---- Costs ----

export interface DraftCostLine {
  label: string;
  /** Null when the line's price is unknown (see builder.unknownCost). */
  amount: number | null;
}

export interface DraftCosts {
  /** Sum of unit hire costs (groups x size). */
  hires: number;
  /** Sum of every known equipment line. Unknown lines are left out — check `unknownLines`. */
  equipment: number;
  total: number;
  remaining: number;
  /** Equipment lines whose price could not be determined. */
  unknownLines: number;
  lines: DraftCostLine[];
}

/**
 * Price of one warrior's stack. Merged stacks mean a warrior never holds two stacks of the same
 * item, so the "1st free" copy is always in this line (alreadyOwnedFree false). A player-entered
 * unitCost replaces the list amount but keeps the first-free / brace structure of the list cost.
 */
export function draftItemCost(item: DraftItem): number | null {
  const parsed = parseEquipmentCost(item.costText);
  if (item.unitCost === null) return equipmentLineCost(parsed, item.quantity, false);
  if (parsed.kind === "multiplier" || parsed.kind === "unknown") return item.unitCost * item.quantity;
  return equipmentLineCost({ ...parsed, amount: item.unitCost }, item.quantity, false);
}

export function draftCosts(draft: WarbandDraft, template: WarbandTemplate): DraftCosts {
  const lines: DraftCostLine[] = [];
  let hires = 0;
  let equipment = 0;
  let unknownLines = 0;

  const addEquipment = (label: string, items: DraftItem[], models: number) => {
    for (const item of items) {
      const each = draftItemCost(item);
      const amount = each === null ? null : each * models;
      if (amount === null) unknownLines++;
      else equipment += amount;
      const qty = models > 1 ? `${item.quantity} x ${models}` : `${item.quantity}`;
      lines.push({ label: `${label}: ${itemLabel(item)} x${qty}`, amount });
    }
  };

  for (const hero of draft.heroes) {
    const unit = findUnitTemplate(template, hero.unitTemplateId);
    const cost = unit?.cost ?? 0;
    hires += cost;
    lines.push({ label: `${hero.name} (${unit?.name ?? hero.unitTemplateId})`, amount: cost });
    addEquipment(hero.name, hero.equipment, 1);
  }
  for (const group of draft.groups) {
    const unit = findUnitTemplate(template, group.unitTemplateId);
    const cost = (unit?.cost ?? 0) * group.size;
    hires += cost;
    lines.push({ label: `${group.name} (${group.size} x ${unit?.name ?? group.unitTemplateId})`, amount: cost });
    addEquipment(group.name, group.equipment, group.size);
  }

  const total = hires + equipment;
  return { hires, equipment, total, remaining: draft.startingGold - total, unknownLines, lines };
}

// ---- Conversion ----

const ZERO_STATS: Stats = { M: 0, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 };

/** True when any of the unit's special rules is named "Large", "Large Target", "Large Monster" … */
/**
 * Starting experience is "already spent": a Captain who begins at 20 xp has crossed eight
 * threshold boxes but is owed no advances for them (rulebook: starting experience reflects
 * skills the profile already has). Recording that as level-ups keeps advancesEarned honest.
 */
export function startingLevelUps(unit: UnitTemplate | undefined, role: "hero" | "henchman"): number {
  return advancesEarned(0, unit?.startingExperience ?? 0, role);
}

export function unitIsLarge(unit: UnitTemplate | undefined): boolean {
  return unit?.specialRules.some((rule) => /large/i.test(rule.name)) ?? false;
}

function toRosterItem(item: DraftItem, multiplier: number): RosterItem {
  const out: RosterItem = { itemId: item.itemId, quantity: item.quantity * multiplier };
  if (item.itemId === null) out.customName = item.customName ?? "";
  return out;
}

export interface DraftRosterIds {
  warbandId?: string;
}

/** The draft as a RosterWarband (gold = what is left), for validateRoster and warbandRating. */
export function draftToRosterWarband(draft: WarbandDraft, template: WarbandTemplate, ids: DraftRosterIds = {}): RosterWarband {
  const costs = draftCosts(draft, template);

  const heroes: RosterHero[] = draft.heroes.map((hero) => {
    const unit = findUnitTemplate(template, hero.unitTemplateId);
    return {
      id: hero.id,
      name: hero.name,
      unitTemplateId: hero.unitTemplateId,
      stats: { ...(unit?.stats ?? ZERO_STATS) },
      xp: unit?.startingExperience ?? 0,
      levelUps: startingLevelUps(unit, "hero"),
      skillTableIds: [...(unit?.skillTableIds ?? [])],
      skillIds: [],
      spellIds: [],
      injuries: [],
      flags: {},
      equipment: hero.equipment.map((item) => toRosterItem(item, 1)),
      isLarge: unitIsLarge(unit),
      status: "active",
    };
  });

  const henchmenGroups: RosterHenchmanGroup[] = draft.groups.map((group) => {
    const unit = findUnitTemplate(template, group.unitTemplateId);
    return {
      id: group.id,
      name: group.name,
      unitTemplateId: group.unitTemplateId,
      size: group.size,
      stats: { ...(unit?.stats ?? ZERO_STATS) },
      xp: unit?.startingExperience ?? 0,
      levelUps: startingLevelUps(unit, "henchman"),
      statIncreases: {},
      equipment: group.equipment.map((item) => toRosterItem(item, group.size)),
      isLarge: unitIsLarge(unit),
    };
  });

  return {
    id: ids.warbandId ?? "draft",
    name: draft.name,
    warbandTemplateId: draft.warbandTemplateId,
    gold: costs.remaining,
    wyrdstone: 0,
    veteranPool: null,
    heroes,
    henchmenGroups,
    hiredSwords: [],
    stash: [],
    notes: draft.notes || undefined,
  };
}

// ---- Validation ----

/** Every roster problem at creation plus the builder's own: overspend, blank names, unknown prices. */
export function validateDraft(draft: WarbandDraft, template: WarbandTemplate): RosterProblem[] {
  const roster = draftToRosterWarband(draft, template);
  const problems: RosterProblem[] = [...validateRoster(roster, template, { atCreation: true }).problems];
  const costs = draftCosts(draft, template);

  if (costs.remaining < 0) {
    problems.push({
      code: "builder.overspent",
      message: `Spent ${costs.total} of ${draft.startingGold} gc: ${-costs.remaining} gc over budget`,
    });
  }
  if (draft.name.trim().length === 0) {
    problems.push({ code: "builder.emptyName", message: "The warband needs a name" });
  }
  for (const hero of draft.heroes) {
    if (hero.name.trim().length === 0) {
      const unit = findUnitTemplate(template, hero.unitTemplateId);
      problems.push({
        code: "builder.unnamedWarrior",
        message: `The ${unit?.name ?? hero.unitTemplateId} needs a name`,
        subjectId: hero.id,
      });
    }
  }
  for (const group of draft.groups) {
    if (group.name.trim().length === 0) {
      const unit = findUnitTemplate(template, group.unitTemplateId);
      problems.push({
        code: "builder.unnamedWarrior",
        message: `The group of ${unit?.name ?? group.unitTemplateId} needs a name`,
        subjectId: group.id,
      });
    }
  }
  const holders = [
    ...draft.heroes.map((h) => ({ id: h.id, name: h.name, equipment: h.equipment })),
    ...draft.groups.map((g) => ({ id: g.id, name: g.name, equipment: g.equipment })),
  ];
  for (const holder of holders) {
    for (const item of holder.equipment) {
      if (draftItemCost(item) === null) {
        problems.push({
          code: "builder.unknownCost",
          message: `${holder.name || holder.id}: enter a price for ${itemLabel(item)} (${item.costText})`,
          subjectId: holder.id,
        });
      }
    }
  }
  return problems;
}

// ---- Payload ----

export interface PayloadItem {
  item_rules_id: string | null;
  custom_name: string | null;
  quantity: number;
}

export interface CreateWarbandPayload {
  name: string;
  type_rules_id: string;
  gold: number;
  notes: string;
  heroes: {
    name: string;
    unit_type_rules_id: string;
    stats: Stats;
    xp: number;
    /** Advances already accounted for by starting experience, so none are owed on day one. */
    level_ups: number;
    skill_tables: string[];
    is_large: boolean;
    sort_order: number;
    equipment: PayloadItem[];
  }[];
  henchman_groups: {
    name: string;
    unit_type_rules_id: string;
    size: number;
    stats: Stats;
    xp: number;
    level_ups: number;
    is_large: boolean;
    sort_order: number;
    equipment: PayloadItem[];
  }[];
  stash: PayloadItem[];
}

function toPayloadItem(item: DraftItem, multiplier: number): PayloadItem {
  return {
    item_rules_id: item.itemId,
    custom_name: item.itemId === null ? (item.customName ?? "") : null,
    quantity: item.quantity * multiplier,
  };
}

/** The draft as the create_warband SQL payload (snake_case). Validate with validateDraft first. */
export function draftToCreatePayload(draft: WarbandDraft, template: WarbandTemplate): CreateWarbandPayload {
  const costs = draftCosts(draft, template);
  return {
    name: draft.name,
    type_rules_id: draft.warbandTemplateId,
    gold: costs.remaining,
    notes: draft.notes,
    heroes: draft.heroes.map((hero, sort_order) => {
      const unit = findUnitTemplate(template, hero.unitTemplateId);
      return {
        name: hero.name,
        unit_type_rules_id: hero.unitTemplateId,
        stats: { ...(unit?.stats ?? ZERO_STATS) },
        xp: unit?.startingExperience ?? 0,
        level_ups: startingLevelUps(unit, "hero"),
        skill_tables: [...(unit?.skillTableIds ?? [])],
        is_large: unitIsLarge(unit),
        sort_order,
        equipment: hero.equipment.map((item) => toPayloadItem(item, 1)),
      };
    }),
    henchman_groups: draft.groups.map((group, sort_order) => {
      const unit = findUnitTemplate(template, group.unitTemplateId);
      return {
        name: group.name,
        unit_type_rules_id: group.unitTemplateId,
        size: group.size,
        stats: { ...(unit?.stats ?? ZERO_STATS) },
        xp: unit?.startingExperience ?? 0,
        level_ups: startingLevelUps(unit, "henchman"),
        is_large: unitIsLarge(unit),
        sort_order,
        equipment: group.equipment.map((item) => toPayloadItem(item, group.size)),
      };
    }),
    stash: [],
  };
}
