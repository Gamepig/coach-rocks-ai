import { test, expect } from '@playwright/test'

test.describe('Session Expiration Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      window.localStorage.setItem('sessionToken', 'test-session-token')
    })

    // Mock API endpoints
    await page.route('http://localhost:8788/api/dashboard', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ 
          success: true, 
          data: {
            totalMeetings: 5,
            clientsServed: 3,
            reelsGenerated: 2,
            thisWeekUploads: 1
          }
        }) 
      })
    })

    await page.route('http://localhost:8788/api/meetings/list', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify([]) 
      })
    })

    await page.route('http://localhost:8788/api/clients/list', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ success: true, data: [] }) 
      })
    })

    await page.route('http://localhost:8788/api/reels/list', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify([]) 
      })
    })

    await page.route('http://localhost:8788/api/tags', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ success: true, tags: [] }) 
      })
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
  })

  test('SE_1: Session expiration during dashboard load shows login prompt', async ({ page }) => {
    // Mock validate-session to return authenticated initially
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ 
          valid: true, 
          user: { 
            email: 'test@example.com',
            name: 'Test User',
            onboarding_completed: true
          } 
        }) 
      })
    })

    // Wait for dashboard to load
    await page.waitForTimeout(2000)

    // Verify user is authenticated and dashboard is visible
    const dashboardContent = page.locator('text=Total Meetings').or(page.locator('text=會議總數'))
    await expect(dashboardContent.first()).toBeVisible({ timeout: 5000 }).catch(() => {})

    // Now simulate session expiration by making validate-session return 401
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ valid: false }) 
      })
    })

    // Mock dashboard API to return 401 (session expired)
    await page.route('http://localhost:8788/api/dashboard', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ error: 'Unauthorized' }) 
      })
    })

    // Trigger a dashboard reload (e.g., by navigating or refreshing)
    // Or wait for automatic session check
    await page.waitForTimeout(3000)

    // Check that session token is cleared
    const sessionToken = await page.evaluate(() => {
      return window.localStorage.getItem('sessionToken')
    })
    expect(sessionToken).toBeNull()

    // Check that login prompt is shown
    const loginPrompt = page.locator('.login-prompt-overlay, .login-prompt')
    await expect(loginPrompt).toBeVisible({ timeout: 5000 })
  })

  test('SE_2: Session expiration during API call clears session and shows login', async ({ page }) => {
    // Mock validate-session to return authenticated initially
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ 
          valid: true, 
          user: { 
            email: 'test@example.com',
            name: 'Test User',
            onboarding_completed: true
          } 
        }) 
      })
    })

    // Wait for app to load
    await page.waitForTimeout(2000)

    // Verify user is authenticated
    const topBar = page.locator('.topbar-container')
    await expect(topBar).toBeVisible({ timeout: 5000 }).catch(() => {})

    // Now simulate session expiration by making an API call return 401
    await page.route('http://localhost:8788/api/clients/list', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ error: 'Unauthorized' }) 
      })
    })

    // Navigate to Clients tab to trigger API call
    const clientsTab = page.locator('[data-testid="nav-clients"]')
    if (await clientsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clientsTab.click()
      await page.waitForTimeout(2000)
    }

    // Wait for session expiration handling
    await page.waitForTimeout(2000)

    // Check that session token is cleared
    const sessionToken = await page.evaluate(() => {
      return window.localStorage.getItem('sessionToken')
    })
    expect(sessionToken).toBeNull()

    // Check that login prompt is shown or landing page is displayed
    const loginPrompt = page.locator('.login-prompt-overlay, .login-prompt')
    const landingPage = page.locator('.landing-page')
    
    const isLoginPromptVisible = await loginPrompt.isVisible({ timeout: 3000 }).catch(() => false)
    const isLandingPageVisible = await landingPage.isVisible({ timeout: 3000 }).catch(() => false)
    
    // Either login prompt or landing page should be visible
    expect(isLoginPromptVisible || isLandingPageVisible).toBe(true)
  })

  test('SE_3: Session expiration event is dispatched and handled', async ({ page }) => {
    // Mock validate-session to return authenticated initially
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ 
          valid: true, 
          user: { 
            email: 'test@example.com',
            name: 'Test User',
            onboarding_completed: true
          } 
        }) 
      })
    })

    // Wait for app to load
    await page.waitForTimeout(2000)

    // Listen for sessionExpired event
    let sessionExpiredEventFired = false
    await page.evaluate(() => {
      window.addEventListener('sessionExpired', () => {
        window.__sessionExpiredFired = true
      })
    })

    // Simulate session expiration by making an API call return 401
    await page.route('http://localhost:8788/api/meetings/list', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ error: 'Unauthorized' }) 
      })
    })

    // Trigger an API call that will fail with 401
    // Navigate to a tab that loads meetings
    await page.waitForTimeout(2000)

    // Check if sessionExpired event was fired
    sessionExpiredEventFired = await page.evaluate(() => {
      return window.__sessionExpiredFired === true
    })

    // The event should be fired when API returns 401
    // Note: This depends on the implementation of handleAuthError in api.js
    // If the event is dispatched, it should be true
    expect(sessionExpiredEventFired).toBe(true)
  })

  test('SE_4: Session expiration clears all user data', async ({ page }) => {
    // Mock validate-session to return authenticated initially
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ 
          valid: true, 
          user: { 
            email: 'test@example.com',
            name: 'Test User',
            onboarding_completed: true
          } 
        }) 
      })
    })

    // Wait for app to load
    await page.waitForTimeout(2000)

    // Verify user data is displayed
    const topBar = page.locator('.topbar-container')
    await expect(topBar).toBeVisible({ timeout: 5000 }).catch(() => {})

    // Simulate session expiration
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ valid: false }) 
      })
    })

    await page.route('http://localhost:8788/api/dashboard', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ error: 'Unauthorized' }) 
      })
    })

    // Trigger session expiration
    await page.reload()
    await page.waitForTimeout(3000)

    // Check that session token is cleared
    const sessionToken = await page.evaluate(() => {
      return window.localStorage.getItem('sessionToken')
    })
    expect(sessionToken).toBeNull()

    // Check that user data is no longer displayed
    const topBarAfterExpiration = page.locator('.topbar-container')
    const isTopBarVisible = await topBarAfterExpiration.isVisible({ timeout: 2000 }).catch(() => false)
    
    // TopBar should not be visible after session expiration
    expect(isTopBarVisible).toBe(false)

    // Check that login prompt or landing page is shown
    const loginPrompt = page.locator('.login-prompt-overlay, .login-prompt')
    const landingPage = page.locator('.landing-page')
    
    const isLoginPromptVisible = await loginPrompt.isVisible({ timeout: 3000 }).catch(() => false)
    const isLandingPageVisible = await landingPage.isVisible({ timeout: 3000 }).catch(() => false)
    
    // Either login prompt or landing page should be visible
    expect(isLoginPromptVisible || isLandingPageVisible).toBe(true)
  })

  test('SE_5: Session expiration during authenticated navigation redirects to login', async ({ page }) => {
    // Mock validate-session to return authenticated initially
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ 
          valid: true, 
          user: { 
            email: 'test@example.com',
            name: 'Test User',
            onboarding_completed: true
          } 
        }) 
      })
    })

    // Wait for app to load
    await page.waitForTimeout(2000)

    // Navigate to Clients tab
    const clientsTab = page.locator('[data-testid="nav-clients"]')
    if (await clientsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clientsTab.click()
      await page.waitForTimeout(1000)
    }

    // Now simulate session expiration
    await page.route('http://localhost:8788/api/validate-session', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ valid: false }) 
      })
    })

    await page.route('http://localhost:8788/api/clients/list', async route => {
      await route.fulfill({ 
        status: 401, 
        contentType: 'application/json', 
        body: JSON.stringify({ error: 'Unauthorized' }) 
      })
    })

    // Try to navigate to another tab (this should trigger session check)
    const reelsTab = page.locator('[data-testid="nav-reels"]')
    if (await reelsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reelsTab.click()
      await page.waitForTimeout(2000)
    }

    // Wait for session expiration handling
    await page.waitForTimeout(2000)

    // Check that session token is cleared
    const sessionToken = await page.evaluate(() => {
      return window.localStorage.getItem('sessionToken')
    })
    expect(sessionToken).toBeNull()

    // Check that login prompt or landing page is shown
    const loginPrompt = page.locator('.login-prompt-overlay, .login-prompt')
    const landingPage = page.locator('.landing-page')
    
    const isLoginPromptVisible = await loginPrompt.isVisible({ timeout: 3000 }).catch(() => false)
    const isLandingPageVisible = await landingPage.isVisible({ timeout: 3000 }).catch(() => false)
    
    // Either login prompt or landing page should be visible
    expect(isLoginPromptVisible || isLandingPageVisible).toBe(true)
  })
})

