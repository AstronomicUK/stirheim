/** Masters of Horror, A Bit Unhinged (grade-2a-part1:1746). */
export const needsSurvivalXpTest = (unitId: string) => unitId === 'masters_of_horror_flesh_construct'
export interface SurvivalXpRoll { dice: [number | null, number | null]; source: 'app' | 'manual' }
export interface SurvivalXpTest extends SurvivalXpRoll { previous?: SurvivalXpRoll[] }
export function validSurvivalXpRoll(roll?: SurvivalXpRoll): boolean {
 return Boolean(roll && Array.isArray(roll.dice) && roll.dice.length === 2 && roll.dice.every(n => Number.isInteger(n) && n! >= 1 && n! <= 6))
}
export function recordSurvivalXpRoll(previous: SurvivalXpTest | undefined, dice: SurvivalXpRoll['dice'], source: SurvivalXpRoll['source']): SurvivalXpTest {
 return { dice, source, previous: [...(previous?.previous ?? []), ...(validSurvivalXpRoll(previous) ? [{dice: [...previous!.dice] as SurvivalXpRoll['dice'], source: previous!.source}] : [])] }
}
export function survivalXpTestResult(roll: SurvivalXpTest | undefined, leadership: number): boolean | null {
 return validSurvivalXpRoll(roll) ? roll!.dice[0]! + roll!.dice[1]! <= leadership : null
}
export function survivalXpTestHistory(roll: SurvivalXpTest, leadership: number): string[] {
 const describe=(r:SurvivalXpRoll)=>`${r.dice.join(' + ')} (${r.source === 'app' ? 'rolled by the app' : 'entered or changed by the player'})`
 return [...(roll.previous??[]).map(r=>`Earlier Leadership roll: ${describe(r)}; replaced.`),`Survival Leadership test: ${describe(roll)} = ${roll.dice[0]!+roll.dice[1]!} against Ld ${leadership}: ${survivalXpTestResult(roll,leadership)?'passed':'failed'}.`]
}
