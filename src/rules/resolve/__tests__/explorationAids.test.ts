import { describe, expect, it } from "vitest";
import type { RosterHero, RosterItem, RosterWarband } from "../../types/roster";
import { aidUsesLeft, explorationAids, leadershipTest, mordheimMapResult, validateAidUse } from "../explorationAids";

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 };
const hero = (id: string, equipment: RosterItem[], unit = "mercenaries_reikland_champions"): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment, status: "active",
});
const warband = (heroes: RosterHero[], templateId = "mercenaries_reikland", stash: RosterItem[] = []): RosterWarband => ({
  id: "w", name: "W", warbandTemplateId: templateId, gold: 0, wyrdstone: 0, veteranPool: null, heroes, henchmenGroups: [], hiredSwords: [], stash,
});
const base = { houseRules: { rabbitsFootBattleOnly: true }, heroesOutOfAction: [] as string[], preBattle: {} as Record<string, string> };

describe("exploration aids", () => {
  it("reads the map's grade from its purchase note", () => {
    expect(mordheimMapResult(3).grade).toBe("Vague");
    expect(mordheimMapResult(5).grade).toBe("Accurate");
    const w = warband([hero("a", [{ itemId: "mordheim_map", quantity: 1, notes: mordheimMapResult(5).note }])]);
    const aids = explorationAids(w, base);
    expect(aids).toHaveLength(1);
    expect(aids[0]).toMatchObject({ kind: "reroll", uses: 3, label: "Mordheim Map (Accurate)" });
    const fake = warband([hero("a", [{ itemId: "mordheim_map", quantity: 1, notes: mordheimMapResult(1).note }])]);
    expect(explorationAids(fake, base)).toEqual([]);
  });

  it("a Master map needs its owner standing; a Pendulum needs a Leadership test", () => {
    const w = warband([hero("a", [{ itemId: "mordheim_map", quantity: 1, notes: mordheimMapResult(6).note }, { itemId: "wyrdstone_pendulum", quantity: 1 }])]);
    expect(explorationAids(w, base).map((a) => a.key)).toEqual(["map:a", "pendulum:a"]);
    expect(explorationAids(w, { ...base, heroesOutOfAction: ["a"] })).toEqual([]);
    const pendulum = explorationAids(w, base)[1];
    expect(pendulum.requiresTest).toEqual({ stat: "Ld", value: 8 });
    expect(leadershipTest([4, 4], 8)).toBe(true);
    expect(leadershipTest([5, 4], 8)).toBe(false);
    expect(() => validateAidUse(pendulum, { aidKey: pendulum.key, label: pendulum.label, dieIndex: 0, from: 1, to: 6 })).toThrow(/Ld test/);
    expect(() => validateAidUse(pendulum, { aidKey: pendulum.key, label: pendulum.label, dieIndex: 0, from: 1, to: 6, test: { rolls: [3, 3], passed: true } })).not.toThrow();
  });

  it("the Rabbit's Foot obeys the house rule and the Tarot needs a pre-battle pass", () => {
    const w = warband([hero("a", [{ itemId: "rabbits_foot", quantity: 1 }, { itemId: "tarot_cards", quantity: 1 }])]);
    expect(explorationAids(w, base)).toEqual([]);
    expect(explorationAids(w, { ...base, houseRules: { rabbitsFootBattleOnly: false } }).map((a) => a.key)).toEqual(["rabbit:a"]);
    const tarot = explorationAids(w, { ...base, preBattle: { "tarot:a": "passed" } });
    expect(tarot[0]).toMatchObject({ kind: "modify", uses: 1 });
    expect(() => validateAidUse(tarot[0], { aidKey: tarot[0].key, label: "Tarot Cards", dieIndex: 0, from: 3, to: 5 })).toThrow(/exactly one/);
    expect(aidUsesLeft(tarot[0], [{ aidKey: tarot[0].key, label: "Tarot Cards", dieIndex: 0, from: 3, to: 4 }])).toBe(0);
  });

  it("the Augur rolls two dice and keeps one", () => {
    const w = warband([hero("aug", [], "sisters_of_sigmar_augur")], "sisters_of_sigmar");
    expect(explorationAids(w, base)[0]).toMatchObject({ kind: "rerollKeepEither", key: "keepone:aug" });
    expect(explorationAids(w, { ...base, heroesOutOfAction: ["aug"] })).toEqual([]);
  });
});
