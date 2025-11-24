import { defineConfig, mergeConfig } from 'vitest/config';

import { vitestPreset } from '../../../../vitest.preset';

/**
 * Vitest configuration for visual regression tests in web-ui
 *
 * This demonstrates using Vitest browser mode as a replacement for
 * Playwright-based screenshot testing.
 */
export default mergeConfig(
	vitestPreset,
	defineConfig({
		test: {
			// Browser mode configuration for visual regression tests
			browser: {
				enabled: true,
				name: 'chromium',
				provider: 'playwright',
				// Headless mode for CI/local runs
				headless: true,
				// Screenshot configuration
				screenshotFailures: true,
			},
			// Only include visual test files
			include: ['vitest-visual-tests/**/*.visual.test.ts'],
			exclude: ['**/node_modules/**', '**/dist/**', 'screenshot-tests/**'],
		},
	})
);
