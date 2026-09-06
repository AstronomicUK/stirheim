import { describe, expect, it } from "vitest";
import { lookupReward, rewardsEligible } from "../../data/campaign/rewards";
import type { RosterHero, RosterWarband } from "../../types/roster";
import { emptyRewardChoices, planReward } from "../rewards";

const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 };
const magister: RosterHero = {
  id: "mag",
  name: "Vhorsk",
  unitTemplateId: "cult_of_the_possessed_magister",
  stats,
  xp: 6,
  levelUps: 2,
  skillTableIds: ["combat", "academic", "speed"],
  skillIds: ["step_aside", "resilient"],
  spellIds: [],
  injuries: [],
  flags: {},
  equipment: [{ itemId: "sword", quantity: 1 }, { itemId: "dagger", quantity: 1 }, { itemId: "chaos_armour", quantity: 1 }],
  status: "active",
};
const roster: RosterWarband = { id: "w", name: "The Hollow Choir", warbandTemplateId: "cult_of_the_possessed", gold: 30, wyrdstone: 0, veteranPool: null, heroes: [magister], henchmenGroups: [], hiredSwords: [], stash: [{ itemId: "dagger", quantity: 1 }] };
const choices = (over: Partial<ReturnType<typeof emptyRewardChoices>>) => ({ ...emptyRewardChoices(), ...over });

describe("Rewards of the Shadowlord", () => {
  it("is for the Possessed Magister and Mutants only", () => {
    expect(rewardsEligible("cult_of_the_possessed", "cult_of_the_possessed_magister")).toBe(true);
    expect(rewardsEligible("cult_of_the_possessed", "cult_of_the_possessed_mutants")).toBe(true);
    expect(rewardsEligible("cult_of_the_possessed", "cult_of_the_possessed_the_possessed")).toBe(false);
    expect(rewardsEligible("carnival_of_chaos", "carnival_of_chaos_carnival_master")).toBe(false);
    expect(lookupReward(2).kind).toBe("wrath");
    expect(lookupReward(6).kind).toBe("nothing");
    expect(lookupReward(12).kind).toBe("possessed");
  });

  it("asks for the dice first, then applies Wrath with the kit gone and Nothing as a spent advance", () => {
    expect(planReward(roster, magister, emptyRewardChoices()).need).toBe("dice");
    const wrath = planReward(roster, magister, choices({ dice: [1, 1] }));
    expect(wrath.result?.hero).toMatchObject({ status: "retired", equipment: [] });
    expect(wrath.result?.roster.stash).toEqual(roster.stash);
    expect(wrath.result?.summary).toMatch(/vanishes with his kit/);
    const nothing = planReward(roster, magister, choices({ dice: [2, 3] }));
    expect(nothing.result?.hero).toEqual(magister);
    expect(nothing.result?.summary).toMatch(/advance is spent/);
  });

  it("Mutation: a 1 costs a characteristic of the player's choice, 2+ gives a chosen mutation free", () => {
    expect(planReward(roster, magister, choices({ dice: [3, 4] })).need).toBe("mutationD6");
    expect(planReward(roster, magister, choices({ dice: [3, 4], mutationD6: 1 })).need).toBe("lostStat");
    const atrophy = planReward(roster, magister, choices({ dice: [3, 4], mutationD6: 1, lostStat: "T" }));
    expect(atrophy.result?.hero.stats.T).toBe(2);
    expect(planReward(roster, magister, choices({ dice: [3, 4], mutationD6: 4 })).need).toBe("mutation");
    const claw = planReward(roster, magister, choices({ dice: [3, 4], mutationD6: 4, mutationId: "great_claw" }));
    expect(claw.result?.hero.equipment.some((e) => e.itemId === "great_claw")).toBe(true);
    expect(claw.result?.roster.gold).toBe(30);
  });

  it("Chaos Armour and a Daemon Weapon join the kit; the weapon needs its form", () => {
    const armour = planReward(roster, magister, choices({ dice: [4, 5] }));
    expect(armour.result?.hero.equipment.filter((e) => e.itemId === "chaos_armour")).toHaveLength(2);
    expect(planReward(roster, magister, choices({ dice: [5, 6] })).need).toBe("weaponForm");
    const weapon = planReward(roster, magister, choices({ dice: [5, 6], weaponForm: "axe" }));
    expect(weapon.result?.hero.equipment.at(-1)).toEqual({ itemId: "daemon_weapon", quantity: 1, notes: "form: axe" });
  });

  it("Possessed!: +1 WS S A W, D3 skills lost, everything but Chaos Armour and Daemon weapons to the stash", () => {
    expect(planReward(roster, magister, choices({ dice: [6, 6] })).need).toBe("skillsD6");
    const pick = planReward(roster, magister, choices({ dice: [6, 6], skillsD6: 3 }));
    expect(pick.need).toBe("lostSkills");
    expect(pick.skillsToLose).toBe(2);
    const done = planReward(roster, magister, choices({ dice: [6, 6], skillsD6: 3, lostSkillIds: ["step_aside", "resilient"] }));
    const hero = done.result!.hero;
    expect(hero.stats).toMatchObject({ WS: 5, S: 4, A: 2, W: 2 });
    expect(hero.skillIds).toEqual([]);
    expect(hero.flags.daemonPossessed).toBe(true);
    expect(hero.equipment).toEqual([{ itemId: "chaos_armour", quantity: 1 }]);
    // The sword joins the stash; the dagger stacks with the one already there.
    expect(done.result!.roster.stash).toEqual([{ itemId: "dagger", quantity: 2 }, { itemId: "sword", quantity: 1 }]);
    expect(done.result!.stashed).toEqual(["Sword", "Dagger"]);
    // A hero with one skill only loses one even on a high D3.
    const oneSkill = { ...magister, skillIds: ["resilient"] };
    expect(planReward(roster, oneSkill, choices({ dice: [6, 6], skillsD6: 6, lostSkillIds: ["resilient"] })).result?.hero.skillIds).toEqual([]);
  });
});
