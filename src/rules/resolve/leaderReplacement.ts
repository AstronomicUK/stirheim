import type { RosterWarband } from '../types/roster';

/** Decree applies after an Emissary dies, until a replacement is hired. Free rewards are not purchases. */
export function leaderReplacementPurchaseBlock(warband: RosterWarband, cost: number, unitId?: string): string | undefined {
  if (warband.warbandTemplateId !== 'battle_monks_of_cathay' || cost <= 0 || unitId === 'battle_monks_emissary') return undefined;
  const emissaries = warband.heroes.filter(h => h.unitTemplateId === 'battle_monks_emissary');
  if (!emissaries.some(h => h.status === 'dead') || emissaries.some(h => h.status === 'active')) return undefined;
  return 'Decree: hire a replacement Emissary before buying other warriors or equipment.';
}
