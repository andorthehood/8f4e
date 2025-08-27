import path from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			formats: ['es'],
			fileName: () => 'index.js', // single output file
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
				manualChunks: undefined,
			},
			external: [], // inline your own deps
		},
		sourcemap: true,
		minify: true,
	},
});
