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
	external: ['@8f4e/compiler', '@8f4e/sprite-generator', '@8f4e/state-manager', 'glugglug'],
});

export default defineConfig({
	...baseConfig,
	build: {
		...baseConfig.build,
		lib: {
			...baseConfig.build?.lib,
			entry: {
				index: resolve(__dirname, './src/index.ts'),
				testing: resolve(__dirname, './src/testing.ts'),
			},
			fileName: (_format, entryName) => `${entryName}.js`,
		},
	},
	resolve: {
		alias: {
			'~': resolve(__dirname, './src'),
		},
	},
	define: {
		...(baseConfig as { define?: Record<string, unknown> }).define,
		'import.meta.vitest': 'undefined',
	},
});
