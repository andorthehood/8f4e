import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	root: currentDirectory,
	server: {
		port: 3003,
		host: 'localhost',
		open: false,
	},
	esbuild: {
		target: 'esnext',
	},
	resolve: {
		alias: {
			glugglug2: resolve(currentDirectory, '../dist'),
		},
	},
});
