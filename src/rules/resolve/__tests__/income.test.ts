import { describe, expect, it } from "vitest";
import { RulesError } from "../errors";
import { effectiveWarbandSize, sellWyrdstone, wyrdstoneQuote } from "../income";
import { makeHenchmanGroup, makeHero, makeHiredSword, makeWarband } from "./fixtures";

describe("effectiveWarbandSize", () => {
  it("counts active heroes and every henchman", () => {
    expect(effectiveWarbandSize(makeWarband())).toBe(4);
  });

  it("ignores hired swords and non-active heroes", () => {
    const wb = makeWarband({
      heroes: [
        makeHero({ id: "a" }),
        makeHero({ id: "b", status: "dead" }),
        makeHero({ id: "c", status: "retired" }),
        makeHero({ id: "d", status: "captured" }),
      ],
      henchmenGroups: [makeHenchmanGroup({ id: "g1", size: 3 }), makeHenchmanGroup({ id: "g2", size: 1 })],
      hiredSwords: [makeHiredSword()],
    });
    expect(effectiveWarbandSize(wb)).toBe(5);
  });
});

describe("sellWyrdstone", () => {
  it("2 shards with 5 models -> 55 gc", () => {
    const wb = makeWarband({ henchmenGroups: [makeHenchmanGroup({ size: 3 })], wyrdstone: 3, gold: 10 });
    expect(effectiveWarbandSize(wb)).toBe(5);
    const { value, events } = sellWyrdstone(wb, 2);
    expect(value.gold).toBe(65);
    expect(value.wyrdstone).toBe(1);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("wyrdstone.sold");
    expect(events[0].message).toBe("Sold 2 wyrdstone for 55 gc (warband size 5)");
  });

  it("3 shards with 12 models -> 60 gc", () => {
    const wb = makeWarband({ henchmenGroups: [makeHenchmanGroup({ size: 10 })], wyrdstone: 3 });
    const { value, events } = sellWyrdstone(wb, 3);
    expect(value.gold).toBe(160);
    expect(value.wyrdstone).toBe(0);
    expect(events[0].message).toBe("Sold 3 wyrdstone for 60 gc (warband size 12)");
  });

  it("9 shards with 2 models -> 155 gc (8+ row)", () => {
    const wb = makeWarband({ henchmenGroups: [], wyrdstone: 9, gold: 0 });
    const { value, events } = sellWyrdstone(wb, 9);
    expect(value.gold).toBe(155);
    expect(events[0].message).toBe("Sold 9 wyrdstone for 155 gc (warband size 2)");
  });

  it("honours sizeOverride", () => {
    const { value } = sellWyrdstone(makeWarband({ gold: 0 }), 1, { sizeOverride: 16 });
    expect(value.gold).toBe(25);
  });

  it("rejects 0, negatives, fractions and more than owned", () => {
    const wb = makeWarband({ wyrdstone: 3 });
    for (const n of [0, -1, 1.5]) {
      expect(() => sellWyrdstone(wb, n)).toThrow(RulesError);
      try {
        sellWyrdstone(wb, n);
      } catch (e) {
        expect((e as RulesError).code).toBe("income.invalidShards");
      }
    }
    expect(() => sellWyrdstone(wb, 4)).toThrow(RulesError);
    try {
      sellWyrdstone(wb, 4);
    } catch (e) {
      expect((e as RulesError).code).toBe("income.notEnoughWyrdstone");
    }
  });

  it("does not mutate the input", () => {
    const wb = makeWarband();
    const before = structuredClone(wb);
    sellWyrdstone(wb, 2);
    expect(wb).toEqual(before);
  });
});

describe("wyrdstoneQuote", () => {
  it("quotes the chart without applying", () => {
    const wb = makeWarband({ henchmenGroups: [makeHenchmanGroup({ size: 3 })] });
    expect(wyrdstoneQuote(wb, 1)).toBe(40);
    expect(wyrdstoneQuote(wb, 2)).toBe(55);
    expect(wyrdstoneQuote(wb, 8)).toBe(140);
    expect(wyrdstoneQuote(wb, 20)).toBe(140);
    expect(wyrdstoneQuote(wb, 0)).toBe(0);
    expect(wyrdstoneQuote(wb, 2, { sizeOverride: 1 })).toBe(60);
    expect(wb.gold).toBe(100);
    expect(wb.wyrdstone).toBe(3);
  });
});
