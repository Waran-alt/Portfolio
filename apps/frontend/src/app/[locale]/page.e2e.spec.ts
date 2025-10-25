import { expect, test } from '@playwright/test';

test.describe('LandingPage E2E', () => {
  test('renders landing with rotating cube', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('landing-root')).toBeVisible();
    await expect(page.getByTestId('cube-wrapper')).toBeVisible();
    await expect(page.getByTestId('cube')).toBeVisible();
  });
});


