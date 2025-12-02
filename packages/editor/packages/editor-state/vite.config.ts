import { defineConfig } from 'vite';
import { createLibConfig } from '@8f4e/config/vite';

const baseConfig = createLibConfig({
	entry: './src/index.ts',
	outDir: 'dist',
	formats: ['es'],
	fileName: () => 'index.js',
	emptyOutDir: false,
});

export default defineConfig({
	...baseConfig,
	define: {
		...(baseConfig as { define?: Record<string, unknown> }).define,
		'import.meta.vitest': 'undefined',
	},
});
