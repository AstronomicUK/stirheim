import type { SupabaseClient } from '@supabase/supabase-js'
/** Creates disposable seed-shaped records without reading or modifying shared QA rosters.
 * The roster below mirrors supabase/seed.sql; tests use their own starting treasury values. */
const seed = {
  "warbands": [
    {
      "id": "aaaaaaaa-0000-4000-8000-000000000001",
      "owner_id": "11111111-1111-4111-8111-111111111111",
      "name": "Reikland Watch",
      "type_rules_id": "mercenaries_reikland",
      "gold": 35,
      "wyrdstone": 0,
      "notes": "Seed warband. Fresh from Altdorf."
    },
    {
      "id": "aaaaaaaa-0000-4000-8000-000000000002",
      "owner_id": "22222222-2222-4222-8222-222222222222",
      "name": "Claws of Eshin",
      "type_rules_id": "skaven_of_clan_eshin",
      "gold": 20,
      "wyrdstone": 2,
      "notes": "Seed warband."
    }
  ],
  "heroes": [
    {
      "id": "bbbbbbbb-0000-4000-8000-000000000001",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "name": "Captain Ulrich Brandt",
      "unit_type_rules_id": "mercenaries_reikland_captain",
      "stats": {
        "M": 4,
        "WS": 4,
        "BS": 4,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 4,
        "A": 1,
        "Ld": 8
      },
      "xp": 20,
      "level_ups": 8,
      "skill_tables": [
        "combat",
        "shooting",
        "academic",
        "strength",
        "speed"
      ],
      "sort_order": 0
    },
    {
      "id": "bbbbbbbb-0000-4000-8000-000000000002",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "name": "Marta Voss",
      "unit_type_rules_id": "mercenaries_reikland_champions",
      "stats": {
        "M": 4,
        "WS": 4,
        "BS": 3,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 3,
        "A": 1,
        "Ld": 7
      },
      "xp": 8,
      "level_ups": 4,
      "skill_tables": [
        "combat",
        "shooting",
        "strength"
      ],
      "sort_order": 1
    },
    {
      "id": "bbbbbbbb-0000-4000-8000-000000000003",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "name": "Klaus Reiter",
      "unit_type_rules_id": "mercenaries_reikland_champions",
      "stats": {
        "M": 4,
        "WS": 4,
        "BS": 3,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 3,
        "A": 1,
        "Ld": 7
      },
      "xp": 8,
      "level_ups": 4,
      "skill_tables": [
        "combat",
        "shooting",
        "strength"
      ],
      "sort_order": 2
    },
    {
      "id": "bbbbbbbb-0000-4000-8000-000000000004",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "name": "Pieter",
      "unit_type_rules_id": "mercenaries_reikland_youngbloods",
      "stats": {
        "M": 4,
        "WS": 2,
        "BS": 2,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 3,
        "A": 1,
        "Ld": 6
      },
      "xp": 0,
      "level_ups": 0,
      "skill_tables": [
        "combat",
        "shooting",
        "speed"
      ],
      "sort_order": 3
    },
    {
      "id": "bbbbbbbb-0000-4000-8000-000000000011",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "name": "Skritch Nightblade",
      "unit_type_rules_id": "skaven_assassin_adept",
      "stats": {
        "M": 6,
        "WS": 4,
        "BS": 4,
        "S": 4,
        "T": 3,
        "W": 1,
        "I": 5,
        "A": 1,
        "Ld": 7
      },
      "xp": 20,
      "level_ups": 8,
      "skill_tables": [
        "combat",
        "shooting",
        "academic",
        "strength",
        "speed",
        "skaven_of_clan_eshin_skills"
      ],
      "sort_order": 0
    },
    {
      "id": "bbbbbbbb-0000-4000-8000-000000000012",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "name": "Queek",
      "unit_type_rules_id": "skaven_black_skaven",
      "stats": {
        "M": 6,
        "WS": 4,
        "BS": 3,
        "S": 4,
        "T": 3,
        "W": 1,
        "I": 5,
        "A": 1,
        "Ld": 6
      },
      "xp": 8,
      "level_ups": 4,
      "skill_tables": [
        "combat",
        "strength",
        "speed",
        "skaven_of_clan_eshin_skills"
      ],
      "sort_order": 1
    },
    {
      "id": "bbbbbbbb-0000-4000-8000-000000000013",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "name": "Sneek",
      "unit_type_rules_id": "skaven_night_runners",
      "stats": {
        "M": 6,
        "WS": 2,
        "BS": 3,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 5,
        "A": 1,
        "Ld": 4
      },
      "xp": 0,
      "level_ups": 0,
      "skill_tables": [
        "combat",
        "shooting",
        "speed"
      ],
      "sort_order": 2
    }
  ],
  "henchman_groups": [
    {
      "id": "cccccccc-0000-4000-8000-000000000001",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "name": "Watchmen",
      "unit_type_rules_id": "mercenaries_reikland_warriors",
      "size": 3,
      "stats": {
        "M": 4,
        "WS": 3,
        "BS": 3,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 3,
        "A": 1,
        "Ld": 7
      },
      "sort_order": 0
    },
    {
      "id": "cccccccc-0000-4000-8000-000000000002",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "name": "Marksmen",
      "unit_type_rules_id": "mercenaries_reikland_marksmen",
      "size": 2,
      "stats": {
        "M": 4,
        "WS": 3,
        "BS": 4,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 3,
        "A": 1,
        "Ld": 7
      },
      "sort_order": 1
    },
    {
      "id": "cccccccc-0000-4000-8000-000000000011",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "name": "Verminkin",
      "unit_type_rules_id": "skaven_verminkin",
      "size": 4,
      "stats": {
        "M": 5,
        "WS": 3,
        "BS": 3,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 4,
        "A": 1,
        "Ld": 5
      },
      "sort_order": 0
    },
    {
      "id": "cccccccc-0000-4000-8000-000000000012",
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "name": "Giant Rats",
      "unit_type_rules_id": "skaven_giant_rats",
      "size": 2,
      "stats": {
        "M": 6,
        "WS": 2,
        "BS": 0,
        "S": 3,
        "T": 3,
        "W": 1,
        "I": 4,
        "A": 1,
        "Ld": 4
      },
      "sort_order": 1
    }
  ],
  "items": [
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000001",
      "item_rules_id": "sword",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000001",
      "item_rules_id": "dagger",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000001",
      "item_rules_id": "light_armour",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000002",
      "item_rules_id": "sword",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000002",
      "item_rules_id": "dagger",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000003",
      "item_rules_id": "dagger",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000004",
      "item_rules_id": "dagger",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "group",
      "holder_id": "cccccccc-0000-4000-8000-000000000001",
      "item_rules_id": "dagger",
      "quantity": 3
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "group",
      "holder_id": "cccccccc-0000-4000-8000-000000000002",
      "item_rules_id": "bow",
      "quantity": 2
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "group",
      "holder_id": "cccccccc-0000-4000-8000-000000000002",
      "item_rules_id": "dagger",
      "quantity": 2
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "holder_type": "stash",
      "holder_id": null,
      "item_rules_id": "dagger",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000011",
      "item_rules_id": "sword",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000011",
      "item_rules_id": "dagger",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000012",
      "item_rules_id": "dagger",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "holder_type": "hero",
      "holder_id": "bbbbbbbb-0000-4000-8000-000000000013",
      "item_rules_id": "dagger",
      "quantity": 1
    },
    {
      "warband_id": "aaaaaaaa-0000-4000-8000-000000000002",
      "holder_type": "group",
      "holder_id": "cccccccc-0000-4000-8000-000000000011",
      "item_rules_id": "dagger",
      "quantity": 4
    }
  ]
}

export async function isolatedCampaign(admin: SupabaseClient, ids: { campaign: string; reikland: string; skaven: string; captain?: string; skritch?: string; queek?: string; verminkin?: string }) {
  const sourceWarbands = ['aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002']
  const remap = new Map<string, string>(sourceWarbands.map((id, i) => [id, i === 0 ? ids.reikland : ids.skaven]))
  for (const [old, next] of [['bbbbbbbb-0000-4000-8000-000000000001', ids.captain], ['bbbbbbbb-0000-4000-8000-000000000011', ids.skritch], ['bbbbbbbb-0000-4000-8000-000000000012', ids.queek], ['cccccccc-0000-4000-8000-000000000011', ids.verminkin]]) if (next) remap.set(old!, next)
  const check = <T,>(r: { data: T; error: unknown }): T => { if (r.error) throw r.error; return r.data }

  const campaign = check(await admin.from('campaigns').insert({ id: ids.campaign, name: 'Ruins of the Stir', gm_id: '11111111-1111-4111-8111-111111111111', settings: { startingGold: 500, reportApproval: false, mapCampaign: false, houseRules: { halfPriceArmour: true, optionalCriticalTables: true, strengthArmourPiercing: false } } }).select('invite_code').single())!
  const warbands = seed.warbands
  for (const w of warbands) {
    const id = remap.get(w.id)!
    check(await admin.from('warbands').insert({ ...w, id, gold: id === ids.reikland ? 35 : 20, wyrdstone: 2, veteran_pool: null }))
    check(await admin.from('campaign_members').insert({ campaign_id: ids.campaign, warband_id: id, user_id: w.owner_id }))
  }
  for (const table of ['heroes', 'henchman_groups'] as const) {
    const rows = seed[table]
    for (const row of rows) {
      const id = remap.get(row.id) ?? crypto.randomUUID(); remap.set(row.id, id)
      const patch: Record<string, unknown> = { ...row, id, warband_id: remap.get(row.warband_id) }
      if (table === 'heroes') Object.assign(patch, { flags: {}, injuries: [], status: 'active' })
      if (row.id === 'bbbbbbbb-0000-4000-8000-000000000011') Object.assign(patch, { xp: 20, level_ups: 8, stats: { M: 6, WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 5, A: 1, Ld: 7 } })
      if (row.id === 'cccccccc-0000-4000-8000-000000000011') Object.assign(patch, { size: 4, xp: 0, level_ups: 0 })
      check(await admin.from(table).insert(patch))
    }
  }
  const items = seed.items
  for (const row of items) check(await admin.from('items').insert({ ...row, id: crypto.randomUUID(), warband_id: remap.get(row.warband_id), holder_id: row.holder_id ? remap.get(row.holder_id) : null }))
  return { inviteCode: campaign.invite_code as string, cleanup: async () => { check(await admin.from('campaigns').delete().eq('id', ids.campaign)); check(await admin.from('warbands').delete().in('id', [ids.reikland, ids.skaven])) } }
}
