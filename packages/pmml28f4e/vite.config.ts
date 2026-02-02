import { builtinModules } from 'module';
import path from 'path';

import { defineConfig } from 'vite';

const nodeBuiltins = [...builtinModules, ...builtinModules.map(mod => `node:${mod}`)];

export default defineConfig({
	build: {
		target: 'node22',
		outDir: 'dist',
		emptyOutDir: false,
		lib: {
			entry: {
				cli: path.resolve(__dirname, 'src/cli.ts'),
				index: path.resolve(__dirname, 'src/index.ts'),
			},
			formats: ['es'],
			fileName: (_format, entryName) => `${entryName}.js`,
		},
		rollupOptions: {
			external: [...nodeBuiltins, '@8f4e/editor-state'],
			output: {
				banner: chunk => (chunk.name === 'cli' ? '#!/usr/bin/env node' : undefined),
			},
		},
	},
});
