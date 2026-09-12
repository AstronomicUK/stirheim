// The geometry and timing behind the 3D die in Dice.tsx, kept apart from the components so the
// file with the components stays fast-refreshable and these stay unit-testable.

/**
 * The six faces of a cube that lands showing `value`, in the order the CSS mounts them: front, back,
 * right, left, top, bottom. Opposite faces of a real D6 sum to seven, so the cube reads right from
 * every angle mid-tumble. Other dice (a D3, a D66 tens die) show the result on every face.
 */
export function cubeFaces(value: number, sides = 6): number[] {
  if (sides !== 6 || value < 1 || value > 6) return [value, value, value, value, value, value]
  const rest = [1, 2, 3, 4, 5, 6].filter((f) => f !== value && f !== 7 - value)
  return [value, 7 - value, rest[0], rest[3], rest[1], rest[2]]
}

/** How long the cube travels and tumbles before it comes to rest (matches the CSS keyframes). */
export const TUMBLE_MS = 1120
/** How long the settled face is held before the caller is told, so the result is seen. */
export const SETTLE_MS = 780
