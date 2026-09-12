// The whole To Wound chart as one invariant, verified 2026-09-12 against the rulebook's chart
// artwork as published by the source site (docs/audits/2026-09-12-source-verification/
// wound-chart-shooting.jpg and wound-chart-cc.jpg; tracker #167). Every row follows the same
// diagonal: 4 when Toughness equals Strength, 5 one above, 6 two and three above, a dash from
// four above; 3 one below, 2 from two below. The text scrape once had S2/T5 as a dash — a
// transcription slip — so that cell is pinned by name.

import { describe, expect, it } from "vitest";
import { IMPOSSIBLE, type Threshold } from "../dice";
import { toWoundThreshold } from "../toWound";

function expected(strength: number, toughness: number): Threshold {
  const gap = toughness - strength;
  if (gap >= 4) return IMPOSSIBLE;
  if (gap === 3 || gap === 2) return 6;
  if (gap === 1) return 5;
  if (gap === 0) return 4;
  if (gap === -1) return 3;
  return 2;
}

describe("To Wound chart (#167 source verification)", () => {
  it("Strength 2 against Toughness 5 needs a 6, not a dash — the original chart image, not the scrape", () => {
    expect(toWoundThreshold(2, 5)).toBe(6);
    expect(toWoundThreshold(2, 6)).toBe(IMPOSSIBLE);
  });

  it("every one of the 100 cells follows the chart's diagonal", () => {
    for (let s = 1; s <= 10; s++) {
      for (let t = 1; t <= 10; t++) {
        expect(toWoundThreshold(s, t), `S${s} vs T${t}`).toBe(expected(s, t));
      }
    }
  });

  it("matches the rows the images show for Strength 1 to 3", () => {
    const row = (s: number) => Array.from({ length: 10 }, (_, i) => toWoundThreshold(s, i + 1));
    const dash = IMPOSSIBLE;
    expect(row(1)).toEqual([4, 5, 6, 6, dash, dash, dash, dash, dash, dash]);
    expect(row(2)).toEqual([3, 4, 5, 6, 6, dash, dash, dash, dash, dash]);
    expect(row(3)).toEqual([2, 3, 4, 5, 6, 6, dash, dash, dash, dash]);
  });
});
