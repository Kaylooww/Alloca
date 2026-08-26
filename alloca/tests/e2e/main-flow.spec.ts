/**
 * End-to-end: the workflow Alloca is built around.
 *
 *   register → see the dashboard → log an expense → watch the balance fall
 *   → create a savings goal → read the reports
 *
 * Run with `npm run test:e2e` (Playwright starts the dev server for you).
 */
import { expect, test } from '@playwright/test'

const password = 'allowance123'

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}@alloca.test`
}

test.describe('main flow', () => {
  test('a student can register, log an expense and save toward a goal', async ({ page }) => {
    const email = uniqueEmail()

    // --- register --------------------------------------------------------
    await page.goto('/register')
    await page.getByLabel('Name').fill('E2E Student')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByLabel('Confirm password').fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await page.waitForURL('**/dashboard')

    // --- the dashboard answers "how much is left?" -----------------------
    await expect(page.getByText('Remaining', { exact: true })).toBeVisible()
    await expect(page.getByText('₱1,500.00').first()).toBeVisible()
    await expect(page.getByText('100% remaining')).toBeVisible()

    // --- log an expense in three taps ------------------------------------
    await page.getByRole('button', { name: 'Add expense' }).first().click()
    await page.getByRole('radio', { name: /Meals/ }).click()
    await page.getByLabel('Amount').fill('120')
    await page.getByRole('button', { name: 'Save expense' }).click()

    // --- the balance reflects it -----------------------------------------
    await expect(page.getByText('₱1,380.00').first()).toBeVisible({ timeout: 15_000 })

    // --- the expense appears in the log ----------------------------------
    await page.getByRole('link', { name: 'Expenses' }).first().click()
    await page.waitForURL('**/expenses')
    await expect(page.getByText('Meals').first()).toBeVisible()

    // --- create a savings goal -------------------------------------------
    await page.getByRole('link', { name: 'Savings' }).first().click()
    await page.waitForURL('**/savings')
    await page.getByRole('button', { name: /New goal|Create your first goal/ }).first().click()
    await page.getByLabel('What are you saving for?').fill('Drawing tablet')
    await page.getByLabel('Target amount').fill('8000')
    await page.getByRole('button', { name: 'Create goal' }).click()

    await expect(page.getByText('Drawing tablet')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Finish an allowance cycle/)).toBeVisible()

    // --- reports render --------------------------------------------------
    await page.getByRole('link', { name: 'Reports' }).first().click()
    await page.waitForURL('**/reports')
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
    await expect(page.getByText('Weekly savings summary')).toBeVisible()
  })

  test('signed-out visitors are redirected to the login page', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login**')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('bad credentials are rejected without revealing which field was wrong', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@alloca.test')
    await page.getByLabel('Password').fill('wrongpassword1')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('That email and password do not match.')).toBeVisible()
  })
})
