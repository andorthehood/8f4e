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
		viewport: { width: 160, height: 96 },
	},
	expect: {
		toHaveScreenshot: {
			threshold: 0.2,
			maxDiffPixels: 0,
		},
	},
	webServer: {
		command: 'npx nx run glugglug2:dev:test',
		port: 3003,
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
