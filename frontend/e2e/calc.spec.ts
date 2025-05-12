import { test as base, expect } from '@playwright/test';
import { setupMockServer } from './mocks/setup';

const test = base.extend({
  context: async ({ context }, use) => {
    await setupMockServer(context);
    await use(context);
  },
});

test.describe('Compensation Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('calculates compensation successfully', async ({ page }) => {
    // Fill in the form
    await page.fill('input[id="employee-id"]', '123');
    await page.fill('input[id="revenue"]', '1000000');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for result card
    await expect(page.locator('text=Compensation Breakdown')).toBeVisible();

    // Check all values are displayed
    await expect(page.locator('text=$100,000')).toBeVisible(); // Base
    await expect(page.locator('text=$30,000')).toBeVisible(); // Bonus
    await expect(page.locator('text=$20,000')).toBeVisible(); // Adjustments

    // Check chart tabs work
    await page.click('button:text("Bar")');
    await expect(page.locator('tspan:has-text("Total")')).toBeVisible();

    await page.click('button:text("Pie")');
    await expect(page.locator('text=Base')).toBeVisible();
  });

  test('handles qualitative scores', async ({ page }) => {
    // Add a new score
    await page.click('button:text("Add Score")');

    // Should now have 3 metric inputs
    await expect(page.locator('input[placeholder="Metric"]')).toHaveCount(3);

    // Remove the last score
    await page.click('button:text("-"):last-of-type');

    // Should be back to 2 metric inputs
    await expect(page.locator('input[placeholder="Metric"]')).toHaveCount(2);
  });

  test('validates required fields', async ({ page }) => {
    // Try to submit without data
    await page.click('button[type="submit"]');

    // Form should not submit (result card should not appear)
    await expect(page.locator('text=Compensation Breakdown')).not.toBeVisible();
  });

  test('displays breaches when present', async ({ page }) => {
    // Fill in values that will trigger breaches
    await page.fill('input[id="employee-id"]', '123');
    await page.fill('input[id="revenue"]', '10000000'); // High revenue to trigger breach

    // Set qualitative scores to max
    const sliders = await page.locator('input[type="range"]').all();
    for (const slider of sliders) {
      await slider.fill('100');
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Check for breach warnings
    await expect(page.locator('text=Breaches')).toBeVisible();
    await expect(page.locator('text=Exceeds maximum bonus')).toBeVisible();
  });
});
