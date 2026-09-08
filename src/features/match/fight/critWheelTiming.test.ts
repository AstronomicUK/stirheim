import { describe, expect, it } from "vitest";
import { tickDelay } from "./critWheelTiming";

// A 6-row table doing 2 full spins plus landing on row 2 (steps = 6*2 + 2 + 1 = 15), the shape
// Tom's report was about: "so fast I couldn't check" once the great majority of rows flashed by
// under 100ms.
describe("tickDelay", () => {
  const steps = 15;

  it("never drops below a readable floor, even on the very first row", () => {
    for (let i = 0; i < steps; i++) {
      expect(tickDelay(i, steps)).toBeGreaterThanOrEqual(90);
    }
  });

  it("spends most of the sequence well above the old ~100ms illegible range", () => {
    const delays = Array.from({ length: steps }, (_, i) => tickDelay(i, steps));
    const readable = delays.filter((d) => d >= 150).length;
    expect(readable).toBeGreaterThan(steps / 2);
  });

  it("still ramps up to a slow, clear landing", () => {
    expect(tickDelay(steps - 1, steps)).toBe(380);
    expect(tickDelay(0, steps)).toBe(90);
  });
});
