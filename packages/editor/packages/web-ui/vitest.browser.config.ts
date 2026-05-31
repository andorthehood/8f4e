import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		browser: {
			provider: playwright(),
			enabled: true,
			headless: true,
			instances: [{ browser: 'chromium', viewport: { width: 1024, height: 768 } }],
		},
	},
});
