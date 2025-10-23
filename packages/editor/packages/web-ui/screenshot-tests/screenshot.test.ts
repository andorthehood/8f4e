import { test, expect } from '@playwright/test';

const testCases = ['font-color-rendering', 'dragged-module', 'context-menu'];

test.describe('Web-UI Screenshot Tests', () => {
	for (const testCase of testCases) {
		test(`should display web-ui canvas renderer for ${testCase}`, async ({ page }) => {
			await page.goto(`http://localhost:3001/test-cases/${testCase}.html`);
			await page.waitForSelector('#test-canvas');
			await page.waitForTimeout(2000);
			await expect(page).toHaveScreenshot(`${testCase}.png`);
		});
	}
});
