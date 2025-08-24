/**
 * Reusable test utilities and helper functions for Playwright tests
 */

import { Page, Locator, expect } from '@playwright/test';
import { selectors, textSelectors, urlPatterns } from './selectors';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigation helpers
   */
  async navigateToHome() {
    await this.page.goto(urlPatterns.home);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSettings() {
    await this.page.goto(urlPatterns.settings);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToProfile() {
    await this.page.goto(urlPatterns.profile);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSession(sessionId: string) {
    await this.page.goto(urlPatterns.session(sessionId));
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for app to be fully loaded and ready
   */
  async waitForAppReady() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator(selectors.chatInterface)).toBeVisible();

    // Wait for any loading states to complete
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"]');
      return loadingElements.length === 0;
    }, { timeout: 10000 });
  }

  /**
   * Authentication helpers
   */
  async ensureDemoMode() {
    // Ensure we're in demo mode for consistent testing
    await this.page.addInitScript(() => {
      localStorage.setItem('demo-mode', 'true');
    });
  }

  async clearAuthState() {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async simulateNewUser() {
    await this.clearAuthState();
    await this.page.evaluate(() => {
      localStorage.removeItem('rubber-ducky-onboarding-completed');
    });
  }

  /**
   * Chat interaction helpers
   */
  async sendMessage(message: string, waitForResponse: boolean = true) {
    const messageInput = this.page.locator(selectors.messageInput);
    await messageInput.fill(message);
    await this.page.click(selectors.sendButton);

    // Wait for user message to appear
    await expect(this.page.locator(selectors.userMessage).last()).toContainText(message);

    if (waitForResponse) {
      // Wait for thinking indicator
      await expect(this.page.locator(selectors.thinkingIndicator)).toBeVisible();

      // Wait for AI response (with longer timeout for actual API calls)
      await expect(this.page.locator(selectors.aiMessage).last()).toBeVisible({ timeout: 30000 });

      // Wait for thinking indicator to disappear
      await expect(this.page.locator(selectors.thinkingIndicator)).not.toBeVisible();
    }
  }

  async sendMessageWithEnter(message: string, waitForResponse: boolean = true) {
    const messageInput = this.page.locator(selectors.messageInput);
    await messageInput.fill(message);
    await messageInput.press('Enter');

    if (waitForResponse) {
      await this.waitForAIResponse();
    }
  }

  async waitForAIResponse(timeout: number = 30000) {
    await expect(this.page.locator(selectors.thinkingIndicator)).toBeVisible();
    await expect(this.page.locator(selectors.aiMessage).last()).toBeVisible({ timeout });
    await expect(this.page.locator(selectors.thinkingIndicator)).not.toBeVisible();
  }

  /**
   * Message management helpers
   */
  async starMessage(messageIndex: number = -1) {
    const message = messageIndex === -1
      ? this.page.locator(selectors.aiMessage).last()
      : this.page.locator(selectors.aiMessage).nth(messageIndex);

    await message.hover();
    await message.locator(selectors.starButton).click();

    // Verify message is starred
    await expect(message.locator(selectors.starredMessage)).toBeVisible();
  }

  async unstarMessage(messageIndex: number = -1) {
    const message = messageIndex === -1
      ? this.page.locator(selectors.aiMessage).last()
      : this.page.locator(selectors.aiMessage).nth(messageIndex);

    await message.hover();
    await message.locator(selectors.starButton).click();

    // Verify message is unstarred
    await expect(message.locator(selectors.starredMessage)).not.toBeVisible();
  }

  async tagMessage(tag: string, messageIndex: number = -1) {
    const message = messageIndex === -1
      ? this.page.locator(selectors.aiMessage).last()
      : this.page.locator(selectors.aiMessage).nth(messageIndex);

    await message.hover();
    await message.locator(selectors.tagButton).click();

    const tagInput = this.page.locator(selectors.tagInput);
    await tagInput.fill(tag);
    await tagInput.press('Enter');

    // Verify tag appears
    await expect(message.locator(selectors.messageTag).filter({ hasText: tag })).toBeVisible();
  }

  async copyMessage(messageIndex: number = -1) {
    const message = messageIndex === -1
      ? this.page.locator(selectors.aiMessage).last()
      : this.page.locator(selectors.aiMessage).nth(messageIndex);

    await message.hover();
    await message.locator(selectors.copyButton).click();

    // Note: Clipboard testing requires special setup in CI
    // For now, just verify the button was clicked
    await expect(message.locator(selectors.copyButton)).toHaveAttribute('data-copied', 'true');
  }

  /**
   * Voice recognition helpers
   */
  async startVoiceRecognition() {
    // Grant microphone permissions
    await this.page.context().grantPermissions(['microphone']);

    await this.page.click(selectors.voiceButton);
    await expect(this.page.locator(selectors.voiceStatus)).toBeVisible();
  }

  async stopVoiceRecognition() {
    await this.page.click(selectors.voiceButton);
    await expect(this.page.locator(selectors.voiceStatus)).not.toBeVisible();
  }

  async waitForVoiceQualityMetrics() {
    await expect(this.page.locator(selectors.qualityMetrics)).toBeVisible();
    await expect(this.page.locator(selectors.confidenceScore)).toBeVisible();
    await expect(this.page.locator(selectors.audioQuality)).toBeVisible();
  }

  /**
   * Settings helpers
   */
  async openSettings() {
    await this.page.click(selectors.sidebarToggle);
    await this.page.click(selectors.userAvatar);
    await this.page.click(selectors.settingsLink);
    await expect(this.page).toHaveURL(urlPatterns.settings);
  }

  async enableContentSafety() {
    await this.openSettings();
    await this.page.click(selectors.contentSafetyHeader);
    await this.page.check(selectors.contentSafetyEnable);
    await this.saveSettings();
  }

  async disableContentSafety() {
    await this.openSettings();
    await this.page.click(selectors.contentSafetyHeader);
    await this.page.uncheck(selectors.contentSafetyEnable);
    await this.saveSettings();
  }

  async setContentSafetyMode(mode: 'inform' | 'review' | 'filter') {
    const modeSelectors = {
      inform: selectors.safetyModeInform,
      review: selectors.safetyModeReview,
      filter: selectors.safetyModeFilter,
    };

    await this.page.click(modeSelectors[mode]);
  }

  async setContentSafetySensitivity(level: 'low' | 'medium' | 'high') {
    const levelSelectors = {
      low: selectors.sensitivityLow,
      medium: selectors.sensitivityMedium,
      high: selectors.sensitivityHigh,
    };

    await this.page.click(levelSelectors[level]);
  }

  async saveSettings() {
    await this.page.click(selectors.saveSettingsButton);
    await expect(this.page.locator(selectors.successMessage)).toBeVisible();
  }

  /**
   * Session management helpers
   */
  async createNewSession() {
    await this.page.click(selectors.newSessionButton);
    await this.waitForAppReady();
  }

  async openSessionHistory() {
    await this.page.click(selectors.sessionHistoryButton);
    await expect(this.page.locator(selectors.sessionBrowser)).toBeVisible();
  }

  async openStarredItems() {
    await this.page.click(selectors.starredItemsButton);
    await expect(this.page.locator(selectors.starsBrowser)).toBeVisible();
  }

  /**
   * Onboarding tour helpers
   */
  async waitForOnboardingStart() {
    await expect(this.page.locator(selectors.onboardingTooltip)).toBeVisible({ timeout: 5000 });
  }

  async completeOnboardingTour() {
    let step = 0;
    const maxSteps = 10; // Safety limit

    while (step < maxSteps) {
      try {
        // Check if tour tooltip is still visible
        const tooltip = this.page.locator(selectors.onboardingTooltip);
        const isVisible = await tooltip.isVisible({ timeout: 1000 });

        if (!isVisible) break;

        // Try to click next, then finish, then close
        const nextButton = this.page.locator(selectors.tourNext);
        const finishButton = this.page.locator(selectors.tourFinish);

        if (await nextButton.isVisible()) {
          await nextButton.click();
        } else if (await finishButton.isVisible()) {
          await finishButton.click();
          break;
        } else {
          // Fallback to close
          await this.page.locator(selectors.tourClose).click();
          break;
        }

        step++;
        await this.page.waitForTimeout(500); // Small delay between steps
      } catch (error) {
        // If we can't find tour elements, assume tour is complete
        break;
      }
    }

    // Verify tour is complete
    await expect(this.page.locator(selectors.onboardingTooltip)).not.toBeVisible();
  }

  async skipOnboardingTour() {
    await this.page.click(selectors.tourSkip);
    await expect(this.page.locator(selectors.onboardingTooltip)).not.toBeVisible();
  }

  /**
   * Export functionality helpers
   */
  async exportMessageToPDF(messageIndex: number = -1) {
    const message = messageIndex === -1
      ? this.page.locator(selectors.aiMessage).last()
      : this.page.locator(selectors.aiMessage).nth(messageIndex);

    await message.hover();
    await message.locator(selectors.messageMenu).click();
    await this.page.click(selectors.exportPdf);

    await expect(this.page.locator(selectors.exportOptions)).toBeVisible();
  }

  async downloadLocalExport() {
    const downloadPromise = this.page.waitForDownload();
    await this.page.click(selectors.downloadLocal);
    return await downloadPromise;
  }

  /**
   * Error handling helpers
   */
  async simulateNetworkError() {
    await this.page.context().setOffline(true);
  }

  async restoreNetwork() {
    await this.page.context().setOffline(false);
  }

  async waitForErrorMessage() {
    await expect(this.page.locator(selectors.errorMessage)).toBeVisible();
  }

  async retryFailedAction() {
    await this.page.click(selectors.errorRetry);
  }

  /**
   * Performance helpers
   */
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureAPIResponseTime(apiEndpoint: string): Promise<number> {
    const responsePromise = this.page.waitForResponse(response =>
      response.url().includes(apiEndpoint) && response.status() === 200
    );

    const response = await responsePromise;
    return response.timing().responseEnd;
  }

  /**
   * Accessibility helpers
   */
  async checkKeyboardNavigation() {
    // Start from the first focusable element
    await this.page.keyboard.press('Tab');

    const focusedElement = await this.page.evaluate(() => {
      return document.activeElement?.tagName || null;
    });

    return ['BUTTON', 'TEXTAREA', 'INPUT', 'A'].includes(focusedElement || '');
  }

  async verifyARIALabels() {
    const buttons = await this.page.locator('button').all();
    const unlabeledButtons = [];

    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      if (!ariaLabel && !text?.trim()) {
        unlabeledButtons.push(button);
      }
    }

    return unlabeledButtons.length === 0;
  }

  /**
   * Mobile testing helpers
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 390, height: 844 }); // iPhone 12
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 }); // iPad
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  async verifyMobileLayout() {
    await expect(this.page.locator(selectors.mobileMenu)).toBeVisible();
    await expect(this.page.locator(selectors.desktopNav)).not.toBeVisible();
  }

  async verifyDesktopLayout() {
    await expect(this.page.locator(selectors.desktopNav)).toBeVisible();
    await expect(this.page.locator(selectors.mobileMenu)).not.toBeVisible();
  }

  /**
   * Utility methods
   */
  async waitForTimeout(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  async getElementText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  async getElementAttribute(selector: string, attribute: string): Promise<string> {
    return await this.page.locator(selector).getAttribute(attribute) || '';
  }

  async isElementVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  async isElementEnabled(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isEnabled();
  }

  /**
   * Cleanup helpers
   */
  async cleanup() {
    await this.clearAuthState();
    await this.page.close();
  }
}

/**
 * Factory function to create test helpers
 */
export function createTestHelpers(page: Page): TestHelpers {
  return new TestHelpers(page);
}

/**
 * Common test assertions
 */
export const testAssertions = {
  async expectMessageCount(page: Page, count: number) {
    await expect(page.locator(selectors.aiMessage)).toHaveCount(count);
  },

  async expectUserMessageCount(page: Page, count: number) {
    await expect(page.locator(selectors.userMessage)).toHaveCount(count);
  },

  async expectNoErrors(page: Page) {
    await expect(page.locator(selectors.errorMessage)).not.toBeVisible();
  },

  async expectLoadingComplete(page: Page) {
    await expect(page.locator(selectors.loadingSpinner)).not.toBeVisible();
  },

  async expectPageURL(page: Page, expectedURL: string) {
    await expect(page).toHaveURL(expectedURL);
  },

  async expectElementText(page: Page, selector: string, expectedText: string) {
    await expect(page.locator(selector)).toContainText(expectedText);
  },

  async expectElementVisible(page: Page, selector: string) {
    await expect(page.locator(selector)).toBeVisible();
  },

  async expectElementHidden(page: Page, selector: string) {
    await expect(page.locator(selector)).not.toBeVisible();
  },
};

/**
 * Test data generators
 */
export const testData = {
  generateMessage: () => `Test message ${Date.now()}`,
  generateTag: () => `tag-${Math.random().toString(36).substr(2, 9)}`,
  generateSessionTitle: () => `Test Session ${new Date().toISOString()}`,

  sampleMessages: [
    'Hello, can you help me with a coding problem?',
    'What is the best way to learn TypeScript?',
    'Explain the concept of closures in JavaScript',
    'How do I implement authentication in Next.js?',
    'What are the benefits of using Playwright for testing?'
  ],

  sampleTags: ['important', 'code', 'question', 'reference', 'todo'],
};

export default TestHelpers;