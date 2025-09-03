const { test, expect } = require('@playwright/test');

test.describe('Error Handling & Fallbacks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    let mailtoTriggered = false;
    await page.route('**/anderson.reinkordt@gmail.com*', route => {
      mailtoTriggered = true;
      route.abort();
    });
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.abort('failed');
    });
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    expect(mailtoTriggered).toBe(true);
    await expect(page.locator('#subscription-success')).toBeVisible();
  });

  test('should handle Formspree 500 error with mailto fallback', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    let mailtoTriggered = false;
    await page.route('**/anderson.reinkordt@gmail.com*', route => {
      mailtoTriggered = true;
      route.abort();
    });
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    expect(mailtoTriggered).toBe(true);
    await expect(page.locator('#subscription-success')).toBeVisible();
  });

  test('should handle Formspree 400 error with mailto fallback', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    let mailtoTriggered = false;
    await page.route('**/anderson.reinkordt@gmail.com*', route => {
      mailtoTriggered = true;
      route.abort();
    });
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Bad Request' })
      });
    });
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    expect(mailtoTriggered).toBe(true);
    await expect(page.locator('#subscription-success')).toBeVisible();
  });

  test('should preserve localStorage after network errors', async ({ page }) => {
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.abort('failed');
    });
    
    await emailInput.fill('test@example.com');
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    const storageValue = await page.evaluate(() => 
      localStorage.getItem('cancode-early-access')
    );
    expect(storageValue).toBe('true');
    
    await page.reload();
    await expect(page.locator('#subscription-success')).toBeVisible();
  });

  test('should handle missing DOM elements gracefully', async ({ page }) => {
    await page.evaluate(() => {
      document.getElementById('subscription-success').remove();
    });
    
    const emailInput = page.locator('#email');
    const submitButton = page.locator('.subscription-btn');
    
    await page.route('https://formspree.io/f/mandqdze', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true, next: '/thanks' })
      });
    });
    
    await emailInput.fill('test@example.com');
    
    let errorCaught = false;
    page.on('pageerror', error => {
      errorCaught = true;
    });
    
    await submitButton.click();
    await page.waitForTimeout(1000);
    
    expect(errorCaught).toBe(false);
  });
});