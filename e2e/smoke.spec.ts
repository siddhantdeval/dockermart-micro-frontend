import { test, expect } from '@playwright/test';

test('full system smoke test - verify critical path', async ({ page }) => {
  // 1. Open http://localhost:3000
  await page.goto('http://localhost:3000');
  
  // Wait for authenticating loader to resolve
  await page.waitForSelector('text=Authenticating…', { state: 'detached' });

  // 2. Navigate to /catalog — assert a product card is visible
  await page.goto('http://localhost:3000/catalog');
  await expect(page.locator('text=Add to Cart').first()).toBeVisible();

  // 3. Click "Add to Cart" — assert the cart widget in the nav updates its count
  await page.locator('text=Add to Cart').first().click();
  await expect(page.locator('text=Items: 1')).toBeVisible();

  // 4. Navigate to /checkout/cart — assert the cart item is present
  await page.goto('http://localhost:3000/checkout/cart');
  await expect(page.locator('text=Checkout Remote Panel')).toBeVisible();
  await expect(page.locator('text=Cart Items: 1')).toBeVisible();

  // 5. Navigate to /account — assert the authenticated user's name is displayed
  await page.goto('http://localhost:3000/account');
  await expect(page.locator('text=Alice')).toBeVisible();
});
