/**
 * Settings and User Preferences Tests
 * 
 * Tests all settings functionality including:
 * - Settings page navigation and layout
 * - Content safety configuration
 * - Voice quality settings
 * - Theme preferences
 * - Privacy settings
 * - Settings persistence
 * - Settings validation
 */

import { test, expect } from '@playwright/test';
import { createTestHelpers, testAssertions, testData } from '../../utils/test-helpers';
import { selectors, textSelectors, urlPatterns } from '../../utils/selectors';

test.describe('Settings Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
  });

  test('should navigate to settings page via sidebar', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Open sidebar
    await page.click(selectors.sidebarToggle);
    
    // Click user avatar to open profile menu
    await page.click(selectors.userAvatar);
    await testAssertions.expectElementVisible(page, selectors.profileMenu);
    
    // Click settings link
    await page.click(selectors.settingsLink);
    
    // Verify navigation to settings page
    await testAssertions.expectPageURL(page, urlPatterns.settings);
    await testAssertions.expectElementVisible(page, selectors.settingsPage);
    await testAssertions.expectElementText(page, 'h1', textSelectors.settings);
  });

  test('should navigate directly to settings URL', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Navigate directly to settings
    await helpers.navigateToSettings();
    
    // Verify settings page loads
    await testAssertions.expectPageURL(page, urlPatterns.settings);
    await testAssertions.expectElementVisible(page, selectors.settingsPage);
  });

  test('should display all main settings sections', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.navigateToSettings();
    
    // Verify main settings sections are present
    await testAssertions.expectElementVisible(page, selectors.contentSafetySection);
    await testAssertions.expectElementText(page, 'body', textSelectors.contentSafety);
    await testAssertions.expectElementText(page, 'body', textSelectors.voiceQuality);
    
    // Verify settings categories
    const expectedSections = [
      'Content Safety',
      'Voice Settings',
      'Privacy Settings',
      'Display Settings'
    ];
    
    for (const section of expectedSections) {
      await testAssertions.expectElementText(page, 'body', section);
    }
  });

  test('should show settings loading state initially', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Navigate to settings and check for loading state
    await page.goto(urlPatterns.settings);
    
    // Initially should show loading
    const hasLoadingState = await page.locator('[data-testid="loading-settings"]').isVisible({ timeout: 1000 });
    
    // Wait for settings to load
    await helpers.waitForAppReady();
    
    // Loading state should be gone
    await testAssertions.expectElementHidden(page, '[data-testid="loading-settings"]');
  });
});

test.describe('Content Safety Settings', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToSettings();
  });

  test('should expand and collapse content safety section', async ({ page }) => {
    // Click content safety header to expand
    await page.click(selectors.contentSafetyHeader);
    
    // Verify section expands and shows controls
    await testAssertions.expectElementVisible(page, selectors.contentSafetyEnable);
    await testAssertions.expectElementVisible(page, selectors.safetyModeInform);
    
    // Click header again to collapse
    await page.click(selectors.contentSafetyHeader);
    
    // Verify section collapses
    await testAssertions.expectElementHidden(page, selectors.contentSafetyEnable);
  });

  test('should enable and disable content safety', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Expand content safety section
    await page.click(selectors.contentSafetyHeader);
    
    // Enable content safety
    await page.check(selectors.contentSafetyEnable);
    
    // Verify safety mode options become available
    await testAssertions.expectElementVisible(page, selectors.safetyModeInform);
    await testAssertions.expectElementVisible(page, selectors.safetyModeReview);
    await testAssertions.expectElementVisible(page, selectors.safetyModeFilter);
    
    // Save settings
    await helpers.saveSettings();
    
    // Disable content safety
    await page.uncheck(selectors.contentSafetyEnable);
    
    // Verify safety mode options become disabled/hidden
    const informModeEnabled = await page.locator(selectors.safetyModeInform).isEnabled();
    expect(informModeEnabled).toBe(false);
    
    // Save settings
    await helpers.saveSettings();
  });

  test('should configure safety modes correctly', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable content safety first
    await page.click(selectors.contentSafetyHeader);
    await page.check(selectors.contentSafetyEnable);
    
    // Test each safety mode
    const modes = [
      { selector: selectors.safetyModeInform, name: 'inform' },
      { selector: selectors.safetyModeReview, name: 'review' },
      { selector: selectors.safetyModeFilter, name: 'filter' }
    ];
    
    for (const mode of modes) {
      // Select mode
      await page.click(mode.selector);
      
      // Verify mode is selected
      await expect(page.locator(mode.selector)).toBeChecked();
      
      // Save and verify
      await helpers.saveSettings();
      
      // Reload page and verify persistence
      await page.reload();
      await helpers.waitForAppReady();
      await page.click(selectors.contentSafetyHeader);
      await expect(page.locator(mode.selector)).toBeChecked();
    }
  });

  test('should configure sensitivity levels correctly', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable content safety first
    await page.click(selectors.contentSafetyHeader);
    await page.check(selectors.contentSafetyEnable);
    
    // Test each sensitivity level
    const levels = [
      { selector: selectors.sensitivityLow, name: 'low' },
      { selector: selectors.sensitivityMedium, name: 'medium' },
      { selector: selectors.sensitivityHigh, name: 'high' }
    ];
    
    for (const level of levels) {
      // Select sensitivity level
      await page.click(level.selector);
      
      // Verify level is selected
      await expect(page.locator(level.selector)).toBeChecked();
      
      // Save settings
      await helpers.saveSettings();
    }
  });

  test('should show content safety descriptions and explanations', async ({ page }) => {
    // Expand content safety section
    await page.click(selectors.contentSafetyHeader);
    
    // Verify descriptive text is present
    const sectionText = await page.locator(selectors.contentSafetySection).textContent();
    expect(sectionText).toContain('Content Safety');
    
    // Check for mode descriptions
    await page.check(selectors.contentSafetyEnable);
    
    // Each mode should have descriptive text
    const modes = ['inform', 'review', 'filter'];
    for (const mode of modes) {
      const modeText = await page.locator(`[data-testid="safety-mode-${mode}-description"]`).textContent();
      expect(modeText?.length).toBeGreaterThan(10); // Should have meaningful description
    }
  });
});

test.describe('Voice Settings', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToSettings();
  });

  test('should configure voice quality settings', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find voice quality section
    const voiceSection = '[data-testid="voice-settings-section"]';
    await testAssertions.expectElementVisible(page, voiceSection);
    
    // Test voice quality options
    const qualityLevels = ['low', 'medium', 'high'];
    
    for (const level of qualityLevels) {
      const qualitySelector = `[data-testid="voice-quality-${level}"]`;
      
      if (await page.locator(qualitySelector).isVisible()) {
        await page.click(qualitySelector);
        await helpers.saveSettings();
        
        // Verify selection persists
        await page.reload();
        await helpers.waitForAppReady();
        await expect(page.locator(qualitySelector)).toBeChecked();
      }
    }
  });

  test('should configure auto-send settings', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find auto-send toggle
    const autoSendToggle = '[data-testid="voice-auto-send-toggle"]';
    
    if (await page.locator(autoSendToggle).isVisible()) {
      // Enable auto-send
      await page.check(autoSendToggle);
      await helpers.saveSettings();
      
      // Verify persistence
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(autoSendToggle)).toBeChecked();
      
      // Disable auto-send
      await page.uncheck(autoSendToggle);
      await helpers.saveSettings();
      
      // Verify persistence
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(autoSendToggle)).not.toBeChecked();
    }
  });

  test('should configure silence threshold', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find silence threshold slider or input
    const silenceThreshold = '[data-testid="silence-threshold"]';
    
    if (await page.locator(silenceThreshold).isVisible()) {
      // Set threshold value
      await page.fill(silenceThreshold, '3');
      await helpers.saveSettings();
      
      // Verify persistence
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(silenceThreshold)).toHaveValue('3');
    }
  });
});

test.describe('Privacy Settings', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToSettings();
  });

  test('should configure conversation saving preferences', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find conversation saving toggle
    const saveConversationsToggle = '[data-testid="save-conversations-toggle"]';
    
    if (await page.locator(saveConversationsToggle).isVisible()) {
      // Test enabling/disabling
      await page.check(saveConversationsToggle);
      await helpers.saveSettings();
      
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(saveConversationsToggle)).toBeChecked();
      
      await page.uncheck(saveConversationsToggle);
      await helpers.saveSettings();
      
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(saveConversationsToggle)).not.toBeChecked();
    }
  });

  test('should configure usage data sharing', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find usage data toggle
    const shareUsageToggle = '[data-testid="share-usage-toggle"]';
    
    if (await page.locator(shareUsageToggle).isVisible()) {
      // Test enabling/disabling
      await page.check(shareUsageToggle);
      await helpers.saveSettings();
      
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(shareUsageToggle)).toBeChecked();
      
      await page.uncheck(shareUsageToggle);
      await helpers.saveSettings();
    }
  });

  test('should configure online status visibility', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find online status toggle
    const onlineStatusToggle = '[data-testid="online-status-toggle"]';
    
    if (await page.locator(onlineStatusToggle).isVisible()) {
      // Test enabling/disabling
      await page.uncheck(onlineStatusToggle);
      await helpers.saveSettings();
      
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(onlineStatusToggle)).not.toBeChecked();
      
      await page.check(onlineStatusToggle);
      await helpers.saveSettings();
    }
  });
});

test.describe('Display Settings', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToSettings();
  });

  test('should configure theme preferences', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find theme options
    const themes = ['light', 'dark', 'system'];
    
    for (const theme of themes) {
      const themeSelector = `[data-testid="theme-${theme}"]`;
      
      if (await page.locator(themeSelector).isVisible()) {
        await page.click(themeSelector);
        await helpers.saveSettings();
        
        // Verify theme is applied
        await page.reload();
        await helpers.waitForAppReady();
        await expect(page.locator(themeSelector)).toBeChecked();
        
        // Verify theme class is applied to body/html
        const bodyClass = await page.locator('body').getAttribute('class');
        if (theme !== 'system') {
          expect(bodyClass).toContain(theme);
        }
      }
    }
  });

  test('should configure language preferences', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find language selector
    const languageSelect = '[data-testid="language-select"]';
    
    if (await page.locator(languageSelect).isVisible()) {
      // Select language
      await page.selectOption(languageSelect, 'en');
      await helpers.saveSettings();
      
      // Verify persistence
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(languageSelect)).toHaveValue('en');
    }
  });

  test('should configure reduced motion preference', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Find reduced motion toggle
    const reducedMotionToggle = '[data-testid="reduced-motion-toggle"]';
    
    if (await page.locator(reducedMotionToggle).isVisible()) {
      // Enable reduced motion
      await page.check(reducedMotionToggle);
      await helpers.saveSettings();
      
      // Verify persistence
      await page.reload();
      await helpers.waitForAppReady();
      await expect(page.locator(reducedMotionToggle)).toBeChecked();
      
      // Verify CSS class is applied
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(htmlClass).toContain('reduced-motion');
    }
  });
});

test.describe('Settings Persistence and Validation', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToSettings();
  });

  test('should save and persist all settings across sessions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Configure multiple settings
    await page.click(selectors.contentSafetyHeader);
    await page.check(selectors.contentSafetyEnable);
    await page.click(selectors.safetyModeReview);
    await page.click(selectors.sensitivityMedium);
    
    // Save settings
    await helpers.saveSettings();
    
    // Simulate new session by clearing cache and reloading
    await page.context().clearCookies();
    await page.reload();
    await helpers.waitForAppReady();
    
    // Verify settings persist
    await page.click(selectors.contentSafetyHeader);
    await expect(page.locator(selectors.contentSafetyEnable)).toBeChecked();
    await expect(page.locator(selectors.safetyModeReview)).toBeChecked();
    await expect(page.locator(selectors.sensitivityMedium)).toBeChecked();
  });

  test('should show validation errors for invalid settings', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Try to set invalid silence threshold (if applicable)
    const silenceThreshold = '[data-testid="silence-threshold"]';
    
    if (await page.locator(silenceThreshold).isVisible()) {
      // Set invalid value
      await page.fill(silenceThreshold, '-1');
      await page.click(selectors.saveSettingsButton);
      
      // Should show validation error
      const errorMessage = page.locator('[data-testid="validation-error"]');
      await expect(errorMessage).toBeVisible();
      
      // Fix the value
      await page.fill(silenceThreshold, '2');
      await helpers.saveSettings();
      
      // Error should be gone
      await expect(errorMessage).not.toBeVisible();
    }
  });

  test('should handle settings save failures gracefully', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Intercept settings save request to simulate failure
    await page.route('**/api/preferences', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      } else {
        route.continue();
      }
    });
    
    // Try to save settings
    await page.click(selectors.contentSafetyHeader);
    await page.check(selectors.contentSafetyEnable);
    await page.click(selectors.saveSettingsButton);
    
    // Should show error message
    await testAssertions.expectElementVisible(page, selectors.errorMessage);
    
    // Should show retry option
    const retryButton = page.locator('[data-testid="retry-save"]');
    const hasRetry = await retryButton.isVisible();
    expect(hasRetry).toBe(true);
  });

  test('should show unsaved changes warning', async ({ page }) => {
    // Make changes without saving
    await page.click(selectors.contentSafetyHeader);
    await page.check(selectors.contentSafetyEnable);
    
    // Try to navigate away
    await page.goto('/');
    
    // Should show unsaved changes warning (if implemented)
    const hasWarning = await page.locator('[data-testid="unsaved-changes-warning"]').isVisible({ timeout: 2000 });
    
    if (hasWarning) {
      // Cancel navigation
      await page.click('[data-testid="cancel-navigation"]');
      
      // Should stay on settings page
      await testAssertions.expectPageURL(page, urlPatterns.settings);
    }
  });

  test('should reset settings to defaults', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Make some changes
    await page.click(selectors.contentSafetyHeader);
    await page.check(selectors.contentSafetyEnable);
    await helpers.saveSettings();
    
    // Reset to defaults (if reset button exists)
    const resetButton = '[data-testid="reset-settings"]';
    
    if (await page.locator(resetButton).isVisible()) {
      await page.click(resetButton);
      
      // Confirm reset
      await page.click('[data-testid="confirm-reset"]');
      
      // Verify settings are reset
      await page.reload();
      await helpers.waitForAppReady();
      await page.click(selectors.contentSafetyHeader);
      await expect(page.locator(selectors.contentSafetyEnable)).not.toBeChecked();
    }
  });
});

test.describe('Settings Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToSettings();
  });

  test('should be fully keyboard navigable', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Tab through settings controls
    await page.keyboard.press('Tab');
    
    // Should be able to navigate to content safety header
    await expect(page.locator(selectors.contentSafetyHeader)).toBeFocused();
    
    // Activate with Enter
    await page.keyboard.press('Enter');
    
    // Should expand section
    await testAssertions.expectElementVisible(page, selectors.contentSafetyEnable);
    
    // Continue tabbing to toggle
    await page.keyboard.press('Tab');
    await expect(page.locator(selectors.contentSafetyEnable)).toBeFocused();
    
    // Activate with Space
    await page.keyboard.press('Space');
    await expect(page.locator(selectors.contentSafetyEnable)).toBeChecked();
  });

  test('should have proper ARIA labels and descriptions', async ({ page }) => {
    // Expand content safety section
    await page.click(selectors.contentSafetyHeader);
    
    // Check for proper ARIA attributes
    const enableToggle = page.locator(selectors.contentSafetyEnable);
    const ariaLabel = await enableToggle.getAttribute('aria-label');
    const ariaDescribedBy = await enableToggle.getAttribute('aria-describedby');
    
    expect(ariaLabel || ariaDescribedBy).toBeTruthy();
    
    // Check for fieldsets and legends
    const fieldsets = await page.locator('fieldset').count();
    expect(fieldsets).toBeGreaterThan(0);
    
    const legends = await page.locator('legend').count();
    expect(legends).toBeGreaterThan(0);
  });

  test('should announce status changes to screen readers', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Look for live regions
    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    const hasLiveRegions = await liveRegions.count() > 0;
    
    expect(hasLiveRegions).toBe(true);
    
    // Make a change and verify announcement
    await page.click(selectors.contentSafetyHeader);
    await page.check(selectors.contentSafetyEnable);
    await helpers.saveSettings();
    
    // Success message should be announced
    await testAssertions.expectElementVisible(page, selectors.successMessage);
    const successMessage = page.locator(selectors.successMessage);
    const ariaLive = await successMessage.getAttribute('aria-live');
    expect(ariaLive).toBeTruthy();
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addInitScript(() => {
      window.matchMedia = (query) => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      });
    });
    
    await page.reload();
    const helpers = createTestHelpers(page);
    await helpers.waitForAppReady();
    
    // Verify high contrast styles are applied
    const bodyClass = await page.locator('body').getAttribute('class');
    expect(bodyClass).toContain('high-contrast');
  });
});

test.describe('Settings Performance', () => {
  test('should load settings quickly', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    
    // Measure settings page load time
    const startTime = Date.now();
    await helpers.navigateToSettings();
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should save settings quickly', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.navigateToSettings();
    
    // Make a change and measure save time
    await page.click(selectors.contentSafetyHeader);
    await page.check(selectors.contentSafetyEnable);
    
    const startTime = Date.now();
    await page.click(selectors.saveSettingsButton);
    await page.locator(selectors.successMessage).waitFor({ state: 'visible' });
    const saveTime = Date.now() - startTime;
    
    // Should save within 1 second
    expect(saveTime).toBeLessThan(1000);
  });
});