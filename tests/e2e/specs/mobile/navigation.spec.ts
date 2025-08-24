import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Navigation Cross-Browser Testing', () => {
  
  test('Mobile theme toggle accessibility (Phase 1 improvement)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    await page.goto('/');
    
    // Test that theme toggle is directly accessible without opening hamburger menu
    // This was our Phase 1 mobile navigation improvement
    const themeToggle = page.locator('button[title*="mode"], button[aria-label*="theme"]').first();
    await expect(themeToggle).toBeVisible();
    
    // Verify it's in the main header, not inside a menu
    const headerContainer = page.locator('header, [role="banner"]').first();
    const themeToggleInHeader = headerContainer.locator('button[title*="mode"], button[aria-label*="theme"]').first();
    await expect(themeToggleInHeader).toBeVisible();
    
    // Test theme switching works
    const initialTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    
    await themeToggle.click();
    await page.waitForTimeout(300); // Theme transition
    
    const newTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
    
    expect(newTheme).not.toBe(initialTheme);
  });

  test('Enhanced hamburger menu closing behavior (Phase 1 improvement)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    await page.goto('/');
    
    // Find and open hamburger menu
    const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.click();
    
    // Menu should open
    const menu = page.locator('[data-mobile-menu]');
    await expect(menu).toBeVisible();
    
    // Test enhanced closing behavior - touch events should work
    // Click outside menu area
    await page.click('body', { position: { x: 50, y: 50 } });
    await page.waitForTimeout(300);
    
    // Menu should close
    await expect(menu).not.toBeVisible();
    
    // Test again with different interaction patterns
    await hamburgerButton.click();
    await expect(menu).toBeVisible();
    
    // Test escape key closing (should work with enhanced behavior)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(menu).not.toBeVisible();
  });

  test('Touch-friendly button sizing', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    await page.goto('/');
    
    const touchTargets = [
      'button[aria-label*="menu"]', // Hamburger menu
      'button[title*="mode"]', // Theme toggle
      'button[aria-label*="voice"]', // Voice button
    ];
    
    for (const selector of touchTargets) {
      const button = page.locator(selector).first();
      
      if (await button.count() > 0) {
        const boundingBox = await button.boundingBox();
        
        // iOS Human Interface Guidelines: 44px minimum
        // Android Material Design: 48dp minimum
        expect(boundingBox?.height, `${selector} height`).toBeGreaterThanOrEqual(44);
        expect(boundingBox?.width, `${selector} width`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Mobile viewport and responsive behavior', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    await page.goto('/');
    
    // Test viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute(
      'content', 
      /width=device-width.*initial-scale=1/
    );
    
    // Test that mobile layout is active
    const mobileHeader = page.locator('[data-testid="mobile-header"], .mobile-header');
    if (await mobileHeader.count() > 0) {
      await expect(mobileHeader).toBeVisible();
    }
    
    // Test that content doesn't overflow horizontally
    const bodyOverflow = await page.evaluate(() => {
      return {
        scrollWidth: document.body.scrollWidth,
        clientWidth: document.body.clientWidth
      };
    });
    
    // Allow small tolerance for scrollbars or rounding
    expect(bodyOverflow.scrollWidth - bodyOverflow.clientWidth).toBeLessThanOrEqual(20);
  });

  test('Mobile PWA install button positioning', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    await page.goto('/');
    
    // Look for PWA install button
    const installButton = page.locator('[data-testid="install-button"], button[aria-label*="install"]');
    
    if (await installButton.count() > 0) {
      await expect(installButton).toBeVisible();
      
      // Check if it overlaps with recording tools (this was a reported issue)
      const installBox = await installButton.boundingBox();
      const recordingTools = page.locator('[data-testid="recording-tools"], .recording-tools');
      
      if (await recordingTools.count() > 0) {
        const recordingBox = await recordingTools.boundingBox();
        
        if (installBox && recordingBox) {
          // Check for overlap
          const overlap = !(installBox.x + installBox.width <= recordingBox.x || 
                          recordingBox.x + recordingBox.width <= installBox.x ||
                          installBox.y + installBox.height <= recordingBox.y ||
                          recordingBox.y + recordingBox.height <= installBox.y);
          
          expect(overlap, 'Install button should not overlap recording tools').toBeFalsy();
        }
      }
    }
  });
});

test.describe('Mobile Cross-Browser Voice Features', () => {
  
  test('Voice button accessibility across mobile browsers', async ({ page, isMobile, browserName }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    await page.goto('/');
    
    const voiceButton = page.locator('button[aria-label*="voice"], button[title*="voice"]').first();
    await expect(voiceButton).toBeVisible();
    
    // Test browser-specific voice support
    const hasVoiceSupport = await page.evaluate(() => {
      return typeof navigator.mediaDevices !== 'undefined' && 
             typeof navigator.mediaDevices.getUserMedia === 'function';
    });
    
    if (browserName.toLowerCase().includes('safari')) {
      // iOS Safari has specific voice handling requirements
      console.log('iOS Safari voice features may require user gesture');
    }
    
    expect(hasVoiceSupport).toBeTruthy();
  });

  test('Microphone permissions handling', async ({ page, isMobile, browserName }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    await page.goto('/');
    
    // Test that permission handling is browser-appropriate
    const permissionsAPI = await page.evaluate(() => {
      return typeof navigator.permissions !== 'undefined';
    });
    
    if (browserName.toLowerCase().includes('safari')) {
      // Safari may not have full Permissions API
      console.log('Safari permissions API may be limited');
    } else {
      expect(permissionsAPI).toBeTruthy();
    }
  });
});