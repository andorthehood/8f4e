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
	external: [
		'@8f4e/language-spec',
		'@8f4e/project-preparser',
		'@8f4e/sprite-generator',
		'@8f4e/state-manager',
		'@8f4e/tokenizer',
	],
});

export default defineConfig({
	...baseConfig,
	build: {
		...baseConfig.build,
		lib: {
			// Keep the synchronous public export without folding the lazy formatter into index.js.
			entry: {
				index: './src/index.ts',
				serializeTo8f4e: './src/features/project-export/serializeTo8f4e.ts',
			},
			formats: ['es'],
			fileName: (_format, entryName) => `${entryName}.js`,
		},
	},
	resolve: {
		alias: {
			'~': resolve(__dirname, './src'),
		},
	},
});
