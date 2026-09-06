import { describe, expect, it } from "vitest";
import { scenarioIsKnown, scenarioObjectives } from "../campaign/scenarioObjectives";

describe("what a scenario yields during the battle", () => {
  it("knows a scenario that yields nothing from one it has never heard of", () => {
    // A Skirmish is in the catalogue and places no wyrdstone or treasure: the sheet offers neither.
    expect(scenarioIsKnown("skirmish")).toBe(true);
    expect(scenarioObjectives("skirmish")).toEqual({ wyrdstone: null, treasure: false });

    // Something the group wrote is unknown, and the sheet has to offer both rather than guess.
    expect(scenarioIsKnown("a_scenario_tom_wrote")).toBe(false);
    expect(scenarioIsKnown(null)).toBe(false);
  });

  it("carries the scenario's own wyrdstone rule where it has one", () => {
    const find = scenarioObjectives("defend_the_find");
    expect(find.wyrdstone).toMatch(/One shard of wyrdstone for each Hero/);
    expect(find.treasure).toBe(false);
    expect(scenarioObjectives("wyrdstone_hunt").wyrdstone).not.toBeNull();
    expect(scenarioObjectives("chance_encounter").wyrdstone).not.toBeNull();
  });

  it("spots the scenarios that put treasure on the table", () => {
    expect(scenarioObjectives("hidden_treasure")).toMatchObject({ wyrdstone: null, treasure: true });
    expect(scenarioObjectives("occupy")).toEqual({ wyrdstone: null, treasure: false });
    expect(scenarioObjectives("breakthrough")).toEqual({ wyrdstone: null, treasure: false });
  });
});
