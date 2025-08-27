import { resolve } from 'path';

import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: 'dist/bundle',
		emptyOutDir: true,
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'EightF4EEditor',
			fileName: () => '8f4e-editor.js',
			formats: ['umd'],
		},
		rollupOptions: {
			// Bundle all dependencies - no externals for standalone use
			external: [],
			output: {
				// Global variable name for UMD
				globals: {},
				// Inline all dynamic imports
				inlineDynamicImports: true,
				// Single chunk output
				manualChunks: undefined,
			},
		},
		// ES2020 target for broad compatibility
		target: 'es2020',
		sourcemap: true,
		minify: true,
	},
	resolve: {
		// Resolve workspace dependencies
		alias: {
			'@8f4e/2d-engine': resolve(__dirname, '../2d-engine/dist'),
			'@8f4e/compiler': resolve(__dirname, '../compiler/dist'),
			'@8f4e/sprite-generator': resolve(__dirname, '../sprite-generator/dist'),
		},
	},
});
