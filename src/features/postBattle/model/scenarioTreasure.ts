/** Archive Pestilen, The Wizard's Tower: Treasures table. Keep raw dice for the report. */
export interface TowerChest { result: number | null; goldDice: (number | null)[] }
export function towerTreasure(chests: TowerChest[] = []) {
  let gold = 0
  const problems: string[] = []
  const notes: string[] = []
  chests.forEach((chest, index) => {
    const label = `Wizard’s Tower chest ${index + 1}`
    if (!Number.isInteger(chest.result) || chest.result! < 1 || chest.result! > 6) {
      problems.push(`${label}: enter the treasure D6.`)
      return
    }
    const count = chest.result! <= 2 ? 0 : chest.result === 6 ? 6 : 3
    if (!count) { notes.push(`${label}: D6 ${chest.result}, Illusions — no reward.`); return }
    if (chest.goldDice.length !== count || chest.goldDice.some(d => !Number.isInteger(d) || d! < 1 || d! > 6)) {
      problems.push(`${label}: enter all ${count} gold dice.`)
      return
    }
    const amount = chest.goldDice.reduce<number>((sum, die) => sum + die!, 0)
    gold += amount
    notes.push(`${label}: D6 ${chest.result}, ${count}D6 rolled ${chest.goldDice.join(', ')} — ${amount} gc.`)
  })
  return { gold, problems, notes }
}
