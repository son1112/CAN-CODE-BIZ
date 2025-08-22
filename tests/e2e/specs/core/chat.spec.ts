/**
 * Core Chat Functionality Tests
 * 
 * Tests the fundamental chat features including:
 * - Basic message sending and receiving
 * - AI response streaming
 * - Message management (star, tag, copy)
 * - Session handling
 * - Agent selection
 * - Continuous conversation mode
 */

import { test, expect } from '@playwright/test';
import { createTestHelpers, testAssertions, testData } from '../../utils/test-helpers';
import { selectors, textSelectors } from '../../utils/selectors';

test.describe('Core Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
  });

  test('should display main chat interface correctly', async ({ page }) => {
    // Verify main interface elements
    await testAssertions.expectElementVisible(page, selectors.chatInterface);
    await testAssertions.expectElementVisible(page, selectors.messageInput);
    await testAssertions.expectElementVisible(page, selectors.sendButton);
    await testAssertions.expectElementVisible(page, selectors.voiceButton);
    
    // Verify branding
    await testAssertions.expectElementText(page, 'body', textSelectors.appTitle);
    
    // Verify agent selector
    await testAssertions.expectElementVisible(page, selectors.agentSelector);
  });

  test('should send and receive messages correctly', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const testMessage = testData.generateMessage();
    
    // Send a message
    await helpers.sendMessage(testMessage, true);
    
    // Verify user message appears
    await testAssertions.expectElementText(page, selectors.userMessage + ':last-child', testMessage);
    
    // Verify AI response appears
    await testAssertions.expectElementVisible(page, selectors.aiMessage + ':last-child');
    const aiResponse = await helpers.getElementText(selectors.aiMessage + ':last-child');
    expect(aiResponse.length).toBeGreaterThan(0);
  });

  test('should handle multiple messages in conversation', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const messages = testData.sampleMessages.slice(0, 3);
    
    // Send multiple messages
    for (const message of messages) {
      await helpers.sendMessage(message, true);
      await helpers.waitForTimeout(1000); // Small delay between messages
    }
    
    // Verify all messages are present
    await testAssertions.expectUserMessageCount(page, messages.length);
    await testAssertions.expectMessageCount(page, messages.length);
    
    // Verify conversation flow
    for (let i = 0; i < messages.length; i++) {
      const userMessage = page.locator(selectors.userMessage).nth(i);
      await expect(userMessage).toContainText(messages[i]);
    }
  });

  test('should send messages using Enter key', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const testMessage = testData.generateMessage();
    
    // Send message with Enter
    await helpers.sendMessageWithEnter(testMessage, true);
    
    // Verify message sent and response received
    await testAssertions.expectElementText(page, selectors.userMessage + ':last-child', testMessage);
    await testAssertions.expectElementVisible(page, selectors.aiMessage + ':last-child');
  });

  test('should show thinking indicator during AI processing', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const testMessage = testData.generateMessage();
    
    // Send message
    const messageInput = page.locator(selectors.messageInput);
    await messageInput.fill(testMessage);
    await page.click(selectors.sendButton);
    
    // Verify thinking indicator appears
    await testAssertions.expectElementVisible(page, selectors.thinkingIndicator);
    
    // Wait for response and verify thinking indicator disappears
    await helpers.waitForAIResponse();
    await testAssertions.expectElementHidden(page, selectors.thinkingIndicator);
  });

  test('should handle empty message gracefully', async ({ page }) => {
    // Try to send empty message
    await page.click(selectors.sendButton);
    
    // Verify no message is sent
    await testAssertions.expectUserMessageCount(page, 0);
    await testAssertions.expectMessageCount(page, 0);
    
    // Verify input field is focused
    await expect(page.locator(selectors.messageInput)).toBeFocused();
  });

  test('should handle very long messages', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const longMessage = 'A'.repeat(1000); // 1000 character message
    
    await helpers.sendMessage(longMessage, true);
    
    // Verify long message is handled correctly
    await testAssertions.expectElementText(page, selectors.userMessage + ':last-child', longMessage);
    await testAssertions.expectElementVisible(page, selectors.aiMessage + ':last-child');
  });
});

test.describe('Message Management Features', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    // Send a test message to have something to manage
    await helpers.sendMessage(testData.sampleMessages[0], true);
  });

  test('should star and unstar messages', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Star the message
    await helpers.starMessage();
    
    // Verify message is starred
    const starButton = page.locator(selectors.aiMessage).last().locator(selectors.starButton);
    await expect(starButton).toHaveAttribute('data-starred', 'true');
    
    // Unstar the message
    await helpers.unstarMessage();
    
    // Verify message is unstarred
    await expect(starButton).not.toHaveAttribute('data-starred', 'true');
  });

  test('should add tags to messages', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const testTag = testData.generateTag();
    
    // Add tag to message
    await helpers.tagMessage(testTag);
    
    // Verify tag appears
    const messageContainer = page.locator(selectors.aiMessage).last();
    await expect(messageContainer.locator(selectors.messageTag).filter({ hasText: testTag })).toBeVisible();
  });

  test('should add multiple tags to single message', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const tags = testData.sampleTags.slice(0, 3);
    
    // Add multiple tags
    for (const tag of tags) {
      await helpers.tagMessage(tag);
      await helpers.waitForTimeout(500); // Small delay between tags
    }
    
    // Verify all tags appear
    const messageContainer = page.locator(selectors.aiMessage).last();
    for (const tag of tags) {
      await expect(messageContainer.locator(selectors.messageTag).filter({ hasText: tag })).toBeVisible();
    }
  });

  test('should copy message content', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Copy message
    await helpers.copyMessage();
    
    // Verify copy button shows feedback
    const copyButton = page.locator(selectors.aiMessage).last().locator(selectors.copyButton);
    await expect(copyButton).toHaveAttribute('data-copied', 'true');
    
    // Note: Actual clipboard testing requires browser permissions
    // and specific CI setup, so we're just testing the UI feedback
  });

  test('should retry failed messages', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Simulate network error
    await helpers.simulateNetworkError();
    
    // Try to send a message (should fail)
    const testMessage = testData.generateMessage();
    await helpers.sendMessage(testMessage, false);
    
    // Verify error state
    await helpers.waitForErrorMessage();
    
    // Restore network and retry
    await helpers.restoreNetwork();
    await helpers.retryFailedAction();
    
    // Verify message is sent successfully
    await helpers.waitForAIResponse();
    await testAssertions.expectElementVisible(page, selectors.aiMessage + ':last-child');
  });
});

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
  });

  test('should create new session', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Send a message in current session
    await helpers.sendMessage(testData.sampleMessages[0], true);
    await testAssertions.expectMessageCount(page, 1);
    
    // Create new session
    await helpers.createNewSession();
    
    // Verify new session is empty
    await testAssertions.expectMessageCount(page, 0);
    await testAssertions.expectUserMessageCount(page, 0);
  });

  test('should open session history browser', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Open session history
    await helpers.openSessionHistory();
    
    // Verify session browser opens
    await testAssertions.expectElementVisible(page, selectors.sessionBrowser);
    
    // Close session browser
    await page.click(selectors.modalClose);
    await testAssertions.expectElementHidden(page, selectors.sessionBrowser);
  });

  test('should open starred items browser', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // First create and star a message
    await helpers.sendMessage(testData.sampleMessages[0], true);
    await helpers.starMessage();
    
    // Open starred items browser
    await helpers.openStarredItems();
    
    // Verify stars browser opens
    await testAssertions.expectElementVisible(page, selectors.starsBrowser);
  });
});

test.describe('Agent Selection', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
  });

  test('should display agent selector', async ({ page }) => {
    // Verify agent selector is visible
    await testAssertions.expectElementVisible(page, selectors.agentSelector);
    
    // Verify it shows an agent name or loading state
    const agentText = await page.locator(selectors.agentSelector).textContent();
    expect(agentText).toMatch(/Power Agent|Loading|Agent/);
  });

  test('should open agent dropdown when clicked', async ({ page }) => {
    // Click agent selector
    await page.click(selectors.agentSelector);
    
    // Verify dropdown appears
    await testAssertions.expectElementVisible(page, selectors.agentDropdown);
    
    // Verify "Power Agents" text appears
    await testAssertions.expectElementText(page, 'body', textSelectors.powerAgents);
  });

  test('should close agent dropdown when clicking outside', async ({ page }) => {
    // Open dropdown
    await page.click(selectors.agentSelector);
    await testAssertions.expectElementVisible(page, selectors.agentDropdown);
    
    // Click outside dropdown
    await page.click(selectors.messageInput);
    
    // Verify dropdown closes
    await testAssertions.expectElementHidden(page, selectors.agentDropdown);
  });
});

test.describe('Continuous Conversation Mode', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
  });

  test('should toggle continuous conversation mode', async ({ page }) => {
    // Find and verify continuous mode button
    await testAssertions.expectElementVisible(page, selectors.continuousMode);
    
    // Enable continuous mode
    await page.click(selectors.continuousMode);
    
    // Verify live mode indicator appears
    await testAssertions.expectElementVisible(page, selectors.liveModeIndicator);
    await testAssertions.expectElementText(page, selectors.liveModeIndicator, textSelectors.liveMode);
    
    // Disable continuous mode
    await page.click(selectors.continuousMode);
    
    // Verify live mode indicator disappears
    await testAssertions.expectElementHidden(page, selectors.liveModeIndicator);
  });

  test('should show different UI when continuous mode is active', async ({ page }) => {
    // Enable continuous mode
    await page.click(selectors.continuousMode);
    
    // Verify UI changes
    await testAssertions.expectElementVisible(page, selectors.liveModeIndicator);
    
    // Verify voice button is highlighted or has different state
    const voiceButton = page.locator(selectors.voiceButton);
    const buttonClass = await voiceButton.getAttribute('class');
    expect(buttonClass).toContain('continuous'); // Assuming continuous mode adds this class
  });
});

test.describe('Responsive Design', () => {
  test('should work correctly on mobile viewport', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Set mobile viewport
    await helpers.setMobileViewport();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    // Verify mobile layout
    await helpers.verifyMobileLayout();
    
    // Test basic functionality on mobile
    await helpers.sendMessage(testData.sampleMessages[0], true);
    await testAssertions.expectElementVisible(page, selectors.aiMessage + ':last-child');
  });

  test('should work correctly on tablet viewport', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Set tablet viewport
    await helpers.setTabletViewport();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    // Test functionality on tablet
    await helpers.sendMessage(testData.sampleMessages[0], true);
    await testAssertions.expectElementVisible(page, selectors.aiMessage + ':last-child');
  });

  test('should work correctly on desktop viewport', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Set desktop viewport
    await helpers.setDesktopViewport();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    // Verify desktop layout
    await helpers.verifyDesktopLayout();
    
    // Test functionality on desktop
    await helpers.sendMessage(testData.sampleMessages[0], true);
    await testAssertions.expectElementVisible(page, selectors.aiMessage + ':last-child');
  });
});

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
  });

  test('should handle network failures gracefully', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Simulate network failure
    await helpers.simulateNetworkError();
    
    // Try to send message
    const testMessage = testData.generateMessage();
    await helpers.sendMessage(testMessage, false);
    
    // Verify error handling
    await helpers.waitForErrorMessage();
    await testAssertions.expectElementVisible(page, selectors.errorRetry);
    
    // Restore network and retry
    await helpers.restoreNetwork();
    await helpers.retryFailedAction();
    
    // Verify recovery
    await helpers.waitForAIResponse();
    await testAssertions.expectElementVisible(page, selectors.aiMessage + ':last-child');
  });

  test('should show appropriate error messages', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Simulate error condition
    await helpers.simulateNetworkError();
    await helpers.sendMessage(testData.generateMessage(), false);
    
    // Verify error message content
    await helpers.waitForErrorMessage();
    const errorText = await helpers.getElementText(selectors.errorMessage);
    expect(errorText.length).toBeGreaterThan(0);
    expect(errorText.toLowerCase()).toContain('error');
  });
});

test.describe('Performance', () => {
  test('should load chat interface within performance budget', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Measure page load time
    const loadTime = await helpers.measurePageLoadTime();
    
    // Verify performance budget (3 seconds)
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle rapid message sending', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    // Send multiple messages rapidly
    const messages = testData.sampleMessages.slice(0, 3);
    const promises = messages.map(message => 
      helpers.sendMessage(message, false)
    );
    
    await Promise.all(promises);
    
    // Verify all messages were sent
    await testAssertions.expectUserMessageCount(page, messages.length);
    
    // Wait for all responses
    for (let i = 0; i < messages.length; i++) {
      await expect(page.locator(selectors.aiMessage).nth(i)).toBeVisible({ timeout: 30000 });
    }
    
    await testAssertions.expectMessageCount(page, messages.length);
  });
});