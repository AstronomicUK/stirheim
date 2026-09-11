import type { CombatContext } from '../types';

/** Core Fear exemptions; Frenzy's exemption ends when the frenzy has ended. */
export function ignoresFear(traits: readonly string[], context: Pick<CombatContext, 'frenzyEnded'> = {}): boolean {
  return traits.some(t => ['causes_fear', 'immune_to_fear', 'immune_to_psychology'].includes(t))
    || (traits.includes('frenzy') && !context.frenzyEnded);
}

/** Conditional weapon Fear must never become the owner's universal causes_fear trait. */
export function causesFearAgainst(traits: readonly string[], causesFearInAnimals = false, opponentIsAnimal = false): boolean {
  return traits.includes('causes_fear') || (causesFearInAnimals && opponentIsAnimal);
}
