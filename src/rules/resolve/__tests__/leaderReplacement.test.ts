import { describe, expect, it } from 'vitest';
import { findWarbandTemplate } from '../../data/warbandTemplates';
import { findItem } from '../../data/items';
import type { RosterHero, RosterWarband } from '../../types/roster';
import { appointLeader, successionOptions } from '../succession';
import { canRecruit, recruitHero, recruitHenchmen } from '../recruitment';
import { buyItem, sellItem, moveItem } from '../trading';
import { leaderReplacementPurchaseBlock } from '../leaderReplacement';

const template = findWarbandTemplate('battle_monks_of_cathay')!;
const hero = (id: string, unitTemplateId: string, Ld = 7): RosterHero => ({ id, name: id, unitTemplateId, stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld }, xp: 8, levelUps: 0, skillTableIds: ['combat'], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active' });
const band = (): RosterWarband => ({ id: 'w', name: 'Monks', warbandTemplateId: template.id, gold: 500, wyrdstone: 0, veteranPool: 9, heroes: [{ ...hero('old', 'battle_monks_emissary'), status: 'dead' }, hero('officer', 'battle_monks_officer'), hero('monk', 'battle_monks_dragon_monks', 8)], henchmenGroups: [], hiredSwords: [], stash: [{ itemId: 'sword', quantity: 1 }] });

describe('Battle Monks Decree', () => {
  it('chooses temporary leadership by Leadership and preserves the monk’s original identity', () => {
    const w = band();
    expect(successionOptions(w, template)?.candidates[0].hero.id).toBe('monk');
    const next = appointLeader(w, template, 'monk').value;
    expect(next.heroes[2]).toEqual({ ...w.heroes[2], flags: { temporaryLeader: true } });
    expect(leaderReplacementPurchaseBlock(next, 10)).toContain('replacement Emissary');
  });
  it('blocks paid recruits and equipment without spending gold, including veteran hires', () => {
    const w = band();
    expect(canRecruit(w, template, 'battle_monks_dragon_monks').reason).toContain('Decree');
    expect(() => recruitHero(w, template, 'battle_monks_dragon_monks', 'new', 'new')).toThrow(/Decree/);
    expect(() => recruitHenchmen(w, template, 'battle_monks_soldiers', 'Soldiers', 1, 'g')).toThrow(/Decree/);
    expect(() => buyItem(w, findItem('sword')!, 10, { kind: 'stash' })).toThrow(/Decree/);
    const veteran: RosterWarband = { ...w, henchmenGroups: [{ id: 'g', name: 'Soldiers', unitTemplateId: 'battle_monks_soldiers', size: 1, stats: w.heroes[1].stats, xp: 2, levelUps: 1, equipment: [], statIncreases: {} }] };
    expect(() => recruitHenchmen(veteran, template, 'battle_monks_soldiers', 'Soldiers', 1, 'new', { intoGroupId: 'g', costOverride: 0 })).toThrow(/Decree/);
    expect(w.gold).toBe(500);
    expect(w.heroes).toHaveLength(3);
  });
  it('allows replacement, then immediately permits purchases and ends the temporary role', () => {
    const w = appointLeader(band(), template, 'monk').value;
    expect(canRecruit(w, template, 'battle_monks_emissary').ok).toBe(true);
    const next = recruitHero(w, template, 'battle_monks_emissary', 'New Emissary', 'new').value;
    expect(next.heroes.find(h => h.id === 'monk')?.flags.temporaryLeader).toBe(false);
    expect(leaderReplacementPurchaseBlock(next, 10)).toBeUndefined();
    expect(buyItem(next, findItem('sword')!, 10, { kind: 'stash' }).value.gold).toBe(next.gold - 10);
  });
  it('leaves free acquisitions, existing equipment transfers and sales available', () => {
    const w = band();
    expect(buyItem(w, findItem('sword')!, 0, { kind: 'stash' }).value.gold).toBe(500);
    expect(recruitHero(w, template, 'battle_monks_dragon_monks', 'Free recruit', 'free', { costOverride: 0 }).value.gold).toBe(500);
    expect(recruitHenchmen(w, template, 'battle_monks_soldiers', 'Free soldiers', 1, 'g', { costOverride: 0 }).value.warband.gold).toBe(500);
    // Movement/sales use separate existing resolvers and remain outside the purchase restriction.
    expect(sellItem(w, { kind: 'stash' }, 'sword', 1, 10).value.gold).toBe(505);
    expect(moveItem(w, { kind: 'stash' }, { kind: 'hero', id: 'officer' }, 'sword').value.heroes[1].equipment).toEqual([{ itemId: 'sword', quantity: 1 }]);
    expect(leaderReplacementPurchaseBlock({ ...w, heroes: w.heroes.filter(h => h.status === 'active') }, 10)).toBeUndefined();
    expect(leaderReplacementPurchaseBlock({ ...w, warbandTemplateId: 'mercenaries_reikland' }, 10)).toBeUndefined();
  });
});
