# Comprehensive Playwright Testing Guide

## Overview

This document provides comprehensive testing specifications and guidelines for Rubber Ducky Live using Playwright. All tests should follow these specifications to ensure consistency, reliability, and maintainability.

## Testing Philosophy

- **User-Centric**: Tests should simulate real user interactions and workflows
- **Comprehensive Coverage**: Cover all major user flows and edge cases
- **Reliable**: Tests should be deterministic and not flaky
- **Maintainable**: Use clear selectors and well-documented test scenarios
- **Performance-Aware**: Include performance assertions where appropriate

## Test Environment Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or Docker container
- Environment variables configured in `.env.local`
- Development server running on `http://localhost:3000`

### Demo Mode Configuration
For consistent testing, use demo mode configuration:
```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running Tests
```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/chat.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug tests
npx playwright test --debug
```

## Test Structure and Organization

### Directory Structure
```
tests/e2e/
├── specs/
│   ├── core/
│   │   ├── chat.spec.ts           # Core chat functionality
│   │   ├── voice.spec.ts          # Voice recognition features
│   │   └── streaming.spec.ts      # AI response streaming
│   ├── features/
│   │   ├── settings.spec.ts       # User preferences and settings
│   │   ├── export.spec.ts         # PDF/Word export functionality
│   │   ├── stars.spec.ts          # Message starring system
│   │   ├── tags.spec.ts           # Message tagging system
│   │   └── sessions.spec.ts       # Session management
│   ├── auth/
│   │   ├── authentication.spec.ts # Authentication flows
│   │   └── demo-mode.spec.ts      # Demo mode functionality
│   ├── ui/
│   │   ├── responsive.spec.ts     # Responsive design
│   │   ├── accessibility.spec.ts  # A11y compliance
│   │   └── onboarding.spec.ts     # User onboarding tour
│   └── performance/
│       ├── load-times.spec.ts     # Page load performance
│       └── api-response.spec.ts   # API response times
├── fixtures/
│   ├── test-data.ts               # Test data fixtures
│   └── mock-responses.ts          # API mock responses
├── utils/
│   ├── test-helpers.ts            # Reusable test utilities
│   ├── selectors.ts               # Standardized selectors
│   └── assertions.ts              # Custom assertions
└── setup/
    ├── global-setup.ts            # Global test setup
    └── global-teardown.ts         # Global test cleanup
```

## Selector Standards

### Data Test IDs
Use `data-testid` attributes for reliable element selection:

```typescript
// ✅ Good - Stable selectors
await page.locator('[data-testid="message-input"]')
await page.locator('[data-testid="voice-button"]')
await page.locator('[data-testid="send-button"]')

// ❌ Avoid - Fragile selectors
await page.locator('textarea')
await page.locator('.bg-blue-500')
```

### Onboarding Selectors
Use `data-onboarding` attributes for tour-related elements:

```typescript
await page.locator('[data-onboarding="logo"]')
await page.locator('[data-onboarding="chat-area"]')
await page.locator('[data-onboarding="voice-input"]')
```

### Accessibility Selectors
Prefer accessibility-friendly selectors when available:

```typescript
await page.getByRole('button', { name: 'Send Message' })
await page.getByLabel('Message input')
await page.getByText('Rubber Ducky Live')
```

## Core Test Scenarios

### 1. Chat Functionality Tests

#### Basic Chat Flow
```typescript
test('should handle complete chat conversation', async ({ page }) => {
  // 1. Navigate to app
  await page.goto('/')
  
  // 2. Wait for app to load
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible()
  
  // 3. Type message
  const messageInput = page.locator('[data-testid="message-input"]')
  await messageInput.fill('Hello, can you help me with a coding problem?')
  
  // 4. Send message
  await page.click('[data-testid="send-button"]')
  
  // 5. Verify message appears in chat
  await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Hello, can you help me')
  
  // 6. Wait for AI response
  await expect(page.locator('[data-testid="thinking-indicator"]')).toBeVisible()
  await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({ timeout: 30000 })
  
  // 7. Verify response received
  await expect(page.locator('[data-testid="ai-message"]').last()).not.toBeEmpty()
})
```

#### Message Management
```typescript
test('should handle message starring and tagging', async ({ page }) => {
  // Prerequisites: Have at least one message in conversation
  
  // 1. Star a message
  await page.hover('[data-testid="ai-message"]')
  await page.click('[data-testid="star-button"]')
  await expect(page.locator('[data-testid="star-button"][data-starred="true"]')).toBeVisible()
  
  // 2. Add tag to message
  await page.click('[data-testid="tag-button"]')
  await page.fill('[data-testid="tag-input"]', 'important')
  await page.press('[data-testid="tag-input"]', 'Enter')
  await expect(page.locator('[data-testid="message-tag"]').filter({ hasText: 'important' })).toBeVisible()
  
  // 3. Copy message
  await page.click('[data-testid="copy-button"]')
  // Note: Clipboard testing requires specific setup in Playwright
})
```

### 2. Voice Recognition Tests

#### Voice Input Activation
```typescript
test('should activate voice recognition with quality metrics', async ({ page }) => {
  // Mock microphone permissions
  await page.context().grantPermissions(['microphone'])
  
  // 1. Click voice button
  await page.click('[data-testid="voice-button"]')
  
  // 2. Verify voice UI appears
  await expect(page.locator('[data-testid="voice-status"]')).toBeVisible()
  await expect(page.locator('[data-testid="quality-metrics"]')).toBeVisible()
  
  // 3. Check for quality indicators
  await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible()
  await expect(page.locator('[data-testid="audio-quality"]')).toBeVisible()
  
  // 4. Stop voice recognition
  await page.click('[data-testid="voice-button"]')
  await expect(page.locator('[data-testid="voice-status"]')).not.toBeVisible()
})
```

#### Advanced Voice Features
```typescript
test('should display sentiment analysis and speaker diarization', async ({ page }) => {
  // Prerequisites: Content safety and advanced features enabled in settings
  
  // 1. Navigate to settings and enable features
  await page.goto('/settings')
  await page.check('[data-testid="content-safety-toggle"]')
  await page.check('[data-testid="sentiment-analysis-toggle"]')
  await page.check('[data-testid="speaker-diarization-toggle"]')
  await page.click('[data-testid="save-settings"]')
  
  // 2. Return to chat and start voice recognition
  await page.goto('/')
  await page.click('[data-testid="voice-button"]')
  
  // 3. Verify advanced features are displayed
  await expect(page.locator('[data-testid="sentiment-display"]')).toBeVisible()
  await expect(page.locator('[data-testid="speaker-display"]')).toBeVisible()
  await expect(page.locator('[data-testid="safety-status"]')).toBeVisible()
})
```

### 3. Settings and Preferences Tests

#### Settings Page Navigation
```typescript
test('should access and navigate settings page', async ({ page }) => {
  // 1. Navigate to main page
  await page.goto('/')
  
  // 2. Open sidebar
  await page.click('[data-testid="sidebar-toggle"]')
  
  // 3. Click on user avatar menu
  await page.click('[data-testid="user-avatar"]')
  
  // 4. Click Settings link
  await page.click('[data-testid="settings-link"]')
  
  // 5. Verify settings page loads
  await expect(page).toHaveURL('/settings')
  await expect(page.locator('h1')).toContainText('Settings')
})
```

#### Content Safety Configuration
```typescript
test('should configure content safety settings', async ({ page }) => {
  await page.goto('/settings')
  
  // 1. Expand content safety section
  await page.click('[data-testid="content-safety-header"]')
  
  // 2. Enable content safety
  await page.check('[data-testid="content-safety-enable"]')
  
  // 3. Select safety mode
  await page.click('[data-testid="safety-mode-review"]')
  
  // 4. Set sensitivity level
  await page.click('[data-testid="sensitivity-medium"]')
  
  // 5. Save settings
  await page.click('[data-testid="save-settings"]')
  
  // 6. Verify success message
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

### 4. Export Functionality Tests

#### PDF Export
```typescript
test('should export conversation to PDF', async ({ page }) => {
  // Prerequisites: Have conversation with messages
  
  // 1. Navigate to conversation
  await page.goto('/sessions/test-session-id')
  
  // 2. Open message menu
  await page.hover('[data-testid="ai-message"]')
  await page.click('[data-testid="message-menu"]')
  
  // 3. Click export to PDF
  await page.click('[data-testid="export-pdf"]')
  
  // 4. Handle download or Google Drive options
  await expect(page.locator('[data-testid="export-options"]')).toBeVisible()
  
  // 5. Choose local download
  const downloadPromise = page.waitForDownload()
  await page.click('[data-testid="download-local"]')
  
  // 6. Verify download
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.pdf$/)
})
```

### 5. Onboarding Tour Tests

#### Complete Tour Flow
```typescript
test('should complete onboarding tour for new users', async ({ page }) => {
  // 1. Clear localStorage to simulate new user
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  
  // 2. Wait for tour to start
  await expect(page.locator('[data-testid="onboarding-tooltip"]')).toBeVisible({ timeout: 5000 })
  
  // 3. Progress through all tour steps
  let currentStep = 1
  const totalSteps = 8 // Update based on actual tour steps
  
  while (currentStep <= totalSteps) {
    // Verify current step content
    await expect(page.locator('[data-testid="onboarding-tooltip"]')).toBeVisible()
    
    // Click next or finish
    if (currentStep === totalSteps) {
      await page.click('[data-testid="tour-finish"]')
    } else {
      await page.click('[data-testid="tour-next"]')
    }
    
    currentStep++
  }
  
  // 4. Verify tour completion
  await expect(page.locator('[data-testid="onboarding-tooltip"]')).not.toBeVisible()
  
  // 5. Verify onboarding marked as complete
  const isComplete = await page.evaluate(() => 
    localStorage.getItem('rubber-ducky-onboarding-completed') === 'true'
  )
  expect(isComplete).toBe(true)
})
```

## Performance Testing

### Page Load Performance
```typescript
test('should load main page within performance budget', async ({ page }) => {
  const startTime = Date.now()
  
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  const loadTime = Date.now() - startTime
  
  // Performance assertion: Page should load within 3 seconds
  expect(loadTime).toBeLessThan(3000)
  
  // Check for performance markers
  const navigationTiming = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.navigationStart,
      fullyLoaded: nav.loadEventEnd - nav.navigationStart
    }
  })
  
  expect(navigationTiming.domContentLoaded).toBeLessThan(2000)
})
```

### API Response Performance
```typescript
test('should load agents within performance budget', async ({ page }) => {
  await page.goto('/')
  
  // Monitor API calls
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/api/agents') && response.status() === 200
  )
  
  const response = await responsePromise
  const responseTime = response.timing().responseEnd
  
  // API should respond within 200ms (based on optimized performance)
  expect(responseTime).toBeLessThan(200)
})
```

## Accessibility Testing

### WCAG Compliance
```typescript
test('should meet WCAG 2.1 AA standards', async ({ page }) => {
  await page.goto('/')
  
  // Check for proper heading hierarchy
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
  expect(headings.length).toBeGreaterThan(0)
  
  // Verify interactive elements have proper labels
  const buttons = await page.locator('button').all()
  for (const button of buttons) {
    const ariaLabel = await button.getAttribute('aria-label')
    const text = await button.textContent()
    expect(ariaLabel || text).toBeTruthy()
  }
  
  // Check color contrast (requires axe-core integration)
  // await injectAxe(page)
  // const results = await checkA11y(page)
  // expect(results.violations).toHaveLength(0)
})
```

### Keyboard Navigation
```typescript
test('should support full keyboard navigation', async ({ page }) => {
  await page.goto('/')
  
  // Start from first focusable element
  await page.keyboard.press('Tab')
  
  // Navigate through key elements
  const focusableElements = [
    '[data-testid="message-input"]',
    '[data-testid="voice-button"]',
    '[data-testid="send-button"]',
    '[data-testid="sidebar-toggle"]'
  ]
  
  for (const selector of focusableElements) {
    // Element should be focusable via keyboard
    const element = page.locator(selector)
    await expect(element).toBeFocused()
    await page.keyboard.press('Tab')
  }
})
```

## Mobile and Responsive Testing

### Mobile Viewports
```typescript
test('should work correctly on mobile devices', async ({ page }) => {
  // Test iPhone 12 viewport
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  
  // Mobile-specific elements should be visible
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
  
  // Desktop elements should be hidden
  await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible()
  
  // Touch interactions should work
  await page.tap('[data-testid="message-input"]')
  await expect(page.locator('[data-testid="message-input"]')).toBeFocused()
})
```

## Error Handling Tests

### Network Errors
```typescript
test('should handle network failures gracefully', async ({ page }) => {
  // Simulate offline condition
  await page.context().setOffline(true)
  
  await page.goto('/')
  
  // Try to send a message
  await page.fill('[data-testid="message-input"]', 'Test message')
  await page.click('[data-testid="send-button"]')
  
  // Should show error state
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  
  // Restore connection and retry
  await page.context().setOffline(false)
  await page.click('[data-testid="retry-button"]')
  
  // Should recover and send message
  await expect(page.locator('[data-testid="user-message"]').last()).toBeVisible()
})
```

## Test Data Management

### Fixtures and Mock Data
```typescript
// tests/fixtures/test-data.ts
export const testConversation = {
  id: 'test-session-123',
  title: 'Test Conversation',
  messages: [
    {
      id: 'msg-1',
      content: 'Hello, this is a test message',
      role: 'user',
      timestamp: new Date().toISOString()
    },
    {
      id: 'msg-2', 
      content: 'Hello! I\'m here to help you with any questions.',
      role: 'assistant',
      timestamp: new Date().toISOString()
    }
  ]
}
```

## Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npm run test:e2e
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

## Best Practices Summary

1. **Stable Selectors**: Use `data-testid` attributes for reliable element selection
2. **User-Centric Tests**: Write tests that reflect real user workflows
3. **Performance Awareness**: Include performance assertions in tests
4. **Accessibility First**: Ensure all interactive elements are accessible
5. **Error Scenarios**: Test error conditions and recovery paths
6. **Cross-Browser Testing**: Run tests across multiple browsers and devices
7. **Documentation**: Keep test documentation up-to-date with features
8. **Maintenance**: Regularly review and update tests as features evolve

## Reporting and Debugging

### Test Reports
- HTML reports generated in `playwright-report/`
- Screenshots captured on failures
- Video recordings for failed tests
- Trace files for detailed debugging

### Debugging Failed Tests
```bash
# Run specific test in debug mode
npx playwright test auth.spec.ts --debug

# Run with headed browser to see actions
npx playwright test --headed

# Generate trace for debugging
npx playwright test --trace on
```

This comprehensive testing guide ensures consistent, reliable, and maintainable test coverage across all features of Rubber Ducky Live.