// Bringing a roster over from the old tracker: paste the printer-friendly page's text, check the
// review, create the warband. Uses the smallest captured roster from Tom's campaign.

import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { GM, UUID_RE, signIn } from './fixtures'

const ROSTER = readFileSync(new URL('../src/features/importer/fixtures/roster-argent.txt', import.meta.url), 'utf8')

test('imports a the old tracker roster from pasted text', async ({ page }) => {
  await signIn(page, GM.email)
  await page.goto('/warbands/import')
  await expect(page.getByRole('heading', { name: 'Import a roster' })).toBeVisible()

  await page.getByLabel('Roster text').fill(ROSTER)
  await expect(page.getByText('Everything matched', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Heroes' })).toBeVisible()
  await expect(page.getByText('Siegmund the Hammer').first()).toBeVisible()

  await page.getByRole('button', { name: 'Create The Argent Hammer' }).click()
  await expect(page).toHaveURL(new RegExp(`/warbands/${UUID_RE}$`))
  await expect(page.getByRole('heading', { name: 'The Argent Hammer' })).toBeVisible()
  await expect(page.getByText('265 gc')).toBeVisible()
  await expect(page.getByText('The Hammer of Sigmar')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hand over to another player' })).toBeVisible()
})
