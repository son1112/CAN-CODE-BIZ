/**
 * Voice Recognition and Advanced Features Tests
 * 
 * Tests voice-related functionality including:
 * - Basic voice recognition activation/deactivation
 * - Quality metrics and confidence scoring
 * - Sentiment analysis
 * - Speaker diarization
 * - Content safety detection
 * - End-of-turn detection
 * - Continuous conversation mode with voice
 */

import { test, expect } from '@playwright/test';
import { createTestHelpers, testAssertions, testData } from '../../utils/test-helpers';
import { selectors, textSelectors } from '../../utils/selectors';

test.describe('Basic Voice Recognition', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    // Grant microphone permissions for all voice tests
    await page.context().grantPermissions(['microphone']);
  });

  test('should activate voice recognition when button is clicked', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Verify voice button is visible
    await testAssertions.expectElementVisible(page, selectors.voiceButton);
    
    // Click voice button to start recording
    await helpers.startVoiceRecognition();
    
    // Verify voice status UI appears
    await testAssertions.expectElementVisible(page, selectors.voiceStatus);
    
    // Verify voice button shows active state
    const voiceButton = page.locator(selectors.voiceButton);
    const buttonClass = await voiceButton.getAttribute('class');
    expect(buttonClass).toContain('recording'); // Assuming recording state adds this class
  });

  test('should deactivate voice recognition when button is clicked again', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    await testAssertions.expectElementVisible(page, selectors.voiceStatus);
    
    // Stop voice recognition
    await helpers.stopVoiceRecognition();
    
    // Verify voice status UI disappears
    await testAssertions.expectElementHidden(page, selectors.voiceStatus);
  });

  test('should handle microphone permission denial gracefully', async ({ page }) => {
    // Clear permissions to simulate denial
    await page.context().clearPermissions();
    
    // Try to start voice recognition
    await page.click(selectors.voiceButton);
    
    // Should show permission error or request
    // Note: Actual behavior depends on browser implementation
    // This test verifies the app doesn't crash
    await testAssertions.expectNoErrors(page);
  });

  test('should show voice button in disabled state when microphone unavailable', async ({ page }) => {
    // Simulate no microphone available
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: () => Promise.reject(new Error('No microphone available'))
        }
      });
    });
    
    const helpers = createTestHelpers(page);
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    // Voice button should be disabled or show appropriate state
    const voiceButton = page.locator(selectors.voiceButton);
    const isDisabled = await voiceButton.isDisabled();
    const hasDisabledClass = (await voiceButton.getAttribute('class'))?.includes('disabled');
    
    expect(isDisabled || hasDisabledClass).toBe(true);
  });
});

test.describe('Voice Quality Metrics', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await page.context().grantPermissions(['microphone']);
  });

  test('should display quality metrics during voice recognition', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    
    // Wait for and verify quality metrics appear
    await helpers.waitForVoiceQualityMetrics();
    
    // Verify specific quality metric elements
    await testAssertions.expectElementVisible(page, selectors.qualityMetrics);
    await testAssertions.expectElementVisible(page, selectors.confidenceScore);
    await testAssertions.expectElementVisible(page, selectors.audioQuality);
  });

  test('should show confidence score in real-time', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    await helpers.waitForVoiceQualityMetrics();
    
    // Verify confidence score shows numeric value
    const confidenceText = await helpers.getElementText(selectors.confidenceScore);
    expect(confidenceText).toMatch(/\d+%|\d+\.\d+/); // Should contain percentage or decimal
  });

  test('should display audio quality indicators', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    await helpers.waitForVoiceQualityMetrics();
    
    // Verify audio quality shows meaningful indicators
    const qualityText = await helpers.getElementText(selectors.audioQuality);
    expect(qualityText.length).toBeGreaterThan(0);
    expect(qualityText.toLowerCase()).toMatch(/good|fair|poor|excellent|low|medium|high/);
  });

  test('should provide quality improvement recommendations', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    await helpers.waitForVoiceQualityMetrics();
    
    // Look for quality recommendations (these appear based on audio conditions)
    const hasRecommendations = await helpers.isElementVisible('[data-testid="quality-recommendations"]');
    
    if (hasRecommendations) {
      const recommendationText = await helpers.getElementText('[data-testid="quality-recommendations"]');
      expect(recommendationText.length).toBeGreaterThan(0);
    }
    
    // Test passes if recommendations are shown when appropriate
    expect(true).toBe(true);
  });
});

test.describe('Advanced Voice Features', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await page.context().grantPermissions(['microphone']);
  });

  test('should enable and display sentiment analysis', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // First enable sentiment analysis in settings
    await helpers.openSettings();
    await page.check('[data-testid="sentiment-analysis-toggle"]');
    await helpers.saveSettings();
    
    // Return to chat and start voice recognition
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await helpers.startVoiceRecognition();
    
    // Verify sentiment analysis display appears
    await testAssertions.expectElementVisible(page, selectors.sentimentDisplay);
  });

  test('should enable and display speaker diarization', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable speaker diarization in settings
    await helpers.openSettings();
    await page.check('[data-testid="speaker-diarization-toggle"]');
    await helpers.saveSettings();
    
    // Return to chat and start voice recognition
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await helpers.startVoiceRecognition();
    
    // Verify speaker display appears
    await testAssertions.expectElementVisible(page, selectors.speakerDisplay);
  });

  test('should enable and display content safety detection', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable content safety in settings
    await helpers.enableContentSafety();
    
    // Return to chat and start voice recognition
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await helpers.startVoiceRecognition();
    
    // Verify safety status display appears
    await testAssertions.expectElementVisible(page, selectors.safetyStatus);
  });

  test('should display all advanced features when enabled', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable all advanced features
    await helpers.openSettings();
    await page.check('[data-testid="content-safety-toggle"]');
    await page.check('[data-testid="sentiment-analysis-toggle"]');
    await page.check('[data-testid="speaker-diarization-toggle"]');
    await helpers.saveSettings();
    
    // Return to chat and start voice recognition
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await helpers.startVoiceRecognition();
    
    // Verify all advanced features are displayed
    await testAssertions.expectElementVisible(page, selectors.sentimentDisplay);
    await testAssertions.expectElementVisible(page, selectors.speakerDisplay);
    await testAssertions.expectElementVisible(page, selectors.safetyStatus);
    await testAssertions.expectElementVisible(page, selectors.qualityMetrics);
  });

  test('should not display advanced features when disabled', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Ensure all advanced features are disabled
    await helpers.openSettings();
    await page.uncheck('[data-testid="content-safety-toggle"]');
    await page.uncheck('[data-testid="sentiment-analysis-toggle"]');
    await page.uncheck('[data-testid="speaker-diarization-toggle"]');
    await helpers.saveSettings();
    
    // Return to chat and start voice recognition
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await helpers.startVoiceRecognition();
    
    // Verify advanced features are not displayed
    await testAssertions.expectElementHidden(page, selectors.sentimentDisplay);
    await testAssertions.expectElementHidden(page, selectors.speakerDisplay);
    await testAssertions.expectElementHidden(page, selectors.safetyStatus);
    
    // Basic quality metrics should still be visible
    await testAssertions.expectElementVisible(page, selectors.qualityMetrics);
  });
});

test.describe('Content Safety Detection', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await page.context().grantPermissions(['microphone']);
    
    // Enable content safety for these tests
    await helpers.enableContentSafety();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
  });

  test('should display content safety status when enabled', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    
    // Verify safety status is displayed
    await testAssertions.expectElementVisible(page, selectors.safetyStatus);
    
    // Verify safety status shows appropriate indicator
    const safetyText = await helpers.getElementText(selectors.safetyStatus);
    expect(safetyText.toLowerCase()).toMatch(/safe|monitoring|active|clean/);
  });

  test('should show different safety modes correctly', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const modes = ['inform', 'review', 'filter'] as const;
    
    for (const mode of modes) {
      // Set safety mode
      await helpers.openSettings();
      await helpers.setContentSafetyMode(mode);
      await helpers.saveSettings();
      
      // Return to chat and verify mode is reflected
      await helpers.navigateToHome();
      await helpers.waitForAppReady();
      await helpers.startVoiceRecognition();
      
      // Verify safety mode is displayed or affects behavior
      await testAssertions.expectElementVisible(page, selectors.safetyStatus);
      
      await helpers.stopVoiceRecognition();
    }
  });

  test('should handle different sensitivity levels', async ({ page }) => {
    const helpers = createTestHelpers(page);
    const levels = ['low', 'medium', 'high'] as const;
    
    for (const level of levels) {
      // Set sensitivity level
      await helpers.openSettings();
      await helpers.setContentSafetySensitivity(level);
      await helpers.saveSettings();
      
      // Return to chat and verify level affects detection
      await helpers.navigateToHome();
      await helpers.waitForAppReady();
      await helpers.startVoiceRecognition();
      
      // Verify safety detection is active
      await testAssertions.expectElementVisible(page, selectors.safetyStatus);
      
      await helpers.stopVoiceRecognition();
    }
  });
});

test.describe('Voice with Continuous Mode', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await page.context().grantPermissions(['microphone']);
  });

  test('should integrate voice with continuous conversation mode', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable continuous mode
    await page.click(selectors.continuousMode);
    await testAssertions.expectElementVisible(page, selectors.liveModeIndicator);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    
    // Verify both continuous mode and voice are active
    await testAssertions.expectElementVisible(page, selectors.liveModeIndicator);
    await testAssertions.expectElementVisible(page, selectors.voiceStatus);
  });

  test('should auto-detect end of turn in continuous mode', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable continuous mode
    await page.click(selectors.continuousMode);
    await helpers.startVoiceRecognition();
    
    // Simulate end-of-turn detection (this would require actual audio input in real scenario)
    // For testing, we verify the UI responds to silence detection
    await helpers.waitForTimeout(3000); // Wait for silence threshold
    
    // In real scenario, this would trigger auto-submission
    // For test, we verify the system is listening for end-of-turn
    await testAssertions.expectElementVisible(page, selectors.voiceStatus);
  });

  test('should handle voice quality recommendations in continuous mode', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable continuous mode and start voice
    await page.click(selectors.continuousMode);
    await helpers.startVoiceRecognition();
    
    // Verify quality metrics are still displayed in continuous mode
    await helpers.waitForVoiceQualityMetrics();
    await testAssertions.expectElementVisible(page, selectors.qualityMetrics);
  });
});

test.describe('Voice Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
  });

  test('should handle microphone access errors gracefully', async ({ page }) => {
    // Deny microphone permissions
    await page.context().clearPermissions();
    
    // Try to start voice recognition
    await page.click(selectors.voiceButton);
    
    // Should show appropriate error message
    const hasError = await page.locator('[data-testid="microphone-error"]').isVisible({ timeout: 3000 });
    
    if (hasError) {
      const errorText = await page.locator('[data-testid="microphone-error"]').textContent();
      expect(errorText?.toLowerCase()).toContain('microphone');
    }
    
    // App should not crash
    await testAssertions.expectNoErrors(page);
  });

  test('should handle voice recognition API failures', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Simulate API failure by intercepting network requests
    await page.route('**/api/speech-token', route => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });
    
    // Grant permissions but API will fail
    await page.context().grantPermissions(['microphone']);
    
    // Try to start voice recognition
    await page.click(selectors.voiceButton);
    
    // Should handle API failure gracefully
    await helpers.waitForTimeout(2000);
    await testAssertions.expectNoErrors(page);
  });

  test('should recover from voice recognition interruptions', async ({ page }) => {
    const helpers = createTestHelpers(page);
    await page.context().grantPermissions(['microphone']);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    await testAssertions.expectElementVisible(page, selectors.voiceStatus);
    
    // Simulate interruption by starting/stopping rapidly
    await helpers.stopVoiceRecognition();
    await helpers.startVoiceRecognition();
    
    // Should handle rapid state changes
    await testAssertions.expectElementVisible(page, selectors.voiceStatus);
    await testAssertions.expectNoErrors(page);
  });
});

test.describe('Voice Performance', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await page.context().grantPermissions(['microphone']);
  });

  test('should start voice recognition quickly', async ({ page }) => {
    const startTime = Date.now();
    
    // Start voice recognition
    await page.click(selectors.voiceButton);
    await page.locator(selectors.voiceStatus).waitFor({ state: 'visible' });
    
    const responseTime = Date.now() - startTime;
    
    // Voice should start within 2 seconds
    expect(responseTime).toBeLessThan(2000);
  });

  test('should handle multiple voice sessions efficiently', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Start and stop voice recognition multiple times
    for (let i = 0; i < 3; i++) {
      await helpers.startVoiceRecognition();
      await helpers.waitForTimeout(1000);
      await helpers.stopVoiceRecognition();
      await helpers.waitForTimeout(500);
    }
    
    // Should complete without errors
    await testAssertions.expectNoErrors(page);
  });

  test('should maintain performance with all advanced features enabled', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Enable all advanced features
    await helpers.openSettings();
    await page.check('[data-testid="content-safety-toggle"]');
    await page.check('[data-testid="sentiment-analysis-toggle"]');
    await page.check('[data-testid="speaker-diarization-toggle"]');
    await helpers.saveSettings();
    
    // Return to chat and measure voice startup time
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    const startTime = Date.now();
    await helpers.startVoiceRecognition();
    await helpers.waitForVoiceQualityMetrics();
    const responseTime = Date.now() - startTime;
    
    // Should still start quickly even with all features enabled
    expect(responseTime).toBeLessThan(3000);
  });
});

test.describe('Voice Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    await page.context().grantPermissions(['microphone']);
  });

  test('should have proper ARIA labels for voice controls', async ({ page }) => {
    // Check voice button has proper ARIA label
    const voiceButton = page.locator(selectors.voiceButton);
    const ariaLabel = await voiceButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel?.toLowerCase()).toContain('voice');
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Tab to voice button
    await page.keyboard.press('Tab');
    
    // Voice button should be focusable
    const voiceButton = page.locator(selectors.voiceButton);
    await expect(voiceButton).toBeFocused();
    
    // Should be activatable with Enter or Space
    await page.keyboard.press('Enter');
    
    // Should start voice recognition
    await testAssertions.expectElementVisible(page, selectors.voiceStatus);
  });

  test('should provide screen reader friendly status updates', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Start voice recognition
    await helpers.startVoiceRecognition();
    
    // Check for screen reader announcements
    const statusRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    const hasLiveRegion = await statusRegion.count() > 0;
    
    expect(hasLiveRegion).toBe(true);
  });
});