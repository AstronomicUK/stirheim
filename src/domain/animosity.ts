import { z } from 'zod'

export const animosityTestSchema = z.object({
  id: z.string(), warriorId: z.string(), modelIndex: z.number().int().min(0), name: z.string(), turnKey: z.string(), at: z.string(),
  stage: z.enum(['trigger', 'effect', 'done']), outcome: z.enum(['clear', 'fight', 'squabble', 'rush', 'exempt']).optional(),
  original: z.number().int().min(1).max(6).optional(), triggerDie: z.number().int().min(1).max(6).optional(), effectDie: z.number().int().min(1).max(6).optional(),
  exemption: z.string().optional(), actionResolved: z.boolean().default(false), correction: z.string().optional(),
})
export type AnimosityTest = z.infer<typeof animosityTestSchema>
export const ANIMOSITY_OUTCOME_TEXT = {
  clear: 'Acts normally this turn.',
  fight: 'I ’Erd Dat! Charge the nearest eligible friendly Orc/Goblin henchman or hired sword within reach; otherwise shoot the nearest eligible friend if armed. If no legal target exists, or the nearest is an Orc Hero, squabble instead. No other action this turn; may defend in melee. After the fight, separate the models by 1 inch.',
  squabble: 'Wud Yoo Say? No actions this turn, but may defend if attacked in melee.',
  rush: 'I’ll Show Yer! Move as quickly as possible towards the nearest visible enemy, charging if possible. With no enemy in sight, make an extra normal move. Charge during regular movement if this brings an enemy within reach.',
  exempt: 'No Animosity test required for the recorded reason.',
} satisfies Record<NonNullable<AnimosityTest['outcome']>, string>

export function hasNormalAnimosity(unitId: string | undefined, removed = false): boolean {
  return !removed && Boolean(unitId && [
    'orc_mob_orc_boyz', 'orc_mob_goblin_warriors', 'forest_goblins_brave', 'forest_goblins_forest_goblin', 'forest_goblins_red_toof_goblin', 'forest_goblins_slugga',
  ].includes(unitId))
}
export function confirmAnimosityDie(test: AnimosityTest, die: number): AnimosityTest {
  if (!Number.isInteger(die) || die < 1 || die > 6) throw new Error('Animosity needs one D6.')
  if (test.correction || test.stage === 'done') throw new Error('This Animosity test is already resolved.')
  if (test.stage === 'trigger') return { ...test, original: undefined, triggerDie: die, stage: die === 1 ? 'effect' : 'done', outcome: die === 1 ? undefined : 'clear' }
  return { ...test, original: undefined, effectDie: die, stage: 'done', outcome: die === 1 ? 'fight' : die === 6 ? 'rush' : 'squabble' }
}
export function animosityBlocksAction(test: AnimosityTest | undefined, action: 'normal' | 'defend' | 'friendlyFight'): boolean {
  if (action === 'defend') return false
  if (!test || test.correction || test.stage !== 'done') return true
  if (action === 'friendlyFight') return test.outcome !== 'fight' || test.actionResolved
  return test.outcome === 'fight' || test.outcome === 'squabble' || (test.outcome === 'rush' && !test.actionResolved)
}
