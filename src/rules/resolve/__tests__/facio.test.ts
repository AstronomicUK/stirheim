import {describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {FACIO_ITEM_IDS,facioItemEligible} from '../facio'
import {findItem} from '../../data/items'
describe('Facio regular Price Chart',()=>{
 it('includes normal and metal equipment, but not scenario rewards or Pirate equipment',()=>{
  for(const id of ['sword','elf_bow','gromril_sword','ithilmar_armour','tome_of_magic'])expect(facioItemEligible(id)).toBe(true)
  for(const id of ['treasure_map','swivel_gun','amethyst','training_manual','gromril_disease_dagger'])expect(facioItemEligible(id)).toBe(false)
  for(const id of FACIO_ITEM_IDS){const item=findItem(id);expect(item,id).toBeDefined();expect(item?.availability.kind,id).not.toBe('special')}
 })
 it('uses the same catalogue in the server purchase guard',()=>{
  const sql=readFileSync(new URL('../../../../supabase/migrations/20260914000139_facio_trading.sql',import.meta.url),'utf8')
  const list=sql.match(/p_item_id=any\(array\[(.*?)\]::text\[\]\)/)![1]
  expect([...list.matchAll(/'([^']+)'/g)].map(m=>m[1])).toEqual([...FACIO_ITEM_IDS])
 })
})
