const { test, expect } = require('@playwright/test');

test.describe('localStorage Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should persist subscription status across page reloads', async ({ page }) => {
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
    
    const storageValue = await page.evaluate(() => 
      localStorage.getItem('cancode-early-access')
    );
    expect(storageValue).toBe('true');
    
    await page.reload();
    
    await expect(page.locator('#subscription-success')).toBeVisible();
    await expect(page.locator('#subscription-container')).toBeHidden();
    await expect(page.locator('#agents')).toBeVisible();
  });

  test('should show form when no subscription in localStorage', async ({ page }) => {
    await expect(page.locator('#subscription-container')).toBeVisible();
    await expect(page.locator('#subscription-success')).toBeHidden();
    await expect(page.locator('#agents')).toBeHidden();
  });

  test('should handle success URL hash parameter', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html#early-access-success');
    
    await expect(page.locator('#subscription-success')).toBeVisible();
    await expect(page.locator('#subscription-container')).toBeHidden();
    await expect(page.locator('#agents')).toBeVisible();
    
    const storageValue = await page.evaluate(() => 
      localStorage.getItem('cancode-early-access')
    );
    expect(storageValue).toBe('true');
  });

  test('should clear subscription state when localStorage is manually cleared', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('cancode-early-access', 'true'));
    await page.reload();
    
    await expect(page.locator('#subscription-success')).toBeVisible();
    
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    await expect(page.locator('#subscription-container')).toBeVisible();
    await expect(page.locator('#subscription-success')).toBeHidden();
    await expect(page.locator('#agents')).toBeHidden();
  });
});