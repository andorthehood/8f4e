import { resolve } from 'path';

import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'Editor8f4e',
			formats: ['umd'],
			fileName: () => 'editor-bundle.js',
		},
		outDir: 'bundle',
		rollupOptions: {
			// Bundle all dependencies for standalone use
			external: [],
			output: {
				// Global variable name when loaded via script tag
				globals: {},
			},
		},
		minify: true,
		sourcemap: true,
		target: 'es2020',
	},
	resolve: {
		alias: {
			// Resolve workspace dependencies to their built versions
			'@8f4e/2d-engine': resolve(__dirname, '../2d-engine/dist'),
			'@8f4e/compiler': resolve(__dirname, '../compiler/dist'),
			'@8f4e/sprite-generator': resolve(__dirname, '../sprite-generator/dist'),
		},
	},
});
