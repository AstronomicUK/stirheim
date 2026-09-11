import {describe,expect,it} from 'vitest'
import {makeHero} from './fixtures'
import {hasHaggle,hagglePrice} from '../haggle'
describe('Haggle and the Freetraders symbol',()=>{
 it('uses the learned skill or currently carried symbol, not historical possession',()=>{
  expect(hasHaggle(makeHero({skillIds:['haggle']}))).toBe(true)
  expect(hasHaggle(makeHero({equipment:[{itemId:'symbol_of_the_order_of_freetraders',quantity:1}]}))).toBe(true)
  expect(hasHaggle(makeHero({equipment:[{itemId:'symbol_of_the_order_of_freetraders',quantity:0}]}))).toBe(false)
  expect(hasHaggle(makeHero({skillIds:['haggle'],status:'dead'}))).toBe(false)
 })
 it('deducts both dice with a one-gold minimum and rejects invalid rolls',()=>{
  expect(hagglePrice(10,[2,3])).toBe(5);expect(hagglePrice(5,[6,6])).toBe(1)
  expect(()=>hagglePrice(10,[0,6])).toThrow();expect(()=>hagglePrice(10,[4])).toThrow()
 })
})
