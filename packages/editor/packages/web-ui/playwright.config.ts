import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './screenshot-tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'list',
	use: {
		trace: 'on-first-retry',
	},
	expect: {
		// Configure screenshot comparison
		toHaveScreenshot: {
			// Use a single snapshots directory
			threshold: 0.2,
			maxDiffPixels: 0,
		},
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
