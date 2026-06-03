import { builtinModules } from 'module';
import path from 'path';

import { defineConfig } from 'vite';

const nodeBuiltins = [...builtinModules, ...builtinModules.map(mod => `node:${mod}`)];

export default defineConfig({
	build: {
		emptyOutDir: true,
		lib: {
			entry: path.resolve(__dirname, 'src/extension.ts'),
			formats: ['cjs'],
			fileName: () => 'extension.cjs',
		},
		outDir: 'dist',
		rollupOptions: {
			external: ['vscode', ...nodeBuiltins],
		},
		sourcemap: true,
		target: 'node22',
	},
});
