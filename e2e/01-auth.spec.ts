import { expect, test } from '@playwright/test'
import { GM, PASSWORD, REIKLAND_WATCH, signIn, signOut } from './fixtures'

test.describe('authentication', () => {
  test('signs in as the GM and sees the warband list', async ({ page }) => {
    await signIn(page, GM.email)
    await expect(page.getByText(REIKLAND_WATCH.name)).toBeVisible()
  })

  test('rejects a wrong password with an inline error', async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByLabel('Email').fill(GM.email)
    await page.getByLabel('Password').fill(`${PASSWORD}-wrong`)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toContainText('That email and password do not match.')
    await expect(page).toHaveURL(/\/sign-in$/)
  })

  test('signs out back to the sign-in form', async ({ page }) => {
    await signIn(page, GM.email)
    await signOut(page)
    // Protected routes bounce back to sign-in once the session is gone.
    await page.goto('/')
    await expect(page).toHaveURL(/\/sign-in$/)
  })
})
