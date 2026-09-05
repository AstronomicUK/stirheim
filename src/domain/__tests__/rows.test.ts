import { describe, expect, it } from "vitest";
import {
  auditLogRowSchema,
  battleSessionRowSchema,
  campaignInsertSchema,
  campaignMemberRowSchema,
  campaignPreviewSchema,
  campaignRowSchema,
  henchmanGroupInsertSchema,
  henchmanGroupRowSchema,
  heroInsertSchema,
  heroRowSchema,
  itemInsertSchema,
  itemRowSchema,
  matchParticipantRowSchema,
  matchReportRowSchema,
  matchRowSchema,
  pendingAdvanceRowSchema,
  profileRowSchema,
  scenarioInsertSchema,
  scenarioRowSchema,
  tradePhaseStateRowSchema,
  warbandInsertSchema,
  warbandRowSchema,
} from "../rows";
import { statsSchema } from "../json";
import {
  CAPTAIN_ID,
  GM_ID,
  REIKLAND_ID,
  T0,
  WATCHMEN_ID,
  captain,
  reiklandItems,
  reiklandWatch,
  watchmen,
} from "./fixtures";

const PLAYER_ID = "22222222-2222-4222-8222-222222222222";
const ESHIN_ID = "aaaaaaaa-0000-4000-8000-000000000002";
const CAMPAIGN_ID = "dddddddd-0000-4000-8000-000000000001";
const MATCH_ID = "ffffffff-0000-4000-8000-000000000001";
const SCENARIO_ID = "ffffffff-0000-4000-8000-000000000002";

describe("row schemas parse realistic seed rows", () => {
  it("profiles", () => {
    expect(
      profileRowSchema.parse({
        user_id: GM_ID,
        display_name: "Tom (GM)",
        created_at: T0,
        updated_at: T0,
      }),
    ).toEqual({
      user_id: GM_ID,
      display_name: "Tom (GM)",
      created_at: T0,
      updated_at: T0,
    });
    expect(
      profileRowSchema.safeParse({
        user_id: GM_ID,
        display_name: "",
        created_at: T0,
        updated_at: T0,
      }).success,
    ).toBe(false);
  });

  it("warbands", () => {
    expect(warbandRowSchema.parse(reiklandWatch)).toEqual(reiklandWatch);
    expect(warbandRowSchema.safeParse({ ...reiklandWatch, gold: -1 }).success).toBe(false);
    expect(warbandRowSchema.safeParse({ ...reiklandWatch, veteran_pool: 13 }).success).toBe(false);
    expect(warbandRowSchema.parse({ ...reiklandWatch, veteran_pool: 7 }).veteran_pool).toBe(7);
  });

  it("heroes", () => {
    expect(heroRowSchema.parse(captain)).toEqual(captain);
    const wounded = {
      ...captain,
      injuries: [
        {
          injuryCode: "leg_wound",
          name: "Leg Wound",
          rolled: { d66: 11 },
          effect: "-1 Movement",
          matchId: MATCH_ID,
        },
      ],
      flags: { missNextGames: 1, oldBattleWound: true },
      status: "active",
    };
    expect(heroRowSchema.parse(wounded).injuries[0]?.rolled.d66).toBe(11);
    expect(heroRowSchema.safeParse({ ...captain, injuries: [{ injuryCode: "x" }] }).success).toBe(false);
    expect(heroRowSchema.safeParse({ ...captain, flags: { missNextGames: "one" } }).success).toBe(false);
    expect(heroRowSchema.safeParse({ ...captain, status: "wounded" }).success).toBe(false);
  });

  it("heroes: a hired sword needs its rules id and a hero needs a unit type", () => {
    const ogre = {
      ...captain,
      is_hired_sword: true,
      unit_type_rules_id: null,
      hired_sword_rules_id: "ogre_bodyguard",
      equipment_locked: true,
      is_large: true,
    };
    expect(heroRowSchema.parse(ogre).hired_sword_rules_id).toBe("ogre_bodyguard");
    expect(heroRowSchema.safeParse({ ...ogre, hired_sword_rules_id: null }).success).toBe(false);
    expect(heroRowSchema.safeParse({ ...captain, unit_type_rules_id: null }).success).toBe(false);
  });

  it("henchman_groups", () => {
    expect(henchmanGroupRowSchema.parse(watchmen)).toEqual(watchmen);
    const advanced = {
      ...watchmen,
      xp: 2,
      level_ups: 1,
      stat_increases: { WS: 1 },
    };
    expect(henchmanGroupRowSchema.parse(advanced).stat_increases).toEqual({
      WS: 1,
    });
    expect(
      henchmanGroupRowSchema.safeParse({
        ...watchmen,
        stat_increases: { Sv: 1 },
      }).success,
    ).toBe(false);
    expect(henchmanGroupRowSchema.safeParse({ ...watchmen, size: -1 }).success).toBe(false);
    expect(henchmanGroupRowSchema.parse({ ...watchmen, size: 0 }).size).toBe(0);
  });

  it("items", () => {
    for (const row of reiklandItems) expect(itemRowSchema.parse(row)).toEqual(row);
    const stashed = reiklandItems[reiklandItems.length - 1]!;
    // holder_type and holder_id must agree
    expect(itemRowSchema.safeParse({ ...stashed, holder_id: CAPTAIN_ID }).success).toBe(false);
    expect(itemRowSchema.safeParse({ ...reiklandItems[0], holder_id: null }).success).toBe(false);
    // something must name the stack
    expect(itemRowSchema.safeParse({ ...stashed, item_rules_id: null }).success).toBe(false);
    expect(
      itemRowSchema.parse({
        ...stashed,
        item_rules_id: null,
        custom_name: "Sigmarite relic",
      }).custom_name,
    ).toBe("Sigmarite relic");
    expect(itemRowSchema.safeParse({ ...stashed, quantity: 0 }).success).toBe(false);
  });

  it("campaigns and campaign_members", () => {
    const campaign = {
      id: CAMPAIGN_ID,
      gm_id: GM_ID,
      name: "Ruins of the Stir",
      invite_code: "test-2026",
      settings: {
        startingGold: 500,
        maxRosters: null,
        houseRules: {
          strengthArmourPiercing: false,
          optionalCriticalTables: true,
          halfPriceArmour: true,
        },
        dicePolicy: "players_roll",
        combatMode: "app",
        lockCombatMode: false,
      },
      rules_markdown: "Seed campaign. House rules: no armour erosion, optional criticals, half-price armour.",
      archived: false,
      created_at: T0,
      updated_at: T0,
    };
    expect(campaignRowSchema.parse(campaign)).toEqual(campaign);
    expect(campaignRowSchema.safeParse({ ...campaign, settings: [] }).success).toBe(false);

    const member = {
      campaign_id: CAMPAIGN_ID,
      warband_id: REIKLAND_ID,
      user_id: GM_ID,
      joined_at: T0,
      left_at: null,
    };
    expect(campaignMemberRowSchema.parse(member)).toEqual(member);
    expect(campaignMemberRowSchema.parse({ ...member, left_at: T0 }).left_at).toBe(T0);
  });

  it("campaign_preview coerces member_count from a bigint string", () => {
    const preview = campaignPreviewSchema.parse({
      campaign_id: CAMPAIGN_ID,
      name: "Ruins of the Stir",
      gm_display_name: "Tom (GM)",
      member_count: "2",
      archived: false,
    });
    expect(preview.member_count).toBe(2);
    expect(campaignPreviewSchema.parse({ ...preview, member_count: 3 }).member_count).toBe(3);
  });

  it("scenarios", () => {
    const scenario = {
      id: SCENARIO_ID,
      owner_id: GM_ID,
      campaign_id: CAMPAIGN_ID,
      name: "The Sunken Chapel",
      setting: "Custom",
      summary: "Wade in and hold the altar.",
      rules_markdown: "## Setup\n...",
      created_at: T0,
      updated_at: T0,
    };
    expect(scenarioRowSchema.parse(scenario)).toEqual(scenario);
    expect(scenarioRowSchema.parse({ ...scenario, campaign_id: null }).campaign_id).toBeNull();
  });

  it("matches and match_participants", () => {
    const match = {
      id: MATCH_ID,
      campaign_id: CAMPAIGN_ID,
      scenario_rules_id: "skirmish",
      custom_scenario_id: null,
      state: "scheduled",
      created_by: GM_ID,
      created_via: "gm",
      combat_mode: "app",
      scheduled_for: "2026-09-12T19:30:00+01:00",
      started_at: null,
      completed_at: null,
      notes: "",
      created_at: T0,
      updated_at: T0,
    };
    expect(matchRowSchema.parse(match)).toEqual(match);
    expect(matchRowSchema.safeParse({ ...match, custom_scenario_id: SCENARIO_ID }).success).toBe(false);
    expect(matchRowSchema.safeParse({ ...match, state: "done" }).success).toBe(false);
    expect(matchRowSchema.safeParse({ ...match, created_via: "player" }).success).toBe(false);
    expect(matchRowSchema.parse({ ...match, created_via: "import" }).created_via).toBe("import");

    const participant = {
      match_id: MATCH_ID,
      warband_id: ESHIN_ID,
      invited_at: T0,
      accepted_at: null,
    };
    expect(matchParticipantRowSchema.parse(participant)).toEqual(participant);
  });

  it("battle_sessions, match_reports, pending_advances, trade_phase_state", () => {
    const session = {
      match_id: MATCH_ID,
      warband_id: REIKLAND_ID,
      live_state: { xpLog: [] },
      created_at: T0,
      updated_at: T0,
    };
    expect(battleSessionRowSchema.parse(session)).toEqual(session);
    expect(battleSessionRowSchema.safeParse({ ...session, live_state: [] }).success).toBe(false);

    const report = {
      id: "ffffffff-0000-4000-8000-000000000003",
      match_id: MATCH_ID,
      warband_id: REIKLAND_ID,
      submitted_by: GM_ID,
      won: true,
      xp_log: [{ subjectId: CAPTAIN_ID, reason: "survived", xp: 1 }],
      ooa: [],
      injuries: [],
      loot: { wyrdstone: 3 },
      exploration: { dice: [1, 2, 3, 4, 5] },
      veteran_pool_roll: 7,
      notes: "",
      submitted_at: T0,
    };
    // Migration 7 columns fill in from defaults when absent (older rows / partial selects).
    expect(matchReportRowSchema.parse(report)).toEqual({ ...report, result: "lost", routed: false, applied: {} });
    expect(matchReportRowSchema.safeParse({ ...report, veteran_pool_roll: 1 }).success).toBe(false);

    const advance = {
      id: "ffffffff-0000-4000-8000-000000000004",
      warband_id: REIKLAND_ID,
      subject_type: "group",
      subject_id: WATCHMEN_ID,
      threshold_xp: 2,
      created_at: T0,
      resolved_at: null,
      resolution: null,
      rolled: null,
    };
    expect(pendingAdvanceRowSchema.parse(advance)).toEqual(advance);
    expect(
      pendingAdvanceRowSchema.parse({
        ...advance,
        resolved_at: T0,
        resolution: { kind: "stat", stat: "WS" },
      }).resolution,
    ).toEqual({
      kind: "stat",
      stat: "WS",
    });
    expect(pendingAdvanceRowSchema.safeParse({ ...advance, resolved_at: T0 }).success).toBe(false);
    expect(pendingAdvanceRowSchema.safeParse({ ...advance, threshold_xp: 0 }).success).toBe(false);

    const trade = {
      warband_id: REIKLAND_ID,
      match_id: MATCH_ID,
      wyrdstone_sold: true,
      heroes_searched: [CAPTAIN_ID],
      created_at: T0,
      updated_at: T0,
    };
    expect(tradePhaseStateRowSchema.parse(trade)).toEqual(trade);
  });

  it("audit_log", () => {
    const entry = {
      id: 42,
      at: T0,
      actor_id: GM_ID,
      table_name: "heroes",
      row_id: CAPTAIN_ID,
      warband_id: REIKLAND_ID,
      campaign_id: null,
      action: "update",
      reason: "manual_edit",
      before: { xp: 20 },
      after: { xp: 21 },
    };
    expect(auditLogRowSchema.parse(entry)).toEqual(entry);
    expect(auditLogRowSchema.parse({ ...entry, id: "42" }).id).toBe(42);
    expect(auditLogRowSchema.safeParse({ ...entry, action: "truncate" }).success).toBe(false);
  });
});

describe("stats", () => {
  it("accepts a full integer profile", () => {
    expect(
      statsSchema.parse({
        M: 4,
        WS: 3,
        BS: 3,
        S: 3,
        T: 3,
        W: 1,
        I: 3,
        A: 1,
        Ld: 7,
      }),
    ).toEqual({
      M: 4,
      WS: 3,
      BS: 3,
      S: 3,
      T: 3,
      W: 1,
      I: 3,
      A: 1,
      Ld: 7,
    });
  });

  it("rejects a missing, fractional, or non-numeric stat", () => {
    expect(
      statsSchema.safeParse({
        M: 4,
        WS: 3,
        BS: 3,
        S: 3,
        T: 3,
        W: 1,
        I: 3,
        A: 1,
      }).success,
    ).toBe(false);
    expect(
      statsSchema.safeParse({
        M: 4,
        WS: 3.5,
        BS: 3,
        S: 3,
        T: 3,
        W: 1,
        I: 3,
        A: 1,
        Ld: 7,
      }).success,
    ).toBe(false);
    expect(
      statsSchema.safeParse({
        M: "4",
        WS: 3,
        BS: 3,
        S: 3,
        T: 3,
        W: 1,
        I: 3,
        A: 1,
        Ld: 7,
      }).success,
    ).toBe(false);
    expect(
      heroRowSchema.safeParse({
        ...captain,
        stats: { ...captain.stats, Ld: undefined },
      }).success,
    ).toBe(false);
  });
});

describe("insert schemas", () => {
  it("require only what the database cannot default", () => {
    expect(
      warbandInsertSchema.parse({
        owner_id: PLAYER_ID,
        name: "Claws of Eshin",
        type_rules_id: "skaven_of_clan_eshin",
      }),
    ).toEqual({
      owner_id: PLAYER_ID,
      name: "Claws of Eshin",
      type_rules_id: "skaven_of_clan_eshin",
    });
    expect(warbandInsertSchema.safeParse({ owner_id: PLAYER_ID, name: "" }).success).toBe(false);

    expect(
      heroInsertSchema.parse({
        warband_id: REIKLAND_ID,
        name: "Pieter",
        unit_type_rules_id: "mercenaries_reikland_youngbloods",
        stats: captain.stats,
      }).name,
    ).toBe("Pieter");
    // no unit type and not a hired sword
    expect(
      heroInsertSchema.safeParse({
        warband_id: REIKLAND_ID,
        name: "Pieter",
        stats: captain.stats,
      }).success,
    ).toBe(false);
    expect(
      heroInsertSchema.parse({
        warband_id: REIKLAND_ID,
        name: "Grom",
        is_hired_sword: true,
        hired_sword_rules_id: "ogre_bodyguard",
        stats: captain.stats,
      }).is_hired_sword,
    ).toBe(true);

    expect(
      henchmanGroupInsertSchema.parse({
        warband_id: REIKLAND_ID,
        name: "Watchmen",
        unit_type_rules_id: "mercenaries_reikland_warriors",
        stats: watchmen.stats,
      }).name,
    ).toBe("Watchmen");

    expect(
      itemInsertSchema.parse({
        warband_id: REIKLAND_ID,
        item_rules_id: "dagger",
      }),
    ).toEqual({
      warband_id: REIKLAND_ID,
      item_rules_id: "dagger",
    });
    expect(
      itemInsertSchema.parse({
        warband_id: REIKLAND_ID,
        holder_type: "hero",
        holder_id: CAPTAIN_ID,
        item_rules_id: "sword",
      }).holder_id,
    ).toBe(CAPTAIN_ID);
    expect(
      itemInsertSchema.safeParse({
        warband_id: REIKLAND_ID,
        holder_type: "hero",
        item_rules_id: "sword",
      }).success,
    ).toBe(false);
    expect(
      itemInsertSchema.safeParse({
        warband_id: REIKLAND_ID,
        holder_id: CAPTAIN_ID,
        item_rules_id: "sword",
      }).success,
    ).toBe(false);
    expect(itemInsertSchema.safeParse({ warband_id: REIKLAND_ID }).success).toBe(false);

    expect(
      scenarioInsertSchema.parse({
        owner_id: GM_ID,
        name: "The Sunken Chapel",
      }),
    ).toEqual({
      owner_id: GM_ID,
      name: "The Sunken Chapel",
    });
  });

  it("campaign insert fills partial settings", () => {
    const parsed = campaignInsertSchema.parse({
      gm_id: GM_ID,
      name: "Ruins of the Stir",
      settings: { startingGold: 600 },
    });
    expect(parsed.settings).toEqual({
      startingGold: 600,
      maxRosters: null,
      houseRules: {
        strengthArmourPiercing: false,
        optionalCriticalTables: true,
        halfPriceArmour: true,
      },
      dicePolicy: "players_roll",
        combatMode: "app",
        lockCombatMode: false,
    });
    expect(campaignInsertSchema.parse({ gm_id: GM_ID, name: "Ruins of the Stir" }).settings).toBeUndefined();
  });
});
