import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: './src/index.ts',
			name: 'RuntimeMainThreadLogic',
			formats: ['umd'],
			fileName: () => 'runtime-main-thread-logic.js',
		},
		outDir: 'bundle',
		rollupOptions: {
			external: [],
			output: {
				globals: {},
			},
		},
		minify: true,
		sourcemap: true,
		target: 'es2020',
	},
});
