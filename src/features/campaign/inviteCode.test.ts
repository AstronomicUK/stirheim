import { describe, expect, it } from 'vitest'
import { formatInviteCode, isCompleteInviteCode, joinLink, normaliseInviteCode } from './inviteCode'

describe('invite codes', () => {
  it('normalises dashes, spaces and case', () => {
    expect(normaliseInviteCode('ABCD-EFGH')).toBe('abcdefgh')
    expect(normaliseInviteCode(' abcd efgh ')).toBe('abcdefgh')
    expect(normaliseInviteCode('abcdefgh')).toBe('abcdefgh')
  })

  it('formats as two groups of four, even while partial', () => {
    expect(formatInviteCode('ABCDEFGH')).toBe('abcd-efgh')
    expect(formatInviteCode('abc')).toBe('abc')
    expect(formatInviteCode('abcde')).toBe('abcd-e')
    expect(formatInviteCode('')).toBe('')
  })

  it('knows when eight characters have been typed', () => {
    expect(isCompleteInviteCode('abcd-efg')).toBe(false)
    expect(isCompleteInviteCode('abcd-efgh')).toBe(true)
    expect(isCompleteInviteCode('abcd-efghi')).toBe(false)
  })

  it('builds the share link from the origin', () => {
    expect(joinLink('https://stirheim.app', 'ABCDEFGH')).toBe('https://stirheim.app/campaigns/join/abcd-efgh')
    expect(joinLink('http://localhost:5174/', 'abcd-efgh')).toBe('http://localhost:5174/campaigns/join/abcd-efgh')
  })
})
