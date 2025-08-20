import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: 'src/index.ts',
			formats: ['iife'],
			name: 'AudioWorkletRuntime',
			fileName: 'index'
		},
		rollupOptions: {
			output: {
				entryFileNames: 'index.js'
			}
		},
		sourcemap: false,
		outDir: 'dist'
	}
});