// Shared helpers and constants for the e2e specs. Ids and names mirror supabase/seed.sql.

import { execSync } from 'node:child_process'
import { expect, type Locator, type Page } from '@playwright/test'

export const PASSWORD = 'stirheim-dev'

export const GM = { email: 'gm@stirheim.test', displayName: 'Tom (GM)' } as const
export const PLAYER = { email: 'player@stirheim.test', displayName: 'Ana' } as const

export const REIKLAND_WATCH = { id: 'aaaaaaaa-0000-4000-8000-000000000001', name: 'Reikland Watch' } as const
export const CLAWS_OF_ESHIN = { id: 'aaaaaaaa-0000-4000-8000-000000000002', name: 'Claws of Eshin' } as const

export const CAMPAIGN = { id: 'dddddddd-0000-4000-8000-000000000001', name: 'Ruins of the Stir', inviteCode: 'test-2026' } as const

export const UUID_RE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/**
 * Re-apply migrations and the seed on the local stack. Synchronous on purpose: it runs from
 * Playwright's global setup before any browser opens.
 */
export function resetDb(): void {
  execSync('npm run db:reset', { stdio: 'inherit', timeout: 180_000 })
}

/** Sign in through the form and wait for the warband list. */
export async function signIn(page: Page, email: string, password: string = PASSWORD): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
}

/** Sign out from the Account tab and wait for the sign-in form. */
export async function signOut(page: Page): Promise<void> {
  await page.goto('/account')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/sign-in$/)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
}

/** The value next to a KeyValue label ("Gold" -> "35 gc") on roster-style summary cards. */
export function keyValue(page: Page, label: string): Locator {
  return page.locator('span', { hasText: new RegExp(`^${escapeRe(label)}$`) }).first().locator('xpath=following-sibling::span[1]')
}

/** First integer in a locator's text ("35 gc" -> 35). */
export async function readNumber(locator: Locator): Promise<number> {
  const text = (await locator.textContent()) ?? ''
  const match = text.match(/-?\d+/)
  if (!match) throw new Error(`No number in "${text}"`)
  return Number(match[0])
}

/** Type a die result into a DieField by its label (the input is text with placeholder "1-6"). */
export async function typeDie(scope: Page | Locator, label: string, value: number): Promise<void> {
  const field = scope.getByLabel(label, { exact: true })
  await field.fill(String(value))
  await expect(field).toHaveValue(String(value))
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
