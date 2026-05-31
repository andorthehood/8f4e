import { createLibConfig } from '@8f4e/config/vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const baseConfig = createLibConfig({
	entry: './src/index.ts',
	outDir: 'dist',
	formats: ['es'],
	fileName: () => 'index.js',
	emptyOutDir: false,
	external: ['@8f4e/compiler-spec', '@8f4e/sprite-generator', '@8f4e/state-manager', '@8f4e/tokenizer', 'glugglug'],
});

export default defineConfig({
	...baseConfig,
	resolve: {
		alias: {
			'~': resolve(__dirname, './src'),
		},
	},
});
