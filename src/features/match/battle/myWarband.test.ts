import { describe, expect, it } from 'vitest'
import { battleSheetPath, chooseMyWarband, MY_WARBAND_PARAM } from './myWarband'

const mine = (warband_id: string) => ({ warband_id, mine: true })
const theirs = (warband_id: string) => ({ warband_id, mine: false })

describe('chooseMyWarband (#206)', () => {
  it('honours the requested warband when the reader owns it', () => {
    const participants = [mine('carnival'), mine('dwarves')]
    expect(chooseMyWarband(participants, 'dwarves')?.warband_id).toBe('dwarves')
    expect(chooseMyWarband(participants, 'carnival')?.warband_id).toBe('carnival')
  })

  it('falls back to the first owned participant when nothing is requested', () => {
    expect(chooseMyWarband([theirs('enemy'), mine('dwarves'), mine('carnival')], null)?.warband_id).toBe('dwarves')
    expect(chooseMyWarband([theirs('enemy'), mine('dwarves')], undefined)?.warband_id).toBe('dwarves')
  })

  it("never plays as a warband the reader doesn't own, even if the URL asks for it", () => {
    expect(chooseMyWarband([theirs('enemy'), mine('dwarves')], 'enemy')?.warband_id).toBe('dwarves')
  })

  it('ignores a stale or unknown requested id', () => {
    expect(chooseMyWarband([mine('carnival'), mine('dwarves')], 'no-such-warband')?.warband_id).toBe('carnival')
  })

  it('returns nothing for a spectator who owns neither side', () => {
    expect(chooseMyWarband([theirs('a'), theirs('b')], 'a')).toBeUndefined()
  })
})

describe('battleSheetPath', () => {
  it('carries the originating warband in the query string, encoded', () => {
    expect(battleSheetPath('m1', 'w 1')).toBe(`/matches/m1/battle?${MY_WARBAND_PARAM}=w%201`)
  })
  it('is the plain battle path when no warband is known', () => {
    expect(battleSheetPath('m1')).toBe('/matches/m1/battle')
    expect(battleSheetPath('m1', null)).toBe('/matches/m1/battle')
  })
})
