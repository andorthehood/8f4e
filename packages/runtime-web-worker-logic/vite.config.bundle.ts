import { resolve } from 'path';

import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: 'dist/bundle',
		emptyOutDir: true,
		lib: {
			entry: resolve(__dirname, 'src/bundle-entry.ts'), // Use a custom entry point
			name: 'EightF4ELogicRuntime',
			fileName: () => '8f4e-logic-runtime.js',
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
});
