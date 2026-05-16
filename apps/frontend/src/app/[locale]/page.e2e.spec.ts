import { expect, test } from '@playwright/test';

test.describe('Home page E2E', () => {
  test('renders portfolio hero shell', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });

    const hero = page.getByTestId('portfolio-hero');
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute('data-portfolio-home');
  });
});
