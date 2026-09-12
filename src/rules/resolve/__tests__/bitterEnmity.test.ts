import { describe, expect, it } from "vitest";
import type { BitterEnmityTarget } from "../../types/roster";
import { bitterEnmityApplies, bitterEnmityScope, describeBitterEnmity, resolveBitterEnmityTarget, type EnemyWarbandInfo } from "../bitterEnmity";

const cult: EnemyWarbandInfo = {
  id: "cult", name: "Test Cult", typeId: "cult_of_the_possessed", typeName: "Cult of the Possessed", leaderId: "magister", leaderName: "Magister",
  models: [{ id: "magister", name: "Magister", kind: "hero" }, { id: "beggar", name: "Beggar", kind: "hiredSword" }, { id: "brethren", name: "Brethren", kind: "group" }],
};
const base = (roll: number): BitterEnmityTarget => ({ scope: bitterEnmityScope(roll), roll, text: "printed text", source: "unresolved" });
const byMagister = { warbandId: "cult", modelId: "magister", name: "Magister" };
const byBrethren = { warbandId: "cult", modelId: "brethren", name: "Brethren" };
const byFall = { warbandId: null, modelId: null, name: "a fall" };

describe("Bitter Enmity targets (#96)", () => {
  it("maps the D6 to the printed scopes", () => {
    expect([1, 2, 3, 4, 5, 6].map(bitterEnmityScope)).toEqual(["individual", "individual", "individual", "leader", "warband", "warbandType"]);
  });

  it("1-3: the individual from the battle record; a henchman culprit means the enemy leader instead", () => {
    expect(resolveBitterEnmityTarget(base(2), byMagister, [cult])).toMatchObject({ source: "attribution", warriorId: "magister", warriorName: "Magister", warbandId: "cult", warbandName: "Test Cult" });
    expect(resolveBitterEnmityTarget(base(1), byBrethren, [cult])).toMatchObject({ source: "attribution", warriorId: "magister", warriorName: "Magister" });
    expect(resolveBitterEnmityTarget(base(3), { warbandId: "cult", modelId: "beggar", name: "Beggar" }, [cult])).toMatchObject({ warriorId: "beggar", warriorName: "Beggar" });
  });

  it("4, 5, 6: the enemy leader, the whole warband, all warbands of that type", () => {
    expect(resolveBitterEnmityTarget(base(4), byBrethren, [cult])).toMatchObject({ scope: "leader", warriorId: "magister", warbandId: "cult" });
    expect(resolveBitterEnmityTarget(base(5), byMagister, [cult])).toMatchObject({ scope: "warband", warbandId: "cult", warbandName: "Test Cult", warriorId: undefined });
    expect(resolveBitterEnmityTarget(base(6), byMagister, [cult])).toMatchObject({ scope: "warbandType", warbandTypeId: "cult_of_the_possessed", warbandTypeName: "Cult of the Possessed" });
  });

  it("never guesses: a fall, no record and no choice stays unresolved with the printed text", () => {
    for (const roll of [1, 4, 5, 6]) {
      const t = resolveBitterEnmityTarget(base(roll), byFall, [cult]);
      expect(t.source).toBe("unresolved");
      expect(t.warriorId).toBeUndefined();
      expect(describeBitterEnmity(t)).toBe("printed text");
      expect(bitterEnmityApplies({ bitterEnmity: t }, { warriorId: "magister", warbandId: "cult", isLeader: true })).toBeNull();
    }
    expect(resolveBitterEnmityTarget(base(1), undefined, [cult]).source).toBe("unresolved");
  });

  it("the player's choice fills a gap the record left, and is marked as chosen", () => {
    expect(resolveBitterEnmityTarget(base(2), byFall, [cult], { warbandId: "cult", modelId: "beggar" })).toMatchObject({ source: "chosen", warriorId: "beggar" });
    expect(resolveBitterEnmityTarget(base(2), undefined, [cult], { warbandId: "cult", modelId: null })).toMatchObject({ source: "chosen", warriorId: "magister" });
    // The record, when it names an enemy, wins over the choice.
    expect(resolveBitterEnmityTarget(base(2), byMagister, [cult], { warbandId: "cult", modelId: "beggar" })).toMatchObject({ source: "attribution", warriorId: "magister" });
  });

  it("a culprit the enemy roster no longer lists keeps the recorded name", () => {
    expect(resolveBitterEnmityTarget(base(1), { warbandId: "cult", modelId: "gone", name: "Old Foe" }, [cult])).toMatchObject({ source: "attribution", warriorId: "gone", warriorName: "Old Foe" });
  });

  it("applies against the right opponents, and reads well", () => {
    const individual = resolveBitterEnmityTarget(base(1), byMagister, [cult]);
    expect(bitterEnmityApplies({ bitterEnmity: individual }, { warriorId: "magister", warbandId: "cult", isLeader: true })?.applies).toBe(true);
    expect(bitterEnmityApplies({ bitterEnmity: individual }, { warriorId: "beggar", warbandId: "cult", isLeader: false })?.applies).toBe(false);
    const leader = resolveBitterEnmityTarget(base(4), byBrethren, [cult]);
    // The leader at the time is hated; a successor who later leads the same warband is not.
    expect(bitterEnmityApplies({ bitterEnmity: leader }, { warriorId: "magister", warbandId: "cult", isLeader: false })?.applies).toBe(true);
    expect(bitterEnmityApplies({ bitterEnmity: leader }, { warriorId: "someone_new", warbandId: "cult", isLeader: true })?.applies).toBe(false);
    const warband = resolveBitterEnmityTarget(base(5), byMagister, [cult]);
    expect(bitterEnmityApplies({ bitterEnmity: warband }, { warriorId: "beggar", warbandId: "cult", isLeader: false })?.applies).toBe(true);
    expect(bitterEnmityApplies({ bitterEnmity: warband }, { warriorId: "x", warbandId: "other", isLeader: false })?.applies).toBe(false);
    const type = resolveBitterEnmityTarget(base(6), byMagister, [cult]);
    expect(bitterEnmityApplies({ bitterEnmity: type }, { warriorId: "x", warbandId: "another_cult", warbandTypeId: "cult_of_the_possessed", isLeader: false })?.applies).toBe(true);
    expect(bitterEnmityApplies({ bitterEnmity: type }, { warriorId: "x", warbandId: "elves", warbandTypeId: "shadow_warriors", isLeader: false })?.applies).toBe(false);
    expect(describeBitterEnmity(individual)).toBe("Magister (Test Cult)");
    expect(describeBitterEnmity(leader)).toBe("Magister, leader of Test Cult");
    expect(describeBitterEnmity(warband)).toBe("Test Cult (the whole warband)");
    expect(describeBitterEnmity(type)).toBe("all Cult of the Possessed warbands");
    expect(bitterEnmityApplies({ hates: "legacy prose only" }, { warriorId: "x", warbandId: "y", isLeader: false })).toBeNull();
  });
});
