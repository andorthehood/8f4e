import { test, expect } from '@playwright/test';

test.describe('Web-UI Screenshot Tests', () => {
	test('should display hello world text', async ({ page }) => {
		// Create a simple HTML page with hello world text
		await page.setContent(`
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body {
						margin: 0;
						padding: 20px;
						font-family: Arial, sans-serif;
						background: #f0f0f0;
					}
					h1 {
						color: #333;
						text-align: center;
						margin-top: 100px;
					}
				</style>
			</head>
			<body>
				<h1>Hello World!</h1>
			</body>
			</html>
		`);

		// Take a screenshot
		await expect(page).toHaveScreenshot('hello-world.png');
	});
});
