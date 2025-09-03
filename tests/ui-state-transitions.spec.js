const { test, expect } = require('@playwright/test');

test.describe('UI State Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should transition from form to success state smoothly', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    const formContainer = page.locator('#subscription-container');
    const successContainer = page.locator('#subscription-success');
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true, next: '/thanks' })
      });
    });
    
    await expect(formContainer).toBeVisible();
    await expect(successContainer).toBeHidden();
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await expect(formContainer).toBeHidden();
    await expect(successContainer).toBeVisible();
    
    const welcomeMessage = successContainer.locator('h3');
    await expect(welcomeMessage).toContainText('Welcome to the Early Access Community!');
  });

  test('should reveal toolkit with smooth scroll animation', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    const toolkitSection = page.locator('#agents');
    const exploreButton = page.locator('button:has-text("Explore Toolkit Below")');
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true, next: '/thanks' })
      });
    });
    
    await expect(toolkitSection).toBeHidden();
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await page.waitForTimeout(1100);
    await expect(toolkitSection).toBeVisible();
    
    await exploreButton.click();
    
    const toolkitPosition = await toolkitSection.boundingBox();
    expect(toolkitPosition).toBeTruthy();
  });

  test('should maintain proper visual states during form interaction', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
    
    await emailInput.fill('test@example.com');
    const inputValue = await emailInput.inputValue();
    expect(inputValue).toBe('test@example.com');
    
    await expect(submitButton).toBeEnabled();
    await expect(submitButton.locator('.btn-text')).toBeVisible();
    await expect(submitButton.locator('.btn-loading')).toBeHidden();
  });

  test('should handle multiple rapid form submissions gracefully', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    let requestCount = 0;
    await page.route('https://formspree.io/f/mandqdze', route => {
      requestCount++;
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ ok: true, next: '/thanks' })
        });
      }, 500);
    });
    
    await emailInput.fill('test@example.com');
    
    await submitButton.click();
    await submitButton.click();
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    expect(requestCount).toBe(1);
    await expect(page.locator('#subscription-success')).toBeVisible();
  });

  test('should reset button state after successful submission', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    const btnText = submitButton.locator('.btn-text');
    const btnLoading = submitButton.locator('.btn-loading');
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true, next: '/thanks' })
      });
    });
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await page.waitForTimeout(500);
    
    await expect(btnText).toBeVisible();
    await expect(btnLoading).toBeHidden();
    await expect(submitButton).toBeEnabled();
  });
});