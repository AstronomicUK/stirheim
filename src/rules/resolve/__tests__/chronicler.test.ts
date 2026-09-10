import { describe, expect, it } from 'vitest';
import { findWarbandTemplate } from '../../data/warbandTemplates';
import { addDraftHero, newWarbandDraft, draftCosts, draftToRosterWarband, validateDraft } from '../builder';
import { recruitHero } from '../recruitment';
import { explorationAids, validateAidUse } from '../explorationAids';
import { warriorFlagsSchema } from '../../../domain/json';

const template = findWarbandTemplate('the_cursed_cavalcade')!;
const unit = 'cursed_cavalcade_twisted_scholar';
const base = () => newWarbandDraft(template, 'Cavalcade');
const opts = { houseRules: { rabbitsFootBattleOnly: true }, heroesOutOfAction: [] as string[], preBattle: {} };

describe('Story Teller recruitment and exploration (#105)', () => {
  it('prices and saves mutually exclusive training for both recruitment paths', () => {
    for (const choice of ['scholar', 'wizard', 'chronicler']) {
      const roster = draftToRosterWarband(base(), template);
      const result = recruitHero(roster, template, unit, 'Scholar', 'scholar', { magicChoiceId: choice, rng: () => 0 });
      const recruit = result.value.heroes.at(-1)!;
      expect(roster.gold - result.value.gold).toBe(choice === 'scholar' ? 25 : 35);
      expect(!!recruit.flags.chronicler).toBe(choice === 'chronicler');
      expect(recruit.spellIds).toHaveLength(choice === 'wizard' ? 1 : 0);
      expect(warriorFlagsSchema.parse(recruit.flags)).toEqual(recruit.flags);
      let draft = addDraftHero(base(), template, unit, 'scholar');
      draft = { ...draft, heroes: draft.heroes.map(h => h.id === 'scholar' ? { ...h, magicChoiceId: choice, spellIds: recruit.spellIds } : h) };
      expect(draftCosts(draft, template).hires - draftCosts(base(), template).hires).toBe(choice === 'scholar' ? 25 : 35);
      expect(draftToRosterWarband(draft, template).heroes.at(-1)!.flags).toEqual(recruit.flags);
    }
  });
  it('requires the choice and rejects spells on a Chronicler', () => {
    const roster = draftToRosterWarband(base(), template);
    expect(() => recruitHero(roster, template, unit, 'Scholar', 's')).toThrow(/Choose/);
    expect(() => recruitHero(roster, template, unit, 'Scholar', 's', { magicChoiceId: 'chronicler', spellIds: ['spell'] })).toThrow(/0 distinct/);
    const draft = addDraftHero(base(), template, unit, 's');
    expect(validateDraft(draft, template).some(p => p.code === 'builder.noFirstSpell')).toBe(true);
  });
  it('offers one keep-either reroll only for an active Chronicler and enforces its budget', () => {
    const roster = recruitHero(draftToRosterWarband(base(), template), template, unit, 'Scholar', 's', { magicChoiceId: 'chronicler' }).value;
    const aid = explorationAids(roster, opts).find(a => a.key === 'chronicler:s')!;
    expect(aid).toMatchObject({ kind: 'rerollKeepEither', uses: 1 });
    const use = { aidKey: aid.key, label: aid.label, kind: aid.kind, dieIndex: 0, from: 5, to: 5, alternativeRoll: 2 };
    expect(() => validateAidUse(aid, use)).not.toThrow();
    expect(() => validateAidUse(aid, { ...use, dieIndex: 1 }, [use])).toThrow(/already been used/);
    roster.heroes.at(-1)!.status = 'dead';
    expect(explorationAids(roster, opts).some(a => a.key === aid.key)).toBe(false);
  });
});
