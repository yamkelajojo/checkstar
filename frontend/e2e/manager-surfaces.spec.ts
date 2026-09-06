import { test, expect, type Page } from '@playwright/test'

/**
 * Manager/admin surface smoke — Phase 4/5 remediation coverage.
 * Runs against the mock API (role-switchable logins):
 *   dev@checkstar.co.za      → developer
 *   manager@checkstar.co.za  → store_manager
 *
 * Covers the fixed defects:
 *  - admin dashboard renders real data + health (no dead placeholder links)
 *  - staff roster RBAC + owner protection
 *  - messages inbox mark-read + reply validation
 *  - dispatch console validation, dispatch + reassign paths
 */

async function login(page: Page, email: string) {
  await page.goto('/auth/login')
  await page.fill('#email', email)
  await page.fill('#password', 'password')
  // Enter submits the form — the submit button can re-mount mid-click while
  // the auth bootstrap resolves (element-detached flake).
  await page.press('#password', 'Enter')
  // Login lands on home/account — wait for the session to be established.
  await expect(page).not.toHaveURL(/auth\/login/, { timeout: 30_000 })
}

test.describe('Admin surfaces (developer)', () => {
  test('dashboard renders overview stats, real links and health status', async ({ page }) => {
    await login(page, 'dev@checkstar.co.za')
    await page.goto('/admin/dashboard')

    // Overview stat cards load from the API
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    await expect(page.getByText('Products', { exact: true })).toBeVisible()

    // Store management links point at pages that actually exist
    await expect(page.getByRole('link', { name: /Banners Create and manage/ }).or(page.getByRole('link', { name: /^Banners/ }))).toBeVisible()
    await expect(page.getByRole('link', { name: /^Store Staff/ })).toBeVisible()

    // System health renders from the real payload (mock: queue=warn → degraded)
    await expect(page.getByText('System Health')).toBeVisible()
    await expect(page.getByText(/Degraded|All Systems Normal/)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Queue', { exact: true })).toBeVisible()
  })

  test('developer-only dashboard blocks store staff', async ({ page }) => {
    await login(page, 'owner@checkstar.co.za')
    await page.goto('/admin/dashboard')
    await expect(page.getByText('Developer access only')).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('Store staff surfaces', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/__admin/reset')
    expect(res.ok()).toBeTruthy()
  })

  test('staff roster lists team, owner has no revoke', async ({ page }) => {
    await login(page, 'dev@checkstar.co.za')
    await page.goto('/admin/staff')

    await expect(page.getByRole('heading', { name: 'Store Staff' })).toBeVisible()
    // Roster: owner + manager + logistics from the mock
    await expect(page.getByText('Thandi Owner')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Sipho Manager')).toBeVisible()
    await expect(page.getByText('Lerato Logistics')).toBeVisible()

    // Owner row shows the shield badge instead of a revoke button
    const ownerRow = page.locator('li', { hasText: 'Thandi Owner' })
    await expect(ownerRow.getByText('Owner', { exact: true })).toBeVisible()
    await expect(ownerRow.getByRole('button', { name: 'Revoke' })).toHaveCount(0)

    // Hire form validation: empty submit shows inline error, no request
    await page.getByRole('button', { name: /Add member/ }).click()
    await expect(page.getByText('Name and email are both required')).toBeVisible()
  })

  test('messages inbox: unread marker, mark-read, reply validation', async ({ page }) => {
    await login(page, 'dev@checkstar.co.za')
    await page.goto('/admin/messages')

    await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible()
    // Two seeded messages
    await expect(page.getByText('Nomsa Dlamini')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Pieter van Wyk')).toBeVisible()

    // Open the unread message → it is marked read via PATCH and expands the composer
    await page.getByRole('button', { name: /Nomsa Dlamini/ }).click()
    await expect(page.getByPlaceholder('Write your reply…')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark as unread' })).toBeVisible({ timeout: 15_000 })

    // Empty reply is blocked client-side with an inline error
    await page.getByRole('button', { name: /Send reply/ }).click()
    await expect(page.getByText('Write a reply before sending')).toBeVisible()
  })
})

test.describe('Dispatch console', () => {
  // These tests mutate mock state (dispatch removes orders, reassign swaps
  // riders) — reset the seeds so runs are order- and repeat-independent.
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/__admin/reset')
    expect(res.ok()).toBeTruthy()
  })

  test('pending orders list, invalid rider blocked, dispatch succeeds', async ({ page }) => {
    await login(page, 'manager@checkstar.co.za')
    await page.goto('/account/dispatch')

    await expect(page.getByRole('heading', { name: 'Dispatch Console' })).toBeVisible()

    // Three seeded pending orders (501 no rider, 502 no rider, 503 with rider 8)
    await expect(page.getByText('#CS-1501')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('#CS-1502')).toBeVisible()
    await expect(page.getByText('#CS-1503')).toBeVisible()

    // The order that already has a rider shows reassign (not dispatch)
    const row503 = page.locator('div.bg-white', { hasText: '#CS-1503' }).first()
    await expect(row503.getByRole('button', { name: 'Reassign' })).toBeVisible()
    await expect(row503.getByRole('button', { name: 'Dispatch', exact: true })).toHaveCount(0)

    // Non-numeric rider id is blocked client-side
    const row501 = page.locator('div.bg-white', { hasText: '#CS-1501' }).first()
    await row501.getByPlaceholder('Rider ID').fill('abc')
    await row501.getByRole('button', { name: 'Dispatch', exact: true }).click()
    await expect(page.getByText('Enter a valid numeric Rider ID')).toBeVisible()

    // Valid dispatch → success message, order leaves the queue
    await row501.getByPlaceholder('Rider ID').fill('7')
    await row501.getByRole('button', { name: 'Dispatch', exact: true }).click()
    await expect(page.getByText(/dispatched to rider 7/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('#CS-1501')).toHaveCount(0, { timeout: 15_000 })
  })

  test('reassign path swaps the rider on an assigned order', async ({ page }) => {
    await login(page, 'manager@checkstar.co.za')
    await page.goto('/account/dispatch')

    const row503 = page.locator('div.bg-white', { hasText: '#CS-1503' }).first()
    await expect(row503.getByText(/Current rider: #8/)).toBeVisible({ timeout: 20_000 })

    await row503.getByPlaceholder('New Rider ID').fill('9')
    await row503.getByRole('button', { name: 'Reassign' }).click()
    await expect(page.getByText(/reassigned to rider 9/)).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Live operations', () => {
  test('operations board renders metrics, map layer toggles and event feed', async ({ page }) => {
    await login(page, 'manager@checkstar.co.za')
    await page.goto('/operations')

    await expect(page.getByText('CHECKSTAR OPS')).toBeVisible()
    // Metrics HUD
    await expect(page.getByText('Active Fleet')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Delivered Today')).toBeVisible()
    // Map layer toggles
    await expect(page.getByRole('button', { name: 'Traffic' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Routes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Demand' })).toBeVisible()
    // Event feed settled (loading skeleton gone → count or empty state)
    await expect(page.getByText(/Event Feed/)).toBeVisible()
  })

  test('analytics renders KPI cards and period switch', async ({ page }) => {
    await login(page, 'manager@checkstar.co.za')
    await page.goto('/operations/analytics')

    await expect(page.getByText('Total Revenue')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Avg Order Value')).toBeVisible()
    // Switch period → KPIs recompute without crashing
    await page.getByRole('button', { name: '7d', exact: true }).click()
    await expect(page.getByText('Total Revenue')).toBeVisible()
    await expect(page.getByText('Active Riders')).toBeVisible()
  })
})
