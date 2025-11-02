import { test, expect } from '@playwright/test';

const testCases = ['sprite-sheet-with-6x10-font', 'sprite-sheet-with-8x16-font'];

test.describe('Sprite Generator Screenshot Tests', () => {
	for (const testCase of testCases) {
		test(`should display sprite generator for ${testCase}`, async ({ page }) => {
			await page.goto(`http://localhost:3002/test-cases/${testCase}.html`);
			await page.waitForSelector('#test-canvas');
			await page.waitForTimeout(2000);
			await expect(page).toHaveScreenshot(`${testCase}.png`);
		});
	}
});
