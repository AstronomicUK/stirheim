import type {RosterHero} from '../types/roster'
export function hasHaggle(hero: RosterHero): boolean {
 return hero.status==='active' && (hero.skillIds.includes('haggle') || hero.equipment.some(i=>i.itemId==='symbol_of_the_order_of_freetraders'&&i.quantity>0))
}
export function hagglePrice(price:number,dice:readonly number[]):number {
 if(!Number.isInteger(price)||price<1||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw new RangeError('Haggle needs a positive item price and two D6.')
 return Math.max(1,price-dice[0]-dice[1])
}
