import { test, expect } from '@playwright/test';

test.describe('Web-UI Screenshot Tests', () => {
	test('should display web-ui canvas renderer', async ({ page }) => {
		await page.goto('http://localhost:3001');
		await page.waitForSelector('#test-canvas');
		await page.waitForTimeout(2000);
		await expect(page).toHaveScreenshot('font-color-rendering.png');
	});
});
