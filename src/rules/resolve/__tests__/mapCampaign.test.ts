import { describe, expect, it } from "vitest";
import { MAP_DISTRICTS, MAP_GATE_IDS, MAP_LINKS, findDistrict } from "../../data/map/districts";
import {
  advantagesFor,
  bridgeTollOwedTo,
  canReach,
  controllerOf,
  defenderLdBonus,
  deriveMapState,
  gateToll,
  reachFor,
  standings,
  suggestedScenario,
  type MapBattleEvent,
  type MapEvent,
} from "../mapCampaign";

const A = "warband-a";
const B = "warband-b";
const C = "warband-c";

function battle(at: string, districtId: string, results: Record<string, "won" | "lost" | "draw" | null>, matchId = at): MapBattleEvent {
  return { kind: "battle", at, matchId, districtId, participants: Object.entries(results).map(([warbandId, result]) => ({ warbandId, result })) };
}

describe("map data", () => {
  it("has thirty districts, four gates and symmetrical links", () => {
    expect(MAP_DISTRICTS).toHaveLength(30);
    expect(MAP_GATE_IDS).toEqual(["river-gate", "east-gate", "south-gate", "west-gate"]);
    for (const d of MAP_DISTRICTS) for (const c of d.connections) expect(findDistrict(c)?.connections).toContain(d.id);
    expect(MAP_LINKS).toHaveLength(63);
    expect(findDistrict("statue-of-count-gotthard")?.connections.sort()).toEqual(["middle-bridge", "raven-barracks", "rich-quarter", "river-gate"]);
  });
});

describe("deriving the map state", () => {
  it("explores for both sides, gives the winner a foothold and takes the loser's away", () => {
    const state = deriveMapState([
      battle("2026-01-01", "west-gate", { [A]: "won", [B]: "lost" }),
      battle("2026-01-02", "west-gate", { [A]: "lost", [B]: "won" }),
    ]);
    const gate = state.districts.get("west-gate")!;
    expect([...gate.explored].sort()).toEqual([A, B]);
    expect([...gate.footholds]).toEqual([B]);
    expect(controllerOf(state, "west-gate")).toBe(B);
  });

  it("a draw explores but changes no footholds; an unreported battle explores only", () => {
    const state = deriveMapState([
      battle("2026-01-01", "west-gate", { [A]: "won", [B]: "lost" }),
      battle("2026-01-02", "west-gate", { [A]: "draw", [B]: "draw" }),
      battle("2026-01-03", "raven-barracks", { [A]: null, [B]: null }),
    ]);
    expect(controllerOf(state, "west-gate")).toBe(A);
    expect(state.districts.get("raven-barracks")!.footholds.size).toBe(0);
    expect(state.districts.get("raven-barracks")!.explored.size).toBe(2);
  });

  it("two footholds mean nobody controls; GM adjustments fold in at their time", () => {
    const state = deriveMapState([
      battle("2026-01-01", "rich-quarter", { [A]: "won", [B]: "lost" }),
      { kind: "adjust", at: "2026-01-02", districtId: "rich-quarter", warbandId: B, field: "foothold", value: true, reason: "played off the app" },
    ]);
    expect(controllerOf(state, "rich-quarter")).toBeNull();
    const later = deriveMapState([
      battle("2026-01-03", "rich-quarter", { [A]: "won", [B]: "lost" }),
      { kind: "adjust", at: "2026-01-02", districtId: "rich-quarter", warbandId: B, field: "foothold", value: true, reason: "" },
    ]);
    expect(controllerOf(later, "rich-quarter")).toBe(A);
  });

  it("ignores districts that are not on the map", () => {
    const state = deriveMapState([battle("2026-01-01", "nowhere", { [A]: "won", [B]: "lost" })]);
    expect(state.districts.size).toBe(0);
  });
});

describe("reach", () => {
  it("a new warband can only fight at the gates", () => {
    const state = deriveMapState([]);
    expect([...reachFor(state, A).reachable].sort()).toEqual([...MAP_GATE_IDS].sort());
    expect(canReach(state, A, "raven-barracks")).toBe(false);
  });

  it("an explored gate opens its neighbours; exploring onward extends the reach", () => {
    const one = deriveMapState([battle("2026-01-01", "west-gate", { [A]: "lost", [B]: "won" })]);
    expect(canReach(one, A, "raven-barracks")).toBe(true);
    expect(canReach(one, A, "rich-quarter")).toBe(false);
    const two = deriveMapState([battle("2026-01-01", "west-gate", { [A]: "lost", [B]: "won" }), battle("2026-01-02", "raven-barracks", { [A]: "won", [C]: "lost" })]);
    expect(canReach(two, A, "rich-quarter")).toBe(true);
    expect(canReach(two, A, "statue-of-count-gotthard")).toBe(true);
    // C explored Raven Barracks but no gate, so it cannot connect it back: gates only.
    expect(canReach(two, C, "rich-quarter")).toBe(false);
  });
});

describe("tolls", () => {
  it("the gate toll is owed without a foothold at the gate, waived with one, nothing at a gate", () => {
    const lost = deriveMapState([battle("2026-01-01", "west-gate", { [A]: "lost", [B]: "won" })]);
    expect(gateToll(lost, A, "raven-barracks")).toBe(5);
    expect(gateToll(lost, B, "raven-barracks")).toBe(0);
    expect(gateToll(lost, A, "west-gate")).toBe(0);
    expect(gateToll(lost, A, "the-pit")).toBeNull();
  });

  it("the Middle Bridge toll is owed to its controller only when the bridge is the only way through", () => {
    const events: MapEvent[] = [
      battle("2026-01-01", "west-gate", { [A]: "won", [B]: "lost" }),
      battle("2026-01-02", "memorial-gardens", { [A]: "won", [B]: "lost" }),
      battle("2026-01-03", "rich-quarter", { [A]: "won", [B]: "lost" }),
      battle("2026-01-04", "middle-bridge", { [A]: "won", [B]: "lost" }),
      battle("2026-01-05", "middle-bridge", { [A]: "lost", [C]: "won" }),
    ];
    const state = deriveMapState(events);
    expect(controllerOf(state, "middle-bridge")).toBe(C);
    // Merchants' Quarter is only next to the bridge on A's explored path.
    expect(bridgeTollOwedTo(state, A, "merchants-quarter")).toBe(C);
    // Count Steinhardt's Palace borders Memorial Gardens too, so no toll.
    expect(bridgeTollOwedTo(state, A, "count-steinhardts-palace")).toBeNull();
    expect(bridgeTollOwedTo(state, C, "merchants-quarter")).toBeNull();
    expect(bridgeTollOwedTo(state, A, "middle-bridge")).toBeNull();
  });
});

describe("the defender's Leadership", () => {
  it("a controller who wins a Surprise Attack keeps +1 Ld in that district; anyone else gets nothing", () => {
    const state = deriveMapState([
      battle("2026-01-01", "rich-quarter", { [A]: "won", [B]: "lost" }),
      { ...battle("2026-01-02", "rich-quarter", { [A]: "won", [B]: "lost" }), scenarioId: "surprise_attack" },
    ]);
    expect(defenderLdBonus(state, "rich-quarter", A)).toBe(1);
    expect(defenderLdBonus(state, "rich-quarter", B)).toBe(0);
    expect(defenderLdBonus(state, "the-pit", A)).toBe(0);
    // Losing the district later does not take the earned bonus away; a non-controller's win earns none.
    const lost = deriveMapState([
      battle("2026-01-01", "rich-quarter", { [A]: "won", [B]: "lost" }),
      { ...battle("2026-01-02", "rich-quarter", { [A]: "won", [B]: "lost" }), scenarioId: "surprise_attack" },
      battle("2026-01-03", "rich-quarter", { [A]: "lost", [B]: "won" }),
      { ...battle("2026-01-04", "rich-quarter", { [A]: "won", [B]: "lost" }), scenarioId: "surprise_attack" },
    ]);
    expect(defenderLdBonus(lost, "rich-quarter", A)).toBe(1);
    expect(defenderLdBonus(lost, "rich-quarter", B)).toBe(0);
    const plain = deriveMapState([{ ...battle("2026-01-01", "rich-quarter", { [A]: "won", [B]: "lost" }), scenarioId: "skirmish" }]);
    expect(defenderLdBonus(plain, "rich-quarter", A)).toBe(0);
  });
});

describe("scenario and advantages", () => {
  it("suggests Surprise Attack against a controller and Defend the Find for two footholds", () => {
    const state = deriveMapState([
      battle("2026-01-01", "rich-quarter", { [A]: "won", [B]: "lost" }),
      battle("2026-01-02", "the-pit", { [A]: "won", [B]: "lost" }),
      { kind: "adjust", at: "2026-01-03", districtId: "the-pit", warbandId: B, field: "foothold", value: true, reason: "" },
    ]);
    expect(suggestedScenario(state, "rich-quarter", [A, B])).toMatchObject({ scenarioId: "surprise_attack", defenderId: A });
    expect(suggestedScenario(state, "the-pit", [A, B])).toMatchObject({ scenarioId: "defend_the_find" });
    expect(suggestedScenario(state, "west-gate", [A, B])).toBeNull();
    expect(suggestedScenario(state, "rich-quarter", [B, C])).toBeNull();
  });

  it("hard fought districts pay only their controller; standings rank by control", () => {
    const state = deriveMapState([
      battle("2026-01-01", "rich-quarter", { [A]: "won", [B]: "lost" }),
      { kind: "adjust", at: "2026-01-02", districtId: "rich-quarter", warbandId: B, field: "foothold", value: true, reason: "" },
      battle("2026-01-03", "raven-barracks", { [A]: "won", [B]: "lost" }),
      { kind: "adjust", at: "2026-01-04", districtId: "raven-barracks", warbandId: B, field: "foothold", value: true, reason: "" },
      battle("2026-01-05", "west-gate", { [B]: "won", [C]: "lost" }),
    ]);
    const a = advantagesFor(state, A);
    expect(a.map((x) => [x.district.id, x.contested])).toEqual([["raven-barracks", false], ["rich-quarter", true]]);
    const table = standings(state, [A, B, C]);
    expect(table[0]).toMatchObject({ warbandId: B, controlled: ["west-gate"] });
    expect(table[0].footholds.sort()).toEqual(["raven-barracks", "rich-quarter", "west-gate"]);
    expect(table[2]).toMatchObject({ warbandId: C, controlled: [], footholds: [], explored: ["west-gate"] });
  });
});
