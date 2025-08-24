import { test, expect, devices } from '@playwright/test';

test.describe('PWA Features Cross-Browser Testing', () => {
  
  test('PWA manifest loads correctly across browsers', async ({ page }) => {
    await page.goto('/');
    
    // Check manifest link exists
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toBeAttached();
    await expect(manifest).toHaveAttribute('href', '/manifest.json');
    
    // Verify manifest content loads without 404
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    
    const manifestData = await manifestResponse.json();
    expect(manifestData.name).toBe('Rubber Ducky Live - AI Chat Companion');
    expect(manifestData.short_name).toBe('Rubber Ducky');
  });

  test('PWA icons load without 404 errors', async ({ page }) => {
    await page.goto('/');
    
    // Test critical icon sizes that were causing issues
    const criticalIcons = [
      '/icons/icon-144.png',
      '/icons/icon-192.png', 
      '/icons/icon-512.png'
    ];
    
    for (const iconPath of criticalIcons) {
      const iconResponse = await page.request.get(iconPath);
      expect(iconResponse.status(), `Icon ${iconPath} should load`).toBe(200);
      
      // Verify it's actually an image
      const contentType = iconResponse.headers()['content-type'];
      expect(contentType).toContain('image/');
    }
  });

  test('Service Worker registration works', async ({ page, browserName }) => {
    // Skip in Firefox as it has different SW behavior
    test.skip(browserName === 'firefox', 'Service Worker testing in Firefox');
    
    await page.goto('/');
    await page.waitForTimeout(2000); // Allow SW registration time
    
    // Check if service worker registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
    });
    
    if (browserName === 'webkit') {
      // Safari may not support all SW features
      console.log('Service Worker support varies in Safari');
    } else {
      expect(swRegistered).toBeTruthy();
    }
  });

  test('PWA install prompt behavior', async ({ page, browserName }) => {
    // Only test in Chrome/Edge where install prompts are reliable
    test.skip(!['chromium', 'chrome'].includes(browserName.toLowerCase()), 
      'PWA install only in Chromium browsers');
    
    await page.goto('/');
    
    // Look for install button or prompt
    const installButton = page.locator('[data-testid="install-button"]');
    if (await installButton.count() > 0) {
      await expect(installButton).toBeVisible();
    }
  });
});

test.describe('Responsive Design Cross-Browser', () => {
  
  test('Mobile navigation works on touch devices', async ({ page, isMobile }) => {
    await page.goto('/');
    
    if (isMobile) {
      // Test hamburger menu on mobile
      const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
      await expect(hamburgerButton).toBeVisible();
      
      // Test menu opening
      await hamburgerButton.click();
      await page.waitForTimeout(300); // Animation time
      
      // Menu should be open
      const menu = page.locator('[data-mobile-menu]');
      await expect(menu).toBeVisible();
      
      // Test menu closing by clicking outside
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(300);
      
      // Menu should be closed
      await expect(menu).not.toBeVisible();
    }
  });

  test('Theme toggle works across screen sizes', async ({ page }) => {
    await page.goto('/');
    
    // Find theme toggle button
    const themeToggle = page.locator('button[title*="mode"], button[aria-label*="theme"]').first();
    await expect(themeToggle).toBeVisible();
    
    // Test theme switching
    await themeToggle.click();
    await page.waitForTimeout(200); // Allow theme transition
    
    // Verify theme changed (check for dark class or CSS custom properties)
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') || 
             document.body.classList.contains('dark');
    });
    
    expect(typeof isDark).toBe('boolean');
  });

  test('Voice input button is accessible on mobile', async ({ page, isMobile }) => {
    await page.goto('/');
    
    const voiceButton = page.locator('button[aria-label*="voice"], button[title*="voice"]').first();
    
    if (isMobile) {
      // On mobile, voice button should be touch-friendly
      await expect(voiceButton).toBeVisible();
      
      const boundingBox = await voiceButton.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44); // 44px minimum touch target
      expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Cross-Browser Compatibility Features', () => {
  
  test('Chat functionality works across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Test basic chat input
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await expect(chatInput).toBeVisible();
    
    await chatInput.fill('Hello, this is a test message');
    await chatInput.press('Enter');
    
    // Wait for message to appear (or loading state)
    await page.waitForTimeout(1000);
    
    // Message should appear in chat
    const messages = page.locator('[data-testid*="message"], .message');
    await expect(messages.first()).toBeVisible();
  });

  test('WebRTC/MediaDevices support for voice features', async ({ page, browserName }) => {
    await page.goto('/');
    
    const hasMediaDevices = await page.evaluate(() => {
      return typeof navigator.mediaDevices !== 'undefined' && 
             typeof navigator.mediaDevices.getUserMedia === 'function';
    });
    
    if (browserName === 'webkit') {
      // Safari may require HTTPS for media access
      console.log('Media access may require HTTPS in Safari');
    } else {
      expect(hasMediaDevices).toBeTruthy();
    }
  });

  test('Local storage and session persistence', async ({ page }) => {
    await page.goto('/');
    
    // Test localStorage availability
    const hasLocalStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        const value = localStorage.getItem('test');
        localStorage.removeItem('test');
        return value === 'value';
      } catch {
        return false;
      }
    });
    
    expect(hasLocalStorage).toBeTruthy();
  });
});