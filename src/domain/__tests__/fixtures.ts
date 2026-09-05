// Rows for the seed's Reikland Watch (supabase/seed.sql), as supabase-js would return them.

import type { HenchmanGroupRow, HeroRow, ItemRow, WarbandRow } from "../rows";

export const T0 = "2026-09-04T09:00:00.000000+00:00";

export const GM_ID = "11111111-1111-4111-8111-111111111111";
export const REIKLAND_ID = "aaaaaaaa-0000-4000-8000-000000000001";
export const CAPTAIN_ID = "bbbbbbbb-0000-4000-8000-000000000001";
export const MARTA_ID = "bbbbbbbb-0000-4000-8000-000000000002";
export const KLAUS_ID = "bbbbbbbb-0000-4000-8000-000000000003";
export const PIETER_ID = "bbbbbbbb-0000-4000-8000-000000000004";
export const WATCHMEN_ID = "cccccccc-0000-4000-8000-000000000001";
export const MARKSMEN_ID = "cccccccc-0000-4000-8000-000000000002";

export const reiklandWatch: WarbandRow = {
  id: REIKLAND_ID,
  owner_id: GM_ID,
  name: "Reikland Watch",
  type_rules_id: "mercenaries_reikland",
  gold: 35,
  wyrdstone: 0,
  veteran_pool: null,
  notes: "Seed warband. Fresh from Altdorf.",
  archived: false,
  created_at: T0,
  updated_at: T0,
};

function hero(
  id: string,
  name: string,
  unit: string,
  stats: HeroRow["stats"],
  xp: number,
  skill_tables: string[],
  sort_order: number,
): HeroRow {
  return {
    id,
    warband_id: REIKLAND_ID,
    name,
    is_hired_sword: false,
    unit_type_rules_id: unit,
    hired_sword_rules_id: null,
    stats,
    xp,
    level_ups: 0,
    skill_tables,
    skills: [],
    spells: [],
    injuries: [],
    flags: {},
    equipment_locked: false,
    is_large: false,
    status: "active",
    notes: "",
    sort_order,
    created_at: T0,
    updated_at: T0,
  };
}

export const captain = hero(
  CAPTAIN_ID,
  "Captain Ulrich Brandt",
  "mercenaries_reikland_captain",
  { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
  20,
  ["combat", "shooting", "academic", "strength", "speed"],
  0,
);
export const marta = hero(
  MARTA_ID,
  "Marta Voss",
  "mercenaries_reikland_champions",
  { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
  8,
  ["combat", "shooting", "strength"],
  1,
);
export const klaus = hero(
  KLAUS_ID,
  "Klaus Reiter",
  "mercenaries_reikland_champions",
  { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
  8,
  ["combat", "shooting", "strength"],
  2,
);
export const pieter = hero(
  PIETER_ID,
  "Pieter",
  "mercenaries_reikland_youngbloods",
  { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
  0,
  ["combat", "shooting", "speed"],
  3,
);

export const reiklandHeroes: HeroRow[] = [captain, marta, klaus, pieter];

function group(
  id: string,
  name: string,
  unit: string,
  size: number,
  stats: HenchmanGroupRow["stats"],
  sort_order: number,
): HenchmanGroupRow {
  return {
    id,
    warband_id: REIKLAND_ID,
    name,
    unit_type_rules_id: unit,
    size,
    stats,
    xp: 0,
    level_ups: 0,
    stat_increases: {},
    is_large: false,
    notes: "",
    model_names: [],
    sort_order,
    created_at: T0,
    updated_at: T0,
  };
}

export const watchmen = group(
  WATCHMEN_ID,
  "Watchmen",
  "mercenaries_reikland_warriors",
  3,
  { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
  0,
);
export const marksmen = group(
  MARKSMEN_ID,
  "Marksmen",
  "mercenaries_reikland_marksmen",
  2,
  { M: 4, WS: 3, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
  1,
);

export const reiklandGroups: HenchmanGroupRow[] = [watchmen, marksmen];

let itemSeq = 0;
function item(
  holder_type: ItemRow["holder_type"],
  holder_id: string | null,
  item_rules_id: string,
  quantity: number,
): ItemRow {
  itemSeq += 1;
  const n = String(itemSeq).padStart(12, "0");
  return {
    id: `eeeeeeee-0000-4000-8000-${n}`,
    warband_id: REIKLAND_ID,
    holder_type,
    holder_id,
    item_rules_id,
    custom_name: null,
    quantity,
    notes: "",
    created_at: `2026-09-04T09:00:${String(itemSeq).padStart(2, "0")}.000000+00:00`,
    updated_at: T0,
  };
}

export const reiklandItems: ItemRow[] = [
  item("hero", CAPTAIN_ID, "sword", 1),
  item("hero", CAPTAIN_ID, "dagger", 1),
  item("hero", CAPTAIN_ID, "light_armour", 1),
  item("hero", MARTA_ID, "sword", 1),
  item("hero", MARTA_ID, "dagger", 1),
  item("hero", KLAUS_ID, "dagger", 1),
  item("hero", PIETER_ID, "dagger", 1),
  item("group", WATCHMEN_ID, "dagger", 3),
  item("group", MARKSMEN_ID, "bow", 2),
  item("group", MARKSMEN_ID, "dagger", 2),
  item("stash", null, "dagger", 1),
];
