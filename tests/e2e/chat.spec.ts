import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat interface
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display the main chat interface', async ({ page }) => {
    // Check if the main chat interface elements are present
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Check for the rubber ducky branding
    await expect(page.locator('text=Rubber Ducky')).toBeVisible();

    // Verify input field is present
    await expect(page.locator('textarea[placeholder*="message"]')).toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });

    // New Session button should be visible on desktop
    await expect(page.locator('button[title*="New Session"]')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 600, height: 800 });

    // New Session button should be hidden, overflow menu should be visible
    await expect(page.locator('button[title*="More options"]')).toBeVisible();
  });

  test('should show agent selector', async ({ page }) => {
    // Check if agent selector is present
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible();

    // Should show default agent or loading state
    const agentText = page.locator('[data-testid="agent-selector"]');
    await expect(agentText).toContainText(/Power Agent|Loading/);
  });

  test('should handle new session creation', async ({ page }) => {
    // Click the new session button
    await page.click('button[title*="New Session"]');

    // Should clear any existing messages
    // Note: This test assumes we're testing with actual backend
    // In a real test, we might want to mock the API responses
  });

  test('should show session history browser', async ({ page }) => {
    // Click session history button
    await page.click('button[title*="Session History"]');

    // Session browser modal should open
    await expect(page.locator('text=Session History')).toBeVisible();

    // Close button should be present
    await expect(page.locator('button[title*="Close"]')).toBeVisible();

    // Close the modal
    await page.click('button[title*="Close"]');

    // Modal should be closed
    await expect(page.locator('text=Session History')).not.toBeVisible();
  });

  test('should show stars browser', async ({ page }) => {
    // Click stars browser button
    await page.click('button[title*="Starred Items"]');

    // Stars browser should open
    await expect(page.locator('text=Starred Items')).toBeVisible();
  });

  test('should toggle continuous conversation mode', async ({ page }) => {
    // Find and click continuous mode toggle
    const continuousButton = page.locator('button[title*="continuous conversation"]');
    await expect(continuousButton).toBeVisible();

    // Click to enable continuous mode
    await continuousButton.click();

    // Should show continuous mode indicator
    await expect(page.locator('text=Live Mode')).toBeVisible();
  });

  test('should handle theme toggle', async ({ page }) => {
    // Find theme toggle button
    const themeButton = page.locator('button[title*="theme"]');
    await expect(themeButton).toBeVisible();

    // Click to toggle theme
    await themeButton.click();

    // Theme should change (this would need more specific checks)
    // Could check for dark/light mode classes on document
  });

  test('should show thinking indicator when AI is processing', async ({ page }) => {
    // This test would need to be implemented with API mocking
    // to simulate AI processing state

    // Type a message
    await page.fill('textarea[placeholder*="message"]', 'Test message');

    // Submit the message (assuming Enter key or send button)
    await page.press('textarea[placeholder*="message"]', 'Enter');

    // Should show thinking indicator
    await expect(page.locator('text=Rubber Ducky is thinking')).toBeVisible();
  });
});

test.describe('Agent Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should allow agent selection', async ({ page }) => {
    // Click on agent selector
    await page.click('[data-testid="agent-selector"]');

    // Should show agent options
    await expect(page.locator('text=Power Agents')).toBeVisible();
  });

  test('should show create agent modal', async ({ page }) => {
    // This would test the create agent functionality
    // Implementation depends on how the create agent feature is triggered
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for proper ARIA labels on interactive elements
    await expect(page.locator('button[aria-label]')).toHaveCount({ min: 1 });

    // Form elements should have proper labels
    await expect(page.locator('textarea[aria-label]')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test keyboard navigation
    await page.keyboard.press('Tab');

    // Should be able to navigate to focusable elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'TEXTAREA', 'INPUT'].includes(focusedElement!)).toBe(true);
  });
});