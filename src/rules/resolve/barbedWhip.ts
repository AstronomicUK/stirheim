/** Catalogue identities for the printed Warhounds of Chaos, not every animal or dog. */
export function isChaosWarhound(unitTemplateId?: string): boolean {
  return unitTemplateId === 'marauders_warhounds_of_chaos' || unitTemplateId === 'beastmen_warhounds_of_chaos'
}
