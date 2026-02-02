import { builtinModules } from 'module';
import path from 'path';

import { defineConfig } from 'vite';

const nodeBuiltins = [...builtinModules, ...builtinModules.map(mod => `node:${mod}`)];

export default defineConfig({
	build: {
		emptyOutDir: true,
		outDir: 'dist',
		target: 'node22',
		lib: {
			entry: {
				cli: path.resolve(__dirname, 'src/cli.ts'),
				index: path.resolve(__dirname, 'src/index.ts'),
			},
			formats: ['es'],
			fileName: (_format, name) => `${name}.js`,
		},
		rollupOptions: {
			external: [...nodeBuiltins],
		},
	},
});
