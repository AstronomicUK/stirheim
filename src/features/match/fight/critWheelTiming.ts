// A gentle-enough curve that every row of the crit wheel is actually readable, not just the last
// couple before it lands: the old 55ms floor with a 2.4 exponent stayed near-illegible for the
// first two-thirds of the spin and only slowed down right at the end.
const TICK_START = 90;
const TICK_EXPONENT = 1.4;
const TICK_END = 380;

/** How long step `i` of `steps` sits highlighted before moving on: fast at first, slow to land. */
export function tickDelay(i: number, steps: number): number {
  return TICK_START + (TICK_END - TICK_START) * (i / (steps - 1)) ** TICK_EXPONENT;
}
