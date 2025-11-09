import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './screenshot-tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'list',
	use: {
		trace: 'on-first-retry',
		viewport: { width: 1024, height: 768 },
	},
	expect: {
		// Configure screenshot comparison
		toHaveScreenshot: {
			// Use a single snapshots directory
			threshold: 0.2,
			maxDiffPixels: 0,
		},
	},
	snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
	// Configure web server for testing
	webServer: {
		command: 'npm run dev:test',
		port: 3001,
		reuseExistingServer: !process.env.CI,
		stdout: 'pipe',
		stderr: 'pipe',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				channel: 'chrome',
			},
		},
	],
});
