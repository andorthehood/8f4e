import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';
import { createLibConfig } from '@8f4e/config/vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const baseConfig = createLibConfig({
	entry: './src/index.ts',
	outDir: 'dist',
	formats: ['es'],
	fileName: () => 'index.js',
	emptyOutDir: false,
});

export default defineConfig({
	...baseConfig,
	resolve: {
		...(baseConfig as { resolve?: unknown }).resolve,
		alias: {
			...(baseConfig as { resolve?: { alias?: Record<string, string> } }).resolve?.alias,
			'~': resolve(__dirname, './src'),
		},
	},
	define: {
		...(baseConfig as { define?: Record<string, unknown> }).define,
		'import.meta.vitest': 'undefined',
	},
});
