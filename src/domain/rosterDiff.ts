// The bridge from a resolver's output back to the database. A Phase 2 resolver (src/rules/resolve:
// buyItem, recruitHero, promoteHenchman, hireHiredSword, payUpkeep, applyStatIncrease...) takes a
// RosterWarband and returns a new one. diffRoster compares that result with the rows the screen
// loaded and produces the smallest RosterChange[] update_roster needs:
//
//   - warbands: one update carrying only gold / wyrdstone / veteran_pool / notes when changed.
//   - heroes (RosterHero and RosterHiredSword both live in the heroes table): update with the
//     changed columns of heroPatchFromRoster / hiredSwordPatchFromRoster; insert with the full row
//     for an id the rows do not have (the change carries that id, which MUST be a uuid the caller
//     generated with crypto.randomUUID()); delete for a row missing from the result.
//   - henchman_groups: the same with groupPatchFromRoster.
//   - items: reconciled per holder (stash, each hero, each group) by (item_rules_id ?? custom_name):
//     quantity or notes changed -> update, gone -> delete, new -> insert. A stack that vanished from
//     one holder and appeared in another with the same key is sent as a holder update (a move), so
//     the row keeps its identity. Rows held by a warrior the result deleted are not deleted here:
//     they either pair with a stack the resolver put elsewhere (a move) or are left alone, and the
//     database trigger returns them to the stash when the warrior row goes.
//
// Ordering: warband, hero/group updates and inserts, item updates and inserts, item deletes, then
// hero and group deletes, so an item can be given to a warrior created in the same batch and a
// deleted warrior's kit is dealt with before the row goes.

import type { StatKey } from "../rules/types/common";
import type {
  RosterHenchmanGroup,
  RosterHero,
  RosterHiredSword,
  RosterItem,
  RosterWarband,
} from "../rules/types/roster";
import {
  groupPatchFromRoster,
  heroPatchFromRoster,
  hiredSwordPatchFromRoster,
  toRosterHeroStatus,
  toRosterHiredSwordStatus,
} from "./roster";
import type { RosterChange, RosterTable } from "./rosterChange";
import type { HenchmanGroupRow, HeroRow, ItemHolder, ItemRow, WarbandRow } from "./rows";

export interface RosterRows {
  warband: WarbandRow;
  heroes: HeroRow[];
  groups: HenchmanGroupRow[];
  items: ItemRow[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when `id` can be handed to Postgres as a uuid (new rows need one; see crypto.randomUUID()). */
export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

function requireUuid(id: string, what: string): void {
  if (!isUuid(id)) {
    throw new Error(`${what} "${id}" is not a uuid; generate new roster ids with crypto.randomUUID()`);
  }
}

// ---------------------------------------------------------------------------------------------
// Stable comparison for jsonb-shaped values
// ---------------------------------------------------------------------------------------------

/** JSON with object keys sorted at every level, so two equal shapes always serialise the same. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((k) => record[k] !== undefined)
      .sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson(record[k])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function same(a: unknown, b: unknown): boolean {
  return stableJson(a) === stableJson(b);
}

/** The keys of `patch` whose value differs from the row's, as a data object. */
function changedColumns<P extends Record<string, unknown>>(row: Record<string, unknown>, patch: P): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of Object.keys(patch)) {
    if (!same(row[key], patch[key])) data[key] = patch[key];
  }
  return data;
}

// ---------------------------------------------------------------------------------------------
// warbands
// ---------------------------------------------------------------------------------------------

function warbandChanges(row: WarbandRow, next: RosterWarband): RosterChange[] {
  const data: Record<string, unknown> = {};
  if (next.gold !== row.gold) data.gold = next.gold;
  if (next.wyrdstone !== row.wyrdstone) data.wyrdstone = next.wyrdstone;
  if (next.veteranPool !== row.veteran_pool) data.veteran_pool = next.veteranPool;
  if ((next.notes ?? "") !== row.notes) data.notes = next.notes ?? "";
  return Object.keys(data).length > 0 ? [{ table: "warbands", op: "update", id: row.id, data }] : [];
}

// ---------------------------------------------------------------------------------------------
// heroes and hired swords
// ---------------------------------------------------------------------------------------------

function heroInsertData(hero: RosterHero, sortOrder: number): Record<string, unknown> {
  return {
    name: hero.name,
    is_hired_sword: false,
    unit_type_rules_id: hero.unitTemplateId,
    hired_sword_rules_id: null,
    stats: hero.stats,
    xp: hero.xp,
    level_ups: hero.levelUps,
    skill_tables: hero.skillTableIds,
    skills: hero.skillIds,
    spells: hero.spellIds,
    injuries: hero.injuries,
    flags: hero.flags,
    equipment_locked: false,
    is_large: hero.isLarge ?? false,
    status: hero.status,
    notes: hero.notes ?? "",
    sort_order: sortOrder,
  };
}

function hiredSwordInsertData(hs: RosterHiredSword, sortOrder: number): Record<string, unknown> {
  return {
    name: hs.name,
    is_hired_sword: true,
    unit_type_rules_id: null,
    hired_sword_rules_id: hs.hiredSwordId,
    stats: hs.stats,
    xp: hs.xp,
    level_ups: hs.levelUps,
    skill_tables: [],
    skills: hs.skillIds,
    spells: [],
    injuries: hs.injuries,
    flags: hs.flags,
    equipment_locked: true,
    is_large: false,
    status: hs.status,
    notes: "",
    sort_order: sortOrder,
  };
}

function heroUpdateData(row: HeroRow, hero: RosterHero): Record<string, unknown> {
  const { status, ...patch } = heroPatchFromRoster(hero);
  const data = changedColumns(row, patch);
  // A row status of "left" reads as "retired" on the roster side; only a real change is sent.
  if (toRosterHeroStatus(row.status) !== status) data.status = status;
  return data;
}

function hiredSwordUpdateData(row: HeroRow, hs: RosterHiredSword): Record<string, unknown> {
  const { status, ...patch } = hiredSwordPatchFromRoster(hs);
  const data = changedColumns(row, patch);
  // "captured" and "retired" rows both read as "left"; only a real change is sent.
  if (toRosterHiredSwordStatus(row.status) !== status) data.status = status;
  return data;
}

// ---------------------------------------------------------------------------------------------
// henchman groups
// ---------------------------------------------------------------------------------------------

function groupInsertData(group: RosterHenchmanGroup, sortOrder: number): Record<string, unknown> {
  return {
    name: group.name,
    unit_type_rules_id: group.unitTemplateId,
    size: group.size,
    stats: group.stats,
    xp: group.xp,
    level_ups: group.levelUps,
    stat_increases: group.statIncreases,
    is_large: group.isLarge ?? false,
    notes: group.notes ?? "",
    model_names: group.modelNames ?? [],
    sort_order: sortOrder,
  };
}

function groupUpdateData(row: HenchmanGroupRow, group: RosterHenchmanGroup): Record<string, unknown> {
  const patch = groupPatchFromRoster(group);
  const data = changedColumns(row, patch);
  // Increases that are absent on one side and 0 on the other are the same thing.
  if ("stat_increases" in data && statIncreasesEqual(row.stat_increases, group.statIncreases)) delete data.stat_increases;
  if ("model_names" in data && sameNames(row.model_names ?? [], group.modelNames ?? [])) delete data.model_names;
  return data;
}

function sameNames(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

const STAT_KEYS: readonly StatKey[] = ["M", "WS", "BS", "S", "T", "W", "I", "A", "Ld"];

function statIncreasesEqual(a: Partial<Record<StatKey, number>>, b: Partial<Record<StatKey, number>>): boolean {
  return STAT_KEYS.every((k) => (a[k] ?? 0) === (b[k] ?? 0));
}

// ---------------------------------------------------------------------------------------------
// items
// ---------------------------------------------------------------------------------------------

interface Holder {
  type: ItemHolder;
  /** null for the stash. */
  id: string | null;
  equipment: readonly RosterItem[];
}

function itemKey(itemRulesId: string | null, customName: string | null | undefined): string {
  return itemRulesId !== null ? `rules:${itemRulesId}` : `custom:${customName ?? ""}`;
}

function rowKey(row: ItemRow): string {
  return itemKey(row.item_rules_id, row.custom_name);
}

function rosterItemKey(item: RosterItem): string {
  return itemKey(item.itemId, item.customName);
}

function groupBy<T>(list: readonly T[], key: (x: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const x of list) {
    const k = key(x);
    const bucket = out.get(k);
    if (bucket) bucket.push(x);
    else out.set(k, [x]);
  }
  return out;
}

interface PendingInsert {
  holder: Holder;
  item: RosterItem;
}

function itemInsertData(holder: Holder, item: RosterItem): Record<string, unknown> {
  return {
    holder_type: holder.type,
    holder_id: holder.id,
    item_rules_id: item.itemId,
    custom_name: item.itemId === null ? (item.customName ?? null) : null,
    quantity: item.quantity,
    notes: item.notes ?? "",
  };
}

function itemUpdateData(row: ItemRow, item: RosterItem, holder?: Holder): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (holder && (row.holder_type !== holder.type || row.holder_id !== holder.id)) {
    data.holder_type = holder.type;
    data.holder_id = holder.id;
  }
  if (row.quantity !== item.quantity) data.quantity = item.quantity;
  if (row.notes !== (item.notes ?? "")) data.notes = item.notes ?? "";
  return data;
}

function itemChanges(rows: readonly ItemRow[], holders: readonly Holder[]): { upserts: RosterChange[]; deletes: RosterChange[] } {
  const upserts: RosterChange[] = [];
  const deletes: RosterChange[] = [];
  const liveHolderIds = new Set(holders.map((h) => h.id).filter((id): id is string => id !== null));

  // Rows whose holder still exists but that the result no longer lists there, and rows whose
  // holder the result deleted. Both may pair with an insert elsewhere as a move.
  const unmatchedRows: ItemRow[] = [];
  const orphanRows: ItemRow[] = [];
  const inserts: PendingInsert[] = [];

  const rowsByHolder = new Map<string, ItemRow[]>();
  for (const row of rows) {
    const holderKey = row.holder_type === "stash" || row.holder_id === null ? "" : row.holder_id;
    if (holderKey !== "" && !liveHolderIds.has(holderKey)) {
      orphanRows.push(row);
      continue;
    }
    const list = rowsByHolder.get(holderKey);
    if (list) list.push(row);
    else rowsByHolder.set(holderKey, [row]);
  }

  for (const holder of holders) {
    const held = rowsByHolder.get(holder.id ?? "") ?? [];
    const byKey = groupBy(held, rowKey);
    const wanted = groupBy(holder.equipment, rosterItemKey);
    for (const [key, items] of wanted) {
      const existing = byKey.get(key) ?? [];
      items.forEach((item, i) => {
        const row = existing[i];
        if (row) {
          const data = itemUpdateData(row, item);
          if (Object.keys(data).length > 0) upserts.push({ table: "items", op: "update", id: row.id, data });
        } else {
          inserts.push({ holder, item });
        }
      });
      for (const extra of existing.slice(items.length)) unmatchedRows.push(extra);
    }
    for (const [key, extra] of byKey) {
      if (!wanted.has(key)) unmatchedRows.push(...extra);
    }
  }

  // Moves: an insert and an unmatched (or orphaned) row with the same key become one holder update.
  const spare = groupBy([...unmatchedRows, ...orphanRows], rowKey);
  for (const { holder, item } of inserts) {
    const candidates = spare.get(rosterItemKey(item));
    const row = candidates?.shift();
    if (row) {
      const data = itemUpdateData(row, item, holder);
      if (Object.keys(data).length > 0) upserts.push({ table: "items", op: "update", id: row.id, data });
    } else {
      upserts.push({ table: "items", op: "insert", data: itemInsertData(holder, item) });
    }
  }
  const moved = new Set(upserts.map((c) => c.id).filter((id): id is string => id !== undefined));
  for (const row of unmatchedRows) {
    if (!moved.has(row.id)) deletes.push({ table: "items", op: "delete", id: row.id });
  }
  // Orphans that found no new home are left to the database trigger (back to the stash).

  return { upserts, deletes };
}

// ---------------------------------------------------------------------------------------------
// diffRoster
// ---------------------------------------------------------------------------------------------

function nextSortOrder(rows: readonly { sort_order: number }[]): number {
  return rows.reduce((max, r) => Math.max(max, r.sort_order), -1) + 1;
}

function diffWarriors<Row extends { id: string }, Next extends { id: string }>(
  table: RosterTable,
  rows: readonly Row[],
  nexts: readonly Next[],
  /** sort_order for the first insert; each further insert takes the next number. */
  firstSortOrder: number,
  insertData: (next: Next, sortOrder: number) => Record<string, unknown>,
  updateData: (row: Row, next: Next) => Record<string, unknown>,
  what: string,
): { upserts: RosterChange[]; seen: Set<string>; nextSortOrder: number } {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const upserts: RosterChange[] = [];
  const seen = new Set<string>();
  let sortOrder = firstSortOrder;
  for (const next of nexts) {
    const row = byId.get(next.id);
    if (row) {
      seen.add(row.id);
      const data = updateData(row, next);
      if (Object.keys(data).length > 0) upserts.push({ table, op: "update", id: row.id, data });
    } else {
      requireUuid(next.id, `${what} id`);
      upserts.push({ table, op: "insert", id: next.id, data: insertData(next, sortOrder) });
      sortOrder += 1;
    }
  }
  return { upserts, seen, nextSortOrder: sortOrder };
}

/**
 * The minimal update_roster batch that turns `rows` into `next`. Empty when nothing changed.
 * Throws when a new warrior's id is not a uuid (the database will not accept it).
 */
export function diffRoster(rows: RosterRows, next: RosterWarband): RosterChange[] {
  const heroRows = rows.heroes.filter((h) => !h.is_hired_sword);
  const hiredRows = rows.heroes.filter((h) => h.is_hired_sword);

  // Hired swords share the heroes table and its sort_order space: new heroes are numbered after
  // every existing row, new hired swords after those.
  const heroes = diffWarriors("heroes", heroRows, next.heroes, nextSortOrder(rows.heroes), heroInsertData, heroUpdateData, "hero");
  const hired = diffWarriors("heroes", hiredRows, next.hiredSwords, heroes.nextSortOrder, hiredSwordInsertData, hiredSwordUpdateData, "hired sword");
  const groups = diffWarriors(
    "henchman_groups",
    rows.groups,
    next.henchmenGroups,
    nextSortOrder(rows.groups),
    groupInsertData,
    groupUpdateData,
    "henchman group",
  );

  const seenHeroIds = new Set([...heroes.seen, ...hired.seen]);
  const heroDeletes: RosterChange[] = rows.heroes
    .filter((h) => !seenHeroIds.has(h.id))
    .map((h) => ({ table: "heroes", op: "delete", id: h.id }));
  const groupDeletes: RosterChange[] = rows.groups
    .filter((g) => !groups.seen.has(g.id))
    .map((g) => ({ table: "henchman_groups", op: "delete", id: g.id }));

  const holders: Holder[] = [
    { type: "stash", id: null, equipment: next.stash },
    ...next.heroes.map((h): Holder => ({ type: "hero", id: h.id, equipment: h.equipment })),
    ...next.hiredSwords.map((h): Holder => ({ type: "hero", id: h.id, equipment: h.equipment })),
    ...next.henchmenGroups.map((g): Holder => ({ type: "group", id: g.id, equipment: g.equipment })),
  ];
  const items = itemChanges(rows.items, holders);

  return [
    ...warbandChanges(rows.warband, next),
    ...heroes.upserts,
    ...hired.upserts,
    ...groups.upserts,
    ...items.upserts,
    ...items.deletes,
    ...heroDeletes,
    ...groupDeletes,
  ];
}
