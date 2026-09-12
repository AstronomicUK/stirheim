import { describe, expect, it } from "vitest";
import type { RosterHero, RosterItem, RosterWarband } from "../../types/roster";
import { allocateAddictionBatches, unsuppliedAddicts } from "../addiction";

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };
const SHADE = "crimson_shade";

function hero(id: string, extra: Partial<RosterHero> = {}): RosterHero {
  return { id, name: id, unitTemplateId: "captain", stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: "active", ...extra };
}
const addict = (id: string, equipment: RosterItem[] = [], extra: Partial<RosterHero> = {}) => hero(id, { flags: { addictedTo: [SHADE] }, equipment, ...extra });
function warband(heroes: RosterHero[], stash: RosterItem[] = []): RosterWarband {
  return { id: "w", name: "W", warbandTemplateId: "mercenaries_reikland", gold: 0, wyrdstone: 0, veteranPool: null, heroes, hiredSwords: [], henchmenGroups: [], stash };
}
const sources = (w: RosterWarband) => allocateAddictionBatches(w).map((l) => [l.heroId, l.source]);

describe("Crimson Shade addiction supply (02:1983)", () => {
  it("a hero's own kit supplies him first, and never anyone else", () => {
    const w = warband([addict("kurt", [{ itemId: SHADE, quantity: 1 }]), addict("otto")]);
    expect(sources(w)).toEqual([["kurt", "kit"], ["otto", null]]);
    expect(unsuppliedAddicts(w).map((l) => l.heroName)).toEqual(["otto"]);
  });

  it("one stash dose supplies exactly one addict — the earlier one in roster order", () => {
    const w = warband([addict("kurt"), addict("otto")], [{ itemId: SHADE, quantity: 1 }]);
    expect(sources(w)).toEqual([["kurt", "stash"], ["otto", null]]);
  });

  it("stash quantity is counted: two doses supply two addicts, a kit dose does not draw on the stash", () => {
    expect(sources(warband([addict("kurt"), addict("otto")], [{ itemId: SHADE, quantity: 2 }]))).toEqual([["kurt", "stash"], ["otto", "stash"]]);
    const w = warband([addict("kurt", [{ itemId: SHADE, quantity: 1 }]), addict("otto"), addict("pip")], [{ itemId: SHADE, quantity: 1 }]);
    expect(sources(w)).toEqual([["kurt", "kit"], ["otto", "stash"], ["pip", null]]);
  });

  it("ignores non-addicts, inactive heroes, other items and zero-quantity rows", () => {
    const w = warband(
      [hero("clean", { equipment: [{ itemId: SHADE, quantity: 3 }] }), addict("dead", [], { status: "dead" }), addict("kurt", [{ itemId: SHADE, quantity: 0 }, { itemId: "mandrake_root", quantity: 2 }])],
      [{ itemId: "mandrake_root", quantity: 5 }, { itemId: SHADE, quantity: 0 }],
    );
    expect(sources(w)).toEqual([["kurt", null]]);
  });

  it("is empty for a warband with no addicts", () => {
    expect(allocateAddictionBatches(warband([hero("a"), hero("b")], [{ itemId: SHADE, quantity: 4 }]))).toEqual([]);
  });
});
