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
	external: ['@8f4e/tokenizer', '@8f4e/compiler-symbols'],
});

export default defineConfig({
	...baseConfig,
	build: {
		...baseConfig.build,
		lib: {
			...baseConfig.build?.lib,
			entry: resolve(__dirname, './src/index.ts'),
			fileName: () => 'index.js',
		},
	},
});
