import { expect, test } from '@playwright/test';

test('renders compact sprite instances consistently', async ({ page }) => {
	const pageErrors: string[] = [];
	page.on('pageerror', error => pageErrors.push(error.message));

	await page.goto('http://localhost:3003/test-cases/rendering.html');
	await page.waitForFunction(() => document.body.dataset.ready === 'true');

	expect(pageErrors).toEqual([]);
	await expect(page.locator('#output')).toHaveScreenshot('rendering.png');
});
