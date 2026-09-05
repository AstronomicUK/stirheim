// Saved warband shapes. A template records the warband type, its units and their kit, nothing
// that a campaign changes (experience, injuries, gold). Starting from a template rebuilds a
// builder draft at today's list prices, so the player still spends the campaign's starting gold.

import { findWarbandTemplate } from "../data/warbandTemplates";
import type { WarbandTemplate } from "../types";
import type { RosterItem, RosterWarband } from "../types/roster";
import {
  addDraftEquipment,
  addDraftGroup,
  addDraftHero,
  equipmentOptionsFor,
  newWarbandDraft,
  removeDraftHero,
  type EquipmentOption,
  type WarbandDraft,
} from "./builder";
import { RulesError } from "./errors";

export interface TemplateItem {
  item_rules_id: string | null;
  custom_name: string | null;
  quantity: number;
}

export interface WarbandTemplatePayload {
  version: 1;
  heroes: { name: string; unit_type_rules_id: string; equipment: TemplateItem[] }[];
  /** Equipment is per model. */
  henchman_groups: { name: string; unit_type_rules_id: string; size: number; equipment: TemplateItem[] }[];
}

function toTemplateItems(items: RosterItem[], divisor = 1): TemplateItem[] {
  return items
    .filter((i) => i.quantity > 0)
    .map((i) => ({
      item_rules_id: i.itemId,
      custom_name: i.itemId ? null : (i.customName ?? null),
      quantity: Math.max(1, Math.round(i.quantity / divisor)),
    }));
}

/** The shape of a roster as a template: active heroes (not hired swords) and living groups. */
export function rosterToTemplatePayload(roster: RosterWarband): WarbandTemplatePayload {
  return {
    version: 1,
    heroes: roster.heroes
      .filter((h) => h.status === "active")
      .map((h) => ({ name: h.name, unit_type_rules_id: h.unitTemplateId, equipment: toTemplateItems(h.equipment) })),
    henchman_groups: roster.henchmenGroups
      .filter((g) => g.size > 0)
      .map((g) => ({
        name: g.name,
        unit_type_rules_id: g.unitTemplateId,
        size: g.size,
        equipment: toTemplateItems(g.equipment, g.size),
      })),
  };
}

function optionFor(options: EquipmentOption[], item: TemplateItem): EquipmentOption | undefined {
  if (item.item_rules_id) {
    const byId = options.find((o) => o.item?.id === item.item_rules_id);
    if (byId) return byId;
  }
  const name = (item.custom_name ?? "").trim().toLowerCase();
  return name ? options.find((o) => o.name.trim().toLowerCase() === name) : undefined;
}

export interface DraftFromTemplateResult {
  draft: WarbandDraft;
  /** Kit the unit's list no longer offers (or never did), left off the draft. */
  skipped: string[];
}

/**
 * A builder draft from a template. Units are added with the builder's own functions so hire
 * costs and list prices come from the rules data, not from the saved payload; the leader the list
 * mandates is replaced by the template's own hero of that type when there is one.
 */
export function draftFromTemplate(typeRulesId: string, payload: WarbandTemplatePayload, name: string, idFor: () => string): DraftFromTemplateResult {
  const template: WarbandTemplate | undefined = findWarbandTemplate(typeRulesId);
  if (!template) throw new RulesError("template.unknownWarband", `Unknown warband type "${typeRulesId}"`);
  let draft = newWarbandDraft(template, name);
  const skipped: string[] = [];
  // The fresh draft carries the mandatory leader; drop it if the template names its own.
  const leaderInTemplate = payload.heroes.find((h) => draft.heroes.some((d) => d.unitTemplateId === h.unit_type_rules_id));
  if (leaderInTemplate) {
    for (const existing of [...draft.heroes]) {
      if (existing.unitTemplateId === leaderInTemplate.unit_type_rules_id) draft = removeDraftHero(draft, existing.id);
    }
  }
  for (const hero of payload.heroes) {
    const id = idFor();
    draft = addDraftHero(draft, template, hero.unit_type_rules_id, id, hero.name);
    const options = equipmentOptionsFor(template, hero.unit_type_rules_id);
    for (const item of hero.equipment) {
      const option = optionFor(options, item);
      if (option) draft = addDraftEquipment(draft, { kind: "hero", id }, option, item.quantity);
      else skipped.push(`${hero.name}: ${item.custom_name ?? item.item_rules_id ?? "item"}`);
    }
  }
  for (const group of payload.henchman_groups) {
    const id = idFor();
    draft = addDraftGroup(draft, template, group.unit_type_rules_id, id, group.size, group.name);
    const options = equipmentOptionsFor(template, group.unit_type_rules_id);
    for (const item of group.equipment) {
      const option = optionFor(options, item);
      if (option) draft = addDraftEquipment(draft, { kind: "group", id }, option, item.quantity);
      else skipped.push(`${group.name}: ${item.custom_name ?? item.item_rules_id ?? "item"}`);
    }
  }
  return { draft, skipped };
}
