// Map campaigns (Phase 19): the state of the Mordheim Campaign Map for one campaign, derived from
// what happened rather than stored. Every battle fought in a district explores it for both sides;
// the winner gains a foothold and the loser loses theirs; a draw changes no footholds. The GM's
// corrections (map_adjustments) are folded in at their own time. From that state: who controls a
// district (the only warband with a foothold), which districts a warband can reach (a path from a
// gate through districts it has explored, then one step further), the gate toll, the Middle Bridge
// toll, the scenario the rules call for, and the advantages a warband enjoys.
//
// Rules: reference/map/campaign-rules.md.

import { findDistrict, GATE_TOLL_GC, MAP_DISTRICTS, MAP_GATE_IDS, type MapDistrict } from "../data/map/districts";

export type MapResult = "won" | "lost" | "draw";

export interface MapBattleEvent {
  kind: "battle";
  /** ISO time; events fold in time order. */
  at: string;
  matchId: string;
  districtId: string;
  /** Every participant, with the result they reported (null until they file). */
  participants: { warbandId: string; result: MapResult | null }[];
}

export interface MapAdjustmentEvent {
  kind: "adjust";
  at: string;
  districtId: string;
  warbandId: string;
  field: "explored" | "foothold";
  value: boolean;
  reason: string;
}

export type MapEvent = MapBattleEvent | MapAdjustmentEvent;

export interface DistrictState {
  /** Warbands that have fought here (or been marked as having explored it). */
  explored: Set<string>;
  /** Warbands holding a foothold here. */
  footholds: Set<string>;
}

export interface MapState {
  districts: Map<string, DistrictState>;
}

function stateFor(state: MapState, districtId: string): DistrictState {
  let d = state.districts.get(districtId);
  if (!d) {
    d = { explored: new Set(), footholds: new Set() };
    state.districts.set(districtId, d);
  }
  return d;
}

export function emptyMapState(): MapState {
  return { districts: new Map() };
}

/** Fold the events, oldest first, into the map state. */
export function deriveMapState(events: readonly MapEvent[]): MapState {
  const state = emptyMapState();
  const ordered = [...events].sort((a, b) => a.at.localeCompare(b.at));
  for (const e of ordered) {
    if (!findDistrict(e.districtId)) continue;
    const d = stateFor(state, e.districtId);
    if (e.kind === "battle") {
      for (const p of e.participants) d.explored.add(p.warbandId);
      const winners = e.participants.filter((p) => p.result === "won");
      const losers = e.participants.filter((p) => p.result === "lost");
      for (const w of winners) d.footholds.add(w.warbandId);
      if (winners.length > 0) for (const l of losers) d.footholds.delete(l.warbandId);
    } else {
      const set = e.field === "explored" ? d.explored : d.footholds;
      if (e.value) set.add(e.warbandId);
      else set.delete(e.warbandId);
    }
  }
  return state;
}

export function districtState(state: MapState, districtId: string): DistrictState {
  return state.districts.get(districtId) ?? { explored: new Set(), footholds: new Set() };
}

/** The single warband with a foothold, or null when nobody or more than one holds one. */
export function controllerOf(state: MapState, districtId: string): string | null {
  const f = districtState(state, districtId).footholds;
  return f.size === 1 ? [...f][0] : null;
}

export function hasFoothold(state: MapState, districtId: string, warbandId: string): boolean {
  return districtState(state, districtId).footholds.has(warbandId);
}

export function hasExplored(state: MapState, districtId: string, warbandId: string): boolean {
  return districtState(state, districtId).explored.has(warbandId);
}

/** Districts the warband has explored that connect back to a gate through explored districts. */
function exploredFromGates(state: MapState, warbandId: string, exclude?: string): Set<string> {
  const seen = new Set<string>();
  const queue: string[] = [];
  for (const g of MAP_GATE_IDS) {
    if (g !== exclude && hasExplored(state, g, warbandId)) {
      seen.add(g);
      queue.push(g);
    }
  }
  while (queue.length) {
    const id = queue.shift()!;
    for (const n of findDistrict(id)?.connections ?? []) {
      if (n === exclude || seen.has(n) || !hasExplored(state, n, warbandId)) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return seen;
}

export interface Reach {
  /** Every district the warband may fight in next. */
  reachable: Set<string>;
  /** Of those, the ones it has explored and that connect to a gate. */
  explored: Set<string>;
}

/**
 * Where a warband can fight: any gate (that is how everyone enters), any explored district that
 * connects to a gate through explored districts, and every neighbour of those.
 */
export function reachFor(state: MapState, warbandId: string): Reach {
  const explored = exploredFromGates(state, warbandId);
  const reachable = new Set<string>(MAP_GATE_IDS);
  for (const id of explored) {
    reachable.add(id);
    for (const n of findDistrict(id)?.connections ?? []) reachable.add(n);
  }
  return { reachable, explored };
}

export function canReach(state: MapState, warbandId: string, districtId: string): boolean {
  return reachFor(state, warbandId).reachable.has(districtId);
}

/**
 * The gate toll: a warband without a foothold at the gate it enters through pays 5 gc to fight in
 * another district. Free when the battle is at a gate, or when some path to the district starts at
 * a gate where the warband has a foothold. Null when the district cannot be reached at all.
 */
export function gateToll(state: MapState, warbandId: string, districtId: string): number | null {
  const district = findDistrict(districtId);
  if (!district) return null;
  if (district.gate) return 0;
  const reach = reachFor(state, warbandId);
  if (!reach.reachable.has(districtId)) return null;
  // Which gates start a path (through explored districts) that ends next to or at the district?
  const gatesThatWork = MAP_GATE_IDS.filter((g) => {
    if (!hasExplored(state, g, warbandId)) return false;
    const seen = new Set<string>([g]);
    const queue = [g];
    while (queue.length) {
      const id = queue.shift()!;
      if (id === districtId || (findDistrict(id)?.connections ?? []).includes(districtId)) return true;
      for (const n of findDistrict(id)?.connections ?? []) {
        if (!seen.has(n) && hasExplored(state, n, warbandId)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    return false;
  });
  // A gate adjacent to the district works even when unexplored (the warband enters there).
  for (const g of MAP_GATE_IDS) if ((findDistrict(g)?.connections ?? []).includes(districtId) && !gatesThatWork.includes(g)) gatesThatWork.push(g);
  if (gatesThatWork.some((g) => hasFoothold(state, g, warbandId))) return 0;
  return GATE_TOLL_GC;
}

/**
 * The Middle Bridge toll: 2D6 gc to the bridge's controller when another warband has to pass
 * through the bridge to reach the battle. Returns the controller owed, or null when no toll is due
 * (nobody controls the bridge, the warband controls it, the battle is at the bridge, or the
 * district can be reached without crossing it).
 */
export function bridgeTollOwedTo(state: MapState, warbandId: string, districtId: string): string | null {
  const BRIDGE = "middle-bridge";
  const controller = controllerOf(state, BRIDGE);
  if (!controller || controller === warbandId || districtId === BRIDGE) return null;
  if (!canReach(state, warbandId, districtId)) return null;
  // Reachable without the bridge?
  const explored = exploredFromGates(state, warbandId, BRIDGE);
  const reachable = new Set<string>(MAP_GATE_IDS);
  for (const id of explored) {
    reachable.add(id);
    for (const n of findDistrict(id)?.connections ?? []) if (n !== BRIDGE) reachable.add(n);
  }
  return reachable.has(districtId) ? null : controller;
}

export interface ScenarioSuggestion {
  scenarioId: "surprise_attack" | "defend_the_find";
  title: string;
  /** For Surprise Attack: the warband that controls the district. */
  defenderId: string | null;
  text: string;
}

/** What the map rules say to play when these warbands meet in this district. */
export function suggestedScenario(state: MapState, districtId: string, warbandIds: readonly string[]): ScenarioSuggestion | null {
  const controller = controllerOf(state, districtId);
  if (controller && warbandIds.includes(controller) && warbandIds.length > 1) {
    return {
      scenarioId: "surprise_attack",
      title: "Surprise Attack",
      defenderId: controller,
      text: "One side controls this district: play Surprise Attack with the controller defending. If the defender wins, its leader gains +1 Ld for every battle fought in this district.",
    };
  }
  const withFoothold = warbandIds.filter((w) => hasFoothold(state, districtId, w));
  if (withFoothold.length >= 2) {
    return {
      scenarioId: "defend_the_find",
      title: "Defend the Find",
      defenderId: null,
      text: "Both sides have a foothold here: play Defend the Find. The winner's leader, a Hero or a Henchman group gains +1 extra Experience.",
    };
  }
  return null;
}

export interface DistrictAdvantage {
  district: MapDistrict;
  /** True when the warband merely has a foothold in a Hard Fought district someone else controls (no advantage). */
  contested: boolean;
}

/** The districts whose advantages a warband enjoys: a foothold, and control where the district is Hard Fought. */
export function advantagesFor(state: MapState, warbandId: string): DistrictAdvantage[] {
  const out: DistrictAdvantage[] = [];
  for (const d of MAP_DISTRICTS) {
    if (!hasFoothold(state, d.id, warbandId)) continue;
    const contested = d.hard && controllerOf(state, d.id) !== warbandId;
    out.push({ district: d, contested });
  }
  return out;
}

export interface WarbandStanding {
  warbandId: string;
  controlled: string[];
  footholds: string[];
  explored: string[];
}

export function standings(state: MapState, warbandIds: readonly string[]): WarbandStanding[] {
  return warbandIds
    .map((warbandId) => {
      const controlled: string[] = [];
      const footholds: string[] = [];
      const explored: string[] = [];
      for (const d of MAP_DISTRICTS) {
        const s = districtState(state, d.id);
        if (s.explored.has(warbandId)) explored.push(d.id);
        if (s.footholds.has(warbandId)) {
          footholds.push(d.id);
          if (s.footholds.size === 1) controlled.push(d.id);
        }
      }
      return { warbandId, controlled, footholds, explored };
    })
    .sort((a, b) => b.controlled.length - a.controlled.length || b.footholds.length - a.footholds.length || b.explored.length - a.explored.length);
}

/** Short flag words for a district, for tags. */
export function districtFlags(d: MapDistrict): string[] {
  const out: string[] = [];
  if (d.gate) out.push("Gate");
  if (d.hard) out.push("Hard Fought");
  if (d.abundance) out.push("Wyrdstone");
  return out;
}
