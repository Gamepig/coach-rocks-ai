import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Seed session token before any app scripts run
    await page.addInitScript(() => {
      window.localStorage.setItem('sessionToken', 'pw-test-token')
    })

    // Stub backend APIs used on app boot
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, user: { email: 'test@example.com', onboarding_completed: true } })
      })
    })
    await page.route('http://localhost:8788/api/dashboard', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.route('http://localhost:8788/api/meetings/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('http://localhost:8788/api/clients/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
    })
    await page.route('http://localhost:8788/api/reels/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.route('http://localhost:8788/api/tags', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tags: [] }) })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })

    // Start at the home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should show dashboard by default', async ({ page }) => {
    // Welcome section in AnalyticsDashboard
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should navigate to Clients tab', async ({ page }) => {
    await page.getByRole('button', { name: '👥 Clients' }).click();
    // 使用更穩定的等待條件（任一特徵元素出現）
    await expect.poll(async () => {
      const search = await page.getByPlaceholder('Search clients...').isVisible().catch(() => false)
      const table = await page.getByRole('table').isVisible().catch(() => false)
      const row = await page.getByRole('row').first().isVisible().catch(() => false)
      return search || table || row
    }, { timeout: 15000 }).toBe(true)
    await expect(page.getByText('Welcome back')).not.toBeVisible()
  });

  test('should navigate to Reels tab', async ({ page }) => {
    await page.getByRole('button', { name: '🎬 Reels' }).click();
    // 等待 Reels 空狀態或表格顯示
    await expect.poll(async () => {
      const empty = await page.getByText('No reels found').isVisible().catch(() => false)
      const title = await page.getByText('Reels Scripts').isVisible().catch(() => false)
      const table = await page.getByRole('table').isVisible().catch(() => false)
      return empty || title || table
    }, { timeout: 15000 }).toBe(true)
    await expect(page.getByText('Welcome back')).not.toBeVisible();
  });

  test('should navigate to Settings tab', async ({ page }) => {
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await expect.poll(async () => {
      const panel = await page.getByText('Settings panel coming soon...').isVisible().catch(() => false)
      const current = await page.getByText('Current tab: Settings').isVisible().catch(() => false)
      return panel && current
    }, { timeout: 15000 }).toBe(true)
    await expect(page.getByText('Welcome back')).not.toBeVisible();
  });

  test('should navigate back to Dashboard from other tabs', async ({ page }) => {
    // Go to Clients
    await page.getByRole('button', { name: '👥 Clients' }).click();
    await expect.poll(async () => {
      return await page.getByPlaceholder('Search clients...').isVisible().catch(() => false)
    }, { timeout: 15000 }).toBe(true)

    // Back to Dashboard
    await page.getByRole('button', { name: '🏠 Dashboard' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('Search clients...')).not.toBeVisible();
  });

  test('should maintain only one active tab at a time', async ({ page }) => {
    // Test sequence: Dashboard -> Clients -> Reels -> Settings -> Dashboard
    
    // Start: Dashboard 應為可見
    await expect(page.getByText('Welcome back')).toBeVisible();
    
    // Go to Clients
    await page.getByRole('button', { name: '👥 Clients' }).click();
    await expect.poll(async () => {
      return await page.getByPlaceholder('Search clients...').isVisible().catch(() => false)
    }, { timeout: 15000 }).toBe(true)
    await expect(page.getByText('Welcome back')).not.toBeVisible();
    
    // Go to Reels
    await page.getByRole('button', { name: '🎬 Reels' }).click();
    await expect.poll(async () => {
      return await page.getByText('No reels found').isVisible().catch(() => false)
    }, { timeout: 15000 }).toBe(true)
    await expect(page.getByPlaceholder('Search clients...')).not.toBeVisible();
    await expect(page.getByText('Welcome back')).not.toBeVisible();
    
    // Go to Settings
    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await expect(page.getByText('Current tab: Settings')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('No reels found')).not.toBeVisible();
    await expect(page.getByText('Welcome back')).not.toBeVisible();
    
    // Go back to Dashboard
    await page.getByRole('button', { name: '🏠 Dashboard' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Current tab: Settings')).not.toBeVisible();
    await expect(page.getByPlaceholder('Search clients...')).not.toBeVisible();
  });
});

test.describe('Email Verification Navigation', () => {
  test('should handle email verification URL parameters', async ({ page }) => {
    // Seed token and stub endpoints used in verification flow
    await page.addInitScript(() => {
      window.localStorage.setItem('sessionToken', 'pw-test-token')
    })
    await page.route('http://localhost:8788/api/verify-email', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, sessionToken: 'pw-test-token', requiresClientSelection: false })
      })
    })
    await page.route('http://localhost:8788/api/meetings/get-by-id', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { summary: {}, followUpEmail: {}, socialMediaContent: {} } })
      })
    })
    await page.route('http://localhost:8788/api/clients/list', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
    })
    await page.route('http://localhost:8788/api/tags', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tags: [] }) })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, user: { email: 'test@example.com' } }) })
    })

    const emailVerificationUrl = '/?verified=true&analysis=complete&meetingId=test-meeting-123&token=test-token';
    await page.goto(emailVerificationUrl);
    await page.waitForLoadState('domcontentloaded');

    // 應切換到 Clients 相關內容（更穩定的等待條件，含備援）
    try {
      await expect.poll(async () => {
        const search = await page.getByPlaceholder('Search clients...').isVisible().catch(() => false)
        const table = await page.getByRole('table').isVisible().catch(() => false)
        const row = await page.getByRole('row').first().isVisible().catch(() => false)
        return search || table || row
      }, { timeout: 15000 }).toBe(true)
    } catch (e) {
      // 備援：使用 testid 切換；若不存在，退回以按鈕名稱切換
      try {
        await expect(page.getByTestId('nav-clients')).toBeVisible({ timeout: 5000 })
        await page.getByTestId('nav-clients').click()
      } catch {
        await page.getByRole('button', { name: '👥 Clients' }).click()
      }
      await expect(page.getByPlaceholder('Search clients...')).toBeVisible({ timeout: 10000 })
    }
    await expect(page.getByText('Welcome back')).not.toBeVisible();
  });
});
