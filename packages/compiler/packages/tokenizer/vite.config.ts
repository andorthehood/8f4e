import { defineConfig } from 'vite';
import { createLibConfig } from '@8f4e/config/vite';

const baseConfig = createLibConfig({
	entry: './src/index.ts',
	outDir: 'dist',
	formats: ['es'],
	fileName: () => 'index.js',
	external: ['@8f4e/compiler-spec'],
});

export default defineConfig({
	...baseConfig,
	build: {
		...baseConfig.build,
		emptyOutDir: false,
	},
});
