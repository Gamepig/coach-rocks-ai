import { test, expect } from '@playwright/test'

test.describe('T34 Default Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Seed session
    await page.addInitScript(() => {
      window.localStorage.setItem('sessionToken', 'pw-session')
    })
    // Auth/session & dashboard stubs
    await page.route('http://localhost:8788/api/validate-session', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: { email: 't34@test.com', onboarding_completed: true } }) })
    })
    await page.route('http://localhost:8788/api/dashboard', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.route('http://localhost:8788/api/clients/list', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
    })
    await page.route('http://localhost:8788/api/reels/list', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
  })

  test('Scenario 1: authenticated, meetings exist, no URL params → auto navigate to latest meeting', async ({ page }) => {
    // Two meetings: one older, one newer
    const mOld = { id: 'm-old', client_name: 'Client A', meeting_title: 'Old', created_at: '2025-01-01T10:00:00Z' }
    const mNew = { id: 'm-new', client_name: 'Client B', meeting_title: 'New', created_at: '2025-02-01T10:00:00Z' }
    await page.route('http://localhost:8788/api/meetings/list', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mOld, mNew]) })
    })
    let getByIdCalled = 0
    await page.route('http://localhost:8788/api/meetings/get-by-id', async r => {
      getByIdCalled++
      // Return mocked detail for latest meeting (mNew)
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        success: true,
        data: {
          summary: { clientName: 'Client B', meetingTitle: 'New', summary: 'Summary text' },
          followUpEmail: { content: 'Follow content' },
          socialMediaContent: { reels: [] },
          mindMap: '',
          isDiscovery: false,
          nextMeetingPrep: null
        }
      }) })
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // 在 WebKit 偶發直接跳 Clients，放寬為「Dashboard 或 Clients 任一狀態」
    await expect.poll(async () => {
      const welcome = await page.getByText('Welcome back').isVisible().catch(() => false)
      const search = await page.getByPlaceholder('Search clients...').isVisible().catch(() => false)
      return welcome || search
    }, { timeout: 15000 }).toBe(true)
    // After default routing, it should switch to Clients view with loaded data
    await expect(page.getByPlaceholder('Search clients...')).toBeVisible()
    await expect.poll(() => getByIdCalled).toBe(1)
  })

  test('Scenario 2: authenticated, no meetings → show AnalyticsDashboard (empty state)', async ({ page }) => {
    await page.route('http://localhost:8788/api/meetings/list', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    let called = 0
    await page.route('http://localhost:8788/api/meetings/get-by-id', async r => {
      called++
      await r.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText('Welcome back')).toBeVisible()
    expect(called).toBe(0)
  })

  test('Scenario 3: URL has params → skip default routing', async ({ page }) => {
    await page.route('http://localhost:8788/api/meetings/list', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'm1', client_name: 'X', meeting_title: 'Y', created_at: '2025-02-02T00:00:00Z' }]) })
    })
    let called = 0
    await page.route('http://localhost:8788/api/meetings/get-by-id', async r => {
      called++
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.goto('/?clientId=abc&view=meeting')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText('Welcome back')).toBeVisible()
    expect(called).toBe(0)
  })

  test('Scenario 4: already on specific tab (Clients) → keep tab, do not default-route again', async ({ page }) => {
    await page.route('http://localhost:8788/api/meetings/list', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'm1', client_name: 'C', meeting_title: 'T', created_at: '2025-02-02T00:00:00Z' }]) })
    })
    let getByIdCalls = 0
    await page.route('http://localhost:8788/api/meetings/get-by-id', async r => {
      getByIdCalls++
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.getByText('👥 Clients').click()
    // change meetings to trigger useEffect again
    await page.route('http://localhost:8788/api/meetings/list', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'm2', client_name: 'C2', meeting_title: 'New', created_at: '2025-03-01T00:00:00Z' }]) })
    })
    // small wait to allow effect
    await page.waitForTimeout(500)
    // Should not trigger default routing while on Clients
    expect(getByIdCalls).toBeLessThanOrEqual(1)
  })

  test('Scenario 5: ensure single call to get-by-id (no duplicate)', async ({ page }) => {
    await page.route('http://localhost:8788/api/meetings/list', async r => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 'm1', client_name: 'A', meeting_title: 'A', created_at: '2025-01-02T00:00:00Z' },
        { id: 'm2', client_name: 'B', meeting_title: 'B', created_at: '2025-03-02T00:00:00Z' }
      ]) })
    })
    let calls = 0
    await page.route('http://localhost:8788/api/meetings/get-by-id', async r => {
      calls++
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { summary: { clientName: 'B', meetingTitle: 'B', summary: '...' } } }) })
    })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Ensure default routing completed before asserting single call
    await expect(page.getByPlaceholder('Search clients...')).toBeVisible()
    await expect.poll(() => calls).toBe(1)
  })
})
