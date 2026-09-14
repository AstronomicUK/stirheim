import { beforeEach, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { BuySheet } from './BuyTab'
import { findItem } from '../../rules/data/items'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'
import type { TradeContext } from './useTrade'
const hooks = vi.hoisted(() => ({ values: [] as unknown[], index: 0 }))
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), useMemo: (fn: () => unknown) => fn(), useState: (initial: unknown) => {
  const index = hooks.index++
  if (!(index in hooks.values)) hooks.values[index] = typeof initial === 'function' ? initial() : initial
  return [hooks.values[index], (value: unknown) => { hooks.values[index] = typeof value === 'function' ? value(hooks.values[index]) : value }]
} }))
vi.mock('../../api/facio', () => ({ useFacio: () => ({ data: { available: [], notebooks: [] } }) }))
type Node = ReactElement<Record<string, any>>
function nodes(value: any): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== 'object' || !value.props) return []; return [value, ...nodes(value.props.children), ...nodes(value.props.footer)] }
let trade: TradeContext
beforeEach(() => {
 hooks.values = []; hooks.index = 0
 const heroes = ['a', 'b'].map((id, i) => ({ id, name: id === 'a' ? 'Searcher' : 'Buyer', unitTemplateId: 'mercenaries_reikland_captain', stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 }, xp: i ? 40 : 5, levelUps: 0, status: 'active', skillIds: [], skillTableIds: [], spellIds: [], injuries: [], flags: {}, equipment: [] }))
 trade = { roster: { id: 'w', name: 'Warband', warbandTemplateId: 'mercenaries_reikland', heroes, henchmenGroups: [], hiredSwords: [], stash: [], gold: 500, wyrdstone: 0, veteranPool: null }, phase: { matchId: 'm', heroesSearched: [], heroesOutOfAction: [], wyrdstoneSold: false, enemyOutCounts: { a: 3, b: 1 } }, houseRules: applyHouseRuleDefaults(), canTrade: true, pending: false, run: vi.fn(), clearError: vi.fn(), error: null, perks: null } as unknown as TradeContext
})
function render(itemId = 'chaos_armour') { hooks.index = 0; return nodes(BuySheet({ item: findItem(itemId)!, trade, onClose: vi.fn() })) }
function field(label: string) { return render().find(node => node.props.label === label)! }
function searchHeader() { return render().find(node => node.type === 'h3' && JSON.stringify(node.props.children).includes('roll 2D6'))! }
it('uses the searching Hero’s recorded takedowns, independently of the armour recipient’s XP', () => {
 expect(JSON.stringify(searchHeader().props.children)).toContain('+3 for this search')
 field('Give to').props.onChange({ target: { value: 'hero:b' } })
 expect(JSON.stringify(searchHeader().props.children)).toContain('+3 for this search')
 field('Hero searching').props.onChange({ target: { value: 'b' } })
 expect(JSON.stringify(searchHeader().props.children)).toContain('+1 for this search')
 expect(field('Buyer: enemies taken out of action last battle').props.value).toBe(1)
})
it('requires an explanation for changing the saved count and accepts a reasoned correction', () => {
 field('Searcher: enemies taken out of action last battle').props.onChange(5)
 expect(JSON.stringify(searchHeader().props.children)).not.toContain('+5 for this search')
 field('Reason for correcting the takedown count').props.onChange({ target: { value: 'One enemy group member was omitted from the report' } })
 expect(JSON.stringify(searchHeader().props.children)).toContain('+5 for this search')
})
it('keeps legacy reports unknown until the player supplies a count, and does not affect other armour', () => {
 trade.phase.enemyOutCounts = undefined
 expect(field('Searcher: enemies taken out of action last battle').props.value).toBeNull()
 field('Searcher: enemies taken out of action last battle').props.onChange(2)
 expect(JSON.stringify(searchHeader().props.children)).toContain('+2 for this search')
 expect(render('light_armour').some(node => String(node.props.label).includes('enemies taken out'))).toBe(false)
})


it('prices a variable double-barrelled brace with all its dice and higher rarity', () => {
 const itemId = 'double_barrelled_pistol';
 const get = (label: string) => render(itemId).find(node => node.props.label === label)!;
 get('quantity').props.onChange(2);
 get('Die 1').props.onChange(6); get('Die 2').props.onChange(6);
 expect(render(itemId).filter(node => /^2D6 die/.test(node.props.label))).toHaveLength(2);
 get('2D6 die 1').props.onChange(3); get('2D6 die 2').props.onChange(4);
 expect(render(itemId).some(node => node.props.children === 'Buy for 53 gc')).toBe(true);
 expect(render(itemId).find(node => node.type === 'h3' && JSON.stringify(node.props.children).includes('roll 2D6'))?.props.children).toContain(10);
});
it('Nuln buys two pistols for its printed brace cost and searches at brace rarity', async () => {
 trade.roster.warbandTemplateId = 'gunnery_school_of_nuln';
 const itemId = 'double_barrelled_pistol';
 const get = (label: string) => render(itemId).find(node => node.props.label === label)!;
 get('Die 1').props.onChange(3); get('Die 2').props.onChange(4);
 expect(render(itemId).some(node => node.props.children === 'Buy for 20 gc')).toBe(true);
 get('quantity').props.onChange(2);
 expect(render(itemId).some(node => node.props.children === 'Record the failed search')).toBe(true);
 get('Die 2').props.onChange(5);
 const buy = render(itemId).find(node => node.props.children === 'Buy for 35 gc')!;
 expect(buy.props.disabled).toBe(false);
 await buy.props.onClick();
 const next = vi.mocked(trade.run).mock.calls[0][0]();
 expect(next.gold).toBe(465);
 expect(vi.mocked(trade.run).mock.calls[0][1]?.heroesSearched).toEqual(['a']);
 expect(next.stash).toContainEqual(expect.objectContaining({ itemId, quantity: 2 }));
 expect(render(itemId).filter(node => /D6 die/.test(node.props.label))).toHaveLength(0);
});
