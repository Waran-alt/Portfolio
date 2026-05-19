import { expect, test } from '@playwright/test';

/**
 * Visual capture for WebKit (Safari engine) and iPhone emulation.
 * Run: NGINX_URL=http://127.0.0.1:3001 yarn playwright test page.safari-visual --project=webkit --project="Mobile Safari"
 */
test.describe('Safari visual — portfolio hero', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en', { waitUntil: 'networkidle' });
    const hero = page.getByTestId('portfolio-hero');
    await expect(hero).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(2500);
  });

  test('face 0 — capture screenshots', async ({ page }, testInfo) => {
    const hero = page.getByTestId('portfolio-hero');
    const card = page.locator('[class*="flipInner"]').first();

    const fullPath = testInfo.outputPath('viewport.png');
    const heroPath = testInfo.outputPath('hero.png');
    const cardPath = testInfo.outputPath('card.png');

    await page.screenshot({ path: fullPath, animations: 'disabled' });
    await hero.screenshot({ path: heroPath, animations: 'disabled' });
    if (await card.isVisible()) {
      await card.screenshot({ path: cardPath, animations: 'disabled' });
    }

    await testInfo.attach('viewport', { path: fullPath, contentType: 'image/png' });
    await testInfo.attach('hero', { path: heroPath, contentType: 'image/png' });
    if (await card.isVisible()) {
      await testInfo.attach('card', { path: cardPath, contentType: 'image/png' });
    }

    await expect(hero).toBeVisible();
  });
});
