import type { RosterWarband } from '../types/roster';

/** Decree applies after an Emissary dies, until a replacement is hired. Free rewards are not purchases. */
export function leaderReplacementPurchaseBlock(warband: RosterWarband, cost: number, unitId?: string): string | undefined {
  if (warband.warbandTemplateId !== 'battle_monks_of_cathay' || cost <= 0 || unitId === 'battle_monks_emissary') return undefined;
  const emissaries = warband.heroes.filter(h => h.unitTemplateId === 'battle_monks_emissary');
  if (!emissaries.some(h => h.status === 'dead') || emissaries.some(h => h.status === 'active')) return undefined;
  return 'Decree: hire a replacement Emissary before buying other warriors or equipment.';
}

export function delayedLeaderUnit(warbandId: string): string | undefined {
  return warbandId === 'the_undead' ? 'undead_vampire' : warbandId === 'lizardmen' ? 'lizardmen_skink_priest' : undefined;
}

export function delayedLeaderRecruitmentBlock(warband: RosterWarband, unitId: string): string | undefined {
  if (delayedLeaderUnit(warband.warbandTemplateId) !== unitId) return undefined;
  if (warband.heroes.some(h => h.unitTemplateId === unitId && h.status === 'active')) return undefined;
  const lost = warband.heroes.filter(h => h.unitTemplateId === unitId && h.status === 'dead');
  if (lost.some(h => !h.flags.leaderReplacementReadyAfter)) return 'Play one further game without this leader before recruiting a replacement. The post-battle report records the waiting game.';
}

/** A report for the death battle itself must not satisfy the one-game waiting period. */
export function leaderWaitingGameUpdates(warband: RosterWarband, matchId: string) {
  const unitId = delayedLeaderUnit(warband.warbandTemplateId);
  if (!unitId || warband.heroes.some(h => h.unitTemplateId === unitId && h.status === 'active')) return [];
  return warband.heroes.filter(h => h.unitTemplateId === unitId && h.status === 'dead' && !h.flags.leaderReplacementReadyAfter && h.flags.leaderLostInMatch !== matchId)
    .map(h => ({id:h.id,flags:{...h.flags,leaderReplacementReadyAfter:matchId}}));
}

/** Source-confirmed collapse; a living captive is not silently treated as dead. */
export function collapsedWarbandReason(warband: RosterWarband): string | undefined {
  const rules: Record<string,{leader:string;heirs:string[];message:string}> = {
    the_undead:{leader:'undead_vampire',heirs:['undead_necromancer'],message:'The Vampire is dead and no Necromancer remains. The magic holding the warband together collapses.'},
    necrarchs_the_soul_stealers:{leader:'necrarchs_necrarch_vampire',heirs:['necrarchs_thrall'],message:'Both the Necrarch and Thrall are gone. The magic binding the warband fades.'},
    skaven_of_clan_moulder:{leader:'packmaster',heirs:['apprentices'],message:'The Packmaster is dead and no Apprentice remains to take over.'},
  };
  const rule=rules[warband.warbandTemplateId];
  if(!rule||!warband.heroes.some(h=>h.unitTemplateId===rule.leader&&h.status==='dead'))return;
  if(warband.heroes.some(h=>(h.status==='active'||h.status==='captured')&&[rule.leader,...rule.heirs].includes(h.unitTemplateId)))return;
  return rule.message;
}
