import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Intercept the shell's remote — we are testing the checkout MFE in isolation
  await page.route('**/shell/remoteEntry.js', (route) => route.abort());
});

test('shipping form navigates to payment on submit', async ({ page }) => {
  // Boot only the checkout-mfe dev server (localhost:3003)
  await page.goto('http://localhost:3003/checkout/shipping');
  await page.fill('[data-testid="street"]', '123 Main St');
  await page.click('[data-testid="next"]');
  await expect(page).toHaveURL(/\/checkout\/payment/);
});

test('confirm page fires mfe:checkout:complete event', async ({ page }) => {
  await page.goto('http://localhost:3003/checkout/confirm');
  
  let eventFired = false;
  page.on('console', (msg) => {
    if (msg.text().includes('mfe:checkout:complete')) {
      eventFired = true;
    }
  });

  await page.click('[data-testid="place-order"]');
  expect(eventFired).toBe(true);
});
