import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	test: {
		globals: true,
		browser: {
			enabled: true,
			instances: [
				{
					browser: 'chromium',
				},
			],
			provider: playwright({
				launchOptions: {
					headless: true,
					args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
				},
			}),
			screenshotFailures: false,
		},
		testTimeout: 30000,
		hookTimeout: 10000,
		reporters: ['default'],
		include: ['screenshot-tests/minimal.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**', 'src/**'],
	},
	root: __dirname,
	resolve: {
		alias: {
			'@8f4e/web-ui': resolve(__dirname, './dist'),
		},
	},
});
