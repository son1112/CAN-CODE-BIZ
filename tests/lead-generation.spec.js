const { test, expect } = require('@playwright/test');

test.describe('Lead Generation System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display early access form on page load', async ({ page }) => {
    const form = page.locator('#early-access-form');
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    await expect(form).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Get Early Access');
  });

  test('should require valid email format', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    await emailInput.fill('invalid-email');
    await submitButton.click();
    
    const validationMessage = await emailInput.evaluate(el => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should show loading state during submission', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    const btnText = page.locator('.btn-text');
    const btnLoading = page.locator('.btn-loading');
    
    await emailInput.fill('test@example.com');
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      setTimeout(() => route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true, next: '/thanks' })
      }), 1000);
    });
    
    await submitButton.click();
    
    await expect(btnText).toBeHidden();
    await expect(btnLoading).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test('should handle successful form submission', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true, next: '/thanks' })
      });
    });
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await expect(page.locator('#subscription-success')).toBeVisible();
    await expect(page.locator('#subscription-container')).toBeHidden();
    
    const toolkitSection = page.locator('#agents');
    await expect(toolkitSection).toBeVisible();
  });

  test('should handle Formspree API failure with mailto fallback', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    let mailtoOpened = false;
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });
    
    page.on('popup', popup => {
      mailtoOpened = popup.url().startsWith('mailto:');
    });
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    expect(mailtoOpened).toBe(true);
    
    await expect(page.locator('#subscription-success')).toBeVisible();
  });
});