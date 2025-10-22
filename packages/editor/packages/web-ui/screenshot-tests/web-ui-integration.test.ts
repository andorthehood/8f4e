import { test, expect } from '@playwright/test';

test.describe('Web-UI Screenshot Tests', () => {
	test('should display web-ui canvas renderer', async ({ page }) => {
		// Navigate to the test page
		await page.goto('http://localhost:3001/test-page.html');

		// Wait for the canvas to be present
		await page.waitForSelector('#test-canvas');

		// Wait for web-ui initialization to complete
		await page.waitForTimeout(2000);

		// Take a screenshot
		await expect(page).toHaveScreenshot('web-ui-canvas.png');
	});
});
