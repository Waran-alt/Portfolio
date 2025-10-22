import { expect, test } from '@playwright/test';

test.describe('HomePage E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders heading and content, overlay and animations present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /portfolio/i })).toBeVisible();
    await expect(page.getByText(/Multiple animations running in parallel/i)).toBeVisible();

    // Overlay menu should be mounted (uses ClientOnly)
    // Avoid brittle selectors; presence of settings/controls button indicates overlay
    await expect(page.getByRole('button', { name: /settings|menu/i })).toBeVisible();

    // Background and content classes present
    await expect(page.locator('.HomePage-background')).toBeVisible();
    await expect(page.locator('.HomePage-content')).toBeVisible();
  });
});


