/** Decorative dice only: the displayed pips never represent a generated game result. */
export function RollDiceIcon() {
  const faces = [[1, 5, 9], [3, 7], [5], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]]
  return (
    <span className="stirheim-dice-pair" aria-hidden="true">
      {[0, 1].map((die) => (
        <span key={die} className="stirheim-dice-cube">
          {faces.map((pips, face) => (
            <span key={face} className="stirheim-dice-face">
              {pips.map((cell) => (
                <span key={cell} className="stirheim-dice-pip" style={{ gridColumn: (cell - 1) % 3 + 1, gridRow: Math.floor((cell - 1) / 3) + 1 }} />
              ))}
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}
