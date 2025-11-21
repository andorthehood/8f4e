import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: './src/index.ts',
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
});
