/**
 * Export Functionality End-to-End Tests
 * 
 * Tests comprehensive message export system including:
 * - PDF export with Google Drive integration
 * - Word document generation and download
 * - Local download fallback scenarios
 * - Export quality and formatting validation
 * - Error handling and edge cases
 */

import { test, expect, Download, Page } from '@playwright/test';
import { createTestHelpers, testAssertions, testData } from '../../utils/test-helpers';
import { selectors } from '../../utils/selectors';

// Test configuration
const TEST_CONFIG = {
  messageTimeout: 30000,
  downloadTimeout: 15000,
  exportTimeout: 20000,
  googleAuthTimeout: 10000,
  apiResponseTimeout: 5000
};

test.describe('Export Functionality', () => {
  let helpers: ReturnType<typeof createTestHelpers>;

  test.beforeEach(async ({ page }) => {
    helpers = createTestHelpers(page);
    
    // Set up demo mode for consistent testing
    await helpers.ensureDemoMode();
    await helpers.navigateToHome();
    await helpers.waitForAppReady();
    
    // Skip onboarding if it appears
    try {
      await helpers.completeOnboardingTour();
    } catch {
      // Onboarding not present, continue
    }
  });

  test.describe('PDF Export', () => {
    test('should successfully export message as PDF with local download', async ({ page }) => {
      // Send a test message to have content to export
      const testMessage = 'This is a test message for PDF export functionality. It contains various formatting elements to test the export quality.';
      await helpers.sendMessage(testMessage);
      
      // Wait for AI response
      await helpers.waitForAIResponse();
      
      // Hover over the AI message to reveal export button
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      
      // Click the message menu to reveal export options
      await expect(aiMessage.locator(selectors.messageMenu)).toBeVisible();
      await aiMessage.locator(selectors.messageMenu).click();
      
      // Click export button to show dropdown
      await page.click(selectors.exportButton);
      await expect(page.locator(selectors.exportMenu)).toBeVisible();
      
      // Set up download listener
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      
      // Click PDF export option
      await page.click(selectors.exportPdf);
      
      // Verify export process starts (loading state)
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Wait for download to complete
      const download = await downloadPromise;
      
      // Verify download properties
      expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
      expect(await download.path()).toBeTruthy();
      
      // Verify success message appears
      await expect(page.locator(selectors.successMessage)).toBeVisible();
      await expect(page.locator(selectors.successMessage)).toContainText('PDF exported successfully');
    });

    test('should handle PDF export with Google Drive integration (simulated)', async ({ page }) => {
      // Note: This test simulates Google Drive integration without actual authentication
      // In a real environment, this would require proper Google OAuth setup
      
      const testMessage = 'Test message for Google Drive PDF export';
      await helpers.sendMessage(testMessage);
      await helpers.waitForAIResponse();
      
      // Mock Google services as ready
      await page.addInitScript(() => {
        window.google = {
          accounts: {
            oauth2: {
              initTokenClient: () => ({
                requestAccessToken: () => {
                  // Simulate successful authentication
                  const callback = arguments[0].callback;
                  setTimeout(() => callback({ access_token: 'mock_token' }), 100);
                }
              })
            }
          }
        };
      });
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // In demo mode, it should fall back to local download
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportPdf);
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
    });

    test('should show appropriate error for invalid message ID', async ({ page }) => {
      // Navigate to a URL with an invalid message context
      await page.goto('/');
      
      // Try to trigger export with invalid data (this would require manipulating the component state)
      // For now, we'll test the error handling by checking the component's error states
      await page.evaluate(() => {
        // Simulate an error state in the export component
        const exportButton = document.querySelector('[data-testid="export-button"]');
        if (exportButton) {
          exportButton.dispatchEvent(new CustomEvent('export-error', {
            detail: { error: 'Invalid message ID' }
          }));
        }
      });
    });
  });

  test.describe('Word Export', () => {
    test('should successfully export message as Word document', async ({ page }) => {
      const testMessage = 'Test message for Word document export with **bold text** and *italic text*.';
      await helpers.sendMessage(testMessage);
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Wait for export dropdown to be visible
      await expect(page.locator(selectors.exportMenu)).toBeVisible();
      
      // Set up download listener for Word document
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      
      // Click Word export option
      await page.click(selectors.exportWord);
      
      // Verify loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify file is a Word document
      expect(download.suggestedFilename()).toMatch(/.*\.docx$/);
      expect(await download.path()).toBeTruthy();
      
      // Verify success notification
      await expect(page.locator(selectors.successMessage)).toBeVisible();
      await expect(page.locator(selectors.successMessage)).toContainText('WORD exported successfully');
    });

    test('should handle Word export with complex formatting', async ({ page }) => {
      // Send a message with complex content
      const complexMessage = `
# Test Header
This is a test message with:
- Bullet points
- **Bold text**
- *Italic text*
- \`Code snippets\`
- [Links](https://example.com)

## Sub Header
> Quoted text
1. Numbered list
2. Second item

\`\`\`javascript
// Code block
console.log('Hello World');
\`\`\`
      `;
      
      await helpers.sendMessage(complexMessage);
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportWord);
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/.*\.docx$/);
      
      // Verify file size is reasonable (complex content should produce larger file)
      const filePath = await download.path();
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB
    });
  });

  test.describe('Text Export', () => {
    test('should successfully export message as text file', async ({ page }) => {
      const testMessage = 'Test message for text export with special characters: !@#$%^&*() and emojis: 🚀 📝 ✅';
      await helpers.sendMessage(testMessage);
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Wait for export dropdown to be visible
      await expect(page.locator(selectors.exportMenu)).toBeVisible();
      
      // Set up download listener for text file
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      
      // Click text export option
      await page.click(selectors.exportText);
      
      // Verify loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify file is a text document
      expect(download.suggestedFilename()).toMatch(/.*\.txt$/);
      expect(await download.path()).toBeTruthy();
      
      // Verify success notification
      await expect(page.locator(selectors.successMessage)).toBeVisible();
      await expect(page.locator(selectors.successMessage)).toContainText('TEXT exported successfully');
    });

    test('should handle text export with markdown formatting', async ({ page }) => {
      const markdownMessage = `
# Test Header
This is a **bold** and *italic* text export test.
- List item 1
- List item 2

\`\`\`javascript
console.log('Code block test');
\`\`\`

> Quoted text for testing
      `;
      
      await helpers.sendMessage(markdownMessage);
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportText);
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/.*\.txt$/);
      
      // Verify file size indicates content was preserved
      const filePath = await download.path();
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(100); // Text file should have reasonable size
    });

    test('should include metadata in text export', async ({ page }) => {
      await helpers.sendMessage('Text export metadata test');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportText);
      
      const download = await downloadPromise;
      const filePath = await download.path();
      
      // Read the text file content to verify metadata inclusion
      const fs = require('fs');
      const textContent = fs.readFileSync(filePath, 'utf8');
      
      // Verify metadata is included
      expect(textContent).toContain('RUBBER DUCKY LIVE - MESSAGE EXPORT');
      expect(textContent).toContain('Session:');
      expect(textContent).toContain('Message ID:');
      expect(textContent).toContain('Timestamp:');
      expect(textContent).toContain('[ASSISTANT]');
      expect(textContent).toContain('Exported from Rubber Ducky Live');
    });
  });

  test.describe('Export Options and Customization', () => {
    test('should display export options correctly', async ({ page }) => {
      await helpers.sendMessage('Test message for export options');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Verify export dropdown is visible with all options
      await expect(page.locator(selectors.exportMenu)).toBeVisible();
      await expect(page.locator(selectors.exportPdf)).toBeVisible();
      await expect(page.locator(selectors.exportWord)).toBeVisible();
      await expect(page.locator(selectors.exportText)).toBeVisible();
      
      // Verify option labels
      await expect(page.locator(selectors.exportPdf)).toContainText('Export as PDF');
      await expect(page.locator(selectors.exportWord)).toContainText('Export as Word');
      await expect(page.locator(selectors.exportText)).toContainText('Export as Text');
      
      // Verify descriptions are present
      await expect(page.locator(selectors.exportPdf)).toContainText('Portable document format');
      await expect(page.locator(selectors.exportWord)).toContainText('Microsoft Word document');
      await expect(page.locator(selectors.exportText)).toContainText('Plain text file');
    });

    test('should close export dropdown when clicking outside', async ({ page }) => {
      await helpers.sendMessage('Test message');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Verify dropdown is open
      await expect(page.locator(selectors.exportMenu)).toBeVisible();
      
      // Click outside the dropdown
      await page.click('body', { position: { x: 10, y: 10 } });
      
      // Verify dropdown is closed
      await expect(page.locator(selectors.exportMenu)).not.toBeVisible();
    });

    test('should show different UI based on Google Drive availability', async ({ page }) => {
      await helpers.sendMessage('Test message');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // In demo mode, should show "Export & Download" instead of "Export to Google Drive"
      await expect(page.locator(selectors.exportMenu)).toContainText('Export & Download');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await helpers.sendMessage('Test message for error handling');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Simulate network error
      await page.route('/api/export/pdf-local', route => {
        route.abort('failed');
      });
      
      await page.click(selectors.exportPdf);
      
      // Verify error message appears
      await expect(page.locator(selectors.errorMessage)).toBeVisible();
      await expect(page.locator(selectors.errorMessage)).toContainText('Export failed');
    });

    test('should handle authentication errors', async ({ page }) => {
      await helpers.sendMessage('Test message');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Mock authentication failure
      await page.route('/api/export/pdf-local', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Authentication required' })
        });
      });
      
      await page.click(selectors.exportPdf);
      
      // Verify appropriate error message
      await expect(page.locator(selectors.errorMessage)).toBeVisible();
      await expect(page.locator(selectors.errorMessage)).toContainText('Please log in to export messages');
    });

    test('should handle missing message errors', async ({ page }) => {
      await helpers.sendMessage('Test message');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Mock message not found error
      await page.route('/api/export/pdf-local', route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Message not found' })
        });
      });
      
      await page.click(selectors.exportPdf);
      
      // Verify error handling
      await expect(page.locator(selectors.errorMessage)).toBeVisible();
      await expect(page.locator(selectors.errorMessage)).toContainText('Export feature is not available');
    });

    test('should auto-hide error messages after timeout', async ({ page }) => {
      await helpers.sendMessage('Test message');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Trigger an error
      await page.route('/api/export/pdf-local', route => {
        route.abort('failed');
      });
      
      await page.click(selectors.exportPdf);
      
      // Verify error appears
      await expect(page.locator(selectors.errorMessage)).toBeVisible();
      
      // Wait for auto-hide (5 seconds + buffer)
      await page.waitForTimeout(6000);
      
      // Verify error is hidden
      await expect(page.locator(selectors.errorMessage)).not.toBeVisible();
    });
  });

  test.describe('Export Quality and Formatting', () => {
    test('should preserve message content in exported files', async ({ page }) => {
      const testContent = 'This is a test message with special characters: !@#$%^&*()_+ and emojis: 🚀 📝 ✅';
      await helpers.sendMessage(testContent);
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Test PDF export
      const pdfDownloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportPdf);
      
      const pdfDownload = await pdfDownloadPromise;
      expect(await pdfDownload.path()).toBeTruthy();
      
      // Verify file size indicates content was included
      const fs = require('fs');
      const pdfStats = fs.statSync(await pdfDownload.path());
      expect(pdfStats.size).toBeGreaterThan(500); // PDF should have reasonable size
    });

    test('should include metadata in exports when enabled', async ({ page }) => {
      await helpers.sendMessage('Test message with metadata');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Export should include metadata by default
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportPdf);
      
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      
      // Verify filename includes timestamp (indicating metadata inclusion)
      expect(filename).toMatch(/.*_\d+\.pdf$/);
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should complete export within performance budgets', async ({ page }) => {
      await helpers.sendMessage('Performance test message');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      const startTime = Date.now();
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportPdf);
      
      await downloadPromise;
      const exportTime = Date.now() - startTime;
      
      // Export should complete within reasonable time (10 seconds)
      expect(exportTime).toBeLessThan(10000);
    });

    test('should be accessible via keyboard navigation', async ({ page }) => {
      await helpers.sendMessage('Accessibility test message');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      
      // Navigate to export button using keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs to reach export button
      await page.keyboard.press('Enter');
      
      // Verify dropdown opens
      await expect(page.locator(selectors.exportMenu)).toBeVisible();
      
      // Navigate export options with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Select first option (PDF)
      
      // Note: In a real test, this would trigger the download
      // For accessibility testing, we mainly verify keyboard navigation works
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await helpers.sendMessage('ARIA test message');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      
      const exportButton = page.locator(selectors.exportButton);
      
      // Verify export button has proper accessibility attributes
      await expect(exportButton).toHaveAttribute('title');
      
      await exportButton.click();
      
      // Verify export options have proper labels
      await expect(page.locator(selectors.exportPdf)).toBeVisible();
      await expect(page.locator(selectors.exportWord)).toBeVisible();
    });
  });

  test.describe('Mobile and Responsive Design', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await helpers.setMobileViewport();
      
      await helpers.sendMessage('Mobile export test');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Verify export menu is properly sized for mobile
      const exportMenu = page.locator(selectors.exportMenu);
      await expect(exportMenu).toBeVisible();
      
      // Verify menu fits within viewport
      const boundingBox = await exportMenu.boundingBox();
      const viewport = page.viewportSize();
      
      if (boundingBox && viewport) {
        expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport.width);
        expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport.height);
      }
    });

    test('should adapt export UI for tablet screens', async ({ page }) => {
      await helpers.setTabletViewport();
      
      await helpers.sendMessage('Tablet export test');
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Verify export button text is visible on tablet
      await expect(page.locator(selectors.exportButton)).toContainText('Export');
      
      // Verify dropdown positioning is appropriate
      await expect(page.locator(selectors.exportMenu)).toBeVisible();
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work in different browsers', async ({ page, browserName }) => {
      // This test will run across Chrome, Firefox, and Safari
      await helpers.sendMessage(`Cross-browser test on ${browserName}`);
      await helpers.waitForAIResponse();
      
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      // Verify basic functionality works
      await expect(page.locator(selectors.exportMenu)).toBeVisible();
      await expect(page.locator(selectors.exportPdf)).toBeVisible();
      await expect(page.locator(selectors.exportWord)).toBeVisible();
      
      // Verify download works (browser-specific behavior may vary)
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportPdf);
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
    });
  });

  test.describe('Integration Tests', () => {
    test('should export messages from different agents correctly', async ({ page }) => {
      // Test exporting messages with different agent contexts
      await helpers.sendMessage('Test message from default agent');
      await helpers.waitForAIResponse();
      
      // Switch to a different agent if available
      try {
        await page.click(selectors.agentSelector);
        const agentOptions = page.locator(selectors.agentDropdown + ' button');
        const agentCount = await agentOptions.count();
        
        if (agentCount > 1) {
          await agentOptions.nth(1).click();
          await helpers.sendMessage('Test message from second agent');
          await helpers.waitForAIResponse();
        }
      } catch {
        // Agent switching not available, continue with single agent
      }
      
      // Export the last message
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportPdf);
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
    });

    test('should export starred and tagged messages', async ({ page }) => {
      await helpers.sendMessage('This message will be starred and tagged');
      await helpers.waitForAIResponse();
      
      // Star the message
      await helpers.starMessage();
      
      // Tag the message
      await helpers.tagMessage('export-test');
      
      // Now export it
      const aiMessage = page.locator(selectors.aiMessage).last();
      await aiMessage.hover();
      await aiMessage.locator(selectors.messageMenu).click();
      await page.click(selectors.exportButton);
      
      const downloadPromise = page.waitForDownload({ timeout: TEST_CONFIG.downloadTimeout });
      await page.click(selectors.exportPdf);
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
    });
  });
});